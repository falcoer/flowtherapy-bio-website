# Sources maîtresses des assets

Ce répertoire contient exclusivement les fichiers d'origine nécessaires à la construction du site.

## Règle d'immuabilité

- Un fichier de `assets-src/` n'est jamais optimisé, redimensionné ou réencodé sur place.
- Toute transformation écrit dans `dist/assets/` et s'exécute par `tools/build-site.py` dans la CI.
- Pour remplacer une source, ajouter le nouveau fichier d'origine, mettre à jour `manifest.json`, puis laisser la CI régénérer les dérivés.
- `dist/` et les anciens fichiers runtime de `assets/` ne doivent pas être commités.
- Les sorties générées ne sont pas des sources et ne doivent jamais servir d'entrée à une transformation suivante.

## Organisation

- `images/` : PNG, JPEG et SVG maîtres. Les entrées `responsive-ci` du manifeste produisent des tailles AVIF, WebP et PNG adaptées ; les entrées `passthrough` sont recopiées sans altération.
- `decorations/` : SVG maîtres dessinés à la craie. Ils reprennent les formes vectorielles de la vidéo Remotion `Don't Speak` v8 ; la CI les valide et les minifie en masques monochromes, ensuite colorés par les thèmes CSS.
- `fonts/` : fontes TTF officielles et licences OFL. La CI génère les WOFF2 utilisés par le navigateur.
- `vendor/` : distributions tierces originales et licences ; elles sont publiées localement et peuvent être chargées à la demande.
- `manifest.json` : provenance, empreintes SHA-256 et rôle de chaque source.

Les alpagas nus et costumés, le logo transparent et le filigrane restent archivés ici dans leur format maître. La CI génère seule leurs variantes responsive ; aucune source n'est modifiée.

Les décorations sont conservées en SVG vectoriel pour rester nettes sans limite de résolution. Les variantes Light et Dark ne dupliquent pas les fichiers : les mêmes masques reçoivent les couleurs sémantiques `pink`, `blue`, `orange` et `purple` du thème actif.
