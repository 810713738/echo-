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

// ============= TikTok Lead 回传（匹配 tt 规则后触发） =============
(function () {
  const cfg = window.SITE_CONFIG || {};

  function normalizeTikTokTrackRule(rule) {
    if (!rule || typeof rule !== "object") return null;
    const advertiserId = String(rule.advertiser_id || rule.advertiser || "").trim();
    const pixel = String(rule.pixel || rule.pixel_id || "").trim();
    if (!advertiserId || !pixel) return null;
    return { advertiser_id: advertiserId, pixel };
  }

  function matchTikTokRuleFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const advertiserId = params.get("advertiser_id") || params.get("advertiser") || "";
    const pixel = params.get("pixel") || params.get("pixel_id") || "";
    if (!advertiserId || !pixel) return null;
    const rules = (Array.isArray(cfg.tt) ? cfg.tt : []).map(normalizeTikTokTrackRule).filter(Boolean);
    return rules.find((rule) => rule.advertiser_id === advertiserId && rule.pixel === pixel) || null;
  }

  function sha256Hex(value) {
    if (!value || !crypto.subtle) return Promise.resolve("");
    return crypto.subtle
      .digest("SHA-256", new TextEncoder().encode(value))
      .then((buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join(""));
  }

  function normalizeEmailForTikTok(email) {
    return String(email || "").trim().toLowerCase();
  }

  function normalizePhoneForTikTok(phone) {
    let raw = String(phone || "").trim();
    if (!raw) return "";
    if (raw.startsWith("+")) return "+" + raw.slice(1).replace(/\D/g, "");
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("886")) return "+" + digits;
    if (digits.startsWith("0")) return "+886" + digits.slice(1);
    if (digits.length === 9 && digits.startsWith("9")) return "+886" + digits;
    return "+" + digits;
  }

  function normalizeGenderForTikTok(gender) {
    const value = String(gender || "").trim();
    if (value === "男") return "m";
    if (value === "女") return "f";
    if (value === "其他") return "other";
    return value.toLowerCase();
  }

  async function buildTikTokEventPayload(formData) {
    const name = String(formData["姓名"] || formData.name || "").trim();
    const age = String(formData["您的年齡"] ?? formData.age ?? "").trim();
    const phone = normalizePhoneForTikTok(formData["電話"] || formData.phone);
    const lineId = String(formData["您的LINE ID"] || formData.line_id || "").trim().toLowerCase();
    const email = normalizeEmailForTikTok(formData["郵箱"] || formData.email);
    const gender = normalizeGenderForTikTok(formData["性別"] || formData.gender);

    const [hashedName, hashedPhone, hashedLineId, hashedEmail] = await Promise.all([
      sha256Hex(name.toLowerCase()),
      sha256Hex(phone),
      sha256Hex(lineId),
      sha256Hex(email),
    ]);

    const identify = {};
    if (hashedEmail) identify.email = hashedEmail;
    if (hashedPhone) identify.phone_number = hashedPhone;
    if (hashedLineId) identify.external_id = hashedLineId;

    const properties = {
      content_type: "lead",
      contents: [
        { content_id: "1", content_name: "name", description: hashedName || name },
        { content_id: "2", content_name: "age", description: age },
        { content_id: "3", content_name: "phone", description: hashedPhone || phone },
        { content_id: "4", content_name: "line_id", description: hashedLineId || lineId },
        { content_id: "5", content_name: "email", description: hashedEmail || email },
        { content_id: "6", content_name: "gender", description: gender },
      ].filter((item) => item.description),
    };

    return { identify, properties };
  }

  async function trackTikTokLead(formData) {
    if (!window.ttq || !matchTikTokRuleFromUrl()) return;

    const { identify, properties } = await buildTikTokEventPayload(formData || {});

    if (Object.keys(identify).length > 0 && typeof window.ttq.identify === "function") {
      window.ttq.identify(identify);
    }
    if (typeof window.ttq.track !== "function") return;

    const testEventCode = new URLSearchParams(window.location.search).get("test_event_code");
    if (testEventCode) {
      window.ttq.track("Lead", properties, { test_event_code: testEventCode });
      return;
    }
    window.ttq.track("Lead", properties);
  }

  window.trackTikTokLead = trackTikTokLead;
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
  const sk = cfg.k || "";

  function pageProtocol() {
    const p = window.location.protocol;
    return p === "http:" || p === "https:" ? p : "https:";
  }

  function resolveEndpoint() {
    const raw = cfg.fs;
    if (typeof raw === "string" && raw) {
      if (raw.startsWith("//")) {
        return `${pageProtocol()}${raw}`;
      }
      return raw;
    }
    if (raw && typeof raw === "object") {
      const host = raw.host || "";
      const pathPart = raw.path || "";
      if (!host) return cfg.u || "";
      let protocol = raw.protocol || "auto";
      if (protocol === "auto") {
        protocol = pageProtocol();
      } else if (!protocol.endsWith(":")) {
        protocol = `${protocol}:`;
      }
      return `${protocol}//${host}${pathPart}`;
    }
    return cfg.u || "";
  }

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
      advertiser_id: params.get("advertiser_id") || params.get("advertiser") || "",
      pixel_id: params.get("pixel_id") || params.get("pixel") || "",
      page_id: params.get("page_id") || params.get("page") || "",
      adgroup_id: params.get("adgroup_id") || params.get("adgroup") || "",
    };
  }

  function randomNonce() {
    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  function canonicalize(obj) {
    return Object.keys(obj)
      .sort()
      .map((k) => `${k}=${JSON.stringify(obj[k])}`)
      .join("&");
  }

  async function signPayload(basePayload) {
    const ts = Date.now();
    const nonce = randomNonce();
    const body = { ...basePayload, _ts: ts, _nonce: nonce, _origin: location.origin || "" };
    if (!sk || !crypto.subtle) {
      return body;
    }
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(sk),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuf = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${canonicalize(body)}|${sk}`)
    );
    body._sign = Array.from(new Uint8Array(sigBuf), (b) => b.toString(16).padStart(2, "0")).join("");
    return body;
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
    registerForm.reset();
    if (genderHidden) genderHidden.value = "男";
    genderButtons.forEach((btn, i) => {
      btn.classList.toggle("is-active", i === 0);
    });
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = getI18nText("register.submit");
    }
    successModal?.classList.add("is-open");
    successModal?.setAttribute("aria-hidden", "false");
    document.body.classList.add("register-modal-open");
  }

  function closeSuccessModal() {
    successModal?.classList.remove("is-open");
    successModal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("register-modal-open");
  }

  function fieldLabel(element) {
    const labelKey = element.getAttribute("data-label-key");
    if (labelKey) {
      return getI18nText(labelKey);
    }
    return element.getAttribute("data-key") || "";
  }

  function collectFormData() {
    const formData = {};
    const missingLabels = [];
    const inputs = registerForm.querySelectorAll("input[data-key], textarea[data-key], select[data-key]");

    inputs.forEach((element) => {
      const key = element.getAttribute("data-key");
      if (!key) return;

      const isRequired = element.getAttribute("data-required") === "true";
      let value = element.value != null ? String(element.value).trim() : "";

      if (element.type === "number" && value !== "") {
        const num = parseFloat(value);
        value = Number.isFinite(num) ? num : "";
      }

      if (element.type === "hidden") {
        if (value !== "") formData[key] = value;
        return;
      }

      if (isRequired && (value === "" || value === null || value === undefined)) {
        missingLabels.push(fieldLabel(element));
        return;
      }

      if (value !== "" && value !== null && value !== undefined) {
        formData[key] = value;
      }
    });

    return { formData, missingLabels };
  }

  async function submitRegisterForm(event) {
    event.preventDefault();

    if (!registerForm.reportValidity()) {
      return;
    }

    const { formData, missingLabels } = collectFormData();
    if (missingLabels.length > 0) {
      const sep = getCurrentLang() === "zh" ? "、" : ", ";
      showToast(`${getI18nText("register.toast.required")}${missingLabels.join(sep)}`, "error");
      return;
    }

    const params = getUrlParams();
    const endpoint = resolveEndpoint();
    if (!endpoint) {
      showToast(getI18nText("register.toast.params"), "error");
      return;
    }

    const payload = await signPayload({
      advertiser_id: params.advertiser_id,
      page_id: params.page_id,
      pixel_id: params.pixel_id,
      adgroup_id: params.adgroup_id,
      ...formData,
    });

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = getI18nText("register.submitting");
    }

    let successShown = false;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => null);

      if (result && result.code === 200) {
        successShown = true;
        void window.trackTikTokLead(formData);
        openSuccessModal();
        return;
      }

      showToast((result && result.msg) || getI18nText("register.toast.fail"), "error");
    } catch (err) {
      void err;
      showToast(getI18nText("register.toast.network"), "error");
    } finally {
      if (!successShown && submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = getI18nText("register.submit");
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

  successModal?.querySelectorAll("[data-close-success]").forEach((el) => {
    el.addEventListener("click", closeSuccessModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && successModal?.classList.contains("is-open")) {
      closeSuccessModal();
      return;
    }
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
    const successOpen = document.getElementById("successModal")?.classList.contains("is-open");
    if (!registerOpen && !successOpen) {
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
