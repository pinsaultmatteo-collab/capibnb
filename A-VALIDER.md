# CAPIBNB — Points à valider avec Dylan avant mise en ligne

Liste des affirmations présentes sur le nouveau site qui reposent sur la fiche de référence ou sur des hypothèses raisonnables, et qu'il faut confirmer (ou corriger) avant publication.

## Offre commerciale

- [ ] **Sans engagement de durée** — affirmé sur Tarifs (FAQ), CGV art. 8, CTA. La fiche indique « à confirmer ».
- [x] **Forfait consommables** : 25 à 35 € par mois (corrigé par Dylan le 14/10/2026 ; le PDF indiquait 20 à 30 €). Le simulateur utilise studio 25 €, T1 27 €, T2 30 €, T3 32 €, T4+/maison 35 € (`simulateur.js`, objet `TYPO`).
- [ ] **Exemple chiffré T2 Carmes** (page Tarifs, articles de blog) : chiffres indicatifs à remplacer par la simulation réelle que Dylan doit envoyer (en attente au 15/10/2026).
- [ ] **Carte Google Maps** affichée directement sur la page Contact (demande de Dylan) : Google dépose des cookies sans consentement préalable ; à couvrir par un bandeau de consentement si vous activez un outil de mesure d'audience.
- [x] **Pas de frais d'inscription** et **petits travaux / rénovation** : confirmés par le PDF de Dylan (06/10/2026), repris sur Accueil, Services, Tarifs, CGV.
- [ ] **« Réponses immédiates »** aux voyageurs : formulation du PDF, reprise prudemment en « réponse rapide 7j/7 ».
- [ ] **Circuit de paiement** — le site dit « relevé mensuel + virement du net ». À confirmer (qui encaisse les plateformes ? délai de reversement ?).
- [ ] **Relevé mensuel détaillé et récapitulatif annuel** — présentés comme inclus.
- [ ] **Accompagnement au classement meublé de tourisme** — présenté comme inclus (le propriétaire paie l'organisme de classement).
- [ ] **Dossier de changement d'usage** monté avec le propriétaire — présenté comme inclus.
- [ ] **Réponse aux voyageurs en français et en anglais** (page Services).
- [ ] **Horaires** affichés sur Contact : lundi au samedi 9 h–19 h, urgences voyageurs 7j/7 ; JSON-LD : 8 h–21 h tous les jours.
- [ ] **Zone d'intervention** : Toulouse + Blagnac, Colomiers, Balma, Ramonville, Saint-Orens cités en exemple.
- [ ] **Réparations refacturées au coût réel sans marge** (Tarifs FAQ, CGV art. 3).
- [ ] **Sous-location** (objet social) : non mentionnée sur le site. À décider.

## Chiffres et preuves

- [ ] **Note Google 5/5** — affichée partout. Vérifier la fiche Google Business et récupérer le lien « laisser un avis » (placeholder `#` dans `build/build.mjs`, clé `google`, et sur la page Avis).
- [ ] **Statistiques de marché** (AirDNA/AirROI : −38,8 %, ~4 200 annonces, 67 %, 36 jours) — issues de la fiche de référence, sources citées sur le site.
- [ ] **Hypothèses du simulateur** (prix/nuit, occupation, loyers par typologie et quartier) — à comparer avec les chiffres réels des logements gérés par Dylan. Tout est centralisé dans `simulateur.js` (`TYPO`, `QUARTIERS`, `STANDING`, `SEASON`).
- [ ] **Chiffres à ajouter dès réception** : nombre de logements gérés, taux d'occupation réel, note moyenne Airbnb, statut Superhost, voyageurs accueillis.

## Formulaires (mail récapitulatif)

- [ ] **Vercel** : renseigner `SMTP_USER` et `SMTP_PASS` (boîte contact@conciergeriecapibnb.fr) dans Settings → Environment Variables, redéployer, puis faire un envoi test depuis /contact/. Vérifier que le mail n'arrive pas en indésirables.
- [ ] Confirmer où est hébergée la boîte contact@conciergeriecapibnb.fr (Hostinger par défaut : `smtp.hostinger.com`, port 465) ; sinon adapter `SMTP_HOST` / `SMTP_PORT`.
- [x] Accusé de réception automatique au prospect : activé (20/10/2026). Faire relire le texte à Dylan (promesse « sous 24 h », visite gratuite et sans engagement, mise en ligne sous une dizaine de jours).

## Liens et comptes à renseigner (`build/build.mjs`, objet `SITE`)

- [ ] Instagram, Facebook (actuellement `#`)
- [ ] Fiche Google Business (lien avis)
- [ ] Profil hôte Airbnb, profil Booking (boutons de la page Voyageurs)
- [x] Expéditeur des formulaires : contact@conciergeriecapibnb.fr lui-même (plus besoin d'adresse technique).

## Photos

- [ ] Photos réelles de 3 à 5 logements supplémentaires, de la boîte à clés, du linge (les 3 photos actuelles viennent de l'ancien site).
- [ ] Image Open Graph générée automatiquement (`assets/img/og-capibnb.jpg`) : à remplacer éventuellement par une vraie photo.

## Juridique

- [ ] CGV : version de travail à relire par Dylan et son conseil (médiateur de la consommation à désigner).
- [ ] Mentions légales : hébergeur Hostinger indiqué ; vérifier l'offre exacte.
- [ ] Informations réglementaires et fiscales : à jour en octobre 2026 selon la fiche ; à faire relire si doute (DPE, loi Le Meur, micro-BIC).

## Technique (Mattéo)

- [ ] Tester `php/send.php` sur Hostinger (fonction `mail()` activée, SPF du domaine).
- [ ] Vérifier les 301 de `.htaccess` une fois le site en ligne (`/?page_id=1381`, `1438`, `1455`).
- [ ] Soumettre `sitemap.xml` dans la Search Console.
