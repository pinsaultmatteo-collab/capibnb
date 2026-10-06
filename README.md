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
  - `assets/css/style.css` — design system (charte corail `#ff5a5f` / charbon `#242d2d`, polices Fraunces + Manrope auto-hébergées)
  - `assets/js/main.js` — navigation, apparitions au scroll, compteurs, FAQ, frise épinglée (GSAP), formulaires
  - `assets/js/hero3d.js` — scène 3D de l'accueil (Three.js)
  - `assets/js/simulateur.js` — modèle et affichage du simulateur de revenus (hypothèses dans `TYPO`, `QUARTIERS`, `STANDING`, `SEASON`)
  - `assets/js/reglementation.js` — assistant « Mon logement est-il en règle ? »
  - `php/send.php` — réception des formulaires (fonction `mail()` Hostinger)
  - `.htaccess` — HTTPS, redirections 301 depuis l'ancien WordPress, cache, en-têtes
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

## Déploiement Vercel (aperçu)

`vercel.json` à la racine configure tout : build `node build/build.mjs`, dossier de sortie `site-internet`, redirections 301, en-têtes, `404.html`. Laisser le champ « Root Directory » vide dans les réglages du projet Vercel. Chaque push sur `main` redéploie.

Limite : Vercel n'exécute pas PHP, donc `php/send.php` ne fonctionne pas sur l'aperçu Vercel. Les formulaires basculent automatiquement sur un lien `mailto:` vers contact@conciergeriecapibnb.fr. En production chez Hostinger, l'envoi PHP fonctionne normalement.
