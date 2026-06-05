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

// ============= 註冊表單彈窗 =============
(function () {
  const API_URL = "https://www.echo169buy.com/api/form/submit";
  const DEFAULT_PARAMS = {
    advertiser_id: "7591795398541639681",
    pixel_id: "D6GMV0JC77UCTB9KFER0",
    page_id: "53af237f",
  };

  const registerModal = document.getElementById("registerModal");
  const successModal = document.getElementById("successModal");
  const registerForm = document.getElementById("registerForm");
  const genderHidden = registerForm?.querySelector('[data-key="性別"]');
  const genderButtons = document.querySelectorAll(".register-form__gender-btn");
  const submitBtn = registerForm?.querySelector('[data-action="form-submit"]');

  if (!registerModal || !registerForm) return;

  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      advertiser_id: params.get("advertiser_id") || params.get("advertiser") || DEFAULT_PARAMS.advertiser_id,
      pixel_id: params.get("pixel_id") || params.get("pixel") || DEFAULT_PARAMS.pixel_id,
      page_id: params.get("page_id") || params.get("page") || DEFAULT_PARAMS.page_id,
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
    if (!successModal?.classList.contains("is-open")) {
      document.body.classList.remove("register-modal-open");
    }
  }

  function openSuccessModal() {
    closeRegisterModal();
    successModal?.classList.add("is-open");
    successModal?.setAttribute("aria-hidden", "false");
    document.body.classList.add("register-modal-open");
  }

  function closeSuccessModal() {
    successModal?.classList.remove("is-open");
    successModal?.setAttribute("aria-hidden", "true");
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
      showToast(`請填寫必填字段：${missingFields.join("、")}`, "error");
      return;
    }

    if (Object.keys(formData).length === 0) {
      showToast("請至少填寫一項資料", "error");
      return;
    }

    const params = getUrlParams();
    if (!params.page_id || !params.advertiser_id || !params.pixel_id) {
      showToast("缺少必要參數，無法提交", "error");
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
      submitBtn.textContent = "提交中…";
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (result.code === 200) {
        registerForm.reset();
        if (genderHidden) genderHidden.value = "男";
        genderButtons.forEach((btn, i) => {
          btn.classList.toggle("is-active", i === 0);
        });
        openSuccessModal();
      } else {
        showToast(result.msg || "表單提交失敗", "error");
      }
    } catch (err) {
      showToast("網路請求失敗，請稍後重試", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "填寫資料點擊獲取報名連結";
      }
    }
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

  successModal?.querySelectorAll("[data-close-success]").forEach((el) => {
    el.addEventListener("click", closeSuccessModal);
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
    if (e.key !== "Escape") return;
    if (registerModal.classList.contains("is-open")) closeRegisterModal();
    if (successModal?.classList.contains("is-open")) closeSuccessModal();
  });
})();
