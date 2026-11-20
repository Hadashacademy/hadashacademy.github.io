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
 *   STUDENT_CODES  (Secret)  student codes (matrículas) separated by commas (HADASH-000000,...)
 *   TEACHER_CODE   (Secret)  the teacher's code: works on any device and can free student codes
 *   CLASS_CODE     (Secret)  the Study Island class code, so a personal code also opens the lessons
 *   CONTENT_KEY    (Secret)  64-character key that opens the encrypted lessons. The bridge gives it
 *                            only to a device with a valid matrícula, so a shared code is useless.
 * KV namespace binding:
 *   DEVICES        each student code is tied to the first device where it is typed
 *                  (key "dev:CODE" → {"device":"…","since":"2026-11-20"}). The teacher frees a
 *                  code from hadashacademy.github.io/maestra so the student can use another device.
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

    // ---- Matrícula: a student code works on ONE device; the teacher code works anywhere ----
    const up = v => String(v || "").trim().toUpperCase();
    const teacher = up(env.TEACHER_CODE);
    const studentCodes = String(env.STUDENT_CODES || "").split(",").map(up).filter(Boolean);
    const code = up(body.code).slice(0, 40);
    const device = String(body.device || "").trim().slice(0, 64);
    const isTeacher = !!teacher && code === teacher;

    // Teacher tools (page /maestra): list codes and free a code
    if (body.action === "status" || body.action === "release") {
      if (!isTeacher) return json({ error: "invalid_code" }, 401);
      if (!env.DEVICES) return json({ error: "not_configured" }, 503);
      if (body.action === "release") {
        const target = up(body.target);
        if (!studentCodes.includes(target)) return json({ error: "unknown_code" }, 404);
        await env.DEVICES.delete("dev:" + target);
        return json({ ok: true, released: target }, 200);
      }
      const list = await Promise.all(studentCodes.map(async c => {
        const v = await env.DEVICES.get("dev:" + c, "json");
        return { code: c, active: !!v, since: v ? v.since : null };
      }));
      return json({ codes: list }, 200);
    }

    if (!code || (!isTeacher && !studentCodes.includes(code))) return json({ error: "invalid_code" }, 401);
    if (!isTeacher) {
      if (!env.DEVICES) return json({ error: "not_configured" }, 503);
      if (!/^[a-z0-9-]{16,64}$/i.test(device)) return json({ error: "no_device" }, 400);
      const key = "dev:" + code;
      const saved = await env.DEVICES.get(key, "json");
      if (!saved) {
        // First use: tie the code to this device
        await env.DEVICES.put(key, JSON.stringify({ device, since: new Date().toISOString().slice(0, 10) }));
      } else if (saved.device !== device) {
        return json({ error: "other_device" }, 409);
      }
    }

    // Is this device still allowed? (pages ask this when they open)
    if (body.action === "check") return json({ ok: true, role: isTeacher ? "teacher" : "student", ck: env.CONTENT_KEY || undefined }, 200);

    // Study Island: a valid personal code also opens the lessons (returns the class code)
    if (body.action === "unlock") {
      if (!env.CLASS_CODE) return json({ error: "not_configured" }, 503);
      return json({ classCode: env.CLASS_CODE, role: isTeacher ? "teacher" : "student", ck: env.CONTENT_KEY || undefined }, 200);
    }

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
