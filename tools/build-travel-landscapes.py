from __future__ import annotations

import hashlib
import json
import shutil
import unicodedata
from pathlib import Path

import PIL
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


def build_key(source_sha256: str, recipe: dict) -> str:
    payload = {
        "generator": sha256(Path(__file__)),
        "pillow": PIL.__version__,
        "source": source_sha256,
        "recipe": recipe,
    }
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(serialized).hexdigest()


def reuse_record(previous: dict[str, dict], output: Path, key: str) -> dict | None:
    relative = output.relative_to(DIST).as_posix()
    record = previous.get(relative)
    if not record or record.get("build_key") != key or not output.is_file():
        return None
    return record if record.get("sha256") == sha256(output) else None


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
    generated_manifest = DIST / "assets-manifest.json"
    manifest = json.loads(generated_manifest.read_text(encoding="utf-8")) if generated_manifest.is_file() else {"assets": []}
    previous = {asset["output"]: asset for asset in manifest["assets"] if asset.get("output") and asset.get("mode") == "responsive-landscape-ci"}
    generated_count = 0
    reused_count = 0

    for item, source in expected:
        actual = sha256(source)
        if actual != item["sha256"]:
            raise ValueError(f"Immutable source changed: {source.relative_to(ROOT)}")

        with Image.open(source) as original:
            original = original.convert("RGBA")
            for requested_width in widths:
                width = min(requested_width, original.width)
                height = round(original.height * width / original.width)
                stem = f"landscape-{item['id']}-{width}"
                outputs = {
                    "png": (generated / f"{stem}.png", None),
                    "webp": (generated / f"{stem}.webp", webp_quality),
                    "avif": (generated / f"{stem}.avif", avif_quality),
                }
                outputs["png"][0].parent.mkdir(parents=True, exist_ok=True)
                pending: list[tuple[str, Path, int | None, str]] = []
                for extension, (output, output_quality) in outputs.items():
                    recipe = {"mode": "responsive-landscape-ci", "landscape": item["id"], "width": width, "height": height, "format": extension, "quality": output_quality}
                    key = build_key(actual, recipe)
                    cached = reuse_record(previous, output, key)
                    if cached:
                        records.append(cached)
                        reused_count += 1
                    else:
                        pending.append((extension, output, output_quality, key))
                if not pending:
                    continue
                resized = original if width == original.width else original.resize((width, height), Image.Resampling.LANCZOS)
                for extension, output, output_quality, key in pending:
                    if extension == "png":
                        resized.save(output, optimize=True, compress_level=9)
                    elif extension == "webp":
                        resized.save(output, format="WEBP", quality=webp_quality, method=6)
                    else:
                        resized.save(output, format="AVIF", quality=avif_quality, speed=8)
                    record = {
                        "source": str(source.relative_to(SOURCE)),
                        "output": f"assets/generated/{output.name}",
                        "source_sha256": actual,
                        "build_key": key,
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
                    generated_count += 1

    if generated_manifest.is_file():
        manifest["assets"] = [asset for asset in manifest["assets"] if asset.get("mode") != "responsive-landscape-ci"]
        manifest["assets"].extend(records)
        generated_manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Travel landscapes: {generated_count} assets generated, {reused_count} reused.")


if __name__ == "__main__":
    main()
