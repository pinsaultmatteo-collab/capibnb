/* CAPIBNB — simulateur de revenus Airbnb à Toulouse
   Modèle indicatif calé sur les données de marché Toulouse 2026 (AirDNA, AirROI)
   et sur la grille CAPIBNB (commission 22 % sur la nuitée hors ménage, forfait consommables 20 à 30 €/mois).
   Fonctionne pour le simulateur complet ([data-sim="full"]) et la version
   compacte de l'accueil ([data-sim="mini"]). */

const TYPO = {
  studio: { label: 'Studio', adr: 62, occ: 0.7, loyer: 530, conso: 20 },
  t1: { label: 'T1', adr: 68, occ: 0.69, loyer: 590, conso: 22 },
  t2: { label: 'T2', adr: 88, occ: 0.67, loyer: 770, conso: 25 },
  t3: { label: 'T3', adr: 118, occ: 0.62, loyer: 1000, conso: 28 },
  t4: { label: 'T4 et +', adr: 155, occ: 0.58, loyer: 1290, conso: 30 },
  villa: { label: 'Maison / villa', adr: 198, occ: 0.55, loyer: 1650, conso: 30 },
};

export const QUARTIERS = [
  { id: 'capitole', label: 'Capitole · Saint-Georges · Victor Hugo', adr: 1.18, occ: 1.04, loyer: 1.14 },
  { id: 'carmes', label: 'Carmes · Esquirol · Saint-Étienne', adr: 1.16, occ: 1.04, loyer: 1.13 },
  { id: 'saint-cyprien', label: 'Saint-Cyprien · Saint-Pierre', adr: 1.07, occ: 1.03, loyer: 1.06 },
  { id: 'chalets', label: 'Chalets · Compans-Caffarelli · Jeanne d’Arc', adr: 1.07, occ: 1.02, loyer: 1.07 },
  { id: 'saint-michel', label: 'Saint-Michel · Busca · Le Port', adr: 1.0, occ: 1.0, loyer: 1.02 },
  { id: 'minimes', label: 'Minimes · Barrière de Paris · Bonnefoy', adr: 0.94, occ: 0.98, loyer: 0.95 },
  { id: 'rangueil', label: 'Rangueil · Saint-Agne · Côte Pavée', adr: 0.95, occ: 0.98, loyer: 0.97 },
  { id: 'patte-oie', label: 'Patte d’Oie · Arènes · Purpan', adr: 0.96, occ: 0.99, loyer: 0.96 },
  { id: 'blagnac', label: 'Blagnac · Aéroport · Colomiers', adr: 0.93, occ: 0.98, loyer: 0.93 },
  { id: 'metropole', label: 'Autre commune de la métropole', adr: 0.86, occ: 0.93, loyer: 0.86 },
];

const STANDING = {
  standard: { adr: 1.0, occ: 1.0 },
  soigne: { adr: 1.12, occ: 1.03 },
  premium: { adr: 1.28, occ: 1.04 },
};

// Saisonnalité toulousaine (AirROI) : pics octobre, août, avril ; creux juillet. Moyenne = 1.
const SEASON = [0.86, 0.9, 1.0, 1.1, 1.05, 1.04, 0.85, 1.1, 1.06, 1.16, 0.95, 0.93];
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const COMMISSION = 0.22;
const CAP_RP = 120; // nuits max en résidence principale à Toulouse

const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('fr-FR');
const round10 = (v) => Math.round(v / 10) * 10;

export function estimate({ typo = 't2', quartier = 'carmes', standing = 'standard', statut = 'invest', semaines = 0 }) {
  const base = TYPO[typo] || TYPO.t2;
  const q = QUARTIERS.find((x) => x.id === quartier) || QUARTIERS[1];
  const s = STANDING[standing] || STANDING.standard;

  const adr = base.adr * q.adr * s.adr;
  const occ = Math.min(0.86, Math.max(0.3, base.occ * q.occ * s.occ));
  const dispo = 365 - Number(semaines) * 7;
  let nights = dispo * occ;
  let capped = false;
  if (statut === 'principale' && nights > CAP_RP) {
    nights = CAP_RP;
    capped = true;
  }
  const gross = nights * adr;
  const commission = gross * COMMISSION;
  const conso = base.conso * 12;
  const net = gross - commission - conso;

  const loyer = base.loyer * q.loyer;
  const ldNet = loyer * 12 * 0.96; // vacance locative ~ 2 semaines

  const monthly = SEASON.map((k) => (net / 12) * k);
  return {
    adr,
    occ,
    nights,
    capped,
    gross,
    commission,
    conso,
    net,
    netMonth: net / 12,
    loyer,
    ldNet,
    ldMonth: ldNet / 12,
    ratio: net / ldNet,
    monthly,
    label: `${base.label} · ${q.label}`,
  };
}

/* ---------- Liaison DOM ---------- */
function readInputs(root) {
  const get = (name, def) => {
    const checked = root.querySelector(`[name="${name}"]:checked`);
    if (checked) return checked.value;
    const el = root.querySelector(`[name="${name}"]`);
    return el ? el.value : def;
  };
  return {
    typo: get('typo', 't2'),
    quartier: get('quartier', 'carmes'),
    standing: get('standing', 'standard'),
    statut: get('statut', 'invest'),
    semaines: Number(get('semaines', 0)),
  };
}

const tweens = new WeakMap();
function setNumber(target, value, format = eur) {
  if (!target) return;
  if (target instanceof NodeList || Array.isArray(target)) {
    target.forEach((el) => setNumber(el, value, format));
    return;
  }
  const el = target;
  // premier affichage : valeur immédiate (pas d'animation, robuste même si l'onglet est en arrière-plan)
  if (el.dataset.v === undefined) {
    el.textContent = format(value);
    el.dataset.v = value;
    return;
  }
  const from = tweens.get(el)?.value ?? parseFloat(el.dataset.v || value);
  const start = performance.now();
  const dur = 420;
  const state = { value: from };
  tweens.set(el, state);
  const step = (now) => {
    const p = Math.min(1, (now - start) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    state.value = from + (value - from) * e;
    el.textContent = format(state.value);
    if (p < 1) requestAnimationFrame(step);
    else el.dataset.v = value;
  };
  requestAnimationFrame(step);
}
const fmtEur = (v) => eur.format(round10(v));
const fmtEurExact = (v) => eur.format(Math.round(v));
const fmtPct = (v) => Math.round(v * 100) + ' %';
const fmtNights = (v) => num.format(Math.round(v)) + ' nuits';
const fmtRatio = (v) => '× ' + v.toFixed(1).replace('.', ',');

function renderChart(svg, r) {
  if (!svg) return;
  const W = 640,
    H = 240,
    padL = 10,
    padB = 28,
    padT = 26;
  const max = Math.max(...r.monthly, r.ldMonth) * 1.12;
  const bw = (W - padL * 2) / 12;
  const y = (v) => H - padB - (v / max) * (H - padB - padT);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  let bars = '';
  r.monthly.forEach((v, i) => {
    const x = padL + i * bw + bw * 0.18;
    const w = bw * 0.64;
    const h = Math.max(2, H - padB - y(v));
    bars += `<rect class="bar" x="${x.toFixed(1)}" y="${y(v).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" style="transition-delay:${i * 25}ms"></rect>`;
    bars += `<text class="val" x="${(x + w / 2).toFixed(1)}" y="${(y(v) - 7).toFixed(1)}">${Math.round(v / 10) * 10}</text>`;
    bars += `<text class="lbl" x="${(x + w / 2).toFixed(1)}" y="${H - 8}">${MONTHS[i]}</text>`;
  });
  const ly = y(r.ldMonth).toFixed(1);
  const line = `<line class="ld-line" x1="${padL}" x2="${W - padL}" y1="${ly}" y2="${ly}"></line>
    <text class="ld-lbl" x="${W - padL}" y="${(Number(ly) - 8).toFixed(1)}" text-anchor="end">Loyer longue durée ≈ ${Math.round(r.ldMonth / 10) * 10} €</text>`;
  svg.innerHTML = bars + line;
}

function bind(root) {
  const q = (sel) => root.querySelectorAll(sel);
  const q1 = (sel) => root.querySelector(sel);
  const quartierSel = q1('select[name="quartier"]');
  if (quartierSel && !quartierSel.options.length) {
    QUARTIERS.forEach((qq) => {
      const o = document.createElement('option');
      o.value = qq.id;
      o.textContent = qq.label;
      quartierSel.appendChild(o);
    });
    quartierSel.value = 'carmes';
  }

  // valeurs initiales depuis l'URL (?typo=t2&quartier=carmes)
  const params = new URLSearchParams(location.search);
  ['typo', 'quartier', 'standing', 'statut'].forEach((k) => {
    const v = params.get(k);
    if (!v) return;
    const radio = root.querySelector(`[name="${k}"][value="${v}"]`);
    if (radio) radio.checked = true;
    const sel = root.querySelector(`select[name="${k}"]`);
    if (sel) sel.value = v;
  });

  const update = () => {
    const inputs = readInputs(root);
    const r = estimate(inputs);
    setNumber(q('[data-sim-net-month]'), r.netMonth, fmtEur);
    setNumber(q('[data-sim-net-year]'), r.net, fmtEur);
    setNumber(q('[data-sim-gross]'), r.gross, fmtEur);
    setNumber(q('[data-sim-commission]'), r.commission, fmtEur);
    setNumber(q('[data-sim-conso]'), r.conso, fmtEurExact);
    setNumber(q('[data-sim-adr]'), r.adr, fmtEurExact);
    setNumber(q('[data-sim-occ]'), r.occ, fmtPct);
    setNumber(q('[data-sim-nights]'), r.nights, fmtNights);
    setNumber(q('[data-sim-ld]'), r.ldMonth, fmtEur);
    setNumber(q('[data-sim-ld-year]'), r.ldNet, fmtEur);
    setNumber(q('[data-sim-ratio]'), r.ratio, fmtRatio);
    const gain = q1('[data-sim-gain]');
    if (gain) setNumber(gain, Math.max(0, r.net - r.ldNet), fmtEur);
    const label = q1('[data-sim-label]');
    if (label) label.textContent = r.label;
    const alert = q1('[data-sim-alert]');
    if (alert) alert.classList.toggle('is-visible', r.capped);
    // barres de comparaison
    const maxV = Math.max(r.net, r.ldNet);
    const b1 = q1('[data-sim-bar="us"]');
    const b2 = q1('[data-sim-bar="ld"]');
    if (b1) b1.style.setProperty('--w', (r.net / maxV) * 100 + '%');
    if (b2) b2.style.setProperty('--w', (r.ldNet / maxV) * 100 + '%');
    renderChart(q1('[data-sim-chart]'), r);
    // liens vers le simulateur complet
    root.querySelectorAll('[data-sim-link]').forEach((a) => {
      const u = new URL(a.getAttribute('href'), location.origin);
      Object.entries(inputs).forEach(([k, v]) => u.searchParams.set(k, v));
      a.setAttribute('href', u.pathname + u.search);
    });
    // champ caché du formulaire de contact
    const hidden = q1('[name="estimation"]');
    if (hidden)
      hidden.value = `${r.label} — net estimé ${fmtEur(r.netMonth)}/mois (${fmtEur(r.net)}/an), ${Math.round(r.nights)} nuits à ${Math.round(r.adr)} €, vs longue durée ${fmtEur(r.ldMonth)}/mois`;
    const out = root.querySelector('output[for]');
    if (out) {
      const slider = q1('input[name="semaines"]');
      if (slider) out.textContent = slider.value === '0' ? 'Aucune' : slider.value + ' sem.';
    }
  };
  root.addEventListener('input', update);
  root.addEventListener('change', update);
  update();
}

document.querySelectorAll('[data-sim]').forEach(bind);
