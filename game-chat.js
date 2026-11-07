// =====================================================================
// Hikari - game-chat.js (v28)  "คุยกับน้อง" แชตกับสัตว์เลี้ยง
// โหลดหลัง config.js, safety.js, game-data.js, chat-content.js (เริ่มทำงานตอน DOMContentLoaded หลัง game.js)
//
// หลักการ (wellness-game-design 7 ข้อ):
//   1) ไม่ใช่การบำบัด: น้องเป็นเพื่อนสัตว์เลี้ยง บอกตรง ๆ ว่าไม่ใช่คน/นักบำบัด ไม่วินิจฉัย ไม่อ้างว่ารักษา
//   2) ความปลอดภัยฟรีและมาก่อน: ทุกข้อความผ่าน HikariSafety.hasRiskText ก่อนอย่างอื่น → ข้อความตายตัว (CHAT_CRISIS)
//      + โทร 1323/1669 + สายด่วนทั่วโลก + บอกคนที่ไว้ใจ + หน้าต่างช่วยเหลือ ไม่มีเสียงน้อง ไม่มีการ์ดอื่น ไม่ส่ง AI
//   3) ไม่กล่าวหาว่าโกหก · บอก "ล้อเล่น" ภายหลัง = ไม่ถอนการ์ดช่วยเหลือ (กฎไม่สมมาตร)
//   4) ไม่ทำให้รู้สึกผิด ไม่ขายของในแชตเลย · คุยครบ 15 ข้อความ น้องชวนพักหรือคุยกับคนจริง (ไม่สร้างการพึ่งพา)
//   5) PDPA: ข้อความอยู่ในหน่วยความจำ · เก็บในเครื่องเฉพาะเมื่อผู้ใช้เปิด "จำ 30 ข้อความ" (hikariChat_<ผู้ใช้>)
//      ข้อความที่เสี่ยงและข้อความวิกฤตไม่ถูกเก็บ · LocalProvider ไม่ส่งอะไรออกจากเครื่อง
//   6) พร้อมต่อ AI: ChatProvider = { name, reply(history, context) → Promise<{text, actions[]}> }
//      LocalProvider (ค่าเริ่มต้น) · RemoteProvider ใช้ได้เมื่อ config.js มี CHAT_ENDPOINT และผู้ใช้เปิดเอง
//      (ตรวจความเสี่ยงก่อนส่งและตรวจคำตอบที่ได้กลับมา · ส่งแค่ภาษา ชื่อน้อง ข้อความล่าสุด ≤ 10 ไม่มีชื่อผู้ใช้ · 8 วินาทีไม่ตอบ = ใช้ Local)
// =====================================================================

const HikariChat = (function () {
    "use strict";
    const MAX_IN = 300;          // ตัวอักษรต่อข้อความ
    const KEEP_MAX = 30;         // เก็บในเครื่องได้สูงสุด
    const NUDGE_EVERY = 15;      // คุยครบกี่ข้อความแล้วชวนพัก/คุยกับคนจริง
    const REMOTE_MAX = 10;       // ข้อความล่าสุดที่ส่งให้ AI
    const REMOTE_TIMEOUT = 8000;
    const SPACELESS = { th: true, zh: true, ja: true };   // ภาษาที่ไม่เว้นวรรคระหว่างคำ: เทียบแบบสตริงย่อย
    // คำปฏิเสธที่อยู่ "หน้า" คำ (เช่น not stressed / ไม่เครียด) → ไม่นับเรื่องนั้น (ใช้เฉพาะเรื่องความรู้สึก)
    const NEG_BEFORE = {
        en: ["not", "no", "never", "t", "dont", "nothing"], es: ["no", "nunca", "ni"], fr: ["pas", "ne", "n", "jamais", "plus"],
        pt: ["nao", "nunca", "nem"], ru: ["не", "ни", "нет"], ar: ["مش", "مو", "ما", "لا", "ليس", "لست", "مب"], hi: ["न", "ना"]
    };
    const NEG_AFTER = { hi: ["नहीं", "नही", "nahi", "nahin"] };
    const NEGATABLE = { mood_good: 1, mood_sad: 1, mood_anxious: 1, stressed: 1, burnout_tired: 1, lonely: 1, anger: 1, bored: 1, good_news: 1 };
    // ลำดับความสำคัญเมื่อคะแนนเท่ากัน (บนสุด = เฉพาะเจาะจงที่สุด)
    const PRIORITY = ["self_criticism", "overthinking", "procrastination", "burnout_tired", "sleep", "lonely", "anger", "relationship",
        "mood_anxious", "mood_sad", "good_news", "gratitude", "stressed_work", "stressed", "bored", "vent", "ask_break", "ask_mission", "mood_good"];
    // เรื่องทักทาย/สั้น ๆ: ชนะเฉพาะเมื่อไม่มีเรื่องอื่น หรือคำยาวกว่าชัดเจน (เช่น "ไปนอนแล้ว ฝันดี" = บาย ไม่ใช่เรื่องนอนไม่หลับ)
    const SOCIAL = ["mood_meh", "ask_pet", "greeting", "thanks", "bye", "yes", "no", "kidding"];
    const SHORT_ONLY = { yes: true, no: true };          // ใช้เมื่อทั้งข้อความสั้น ๆ เท่านั้น
    const DISTRESS_HELP = { mood_sad: 1, mood_anxious: 1, stressed: 1, burnout_tired: 1, lonely: 1, self_criticism: 1 };
    const TOPICS = (typeof CHAT_TOPICS !== "undefined") ? CHAT_TOPICS : [];

    // ---------- ทำข้อความให้อยู่รูปเดียวกัน (ทั้งข้อความผู้ใช้และรายการคำ) ----------
    const T2S = {
        "難": "难", "過": "过", "傷": "伤", "壓": "压", "開": "开", "謝": "谢", "著": "着", "獨": "独", "慮": "虑", "擔": "担", "憤": "愤",
        "氣": "气", "煩": "烦", "見": "见", "嗎": "吗", "麼": "么", "會": "会", "們": "们", "個": "个", "說": "说", "話": "话", "覺": "觉",
        "憂": "忧", "鬱": "郁", "緊": "紧", "張": "张", "鬆": "松", "誰": "谁", "愛": "爱", "媽": "妈", "項": "项", "闆": "板", "導": "导",
        "議": "议", "職": "职", "錯": "错", "敗": "败", "對": "对", "歡": "欢", "樂": "乐", "興": "兴", "輕": "轻", "無": "无", "變": "变",
        "夠": "够", "討": "讨", "厭": "厌", "經": "经", "業": "业", "獎": "奖", "進": "进", "實": "实", "現": "现", "頭": "头", "潰": "溃",
        "夢": "梦", "惡": "恶", "機": "机", "醫": "医", "師": "师", "諮": "咨", "詢": "询", "療": "疗", "傾": "倾", "訴": "诉", "務": "务",
        "薦": "荐", "該": "该", "試": "试", "來": "来", "認": "认", "時": "时", "間": "间", "沒": "没", "賴": "赖", "懶": "懒", "勁": "劲",
        "於": "于", "家": "家", "爸": "爸", "婆": "婆", "鬧": "闹", "吵": "吵", "隨": "随", "幫": "帮", "這": "这", "裡": "里", "麗": "丽"
    };
    const T2S_RE = new RegExp("[" + Object.keys(T2S).join("") + "]", "g");
    function base(text) {
        let s = String(text == null ? "" : text);
        try { s = s.normalize("NFKC"); } catch (e) { /* เบราว์เซอร์เก่า */ }
        s = s.toLowerCase().replace(/[​-‏⁠﻿­]/g, "").replace(/ํา/g, "ำ");
        try {
            // ตัดเครื่องหมายละติน (é ñ ã) / อาหรับ / นุกตาเทวนาครี · รัสเซีย й→и ё→е ได้จากขั้นนี้ด้วย
            s = s.normalize("NFD").replace(/[̀-ًͯ-ٰٟۖ-़ۭ]/g, "").normalize("NFC");
        } catch (e) { /* เบราว์เซอร์เก่า */ }
        return s.replace(/ـ/g, "")
            .replace(/[آأإٱ]/g, "ا").replace(/[ىی]/g, "ي").replace(/ة/g, "ه")
            .replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/ک/g, "ك")
            .replace(/ँ/g, "ं").replace(/ё/g, "е").replace(/й/g, "и")
            .replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); })
            .replace(T2S_RE, function (c) { return T2S[c]; })
            .replace(/[ๆฯ]/g, " ")                 // ๆ ฯ
            .replace(/(.)\1+/g, "$1");                       // ตัวซ้ำติดกัน (เครียดดดด / soooo)
    }
    let NONWORD;
    try { NONWORD = new RegExp("[^\\p{L}\\p{M}\\p{N}]+", "gu"); } catch (e) { NONWORD = /[\s.,!?;:'"`’‘“”()\[\]{}\-_~*+=\/\\|<>@#$%^&…。、！？¿¡«»„–—·•「」『』【】〜～・،؛؟।]+/g; }
    function forms(text) {
        const b = base(text);
        const spaced = b.replace(NONWORD, " ").replace(/\s+/g, " ").trim();
        return { spaced: spaced, padded: " " + spaced + " ", tight: spaced.replace(/ /g, "") };
    }

    // ---------- เดาเรื่อง (intent) จากคำในรายการ ----------
    const compiled = {};
    function compile(lang) {
        if (compiled[lang]) return compiled[lang];
        const table = (typeof CHAT_KEYS !== "undefined" && CHAT_KEYS[lang]) || {};
        const tight = !!SPACELESS[lang];
        const out = [];
        Object.keys(table).forEach(function (intent) {
            (table[intent] || []).forEach(function (raw) {
                const prefix = /\*$/.test(raw);
                const f = forms(String(raw).replace(/\*$/, ""));
                const k = tight ? f.tight : f.spaced;
                if (!k) return;
                out.push({ intent: intent, k: k, prefix: prefix, tight: tight, lang: lang });
            });
        });
        compiled[lang] = out;
        return out;
    }
    function negatedSpaced(f, at, end, lang) {
        const before = f.padded.slice(0, at).trim().split(" ").slice(-2);
        const nb = NEG_BEFORE[lang] || [];
        if (before.some(function (w) { return nb.indexOf(w) >= 0; })) return true;
        const na = NEG_AFTER[lang] || [];
        const after = f.padded.slice(end).trim().split(" ")[0];
        return na.indexOf(after) >= 0;
    }
    function negatedTight(s, at, end, lang) {
        const pre = s.slice(Math.max(0, at - 6), at), post = s.slice(end, end + 4);
        if (lang === "th") return /ไม่(ได้|ค่อย)?$/.test(pre);
        if (lang === "zh") return /(不|没有?|别)$/.test(pre);
        if (lang === "ja") return /^(じゃない|ではない|ない|なく|ません)/.test(post);
        return false;
    }
    function detect(text, lang) {
        const f = forms(text);
        if (!f.tight) return { intent: "unknown", score: 0 };
        const langs = [lang];
        if (lang !== "en") langs.push("en");             // พิมพ์อังกฤษปนได้เสมอ
        const hits = {};
        langs.forEach(function (lg) {
            compile(lg).forEach(function (e) {
                if (SHORT_ONLY[e.intent]) {
                    // ใช่/ไม่: ทั้งข้อความต้องสั้นและขึ้นต้นด้วยคำนั้น
                    const whole = e.tight ? f.tight : f.spaced;
                    const ok = whole.indexOf(e.k) === 0 && whole.length <= e.k.length + 6 &&
                        (e.tight || whole.length === e.k.length || whole.charAt(e.k.length) === " ");
                    if (ok) add(hits, e.intent, e.k.length, e.k);
                    return;
                }
                if (e.tight) {
                    let at = f.tight.indexOf(e.k);
                    while (at !== -1) {
                        if (!(NEGATABLE[e.intent] && negatedTight(f.tight, at, at + e.k.length, lg))) { add(hits, e.intent, e.k.length, e.k); break; }
                        at = f.tight.indexOf(e.k, at + 1);
                    }
                } else {
                    let at = f.padded.indexOf(" " + e.k);
                    while (at !== -1) {
                        const end = at + 1 + e.k.length;
                        const boundary = e.prefix || f.padded.charAt(end) === " ";
                        if (boundary && !(NEGATABLE[e.intent] && negatedSpaced(f, at, end, lg))) { add(hits, e.intent, e.k.length, e.k); break; }
                        at = f.padded.indexOf(" " + e.k, at + 1);
                    }
                }
            });
        });
        if (hits.ask_human) return { intent: "ask_human", score: hits.ask_human.len, hits: hits };
        function best(list) {
            let b = null;
            list.forEach(function (intent) {
                const h = hits[intent];
                if (!h) return;
                const score = h.len + 2 * (h.keys.length - 1);
                const pr = PRIORITY.indexOf(intent) >= 0 ? PRIORITY.indexOf(intent) : 50 + SOCIAL.indexOf(intent);
                if (!b || score > b.score || (score === b.score && pr < b.pr)) b = { intent: intent, score: score, pr: pr };
            });
            return b;
        }
        const content = best(PRIORITY), social = best(SOCIAL);
        if (content && (!social || social.score < content.score + 3)) return { intent: content.intent, score: content.score, hits: hits };
        if (social) return { intent: social.intent, score: social.score, hits: hits };
        return { intent: "unknown", score: 0, hits: hits };
    }
    function add(hits, intent, len, k) {
        const h = hits[intent] || (hits[intent] = { len: 0, keys: [] });
        if (h.keys.indexOf(k) < 0) h.keys.push(k);
        if (len > h.len) h.len = len;
    }

    // คำตอบจาก AI: ห้ามพูดถึงการทำร้ายตนเอง/ฆ่าตัวตายเอง (เรื่องนี้ใช้ข้อความตายตัวเท่านั้น) · รวมรูปบุรุษที่ 2 ที่ safety.js ไม่ได้ตรวจ
    const REPLY_BLOCK = /suicid|kill (your|him|her)sel|end (your|ur) life|hurt yourself|self[ -]?harm|overdose|ฆ่าตัว|ทำร้ายตัวเอง|ปลิดชีพ|自杀|自殺|自残|自傷|死にたい|आत्महत्या|suicidio|suicide|suicídio|суицид|самоубий|انتحار/i;
    function isRiskReply(text) { return isRisk(text) || REPLY_BLOCK.test(String(text || "")); }
    function isAbuse(text) {
        try { return typeof HikariSafety !== "undefined" && HikariSafety.hasAbuseText && HikariSafety.hasAbuseText(String(text || "")); } catch (e) { return false; }
    }
    function isRisk(text) {
        try { return typeof HikariSafety !== "undefined" && HikariSafety.hasRiskText(String(text || "")); } catch (e) { return false; }
    }
    function cleanInput(text) {
        return String(text == null ? "" : text).replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, MAX_IN);
    }

    // ---------- สมอง (คำตอบในเครื่อง): เลือกคำตอบไม่ซ้ำ จำเรื่องล่าสุด 1 ตา ใช้แนว CBT หรือ ACT สายเดียวต่อรอบ ----------
    function createBrain(getCtx, rand) {
        rand = rand || Math.random;
        const st = { recent: {}, strand: null, lastTopic: null, lastTopicTurn: -9, lastActions: [], turn: 0, vent: false, risk: false };
        function lang() { const l = getCtx().lang; return CHAT[l] ? l : "en"; }
        function variants(l, key) {
            const p = CHAT[l] && CHAT[l][key];
            return p && p.length ? p : (CHAT.en[key] || CHAT.th[key] || []);
        }
        function pick(key) {
            const l = lang();
            let list = variants(l, key).map(function (v, i) {
                const m = /^~([ac]) /.exec(v);
                return { i: i, tag: m ? m[1] : null, v: m ? v.slice(3) : v };
            });
            if (!list.length) return "";
            if (st.strand) {
                const same = list.filter(function (x) { return !x.tag || x.tag === st.strand; });
                if (same.length) list = same;
            }
            const rk = l + ":" + key;
            let used = st.recent[rk] || [];
            let pool = list.filter(function (x) { return used.indexOf(x.i) < 0; });
            if (!pool.length) {                                  // ใช้ครบทุกแบบแล้ว: เริ่มใหม่ แต่ไม่ซ้ำอันล่าสุด
                const last = used[used.length - 1];
                used = [last];
                pool = list.filter(function (x) { return x.i !== last; });
                if (!pool.length) pool = list;
            }
            const c = pool[Math.floor(rand() * pool.length) % pool.length];
            used.push(c.i);
            st.recent[rk] = used;
            if (c.tag && !st.strand) st.strand = c.tag;
            return c.v;
        }
        function fill(s, extra) {
            const c = getCtx();
            const ui = (CHAT_UI[lang()] || CHAT_UI.en);
            let out = String(s)
                .split("{pet}").join(c.pet || "")
                .split("{s}").join(st.risk ? "" : (c.voice || ""))
                .split("{topic}").join(extra && extra.topic ? (ui["topic_" + extra.topic] || "") : "");
            return out.replace(/\s{2,}/g, " ").replace(/^\s+|\s+$/g, "").replace(/^[,.!?]\s*/, "");
        }
        function crisis(kind) {
            const l = lang();
            const pack = CHAT_CRISIS[l] || CHAT_CRISIS.en;
            st.risk = true;
            st.lastActions = [];
            return { text: pack[kind] || pack.text, actions: CHAT_HELP_ACTIONS.slice(), intent: "crisis" + (kind === "text" ? "" : "_" + kind), crisis: true };
        }
        function reply(text, opts) {
            opts = opts || {};
            const c = getCtx();
            st.turn++;
            let intent = opts.intent || detect(text, lang()).intent;
            if (intent === "stay") return crisis("stay");
            if (intent === "kidding") {
                if (st.risk) return crisis("kidding");           // ไม่ถอนความช่วยเหลือ
                intent = "listen";
            }
            let actions;
            if (intent === "yes") {
                if (st.lastActions.length) actions = st.lastActions.slice();
                else intent = "listen";
            }
            let topic = null;
            if (intent === "unknown") {
                if (st.lastTopic && st.turn - st.lastTopicTurn === 1) { intent = "followup"; topic = st.lastTopic; }
                else if (st.vent) intent = "listen";
            }
            if (intent === "vent") st.vent = true;
            else if (["listen", "unknown", "followup", "yes", "no"].indexOf(intent) < 0) st.vent = false;
            if (!actions) {
                if (intent === "followup") actions = (CHAT_INTENT_ACTIONS[topic] || []).slice(0, 1);
                else actions = (CHAT_INTENT_ACTIONS[intent] || []).slice();
            }
            let out = fill(pick(intent), { topic: topic });
            if (intent === "ask_human" && c.remote) out += " " + fill((CHAT_UI[lang()] || CHAT_UI.en).aiNote);
            if (TOPICS.indexOf(intent) >= 0) { st.lastTopic = intent; st.lastTopicTurn = st.turn; }
            else if (intent === "followup") st.lastTopic = null;
            // หลังพบสัญญาณเสี่ยงในรอบนี้ / ช่วงนี้กำลังหนัก: ปุ่มช่วยเหลืออยู่ในทุกคำตอบ ไม่เสนอหน้าเว็บ
            if (st.risk) actions = ["help"].concat(actions.filter(function (a) { return !/^web_/.test(a) && a !== "help"; })).slice(0, 2);
            else if (c.distress && DISTRESS_HELP[intent] && actions.indexOf("help") < 0) actions = actions.slice(0, 2).concat("help");
            st.lastActions = actions.filter(function (a) { return a !== "help"; });
            return { text: out, actions: actions, intent: intent };
        }
        function greet() {
            const c = getCtx();
            const key = (c.mood === "sad" || c.mood === "stressed") ? "greet_low" : (c.mood === "great" || c.mood === "good") ? "greet_high" : "greet_none";
            return { text: fill(pick(key)), actions: [], intent: key };
        }
        function say(key) { return { text: fill(pick(key)), actions: (CHAT_INTENT_ACTIONS[key] || []).slice(), intent: key }; }
        function reset() {
            st.recent = {}; st.strand = null; st.lastTopic = null; st.lastTopicTurn = -9; st.lastActions = []; st.turn = 0; st.vent = false; st.risk = false;
        }
        return { reply: reply, crisis: crisis, greet: greet, say: say, fill: fill, reset: reset, state: st };
    }

    // ---------- ผู้ให้คำตอบ (Provider) ----------
    function lastUserText(history) {
        for (let i = history.length - 1; i >= 0; i--) if (history[i].who === "me") return history[i].text;
        return "";
    }
    function createLocalProvider(brain) {
        return { name: "local", reply: function (history, context) { return Promise.resolve(brain.reply(lastUserText(history), context && context.opts)); } };
    }
    function remoteEndpoint() {
        try { return (typeof CHAT_ENDPOINT === "string" && /^https:\/\/[^\s]+$/.test(CHAT_ENDPOINT)) ? CHAT_ENDPOINT : ""; } catch (e) { return ""; }
    }
    function cleanActions(list) {
        if (!Array.isArray(list)) return [];
        return list.filter(function (a, i) {
            return typeof a === "string" && Object.prototype.hasOwnProperty.call(CHAT_ACTIONS, a) && list.indexOf(a) === i;
        }).slice(0, 2);
    }
    // AI ภายนอก: ตรวจความเสี่ยงก่อนส่ง (ทุกข้อความของผู้ใช้ที่จะส่ง) และตรวจคำตอบ · ไม่ส่ง id ผู้ใช้ · 8 วินาที → Local
    function createRemoteProvider(endpoint, brain, fetchFn) {
        const local = createLocalProvider(brain);
        fetchFn = fetchFn || (typeof fetch === "function" ? fetch.bind(null) : null);
        return {
            name: "remote",
            reply: function (history, context) {
                const msgs = history.filter(function (m) { return (m.who === "me" || m.who === "pet") && !m.crisis && !m.sys; })
                    .slice(-REMOTE_MAX).map(function (m) { return { role: m.who === "me" ? "user" : "assistant", text: String(m.text).slice(0, MAX_IN) }; });
                if (!fetchFn || !msgs.length || msgs.some(function (m) { return m.role === "user" && isRisk(m.text); })) return local.reply(history, context);
                let timer = null, ctrl = null;
                try { ctrl = new AbortController(); } catch (e) { ctrl = null; }
                const timeout = new Promise(function (_, rej) { timer = setTimeout(function () { if (ctrl) ctrl.abort(); rej(new Error("timeout")); }, REMOTE_TIMEOUT); });
                const req = fetchFn(endpoint, {
                    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit", cache: "no-store",
                    referrerPolicy: "no-referrer", signal: ctrl ? ctrl.signal : undefined,
                    body: JSON.stringify({ lang: context.lang, pet: context.pet, world: context.world, messages: msgs })
                }).then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); });
                return Promise.race([req, timeout]).then(function (d) {
                    clearTimeout(timer);
                    if (d && d.crisis === true) return brain.crisis("text");
                    const text = String((d && d.text) || "").replace(/\s+/g, " ").trim().slice(0, 600);
                    if (!text || isRiskReply(text)) return local.reply(history, context);   // คำตอบมีคำเสี่ยง → ไม่แสดง ใช้ข้อความในเครื่อง
                    return { text: text, actions: cleanActions(d.actions), intent: "remote", remote: true };
                }).catch(function () {
                    clearTimeout(timer);
                    return local.reply(history, context);
                });
            }
        };
    }

    // ---------- รอบการคุย: ความปลอดภัยก่อนเสมอ → provider → ชวนพักเมื่อคุยนาน ----------
    function createSession(opts) {
        const getCtx = opts.getCtx;
        const brain = createBrain(getCtx, opts.rand);
        const local = createLocalProvider(brain);
        const history = [];
        let userCount = 0;
        function provider() {
            const c = getCtx();
            if (opts.provider) return opts.provider;
            const ep = remoteEndpoint();
            return (c.remote && ep) ? createRemoteProvider(ep, brain, opts.fetch) : local;
        }
        function push(m) { history.push(m); return m; }
        function handle(text, o) {
            o = o || {};
            text = cleanInput(text);
            if (!text) return Promise.resolve([]);
            const risky = isRisk(text);
            push({ who: "me", text: text, crisis: risky, noStore: risky || brain.state.risk });
            userCount++;
            if (risky) {
                if (opts.onRisk) { try { opts.onRisk(); } catch (e) { /* เก็บเวลาไม่ได้ก็ตอบต่อ */ } }
                return Promise.resolve([push(asPet(brain.crisis("text")))]);
            }
            // v29: เล่าว่าถูกทำร้าย/ถูกข่มขู่ → ข้อความตายตัว (safety.js) + 1300 / 191 · ไม่เก็บข้อความ ไม่ส่ง AI
            if (isAbuse(text)) {
                history[history.length - 1].noStore = true;
                if (opts.onRisk) { try { opts.onRisk(); } catch (e) { /* */ } }
                brain.state.risk = true;
                return Promise.resolve([push(asPet({ text: hkAbuseText("care"), actions: ["help"], intent: "abuse", crisis: true, abuse: true }))]);
            }
            const c = getCtx();
            const d = o.intent ? { intent: o.intent } : detect(text, c.lang);
            // ตอบในเครื่องเสมอ: ชิปที่แตะ / ถามว่าเป็นคนไหม / หลังพบความเสี่ยง / ล้อเล่น / ออฟไลน์
            const useLocal = o.intent || d.intent === "ask_human" || d.intent === "kidding" || brain.state.risk ||
                (typeof navigator !== "undefined" && navigator.onLine === false);
            const p = useLocal ? local : provider();
            const ctxForP = Object.assign({}, c, { opts: o.intent ? { intent: o.intent } : null });
            return p.reply(history, ctxForP).catch(function () { return brain.reply(text, o); }).then(function (r) {
                if (r.crisis && opts.onRisk && r.intent === "crisis") { try { opts.onRisk(); } catch (e) { /* */ } }
                const out = [push(asPet(r))];
                if (!brain.state.risk && userCount % NUDGE_EVERY === 0) out.push(push(asPet(brain.say("nudge"))));
                return out;
            });
        }
        function asPet(r) {
            return { who: "pet", text: r.text, actions: (r.actions || []).slice(), intent: r.intent, crisis: !!r.crisis, abuse: !!r.abuse, noStore: !!r.crisis || brain.state.risk };
        }
        function greet() { return push(asPet(brain.greet())); }
        function intro() { return push(asPet(brain.say("intro"))); }
        function restore(list) { list.forEach(function (m) { history.push(m); }); }
        function clear() { history.length = 0; userCount = 0; brain.reset(); }
        return { handle: handle, greet: greet, intro: intro, restore: restore, clear: clear, history: history, brain: brain,
            get risk() { return brain.state.risk; }, get count() { return userCount; }, providerName: function () { return provider().name; } };
    }

    const core = { forms: forms, detect: detect, isRisk: isRisk, createBrain: createBrain, createSession: createSession,
        createLocalProvider: createLocalProvider, createRemoteProvider: createRemoteProvider, cleanInput: cleanInput,
        MAX_IN: MAX_IN, NUDGE_EVERY: NUDGE_EVERY, KEEP_MAX: KEEP_MAX };

    // =================================================================
    // หน้าจอแชต (เฉพาะในเบราว์เซอร์ที่มีเกม)
    // =================================================================
    let ui = null;
    function initUI() {
        if (typeof document === "undefined" || !document.getElementById("stage") || typeof S === "undefined") return;
        const $id = function (id) { return document.getElementById(id); };
        const LG = (typeof L !== "undefined" && CHAT_UI[L]) ? L : "en";
        const U = CHAT_UI[LG];
        const STORE = "hikariChat_" + (typeof USER_KEY !== "undefined" ? USER_KEY : "guest");
        const AI_KEY = "hikariChatAI_" + (typeof USER_KEY !== "undefined" ? USER_KEY : "guest");
        const SEEN_KEY = "hikariChatSeen_" + (typeof USER_KEY !== "undefined" ? USER_KEY : "guest");
        function readLS(k, f) { try { const v = localStorage.getItem(k); return v === null ? f : JSON.parse(v); } catch (e) { return f; } }
        function writeLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* เก็บไม่ได้ก็คุยต่อได้ */ } }
        function delLS(k) { try { localStorage.removeItem(k); } catch (e) { /* */ } }
        function pet() { return (typeof petName === "function" && S.world) ? petName() : "Hikari"; }
        function voice() { return S.world ? ((PET_VOICE[L] || PET_VOICE.en)[S.world] || "") : ""; }
        function f(s) { return String(s || "").split("{pet}").join(pet()).split("{s}").join(voice()); }
        function distress() { try { return HikariSafety.inDistress(typeof USER_KEY !== "undefined" ? USER_KEY : "guest"); } catch (e) { return false; } }
        let aiOn = !!readLS(AI_KEY, false) && !!remoteEndpoint();
        const getCtx = function () {
            return { lang: LG, pet: pet(), voice: voice(), world: S.world, mood: S.mood ? S.mood[S.day] : null, distress: distress(), remote: aiOn };
        };
        const session = createSession({
            getCtx: getCtx,
            onRisk: function () { try { HikariSafety.markRisk(typeof USER_KEY !== "undefined" ? USER_KEY : "guest", "game"); } catch (e) { /* */ } }
        });

        // ----- ปุ่มเปิดแชตข้างน้อง -----
        const fab = document.createElement("button");
        fab.type = "button";
        fab.className = "chat-fab";
        fab.id = "chatBtn";
        fab.setAttribute("aria-haspopup", "dialog");
        fab.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6c-.5.4-1.3.1-1.3-.6V16A2.5 2.5 0 0 1 4 13.5z" fill="currentColor"/><circle cx="8.5" cy="9.5" r="1.2" fill="#fff"/><circle cx="12" cy="9.5" r="1.2" fill="#fff"/><circle cx="15.5" cy="9.5" r="1.2" fill="#fff"/></svg><span></span>';
        fab.querySelector("span").textContent = U.btn;
        fab.addEventListener("click", function (e) { e.stopPropagation(); open(); });
        $id("stage").appendChild(fab);

        // ----- หน้าต่างแชต -----
        const sheet = document.createElement("div");
        sheet.className = "sheet chat-sheet";
        sheet.id = "chatSheet";
        sheet.hidden = true;
        sheet.innerHTML =
            '<div class="sheet-box chat-box" role="dialog" aria-modal="true" aria-labelledby="chatTitle" aria-describedby="chatSub">' +
            '<header class="chat-head"><img class="chat-ava" id="chatAva" alt="">' +
            '<div class="chat-id"><h2 id="chatTitle" tabindex="-1"></h2><p id="chatSub"></p></div>' +
            '<button class="chat-hbtn chat-helpbtn" type="button" id="chatHelp"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" fill="currentColor"/></svg></button>' +
            '<button class="chat-hbtn" type="button" id="chatClose">×</button></header>' +
            '<div class="chat-log" id="chatLog" role="log" aria-live="polite" aria-relevant="additions"></div>' +
            '<div class="chat-chips" id="chatChips" role="group"></div>' +
            '<form class="chat-form" id="chatForm" autocomplete="off"><label class="chat-sr" for="chatInput" id="chatInputLabel"></label>' +
            '<input class="field chat-input" id="chatInput" type="text" maxlength="' + MAX_IN + '" enterkeyhint="send" autocomplete="off" spellcheck="false">' +
            '<button class="btn btn-primary chat-send" type="submit" id="chatSend"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" fill="currentColor"/></svg></button></form>' +
            '<div class="chat-foot"><label class="chat-keep"><input type="checkbox" id="chatKeep"> <span id="chatKeepTxt"></span></label>' +
            '<label class="chat-keep" id="chatAiRow" hidden><input type="checkbox" id="chatAi"> <span id="chatAiTxt"></span></label>' +
            '<button class="link-btn" type="button" id="chatClear"></button></div></div>';
        ($id("app") || document.body).appendChild(sheet);
        const log = $id("chatLog"), input = $id("chatInput"), chips = $id("chatChips");
        $id("chatHelp").setAttribute("aria-label", U.help);
        $id("chatHelp").title = U.help;
        $id("chatClose").setAttribute("aria-label", U.close);
        $id("chatSend").setAttribute("aria-label", U.send);
        $id("chatInputLabel").textContent = f(U.input);
        $id("chatKeepTxt").textContent = U.keep;
        $id("chatAiTxt").textContent = U.aiToggle;
        $id("chatClear").textContent = U.clear;
        chips.setAttribute("aria-label", U.chips);
        $id("chatAiRow").hidden = !remoteEndpoint();      // ไม่มี CHAT_ENDPOINT = ไม่มีตัวเลือก AI เลย
        $id("chatAi").checked = aiOn;

        let opener = null, busy = false, started = false;
        let keep = !!readLS(STORE, null);
        $id("chatKeep").checked = keep;

        // ----- เก็บในเครื่อง (เฉพาะเมื่อเปิด "จำ 30 ข้อความ") -----
        function persist() {
            if (!keep) return;
            const msgs = session.history.filter(function (m) { return !m.noStore && !m.sys && (m.who === "me" || m.who === "pet"); })
                .slice(-KEEP_MAX).map(function (m) { return { w: m.who, t: m.text, a: (m.actions || []).filter(function (a) { return CHAT_ACTIONS[a]; }) }; });
            writeLS(STORE, { v: 1, msgs: msgs });
        }
        $id("chatKeep").addEventListener("change", function () {
            keep = this.checked;
            if (keep) persist(); else delLS(STORE);
        });
        $id("chatAi").addEventListener("change", function () {
            aiOn = this.checked && !!remoteEndpoint();
            if (aiOn) writeLS(AI_KEY, true); else delLS(AI_KEY);
        });
        $id("chatClear").addEventListener("click", function () {
            session.clear();
            log.innerHTML = "";
            delLS(STORE);
            sysNote(U.cleared);
            renderChips();
            input.focus();
        });

        // ----- วาดข้อความ -----
        function petImg() { return (typeof img === "function" && S.world) ? img(WORLDS[S.world].pet.sit) : ""; }
        function sr(text) { const s = document.createElement("span"); s.className = "chat-sr"; s.textContent = text; return s; }
        function sysNote(text) {
            const p = document.createElement("p");
            p.className = "chat-sys";
            p.textContent = text;
            log.appendChild(p);
            scroll();
        }
        function bubble(m) {
            const row = document.createElement("div");
            row.className = "chat-msg " + (m.who === "me" ? "is-me" : "is-pet") + (m.crisis && m.who === "pet" ? " crisis" : "");
            if (m.who === "pet") {
                const a = document.createElement("img");
                a.className = "chat-mava";
                a.alt = "";
                a.src = petImg();
                row.appendChild(a);
            }
            const col = document.createElement("div");
            col.className = "chat-col";
            const b = document.createElement("div");
            b.className = "chat-bub";
            b.appendChild(sr((m.who === "me" ? U.you : pet()) + ": "));
            const t = document.createElement("span");
            if (m.who === "pet" && typeof setText === "function") setText(t, m.text); else t.textContent = m.text;
            b.appendChild(t);
            col.appendChild(b);
            if (m.who === "pet" && m.actions && m.actions.length) col.appendChild(actionsEl(m));
            row.appendChild(col);
            log.appendChild(row);
            scroll();
        }
        function scroll() { log.scrollTop = log.scrollHeight; }
        function iconImg(name) {
            const i = document.createElement("img");
            i.alt = "";
            i.src = typeof img === "function" ? img(name) : "game/img/" + name + ".webp";
            return i;
        }
        function actionsEl(m) {
            const box = document.createElement("div");
            box.className = "chat-acts";
            if (m.crisis) {
                // ข้อความวิกฤต: โทร 1323/1669 · สายด่วนทั่วโลก (นอกไทยขึ้นก่อน) · บอกคนที่ไว้ใจ · หน้าต่างช่วยเหลือ
                const calls = m.abuse ? hkAbuseCalls("btn btn-small") :           // v29: ถูกทำร้าย → 1300 / 191
                    (typeof callList === "function" ? callList([HK_LINES.mental, HK_LINES.emergency], true) : document.createElement("div"));
                const intl = hkIntlLink("btn btn-small chat-intl");
                const tell = document.createElement("button");
                tell.type = "button";
                tell.className = "btn btn-small";
                tell.textContent = hkHelpText("tell");
                tell.addEventListener("click", function () { run("talk"); });
                const help = document.createElement("button");
                help.type = "button";
                help.className = "btn btn-small help-btn";
                help.textContent = U.act_help;
                help.addEventListener("click", function () { run("help"); });
                if (hkIntlFirst()) box.append(intl, calls, tell, help); else box.append(calls, intl, tell, help);
                box.classList.add("crisis-acts");
                return box;
            }
            m.actions.forEach(function (id) {
                const def = CHAT_ACTIONS[id];
                if (!def) return;
                const el = document.createElement(def.href ? "a" : "button");
                el.className = "chat-act" + (id === "help" ? " is-help" : "");
                if (def.href) el.href = def.href; else el.type = "button";
                el.appendChild(iconImg(def.icon));
                const s = document.createElement("span");
                const b = document.createElement("b");
                b.textContent = U["act_" + id] || id;
                const small = document.createElement("small");
                small.textContent = id === "web_moodscreen" ? U.sub_web_moodscreen : def.href ? U.sub_web : U.sub_game;
                s.append(b, small);
                el.appendChild(s);
                if (!def.href) el.addEventListener("click", function () { run(def.run); });
                box.appendChild(el);
            });
            return box;
        }

        // ----- การ์ด: เปิดสิ่งที่อยู่ในเกม (หน้าต่างพักสั้น/ช่วยเหลืออยู่ "เหนือ" แชต ปิดแล้วกลับมาที่แชตได้) -----
        function quick(btnId) { openQuick(); const b = $id(btnId); if (b) b.click(); }
        const RUN = {
            sigh: function () { close(true); quickBreathe("sigh"); },
            b48: function () { close(true); quickBreathe("b48"); },
            breathe: function () { close(true); if (typeof setBreatheMode === "function") setBreatheMode("calm"); showTab("breathe"); },
            qb: function () { openQuick(); },
            stretch: function () { quick("qbStretch"); },
            pmr: function () { quick("qbPmr"); },
            walk: function () { quick("qbWalk"); },
            step: function () { quick("qbStep"); },
            talk: function () { close(true); openTalk(); },
            letters: function () { close(true); showTab("letters"); },
            help: function () { openHelp(); }
        };
        function run(name) { try { (RUN[name] || function () {})(); } catch (e) { /* ฟีเจอร์นั้นยังไม่พร้อม: แชตยังใช้ได้ */ } }

        // ----- ชิป -----
        const MOOD_INTENT = { great: "mood_good", good: "mood_good", meh: "mood_meh", sad: "mood_sad", stressed: "stressed" };
        function chip(label, fn, cls) {
            const b = document.createElement("button");
            b.type = "button";
            if (cls) b.className = cls;
            b.textContent = label;
            b.addEventListener("click", fn);
            chips.appendChild(b);
        }
        function renderChips() {
            chips.innerHTML = "";
            if (session.risk) {
                chip(U.chip_stay, function () { send(U.chip_stay, "stay"); });
                chip(U.act_help, function () { run("help"); }, "is-help");
                return;
            }
            const moodToday = S.mood && S.mood[S.day];
            if (!moodToday && typeof MOODS !== "undefined") {
                MOODS.forEach(function (m) {
                    const label = t("mood_" + m.id);
                    chip(label, function () { send(label, MOOD_INTENT[m.id]); }, "is-mood");
                });
            }
            [["chip_vent", "vent"], ["chip_work", "stressed_work"], ["chip_sleep", "sleep"], ["chip_lonely", "lonely"], ["chip_break", "ask_break"]].forEach(function (c) {
                chip(U[c[0]], function () { send(U[c[0]], c[1]); });
            });
        }

        // ----- ส่ง / พิมพ์ -----
        function typingEl() {
            const d = document.createElement("div");
            d.className = "chat-msg is-pet chat-typing";
            d.setAttribute("aria-hidden", "true");
            d.innerHTML = '<img class="chat-mava" alt=""><div class="chat-bub"><i></i><i></i><i></i></div>';
            d.querySelector("img").src = petImg();
            d.title = f(U.typing);
            return d;
        }
        function delayFor(text) { return Math.max(400, Math.min(900, 400 + String(text || "").length * 4)); }
        function send(text, intent) {
            if (busy) return;
            const clean = cleanInput(text);
            if (!clean) return;
            busy = true;
            const before = session.history.length;
            const p = session.handle(clean, intent ? { intent: intent } : null);
            bubble(session.history[before]);                  // ข้อความของผู้ใช้
            const tEl = typingEl();
            log.appendChild(tEl);
            scroll();
            const t0 = Date.now();
            p.then(function (replies) {
                const first = replies[0] || {};
                const wait = first.crisis ? 400 : delayFor(first.text);
                setTimeout(function () {
                    tEl.remove();
                    replies.forEach(bubble);
                    busy = false;
                    persist();
                    renderChips();
                }, Math.max(0, wait - (Date.now() - t0)));
            }, function () { tEl.remove(); busy = false; });
        }
        $id("chatForm").addEventListener("submit", function (e) {
            e.preventDefault();
            const v = input.value;
            if (!cleanInput(v) || busy) return;
            input.value = "";
            send(v);
        });

        // ----- เปิด / ปิด / โฟกัส -----
        function start() {
            if (started) return;
            started = true;
            sysNote(f(U.disclose));
            const saved = keep ? readLS(STORE, null) : null;
            if (saved && Array.isArray(saved.msgs) && saved.msgs.length) {
                const list = saved.msgs.slice(-KEEP_MAX).filter(function (m) { return m && (m.w === "me" || m.w === "pet") && typeof m.t === "string"; })
                    .map(function (m) { return { who: m.w, text: m.t.slice(0, 600), actions: cleanActions(m.a), restored: true }; });
                session.restore(list);
                list.forEach(bubble);
            }
            if (!readLS(SEEN_KEY, false)) { bubble(session.intro()); writeLS(SEEN_KEY, true); }
            bubble(session.greet());
            renderChips();
        }
        function open() {
            opener = document.activeElement;
            $id("chatAva").src = petImg();
            $id("chatAva").alt = pet();
            $id("chatTitle").textContent = f(U.title);
            $id("chatSub").textContent = U.sub;
            input.placeholder = f(U.placeholder);
            sheet.hidden = false;
            start();
            renderChips();
            scroll();
            // คอมพิวเตอร์: โฟกัสช่องพิมพ์ · มือถือ: โฟกัสหัวข้อ (ไม่ให้คีย์บอร์ดเด้งบังข้อความ)
            let fine = false;
            try { fine = window.matchMedia("(pointer: fine)").matches; } catch (e) { fine = false; }
            (fine ? input : $id("chatTitle")).focus();
        }
        function close(silent) {
            if (sheet.hidden) return;
            sheet.hidden = true;
            if (!silent) {
                if (opener && opener.focus && document.contains(opener)) opener.focus(); else fab.focus();
                const talked = session.history.some(function (m) { return m.who === "me" && !m.restored; });
                if (talked && !session.risk && typeof Pet !== "undefined" && Pet.say) Pet.say(f(U.after));
            }
        }
        $id("chatClose").addEventListener("click", function () { close(); });
        $id("chatHelp").addEventListener("click", function () { run("help"); });
        sheet.addEventListener("click", function (e) { if (e.target === sheet) close(); });
        sheet.addEventListener("keydown", function (e) {
            if (e.key === "Escape") { e.preventDefault(); close(); return; }
            if (e.key !== "Tab") return;
            const items = Array.prototype.filter.call(sheet.querySelectorAll("button, a[href], input"), function (el) {
                return !el.disabled && el.offsetParent !== null;
            });
            if (!items.length) return;
            const first = items[0], last = items[items.length - 1];
            if (e.shiftKey && (document.activeElement === first || document.activeElement === $id("chatTitle"))) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        });
        ui = { open: open, close: close, send: send, session: session };
    }
    if (typeof document !== "undefined" && document.addEventListener) {
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initUI);
        else setTimeout(initUI, 0);
    }

    return {
        core: core,
        open: function () { if (ui) ui.open(); },
        close: function () { if (ui) ui.close(); },
        get ui() { return ui; }
    };
})();
