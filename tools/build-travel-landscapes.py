from __future__ import annotations

import hashlib
import json
import shutil
import unicodedata
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


def normalized_name(value: str) -> str:
    return unicodedata.normalize("NFC", value)


def resolve_source(source_dir: Path, configured_name: str) -> Path:
    direct = source_dir / configured_name
    if direct.is_file():
        return direct

    expected = normalized_name(configured_name)
    for candidate in source_dir.iterdir():
        if candidate.is_file() and normalized_name(candidate.name) == expected:
            return candidate

    return direct


def main() -> None:
    for filename in ("travel-landscapes.css", "travel-landscapes.js"):
        shutil.copy2(ROOT / filename, DIST / filename)

    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    source_dir = SOURCE / config["sourceDirectory"]
    expected = [(item, resolve_source(source_dir, item["source"])) for item in config["landscapes"]]
    present = [(item, path) for item, path in expected if path.is_file()]

    if not present:
        print("Travel landscapes: sources not installed yet; keeping the current watermark fallback.")
        return

    if len(present) != len(expected):
        missing = ", ".join(item["source"] for item, path in expected if not path.is_file())
        raise FileNotFoundError(f"Travel landscapes incomplete; missing: {missing}")

    generated = DIST / "assets" / "generated"
    generated.mkdir(parents=True, exist_ok=True)
    widths = tuple(int(width) for width in config["widths"])
    webp_quality = int(config["webpQuality"])
    avif_quality = int(config["avifQuality"])
    records: list[dict] = []

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
                outputs = {
                    "png": (generated / f"{stem}.png", None),
                    "webp": (generated / f"{stem}.webp", webp_quality),
                    "avif": (generated / f"{stem}.avif", avif_quality),
                }
                outputs["png"][0].parent.mkdir(parents=True, exist_ok=True)
                resized.save(outputs["png"][0], optimize=True, compress_level=9)
                resized.save(outputs["webp"][0], format="WEBP", quality=webp_quality, method=6)
                resized.save(outputs["avif"][0], format="AVIF", quality=avif_quality, speed=8)
                for extension, (output, output_quality) in outputs.items():
                    record = {
                        "source": str(source.relative_to(SOURCE)),
                        "output": f"assets/generated/{output.name}",
                        "mode": "responsive-landscape-ci",
                        "landscape": item["id"],
                        "width": width,
                        "height": height,
                        "format": extension,
                        "sha256": sha256(output),
                        "bytes": output.stat().st_size,
                    }
                    if output_quality is not None:
                        record["quality"] = output_quality
                    records.append(record)

    generated_manifest = DIST / "assets-manifest.json"
    if generated_manifest.is_file():
        manifest = json.loads(generated_manifest.read_text(encoding="utf-8"))
        manifest["assets"] = [asset for asset in manifest["assets"] if asset.get("mode") != "responsive-landscape-ci"]
        manifest["assets"].extend(records)
        generated_manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Travel landscapes generated: {len(expected)} sources × {len(widths)} widths × 3 formats.")


if __name__ == "__main__":
    main()
