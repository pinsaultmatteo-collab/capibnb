// Partiels réutilisés par le build : logo, icônes, blocs communs.

const ICONS = {
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowUpRight: '<path d="M7 17 17 7M8 7h9v9"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8.7-8.7M15 7l3 3M18 4l2 2"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  chat: '<path d="M4 5h16v11H9l-5 4Z"/><path d="M8 9h8M8 12h5"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  file: '<path d="M7 3h7l5 5v13H7Z"/><path d="M14 3v5h5M10 13h5M10 17h5"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="m9 12 2 2 4-4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  home: '<path d="m3 11 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4.5-6.2"/>',
  euro: '<path d="M18 6.5A7 7 0 0 0 6 12a7 7 0 0 0 12 5.5M3 10h11M3 14h10"/>',
  bed: '<path d="M3 18V8M3 14h18v4M21 14v-3a2 2 0 0 0-2-2h-8v5"/><path d="M3 12h4a2 2 0 0 1 2 2"/>',
  broom: '<path d="m13 3 8 8M10 6l8 8M13.5 11.5 6 19l-3 2 2-3 7.5-7.5"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>',
  facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v6h4v-6h3l1-4h-4V8Z"/>',
  google: '<path d="M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.1a4.4 4.4 0 0 1-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.1 2.7-7Z"/><path d="M12 21c2.5 0 4.6-.8 6.2-2.2l-3.1-2.4c-.8.6-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H3.8v2.5A9 9 0 0 0 12 21Z"/><path d="M6.9 13.5a5.4 5.4 0 0 1 0-3.4V7.6H3.8a9 9 0 0 0 0 8.4l3.1-2.5Z"/><path d="M12 6.6c1.4 0 2.6.5 3.5 1.4l2.6-2.6A9 9 0 0 0 3.8 7.6l3.1 2.5c.7-2.2 2.7-3.5 5.1-3.5Z"/>',
  quote: '<path d="M7 7h4v6H7v4H4V10a3 3 0 0 1 3-3ZM17 7h4v6h-4v4h-3V10a3 3 0 0 1 3-3Z"/>',
  wifi: '<path d="M2 9a16 16 0 0 1 20 0M5.5 12.5a11 11 0 0 1 13 0M9 16a5.5 5.5 0 0 1 6 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/>',
  coffee: '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z"/><path d="M16 11h2a2 2 0 0 1 0 4h-2M7 3v3M11 3v3"/>',
  plane: '<path d="M2 14 21 4l-5 17-4-7Z"/><path d="M12 14 21 4"/>',
  tram: '<rect x="5" y="4" width="14" height="13" rx="3"/><path d="M5 11h14M9 21l1.5-4M15 21l-1.5-4M9 2h6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
  alert: '<path d="M12 3 2 20h20Z"/><path d="M12 10v4M12 17.5v.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>',
  tag: '<path d="M3 3h8l10 10-8 8L3 11Z"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  spark: '<path d="M12 2c.6 5.5 4.5 9.4 10 10-5.5.6-9.4 4.5-10 10-.6-5.5-4.5-9.4-10-10 5.5-.6 9.4-4.5 10-10Z"/>',
};

export function icon(name, cls = '') {
  const d = ICONS[name];
  if (!d) throw new Error(`Icône inconnue : ${name}`);
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}

// Logo recréé en SVG vectoriel à partir du logo existant (anneau + C + BNB, dégradé corail).
// Le dégradé #lg-ring est défini une seule fois par page (voir logoDefs, injecté par le build).
export const logoDefs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="lg-ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f9cebe"/><stop offset=".55" stop-color="#ef8c87"/><stop offset="1" stop-color="#e65a5f"/>
    </linearGradient>
  </defs>
</svg>`;
export const logoMark = `<svg class="logo-mark" viewBox="0 0 600 600" aria-hidden="true" focusable="false">
  <circle cx="300" cy="300" r="215" fill="none" stroke="url(#lg-ring)" stroke-width="50"/>
  <path d="M 408 274 A 110 110 0 1 0 408 326" fill="none" stroke="url(#lg-ring)" stroke-width="50"/>
  <text x="300" y="300" text-anchor="middle" dominant-baseline="central" font-family="Manrope, Poppins, Arial, sans-serif" font-weight="800" font-size="86" letter-spacing="2" fill="#fff">BNB</text>
</svg>`;

// Favicon : version simplifiée
export const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f9cebe"/><stop offset=".55" stop-color="#ef8c87"/><stop offset="1" stop-color="#e65a5f"/></linearGradient></defs>
  <circle cx="300" cy="300" r="215" fill="none" stroke="url(#g)" stroke-width="56"/>
  <path d="M 408 274 A 110 110 0 1 0 408 326" fill="none" stroke="url(#g)" stroke-width="56"/>
</svg>`;

const TESTIMONIALS = [
  {
    name: 'Léo',
    place: 'Propriétaire à Toulouse',
    text: 'Je suis très satisfait de cette conciergerie pour mon Airbnb sur Toulouse. Je recommande fortement cette entreprise qui s’occupe très bien de mon appartement.',
  },
  {
    name: 'Sam',
    place: 'Propriétaire à Toulouse',
    text: 'Une expérience exceptionnelle avec cette conciergerie à Toulouse ! Si vous cherchez une conciergerie professionnelle, axée sur le client et experte dans la gestion des hébergements Airbnb, ne cherchez pas plus loin. Je recommande vivement Capibnb.',
  },
  {
    name: 'Mattéo',
    place: 'Plusieurs logements à Toulouse',
    text: 'Conciergerie au top, j’ai plusieurs logements en location courte durée à Toulouse qui sont gérés par Capibnb. Ils sont réactifs, compétents et les ménages sont bien faits. Je recommande complètement.',
  },
];

const stars = `<span class="stars" aria-label="5 étoiles sur 5">${icon('star', 'is-filled').repeat(5)}</span>`;

export const partials = {
  logoMark,
  icon,
  arrowIcon: icon('arrow'),
  starsFive: icon('star', 'is-filled').repeat(5),

  // Bandeau de réassurance sous le hero
  trustbar: `
<div class="trustbar" data-reveal>
  <ul class="container trustbar__list">
    <li>${icon('star')}<strong>5/5</strong> sur Google</li>
    <li>${icon('euro')}<strong>22 % TTC</strong>, linge et boîte à clés inclus</li>
    <li>${icon('pin')}<strong>Toulouse</strong> intra-muros et métropole</li>
    <li>${icon('clock')}Réponse aux voyageurs <strong>7j/7</strong></li>
    <li>${icon('shield')}<strong>Conforme</strong> à la réglementation toulousaine</li>
  </ul>
</div>`,

  // Témoignages (3 cartes)
  testimonials: `
<div class="testimonials">
  ${TESTIMONIALS.map(
    (t, i) => `
  <figure class="testimonial" data-reveal style="--i:${i}">
    ${stars}
    <blockquote><p>${t.text}</p></blockquote>
    <figcaption><span class="avatar">${t.name[0]}</span><span><strong>${t.name}</strong><br><small>${t.place}</small></span></figcaption>
  </figure>`
  ).join('')}
</div>`,

  // CTA final commun
  cta: ({ SITE }) => `
<section class="cta-final" id="parlons-en">
  <div class="container cta-final__inner">
    <div class="cta-final__text" data-reveal>
      <p class="eyebrow eyebrow--light">On en parle ?</p>
      <h2 class="display display--md">Parlons de <em>votre bien</em>, autour d’un café ou au téléphone.</h2>
      <p class="lead lead--light">Dylan vous rappelle sous 24 h avec une première estimation de revenus et une réponse franche : courte durée ou pas, selon votre logement et votre situation.</p>
      <div class="btn-row">
        <a href="/simulateur/" class="btn btn--primary btn--lg" data-magnetic>Simuler mes revenus ${icon('arrow')}</a>
        <a href="/contact/" class="btn btn--ghost-light btn--lg">Être rappelé</a>
      </div>
    </div>
    <aside class="cta-final__card" data-reveal>
      <img src="/assets/img/dylan-sm.webp" alt="Dylan Carvalho, fondateur de CAPIBNB" width="600" height="908" loading="lazy">
      <div class="cta-final__card-body">
        <strong>Dylan Carvalho</strong>
        <span>Fondateur, investisseur en courte durée à Toulouse</span>
        <a href="${SITE.phoneHref}" class="cta-final__phone">${icon('phone')} ${SITE.phone}</a>
      </div>
    </aside>
  </div>
</section>`,

  // Petite mention "estimation" pour le simulateur
  simNote: `<p class="sim-note">${icon('info')} Estimation indicative fondée sur les données de marché Toulouse 2026 (AirDNA, AirROI) et l’expérience des logements gérés. Elle ne constitue pas un engagement de revenus : Dylan affine l’estimation après visite.</p>`,

  // Bloc "ce qui est inclus"
  included: `
<ul class="included" data-reveal-group>
  <li>${icon('check')}<span><strong>Linge de lit et de toilette</strong> fourni et lavé à chaque séjour</span></li>
  <li>${icon('check')}<span><strong>Boîte à clés sécurisée</strong>, matériel et pose offerts</span></li>
  <li>${icon('check')}<span><strong>Photos pro et annonce optimisée</strong> sur Airbnb et Booking</span></li>
  <li>${icon('check')}<span><strong>Tarification dynamique</strong> ajustée chaque jour</span></li>
  <li>${icon('check')}<span><strong>Livret d’accueil</strong> et guide de Toulouse</span></li>
  <li>${icon('check')}<span><strong>Relation voyageurs 7j/7</strong>, avant, pendant, après</span></li>
  <li>${icon('check')}<span><strong>Relevé mensuel</strong> et reversement de vos revenus</span></li>
  <li>${icon('check')}<span><strong>Conformité toulousaine</strong> : enregistrement, taxe de séjour</span></li>
  <li>${icon('check')}<span><strong>Petits travaux et rénovation</strong> pilotés entre deux saisons, avec votre accord</span></li>
  <li>${icon('check')}<span><strong>0 € de frais d’inscription</strong> à la signature du contrat</span></li>
</ul>`,
};
