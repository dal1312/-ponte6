from __future__ import annotations

import argparse
import csv
import json
import re
import unicodedata
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from PIL import Image, ImageOps


DEFAULT_HASH = "f6c9502ec497bb4731cf5a256bf52d0c"
DEFAULT_LANG = "it"

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
IMAGE_DIR = ROOT / "assets" / "menu-images"
MENU_DATA_JS = ROOT / "js" / "menu-data.js"
BEVERAGE_DATA_JSON = DATA_DIR / "beverages.json"

CATEGORY_MAP = {
    "Antipasti": "antipasti",
    "Primi Piatti": "primi",
    "Secondi Piatti": "secondi",
    "Contorni": "contorni",
    "Pizze": "pizze",
    "Dessert": "dessert",
}

ALLERGEN_REFERENCES = {
    "Glutine": 1,
    "Crostacei": 2,
    "Uova": 3,
    "Pesce": 4,
    "Arachidi": 5,
    "Soia": 6,
    "Latte": 7,
    "Frutta a guscio": 8,
    "Sedano": 9,
    "Senape": 10,
    "Sesamo": 11,
    "Solfiti": 12,
    "Lupini": 13,
    "Molluschi": 14,
}

ALLERGEN_ALIASES = {
    "cereali": "Glutine",
    "cereali contenenti glutine": "Glutine",
    "glutine": "Glutine",
    "crostacei": "Crostacei",
    "uova": "Uova",
    "uova e derivati": "Uova",
    "pesce": "Pesce",
    "arachidi": "Arachidi",
    "soia": "Soia",
    "latte": "Latte",
    "latte e derivati": "Latte",
    "frutta a guscio": "Frutta a guscio",
    "sedano": "Sedano",
    "senape": "Senape",
    "sesamo": "Sesamo",
    "solfiti": "Solfiti",
    "anidride solforosa e solfiti": "Solfiti",
    "lupini": "Lupini",
    "molluschi": "Molluschi",
}

ALLERGEN_PATTERNS = {
    "Glutine": r"\b(farina|pane|piadina|pasta fresca|tagliatell|cappellet|tortell|strozzapret|crostin|focaccia|orzo|birra)\w*",
    "Crostacei": r"\b(gamber|mazzancoll|scamp|granch|aragost|crostace)\w*",
    "Uova": r"\b(uov|maionese|pasta fresca all.?uovo)\w*",
    "Pesce": r"\b(accii?ugh|baccala|baccalà|tonn|salmone|pesce|sardin|sgombr)\w*",
    "Arachidi": r"\b(arachid)\w*",
    "Soia": r"\b(soia|tofu|edamame)\w*",
    "Latte": r"\b(latte|fiordilatte|fior di latte|mozzarella|burrata|grana|parmigian|pecorin|formaggi?|gorgonzola|scamorza|ricotta|squacquerone|burro|panna|mascarpone)\w*",
    "Frutta a guscio": r"\b(mandorl|nocciol|noci|noce|pistacch|anacard|pecan)\w*",
    "Sedano": r"\b(sedano)\w*",
    "Senape": r"\b(senape)\w*",
    "Sesamo": r"\b(sesamo|tahina)\w*",
    "Solfiti": r"\b(solfit|anidride solforosa)\w*",
    "Lupini": r"\b(lupin)\w*",
    "Molluschi": r"\b(cozz|vongol|seppi|polpo|calamar|totan|mollusc)\w*",
}


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)


def clean_html(value: str | None) -> str:
    if not value:
        return ""
    parser = TextExtractor()
    parser.feed(value)
    text = " ".join(parser.parts)
    return unescape(re.sub(r"\s+", " ", text)).strip()


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value.casefold())
    return "".join(char for char in normalized if not unicodedata.combining(char))


def canonical_allergen(value: str) -> str | None:
    return ALLERGEN_ALIASES.get(normalize_text(value).strip())


def ordered_allergens(values: set[str]) -> list[str]:
    return sorted(values, key=lambda name: ALLERGEN_REFERENCES[name])


def infer_allergens(
    category: str,
    name: str,
    description: str,
    ingredients: str,
) -> list[str]:
    text = normalize_text(" ".join((name, description, ingredients)))
    inferred = {
        allergen
        for allergen, pattern in ALLERGEN_PATTERNS.items()
        if re.search(pattern, text, flags=re.IGNORECASE)
    }

    # Regole di categoria applicate solo dove l'ingrediente caratteristico è
    # parte della definizione del prodotto. Restano deduzioni, non conferme.
    if category == "pizze":
        inferred.add("Glutine")
    if category == "birre":
        inferred.add("Glutine")
    if category in {"vini_bianchi", "vini_rossi"}:
        inferred.add("Solfiti")

    return ordered_allergens(inferred)


def enrich_allergens(
    category: str,
    name: str,
    description: str,
    ingredients: str,
    declared: list[str],
    declared_source: str,
) -> dict[str, Any]:
    confirmed = {
        canonical
        for value in declared
        if (canonical := canonical_allergen(value))
    }
    inferred = set(infer_allergens(category, name, description, ingredients)) - confirmed
    confirmed_list = ordered_allergens(confirmed)
    inferred_list = ordered_allergens(inferred)
    combined = ordered_allergens(confirmed | inferred)

    sources = []
    if confirmed_list:
        sources.append(declared_source or "dato dichiarato")
    if inferred_list:
        sources.append("deduzione automatica da nome, ingredienti o categoria")

    return {
        "allergens": combined,
        "allergens_confirmed": confirmed_list,
        "allergens_inferred": inferred_list,
        "allergens_source": " + ".join(sources),
    }


def safe_filename(value: str, fallback: str = "image") -> str:
    clean = re.sub(r"[^a-zA-Z0-9._-]+", "_", value).strip("_")
    return clean[:130] or fallback


def image_extension(url: str) -> str:
    suffix = Path(urlparse(url).path).suffix.lower()
    return suffix if suffix in {".jpg", ".jpeg", ".png", ".webp"} else ".jpg"


def optimize_image(
    source: Path,
    destination: Path | None = None,
    max_width: int = 1200,
    quality: int = 82,
) -> Path:
    destination = destination or source.with_suffix(".webp")
    if destination.exists() and destination.stat().st_mtime >= source.stat().st_mtime:
        return destination

    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
        if image.width > max_width:
            height = round(image.height * max_width / image.width)
            image = image.resize((max_width, height), Image.Resampling.LANCZOS)
        image.save(destination, "WEBP", quality=quality, method=6)
    return destination


def api_url(restaurant_hash: str, lang: str) -> str:
    return f"https://dishcovery.menu/api/v3/restaurants/{restaurant_hash}?lang={lang}"


def fetch_restaurant(restaurant_hash: str, lang: str) -> dict[str, Any]:
    request = Request(
        api_url(restaurant_hash, lang),
        headers={
            "User-Agent": "Mozilla/5.0 PonteUnifiedApp/1.0",
            "Accept": "application/json,text/plain,*/*",
        },
    )
    with urlopen(request, timeout=60) as response:
        data = json.loads(response.read().decode("utf-8"))

    if not isinstance(data, dict) or "menucategories" not in data:
        raise ValueError("Unexpected Dishcovery response: missing menucategories")
    return data


def download_image(item: dict[str, Any]) -> str:
    image_url = item.get("image")
    if not image_url:
        return ""

    filename = (
        f"{item.get('id', 'item')}_"
        f"{safe_filename(item.get('name', 'image'))}"
        f"{image_extension(image_url)}"
    )
    target = IMAGE_DIR / filename
    if target.exists():
        optimized = optimize_image(target)
        return f"assets/menu-images/{optimized.name}"

    try:
        request = Request(image_url, headers={"User-Agent": "Mozilla/5.0 PonteUnifiedApp/1.0"})
        with urlopen(request, timeout=60) as response:
            content = response.read()
    except OSError:
        return ""

    target.write_bytes(content)
    optimized = optimize_image(target)
    return f"assets/menu-images/{optimized.name}"


def item_to_app_entry(
    item: dict[str, Any],
    image_path: str,
    category: str,
) -> dict[str, Any]:
    declared_allergens = [
        tag.get("name")
        for tag in item.get("allergentags", [])
        if tag.get("name")
    ]
    ingredients = [
        ingredient.get("name")
        for ingredient in item.get("ingredients", [])
        if ingredient.get("name")
    ]

    description = clean_html(item.get("description"))
    ingredients_text = ", ".join(ingredients)
    allergen_data = enrich_allergens(
        category,
        item.get("name", ""),
        description,
        ingredients_text,
        declared_allergens,
        "Dishcovery",
    )

    return {
        "id": item.get("id"),
        "name": item.get("name", ""),
        "price": float(item.get("price") or 0),
        "description": description,
        "ingredients": ingredients_text,
        **allergen_data,
        "image": image_path,
        "payoff": item.get("payoff") or "",
        "order": item.get("order") or 0,
    }


def build_menu_data(data: dict[str, Any], download_images: bool) -> dict[str, list[dict[str, Any]]]:
    menu_data: dict[str, list[dict[str, Any]]] = {
        "antipasti": [],
        "primi": [],
        "pizze": [],
        "secondi": [],
        "contorni": [],
        "dessert": [],
        "birre": [],
        "vini_rossi": [],
        "vini_bianchi": [],
        "bevande": [],
    }

    IMAGE_DIR.mkdir(parents=True, exist_ok=True)

    for category in data.get("menucategories", []):
        target_category = CATEGORY_MAP.get(category.get("name"))
        if not target_category:
            continue

        entries = []
        for item in category.get("menuentries", []):
            image_path = download_image(item) if download_images else ""
            entries.append(item_to_app_entry(item, image_path, target_category))

        entries.sort(key=lambda entry: (entry["order"], entry["name"]))
        menu_data[target_category].extend(entries)

    if BEVERAGE_DATA_JSON.exists():
        beverage_data = json.loads(BEVERAGE_DATA_JSON.read_text(encoding="utf-8"))
        for category, items in beverage_data.items():
            if category not in menu_data:
                continue
            enriched_items = []
            for index, item in enumerate(items):
                name = item.get("name", "")
                description = item.get("description", "")
                ingredients = item.get("ingredients", "")
                allergen_data = enrich_allergens(
                    category,
                    name,
                    description,
                    ingredients,
                    item.get("allergens", []),
                    item.get("allergens_source", "dato dichiarato"),
                )
                enriched_items.append({
                    "id": item.get("id"),
                    "name": name,
                    "price": float(item.get("price") or 0),
                    "description": description,
                    "ingredients": ingredients,
                    **allergen_data,
                    "image": item.get("image", ""),
                    "payoff": "",
                    "order": index,
                })
            menu_data[category] = enriched_items

    return menu_data


def write_menu_data_js(data: dict[str, Any], menu_data: dict[str, list[dict[str, Any]]]) -> None:
    metadata = {
        "name": data.get("name"),
        "description": clean_html(data.get("description")),
        "cover": data.get("cover"),
        "telephone": data.get("telephone") or "0543 29448",
        "source": "Dishcovery API v3",
    }
    MENU_DATA_JS.write_text(
        "window.menuMeta = "
        + json.dumps(metadata, ensure_ascii=False, indent=2)
        + ";\n\nwindow.menuData = "
        + json.dumps(menu_data, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )


def write_csv(data: dict[str, Any], menu_data: dict[str, list[dict[str, Any]]]) -> None:
    fieldnames = [
        "category",
        "id",
        "name",
        "price",
        "description",
        "ingredients",
        "allergens",
        "allergens_confirmed",
        "allergens_inferred",
        "allergens_source",
        "image",
    ]
    with (DATA_DIR / "menu.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for category, items in menu_data.items():
            for item in items:
                writer.writerow(
                    {
                        "category": category,
                        "id": item.get("id") or "",
                        "name": item.get("name") or "",
                        "price": f"{item.get('price'):.2f}",
                        "description": item.get("description") or "",
                        "ingredients": item.get("ingredients") or "",
                        "allergens": ", ".join(item.get("allergens") or []),
                        "allergens_confirmed": ", ".join(item.get("allergens_confirmed") or []),
                        "allergens_inferred": ", ".join(item.get("allergens_inferred") or []),
                        "allergens_source": item.get("allergens_source") or "",
                        "image": item.get("image") or "",
                    }
                )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Refresh unified site menu from Dishcovery.")
    parser.add_argument("--hash", default=DEFAULT_HASH, help="Dishcovery restaurant hash")
    parser.add_argument("--lang", default=DEFAULT_LANG, help="Dishcovery language")
    parser.add_argument("--from-file", action="store_true", help="Use data/restaurant.json instead of the API")
    parser.add_argument("--no-images", action="store_true", help="Do not download menu images")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if args.from_file:
        data = json.loads((DATA_DIR / "restaurant.json").read_text(encoding="utf-8"))
    else:
        data = fetch_restaurant(args.hash, args.lang)
        (DATA_DIR / "restaurant.json").write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    menu_data = build_menu_data(data, download_images=not args.no_images)
    write_menu_data_js(data, menu_data)
    write_csv(data, menu_data)

    total = sum(len(items) for items in menu_data.values())
    print(f"Restaurant: {data.get('name')}")
    print(f"Items: {total}")
    print(f"Generated: {MENU_DATA_JS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
