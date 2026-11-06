/*
 * Hadash Academy · Study Island — Sunny bridge (OpenAI)
 * Runs on Cloudflare Workers (free plan). It keeps the OpenAI key secret: the web page
 * never sees it. Study Island sends the conversation here, the bridge asks OpenAI and
 * returns Sunny's answer. It never stores conversations or personal data.
 *
 * If anything fails (no balance, daily limit, OpenAI down), the bridge answers with an
 * error and Study Island switches by itself to the free guided-practice mode.
 *
 * Settings in Cloudflare (Worker → Settings → Variables and Secrets):
 *   OPENAI_KEY      (Secret)  your OpenAI API key (sk-...) — NEVER put it in the web page
 *   ALLOWED_ORIGIN  (Text)    https://hadashacademy.github.io
 *   MODEL           (Text)    optional, default gpt-4.1-mini (fast for voice, low cost)
 *   ACCESS_CODES    (Text)    optional, student codes separated by commas (e.g. LUNA24,SOL25).
 *                             If empty, any student can use Sunny.
 *   DAILY_LIMIT     (Text)    optional, Sunny answers per student per day (default 120)
 * Optional: a KV namespace bound as LIMITS to apply DAILY_LIMIT.
 */
export default {
  async fetch(req, env) {
    const allowed = env.ALLOWED_ORIGIN || 'https://hadashacademy.github.io';
    const cors = { 'Access-Control-Allow-Origin': allowed, 'Vary': 'Origin', 'Cache-Control': 'no-store' };
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' } });
    }
    if (req.method !== 'POST' || (req.headers.get('Origin') || '') !== allowed) {
      return json({ error: 'forbidden' }, 403, cors);
    }
    if (!env.OPENAI_KEY) return json({ error: 'not configured' }, 503, cors);

    let body;
    try { body = await req.json(); } catch (e) { return json({ error: 'bad request' }, 400, cors); }
    const code = String(body.code || '').trim().toUpperCase().slice(0, 40);

    const codes = String(env.ACCESS_CODES || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    if (codes.length && !codes.includes(code)) return json({ error: 'code' }, 401, cors);

    // Only plain text turns, limited in number and size, so nobody can run up the bill.
    const msgs = (Array.isArray(body.messages) ? body.messages : [])
      .filter(m => m && (m.role === 'user' || m.role === 'assistant'))
      .map(m => ({ role: m.role, content: String(m.content || '').slice(0, 6000) }));
    if (!msgs.length || msgs.length > 40) return json({ error: 'bad request' }, 400, cors);

    if (env.LIMITS) {
      const who = code + '|' + (req.headers.get('CF-Connecting-IP') || '');
      const key = new Date().toISOString().slice(0, 10) + ':' + who;
      const used = parseInt((await env.LIMITS.get(key)) || '0', 10);
      if (used >= Number(env.DAILY_LIMIT || 120)) return json({ error: 'daily limit' }, 429, cors);
      await env.LIMITS.put(key, String(used + 1), { expirationTtl: 172800 });
    }

    let r;
    try {
      r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + env.OPENAI_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: env.MODEL || 'gpt-4.1-mini', messages: msgs, max_tokens: 400, temperature: 0.7 }),
      });
    } catch (e) {
      return json({ error: 'openai unreachable' }, 502, cors);
    }
    if (!r.ok) {
      // 429 from OpenAI = no balance left or too many requests → Study Island uses the free mode.
      return json({ error: 'openai ' + r.status }, r.status === 429 ? 503 : 502, cors);
    }
    const d = await r.json().catch(() => null);
    const text = d && d.choices && d.choices[0] && d.choices[0].message ? String(d.choices[0].message.content || '').trim() : '';
    if (!text) return json({ error: 'empty' }, 502, cors);
    return json({ text }, 200, cors);
  },
};

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}
