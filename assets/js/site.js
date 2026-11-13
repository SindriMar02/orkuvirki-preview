/* Orkuvirki prototype. Motion spec: _docs/orkuvirki-2026-11-12/MOTION.md (IDs M1 to M13 below).
   GSAP owns transforms and opacity of animated elements; CSS owns control transitions. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- M10 menus: open onto the panel after a pointer, onto the first link after a key (focus-guard) ---------- */
  var segs = $$('.has-menu');
  function setSeg(seg, open) {
    var b = $('.seg_btn', seg), p = $('.seg_panel', seg);
    b.setAttribute('aria-expanded', String(open));
    p.classList.toggle('is-open', open);
    p.inert = !open;
  }
  function closeSegs(except) { segs.forEach(function (s) { if (s !== except) setSeg(s, false); }); }
  segs.forEach(function (seg) {
    var b = $('.seg_btn', seg), p = $('.seg_panel', seg);
    b.addEventListener('click', function (e) {
      var open = b.getAttribute('aria-expanded') !== 'true';
      closeSegs(seg); setSeg(seg, open);
      if (open) (e.detail === 0 ? $('a', p) : p).focus({ preventScroll: true });
    });
    seg.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && b.getAttribute('aria-expanded') === 'true') { setSeg(seg, false); b.focus(); }
    });
    seg.addEventListener('focusout', function (e) { if (e.relatedTarget && !seg.contains(e.relatedTarget)) setSeg(seg, false); });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.has-menu')) closeSegs(); });

  var burger = $('.burger'), sheet = $('#sheet'), lockY = 0;
  function lock(on) {                      // fixed-body scroll lock, instant restore
    if (on) { lockY = window.scrollY; document.body.style.cssText = 'position:fixed;left:0;right:0;top:' + -lockY + 'px'; }
    else { document.body.style.cssText = ''; window.scrollTo(0, lockY); }
  }
  function setSheet(open, viaKey) {
    if (!burger || open === (burger.getAttribute('aria-expanded') === 'true')) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Loka valmynd' : 'Opna valmynd');
    sheet.classList.toggle('is-open', open);
    sheet.inert = !open;
    lock(open);
    if (open) (viaKey ? $('a', sheet) : sheet).focus({ preventScroll: true });
    else if (viaKey) burger.focus();
  }
  if (burger) {
    burger.addEventListener('click', function (e) { setSheet(burger.getAttribute('aria-expanded') !== 'true', e.detail === 0); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setSheet(false, true); });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setSheet(false, false); });
    window.matchMedia('(min-width:834px)').addEventListener('change', function (m) { if (m.matches) setSheet(false, false); });
  }

  /* ---------- M12 forms: the prototype sends nothing ---------- */
  $$('form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      var n = $('.form_note', f); n.hidden = false; n.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  });

  /* ---------- motion ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduce.addEventListener('change', function () { location.reload(); });
  if (!root.classList.contains('js-motion')) { window.__ovReady = true; return; }
  if (!window.gsap || !window.ScrollTrigger) { root.classList.remove('js-motion', 'pre'); return; }

  try { init(); window.__ovReady = true; }
  catch (err) { root.classList.remove('js-motion', 'pre'); if (window.console) console.error(err); }

  function init() {
    var gsap = window.gsap, ST = window.ScrollTrigger, Split = window.SplitText;
    gsap.registerPlugin(ST); if (Split) gsap.registerPlugin(Split);
    var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

    // Smooth scrolling on fine pointers only (Lenis defaults, lerp 0.1: ON Energy). Touch scrolls natively.
    if (fine && window.Lenis) {
      var lenis = new window.Lenis({ lerp: 0.1, anchors: { offset: -72 } });
      lenis.on('scroll', ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      window.__lenis = lenis;
    }

    function lines(el, vars) {              // ON Energy's line reveal: y 40 → 0, 1s, power3.out, stagger .08, delay .15
      if (!Split) { el.style.visibility = 'visible'; return; }
      Split.create(el, { type: 'lines', linesClass: 'ln', autoSplit: true, onSplit: function (self) {
        el.style.visibility = 'visible';
        return gsap.from(self.lines, Object.assign({ y: 40, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.15 }, vars));
      } });
    }

    // Page heads wait for their picture so it never fades in over an empty frame. The home first screen waits only for
    // the fonts: the headline lines rise, then the lede, the actions and the facts. Nothing scrubs, nothing is held for
    // the picture (Sindri 13 Nov: "no weird introductions").
    var headPic = $('.phead_pic img');
    var decoded = headPic && headPic.decode ? headPic.decode().catch(function () {}) : Promise.resolve();
    Promise.all([document.fonts.ready, decoded]).then(function () {
      /* M1 arrival. Skipped when the page loads mid-scroll. Until here the pieces are held by html.pre (set in <head>). */
      var atTop = window.scrollY < 40, h1 = $('.hero_h1');
      if (headPic && atTop) gsap.from(headPic, { scale: 1.06, autoAlpha: 0, duration: 1.4, ease: 'expo.out', clearProps: 'all' });
      if (h1 && atTop && Split) {
        var sp = Split.create(h1, { type: 'lines', linesClass: 'ln' });
        gsap.from(sp.lines, { y: 40, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.05, onComplete: function () { sp.revert(); } });
      }
      if (atTop && $('[data-hero-in]')) gsap.from('[data-hero-in]', { y: 16, autoAlpha: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08, delay: 0.3, clearProps: 'all' });
      root.classList.remove('pre');
      /* M9 roster: portraits and names fade in by rows, nothing travels (55 names are for scanning) */
      ST.batch('[data-in]', { start: 'top 95%', once: true, onEnter: function (b) { gsap.to(b, { autoAlpha: 1, duration: 0.5, ease: 'sine.out', stagger: 0.04, overwrite: true }); } });

      /* M4 statement and every [data-lines] heading */
      $$('[data-lines]').forEach(function (el) {
        var st = { trigger: el.parentElement || el, start: 'top 82%', once: true };
        if (el.closest('.phead, .thead')) lines(el, { delay: 0.2 });
        else if (el.getAttribute('data-lines') === 'ink') lines(el, { autoAlpha: 0.3, scrollTrigger: st });
        else lines(el, { scrollTrigger: st });
      });
      /* fades and rises (the trigger is the parent, never the element that moves) */
      $$('[data-fade]').forEach(function (el) {
        gsap.to(el, { autoAlpha: 1, duration: 0.6, ease: 'sine.out', delay: 0.08, scrollTrigger: { trigger: el.parentElement || el, start: 'top 86%', once: true } });
      });
      $$('[data-rise]').forEach(function (el, i) {
        gsap.to(el, { autoAlpha: 1, y: 0, duration: 1.5, ease: 'power3.out', delay: (i % 2) * 0.15, scrollTrigger: { trigger: el.parentElement || el, start: 'top 84%', once: true } });
      });
      /* M5 index rows, work rows, commitments */
      ST.batch('[data-row]', { start: 'top 92%', once: true, onEnter: function (b) { gsap.to(b, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true }); } });
      /* M6 nameplate band: the plate fastens, the orange rule draws */
      $$('[data-plate]').forEach(function (p) {
        var parts = $$('.plate_mark, .plate_title, .plate_sub, .plate_tag', p);
        gsap.timeline({ scrollTrigger: { trigger: p, start: 'top 84%', once: true } })
          .fromTo(p, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut', clearProps: 'clipPath' })
          .to($('.plate_rule', p), { scaleX: 1, duration: 0.8, ease: 'expo.inOut' }, 0.25)
          .from(parts, { autoAlpha: 0, y: 16, duration: 0.7, ease: 'power3.out', stagger: 0.06, clearProps: 'all' }, 0.4);
      });
      /* M7 rating plates and ruled lists: read row by row */
      $$('[data-rating]').forEach(function (r) {
        gsap.from(r.matches('dl') ? $$(':scope > div', r) : $$('li, .mono', r), { autoAlpha: 0, y: 12, duration: 0.5, ease: 'power2.out', stagger: 0.06, clearProps: 'all', scrollTrigger: { trigger: r, start: 'top 86%', once: true } });
      });
      /* M8 timeline: the rule draws with the scroll and each milestone arrives as the rule reaches it (reversible) */
      $$('[data-timeline]').forEach(function (list) {
        var items = $$('li', list);
        ST.create({ trigger: list, start: 'top 82%', end: 'bottom 62%', scrub: true, onUpdate: function (s) {
          list.style.setProperty('--p', s.progress.toFixed(4));
          var n = Math.round(s.progress * items.length + 0.35);
          items.forEach(function (li, i) { li.classList.toggle('is-on', i < n); });
        }, onRefresh: function (s) { list.style.setProperty('--p', s.progress.toFixed(4)); } });
      });
      /* picture drift inside its frame, fine pointers only */
      if (fine) $$('[data-parallax]').forEach(function (im) {
        gsap.fromTo(im, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: im.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      ST.refresh();
    });
    window.addEventListener('load', function () { ST.refresh(); });
  }
})();
