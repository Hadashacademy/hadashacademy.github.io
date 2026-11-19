/* Hadash Academy · student code check (Study Island, English Lab, Biblioteca, Sunny)
   - Each device gets a random id; the bridge ties every student code to the first device that uses it.
   - With data-gate on the <script> tag, the page stays locked until a valid code is entered.
     After that it opens directly on that device (the code is checked again quietly every 12 h). */
(function () {
  var URL_ = 'https://hadash-sunny.dream-inenglish25.workers.dev/';
  var CODE_KEY = 'hadash-sunny-code', DEV_KEY = 'hadash-device', OK_KEY = 'hadash-ok', RECHECK = 12 * 3600e3;
  function get(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function device() {
    var d = get(DEV_KEY, '');
    if (!/^[a-f0-9]{32}$/.test(d)) {
      var a = new Uint8Array(16); crypto.getRandomValues(a);
      d = Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      set(DEV_KEY, d);
    }
    return d;
  }
  var MSG = {
    invalid_code: 'Ese código no funciona. Revísalo o pídele uno a tu profesora.',
    device_locked: 'Este código ya se está usando en otro equipo. Pídele a tu profesora que lo libere.',
    down: 'No hay conexión. Revisa tu internet y vuelve a intentarlo.'
  };
  /* Checks a code with the bridge. Returns {ok:true, classCode, teacher} or {ok:false, error, message}. */
  async function check(code) {
    code = String(code || '').trim().toUpperCase();
    if (!code) return { ok: false, error: 'invalid_code', message: MSG.invalid_code };
    var r;
    try {
      r = await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlock', code: code, device: device(), messages: [{ role: 'user', content: 'unlock' }] }) });
    } catch (e) { return { ok: false, error: 'down', message: MSG.down }; }
    var d = {}; try { d = await r.json(); } catch (e) {}
    if (r.ok && d.classCode) { set(CODE_KEY, code); set(OK_KEY, Date.now()); return { ok: true, classCode: d.classCode, teacher: !!d.teacher, code: code }; }
    var err = d.error === 'device_locked' ? 'device_locked' : (r.status === 401 ? 'invalid_code' : 'down');
    if (err !== 'down') { del(CODE_KEY); del(OK_KEY); }
    return { ok: false, error: err, message: MSG[err] };
  }
  /* Message for an error answer from the bridge during a Sunny chat (null if not a code problem). */
  function errorMessage(status, error) {
    if (error === 'device_locked') return MSG.device_locked;
    if (status === 401) return MSG.invalid_code;
    return null;
  }
  window.HadashAuth = { url: URL_, device: device, check: check, code: function () { return get(CODE_KEY, ''); },
    errorMessage: errorMessage, forget: function () { del(CODE_KEY); del(OK_KEY); } };

  /* ---------- Gate (English Lab) ---------- */
  var me = document.currentScript;
  if (!me || !me.hasAttribute('data-gate')) return;
  var code = get(CODE_KEY, ''), okAt = +get(OK_KEY, 0);
  if (code && okAt) {
    if (Date.now() - okAt > RECHECK) check(code).then(function (r) { if (!r.ok && r.error !== 'down') location.reload(); });
    return;
  }
  var root = document.documentElement; root.classList.add('hg-lock');
  var st = document.createElement('style');
  st.textContent = 'html.hg-lock body>*:not(#hg){display:none!important}' +
    '#hg{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:linear-gradient(160deg,#fff7e0,#e3f2fd);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1d2b3a}' +
    '#hg .bx{background:#fff;max-width:420px;width:100%;border-radius:22px;padding:28px 24px;box-shadow:0 12px 40px rgba(20,40,80,.18);text-align:center}' +
    '#hg .sun{font-size:56px;line-height:1}#hg h1{margin:8px 0 4px;font-size:1.6rem}#hg p{margin:6px 0 14px;color:#4a5a6a;line-height:1.45}' +
    '#hg input{width:100%;box-sizing:border-box;font-size:1.3rem;padding:12px 14px;border:3px solid #cfd8e3;border-radius:14px;text-align:center;letter-spacing:.04em;text-transform:uppercase}' +
    '#hg input:focus{outline:none;border-color:#f5a623}#hg button{margin-top:12px;width:100%;font-size:1.15rem;font-weight:700;padding:12px;border:0;border-radius:14px;background:#f5a623;color:#1d2b3a;cursor:pointer}' +
    '#hg button:disabled{opacity:.6}#hg .er{color:#c0392b;min-height:1.4em;margin:10px 0 0;font-weight:600}#hg small{display:block;margin-top:14px;color:#7a8794}' +
    '@media (prefers-color-scheme:dark){#hg{background:linear-gradient(160deg,#1b2433,#10202e);color:#eef3f8}#hg .bx{background:#1f2a38}#hg p,#hg small{color:#b7c3cf}#hg input{background:#152030;color:#eef3f8;border-color:#3a4a5c}}';
  (document.head || root).appendChild(st);
  function show(msg) {
    var hg = document.createElement('div'); hg.id = 'hg'; hg.setAttribute('role', 'dialog'); hg.setAttribute('aria-modal', 'true'); hg.setAttribute('aria-labelledby', 'hg-t');
    hg.innerHTML = '<form class="bx" autocomplete="off"><div class="sun" aria-hidden="true">☀️</div><h1 id="hg-t">English Lab</h1>' +
      '<p>Escribe tu código de estudiante de Hadash Academy. Solo lo escribes una vez en este equipo.</p>' +
      '<input id="hg-c" placeholder="HADASH-" aria-label="Código de estudiante" autocapitalize="characters" spellcheck="false" inputmode="text">' +
      '<button type="submit">Entrar</button><p class="er" id="hg-e" role="alert"></p><small>Hadash Academy · Solo para estudiantes</small></form>';
    document.body.appendChild(hg);
    var f = hg.querySelector('form'), inp = hg.querySelector('#hg-c'), er = hg.querySelector('#hg-e'), b = hg.querySelector('button');
    inp.value = code || 'HADASH-'; if (msg) er.textContent = msg; inp.focus();
    f.onsubmit = async function (e) {
      e.preventDefault(); var v = inp.value.replace(/\s+/g, '');
      if (/^\d{6}$/.test(v)) v = 'HADASH-' + v;
      b.disabled = true; b.textContent = 'Revisando…'; er.textContent = '';
      var r = await check(v);
      b.disabled = false; b.textContent = 'Entrar';
      if (r.ok) { hg.remove(); root.classList.remove('hg-lock'); return; }
      er.textContent = r.message; inp.select();
    };
  }
  function boot() {
    if (!code) return show();
    check(code).then(function (r) { if (r.ok) root.classList.remove('hg-lock'); else show(r.message); });
  }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
