/* АБУZZИЩЕ — главная: меню «Пуск», бегущая строка, часы, график, появление блоков */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* меню «Пуск» — disclosure-навигация */
  var nav = document.querySelector('.dock');
  var btn = nav && nav.querySelector('.start');
  var menu = document.getElementById('start-menu');
  if (btn && menu) {
    menu.hidden = true;
    var set = function (open, focusBtn) {
      btn.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
      if (!open && focusBtn) btn.focus();
    };
    btn.addEventListener('click', function () { set(menu.hidden); });
    nav.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { e.preventDefault(); set(false, true); }
    });
    document.addEventListener('pointerdown', function (e) {
      if (!menu.hidden && !nav.contains(e.target)) set(false);
    });
    nav.addEventListener('focusout', function (e) {
      if (e.relatedTarget && !nav.contains(e.relatedTarget)) set(false);
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) set(false);
    });
  }

  /* часы на панели задач */
  var clock = document.querySelector('.dock__clock');
  if (clock) {
    var tick = function () {
      var d = new Date();
      clock.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    };
    tick();
    setInterval(tick, 20000);
  }

  /* бегущая строка: пауза */
  var ticker = document.querySelector('.ticker');
  if (ticker) {
    var tb = ticker.querySelector('.ticker__btn');
    var lbl = ticker.querySelector('.ticker__lbl');
    tb.addEventListener('click', function () {
      var paused = ticker.classList.toggle('is-paused');
      lbl.textContent = paused ? 'Запустить' : 'Пауза';
    });
  }

  /* график: переключение серий */
  var chart = document.querySelector('.chart');
  if (chart) {
    var area = chart.querySelector('.plot__area');
    var names = { all: 'все проекты', abuzz: 'АБУZZИЩЕ', loubank: 'Лоубанк в деле', fastmani: 'Фастмани' };
    var real = {};
    chart.querySelectorAll('.ser').forEach(function (s) {
      var key = s.className.match(/ser--(\w+)/)[1];
      var l = s.querySelector('.endlbl');
      real[key] = l ? l.firstChild.textContent : '';
    });
    var apply = function (key) {
      chart.setAttribute('data-active', key);
      area.setAttribute('aria-label', 'Макет графика роста: ' + names[key] + '. Реальное значение на октябрь 2026 — ' + real[key] + ' подписчиков, старт — апрель 2021.');
    };
    var checked = chart.querySelector('input[name="series"]:checked');
    apply(checked ? checked.value : 'all');
    chart.addEventListener('change', function (e) {
      if (e.target.name === 'series') apply(e.target.value);
    });
  }

  /* мобилка: фокус не уходит под панель задач */
  document.addEventListener('focusin', function (e) {
    if (!nav || window.innerWidth >= 1024 || nav.contains(e.target)) return;
    var r = e.target.getBoundingClientRect();
    var limit = window.innerHeight - nav.offsetHeight - 12;
    if (r.bottom > limit) window.scrollBy(0, r.bottom - limit);
  });

  /* появление блоков, счёт цифр, прорисовка линий */
  if (reduced || !('IntersectionObserver' in window)) return;
  doc.classList.add('js-anim');

  var countUp = function (el) {
    var to = parseInt(el.getAttribute('data-count'), 10);
    var t0 = null, dur = 1300;
    var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
    var step = function (ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step); else el.textContent = fmt(to);
    };
    requestAnimationFrame(step);
    setTimeout(function () { el.textContent = fmt(to); }, dur + 400);
  };

  var show = function (el) {
    if (el.classList.contains('is-in')) return;
    el.classList.add('is-in');
    el.querySelectorAll('[data-count]').forEach(countUp);
  };
  var els = document.querySelectorAll('.reveal');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  els.forEach(function (el) { io.observe(el); });

  /* страховка: если наблюдатель не сработал (скрытая вкладка, печать) — показать всё */
  setTimeout(function () { els.forEach(show); }, 4000);
})();
