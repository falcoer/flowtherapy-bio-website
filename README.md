# Flow Therapy — Bio website

Site public one-page de Flow Therapy, publié via GitHub Pages.

## Contenu et traductions

Les données neutres (fichiers médias, formats, dates, crédits et liens sociaux) sont centralisées dans :

```text
config/site.json
```

Les contenus éditoriaux et l’interface sont séparés par langue :

```text
i18n/
├── fr.json
└── en.json
```

La langue est choisie dans cet ordre : code dans l’URL, préférence mémorisée, langue du navigateur, français. Les routes publiées sont :

```text
/fr/
/en/
```

Le sélecteur de langue met à jour le contenu et l’URL sans rechargement. Pour ajouter ultérieurement `zh-Hans`, créer son dictionnaire complet, puis l’ajouter aux listes de langues actives dans `app.js`, `tools/build-site.py` et `tools/validate-site.mjs`.

## Assets

Les originaux restent dans `assets-src/`. Les images et polices publiées sont générées exclusivement par la CI dans `dist/assets/`; aucun original n’est modifié.

## Publication

Le workflow GitHub Actions construit, valide puis publie automatiquement la branche `main`.

Adresse actuelle :

```text
https://falcoer.github.io/flowtherapy-bio-website/
```

## Développement local

Le chargement de JSON nécessite un serveur HTTP local :

```bash
python3 -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.
