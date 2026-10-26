/* Короткий метр на главной: кадры оживают при каждом входе, полосы видны только во время фильма */
(function () {
  'use strict';
  var film = document.querySelector('.film');
  if (!film) return;
  var doc = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var scenes = [].slice.call(film.querySelectorAll('.sc'));
  var tc = film.querySelector('.hud__tc');
  var sceneLbl = film.querySelector('.hud__scene');
  var pad = function (n) { return String(n).padStart(2, '0'); };

  /* если кадр выше экрана (зум, крупный шрифт) — мягкое прилипание вместо жёсткого */
  var checkSnap = function () {
    var tall = scenes.some(function (s) { return s.scrollHeight > window.innerHeight + 2; });
    doc.classList.toggle('snap-soft', tall);
  };
  checkSnap();
  window.addEventListener('resize', checkSnap);

  /* таймкод от прокрутки фильма; полосы прячутся, когда фильм закончился */
  var ticking = false;
  var paint = function () {
    ticking = false;
    var r = film.getBoundingClientRect();
    doc.classList.toggle('film-off', r.bottom < window.innerHeight * 0.5);
    var span = film.offsetHeight - window.innerHeight;
    var t = span > 0 ? Math.max(0, Math.min(1, -r.top / span)) * 29.96 : 0;
    var sec = Math.floor(t), fr = Math.floor((t - sec) * 25);
    if (tc) tc.textContent = '00:00:' + pad(sec) + ':' + pad(fr);
  };
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
  paint();

  var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  var countUp = function (el) {
    var to = parseInt(el.getAttribute('data-count'), 10);
    if (reduced) { el.textContent = fmt(to); return; }
    var t0 = null, dur = 1400;
    var step = function (ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step); else el.textContent = fmt(to);
    };
    requestAnimationFrame(step);
    setTimeout(function () { el.textContent = fmt(to); }, dur + 400);
  };

  if (reduced || !('IntersectionObserver' in window)) { scenes.forEach(function (s) { s.classList.add('on'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var s = en.target;
      if (en.intersectionRatio >= 0.5) {
        if (!s.classList.contains('on')) {
          s.classList.add('on');
          s.querySelectorAll('[data-count]').forEach(countUp);
        }
        if (sceneLbl) sceneLbl.textContent = 'Кадр ' + pad(scenes.indexOf(s) + 1) + '/' + pad(scenes.length);
      } else if (!en.isIntersecting) {
        s.classList.remove('on');   /* при возвращении в кадр анимация проиграется снова */
      }
    });
  }, { threshold: [0, 0.5] });
  scenes.forEach(function (s) { io.observe(s); });
  setTimeout(function () { scenes.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top < window.innerHeight && r.bottom > 0) s.classList.add('on'); }); }, 2500);
})();
