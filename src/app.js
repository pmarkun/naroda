(function () {
  'use strict';

  /* ── state ── */

  var questions = [];
  var aboutPages = [];
  var qIndex = 0;
  var aIndex = 0;
  var aboutMode = false;
  var busy = false;
  var lang = 'pt';
  var ui = {};

  var LANG_NAMES = {
    pt: 'Portugu\u00eas',
    en: 'English',
    es: 'Espa\u00f1ol'
  };

  /* ── dom ── */

  var $ = function (id) { return document.getElementById(id); };

  var content = $('stackContent');
  var stack = $('stack');
  var frame = $('frame');
  var prevBtn = $('prevBtn');
  var nextBtn = $('nextBtn');
  var shareBtn = $('shareBtn');
  var aboutBtn = $('aboutBtn');
  var aboutCloseBtn = $('aboutCloseBtn');
  var aboutDots = $('aboutDots');
  var installBtn = $('installBtn');
  var toastEl = $('toast');

  /* ── language ── */

  function getLang() {
    var stored = localStorage.getItem('naroda_lang');
    if (stored && LANG_NAMES[stored]) return stored;
    var nav = (navigator.language || '').split('-')[0];
    if (LANG_NAMES[nav]) return nav;
    return 'pt';
  }

  lang = getLang();

  /* ── load ── */

  Promise.all([
    fetch('data/' + lang + '/questions.json').then(function (r) { return r.json(); }),
    fetch('data/' + lang + '/about.json').then(function (r) { return r.json(); }),
    fetch('data/' + lang + '/ui.json').then(function (r) { return r.json(); }),
  ]).then(function (data) {
    data[0].forEach(function (cat) {
      cat.perguntas.forEach(function (q) { questions.push(q); });
    });
    aboutPages = data[1].pages;
    ui = data[2];
    installBtn.textContent = ui.installBtn || 'Instalar';
    shuffleAll();
    renderDots();
    showQ(0);
    if (!localStorage.getItem('naroda_about_seen')) {
      toggleMode();
      localStorage.setItem('naroda_about_seen', '1');
    }
  }).catch(function () {
    content.textContent = ui.loadError || 'Erro ao carregar.';
  });

  function shuffleAll() {
    for (var i = questions.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = questions[i]; questions[i] = questions[j]; questions[j] = tmp;
    }
  }

  /* ── transition ── */

  function fade(done) {
    if (busy) { done(); return; }
    busy = true;
    content.style.transition = 'opacity 0.18s ease';
    content.style.opacity = '0';
    setTimeout(function () {
      done();
      content.offsetHeight;
      content.style.transition = 'opacity 0.3s ease';
      content.style.opacity = '1';
      setTimeout(function () {
        content.style.transition = '';
        content.style.opacity = '';
        busy = false;
      }, 330);
    }, 200);
  }

  /* ── question mode ── */

  function showQ(index) {
    if (index < 0 || index >= questions.length) return;
    qIndex = index;
    content.textContent = questions[qIndex];
    updateArrows();
  }

  /* ── about mode ── */

  function showA(index) {
    if (index < 0 || index >= aboutPages.length) return;
    aIndex = index;
    content.innerHTML = renderAbout(aIndex);
    updateDots();
    updateArrows();
    var sel = document.getElementById('langSelect');
    if (sel) sel.addEventListener('change', onLangChange);
  }

  function renderAbout(idx) {
    var page = aboutPages[idx];
    if (!page) return '';
    var h = '<div class="about-title">' + esc(page.title) + '</div>';
    if (page.type === 'text') {
      var cls = page.hero ? ' about-text--hero' : '';
      h += '<div class="about-text' + cls + '">' + esc(page.body) + '</div>';
    } else if (page.type === 'list') {
      h += '<ul class="about-list">';
      page.items.forEach(function (item) { h += '<li>' + esc(item) + '</li>'; });
      h += '</ul>';
    } else if (page.type === 'lang') {
      h += renderLangSelect();
    }
    if (page.link) {
      h += '<a class="about-link" href="mailto:' + esc(page.link) + '">' + esc(page.link) + '</a>';
    }
    return h;
  }

  function renderLangSelect() {
    var h = '<div class="about-text lang-select-wrap">';
    h += '<select class="lang-select" id="langSelect">';
    for (var code in LANG_NAMES) {
      h += '<option value="' + code + '"' + (code === lang ? ' selected' : '') + '>' + LANG_NAMES[code] + '</option>';
    }
    h += '</select></div>';
    return h;
  }

  function onLangChange() {
    var sel = document.getElementById('langSelect');
    if (!sel) return;
    var newLang = sel.value;
    if (newLang === lang) return;
    localStorage.setItem('naroda_lang', newLang);
    location.reload();
  }

  function esc(str) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  function updateDots() {
    var dots = aboutDots.querySelectorAll('.frame-dot');
    dots.forEach(function (d, i) { d.classList.toggle('active', i === aIndex); });
  }

  function updateArrows() {
    if (aboutMode) {
      prevBtn.classList.toggle('hidden', aIndex <= 0);
      nextBtn.classList.toggle('hidden', aIndex >= aboutPages.length - 1);
    } else {
      prevBtn.classList.toggle('hidden', qIndex <= 0);
      nextBtn.classList.toggle('hidden', qIndex >= questions.length - 1);
    }
  }

  function renderDots() {
    var h = '';
    for (var i = 0; i < aboutPages.length; i++) {
      h += '<span class="frame-dot' + (i === 0 ? ' active' : '') + '"></span>';
    }
    aboutDots.innerHTML = h;
  }

  /* ── mode toggle ── */

  function toggleMode() {
    if (busy) return;
    aboutMode = !aboutMode;

    aboutBtn.hidden = aboutMode;
    aboutCloseBtn.hidden = !aboutMode;
    shareBtn.hidden = aboutMode;
    aboutDots.classList.toggle('visible', aboutMode);

    if (aboutMode) {
      aIndex = 0;
      fade(function () { showA(0); });
    } else {
      fade(function () { showQ(qIndex); });
    }
  }

  /* ── navigation ── */

  function goNext() {
    if (busy) return;
    if (aboutMode) {
      if (aIndex < aboutPages.length - 1) {
        aIndex++;
        fade(function () { showA(aIndex); });
      } else {
        toggleMode();
      }
      return;
    }
    if (qIndex >= questions.length - 1) { toast(ui.lastCard || 'Última pergunta'); return; }
    qIndex++;
    fade(function () { showQ(qIndex); });
  }

  function goPrev() {
    if (busy) return;
    if (aboutMode) {
      if (aIndex <= 0) return;
      aIndex--;
      fade(function () { showA(aIndex); });
      return;
    }
    if (qIndex <= 0) { toast(ui.firstCard || 'Primeira pergunta'); return; }
    qIndex--;
    fade(function () { showQ(qIndex); });
  }

  /* ── share ── */

  var logoImg = null;

  function loadLogo() {
    var img = new Image();
    img.onload = function () { logoImg = img; };
    img.src = 'icons/logo_original.png';
  }
  loadLogo();

  function shareQuestion() {
    var text = content.textContent;
    if (!text) return;

    var c = document.createElement('canvas');
    c.width = 1080;
    c.height = 1920;
    var ctx = c.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.fillStyle = '#0a0a0a';
    for (var i = 0; i < 300; i++) {
      ctx.fillRect(Math.random() * 1080, Math.random() * 1920, 1, 1);
    }

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
    var startY = 960;
    var firstY = startY - totalH / 2 + lh / 2;

    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (var l = 0; l < lines.length; l++) {
      ctx.fillText(lines[l], 542, firstY + l * lh + 2);
    }
    ctx.fillStyle = '#ffffff';
    for (var l = 0; l < lines.length; l++) {
      ctx.fillText(lines[l], 540, firstY + l * lh);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '24px Georgia, serif';
    ctx.fillText('naroda.app', 540, 1760);

    c.toBlob(function (blob) {
      var file = new File([blob], 'na-roda.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Na Roda' });
      } else {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = 'na-roda-pergunta.png';
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast(ui.imageSaved || 'Imagem salva');
      }
    });
  }

  /* ── swipe ── */

  function isOnBtn(el) {
    while (el) { if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'SELECT' || el.tagName === 'OPTION') return true; el = el.parentElement; }
    return false;
  }

  var swipe = { x: 0, y: 0, active: false };

  function handleStart(ex, ey, el) {
    if (isOnBtn(el)) return;
    swipe.x = ex;
    swipe.y = ey;
    swipe.active = true;
  }

  function handleEnd(ex, ey) {
    if (!swipe.active) return;
    swipe.active = false;
    var dx = ex - swipe.x;
    var dy = ey - swipe.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) {
      if (ex < window.innerWidth / 2) { goPrev(); } else { goNext(); }
    } else if (dx > 0) {
      goPrev();
    } else {
      goNext();
    }
  }

  document.addEventListener('touchstart', function (e) {
    var t = e.changedTouches[0];
    handleStart(t.clientX, t.clientY, e.target);
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    var t = e.changedTouches[0];
    handleEnd(t.clientX, t.clientY);
  }, { passive: true });

  document.addEventListener('mousedown', function (e) {
    handleStart(e.clientX, e.clientY, e.target);
  });

  document.addEventListener('mouseup', function (e) {
    handleEnd(e.clientX, e.clientY);
  });

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
      toast(ui.iosInstall || 'No Safari: Compartilhar \u2192 Adicionar \u00e0 Tela de In\u00edcio');
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

  prevBtn.addEventListener('click', function (e) { e.stopPropagation(); goPrev(); });
  nextBtn.addEventListener('click', function (e) { e.stopPropagation(); goNext(); });
  shareBtn.addEventListener('click', function (e) { e.stopPropagation(); shareQuestion(); });
  aboutBtn.addEventListener('click', toggleMode);
  aboutCloseBtn.addEventListener('click', toggleMode);

  document.addEventListener('keydown', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') { e.preventDefault(); goPrev(); }
    else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') { e.preventDefault(); goNext(); }
    else if (e.code === 'Space') { e.preventDefault(); goNext(); }
    else if (e.code === 'Escape' && aboutMode) toggleMode();
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
