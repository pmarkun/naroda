(function () {
  'use strict';

  /* ── State ── */

  var questions = [];
  var aboutPages = [];
  var qIndex = 0;
  var aIndex = 0;
  var busy = false;
  var aboutOpen = false;

  /* ── DOM refs ── */

  var frontQ = document.getElementById('frontQuestion');
  var backQ = document.getElementById('backQuestion');
  var frontEl = document.getElementById('cardFront');
  var backEl = document.getElementById('cardBack');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var shareBtn = document.getElementById('shareBtn');
  var aboutBtn = document.getElementById('aboutBtn');
  var installBtn = document.getElementById('installBtn');
  var toastEl = document.getElementById('toast');
  var overlay = document.getElementById('aboutOverlay');
  var aboutClose = document.getElementById('aboutClose');
  var aboutPrev = document.getElementById('aboutPrev');
  var aboutNext = document.getElementById('aboutNext');
  var aboutCounter = document.getElementById('aboutCounter');
  var aboutDots = document.getElementById('aboutDots');
  var aboutFront = document.getElementById('aboutFront');
  var aboutBack = document.getElementById('aboutBack');
  var aboutFrontInner = document.getElementById('aboutFrontInner');
  var aboutBackInner = document.getElementById('aboutBackInner');

  var deferredPrompt = null;

  /* ── Load ── */

  Promise.all([
    fetch('questions.json').then(function (r) { return r.json(); }),
    fetch('about.json').then(function (r) { return r.json(); }),
  ]).then(function (data) {
    data[0].forEach(function (cat) {
      cat.perguntas.forEach(function (q) { questions.push(q); });
    });
    aboutPages = data[1].pages;
    shuffleAll();
    showQ(0);
    renderAboutDots();
    if (!localStorage.getItem('naroda_about_seen')) {
      openAbout();
      localStorage.setItem('naroda_about_seen', '1');
    }
  }).catch(function () {
    frontQ.textContent = 'Erro ao carregar.';
  });

  /* ── Shuffle (initial only) ── */

  function shuffleAll() {
    for (var i = questions.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = questions[i];
      questions[i] = questions[j];
      questions[j] = tmp;
    }
  }

  /* ── Card stack ── */

  function showQ(index) {
    if (index < 0 || index >= questions.length) return;
    qIndex = index;
    frontQ.textContent = questions[qIndex];
    backQ.textContent = qIndex < questions.length - 1 ? questions[qIndex + 1] : questions[qIndex - 1];
    resetStyle(frontEl);
    resetStyle(backEl);
  }

  function resetStyle(el) {
    el.style.transition = '';
    el.style.transform = '';
    el.style.opacity = '';
  }

  function goNext() {
    if (busy || qIndex >= questions.length - 1) {
      if (qIndex >= questions.length - 1) toast('Última pergunta');
      return;
    }
    busy = true;
    slideMain(qIndex + 1, -1);
  }

  function goPrev() {
    if (busy) return;
    if (qIndex <= 0) { toast('Primeira pergunta'); return; }
    busy = true;
    backQ.textContent = questions[qIndex - 1];
    resetStyle(backEl);
    slideMain(qIndex - 1, 1);
  }

  function slideMain(target, dir) {
    var outX = dir * -100;
    var inX = dir * 100;

    frontEl.style.transition = 'transform 0.3s ease';
    frontEl.style.transform = 'translateX(' + outX + '%)';

    setTimeout(function () {
      qIndex = target;
      frontQ.textContent = questions[qIndex];
      backQ.textContent = qIndex < questions.length - 1 ? questions[qIndex + 1] : questions[qIndex - 1];

      frontEl.style.transition = 'none';
      frontEl.style.transform = 'translateX(' + inX + '%)';
      frontEl.offsetHeight;

      frontEl.style.transition = 'transform 0.35s ease';
      frontEl.style.transform = 'translateX(0%)';

      setTimeout(function () {
        resetStyle(frontEl);
        busy = false;
      }, 380);
    }, 320);
  }

  /* ── Drag (main) ── */

  var THRESHOLD = 80;
  var drag = { active: false, startX: 0, startY: 0, dx: 0, moved: false, onBtn: false };
  var aboutDrag = { active: false, startX: 0, startY: 0, dx: 0, moved: false };

  function isOnButton(el) {
    while (el) { if (el.tagName === 'BUTTON') return true; el = el.parentElement; }
    return false;
  }

  function dragQStart(x, y, target) {
    if (busy || aboutOpen) return;
    if (isOnButton(target)) return;
    drag.active = true;
    drag.startX = x;
    drag.startY = y;
    drag.dx = 0;
    drag.moved = false;
    frontEl.style.transition = 'none';
    if (qIndex < questions.length - 1) {
      backQ.textContent = questions[qIndex + 1];
    }
    resetStyle(backEl);
  }

  function dragQMove(x, y) {
    if (!drag.active) return;
    var dx = x - drag.startX;
    var dy = y - drag.startY;
    if (!drag.moved && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    drag.moved = true;
    drag.dx = dx;
    if (Math.abs(dx) > Math.abs(dy) * 0.3) {
      frontEl.style.transform = 'translateX(' + dx + 'px)';
    }
  }

  function dragQEnd() {
    if (!drag.active) return;
    drag.active = false;
    if (!drag.moved) { goNext(); return; }
    var dx = drag.dx;
    if (Math.abs(dx) >= THRESHOLD) {
      if (dx < 0 && qIndex < questions.length - 1) {
        busy = true;
        finishDragQ(-1, function () {
          qIndex++;
          frontQ.textContent = questions[qIndex];
          resetDragQ(-1);
        });
      } else if (dx > 0 && qIndex > 0) {
        busy = true;
        backQ.textContent = questions[qIndex - 1];
        resetStyle(backEl);
        finishDragQ(1, function () {
          qIndex--;
          frontQ.textContent = questions[qIndex];
          resetDragQ(1);
        });
      } else {
        snapQ();
      }
    } else {
      snapQ();
    }
  }

  function finishDragQ(dir, cb) {
    var outX = dir === -1 ? '-100%' : '100%';
    frontEl.style.transition = 'transform 0.25s ease';
    frontEl.style.transform = 'translateX(' + outX + ')';
    setTimeout(cb, 260);
  }

  function resetDragQ(dir) {
    var inX = dir === -1 ? '40px' : '-40px';
    frontEl.style.transition = 'none';
    frontEl.style.transform = 'translateX(' + inX + ')';
    frontEl.offsetHeight;
    frontEl.style.transition = 'transform 0.3s ease';
    frontEl.style.transform = 'translateX(0px)';
    backQ.textContent = qIndex < questions.length - 1 ? questions[qIndex + 1] : questions[qIndex - 1];
    setTimeout(function () {
      resetStyle(frontEl);
      busy = false;
    }, 350);
  }

  function snapQ() {
    frontEl.style.transition = 'transform 0.3s ease';
    frontEl.style.transform = 'translateX(0px)';
    setTimeout(function () { resetStyle(frontEl); }, 350);
  }

  /* ── Share ── */

  var logoImg = null;

  function loadLogo() {
    var img = new Image();
    img.onload = function () { logoImg = img; };
    img.src = 'logo_original.png';
  }
  loadLogo();

  function shareQuestion() {
    var text = frontQ.textContent;
    if (!text || text === 'Erro ao carregar.') return;

    var canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1080, 1920);

    // Subtle grain
    ctx.fillStyle = '#0a0a0a';
    for (var i = 0; i < 300; i++) {
      ctx.fillRect(Math.random() * 1080, Math.random() * 1920, 1, 1);
    }

    // Top accent line
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, 0, 1080, 1);

    // Logo
    if (logoImg) {
      var logoSize = 200;
      var logoX = (1080 - logoSize) / 2;
      var logoY = 320;
      ctx.save();
      ctx.beginPath();
      ctx.arc(540, logoY + logoSize / 2, logoSize / 2 + 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fill();
      ctx.restore();
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    }

    // Question
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    var fontSize = 56;
    ctx.font = '400 ' + fontSize + 'px Georgia, "Playfair Display", serif';

    var words = text.split(' ');
    var lines = [];
    var line = '';
    var maxWidth = 760;

    for (var w = 0; w < words.length; w++) {
      var testLine = line + words[w] + ' ';
      var metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line.length > 0) {
        lines.push(line.trim());
        line = words[w] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    var lineHeight = fontSize * 1.5;
    var totalH = lines.length * lineHeight;
    var startY = 700;
    var firstY = startY - totalH / 2 + lineHeight / 2;

    // Subtle shadow
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (var l = 0; l < lines.length; l++) {
      ctx.fillText(lines[l], 542, firstY + l * lineHeight + 2);
    }

    ctx.fillStyle = '#ffffff';
    for (var l = 0; l < lines.length; l++) {
      ctx.fillText(lines[l], 540, firstY + l * lineHeight);
    }

    // Footer
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

  /* ── About overlay ── */

  function openAbout() {
    if (aboutPages.length === 0) return;
    aboutOpen = true;
    aIndex = 0;
    renderAboutCard(aboutFrontInner, aIndex);
    renderAboutCard(aboutBackInner, aIndex < aboutPages.length - 1 ? aIndex + 1 : 0);
    aboutFront.style.transform = '';
    aboutBack.style.transform = '';
    updateAboutUI();
    overlay.classList.add('open');
  }

  function closeAbout() {
    aboutOpen = false;
    overlay.classList.remove('open');
  }

  function aboutNextPage() {
    if (aIndex >= aboutPages.length - 1) { closeAbout(); return; }
    aIndex++;
    renderAboutCard(aboutBackInner, aIndex);
    resetStyle(aboutBack);
    slideAbout(aIndex, -1);
  }

  function aboutPrevPage() {
    if (aIndex <= 0) return;
    aIndex--;
    renderAboutCard(aboutBackInner, aIndex);
    resetStyle(aboutBack);
    slideAbout(aIndex, 1);
  }

  function slideAbout(target, dir) {
    var outX = dir * -100;
    var inX = dir * 100;

    aboutFront.style.transition = 'transform 0.3s ease';
    aboutFront.style.transform = 'translateX(' + outX + '%)';

    setTimeout(function () {
      renderAboutCard(aboutFrontInner, target);
      renderAboutCard(aboutBackInner, target < aboutPages.length - 1 ? target + 1 : 0);
      aboutFront.style.transition = 'none';
      aboutFront.style.transform = 'translateX(' + inX + '%)';
      aboutFront.offsetHeight;
      aboutFront.style.transition = 'transform 0.35s ease';
      aboutFront.style.transform = 'translateX(0%)';
      updateAboutUI();
      setTimeout(function () { resetStyle(aboutFront); }, 380);
    }, 320);
  }

  function renderAboutCard(el, idx) {
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

  function renderAboutDots() {
    var html = '';
    for (var i = 0; i < aboutPages.length; i++) {
      html += '<span class="about-dot' + (i === 0 ? ' active' : '') + '"></span>';
    }
    aboutDots.innerHTML = html;
  }

  function updateAboutUI() {
    aboutCounter.textContent = (aIndex + 1) + ' / ' + aboutPages.length;
    var dots = aboutDots.querySelectorAll('.about-dot');
    dots.forEach(function (d, i) {
      d.classList.toggle('active', i === aIndex);
    });
  }

  function esc(str) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  /* ── About drag ── */

  function dragAStart(x, y) {
    aboutDrag.active = true;
    aboutDrag.startX = x;
    aboutDrag.startY = y;
    aboutDrag.dx = 0;
    aboutDrag.moved = false;
    aboutFront.style.transition = 'none';
    var nextIdx = aIndex < aboutPages.length - 1 ? aIndex + 1 : -1;
    if (nextIdx >= 0) {
      renderAboutCard(aboutBackInner, nextIdx);
    }
    resetStyle(aboutBack);
  }

  function dragAMove(x, y) {
    if (!aboutDrag.active) return;
    var dx = x - aboutDrag.startX;
    var dy = y - aboutDrag.startY;
    if (!aboutDrag.moved && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    aboutDrag.moved = true;
    aboutDrag.dx = dx;
    if (Math.abs(dx) > Math.abs(dy) * 0.3) {
      aboutFront.style.transform = 'translateX(' + dx + 'px)';
    }
  }

  function dragAEnd() {
    if (!aboutDrag.active) return;
    aboutDrag.active = false;
    if (!aboutDrag.moved) {
      if (aIndex < aboutPages.length - 1) aboutNextPage();
      return;
    }
    var dx = aboutDrag.dx;
    if (Math.abs(dx) >= THRESHOLD) {
      if (dx < 0 && aIndex < aboutPages.length - 1) {
        aIndex++;
        renderAboutCard(aboutFrontInner, aIndex);
        renderAboutCard(aboutBackInner, aIndex < aboutPages.length - 1 ? aIndex + 1 : 0);
        finishAboutDrag(-1);
      } else if (dx > 0 && aIndex > 0) {
        aIndex--;
        renderAboutCard(aboutFrontInner, aIndex);
        renderAboutCard(aboutBackInner, aIndex < aboutPages.length - 1 ? aIndex + 1 : 0);
        finishAboutDrag(1);
      } else {
        snapAbout();
      }
    } else {
      snapAbout();
    }
  }

  function finishAboutDrag(dir) {
    var outX = dir === -1 ? '-100%' : '100%';
    aboutFront.style.transition = 'transform 0.25s ease';
    aboutFront.style.transform = 'translateX(' + outX + ')';
    setTimeout(function () {
      aboutFront.style.transition = 'none';
      aboutFront.style.transform = 'translateX(0%)';
      updateAboutUI();
      setTimeout(function () { resetStyle(aboutFront); }, 50);
    }, 260);
  }

  function snapAbout() {
    aboutFront.style.transition = 'transform 0.3s ease';
    aboutFront.style.transform = 'translateX(0px)';
    setTimeout(function () { resetStyle(aboutFront); }, 350);
  }

  /* ── Toast ── */

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._timeout);
    toastEl._timeout = setTimeout(function () { toastEl.classList.remove('show'); }, 1400);
  }

  /* ── Install PWA ── */

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.add('visible');
  });

  installBtn.addEventListener('click', function () {
    if (!deferredPrompt) {
      toast('No Safari, use Compartilhar → Adicionar à Tela de Início');
      return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function () {
      deferredPrompt = null;
      installBtn.classList.remove('visible');
    });
  });

  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS && !window.matchMedia('(display-mode: standalone)').matches) {
    installBtn.textContent = 'iOS';
    installBtn.classList.add('visible');
  }

  /* ── Events ── */

  // Touch
  document.addEventListener('touchstart', function (e) {
    var t = e.changedTouches[0];
    if (aboutOpen) dragAStart(t.clientX, t.clientY);
    else dragQStart(t.clientX, t.clientY, e.target);
  }, { passive: true });

  document.addEventListener('touchmove', function (e) {
    var t = e.changedTouches[0];
    if (aboutOpen) dragAMove(t.clientX, t.clientY);
    else dragQMove(t.clientX, t.clientY);
  }, { passive: true });

  document.addEventListener('touchend', function () {
    if (aboutOpen) dragAEnd();
    else dragQEnd();
  }, { passive: true });

  // Mouse
  document.addEventListener('mousedown', function (e) {
    if (aboutOpen) dragAStart(e.clientX, e.clientY);
    else dragQStart(e.clientX, e.clientY, e.target);
  });

  document.addEventListener('mousemove', function (e) {
    if (aboutOpen) dragAMove(e.clientX, e.clientY);
    else dragQMove(e.clientX, e.clientY);
  });

  document.addEventListener('mouseup', function () {
    if (aboutOpen) dragAEnd();
    else dragQEnd();
  });

  // Buttons
  prevBtn.addEventListener('click', function (e) { e.stopPropagation(); goPrev(); });
  nextBtn.addEventListener('click', function (e) { e.stopPropagation(); goNext(); });
  shareBtn.addEventListener('click', function (e) { e.stopPropagation(); shareQuestion(); });
  aboutBtn.addEventListener('click', function () { openAbout(); });
  aboutClose.addEventListener('click', closeAbout);
  aboutPrev.addEventListener('click', aboutPrevPage);
  aboutNext.addEventListener('click', aboutNextPage);

  // Keyboard
  document.addEventListener('keydown', function (e) {
    if (aboutOpen) {
      if (e.code === 'ArrowLeft') aboutPrevPage();
      else if (e.code === 'ArrowRight') aboutNextPage();
      else if (e.code === 'Escape') closeAbout();
      return;
    }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') goPrev();
    else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') goNext();
    else if (e.code === 'Space') { e.preventDefault(); goNext(); }
  });

  // Close about on last page next click (already handled in aboutNextPage)

  // PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js').catch(function () {});
    });
  }
})();
