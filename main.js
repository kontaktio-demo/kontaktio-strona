/* ==========================================================================
   Kontaktio — interactions
   ========================================================================== */

/* ── Cursor glow removed (clean, minimal feel) ──────────────────────────── */

/* ── Scroll progress bar ────────────────────────────────────────────────── */
(() => {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;
  const update = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    bar.style.width = pct + '%';
  };
  document.addEventListener('scroll', update, { passive: true });
  update();
})();

/* ── Nav shadow on scroll ───────────────────────────────────────────────── */
(() => {
  const nav = document.querySelector('nav.site-nav');
  if (!nav) return;
  const update = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  document.addEventListener('scroll', update, { passive: true });
  update();
})();

/* ── Mobile menu toggle ─────────────────────────────────────────────────── */
(() => {
  const burger = document.querySelector('.nav-burger');
  if (!burger) return;
  burger.addEventListener('click', () => {
    document.body.classList.toggle('menu-open');
  });
  document.querySelectorAll('.mobile-nav a').forEach(a => {
    a.addEventListener('click', () => document.body.classList.remove('menu-open'));
  });
})();

/* ── Reveal on scroll (IntersectionObserver) ────────────────────────────── */
(() => {
  const els = document.querySelectorAll('.reveal, .split-line');
  if (!els.length || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => io.observe(el));
})();

/* ── Split text — splits .split-line headings into chars for cascade ───── */
(() => {
  document.querySelectorAll('.split-line').forEach(el => {
    if (el.dataset.split) return;
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'split-char';
      span.style.transitionDelay = (i * 18) + 'ms';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      el.appendChild(span);
    });
    el.dataset.split = 'true';
  });
})();

/* ── Magnetic buttons ───────────────────────────────────────────────────── */
(() => {
  if (!window.matchMedia('(hover:hover)').matches) return;
  document.querySelectorAll('.magnetic').forEach(btn => {
    const strength = 14;
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  - 0.5) * strength;
      const y = ((e.clientY - r.top)  / r.height - 0.5) * strength;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
})();

/* ── Subtle parallax for hero orbs ──────────────────────────────────────── */
(() => {
  const orbs = document.querySelectorAll('.hero-orb');
  if (!orbs.length) return;
  let ticking = false;
  document.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      orbs.forEach((orb, i) => {
        const speed = (i + 1) * 0.06;
        orb.style.translate = `0 ${y * speed}px`;
      });
      ticking = false;
    });
    ticking = true;
  }, { passive: true });
})();

/* ── FAQ accordion ──────────────────────────────────────────────────────── */
(() => {
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      const open = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!open) item.classList.add('open');
    });
  });
})();

/* ── Mark active nav link ───────────────────────────────────────────────── */
(() => {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav.site-nav .nav-links a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === path) a.classList.add('is-active');
  });
})();

/* ── Premium cursor-tracking glow on cards ──────────────────────────────── */
(() => {
  if (!window.matchMedia('(hover:hover)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const sel = '.principle, .cap, .price-card, .team-card, .contact-card, .faq-item';
  const cards = document.querySelectorAll(sel);
  if (!cards.length) return;
  cards.forEach(card => {
    let raf = 0;
    card.addEventListener('pointermove', e => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
        raf = 0;
      });
    }, { passive: true });
  });
})();

/* ── Lazy-load 3rd-party chat widget after window load + idle ──────────── */
(() => {
  const tag = document.querySelector('script[data-kontaktio][data-src]');
  if (!tag) return;
  // Hardcoded, same-origin script path. Avoids any DOM-sourced URL flowing
  // into a script src (defence against XSS via tampered HTML).
  const SCRIPT_PATH = 'kontaktio.js';
  const inject = () => {
    const s = document.createElement('script');
    // Copy only known-safe data-* config attributes onto the new tag.
    const ALLOWED = new Set(['data-kontaktio', 'data-client', 'data-backend']);
    for (const a of tag.attributes) {
      if (ALLOWED.has(a.name)) s.setAttribute(a.name, a.value);
    }
    s.src = SCRIPT_PATH;
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.referrerPolicy = 'no-referrer';
    // Remove placeholder so the chatbot script only sees one config tag
    tag.parentNode && tag.parentNode.removeChild(tag);
    document.body.appendChild(s);
  };
  const start = () => ('requestIdleCallback' in window
      ? requestIdleCallback(inject, { timeout: 2500 })
      : setTimeout(inject, 1500));
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
})();
