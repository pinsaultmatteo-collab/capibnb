// Signale les pages du site à IndexNow (Bing, Yandex, Seznam, Naver…). Bing alimente aussi ChatGPT Search et Copilot.
// Usage, après un déploiement qui ajoute ou modifie des pages : node build/indexnow.mjs
// Les adresses viennent de site-internet/sitemap.xml ; la clé est servie à la racine du site (/<clé>.txt).

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(ROOT, 'build', 'build.mjs'), 'utf8');
const key = src.match(/indexNowKey: '([0-9a-f]+)'/)[1];
const host = 'conciergeriecapibnb.fr';
const sitemap = readFileSync(join(ROOT, 'site-internet', 'sitemap.xml'), 'utf8');
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const keyCheck = await fetch(`https://${host}/${key}.txt`);
if (!keyCheck.ok || (await keyCheck.text()).trim() !== key) {
  console.error(`La clé n'est pas encore en ligne sur https://${host}/${key}.txt : déployer d'abord.`);
  process.exit(1);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList }),
});
console.log(`IndexNow : ${res.status} ${res.statusText} pour ${urlList.length} adresses`);
// 200 ou 202 = reçu ; 422 = adresses hors du domaine ; 403 = clé introuvable ; 429 = trop de requêtes
process.exit(res.ok ? 0 : 1);
