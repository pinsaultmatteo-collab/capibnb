<?php
/**
 * CAPIBNB — réception des formulaires (contact, simulateur, estimation).
 * Hébergement Hostinger : la fonction mail() est disponible.
 * Réponse JSON : {"ok":true} ou {"ok":false,"error":"..."}.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$TO   = 'contact@conciergeriecapibnb.fr';
$FROM = 'site@conciergeriecapibnb.fr'; // adresse technique du domaine (à créer chez Hostinger)

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Méthode non autorisée']);
    exit;
}

// Pot de miel anti-spam
if (!empty($_POST['site_web'])) {
    echo json_encode(['ok' => true]);
    exit;
}

$clean = static function (string $key, int $max = 2000): string {
    $v = isset($_POST[$key]) ? trim((string) $_POST[$key]) : '';
    $v = str_replace(["\r", "\n"], ' ', $v);
    return mb_substr(strip_tags($v), 0, $max);
};

$nom     = $clean('nom', 120);
$email   = $clean('email', 200);
$tel     = $clean('telephone', 40);
$message = isset($_POST['message']) ? mb_substr(strip_tags(trim((string) $_POST['message'])), 0, 4000) : '';
$sujet   = $clean('sujet', 120) ?: 'Demande via le site CAPIBNB';
$page    = $clean('page', 200);

if ($nom === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Nom et e-mail valides requis']);
    exit;
}

// Tous les autres champs (typologie, quartier, estimation, etc.)
$ignore = ['nom', 'email', 'telephone', 'message', 'sujet', 'page', 'site_web', 'consentement'];
$extra  = [];
foreach ($_POST as $k => $v) {
    if (in_array($k, $ignore, true) || is_array($v)) continue;
    $extra[] = ucfirst(str_replace('_', ' ', (string) $k)) . ' : ' . mb_substr(strip_tags(trim((string) $v)), 0, 500);
}

$body  = "Nouvelle demande depuis le site CAPIBNB\n";
$body .= "=========================================\n\n";
$body .= "Nom : $nom\nE-mail : $email\nTéléphone : $tel\n";
if ($extra) $body .= "\n" . implode("\n", $extra) . "\n";
if ($message !== '') $body .= "\nMessage :\n$message\n";
$body .= "\n---\nPage : $page\nDate : " . date('d/m/Y H:i') . "\nIP : " . ($_SERVER['REMOTE_ADDR'] ?? '');

$headers  = "From: CAPIBNB Site <$FROM>\r\n";
$headers .= "Reply-To: $nom <$email>\r\n";
$headers .= "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n";

$ok = @mail($TO, '=?UTF-8?B?' . base64_encode("[Site] $sujet — $nom") . '?=', $body, $headers);

if (!$ok) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Envoi impossible']);
    exit;
}
echo json_encode(['ok' => true]);
