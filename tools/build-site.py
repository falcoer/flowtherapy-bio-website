from __future__ import annotations

import gzip
import hashlib
import json
import re
import shutil
import xml.etree.ElementTree as ET
from pathlib import Path

import fontTools
import PIL
from PIL import Image, ImageOps
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
    "images/alpaga1-nu.png": {"name": "alpaga1-nu", "widths": (640, 768, 1024), "quality": 78},
    "images/alpaga1.png": {"name": "alpaga1", "widths": (640, 768, 1024), "quality": 78},
    "images/alpaga2-nu.png": {"name": "alpaga2-nu", "widths": (640, 768, 1024), "quality": 78},
    "images/alpaga2.png": {"name": "alpaga2", "widths": (640, 768, 1024), "quality": 78},
    "images/alpaga3-nu.png": {"name": "alpaga3-nu", "widths": (640, 768, 1024), "quality": 78},
    "images/alpaga3.png": {"name": "alpaga3", "widths": (640, 768, 1024), "quality": 78},
    "images/fond-urbain-transparent.png": {"name": "fond-urbain-transparent", "widths": (960, 1440), "quality": 65},
    "images/logo_transparent.png": {"name": "logo-transparent", "widths": (320, 480), "quality": 82},
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def build_key(source_sha256: str, recipe: dict) -> str:
    payload = {
        "generator": sha256(Path(__file__)),
        "pillow": PIL.__version__,
        "fonttools": fontTools.__version__,
        "source": source_sha256,
        "recipe": recipe,
    }
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(serialized).hexdigest()


class AssetCache:
    def __init__(self, previous_records: list[dict]) -> None:
        self.previous = {record["output"]: record for record in previous_records if record.get("output")}
        self.reused = 0
        self.generated = 0

    def reuse(self, output: Path, key: str) -> dict | None:
        relative = output.relative_to(DIST).as_posix()
        record = self.previous.get(relative)
        if not record or record.get("build_key") != key or not output.is_file():
            return None
        if record.get("sha256") != sha256(output):
            return None
        self.reused += 1
        return record

    def record(self, output: Path, key: str, metadata: dict) -> dict:
        self.generated += 1
        return {
            **metadata,
            "output": output.relative_to(DIST).as_posix(),
            "build_key": key,
            "sha256": sha256(output),
            "bytes": output.stat().st_size,
        }


def load_previous_records() -> list[dict]:
    manifest_path = DIST / "assets-manifest.json"
    if not manifest_path.is_file():
        return []
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []
    return manifest.get("assets", [])


def verify_sources(manifest: dict) -> None:
    for category in ("images", "medias", "decorations", "fonts", "vendor"):
        for asset in manifest[category]:
            source = SOURCE / asset["path"]
            if not source.is_file():
                raise FileNotFoundError(f"Source absente : {source.relative_to(ROOT)}")
            actual = sha256(source)
            if actual != asset["sha256"]:
                raise ValueError(f"Source modifiée sans mise à jour du manifeste : {source.relative_to(ROOT)}")


def optimize_svg(source: Path, output: Path) -> None:
    svg = source.read_text(encoding="utf-8")
    root = ET.fromstring(svg)
    if not root.tag.endswith("svg"):
        raise ValueError(f"Source SVG invalide : {source.relative_to(ROOT)}")
    lowered = svg.lower()
    if "<script" in lowered or re.search(r"\son[a-z]+\s*=", lowered):
        raise ValueError(f"Source SVG non sûre : {source.relative_to(ROOT)}")
    optimized = re.sub(r"<!--.*?-->", "", svg, flags=re.DOTALL)
    optimized = re.sub(r">\s+<", "><", optimized).strip()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(optimized + "\n", encoding="utf-8")


def prepare_dist() -> None:
    if DIST.parent != ROOT or DIST.name != "dist":
        raise RuntimeError("Le répertoire de sortie doit rester ROOT/dist")
    DIST.mkdir(exist_ok=True)
    for entry in DIST.iterdir():
        if entry.name in {"assets", "assets-manifest.json"}:
            continue
        if entry.is_dir():
            shutil.rmtree(entry)
        else:
            entry.unlink()
    (DIST / "assets" / "fonts" / "licenses").mkdir(parents=True, exist_ok=True)
    shutil.copytree(ROOT / "config", DIST / "config", dirs_exist_ok=True)
    shutil.copytree(ROOT / "i18n", DIST / "i18n", dirs_exist_ok=True)
    for filename in ("index.html", "app.js", "styles.css", "CNAME"):
        shutil.copy2(ROOT / filename, DIST / filename)
    for locale in ("fr", "en"):
        localized = (ROOT / "index.html").read_text(encoding="utf-8")
        localized = localized.replace('<html lang="fr">', f'<html lang="{locale}">')
        for filename in ("assets/", "styles.css", "travel-landscapes.css", "app.js", "travel-landscapes.js"):
            localized = localized.replace(f'"{filename}', f'"../{filename}')
        target = DIST / locale
        target.mkdir(exist_ok=True)
        (target / "index.html").write_text(localized, encoding="utf-8")
    (DIST / ".nojekyll").touch()


def build_assets(manifest: dict, cache: AssetCache) -> list[dict]:
    records: list[dict] = []
    output_assets = DIST / "assets"
    generated_images = output_assets / "generated"
    generated_images.mkdir(parents=True, exist_ok=True)
    for asset in manifest["images"]:
        source = SOURCE / asset["path"]
        if asset["mode"] == "passthrough":
            output = output_assets / source.name
            key = build_key(asset["sha256"], {"mode": "passthrough"})
            cached = cache.reuse(output, key)
            if cached:
                records.append(cached)
                continue
            shutil.copy2(source, output)
            records.append(cache.record(output, key, {"source": asset["path"], "source_sha256": asset["sha256"], "mode": "passthrough"}))
            continue

        variant = IMAGE_VARIANTS[asset["path"]]
        with Image.open(source) as original:
            for width in variant["widths"]:
                height = round(original.height * width / original.width)
                pending: list[tuple[str, Path, str]] = []
                for extension in ("avif", "webp", "png"):
                    output = generated_images / f"{variant['name']}-{width}.{extension}"
                    recipe = {"mode": "responsive-ci", "width": width, "height": height, "format": extension, "quality": variant["quality"]}
                    key = build_key(asset["sha256"], recipe)
                    cached = cache.reuse(output, key)
                    if cached:
                        records.append(cached)
                    else:
                        pending.append((extension, output, key))
                if not pending:
                    continue
                resized = original.resize((width, height), Image.Resampling.LANCZOS)
                for extension, output, key in pending:
                    if extension == "png":
                        resized.save(output, optimize=True, compress_level=9)
                    elif extension == "webp":
                        resized.save(output, quality=variant["quality"], method=4)
                    else:
                        resized.save(output, quality=variant["quality"], speed=8)
                    records.append(cache.record(output, key, {"source": asset["path"], "source_sha256": asset["sha256"], "mode": "responsive-ci", "width": width, "height": height, "format": extension}))


    output_media = output_assets / "media"
    output_media.mkdir(parents=True, exist_ok=True)
    for asset in manifest["medias"]:
        source = SOURCE / asset["path"]
        if asset["mode"] == "excluded-source":
            records.append({"source": asset["path"], "mode": "excluded-source", "reason": asset["reason"]})
            continue
        with Image.open(source) as original:
            normalized = ImageOps.exif_transpose(original).convert("RGB")
            for width in asset["widths"]:
                if width > normalized.width:
                    raise ValueError(f"Largeur demandée supérieure à la source : {asset['path']} ({width} > {normalized.width})")
                height = round(normalized.height * width / normalized.width)
                pending: list[tuple[str, Path, str]] = []
                for extension in ("avif", "webp", "jpg"):
                    output = output_media / f"{asset['name']}-{width}.{extension}"
                    quality = {"jpg": 84, "webp": 78, "avif": 72}[extension]
                    recipe = {"mode": "responsive-media-ci", "width": width, "height": height, "format": extension, "quality": quality}
                    key = build_key(asset["sha256"], recipe)
                    cached = cache.reuse(output, key)
                    if cached:
                        records.append(cached)
                    else:
                        pending.append((extension, output, key))
                if not pending:
                    continue
                resized = normalized.resize((width, height), Image.Resampling.LANCZOS)
                for extension, output, key in pending:
                    if extension == "jpg":
                        resized.save(output, format="JPEG", quality=84, optimize=True, progressive=True)
                    elif extension == "webp":
                        resized.save(output, quality=78, method=6)
                    else:
                        resized.save(output, quality=72, speed=8)
                    records.append(cache.record(output, key, {"source": asset["path"], "source_sha256": asset["sha256"], "mode": "responsive-media-ci", "width": width, "height": height, "format": extension}))


    decorations = output_assets / "decorations"
    for asset in manifest["decorations"]:
        source = SOURCE / asset["path"]
        output = decorations / source.name
        key = build_key(asset["sha256"], {"mode": asset["mode"], "format": "svg"})
        cached = cache.reuse(output, key)
        if cached:
            records.append(cached)
            continue
        optimize_svg(source, output)
        records.append(cache.record(output, key, {"source": asset["path"], "source_sha256": asset["sha256"], "mode": asset["mode"], "format": "svg"}))

    output_fonts = output_assets / "fonts"
    for source_name, output_name in FONT_OUTPUTS.items():
        source = SOURCE / source_name
        output = output_fonts / output_name
        source_sha = next(asset["sha256"] for asset in manifest["fonts"] if asset["path"] == source_name)
        recipe = {"mode": "woff2-subset", "unicode_ranges": ["U+0020-017F", "U+2000-206F", "U+25A6", "U+25B6", "U+2600", "U+263E"]}
        key = build_key(source_sha, recipe)
        cached = cache.reuse(output, key)
        if cached:
            records.append(cached)
            continue
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
        records.append(cache.record(output, key, {"source": source_name, "source_sha256": source_sha, **recipe}))

    for family in ("bangers", "inter", "kalam"):
        shutil.copy2(SOURCE / "fonts" / family / "OFL.txt", output_fonts / "licenses" / f"{family}-OFL.txt")

    for asset in manifest["vendor"]:
        source = SOURCE / asset["path"]
        output = output_assets / asset["path"]
        output.parent.mkdir(parents=True, exist_ok=True)
        key = build_key(asset["sha256"], {"mode": asset["mode"]})
        cached = cache.reuse(output, key)
        if cached:
            records.append(cached)
            continue
        shutil.copy2(source, output)
        records.append(cache.record(output, key, {"source": asset["path"], "source_sha256": asset["sha256"], "mode": asset["mode"]}))
    return records


def main() -> None:
    manifest = json.loads((SOURCE / "manifest.json").read_text(encoding="utf-8"))
    verify_sources(manifest)
    previous_records = load_previous_records()
    cache = AssetCache(previous_records)
    prepare_dist()
    records = build_assets(manifest, cache)
    records.extend(record for record in previous_records if record.get("mode") == "responsive-landscape-ci")
    generated = {"schema": "flowtherapy.generated-assets/v1", "fonttools": fontTools.__version__, "pillow": PIL.__version__, "assets": records}
    (DIST / "assets-manifest.json").write_text(json.dumps(generated, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Site construit dans {DIST} : {cache.generated} assets générés, {cache.reused} réutilisés.")


if __name__ == "__main__":
    main()
