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
  $$('[data-count]').forEach((el) => countIO.observe(el));

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

  /* ---------- Formulaires : envoi via php/send.php, repli mailto ---------- */
  $$('form[data-form]').forEach((form) => {
    const status = $('.form__status', form);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.querySelector('[name="site_web"]')?.value) return; // pot de miel
      const btn = form.querySelector('[type="submit"]');
      const data = new FormData(form);
      data.append('page', location.pathname);
      btn.disabled = true;
      const old = btn.innerHTML;
      btn.textContent = 'Envoi…';
      try {
        const res = await fetch(form.getAttribute('action') || '/php/send.php', { method: 'POST', body: data });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json().catch(() => ({ ok: true }));
        if (!json.ok) throw new Error(json.error || 'Erreur');
        status.className = 'form__status is-ok';
        status.textContent = 'Merci ! Votre message est bien parti. Dylan vous répond sous 24 h.';
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

  /* ---------- Année courante ---------- */
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
})();
