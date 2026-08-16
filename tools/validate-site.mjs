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
  'assets/logo.jpg', 'assets/logo_transparent.png',
  'assets/alpaga1-nu.png', 'assets/alpaga1.png',
  'assets/alpaga2-nu.png', 'assets/alpaga2.png',
  'assets/alpaga3-nu.png', 'assets/alpaga3.png',
  'assets/fond-urbain-transparent.png',
  'assets/fonts/bangers-regular.woff2', 'assets/fonts/inter-variable.woff2',
  'assets/fonts/kalam-regular.woff2', 'assets/fonts/kalam-bold.woff2'
];
for (const file of required) {
  try { await stat(fromRoot(file)); } catch { problems.push(`${file} est introuvable`); }
}

const [app, css, html] = await Promise.all(['app.js', 'styles.css', 'index.html'].map(file => readFile(fromRoot(file), 'utf8')));
for (const [file, source] of [['app.js', app], ['styles.css', css], ['index.html', html]]) {
  expect(!source.includes('flowtherapy-animation-website'), `${file} ne doit pas référencer le dépôt historique d’assets`);
}
expect(!css.includes('fonts.googleapis.com') && !css.includes('fonts.gstatic.com'), 'les polices doivent être servies localement');
expect(css.includes("assets/fonts/inter-variable.woff2"), 'la police Inter générée doit être référencée');
expect(app.includes("const ASSET='assets/';") && app.includes('alpaga${n}-nu.png') && app.includes('alpaga${n}.png') && app.includes('setupAlpacaReveal'), 'le hero doit révéler les alpagas officiels nus puis costumés');
expect(css.includes('assets/fond-urbain-transparent.png'), 'le watermark local officiel doit être utilisé');

if (problems.length) throw new Error(`Validation du site échouée:\n- ${problems.join('\n- ')}`);
console.log(`Validation du site réussie : ${root}`);
