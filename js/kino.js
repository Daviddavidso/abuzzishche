/* Короткий метр: кадры появляются при прокрутке, таймкод и номер кадра в полосах, «Смотреть заново» */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var scenes = [].slice.call(document.querySelectorAll('.sc'));
  var tc = document.querySelector('.hud__tc');
  var sceneLbl = document.querySelector('.hud__scene');
  var pad = function (n) { return String(n).padStart(2, '0'); };

  /* склейки выключаются, если какой-то кадр выше экрана (зум, крупный шрифт) */
  /* последний кадр (титры) можно листать внутри — он не мешает; остальные проверяем */
  var checkSnap = function () {
    var tall = scenes.slice(0, -1).some(function (s) { return s.scrollHeight > window.innerHeight + 2; });
    doc.classList.toggle('snap-soft', tall);
  };
  checkSnap();
  window.addEventListener('resize', checkSnap);

  /* таймкод привязан к прокрутке: весь фильм — минута */
  var ticking = false;
  var paint = function () {
    ticking = false;
    var max = doc.scrollHeight - window.innerHeight;
    var t = max > 0 ? Math.min(1, window.scrollY / max) * 59.96 : 0;
    var sec = Math.floor(t), fr = Math.floor((t - sec) * 25);
    if (tc) tc.textContent = '00:00:' + pad(sec) + ':' + pad(fr);
  };
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
  paint();

  var countUp = function (el) {
    var to = parseInt(el.getAttribute('data-count'), 10);
    var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
    if (reduced) { el.textContent = fmt(to); return; }
    var t0 = null, dur = 1200;
    var step = function (ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step); else el.textContent = fmt(to);
    };
    requestAnimationFrame(step);
    setTimeout(function () { el.textContent = fmt(to); }, dur + 400);
  };
  var show = function (s) {
    if (s.classList.contains('on')) return;
    s.classList.add('on');
    s.querySelectorAll('[data-count]').forEach(countUp);
  };

  if (!('IntersectionObserver' in window)) { scenes.forEach(show); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      show(en.target);
      var i = scenes.indexOf(en.target) + 1;
      if (sceneLbl) sceneLbl.textContent = 'Кадр ' + pad(i) + '/' + pad(scenes.length);
    });
  }, { threshold: 0.55 });
  scenes.forEach(function (s) { io.observe(s); });
  /* страховка: если кадр так и не попал в наблюдатель (скрытая вкладка) */
  setTimeout(function () { scenes.forEach(function (s) { if (s.getBoundingClientRect().top < window.innerHeight) show(s); }); }, 2500);

  /* «Смотреть заново»: мгновенно наверх (без промотки через все кадры) и фокус на заголовок */
  var replay = document.querySelector('.js-replay');
  if (replay) replay.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'instant' });
    var h1 = document.getElementById('s1-h');
    if (h1) h1.focus({ preventScroll: true });
  });
})();
