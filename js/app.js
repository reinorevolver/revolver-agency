/* ============================================================
   REVOLVER — interactions
   ============================================================ */
(function () {
  "use strict";

  var STORE_KEY = "revolver_lang";
  var lang = localStorage.getItem(STORE_KEY) || "ka";
  var current = 0; // active chamber
  var revealed = false; // becomes true once initReveal has run

  /* ---------- i18n ---------- */
  function t(key) {
    var d = window.I18N[lang] || window.I18N.ka;
    return d[key] != null ? d[key] : key;
  }

  function applyLang() {
    document.documentElement.lang = lang;
    // text nodes
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    // html nodes
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    // placeholders
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });
    // aria labels
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    // toggle buttons
    document.querySelectorAll(".lang-toggle button").forEach(function (b) {
      b.classList.toggle("active", b.dataset.lang === lang);
    });
    // services + detail
    renderServices();
    updateDetail(false);
    renderPackages();
    localStorage.setItem(STORE_KEY, lang);
  }

  function setLang(l) {
    if (l === lang) return;
    lang = l;
    applyLang();
  }

  /* ---------- Header scroll state + active nav ---------- */
  var header = document.querySelector(".site-header");
  var sections = [];
  function initScroll() {
    sections = Array.prototype.map.call(
      document.querySelectorAll("section[id]"),
      function (s) { return s; }
    );
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("scrolled", y > 30);
    var pos = y + window.innerHeight * 0.35;
    var activeId = null;
    sections.forEach(function (s) {
      if (s.offsetTop <= pos) activeId = s.id;
    });
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + activeId);
    });
  }

  /* ---------- Mobile nav ---------- */
  function initMobileNav() {
    var burger = document.querySelector(".btn-burger");
    var nav = document.querySelector(".nav");
    if (!burger) return;
    burger.addEventListener("click", function () {
      nav.classList.toggle("open");
      burger.classList.toggle("is-open");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        burger.classList.remove("is-open");
      }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll(".reveal, .stat-card"));

    // 1) reveal anything already in / near the viewport immediately (no flash, no IO dependency)
    function revealVisible() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      els.forEach(function (e) {
        if (e.classList.contains("in")) return;
        var r = e.getBoundingClientRect();
        if (r.top < vh * 0.9 && r.bottom > 0) e.classList.add("in");
      });
    }
    revealVisible();

    // 2) IntersectionObserver for the staggered reveal of below-fold content
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
      els.forEach(function (e) { if (!e.classList.contains("in")) io.observe(e); });
    }

    // 3) cheap scroll fallback in case IO never fires (some embedded contexts)
    var onScrollReveal = function () { revealVisible(); };
    window.addEventListener("scroll", onScrollReveal, { passive: true });

    // 4) hard safety net: never leave content permanently hidden
    setTimeout(function () {
      els.forEach(function (e) { e.classList.add("in"); });
    }, 2200);

    revealed = true;
  }

  /* ---------- Hero dust ---------- */
  function initDust() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var dust = document.querySelector(".dust");
    if (!dust) return;
    var n = window.innerWidth < 640 ? 14 : 26;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var s = document.createElement("i");
      var dur = 9 + Math.random() * 12;
      s.style.left = Math.random() * 100 + "%";
      s.style.animationDuration = dur + "s";
      s.style.animationDelay = -Math.random() * dur + "s";
      var sz = 2 + Math.random() * 2.5;
      s.style.width = sz + "px";
      s.style.height = sz + "px";
      frag.appendChild(s);
    }
    dust.appendChild(frag);
  }

  /* ---------- Hero parallax ---------- */
  function initParallax() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var wm = document.querySelector(".hero-watermark");
    var sun = document.querySelector(".hero-sun");
    if (!wm && !sun) return;
    var raf = null;
    window.addEventListener("scroll", function () {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        var y = window.scrollY;
        if (wm) wm.style.transform = "translateY(" + y * 0.12 + "px)";
        if (sun) sun.style.transform = "translateX(-50%) translateY(" + y * 0.06 + "px)";
        raf = null;
      });
    }, { passive: true });
  }

  /* ---------- Revolver cylinder ---------- */
  var STEP = 60; // degrees per chamber

  function renderServices() {
    var stage = document.querySelector(".cyl-stage");
    var list = document.querySelector(".svc-list");
    if (!stage) return;

    // build chambers once
    if (!stage.querySelector(".chamber")) {
      var radiusPct = 33; // distance of chamber centers from cylinder center (% of stage)
      for (var i = 0; i < 6; i++) {
        var ang = (-90 + i * STEP) * Math.PI / 180;
        var x = 50 + radiusPct * Math.cos(ang);
        var y = 50 + radiusPct * Math.sin(ang);
        var btn = document.createElement("button");
        btn.className = "chamber";
        btn.type = "button";
        btn.dataset.i = i;
        btn.style.left = x + "%";
        btn.style.top = y + "%";
        btn.innerHTML = '<span class="num">0' + (i + 1) + "</span>";
        btn.addEventListener("click", (function (idx) {
          return function () { goTo(idx); };
        })(i));
        stage.querySelector(".cyl").appendChild(btn);
      }
    }

    // mobile list
    if (list) {
      list.innerHTML = "";
      window.SERVICES.forEach(function (s, i) {
        var d = s[lang];
        var card = document.createElement("div");
        card.className = "svc-card reveal";
        if (revealed) card.classList.add("in");
        card.innerHTML =
          '<div class="svc-card-no">0' + (i + 1) + "</div>" +
          '<div class="svc-card-body"><h3>' + d.name + "</h3><p>" + d.desc + "</p></div>";
        list.appendChild(card);
      });
    }
  }

  function goTo(i) {
    current = (i + 6) % 6;
    spinCylinder();
    updateDetail(true);
  }

  function spinCylinder() {
    var cyl = document.querySelector(".cyl");
    if (!cyl) return;
    var rot = -current * STEP;
    cyl.style.transform = "rotate(" + rot + "deg)";
    // keep chamber numbers upright + mark active
    cyl.querySelectorAll(".chamber").forEach(function (ch, idx) {
      ch.querySelector(".num").style.transform = "rotate(" + (-rot) + "deg)";
      ch.classList.toggle("active", idx === current);
    });
  }

  function updateDetail(animate) {
    var nameEl = document.querySelector(".cyl-detail h3");
    var descEl = document.querySelector(".cyl-detail p");
    var countEl = document.querySelector(".cyl-count .cur");
    var prog = document.querySelectorAll(".cyl-progress i");
    if (!nameEl) return;
    var d = window.SERVICES[current][lang];
    var box = document.querySelector(".cyl-detail .switching");

    function paint() {
      nameEl.textContent = d.name;
      descEl.textContent = d.desc;
      if (countEl) countEl.textContent = "0" + (current + 1);
      prog.forEach(function (p, i) { p.classList.toggle("on", i === current); });
    }

    if (animate && box) {
      box.classList.remove("show");
      setTimeout(function () { paint(); box.classList.add("show"); }, 180);
    } else {
      paint();
      if (box) box.classList.add("show");
    }
  }

  function initCylinder() {
    var prev = document.querySelector(".cyl-nav .prev");
    var next = document.querySelector(".cyl-nav .next");
    if (prev) prev.addEventListener("click", function () { goTo(current - 1); });
    if (next) next.addEventListener("click", function () { goTo(current + 1); });
    spinCylinder();
  }

  /* ---------- Results numbers ---------- */
  function renderResults() {
    document.querySelectorAll(".stat-card").forEach(function (card, i) {
      var r = window.RESULTS[i];
      if (!r) return;
      var n = card.querySelector(".stat-num");
      n.innerHTML =
        (r.sign ? '<span class="sign">' + r.sign + "</span>" : "") +
        r.num + '<span class="sign">' + r.unit + "</span>";
    });
  }

  /* ---------- Pricing packages ---------- */
  function renderPackages() {
    var grid = document.getElementById("pricingGrid");
    if (grid && window.PACKAGES) {
      grid.innerHTML = "";
      window.PACKAGES.forEach(function (p, idx) {
        var d = p[lang];
        var card = document.createElement("div");
        card.className = "pkg reveal" + (p.popular ? " popular" : "");
        if (idx) card.setAttribute("data-d", String(idx));

        var html = "";
        if (p.popular) {
          html += '<div class="pkg-ribbon"><span class="star">★</span><span>' + t("pkg.popular") + "</span></div>";
        }
        html += '<div class="pkg-tier"><span class="rn">' + p.tier + '</span><span class="line"></span></div>';
        html += '<div class="pkg-name">' + d.name + "</div>";
        html += '<div class="pkg-price"><span class="cur">₾</span><span class="amt">' + p.price + "</span></div>";
        html += '<div class="pkg-for-l">' + t("pkg.for") + "</div>";
        html += '<div class="pkg-for">' + d.for + "</div>";
        html += '<div class="pkg-divider"><span class="b"></span><span class="t">' + d.incHead + '</span><span class="l"></span></div>';
        html += '<ul class="pkg-feats">';
        d.feats.forEach(function (f) {
          html += '<li><span class="mk"></span><span>' + f + "</span></li>";
        });
        html += "</ul>";
        if (d.guarantee) {
          html += '<div class="pkg-note"><span class="star">★</span><span>' + t("pkg.guar.title") + "</span></div>";
        }
        html += '<a class="btn" href="#contact"><span class="bullet"></span><span>' + t("pkg.cta") + "</span></a>";
        card.innerHTML = html;
        if (revealed) card.classList.add("in");
        grid.appendChild(card);
      });
    }

    // add-ons
    var list = document.getElementById("addonList");
    if (list && window.ADDONS) {
      list.innerHTML = "";
      window.ADDONS.forEach(function (a) {
        var li = document.createElement("li");
        li.innerHTML =
          '<span class="casing"></span>' +
          '<span class="name">' + a[lang] + "</span>" +
          '<span class="price">' + a.price + '<span class="c">₾</span>' + (a.suffix ? (typeof a.suffix === "string" ? a.suffix : (a.suffix[lang] || "")) : "") + '</span>';
        list.appendChild(li);
      });
    }
  }

  /* ---------- Contact form ---------- */
  var WEB3FORMS_KEY = "4eb57c15-aa39-404f-b848-171bd0ec2373";
  function initForm() {
    var form = document.querySelector(".contact-form");
    var toast = document.querySelector(".toast");
    if (!form) return;
    var btn = form.querySelector("button[type=submit]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {
        access_key: WEB3FORMS_KEY,
        subject: "ახალი შეტყობinება — Revolver Agency",
        from_name: "Revolver Agency Website",
        name: (form.name && form.name.value) || "",
        email: (form.email && form.email.value) || "",
        company: (form.company && form.company.value) || "",
        message: (form.message && form.message.value) || ""
      };
      if (btn) btn.disabled = true;
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "content-type": "application/json", "accept": "application/json" },
        body: JSON.stringify(data)
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (btn) btn.disabled = false;
        if (res && res.success) {
          form.reset();
          showToast(t("ct.sent"));
        } else {
          showToast(t("ct.senterr"));
        }
      }).catch(function () {
        if (btn) btn.disabled = false;
        showToast(t("ct.senterr"));
      });
    });
    function showToast(msg) {
      if (!toast) return;
      toast.querySelector(".toast-msg").textContent = msg;
      toast.classList.add("show");
      clearTimeout(form._tid);
      form._tid = setTimeout(function () { toast.classList.remove("show"); }, 3600);
    }
  }

  /* ---------- Language toggle ---------- */
  function initLangToggle() {
    document.querySelectorAll(".lang-toggle button").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.dataset.lang); });
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    applyLang();
    initLangToggle();
    initScroll();
    initMobileNav();
    initReveal();
    initDust();
    initParallax();
    initCylinder();
    renderResults();
    initForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

// Close menu on outside click
document.addEventListener('click', function(e) {
  var nav = document.querySelector('.nav');
  var burger = document.querySelector('.btn-burger');
  if (nav && nav.classList.contains('open') && !nav.contains(e.target) && !burger.contains(e.target)) {
    nav.classList.remove('open');
    burger.classList.remove('is-open');
  }
});

/* Hero video — seamless crossfade loop (dual video) */
(function(){
  var a = document.querySelector('.hero-video');
  if(!a) return;
  var MAX = 0.28, CF = 0.9;
  a.removeAttribute('loop');
  a.muted = true;
  var b = a.cloneNode(true);
  b.removeAttribute('loop');
  b.muted = true;
  a.parentNode.insertBefore(b, a.nextSibling);
  a.style.transition = b.style.transition = 'opacity ' + CF + 's linear';
  a.style.opacity = MAX; b.style.opacity = 0;
  var cur = a, nxt = b, armed = true;
  a.play();
  function watch(){
    var d = cur.duration;
    if(d && !isNaN(d) && armed && cur.currentTime >= d - CF){
      armed = false;
      nxt.currentTime = 0;
      nxt.play();
      cur.style.opacity = 0;
      nxt.style.opacity = MAX;
      var tmp = cur; cur = nxt; nxt = tmp;
      setTimeout(function(){ armed = true; }, CF * 1000 + 50);
    }
    requestAnimationFrame(watch);
  }
  requestAnimationFrame(watch);
})();
