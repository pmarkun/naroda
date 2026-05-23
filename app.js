(function () {
  'use strict';

  /* ── state ── */

  var questions = [];
  var aboutPages = [];
  var qIndex = 0;
  var aIndex = 0;
  var aboutMode = false;
  var busy = false;

  /* ── dom ── */

  var $ = function (id) { return document.getElementById(id); };

  var frontInner = $('frontInner');
  var backInner = $('backInner');
  var frontCard = $('cardFront');
  var backCard = $('cardBack');
  var questionText = $('questionText');
  var aboutContent = $('aboutContent');
  var aboutDots = $('aboutDots');
  var prevBtn = $('prevBtn');
  var nextBtn = $('nextBtn');
  var shareBtn = $('shareBtn');
  var aboutBtn = $('aboutBtn');
  var aboutCloseBtn = $('aboutCloseBtn');
  var installBtn = $('installBtn');
  var toastEl = $('toast');

  /* ── load ── */

  Promise.all([
    fetch('questions.json').then(function (r) { return r.json(); }),
    fetch('about.json').then(function (r) { return r.json(); }),
  ]).then(function (data) {
    data[0].forEach(function (cat) {
      cat.perguntas.forEach(function (q) { questions.push(q); });
    });
    aboutPages = data[1].pages;
    shuffleAll();
    updateBackQ();
    showQ(0);
    renderDots();
    if (!localStorage.getItem('naroda_about_seen')) {
      toggleAbout();
      localStorage.setItem('naroda_about_seen', '1');
    }
  }).catch(function () {
    questionText.textContent = 'Erro ao carregar.';
  });

  function shuffleAll() {
    for (var i = questions.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = questions[i]; questions[i] = questions[j]; questions[j] = tmp;
    }
  }

  /* ── helpers ── */

  function resetStyle(el) {
    el.style.transition = '';
    el.style.transform = '';
    el.style.opacity = '';
  }

  function hideBack() {
    backCard.classList.add('idle');
  }

  function showBack() {
    backCard.classList.remove('idle');
  }

  /* ── question mode ── */

  function showQ(index) {
    if (index < 0 || index >= questions.length) return;
    qIndex = index;
    questionText.textContent = questions[qIndex];
    updateBackQ();
    resetStyle(frontCard);
    hideBack();
    setBackContentQ();
  }

  function updateBackQ() {
    if (qIndex < questions.length - 1) {
      var next = questions[qIndex + 1];
      backInner.textContent = next;
    }
  }

  function setBackContentQ() {
    var nextIdx = qIndex < questions.length - 1 ? qIndex + 1 : qIndex - 1;
    if (nextIdx >= 0 && nextIdx < questions.length) {
      backInner.textContent = questions[nextIdx];
    }
  }

  /* ── about mode ── */

  function showA(index) {
    if (index < 0 || index >= aboutPages.length) return;
    aIndex = index;
    renderAbout(frontInner, aIndex);
    renderAbout(backInner, aIndex < aboutPages.length - 1 ? aIndex + 1 : 0);
    updateDots();
    resetStyle(frontCard);
    hideBack();
  }

  function renderAbout(el, idx) {
    var page = aboutPages[idx];
    if (!page) return;
    var html = '<div class="about-title">' + esc(page.title) + '</div>';
    if (page.type === 'text') {
      html += '<div class="about-text">' + esc(page.body) + '</div>';
    } else if (page.type === 'list') {
      html += '<ul class="about-list">';
      page.items.forEach(function (item) {
        html += '<li>' + esc(item) + '</li>';
      });
      html += '</ul>';
    }
    el.innerHTML = html;
  }

  function updateDots() {
    var dots = aboutDots.querySelectorAll('.about-dot');
    dots.forEach(function (d, i) {
      d.classList.toggle('active', i === aIndex);
    });
  }

  function renderDots() {
    var html = '';
    for (var i = 0; i < aboutPages.length; i++) {
      html += '<span class="about-dot' + (i === 0 ? ' active' : '') + '"></span>';
    }
    aboutDots.innerHTML = html;
  }

  function esc(str) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  /* ── mode toggle ── */

  function toggleAbout() {
    aboutMode = !aboutMode;

    if (aboutMode) {
      aboutBtn.hidden = true;
      aboutCloseBtn.hidden = false;
      shareBtn.hidden = true;
      aboutDots.hidden = false;
      questionText.hidden = true;
      aboutContent.hidden = false;

      aIndex = 0;
      renderAbout(frontInner, 0);
      renderAbout(backInner, 1);
      updateDots();
      hideBack();
    } else {
      aboutBtn.hidden = false;
      aboutCloseBtn.hidden = true;
      shareBtn.hidden = false;
      aboutDots.hidden = true;
      questionText.hidden = false;
      aboutContent.hidden = true;

      showQ(qIndex);
    }
    resetStyle(frontCard);
  }

  /* ── navigation (mode-aware) ── */

  function goNext() {
    if (busy) return;
    if (aboutMode) {
      if (aIndex >= aboutPages.length - 1) { toggleAbout(); return; }
      busy = true;
      var target = aIndex + 1;
      renderAbout(backInner, target);
      showBack();
      slideNext(target, function () {
        aIndex = target;
        renderAbout(frontInner, aIndex);
        renderAbout(backInner, aIndex < aboutPages.length - 1 ? aIndex + 1 : 0);
        updateDots();
        hideBack();
      });
    } else {
      if (qIndex >= questions.length - 1) { toast('Última pergunta'); return; }
      busy = true;
      var target = qIndex + 1;
      showBack();
      slideNext(target, function () {
        qIndex = target;
        questionText.textContent = questions[qIndex];
        updateBackQ();
        hideBack();
      });
    }
  }

  function goPrev() {
    if (busy) return;
    if (aboutMode) {
      if (aIndex <= 0) return;
      busy = true;
      var target = aIndex - 1;
      renderAbout(backInner, target);
      showBack();
      slidePrev(target, function () {
        aIndex = target;
        renderAbout(frontInner, aIndex);
        renderAbout(backInner, aIndex < aboutPages.length - 1 ? aIndex + 1 : 0);
        updateDots();
        hideBack();
      });
    } else {
      if (qIndex <= 0) { toast('Primeira pergunta'); return; }
      busy = true;
      var target = qIndex - 1;
      backInner.textContent = questions[target];
      showBack();
      slidePrev(target, function () {
        qIndex = target;
        questionText.textContent = questions[qIndex];
        updateBackQ();
        hideBack();
      });
    }
  }

  function slideNext(target, done) {
    frontCard.style.transition = 'transform 0.3s ease';
    frontCard.style.transform = 'translateX(-100%)';
    setTimeout(function () {
      done();
      frontCard.style.transition = 'none';
      frontCard.style.transform = 'translateX(40px)';
      frontCard.offsetHeight;
      frontCard.style.transition = 'transform 0.35s ease';
      frontCard.style.transform = 'translateX(0%)';
      setTimeout(function () {
        resetStyle(frontCard);
        busy = false;
      }, 380);
    }, 320);
  }

  function slidePrev(target, done) {
    frontCard.style.transition = 'transform 0.3s ease';
    frontCard.style.transform = 'translateX(100%)';
    setTimeout(function () {
      done();
      frontCard.style.transition = 'none';
      frontCard.style.transform = 'translateX(-40px)';
      frontCard.offsetHeight;
      frontCard.style.transition = 'transform 0.35s ease';
      frontCard.style.transform = 'translateX(0%)';
      setTimeout(function () {
        resetStyle(frontCard);
        busy = false;
      }, 380);
    }, 320);
  }

  /* ── share ── */

  var logoImg = null;

  function loadLogo() {
    var img = new Image();
    img.onload = function () { logoImg = img; };
    img.src = 'logo_original.png';
  }
  loadLogo();

  function shareQuestion() {
    var text = questionText.textContent;
    if (!text || text === 'Erro ao carregar.') return;

    var canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1080, 1920);

    // subtle grain
    ctx.fillStyle = '#0a0a0a';
    for (var i = 0; i < 300; i++) {
      ctx.fillRect(Math.random() * 1080, Math.random() * 1920, 1, 1);
    }

    // logo
    if (logoImg) {
      var s = 200;
      ctx.save();
      ctx.beginPath();
      ctx.arc(540, 320 + s / 2, s / 2 + 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fill();
      ctx.restore();
      ctx.drawImage(logoImg, (1080 - s) / 2, 320, s, s);
    }

    // question
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var fs = 56;
    ctx.font = '400 ' + fs + 'px Georgia, "Playfair Display", serif';

    var words = text.split(' ');
    var lines = [];
    var line = '';
    var maxW = 760;
    for (var w = 0; w < words.length; w++) {
      var test = line + words[w] + ' ';
      if (ctx.measureText(test).width > maxW && line.length > 0) {
        lines.push(line.trim());
        line = words[w] + ' ';
      } else {
        line = test;
      }
    }
    lines.push(line.trim());

    var lh = fs * 1.5;
    var totalH = lines.length * lh;
    var startY = 700;
    var firstY = startY - totalH / 2 + lh / 2;

    // shadow
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (var l = 0; l < lines.length; l++) {
      ctx.fillText(lines[l], 542, firstY + l * lh + 2);
    }

    ctx.fillStyle = '#ffffff';
    for (var l = 0; l < lines.length; l++) {
      ctx.fillText(lines[l], 540, firstY + l * lh);
    }

    // footer
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '24px Georgia, serif';
    ctx.fillText('naroda.app', 540, 1760);

    canvas.toBlob(function (blob) {
      var file = new File([blob], 'na-roda.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Na Roda' });
      } else {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'na-roda-pergunta.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast('Imagem salva');
      }
    });
  }

  /* ── drag (mode-aware) ── */

  var THRESHOLD = 80;
  var drag = { active: false, startX: 0, startY: 0, dx: 0, moved: false, onBtn: false };

  function isOnButton(el) {
    while (el) { if (el.tagName === 'BUTTON') return true; el = el.parentElement; }
    return false;
  }

  function dragStart(x, y, target) {
    if (busy) return;
    if (isOnButton(target)) return;
    drag.active = true;
    drag.startX = x;
    drag.startY = y;
    drag.dx = 0;
    drag.moved = false;
    frontCard.style.transition = 'none';

    if (aboutMode) {
      var nextIdx = aIndex < aboutPages.length - 1 ? aIndex + 1 : -1;
      if (nextIdx >= 0) renderAbout(backInner, nextIdx);
    } else {
      if (qIndex < questions.length - 1) backInner.textContent = questions[qIndex + 1];
    }
    showBack();
    resetStyle(backCard);
  }

  function dragMove(x, y) {
    if (!drag.active) return;
    var dx = x - drag.startX;
    var dy = y - drag.startY;
    if (!drag.moved && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    drag.moved = true;
    drag.dx = dx;
    if (Math.abs(dx) > Math.abs(dy) * 0.3) {
      frontCard.style.transform = 'translateX(' + dx + 'px)';
    }
  }

  function dragEnd() {
    if (!drag.active) return;
    drag.active = false;
    if (!drag.moved) { goNext(); return; }

    var dx = drag.dx;
    if (Math.abs(dx) >= THRESHOLD) {
      if (dx < 0) {
        if (aboutMode && aIndex < aboutPages.length - 1) {
          busy = true;
          finishDrag(-1, function () {
            aIndex++;
            renderAbout(frontInner, aIndex);
            renderAbout(backInner, aIndex < aboutPages.length - 1 ? aIndex + 1 : 0);
            updateDots();
            hideBack();
          });
        } else if (!aboutMode && qIndex < questions.length - 1) {
          busy = true;
          finishDrag(-1, function () {
            qIndex++;
            questionText.textContent = questions[qIndex];
            updateBackQ();
            hideBack();
          });
        } else {
          snapBack();
        }
      } else {
        if (aboutMode && aIndex > 0) {
          busy = true;
          backInner.innerHTML = '';
          renderAbout(backInner, aIndex - 1);
          finishDrag(1, function () {
            aIndex--;
            renderAbout(frontInner, aIndex);
            renderAbout(backInner, aIndex < aboutPages.length - 1 ? aIndex + 1 : 0);
            updateDots();
            hideBack();
          });
        } else if (!aboutMode && qIndex > 0) {
          busy = true;
          backInner.textContent = questions[qIndex - 1];
          finishDrag(1, function () {
            qIndex--;
            questionText.textContent = questions[qIndex];
            updateBackQ();
            hideBack();
          });
        } else {
          snapBack();
        }
      }
    } else {
      snapBack();
    }
  }

  function finishDrag(dir, done) {
    var outX = dir === -1 ? '-100%' : '100%';
    frontCard.style.transition = 'transform 0.25s ease';
    frontCard.style.transform = 'translateX(' + outX + ')';
    setTimeout(function () {
      done();
      var inX = dir === -1 ? '40px' : '-40px';
      frontCard.style.transition = 'none';
      frontCard.style.transform = 'translateX(' + inX + ')';
      frontCard.offsetHeight;
      frontCard.style.transition = 'transform 0.3s ease';
      frontCard.style.transform = 'translateX(0px)';
      setTimeout(function () {
        resetStyle(frontCard);
        busy = false;
      }, 350);
    }, 260);
  }

  function snapBack() {
    frontCard.style.transition = 'transform 0.3s ease';
    frontCard.style.transform = 'translateX(0px)';
    setTimeout(function () {
      resetStyle(frontCard);
      hideBack();
    }, 350);
  }

  /* ── toast ── */

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._timeout);
    toastEl._timeout = setTimeout(function () { toastEl.classList.remove('show'); }, 1400);
  }

  /* ── install ── */

  var deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.add('visible');
  });

  installBtn.addEventListener('click', function () {
    if (!deferredPrompt) {
      toast('No Safari: Compartilhar → Adicionar à Tela de Início');
      return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function () {
      deferredPrompt = null;
      installBtn.classList.remove('visible');
    });
  });

  if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches) {
    installBtn.textContent = 'iOS';
    installBtn.classList.add('visible');
  }

  /* ── events ── */

  document.addEventListener('touchstart', function (e) {
    var t = e.changedTouches[0];
    dragStart(t.clientX, t.clientY, e.target);
  }, { passive: true });

  document.addEventListener('touchmove', function (e) {
    var t = e.changedTouches[0];
    dragMove(t.clientX, t.clientY);
  }, { passive: true });

  document.addEventListener('touchend', function () { dragEnd(); }, { passive: true });

  document.addEventListener('mousedown', function (e) {
    dragStart(e.clientX, e.clientY, e.target);
  });

  document.addEventListener('mousemove', function (e) {
    dragMove(e.clientX, e.clientY);
  });

  document.addEventListener('mouseup', function () { dragEnd(); });

  prevBtn.addEventListener('click', function (e) { e.stopPropagation(); goPrev(); });
  nextBtn.addEventListener('click', function (e) { e.stopPropagation(); goNext(); });
  shareBtn.addEventListener('click', function (e) { e.stopPropagation(); shareQuestion(); });
  aboutBtn.addEventListener('click', toggleAbout);
  aboutCloseBtn.addEventListener('click', toggleAbout);

  document.addEventListener('keydown', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') { e.preventDefault(); goPrev(); }
    else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') { e.preventDefault(); goNext(); }
    else if (e.code === 'Space') { e.preventDefault(); goNext(); }
    else if (e.code === 'Escape' && aboutMode) toggleAbout();
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js').catch(function () {});
    });
  }
})();
