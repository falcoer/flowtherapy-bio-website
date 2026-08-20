# Médias sources

Ce dossier accueille les fichiers maîtres destinés à la galerie du site Flow Therapy.

Les sources restent immuables : elles ne doivent jamais être redimensionnées, compressées ou converties sur place. Les variantes publiées doivent être produites par la CI dans `dist/assets/media/`.

## Médias actuellement présentables

La galerie actuelle affiche des images fixes :

- photos de concert ou de scène ;
- portraits individuels ;
- photos du groupe ;
- coulisses et répétitions ;
- pochettes, affiches et créations graphiques ;
- visuels de presse.

Formats sources recommandés :

- `JPEG` pour les photographies sans transparence ;
- `PNG` pour les visuels nécessitant un canal alpha ;
- profil colorimétrique `sRGB`.

Les vidéos, fichiers audio, GIF animés, PDF et SVG ne sont pas encore pris en charge par la visionneuse. Leur ajout nécessite une évolution du composant média, de sa configuration et de la CI.

## Ratios pris en charge

| Usage | Orientation | Ratio conseillé | Définition source minimale |
|---|---|---:|---:|
| Photo de scène | paysage | `16:9` | 1920 × 1080 px |
| Photo classique | paysage | `3:2` | 1800 × 1200 px |
| Portrait | portrait | `4:5` | 1350 × 1688 px |
| Story ou Reel | portrait | `9:16` | 1080 × 1920 px |

Une image peut utiliser un autre ratio, à condition de renseigner ce ratio dans sa configuration. La galerie applique un recadrage de type `cover` dans les vignettes.

## Métadonnées nécessaires

Chaque média publié doit posséder une entrée dans `config/site.json`, sous `media.items`.

| Champ | Requis | Description |
|---|:---:|---|
| `title` | oui | Titre visible et texte alternatif utilisé par l’image. |
| `type` | oui | Libellé éditorial : `Photo`, `Portrait`, `Pochette`, `Affiche`, etc. |
| `orientation` | oui | `landscape` ou `portrait`. |
| `ratio` | oui | Ratio sous la forme `16:9`, `3:2`, `4:5` ou `9:16`. |
| `asset` | oui | Nom de base des variantes générées dans `assets/media/`. |
| `widths` | oui | Trois largeurs responsives générées par la CI. |
| `date` | oui | Date de prise de vue ou de publication. Préférer `AAAA-MM-JJ` lorsqu’elle est connue. |
| `credit` | oui | Nom du photographe, du vidéaste ou du créateur du visuel. |
| `description` | oui | Description courte affichée dans les informations de la visionneuse. |

Exemple :

```json
{
  "title": "Flow Therapy en concert à Martigues",
  "type": "Photo",
  "orientation": "landscape",
  "ratio": "16:9",
  "asset": "flow-therapy-live-martigues-2026",
  "widths": [640, 960, 1440],
  "date": "2026-07-18",
  "credit": "Nom du photographe",
  "description": "Flow Therapy sur scène lors d’un concert à Martigues."
}
```

## Informations éditoriales recommandées

Avant publication, conserver avec la source — dans la configuration ou dans un futur manifeste média — les informations suivantes :

- statut des droits de diffusion ;
- autorisation des personnes identifiables lorsque nécessaire ;
- événement et lieu de prise de vue ;
- version ou date de livraison ;
- éventuelles restrictions d’utilisation ;
- cadrage important à préserver.

Les métadonnées EXIF sensibles, notamment les coordonnées GPS, doivent être retirées des fichiers publiés par la CI.

## Convention de nommage

Utiliser uniquement des minuscules ASCII, des tirets et une extension explicite :

```text
flow-therapy-live-martigues-2026.jpg
flow-therapy-portrait-betty-2026.png
flow-therapy-pochette-premier-ep.png
```

Éviter les espaces, accents, noms génériques comme `IMG_1234` et suffixes ambigus tels que `final-v2-definitif`.

## Publication par la CI

L’ajout d’un fichier dans ce dossier ne suffit pas à le publier. Il faut également :

1. déclarer la source et son empreinte SHA-256 dans le manifeste d’assets ;
2. ajouter les variantes attendues au générateur CI ;
3. référencer le chemin généré dans `config/site.json` ;
4. vérifier le rendu paysage et mobile ainsi que le poids des fichiers produits.

Aucun fichier généré ne doit être commité dans `assets-src/medias/`.

## Index actuel

Huit sources sont déclarées dans `assets-src/manifest.json` :

- sept photographies publiées en 63 variantes responsives (AVIF, WebP et JPEG) ;
- une capture d’écran de galerie mobile conservée et vérifiée, mais exclue de la publication en attendant la photographie originale.

Les dates présentes dans la galerie proviennent des métadonnées EXIF disponibles. Les crédits non fournis restent explicitement indiqués comme « Non renseigné ».
