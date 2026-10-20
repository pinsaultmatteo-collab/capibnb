// Fonction Vercel : reçoit les formulaires du site (POST /api/contact) et envoie
// le récapitulatif du prospect à contact@conciergeriecapibnb.fr par SMTP.
//
// Variables d'environnement à définir dans Vercel (Settings → Environment Variables) :
//   SMTP_USER   adresse de la boîte d'envoi, ex. contact@conciergeriecapibnb.fr
//   SMTP_PASS   mot de passe de cette boîte
//   SMTP_HOST   serveur SMTP (défaut : smtp.hostinger.com)
//   SMTP_PORT   port (défaut : 465, SSL)
//   MAIL_TO     destinataire(s) du récapitulatif, séparés par une virgule (défaut : contact@conciergeriecapibnb.fr)
//   MAIL_ACK=0  pour ne pas envoyer d'accusé de réception au prospect (envoyé par défaut)
//   MAIL_DRY_RUN=1  pour tester sans envoyer (les mails sont renvoyés dans la réponse)

import nodemailer from 'nodemailer';
import { buildRecap, buildAck, validate, isSpam, MAIL_TO_DEFAULT } from './_recap.js';

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  let raw = typeof req.body === 'string' ? req.body : Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  if (!raw) {
    const chunks = [];
    for await (const c of req) {
      chunks.push(c);
      if (chunks.reduce((n, b) => n + b.length, 0) > 64 * 1024) break; // 64 Ko max
    }
    raw = Buffer.concat(chunks).toString('utf8');
  }
  const type = String(req.headers['content-type'] || '');
  if (type.includes('application/json')) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return Object.fromEntries(new URLSearchParams(raw));
}

// Valeurs SMTP nettoyées : espaces et retours à la ligne copiés par erreur autour des valeurs
function smtpConfig() {
  const clean = (v) => String(v ?? '').replace(/^\s+|\s+$/g, '');
  const user = clean(process.env.SMTP_USER);
  const pass = clean(process.env.SMTP_PASS);
  const host = clean(process.env.SMTP_HOST) || 'smtp.hostinger.com';
  const port = Number(clean(process.env.SMTP_PORT) || 465);
  return { user, pass, host, port };
}

function transport() {
  if (process.env.MAIL_DRY_RUN === '1') return nodemailer.createTransport({ jsonTransport: true });
  const { user, pass, host, port } = smtpConfig();
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
  });
}

// Classe une erreur SMTP en cause lisible (sans jamais exposer d'identifiant)
function smtpErrorKind(err) {
  const code = err && (err.code || '');
  const rc = err && err.responseCode;
  if (code === 'EAUTH' || rc === 535 || rc === 534) return 'identifiants_refuses';
  if (['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'ECONNREFUSED', 'ENOTFOUND', 'EDNS'].includes(code)) return 'connexion_impossible';
  if (rc === 550 || rc === 553 || code === 'EENVELOPE') return 'adresse_refusee';
  return 'erreur_smtp';
}

export default async function handler(req, res) {
  // Diagnostic sans envoi : GET /api/contact/?diagnostic=1 vérifie la connexion et l'identification SMTP
  if (req.method === 'GET' && /[?&]diagnostic=1\b/.test(req.url || '')) {
    const { user, pass, host, port } = smtpConfig();
    const raw = String(process.env.SMTP_PASS ?? '');
    const out = {
      environnement: process.env.VERCEL_ENV || 'local',
      smtp_user_renseigne: Boolean(user),
      smtp_user: user ? user.replace(/^(.).*(@.*)$/, '$1•••$2') : null,
      smtp_pass_renseigne: Boolean(pass),
      smtp_user_exact: user.toLowerCase() === MAIL_TO_DEFAULT,
      smtp_pass_espaces_nettoyes: raw !== raw.trim(),
      smtp_pass_entre_guillemets: /^(["'«“]).*(["'»”])$/.test(pass),
      serveur: `${host}:${port}`,
      destinataires: (process.env.MAIL_TO || MAIL_TO_DEFAULT).split(',').length,
    };
    const t = transport();
    if (!t) return send(res, 200, { ...out, verification: 'non_configure' });
    try {
      await t.verify();
      out.verification = 'ok';
    } catch (err) {
      out.verification = smtpErrorKind(err);
      out.detail = { code: err.code || null, reponse_serveur: err.responseCode || null, message: String(err.message || '').slice(0, 160) };
    }
    return send(res, 200, out);
  }

  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Méthode non autorisée' });

  const data = await readBody(req);
  if (isSpam(data)) return send(res, 200, { ok: true }); // on ne dit rien au robot

  const invalid = validate(data);
  if (invalid) return send(res, 422, { ok: false, error: invalid });

  const t = transport();
  if (!t) {
    console.error('[contact] SMTP non configuré : définir SMTP_USER et SMTP_PASS dans Vercel');
    return send(res, 503, { ok: false, error: 'Envoi non configuré', code: 'non_configure' });
  }

  const mail = buildRecap(data);
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || MAIL_TO_DEFAULT;
  const to = process.env.MAIL_TO || MAIL_TO_DEFAULT;
  const dry = process.env.MAIL_DRY_RUN === '1';

  // 1) Récapitulatif pour CAPIBNB : indispensable, son échec fait échouer la requête
  let recapInfo;
  try {
    recapInfo = await t.sendMail({
      from: `"Site CAPIBNB" <${from}>`,
      to,
      replyTo: mail.replyTo,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
  } catch (err) {
    const kind = smtpErrorKind(err);
    console.error('[contact] échec SMTP (récapitulatif) :', kind, err && err.code, err && err.responseCode, err && err.message);
    return send(res, 502, { ok: false, error: 'Envoi impossible', code: kind });
  }

  // 2) Accusé de réception au prospect : en bonus, un échec ne bloque pas la demande
  let ackInfo = null;
  if (process.env.MAIL_ACK !== '0') {
    const ack = buildAck(data);
    try {
      ackInfo = await t.sendMail({
        from: `"Dylan · CAPIBNB" <${from}>`,
        to: ack.to,
        replyTo: to.split(',')[0].trim(),
        subject: ack.subject,
        text: ack.text,
        html: ack.html,
      });
    } catch (err) {
      console.error('[contact] échec SMTP (accusé de réception) :', err && err.message);
    }
  }

  if (dry) {
    return send(res, 200, {
      ok: true,
      dryRun: true,
      mail: JSON.parse(recapInfo.message),
      ack: ackInfo ? JSON.parse(ackInfo.message) : null,
    });
  }
  return send(res, 200, { ok: true });
}
