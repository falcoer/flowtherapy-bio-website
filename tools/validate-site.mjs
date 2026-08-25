import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.argv[2] ? resolve(process.argv[2]) : resolve(new URL('..', import.meta.url).pathname);
const fromRoot = file => new URL(file, `${pathToFileURL(root).href}/`);
const config = JSON.parse(await readFile(fromRoot('config/site.json'), 'utf8'));
const problems = [];
const expect = (condition, message) => { if (!condition) problems.push(message); };
const isHttpUrl = value => { try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; } };

expect(config.site?.name, 'site.name est requis');
expect(isHttpUrl(config.site?.url), 'site.url doit être une URL HTTP(S)');
expect(Array.isArray(config.hero?.lines) && config.hero.lines.length === 3, 'hero.lines doit contenir exactement trois lignes');
expect(Array.isArray(config.navigation) && config.navigation.length > 0, 'navigation doit contenir au moins une entrée');
expect(Array.isArray(config.socials) && config.socials.length > 0, 'socials doit contenir au moins une entrée');
for (const [index, item] of (config.socials || []).entries()) expect(isHttpUrl(item.url), `socials[${index}].url doit être une URL HTTP(S)`);

const required = [
  'index.html', 'fr/index.html', 'en/index.html', 'es/index.html', 'it/index.html', 'de/index.html', 'pt/index.html', 'zh/index.html', 'ja/index.html', 'styles.css', 'app.js', 'travel-landscapes.css', 'travel-landscapes.js', 'i18n/fr.json', 'i18n/en.json', 'i18n/es.json', 'i18n/it.json', 'i18n/de.json', 'i18n/pt.json', 'i18n/zh.json', 'i18n/ja.json', 'i18n-preview/index.html', 'i18n-preview/app.js', 'i18n-preview/preview.css', 'i18n-preview/fr/index.html', 'i18n-preview/en/index.html', 'i18n-preview/es/index.html', 'i18n-preview/it/index.html', 'i18n-preview/de/index.html', 'i18n-preview/pt/index.html', 'i18n-preview/zh/index.html', 'i18n-preview/ja/index.html', 'assets-manifest.json',
  'assets/logo.jpg', 'assets/generated/logo-transparent-320.png', 'assets/generated/logo-transparent-320.webp',
  'assets/generated/alpaga1-nu-640.avif', 'assets/generated/alpaga1-nu-768.avif', 'assets/generated/alpaga1-nu-1024.webp', 'assets/generated/alpaga1-640.avif', 'assets/generated/alpaga1-768.avif', 'assets/generated/alpaga1-1024.webp',
  'assets/generated/alpaga2-nu-640.avif', 'assets/generated/alpaga2-nu-768.avif', 'assets/generated/alpaga2-nu-1024.webp', 'assets/generated/alpaga2-640.avif', 'assets/generated/alpaga2-768.avif', 'assets/generated/alpaga2-1024.webp',
  'assets/generated/alpaga3-nu-640.avif', 'assets/generated/alpaga3-nu-768.avif', 'assets/generated/alpaga3-nu-1024.webp', 'assets/generated/alpaga3-640.avif', 'assets/generated/alpaga3-768.avif', 'assets/generated/alpaga3-1024.webp',
  'assets/generated/fond-urbain-transparent-960.avif', 'assets/generated/fond-urbain-transparent-1440.png',
  'assets/decorations/chalk-arrow.svg', 'assets/decorations/chalk-heart.svg', 'assets/decorations/chalk-paint-splash.svg',
  'assets/decorations/chalk-spark.svg', 'assets/decorations/chalk-star.svg', 'assets/decorations/chalk-swoosh.svg', 'assets/decorations/chalk-underline.svg', 'assets/decorations/flowtherapymusic-qr.png',
  'assets/fonts/bangers-regular.woff2', 'assets/fonts/inter-variable.woff2',
  'assets/fonts/kalam-regular.woff2'
];
for (const file of required) {
  try { await stat(fromRoot(file)); } catch { problems.push(`${file} est introuvable`); }
}
for (const [index, item] of (config.media?.items || []).entries()) {
  expect(item.title && item.type && item.orientation && item.ratio && item.date && item.credit && item.description, `media.items[${index}] doit contenir toutes les métadonnées éditoriales`);
  expect(item.asset && Array.isArray(item.widths) && item.widths.length >= 4, `media.items[${index}] doit référencer un asset responsive et au moins quatre largeurs`);
  expect(item.widths?.includes(320) && item.widths?.includes(480), `media.items[${index}] doit proposer les variantes mobiles 320 et 480 px`);
  for (const width of (item.widths || [])) {
    for (const extension of ['avif', 'webp', 'jpg']) {
      const file = `assets/media/${item.asset}-${width}.${extension}`;
      try { await stat(fromRoot(file)); } catch { problems.push(`${file} est introuvable`); }
    }
  }
}
for (const id of ['urban', 'himalaya', 'city', 'amazonia', 'caribbean']) {
  for (const width of [960, 1440, 1672]) {
    for (const extension of ['avif', 'webp', 'png']) {
      const file = `assets/generated/landscape-${id}-${width}.${extension}`;
      try { await stat(fromRoot(file)); } catch { problems.push(`${file} est introuvable`); }
    }
  }
}
for (const file of ['assets/alpaga1-nu.png', 'assets/alpaga2-nu.png', 'assets/alpaga3-nu.png', 'assets/alpaga1.png', 'assets/alpaga2.png', 'assets/alpaga3.png', 'assets/logo_transparent.png', 'assets/fond-urbain-transparent.png']) {
  try { await stat(fromRoot(file)); problems.push(`${file} est une source maîtresse et ne doit pas être publiée`); } catch {}
}

const [app, css, html, rootFrHtml, rootEnHtml, travelScript, qrPng, generatedManifest] = await Promise.all([
  ...['app.js', 'styles.css', 'index.html', 'fr/index.html', 'en/index.html', 'travel-landscapes.js'].map(file => readFile(fromRoot(file), 'utf8')),
  readFile(fromRoot('assets/decorations/flowtherapymusic-qr.png')),
  readFile(fromRoot('assets-manifest.json'), 'utf8').then(JSON.parse)
]);
for (const [file, source] of [['app.js', app], ['styles.css', css], ['index.html', html]]) {
  expect(!source.includes('flowtherapy-animation-website'), `${file} ne doit pas référencer le dépôt historique d’assets`);
}
expect(!css.includes('fonts.googleapis.com') && !css.includes('fonts.gstatic.com'), 'les polices doivent être servies localement');
expect(!html.includes('cdn.jsdelivr.net') && !app.includes('cdn.jsdelivr.net'), 'le runtime ne doit plus dépendre du CDN QR code');
expect(css.includes("assets/fonts/inter-variable.woff2"), 'la police Inter générée doit être référencée');
expect(css.includes('.prose,.contact-heading .contact-intro,.media-meta p{text-align:justify') && css.includes('hyphens:auto'), 'les principaux textes éditoriaux doivent être justifiés avec césure automatique');
expect(!css.includes('kalam-bold.woff2'), 'la variante Kalam Bold inutilisée ne doit pas être publiée');
expect(css.includes('.language-switcher{position:relative}') && css.includes('.language-menu{position:absolute'), 'le sélecteur de langue doit être intégré aux styles publics');
expect(html.includes('assets/decorations/flowtherapymusic-qr.png?v=') && qrPng.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && qrPng.byteLength >= 100_000 && !app.includes('QRCode'), 'le QR code canonique doit être un PNG autonome HD, versionné et sans génération côté client');
expect(app.includes("const LOCALES={fr:{flag:'🇫🇷'},en:{flag:'🇬🇧'},es:{flag:'🇪🇸'},it:{flag:'🇮🇹'},de:{flag:'🇩🇪'},pt:{flag:'🇵🇹'},zh:{flag:'🇨🇳'},ja:{flag:'🇯🇵'}}") && app.includes("window.history[historyMode==='replace'?'replaceState':'pushState']"), 'la racine publique doit changer de langue sans rechargement');
expect(app.includes("const I18N_URL=locale=>new URL('i18n/'+locale+'.json',SITE_ROOT)") && app.includes("const localePath=locale=>new URL(locale+'/',SITE_ROOT).pathname"), 'la racine publique doit résoudre les traductions et les routes localisées');
expect(app.includes('function setupQr()') && !app.includes('new QRCode'), 'la modale QR doit afficher l’asset canonique sans régénération');
expect(/src="app\.js\?v=[^"]+"/.test(html), 'la racine publique doit charger un runtime internationalisé versionné');
expect(rootFrHtml.includes('src="../app.js') && rootFrHtml.includes('href="../styles.css') && rootFrHtml.includes('<html lang="fr">'), 'la route publique française doit utiliser les chemins localisés');
expect(rootEnHtml.includes('src="../app.js') && rootEnHtml.includes('href="../styles.css') && rootEnHtml.includes('<html lang="en">'), 'la route publique anglaise doit utiliser les chemins localisés');
expect(app.includes('<section id="contact"') && app.includes('href="#contact"') && app.includes('id="contact-form"'), 'le formulaire de contact doit être intégré au flux de la page et accessible depuis le bouton enveloppe');
expect(!html.includes('contact-dialog') && !app.includes('contact-footer-open') && !css.includes('.contact-dialog'), 'le formulaire de contact ne doit plus utiliser de modale ni de raccourci dans le pied de page');
expect(app.includes('type="image/avif"') && app.includes('type="image/webp"') && app.includes('srcset='), 'les images responsives doivent proposer AVIF, WebP et un srcset PNG');
expect(app.includes('(max-width: 520px) calc(50vw - 12px)') && app.includes('(max-width: 900px) calc(33vw - 18px)'), 'la galerie doit annoncer au navigateur les dimensions réelles de ses colonnes mobiles');
expect(app.includes("const ASSET=new URL('assets/',SITE_ROOT).href;") && app.includes('responsivePicture(`alpaga${n}-nu`,[640,768,1024]') && app.includes('mountCostumes') && app.includes('decodeImage') && app.includes('ALPACA_NUDE_HOLD_MS=1800') && app.includes('IntersectionObserver') && app.includes('setupAlpacaReveal'), 'le hero doit révéler les alpagas nus et charger les costumes produits par la CI seulement avant la transition');
expect(css.includes('assets/generated/fond-urbain-transparent-960.avif'), 'le watermark responsive généré en CI doit être utilisé');
expect(css.includes('@media(max-width:790px){.watermark') && css.includes('fond-urbain-transparent-960.webp'), 'le mobile doit utiliser le filigrane CI le plus léger');
expect(app.includes('class="doodle-field hero-doodles"') && app.includes('class="doodle-field section-doodles"') && app.includes('aria-hidden="true"'), 'les décorations à la craie doivent rester des arrière-plans purement décoratifs');
expect(css.includes("assets/decorations/chalk-star.svg") && css.includes("assets/decorations/chalk-heart.svg") && css.includes("assets/decorations/chalk-arrow.svg") && css.includes("assets/decorations/chalk-paint-splash.svg"), 'les décorations générées par la CI doivent être utilisées par le site');
expect(css.includes('-webkit-mask:var(--doodle-image)') && css.includes('mask:var(--doodle-image)'), 'les SVG de décoration doivent être colorés par le thème avec un masque compatible Safari');
expect(css.includes(':root[data-theme=dark] .doodle{opacity:calc(var(--doodle-alpha) + .06)') && css.includes('@media(prefers-reduced-motion:reduce){.doodle'), 'les décorations doivent gérer le thème sombre et la réduction des animations');
const subsetFonts = generatedManifest.assets.filter(asset => asset.mode === 'woff2-subset');
const generatedOutputs = generatedManifest.assets.filter(asset => asset.output);
expect(typeof generatedManifest.built_at === 'string' && !Number.isNaN(Date.parse(generatedManifest.built_at)), 'le manifeste doit exposer une date de build ISO valide');
expect(generatedOutputs.every(asset => asset.source_sha256 && asset.build_key), 'chaque asset généré doit contenir les empreintes nécessaires au cache incrémental');
expect(subsetFonts.length === 3, 'exactement trois sous-ensembles WOFF2 doivent être générés');
expect(subsetFonts.reduce((total, asset) => total + asset.bytes, 0) <= 200_000, 'le budget total des polices WOFF2 est limité à 200 ko');
const responsiveMedia = generatedManifest.assets.filter(asset => asset.mode === 'responsive-media-ci');
const mediaBySource = Map.groupBy(responsiveMedia, asset => asset.source);
for (const [source, variants] of mediaBySource) {
  const widths = new Set(variants.map(asset => asset.width));
  expect(widths.has(320) && widths.has(480), `${source} doit être généré en 320 et 480 px`);
  expect(variants.length === widths.size * 3, `${source} doit proposer AVIF, WebP et JPEG pour chaque largeur`);
}
expect(travelScript.includes('const mounted = new Map()') && travelScript.includes('replaceRenderedLandscapes(pair)') && !travelScript.includes('LANDSCAPES.map(pictureMarkup)'), 'la roue doit limiter le DOM rendu à la paire de paysages active');
expect(travelScript.includes("link.rel = 'preload'") && travelScript.includes("link.fetchPriority = 'low'"), 'les paysages suivants doivent être préchargés progressivement pendant le défilement');
const responsiveLandscapes = generatedManifest.assets.filter(asset => asset.mode === 'responsive-landscape-ci');
expect(responsiveLandscapes.length === 45, 'exactement 45 variantes de paysage doivent être générées');
expect(responsiveLandscapes.filter(asset => asset.format === 'avif').every(asset => asset.quality === 64), 'les paysages AVIF doivent utiliser la qualité mobile optimisée');
expect(responsiveLandscapes.filter(asset => asset.format === 'webp').every(asset => asset.quality === 72), 'la qualité WebP des paysages doit rester inchangée');
const excludedMedia = generatedManifest.assets.filter(asset => asset.mode === 'excluded-source');
expect(excludedMedia.length === 1, 'la capture d’écran mobile doit rester indexée mais exclue de la galerie');
const decorations = generatedManifest.assets.filter(asset => asset.mode === 'svg-mask-ci');
expect(decorations.length === 7, 'exactement sept décorations SVG doivent être générées');
expect(decorations.reduce((total, asset) => total + asset.bytes, 0) <= 15_000, 'le budget total des décorations SVG est limité à 15 ko');


const localeCodes = ['fr', 'en', 'es', 'it', 'de', 'pt', 'zh', 'ja'];
const [previewApp, previewRootHtml] = await Promise.all([
  readFile(fromRoot('i18n-preview/app.js'), 'utf8'),
  readFile(fromRoot('i18n-preview/index.html'), 'utf8')
]);
expect(previewApp.includes("const LOCALES={fr:{flag:'🇫🇷'},en:{flag:'🇬🇧'},es:{flag:'🇪🇸'},it:{flag:'🇮🇹'},de:{flag:'🇩🇪'},pt:{flag:'🇵🇹'},zh:{flag:'🇨🇳'},ja:{flag:'🇯🇵'}}") && previewApp.includes("window.history[historyMode==='replace'?'replaceState':'pushState']"), 'la préversion doit changer entre toutes les langues sans rechargement');
expect(previewApp.includes("new URL('assets/',SITE_ROOT)") && previewApp.includes("new URL('config/site.json',SITE_ROOT)"), 'la préversion doit résoudre ses ressources depuis la racine du site');
expect(/src="app\.js\?v=[^"]+"/.test(previewRootHtml), 'la racine de préversion doit charger son runtime isolé versionné');
expect(previewRootHtml.includes('../assets/decorations/flowtherapymusic-qr.png?v=') && !previewApp.includes('QRCode'), 'la préversion doit utiliser le QR code canonique statique versionné');

const localizedCopies = {};
for (const locale of localeCodes) {
  const [rootLocalizedHtml, previewLocalizedHtml, copy] = await Promise.all([
    readFile(fromRoot(`${locale}/index.html`), 'utf8'),
    readFile(fromRoot(`i18n-preview/${locale}/index.html`), 'utf8'),
    readFile(fromRoot(`i18n/${locale}.json`), 'utf8').then(JSON.parse)
  ]);
  localizedCopies[locale] = copy;
  expect(rootLocalizedHtml.includes('src="../app.js') && rootLocalizedHtml.includes('href="../styles.css') && rootLocalizedHtml.includes(`<html lang="${locale}">`), `la route publique ${locale} doit utiliser les chemins localisés`);
  expect(previewLocalizedHtml.includes('src="../app.js') && previewLocalizedHtml.includes('href="../../styles.css') && previewLocalizedHtml.includes(`<html lang="${locale}">`), `la route de préversion ${locale} doit utiliser les chemins localisés`);
  expect(Object.keys(copy.media?.items || {}).length === config.media.items.length, `la langue ${locale} doit traduire chaque média`);
  expect(Object.keys(copy.controls?.languages || {}).join(',') === localeCodes.join(','), `la langue ${locale} doit proposer les huit langues`);
}
const subjectKeys = Object.keys(localizedCopies.fr.contact?.subjects || {}).join(',');
for (const locale of localeCodes) expect(Object.keys(localizedCopies[locale].contact?.subjects || {}).join(',') === subjectKeys, `les sujets de contact ${locale} doivent partager les mêmes identifiants`);

if (problems.length) throw new Error(`Validation du site échouée:\n- ${problems.join('\n- ')}`);
console.log(`Validation du site réussie : ${root}`);
