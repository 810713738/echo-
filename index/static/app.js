// ============= 語言切換 =============
(function () {
  const html = document.documentElement;
  const toggleBtn = document.getElementById("langToggle");
  let current = html.getAttribute("data-lang") || "zh";

  function applyLang(lang) {
    const dict = window.I18N[lang];
    if (!dict) return;
    current = lang;
    html.setAttribute("data-lang", lang);
    html.setAttribute("lang", lang === "zh" ? "zh-Hant" : "en");

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key] != null) {
        el.innerHTML = dict[key];
      }
    });

    if (toggleBtn) {
      const cur = toggleBtn.querySelector(".lang-current");
      const oth = toggleBtn.querySelector(".lang-other");
      if (lang === "zh") {
        cur.textContent = "中";
        oth.textContent = "EN";
      } else {
        cur.textContent = "EN";
        oth.textContent = "中";
      }
    }
  }

  toggleBtn?.addEventListener("click", () => {
    applyLang(current === "zh" ? "en" : "zh");
  });
})();

// ============= 滾動時 Header 樣式 =============
(function () {
  const header = document.getElementById("siteHeader");
  const onScroll = () => {
    if (window.scrollY > 8) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

// ============= 行動版選單 =============
(function () {
  const btn = document.getElementById("menuToggle");
  const links = document.querySelector(".nav-links");
  btn?.addEventListener("click", () => {
    links.classList.toggle("is-open");
  });
  links?.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => links.classList.remove("is-open"));
  });
})();

// ============= Scroll Reveal (DISABLED — always show content) =============
// Force every animate-target into visible state so any cached older CSS that
// still hides .reveal { opacity:0 } cannot blank the page.
(function () {
  const targets = document.querySelectorAll(
    ".section-head, .value, .service-card, .step, .testi-card, .faq-item, .contact-card, .hero-stats, .welcome-hero, .day-card"
  );
  targets.forEach((el) => {
    el.classList.add("is-visible");
    el.style.opacity = "1";
    el.style.transform = "none";
  });
})();

// ============= LINE QR Code 動態產生 =============
(function () {
  const img = document.getElementById("lineQr");
  if (!img) return;
  img.src = "./static/20260604-144748.png";
})();
