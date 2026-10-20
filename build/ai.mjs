// Fichiers destinés aux moteurs de recherche et assistants IA (ChatGPT, Claude, Perplexity, Copilot, Gemini…)
// - une version Markdown de chaque page indexable : /services.md, /blog/xxx.md, /index.md pour l'accueil ;
// - /llms.txt : présentation de CAPIBNB, faits clés et sommaire du site (format llmstxt.org) ;
// - /llms-full.txt : le texte intégral des pages (hors pages légales) dans un seul fichier ;
// - robots.txt : accès explicite des robots IA.

import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { estimate, displayValues } from '../site-internet/assets/js/simulateur.js';

// Éléments d'interface sans valeur textuelle (scène 3D, navigation de carrousel, CTA commun remplacé par le bloc contact…)
const UI_CLASSES = [
  'skip-link', 'breadcrumb', 'hero__scene', 'scroll-ind', 'scroller__nav', 'slider__nav', 'slider__dots', 'slider__count',
  'orbit', 'metiers__hint', 'tl__node', 'tlsmap', 'avatar', 'field', 'cta-final', 'plaque__oc',
];
const LEGAL = ['cgv', 'mentions-legales', 'confidentialite'];
const ORDER = ['', 'services', 'tarifs', 'simulateur', 'reglementation-airbnb-toulouse', 'a-propos', 'avis', 'contact', 'voyageurs', 'blog'];

const hasClass = (node, c) => (' ' + (node.getAttribute('class') || '') + ' ').includes(` ${c} `);
const inHeading = (node) => {
  for (let n = node.parentNode; n; n = n.parentNode) if (/^H[1-6]$/.test(n.nodeName)) return true;
  return false;
};

const td = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**',
  codeBlockStyle: 'fenced',
});
td.use(gfm);
td.remove(['script', 'style', 'svg', 'form', 'button', 'iframe', 'canvas', 'template', 'noscript', 'input', 'select', 'textarea', 'output']);
td.addRule('ui', {
  filter: (n) => n.getAttribute('aria-hidden') === 'true' || n.hasAttribute('hidden') || UI_CLASSES.some((c) => hasClass(n, c)),
  replacement: () => '',
});
// Questions de FAQ (dans un <button>) : titres de niveau 3
td.addRule('faq', {
  filter: (n) => n.nodeName === 'BUTTON' && hasClass(n, 'faq__q'),
  replacement: (content) => `\n\n### ${content.trim()}\n\n`,
});
// Titres : l'italique et les retours à la ligne sont décoratifs
td.addRule('headingInline', {
  filter: (n) => ['EM', 'I', 'BR'].includes(n.nodeName) && inHeading(n),
  replacement: (content, n) => (n.nodeName === 'BR' ? ' ' : content),
});
// Gras collé au texte voisin dans le HTML (« <strong>22 %</strong><span>de commission</span> ») : on rajoute l'espace
const startsWord = (t) => /^[^\s.,;:!?)»]/u.test(t || '');
const endsWord = (t) => /[^\s(«]$/u.test(t || '');
td.addRule('strong', {
  filter: ['strong', 'b'],
  replacement: (content, n) => {
    if (!content.trim()) return '';
    const before = endsWord(n.previousSibling?.textContent) ? ' ' : '';
    const after = startsWord(n.nextSibling?.textContent) ? ' ' : '';
    return `${before}**${content.trim()}**${after}`;
  },
});
// Tableaux sans ligne d'en-tête (que le plugin GFM laisserait en HTML) : une ligne « libellé : valeur » par rangée
td.addRule('tableWithoutHeader', {
  filter: (n) => n.nodeName === 'TABLE' && !n.querySelector('th'),
  replacement: (content, n) =>
    '\n\n' +
    Array.from(n.getElementsByTagName('tr'))
      .map((tr) => '- ' + Array.from(tr.getElementsByTagName('td')).map((c) => c.textContent.replace(/\s+/g, ' ').trim()).join(' : '))
      .join('\n') +
    '\n\n',
});
// Plaques de rue de l'accueil : une ligne de liste par quartier
td.addRule('plaque', {
  filter: (n) => n.nodeName === 'A' && hasClass(n, 'plaque'),
  replacement: (content, n) => {
    const name = n.getElementsByClassName('plaque__fr')[0]?.textContent.trim();
    const data = content.replace(name, '').replace(/\s+/g, ' ').trim();
    return `\n- [${name}](${n.getAttribute('href')}) : ${data}\n`;
  },
});
// Cartes cliquables (lien qui englobe titre et paragraphe) : le contenu, puis l'adresse
td.addRule('blockLink', {
  filter: (n) => n.nodeName === 'A' && /^https?:/.test(n.getAttribute('href') || '') && n.getElementsByTagName('h3').length + n.getElementsByTagName('p').length > 0,
  replacement: (content, n) => `\n\n${content.trim()}\n\n→ ${n.getAttribute('href')}\n\n`,
});
td.addRule('placeholderLink', {
  filter: (n) => n.nodeName === 'A' && !/^(https?:|mailto:|tel:)/.test(n.getAttribute('href') || ''),
  replacement: (content) => content,
});
td.addRule('image', {
  filter: 'img',
  replacement: (content, n) => {
    const alt = (n.getAttribute('alt') || '').trim();
    return alt ? `![${alt}](${n.getAttribute('src')})` : '';
  },
});

export const mdPath = (slug) => (slug ? `/${slug}.md` : '/index.md');
const pageTitle = (meta) => meta.title.replace(/\s*·\s*CAPIBNB$/, '');
const frDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

function contactBlock(SITE) {
  return `## Contacter CAPIBNB

- Téléphone : ${SITE.phone}
- E-mail : ${SITE.email}
- Adresse : ${SITE.address}
- Rendez-vous et estimation gratuite : ${SITE.url}/contact/
- Simulateur de revenus : ${SITE.url}/simulateur/`;
}

export function pageMarkdown(page, { SITE, url }) {
  const html = page.body.replace(/(href|src)="\/(?!\/)/g, `$1="${SITE.url}/`);
  let md = td
    .turndown(html)
    .replace(/[  ]/g, ' ')
    .replace(/[ \t]+$/gm, '')
    .replace(/^(- .+)\n\n(?=- )/gm, '$1\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  // le H1 de la page passe en tête, suivi de la description et de la source
  const h1 = md.match(/^# .+$/m);
  if (h1) md = md.replace(h1[0], '').trim();
  const post = (page.meta.jsonld || []).find((o) => o['@type'] === 'BlogPosting');
  let source = `> Source : ${url}`;
  if (post) {
    source += ` · Par ${post.author.name}, publié le ${frDate(post.datePublished)}`;
    if (post.dateModified && post.dateModified !== post.datePublished) source += `, mis à jour le ${frDate(post.dateModified)}`;
  }
  return [h1 ? h1[0] : `# ${pageTitle(page.meta)}`, '', `> ${page.meta.description}`, '>', source, '', md, '', '---', '', contactBlock(SITE), ''].join('\n');
}

function sortPages(pages) {
  const rank = (p) => (ORDER.includes(p.meta.slug) ? ORDER.indexOf(p.meta.slug) : ORDER.length);
  const main = pages.filter((p) => !LEGAL.includes(p.meta.slug) && !p.meta.slug.startsWith('blog/'));
  const blog = pages.filter((p) => p.meta.slug.startsWith('blog/'));
  const legal = pages.filter((p) => LEGAL.includes(p.meta.slug));
  return { main: main.sort((a, b) => rank(a) - rank(b)), blog, legal };
}

// Présentation et faits clés : uniquement des informations publiées sur le site
function intro(SITE) {
  const t2 = displayValues(estimate({}));
  return `# CAPIBNB, conciergerie Airbnb et Booking à Toulouse

> CAPIBNB est une conciergerie de location courte durée basée à Toulouse (${SITE.address}). Fondée en février 2024 par ${SITE.founder}, lui-même investisseur en courte durée, elle gère de A à Z les logements Airbnb et Booking de propriétaires toulousains, pour une commission unique de ${SITE.commission} du chiffre d’affaires des nuitées, hors frais de ménage.

## Faits clés

- Service : gestion complète de la location courte durée. Création et optimisation de l’annonce, photos, tarification dynamique, relation voyageurs 7 jours sur 7, ménage et linge à chaque rotation, réassort, petites réparations, démarches réglementaires, relevé mensuel et virement des revenus.
- Tarif : ${SITE.commission} du chiffre d’affaires des nuitées hors frais de ménage (les frais de ménage sont payés par le voyageur), plus un forfait consommables de 25 à 35 € par mois selon la taille du logement. Aucun frais d’inscription ni de lancement.
- Inclus dans la commission : linge de lit et de toilette, boîte à clés sécurisée (matériel et pose), livret d’accueil et guide de Toulouse, numéro d’enregistrement, changement d’usage, taxe de séjour, classement meublé de tourisme.
- Comparaison : les conciergeries toulousaines facturent en général 23 à 28 % TTC, et plus de 30 % pour les offres premium.
- Zone d’intervention : Toulouse intra-muros (Capitole, Carmes, Saint-Cyprien, Chalets, Minimes, Saint-Michel, Rangueil, Côte Pavée…) et la métropole : Blagnac, Seilh, Beauzelle, Aucamville, Fenouillet, Colomiers, Tournefeuille, Cugnaux, Portet-sur-Garonne, Balma, L’Union, Saint-Orens-de-Gameville, Labège, Ramonville-Saint-Agne, Castanet-Tolosan.
- Plateformes : Airbnb et Booking.
- Démarrage : prise de contact, visite gratuite du logement, signature du contrat de collaboration, préparation et mise en ligne de l’annonce.
- Estimation indicative du simulateur CAPIBNB : un T2 aux Carmes rapporte environ ${t2['net-month']} nets par mois (${t2['net-year']} par an) après commission et consommables, soit ${t2.ratio} le loyer d’une location longue durée équivalente (${t2.ld} par mois).
- Contact : ${SITE.phone} · ${SITE.email} · ${SITE.url}/contact/ (Dylan rappelle sous 24 h).
- Entreprise : CAPIBNB, SASU au capital de 500 €, SIREN ${SITE.siren}, TVA ${SITE.tva}, président ${SITE.founder}.

## Repères sur la location courte durée à Toulouse (2026)

- Environ 4 200 annonces actives en septembre 2026, contre 9 000 en 2016 et 6 000 fin 2024 (AirDNA, AirROI).
- −38,8 % d’annonces actives en 12 mois (AirDNA, septembre 2026).
- Taux d’occupation moyen de 67 %, en hausse (AirDNA) ; délai moyen de réservation de 36 jours (AirROI).
- Numéro d’enregistrement obligatoire sur toute annonce depuis le 20 mai 2026.
- Résidence principale : 120 nuits par an au maximum (Toulouse n’a pas abaissé le plafond à 90).
- Résidence secondaire ou investissement : autorisation de changement d’usage de Toulouse Métropole ; amende jusqu’à 50 000 € par logement sans autorisation.
- Fiscalité (revenus 2025 et suivants) : micro-BIC plafonné à 15 000 € avec 30 % d’abattement pour un meublé de tourisme non classé, 83 600 € avec 50 % pour un meublé classé.`;
}

const link = (p, SITE) => `- [${pageTitle(p.meta)}](${SITE.url}${p.meta.slug ? `/${p.meta.slug}/` : '/'}): ${p.meta.description}`;

export function llmsTxt(pages, SITE) {
  const { main, blog, legal } = sortPages(pages);
  return `${intro(SITE)}

## Pages du site

Chaque page existe aussi en Markdown : ajouter « .md » à l’adresse sans la barre finale (par exemple ${SITE.url}/tarifs.md, et ${SITE.url}/index.md pour l’accueil). Texte intégral du site : ${SITE.url}/llms-full.txt

${main.map((p) => link(p, SITE)).join('\n')}

## Guides et articles

${blog.map((p) => link(p, SITE)).join('\n')}

## Optional

${legal.map((p) => link(p, SITE)).join('\n')}
`;
}

export function llmsFullTxt(pages, SITE) {
  const { main, blog } = sortPages(pages);
  return [intro(SITE), ...[...main, ...blog].map((p) => p.markdown.trim())].join('\n\n---\n\n') + '\n';
}

// Robots des moteurs et assistants IA, nommés explicitement (même accès que les moteurs classiques)
const AI_BOTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai',
  'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'GoogleOther',
  'Applebot', 'Applebot-Extended',
  'Bingbot', 'DuckAssistBot', 'Amazonbot',
  'meta-externalagent', 'meta-externalfetcher',
  'MistralAI-User', 'cohere-ai', 'YouBot', 'CCBot',
];

export function robotsTxt(SITE) {
  const rules = `Allow: /\nDisallow: /api/\nDisallow: /php/\nContent-Signal: search=yes, ai-input=yes, ai-train=yes`;
  return `# conciergeriecapibnb.fr : moteurs de recherche et assistants IA bienvenus.
# Résumé du site pour les IA : ${SITE.url}/llms.txt

User-agent: *
${rules}

# Robots IA nommés explicitement (mêmes règles)
${AI_BOTS.map((b) => `User-agent: ${b}`).join('\n')}
${rules}

Sitemap: ${SITE.url}/sitemap.xml
`;
}
