/*
 * Hadash Academy · Sunny bridge (Azure OpenAI in Microsoft Foundry) + student codes
 * Runs on Cloudflare Workers (free plan). It keeps the Azure key secret: the web page never
 * sees it. It also checks the student codes for Study Island, the English Lab and the library,
 * and ties each student code to the first device where it is used.
 * It never stores conversations or personal data (only: code → random device id + date).
 *
 * Settings in Cloudflare (Worker → Settings):
 *   AZURE_KEY      (Secret)  API key from Microsoft Foundry — NEVER put it in the web page
 *   STUDENT_CODES  (Secret)  student codes separated by commas (tied to one device each)
 *   TEACHER_CODES  (Secret)  teacher codes separated by commas (any device, can release codes)
 *   CLASS_CODE     (Secret)  the Study Island class code, so a personal code also opens the lessons
 *   DEVICES        (KV namespace binding)  remembers which device each student code belongs to
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

const list = s => String(s || "").split(",").map(c => c.trim().toUpperCase()).filter(Boolean);

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return new Response("Sunny is awake ☀️", { headers: cors });
    if ((request.headers.get("Origin") || "") !== ALLOWED_ORIGIN) return json({ error: "forbidden" }, 403);

    let body;
    try { body = await request.json(); } catch { return json({ error: "bad_request" }, 400); }

    const students = list(env.STUDENT_CODES), teachers = list(env.TEACHER_CODES);
    const code = String(body.code || "").trim().toUpperCase().slice(0, 40);
    const isTeacher = !!code && teachers.includes(code);
    if (!code || (!isTeacher && !students.includes(code))) return json({ error: "invalid_code" }, 401);

    // Teacher tools: see which codes are in use and free a code when a student changes device
    if (body.action === "codes" || body.action === "release") {
      if (!isTeacher) return json({ error: "forbidden" }, 403);
      if (!env.DEVICES) return json({ error: "not_configured" }, 503);
      if (body.action === "release") {
        const t = String(body.target || "").trim().toUpperCase();
        if (!students.includes(t)) return json({ error: "unknown_code" }, 404);
        await env.DEVICES.delete("dev:" + t);
        return json({ ok: true }, 200);
      }
      const rows = await Promise.all(students.map(async c => {
        const v = await env.DEVICES.get("dev:" + c, "json");
        return { code: c, used: !!v, since: v ? v.t : null };
      }));
      return json({ codes: rows }, 200);
    }

    // Student codes: one device per code (the first device where the code is used)
    if (!isTeacher) {
      if (!env.DEVICES) return json({ error: "not_configured" }, 503);
      const device = String(body.device || "").trim().slice(0, 64);
      if (!/^[a-f0-9]{16,64}$/.test(device)) return json({ error: "no_device" }, 400);
      const v = await env.DEVICES.get("dev:" + code, "json");
      if (!v) await env.DEVICES.put("dev:" + code, JSON.stringify({ d: device, t: new Date().toISOString().slice(0, 10) }));
      else if (v.d !== device) return json({ error: "device_locked" }, 403);
    }

    // Study Island, English Lab, library: a valid code also opens the lessons (returns the class code)
    if (body.action === "unlock") {
      if (!env.CLASS_CODE) return json({ error: "not_configured" }, 503);
      return json({ classCode: env.CLASS_CODE, teacher: isTeacher }, 200);
    }

    if (!env.AZURE_KEY) return json({ error: "not_configured" }, 503);
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
