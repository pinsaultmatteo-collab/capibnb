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

- [x] **Vercel** : `SMTP_USER` et `SMTP_PASS` renseignés, connexion SMTP Hostinger validée par le diagnostic le 20/10/2026.
- [x] Envoi test depuis /contact/ validé par Mattéo le 20/10/2026 : récapitulatif et accusé de réception reçus, événement generate_lead visible dans GA4.
- [x] Boîte contact@ hébergée chez Hostinger (MX, SPF, DKIM et DMARC en place).
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
- [x] Mentions légales : hébergeur du site Vercel Inc. (depuis la mise en ligne du 20/10/2026), domaine et messagerie Hostinger.
- [ ] Informations réglementaires et fiscales : à jour en octobre 2026 selon la fiche ; à faire relire si doute (DPE, loi Le Meur, micro-BIC).

## Mesure d'audience GA4 (G-02L6WB0EZT)

- [x] Balise GA4 chargée pour tous les visiteurs. **Bandeau de consentement désactivé le 20/10/2026 par décision de Mattéo, qui a conscience du risque CNIL** (Google Analytics n'est pas exempté de consentement). Opposition possible depuis la page confidentialité. Pour réactiver le bandeau : `consentBanner: true` dans l'objet `SITE` de `build/build.mjs`, puis rebuild (le texte de la page confidentialité sera alors à remettre au format « uniquement après acceptation »).
- [ ] Dans GA4 (Administration, Événements) : marquer `generate_lead` et `click_phone` comme **événements clés** (conversions). Ils apparaissent dans la liste après leur premier déclenchement.
- [ ] Dans GA4 (Définitions personnalisées) : créer les dimensions personnalisées d'événement `link_location`, `phone_action`, `form_name`, `request_type`, `property_type`, `simulator`, `area` pour les lire dans les rapports.
- [ ] Dans GA4 (Paramètres des données, Conservation) : passer la conservation à 14 mois ; laisser Google Signals désactivé.
- [ ] Carte Google Maps de la page Contact : chargée sans consentement à la demande de Dylan ; pour une conformité CNIL stricte, la conditionner au consentement ou la remplacer par une carte OpenStreetMap.

## Mise en ligne (20/10/2026)

- [x] Domaine conciergeriecapibnb.fr pointé vers Vercel (A @ 216.150.1.1, CNAME www vers Vercel), adresse sans www principale, www redirigé en 308, certificat HTTPS Let's Encrypt actif.
- [x] Enregistrements mail Hostinger conservés (MX, SPF, DKIM, autodiscover, autoconfig).
- [ ] Ancien WordPress : toujours hébergé chez Hostinger mais plus relié au domaine. À garder comme sauvegarde quelques semaines avant suppression.

## Technique (Mattéo)

- [ ] (Seulement si le site quitte Vercel pour Hostinger) tester `php/send.php` (fonction `mail()`).
- [x] Anciennes adresses WordPress redirigées sur Vercel (`/?page_id=1381`, `1438`, `1455`, `/estimation`, `/wp-admin`, `/wp-content`), vérifié en ligne le 20/10/2026.
- [ ] Search Console : valider le domaine (TXT `google-site-verification` ajouté chez Hostinger), puis soumettre `sitemap.xml`.
- [ ] Fiche Google Business : lien vers https://conciergeriecapibnb.fr et adresse identique au site.
