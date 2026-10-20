// Test des identifiants SMTP sans envoyer de mail.
// Usage : node build/test-smtp.mjs
// Le mot de passe est demandé en saisie masquée et n'est ni affiché, ni enregistré.

import readline from 'node:readline';
import nodemailer from 'nodemailer';

const user = (process.env.SMTP_USER || 'contact@conciergeriecapibnb.fr').trim();
const host = (process.env.SMTP_HOST || 'smtp.hostinger.com').trim();
const port = Number(process.env.SMTP_PORT || 465);

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
    if (process.stdin.isTTY) {
      rl._writeToOutput = (s) => {
        if (s.includes(question)) rl.output.write(s);
        else if (s === '\r\n' || s === '\n') rl.output.write(s);
        else rl.output.write('•');
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (process.stdin.isTTY) process.stdout.write('\n');
      resolve(answer);
    });
  });
}

console.log(`\nTest de connexion SMTP pour ${user} sur ${host}:${port} (aucun mail ne sera envoyé)\n`);
const pass = (await askHidden('Mot de passe de la boîte mail : ')).replace(/^\s+|\s+$/g, '');
if (!pass) {
  console.log('Aucun mot de passe saisi.');
  process.exit(1);
}

const t = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 12000,
});

try {
  await t.verify();
  console.log('\n✅ Hostinger accepte ce mot de passe.');
  console.log('   Colle exactement ce même mot de passe dans la variable SMTP_PASS de Vercel, puis redéploie.\n');
  process.exit(0);
} catch (err) {
  if (err.code === 'EAUTH' || err.responseCode === 535) {
    console.log('\n❌ Hostinger refuse ce mot de passe (erreur 535).');
    console.log('   Le mot de passe est incorrect : réinitialise-le dans hPanel (Emails, Boîtes mail, menu « ⋮ »).\n');
  } else {
    console.log(`\n⚠️  Connexion impossible au serveur (${err.code || 'erreur'}) : ${err.message}\n`);
  }
  process.exit(1);
}
