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
- `fonts/` : fontes TTF officielles et licences OFL. La CI génère les WOFF2 utilisés par le navigateur.
- `manifest.json` : provenance, empreintes SHA-256 et rôle de chaque source.

Les alpagas nus restent archivés ici et sont recopiés sans optimisation. Les alpagas costumés, le logo transparent et le filigrane sont les seuls visuels transformés dans ce premier jalon.
