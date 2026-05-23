(function () {
  'use strict';

  var all = [];
  var history = [];
  var current = -1;
  var busy = false;

  var frontEl = document.getElementById('cardFront');
  var backEl = document.getElementById('cardBack');
  var frontQ = document.getElementById('frontQuestion');
  var backQ = document.getElementById('backQuestion');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var shuffleBtn = document.getElementById('shuffleBtn');
  var toastEl = document.getElementById('toast');

  var THRESHOLD = 80;
  var drag = { active: false, startX: 0, startY: 0, dx: 0, moved: false, onBtn: false };

  fetch('questions.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      data.forEach(function (cat) {
        cat.perguntas.forEach(function (q) { all.push(q); });
      });
      shuffleAll();
      showAt(0);
    })
    .catch(function () { frontQ.textContent = 'Erro ao carregar perguntas.'; });

  function shuffleAll() {
    for (var i = all.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = all[i]; all[i] = all[j]; all[j] = tmp;
    }
  }

  function showAt(index) {
    current = index;
    frontQ.textContent = all[current];
    backQ.textContent = current < all.length - 1 ? all[current + 1] : all[current - 1];
    resetCards();
  }

  function resetCards() {
    frontEl.style.transition = '';
    frontEl.style.transform = '';
    frontEl.style.opacity = '';
    backEl.style.transition = '';
    backEl.style.transform = '';
    backEl.style.opacity = '';
  }

  function updateBack() {
    if (current < all.length - 1) {
      backQ.textContent = all[current + 1];
    } else if (current > 0) {
      backQ.textContent = all[current - 1];
    }
    backEl.style.transition = 'none';
    backEl.style.transform = '';
    backEl.style.opacity = '';
  }

  function goNext() {
    if (busy) return;
    if (current >= all.length - 1) { toast('Última pergunta'); return; }
    busy = true;
    history.push(current);
    slideTo(current + 1, -1);
  }

  function goPrev() {
    if (busy) return;
    var idx;
    if (history.length > 0) {
      idx = history.pop();
    } else if (current > 0) {
      idx = current - 1;
    } else {
      toast('Primeira pergunta');
      return;
    }
    busy = true;
    backQ.textContent = all[idx];
    backEl.style.transition = '';
    backEl.style.transform = '';
    backEl.style.opacity = '';
    slideTo(idx, 1);
  }

  function goRandom() {
    if (busy || all.length < 2) return;
    var idx;
    do { idx = Math.floor(Math.random() * all.length); } while (idx === current);
    if (current >= 0) history.push(current);
    busy = true;
    backQ.textContent = all[idx];
    backEl.style.transition = '';
    backEl.style.transform = '';
    backEl.style.opacity = '';
    slideTo(idx, idx > current ? -1 : 1);
  }

  function slideTo(target, dir) {
    var outX = dir * -100;
    var inX = dir * 100;

    frontEl.style.transition = 'transform 0.3s ease, opacity 0.25s ease';
    frontEl.style.transform = 'translateX(' + outX + '%)';
    frontEl.style.opacity = '0';

    setTimeout(function () {
      current = target;
      frontQ.textContent = all[current];
      frontEl.style.transition = 'none';
      frontEl.style.transform = 'translateX(' + inX + '%)';
      frontEl.style.opacity = '0';
      frontEl.offsetHeight;

      frontEl.style.transition = 'transform 0.35s ease, opacity 0.3s ease';
      frontEl.style.transform = 'translateX(0%)';
      frontEl.style.opacity = '1';

      updateBack();

      setTimeout(function () {
        frontEl.style.transition = '';
        frontEl.style.transform = '';
        frontEl.style.opacity = '';
        busy = false;
      }, 380);
    }, 320);
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._timeout);
    toastEl._timeout = setTimeout(function () { toastEl.classList.remove('show'); }, 1400);
  }

  // ── Drag ──

  function isOnButton(el) {
    while (el) { if (el.tagName === 'BUTTON') return true; el = el.parentElement; }
    return false;
  }

  function dragStart(x, y, target) {
    if (busy) return;
    drag.onBtn = isOnButton(target);
    if (drag.onBtn) return;
    drag.active = true;
    drag.startX = x;
    drag.startY = y;
    drag.dx = 0;
    drag.moved = false;

    frontEl.style.transition = 'none';

    if (current < all.length - 1) {
      backQ.textContent = all[current + 1];
    }
    backEl.style.transition = 'none';
    backEl.style.transform = '';
    backEl.style.opacity = '';
  }

  function dragMove(x, y) {
    if (!drag.active) return;
    var dx = x - drag.startX;
    var dy = y - drag.startY;
    if (!drag.moved && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    drag.moved = true;
    drag.dx = dx;

    if (Math.abs(dx) > Math.abs(dy) * 0.3) {
      frontEl.style.transform = 'translateX(' + dx + 'px)';
      var progress = Math.min(Math.abs(dx) / THRESHOLD, 1);
      frontEl.style.opacity = 1 - progress * 0.5;
    }
  }

  function dragEnd() {
    if (!drag.active) return;
    drag.active = false;
    if (!drag.moved) { goNext(); return; }

    var dx = drag.dx;
    if (Math.abs(dx) >= THRESHOLD) {
      if (dx < 0 && current < all.length - 1) {
        busy = true;
        history.push(current);
        dragFinish(-1, function () {
          current++;
          frontQ.textContent = all[current];
          dragReset(-1);
        });
      } else if (dx > 0) {
        var idx;
        if (history.length > 0) {
          idx = history.pop();
        } else if (current > 0) {
          idx = current - 1;
        } else {
          dragSnap();
          return;
        }
        busy = true;
        backQ.textContent = all[idx];
        backEl.style.transition = '';
        backEl.style.transform = '';
        backEl.style.opacity = '';
        dragFinish(1, function () {
          current = idx;
          frontQ.textContent = all[current];
          dragReset(1);
        });
      } else {
        dragSnap();
      }
    } else {
      dragSnap();
    }
  }

  function dragFinish(dir, cb) {
    var outX = dir === -1 ? '-100%' : '100%';
    frontEl.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
    frontEl.style.transform = 'translateX(' + outX + ')';
    frontEl.style.opacity = '0';
    setTimeout(cb, 260);
  }

  function dragReset(dir) {
    var inX = dir === -1 ? '40px' : '-40px';
    frontEl.style.transition = 'none';
    frontEl.style.transform = 'translateX(' + inX + ')';
    frontEl.style.opacity = '0';
    frontEl.offsetHeight;
    frontEl.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    frontEl.style.transform = 'translateX(0px)';
    frontEl.style.opacity = '1';
    updateBack();
    setTimeout(function () {
      frontEl.style.transition = '';
      frontEl.style.transform = '';
      frontEl.style.opacity = '';
      busy = false;
    }, 350);
  }

  function dragSnap() {
    frontEl.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    frontEl.style.transform = 'translateX(0px)';
    frontEl.style.opacity = '1';
    setTimeout(function () {
      frontEl.style.transition = '';
      frontEl.style.transform = '';
      frontEl.style.opacity = '';
    }, 350);
  }

  // ── Touch ──

  document.addEventListener('touchstart', function (e) {
    var t = e.changedTouches[0];
    dragStart(t.clientX, t.clientY, e.target);
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    var t = e.changedTouches[0];
    dragMove(t.clientX, t.clientY);
  }, { passive: true });
  document.addEventListener('touchend', function () { dragEnd(); }, { passive: true });

  // ── Mouse ──

  document.addEventListener('mousedown', function (e) { dragStart(e.clientX, e.clientY, e.target); });
  document.addEventListener('mousemove', function (e) { dragMove(e.clientX, e.clientY); });
  document.addEventListener('mouseup', function () { dragEnd(); });

  // ── Buttons ──

  prevBtn.addEventListener('click', function (e) { e.stopPropagation(); goPrev(); });
  nextBtn.addEventListener('click', function (e) { e.stopPropagation(); goNext(); });
  shuffleBtn.addEventListener('click', function (e) { e.stopPropagation(); goRandom(); });

  // ── Keyboard ──

  document.addEventListener('keydown', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') goPrev();
    else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') goNext();
    else if (e.code === 'Space') { e.preventDefault(); goRandom(); }
  });

  // ── PWA ──

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js').catch(function () {});
    });
  }
})();
