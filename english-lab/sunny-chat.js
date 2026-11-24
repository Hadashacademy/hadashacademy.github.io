/* Hadash Academy · English Lab — Sunny con IA (Azure OpenAI a través del puente de Cloudflare)
   Añade un botón "Talk with Sunny" en las páginas del English Lab. El estudiante escribe su
   código personal (HADASH-000000) una sola vez; el mismo código sirve en Study Island.
   Niveles A1 a C1. Sunny conversa, corrige con cariño y, al final, da consejos. */
(function () {
  const SUNNY_URL = 'https://hadash-sunny.dream-inenglish25.workers.dev/';
  const CODE_KEY = 'hadash-sunny-code', LEVEL_KEY = 'hadash-lab-level', TIP_KEY = 'hadash-sunny-tip', PAUSE_KEY = 'hadash-sunny-pause', VOICE_KEY = 'hadash-sunny-voice';
  const PAUSES = [2, 3, 5]; // segundos de silencio antes de enviar lo que dijo el estudiante
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  const LEVELS = [
    { id: 'A1', es: 'Principiante', rule: 'Level A1 (beginner). Use very simple, common words and the present tense. Sentences of 5 to 8 words. Ask easy yes/no or one-word questions. ' },
    { id: 'A2', es: 'Básico', rule: 'Level A2 (elementary). Use everyday words, present, simple past and "going to". Short sentences. Ask simple open questions. ' },
    { id: 'B1', es: 'Intermedio', rule: 'Level B1 (intermediate). Talk naturally about experiences, plans and opinions. You may use a common idiom and explain it simply. ' },
    { id: 'B2', es: 'Intermedio alto', rule: 'Level B2 (upper intermediate). Talk naturally with richer vocabulary, phrasal verbs and some idioms. Encourage longer answers and opinions with reasons. ' },
    { id: 'C1', es: 'Avanzado', rule: 'Level C1 (advanced). Speak like a natural American English speaker: idioms, collocations, nuance, some everyday slang (explain it). Challenge the student to be precise and fluent. In corrections, include more natural ways to say things.' }
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
Language quality: you are a real American English teacher. Every English sentence you write, especially corrections and example sentences, must be correct and sound natural to a native speaker from the United States. Use everyday American words and spelling (apartment, vacation, cell phone, color).
Before you correct anything, check that the student's sentence is really wrong. If it is correct and natural, do not correct it: praise it. Never "fix" correct English and never suggest awkward or unnatural sentences.
When you correct, give the most natural way a native speaker would say it, for example "I'd like to go to the supermarket" or "I would like to go", never "I'm going to like to go". To talk about wishes use "I'd like to" or "I want to"; use "going to" only for plans.
After a correction, do not repeat the student's sentence as if it were about you; react to what they said (for example "That sounds fun!") and continue. Choose the correction that fits your question: if you asked "What would you like to do?", the natural answer uses "I'd like to".
Never ask the student to repeat or build a sentence that is incorrect or that a native speaker would not say. If the speech recognition text looks strange or incomplete, ask the student to say it again instead of correcting it.
Reply format. Write your answer in these labeled lines, each label at the start of its own line:
FIX: only if the student made a real mistake: the full correct sentence, in natural English. Leave this line out if there was no mistake.
TIP: only together with FIX: one short explanation of the mistake. ${tipRule(li)}
SAY: what you say to continue the conversation, in English only: react to what the student said, praise good answers, and end with exactly one question. Keep it to 1 to 3 short sentences because it will be read aloud.
${li < 2 ? 'OPTIONS: three short possible answers to your question, separated by " | ". All three must be correct, natural English that a student at this level can say, and different from each other. Do not number them.\n' : ''}Never mix Spanish and English in the same line. Correct only one thing per turn. Plain text only: no lists, no markdown, no emojis. Never discuss romantic, sexual, violent or adult topics.
Now start: greet the student, say you are Sunny, and ask your first easy question (use the SAY line).`;
  }
  function tipLang(li) { const t = store.get(TIP_KEY, null); return t || (li < 2 ? 'es' : 'en'); }
  function tipRule(li) {
    return tipLang(li) === 'es'
      ? 'Write the TIP completely in simple Spanish, without any English words (the FIX line already shows the English), for example: "En pasado, el verbo cambia de forma."'
      : 'Write the TIP in very simple English, for example: "For the past, we say went, not go."';
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
  .sn-fix{background:#E8F7EC;border-left:5px solid #1E9E45;align-self:stretch;max-width:100%}
  .sn-fix b{color:#1E7A38}.sn-tip{display:block;margin-top:4px;color:#465375;font-size:15px}
  .sn-opts{display:flex;flex-direction:column;gap:6px;align-self:stretch}
  .sn-opt{text-align:left;border:2px solid #1673E6;background:#fff;color:#0B4FB3;border-radius:14px;padding:8px 12px;font:700 15px 'Nunito',sans-serif;cursor:pointer}
  .sn-opt:hover,.sn-opt:focus-visible{background:#EAF2FF}
  .sn-opt span{display:inline-block;min-width:22px;color:#14213D}
  .sn-set{display:flex;gap:6px;flex-wrap:wrap}.sn-set .sn-btn{padding:6px 11px;font-size:13px}
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
      <p style="margin:0">Es tu matrícula de estudiante, por ejemplo <b>HADASH-000000</b>. Solo la escribes una vez en este equipo.</p>
      <p class="sn-st sn-err" role="alert">${msg ? esc(msg) : ''}</p>`,
      `<form class="sn-row" id="sn-cf" autocomplete="off"><input class="sn-in" id="sn-code" aria-label="Código de Sunny" autocapitalize="characters" spellcheck="false" placeholder="HADASH-…"><button class="sn-btn sn-pri" type="submit">Entrar</button></form>`);
    const inp = dlg.querySelector('#sn-code'); inp.focus();
    dlg.querySelector('#sn-cf').onsubmit = e => {
      e.preventDefault();
      const c = inp.value.trim().toUpperCase(); if (!c) return;
      if (!window.HadashAccess) { store.set(CODE_KEY, c); return chatScreen(); }
      window.HadashAccess.enter(c).then(r => r.ok ? chatScreen() : codeScreen(window.HadashAccess.MSG[r.error] || window.HadashAccess.MSG.down));
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
       <button class="sn-btn" type="button" id="sn-new">↺ New</button></div>
       <div class="sn-set"><button class="sn-btn" type="button" id="sn-tipl"></button><button class="sn-btn" type="button" id="sn-pause"></button><button class="sn-btn" type="button" id="sn-voice"></button></div>`);
    dlg.querySelector('#sn-tipl').onclick = () => { store.set(TIP_KEY, tipLang(level) === 'es' ? 'en' : 'es'); drawSet(); start(); };
    dlg.querySelector('#sn-pause').onclick = () => { const i = (PAUSES.indexOf(pauseS()) + 1) % PAUSES.length; store.set(PAUSE_KEY, PAUSES[i]); drawSet(); };
    dlg.querySelector('#sn-voice').onclick = nextVoice;
    drawSet();
    dlg.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { level = +b.dataset.l; store.set(LEVEL_KEY, level); start(); });
    dlg.querySelector('#sn-tf').onsubmit = e => { e.preventDefault(); const i = dlg.querySelector('#sn-typed'); const v = i.value.trim(); if (!v) return; i.value = ''; student(v); };
    dlg.querySelector('#sn-mic').onclick = toggleMic;
    dlg.querySelector('#sn-rep').onclick = () => { const a = [...turns].reverse().find(t => t.role === 'assistant'); if (a) speakReply(parseReply(a.content)); };
    dlg.querySelector('#sn-fin').onclick = tips;
    dlg.querySelector('#sn-new').onclick = start;
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const m = dlg.querySelector('#sn-mic'); m.disabled = true; m.title = 'Usa Google Chrome para hablar con el micrófono';
    }
    start();
  }

  function pauseS() { const v = store.get(PAUSE_KEY, 3); return PAUSES.includes(v) ? v : 3; }
  function drawSet() {
    const t = dlg.querySelector('#sn-tipl'), p = dlg.querySelector('#sn-pause'), v = dlg.querySelector('#sn-voice'); if (!t) return;
    t.textContent = tipLang(level) === 'es' ? '💡 Explicaciones: Español' : '💡 Explanations: English';
    p.textContent = '⏱ Pausa para pensar: ' + pauseS() + ' s';
    const en = bestVoice('en'); v.textContent = '🔊 Voz: ' + (en ? en.name.replace(/Microsoft |Google |Online|\(Natural\)|- English.*$/g, '').trim().slice(0, 22) : 'del navegador');
    v.title = 'Cambia la voz de Sunny. Las voces más naturales están en Microsoft Edge ("Natural").';
  }
  function status(t, err) { const s = dlg.querySelector('#sn-st'); if (s) { s.textContent = t; s.classList.toggle('sn-err', !!err); } }
  function bubble(who, text) {
    const bd = dlg.querySelector('#sn-bd'); if (!bd) return;
    const d = document.createElement('div'); d.className = 'sn-msg ' + (who === 'me' ? 'sn-me' : 'sn-ai');
    d.lang = 'en'; d.textContent = (who === 'me' ? 'You: ' : 'Sunny: ') + text;
    const st = dlg.querySelector('#sn-st'); bd.insertBefore(d, st); d.scrollIntoView({ block: 'nearest' });
  }

  async function ask(messages) {
    let r;
    try { r = await fetch(SUNNY_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: store.get(CODE_KEY, ''), device: window.HadashAccess ? window.HadashAccess.device() : '', messages })
    }); } catch (e) { throw { code: 'down', det: 'sin conexión con el puente' }; }
    if (r.status === 401) { store.del(CODE_KEY); throw { code: 'bad_code' }; }
    if (r.status === 409) { store.del(CODE_KEY); throw { code: 'other_device' }; }
    if (!r.ok) { let det = 'HTTP ' + r.status; try { const j = await r.json(); if (j.error) det = j.error; } catch (e) {} throw { code: 'down', det }; }
    const d = await r.json();
    const t = String(d.text || d.reply || '').replace(/[*#`_]/g, '').trim();
    if (!t) throw { code: 'down' };
    return t;
  }
  function fail(e) {
    if (e && e.code === 'bad_code') return codeScreen('Ese código no funciona. Revísalo o pídele uno nuevo a tu profesora.');
    if (e && e.code === 'other_device') return codeScreen('Este código ya está activado en otro equipo. Pídele a tu profesora que lo libere.');
    status('Sunny no pudo responder. Revisa tu internet y vuelve a intentarlo.' + (e && e.det ? ' (Detalle: ' + e.det + ')' : ''), true);
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
      turns.push({ role: 'assistant', content: t });
      const r = parseReply(t); show(r);
      status(r.options.length ? 'Toca una respuesta, dila con 🎤 Speak o escribe la tuya.' : 'Presiona 🎤 Speak o escribe tu respuesta.');
      speakReply(r);
    } catch (e) { fail(e); }
    busy = false;
  }
  /* Respuesta con etiquetas: FIX (corrección en inglés), TIP (explicación), SAY (conversación), OPTIONS (A1 y A2). */
  function parseReply(t) {
    const r = { fix: '', tip: '', say: '', options: [] }; let cur = null;
    t.split(/\n+/).forEach(line => {
      const m = line.match(/^\s*(FIX|TIP|SAY|OPTIONS)\s*:\s*(.*)$/i);
      if (m) { cur = m[1].toUpperCase(); line = m[2]; }
      line = line.trim(); if (!line) return;
      if (cur === 'FIX') r.fix += (r.fix ? ' ' : '') + line;
      else if (cur === 'TIP') r.tip += (r.tip ? ' ' : '') + line;
      else if (cur === 'OPTIONS') r.options.push(...line.split('|').map(x => x.replace(/^\s*([a-c1-3][.)]|[-•])\s*/i, '').trim()).filter(Boolean));
      else r.say += (r.say ? ' ' : '') + line;
    });
    r.fix = r.fix.replace(/^["“]|["”]$/g, ''); r.options = r.options.slice(0, 3);
    if (!r.say && !r.fix) r.say = t;
    return r;
  }
  function show(r) {
    const bd = dlg.querySelector('#sn-bd'), st = dlg.querySelector('#sn-st'); if (!bd) return;
    dlg.querySelectorAll('.sn-opts').forEach(o => o.remove());
    if (r.fix) {
      const d = document.createElement('div'); d.className = 'sn-msg sn-fix';
      d.innerHTML = '✅ <b lang="en">' + esc(r.fix) + '</b>' + (r.tip ? '<span class="sn-tip" lang="' + tipLang(level) + '">💡 ' + esc(r.tip) + '</span>' : '');
      bd.insertBefore(d, st);
    }
    if (r.say) bubble('ai', r.say);
    if (r.options.length) {
      const box = document.createElement('div'); box.className = 'sn-opts'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Elige una respuesta');
      r.options.forEach((o, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'sn-opt'; b.lang = 'en';
        b.innerHTML = '<span>' + 'ABC'[i] + '.</span> ' + esc(o);
        b.onclick = () => student(o);
        box.appendChild(b);
      });
      bd.insertBefore(box, st);
    }
    st && st.scrollIntoView({ block: 'nearest' });
  }
  function student(text) {
    if (busy) return;
    if (listening || rec) stopMic();
    stopSpeak(); dlg.querySelectorAll('.sn-opts').forEach(o => o.remove()); bubble('me', text); turns.push({ role: 'user', content: text }); reply();
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
      speakChunks(t.split(/("[^"]*"|“[^”]*”)/).filter(x => x.trim()).map(x => /^["“]/.test(x) ? [x.slice(1, -1), 'en'] : [x, 'es']));
    } catch (e) { fail(e); }
    busy = false;
  }

  /* ---------- voz ---------- */
  /* Se usa la voz más natural del equipo (en Edge, las "Natural"; en Chrome, las de Google).
     La estudiante puede cambiarla con 🔊 Voz. Cada parte (corrección, explicación, conversación)
     se lee completa con una sola voz: nunca se cambia de idioma a mitad de una oración. */
  function vq(v) {
    const n = v.name + ' ' + (v.voiceURI || ''), l = (v.lang || '').replace('_', '-').toLowerCase();
    let s = 1;
    if (/natural|neural/i.test(n)) s = 6; else if (/online/i.test(n)) s = 5;
    else if (/google|premium|enhanced|siri/i.test(n)) s = 4;
    else if (/samantha|ava|allison|karen|moira|paulina|monica/i.test(n)) s = 3;
    if (/zira|david|mark|hazel|helena|sabina|espeak|compact/i.test(n)) s = 0;
    if (/\b(female|aria|jenny|ava|emma|michelle|samantha|allison|google us english|paulina|dalia|elena|sabina|monica)\b/i.test(n)) s += 0.3;
    if (/\b(guy|andrew|brian|eric|christopher|roger|steffan|daniel|alex|jorge|juan|tony)\b/i.test(n)) s -= 0.3;
    if (['en-us', 'es-us', 'es-mx', 'es-419', 'es-do'].includes(l)) s += 0.5;
    return s;
  }
  function voicesFor(lang) {
    return (speechSynthesis.getVoices() || []).filter(v => (v.lang || '').toLowerCase().startsWith(lang)).sort((a, b) => vq(b) - vq(a));
  }
  function bestVoice(lang) {
    const vs = voicesFor(lang); if (!vs.length) return null;
    if (lang === 'en') { const want = store.get(VOICE_KEY, ''); const v = want && vs.find(x => x.name === want); if (v) return v; }
    return vs[0];
  }
  function nextVoice() {
    const vs = voicesFor('en').filter(v => vq(v) >= 3).slice(0, 8); const all = vs.length ? vs : voicesFor('en').slice(0, 8);
    if (!all.length) return;
    const cur = bestVoice('en'), i = all.findIndex(v => cur && v.name === cur.name);
    const nx = all[(i + 1) % all.length]; store.set(VOICE_KEY, nx.name); drawSet();
    speakChunks([['Hi! I am Sunny. Do you like this voice?', 'en']]);
  }
  try { speechSynthesis.onvoiceschanged = () => drawSet(); } catch (e) {}
  // junta oraciones en bloques de hasta ~180 letras: suena más fluido y Chrome no corta textos largos
  function chunks(t) {
    const out = []; let cur = '';
    (t.match(/[^.!?]+[.!?]*/g) || [t]).forEach(x => { x = x.trim(); if (!x) return; if ((cur + ' ' + x).length > 180 && cur) { out.push(cur); cur = x; } else cur = cur ? cur + ' ' + x : x; });
    if (cur) out.push(cur); return out;
  }
  function speakChunks(list) {
    try {
      speechSynthesis.cancel();
      const en = bestVoice('en'), es = bestVoice('es');
      list.forEach(([t, l]) => chunks(t.replace(/[*_#>`"“”]/g, '')).forEach(c => {
        const u = new SpeechSynthesisUtterance(c);
        u.lang = l === 'en' ? 'en-US' : 'es-US';
        const v = l === 'en' ? en : es; if (v) u.voice = v;
        const natural = v && vq(v) >= 5;
        u.rate = l === 'en' ? (level < 2 ? 0.92 : 1) * (natural ? 1 : 0.97) : 1;
        u.pitch = 1;
        speechSynthesis.speak(u);
      }));
    } catch (e) {}
  }
  function speakReply(r) {
    const list = [];
    if (r.fix) list.push(['You can say: ' + r.fix, 'en']);
    if (r.tip) list.push([r.tip, tipLang(level)]);
    if (r.say) list.push([r.say, 'en']);
    speakChunks(list);
  }
  function speak(text, lang) { speakChunks([[text.replace(/[()]/g, ''), lang && lang.startsWith('es') ? 'es' : 'en']]); }
  function stopSpeak() { try { speechSynthesis.cancel(); } catch (e) {} }

  /* ---------- micrófono ---------- */
  /* Escucha continua: no corta cuando el estudiante hace una pausa corta para pensar.
     Envía cuando hay silencio por los segundos de "Pausa para pensar", o al presionar ⏹ Send. */
  let heard = '', silenceT = null, sendOnEnd = false;
  function toggleMic() { listening ? finishMic() : startMic(); }
  function micBtn(on) { const m = dlg.querySelector('#sn-mic'); if (m) { m.setAttribute('aria-pressed', String(on)); m.textContent = on ? '⏹ Send · Enviar' : '🎤 Speak'; } }
  function startMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR || busy) return;
    stopSpeak(); heard = ''; sendOnEnd = false; listening = true; micBtn(true);
    status('Te escucho... habla en inglés. Puedes hacer pausas; envío cuando termines.');
    runRec(SR);
  }
  function runRec(SR) {
    const r = new SR(); rec = r;
    r.lang = 'en-US'; r.continuous = true; r.interimResults = true; r.maxAlternatives = 1;
    let base = heard;
    r.onresult = e => {
      let fin = '', mid = '';
      for (let i = 0; i < e.results.length; i++) { const x = e.results[i][0].transcript; e.results[i].isFinal ? fin += x : mid += x; }
      heard = (base + ' ' + fin).replace(/\s+/g, ' ').trim();
      const show = (heard + ' ' + mid).trim(); const inp = dlg.querySelector('#sn-typed'); if (inp) inp.value = show;
      if (show) status('Te escucho: "' + show + '"');
      clearTimeout(silenceT); silenceT = setTimeout(() => { if (listening) finishMic(); }, pauseS() * 1000);
    };
    r.onerror = e => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { listening = false; micBtn(false); status('Permite el micrófono en el navegador para hablar con Sunny.', true); }
    };
    r.onend = () => {
      if (rec !== r) return;
      if (listening && !sendOnEnd) { try { runRec(SR); } catch (e) { finishMic(); } return; } // Chrome se detiene solo: seguimos escuchando
      deliver();
    };
    try { r.start(); } catch (e) { listening = false; micBtn(false); }
  }
  function finishMic() {
    clearTimeout(silenceT); if (!listening) return;
    sendOnEnd = true; listening = false; micBtn(false);
    try { rec && rec.stop(); } catch (e) { deliver(); }
    setTimeout(() => { if (rec) deliver(); }, 1500);
  }
  function deliver() {
    rec = null; const inp = dlg.querySelector('#sn-typed');
    const t = (heard || (inp && inp.value) || '').trim(); heard = '';
    if (inp) inp.value = '';
    if (t) student(t); else status('No te escuché. Presiona 🎤 Speak y habla otra vez.', true);
  }
  function stopMic() { clearTimeout(silenceT); listening = false; sendOnEnd = false; heard = ''; const r = rec; rec = null; try { r && r.abort(); } catch (e) {} micBtn(false); }

  function open() {
    dlg.hidden = false; fab.hidden = true;
    store.get(CODE_KEY, '') ? chatScreen() : codeScreen();
  }
  function close() { stopMic(); stopSpeak(); dlg.hidden = true; fab.hidden = false; fab.focus(); }
  fab.onclick = open;
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !dlg.hidden) { e.stopPropagation(); close(); } }, true);
})();
