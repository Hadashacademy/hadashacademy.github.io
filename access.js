/* Hadash Academy · Matrícula (código de estudiante)
   Cada página del English Lab carga este archivo en el <head>. Si el equipo todavía no tiene
   un código válido, la página queda tapada hasta que el estudiante escribe su matrícula.
   El puente (tools/sunny-bridge/worker.js) amarra cada código al primer equipo donde se usa;
   el código de la maestra funciona en cualquier equipo. La maestra libera códigos en /maestra. */
(function () {
  'use strict';
  var URL_ = 'https://hadash-sunny.dream-inenglish25.workers.dev/';
  var CODE_KEY = 'hadash-sunny-code', DEV_KEY = 'hadash-device', OK_KEY = 'hadash-access-ok';
  function get(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function device() {
    var d = get(DEV_KEY, '');
    if (!/^[a-z0-9-]{16,64}$/i.test(d)) {
      d = (crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''));
      set(DEV_KEY, d);
    }
    return d;
  }
  var MSG = {
    invalid_code: 'Ese código no es válido. Revísalo o pídeselo a tu profesora.',
    other_device: 'Este código ya está activado en otro equipo. Cada código funciona en un solo equipo. Pídele a tu profesora que lo libere.',
    down: 'No pudimos revisar tu código. Revisa tu conexión a internet e inténtalo otra vez.'
  };
  /* Pregunta al puente. Devuelve {ok, role, error, data}. Si no hay internet: {offline:true}. */
  async function ask(action, code, extra) {
    var body = Object.assign({ action: action, code: String(code || '').trim().toUpperCase(), device: device(), messages: [{ role: 'user', content: action }] }, extra || {});
    var r;
    try { r = await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
    catch (e) { return { offline: true, error: 'down' }; }
    var d = {}; try { d = await r.json(); } catch (e) {}
    if (r.ok) return { ok: true, role: d.role || 'student', data: d };
    if (r.status === 401) return { error: 'invalid_code' };
    if (r.status === 409) return { error: 'other_device' };
    return { offline: true, error: 'down', status: r.status };
  }
  /* Revisión al abrir: solo se niega el paso si el puente dice claramente que no. */
  async function verify() {
    var c = get(CODE_KEY, '');
    if (!c) return { error: 'none' };
    var r = await ask('check', c);
    if (r.error === 'invalid_code' || r.error === 'other_device') { del(CODE_KEY); del(OK_KEY); del('hadash-code'); return r; }
    if (r.ok) set(OK_KEY, r.role);
    return { ok: true, role: r.role || get(OK_KEY, 'student') };
  }
  async function enter(code) {
    var r = await ask('unlock', code);
    if (r.ok) { set(CODE_KEY, String(code).trim().toUpperCase()); set(OK_KEY, r.role); if (r.data && r.data.classCode) set('hadash-code', r.data.classCode); }
    return r;
  }
  window.HadashAccess = { url: URL_, device: device, code: function () { return get(CODE_KEY, ''); }, ask: ask, verify: verify, enter: enter, MSG: MSG };

  /* ---------- Puerta para páginas sueltas (English Lab) ---------- */
  if (document.currentScript && document.currentScript.hasAttribute('data-no-gate')) return;
  var root = document.documentElement;
  var style = document.createElement('style');
  style.textContent = 'html.hz-lock body>*:not(#hz-gate){display:none!important}' +
    '#hz-gate{position:fixed;inset:0;z-index:99999;background:#F4F7FD;display:flex;align-items:center;justify-content:center;padding:18px;font-family:Nunito,system-ui,sans-serif;color:#14213D}' +
    '#hz-gate form{background:#fff;border-radius:22px;padding:26px;max-width:440px;width:100%;box-shadow:0 10px 30px rgba(20,33,61,.12);border-top:6px solid #1673E6}' +
    '#hz-gate h1{font-family:Fredoka,Nunito,sans-serif;font-size:26px;margin:0 0 6px}#hz-gate p{margin:6px 0;color:#5B6478}' +
    '#hz-gate input{width:100%;font-size:22px;padding:12px;border:3px solid #D8E1F0;border-radius:12px;margin:12px 0;letter-spacing:.06em;text-transform:uppercase}' +
    '#hz-gate input:focus{outline:3px solid #F2B705;border-color:#1673E6}' +
    '#hz-gate button{background:#1673E6;color:#fff;border:0;border-radius:30px;padding:12px 24px;font-size:18px;font-weight:800;cursor:pointer}' +
    '#hz-gate .err{color:#B42318;font-weight:700;min-height:1.4em}#hz-gate .ok{color:#127A3A;font-weight:700}';
  (document.head || root).appendChild(style);
  var hasCode = !!get(CODE_KEY, '');
  if (!hasCode) root.classList.add('hz-lock');

  function speak(t) { try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(t); u.lang = 'es-ES'; speechSynthesis.speak(u); } catch (e) {} }
  function gate(msg) {
    root.classList.add('hz-lock');
    var g = document.getElementById('hz-gate'); if (g) g.remove();
    g = document.createElement('div'); g.id = 'hz-gate'; g.setAttribute('role', 'dialog'); g.setAttribute('aria-modal', 'true'); g.setAttribute('aria-labelledby', 'hz-t');
    g.innerHTML = '<form autocomplete="off"><div style="font-size:40px" aria-hidden="true">🦉</div><h1 id="hz-t">Escribe tu código de estudiante</h1>' +
      '<p>Para entrar a Hadash Academy necesitas tu matrícula, por ejemplo <b>HADASH-000000</b>. Solo la escribes una vez en este equipo.</p>' +
      '<label for="hz-c" style="font-weight:800">Código de estudiante</label><input id="hz-c" autocapitalize="characters" spellcheck="false" aria-describedby="hz-e">' +
      '<p class="err" id="hz-e" role="alert">' + (msg || '') + '</p><button type="submit">Entrar</button></form>';
    document.body.appendChild(g);
    var f = g.querySelector('form'), inp = g.querySelector('#hz-c'), e = g.querySelector('#hz-e'), b = g.querySelector('button');
    inp.focus();
    speak(msg || 'Escribe tu código de estudiante y presiona Enter.');
    f.onsubmit = async function (ev) {
      ev.preventDefault(); if (!inp.value.trim()) return;
      b.disabled = true; b.textContent = 'Revisando…'; e.className = 'err'; e.textContent = '';
      var r = await enter(inp.value);
      b.disabled = false; b.textContent = 'Entrar';
      if (r.ok) { e.className = 'ok'; e.textContent = '¡Listo! Bienvenido.'; speak('¡Listo! Bienvenido.'); setTimeout(function () { g.remove(); root.classList.remove('hz-lock'); }, 400); return; }
      e.textContent = MSG[r.error] || MSG.down; speak(e.textContent); inp.select();
    };
  }
  function start() {
    if (!hasCode) return gate();
    verify().then(function (r) { if (r.error) gate(MSG[r.error]); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
