(function () {
  'use strict';

  var all = [];
  var history = [];
  var current = -1;
  var animating = false;

  var questionEl = document.getElementById('question');
  var cardEl = document.getElementById('card');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var shuffleBtn = document.getElementById('shuffleBtn');
  var toastEl = document.getElementById('toast');

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

  function showAt(index, dir) {
    if (animating) return;
    if (index < 0 || index >= all.length) return;
    if (index === current) return;

    animating = true;
    current = index;

    if (dir) {
      cardEl.classList.add(dir === 1 ? 'after' : 'before');
      setTimeout(function () {
        questionEl.textContent = all[current];
        cardEl.classList.remove('before', 'after');
        animating = false;
      }, 180);
    } else {
      questionEl.textContent = all[current];
      animating = false;
    }
  }

  function next() {
    if (current < all.length - 1) {
      history.push(current);
      showAt(current + 1, 1);
    } else {
      toast('Última pergunta');
    }
  }

  function prev() {
    if (history.length > 0) {
      var idx = history.pop();
      showAt(idx, -1);
    } else if (current > 0) {
      showAt(current - 1, -1);
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
    showAt(idx, idx > current ? 1 : -1);
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._timeout);
    toastEl._timeout = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 1400);
  }

  // ── Buttons ──

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  shuffleBtn.addEventListener('click', random);

  // ── Swipe ──

  var startX = 0, startY = 0, swiping = false;

  document.addEventListener('touchstart', function (e) {
    var t = e.changedTouches[0];
    startX = t.clientX;
    startY = t.clientY;
    swiping = true;
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    if (!swiping) return;
    swiping = false;
    var t = e.changedTouches[0];
    var dx = t.clientX - startX;
    var dy = t.clientY - startY;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx > 0) prev();
    else next();
  }, { passive: true });

  // ── Mouse drag ──

  document.addEventListener('mousedown', function (e) {
    startX = e.clientX;
    startY = e.clientY;
    swiping = true;
  });

  document.addEventListener('mouseup', function (e) {
    if (!swiping) return;
    swiping = false;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx > 0) prev();
    else next();
  });

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
