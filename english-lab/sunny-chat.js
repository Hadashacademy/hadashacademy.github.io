/* Hadash Academy · English Lab — Sunny con IA (Azure OpenAI a través del puente de Cloudflare)
   Añade un botón "Talk with Sunny" en las páginas del English Lab. El estudiante escribe su
   código personal (HADASH-E2025xx) una sola vez; el mismo código sirve en Study Island.
   Niveles A1 a C1. Sunny conversa, corrige con cariño y, al final, da consejos. */
(function () {
  const SUNNY_URL = 'https://hadash-sunny.dream-inenglish25.workers.dev/';
  const CODE_KEY = 'hadash-sunny-code', LEVEL_KEY = 'hadash-lab-level';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  const LEVELS = [
    { id: 'A1', es: 'Principiante', rule: 'Level A1 (beginner). Use very simple, common words and the present tense. Sentences of 5 to 8 words. Ask easy yes/no or one-word questions. Give corrections in very simple Spanish.' },
    { id: 'A2', es: 'Básico', rule: 'Level A2 (elementary). Use everyday words, present, simple past and "going to". Short sentences. Ask simple open questions. Give corrections in simple Spanish.' },
    { id: 'B1', es: 'Intermedio', rule: 'Level B1 (intermediate). Talk naturally about experiences, plans and opinions. You may use a common idiom and explain it simply. Give corrections in simple English, with a short Spanish hint if needed.' },
    { id: 'B2', es: 'Intermedio alto', rule: 'Level B2 (upper intermediate). Talk naturally with richer vocabulary, phrasal verbs and some idioms. Encourage longer answers and opinions with reasons. Give corrections in English.' },
    { id: 'C1', es: 'Avanzado', rule: 'Level C1 (advanced). Speak like a natural American English speaker: idioms, collocations, nuance, some everyday slang (explain it). Challenge the student to be precise and fluent. Give corrections in English, including more natural ways to say things.' }
  ];

  function defaultLevel() {
    const p = location.pathname, h = location.hash;
    if (p.includes('/teen/')) return 2;
    if (h.includes('junior') || /#u1\d\d/.test(h)) return 1;
    return 0;
  }
  let level = store.get(LEVEL_KEY, defaultLevel());

  function pageTopic() {
    const el = document.querySelector('.hero h2') || document.querySelector('main h2') || document.querySelector('h1');
    const scene = document.querySelector('.scene');
    const t = el ? el.textContent.trim() : '';
    return (t + (scene ? ' — ' + scene.textContent.trim() : '')).slice(0, 300);
  }

  function rules(li, topic) {
    return `You are Sunny, a warm and patient English conversation partner at Hadash Academy. Your student speaks Spanish and is practicing English by voice (their words come from speech recognition, so ignore punctuation and capital letters).
${LEVELS[li].rule}
${topic ? `Talk about this lesson topic from the student's book: "${topic}". You may also follow the student if they want to talk about something else.` : 'Talk about any everyday topic the student likes.'}
Rules: Keep each answer short (2 to 4 sentences) because it will be read aloud. If the student makes a mistake, first say the correct sentence, then explain briefly inside parentheses, and invite them to say it again. Praise good answers. Always end with one question. Plain text only: no lists, no markdown, no emojis. Never discuss romantic, sexual, violent or adult topics.
Now start: greet the student, say you are Sunny, and ask your first easy question.`;
  }

  /* ---------- estilos ---------- */
  const css = document.createElement('style');
  css.textContent = `
  .sn-fab{position:fixed;right:18px;bottom:18px;z-index:9998;background:#FFC400;color:#14213D;font:700 17px 'Fredoka','Nunito',system-ui,sans-serif;border:0;border-radius:40px;padding:12px 20px;box-shadow:0 6px 18px rgba(20,33,61,.25);cursor:pointer}
  .sn-fab:focus-visible{outline:3px solid #1673E6;outline-offset:3px}
  .sn-dlg{position:fixed;inset:auto 12px 12px auto;width:min(420px,calc(100vw - 24px));height:min(640px,calc(100vh - 24px));z-index:9999;background:#fff;color:#14213D;border-radius:22px;box-shadow:0 12px 40px rgba(20,33,61,.3);display:flex;flex-direction:column;overflow:hidden;font-family:'Nunito',system-ui,sans-serif}
  .sn-dlg[hidden]{display:none}
  .sn-hd{background:linear-gradient(120deg,#0B4FB3,#1673E6);color:#fff;padding:12px 14px;display:flex;align-items:center;gap:10px}
  .sn-hd b{font:600 19px 'Fredoka','Nunito',sans-serif;flex:1}
  .sn-x{background:rgba(255,255,255,.2);color:#fff;border:0;border-radius:50%;width:34px;height:34px;font-size:18px;cursor:pointer}
  .sn-bd{flex:1;overflow:auto;padding:12px 14px;display:flex;flex-direction:column;gap:10px;background:#F4F7FF}
  .sn-lv{display:flex;gap:6px;flex-wrap:wrap}
  .sn-lv button{border:0;border-radius:16px;padding:6px 11px;font:700 14px 'Nunito',sans-serif;background:#E3E9F6;color:#14213D;cursor:pointer}
  .sn-lv button[aria-pressed="true"]{background:#14213D;color:#fff}
  .sn-msg{border-radius:16px;padding:9px 12px;max-width:88%;line-height:1.4;font-size:16px}
  .sn-ai{background:#fff;align-self:flex-start;box-shadow:0 1px 0 #DDE3F0}
  .sn-me{background:#FFF3C4;align-self:flex-end}
  .sn-st{font-size:14px;color:#465375;font-weight:700}
  .sn-err{color:#B3261E}
  .sn-ft{padding:10px;border-top:1px solid #DDE3F0;display:flex;flex-direction:column;gap:8px;background:#fff}
  .sn-row{display:flex;gap:8px;flex-wrap:wrap}
  .sn-in{flex:1 1 160px;min-width:0;font:inherit;font-size:16px;border:2px solid #DDE3F0;border-radius:12px;padding:9px 11px}
  .sn-btn{border:0;border-radius:24px;padding:9px 15px;font:700 15px 'Nunito',sans-serif;cursor:pointer;background:#EEF2FA;color:#14213D}
  .sn-pri{background:#1673E6;color:#fff}.sn-mic{background:#E53935;color:#fff}.sn-mic[aria-pressed="true"]{background:#1E9E45}
  @media print{.sn-fab,.sn-dlg{display:none!important}}`;
  document.head.appendChild(css);

  /* ---------- interfaz ---------- */
  const fab = document.createElement('button');
  fab.className = 'sn-fab'; fab.type = 'button';
  fab.innerHTML = '☀️ Talk with Sunny';
  fab.setAttribute('aria-label', 'Talk with Sunny · Habla con Sunny');
  const dlg = document.createElement('section');
  dlg.className = 'sn-dlg'; dlg.hidden = true;
  dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-label', 'Sunny, English tutor');
  document.body.append(fab, dlg);

  let turns = [], busy = false, rec = null, listening = false;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function shell(bodyHtml, footHtml) {
    dlg.innerHTML = `<div class="sn-hd"><span aria-hidden="true" style="font-size:24px">☀️</span><b>Sunny · English tutor</b><button class="sn-x" type="button" aria-label="Cerrar">✕</button></div>
      <div class="sn-bd" id="sn-bd">${bodyHtml}</div><div class="sn-ft">${footHtml}</div>`;
    dlg.querySelector('.sn-x').onclick = close;
  }

  function codeScreen(msg) {
    shell(`<p style="margin:0;font-weight:800">Escribe tu código de Sunny</p>
      <p style="margin:0">Tu profesora te da un código personal, por ejemplo <b>HADASH-E202501</b>. Solo lo escribes una vez en esta computadora.</p>
      <p class="sn-st sn-err" role="alert">${msg ? esc(msg) : ''}</p>`,
      `<form class="sn-row" id="sn-cf" autocomplete="off"><input class="sn-in" id="sn-code" aria-label="Código de Sunny" autocapitalize="characters" spellcheck="false" placeholder="HADASH-E2025..."><button class="sn-btn sn-pri" type="submit">Entrar</button></form>`);
    const inp = dlg.querySelector('#sn-code'); inp.focus();
    dlg.querySelector('#sn-cf').onsubmit = e => {
      e.preventDefault();
      const c = inp.value.trim().toUpperCase(); if (!c) return;
      store.set(CODE_KEY, c); chatScreen();
    };
  }

  function chatScreen() {
    const lv = LEVELS.map((l, i) => `<button type="button" data-l="${i}" aria-pressed="${i === level}">${l.id} · ${l.es}</button>`).join('');
    shell(`<div class="sn-lv" role="group" aria-label="Tu nivel">${lv}</div>
      <p class="sn-st" id="sn-st" role="status" aria-live="polite">Sunny está pensando...</p>`,
      `<form class="sn-row" id="sn-tf" autocomplete="off"><input class="sn-in" id="sn-typed" lang="en" aria-label="Escribe en inglés" placeholder="Type in English..."><button class="sn-btn sn-pri" type="submit">Send</button></form>
       <div class="sn-row"><button class="sn-btn sn-mic" type="button" id="sn-mic" aria-pressed="false">🎤 Speak</button>
       <button class="sn-btn" type="button" id="sn-rep">🔁 Again</button>
       <button class="sn-btn" type="button" id="sn-fin">⭐ Tips · Consejos</button>
       <button class="sn-btn" type="button" id="sn-new">↺ New</button></div>`);
    dlg.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { level = +b.dataset.l; store.set(LEVEL_KEY, level); start(); });
    dlg.querySelector('#sn-tf').onsubmit = e => { e.preventDefault(); const i = dlg.querySelector('#sn-typed'); const v = i.value.trim(); if (!v) return; i.value = ''; student(v); };
    dlg.querySelector('#sn-mic').onclick = toggleMic;
    dlg.querySelector('#sn-rep').onclick = () => { const a = [...turns].reverse().find(t => t.role === 'assistant'); if (a) speak(a.content); };
    dlg.querySelector('#sn-fin').onclick = tips;
    dlg.querySelector('#sn-new').onclick = start;
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const m = dlg.querySelector('#sn-mic'); m.disabled = true; m.title = 'Usa Google Chrome para hablar con el micrófono';
    }
    start();
  }

  function status(t, err) { const s = dlg.querySelector('#sn-st'); if (s) { s.textContent = t; s.classList.toggle('sn-err', !!err); } }
  function bubble(who, text) {
    const bd = dlg.querySelector('#sn-bd'); if (!bd) return;
    const d = document.createElement('div'); d.className = 'sn-msg ' + (who === 'me' ? 'sn-me' : 'sn-ai');
    d.lang = 'en'; d.textContent = (who === 'me' ? 'You: ' : 'Sunny: ') + text;
    const st = dlg.querySelector('#sn-st'); bd.insertBefore(d, st); d.scrollIntoView({ block: 'nearest' });
  }

  async function ask(messages) {
    const r = await fetch(SUNNY_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: store.get(CODE_KEY, ''), messages })
    });
    if (r.status === 401) { store.del(CODE_KEY); throw { code: 'bad_code' }; }
    if (!r.ok) throw { code: 'down' };
    const d = await r.json();
    const t = String(d.text || d.reply || '').replace(/[*#`_]/g, '').trim();
    if (!t) throw { code: 'down' };
    return t;
  }
  function fail(e) {
    if (e && e.code === 'bad_code') return codeScreen('Ese código no funciona. Revísalo o pídele uno nuevo a tu profesora.');
    status('Sunny no pudo responder. Revisa tu internet y vuelve a intentarlo.', true);
  }

  async function start() {
    stopMic(); stopSpeak();
    dlg.querySelectorAll('.sn-msg').forEach(m => m.remove());
    dlg.querySelectorAll('[data-l]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.l === level));
    turns = [{ role: 'user', content: rules(level, pageTopic()) }];
    await reply();
  }
  async function reply() {
    busy = true; status('Sunny está pensando...');
    try {
      const t = await ask([turns[0], ...turns.slice(1).slice(-16)]);
      turns.push({ role: 'assistant', content: t }); bubble('ai', t);
      status('Presiona 🎤 Speak o escribe tu respuesta.');
      speak(t);
    } catch (e) { fail(e); }
    busy = false;
  }
  function student(text) {
    if (busy) return;
    stopSpeak(); bubble('me', text); turns.push({ role: 'user', content: text }); reply();
  }
  async function tips() {
    const said = turns.filter(t => t.role === 'user').length - 1;
    if (said < 1) { status('Primero conversa un poco con Sunny.', true); return; }
    if (busy) return; busy = true; stopMic(); stopSpeak(); status('Preparando tus consejos...');
    const transcript = turns.slice(1).map(t => (t.role === 'user' ? 'Student: ' : 'Sunny: ') + t.content).join('\n').slice(-8000);
    const prompt = `You are an English teacher at Hadash Academy. Below is a practice conversation between a Spanish-speaking student (level ${LEVELS[level].id}) and Sunny. The student's lines come from speech recognition, so ignore punctuation and capital letters.
Write feedback for the student IN SPANISH, as plain sentences (no lists, no markdown, no emojis). Maximum 6 sentences: one warm sentence, two things the student did well, two things to improve with the correct English in double quotes, and one short motivating sentence.

Conversation:
${transcript}`;
    try {
      const t = await ask([{ role: 'user', content: prompt }]);
      bubble('ai', t); status('Estos son tus consejos. Presiona ↺ New para otra conversación.');
      speak(t, 'es-ES');
    } catch (e) { fail(e); }
    busy = false;
  }

  /* ---------- voz ---------- */
  function speak(text, lang) {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang || 'en-US'; u.rate = level < 2 ? 0.85 : 0.95;
      const vs = speechSynthesis.getVoices().filter(v => v.lang && v.lang.startsWith(u.lang.slice(0, 2)));
      const f = vs.find(v => /female|samantha|zira|jenny|aria|google us english/i.test(v.name)) || vs[0];
      if (f) u.voice = f;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  function stopSpeak() { try { speechSynthesis.cancel(); } catch (e) {} }
  function toggleMic() { listening ? stopMic() : startMic(); }
  function startMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR || busy) return;
    stopSpeak();
    rec = new SR(); rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onresult = e => { const t = e.results[0][0].transcript.trim(); if (t) student(t); };
    rec.onerror = e => { if (e.error === 'not-allowed') status('Permite el micrófono en Chrome para hablar con Sunny.', true); };
    rec.onend = () => { listening = false; const m = dlg.querySelector('#sn-mic'); if (m) { m.setAttribute('aria-pressed', 'false'); m.textContent = '🎤 Speak'; } };
    try { rec.start(); listening = true; status('Te escucho... habla en inglés.');
      const m = dlg.querySelector('#sn-mic'); m.setAttribute('aria-pressed', 'true'); m.textContent = '⏹ Stop'; } catch (e) {}
  }
  function stopMic() { try { rec && rec.abort(); } catch (e) {} rec = null; listening = false; }

  function open() {
    dlg.hidden = false; fab.hidden = true;
    store.get(CODE_KEY, '') ? chatScreen() : codeScreen();
  }
  function close() { stopMic(); stopSpeak(); dlg.hidden = true; fab.hidden = false; fab.focus(); }
  fab.onclick = open;
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !dlg.hidden) { e.stopPropagation(); close(); } }, true);
})();
