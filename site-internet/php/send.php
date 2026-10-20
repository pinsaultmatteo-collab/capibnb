<?php
/**
 * CAPIBNB — réception des formulaires sur l'hébergement Hostinger (PHP).
 * Même rôle que la fonction Vercel api/contact.js : envoie le récapitulatif
 * du prospect à contact@conciergeriecapibnb.fr. Le .htaccess fait pointer
 * /api/contact vers ce fichier, le site n'a donc qu'une seule adresse d'envoi.
 * Réponse JSON : {"ok":true} ou {"ok":false,"error":"..."}.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$TO   = 'contact@conciergeriecapibnb.fr';
$FROM = 'contact@conciergeriecapibnb.fr'; // boîte du domaine, pour que le mail ne parte pas en indésirable

function reply(int $code, array $body): void {
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}
function clean($v, int $max = 4000): string {
    $v = str_replace(["\r\n", "\r"], "\n", trim((string) $v));
    return mb_substr(strip_tags($v), 0, $max);
}
function one_line($v, int $max = 300): string {
    return preg_replace('/\s*\n\s*/', ' ', clean($v, $max));
}
function e(string $s): string {
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') reply(405, ['ok' => false, 'error' => 'Méthode non autorisée']);

$d = $_POST;
// Pièges à robots : champ caché rempli, ou envoi en moins de 2,5 s
$t = isset($d['_t']) ? (int) $d['_t'] : 0;
if (one_line($d['site_web'] ?? '') !== '' || ($t > 0 && $t < 2500)) reply(200, ['ok' => true]);

$nom   = one_line($d['nom'] ?? '', 120);
$email = one_line($d['email'] ?? '', 200);
$tel   = one_line($d['telephone'] ?? '', 40);
$sujet = one_line($d['sujet'] ?? '', 160) ?: 'Demande via le site';
$page  = one_line($d['page'] ?? '', 200) ?: '/';

if ($nom === '') reply(422, ['ok' => false, 'error' => 'Merci d’indiquer votre nom.']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) reply(422, ['ok' => false, 'error' => 'Merci d’indiquer une adresse e-mail valide.']);
if (empty($d['consentement'])) reply(422, ['ok' => false, 'error' => 'Merci d’accepter d’être recontacté.']);

$fields = [
    'nom' => 'Nom', 'email' => 'E-mail', 'telephone' => 'Téléphone', 'sujet' => 'Demande',
    'typologie' => 'Type de logement', 'adresse' => 'Adresse ou quartier',
    'estimation' => 'Estimation du simulateur', 'message' => 'Message',
];
$ignored = ['site_web', 'consentement', 'page', '_t'];
$rows = [];
foreach ($fields as $k => $l) {
    $v = in_array($k, ['message', 'estimation'], true) ? clean($d[$k] ?? '') : one_line($d[$k] ?? '');
    if ($v !== '') $rows[] = [$l, $v, $k];
}
foreach ($d as $k => $v) {
    if (isset($fields[$k]) || in_array($k, $ignored, true) || is_array($v)) continue;
    $v = one_line($v, 500);
    if ($v !== '') $rows[] = [ucfirst(str_replace('_', ' ', (string) $k)), $v, $k];
}

$fmt  = class_exists('IntlDateFormatter')
    ? new IntlDateFormatter('fr_FR', IntlDateFormatter::FULL, IntlDateFormatter::SHORT, 'Europe/Paris')
    : null;
$date = ($fmt ? $fmt->format(time()) : false) ?: date('d/m/Y H:i');
$subject = "Nouveau prospect : $nom · $sujet";
$telHref = $tel !== '' ? 'tel:' . preg_replace('/^0/', '+33', preg_replace('/[^\d+]/', '', $tel)) : '';

// Version texte
$text = "Nouvelle demande reçue sur conciergeriecapibnb.fr\n\n";
foreach ($rows as [$l, $v]) $text .= "$l : $v\n";
$text .= "\nPage : $page\nReçu le $date\n\nRépondre directement à ce mail écrit à $nom ($email).";

// Version HTML (même gabarit que api/_recap.js)
$btn = fn(string $href, string $txt, string $bg) =>
    '<a href="' . e($href) . '" style="display:inline-block;margin:0 8px 8px 0;padding:12px 20px;border-radius:999px;background:' . $bg . ';color:#ffffff;font-weight:700;font-size:14px;text-decoration:none">' . $txt . '</a>';
$cells = '';
foreach ($rows as [$l, $v, $k]) {
    if ($k === 'email') $val = '<a href="mailto:' . e($v) . '" style="color:#e8484e;text-decoration:none">' . e($v) . '</a>';
    elseif ($k === 'telephone' && $telHref) $val = '<a href="' . e($telHref) . '" style="color:#e8484e;text-decoration:none">' . e($v) . '</a>';
    else $val = nl2br(e($v));
    $cells .= '<tr><td style="padding:12px 12px 12px 0;border-top:1px solid #e9e2d8;width:38%;vertical-align:top;color:#5f5f5f;font-size:13px">' . e($l)
        . '</td><td style="padding:12px 0;border-top:1px solid #e9e2d8;vertical-align:top;font-weight:600">' . $val . '</td></tr>';
}
$html = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>' . e($subject) . '</title></head>'
    . '<body style="margin:0;padding:0;background:#f2ece4;font-family:Helvetica,Arial,sans-serif;color:#0a0a0a">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2ece4;padding:24px 12px"><tr><td align="center">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden">'
    . '<tr><td style="background:#0a0a0a;padding:22px 28px"><span style="font-size:20px;font-weight:800;letter-spacing:1px;color:#ffffff">CAPI</span><span style="font-size:20px;font-weight:800;letter-spacing:1px;color:#ff5a5f">BNB</span>'
    . '<div style="margin-top:6px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#ff8a8d">Nouvelle demande via le site</div></td></tr>'
    . '<tr><td style="padding:28px 28px 8px"><div style="font-size:13px;color:#8a8a8a">' . e($sujet) . '</div>'
    . '<div style="margin:6px 0 18px;font-size:26px;font-weight:700;line-height:1.2">' . e($nom) . '</div>'
    . $btn('mailto:' . $email . '?subject=' . rawurlencode('CAPIBNB : votre demande'), 'Répondre par e-mail', '#ff5a5f')
    . ($telHref ? $btn($telHref, 'Appeler ' . e($tel), '#0a0a0a') : '')
    . '</td></tr><tr><td style="padding:8px 28px 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:15px;line-height:1.5">'
    . $cells . '</table></td></tr>'
    . '<tr><td style="padding:16px 28px 26px;font-size:12px;color:#8a8a8a;line-height:1.6">Reçu le ' . e($date) . ' depuis la page ' . e($page)
    . '.<br>Le prospect a accepté d’être recontacté. Répondre à ce mail lui écrit directement.</td></tr>'
    . '</table></td></tr></table></body></html>';

// Envoi d'un mail multipart texte + HTML
function send_mail(string $to, string $fromName, string $from, string $replyTo, string $subject, string $text, string $html): bool {
    $boundary = 'capibnb_' . bin2hex(random_bytes(8));
    $headers  = 'From: =?UTF-8?B?' . base64_encode($fromName) . "?= <$from>\r\n";
    $headers .= "Reply-To: $replyTo\r\n";
    $headers .= "MIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary=\"$boundary\"\r\n";
    $body  = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($text)) . "\r\n";
    $body .= "--$boundary\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html)) . "\r\n";
    $body .= "--$boundary--";
    return @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers, '-f' . $from);
}

// 1) Récapitulatif pour CAPIBNB : indispensable
$replyProspect = '=?UTF-8?B?' . base64_encode($nom) . "?= <$email>";
if (!send_mail($TO, 'Site CAPIBNB', $FROM, $replyProspect, $subject, $text, $html)) {
    reply(502, ['ok' => false, 'error' => 'Envoi impossible']);
}

// 2) Accusé de réception au prospect (même contenu que api/_recap.js → buildAck).
//    Aucun texte libre du formulaire n'est recopié : seulement le nom et un type de demande connu.
$known = ['Propriétaire, je veux une estimation', 'Propriétaire, j’ai une question', 'Propriétaire, j’hésite entre courte et longue durée',
          'Voyageur', 'Autre', 'Étude détaillée depuis le simulateur'];
$ackSujet = in_array($sujet, $known, true) ? $sujet : '';
$fromSim  = $ackSujet === 'Étude détaillée depuis le simulateur';
$voyageur = $ackSujet === 'Voyageur';
$ackNom   = mb_substr($nom, 0, 80);
$intro = $fromSim
    ? 'Merci pour votre demande d’étude détaillée. Dylan reprend votre simulation et l’ajuste à votre logement (surface, étage, équipements, saison de lancement), puis vous recontacte personnellement sous 24 h.'
    : ($voyageur
        ? 'Merci pour votre message. Il est bien arrivé chez CAPIBNB : nous vous répondons rapidement, 7 jours sur 7.'
        : 'Merci pour votre demande. Elle est bien arrivée chez CAPIBNB : Dylan vous recontacte personnellement sous 24 h, par téléphone ou par e-mail.');
$steps = $voyageur ? [] : [
    ['Un premier échange', 'Quinze minutes pour parler de votre logement, de votre situation et de vos attentes.'],
    ['La visite du logement', 'Gratuite et sans engagement. Dylan évalue le potentiel et vous remet une estimation chiffrée.'],
    ['La mise en ligne', 'Si on y va ensemble, votre annonce est publiée sous une dizaine de jours. Aucun frais d’inscription.'],
];
$ackSubject = 'CAPIBNB · Nous avons bien reçu votre demande';

$ackText = "Bonjour $ackNom,\n\n$intro\n";
if ($ackSujet !== '') $ackText .= "\nVotre demande : $ackSujet\n";
if ($steps) {
    $ackText .= "\nEt ensuite ?\n";
    foreach ($steps as $i => [$st, $sx]) $ackText .= ($i + 1) . ". $st : $sx\n";
}
$ackText .= "\nUne question d’ici là ? Répondez simplement à ce mail ou appelez le 06 19 48 59 05.\n\nÀ très vite,\nDylan Carvalho\n"
    . "Fondateur de CAPIBNB, conciergerie Airbnb & Booking à Toulouse\n23 rue des Changes, 31000 Toulouse · 06 19 48 59 05\n\n"
    . "Vous recevez ce message car vous avez rempli un formulaire sur conciergeriecapibnb.fr. Aucune newsletter, aucune revente de vos données.";

$stepsHtml = '';
foreach ($steps as $i => [$st, $sx]) {
    $stepsHtml .= '<tr><td style="width:40px;vertical-align:top;padding:10px 0"><div style="width:30px;height:30px;border-radius:50%;background:#fff1f0;color:#e8484e;font-weight:700;font-size:13px;line-height:30px;text-align:center">0' . ($i + 1) . '</div></td>'
        . '<td style="vertical-align:top;padding:10px 0;font-size:14px;line-height:1.5"><strong>' . e($st) . '</strong><br><span style="color:#5f5f5f">' . e($sx) . '</span></td></tr>';
}
$ackHtml = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>' . e($ackSubject) . '</title></head>'
    . '<body style="margin:0;padding:0;background:#f2ece4;font-family:Helvetica,Arial,sans-serif;color:#0a0a0a">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2ece4;padding:24px 12px"><tr><td align="center">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden">'
    . '<tr><td style="background:#0a0a0a;padding:22px 28px"><span style="font-size:20px;font-weight:800;letter-spacing:1px;color:#ffffff">CAPI</span><span style="font-size:20px;font-weight:800;letter-spacing:1px;color:#ff5a5f">BNB</span>'
    . '<div style="margin-top:6px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#ff8a8d">Conciergerie Airbnb &amp; Booking · Toulouse</div></td></tr>'
    . '<tr><td style="padding:30px 28px 6px;font-size:15px;line-height:1.6"><div style="font-size:24px;font-weight:700;line-height:1.25;margin-bottom:14px">Bonjour ' . e($ackNom) . ',</div>'
    . '<p style="margin:0 0 14px">' . e($intro) . '</p>'
    . ($ackSujet !== '' ? '<p style="margin:0 0 14px;color:#5f5f5f;font-size:13px">Votre demande : <strong style="color:#0a0a0a">' . e($ackSujet) . '</strong></p>' : '')
    . '</td></tr>'
    . ($steps ? '<tr><td style="padding:6px 28px 6px"><div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#e8484e;font-weight:700;margin:6px 0 4px">Et ensuite ?</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $stepsHtml . '</table></td></tr>' : '')
    . '<tr><td style="padding:16px 28px 8px;font-size:15px;line-height:1.6"><p style="margin:0 0 16px">Une question d’ici là ? Répondez simplement à ce mail ou appelez le <a href="tel:+33619485905" style="color:#e8484e;text-decoration:none;font-weight:700;white-space:nowrap">06&nbsp;19&nbsp;48&nbsp;59&nbsp;05</a>.</p>'
    . $btn('tel:+33619485905', 'Appeler Dylan', '#ff5a5f')
    . ($fromSim || $voyageur ? '' : $btn('https://conciergeriecapibnb.fr/simulateur/', 'Estimer mes revenus', '#0a0a0a'))
    . '</td></tr>'
    . '<tr><td style="padding:18px 28px 24px;font-size:14px;line-height:1.55">À très vite,<br><strong>Dylan Carvalho</strong><br><span style="color:#5f5f5f">Fondateur de CAPIBNB · 23 rue des Changes, 31000 Toulouse</span></td></tr>'
    . '<tr><td style="padding:14px 28px 22px;border-top:1px solid #e9e2d8;font-size:11px;color:#8a8a8a;line-height:1.6">Vous recevez ce message car vous avez rempli un formulaire sur <a href="https://conciergeriecapibnb.fr" style="color:#8a8a8a">conciergeriecapibnb.fr</a>. Aucune newsletter, aucune revente de vos données.</td></tr>'
    . '</table></td></tr></table></body></html>';

// En bonus : un échec de l'accusé de réception ne fait pas échouer la demande
$ackTo = '=?UTF-8?B?' . base64_encode($ackNom) . "?= <$email>";
send_mail($ackTo, 'Dylan · CAPIBNB', $FROM, $TO, $ackSubject, $ackText, $ackHtml);

reply(200, ['ok' => true]);
