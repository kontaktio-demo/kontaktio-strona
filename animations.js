/* ==========================================================================
   Kontaktio — advanced scroll & entrance animations.
   Layered on top of styles.css "reveal" baseline. Falls back gracefully
   if GSAP is unavailable or the user prefers reduced motion.
   ========================================================================== */
(() => {
  if (typeof window === 'undefined') return;

  const reduce = window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const g = window.gsap;
  const ST = window.ScrollTrigger;
  if (!g || !ST) return;

  g.registerPlugin(ST);

  /* When GSAP takes over an element we strip the .reveal class so the CSS
     baseline transition cannot fight the JS animation, and we set the
     "from" state synchronously to avoid any single-frame flash. */
  const handover = (els, from) => {
    els.forEach(el => el.classList.remove('reveal'));
    g.set(els, from);
  };

  /* ── Hero entrance ────────────────────────────────────────────────── */
  const hero = document.querySelector('.hero');
  if (hero) {
    const title = hero.querySelector('.hero-title');
    const lead  = hero.querySelector('.hero-lead');
    const acts  = hero.querySelectorAll('.hero-actions > *');
    const cue   = hero.querySelector('.scroll-cue');

    const heroEls = [title, lead, ...acts, cue].filter(Boolean);
    handover(heroEls, { opacity: 0, y: 60 });
    if (title) g.set(title, { scale: 0.96, rotateX: 12, transformOrigin: 'top center' });

    const tl = g.timeline({ defaults: { ease: 'power4.out' } });
    if (title) tl.to(title, { opacity: 1, y: 0, duration: 1.2, scale: 1, rotateX: 0 }, 0);
    if (lead)  tl.to(lead,  { opacity: 1, y: 0, duration: 1.0 }, 0.25);
    if (acts.length) tl.to(acts, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 }, 0.45);
    if (cue)   tl.to(cue,   { opacity: 1, y: 0, duration: 0.9 }, 0.7);
  }

  /* ── Hero orbs parallax tied to scroll ───────────────────────────── */
  document.querySelectorAll('.hero-orb').forEach((orb, i) => {
    g.to(orb, {
      yPercent: 35 + i * 20,
      xPercent: (i % 2 === 0 ? -1 : 1) * 12,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  });

  /* ── Section headers ──────────────────────────────────────────────── */
  g.utils.toArray('.section-header').forEach(el => {
    handover([el], { opacity: 0, y: 60 });
    g.to(el, {
      opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  /* ── Sub-page header ─────────────────────────────────────────────── */
  const subhead = document.querySelector('.subhead');
  if (subhead) {
    const subEls = subhead.querySelectorAll('.crumb, h1, .t-lead');
    handover(Array.from(subEls), { opacity: 0, y: 40 });
    g.to(subEls, {
      opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12
    });
  }

  /* ── Card entrances (principles, capabilities, pricing, team…) ───── */
  const groups = [
    { sel: '.principle',     from: { opacity: 0, y: 80, rotateX: 18 } },
    { sel: '.cap',           from: { opacity: 0, y: 80, scale: 0.96 } },
    { sel: '.price-card',    from: { opacity: 0, y: 80, scale: 0.96 } },
    { sel: '.team-card',     from: { opacity: 0, y: 80, rotateY: 8 } },
    { sel: '.contact-card',  from: { opacity: 0, y: 60 } },
    { sel: '.process-step',  from: { opacity: 0, y: 60 } },
    { sel: '.showcase-list li', from: { opacity: 0, y: 24 } },
    { sel: '.faq-item',      from: { opacity: 0, y: 30 } }
  ];
  groups.forEach(({ sel, from }) => {
    const els = Array.from(document.querySelectorAll(sel));
    if (!els.length) return;
    handover(els, from);
    ST.batch(els, {
      start: 'top 88%',
      onEnter: batch => g.to(batch, {
        opacity: 1, y: 0, scale: 1, rotateX: 0, rotateY: 0,
        duration: 0.9, ease: 'power3.out', stagger: 0.1,
        transformPerspective: 800, transformOrigin: 'center top'
      })
    });
  });

  /* ── Phone gentle rotation tied to scroll ────────────────────────── */
  const phone = document.querySelector('.phone');
  if (phone) {
    g.fromTo(phone,
      { rotate: -5, y: 30 },
      { rotate: 5, y: -30, ease: 'none',
        scrollTrigger: { trigger: phone, start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ── CTA scale-in ────────────────────────────────────────────────── */
  const cta = document.querySelector('.cta');
  if (cta) {
    handover([cta], { opacity: 0, y: 60, scale: 0.96 });
    g.to(cta, {
      opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: cta, start: 'top 85%' }
    });
  }

  /* ── Quote testimonial ───────────────────────────────────────────── */
  const quote = document.querySelector('.quote');
  if (quote) {
    handover([quote], { opacity: 0, y: 40 });
    g.to(quote, {
      opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: quote, start: 'top 85%' }
    });
  }

  /* ── Article paragraphs (sub-pages) ──────────────────────────────── */
  g.utils.toArray('.article-wrap > *').forEach(el => {
    g.from(el, {
      y: 30, opacity: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });

  /* ── Placeholder stage (Realizacje) ──────────────────────────────── */
  const stage = document.querySelector('.placeholder-stage');
  if (stage) {
    const kids = Array.from(stage.children);
    handover(kids, { opacity: 0, y: 50 });
    g.to(kids, {
      opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12
    });
  }

  /* ── Marquee subtle scroll-tied speed boost ──────────────────────── */
  const marquee = document.querySelector('.marquee-track');
  if (marquee) {
    g.to(marquee, {
      xPercent: -10, ease: 'none',
      scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }
})();
