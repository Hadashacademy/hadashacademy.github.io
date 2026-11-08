/*
 * Hadash Academy · Sunny bridge (Azure OpenAI in Microsoft Foundry)
 * Runs on Cloudflare Workers (free plan). It keeps the Azure key secret: the web page never
 * sees it. Study Island sends the conversation here, the bridge asks Azure and returns
 * Sunny's answer. It never stores conversations or personal data.
 *
 * If anything fails (no credit, Azure down, wrong code), the bridge answers with an error
 * and Study Island switches by itself to the free guided-practice mode.
 *
 * Settings in Cloudflare (Worker → Settings → Variables and Secrets):
 *   AZURE_KEY      (Secret)  API key from Microsoft Foundry — NEVER put it in the web page
 *   STUDENT_CODES  (Secret)  personal student codes separated by commas (HADASH-XXXXX,...)
 */

const AZURE_ENDPOINT = "https://mercedes-moronta22-1910-resource.openai.azure.com/openai/v1/chat/completions";
const MODEL = "gpt-4.1-mini";
const ALLOWED_ORIGIN = "https://hadashacademy.github.io";

const SAFETY = `You work for Hadash Academy, an English academy for Spanish-speaking children, teens and adults (levels A1 to C1). Follow the teacher instructions given in the first message of the conversation. If there are none, act as Sunny: a friendly English tutor who adapts to the student's level, gently corrects mistakes (show the correct sentence, explain briefly why) and ends with a short question. Never discuss romantic, sexual, violent or adult topics; if the student brings them up, kindly change the subject.`;

const cors = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
  "Cache-Control": "no-store",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return new Response("Sunny is awake ☀️", { headers: cors });
    if ((request.headers.get("Origin") || "") !== ALLOWED_ORIGIN) return json({ error: "forbidden" }, 403);
    if (!env.AZURE_KEY) return json({ error: "not_configured" }, 503);

    let body;
    try { body = await request.json(); } catch { return json({ error: "bad_request" }, 400); }

    // Personal student code: valid codes live in the STUDENT_CODES secret (comma separated)
    const validCodes = String(env.STUDENT_CODES || "").split(",").map(c => c.trim().toUpperCase()).filter(Boolean);
    const code = String(body.code || "").trim().toUpperCase().slice(0, 40);
    if (!code || !validCodes.includes(code)) return json({ error: "invalid_code" }, 401);

    // Only plain text turns, limited in number and size, so nobody can run up the bill
    const history = (Array.isArray(body.messages) ? body.messages : [])
      .filter(m => m && (m.role === "user" || m.role === "assistant"))
      .map(m => ({ role: m.role, content: String(m.content || "").slice(0, 6000) }));
    if (!history.length || history.length > 40) return json({ error: "bad_request" }, 400);

    let r;
    try {
      r = await fetch(AZURE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": env.AZURE_KEY },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "system", content: SAFETY }, ...history],
          max_tokens: 400,
          temperature: 0.7,
        }),
      });
    } catch {
      return json({ error: "azure_unreachable" }, 502);
    }
    if (!r.ok) return json({ error: "azure_" + r.status }, r.status === 429 ? 503 : 502);
    const data = await r.json().catch(() => null);
    const text = String(data?.choices?.[0]?.message?.content || "").trim();
    if (!text) return json({ error: "empty" }, 502);
    return json({ text, reply: text }, 200);
  },
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
