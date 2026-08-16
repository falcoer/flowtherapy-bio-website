# Flow Therapy — Bio website

Site public de type « link in bio » / one-page website pour Flow Therapy.

## Roadmap

La convergence vers le design cible Light / Dark est suivie dans :

```text
ROADMAP.md
```

La roadmap détaille les jalons, la checklist d'implémentation, les critères de sortie et la définition de Done globale.

## Modifier le contenu

Tous les textes, liens sociaux, contenus médias et l'URL publique sont centralisés dans :

```text
config/site.json
```

Le HTML ne contient pas de contenu éditorial statique. `app.js` charge la configuration et construit la page, la galerie média et sa visionneuse.

## Arborescence

```text
.
├── .github/workflows/pages.yml
├── assets/logo.svg
├── config/site.json
├── ROADMAP.md
├── app.js
├── index.html
└── styles.css
```

## Publication GitHub Pages

Le workflow `Deploy GitHub Pages` publie automatiquement la branche `main`.

Dans les paramètres du dépôt, sélectionner une seule fois :

```text
Settings → Pages → Build and deployment → Source: GitHub Actions
```

Adresse prévue :

```text
https://falcoer.github.io/flowtherapy-bio-website/
```

## QR code

Le bouton discret placé à côté du logo ouvre une vue plein écran et génère un QR code à partir de `site.url` dans `config/site.json`.

Lors du passage à un domaine personnalisé, modifier d'abord cette URL afin que le QR code pointe vers le domaine définitif.

## Développement local

Le chargement de JSON nécessite un serveur HTTP local :

```bash
python3 -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.
