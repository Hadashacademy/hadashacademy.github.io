/* Hadash Academy · English Lab — voces (nov 2026)
   Igual que Study Island: escoge sola la voz más natural del equipo, habla frase por frase
   con pausas y un poco más despacio, y tiene un botón para cambiar de voz.
   - Casi todo en inglés AMERICANO (en-US). En Edge: Jenny, Aria, Ava, Ana (niña), Guy, Andrew...
   - Voces BRITÁNICAS (en-GB) en los Practice Tests y en algunos personajes (Sonia, Libby, Ryan...).
   - Nunca voces australianas, indias ni de otros acentos.
   Este archivo se carga antes que los demás scripts de cada página. */
(function () {
  var S = window.speechSynthesis; if (!S || window.HV) return;
  var origGet = S.getVoices.bind(S), origSpeak = S.speak.bind(S), origCancel = S.cancel.bind(S);
  var LS = { get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
             set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var FEM = /\b(female|woman|girl|jenny|aria|ava|ana|emma|michelle|monica|nancy|sara|jane|amber|ashley|cora|elizabeth|samantha|allison|susan|zira|sonia|libby|maisie|hollie|abbie|bella|olivia|hazel|kate|serena|google us english|google uk english female)\b/i;
  var MAL = /\b(male|man|boy|guy|andrew|brian|christopher|eric|roger|steffan|davis|tony|jason|brandon|jacob|kai|ryan|thomas|alfie|elliot|ethan|noah|oliver|george|david|mark|daniel|alex|fred|tom|aaron|arthur|google uk english male)\b/i;
  function lang(v) { return (v.lang || '').replace('_', '-').toLowerCase(); }
  function acc(v) { var l = lang(v); return l === 'en-us' ? 'US' : l === 'en-gb' ? 'GB' : l.indexOf('es') === 0 ? 'ES' : null; }
  function gen(v) { var n = v.name + ' ' + (v.voiceURI || ''); return /female/i.test(n) ? 'f' : /\bmale\b/i.test(n) ? 'm' : MAL.test(n) ? 'm' : FEM.test(n) ? 'f' : '?'; }
  function kid(v) { return /\b(ana|maisie)\b/i.test(v.name); }
  function score(v) { var n = v.name + ' ' + (v.voiceURI || ''), s = 1;
    if (/natural|neural/i.test(n)) s = 6; else if (/online/i.test(n)) s = 5; else if (/google|premium|enhanced|siri/i.test(n)) s = 4;
    else if (/samantha|ava|allison|alex|daniel|karen|serena/i.test(n)) s = 3;
    if (/zira|david|mark|hazel|george|espeak|compact|novelty|bad news|bells|bubbles|whisper|zarvox|trinoids|albert|cellos/i.test(n)) s = 0;
    var top = /\b(jenny|aria|guy|andrew|ava|sonia|ryan|libby)\b/i.test(n) ? .4 : 0;
    return s + top; }
  var all = [];
  function load() { all = (origGet() || []).filter(function (v) { return acc(v); }); }
  load(); if (S.addEventListener) S.addEventListener('voiceschanged', load);
  /* Las páginas solo ven voces americanas, británicas y en español. */
  S.getVoices = function () { if (!all.length) load(); return all.slice(); };
  function list(a, g, child) {
    if (!all.length) load();
    var L = all.filter(function (v) { return acc(v) === a; }); if (!L.length && a === 'GB') L = all.filter(function (v) { return acc(v) === 'US'; });
    var G = L.filter(function (v) { return gen(v) === g; }); if (!G.length) G = L.filter(function (v) { return gen(v) === '?'; }); if (!G.length) G = L;
    G = G.filter(function (v) { return child ? true : !kid(v); }).sort(function (x, y) { return (child ? (kid(y) - kid(x)) * 10 : 0) + score(y) - score(x); });
    var hi = G.filter(function (v) { return score(v) >= 3; }); if (hi.length) G = hi;
    var pref = LS.get('hv-' + a + '-' + g, ''); if (pref) { var i = G.findIndex(function (v) { return v.name === pref; }); if (i > 0) G.unshift(G.splice(i, 1)[0]); }
    return G; }
  var GB_PAGE = /\/test-|practice-test|\/exam/i.test(location.pathname);
  var F = 'maya nina sofía sofia sara laura emily emma mom grandma rosa carmen carla ana valentina mia paula woman girl nurse librarian miss teacher_f grandma_rosa grandma_carmen water_girl aunt'.split(' ');
  var M = 'leo omar kevin daniel pedro lucas dad grandpa luis carlos ollie mario diego mateo andrés andres man boy farmer guard uncle lion_boy lightning_kid manager seller vendor'.split(' ');
  var KIDS = 'maya leo nina omar sofía sofia sara kevin pedro lucas emily emma valentina diego mateo andrés andres girl boy daniel carla mia'.split(' ');
  var UK = 'emily emma guide tourist scientist librarian'.split(' ');
  var cast = {}, castN = { f: 0, m: 0 };
  function key(who) { return String(who || '').trim().toLowerCase().replace(/^miss\s+/, 'miss_').replace(/\s+/g, '_'); }
  /* La voz de cada personaje: mujer u hombre, niño o adulto, americana o británica. */
  function forWho(who) {
    var k = key(who) || 'narrator';
    if (!cast[k]) {
      var base = k.split('_')[0], g = F.indexOf(k) >= 0 || F.indexOf(base) >= 0 || /^miss_|^mrs/.test(k) ? 'f' : M.indexOf(k) >= 0 || M.indexOf(base) >= 0 || /^mr_/.test(k) ? 'm' : k === 'narrator' ? 'f' : (castN.f <= castN.m ? 'f' : 'm');
      var a = GB_PAGE || UK.indexOf(base) >= 0 ? 'GB' : 'US', child = KIDS.indexOf(base) >= 0 && g === 'f';
      cast[k] = { g: g, a: a, child: child, i: k === 'narrator' ? 0 : castN[g]++ };
    }
    var c = cast[k], L = list(c.a, c.g, c.child); return L.length ? L[c.i % L.length] : null;
  }
  var good = function (v) { return v && all.indexOf(v) >= 0 && score(v) >= 4; };
  var remap = {};
  function better(v) {
    if (!v) { var L0 = list(GB_PAGE ? 'GB' : 'US', 'f'); return L0[0] || null; }
    var a = acc(v); if (a === 'ES') return v;
    if (good(v) && a === (GB_PAGE ? 'GB' : a)) return v;
    var g = gen(v); if (g === '?') g = 'f';
    var k = v.name; if (!remap[k]) { var n = Object.keys(remap).filter(function (x) { return remap[x].g === g; }).length; remap[k] = { g: g, i: n }; }
    var L = list(GB_PAGE ? 'GB' : (a || 'US'), g); return L.length ? L[remap[k].i % L.length] : v;
  }
  function sentences(t) { return String(t).match(/[^.!?]+[.!?]+["”’)]*\s*|[^.!?]+$/g) || [t]; }
  var timers = [];
  S.cancel = function () { timers.forEach(clearTimeout); timers = []; origCancel(); };
  S.speak = function (u) {
    try {
      var isEs = /^es/i.test(u.lang || '') || (u.voice && acc(u.voice) === 'ES');
      if (!isEs) { var v = better(u.voice); if (v) { u.voice = v; u.lang = v.lang; } }
      if (u.rate >= .95) u.rate = u.rate * .93;
      var parts = sentences(u.text).map(function (x) { return x.trim(); }).filter(Boolean);
      if (parts.length < 2 || u.onboundary || u.text.length > 900) return origSpeak(u);
      var i = 0, done = false, gap = Math.round(380 / Math.max(.6, u.rate || 1));
      var fire = function (name) { var f = u['on' + name]; try { f && f.call(u, new Event(name)); } catch (e) {} };
      var next = function () {
        if (done) return; if (i >= parts.length) { done = true; return fire('end'); }
        var p = new SpeechSynthesisUtterance(parts[i]); ['voice', 'lang', 'rate', 'pitch', 'volume'].forEach(function (k) { p[k] = u[k]; });
        var first = i === 0; i++;
        p.onstart = function () { if (first) fire('start'); };
        p.onend = function () { timers.push(setTimeout(next, gap)); };
        p.onerror = function (e) { if (e && (e.error === 'canceled' || e.error === 'interrupted')) { done = true; return fire('end'); } p.onend(); };
        origSpeak(p);
      };
      next();
    } catch (e) { origSpeak(u); }
  };
  window.HV = { forWho: forWho, list: list, better: better, reload: load };

  /* ---------- botón para cambiar la voz ---------- */
  function short(v) { return v ? v.name.replace(/Microsoft |Google |Online|\(Natural\)|\(.*?\)| - .*$/g, '').replace(/\s+/g, ' ').trim() : '—'; }
  function ui() {
    if (document.getElementById('hv-btn')) return;
    var st = document.createElement('style');
    st.textContent = '#hv-btn{position:fixed;left:12px;bottom:12px;z-index:9998;border:0;border-radius:999px;padding:9px 14px;font:700 14px Poppins,system-ui,sans-serif;background:#14213D;color:#fff;box-shadow:0 4px 14px #0003;cursor:pointer}' +
      '#hv-pan{position:fixed;left:12px;bottom:62px;z-index:9999;background:#fff;color:#14213D;border-radius:18px;box-shadow:0 10px 30px #0004;padding:12px 14px;width:min(330px,calc(100vw - 24px));font:500 14px Inter,system-ui,sans-serif}' +
      '#hv-pan[hidden]{display:none}#hv-pan b{font-family:Poppins,sans-serif}#hv-pan button{display:block;width:100%;text-align:left;border:0;border-radius:12px;background:#EEF2FA;margin-top:7px;padding:9px 11px;font:600 14px Poppins,system-ui,sans-serif;cursor:pointer}#hv-pan small{display:block;color:#5d6580;margin-top:8px;line-height:1.35}@media print{#hv-btn,#hv-pan{display:none}}';
    document.head.appendChild(st);
    var b = document.createElement('button'); b.id = 'hv-btn'; b.type = 'button'; b.textContent = '🔊 Voz'; b.setAttribute('aria-label', 'Cambiar la voz');
    var p = document.createElement('div'); p.id = 'hv-pan'; p.hidden = true; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Voces');
    var rows = [['US', 'f', '🇺🇸 Voz de mujer'], ['US', 'm', '🇺🇸 Voz de hombre'], ['GB', 'f', '🇬🇧 Mujer británica'], ['GB', 'm', '🇬🇧 Hombre británico']];
    function draw() {
      p.innerHTML = '<b>Voces del English Lab</b>' + rows.map(function (r, i) { var L = list(r[0], r[1]); return '<button data-i="' + i + '">' + r[2] + ': ' + short(L[0]) + ' ›</button>'; }).join('') +
        '<small>Toca para escuchar y cambiar. Las voces vienen de tu equipo: en Microsoft Edge suenan más naturales (Jenny, Aria, Guy, Sonia, Ryan).</small>';
      p.querySelectorAll('button').forEach(function (x) { x.onclick = function () { var r = rows[+x.dataset.i], L = list(r[0], r[1]); if (L.length > 1) LS.set('hv-' + r[0] + '-' + r[1], L[1].name);
        cast = {}; castN = { f: 0, m: 0 }; remap = {}; var v = list(r[0], r[1])[0]; S.cancel(); var u = new SpeechSynthesisUtterance(r[0] === 'GB' ? 'Hello! This is my British English voice.' : 'Hi! This is my American English voice.'); if (v) { u.voice = v; u.lang = v.lang; } origSpeak(u); draw(); }; });
    }
    b.onclick = function () { p.hidden = !p.hidden; if (!p.hidden) draw(); };
    document.body.append(b, p);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ui); else ui();
})();
