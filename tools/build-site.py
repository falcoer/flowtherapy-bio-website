from __future__ import annotations

import gzip
import hashlib
import json
import shutil
from pathlib import Path

import fontTools
import PIL
from PIL import Image
from fontTools import subset


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets-src"
DIST = ROOT / "dist"

FONT_OUTPUTS = {
    "fonts/bangers/Bangers-Regular.ttf": "bangers-regular.woff2",
    "fonts/inter/Inter-Variable.ttf.gz": "inter-variable.woff2",
    "fonts/kalam/Kalam-Regular.ttf": "kalam-regular.woff2",
}

FONT_UNICODES = tuple(range(0x20, 0x180)) + tuple(range(0x2000, 0x2070)) + (0x25A6, 0x25B6, 0x2600, 0x263E)

IMAGE_VARIANTS = {
    "images/alpaga1.png": {"name": "alpaga1", "widths": (640, 1024), "quality": 78},
    "images/alpaga2.png": {"name": "alpaga2", "widths": (640, 1024), "quality": 78},
    "images/alpaga3.png": {"name": "alpaga3", "widths": (640, 1024), "quality": 78},
    "images/fond-urbain-transparent.png": {"name": "fond-urbain-transparent", "widths": (960, 1440), "quality": 65},
    "images/logo_transparent.png": {"name": "logo-transparent", "widths": (320, 480), "quality": 82},
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_sources(manifest: dict) -> None:
    for category in ("images", "fonts", "vendor"):
        for asset in manifest[category]:
            source = SOURCE / asset["path"]
            if not source.is_file():
                raise FileNotFoundError(f"Source absente : {source.relative_to(ROOT)}")
            actual = sha256(source)
            if actual != asset["sha256"]:
                raise ValueError(f"Source modifiée sans mise à jour du manifeste : {source.relative_to(ROOT)}")


def prepare_dist() -> None:
    if DIST.parent != ROOT or DIST.name != "dist":
        raise RuntimeError("Le répertoire de sortie doit rester ROOT/dist")
    if DIST.exists():
        shutil.rmtree(DIST)
    (DIST / "assets" / "fonts" / "licenses").mkdir(parents=True)
    shutil.copytree(ROOT / "config", DIST / "config")
    for filename in ("index.html", "app.js", "styles.css"):
        shutil.copy2(ROOT / filename, DIST / filename)
    (DIST / ".nojekyll").touch()


def build_assets(manifest: dict) -> list[dict]:
    records: list[dict] = []
    output_assets = DIST / "assets"
    generated_images = output_assets / "generated"
    generated_images.mkdir(parents=True)
    for asset in manifest["images"]:
        source = SOURCE / asset["path"]
        if asset["mode"] == "passthrough":
            output = output_assets / source.name
            shutil.copy2(source, output)
            records.append({"source": asset["path"], "output": f"assets/{output.name}", "mode": "passthrough", "sha256": sha256(output), "bytes": output.stat().st_size})
            continue

        variant = IMAGE_VARIANTS[asset["path"]]
        with Image.open(source) as original:
            for width in variant["widths"]:
                height = round(original.height * width / original.width)
                resized = original.resize((width, height), Image.Resampling.LANCZOS)
                for extension in ("avif", "webp", "png"):
                    output = generated_images / f"{variant['name']}-{width}.{extension}"
                    if extension == "png":
                        resized.save(output, optimize=True, compress_level=9)
                    elif extension == "webp":
                        resized.save(output, quality=variant["quality"], method=4)
                    else:
                        resized.save(output, quality=variant["quality"], speed=8)
                    records.append({"source": asset["path"], "output": f"assets/generated/{output.name}", "mode": "responsive-ci", "width": width, "height": height, "format": extension, "sha256": sha256(output), "bytes": output.stat().st_size})

    output_fonts = output_assets / "fonts"
    for source_name, output_name in FONT_OUTPUTS.items():
        source = SOURCE / source_name
        output = output_fonts / output_name
        if source.suffix == ".gz":
            unpacked = DIST / source.stem
            with gzip.open(source, "rb") as compressed, unpacked.open("wb") as target:
                shutil.copyfileobj(compressed, target)
            font_source = unpacked
        else:
            font_source = source
        options = subset.Options()
        options.flavor = "woff2"
        options.layout_features = ["*"]
        options.name_IDs = ["*"]
        options.name_legacy = True
        options.name_languages = ["*"]
        options.recalc_average_width = True
        options.recalc_max_context = True
        font = subset.load_font(str(font_source), options)
        subsetter = subset.Subsetter(options=options)
        subsetter.populate(unicodes=FONT_UNICODES)
        subsetter.subset(font)
        subset.save_font(font, str(output), options)
        if font_source != source:
            font_source.unlink()
        records.append({"source": source_name, "output": f"assets/fonts/{output_name}", "mode": "woff2-subset", "unicode_ranges": ["U+0020-017F", "U+2000-206F", "U+25A6", "U+25B6", "U+2600", "U+263E"], "sha256": sha256(output), "bytes": output.stat().st_size})

    for family in ("bangers", "inter", "kalam"):
        shutil.copy2(SOURCE / "fonts" / family / "OFL.txt", output_fonts / "licenses" / f"{family}-OFL.txt")

    for asset in manifest["vendor"]:
        source = SOURCE / asset["path"]
        output = output_assets / asset["path"]
        output.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, output)
        records.append({"source": asset["path"], "output": f"assets/{asset['path']}", "mode": asset["mode"], "sha256": sha256(output), "bytes": output.stat().st_size})
    return records


def main() -> None:
    manifest = json.loads((SOURCE / "manifest.json").read_text(encoding="utf-8"))
    verify_sources(manifest)
    prepare_dist()
    records = build_assets(manifest)
    generated = {"schema": "flowtherapy.generated-assets/v1", "fonttools": fontTools.__version__, "pillow": PIL.__version__, "assets": records}
    (DIST / "assets-manifest.json").write_text(json.dumps(generated, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Site construit dans {DIST} : {len(records)} assets générés.")


if __name__ == "__main__":
    main()
