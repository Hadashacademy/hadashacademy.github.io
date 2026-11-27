/* French Lab · Hadash Academy — "Lecture amusante avec Maman", Volume 1 (DELF Prim A1.1)
   Explicaciones en inglés, práctica en francés. Voz francesa del navegador (fr-FR).
   Los códigos QR del libro abren: /french-lab/unit-N/#story #vocab #sound #listen  ·  /french-lab/#pronunciation #words #delf */
(function () {
  'use strict';
  var D = window.FL, N = window.FL_UNIT || 0, app = document.getElementById('app');
  var VIDEOS = window.FL_VIDEOS || {};
  var SUNNY_URL = 'https://hadash-sunny.dream-inenglish25.workers.dev/';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function frT(t) { return esc(t).replace(/\s+([!?;:])/g, ' $1'); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---------------- voz francesa ---------------- */
  var S = window.speechSynthesis, slow = !!store('fl-slow'), voiceFR = null, voiceEN = null;
  function score(v) {
    var n = v.name + ' ' + (v.voiceURI || ''), s = 1;
    if (/natural|neural/i.test(n)) s = 6; else if (/online/i.test(n)) s = 5; else if (/google|premium|enhanced|amélie|amelie|thomas|audrey|aurélie/i.test(n)) s = 4;
    if (/fr-fr/i.test(v.lang)) s += 0.5;
    if (/(denise|vivienne|eloise|amélie|amelie|audrey|google)/i.test(n)) s += 0.3;
    return s;
  }
  function loadVoices() {
    var vs = (S && S.getVoices()) || [];
    var fr = vs.filter(function (v) { return /^fr/i.test(v.lang); }).sort(function (a, b) { return score(b) - score(a); });
    var en = vs.filter(function (v) { return /^en/i.test(v.lang); }).sort(function (a, b) { return score(b) - score(a); });
    voiceFR = fr[0] || null; voiceEN = en[0] || null;
  }
  if (S) { loadVoices(); S.onvoiceschanged = loadVoices; }
  function clean(t) { return String(t).replace(/[—«»“”"*_]/g, ' ').replace(/_{2,}/g, ' ').replace(/\s+/g, ' ').trim(); }
  function speak(text, opts) {
    opts = opts || {};
    if (!S) return Promise.resolve();
    if (!opts.queue) S.cancel();
    return new Promise(function (res) {
      var u = new SpeechSynthesisUtterance(clean(text));
      var en = opts.lang === 'en';
      u.lang = en ? 'en-US' : 'fr-FR'; var v = en ? voiceEN : voiceFR; if (v) u.voice = v;
      u.rate = en ? 1 : (slow ? 0.62 : 0.86);
      u.onend = u.onerror = function () { res(); };
      S.speak(u);
    });
  }
  function stop() { try { S && S.cancel(); } catch (e) {} }

  /* ---------------- ayudas visuales ---------------- */
  function pic(p, cls) {
    if (!p) return '';
    if (p.img) return '<span class="pic ' + (cls || '') + '"><img src="' + ROOT + 'img/' + p.img + '.webp" alt="" class="' + (p.kid ? 'kid' : p.wide ? 'wide' : '') + '"></span>';
    return '<span class="pic ' + (cls || '') + '"><span class="e">' + p.emo + '</span></span>';
  }
  function scene(list) {
    return '<div class="scene">' + list.map(function (p) {
      if (p.img) return '<img src="' + ROOT + 'img/' + p.img + '.webp" alt="" class="' + (p.kid ? 'kid' : p.wide ? 'wide' : '') + '">';
      return '<span class="e">' + p.emo + '</span>';
    }).join('') + '</div>';
  }
  var ARTS = [['les ', 'p'], ['le ', 'm'], ['la ', 'f'], ['l’', 'n'], ["l'", 'n']];
  function art(w) {
    for (var i = 0; i < ARTS.length; i++) if (w.indexOf(ARTS[i][0]) === 0) return '<span class="ar ' + ARTS[i][1] + '">' + ARTS[i][0].trim() + '</span>' + frT(w.slice(ARTS[i][0].length));
    return frT(w);
  }
  function spkBtn(text, label) { return '<button class="spk" type="button" data-say="' + esc(text) + '" aria-label="' + esc(label || ('Écouter : ' + text)) + '">🔊</button>'; }
  function hl(w, letters) {
    var out = esc(w);
    letters.slice().sort(function (a, b) { return b.length - a.length; }).forEach(function (l) { out = out.split(l).join('<u>' + l + '</u>'); });
    return out;
  }
  function shuffle(a, seed) { a = a.slice(); var s = seed || Math.random() * 1e6; for (var i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; var j = Math.floor(s / 233280 * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var ROOT = N ? '../' : '';

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-say]'); if (!b) return;
    speak(b.getAttribute('data-say'), { lang: b.getAttribute('data-lang') || 'fr' });
  });

  function topbar(inner) {
    return '<header class="top"><div class="wrap"><div class="bar"><span class="lg" aria-hidden="true">🇫🇷</span>HADASH ACADEMY · FRENCH LAB' +
      (N ? '<a href="../">← All units</a>' : '<a href="../">hadashacademy.github.io</a>') + '</div>' + inner +
      '<div class="tools"><button class="chip" id="slow" aria-pressed="' + slow + '">🐢 Slow voice</button>' +
      (N ? '<button class="chip" id="engl" aria-pressed="false">🇬🇧 Show English</button>' : '') + '</div></div></header>';
  }
  function bindTop() {
    var s = $('#slow'); if (s) s.onclick = function () { slow = !slow; store('fl-slow', slow); s.setAttribute('aria-pressed', slow); speak('Bonjour !'); };
    var e = $('#engl'); if (e) e.onclick = function () { var on = !document.body.classList.contains('show-en'); document.body.classList.toggle('show-en', on); e.setAttribute('aria-pressed', on); };
  }

  /* ================================================================ PÁGINA DE UNIDAD */
  function unitPage() {
    var u = D.units[N - 1];
    document.documentElement.style.setProperty('--c', u.color); document.documentElement.style.setProperty('--s', u.soft);
    document.title = 'Unité ' + N + ' · ' + u.fr + ' — French Lab';
    var h = topbar('<div class="hero"><div class="unum"><small>Unité</small><b>' + N + '</b></div><div><h1>' + frT(u.fr) + '</h1><p>' + esc(u.en) + ' · ' + frT(u.story_title) + '</p></div></div>');
    h += '<main class="wrap"><nav class="tabs" role="tablist" aria-label="Skills">' + TABS.map(function (t) {
      return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="false"><span class="ti">' + t[1] + '</span><b>' + t[2] + '</b><small>' + t[3] + '</small></button>'; }).join('') + '</nav>';
    h += '<div class="tabpane" data-pane="ecouter">' + storySec(u) + vocabSec(u) + gameSec(u) + listenSec(u) + videoSec(u) + '</div>' +
      '<div class="tabpane" data-pane="lire">' + soundSec(u) + readSec(u) + '</div>' +
      '<div class="tabpane" data-pane="ecrire">' + traceSec(u) + orderSec(u) + '</div>' +
      '<div class="tabpane" data-pane="parler">' + jelisSec(u) + talkSec(u) + sunnySec(u) + '</div>' + reviewSec(u);
    var prev = N > 1 ? '<a class="btn ghost" href="../unit-' + (N - 1) + '/">← Unité ' + (N - 1) + '</a>' : '';
    var next = N < 6 ? '<a class="btn" href="../unit-' + (N + 1) + '/">Unité ' + (N + 1) + ' →</a>' : '<a class="btn" href="../#delf">Mon petit DELF →</a>';
    h += '<div style="display:flex;justify-content:space-between;margin-top:22px">' + prev + next + '</div><footer>Lecture amusante avec Maman · Volume 1 · Hadash Academy</footer></main>';
    app.innerHTML = h; bindTop(); bindStory(u); bindGame(u); bindSound(u); bindListen(u); bindRead(u); bindTrace(u); bindOrder(u); bindTalk(u); bindSunny(u); bindReview(u);
    $$('.tabs [data-tab]').forEach(function (b) { b.onclick = function () { var t = b.getAttribute('data-tab'); if (history.replaceState) history.replaceState(null, '', '#' + t); showTab(t); window.scrollTo({ top: $('.tabs').offsetTop - 4, behavior: 'smooth' }); }; });
    window.addEventListener('hashchange', goHash);
  }

  /* pestañas por habilidad (DELF Prim): Écouter · Lire · Écrire · Parler */
  var TABS = [['ecouter', '👂', 'Écouter', 'Listen'], ['lire', '📖', 'Lire', 'Read'], ['ecrire', '✍️', 'Écrire', 'Write'], ['parler', '🗣️', 'Parler', 'Speak']];
  function showTab(t) {
    stop(); if (typeof closeReader === 'function') closeReader();
    $$('.tabs [data-tab]').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-tab') === t); });
    $$('.tabpane').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== t; });
    store('fl-tab-' + N, t);
    var tr = $('.tabpane[data-pane="ecrire"]'); if (t === 'ecrire' && tr && tr._onshow) tr._onshow();
  }
  function goHash() {
    var id = location.hash.slice(1);
    if (!N) { var el = id && document.getElementById(id); if (el) el.scrollIntoView(); return; }
    var tab = TABS.some(function (t) { return t[0] === id; }) ? id : null, el = null;
    if (!tab && id) { el = document.getElementById(id); var pane = el && el.closest('.tabpane'); if (pane) tab = pane.getAttribute('data-pane'); }
    showTab(tab || store('fl-tab-' + N) || 'ecouter');
    if (el) setTimeout(function () { el.scrollIntoView(); }, 30);
  }

  /* ✍️ Écrire 1: trazar la palabra con el dedo, se pinta como un lápiz */
  function traceWords(u) {
    var out = [];
    u.vocab.forEach(function (v) {
      var w = v.w.replace(/\s*\(.*\)/, '').split(' / ')[0], bare = w.replace(/^(les |le |la |l’|l')/, '');
      if (bare.length <= 10) out.push({ w: bare, say: w, pic: v.pic, en: v.en });
    });
    return out;
  }
  function traceSec(u) {
    return '<section class="card" id="trace"><h2>✏️ Je trace <small>Trace the word</small></h2>' +
      '<p class="hint">Trace the gray letters with your finger (or the mouse). Color all the letters to win a star!</p>' +
      '<div class="trace"><div class="ttop"><button class="btn ghost" type="button" id="tprev" aria-label="Previous">◀</button>' +
      '<span class="tpic" id="tpic"></span><button class="spk" type="button" id="tsay" aria-label="Listen">🔊</button>' +
      '<span class="score" id="tscore"></span><button class="btn ghost" type="button" id="tnext" aria-label="Next">▶</button></div>' +
      '<div class="tcan"><canvas id="tcv"></canvas><div class="tdone" id="tdone" hidden></div></div>' +
      '<div class="tcolors">' + ['#EE4B3E', '#1E6FE0', '#2EAD4B', '#8E44AD', '#FF8A00', '#14244B'].map(function (c, i) { return '<button type="button" data-col="' + c + '" style="background:' + c + '" aria-label="Color" ' + (i ? '' : 'class="on"') + '></button>'; }).join('') +
      '<button class="btn ghost" type="button" id="tclear">↺ Effacer</button></div></div></section>';
  }
  function bindTrace(u) {
    var words = traceWords(u), key = 'fl-trace-' + N, won = store(key) || {}, k = 0, col = '#EE4B3E';
    var cv = $('#tcv'), ctx = cv.getContext('2d'), mask = document.createElement('canvas'), mctx = mask.getContext('2d');
    var W, H, dpr, fs, lw, drawing = false, last = null, glyph = null, finished = false;
    function score() { var n = 0; for (var x in won) n++; $('#tscore').textContent = '⭐ ' + n + ' / ' + words.length; }
    function font() { return '700 ' + fs + 'px Fredoka, Nunito, Arial, sans-serif'; }
    function setup() {
      var box = cv.parentNode.getBoundingClientRect(); if (!box.width) return;
      dpr = window.devicePixelRatio || 1; W = Math.round(box.width); H = Math.max(150, Math.min(240, Math.round(W * 0.42)));
      cv.width = mask.width = W * dpr; cv.height = mask.height = H * dpr; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var w = words[k].w; fs = H * 0.62;
      mctx.font = font(); var tw = mctx.measureText(w).width; if (tw > W * 0.9) fs = fs * W * 0.9 / tw;
      lw = Math.max(10, fs * 0.16);
      mctx.clearRect(0, 0, W, H); mctx.font = font(); mctx.textAlign = 'center'; mctx.textBaseline = 'middle'; mctx.fillStyle = '#000'; mctx.fillText(w, W / 2, H * 0.54);
      var d = mctx.getImageData(0, 0, mask.width, mask.height).data, step = Math.max(2, Math.round(3 * dpr)); glyph = [];
      for (var y = 0; y < mask.height; y += step) for (var x = 0; x < mask.width; x += step) if (d[(y * mask.width + x) * 4 + 3] > 128) glyph.push((y * mask.width + x) * 4 + 3);
      clear();
    }
    function guide() {
      ctx.save(); ctx.font = font(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#e7e2d4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, H * 0.54 + fs * 0.36); ctx.lineTo(W - 10, H * 0.54 + fs * 0.36); ctx.stroke();
      ctx.fillStyle = '#EEEAE0'; ctx.fillText(words[k].w, W / 2, H * 0.54);
      ctx.setLineDash([5, 6]); ctx.lineWidth = 2; ctx.strokeStyle = '#B9B2A0'; ctx.strokeText(words[k].w, W / 2, H * 0.54); ctx.restore();
    }
    var ink;   /* lienzo aparte solo con lo que pinta la niña, para medir */
    function clear() { finished = false; $('#tdone').hidden = true; ctx.clearRect(0, 0, W, H); guide(); ink = document.createElement('canvas'); ink.width = cv.width; ink.height = cv.height; ink.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); }
    function seg(a, b) {
      [ctx, ink.getContext('2d')].forEach(function (c, i) {
        c.lineCap = c.lineJoin = 'round';
        if (i) { c.strokeStyle = '#000'; c.lineWidth = lw * 1.25; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); return; }
        c.strokeStyle = col; c.globalAlpha = 0.85; c.lineWidth = lw; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
        c.globalAlpha = 0.35; c.lineWidth = Math.max(2, lw * 0.18);           /* textura de lápiz */
        for (var j = 0; j < 3; j++) { var o = (Math.random() - 0.5) * lw * 0.8; c.beginPath(); c.moveTo(a.x + o, a.y - o); c.lineTo(b.x + o, b.y - o); c.stroke(); }
        c.globalAlpha = 1;
      });
    }
    function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    cv.addEventListener('pointerdown', function (e) { if (finished) return; drawing = true; last = pos(e); seg(last, { x: last.x + 0.1, y: last.y }); try { cv.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); });
    cv.addEventListener('pointermove', function (e) { if (!drawing) return; var p = pos(e); seg(last, p); last = p; e.preventDefault(); });
    function up() { if (!drawing) return; drawing = false; check(); }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', up);
    function check() {
      if (!glyph || !glyph.length) return;
      var d = ink.getContext('2d').getImageData(0, 0, ink.width, ink.height).data, hit = 0;
      glyph.forEach(function (i) { if (d[i] > 0) hit++; });
      var inked = 0, step = Math.max(2, Math.round(3 * dpr));
      for (var y = 0; y < ink.height; y += step) for (var x = 0; x < ink.width; x += step) if (d[(y * ink.width + x) * 4 + 3] > 0) inked++;
      var cover = hit / glyph.length;
      if (inked > glyph.length * 3.2 || (cover >= 0.7 && inked > glyph.length * 3)) { $('#tdone').hidden = false; $('#tdone').innerHTML = '🙂 Stay on the letters! <button class="btn" type="button" id="tagain">↺</button>'; $('#tagain').onclick = clear; return; }
      if (cover >= 0.7) {
        finished = true; won[words[k].w] = 1; store(key, won); score();
        $('#tdone').hidden = false;
        $('#tdone').innerHTML = pic(words[k].pic) + '<b>' + art(words[k].say) + '</b><span class="tstars">⭐</span><button class="btn" type="button" id="tgo">Suivant ▶</button>';
        $('#tgo').onclick = function () { go(1); };
        speak('Bravo ! ' + words[k].say);
      }
    }
    function go(d) { k = (k + d + words.length) % words.length; show(); }
    function show() { $('#tpic').innerHTML = pic(words[k].pic) + '<small>' + esc(words[k].en) + '</small>'; setup(); }
    $('#tprev').onclick = function () { go(-1); }; $('#tnext').onclick = function () { go(1); };
    $('#tsay').onclick = function () { speak(words[k].say); };
    $('#tclear').onclick = clear;
    $$('.tcolors [data-col]').forEach(function (b) { b.onclick = function () { col = b.getAttribute('data-col'); $$('.tcolors [data-col]').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    var shown = false;
    $('.tabpane[data-pane="ecrire"]')._onshow = function () { if (!shown) { shown = true; (document.fonts && document.fonts.load ? document.fonts.load(font()) : Promise.resolve()).then(show, show); } else setup(); };
    window.addEventListener('resize', function () { if (shown && !$('.tabpane[data-pane="ecrire"]').hidden) setup(); });
    score();
  }

  /* ✍️ Écrire 2: ordenar la oración tocando las palabras (como Duolingo) */
  function orderSentences(u) {
    var out = [];
    function add(t) { t = String(t).replace(/\s+/g, ' ').trim(); var n = t.split(' ').filter(function (x) { return !/^[!?;:.,]$/.test(x); }).length; if (n >= 2 && n <= 7 && !/_{2,}/.test(t) && out.indexOf(t) < 0) out.push(t); }
    u.sound.sentences.forEach(add);
    u.grammar.items.forEach(function (it, i) { if (u.grammar.answers[i]) add(it.replace(/_{2,}/, u.grammar.answers[i])); });
    u.talk.lines.forEach(function (l) { if (l[0] === 'Moi') add(l[1]); });
    (u.reading.text.match(/[^.!?]+[.!?]/g) || []).forEach(add);
    return out.slice(0, 8);
  }
  function tokens(t) {
    var out = []; t.split(' ').forEach(function (w) { if (/^[!?;:]$/.test(w) && out.length) out[out.length - 1] += '\u202f' + w; else out.push(w); });
    return out;
  }
  function orderSec(u) {
    return '<section class="card" id="order"><h2>🧩 J’écris la phrase <small>Put the words in order</small></h2>' +
      '<p class="hint">Listen to the sentence 🔊. Then tap the words in the right order. Tap a word in the line to take it back.</p>' +
      '<div class="order"><div class="qtop"><button class="btn" type="button" id="oplay">🔊 Écouter</button><span class="score" id="oscore"></span></div>' +
      '<div class="oline" id="oline" aria-live="polite"></div><div class="obank" id="obank"></div>' +
      '<div class="obtns"><button class="btn" type="button" id="ocheck">✔ Vérifier</button><button class="btn ghost" type="button" id="onext">Suivant ▶</button></div><div class="ofeed" id="ofeed"></div></div></section>';
  }
  function bindOrder(u) {
    var list = orderSentences(u), key = 'fl-order-' + N, won = store(key) || {}, k = 0, toks, line;
    function score() { var n = 0; for (var x in won) n++; $('#oscore').textContent = (k + 1) + ' / ' + list.length + ' · ⭐ ' + n; }
    function draw() {
      $('#oline').innerHTML = line.map(function (i, j) { return '<button type="button" class="tile in" data-j="' + j + '">' + frT(toks[i]) + '</button>'; }).join('') || '<span class="ohint">…</span>';
      $('#obank').innerHTML = toks.map(function (t, i) { return '<button type="button" class="tile" data-i="' + i + '" ' + (line.indexOf(i) >= 0 ? 'disabled' : '') + '>' + frT(t) + '</button>'; }).join('');
      $$('#obank .tile').forEach(function (b) { b.onclick = function () { var i = +b.getAttribute('data-i'); line.push(i); speak(toks[i].replace(/\u202f.*/, '')); $('#ofeed').textContent = ''; draw(); }; });
      $$('#oline .tile').forEach(function (b) { b.onclick = function () { line.splice(+b.getAttribute('data-j'), 1); $('#ofeed').textContent = ''; draw(); }; });
    }
    function show() {
      var t = tokens(list[k]); toks = t.slice(); var order;
      do { order = shuffle(t.map(function (_, i) { return i; })); } while (t.length > 1 && order.every(function (v, i) { return v === i; }));
      toks = order.map(function (i) { return t[i]; }); line = []; $('#ofeed').textContent = ''; $('#oline').classList.remove('ok', 'bad'); score(); draw();
    }
    $('#oplay').onclick = function () { speak(list[k]); };
    $('#onext').onclick = function () { k = (k + 1) % list.length; show(); };
    $('#ocheck').onclick = function () {
      var said = line.map(function (i) { return toks[i]; }).join(' '), want = tokens(list[k]).join(' ');
      if (said === want) { won[k] = 1; store(key, won); score(); $('#oline').classList.add('ok'); $('#ofeed').innerHTML = '⭐ <b>Bravo !</b>'; speak(list[k]); }
      else { $('#oline').classList.add('bad'); setTimeout(function () { $('#oline').classList.remove('bad'); }, 700); $('#ofeed').textContent = line.length < toks.length ? 'Use all the words! 🙂' : 'Almost! Listen again 🔊 and try.'; }
    };
    show();
  }

  /* 🗣️ Parler: leer frases en voz alta con el micrófono */
  function jelisSec(u) {
    var list = u.sound.sentences.concat((u.reading.text.match(/[^.!?]+[.!?]/g) || []).map(function (x) { return x.trim(); }));
    return '<section class="card" id="jelis"><h2>🎤 Je lis à voix haute <small>Now you read!</small></h2>' +
      '<p class="hint">Listen 🔊, then tap 🎤 and read the sentence out loud. The words you say well turn green.</p>' +
      '<ul class="sent">' + list.map(function (x) { return '<li>' + spkBtn(x) + '<span>' + frT(x) + '</span>' + micBtn(x, 1) + '</li>'; }).join('') + '</ul></section>';
  }

  function storySec(u) {
    return '<section class="card" id="story"><h2>📖 ' + frT(u.story_title) + ' <small>Story</small></h2>' +
      '<p class="hint">Listen to the story and look at the pictures. Then read it together. Tap 🔊 to hear one picture again.</p>' +
      '<p><button class="btn" id="playall">▶ Écouter l’histoire</button> <button class="btn ghost" id="stopall">⏹ Stop</button></p>' +
      '<div class="story">' + u.story.map(function (p, i) {
        return '<div class="panel" data-i="' + i + '"><span class="n">' + (i + 1) + '</span>' + scene(p.pics) +
          '<div class="t"><p>' + frT(p.fr) + '</p>' + spkBtn(p.fr, 'Écouter l’image ' + (i + 1)) + '</div><div class="en">' + esc(p.en) + '</div></div>';
      }).join('') + '</div></section>';
  }
  function bindStory(u) {
    var run = 0;
    $('#playall').onclick = function () {
      var me = ++run; var panels = $$('.panel');
      (function go(i) {
        panels.forEach(function (p) { p.classList.remove('on'); });
        if (i >= u.story.length || me !== run) return;
        panels[i].classList.add('on'); panels[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        speak(u.story[i].fr, { queue: i > 0 }).then(function () { setTimeout(function () { go(i + 1); }, 450); });
      })(0);
    };
    $('#stopall').onclick = function () { run++; stop(); $$('.panel').forEach(function (p) { p.classList.remove('on'); }); };
  }

  function vocabSec(u) {
    var nums = u.numbers && u.numbers.length ? '<h3 style="margin-top:16px">Les nombres · Numbers</h3><div class="nums">' + u.numbers.map(function (x) { return '<button type="button" data-say="' + esc(x[0]) + '"><b>' + x[1] + '</b>' + esc(x[0]) + '</button>'; }).join('') + '</div>' : '';
    return '<section class="card" id="vocab"><h2>🖼️ Les mots <small>Words</small></h2><p class="hint">Tap a picture: listen and repeat. Then Mama says a word and the child points to it.</p>' +
      '<div class="legend"><span><span class="ar m">le</span> masculine</span><span><span class="ar f">la</span> feminine</span><span><span class="ar n">l’</span> before a vowel</span><span><span class="ar p">les</span> plural</span></div>' +
      '<div class="voc">' + u.vocab.map(function (v) { return '<button class="vc" type="button" data-say="' + esc(v.w.replace(/\s*\(.*\)/, '')) + '">' + pic(v.pic) + '<b>' + art(v.w) + '</b><small>' + esc(v.en) + '</small></button>'; }).join('') + '</div>' + nums + '</section>';
  }

  /* juego A/B/C: escucha la palabra y toca la imagen */
  function gameSec(u) {
    return '<section class="card" id="game"><h2>🎲 Écoute et touche ! <small>Listen and tap</small></h2><p class="hint">Listen to the word, then tap the right picture: A, B or C.</p>' +
      '<div class="quiz"><div class="qtop"><button class="btn" id="qplay">🔊 Écouter</button><span class="score" id="qscore"></span><button class="btn ghost" id="qnew" hidden>↺ Rejouer</button></div><div class="opts" id="qopts"></div></div></section>';
  }
  function bindGame(u) {
    var words = u.vocab, order, k, right, locked;
    function start() { order = shuffle(words.map(function (_, i) { return i; })).slice(0, 8); k = 0; right = 0; $('#qnew').hidden = true; round(); }
    function round() {
      locked = false;
      if (k >= order.length) { $('#qopts').innerHTML = ''; $('#qscore').textContent = (right === order.length ? '🌟 Parfait ! ' : '👏 Bravo ! ') + right + ' / ' + order.length; $('#qnew').hidden = false; speak(right === order.length ? 'Parfait !' : 'Bravo !'); return; }
      var ans = order[k], others = shuffle(words.map(function (_, i) { return i; }).filter(function (i) { return i !== ans; })).slice(0, 2);
      var opts = shuffle([ans].concat(others));
      $('#qscore').textContent = (k + 1) + ' / ' + order.length;
      $('#qopts').innerHTML = opts.map(function (i, j) { return '<button class="opt" type="button" data-i="' + i + '"><span class="L">' + 'ABC'[j] + '</span>' + pic(words[i].pic) + '</button>'; }).join('');
      $$('#qopts .opt').forEach(function (b) {
        b.onclick = function () {
          if (locked) return; var i = +b.getAttribute('data-i');
          if (i === ans) { locked = true; b.classList.add('ok'); right++; speak('Oui ! ' + say(words[ans].w)).then(function () { k++; round(); }); }
          else { b.classList.add('bad'); right = Math.max(0, right - 0); speak('Non. ' + say(words[ans].w)); order[k] = ans; }
        };
      });
      setTimeout(function () { speak(say(words[ans].w)); }, 250);
    }
    function say(w) { return w.replace(/\s*\(.*\)/, '').split(' / ')[0]; }
    $('#qplay').onclick = function () { if (!order) return start(); if (k < order.length) speak(say(words[order[k]].w)); };
    $('#qnew').onclick = start;
    $('#qopts').innerHTML = '<p class="hint">Press <b>🔊 Écouter</b> to start.</p>';
  }

  function soundSec(u) {
    var s = u.sound;
    return '<section class="card" id="sound"><h2>🔤 Le son ' + s.letters.map(function (l) { return '« ' + l + ' »'; }).join(' ') + ' <small>Sound and read</small></h2>' +
      '<div class="sbig">' + s.letters.map(function (l) { return '<button class="L" type="button" data-say="' + l + '">' + l + '</button>'; }).join('') + '<p style="flex:1;min-width:220px;margin:0">' + esc(s.tip) + '</p></div>' +
      '<p class="hint rdhint">🎤 <b>Now you read!</b> Tap <b>🎤 Je lis</b>, read out loud, and see the words you said well in green.</p>' +
      '<h3 style="margin-top:14px">1 · Syllables</h3><div class="syl">' + s.syllables.map(function (x) { return '<button type="button" data-say="' + x + '">' + x + '</button>'; }).join('') + '</div>' + micBtn(s.syllables.join(' ')) +
      '<h3>2 · Words</h3><div class="sw">' + s.words.map(function (w) { return '<button type="button" data-say="' + esc(w.w) + '">' + pic(w.pic) + '<b>' + hl(w.w, s.letters) + '</b></button>'; }).join('') + '</div>' + micBtn(s.words.map(function (w) { return w.w; }).join(' ')) +
      '<h3 style="margin-top:14px">3 · Sentences</h3><ul class="sent">' + s.sentences.map(function (x) { return '<li>' + spkBtn(x) + '<span>' + frT(x) + '</span>' + micBtn(x, 1) + '</li>'; }).join('') + '</ul>' +
      '<h3>4 · Find the sound</h3><p class="hint">Tap a picture to hear the word. Do you hear the sound? Tap ✔ on the pictures that have it.</p>' +
      '<div class="find">' + s.find.map(function (f, i) { return '<button type="button" data-i="' + i + '" aria-label="' + esc(f.w) + '">' + pic(f.pic) + '</button>'; }).join('') + '</div>' +
      '<p><button class="btn ghost" id="fcheck">✔ Check</button> <span class="score" id="fscore"></span></p></section>';
  }
  function bindSound(u) {
    var sel = {};
    $$('.find button').forEach(function (b) {
      b.onclick = function () { var i = +b.getAttribute('data-i'); speak(u.sound.find[i].w); sel[i] = !sel[i]; b.style.borderStyle = sel[i] ? 'solid' : 'dashed'; b.classList.remove('ok', 'bad'); };
    });
    $('#fcheck').onclick = function () {
      var r = 0; $$('.find button').forEach(function (b) { var i = +b.getAttribute('data-i'), ok = !!sel[i] === !!u.sound.find[i].ok; b.classList.toggle('ok', ok); b.classList.toggle('bad', !ok); if (ok) r++; });
      $('#fscore').textContent = r + ' / ' + u.sound.find.length + (r === u.sound.find.length ? ' 🌟' : '');
    };
  }

  /* escuchar: tres tipos según el libro (numerar, colorear, me gusta / no me gusta) */
  function listenSec(u) {
    var L = u.listen, body;
    if (L.color) {
      body = '<div class="lst">' + L.pics.map(function (p, i) { return '<button type="button" class="bal" data-i="' + i + '" style="font-size:58px">🎈<span class="tag">' + (i + 1) + '</span><b style="font-size:14px">' + (i + 1) + '</b></button>'; }).join('') + '</div>' +
        '<div class="colors">' + [['rouge', '#E53935'], ['bleu', '#1E6FE0'], ['jaune', '#FFD12A'], ['vert', '#2EAD4B'], ['orange', '#FF8A00'], ['rose', '#FF77B7'], ['blanc', '#FFFFFF'], ['noir', '#222']].map(function (c) { return '<button type="button" data-c="' + c[0] + '" style="background:' + c[1] + '" aria-label="' + c[0] + '"></button>'; }).join('') + '</div>';
    } else if (/😋|😖/.test(L.answers)) {
      body = '<div class="lst">' + L.pics.map(function (p, i) { return '<button type="button" data-i="' + i + '">' + pic(p.pic) + '<span class="tag"></span></button>'; }).join('') + '</div><div class="faces"><button type="button" data-f="😋">😋</button><button type="button" data-f="😖">😖</button></div>';
    } else {
      body = '<div class="lst">' + L.pics.map(function (p, i) { return '<button type="button" data-i="' + i + '">' + pic(p.pic) + '<span class="tag"></span></button>'; }).join('') + '</div>';
    }
    return '<section class="card" id="listen"><h2>🎧 ' + esc(L.task) + '</h2><p class="hint">Press ▶, listen, then tap the answer. You can listen again as many times as you want.</p>' +
      '<p><button class="btn" id="lplay">▶ <span id="lnum">1</span> · Écouter</button> <span class="score" id="lscore"></span></p>' + body + '</section>';
  }
  function bindListen(u) {
    var L = u.listen, k = 0, tags = $$('#listen .lst button');
    function line() { return L.script[k].replace(/^\d+\.\s*/, ''); }
    function next() { k++; if (k >= L.script.length) { $('#lscore').textContent = '🌟 Bravo !'; $('#lplay').disabled = true; speak('Bravo !'); } else $('#lnum').textContent = k + 1; }
    $('#lplay').onclick = function () { if (k < L.script.length) speak(line()); };
    if (L.color) {
      var cols = {}; L.answers.split('·').forEach(function (p) { var m = p.match(/(\d)\s*=\s*(\S+)/); if (m) cols[+m[1] - 1] = m[2]; });
      var colorHex = {}; $$('#listen .colors button').forEach(function (b) { colorHex[b.getAttribute('data-c')] = b.style.background; });
      $$('#listen .colors button').forEach(function (b) {
        b.onclick = function () {
          if (k >= L.script.length) return; var c = b.getAttribute('data-c');
          speak(c);
          if (c === cols[k]) { var t = tags[k]; t.classList.add('done'); t.style.background = colorHex[c]; next(); } else { tags[k].classList.add('bad'); setTimeout(function () { tags[k] && tags[k].classList.remove('bad'); }, 600); }
        };
      });
    } else if (/😋|😖/.test(L.answers)) {
      var want = L.answers.split('·').map(function (p) { return /😋/.test(p) ? '😋' : '😖'; });
      $$('#listen .faces button').forEach(function (b) {
        b.onclick = function () {
          if (k >= L.script.length) return; var f = b.getAttribute('data-f');
          if (f === want[k]) { tags[k].classList.add('done'); tags[k].querySelector('.tag').textContent = f; next(); } else { b.style.outline = '3px solid #E53935'; setTimeout(function () { b.style.outline = ''; }, 500); }
        };
      });
    } else {
      var num = {}; L.answers.split('·').forEach(function (p) { var m = p.trim().match(/^(.+?)\s*=\s*(\d)/); if (m) num[m[1].trim()] = +m[2]; });
      tags.forEach(function (b, i) {
        b.onclick = function () {
          if (k >= L.script.length) return;
          if (num[L.pics[i].e] === k + 1) { b.classList.add('done'); b.querySelector('.tag').textContent = k + 1; next(); }
          else { b.classList.add('bad'); setTimeout(function () { b.classList.remove('bad'); }, 600); }
        };
      });
    }
  }

  function readSec(u) {
    var R = u.reading;
    return '<section class="card" id="read"><h2>📚 Lis et réponds <small>Read: vrai or faux?</small></h2>' +
      '<div class="rtext">' + spkBtn(R.text) + '<span>' + frT(R.text) + '</span></div>' + micBtn(R.text) + '<ul class="vf">' +
      R.q.map(function (q, i) { return '<li><span>' + frT(q[0]) + '</span>' + spkBtn(q[0]) + '<button type="button" data-i="' + i + '" data-v="1">vrai</button><button type="button" data-i="' + i + '" data-v="0">faux</button></li>'; }).join('') + '</ul></section>';
  }
  function bindRead(u) {
    $$('#read .vf button[data-v]').forEach(function (b) {
      b.onclick = function () {
        var i = +b.getAttribute('data-i'), v = b.getAttribute('data-v') === '1', ok = v === u.reading.q[i][1];
        $$('#read .vf button[data-i="' + i + '"]').forEach(function (x) { x.classList.remove('ok', 'bad'); });
        b.classList.add(ok ? 'ok' : 'bad'); speak(ok ? 'Oui, bravo !' : 'Non, essaie encore.');
      };
    });
  }

  /* ---------- "Now you read!": la niña lee en voz alta, el lab marca las palabras ---------- */
  function micBtn(text, small) { return '<button class="mic' + (small ? ' sm' : '') + '" type="button" data-read="' + esc(text) + '">🎤' + (small ? '' : ' Je lis') + '</button>'; }
  function phon(w) {
    w = norm(String(w).replace(/ç/gi, 's')).replace(/\s/g, '');
    w = w.replace(/eaux?$/, 'o').replace(/eau/g, 'o').replace(/au/g, 'o').replace(/ph/g, 'f').replace(/qu/g, 'k').replace(/c([aou])/g, 'k$1').replace(/ss/g, 's');
    w = w.replace(/([a-z])\1+/g, '$1');
    for (var i = 0; i < 3 && w.length > 2; i++) w = w.replace(/(e|s|t|x|d|z|p)$/, '');
    return w.replace(/h/g, '');
  }
  function lev(a, b) {
    var m = [], i, j; for (i = 0; i <= b.length; i++) m[i] = [i];
    for (j = 0; j <= a.length; j++) m[0][j] = j;
    for (i = 1; i <= b.length; i++) for (j = 1; j <= a.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (b[i - 1] === a[j - 1] ? 0 : 1));
    return m[b.length][a.length];
  }
  function heardIt(word, said) {
    var p = phon(word); if (!p) return true;
    var toks = said.map(phon), joined = toks.join('');
    if (toks.indexOf(p) >= 0) return true;
    if (p.length <= 3) return joined.indexOf(p) >= 0;             /* sílabas: "la li ma" a veces sale "lali ma" */
    return toks.some(function (t) { return t && lev(p, t) <= (p.length >= 6 ? 2 : 1); });
  }
  var REC = null;
  function closeReader() { if (REC) { try { REC.stop(); } catch (e) {} REC = null; } var o = $('.reader'); if (o) o.remove(); }
  function reader(btn, text) {
    closeReader(); stop();
    var words = text.replace(/[’']/g, '’ ').split(/\s+/).map(function (w) { return w.replace(/^[«»“”"—\-:;,.!?…]+|[«»“”"—\-:;,.!?…]+$/g, ''); }).filter(Boolean);
    var host = btn.closest('li') || btn;
    var box = document.createElement('div'); box.className = 'reader';
    box.innerHTML = '<div class="rwords">' + words.map(function (w, i) { return '<span data-i="' + i + '">' + esc(w) + '</span>'; }).join(' ') + '</div>' +
      '<div class="rstat" aria-live="polite"></div><div class="rbtns"></div>';
    host.parentNode.insertBefore(box, host.nextSibling);
    var stat = $('.rstat', box), btns = $('.rbtns', box);
    if (!SR) { stat.innerHTML = 'To read with the microphone, open this page in <b>Chrome</b> or <b>Edge</b>. You can still listen: tap 🔊.'; btns.innerHTML = '<button class="btn ghost" type="button" data-say="' + esc(text) + '">🔊 Modèle</button>'; return; }
    var said = [], interim = '', chunks = [], rec = null, url = null, t0 = Date.now(), quiet = null, done = false;
    var mr = null, stream = null;
    try {
      if (navigator.mediaDevices && window.MediaRecorder) navigator.mediaDevices.getUserMedia({ audio: true }).then(function (st) {
        if (done) { st.getTracks().forEach(function (t) { t.stop(); }); return; }
        stream = st; mr = new MediaRecorder(st); mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        mr.onstop = function () { st.getTracks().forEach(function (t) { t.stop(); }); if (chunks.length) { url = URL.createObjectURL(new Blob(chunks, { type: mr.mimeType || 'audio/webm' })); var b = $('.myvoice', box); if (b) b.hidden = false; } };
        mr.start();
      }).catch(function () {});
    } catch (e) {}
    rec = new SR(); REC = rec; rec.lang = 'fr-FR'; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    stat.innerHTML = '🎤 <b>Je t’écoute…</b> Read out loud. <button class="btn ghost" type="button" id="rfin">⏹ J’ai fini</button>';
    $('#rfin', box).onclick = function () { try { rec.stop(); } catch (e) {} };
    function live() {
      var all = said.concat(interim.split(/\s+/));
      $$('.rwords span', box).forEach(function (sp, i) { if (heardIt(words[i], all)) sp.className = 'ok'; });
    }
    function arm() { clearTimeout(quiet); quiet = setTimeout(function () { try { rec.stop(); } catch (e) {} }, 2600); }
    rec.onresult = function (e) {
      interim = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var t = e.results[i][0].transcript;
        if (e.results[i].isFinal) said = said.concat(t.split(/\s+/)); else interim += ' ' + t;
      }
      live(); arm();
    };
    rec.onerror = function (e) { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { done = true; stat.innerHTML = 'Please allow the microphone (tap the 🔒 next to the address), then try again.'; } };
    rec.onend = function () {
      if (done) return;
      if (!said.length && !interim.trim() && Date.now() - t0 < 9000) { try { rec.start(); return; } catch (e) {} }   /* el navegador cortó antes de que hablara */
      done = true; clearTimeout(quiet); REC = null;
      try { if (mr && mr.state !== 'inactive') mr.stop(); else if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
      var all = said.concat(interim.split(/\s+/)).filter(Boolean), good = 0, miss = [];
      $$('.rwords span', box).forEach(function (sp, i) { var ok = heardIt(words[i], all); sp.className = ok ? 'ok' : 'try'; if (ok) good++; else if (miss.indexOf(words[i]) < 0) miss.push(words[i]); });
      var ratio = words.length ? good / words.length : 0, stars = !all.length ? 0 : ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;
      var msg = stars === 3 ? 'Parfait ! Bravo !' : stars === 2 ? 'Très bien !' : stars === 1 ? 'Bien essayé ! Encore une fois !' : 'Je n’ai rien entendu. Encore une fois !';
      stat.innerHTML = '<span class="rstars">' + [1, 2, 3].map(function (k) { return '<b class="' + (k <= stars ? 'on' : '') + '">★</b>'; }).join('') + '</span> <b>' + msg + '</b>' +
        (miss.length ? '<div class="rmiss">Practice these words (tap to listen, 🎤 to try again):' + miss.map(function (w) { return '<span class="rm"><button type="button" class="rw" data-say="' + esc(w) + '">🔊 ' + esc(w) + '</button><button type="button" class="mic sm" data-read="' + esc(w) + '">🎤</button></span>'; }).join('') + '</div>' : '');
      btns.innerHTML = '<button class="btn ghost myvoice" type="button" ' + (url ? '' : 'hidden') + '>▶ Ma voix</button><button class="btn ghost" type="button" data-say="' + esc(text) + '">🔊 Modèle</button><button class="btn" type="button" data-read="' + esc(text) + '">🎤 Encore</button>';
      $('.myvoice', box).onclick = function () { if (url) { stop(); new Audio(url).play(); } };
      speak(msg);
    };
    setTimeout(function () { if (!done) try { rec.stop(); } catch (e) {} }, 40000);
    try { rec.start(); } catch (e) { stat.textContent = 'The microphone is busy. Try again.'; }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-read]'); if (!b) return;
    var inReader = b.closest('.reader');
    if (inReader) { reader(inReader.previousElementSibling || b, b.getAttribute('data-read')); return; }
    reader(b, b.getAttribute('data-read'));
  });

  /* hablar: diálogo con mamá y micrófono en francés */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function talkSec(u) {
    var T = u.talk;
    return '<section class="card" id="talk"><h2>🗣️ ' + esc(T.title) + ' <small>Speaking</small></h2><p class="hint">Mama reads her lines (or tap 🔊). The child answers. ' + (SR ? 'Tap 🎤 and say your line in French!' : '') + '</p><ul class="dlg">' +
      T.lines.map(function (l, i) {
        var mom = l[0] === 'Maman';
        return '<li><span class="who">' + (mom ? '👩🏽 Maman' : '🧒🏽 Moi') + '</span><span class="txt">' + frT(l[1]) + '<span class="heard" id="h' + i + '"></span></span>' +
          (mom ? spkBtn(l[1]) : (SR ? '<button class="spk" type="button" data-mic="' + i + '" aria-label="Dis-le">🎤</button>' : spkBtn(l[1].replace(/_+/g, ''))));
      }).join('') + '</ul><p class="hint" style="margin-top:12px"><b>Mama asks:</b> ' + T.ask.map(frT).join(' · ') + '</p></section>';
  }
  function bindTalk(u) {
    $$('#talk [data-mic]').forEach(function (b) {
      b.onclick = function () {
        var i = +b.getAttribute('data-mic'), target = u.talk.lines[i][1], out = $('#h' + i);
        stop(); var r = new SR(); r.lang = 'fr-FR'; r.interimResults = false; r.maxAlternatives = 3;
        b.textContent = '⏺'; out.textContent = ' — Je t’écoute…';
        r.onresult = function (e) {
          var said = e.results[0][0].transcript, want = norm(target).split(' ').filter(function (w) { return w.length > 1; }), got = norm(said).split(' ');
          var hit = want.filter(function (w) { return got.indexOf(w) >= 0; }).length, ok = want.length ? hit / want.length >= 0.5 : true;
          out.textContent = ' — « ' + said + ' » ' + (ok ? '✅ Bravo !' : '🙂 Encore une fois !'); speak(ok ? 'Bravo !' : 'Encore une fois !');
        };
        r.onerror = function () { out.textContent = ' — Allow the microphone, then try again.'; };
        r.onend = function () { b.textContent = '🎤'; };
        try { r.start(); } catch (e) {}
      };
    });
  }

  /* Sunny en francés: el mismo puente que el English Lab (necesita el código del estudiante) */
  function sunnySec(u) {
    return '<section class="card" id="sunny"><h2>☀️ Parle avec Sunny <small>Talk with Sunny in French</small></h2>' +
      '<p class="hint">Sunny speaks French slowly and gives 3 answers to choose from. Tap one, say it with 🎤, or type it. Explanations are in English.</p>' +
      '<div id="sunbox"></div></section>';
  }
  function bindSunny(u) {
    var box = $('#sunbox'), turns = [], busy = false;
    function code() { return store('hadash-sunny-code') || ''; }
    function device() {
      var d = store('hadash-device');
      if (!/^[a-z0-9-]{16,64}$/i.test(d || '')) { d = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)); store('hadash-device', d); }
      return d;
    }
    function codeForm(msg) {
      box.innerHTML = '<p class="hint">' + (msg || 'Sunny is for Hadash Academy students. Type your student code to start.') + '</p>' +
        '<form class="srow" id="sform"><input id="scode" placeholder="HADASH-…" autocomplete="off" aria-label="Student code"><button class="btn" type="submit">Start</button></form>';
      $('#sform').onsubmit = function (e) { e.preventDefault(); var c = $('#scode').value.trim().toUpperCase(); if (c) { store('hadash-sunny-code', c); chat(); } };
    }
    function rules() {
      var words = u.vocab.map(function (v) { return v.w; }).join(', ');
      return 'You are Sunny, a warm and playful French tutor at Hadash Academy. You are talking with a 6-year-old child who speaks English very well and is a total beginner in French (level DELF Prim A1.1). ' +
        'Today’s unit is “' + u.fr + '” (' + u.en + '). Use only very simple French from this unit: ' + words + '. Grammar of the unit: ' + u.grammar.title + '. ' +
        'Reply format, each label at the start of its own line:\n' +
        'FIX: only if the child made a mistake in French: the correct French sentence. Leave it out otherwise.\n' +
        'TIP: only with FIX: one short, kind explanation in simple English.\n' +
        'SAY: what you say, in French only: 1 or 2 very short sentences, praise, and exactly one easy question.\n' +
        'EN: the English meaning of your SAY line.\n' +
        'OPTIONS: three short possible answers in French to your question, separated by " | ". All correct and different.\n' +
        'Never mix English inside the SAY line. Plain text, no emojis, no lists. Stay on family-friendly topics: family, friends, school, food, colors, animals, the day. Never talk about magic, ghosts, monsters or holidays.\n' +
        'Start now: say hello, say you are Sunny, and ask the child’s name.';
    }
    function parse(t) {
      var r = { fix: '', tip: '', say: '', en: '', options: [] }, cur = null;
      t.split(/\n+/).forEach(function (line) {
        var m = line.match(/^\s*(FIX|TIP|SAY|EN|OPTIONS)\s*:\s*(.*)$/i); if (m) { cur = m[1].toUpperCase(); line = m[2]; }
        line = line.trim(); if (!line) return;
        if (cur === 'FIX') r.fix += ' ' + line; else if (cur === 'TIP') r.tip += ' ' + line; else if (cur === 'EN') r.en += ' ' + line;
        else if (cur === 'OPTIONS') r.options = r.options.concat(line.split('|').map(function (x) { return x.trim(); }).filter(Boolean));
        else r.say += ' ' + line;
      });
      if (!r.say.trim() && !r.fix) r.say = t; return r;
    }
    function add(cls, html) { var d = document.createElement('div'); d.className = 'msg ' + cls; d.innerHTML = html; $('#slog').appendChild(d); $('#slog').scrollTop = 1e6; return d; }
    function status(t, err) { var s = $('#sst'); if (s) { s.textContent = t || ''; s.classList.toggle('err', !!err); } }
    async function ask() {
      var r;
      try { r = await fetch(SUNNY_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code(), device: device(), messages: [turns[0]].concat(turns.slice(1).slice(-14)) }) }); }
      catch (e) { throw 'down'; }
      if (r.status === 401) { store('hadash-sunny-code', null); throw 'code'; }
      if (r.status === 409) { store('hadash-sunny-code', null); throw 'device'; }
      if (!r.ok) throw 'down';
      var d = await r.json(); return String(d.text || d.reply || '').replace(/[*#`_]/g, '').trim();
    }
    async function reply() {
      busy = true; status('Sunny réfléchit… (thinking)');
      try {
        var t = await ask(); turns.push({ role: 'assistant', content: t }); var p = parse(t);
        $$('#slog .sopts').forEach(function (o) { o.remove(); });
        if (p.fix.trim()) add('fix', '✅ <b>' + frT(p.fix.trim()) + '</b>' + (p.tip.trim() ? '<span class="en">💡 ' + esc(p.tip.trim()) + '</span>' : ''));
        add('ai', '☀️ ' + frT(p.say.trim()) + (p.en.trim() ? '<span class="en">' + esc(p.en.trim()) + '</span>' : ''));
        if (p.options.length) {
          var o = add('sopts', p.options.slice(0, 3).map(function (x, i) { return '<button type="button" data-o="' + esc(x) + '">' + 'ABC'[i] + '. ' + frT(x) + '</button>'; }).join(''));
          o.className = 'sopts'; $$('button', o).forEach(function (b) { b.onclick = function () { send(b.getAttribute('data-o')); }; });
        }
        status('');
        (p.fix.trim() ? speak(p.fix.trim()) : Promise.resolve()).then(function () { return speak(p.say.trim(), { queue: true }); });
      } catch (e) {
        if (e === 'code') return codeForm('That code did not work. Check it or ask your teacher.');
        if (e === 'device') return codeForm('This code is already active on another device. Ask your teacher to release it.');
        status('Sunny could not answer. Check your internet and try again.', true);
      }
      busy = false;
    }
    function send(t) { t = String(t || '').trim(); if (!t || busy) return; stop(); $$('#slog .sopts').forEach(function (o) { o.remove(); }); add('me', esc(t)); turns.push({ role: 'user', content: t }); reply(); }
    function chat() {
      box.innerHTML = '<div class="sun" id="slog" aria-live="polite"></div><div class="status" id="sst"></div>' +
        '<form class="srow" id="sform2"><input id="sin" lang="fr" placeholder="Écris en français…" autocomplete="off" aria-label="Your answer in French">' +
        (SR ? '<button class="btn ghost" type="button" id="smic">🎤</button>' : '') + '<button class="btn" type="submit">Envoyer</button><button class="btn ghost" type="button" id="snew">↺</button></form>';
      $('#sform2').onsubmit = function (e) { e.preventDefault(); var v = $('#sin').value; $('#sin').value = ''; send(v); };
      $('#snew').onclick = function () { turns = [{ role: 'user', content: rules() }]; $('#slog').innerHTML = ''; reply(); };
      if (SR) $('#smic').onclick = function () {
        stop(); var r = new SR(); r.lang = 'fr-FR'; r.interimResults = false; $('#smic').textContent = '⏺'; status('Je t’écoute… (speak in French)');
        r.onresult = function (e) { send(e.results[0][0].transcript); }; r.onerror = function () { status('Allow the microphone and try again.', true); };
        r.onend = function () { $('#smic').textContent = '🎤'; }; try { r.start(); } catch (e) {}
      };
      turns = [{ role: 'user', content: rules() }]; reply();
    }
    box.innerHTML = '<button class="btn" id="sgo">☀️ Commencer avec Sunny</button>';
    $('#sgo').onclick = function () { code() ? chat() : codeForm(); };
  }

  function videoSec(u) {
    var id = VIDEOS[N];
    return '<section class="card" id="video"><h2>🎵 La vidéo de la semaine <small>Song or video</small></h2>' +
      (id ? '<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/' + esc(id) + '?rel=0&modestbranding=1" title="Vidéo" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div><p class="hint">Watch, listen and repeat the words you know!</p>'
          : '<div class="novideo">Mama’s video for this unit is coming soon. 🎬<br><small>Mama: choose a French children’s song about “' + esc(u.en.toLowerCase()) + '”, check it first, and ask your teacher to add it here.</small></div>') + '</section>';
  }

  function reviewSec(u) {
    return '<section class="card" id="review"><h2>⭐ Je sais… <small>I can…</small></h2><p class="hint">Color the stars: 1 = with help · 2 = almost alone · 3 = all by myself!</p><ul class="rev">' +
      u.review.map(function (r, i) { return '<li><span>' + esc(r) + '</span><span class="stars" data-i="' + i + '">' + [1, 2, 3].map(function (s) { return '<button type="button" data-s="' + s + '" aria-label="' + s + ' star">★</button>'; }).join('') + '</span></li>'; }).join('') + '</ul></section>';
  }
  function bindReview(u) {
    var key = 'fl-stars-' + N, st = store(key) || {};
    function paint() { $$('#review .stars').forEach(function (g) { var i = g.getAttribute('data-i'); $$('button', g).forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-s') <= (st[i] || 0)); }); }); }
    $$('#review .stars button').forEach(function (b) { b.onclick = function () { var i = b.parentNode.getAttribute('data-i'); st[i] = +b.getAttribute('data-s'); store(key, st); paint(); if (st[i] === 3) speak('Super !'); }; });
    paint();
  }

  /* ================================================================ INICIO */
  function home() {
    var h = topbar('<div class="hero"><div><h1>French Lab <span>· Lecture amusante avec Maman</span></h1><p>Volume 1 · Niveau A1.1 · For children who speak English — and the moms who learn with them</p></div></div>');
    h += '<main class="wrap"><nav class="jump"><a href="#units">📚 Units</a><a href="#pronunciation">🗣️ Pronunciation</a><a href="#words">🖼️ All words</a><a href="#delf">🏅 Mon petit DELF</a></nav>';
    h += '<section id="units" style="scroll-margin-top:70px"><div class="units">' + D.units.map(function (u) {
      var st = store('fl-stars-' + u.n) || {}, n = 0; for (var k in st) n += st[k];
      return '<a class="ucard" href="unit-' + u.n + '/" style="--c:' + u.color + ';--s:' + u.soft + '">' + scene(u.hero) + '<small>Unité ' + u.n + '</small><h3>' + frT(u.fr) + '</h3><small>' + esc(u.en) + ' · ' + frT(u.story_title) + '</small><span class="prog">⭐ ' + n + ' / 12</span></a>';
    }).join('') + '</div></section>';
    h += '<section class="card" id="pronunciation"><h2>🗣️ Mama’s pronunciation guide</h2><p class="hint">Tap 🔊 to hear each example in French. Say it 3 times together!</p>' +
      D.pron.map(function (g) { return '<h3 style="margin:12px 0 6px">' + esc(g[0]) + '</h3><table class="pron"><tr><th>Letters</th><th>Sounds like…</th><th>Example</th><th></th></tr>' + g[1].map(function (r) { return '<tr><td class="L">' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td><i>' + esc(r[2]) + '</i></td><td>' + spkBtn(r[2].split(',')[0]) + '</td></tr>'; }).join('') + '</table>'; }).join('') +
      '<h3 style="margin:14px 0 6px">Silent letters and music</h3><ul>' + D.silent.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<h3 style="margin:14px 0 6px">French for every day</h3><div class="glist">' + D.classroom.map(function (c) { return '<button class="gw" type="button" data-say="' + esc(c[0]) + '"><span class="spk">🔊</span><span><b>' + frT(c[0]) + '</b><small>' + esc(c[1]) + '</small></span></button>'; }).join('') + '</div></section>';
    var all = []; D.units.forEach(function (u) { u.vocab.forEach(function (v) { all.push([v, u.n]); }); (u.numbers || []).forEach(function (x) { all.push([{ w: x[0], en: String(x[1]), pic: { emo: x[1] } }, u.n]); }); });
    h += '<section class="card" id="words"><h2>🖼️ Mes mots <small>French–English word list</small></h2><p class="hint">Can’t read yet? No problem: tap a word to hear it.</p><div class="gfilter">' +
      '<button class="chip" style="color:var(--navy);border-color:var(--line)" data-u="0" aria-pressed="true">All</button>' + D.units.map(function (u) { return '<button class="chip" style="color:var(--navy);border-color:var(--line)" data-u="' + u.n + '" aria-pressed="false">Unité ' + u.n + '</button>'; }).join('') + '</div><div class="glist" id="glist">' +
      all.map(function (x) { var v = x[0]; return '<button class="gw" type="button" data-un="' + x[1] + '" data-say="' + esc(v.w.replace(/\s*\(.*\)/, '').split(' / ')[0]) + '">' + (v.pic.emo && /^\d+$/.test(v.pic.emo) ? '<span class="pic"><b style="font-size:26px;color:var(--coral)">' + v.pic.emo + '</b></span>' : pic(v.pic)) + '<span><b>' + art(v.w) + '</b><small>' + esc(v.en) + '</small></span></button>'; }).join('') + '</div></section>';
    h += delfSec() + '<footer>Lecture amusante avec Maman · Volume 1 · Hadash Academy · Santo Domingo</footer></main>';
    app.innerHTML = h; bindTop();
    $$('.gfilter button').forEach(function (b) { b.onclick = function () { var n = b.getAttribute('data-u'); $$('.gfilter button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); $$('#glist .gw').forEach(function (g) { g.style.display = n === '0' || g.getAttribute('data-un') === n ? '' : 'none'; }); }; });
    bindDelf();
  }
  var DELF_SCRIPT = ['Bonjour !', 'C’est mon chien.', 'Je voudrais une banane.', 'Joyeux anniversaire !', 'Je me lève à sept heures.'];
  var DELF_PICS = [{ emo: '🍌', k: 3 }, { img: 'dog', k: 2 }, { img: 'eli', kid: 1, k: 1 }, { img: 'cake', k: 4 }, { img: 'bed', k: 5 }];
  var DELF_Q = [['Inès a six ans.', false], ['Inès a un chat.', true], ['Inès aime les fraises.', true], ['Inès aime le lait.', false]];
  function delfSec() {
    var text = 'Je m’appelle Inès. J’ai sept ans. J’ai un frère et un chat. J’aime le jaune et les fraises. Je n’aime pas le lait.';
    return '<section class="card" id="delf"><h2>🏅 Mon petit DELF <small>My first French test (like DELF Prim A1.1)</small></h2>' +
      '<h3>🎧 Part 1 · Listening</h3><p class="hint">Press ▶ and tap the right picture.</p><p><button class="btn" id="dplay">▶ <span id="dnum">1</span> · Écouter</button> <span class="score" id="dscore"></span></p>' +
      '<div class="lst" style="grid-template-columns:repeat(5,1fr)">' + DELF_PICS.map(function (p, i) { return '<button type="button" data-i="' + i + '">' + pic(p) + '<span class="tag"></span></button>'; }).join('') + '</div>' +
      '<h3 style="margin-top:16px">📖 Part 2 · Reading</h3><div class="idcard"><span style="font-size:54px">👧🏾</span><span>' + spkBtn(text) + ' ' + frT(text) + '</span></div><ul class="vf" id="dvf">' +
      DELF_Q.map(function (q, i) { return '<li><span>' + frT(q[0]) + '</span>' + spkBtn(q[0]) + '<button type="button" data-i="' + i + '" data-v="1">vrai</button><button type="button" data-i="' + i + '" data-v="0">faux</button></li>'; }).join('') + '</ul>' +
      '<h3 style="margin-top:16px">✏️🗣️ Parts 3 and 4 · Writing and speaking</h3><p class="hint">These are in the book (pages “Mon petit DELF”). Mama asks the questions and gives the points.</p></section>';
  }
  function bindDelf() {
    var k = 0, tags = $$('#delf .lst button');
    $('#dplay').onclick = function () { if (k < DELF_SCRIPT.length) speak(DELF_SCRIPT[k]); };
    tags.forEach(function (b, i) {
      b.onclick = function () {
        if (k >= DELF_SCRIPT.length) return;
        if (DELF_PICS[i].k === k + 1) { b.classList.add('done'); b.querySelector('.tag').textContent = k + 1; k++; if (k >= DELF_SCRIPT.length) { $('#dscore').textContent = '🌟 Bravo !'; speak('Bravo !'); } else $('#dnum').textContent = k + 1; }
        else { b.classList.add('bad'); setTimeout(function () { b.classList.remove('bad'); }, 600); }
      };
    });
    $$('#dvf button[data-v]').forEach(function (b) {
      b.onclick = function () { var i = +b.getAttribute('data-i'), ok = (b.getAttribute('data-v') === '1') === DELF_Q[i][1]; $$('#dvf button[data-i="' + i + '"]').forEach(function (x) { x.classList.remove('ok', 'bad'); }); b.classList.add(ok ? 'ok' : 'bad'); speak(ok ? 'Oui !' : 'Non.'); };
    });
  }

  if (N) unitPage(); else home();
  if (N) goHash(); else if (location.hash) setTimeout(goHash, 60);
})();
