from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets-src"
DIST = ROOT / "dist"
CONFIG = SOURCE / "travel-landscapes.json"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    source_dir = SOURCE / config["sourceDirectory"]
    expected = [(item, source_dir / item["source"]) for item in config["landscapes"]]
    present = [(item, path) for item, path in expected if path.is_file()]

    if not present:
        print("Travel landscapes: sources not installed yet; keeping the current watermark fallback.")
        return

    if len(present) != len(expected):
        missing = ", ".join(path.name for _, path in expected if not path.is_file())
        raise FileNotFoundError(f"Travel landscapes incomplete; missing: {missing}")

    generated = DIST / "assets" / "generated"
    generated.mkdir(parents=True, exist_ok=True)
    widths = tuple(int(width) for width in config["widths"])
    quality = int(config["quality"])

    for item, source in expected:
        actual = sha256(source)
        if actual != item["sha256"]:
            raise ValueError(f"Immutable source changed: {source.relative_to(ROOT)}")

        with Image.open(source) as original:
            original = original.convert("RGBA")
            for requested_width in widths:
                width = min(requested_width, original.width)
                height = round(original.height * width / original.width)
                resized = original if width == original.width else original.resize((width, height), Image.Resampling.LANCZOS)
                stem = f"landscape-{item['id']}-{width}"
                resized.save(generated / f"{stem}.png", optimize=True, compress_level=9)
                resized.save(generated / f"{stem}.webp", format="WEBP", quality=quality, method=6)
                resized.save(generated / f"{stem}.avif", format="AVIF", quality=quality, speed=8)

    print(f"Travel landscapes generated: {len(expected)} sources × {len(widths)} widths × 3 formats.")


if __name__ == "__main__":
    main()
