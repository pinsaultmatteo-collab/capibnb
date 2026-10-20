/* CAPIBNB — script principal (navigation, apparitions, compteurs, FAQ, formulaires) */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header : rétrécit au scroll, se cache en descendant ---------- */
  const header = $('[data-header]');
  if (header) {
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 24);
      const goingDown = y > lastY && y > 320;
      header.classList.toggle('is-hidden', goingDown && !document.body.classList.contains('menu-open'));
      lastY = y;
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  /* ---------- Menu mobile ---------- */
  const toggle = $('[data-nav-toggle]');
  const menu = $('[data-menu-mobile]');
  if (toggle && menu) {
    $$('.menu-mobile__links li', menu).forEach((li, i) => li.style.setProperty('--n', i + 1));
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => e.key === 'Escape' && setOpen(false));
  }

  /* ---------- Apparitions au scroll ---------- */
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-inview');
          revealIO.unobserve(e.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  );
  $$('[data-reveal], [data-reveal-group], [data-draw], [data-inview]').forEach((el) => revealIO.observe(el));

  /* ---------- Compteurs animés ---------- */
  const fmt = new Intl.NumberFormat('fr-FR');
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count.replace(',', '.'));
    const decimals = (el.dataset.count.split(/[.,]/)[1] || '').length;
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const dur = 1600;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 4);
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const v = target * ease(p);
      el.textContent = prefix + fmt.format(Number(v.toFixed(decimals))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    if (reduceMotion) {
      el.textContent = prefix + fmt.format(target) + suffix;
    } else requestAnimationFrame(step);
  };
  const countIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animateCount(e.target);
          countIO.unobserve(e.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  // Le HTML contient déjà la valeur finale (lisible sans JavaScript) : on repart de 0 pour l'animation
  $$('[data-count]').forEach((el) => {
    if (!reduceMotion) el.textContent = (el.dataset.prefix || '') + '0' + (el.dataset.suffix || '');
    countIO.observe(el);
  });

  /* ---------- Boutons : halo qui suit le curseur + effet magnétique ---------- */
  $$('.btn').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      btn.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  });
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.28}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ---------- Titre du hero : apparition mot à mot ---------- */
  $$('[data-split]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    const html = el.innerHTML;
    // conserve les <em> : on découpe par nœuds
    const frag = document.createDocumentFragment();
    let i = 0;
    const wrap = (text, em) => {
      text.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(' '));
        const w = document.createElement('span');
        w.className = 'word';
        const inner = document.createElement(em ? 'em' : 'span');
        if (em) {
          const s = document.createElement('span');
          s.textContent = part;
          s.style.setProperty('--i', i++);
          inner.appendChild(s);
          w.appendChild(inner);
        } else {
          inner.textContent = part;
          inner.style.setProperty('--i', i++);
          w.appendChild(inner);
        }
        frag.appendChild(w);
      });
    };
    el.childNodes.forEach((n) => {
      if (n.nodeType === 3) wrap(n.textContent, false);
      else if (n.nodeName === 'EM') wrap(n.textContent, true);
      else if (n.nodeName === 'BR') frag.appendChild(document.createElement('br'));
    });
    el.innerHTML = '';
    el.appendChild(frag);
    void words, html;
  });

  /* ---------- Accordéon FAQ ---------- */
  $$('.faq').forEach((faq) => {
    $$('.faq__item', faq).forEach((item) => {
      const q = $('.faq__q', item);
      const a = $('.faq__a', item);
      if (!q || !a) return;
      q.setAttribute('aria-expanded', 'false');
      a.setAttribute('aria-hidden', 'true');
      q.addEventListener('click', () => {
        const open = item.classList.toggle('is-open');
        q.setAttribute('aria-expanded', String(open));
        a.setAttribute('aria-hidden', String(!open));
      });
    });
    // ouvre le premier
    const first = $('.faq__item', faq);
    if (first) $('.faq__q', first).click();
  });

  /* ---------- Orbite des métiers (accueil) : schéma sticky, étapes au scroll ---------- */
  const orbit = $('[data-orbit]');
  if (orbit) {
    const nodes = $$('.orbit__node', orbit);
    const steps = $$('.metier-step');
    const label = $('[data-orbit-label]', orbit);
    const names = ['Lancement', 'Revenus', 'Voyageurs', 'Intendance', 'Administratif'];
    let current = -1;
    const activate = (i) => {
      if (i === current) return;
      current = i;
      nodes.forEach((n, k) => n.classList.toggle('is-active', k === i));
      steps.forEach((n, k) => n.classList.toggle('is-active', k === i));
      if (label) label.textContent = `0${i + 1} · ${names[i] || ''}`;
    };
    // positionne les nœuds sur l'anneau SVG (r = 240/560)
    nodes.forEach((node, i) => {
      const ang = -90 + (360 / nodes.length) * i;
      node.style.left = 50 + 42.8 * Math.cos((ang * Math.PI) / 180) + '%';
      node.style.top = 50 + 42.8 * Math.sin((ang * Math.PI) / 180) + '%';
    });
    // l'étape qui traverse le centre de l'écran s'allume
    if (steps.length) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) activate(Number(e.target.dataset.step));
          });
        },
        { rootMargin: '-42% 0px -42% 0px', threshold: 0 }
      );
      steps.forEach((st) => io.observe(st));
      // clic sur un nœud : on fait défiler jusqu'à l'étape
      nodes.forEach((n, i) =>
        n.addEventListener('click', () => {
          const target = steps[i];
          const top = target.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2 + target.offsetHeight / 2;
          window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
        })
      );
    } else {
      nodes.forEach((n, i) => n.addEventListener('click', () => activate(i)));
    }
    activate(0);
  }

  /* ---------- Inclinaison 3D au survol ([data-tilt]) ---------- */
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', `${px * 14}deg`);
        el.style.setProperty('--rx', `${-py * 14}deg`);
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--ry', '0deg');
        el.style.setProperty('--rx', '0deg');
      });
    });
  }

  /* ---------- Frise du turnover épinglée (GSAP) ---------- */
  const turnover = $('[data-turnover]');
  if (turnover && window.gsap && window.ScrollTrigger && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);
    const mq = window.matchMedia('(min-width: 761px)');
    const setup = () => {
      const track = $('.turnover__track', turnover);
      const progress = $('.turnover__progress span', turnover);
      const getScroll = () => track.scrollWidth - turnover.clientWidth + 48;
      gsap.to(track, {
        x: () => -getScroll(),
        ease: 'none',
        scrollTrigger: {
          trigger: turnover,
          start: 'top top',
          end: () => '+=' + getScroll(),
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => progress && (progress.style.transform = `scaleX(${self.progress})`),
        },
      });
    };
    if (mq.matches) setup();
  }

  /* ---------- Parallaxe léger sur les images marquées ---------- */
  if (window.gsap && window.ScrollTrigger && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);
    $$('[data-parallax]').forEach((el) => {
      const amt = parseFloat(el.dataset.parallax || '40');
      gsap.fromTo(
        el,
        { y: amt },
        {
          y: -amt,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        }
      );
    });
  }

  /* ---------- Barres de comparaison : déclenchement à la vue ---------- */
  $$('.compare, .vs').forEach((el) => revealIO.observe(el));

  /* ---------- Formulaires : envoi à /api/contact (Vercel ou PHP Hostinger), repli mailto ---------- */
  const pageLoadedAt = Date.now();
  $$('form[data-form]').forEach((form) => {
    const status = $('.form__status', form);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.querySelector('[name="site_web"]')?.value) return; // pot de miel
      const btn = form.querySelector('[type="submit"]');
      const data = new FormData(form);
      data.append('page', location.pathname);
      data.append('_t', String(Date.now() - pageLoadedAt));
      btn.disabled = true;
      const old = btn.innerHTML;
      btn.textContent = 'Envoi…';
      try {
        const res = await fetch(form.getAttribute('action') || '/api/contact/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: new URLSearchParams(data),
        });
        const json = await res.json().catch(() => ({}));
        if (res.status === 422 && json.error) {
          status.className = 'form__status is-err';
          status.textContent = json.error;
          return;
        }
        if (!res.ok || !json.ok) throw new Error(json.error || 'HTTP ' + res.status);
        status.className = 'form__status is-ok';
        status.textContent = 'Merci ! Votre demande est bien partie. Dylan vous répond sous 24 h.';
        track('generate_lead', {
          form_name: location.pathname.startsWith('/simulateur') ? 'simulateur' : 'contact',
          lead_source: 'site',
          request_type: data.get('sujet') || undefined,
          property_type: data.get('typologie') || undefined,
        });
        form.reset();
      } catch (err) {
        // repli : ouvre le client mail avec le contenu
        const lines = [];
        data.forEach((v, k) => {
          if (k !== 'site_web' && k !== 'page' && v) lines.push(`${k} : ${v}`);
        });
        const subject = encodeURIComponent(form.dataset.subject || 'Demande via le site CAPIBNB');
        const body = encodeURIComponent(lines.join('\n'));
        status.className = 'form__status is-err';
        status.innerHTML = `L’envoi automatique n’a pas abouti. <a href="mailto:contact@conciergeriecapibnb.fr?subject=${subject}&body=${body}" style="text-decoration:underline">Cliquez ici pour envoyer par e-mail</a> ou appelez le 06 19 48 59 05.`;
      } finally {
        btn.disabled = false;
        btn.innerHTML = old;
      }
    });
  });

  /* ---------- Sliders : remplissage visuel ---------- */
  $$('input[type="range"]').forEach((r) => {
    const paint = () => {
      const p = ((r.value - r.min) / (r.max - r.min)) * 100;
      r.style.setProperty('--p', p + '%');
    };
    r.addEventListener('input', paint);
    paint();
  });

  /* ---------- Carte Google Maps chargée à la demande (RGPD) ---------- */
  $$('[data-map-load]').forEach((box) => {
    const btn = $('button', box);
    const tpl = $('template', box);
    if (!btn || !tpl) return;
    btn.addEventListener('click', () => {
      box.innerHTML = '';
      box.appendChild(tpl.content.cloneNode(true));
      box.style.filter = 'none';
    });
  });

  /* ---------- Consentement cookies (Google Analytics 4) ---------- */
  const CONSENT_KEY = 'capibnb-consent';
  const SIX_MONTHS = 15768e6;
  const readConsent = () => {
    try {
      const c = JSON.parse(localStorage.getItem(CONSENT_KEY));
      return c && Date.now() - c.t < SIX_MONTHS ? c.v : null;
    } catch {
      return null;
    }
  };
  const saveConsent = (v) => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ v, t: Date.now() }));
    } catch {}
  };
  const loadGA = () => {
    if (!window.CAPI_GA4 || document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + window.CAPI_GA4;
    document.head.appendChild(s);
  };
  const clearGaCookies = () => {
    const host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0].trim();
      if (!/^_ga/.test(name)) return;
      [host, '.' + host, ''].forEach((d) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? '; domain=' + d : ''}`;
      });
    });
  };
  const consentBox = $('[data-consent]');
  const showConsent = () => {
    if (!consentBox) return;
    consentBox.hidden = false;
    void consentBox.offsetWidth; // force le rendu avant l'animation d'entrée
    consentBox.classList.add('is-visible');
  };
  const hideConsent = () => {
    if (!consentBox) return;
    consentBox.classList.remove('is-visible');
    setTimeout(() => (consentBox.hidden = true), 400);
  };
  if (consentBox) {
    $$('[data-consent-choice]', consentBox).forEach((b) =>
      b.addEventListener('click', () => {
        const v = b.dataset.consentChoice;
        saveConsent(v);
        if (typeof window.gtag === 'function') window.gtag('consent', 'update', { analytics_storage: v });
        if (v === 'granted') loadGA();
        else clearGaCookies();
        hideConsent();
      })
    );
    if (!readConsent()) setTimeout(showConsent, 1200);
  }
  $$('a[href="#gerer-cookies"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      showConsent();
    })
  );
  // Bouton de la page confidentialité : désactiver / réactiver la mesure d'audience sur ce navigateur
  $$('[data-ga-optout]').forEach((b) => {
    const label = $('[data-ga-optout-state]');
    const render = () => {
      const off = readConsent() === 'denied';
      b.textContent = off ? 'Réactiver la mesure d’audience' : 'Désactiver la mesure d’audience';
      if (label) label.textContent = off ? 'désactivée sur ce navigateur' : 'active sur ce navigateur';
    };
    b.addEventListener('click', () => {
      const off = readConsent() === 'denied';
      const v = off ? 'granted' : 'denied';
      saveConsent(v);
      if (typeof window.gtag === 'function') window.gtag('consent', 'update', { analytics_storage: v });
      if (v === 'granted') loadGA();
      else clearGaCookies();
      render();
    });
    render();
  });

  /* ---------- Mesure d'audience : événements GA4 (envoyés seulement après consentement) ---------- */
  function track(name, params = {}) {
    if (typeof window.gtag !== 'function') return;
    Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
    window.gtag('event', name, params);
  }
  const zoneOf = (el) =>
    el.closest('.site-header') ? 'header'
    : el.closest('.menu-mobile') ? 'menu_mobile'
    : el.closest('.site-footer') ? 'footer'
    : el.closest('.cta-final') ? 'cta_bas_de_page'
    : el.closest('.form__status') ? 'formulaire_secours'
    : el.closest('.contact') ? 'page_contact'
    : (el.closest('section[id], section[aria-labelledby]')?.getAttribute('aria-labelledby') || 'page');
  // Clics sur un numéro de téléphone (capture : avant que le bouton « Appeler » ne révèle le numéro)
  document.addEventListener(
    'click',
    (e) => {
      const a = e.target.closest('a[href^="tel:"]');
      if (a) {
        const reveal = a.matches('[data-call]') && !a.classList.contains('is-revealed') && !window.matchMedia('(pointer: coarse)').matches;
        track('click_phone', { link_location: zoneOf(a), phone_action: reveal ? 'affichage_numero' : 'appel' });
        return;
      }
      const m = e.target.closest('a[href^="mailto:"]');
      if (m) track('click_email', { link_location: zoneOf(m) });
    },
    true
  );
  // Première utilisation du simulateur sur la page
  $$('[data-sim]').forEach((root) => {
    let done = false;
    root.addEventListener('change', () => {
      if (done) return;
      done = true;
      track('simulator_use', {
        simulator: root.dataset.sim === 'full' ? 'complet' : 'compact',
        property_type: root.querySelector('[name="typo"]:checked')?.value,
        area: root.querySelector('[name="quartier"]')?.value,
      });
    });
  });

  /* ---------- Bouton « Appeler » : numéro révélé sur ordinateur ---------- */
  $$('[data-call]').forEach((a) => {
    a.addEventListener('click', (e) => {
      // (le clic est mesuré par l'écouteur global click_phone plus bas)
      // sur ordinateur, le premier clic affiche le numéro ; le second lance l'appel
      const mobile = window.matchMedia('(pointer: coarse)').matches;
      if (!mobile && !a.classList.contains('is-revealed')) {
        e.preventDefault();
        const label = a.querySelector('span');
        const num = a.getAttribute('href').replace('tel:+33', '0').replace(/(\d{2})(?=\d)/g, '$1 ');
        if (label) label.textContent = num;
        else a.textContent = num;
        a.classList.add('is-revealed');
      }
    });
  });

  /* ---------- Défileur horizontal ([data-scroller]) : flèches (plusieurs paires possibles), points, compteur ---------- */
  $$('[data-scroller]').forEach((sc) => {
    const scope = sc.closest('section') || document;
    const prevs = $$('[data-scroll-prev]', scope);
    const nexts = $$('[data-scroll-next]', scope);
    const dotsBox = $('[data-scroll-dots]', scope);
    const countEl = $('[data-scroll-count]', scope);
    const items = Array.from(sc.children);
    const byItem = sc.dataset.scrollStep === 'item';
    const behavior = reduceMotion ? 'auto' : 'smooth';
    const left0 = () => (items[0] ? items[0].offsetLeft : 0);
    const current = () => {
      let best = 0;
      let bd = Infinity;
      items.forEach((it, i) => {
        const d = Math.abs(it.offsetLeft - left0() - sc.scrollLeft);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      return best;
    };
    const goTo = (i) => {
      i = Math.max(0, Math.min(items.length - 1, i));
      sc.scrollTo({ left: items[i].offsetLeft - left0(), behavior });
    };
    if (dotsBox) {
      items.forEach((_, i) => {
        const d = document.createElement('button');
        d.type = 'button';
        d.setAttribute('aria-label', `Aller à la carte ${i + 1}`);
        d.addEventListener('click', () => goTo(i));
        dotsBox.appendChild(d);
      });
    }
    const step = () => Math.max(200, sc.clientWidth * 0.8);
    const update = () => {
      const atStart = sc.scrollLeft <= 8;
      const atEnd = sc.scrollLeft + sc.clientWidth >= sc.scrollWidth - 8;
      prevs.forEach((b) => (b.disabled = atStart));
      nexts.forEach((b) => (b.disabled = atEnd));
      const c = current();
      if (dotsBox) Array.from(dotsBox.children).forEach((d, j) => d.classList.toggle('is-active', j === c));
      if (countEl) countEl.textContent = `${c + 1} / ${items.length}`;
    };
    prevs.forEach((b) => b.addEventListener('click', () => (byItem ? goTo(current() - 1) : sc.scrollBy({ left: -step(), behavior }))));
    nexts.forEach((b) => b.addEventListener('click', () => (byItem ? goTo(current() + 1) : sc.scrollBy({ left: step(), behavior }))));
    sc.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ---------- Slider photo ([data-slider]) : flèches, points, balayage, clavier ---------- */
  $$('[data-slider]').forEach((sl) => {
    const track = $('.slider__track', sl);
    const slides = track ? Array.from(track.children) : [];
    const n = slides.length;
    const count = $('.slider__count', sl);
    if (n < 2) {
      sl.classList.add('is-single');
      return;
    }
    const ic = (rot) =>
      `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'slider__arrow slider__arrow--prev';
    prev.setAttribute('aria-label', 'Photo précédente');
    prev.innerHTML = ic();
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'slider__arrow slider__arrow--next';
    next.setAttribute('aria-label', 'Photo suivante');
    next.innerHTML = ic();
    const dots = document.createElement('div');
    dots.className = 'slider__dots';
    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.setAttribute('aria-label', `Photo ${i + 1} sur ${n}`);
      d.addEventListener('click', () => go(i));
      dots.appendChild(d);
    });
    sl.append(prev, next, dots);
    let i = 0;
    const go = (k) => {
      i = (k + n) % n;
      track.style.transform = `translateX(-${i * 100}%)`;
      Array.from(dots.children).forEach((d, j) => d.classList.toggle('is-active', j === i));
      if (count) count.textContent = `${i + 1}/${n}`;
    };
    prev.addEventListener('click', () => go(i - 1));
    next.addEventListener('click', () => go(i + 1));
    sl.tabIndex = 0;
    sl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') go(i - 1);
      if (e.key === 'ArrowRight') go(i + 1);
    });
    // balayage au doigt / à la souris
    let x0 = null;
    sl.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      x0 = e.clientX;
    });
    sl.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
    });
    sl.addEventListener('pointercancel', () => (x0 = null));
    go(0);
  });

  /* ---------- Année courante ---------- */
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
})();
