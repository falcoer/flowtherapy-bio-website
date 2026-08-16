import { readFile, stat } from 'node:fs/promises';

const config = JSON.parse(await readFile(new URL('../config/site.json', import.meta.url), 'utf8'));
const problems = [];
const expect = (condition, message) => { if (!condition) problems.push(message); };
const isHttpUrl = value => { try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; } };

expect(config.site?.name, 'site.name est requis');
expect(isHttpUrl(config.site?.url), 'site.url doit être une URL HTTP(S)');
expect(Array.isArray(config.hero?.lines) && config.hero.lines.length === 3, 'hero.lines doit contenir exactement trois lignes');
expect(Array.isArray(config.navigation) && config.navigation.length > 0, 'navigation doit contenir au moins une entrée');
expect(Array.isArray(config.socials) && config.socials.length > 0, 'socials doit contenir au moins une entrée');
for (const [index, item] of (config.socials || []).entries()) expect(isHttpUrl(item.url), `socials[${index}].url doit être une URL HTTP(S)`);

for (const file of ['index.html', 'styles.css', 'app.js', 'assets/logo.jpg', 'assets/alpaga1-nu.png', 'assets/alpaga2-nu.png', 'assets/alpaga3-nu.png', 'assets/fond-urbain-transparent.png']) {
  try { await stat(new URL(`../${file}`, import.meta.url)); } catch { problems.push(`${file} est introuvable`); }
}

const [app, css, html] = await Promise.all(['app.js', 'styles.css', 'index.html'].map(file => readFile(new URL(`../${file}`, import.meta.url), 'utf8')));
for (const [file, source] of [['app.js', app], ['styles.css', css], ['index.html', html]]) {
  expect(!source.includes('flowtherapy-animation-website'), `${file} ne doit pas référencer le dépôt historique d’assets`);
}
expect(app.includes("const ASSET='assets/';") && app.includes('alpaga1-nu.png') && app.includes('alpaga2-nu.png') && app.includes('alpaga3-nu.png'), 'le hero doit utiliser les alpagas officiels nus');
expect(css.includes('assets/fond-urbain-transparent.png'), 'le watermark local officiel doit être utilisé');

if (problems.length) throw new Error(`Validation du site échouée:\n- ${problems.join('\n- ')}`);
console.log('Validation du site réussie.');
