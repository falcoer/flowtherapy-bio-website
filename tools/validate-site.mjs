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
  'index.html', 'styles.css', 'app.js', 'assets-manifest.json',
  'assets/logo.jpg', 'assets/generated/logo-transparent-320.png', 'assets/generated/logo-transparent-320.webp',
  'assets/generated/alpaga1-nu-640.avif', 'assets/generated/alpaga1-nu-768.avif', 'assets/generated/alpaga1-nu-1024.webp', 'assets/generated/alpaga1-640.avif', 'assets/generated/alpaga1-768.avif', 'assets/generated/alpaga1-1024.webp',
  'assets/generated/alpaga2-nu-640.avif', 'assets/generated/alpaga2-nu-768.avif', 'assets/generated/alpaga2-nu-1024.webp', 'assets/generated/alpaga2-640.avif', 'assets/generated/alpaga2-768.avif', 'assets/generated/alpaga2-1024.webp',
  'assets/generated/alpaga3-nu-640.avif', 'assets/generated/alpaga3-nu-768.avif', 'assets/generated/alpaga3-nu-1024.webp', 'assets/generated/alpaga3-640.avif', 'assets/generated/alpaga3-768.avif', 'assets/generated/alpaga3-1024.webp',
  'assets/generated/fond-urbain-transparent-960.avif', 'assets/generated/fond-urbain-transparent-1440.png',
  'assets/fonts/bangers-regular.woff2', 'assets/fonts/inter-variable.woff2',
  'assets/fonts/kalam-regular.woff2', 'assets/vendor/qrcodejs/qrcode.min.js',
  'assets/vendor/qrcodejs/LICENSE'
];
for (const file of required) {
  try { await stat(fromRoot(file)); } catch { problems.push(`${file} est introuvable`); }
}
for (const file of ['assets/alpaga1-nu.png', 'assets/alpaga2-nu.png', 'assets/alpaga3-nu.png', 'assets/alpaga1.png', 'assets/alpaga2.png', 'assets/alpaga3.png', 'assets/logo_transparent.png', 'assets/fond-urbain-transparent.png']) {
  try { await stat(fromRoot(file)); problems.push(`${file} est une source maîtresse et ne doit pas être publiée`); } catch {}
}

const [app, css, html, generatedManifest] = await Promise.all([
  ...['app.js', 'styles.css', 'index.html'].map(file => readFile(fromRoot(file), 'utf8')),
  readFile(fromRoot('assets-manifest.json'), 'utf8').then(JSON.parse)
]);
for (const [file, source] of [['app.js', app], ['styles.css', css], ['index.html', html]]) {
  expect(!source.includes('flowtherapy-animation-website'), `${file} ne doit pas référencer le dépôt historique d’assets`);
}
expect(!css.includes('fonts.googleapis.com') && !css.includes('fonts.gstatic.com'), 'les polices doivent être servies localement');
expect(!html.includes('cdn.jsdelivr.net') && !app.includes('cdn.jsdelivr.net'), 'le runtime ne doit plus dépendre du CDN QR code');
expect(css.includes("assets/fonts/inter-variable.woff2"), 'la police Inter générée doit être référencée');
expect(!css.includes('kalam-bold.woff2'), 'la variante Kalam Bold inutilisée ne doit pas être publiée');
expect(app.includes('loadQrCode') && app.includes('vendor/qrcodejs/qrcode.min.js'), 'le QR code doit être chargé localement et à la demande');
expect(app.includes('type="image/avif"') && app.includes('type="image/webp"') && app.includes('srcset='), 'les images responsives doivent proposer AVIF, WebP et un srcset PNG');
expect(app.includes("const ASSET='assets/';") && app.includes('responsivePicture(`alpaga${n}-nu`,[640,768,1024]') && app.includes('mountCostumes') && app.includes('decodeImage') && app.includes('ALPACA_NUDE_HOLD_MS=1800') && app.includes('IntersectionObserver') && app.includes('setupAlpacaReveal'), 'le hero doit révéler les alpagas nus et charger les costumes produits par la CI seulement avant la transition');
expect(css.includes('assets/generated/fond-urbain-transparent-960.avif'), 'le watermark responsive généré en CI doit être utilisé');
expect(css.includes('@media(max-width:790px){.watermark') && css.includes('fond-urbain-transparent-960.webp'), 'le mobile doit utiliser le filigrane CI le plus léger');
const subsetFonts = generatedManifest.assets.filter(asset => asset.mode === 'woff2-subset');
expect(subsetFonts.length === 3, 'exactement trois sous-ensembles WOFF2 doivent être générés');
expect(subsetFonts.reduce((total, asset) => total + asset.bytes, 0) <= 200_000, 'le budget total des polices WOFF2 est limité à 200 ko');

if (problems.length) throw new Error(`Validation du site échouée:\n- ${problems.join('\n- ')}`);
console.log(`Validation du site réussie : ${root}`);
