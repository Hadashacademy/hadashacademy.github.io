/*
 * Hadash Academy · English Lab — token server for the Pro pronunciation tutor
 * Runs on Cloudflare Workers (free plan). It keeps the Azure key secret and gives
 * the Lab a temporary 10-minute pass (token). It never stores audio or personal data.
 *
 * Settings in Cloudflare (Worker → Settings → Variables and Secrets):
 *   AZURE_KEY       (Secret)  Key 1 of your Azure "Speech" resource — NEVER put it in the web page
 *   AZURE_REGION    (Text)    region of the resource, e.g.  eastus
 *   ALLOWED_ORIGIN  (Text)    https://hadashacademy.github.io
 *   DAILY_LIMIT     (Text)    optional, passes per student per day (default 15 ≈ 2 hours)
 * Optional: a KV namespace bound as LIMITS to apply DAILY_LIMIT.
 */
export default {
  async fetch(req, env) {
    const allowed = env.ALLOWED_ORIGIN || 'https://hadashacademy.github.io';
    const cors = { 'Access-Control-Allow-Origin': allowed, 'Vary': 'Origin', 'Cache-Control': 'no-store' };
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: { ...cors, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Max-Age': '86400' } });
    }
    if (req.method !== 'GET' || (req.headers.get('Origin') || '') !== allowed) {
      return new Response('Forbidden', { status: 403, headers: cors });
    }
    if (!env.AZURE_KEY || !env.AZURE_REGION) return json({ error: 'not configured' }, 500, cors);

    if (env.LIMITS) {
      const url = new URL(req.url);
      const who = (url.searchParams.get('s') || '').slice(0, 40) + '|' + (req.headers.get('CF-Connecting-IP') || '');
      const key = new Date().toISOString().slice(0, 10) + ':' + who;
      const used = parseInt((await env.LIMITS.get(key)) || '0', 10);
      if (used >= Number(env.DAILY_LIMIT || 15)) return json({ error: 'daily limit' }, 429, cors);
      await env.LIMITS.put(key, String(used + 1), { expirationTtl: 172800 });
    }

    const r = await fetch(`https://${env.AZURE_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': env.AZURE_KEY, 'Content-Length': '0' },
    });
    if (!r.ok) return json({ error: 'azure ' + r.status }, 502, cors);
    return json({ token: await r.text(), region: env.AZURE_REGION }, 200, cors);
  },
};

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}
