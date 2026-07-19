#!/usr/bin/env python3
"""Menu and image cache update tool for Ponte Unified App.

Manages integration between Dishcovery API and the unified frontend.
Handles menu refresh, image caching, and JSON/CSV normalization.
"""

import argparse
import csv
import json
import logging
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Configuration
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / 'data'
ASSETS_DIR = BASE_DIR / 'assets'
MENU_IMAGES_DIR = ASSETS_DIR / 'menu-images'

MENU_CATEGORIES = [
    'antipasti', 'bevande', 'birre', 'contorni', 'dessert',
    'primi', 'pizze', 'secondi', 'vini_bianchi', 'vini_rossi'
]


class ImageCacheManager:
    """Manages menu item image caching from Dishcovery."""

    def __init__(self):
        self.session = None
        self.manifest_path = BASE_DIR / 'manifest.json'

    def download_image(self, image_url: str, filename: str) -> bool:
        """Download and cache an image file."""
        if not self.session:
            import requests
            self.session = requests.Session()

        try:
            response = self.session.get(image_url, stream=True, timeout=30)
            response.raise_for_status()

            filepath = MENU_IMAGES_DIR / filename
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            logger.info(f"Downloaded: {filename}")
            return True
        except Exception as e:
            logger.warning(f"Failed to download {image_url}: {e}")
            return False

    def cache_images(self, items: List[Dict]) -> None:
        """Download all images from menu items."""
        if not MENU_IMAGES_DIR.exists():
            MENU_IMAGES_DIR.mkdir()
            logger.info(f"Created directory: {MENU_IMAGES_DIR}")

        for item in items:
            if item.get('image'):
                original_filename = item['image'].split('/')[-1]
                slug = re.sub(r'[^\w\s]', '', item['name']).lower().replace(' ', '_')
                filename = f"{slug}.png"

                if self.download_image(item['image'], filename):
                    item['image'] = f"assets/menu-images/{filename}"

    def replace_images_with_generated(self, items: List[Dict]) -> None:
        """Replace images with locally generated placeholders for testing."""
        for item in items:
            if not item.get('image'):
                slug = re.sub(r'[^\w\s]', '', item['name']).lower().replace(' ', '_')

                if item.get('category') == 'pizza':
                    filename = f"generated_{slug}.png"
                elif item.get('category') in ['antipasto', 'contorno']:
                    filename = f"generated_{slug}.png"
                else:
                    filename = f"generated_{slug}_clean.png"

                # Always use a locally generated placeholder for consistency
                item['image'] = f"assets/menu-images/{filename}"


class MenuDataProcessor:
    """Processes and normalizes menu data from Dishcovery."""

    @staticmethod
    def extract_ingredients(description: str) -> str:
        """Extract ingredients list from description."""
        if not description:
            return ""

        ingredients_map = {
            'asporto': 'Pasta fresca, pomodoro, mozzarella, basilico',
            'marinara': 'Pomodoro, aglio, origano',
            'funghi': 'Pasta, funghi, pomodoro, aglio, prezzemolo',
            'prosciutto': 'Pasta, prosciutto cotto, parmigiano, scaglie di grana',
            'diavola': 'Pasta, pomodoro, salame piccante, aglio, origano',
            'quattro formaggi': 'Pasta, mozzarella, parmigiano, gorgonzola, grana padano'
        }

        desc_lower = description.lower()
        for key in ingredients_map:
            if key in desc_lower:
                return ingredients_map[key]

        return "Ingredienti al momento non disponibili"

    @staticmethod
    def extract_allergens(item: Dict) -> List[str]:
        """Extract allergen information from item data."""
        allergens = []

        name_lower = item.get('name', '').lower()
        description_lower = item.get('description', '').lower()

        if any(word in name_lower or word in description_lower
               for word in ['glass', 'beer', 'wine', 'drink']):
            allergens.append('Solfiti')
        elif any(word in name_lower for word in ['ham', 'prosciutto', 'salame']):
            allergens.append('Veri di maiale')

        if any(word in name_lower for word in ['pane', 'bread']):
            allergens.append('Glutine')

        return allergens

    @staticmethod
    def normalize_item(item: Dict, category: str) -> Dict:
        """Normalize a menu item to standard format."""
        normalized = {
            'id': item.get('id') or f"{category[:3]}-{len(str(item.get('price', 0)))}",
            'name': item.get('name', ''),
            'price': item.get('price', 0),
            'description': item.get('description', ''),
            'ingredients': MenuDataProcessor.extract_ingredients(item.get('description', '')),
            'allergens': MenuDataProcessor.extract_allergens(item),
            'image': item.get('image', ''),
            'payoff': '',
            'order': item.get('order', 0)
        }

        return normalized

    @staticmethod
    def process_menu_data(menu_data: Dict) -> Dict[str, List[Dict]]:
        """Process raw Dishcovery menu data into normalized format."""
        normalized_menu = {}

        for category_key in MENU_CATEGORIES:
            items = []

            if category_key not in menu_data:
                continue

            category_items = menu_data[category_key]

            for i, item in enumerate(category_items):
                normalized = MenuDataProcessor.normalize_item(item, category_key)
                items.append(normalized)

            normalized_menu[category_key] = items

        return normalized_menu


class DishcoveryAPI:
    """Client for Dishcovery API."""

    def __init__(self):
        try:
            import requests
            self.session = requests.Session()
            self.base_url = 'https://dishcovery-api.onrender.com/api/v1'
        except ImportError:
            logger.warning("requests library not available, using cached data")
            self.session = None
            self.base_url = None

    def fetch_menu(self) -> Optional[Dict]:
        """Fetch menu data from Dishcovery API."""
        if not self.session or not self.base_url:
            return None

        try:
            response = self.session.get(f"{self.base_url}/menu", timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to fetch menu from API: {e}")
            return None

    def fetch_restaurant(self) -> Optional[Dict]:
        """Fetch restaurant info from Dishcovery API."""
        if not self.session or not self.base_url:
            return None

        try:
            response = self.session.get(f"{self.base_url}/restaurant/11845", timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to fetch restaurant info from API: {e}")
            return None


def write_json_data(data: Dict, filename: str) -> None:
    """Write JSON data to file with proper formatting."""
    filepath = DATA_DIR / filename

    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        logger.info(f"Written JSON: {filepath}")
    except Exception as e:
        logger.error(f"Failed to write JSON {filepath}: {e}")
        raise


def write_csv_data(menu_data: Dict[str, List[Dict]], filename: str) -> None:
    """Write menu data to CSV format."""
    filepath = DATA_DIR / filename

    try:
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['name', 'price', 'format', 'detail']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

            writer.writeheader()

            for category, items in menu_data.items():
                for item in items:
                    description = item.get('description', '')
                    format_detail = ''

                    if description:
                        if 'Formato:' in description:
                            format_part = description.split('Formato:')[1].split('•')[0].strip()
                            format_detail = format_part

                        if ' • ' in description:
                            detail_part = description.split(' • ', 1)[1].strip()
                            format_detail = format_detail + ' • ' + detail_part if format_detail else detail_part

                    writer.writerow({
                        'name': item['name'],
                        'price': item['price'],
                        'format': format_detail,
                        'detail': ''
                    })

        logger.info(f"Written CSV: {filepath}")
    except Exception as e:
        logger.error(f"Failed to write CSV {filepath}: {e}")
        raise


def write_menu_js_data(menu_data: Dict[str, List[Dict]], filename: str) -> None:
    """Write processed menu data as JavaScript module."""
    filepath = BASE_DIR / filename

    try:
        # Filter out items without images
        processed_menu = {}
        for category, items in menu_data.items():
            processed_items = []
            for item in items:
                processed_item = {
                    'id': item['id'],
                    'name': item['name'],
                    'price': item['price'],
                    'description': item['description'],
                    'ingredients': item.get('ingredients', ''),
                    'allergens': item.get('allergens', []),
                    'image': item.get('image', ''),
                    'payoff': item.get('payoff', '')
                }

                if processed_item['image']:
                    processed_items.append(processed_item)

            processed_menu[category] = processed_items

        js_content = f"""// Menu data generated by refresh_menu.py
// Do not edit this file directly - regenerate from Dishcovery API

const menuData = {json.dumps(processed_menu, ensure_ascii=False, indent=2)};

export {{ menuData }};
"""

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(js_content)

        logger.info(f"Written JS: {filepath}")
    except Exception as e:
        logger.error(f"Failed to write JS {filepath}: {e}")
        raise


def update_placeholder_images():
    """Ensure placeholder images are available."""
    placeholder_dir = ASSETS_DIR / 'site-images'

    if not placeholder_dir.exists():
        placeholder_dir.mkdir()

    generated_placeholders = [
        'generated_bruciatini.png',
        'generated_cotoletta_milanese.png',
        'generated_filetto_pepe_rosa_clean.png',
        'generated_filetto_porcini.png',
        'generated_fritto_mare_verdure.png',
        'generated_grigliata_carne.png',
        'generated_lasagne_romagnola.png',
        'generated_tagliolini_scoglio.png',
        'improved_baccala_mantecato.png',
        'improved_baccala_white.png',
        'improved_galletto_agrumi.png'
    ]

    for placeholder in generated_placeholders:
        placeholder_path = MENU_IMAGES_DIR / placeholder
        if not placeholder_path.exists():
            logger.warning(f"Placeholder image not found: {placeholder}")


def main():
    """Main function to refresh menu and images."""
    parser = argparse.ArgumentParser(description='Refresh menu and cache images')
    parser.add_argument('--from-file', action='store_true',
                       help='Load data from local JSON file instead of API')
    args = parser.parse_args()

    logger.info("Starting menu refresh process")

    # Initialize components
    image_cache = ImageCacheManager()
    processor = MenuDataProcessor()
    api_client = DishcoveryAPI()

    # Load menu data
    if args.from_file:
        logger.info("Loading menu data from local file")
        data_file = DATA_DIR / 'restaurant.json'
        if not data_file.exists():
            logger.error(f"Local data file not found: {data_file}")
            sys.exit(1)

        with open(data_file, 'r', encoding='utf-8') as f:
            raw_menu_data = json.load(f)

        raw_restaurant_data = json.load(open(DATA_DIR / 'restaurant.json', 'r', encoding='utf-8'))
    else:
        logger.info("Fetching menu data from Dishcovery API")

        raw_menu_data = api_client.fetch_menu()
        if not raw_menu_data:
            logger.error("Failed to fetch menu data from API")
            sys.exit(1)

        raw_restaurant_data = api_client.fetch_restaurant()
        if not raw_restaurant_data:
            logger.warning("Failed to fetch restaurant info")

    if not raw_menu_data:
        logger.error("No menu data available")
        sys.exit(1)

    # Process and normalize data
    logger.info("Processing menu data")
    processed_menu = processor.process_menu_data(raw_menu_data)

    # Cache images
    logger.info("Caching images")
    all_items = []
    for category_items in processed_menu.values():
        all_items.extend(category_items)

    image_cache.cache_images(all_items)

    # Update placeholder images
    update_placeholder_images()

    # Write output files
    logger.info("Writing output files")
    write_json_data(raw_menu_data, 'restaurant.json')
    write_csv_data(processed_menu, 'menu.csv')
    write_menu_js_data(processed_menu, 'js/menu-data.js')

    logger.info("Menu refresh completed successfully")


if __name__ == '__main__':
    main()