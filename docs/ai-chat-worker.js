// =====================================================================
// Hikari - docs/ai-chat-worker.js  (TEMPLATE · ยังไม่ได้ใช้งาน · อ่าน docs/AI-CHAT.md ก่อน)
// Cloudflare Worker (module syntax) ที่เป็นตัวกลางระหว่างเกมกับ LLM API สำหรับ "คุยกับน้อง" โหมด AI
//
// ไม่มีคีย์จริงในไฟล์นี้ ตั้งค่าด้วย `wrangler secret put ANTHROPIC_API_KEY` และตัวแปรใน wrangler.toml:
//   ALLOWED_ORIGINS = "https://mokarumokaruja-beep.github.io"   (คั่นด้วย , ได้หลายโดเมน)
//   MODEL           = "<model id ที่เลือก เช่นรุ่นเล็ก/เร็ว ตรวจรายชื่อรุ่นปัจจุบันในเอกสาร Anthropic>"
//   RATE_LIMITER    = (ไม่บังคับ) Cloudflare Rate Limiting binding · ไม่มี = ใช้ตัวนับในหน่วยความจำ (กันได้บางส่วน)
//
// สิ่งที่ Worker นี้ทำ / ไม่ทำ
//   - รับเฉพาะ POST /chat จาก ALLOWED_ORIGINS · body ≤ 8 KB · ข้อความ ≤ 10 · ข้อความละ ≤ 300 ตัวอักษร
//   - ไม่รับ/ไม่เก็บ user id · ไม่ log เนื้อหาข้อความ (log แค่สถานะ/ตัวเลข) · ไม่ใช้คุกกี้
//   - ตรวจข้อความเสี่ยงฝั่งเซิร์ฟเวอร์ซ้ำ → ตอบ { crisis: true } (เกมแสดงข้อความตายตัวที่มนุษย์เขียน ไม่ให้ AI แต่ง)
//   - system prompt แคบ: เพื่อนสัตว์เลี้ยงในเกม ไม่ใช่นักบำบัด · ตอบสั้น · ภาษาเดียวกับผู้ใช้ · การ์ดจาก allow-list เท่านั้น
//   - ตรวจคำตอบก่อนส่งกลับ: มีคำเรื่องทำร้ายตนเอง/คำอ้างทางการแพทย์ → ส่งข้อความว่าง (เกมใช้คำตอบในเครื่องแทน)
//   - เกมตรวจซ้ำอีกชั้นด้วย HikariSafety ทั้งก่อนส่งและหลังได้คำตอบ (game-chat.js RemoteProvider)
// =====================================================================

// ต้องตรงกับ CHAT_ACTIONS ใน chat-content.js
const ALLOWED_ACTIONS = ["sigh", "b48", "breathe", "qb", "stretch", "pmr", "walk", "step", "talk", "letters", "help",
    "web_today", "web_assessment", "web_burnout", "web_rootcause", "web_sleep", "web_selfcare", "web_moodscreen", "web_videos"];
const LANG_NAMES = { th: "Thai", en: "English", zh: "Simplified Chinese", hi: "Hindi", es: "Spanish", fr: "French", ar: "Arabic", pt: "Portuguese", ru: "Russian", ja: "Japanese" };
const MAX_BODY = 8000, MAX_MSGS = 10, MAX_TEXT = 300, MAX_REPLY = 600, LLM_TIMEOUT_MS = 7000;
const RATE = { limit: 20, windowMs: 10 * 60 * 1000 };       // ต่อ IP (ตัวนับสำรองในหน่วยความจำ)

// ตรวจความเสี่ยงฝั่งเซิร์ฟเวอร์ (ชุดย่อ) · ชุดเต็ม 10 ภาษาอยู่ใน safety.js ให้คัดลอกรายการ PHRASES มาใช้จริงก่อนเปิด
// กฎไม่สมมาตร: สงสัยไว้ก่อน (ตอบ crisis เกินจำเป็นได้ ห้ามพลาดคนที่ต้องการ)
const RISK_RE = new RegExp([
    "อยากตาย", "ไม่อยากมีชีวิต", "ไม่อยากอยู่แล้ว", "ฆ่าตัวตาย", "ทำร้ายตัวเอง", "กรีดข้อมือ", "อยากหายไปจากโลก",
    "want to die", "wanna die", "kill myself", "suicid", "end my life", "self[ -]?harm", "hurt myself", "better off dead", "no reason to live",
    "想死", "自杀", "自殺", "不想活", "死にたい", "消えたい", "自殺", "मरना चाहत", "आत्महत्या", "quiero morir", "suicid", "me quiero matar",
    "veux mourir", "me tuer", "quero morrer", "me matar", "хочу умереть", "покончить с собой", "суицид", "اريد ان اموت", "انتحار", "اقتل نفسي"
].join("|"), "i");
// คำตอบของ AI ห้ามมี: เรื่องทำร้ายตนเอง/ฆ่าตัวตาย, การวินิจฉัย/การรักษา/ยา
const REPLY_BLOCK = /suicid|kill (your|him|her)sel|end (your|ur) life|self[ -]?harm|overdose|ฆ่าตัว|ทำร้ายตัวเอง|自杀|自殺|死にたい|आत्महत्या|suicidio|suicídio|суицид|самоубий|انتحار|diagnos|วินิจฉัย|you have (depression|anxiety|ptsd|bipolar)|คุณเป็นโรค|medication|dosage|ยา(ต้าน|นอนหลับ)|antidepress|prescri/i;

function systemPrompt(lang, pet) {
    const L = LANG_NAMES[lang] || "English";
    return [
        `You are ${pet || "Hikari"}, a small pet character inside "Hikari StressCare", a stress-care game for working adults (18+).`,
        `Always reply in ${L}. Keep replies short: 1 to 3 sentences, at most about 60 words. Warm, simple, gentle, a little playful.`,
        "ROLE LIMITS (never break these):",
        "- You are a game pet, not a human, not a therapist, doctor, psychologist or counselor. If asked, say so plainly.",
        "- This is general wellness, not therapy or treatment. Never diagnose, never name a disorder the user 'has', never talk about medication or doses, never promise to cure or treat anything.",
        "- Do not encourage dependence on you. Never say things like 'I'm all you need' or 'I'll always be here'. Encourage real-life support (friends, family, professionals) when it fits.",
        "- Never shame, guess the user's motives, or suggest they are lying. No guilt, no pressure, no selling, no mentions of prices, shop items or premium plans.",
        "- Ask at most ONE question per reply.",
        "HOW TO HELP: first reflect and validate the feeling in your own words (motivational-interviewing style listening), normalize it, then offer at most one tiny, doable step: a slow breath with a long exhale, a short stretch or walk, writing one thing down, a kind sentence to oneself (self-compassion), noticing a thought as a thought, or one small next step on a task. Within one conversation, do not mix 'challenge the thought' (CBT) and 'step back from the thought' (ACT) styles.",
        "SAFETY: If the user mentions wanting to die, suicide, self-harm, being in danger, abuse, or a medical emergency, do NOT write your own advice. Reply with exactly this JSON: {\"crisis\": true}. Never describe methods. Never discuss suicide in any other way.",
        `ACTIONS: you may suggest up to 2 in-game cards by id, only from this list: ${ALLOWED_ACTIONS.join(", ")}. Use "help" when the user seems to be struggling a lot.`,
        "OUTPUT: respond with JSON only, no markdown: {\"text\": \"<your reply>\", \"actions\": [\"<id>\", ...]}"
    ].join("\n");
}

// ----- ตัวนับคำขอต่อ IP (สำรอง: ทำงานต่อ isolate เท่านั้น ใช้ RATE_LIMITER binding ในงานจริง) -----
const hits = new Map();
function memoryLimited(ip) {
    const now = Date.now();
    const list = (hits.get(ip) || []).filter(function (t) { return now - t < RATE.windowMs; });
    list.push(now);
    hits.set(ip, list);
    if (hits.size > 5000) hits.clear();
    return list.length > RATE.limit;
}

function json(body, status, cors) {
    return new Response(JSON.stringify(body), { status: status || 200, headers: Object.assign({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, cors || {}) });
}

function cleanMessages(list) {
    if (!Array.isArray(list)) return null;
    const out = [];
    list.slice(-MAX_MSGS).forEach(function (m) {
        if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.text !== "string") return;
        const text = m.text.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT);
        if (!text) return;
        const prev = out[out.length - 1];
        if (prev && prev.role === m.role) prev.content += "\n" + text;     // API ต้องสลับ user/assistant
        else out.push({ role: m.role, content: text });
    });
    while (out.length && out[0].role !== "user") out.shift();             // ต้องเริ่มด้วย user
    if (!out.length || out[out.length - 1].role !== "user") return null;  // ต้องจบด้วยข้อความผู้ใช้
    return out;
}

function parseReply(raw) {
    let d = null;
    try { d = JSON.parse(raw); } catch (e) {
        const m = /\{[\s\S]*\}/.exec(raw || "");
        if (m) { try { d = JSON.parse(m[0]); } catch (e2) { d = null; } }
    }
    if (!d || typeof d !== "object") return { text: "" };
    if (d.crisis === true) return { crisis: true };
    const text = String(d.text || "").replace(/\s+/g, " ").trim().slice(0, MAX_REPLY);
    const actions = Array.isArray(d.actions) ? d.actions.filter(function (a, i, all) { return ALLOWED_ACTIONS.indexOf(a) >= 0 && all.indexOf(a) === i; }).slice(0, 2) : [];
    return { text: text, actions: actions };
}

export default {
    async fetch(request, env) {
        const origin = request.headers.get("Origin") || "";
        const allowed = String(env.ALLOWED_ORIGINS || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
        const okOrigin = allowed.indexOf(origin) >= 0;
        const cors = okOrigin ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "600", "Vary": "Origin" } : {};
        const url = new URL(request.url);
        if (request.method === "OPTIONS") return new Response(null, { status: okOrigin ? 204 : 403, headers: cors });
        if (request.method !== "POST" || url.pathname !== "/chat") return json({ error: "not_found" }, 404, cors);
        if (!okOrigin) return json({ error: "forbidden" }, 403);
        if (!env.ANTHROPIC_API_KEY || !env.MODEL) return json({ error: "not_configured" }, 503, cors);

        // จำกัดความถี่ต่อ IP (ไม่เก็บ IP ลงที่ไหน)
        const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
        if (env.RATE_LIMITER && typeof env.RATE_LIMITER.limit === "function") {
            const r = await env.RATE_LIMITER.limit({ key: ip });
            if (!r.success) return json({ error: "rate_limited" }, 429, cors);
        } else if (memoryLimited(ip)) return json({ error: "rate_limited" }, 429, cors);

        const len = Number(request.headers.get("Content-Length") || 0);
        if (len > MAX_BODY) return json({ error: "too_large" }, 413, cors);
        let body;
        try {
            const raw = await request.text();
            if (raw.length > MAX_BODY) return json({ error: "too_large" }, 413, cors);
            body = JSON.parse(raw);
        } catch (e) { return json({ error: "bad_request" }, 400, cors); }

        const lang = LANG_NAMES[body.lang] ? body.lang : "en";
        const pet = typeof body.pet === "string" ? body.pet.replace(/[^\p{L}\p{N} '\-]/gu, "").slice(0, 30) : "";
        const messages = cleanMessages(body.messages);
        if (!messages) return json({ error: "bad_request" }, 400, cors);

        // ความปลอดภัยก่อน: ข้อความผู้ใช้มีสัญญาณเสี่ยง → ไม่ส่งให้ LLM เลย
        if (messages.some(function (m) { return m.role === "user" && RISK_RE.test(m.content); })) return json({ crisis: true }, 200, cors);

        const ctrl = new AbortController();
        const timer = setTimeout(function () { ctrl.abort(); }, LLM_TIMEOUT_MS);
        try {
            const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                signal: ctrl.signal,
                headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
                body: JSON.stringify({ model: env.MODEL, max_tokens: 300, temperature: 0.6, system: systemPrompt(lang, pet), messages: messages })
            });
            clearTimeout(timer);
            if (!res.ok) { console.log("llm_status", res.status); return json({ text: "" }, 200, cors); }   // เกมใช้คำตอบในเครื่องแทน
            const data = await res.json();
            const raw = (data.content || []).filter(function (c) { return c.type === "text"; }).map(function (c) { return c.text; }).join("");
            const out = parseReply(raw);
            if (out.crisis) return json({ crisis: true }, 200, cors);
            if (!out.text || REPLY_BLOCK.test(out.text) || RISK_RE.test(out.text)) return json({ text: "" }, 200, cors);
            return json(out, 200, cors);
        } catch (e) {
            clearTimeout(timer);
            console.log("llm_error", e && e.name);        // ไม่ log เนื้อหา
            return json({ text: "" }, 200, cors);
        }
    }
};
