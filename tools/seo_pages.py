"""Référencement : pré-rendu du contenu, balises <head>, JSON-LD, sitemap et robots.

Appelé par build-site.py une fois dist/ prêt. Le contenu écrit ici est lu par les
moteurs sans exécuter de JavaScript ; app.js le remplace au chargement, comme avant.
Toutes les données viennent de config/site.json, i18n/<langue>.json et data/agenda.yml
(déjà validé et publié en config/agenda.json) : aucun texte n'est écrit en dur ici.
"""
from __future__ import annotations

import json
from datetime import date, datetime
from html import escape
from pathlib import Path
from zoneinfo import ZoneInfo

from PIL import Image, ImageOps

LOCALES = ("fr", "en", "es", "it", "de", "pt", "zh", "ja")
DEFAULT_LOCALE = "fr"
OG_LOCALES = {"fr": "fr_FR", "en": "en_GB", "es": "es_ES", "it": "it_IT", "de": "de_DE", "pt": "pt_PT", "zh": "zh_CN", "ja": "ja_JP"}
OG_IMAGE = "assets/og/flow-therapy-1200x630.jpg"
OG_SOURCE = "medias/11fe83c3-d862-48b5-8123-32aa1af0f9a6.JPG"  # portrait de groupe sur scène (crédit C.B.)
LOADING = '<p class="loading">Chargement de Flow Therapy…</p>'
PUBLIC_EVENTS = {"reservation_conseillee", "entree_libre", "billetterie", None}


def page_url(base: str, locale: str | None) -> str:
    return base if locale in (None, DEFAULT_LOCALE) else f"{base}{locale}/"


def e(value: object) -> str:
    return escape(str(value or ""), quote=True)


def build_og_image(source_root: Path, dist: Path) -> None:
    output = dist / OG_IMAGE
    output.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source_root / OG_SOURCE) as original:
        image = ImageOps.exif_transpose(original).convert("RGB")
        ImageOps.fit(image, (1200, 630), Image.Resampling.LANCZOS, centering=(0.5, 0.2)).save(output, format="JPEG", quality=84, optimize=True, progressive=True)


def upcoming(agenda: dict) -> list[dict]:
    today = datetime.now(ZoneInfo("Europe/Paris")).date().isoformat()
    return [event for event in agenda.get("evenements", []) if event["date"] >= today]


def format_date(value: str, locale: str) -> str:
    day = date.fromisoformat(value)
    return day.strftime("%d/%m/%Y") if locale != "en" else day.isoformat()


def json_ld(config: dict, copy: dict, agenda: dict, base: str) -> str:
    group_id = f"{base}#groupe"
    group = {
        "@context": "https://schema.org",
        "@type": "MusicGroup",
        "@id": group_id,
        "name": config["site"]["name"],
        "url": base,
        "description": copy["site"]["tagline"],
        "genre": config["seo"]["genre"],
        "foundingDate": config["seo"]["foundingDate"],
        "foundingLocation": {
            "@type": "Place",
            "name": config["seo"]["city"],
            "address": {"@type": "PostalAddress", "addressLocality": config["seo"]["city"], "addressRegion": config["seo"]["region"], "addressCountry": "FR"},
        },
        "member": [{"@type": "Person", "name": member["name"]} for member in config.get("hero", {}).get("members", [])],
        "image": base + OG_IMAGE,
        "sameAs": [social["url"] for social in config.get("socials", [])],
    }
    if config["seo"].get("award"):
        group["award"] = config["seo"]["award"]
    events = []
    for event in upcoming(agenda):
        if event.get("modalites") not in PUBLIC_EVENTS:
            continue  # un événement sur invitation n'est pas ouvert au public : pas de balisage
        events.append({
            "@context": "https://schema.org",
            "@type": "MusicEvent",
            "name": f"{config['site']['name']} – {event['nom']}",
            "startDate": datetime.fromisoformat(f"{event['date']}T{event['heure']}").replace(tzinfo=ZoneInfo("Europe/Paris")).isoformat() if event.get("heure") else event["date"],
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "location": {"@type": "Place", "name": event["etablissement"], "address": {"@type": "PostalAddress", "addressLocality": event["lieu"], "addressCountry": "FR"}},
            "performer": {"@type": "MusicGroup", "@id": group_id, "name": config["site"]["name"]},
            "organizer": {"@type": "Organization", "name": event["etablissement"]},
        })
    blocks = [group, *events]
    return "\n".join(f'  <script type="application/ld+json">{json.dumps(block, ensure_ascii=False)}</script>' for block in blocks)


def head_tags(config: dict, copy: dict, locale: str, url: str, base: str, ld: str) -> str:
    meta = copy["meta"]
    lines = [
        f'  <link rel="canonical" href="{e(url)}">',
        *[f'  <link rel="alternate" hreflang="{code}" href="{e(page_url(base, code))}">' for code in LOCALES],
        f'  <link rel="alternate" hreflang="x-default" href="{e(base)}">',
        '  <meta property="og:type" content="website">',
        f'  <meta property="og:site_name" content="{e(config["site"]["name"])}">',
        f'  <meta property="og:locale" content="{OG_LOCALES[locale]}">',
        f'  <meta property="og:url" content="{e(url)}">',
        f'  <meta property="og:title" content="{e(meta["title"])}">',
        f'  <meta property="og:description" content="{e(copy["site"]["tagline"])}">',
        f'  <meta property="og:image" content="{e(base + OG_IMAGE)}">',
        '  <meta property="og:image:width" content="1200">',
        '  <meta property="og:image:height" content="630">',
        f'  <meta property="og:image:alt" content="{e(copy["hero"]["heading"])}">',
        '  <meta name="twitter:card" content="summary_large_image">',
        ld,
    ]
    return "\n".join(lines)


def static_body(config: dict, copy: dict, agenda: dict, locale: str, base: str) -> str:
    nav = copy["navigation"]
    links = [("#groupe", nav["group"]), ("#agenda", nav["agenda"]), ("#medias", nav["media"]), ("#contact", copy["contact"]["title"])]
    parts = [
        '<div class="prerender">',
        f'<header><p>{e(config["site"]["name"])}</p><h1>{e(copy["hero"]["heading"])}</h1><p>{e(copy["site"]["tagline"])}</p>',
        '<nav><ul>' + "".join(f'<li><a href="{href}">{e(label)}</a></li>' for href, label in links) + '</ul></nav>',
        '<ul>' + "".join(f'<li><a href="{e(social["url"])}" rel="noopener">{e(social["label"])}</a></li>' for social in config.get("socials", [])) + '</ul></header>',
        f'<section id="groupe"><p>{e(copy["site"]["location"])}</p><h2>{e(copy["about"]["title"])}</h2>' + "".join(f"<p>{e(p)}</p>" for p in copy["about"]["paragraphs"]) + "</section>",
    ]
    events = upcoming(agenda)
    agenda_copy = copy["agenda"]
    items = "".join(f'<li>{e(format_date(ev["date"], locale))}{" " + e(ev["heure"]) if ev.get("heure") else ""} – {e(ev["nom"])}, {e(ev["etablissement"])}, {e(ev["lieu"])}</li>' for ev in events)
    parts.append(f'<section id="agenda"><h2>{e(agenda_copy["title"])}</h2>' + (f"<ul>{items}</ul>" if items else f'<p>{e(agenda_copy["empty"])}</p>') + "</section>")
    showcase = config.get("showcase") or {}
    media_links = f'<p><a href="{e(showcase["url"])}" rel="noopener">{e(copy["references"]["video"]["title"])}</a></p>' if showcase.get("url") else ""
    parts.append(f'<section id="medias"><h2>{e(copy["media"]["title"])}</h2><p>{e(copy["media"]["intro"])}</p>{media_links}</section>')
    refs = []
    for item in copy["references"].get("items", []):
        for publication in item.get("publications", []):
            title = e(publication["title"])
            refs.append(f'<li>{e(publication.get("source") or item["name"])} : ' + (f'<a href="{e(publication["url"])}" rel="noopener">{title}</a>' if publication.get("url") else title) + "</li>")
    parts.append(f'<section id="references"><h2>{e(copy["references"]["title"])}</h2><ul>{"".join(refs)}</ul></section>')
    languages = copy["controls"]["languages"]
    parts.append('<footer><ul>' + "".join(f'<li><a href="{e(page_url(base, code))}" hreflang="{code}" lang="{code}">{e(languages[code])}</a></li>' for code in LOCALES) + f'</ul><p>{e(copy["site"]["copyright"])}</p></footer>')
    parts.append("</div>")
    return "".join(parts)


def apply(html: str, config: dict, copy: dict, agenda: dict, locale: str, url: str, base: str) -> str:
    meta = copy["meta"]
    old_title = "<title>Flow Therapy</title>"
    old_description = '<meta name="description" content="Flow Therapy, trio musical martégal. Musique originale, actualités, galerie média et réseaux sociaux.">'
    for marker in (old_title, old_description, LOADING, "</head>"):
        if html.count(marker) != 1:
            raise ValueError(f"Gabarit index.html inattendu : {marker!r} doit apparaître une seule fois")
    html = html.replace(old_title, f"<title>{e(meta['title'])}</title>")
    html = html.replace(old_description, f'<meta name="description" content="{e(meta["description"])}">')
    html = html.replace("</head>", head_tags(config, copy, locale, url, base, json_ld(config, copy, agenda, base)) + "\n</head>")
    return html.replace(LOADING, LOADING + "\n    " + static_body(config, copy, agenda, locale, base))


def build(root: Path, dist: Path) -> None:
    config = json.loads((root / "config" / "site.json").read_text(encoding="utf-8"))
    agenda = json.loads((dist / "config" / "agenda.json").read_text(encoding="utf-8"))
    base = config["site"]["url"]
    if not base.startswith("https://") or not base.endswith("/"):
        raise ValueError("config/site.json site.url doit être l'adresse https officielle terminée par /")
    build_og_image(root / "assets-src", dist)
    copies = {locale: json.loads((root / "i18n" / f"{locale}.json").read_text(encoding="utf-8")) for locale in LOCALES}
    pages = [(dist / "index.html", DEFAULT_LOCALE, base)]
    # /fr/ est une copie exacte de la racine : sa canonical pointe vers la racine.
    pages += [(dist / locale / "index.html", locale, page_url(base, locale)) for locale in LOCALES]
    for path, locale, url in pages:
        path.write_text(apply(path.read_text(encoding="utf-8"), config, copies[locale], agenda, locale, url, base), encoding="utf-8")
    today = date.today().isoformat()
    alternates = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{code}" href="{page_url(base, code)}"/>' for code in LOCALES) + f'\n    <xhtml:link rel="alternate" hreflang="x-default" href="{base}"/>'
    urls = "".join(f"\n  <url>\n    <loc>{page_url(base, code)}</loc>\n    <lastmod>{today}</lastmod>{alternates}\n  </url>" for code in LOCALES)
    (dist / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">{urls}\n</urlset>\n', encoding="utf-8")
    (dist / "robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /i18n-preview/\n\nSitemap: {base}sitemap.xml\n", encoding="utf-8")
