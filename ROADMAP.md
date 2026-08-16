# Flow Therapy — Roadmap d'implémentation du design cible

Cette roadmap fixe comme référence visuelle le mockup validé présentant les variantes **Light** et **Dark** de la landing page Flow Therapy.

Le site doit rester :
- statique et compatible GitHub Pages ;
- responsive desktop/mobile ;
- piloté par `config/site.json` pour les contenus éditoriaux ;
- autonome : aucun asset essentiel ne doit dépendre d'un autre dépôt ;
- accessible et utilisable avec ou sans animations.

## État initial

La base fonctionnelle existe déjà : chargement JSON, sections éditoriales, liens sociaux, QR code et déploiement GitHub Pages.

La priorité actuelle est la **convergence visuelle vers le design cible**, puis l'industrialisation des assets et des thèmes.

---

## R1 — Assets de marque autonomes

Objectif : intégrer dans ce dépôt tous les éléments nécessaires au rendu cible.

- [ ] Extraire depuis le fichier Penpot les trois alpagas en PNG/WebP transparents.
- [ ] Extraire le fond urbain / watercolor clair transparent.
- [ ] Préparer son équivalent sombre ou une variante recolorisée contrôlée.
- [ ] Extraire le bandeau pinceau `Musique · Énergie · Émotion` sans texte fusionné lorsque possible.
- [ ] Intégrer le vrai logo Flow Therapy en version transparente haute définition.
- [ ] Préparer favicon / icône carrée dérivée du logo.
- [ ] Ajouter les icônes Instagram, YouTube et Facebook sous forme SVG locale.
- [ ] Supprimer toutes les dépendances d'assets vers `flowtherapy-animation-website`.
- [ ] Optimiser le poids des images sans perte visuelle notable.
- [ ] Documenter l'origine et l'usage de chaque asset dans `assets/README.md`.

**Critère de sortie :** le site peut être cloné et servi hors ligne sans perdre un élément visuel essentiel.

---

## R2 — Tokens et thèmes Light / Dark

Objectif : remplacer les couleurs dispersées par un système de thème cohérent avec le design validé.

- [ ] Définir les primitives de marque : noir, blanc, violet, orange, rose, bleu, crème, bleu nuit.
- [ ] Définir les tokens sémantiques : background, surface, text, muted, accent, border, CTA, focus.
- [ ] Créer les variables CSS du thème Light.
- [ ] Créer les variables CSS du thème Dark.
- [ ] Éviter les couleurs métier codées en dur dans les composants.
- [ ] Synchroniser les noms avec les tokens Figma/Penpot lorsque possible.
- [ ] Vérifier le contraste WCAG des textes, boutons et liens.
- [ ] Définir `color-scheme` correctement pour chaque thème.

**Critère de sortie :** le changement de thème modifie l'ensemble de l'interface sans duplication de structure HTML.

---

## R3 — Header et navigation

Objectif : reproduire la structure supérieure du design cible.

- [ ] Positionner le logo en haut à gauche.
- [ ] Ajouter la navigation : Accueil, Le groupe, Musique, Actualités, Presse, Contact.
- [ ] Ajouter l'état actif violet avec soulignement discret.
- [ ] Ajouter le switch Light / Dark en haut à droite.
- [ ] Conserver le bouton QR discret à proximité de la marque ou du switch.
- [ ] Rendre le header responsive.
- [ ] Prévoir une navigation mobile compacte sans dégrader le hero.
- [ ] Ajouter les ancres correspondantes aux sections réellement présentes.
- [ ] Masquer ou désactiver proprement les entrées dont le contenu n'existe pas encore.

**Critère de sortie :** header fidèle au mockup sur desktop, lisible et compact sur mobile.

---

## R4 — Hero fidèle au design cible

Objectif : obtenir la même hiérarchie visuelle que le mockup validé.

- [ ] Construire une grille desktop à deux zones : contenu à gauche, composition graphique à droite.
- [ ] Afficher `SENSIBLE.` en noir/blanc selon le thème.
- [ ] Afficher `INTENSE.` en violet.
- [ ] Afficher `VIVANT.` en orange.
- [ ] Ajuster graisse, chasse, interlignage et texture pour se rapprocher du rendu cible.
- [ ] Afficher le texte d'accroche sous le slogan.
- [ ] Ajouter le CTA principal `ÉCOUTER`.
- [ ] Ajouter le CTA secondaire `AGENDA`.
- [ ] Prévoir les destinations des CTA dans `config/site.json`.
- [ ] Positionner le watermark urbain derrière les alpagas.
- [ ] Composer les trois alpagas séparément afin de conserver le responsive.
- [ ] Ajouter le bandeau pinceau `Musique · Énergie · Émotion`.
- [ ] Ajouter Instagram / YouTube / Facebook sous la composition.
- [ ] Reproduire l'équilibre Light : crème, watercolor rose/orange/violet.
- [ ] Reproduire l'équilibre Dark : bleu nuit, magenta/violet/bleu.
- [ ] Éviter toute image unique aplatie du hero final.

**Critère de sortie :** comparaison côte à côte avec le mockup sans divergence majeure de composition, proportions ou hiérarchie.

---

## R5 — Responsive mobile

Objectif : conserver l'identité graphique plutôt que simplement empiler les blocs desktop.

- [ ] Définir un breakpoint principal mobile/tablette.
- [ ] Adapter le logo et le switch à une largeur étroite.
- [ ] Réorganiser slogan, texte et CTA avant ou autour de la composition graphique.
- [ ] Garder les trois alpagas lisibles sans recadrage destructif.
- [ ] Conserver le bandeau sans débordement horizontal.
- [ ] Adapter la taille des titres avec `clamp()`.
- [ ] Garantir des cibles tactiles d'au moins 44 px.
- [ ] Tester les formats 9:16 courants.
- [ ] Tester les largeurs 320, 375, 390, 430 et 768 px.

**Critère de sortie :** aucune barre de défilement horizontale et une composition visuelle cohérente en 9:16.

---

## R6 — Sections éditoriales

Objectif : prolonger le langage visuel du hero sans lui faire concurrence.

- [ ] Recomposer la section `Le groupe` à partir du contenu existant.
- [ ] Conserver tous les paragraphes dans `config/site.json`.
- [ ] Recomposer la section Presse avec cartes plus graphiques et moins génériques.
- [ ] Ajouter les trois liens presse existants.
- [ ] Préparer une section Musique configurable, même si elle est initialement minimale.
- [ ] Préparer une section Agenda configurable.
- [ ] Préparer une section Actualités configurable.
- [ ] Préparer une section Contact configurable.
- [ ] Ne pas afficher de section vide sans intention visuelle explicite.

**Critère de sortie :** navigation et sections visibles sont cohérentes et alimentées uniquement par la configuration.

---

## R7 — Configuration éditoriale

Objectif : conserver une séparation stricte entre rendu et contenu.

- [ ] Étendre `config/site.json` avec `navigation`.
- [ ] Ajouter les CTA du hero dans la configuration.
- [ ] Ajouter Facebook aux réseaux sociaux si l'URL officielle est disponible.
- [ ] Ajouter les champs `music`, `agenda`, `news`, `contact` de manière optionnelle.
- [ ] Ajouter les libellés du bandeau à la configuration.
- [ ] Garder les textes hors de `index.html` et `styles.css`.
- [ ] Fournir des valeurs de repli sûres en cas de champ optionnel absent.
- [ ] Valider le JSON au chargement et afficher une erreur exploitable en développement.

**Critère de sortie :** un changement éditorial courant ne nécessite aucune modification du HTML ou du CSS.

---

## R8 — Switch de thème

Objectif : comportement fiable et cohérent sur toutes les pages.

- [ ] Implémenter le switch visuel soleil / lune du mockup.
- [ ] Mémoriser le choix dans `localStorage`.
- [ ] Utiliser `prefers-color-scheme` comme valeur initiale en l'absence de choix utilisateur.
- [ ] Mettre à jour `meta[name="theme-color"]` au changement de thème.
- [ ] Fournir `aria-label`, état accessible et navigation clavier.
- [ ] Animer la transition de façon courte et non intrusive.
- [ ] Désactiver les transitions avec `prefers-reduced-motion`.

**Critère de sortie :** aucune flash incorrecte de thème au chargement et choix conservé entre deux visites.

---

## R9 — QR code et partage

Objectif : conserver le partage rapide sans perturber le design cible.

- [ ] Maintenir le bouton QR discret.
- [ ] Adapter la modale plein écran aux deux thèmes.
- [ ] Générer le QR depuis `site.url`.
- [ ] Vérifier la lisibilité du QR sur téléphone.
- [ ] Fermer par bouton, Échap et clic hors contenu.
- [ ] Bloquer correctement le scroll de fond pendant l'ouverture.
- [ ] Préparer la migration vers un futur domaine personnalisé sans changement de code.

**Critère de sortie :** QR utilisable et accessible sur desktop comme mobile.

---

## R10 — Qualité visuelle et accessibilité

Objectif : passer d'un prototype graphique à une page publiable.

- [ ] Comparer Light et Dark au mockup de référence à 1440 × 900.
- [ ] Comparer la version mobile à une cible 9:16.
- [ ] Vérifier contraste et lisibilité.
- [ ] Vérifier focus clavier visible.
- [ ] Ajouter des textes alternatifs utiles aux images non décoratives.
- [ ] Marquer comme décoratifs les watermarks et effets graphiques.
- [ ] Vérifier le comportement avec zoom navigateur 200 %.
- [ ] Vérifier `prefers-reduced-motion`.
- [ ] Vérifier qu'aucun texte important n'est intégré dans une image raster.

**Critère de sortie :** navigation complète au clavier et rendu stable à 200 % de zoom.

---

## R11 — Performance

Objectif : conserver une landing page légère malgré les illustrations.

- [ ] Convertir les PNG lourds en WebP/AVIF lorsqu'approprié, en conservant les sources maîtres si nécessaire.
- [ ] Fournir des dimensions intrinsèques aux images pour limiter le CLS.
- [ ] Précharger uniquement les assets critiques du hero.
- [ ] Charger paresseusement les médias sous la ligne de flottaison.
- [ ] Héberger localement les polices nécessaires lorsque leur licence le permet.
- [ ] Supprimer les dépendances JavaScript inutiles.
- [ ] Mesurer Lighthouse mobile et desktop.
- [ ] Viser Performance ≥ 90 sur la page statique en conditions normales.

**Critère de sortie :** hero affiché rapidement sans saut majeur de mise en page.

---

## R12 — Validation et publication

Objectif : rendre chaque évolution sûre à publier.

- [ ] Ajouter un contrôle syntaxique HTML/CSS/JS minimal en CI.
- [ ] Vérifier la validité de `config/site.json` en CI.
- [ ] Vérifier l'existence des assets référencés.
- [ ] Vérifier l'absence de liens internes cassés.
- [ ] Tester le build GitHub Pages.
- [ ] Vérifier le déploiement après chaque jalon significatif.
- [ ] Documenter l'URL publiée dans le README.
- [ ] Préparer la configuration du domaine personnalisé lorsque le domaine sera choisi.

**Critère de sortie :** pipeline vert et version publiée testée sur mobile et desktop.

---

# Ordre recommandé

1. **R1 — Assets autonomes**
2. **R2 — Tokens et thèmes**
3. **R3 — Header**
4. **R4 — Hero cible**
5. **R5 — Responsive mobile**
6. **R8 — Switch de thème**
7. **R7 — Configuration éditoriale**
8. **R6 — Sections éditoriales**
9. **R9 — QR et partage**
10. **R10 — Accessibilité / QA**
11. **R11 — Performance**
12. **R12 — CI et publication**

# Définition de Done globale

La roadmap est considérée comme terminée lorsque :

- [ ] le rendu Light desktop converge visuellement avec la cible ;
- [ ] le rendu Dark desktop converge visuellement avec la cible ;
- [ ] le rendu mobile conserve la même identité en 9:16 ;
- [ ] tous les assets essentiels sont hébergés dans ce dépôt ;
- [ ] tous les contenus éditoriaux restent configurables ;
- [ ] le switch Light/Dark est persistant et accessible ;
- [ ] le QR code fonctionne avec l'URL publique ;
- [ ] aucune dépendance graphique ne pointe vers un autre dépôt ;
- [ ] les contrôles CI sont verts ;
- [ ] GitHub Pages publie la version validée.
