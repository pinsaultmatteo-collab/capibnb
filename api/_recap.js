// Mail récapitulatif envoyé à CAPIBNB à chaque formulaire rempli sur le site.
// Partagé par la fonction Vercel (api/contact.js). Le fichier commence par « _ » :
// Vercel ne l'expose pas comme une route.

export const MAIL_TO_DEFAULT = 'contact@conciergeriecapibnb.fr';

// Ordre et libellés des champs connus ; les champs inconnus suivent, libellé déduit du nom.
const FIELDS = [
  ['nom', 'Nom'],
  ['email', 'E-mail'],
  ['telephone', 'Téléphone'],
  ['sujet', 'Demande'],
  ['typologie', 'Type de logement'],
  ['adresse', 'Adresse ou quartier'],
  ['estimation', 'Estimation du simulateur'],
  ['message', 'Message'],
];
const IGNORED = new Set(['site_web', 'consentement', 'page', '_t']);

const clean = (v, max = 4000) =>
  String(v ?? '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .slice(0, max);
const oneLine = (v, max = 300) => clean(v, max).replace(/\s*\n\s*/g, ' ');
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const label = (k) => k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' ');

export function validate(d) {
  if (!oneLine(d.nom)) return 'Merci d’indiquer votre nom.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(oneLine(d.email))) return 'Merci d’indiquer une adresse e-mail valide.';
  if (!d.consentement) return 'Merci d’accepter d’être recontacté.';
  return null;
}

// Pièges à robots : champ caché rempli, ou formulaire envoyé en moins de 2,5 s.
export function isSpam(d) {
  if (oneLine(d.site_web)) return true;
  const t = Number(d._t);
  return Number.isFinite(t) && t > 0 && t < 2500;
}

export function buildRecap(d, now = new Date()) {
  const nom = oneLine(d.nom, 120);
  const email = oneLine(d.email, 200);
  const tel = oneLine(d.telephone, 40);
  const sujet = oneLine(d.sujet, 160) || 'Demande via le site';
  const page = oneLine(d.page, 200) || '/';
  const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(now);

  const rows = [];
  const seen = new Set();
  FIELDS.forEach(([k, l]) => {
    seen.add(k);
    const v = k === 'message' || k === 'estimation' ? clean(d[k]) : oneLine(d[k]);
    if (v) rows.push([l, v, k]);
  });
  Object.keys(d)
    .filter((k) => !seen.has(k) && !IGNORED.has(k))
    .forEach((k) => {
      const v = oneLine(d[k], 500);
      if (v) rows.push([label(k), v, k]);
    });

  const subject = `Nouveau prospect : ${nom} · ${sujet}`;

  const text = [
    `Nouvelle demande reçue sur conciergeriecapibnb.fr`,
    ``,
    ...rows.map(([l, v]) => `${l} : ${v}`),
    ``,
    `Page : ${page}`,
    `Reçu le ${date}`,
    ``,
    `Répondre directement à ce mail écrit à ${nom} (${email}).`,
  ].join('\n');

  const telHref = tel ? 'tel:' + tel.replace(/[^\d+]/g, '').replace(/^0/, '+33') : '';
  const cell = (k, v) => {
    if (k === 'email') return `<a href="mailto:${esc(v)}" style="color:#e8484e;text-decoration:none">${esc(v)}</a>`;
    if (k === 'telephone' && telHref) return `<a href="${esc(telHref)}" style="color:#e8484e;text-decoration:none">${esc(v)}</a>`;
    return esc(v).replace(/\n/g, '<br>');
  };
  const btn = (href, txt, bg, fg) =>
    `<a href="${esc(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:12px 20px;border-radius:999px;background:${bg};color:${fg};font-weight:700;font-size:14px;text-decoration:none">${txt}</a>`;

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f2ece4;font-family:Helvetica,Arial,sans-serif;color:#0a0a0a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2ece4;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden">
        <tr><td style="background:#0a0a0a;padding:22px 28px">
          <span style="font-size:20px;font-weight:800;letter-spacing:1px;color:#ffffff">CAPI</span><span style="font-size:20px;font-weight:800;letter-spacing:1px;color:#ff5a5f">BNB</span>
          <div style="margin-top:6px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#ff8a8d">Nouvelle demande via le site</div>
        </td></tr>
        <tr><td style="padding:28px 28px 8px">
          <div style="font-size:13px;color:#8a8a8a">${esc(sujet)}</div>
          <div style="margin:6px 0 18px;font-size:26px;font-weight:700;line-height:1.2">${esc(nom)}</div>
          ${btn(`mailto:${email}?subject=${encodeURIComponent('CAPIBNB : votre demande')}`, 'Répondre par e-mail', '#ff5a5f', '#ffffff')}${telHref ? btn(telHref, 'Appeler ' + esc(tel), '#0a0a0a', '#ffffff') : ''}
        </td></tr>
        <tr><td style="padding:8px 28px 8px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:15px;line-height:1.5">
            ${rows
              .map(
                ([l, v, k]) => `<tr>
              <td style="padding:12px 12px 12px 0;border-top:1px solid #e9e2d8;width:38%;vertical-align:top;color:#5f5f5f;font-size:13px">${esc(l)}</td>
              <td style="padding:12px 0;border-top:1px solid #e9e2d8;vertical-align:top;font-weight:600">${cell(k, v)}</td>
            </tr>`
              )
              .join('')}
          </table>
        </td></tr>
        <tr><td style="padding:16px 28px 26px;font-size:12px;color:#8a8a8a;line-height:1.6">
          Reçu le ${esc(date)} depuis la page <a href="https://conciergeriecapibnb.fr${esc(page)}" style="color:#8a8a8a">${esc(page)}</a>.<br>
          Le prospect a accepté d’être recontacté. Répondre à ce mail lui écrit directement.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html, replyTo: nom ? `"${nom.replace(/"/g, '')}" <${email}>` : email };
}
