from pathlib import Path

from refresh_menu import ROOT, optimize_image


def main() -> None:
    home = ROOT / "assets" / "home"
    generated = 0
    for source in sorted(home.glob("*.jpg")):
        optimize_image(source, source.with_suffix(".webp"), max_width=1600, quality=82)
        optimize_image(source, source.with_name(f"{source.stem}-640.webp"), max_width=640, quality=78)
        generated += 2
    print(f"Generated home variants: {generated}")


if __name__ == "__main__":
    main()
