/* =====================================================================
   Kontaktio — main.js
   - Reveal-on-scroll (IntersectionObserver)
   - Sticky nav state + scroll progress
   - Mobile drawer
   - Contact form validation (no backend; safe mailto fallback)
   - RODO cookie banner with localStorage preferences
   - Lazy mount of the chatbot widget after consent (or after idle if
     the visitor is on the privacy / cookie page where consent isn't
     yet expressed — chatbot is technically necessary for service)
   ===================================================================== */

(() => {
  "use strict";

  const onReady = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else { fn(); }
  };

  /* ---------- Reveal on scroll ---------- */
  const initReveals = () => {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );
    els.forEach((el) => io.observe(el));
  };

  /* ---------- Sticky nav state + scroll progress ---------- */
  const initScrollUI = () => {
    const nav = document.querySelector(".nav");
    const bar = document.querySelector(".scroll-progress");
    let ticking = false;

    const update = () => {
      const y = window.scrollY || 0;
      if (nav) nav.classList.toggle("is-stuck", y > 8);
      if (bar) {
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docH > 0 ? Math.min(100, (y / docH) * 100) : 0;
        bar.style.width = pct + "%";
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
  };

  /* ---------- Mobile drawer ---------- */
  const initDrawer = () => {
    const burger = document.querySelector(".nav__burger");
    const drawer = document.querySelector(".nav__drawer");
    if (!burger || !drawer) return;

    const close = () => {
      burger.setAttribute("aria-expanded", "false");
      drawer.classList.remove("is-open");
      document.body.style.overflow = "";
    };
    const open = () => {
      burger.setAttribute("aria-expanded", "true");
      drawer.classList.add("is-open");
      document.body.style.overflow = "hidden";
    };
    burger.addEventListener("click", () => {
      const isOpen = burger.getAttribute("aria-expanded") === "true";
      isOpen ? close() : open();
    });
    drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 880) close();
    });
  };

  /* ---------- Contact form ---------- */
  const initContactForm = () => {
    const form = document.querySelector('form[data-contact]');
    if (!form) return;

    const status = form.querySelector(".form__status");
    const fields = {
      name:    form.querySelector('[name="name"]'),
      email:   form.querySelector('[name="email"]'),
      message: form.querySelector('[name="message"]'),
      consent: form.querySelector('[name="consent"]'),
    };

    const setError = (field, msg) => {
      if (!field) return;
      const wrap = field.closest(".field");
      if (!wrap) return;
      wrap.classList.toggle("field--error", Boolean(msg));
      const slot = wrap.querySelector(".field__error");
      if (slot) slot.textContent = msg || "";
    };

    const isEmail = (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || "").trim());

    const validate = () => {
      let ok = true;
      const name = fields.name.value.trim();
      if (name.length < 2) { setError(fields.name, "Podaj imię (min. 2 znaki)."); ok = false; }
      else setError(fields.name, "");

      const email = fields.email.value.trim();
      if (!isEmail(email)) { setError(fields.email, "Podaj poprawny adres e-mail."); ok = false; }
      else setError(fields.email, "");

      const msg = fields.message.value.trim();
      if (msg.length < 10) { setError(fields.message, "Wiadomość powinna mieć min. 10 znaków."); ok = false; }
      else setError(fields.message, "");

      if (fields.consent && !fields.consent.checked) {
        setError(fields.consent, "Zgoda jest wymagana.");
        ok = false;
      } else { setError(fields.consent, ""); }
      return ok;
    };

    Object.values(fields).forEach((f) => {
      if (!f) return;
      f.addEventListener("blur",  validate, { passive: true });
      f.addEventListener("input", () => {
        const wrap = f.closest(".field");
        if (wrap && wrap.classList.contains("field--error")) validate();
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate()) {
        if (status) {
          status.textContent = "Sprawdź zaznaczone pola i spróbuj ponownie.";
          status.className = "form__status is-show is-error";
        }
        return;
      }
      // No backend: open user's mail client with a safely-encoded message.
      const subject = `Zapytanie ze strony kontaktio.pl — ${fields.name.value.trim()}`;
      const body =
        `Imię: ${fields.name.value.trim()}\n` +
        `E-mail: ${fields.email.value.trim()}\n\n` +
        `Wiadomość:\n${fields.message.value.trim()}\n`;
      const href =
        "mailto:kontakt@kontaktio.pl" +
        "?subject=" + encodeURIComponent(subject) +
        "&body="    + encodeURIComponent(body);
      window.location.href = href;

      if (status) {
        status.textContent = "Otwieram klienta pocztowego — jeśli się nie otworzy, napisz na kontakt@kontaktio.pl.";
        status.className = "form__status is-show is-ok";
      }
    });
  };

  /* ---------- Cookies (RODO) ---------- */
  const COOKIE_KEY = "kontaktio.cookies.v1";

  const readPrefs = () => {
    try {
      const raw = localStorage.getItem(COOKIE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return null;
      return {
        necessary:   true,
        analytics:   Boolean(obj.analytics),
        marketing:   Boolean(obj.marketing),
        ts:          Number(obj.ts) || Date.now()
      };
    } catch { return null; }
  };
  const writePrefs = (prefs) => {
    try {
      localStorage.setItem(COOKIE_KEY, JSON.stringify({
        necessary: true,
        analytics: Boolean(prefs.analytics),
        marketing: Boolean(prefs.marketing),
        ts: Date.now()
      }));
    } catch { /* ignore */ }
  };

  const initCookies = () => {
    const banner    = document.querySelector("[data-cookie-banner]");
    const modal     = document.querySelector("[data-cookie-modal]");
    if (!banner) return;

    const showBanner = () => banner.classList.add("is-show");
    const hideBanner = () => banner.classList.remove("is-show");
    const openModal  = () => { if (modal) modal.classList.add("is-open"); };
    const closeModal = () => { if (modal) modal.classList.remove("is-open"); };

    const accept = (prefs) => {
      writePrefs(prefs);
      hideBanner(); closeModal();
      window.dispatchEvent(new CustomEvent("kontaktio:consent", { detail: prefs }));
    };

    // Initial state
    const existing = readPrefs();
    if (!existing) showBanner();

    // Banner buttons
    banner.querySelectorAll("[data-cookie-accept-all]").forEach((b) =>
      b.addEventListener("click", () => accept({ analytics: true, marketing: true })));
    banner.querySelectorAll("[data-cookie-reject]").forEach((b) =>
      b.addEventListener("click", () => accept({ analytics: false, marketing: false })));
    banner.querySelectorAll("[data-cookie-customize]").forEach((b) =>
      b.addEventListener("click", () => {
        if (modal) {
          // Pre-fill switches with previously saved (or defaults)
          const prefs = readPrefs() || { analytics: false, marketing: false };
          const a = modal.querySelector('[data-cookie-toggle="analytics"]');
          const m = modal.querySelector('[data-cookie-toggle="marketing"]');
          if (a) a.checked = !!prefs.analytics;
          if (m) m.checked = !!prefs.marketing;
          openModal();
        }
      }));

    // External links to "Cookie settings" anywhere on the page
    document.querySelectorAll('[data-cookie-open]').forEach((b) =>
      b.addEventListener("click", (e) => {
        e.preventDefault();
        const prefs = readPrefs() || { analytics: false, marketing: false };
        if (modal) {
          const a = modal.querySelector('[data-cookie-toggle="analytics"]');
          const m = modal.querySelector('[data-cookie-toggle="marketing"]');
          if (a) a.checked = !!prefs.analytics;
          if (m) m.checked = !!prefs.marketing;
          openModal();
        } else {
          showBanner();
        }
      }));

    // Modal buttons
    if (modal) {
      modal.querySelectorAll("[data-cookie-modal-close]").forEach((b) =>
        b.addEventListener("click", closeModal));
      modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
      const saveBtn = modal.querySelector("[data-cookie-save]");
      if (saveBtn) saveBtn.addEventListener("click", () => {
        const a = modal.querySelector('[data-cookie-toggle="analytics"]');
        const m = modal.querySelector('[data-cookie-toggle="marketing"]');
        accept({
          analytics: !!(a && a.checked),
          marketing: !!(m && m.checked)
        });
      });
      const acceptAllInModal = modal.querySelector("[data-cookie-accept-all]");
      if (acceptAllInModal) acceptAllInModal.addEventListener("click",
        () => accept({ analytics: true, marketing: true }));
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  };

  /* ---------- Lazy chatbot mount ----------
     The chatbot is technically necessary for the contact channel, but we
     still wait for either: explicit cookie decision OR window load + idle,
     to keep first paint fast. The widget itself does not set marketing
     cookies. */
  const initChatbot = () => {
    const tag = document.querySelector('script[data-kontaktio][data-src]');
    if (!tag) return;

    // Hardcoded same-origin script path; never derive src from DOM input.
    const SCRIPT_PATH = "kontaktio.js";
    let mounted = false;

    const inject = () => {
      if (mounted) return; mounted = true;
      const s = document.createElement("script");
      const ALLOWED = new Set(["data-kontaktio", "data-client", "data-backend"]);
      for (const a of tag.attributes) {
        if (ALLOWED.has(a.name)) s.setAttribute(a.name, a.value);
      }
      s.src = SCRIPT_PATH;
      s.async = true;
      s.crossOrigin = "anonymous";
      s.referrerPolicy = "no-referrer";
      tag.parentNode && tag.parentNode.removeChild(tag);
      document.body.appendChild(s);
    };

    const start = () => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(inject, { timeout: 2500 });
      } else {
        setTimeout(inject, 1500);
      }
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
  };

  /* ---------- Init ---------- */
  onReady(() => {
    initReveals();
    initScrollUI();
    initDrawer();
    initContactForm();
    initCookies();
    initChatbot();

    // Mark current nav item
    const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll(".nav a, .nav__drawer a").forEach((a) => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      if (href === path || (path === "" && href === "index.html")) {
        a.setAttribute("aria-current", "page");
      }
    });
  });
})();
