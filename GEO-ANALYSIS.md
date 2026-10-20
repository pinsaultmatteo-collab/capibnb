# CAPIBNB : référencement par les moteurs de recherche IA (GEO)

Analyse et mise en œuvre du 20/10/2026 sur https://conciergeriecapibnb.fr (site statique généré par `build/build.mjs`, hébergé sur Vercel).

## Score de préparation GEO

| | Avant (20/10, matin) | Après mise en œuvre |
| --- | --- | --- |
| Citabilité du contenu (25 %) | 16/25 | 21/25 |
| Structure et lisibilité (20 %) | 15/20 | 18/20 |
| Contenus multimodaux (15 %) | 11/15 | 11/15 |
| Autorité et signaux de marque (20 %) | 6/20 | 8/20 |
| Accessibilité technique (20 %) | 12/20 | 19/20 |
| **Total** | **60/100** | **77/100** |

Le site lui-même est maintenant au niveau. Les points manquants sont hors site : avis, fiche Google Business, mentions de la marque ailleurs sur le web.

| Plateforme | Ce qui compte | État |
| --- | --- | --- |
| Google AI Overviews / AI Mode | Bon classement Google, passages courts et factuels | Bonne base (SEO fait, FAQ, données structurées) ; dépend du classement qui se construit |
| ChatGPT Search | Index Bing, sources tierces (annuaires, Reddit, Wikipédia) | Bing Webmaster Tools et IndexNow à activer ; peu de mentions externes |
| Perplexity | Pages accessibles, forums et discussions | Robots autorisés ; aucune présence sur les forums |
| Copilot | Index Bing | Comme ChatGPT |
| Claude | Pages accessibles, llms.txt | Prêt |

## Ce qui a été mis en place

1. **`/llms.txt`** (format llmstxt.org) : présentation en deux phrases, faits clés (tarif, inclus, zone, démarrage, estimation type, contact, identité légale), repères chiffrés sur Toulouse avec leurs sources, sommaire commenté des pages et des articles.
2. **`/llms-full.txt`** : tout le contenu utile du site en un seul fichier Markdown (environ 14 000 mots).
3. **Version Markdown de chaque page** (`/index.md`, `/tarifs.md`, `/blog/<article>.md`…), générée depuis le HTML : texte, titres, listes, tableaux et liens absolus, sans scène 3D ni formulaires ; source, auteur et date en tête ; coordonnées en pied. Annoncée par `<link rel="alternate" type="text/markdown">` et servie avec un en-tête `Link: rel="canonical"` vers la page HTML.
4. **robots.txt** : accès explicite pour GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Applebot(-Extended), Bingbot, DuckAssistBot, Amazonbot, Meta, Mistral, Cohere, You.com et Common Crawl, plus `Content-Signal: search=yes, ai-input=yes, ai-train=yes`. Choix assumé : pour une entreprise locale, être connue des modèles (y compris via l'entraînement) est un avantage.
5. **Rendu sans JavaScript** : les robots IA n'exécutent pas le JavaScript. Les compteurs affichaient « 0 » et le simulateur « 0 € » ; les vraies valeurs (−38,8 %, 4 200 annonces, 1 430 €/mois pour un T2 aux Carmes…) et la liste des quartiers sont désormais écrites dans le HTML.
6. **Données structurées** :
   - LocalBusiness enrichie : date de création, fondateur relié à sa page, SIREN, TVA, point de contact, domaines d'expertise. Les horaires sont alignés sur la page Contact.
   - Person (Dylan, `#dylan`), désormais auteur reconnu des articles.
   - WebSite relié à l'entreprise.
   - **FAQPage générée automatiquement** depuis les FAQ visibles, sur 5 pages et 30 questions. Avant, les FAQ codées à la main sur Tarifs et Réglementation ne correspondaient plus au texte affiché.
   - **BreadcrumbList** sur toutes les pages internes.
7. **FAQ sur l'accueil** : 6 questions formulées comme les requêtes des internautes (« Qu'est-ce qu'une conciergerie Airbnb ? », « Combien coûte… », « Combien rapporte… », « Est-ce autorisé à Toulouse ? », zone, démarrage), chacune avec une réponse directe de 50 à 80 mots, autonome et chiffrée.
8. **IndexNow** : clé en ligne, script `node build/indexnow.mjs` pour prévenir Bing, Yandex et Seznam à chaque mise en ligne.

## Citabilité : passages forts

- Accueil, FAQ : définition de la conciergerie Airbnb, coût comparé au marché (23 à 28 % contre 22 % TTC), revenu type d'un T2.
- Tarifs : grille complète et exemple chiffré T2 Carmes, du chiffre d'affaires au net.
- Réglementation et article 2026 : règles numérotées, amendes, dates (20 mai 2026, 120 nuits, 50 000 €).
- Article classement : tableau micro-BIC 15 000 € / 30 % contre 83 600 € / 50 %.

Ce sont des blocs autonomes, datés et sourcés, du type que les IA reprennent.

## Les 5 actions qui feront le plus progresser (hors site)

1. **Fiche Google Business complète** et cohérente avec le site (nom, adresse, téléphone, horaires, catégorie, photos), puis des avis réguliers. C'est la première source des IA pour « conciergerie Airbnb Toulouse ».
2. **Bing Webmaster Tools** : import depuis la Search Console en deux clics, puis `node build/indexnow.mjs`. ChatGPT Search et Copilot s'appuient sur Bing.
3. **Mentions de la marque** : page LinkedIn, annuaires (Pages Jaunes, comparateurs de conciergeries), interventions dans les groupes d'investisseurs toulousains et sur Reddit, une ou deux vidéos YouTube. Selon Ahrefs (décembre 2025), les mentions de marque sont environ trois fois plus corrélées à la visibilité dans les IA que les liens entrants.
4. **Chiffres propres à CAPIBNB** (logements gérés, occupation réelle, note Airbnb, Superhost). Une donnée inédite est ce qui se cite le plus.
5. **Liens `sameAs`** : renseigner Instagram, Facebook, Google, Airbnb, Booking et LinkedIn dans l'objet `SITE`, pour relier l'entité CAPIBNB à ses profils.

## Pistes de contenu

- Un article par grande question encore sans page dédiée : « Conciergerie ou gestion soi-même ? », « Quel quartier de Toulouse pour un Airbnb ? » (avec les chiffres par quartier du simulateur), « Taxe de séjour à Toulouse : montants 2026 ».
- Dater et signer chaque mise à jour des pages Réglementation et Tarifs (« mis à jour le … par Dylan Carvalho »).
- Un tableau comparatif chiffré par quartier, déjà présent sous forme de plaques sur l'accueil, à reprendre sur une page dédiée.
