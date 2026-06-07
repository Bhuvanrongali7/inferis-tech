/* =========================================================================
   INFERIS — interactions
   Preloader, custom cursor, Lenis smooth scroll, GSAP reveals, magnetic
   buttons, 3D tilt, animated counters, nav behavior, and the ScrollTrigger
   that drives the "idea emerges from a computer" 3D scene.
   ========================================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(pointer:fine)").matches;
  var hasGSAP = typeof window.gsap !== "undefined";
  var hasST = hasGSAP && typeof window.ScrollTrigger !== "undefined";

  /* ---------------- Preloader ---------------- */
  function preloader() {
    var el = document.getElementById("preloader");
    var bar = document.getElementById("preloaderBar");
    var count = document.getElementById("preloaderCount");
    if (!el) return done();

    var v = 0;
    var iv = setInterval(function () {
      v += Math.random() * 14 + 6;
      if (v >= 100) { v = 100; clearInterval(iv); setTimeout(finish, 350); }
      if (bar) bar.style.width = v + "%";
      if (count) count.textContent = Math.floor(v);
    }, 110);

    function finish() {
      el.classList.add("done");
      done();
    }
    function safety() { if (!el.classList.contains("done")) finish(); }
    setTimeout(safety, 3000);
  }
  function done() { document.body.classList.add("loaded"); revealHero(); revealPageHero(); }

  /* ---------------- Custom cursor ---------------- */
  function cursor() {
    if (!finePointer) return;
    var c = document.getElementById("cursor");
    var d = document.getElementById("cursorDot");
    if (!c || !d) return;
    var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    var tx = cx, ty = cy;
    window.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      d.style.transform = "translate(" + tx + "px," + ty + "px) translate(-50%,-50%)";
    });
    function raf() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      c.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";
      requestAnimationFrame(raf);
    }
    raf();
    document.querySelectorAll("[data-cursor]").forEach(function (el) {
      var type = el.getAttribute("data-cursor");
      el.addEventListener("mouseenter", function () {
        c.classList.add(type === "view" ? "is-view" : "is-hover");
      });
      el.addEventListener("mouseleave", function () {
        c.classList.remove("is-hover", "is-view");
      });
    });
  }

  /* ---------------- Lenis smooth scroll ---------------- */
  function smoothScroll() {
    if (reduce || typeof window.Lenis === "undefined") return null;
    var lenis = new window.Lenis({ duration: 1.1, smoothWheel: true,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    window.__lenis = lenis;
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (hasST) {
      lenis.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    }
    // anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        lenis.scrollTo(t, { offset: -20 });
        closeMenu();
      });
    });
    return lenis;
  }

  /* ---------------- Hero intro ---------------- */
  function revealHero() {
    // mark hero reveal items as handled so reveals() skips them
    document.querySelectorAll(".hero .reveal").forEach(function (el) { el.classList.add("revealed"); });
    if (!hasGSAP || reduce) {
      document.querySelectorAll(".hero__title .line > span").forEach(function (s) { s.style.transform = "none"; });
      document.querySelectorAll(".hero .reveal").forEach(function (el) { el.style.opacity = 1; el.style.transform = "none"; });
      return;
    }
    var tl = window.gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.from(".hero__title .line > span", { yPercent: 110, duration: 1.1, stagger: 0.12 })
      .fromTo(".hero__badge", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, "-=0.7")
      .fromTo(".hero__sub", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, "-=0.5")
      .fromTo(".hero__actions", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, "-=0.5")
      .fromTo(".hero__stats .stat", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 }, "-=0.4");
  }

  /* ---------------- Inner page hero intro ---------------- */
  function revealPageHero() {
    var ph = document.querySelector(".page-hero");
    if (!ph) return;
    var items = ph.querySelectorAll(".reveal");
    items.forEach(function (el) { el.classList.add("revealed"); });
    if (!hasGSAP || reduce) {
      items.forEach(function (el) { el.style.opacity = 1; el.style.transform = "none"; });
      return;
    }
    window.gsap.fromTo(items, { y: 26, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: "power3.out" });
  }

  /* ---------------- Scroll reveals ---------------- */
  function reveals() {
    var items = document.querySelectorAll(".reveal:not(.revealed)");
    if (!hasST || reduce) {
      items.forEach(function (el) { el.style.opacity = 1; el.style.transform = "none"; });
      return;
    }
    items.forEach(function (el) {
      window.gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" }
      });
    });
  }

  /* ---------------- Counters ---------------- */
  function counters() {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      function run() {
        var obj = { v: 0 };
        if (hasGSAP && !reduce) {
          window.gsap.to(obj, { v: target, duration: 1.6, ease: "power2.out",
            onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; } });
        } else { el.textContent = target + suffix; }
      }
      if (hasST && !reduce) {
        window.ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: run });
      } else { run(); }
    });
  }

  /* ---------------- Magnetic buttons ---------------- */
  function magnetic() {
    if (!finePointer || reduce) return;
    document.querySelectorAll(".magnetic").forEach(function (el) {
      var strength = 24;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / r.width;
        var y = (e.clientY - r.top - r.height / 2) / r.height;
        el.style.transform = "translate(" + x * strength + "px," + y * strength + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------------- 3D tilt + spotlight cards ---------------- */
  function tilt() {
    document.querySelectorAll(".tilt").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", px * 100 + "%");
        el.style.setProperty("--my", py * 100 + "%");
        if (finePointer && !reduce) {
          var rx = (0.5 - py) * 8, ry = (px - 0.5) * 8;
          el.style.transform = "perspective(800px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-4px)";
        }
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------------- Nav behavior + menu ---------------- */
  var menuOpen = false;
  function closeMenu() {
    var links = document.getElementById("navLinks");
    var burger = document.getElementById("navBurger");
    if (!links) return;
    menuOpen = false; links.style.display = "";
    if (burger) burger.classList.remove("open");
  }
  function nav() {
    var nav = document.getElementById("nav");
    var burger = document.getElementById("navBurger");
    var links = document.getElementById("navLinks");
    var last = 0;
    window.addEventListener("scroll", function () {
      var y = window.scrollY || 0;
      if (nav) {
        nav.classList.toggle("scrolled", y > 40);
        if (y > last && y > 400 && !menuOpen) nav.classList.add("hidden");
        else nav.classList.remove("hidden");
      }
      last = y;
    }, { passive: true });

    if (burger && links) {
      burger.addEventListener("click", function () {
        menuOpen = !menuOpen;
        burger.classList.toggle("open", menuOpen);
        if (menuOpen) {
          links.style.display = "flex";
          links.style.position = "fixed";
          links.style.flexDirection = "column";
          links.style.top = "70px"; links.style.right = "1rem";
          links.style.background = "rgba(11,13,24,.92)";
          links.style.backdropFilter = "blur(16px)";
          links.style.padding = "1.2rem 1.6rem";
          links.style.borderRadius = "16px";
          links.style.border = "1px solid rgba(255,255,255,.1)";
          links.style.gap = "1rem";
        } else { closeMenu(); }
      });
    }
  }

  /* ---------------- Generic scroll-scene driver ----------------
     Drives ANY page's signature scene. Each page loads one scene-*.js
     that exposes window.InferisScene.setProgress(0..1) and renders onto
     canvas.scene__canvas. Markup: section.scene > .scene__sticky with
     .scene__step copy blocks + #sceneProgress bar. -------------------- */
  function sceneDriver() {
    var sec = document.querySelector(".scene");
    if (!sec) return;
    var bar = sec.querySelector("#sceneProgress") || (sec.querySelector(".scene__progress span"));
    var steps = sec.querySelectorAll(".scene__step");
    var scene = window.InferisScene;

    function applyStep(p) {
      var n = steps.length || 1;
      var idx = Math.min(n - 1, Math.floor(p * n - 1e-6));
      if (idx < 0) idx = 0;
      steps.forEach(function (s, i) { s.classList.toggle("active", i === idx); });
      if (bar) bar.style.width = (p * 100) + "%";
    }
    if (steps[0]) steps[0].classList.add("active");
    applyStep(0);

    if (hasST && !reduce) {
      window.ScrollTrigger.create({
        trigger: sec, start: "top top", end: "bottom bottom", scrub: true,
        onUpdate: function (self) {
          if (scene) scene.setProgress(self.progress);
          applyStep(self.progress);
        }
      });
    } else {
      if (scene) scene.setProgress(1);
      var onScroll = function () {
        var r = sec.getBoundingClientRect();
        var total = sec.offsetHeight - window.innerHeight;
        var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
        if (scene) scene.setProgress(p);
        applyStep(p);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  /* ---------------- Process line fill ---------------- */
  function processLine() {
    var bar = document.getElementById("stepsProgress");
    var steps = document.querySelector(".steps");
    if (!bar || !steps) return;
    if (hasST && !reduce) {
      window.gsap.to(bar, { width: "100%", ease: "none",
        scrollTrigger: { trigger: steps, start: "top 70%", end: "bottom 70%", scrub: true } });
    } else { bar.style.width = "100%"; }
  }

  /* ---------------- Init ---------------- */
  function init() {
    if (hasST) window.gsap.registerPlugin(window.ScrollTrigger);
    preloader();
    cursor();
    smoothScroll();
    reveals();
    counters();
    magnetic();
    tilt();
    nav();
    sceneDriver();
    processLine();
    if (hasST) setTimeout(function () { window.ScrollTrigger.refresh(); }, 400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
