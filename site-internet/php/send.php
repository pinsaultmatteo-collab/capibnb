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

// Mail multipart texte + HTML
$boundary = 'capibnb_' . bin2hex(random_bytes(8));
$headers  = "From: =?UTF-8?B?" . base64_encode('Site CAPIBNB') . "?= <$FROM>\r\n";
$headers .= 'Reply-To: =?UTF-8?B?' . base64_encode($nom) . "?= <$email>\r\n";
$headers .= "MIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary=\"$boundary\"\r\n";
$body  = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($text)) . "\r\n";
$body .= "--$boundary\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html)) . "\r\n";
$body .= "--$boundary--";

$ok = @mail($TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers, '-f' . $FROM);
if (!$ok) reply(502, ['ok' => false, 'error' => 'Envoi impossible']);
reply(200, ['ok' => true]);
