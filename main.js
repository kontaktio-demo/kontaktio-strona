/* ─── CURSOR GLOW ──────────────────────────────── */
const glow = document.getElementById('cursorGlow');
let mx = 0, my = 0, cx = 0, cy = 0;

document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

(function animate() {
  cx += (mx - cx) * 0.08;
  cy += (my - cy) * 0.08;
  glow.style.left = cx + 'px';
  glow.style.top  = cy + 'px';
  requestAnimationFrame(animate);
})();

/* ─── SERVICE CARD MOUSE-TRACKING RADIAL ───────── */
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  });
});

/* ─── SCROLL REVEAL ────────────────────────────── */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ─── FAQ TOGGLE ───────────────────────────────── */
function toggleFaq(el) {
  const item = el.parentElement;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

/* ─── NAV SHADOW ON SCROLL ─────────────────────── */
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.style.borderBottomColor = window.scrollY > 20
    ? 'rgba(0,0,0,.1)'
    : 'rgba(0,0,0,.06)';
}, { passive: true });

/* ─── COUNTER ANIMATION ────────────────────────── */
function animateCounter(el, target, suffix, duration = 1600) {
  let start = null;
  const isFloat = target % 1 !== 0;

  function step(ts) {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const val = isFloat
      ? (eased * target).toFixed(1)
      : Math.round(eased * target);
    el.textContent = val + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const raw = el.dataset.count;
    const suffix = el.dataset.suffix || '';
    if (raw) animateCounter(el, parseFloat(raw), suffix);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number[data-count]').forEach(el => {
  counterObserver.observe(el);
});
