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

function transport() {
  if (process.env.MAIL_DRY_RUN === '1') return nodemailer.createTransport({ jsonTransport: true });
  const { SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Méthode non autorisée' });

  const data = await readBody(req);
  if (isSpam(data)) return send(res, 200, { ok: true }); // on ne dit rien au robot

  const invalid = validate(data);
  if (invalid) return send(res, 422, { ok: false, error: invalid });

  const t = transport();
  if (!t) {
    console.error('[contact] SMTP non configuré : définir SMTP_USER et SMTP_PASS dans Vercel');
    return send(res, 503, { ok: false, error: 'Envoi non configuré' });
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
    console.error('[contact] échec SMTP (récapitulatif) :', err && err.message);
    return send(res, 502, { ok: false, error: 'Envoi impossible' });
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
