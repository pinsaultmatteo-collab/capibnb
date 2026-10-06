/* CAPIBNB — assistant « Mon logement est-il en règle ? » (page réglementation) */
const root = document.querySelector('[data-wizard]');
if (root) {
  const check = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>';
  const warn = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 20h20Z"/><path d="M12 10v4M12 17.5v.5"/></svg>';
  const list = root.querySelector('[data-wizard-list]');
  const verdict = root.querySelector('[data-wizard-verdict]');
  const title = root.querySelector('[data-wizard-title]');
  const val = (n) => root.querySelector(`[name="${n}"]:checked`)?.value;

  const item = (t, s, w = false) =>
    `<li class="${w ? 'is-warn' : ''}">${w ? warn : check}<span><strong>${t}</strong><small>${s}</small></span></li>`;

  const update = () => {
    const statut = val('statut');
    const nb = val('nb');
    const qui = val('qui');
    const items = [];
    let v = { cls: 'ok', text: 'Situation simple : on s’en occupe en quelques jours.' };

    items.push(item('Numéro d’enregistrement', 'Téléservice national, à afficher sur chaque annonce. Amende jusqu’à 5 000 € sinon.'));

    if (statut === 'principale') {
      items.push(item('Plafond de 120 nuits par an', 'Nous suivons le compteur et bloquons le calendrier avant la limite. Amende jusqu’à 10 000 € en cas de dépassement.', true));
      if (nb !== '1') {
        items.push(item('Un seul logement peut être votre résidence principale', 'Vos autres logements relèvent du régime « résidence secondaire » ci-dessous : autorisation de changement d’usage.', true));
        v = { cls: 'warn', text: 'Mixte : résidence principale + logements secondaires, un dossier par logement.' };
      }
    } else {
      if (qui === 'societe' || nb === '3') {
        items.push(item('Changement d’usage à caractère réel, avec compensation', 'À partir de 3 logements ou en société, il faut compenser en transformant une surface équivalente en habitation (zones A, B, C). Dossier lourd, à étudier au cas par cas.', true));
        v = { cls: 'no', text: 'Dossier complexe : parlons-en avant toute mise en ligne.' };
      } else {
        items.push(item('Autorisation temporaire de changement d’usage', 'Sans compensation, valable 2 ans renouvelables, 2 logements maximum par particulier. Nous déposons le dossier auprès de Toulouse Métropole. Amende jusqu’à 50 000 € sans autorisation.', true));
        items.push(item('90 jours consécutifs maximum par voyageur', 'Nous réglons la durée maximale de séjour sur les plateformes.'));
        v = { cls: 'warn', text: 'Autorisation à obtenir : on monte le dossier avec vous.' };
      }
    }

    items.push(item('Taxe de séjour', 'Collectée par Airbnb et Booking, déclarée pour les réservations directes.'));
    items.push(item('Normes et DPE', 'Décret 2023-695, DPE renforcé en zone tendue. Vérification au lancement.'));
    items.push(item('Classement meublé de tourisme (recommandé)', 'Abattement fiscal de 50 % au lieu de 30 %, plafond micro-BIC porté à 83 600 €. Nous organisons la visite de classement.'));

    list.innerHTML = items.join('');
    verdict.className = `wizard__verdict wizard__verdict--${v.cls}`;
    verdict.innerHTML = `${v.cls === 'ok' ? check : warn}<span>${v.text}</span>`;
    title.textContent = statut === 'principale' ? 'Vos obligations en résidence principale' : 'Vos obligations en résidence secondaire';
  };
  root.addEventListener('change', update);
  update();
}
