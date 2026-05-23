(function () {
  'use strict';

  var all = [];
  var history = [];
  var current = -1;

  var questionEl = document.getElementById('question');
  var bgTextEl = document.getElementById('bgText');
  var cardEl = document.getElementById('card');
  var cardBg = document.getElementById('cardBg');
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
        cat.perguntas.forEach(function (q) {
          all.push(q);
        });
      });
      shuffleAll();
      showAt(0);
    })
    .catch(function () {
      questionEl.textContent = 'Erro ao carregar perguntas.';
    });

  function shuffleAll() {
    for (var i = all.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = all[i];
      all[i] = all[j];
      all[j] = tmp;
    }
  }

  function showAt(index) {
    if (index < 0 || index >= all.length) return;
    current = index;
    questionEl.textContent = all[current];
    updateBg();
  }

  function next() {
    if (current < all.length - 1) {
      history.push(current);
      slideTo(current + 1, -100);
    } else {
      toast('Última pergunta');
    }
  }

  function prev() {
    if (history.length > 0) {
      var idx = history.pop();
      slideTo(idx, 100);
    } else if (current > 0) {
      slideTo(current - 1, 100);
    } else {
      toast('Primeira pergunta');
    }
  }

  function random() {
    if (all.length < 2) return;
    var idx;
    do {
      idx = Math.floor(Math.random() * all.length);
    } while (idx === current);
    if (current >= 0) history.push(current);
    slideTo(idx, idx > current ? -100 : 100);
  }

  function slideTo(index, outDir) {
    var inDir = outDir > 0 ? -40 : 40;

    cardEl.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    cardEl.style.transform = 'translateX(' + outDir + '%)';
    cardEl.style.opacity = '0';

    setTimeout(function () {
      current = index;
      questionEl.textContent = all[current];
      updateBg();

      cardEl.style.transition = 'none';
      cardEl.style.transform = 'translateX(' + inDir + '%)';
      cardEl.style.opacity = '0';
      cardEl.offsetHeight;

      cardEl.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
      cardEl.style.transform = 'translateX(0%)';
      cardEl.style.opacity = '1';

      setTimeout(function () {
        cardEl.style.transition = '';
        cardEl.style.transform = '';
        cardEl.style.opacity = '';
      }, 380);
    }, 320);
  }

  function updateBg() {
    if (current < all.length - 1) {
      bgTextEl.textContent = all[current + 1];
    } else if (current > 0) {
      bgTextEl.textContent = all[current - 1];
    }
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._timeout);
    toastEl._timeout = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 1400);
  }

  // ── Drag ──

  function isOnButton(el) {
    while (el) {
      if (el.tagName === 'BUTTON') return true;
      el = el.parentElement;
    }
    return false;
  }

  function dragStart(x, y, target) {
    drag.onBtn = isOnButton(target);
    if (drag.onBtn) return;
    drag.active = true;
    drag.startX = x;
    drag.startY = y;
    drag.dx = 0;
    drag.moved = false;
    cardEl.style.transition = 'none';
    cardBg.classList.remove('reveal');
  }

  function dragMove(x, y) {
    if (!drag.active) return;
    var dx = x - drag.startX;
    var dy = y - drag.startY;

    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    drag.moved = true;
    drag.dx = dx;

    var canPrev = current > 0;
    var canNext = current < all.length - 1;

    if (Math.abs(dx) > Math.abs(dy) * 0.3) {
      cardEl.style.transform = 'translateX(' + dx + 'px)';

      var progress = Math.min(Math.abs(dx) / THRESHOLD, 1);
      cardEl.style.opacity = 1 - progress * 0.5;

      if (dx < 0 && canNext) {
        bgTextEl.textContent = all[current + 1];
        cardBg.classList.add('reveal');
      } else if (dx > 0 && canPrev) {
        bgTextEl.textContent = all[current - 1];
        cardBg.classList.add('reveal');
      } else {
        cardBg.classList.remove('reveal');
      }
    }
  }

  function dragEnd() {
    if (!drag.active) return;
    drag.active = false;
    cardBg.classList.remove('reveal');

    if (!drag.moved) {
      next();
      return;
    }

    var dx = drag.dx;
    var absDx = Math.abs(dx);

    if (absDx >= THRESHOLD) {
      var dir = dx < 0 ? -1 : 1;
      if (dir < 0 && current < all.length - 1) {
        history.push(current);
        finishSlide(dir, function () {
          current++;
          questionEl.textContent = all[current];
          updateBg();
        });
      } else if (dir > 0 && current > 0) {
        finishSlide(dir, function () {
          if (history.length > 0) {
            current = history.pop();
          } else {
            current--;
          }
          questionEl.textContent = all[current];
          updateBg();
        });
      } else {
        snapBack();
      }
    } else {
      snapBack();
    }
  }

  function finishSlide(dir, updateFn) {
    var outX = dir === -1 ? '-100%' : '100%';
    cardEl.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
    cardEl.style.transform = 'translateX(' + outX + ')';
    cardEl.style.opacity = '0';

    setTimeout(function () {
      updateFn();
      var inX = dir === -1 ? '40px' : '-40px';
      cardEl.style.transition = 'none';
      cardEl.style.transform = 'translateX(' + inX + ')';
      cardEl.style.opacity = '0';
      cardEl.offsetHeight;
      cardEl.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      cardEl.style.transform = 'translateX(0px)';
      cardEl.style.opacity = '1';
      setTimeout(function () {
        cardEl.style.transition = '';
        cardEl.style.transform = '';
        cardEl.style.opacity = '';
      }, 350);
    }, 260);
  }

  function snapBack() {
    cardEl.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    cardEl.style.transform = 'translateX(0px)';
    cardEl.style.opacity = '1';
    setTimeout(function () {
      cardEl.style.transition = '';
      cardEl.style.transform = '';
      cardEl.style.opacity = '';
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

  document.addEventListener('touchend', function () {
    dragEnd();
  }, { passive: true });

  // ── Mouse ──

  document.addEventListener('mousedown', function (e) {
    dragStart(e.clientX, e.clientY, e.target);
  });

  document.addEventListener('mousemove', function (e) {
    dragMove(e.clientX, e.clientY);
  });

  document.addEventListener('mouseup', function () {
    dragEnd();
  });

  // ── Buttons ──

  prevBtn.addEventListener('click', function (e) { e.stopPropagation(); prev(); });
  nextBtn.addEventListener('click', function (e) { e.stopPropagation(); next(); });
  shuffleBtn.addEventListener('click', function (e) { e.stopPropagation(); random(); });

  // ── Keyboard ──

  document.addEventListener('keydown', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') prev();
    else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') next();
    else if (e.code === 'Space') { e.preventDefault(); random(); }
  });

  // ── PWA ──

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js').catch(function () {});
    });
  }
})();
