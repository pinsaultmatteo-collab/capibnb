// Build statique du site CAPIBNB
// Usage : node build/build.mjs
// Lit build/pages/*.html (front-matter JSON en tête), enveloppe chaque page
// dans le gabarit commun (head SEO, header, footer) et écrit dans site-internet/.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { partials, logoDefs } from './partials.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PAGES_DIR = join(__dirname, 'pages');
const OUT = join(ROOT, 'site-internet');

export const SITE = {
  url: 'https://conciergeriecapibnb.fr',
  name: 'CAPIBNB',
  legalName: 'CAPIBNB',
  tagline: 'Conciergerie Airbnb & Booking à Toulouse',
  phone: '+33 6 19 48 59 05',
  phoneHref: 'tel:+33619485905',
  email: 'contact@conciergeriecapibnb.fr',
  address: '23 rue des Changes, 31000 Toulouse',
  siren: '984 891 671',
  tva: 'FR26984891671',
  founder: 'Dylan Carvalho',
  commission: '22 % TTC',
  ogImage: '/assets/img/og-capibnb.jpg',
  instagram: '#', // TODO : lien réel à récupérer auprès de Dylan
  facebook: '#',  // TODO : lien réel à récupérer auprès de Dylan
  google: '#',    // TODO : lien fiche Google Business
  airbnb: '#',    // TODO : profil hôte Airbnb
  booking: '#',   // TODO : profil Booking
};

const NAV = [
  { href: '/services/', label: 'Services' },
  { href: '/tarifs/', label: 'Tarifs' },
  { href: '/simulateur/', label: 'Simulateur' },
  { href: '/a-propos/', label: 'À propos' },
  { href: '/reglementation-airbnb-toulouse/', label: 'Réglementation' },
  { href: '/avis/', label: 'Avis' },
  { href: '/blog/', label: 'Blog' },
];

const FOOTER_COLS = [
  {
    title: 'Propriétaires',
    links: [
      ['/services/', 'Nos services'],
      ['/tarifs/', 'Tarifs : 22 % TTC tout compris'],
      ['/simulateur/', 'Simulateur de revenus'],
      ['/reglementation-airbnb-toulouse/', 'Réglementation à Toulouse'],
      ['/avis/', 'Avis clients'],
    ],
  },
  {
    title: 'CAPIBNB',
    links: [
      ['/a-propos/', 'Dylan & l’histoire'],
      ['/voyageurs/', 'Espace voyageurs'],
      ['/blog/', 'Blog'],
      ['/contact/', 'Contact'],
    ],
  },
  {
    title: 'Légal',
    links: [
      ['/mentions-legales/', 'Mentions légales'],
      ['/confidentialite/', 'Confidentialité'],
      ['/cgv/', 'CGV'],
    ],
  },
];

function parsePage(src, file) {
  const m = src.match(/^\s*<!--\s*meta\s*([\s\S]*?)-->/);
  if (!m) throw new Error(`Front-matter manquant dans ${file}`);
  const meta = JSON.parse(m[1]);
  const body = src.slice(m[0].length).trim();
  return { meta, body };
}

function expandPartials(html, ctx) {
  return html.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
    const p = partials[name];
    if (p) return typeof p === 'function' ? p(ctx) : p;
    // {{> iconCamera}} -> icône "camera"
    const m = name.match(/^icon([A-Z]\w*)$/);
    if (m) return partials.icon(m[1][0].toLowerCase() + m[1].slice(1));
    throw new Error(`Partiel inconnu : ${name}`);
  });
}

function canonical(slug) {
  return slug ? `${SITE.url}/${slug}/` : `${SITE.url}/`;
}

function isActive(href, slug) {
  const path = '/' + (slug ? slug + '/' : '');
  if (href === '/') return path === '/';
  return path.startsWith(href);
}

function header(meta) {
  const links = NAV.map(
    (n) =>
      `<li><a href="${n.href}"${isActive(n.href, meta.slug) ? ' aria-current="page"' : ''}>${n.label}</a></li>`
  ).join('');
  return `
<a class="skip-link" href="#contenu">Aller au contenu</a>
<header class="site-header${meta.darkHero ? ' site-header--on-dark' : ''}" data-header>
  <div class="container site-header__inner">
    <a href="/" class="brand" aria-label="CAPIBNB, accueil">
      ${partials.logoMark}
      <span class="brand__word">CAPI<span>BNB</span></span>
    </a>
    <nav class="site-nav" aria-label="Navigation principale">
      <ul>${links}</ul>
    </nav>
    <div class="site-header__actions">
      <a href="${SITE.phoneHref}" class="site-header__phone" aria-label="Appeler Dylan">${partials.icon('phone')}<span>06 19 48 59 05</span></a>
      <a href="/contact/" class="btn btn--primary btn--sm" data-magnetic>Parler à Dylan</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="menu-mobile" aria-label="Ouvrir le menu" data-nav-toggle>
        <span></span><span></span>
      </button>
    </div>
  </div>
  <div class="menu-mobile" id="menu-mobile" data-menu-mobile>
    <div class="menu-mobile__inner container">
      <ul class="menu-mobile__links">
        <li><a href="/">Accueil</a></li>
        ${NAV.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}
        <li><a href="/voyageurs/">Voyageurs</a></li>
        <li><a href="/contact/">Contact</a></li>
      </ul>
      <div class="menu-mobile__foot">
        <a href="/simulateur/" class="btn btn--primary">Simuler mes revenus</a>
        <a href="${SITE.phoneHref}" class="btn btn--ghost-light">06 19 48 59 05</a>
      </div>
    </div>
  </div>
</header>`;
}

function footer() {
  const cols = FOOTER_COLS.map(
    (c) => `
      <div class="footer__col">
        <h3 class="footer__title">${c.title}</h3>
        <ul>${c.links.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul>
      </div>`
  ).join('');
  const year = new Date().getFullYear();
  return `
<footer class="site-footer">
  <div class="container">
    <div class="footer__top">
      <div class="footer__brand">
        <a href="/" class="brand brand--footer" aria-label="CAPIBNB">
          ${partials.logoMark}
          <span class="brand__word">CAPI<span>BNB</span></span>
        </a>
        <p class="footer__pitch">Conciergerie de location courte durée à Toulouse. Un investisseur toulousain gère votre bien comme le sien : annonces, prix, voyageurs, ménage, administratif.</p>
        <address class="footer__address">
          <a href="https://maps.google.com/?q=23+rue+des+Changes+31000+Toulouse" target="_blank" rel="noopener">${SITE.address}</a>
          <a href="${SITE.phoneHref}">${SITE.phone}</a>
          <a href="mailto:${SITE.email}">${SITE.email}</a>
        </address>
        <div class="footer__social">
          <a href="${SITE.instagram}" aria-label="Instagram" rel="noopener">${partials.icon('instagram')}</a>
          <a href="${SITE.facebook}" aria-label="Facebook" rel="noopener">${partials.icon('facebook')}</a>
          <a href="${SITE.google}" aria-label="Avis Google" rel="noopener">${partials.icon('google')}</a>
        </div>
      </div>
      ${cols}
    </div>
    <div class="footer__bottom">
      <p>© ${year} ${SITE.legalName} · SASU au capital de 500 € · SIREN ${SITE.siren} · Toulouse</p>
      <p class="footer__credit">Site conçu par <a href="https://pmc-marketing.fr" rel="noopener" target="_blank">PMC Marketing</a></p>
    </div>
  </div>
</footer>`;
}

function jsonLd(meta) {
  const base = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE.url}/#business`,
    name: 'CAPIBNB',
    alternateName: 'Conciergerie CAPIBNB',
    description:
      'Conciergerie Airbnb et Booking à Toulouse : gestion complète de votre location courte durée pour 22 % TTC tout compris.',
    url: SITE.url,
    telephone: SITE.phone,
    email: SITE.email,
    image: SITE.url + SITE.ogImage,
    logo: SITE.url + '/assets/img/logo-capibnb.png',
    priceRange: '22 % TTC du chiffre d’affaires',
    founder: { '@type': 'Person', name: SITE.founder, jobTitle: 'Président' },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '23 rue des Changes',
      postalCode: '31000',
      addressLocality: 'Toulouse',
      addressCountry: 'FR',
    },
    geo: { '@type': 'GeoCoordinates', latitude: 43.6005, longitude: 1.4441 },
    areaServed: [
      { '@type': 'City', name: 'Toulouse' },
      { '@type': 'AdministrativeArea', name: 'Toulouse Métropole' },
    ],
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '08:00',
      closes: '21:00',
    },
    sameAs: [],
  };
  const list = [base, ...(meta.jsonld || [])];
  return list
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`)
    .join('\n');
}

function layout({ meta, body }) {
  const url = canonical(meta.slug);
  const title = meta.title.includes('CAPIBNB') ? meta.title : `${meta.title} · CAPIBNB`;
  const scripts = (meta.scripts || [])
    .map((s) => `<script type="module" src="${s}"></script>`)
    .join('\n');
  return `<!doctype html>
<html lang="fr" class="no-js${meta.darkHero ? ' has-dark-hero' : ''}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${meta.description}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${meta.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large'}">
<meta name="theme-color" content="${meta.darkHero ? '#161d1d' : '#faf7f2'}">
<meta property="og:locale" content="fr_FR">
<meta property="og:type" content="${meta.ogType || 'website'}">
<meta property="og:site_name" content="CAPIBNB">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${meta.description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.url}${meta.ogImage || SITE.ogImage}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/logo-capibnb-256.png">
<link rel="preload" href="/assets/fonts/fraunces.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/manrope.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/style.css">
<script>document.documentElement.classList.replace('no-js','js')</script>
${jsonLd(meta)}
</head>
<body class="${meta.bodyClass || ''}">
${logoDefs}
${header(meta)}
<main id="contenu">
${body}
</main>
${footer()}
<script src="/assets/js/vendor/gsap.min.js" defer></script>
<script src="/assets/js/vendor/ScrollTrigger.min.js" defer></script>
<script src="/assets/js/main.js" defer></script>
${scripts}
</body>
</html>
`;
}

function build() {
  const files = readdirSync(PAGES_DIR).filter((f) => f.endsWith('.html'));
  const urls = [];
  for (const file of files) {
    const src = readFileSync(join(PAGES_DIR, file), 'utf8');
    const page = parsePage(src, file);
    const ctx = { SITE, meta: page.meta };
    page.body = expandPartials(page.body, ctx);
    const html = layout(page);
    const dir = page.meta.slug ? join(OUT, page.meta.slug) : OUT;
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), html);
    if (!page.meta.noindex) urls.push({ loc: canonical(page.meta.slug), priority: page.meta.priority ?? 0.7 });
    console.log('✓', page.meta.slug || '(accueil)');
  }
  // sitemap + robots
  const today = new Date().toISOString().slice(0, 10);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .sort((a, b) => b.priority - a.priority)
  .map((u) => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority.toFixed(1)}</priority></url>`)
  .join('\n')}
</urlset>
`;
  writeFileSync(join(OUT, 'sitemap.xml'), sitemap);
  writeFileSync(
    join(OUT, 'robots.txt'),
    `User-agent: *\nAllow: /\nDisallow: /php/\n\nSitemap: ${SITE.url}/sitemap.xml\n`
  );
  console.log(`\n${files.length} pages générées dans site-internet/`);
}

build();
