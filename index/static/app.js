// ============= 站点配置（LINE 链接等） =============
(function () {
  const cfg = window.SITE_CONFIG;
  if (!cfg) return;

  document.querySelectorAll("[data-line-url]").forEach((el) => {
    el.href = cfg.lineUrl;
  });

  document.querySelectorAll("[data-line-id]").forEach((el) => {
    el.textContent = cfg.lineId;
  });

  document.querySelectorAll("[data-line-qr]").forEach((el) => {
    el.src = cfg.lineQr;
  });
})();

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

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key] != null) {
        el.placeholder = dict[key];
      }
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria");
      if (dict[key] != null) {
        el.setAttribute("aria-label", dict[key]);
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

  window.getCurrentLang = () => current;
  window.getI18nText = (key) => {
    const dict = window.I18N[current];
    return dict && dict[key] != null ? dict[key] : key;
  };
  window.applySiteLang = applyLang;

  toggleBtn?.addEventListener("click", () => {
    applyLang(current === "zh" ? "en" : "zh");
  });

  applyLang(current);
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

// ============= 註冊表單彈窗 =============
(function () {
  const cfg = window.SITE_CONFIG || {};
  const formSubmitUrl = cfg.formSubmitUrl || "";
  const lineUrl = cfg.lineUrl || "";

  const registerModal = document.getElementById("registerModal");
  const registerForm = document.getElementById("registerForm");
  const genderHidden = registerForm?.querySelector('[data-key="性別"]');
  const genderButtons = document.querySelectorAll(".register-form__gender-btn");
  const submitBtn = registerForm?.querySelector('[data-action="form-submit"]');

  if (!registerModal || !registerForm) return;

  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      advertiser_id: params.get("advertiser_id") || params.get("advertiser") || "",
      pixel_id: params.get("pixel_id") || params.get("pixel") || "",
      page_id: params.get("page_id") || params.get("page") || "",
      adgroup_id: params.get("adgroup_id") || params.get("adgroup") || "",
    };
  }

  function showToast(message, type) {
    const toast = document.createElement("div");
    toast.className = `register-toast register-toast--${type || "error"}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function openRegisterModal() {
    registerModal.classList.add("is-open");
    registerModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("register-modal-open");
  }

  function closeRegisterModal() {
    registerModal.classList.remove("is-open");
    registerModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("register-modal-open");
  }

  function collectFormData() {
    const formData = {};
    const inputs = registerForm.querySelectorAll("input[data-key], textarea[data-key], select[data-key]");
    const missingFields = [];

    inputs.forEach((element) => {
      const key = element.getAttribute("data-key");
      if (!key) return;

      const isRequired = element.getAttribute("data-required") === "true";
      let value = element.value ? element.value.trim() : "";

      if (element.type === "number" && value !== "") {
        value = parseFloat(value) || 0;
      }

      if (isRequired && (value === "" || value === null || value === undefined)) {
        missingFields.push(key);
        return;
      }

      if (value !== "" && value !== null && value !== undefined) {
        formData[key] = value;
      }
    });

    return { formData, missingFields };
  }

  async function submitRegisterForm(event) {
    event.preventDefault();

    const { formData, missingFields } = collectFormData();
    if (missingFields.length > 0) {
      const sep = getCurrentLang() === "zh" ? "、" : ", ";
      showToast(`${getI18nText("register.toast.required")}${missingFields.join(sep)}`, "error");
      return;
    }

    if (Object.keys(formData).length === 0) {
      showToast(getI18nText("register.toast.empty"), "error");
      return;
    }

    const params = getUrlParams();
    if (!formSubmitUrl || !params.page_id || !params.advertiser_id || !params.pixel_id) {
      showToast(getI18nText("register.toast.params"), "error");
      return;
    }

    const payload = {
      advertiser_id: params.advertiser_id,
      page_id: params.page_id,
      pixel_id: params.pixel_id,
      adgroup_id: params.adgroup_id,
      ...formData,
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = getI18nText("register.submitting");
    }

    try {
      await fetch(formSubmitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // 忽略錯誤，仍跳轉 LINE
    }

    window.location.href = lineUrl;
  }

  document.querySelectorAll(".js-open-register-modal").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openRegisterModal();
    });
  });

  registerModal.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", closeRegisterModal);
  });

  registerModal.querySelector(".js-scroll-to-line-qr")?.addEventListener("click", (e) => {
    e.preventDefault();
    closeRegisterModal();
    const qrSection = document.getElementById("line-qr");
    if (qrSection) {
      qrSection.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    }
  });

  genderButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      genderButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      if (genderHidden) genderHidden.value = btn.dataset.gender || "";
    });
  });

  registerForm.addEventListener("submit", submitRegisterForm);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && registerModal.classList.contains("is-open")) {
      closeRegisterModal();
    }
  });
})();

// ============= 條款 / 隱私聲明彈窗 =============
(function () {
  const legalModals = {
    terms: document.getElementById("legalTermsModal"),
    privacy: document.getElementById("legalPrivacyModal"),
  };

  let activeLegalModal = null;

  function openLegalModal(type) {
    const modal = legalModals[type];
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("register-modal-open");
    activeLegalModal = modal;
  }

  function closeLegalModal() {
    if (!activeLegalModal) return;
    activeLegalModal.classList.remove("is-open");
    activeLegalModal.setAttribute("aria-hidden", "true");
    activeLegalModal = null;
    const registerOpen = document.getElementById("registerModal")?.classList.contains("is-open");
    if (!registerOpen) {
      document.body.classList.remove("register-modal-open");
    }
  }

  document.querySelectorAll("[data-open-legal]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openLegalModal(el.getAttribute("data-open-legal"));
    });
  });

  document.querySelectorAll("[data-close-legal]").forEach((el) => {
    el.addEventListener("click", closeLegalModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && activeLegalModal) {
      closeLegalModal();
    }
  });
})();
