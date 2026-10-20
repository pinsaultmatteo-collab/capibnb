# Site CAPIBNB — refonte (PMC Marketing)

Site statique (HTML/CSS/JS), sans CMS, prêt à déposer sur l'hébergement Hostinger.

## Arborescence

- `contexte/` — fiche de référence CAPIBNB (source de toutes les décisions de contenu)
- `build/` — sources du site
  - `pages/*.html` — contenu de chaque page, avec un en-tête `<!--meta {...} -->` (slug, title, description, scripts…)
  - `partials.mjs` — logo SVG, icônes, blocs communs (CTA, témoignages, « inclus »)
  - `build.mjs` — gabarit commun (head SEO, JSON-LD, header, footer), génère `site-internet/`, `sitemap.xml`, `robots.txt`
  - `serve.mjs` — petit serveur local de prévisualisation
- `site-internet/` — **le site généré, à déployer tel quel** (racine du domaine)
  - `assets/css/style.css` — design system (charte corail `#ff5a5f` / noir `#0a0a0a`, polices Archivo (titres) + Manrope (texte) auto-hébergées)
  - `assets/js/main.js` — navigation, apparitions au scroll, compteurs, FAQ, frise épinglée (GSAP), formulaires
  - `assets/js/hero3d.js` — scène 3D de l'accueil (Three.js)
  - `assets/js/simulateur.js` — modèle et affichage du simulateur de revenus (hypothèses dans `TYPO`, `QUARTIERS`, `STANDING`, `SEASON`)
  - `assets/js/reglementation.js` — assistant « Mon logement est-il en règle ? »
  - `php/send.php` — réception des formulaires sur Hostinger (fonction `mail()`), même récapitulatif que la version Vercel
- `api/contact.js` + `api/_recap.js` — réception des formulaires sur Vercel (fonction serverless, envoi SMTP avec nodemailer)
  - `.htaccess` — HTTPS, redirections 301 depuis l'ancien WordPress, cache, en-têtes
- `charte-graphique/` — kit logo CAPIBNB 2026 (SVG, PNG, favicons). **Source unique du logo** : le build lit les SVG pour le header, le footer et les pictos (parties noires passées en `currentColor`, donc blanches sur fond sombre), et copie les favicons et le manifeste à la racine du site. Pour changer le logo, remplacer les fichiers du kit puis relancer le build.
- `A-VALIDER.md` — liste des affirmations à confirmer avec Dylan avant mise en ligne

## Commandes

```bash
node build/build.mjs      # régénère site-internet/ à partir de build/pages
node build/serve.mjs      # prévisualisation sur http://localhost:8791
```

## Modifier un contenu

1. Éditer la page dans `build/pages/` (ou un bloc commun dans `build/partials.mjs`, ou les coordonnées dans l'objet `SITE` de `build/build.mjs`).
2. Relancer `node build/build.mjs`.
3. Déposer le contenu de `site-internet/` à la racine du domaine chez Hostinger.

## Déploiement Hostinger

- Copier tout `site-internet/` (y compris `.htaccess` et `php/`) dans `public_html/`.
- Créer l'adresse technique `site@conciergeriecapibnb.fr` (expéditeur des formulaires) ou modifier `$FROM` dans `php/send.php`.
- Tester un envoi de formulaire, vérifier les 301 (`/?page_id=1381` → `/simulateur/`), soumettre `sitemap.xml` à la Search Console.

## Formulaires : mail récapitulatif à contact@conciergeriecapibnb.fr

Les deux formulaires (Contact et étude détaillée du simulateur) envoient vers `/api/contact/`. Chaque demande produit deux mails :

1. **Récapitulatif pour CAPIBNB** (à contact@conciergeriecapibnb.fr) : nom, e-mail, téléphone, type de demande, logement, adresse, message, estimation du simulateur, page d'origine ; « Répondre » écrit directement au prospect.
2. **Accusé de réception pour le prospect**, signé Dylan : confirmation, rappel du type de demande, les trois prochaines étapes (variante simulateur et variante voyageur), téléphone. Il ne recopie aucun texte libre du formulaire, pour que le site ne puisse pas servir de relais à spam. Une erreur d'envoi de l'accusé ne bloque pas la demande. Pour le désactiver : variable `MAIL_ACK=0` sur Vercel ; sur Hostinger, retirer l'appel `send_mail($ackTo, …)` en fin de `php/send.php`.

Les deux mails partent de contact@conciergeriecapibnb.fr. Pièges à robots : champ caché et envoi trop rapide (moins de 2,5 s). Un événement `form_envoye` est poussé dans le dataLayer pour le suivi des conversions.

- **Sur Vercel** : la fonction `api/contact.js` envoie par SMTP. À configurer une fois dans Vercel → Settings → Environment Variables, puis redéployer :
  - `SMTP_USER` = `contact@conciergeriecapibnb.fr`
  - `SMTP_PASS` = mot de passe de cette boîte mail
  - `SMTP_HOST` = `smtp.hostinger.com` (valeur par défaut, à changer si la boîte est ailleurs)
  - `SMTP_PORT` = `465` (par défaut)
  - `MAIL_TO` = destinataire, par défaut `contact@conciergeriecapibnb.fr`
  Sans `SMTP_USER` / `SMTP_PASS`, la fonction répond « Envoi non configuré » et le visiteur se voit proposer un lien `mailto:`.
- **Sur Hostinger** : `/api/contact/` est redirigé vers `php/send.php` par le `.htaccess`, qui envoie avec `mail()` depuis contact@conciergeriecapibnb.fr.
- **En local** (`node build/serve.mjs`) : sans identifiants SMTP, mode test, aucun mail réel n'est envoyé.

## Mesure d'audience (Google Analytics 4)

ID de mesure dans `SITE.ga4` (`build/build.mjs`). Mode consentement Google en version « de base » : la balise `gtag.js` n'est chargée qu'après « Accepter » dans le bandeau (choix gardé 6 mois, lien « Gérer les cookies » dans le footer). Événements envoyés en plus des mesures améliorées (pages vues, défilements, clics sortants, formulaires) :

| Événement | Quand | Paramètres |
| --- | --- | --- |
| `generate_lead` | formulaire Contact ou étude du simulateur envoyé avec succès | `form_name`, `lead_source`, `request_type`, `property_type` |
| `click_phone` | clic sur un numéro ou un bouton « Appeler » | `link_location` (header, menu_mobile, footer, page_contact…), `phone_action` (affichage_numero, appel) |
| `click_email` | clic sur une adresse e-mail | `link_location` |
| `simulator_use` | première modification du simulateur sur la page | `simulator`, `property_type`, `area` |

Aucune donnée personnelle saisie n'est envoyée à Google.

## Déploiement Vercel (aperçu)

`vercel.json` à la racine configure tout : build `node build/build.mjs`, dossier de sortie `site-internet`, fonction des formulaires en région Paris (`cdg1`), redirections (dont capibnb.vercel.app vers le domaine, pour éviter un doublon dans Google), en-têtes, `404.html`. Laisser le champ « Root Directory » vide dans les réglages du projet Vercel. Chaque push sur `main` redéploie.

Les formulaires passent par la fonction `api/contact.js` (voir la section Formulaires) : penser à renseigner les variables SMTP dans Vercel.
