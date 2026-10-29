// =====================================================================
// Hikari สวนแสง - game.js
// ส่วนที่ 1: ข้อมูลผู้เล่น (เก็บใน localStorage ของเบราว์เซอร์ ผูกกับบัญชีจากหน้าเว็บ)
// ส่วนที่ 2: ภาษา + เครื่องมือช่วย
// ส่วนที่ 3: วันใหม่ / วันต่อเนื่อง / แสง
// ส่วนที่ 4: เลือกโลก
// ส่วนที่ 5: บ้าน (ตัวละคร ฉาก เพื่อนมาเยี่ยม ภารกิจ เช็กอินอารมณ์ เรื่องที่หนักใจวันนี้ ช่วงเวลาทำงาน)
// ส่วนที่ 6: หายใจ 4·6 + ถอนหายใจยาว (ใช้เครื่องเดียวกัน ต่างแค่จังหวะ)
// ส่วนที่ 7: จดหมายใจดี
// ส่วนที่ 8: ร้านค้า + กล่องรางวัล 7 วัน
// ส่วนที่ 9: ชำระเงิน PromptPay + รหัสรับของ
// ส่วนที่ 10: ฉัน (คำสั่งซื้อ สถิติ อัลบั้ม)
// ส่วนที่ 11: แท็บ + เริ่มเกม
// ส่วนที่ 12: ขอความช่วยเหลือ / เปิดจากลิงก์จดหมาย / ความเป็นส่วนตัว / สรุปการทดสอบ
// ส่วนที่ 13: พักสั้น (ถอนหายใจ 1 นาที / หายใจ 4·8 / ยืดเหยียด 2 นาที / คลายกล้ามเนื้อ 3 นาที / เดิน 5 นาที / ก้าวเล็กถัดไป)
// ส่วนที่ 14: ชวนดูแลตัวเองเบา ๆ (เช็กใจสั้น ๆ / เช็กร่างกาย) + ชวนคนที่ไว้ใจคุย
// =====================================================================

// ===== 1. ข้อมูลผู้เล่น =====
function loadData(key, fallback) {
    try {
        const v = localStorage.getItem(key);
        if (v !== null) return JSON.parse(v);
    } catch (e) { /* ใช้ค่าเริ่มต้น */ }
    return fallback;
}
function saveData(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* บันทึกไม่ได้ก็เล่นต่อได้ */ }
}

const currentUser = loadData("hikariCurrentUser", null);          // จากหน้าเว็บ (null = ผู้เยี่ยมชม)
const users = loadData("hikariUsers", {});
// ช่วงทดสอบ = ยังไม่ใส่ PROMPTPAY_ID: ทุกคนใช้ราคา/สิทธิ์แบบ Free (ไม่มีส่วนลด ไม่มีส่งของขวัญ)
const TEST_MODE = PROMPTPAY_ID === "";
const plan = TEST_MODE ? "free" : ((currentUser && users[currentUser] && users[currentUser].plan) || "free");
const DISCOUNTS = { free: 0, premium: 0.10, careplus: 0.20 };
const PLAN_NAMES = { free: "Free", premium: "Premium", careplus: "Care+" };
const LETTER_LIMIT = 3;                                             // จดหมายต่อวัน (เท่ากันทุกคน)
const MAX_PLACED = 4;
const USER_KEY = currentUser || "guest";
const GAME_KEY = "hikariGame_" + USER_KEY;
const ORDERS_KEY = "hikariOrders_" + currentUser;                   // ใช้ร่วมกับหน้าเว็บ
const SITE = (typeof SITE_URL !== "undefined" && SITE_URL) ? SITE_URL : "https://mokarumokaruja-beep.github.io/hikari-stresscare/";
const CONTACT = typeof CONTACT_URL !== "undefined" ? CONTACT_URL : "";

// เล่นตอนยังไม่เข้าสู่ระบบ แล้วเพิ่งเข้าสู่ระบบ: ย้ายความคืบหน้าของผู้เยี่ยมชมมาไว้ในบัญชี (ถ้าบัญชียังไม่มีเซฟ)
let guestMoved = false;
(function moveGuestSave() {
    if (!currentUser) return;
    try {
        const guest = localStorage.getItem("hikariGame_guest");
        if (localStorage.getItem(GAME_KEY) === null && guest !== null) {
            localStorage.setItem(GAME_KEY, guest);
            localStorage.removeItem("hikariGame_guest");
            guestMoved = true;
        }
        // คำสั่งซื้อของผู้เยี่ยมชม (ถ้ามี) รวมเข้ากับของบัญชี
        ["hikariOrders_null", "hikariOrders_guest"].forEach(function (k) {
            const g = loadData(k, null);
            if (!Array.isArray(g)) return;
            const mine = loadData(ORDERS_KEY, []);
            g.forEach(function (o) { if (!mine.some(function (x) { return x.id === o.id; })) mine.push(o); });
            saveData(ORDERS_KEY, mine);
            localStorage.removeItem(k);
        });
    } catch (e) { /* อ่าน/เขียนไม่ได้ก็เล่นต่อได้ */ }
})();

const S = Object.assign({
    world: null, light: 0, streak: 0, lastActive: null, rewardDays: 0,
    owned: {}, wear: null, placed: [], met: {}, stamps: {}, tripStop: 0,
    day: null, today: {}, mood: {}, inbox: [], used: {},
    stats: { letters: 0, breathe: 0 },
    activeDays: 0, onboarded: false, askedSurvey: false, interest: {}, sound: "off", closedNotice: {},
    // สถิติการทดสอบ (เก็บในเครื่อง ใช้ทำรหัสสรุปให้วางในแบบสอบถาม ไม่มีอารมณ์หรือคะแนน)
    days: null, sessions: 0, breatheStarted: 0, breatheFinished: 0, lettersShared: 0, soundUsed: {}, iab: {}, ref: false
}, loadData(GAME_KEY, {}));
if (!Array.isArray(S.days)) S.days = S.lastActive ? [S.lastActive] : [];
// พักสั้น + เรื่องที่หนักใจ (เซฟเก่าไม่มีช่องเหล่านี้)
S.stats.qb = S.stats.qb || 0;
S.stats.qbKind = Object.assign({ sigh: 0, stretch: 0, step: 0, b48: 0, pmr: 0, walk: 0 }, S.stats.qbKind || {});
if (!S.causes || typeof S.causes !== "object") S.causes = {};
// ชวนดูแลตัวเอง: เก็บแค่วันที่แสดงล่าสุดของแต่ละแบบ { mood: "YYYY-MM-DD", check: "YYYY-MM-DD" }
if (!S.nudge || typeof S.nudge !== "object") S.nudge = {};
S.sessions = (S.sessions || 0) + 1;
function save() { saveData(GAME_KEY, S); }
// ข้อมูลจากหน้าเว็บ (โดเมนเดียวกัน) อ่านอย่างเดียว ห้ามเขียน: hikariProfile_ / hikariCheck_ / hikariDep_<ผู้ใช้>
function siteData(name) {
    const v = loadData(name + "_" + USER_KEY, null);
    return v && typeof v === "object" ? v : null;
}

// ===== 2. ภาษา + เครื่องมือช่วย =====
const siteLang = loadData("hikariLang", "th");
const L = GTEXT[siteLang] ? siteLang : (siteLang === "th" ? "th" : "en");   // ใช้ภาษาที่มีไฟล์แปล ถ้าไม่มีใช้ภาษาอังกฤษ
function t(key, values) {
    let s = (GTEXT[L][key] !== undefined ? GTEXT[L][key] : (GTEXT.en[key] !== undefined ? GTEXT.en[key] : GTEXT.th[key])) || key;
    for (const k in values || {}) s = s.split("{" + k + "}").join(values[k]);
    return s;
}
function img(name) { return "game/img/" + name + ".webp"; }
function $(id) { return document.getElementById(id); }
function itemName(id) { return ITEM_NAMES[L][id] || ITEM_NAMES.en[id] || ITEM_NAMES.th[id] || id; }
function petName() { return t("pet_" + S.world); }
function findItem(id) { return GAME_ITEMS.find(function (x) { return x.id === id; }); }
function bahtFor(price) { return Math.round(price * (1 - (DISCOUNTS[plan] || 0))); }
function placeName(id) { return PLACE_NAMES[L][id] || PLACE_NAMES.en[id] || id; }

let toastTimer = null;
function toast(text) {
    const el = $("toast");
    el.textContent = text;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2600);
}

// ใส่ข้อความ และทำให้เบอร์สายด่วน (1323 / 1669 / 1387) แตะเพื่อโทรได้
function setText(el, text) {
    el.textContent = "";
    text.split(/(1323|1669|1387)/).forEach(function (part, i) {
        if (i % 2) {
            const a = document.createElement("a");
            a.className = "tel";
            a.href = "tel:" + part;
            a.textContent = part;
            el.appendChild(a);
        } else if (part) el.appendChild(document.createTextNode(part));
    });
}
// ข้อความจดหมายในกล่องตามภาษาที่เลือกตอนนี้ (รองรับข้อมูลเก่าที่เก็บเป็นข้อความภาษาไทย/อังกฤษ)
function inboxText(m) {
    let i = typeof m.i === "number" ? m.i : -1;
    if (i < 0 && typeof m.text === "string") {
        i = LETTERS.th.indexOf(m.text);
        if (i < 0) i = LETTERS.en.indexOf(m.text);
    }
    if (i >= 0 && LETTERS[L] && LETTERS[L][i]) return LETTERS[L][i];
    if (i >= 0 && LETTERS.th[i]) return LETTERS.th[i];
    return typeof m.text === "string" ? m.text : "";
}
// ชื่อน้องสำหรับข้อความทั่วไป (ถ้ายังไม่ได้เลือกโลก ใช้คำกลาง ๆ)
function petLabel() {
    return S && S.world ? petName() : t("petGeneric");
}
function applyTexts() {
    document.documentElement.lang = L;
    document.documentElement.dir = L === "ar" ? "rtl" : "ltr";   // อาหรับอ่านจากขวาไปซ้าย
    document.title = t("title");
    document.querySelectorAll("[data-t]").forEach(function (el) {
        const txt = t(el.dataset.t, { pet: petLabel() });
        if (el.tagName === "A" || el.tagName === "BUTTON") el.textContent = txt;
        else setText(el, txt);
    });
    document.querySelectorAll("[data-t-aria]").forEach(function (el) { el.setAttribute("aria-label", t(el.dataset.tAria)); });
    $("payClose").setAttribute("aria-label", t("close"));
    $("itemClose").setAttribute("aria-label", t("close"));
    $("helpClose").setAttribute("aria-label", t("close"));
    $("qbClose").setAttribute("aria-label", t("close"));
}

// ===== 3. วันใหม่ / วันต่อเนื่อง / แสง =====
function dayStr(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
// คืนค่า true ถ้าเพิ่งขึ้นวันใหม่
function newDayCheck() {
    const today = dayStr();
    if (S.day === today) return false;
    S.day = today;
    S.today = { pet: false, mood: false, breathe: 0, letters: 0, visitor: false };
    // จดหมายจากน้องวันละ 1 ฉบับ
    // เก็บเป็นลำดับข้อความ (i) ไม่เก็บตัวข้อความ เพื่อให้เปลี่ยนภาษาแล้วจดหมายเปลี่ยนตาม
    const list = LETTERS[L];
    S.inbox.unshift({ day: today, i: Math.floor(Math.random() * list.length) });
    S.inbox = S.inbox.slice(0, 10);
    save();
    return true;
}
// เปิดค้างไว้ข้ามเที่ยงคืน: เช็กวันใหม่ ถ้าขึ้นวันใหม่ให้วาดหน้าปัจจุบันใหม่
let currentTab = null;
function rolloverCheck() {
    if (!newDayCheck()) return false;
    if (currentTab && RENDER[currentTab]) RENDER[currentTab]();
    renderTop();
    return true;
}
document.addEventListener("visibilitychange", function () { if (!document.hidden) rolloverCheck(); });
window.addEventListener("focus", rolloverCheck);

// เรียกเมื่อทำภารกิจใดก็ได้ ครั้งแรกของวัน = นับวันต่อเนื่อง และเติมกล่องรางวัล
function markActive() {
    newDayCheck();
    const today = dayStr();
    if (S.lastActive === today) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    S.streak = S.lastActive === dayStr(y) ? S.streak + 1 : 1;
    S.lastActive = today;
    S.rewardDays = Math.min(7, S.rewardDays + 1);
    S.activeDays = (S.activeDays || 0) + 1;
    if (S.days.indexOf(today) < 0) { S.days.push(today); S.days = S.days.slice(-60); }
    setTimeout(maybeAskSurvey, 1500);
}
// วันติดกัน: ถ้าวันล่าสุดที่เล่นเก่ากว่าเมื่อวาน = 0 (ไม่แสดงข้อความว่า "ขาด")
function currentStreak() {
    const y = new Date(); y.setDate(y.getDate() - 1);
    return (S.lastActive === dayStr() || S.lastActive === dayStr(y)) ? (S.streak || 0) : 0;
}

// ชวนทำแบบสอบถามครั้งเดียว เมื่อเล่นครบ 3 วัน (ไม่ต้องติดกัน)
function maybeAskSurvey() {
    if (!SURVEY_URL || S.askedSurvey || S.activeDays < 3 || !$("introSheet").hidden || !$("arriveSheet").hidden) return;
    S.askedSurvey = true;
    save();
    $("askImg").src = img(WORLDS[S.world].pet.happy);
    $("askGo").href = SURVEY_URL;
    $("askCode").hidden = true;
    $("askSheet").hidden = false;
    $("askGo").focus();
}
$("askLater").addEventListener("click", function () { $("askSheet").hidden = true; });
$("askGo").addEventListener("click", function () { $("askSheet").hidden = true; });

// ป้ายช่วงทดลอง หรือคำเตือนเมื่อเปิดจากในแอป LINE / Facebook / Instagram
function inAppName() {
    const ua = navigator.userAgent || "";
    if (/\bLine\//i.test(ua)) return "LINE";
    if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "Facebook";
    if (/Instagram/i.test(ua)) return "Instagram";
    return "";
}
function renderNotice() {
    const app = inAppName();
    const kind = app ? "line" : "test";
    const box = $("testNotice");
    box.hidden = !!S.closedNotice[kind];
    box.className = "notice" + (app ? " line" : "");
    // LINE รองรับ ?openExternalBrowser=1 (เปิดลิงก์นี้ในเบราว์เซอร์ของเครื่อง) ส่วน Facebook / Instagram ต้องกดเมนูเอง
    $("testNoticeText").textContent = app ? t(app === "LINE" ? "lineNotice" : "inAppHint", { app: app }) : t("testNotice");
    $("openExternal").hidden = app !== "LINE";
    $("testNoticeClose").onclick = function () { S.closedNotice[kind] = true; save(); box.hidden = true; };
}
$("openExternal").addEventListener("click", function () {
    const u = new URL(location.href);
    u.searchParams.set("openExternalBrowser", "1");
    location.href = u.toString();
});
function addLight(n) {
    S.light += n;
    markActive();
    save();
    renderTop();
}
// ชิปหัวจอ: จำนวนวันที่อยู่ด้วยกันทั้งหมด (ไม่ลดลงถ้าหายไป) ส่วนวันติดกันดูได้ในแท็บ "ฉัน"
function renderTop() {
    $("lightCount").textContent = S.light;
    $("daysCount").textContent = S.activeDays || 0;
    $("daysChip").title = t("daysTogether");
    $("daysChip").setAttribute("aria-label", t("daysTogether") + " " + (S.activeDays || 0));
}

// ===== 4. เลือกโลก =====
let pickChoice = null;
function renderPick() {
    const grid = $("worldGrid");
    grid.innerHTML = "";
    pickChoice = pickChoice || S.world || "cat";
    Object.keys(WORLDS).forEach(function (id) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "world-card";
        b.setAttribute("aria-pressed", String(pickChoice === id));
        b.innerHTML = '<img alt=""><b></b><span></span>';
        b.querySelector("img").src = img(WORLDS[id].pet.happy);
        b.querySelector("b").textContent = t("world_" + id);
        b.querySelector("span").textContent = t("worldDesc_" + id);
        b.addEventListener("click", function () { pickChoice = id; renderPick(); });
        grid.appendChild(b);
    });
}
$("pickStart").addEventListener("click", function () {
    S.world = pickChoice;
    applyTexts();   // ข้อความที่มี {pet} ให้เปลี่ยนเป็นชื่อน้องที่เลือก
    save();
    showTab("home");
    if (!S.onboarded) openIntro();
});

// ===== หน้าแนะนำผู้เล่นใหม่ 3 หน้า =====
let introPage = 0;
function openIntro() {
    introPage = 0;
    renderIntro();
    $("introSheet").hidden = false;
    $("introNext").focus();
}
function renderIntro() {
    const pages = [
        { img: WORLDS[S.world].pet.happy, t: "intro1T", d: "intro1" },
        { img: "icon_garden", t: "intro2T", d: "intro2" },
        { img: WORLDS[S.world].pet.sleep, t: "intro3T", d: "intro3" }
    ];
    const pg = pages[introPage];
    $("introImg").src = img(pg.img);
    $("introTitle").textContent = t(pg.t);
    setText($("introText"), t(pg.d, { pet: petName() }));
    $("introNext").textContent = introPage === 2 ? t("introStart") : t("introNext");
    $("introSkip").hidden = introPage === 2;
    document.querySelectorAll("#introDots i").forEach(function (d, i) { d.className = i === introPage ? "on" : ""; });
}
function closeIntro() {
    $("introSheet").hidden = true;
    S.onboarded = true;
    save();
}
$("introNext").addEventListener("click", function () {
    if (introPage < 2) { introPage++; renderIntro(); } else closeIntro();
});
$("introSkip").addEventListener("click", closeIntro);
$("replayIntro").addEventListener("click", openIntro);

// ===== 5. บ้าน =====
function timeOfDay() {
    const h = new Date().getHours();
    return (h >= 20 || h < 6) ? "night" : (h >= 17 ? "evening" : "day");
}
// ช่วงเวลาของคนทำงาน (เวลาของเครื่อง) ใช้เลือกคำพูดของน้องใน PET_LINES · null = ไม่มีช่วงพิเศษ
function workMoment(d) {
    d = d || new Date();
    const m = d.getHours() * 60 + d.getMinutes(), day = d.getDay();      // 0 = อาทิตย์
    if (m >= 22 * 60 || m < 5 * 60) return "lateNight";
    if (day === 1 && m < 11 * 60 + 30) return "monday";
    if (day === 5 && m >= 16 * 60) return "friday";
    if (day === 0 || day === 6) return "weekend";
    if (m < 9 * 60) return "morning";
    if (m >= 11 * 60 + 30 && m < 13 * 60 + 30) return "lunch";
    if (m >= 15 * 60 && m < 17 * 60) return "slump";
    if (m >= 17 * 60) return "afterWork";
    return null;
}
// สุ่มเพื่อนที่มาเยี่ยมวันนี้ (ทั้งวันเป็นตัวเดิม)
function todaysVisitor() {
    const list = WORLDS[S.world].visitors;
    if (!list.length) return null;
    let h = 0;
    const key = S.day + S.world;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    return list[h % list.length];
}
function stageBg() {
    if (S.world === "trip") return TRIP_STOPS[S.tripStop % TRIP_STOPS.length].bg;
    return WORLDS[S.world].bg[timeOfDay()];
}
function renderHome() {
    renderNotice();
    const w = WORLDS[S.world];
    const night = timeOfDay() === "night";
    $("stageBg").src = img(stageBg());
    if (typeof Pet !== "undefined") Pet.enter();          // น้องมีชีวิต (game-pet.js)

    // ของที่ใส่อยู่
    $("wearBadge").hidden = !S.wear;
    if (S.wear) {
        $("wearImg").src = img(S.wear);
        $("wearImg").alt = itemName(S.wear);
    }
    // ของแต่งที่วางในฉาก
    const row = $("decorRow");
    row.innerHTML = "";
    S.placed.slice(0, MAX_PLACED).forEach(function (id) {
        const im = document.createElement("img");
        im.src = img(id);
        im.alt = itemName(id);
        row.appendChild(im);
    });
    // เพื่อนมาเยี่ยม
    const v = todaysVisitor();
    $("visitorBtn").hidden = !v || S.today.visitor;
    if (v) {
        $("visitorImg").src = img(v);
        $("visitorBtn").setAttribute("aria-label", t("visitor"));
    }
    // ทริปแสง: บอกสถานที่
    $("tripAt").hidden = S.world !== "trip";
    if (S.world === "trip") {
        $("tripAt").textContent = t("tripAt", { place: placeName(TRIP_STOPS[S.tripStop % TRIP_STOPS.length].id) });
    }
    renderTasks();
    renderMood();
    renderNudge();
}

$("visitorBtn").addEventListener("click", function () {
    const v = todaysVisitor();
    if (!v || S.today.visitor) return;
    S.today.visitor = true;
    S.met[v] = true;
    addLight(1);
    toast(t("visitorThanks", { n: 1 }));
    if (typeof Pet !== "undefined") Pet.greetVisitor();
    renderHome();
});

function renderTasks() {
    const tasks = [
        { done: S.today.pet, icon: "icon_heart", text: t("taskPet", { pet: petName() }), gain: 1 },
        { done: S.today.mood, icon: "mood_sun-happy", text: t("taskMood"), gain: 2 },
        // พักสั้นนับเป็นภารกิจหายใจด้วย
        { done: S.today.breathe > 0 || S.today.qb > 0, icon: "icon_breathe", text: t("taskBreathe"), gain: 3, tab: "breathe" },
        { done: S.today.letters > 0, icon: "mood_journal", text: t("taskLetter"), gain: 1, tab: "letters" }
    ];
    const list = $("taskList");
    list.innerHTML = "";
    tasks.forEach(function (k) {
        const li = document.createElement("li");
        li.className = k.done ? "done" : "";
        li.innerHTML = '<img alt=""><span></span><em></em>';
        li.querySelector("img").src = img(k.done ? "icon_check" : k.icon);
        li.querySelector("span").textContent = k.text;
        li.querySelector("em").textContent = "+" + k.gain;
        if (k.tab && !k.done) {
            li.style.cursor = "pointer";
            li.addEventListener("click", function () { showTab(k.tab); });
        }
        list.appendChild(li);
    });
}

function renderMood() {
    const row = $("moodRow");
    row.innerHTML = "";
    const picked = S.mood[S.day];
    MOODS.forEach(function (m) {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-pressed", String(picked === m.id));
        b.innerHTML = '<img alt=""><span></span>';
        b.querySelector("img").src = img(m.img);
        b.querySelector("span").textContent = t("mood_" + m.id);
        b.addEventListener("click", function () {
            rolloverCheck();
            S.mood[S.day] = m.id;
            let msg = "";
            if (!S.today.mood) {
                S.today.mood = true;
                addLight(2);
                msg = t("moodThanks", { n: 2 });
            }
            save();
            renderMood();
            renderTasks();
            if (typeof Pet !== "undefined") Pet.onMood(m.id);
            const box = $("moodMsg");
            if (m.id === "sad" || m.id === "stressed") {
                // ชวนพักสั้นก่อน แล้วค่อยบอกช่องทางขอความช่วยเหลือ
                box.textContent = "";
                const p = document.createElement("p");
                p.className = "mood-qb";
                p.textContent = t("moodQb", { pet: petName() });
                const qb = document.createElement("button");
                qb.type = "button";
                qb.className = "btn btn-small btn-primary";
                qb.id = "moodQbBtn";
                qb.textContent = t("moodQbBtn", { pet: petName() });
                qb.addEventListener("click", function () { openQuick(); });
                box.append(p, qb);
                if (m.id === "sad") {
                    // เศร้า: น้องชวนคุยกับคนที่ไว้ใจด้วย
                    const tp = document.createElement("p");
                    tp.className = "mood-qb";
                    tp.textContent = petName() + ": " + t("moodTalk");
                    const tb = document.createElement("button");
                    tb.type = "button";
                    tb.className = "btn btn-small";
                    tb.id = "moodTalkBtn";
                    tb.textContent = t("moodTalkBtn");
                    tb.addEventListener("click", openTalk);
                    box.append(tp, tb);
                }
                const help = document.createElement("p");
                setText(help, t("moodHelp", { pet: petName() }));
                box.append(help);
                box.appendChild(callList(["1323", "1669", "1387"], true));
            } else box.textContent = msg;
            renderCause();
            renderNudge();
        });
        row.appendChild(b);
    });
    renderCause();
}

// ----- เรื่องที่หนักใจวันนี้: แตะได้ 1 หมวดต่อวัน เก็บแค่รหัสหมวด (S.today.cause) + จำนวนวัน (S.causes) -----
function renderCause() {
    const box = $("causeBox");
    box.hidden = !S.mood[S.day];
    if (box.hidden) return;
    const row = $("causeRow");
    row.innerHTML = "";
    const picked = S.today.cause;
    CAUSES.forEach(function (k) {
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.cause = k;
        b.setAttribute("aria-pressed", String(picked === k));
        b.textContent = t("cause_" + k);
        b.addEventListener("click", function () { pickCause(k); });
        row.appendChild(b);
    });
    $("causeTip").hidden = !picked;
    if (picked) {
        $("causeImg").src = img(WORLDS[S.world].pet.sit);
        $("causeFrom").textContent = t("causeFrom", { pet: petName() });
        $("causeTipText").textContent = t("tip_" + picked);
    }
    $("causeTalk").hidden = picked !== "family";
}
function pickCause(k) {
    if (CAUSES.indexOf(k) < 0) return;
    rolloverCheck();
    const old = S.today.cause;
    if (old === k) return;
    if (old && S.causes[old]) {                         // เปลี่ยนใจวันเดียวกัน = นับวันนี้เป็นหมวดใหม่แทน
        S.causes[old]--;
        if (!S.causes[old]) delete S.causes[old];
    }
    S.causes[k] = (S.causes[k] || 0) + 1;
    S.today.cause = k;
    save();
    renderCause();
    // ครอบครัว: น้องชวนคุยกับคนที่ไว้ใจด้วย (แตะคำพูดเพื่อไปเลือกข้อความ)
    if (typeof Pet !== "undefined") {
        if (k === "family") Pet.say(t("tip_" + k) + " " + t("talkHint"), openTalk);
        else Pet.say(t("tip_" + k));
    }
}
$("causeTalk").addEventListener("click", function () { openTalk(); });
// หมวดที่เลือกบ่อยที่สุด (เสมอกัน = ตามลำดับใน CAUSES) ใช้ในรหัสสรุป
function topCause() {
    let best = "-", n = 0;
    CAUSES.forEach(function (k) { if ((S.causes[k] || 0) > n) { n = S.causes[k]; best = k; } });
    return best;
}

// ===== 6. หายใจ 4·6 =====
let breatheTimer = null, breatheSec = 0, breatheRunning = false;

// ----- เสียงประกอบ: สร้างด้วย Web Audio ในเบราว์เซอร์ (ไม่ต้องโหลดไฟล์เสียง ไม่มีปัญหาลิขสิทธิ์) -----
const SOUNDS = ["off", "rain", "stream", "purr", "bowl"];
let actx = null, ambient = null;
function audioCtx() {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    if (!actx) actx = new C();
    if (actx.state === "suspended") actx.resume();
    return actx;
}
function noiseSource(ctx, brown) {
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    return src;
}
function filter(ctx, type, freq, q) {
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq;
    if (q) f.Q.value = q;
    return f;
}
function startAmbient(kind) {
    stopAmbient();
    if (kind === "off" || kind === "bowl") return;
    const ctx = audioCtx();
    if (!ctx) return;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(ctx.destination);
    const parts = [];
    if (kind === "rain") {
        const n = noiseSource(ctx, false), hp = filter(ctx, "highpass", 900), lp = filter(ctx, "lowpass", 6500), g = ctx.createGain();
        g.gain.value = 0.10;
        n.connect(hp).connect(lp).connect(g).connect(out);
        const b = noiseSource(ctx, true), g2 = ctx.createGain();
        g2.gain.value = 0.25;
        b.connect(filter(ctx, "lowpass", 400)).connect(g2).connect(out);
        parts.push(n, b);
    } else if (kind === "stream") {
        const n = noiseSource(ctx, true), bp = filter(ctx, "bandpass", 700, 0.6), g = ctx.createGain();
        g.gain.value = 0.55;
        const lfo = ctx.createOscillator(), depth = ctx.createGain();
        lfo.frequency.value = 0.18; depth.gain.value = 0.18;
        lfo.connect(depth).connect(g.gain);
        n.connect(bp).connect(g).connect(out);
        parts.push(n, lfo);
    } else if (kind === "purr") {
        const n = noiseSource(ctx, true), lp = filter(ctx, "lowpass", 160), am = ctx.createGain();
        am.gain.value = 0.5;
        const lfo = ctx.createOscillator(), depth = ctx.createGain();
        lfo.frequency.value = 24; depth.gain.value = 0.45;
        lfo.connect(depth).connect(am.gain);
        const slow = ctx.createOscillator(), slowDepth = ctx.createGain();   // ขึ้นลงช้า ๆ เหมือนหายใจ
        slow.frequency.value = 0.1; slowDepth.gain.value = 0.25;
        slow.connect(slowDepth).connect(am.gain);
        n.connect(lp).connect(am).connect(out);
        parts.push(n, lfo, slow);
    }
    parts.forEach(function (p) { p.start(); });
    out.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 1.5);
    ambient = { out: out, parts: parts };
}
function stopAmbient() {
    if (!ambient || !actx) return;
    const a = ambient;
    ambient = null;
    a.out.gain.cancelScheduledValues(actx.currentTime);
    a.out.gain.setValueAtTime(a.out.gain.value, actx.currentTime);
    a.out.gain.linearRampToValueAtTime(0, actx.currentTime + 0.8);
    setTimeout(function () { a.parts.forEach(function (p) { try { p.stop(); } catch (e) { /* หยุดแล้ว */ } }); a.out.disconnect(); }, 900);
}
// ระฆังเบา ๆ ตอนเปลี่ยนจังหวะหายใจ
function bell(high) {
    const ctx = audioCtx();
    if (!ctx) return;
    const base = high ? 528 : 396, now = ctx.currentTime;
    [[1, 0.22], [2, 0.06], [3, 0.03]].forEach(function (h) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = base * h[0];
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(h[1], now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
        o.connect(g).connect(ctx.destination);
        o.start(now); o.stop(now + 3.3);
    });
}
function renderSounds() {
    const row = $("soundRow");
    row.innerHTML = "";
    row.setAttribute("aria-label", t("soundLabel"));
    SOUNDS.forEach(function (k) {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "radio");
        b.setAttribute("aria-checked", String(S.sound === k));
        b.textContent = t("sound_" + k);
        b.addEventListener("click", function () {
            S.sound = k;
            if (k !== "off") S.soundUsed[k] = true;
            save();
            renderSounds();
            startAmbient(k);
            if (k === "bowl") bell(true);
        });
        row.appendChild(b);
    });
}

// จังหวะหายใจ: [ช่วง, วินาที] วนซ้ำจนครบ 60 วินาที · scale = ขนาดน้องตอนจบช่วงนั้น (น้องพองตัว/ยุบตัวตามจังหวะ)
// calm = หายใจ 4·6 (แท็บหายใจ) · sigh = ถอนหายใจยาว (พักสั้น): สูดเข้า 2 + สูดเพิ่ม 1 แล้วถอนหายใจออก 6
// b48 = หายใจ 4·8 (พักสั้น): เข้า 4 ออก 8 · จังหวะที่มี done = นับเป็นพักสั้น (qbKind ใช้ชื่อจังหวะ)
const BREATHE_PATTERNS = {
    calm: { phases: [["in", 4, 1.14], ["out", 6, 0.94]], title: "breatheTitle", hint: "breatheHint", start: "breatheStart" },
    sigh: { phases: [["in", 2, 1.1], ["in2", 1, 1.17], ["out", 6, 0.94]], title: "sighTitle", hint: "sighHint", start: "sighStart", done: "sighDone" },
    b48: { phases: [["in", 4, 1.14], ["out", 8, 0.92]], title: "b48Title", hint: "b48Hint", start: "b48Start", done: "b48Done" }
};
const BREATHE_SEC = 60;
let breatheMode = "calm";
function setBreatheMode(mode) {
    if (breatheRunning || !BREATHE_PATTERNS[mode]) return;
    if (mode !== breatheMode) breatheSec = 0;
    breatheMode = mode;
}
// ช่วงหายใจตอนวินาทีที่ sec: { k: "in" | "in2" | "out", len, scale, first: true ถ้าเพิ่งเริ่มช่วงนี้ }
function breathePhase(sec) {
    const ph = BREATHE_PATTERNS[breatheMode].phases;
    const cycle = ph.reduce(function (a, p) { return a + p[1]; }, 0);
    let r = sec % cycle;
    for (let i = 0; i < ph.length; i++) {
        if (r < ph[i][1]) return { k: ph[i][0], len: ph[i][1], scale: ph[i][2], first: r === 0 };
        r -= ph[i][1];
    }
    return { k: "in", len: 1, scale: 1, first: false };
}
function renderBreathe() {
    renderSounds();
    const w = WORLDS[S.world], pat = BREATHE_PATTERNS[breatheMode];
    $("screen-breathe").dataset.mode = breatheMode;
    $("breatheTitle").textContent = t(pat.title, { pet: petName() });
    $("breatheImg").src = img(w.pet.sleep);
    $("breatheImg").alt = petName();
    $("breatheHint").textContent = t(pat.hint, { pet: petName() });
    updateBreathe();
}
function updateBreathe() {
    const ph = breathePhase(breatheSec), sigh = breatheMode === "sigh";
    const words = { "in": sigh ? "sighIn" : "breatheIn", in2: "sighIn2", out: sigh ? "sighOut" : "breatheOut" };
    $("breathePhase").textContent = breatheRunning ? t(words[ph.k]) : t("breatheReady");
    $("breatheClock").textContent = "0:" + String(Math.max(0, BREATHE_SEC - breatheSec)).padStart(2, "0");
    $("breatheBtn").textContent = breatheRunning ? t("breatheStop") : t(BREATHE_PATTERNS[breatheMode].start);
    const ring = $("breatheRing");
    ring.classList.toggle("out", breatheRunning && ph.k === "out");
    const im = $("breatheImg");
    // ความเร็วการพองตัวเท่ากับความยาวของช่วงหายใจ น้องจึงหายใจไปพร้อมผู้ใช้พอดี
    im.style.transitionDuration = breatheRunning ? ph.len + "s" : "";
    im.style.transform = breatheRunning ? "scale(" + ph.scale + ")" : "scale(1)";
}
function stopBreathe() {
    clearInterval(breatheTimer);
    breatheRunning = false;
    updateBreathe();
}
function startBreathe() {
    if (breatheRunning) return;
    if (breatheSec >= BREATHE_SEC) breatheSec = 0;
    if (breatheSec === 0 && breatheMode === "calm") { S.breatheStarted++; save(); }     // นับเฉพาะการเริ่มรอบใหม่ (ไม่นับกดเล่นต่อหลังพัก)
    breatheRunning = true;
    $("breatheMsg").textContent = "";
    updateBreathe();
    if (!ambient) startAmbient(S.sound);
    if (S.sound === "bowl") bell(true);
    breatheTimer = setInterval(function () {
        breatheSec++;
        const ph = breathePhase(breatheSec);
        if (S.sound === "bowl" && breatheSec < BREATHE_SEC && ph.first && ph.k !== "in2") bell(ph.k === "in");
        if (breatheSec >= BREATHE_SEC) {
            stopBreathe();
            finishBreathe();
            return;
        }
        updateBreathe();
    }, 1000);
}
$("breatheBtn").addEventListener("click", function () {
    if (breatheRunning) stopBreathe(); else startBreathe();
});
function finishBreathe() {
    rolloverCheck();
    const pat = BREATHE_PATTERNS[breatheMode];
    if (pat.done) {
        // ถอนหายใจยาว / หายใจ 4·8 = พักสั้น (ได้แสงตามโควตาพักสั้น ไม่ใช่โควตาหายใจ 4·6)
        S.stats.breathe++;
        const got = finishQuick(breatheMode);
        $("breatheMsg").textContent = t(pat.done) + " " + got;
        $("breatheMsg").className = "note center ok";
        return;
    }
    S.breatheFinished++;
    S.stats.breathe++;
    S.today.breathe++;
    const gain = S.today.breathe === 1 ? 3 : (S.today.breathe <= 3 ? 1 : 0);
    let msg = gain ? t("breatheDone", { n: gain }) : t("breatheDoneMax");
    if (gain) addLight(gain); else { markActive(); save(); }
    // ทริปแสง: ได้แสตมป์สถานที่ แล้วไปที่ถัดไป
    if (S.world === "trip" && S.today.breathe === 1) {
        const stop = TRIP_STOPS[S.tripStop % TRIP_STOPS.length];
        S.stamps[stop.id] = true;
        S.tripStop = (S.tripStop + 1) % TRIP_STOPS.length;
        msg += " · " + t("stampGot", { place: placeName(stop.id) });
        save();
    }
    $("breatheMsg").textContent = msg;
    $("breatheMsg").className = "note center ok";
}

// ===== 7. จดหมายใจดี =====
let letterPick = 0;
function renderLetters() {
    const left = Math.max(0, LETTER_LIMIT - S.today.letters);
    $("lettersLeft").textContent = left ? t("lettersLeft", { n: left }) : t("lettersNone");
    const list = $("letterList");
    list.innerHTML = "";
    LETTERS[L].forEach(function (text, i) {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "radio");
        b.setAttribute("aria-checked", String(letterPick === i));
        b.textContent = text;
        b.addEventListener("click", function () { letterPick = i; renderLetters(); });
        list.appendChild(b);
    });
    $("letterSend").disabled = left === 0;
    renderTalk();
    const inbox = $("inboxList");
    inbox.innerHTML = "";
    S.inbox.forEach(function (m) {
        const d = document.createElement("div");
        d.className = "inbox-item";
        d.innerHTML = "<small></small><span></span>";
        d.querySelector("small").textContent = t("inboxFrom", { pet: petName() }) + " · " + m.day;
        d.querySelector("span").textContent = inboxText(m);
        inbox.appendChild(d);
    });
}
// ส่งจดหมาย = เปิดหน้าแชร์ของ LINE ให้ผู้เล่นเลือกเพื่อนเอง (ไม่มีเซิร์ฟเวอร์ ไม่เก็บว่าใครส่งถึงใคร)
// ลิงก์ในข้อความ: game.html?letter=<ลำดับข้อความ>&from=<โลก> เพื่อนเปิดแล้วจะเห็นการ์ดจดหมายก่อนเข้าเกม
function letterShareUrl(i) {
    const link = SITE + "game.html?letter=" + i + "&from=" + S.world + "&openExternalBrowser=1";
    return "https://line.me/R/share?text=" + encodeURIComponent(LETTERS[L][i] + "\n" + link);
}
$("letterSend").addEventListener("click", function () {
    rolloverCheck();
    const msgBox = $("letterMsg");
    if (S.today.letters >= LETTER_LIMIT) return;
    const url = letterShareUrl(letterPick);
    const w = window.open(url, "_blank");
    if (w) { try { w.opener = null; } catch (e) { /* ไม่เป็นไร */ } } else location.href = url;
    S.today.letters++;
    S.stats.letters++;
    S.lettersShared++;
    addLight(1);
    msgBox.textContent = t("letterSent", { n: 1 });
    msgBox.className = "note ok";
    renderLetters();
});

// ===== 8. ร้านค้า =====
let shopCat = "wear";
const CATS = ["wear", "home", "trip", "pack", "owned"];
function isOwned(item) {
    if (item.contains) return item.contains.every(function (c) { return S.owned[c]; });
    return !!S.owned[item.id];
}
function priceHtml(item) {
    if (item.light) {
        return '<span class="price"><img src="' + img("icon_light-currency") + '" alt="">' + item.light + "</span>";
    }
    const p = bahtFor(item.baht);
    return '<span class="price baht">฿' + p + (p !== item.baht ? " <s>฿" + item.baht + "</s>" : "") + "</span>";
}
function renderShop() {
    $("shopPlan").textContent = t("plan") + " " + PLAN_NAMES[plan];
    renderReward();
    const row = $("catRow");
    row.innerHTML = "";
    CATS.forEach(function (c) {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", String(shopCat === c));
        b.textContent = t("cat_" + c);
        b.addEventListener("click", function () { shopCat = c; renderShop(); });
        row.appendChild(b);
    });
    const grid = $("itemGrid");
    grid.innerHTML = "";
    const list = shopCat === "owned" ? GAME_ITEMS.filter(function (x) { return !x.contains && S.owned[x.id]; }) :
        GAME_ITEMS.filter(function (x) { return x.type === shopCat; });
    list.forEach(function (item) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "item-card";
        const own = isOwned(item);
        b.innerHTML = (item.tag && !own ? '<span class="tag ' + item.tag + '">' + t("tag_" + item.tag) + "</span>" : "") +
            (own ? '<span class="tag own">' + t("owned") + "</span>" : "") +
            '<img alt=""><span class="nm"></span>' + priceHtml(item);
        b.querySelector("img").src = img(item.img || item.id);
        b.querySelector(".nm").textContent = itemName(item.id);
        b.addEventListener("click", function () { openItem(item); });
        grid.appendChild(b);
    });
}

// กล่องรางวัล: เล่นครบ 7 วัน (ไม่ต้องติดกัน) เลือกของราคา ฿19 ฟรี 1 ชิ้น
function renderReward() {
    const box = $("rewardBox");
    box.innerHTML = "";
    const h = document.createElement("h2");
    h.textContent = t("rewardTitle");
    const p = document.createElement("p");
    box.append(h, p);
    if (S.rewardDays < 7) {
        p.textContent = t("rewardWait", { n: 7 - S.rewardDays });
        const bar = document.createElement("div");
        bar.className = "progress";
        bar.innerHTML = '<i style="width:' + Math.round(S.rewardDays / 7 * 100) + '%"></i>';
        box.appendChild(bar);
        return;
    }
    // ของ ฿19 ที่ยังไม่มี → ถ้ามีครบแล้ว ใช้ของแลกแสงหรือของ ฿29 ที่ยังไม่มี → ถ้ามีครบทุกชิ้น ให้ +20 แสงแทน
    let choices = GAME_ITEMS.filter(function (x) { return x.baht === 19 && !S.owned[x.id]; });
    p.textContent = t("rewardReady");
    if (!choices.length) {
        choices = GAME_ITEMS.filter(function (x) { return !x.contains && (x.light || x.baht === 29) && !S.owned[x.id]; });
        p.textContent = t("rewardReadyAlt");
    }
    if (!choices.length) {
        p.textContent = t("rewardAllOwned");
        const lb = document.createElement("button");
        lb.type = "button";
        lb.className = "btn btn-primary";
        lb.id = "rewardLightBtn";
        lb.textContent = t("rewardLight", { n: 20 });
        lb.addEventListener("click", function () {
            S.rewardDays = 0;
            addLight(20);
            toast(t("rewardLightGot", { n: 20 }));
            renderShop();
        });
        box.appendChild(lb);
        return;
    }
    const picks = document.createElement("div");
    picks.className = "reward-picks";
    choices.forEach(function (item) {
        const b = document.createElement("button");
        b.type = "button";
        b.innerHTML = '<img alt=""><span></span>';
        b.querySelector("img").src = img(item.id);
        b.querySelector("span").textContent = itemName(item.id);
        b.addEventListener("click", function () {
            S.owned[item.id] = true;
            S.rewardDays = 0;
            save();
            toast(t("rewardGot", { name: itemName(item.id) }));
            renderShop();
        });
        picks.appendChild(b);
    });
    box.appendChild(picks);
}

let openedItem = null;
function openItem(item) {
    openedItem = item;
    $("itemImg").src = img(item.img || item.id);
    $("itemImg").alt = itemName(item.id);
    $("itemName").textContent = itemName(item.id);
    $("itemMsg").textContent = "";
    $("itemMsg").className = "note";
    $("giftBox").hidden = true;
    $("giftTo").value = "";
    const info = $("itemInfo");
    info.innerHTML = "";
    if (item.contains) {
        info.textContent = t("packHas", { n: item.contains.length, list: item.contains.map(itemName).join(", ") });
        const pl = document.createElement("div");
        pl.className = "pack-list";
        item.contains.forEach(function (c) {
            const im = document.createElement("img");
            im.src = img(c);
            im.alt = itemName(c);
            pl.appendChild(im);
        });
        info.appendChild(pl);
    } else if (item.type === "wear") {
        info.textContent = t("dressNote");
    }
    // ราคา 3 แผน (เฉพาะของที่ซื้อด้วยเงิน และเปิดขายแล้ว ช่วงทดสอบไม่แสดงส่วนลดของแผนที่ยังสมัครไม่ได้)
    const tiers = $("itemTiers");
    tiers.innerHTML = "";
    if (item.baht && !TEST_MODE) {
        ["free", "premium", "careplus"].forEach(function (p) {
            const d = document.createElement("div");
            d.className = p === plan ? "me" : "";
            d.innerHTML = PLAN_NAMES[p] + "<b>฿" + Math.round(item.baht * (1 - DISCOUNTS[p])) + "</b>";
            tiers.appendChild(d);
        });
    }
    renderItemActions();
    $("itemSheet").hidden = false;
    $("itemClose").focus();
}
function actionBtn(text, primary, fn, disabled) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn" + (primary ? " btn-primary" : "");
    b.textContent = text;
    b.disabled = !!disabled;
    b.addEventListener("click", fn);
    $("itemActions").appendChild(b);
    return b;
}
function renderItemActions() {
    const item = openedItem;
    $("itemActions").innerHTML = "";
    const own = isOwned(item);
    if (own && !item.contains) {
        if (item.type === "wear") {
            const on = S.wear === item.id;
            actionBtn(on ? t("takeOff") : t("wear"), !on, function () {
                S.wear = on ? null : item.id;
                save();
                renderItemActions();
            });
        } else {
            const at = S.placed.indexOf(item.id);
            actionBtn(at >= 0 ? t("remove") : t("place"), at < 0, function () {
                if (at >= 0) S.placed.splice(at, 1);
                else if (S.placed.length >= MAX_PLACED) { setItemMsg(t("placeFull"), "warn"); return; }
                else S.placed.push(item.id);
                save();
                renderItemActions();
            });
        }
    } else if (!own && item.light) {
        actionBtn(t("buyLight", { n: item.light }), true, function () {
            if (S.light < item.light) { setItemMsg(t("noLight"), "warn"); return; }
            S.light -= item.light;
            S.owned[item.id] = true;
            save();
            renderTop();
            setItemMsg(t("bought", { name: itemName(item.id) }), "ok");
            renderItemActions();
            renderShop();
        });
    } else if (!own && item.baht && PROMPTPAY_ID !== "") {
        actionBtn(t("buyBaht", { n: bahtFor(item.baht) }), true, function () { startBuy(item, null); });
    } else if (!own && item.baht) {
        // ช่วงทดสอบ (ยังไม่ใส่ PROMPTPAY_ID): ไม่รับเงิน แต่ให้กด "สนใจ" เพื่อดูว่าของชิ้นไหนคนอยากได้
        const on = !!S.interest[item.id];
        const b = actionBtn(on ? t("interested") : t("notOnSale"), !on, function () {
            S.interest[item.id] = !S.interest[item.id];
            save();
            if (S.interest[item.id]) setItemMsg(t("interestThanks"), "ok"); else setItemMsg("");
            renderItemActions();
        });
        b.setAttribute("aria-pressed", String(on));
        if (on) b.classList.add("interest-on");
    }
    // ส่งเป็นของขวัญ: เฉพาะของที่ซื้อด้วยเงิน แผน Premium / Care+ และเปิดขายแล้ว
    if (item.baht && PROMPTPAY_ID !== "") {
        const ready = PROMPTPAY_ID !== "";
        const giftOk = plan !== "free";
        const g = actionBtn(t("gift"), false, function () {
            if (!giftOk) { setItemMsg(t("giftLock"), "warn"); return; }
            if ($("giftBox").hidden) { $("giftBox").hidden = false; $("giftTo").focus(); return; }
            const to = $("giftTo").value.trim().replace(/^@/, "");
            if (!/^[a-z0-9]{5,30}$/.test(to)) { setItemMsg(t("letterUserBad"), "warn"); return; }
            startBuy(item, to);
        }, !ready);
        if (!giftOk) g.title = t("giftLock");
    }
}
function setItemMsg(text, kind) {
    $("itemMsg").textContent = text;
    $("itemMsg").className = "note " + (kind || "");
}
function closeItem() { $("itemSheet").hidden = true; renderShop(); }
$("itemClose").addEventListener("click", closeItem);
$("itemSheet").addEventListener("click", function (e) { if (e.target.id === "itemSheet") closeItem(); });

// ===== 9. ชำระเงิน PromptPay + รหัสรับของ =====
const PAY_MINUTES = 15;
let payTimer = null, payOrder = null;
function startBuy(item, giftTo) {
    if (!currentUser) {
        setItemMsg(t("loginNeed"), "warn");
        const a = document.createElement("a");
        a.className = "btn";
        a.href = "index.html#home";
        a.textContent = t("loginGo");
        $("itemActions").appendChild(a);
        return;
    }
    const amount = bahtFor(item.baht);
    payOrder = { id: newOrderId(), item: item.id, amount: amount, plan: plan, time: new Date().toISOString(), status: "pending", source: "game" };
    if (giftTo) payOrder.gift = giftTo;
    $("payItem").textContent = itemName(item.id) + (giftTo ? " → @" + giftTo : "");
    $("payAmount").textContent = "฿" + amount.toFixed(2);
    $("payQr").innerHTML = qrSvg(promptpayPayload(PROMPTPAY_ID, amount));
    $("payName").textContent = PROMPTPAY_NAME;
    $("payLine").textContent = orderLine(payOrder);
    $("payMsg").textContent = "";
    $("paySlip").hidden = SLIP_URL === "";
    $("paySlip").href = SLIP_URL || "#";
    $("payDone").disabled = false;
    $("itemSheet").hidden = true;
    $("paySheet").hidden = false;
    let left = PAY_MINUTES * 60;
    const show = function () { $("payTimer").textContent = t("payLeft", { t: Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0") }); };
    clearInterval(payTimer);
    show();
    payTimer = setInterval(function () {
        left--;
        if (left <= 0) {
            clearInterval(payTimer);
            $("payQr").innerHTML = "";
            $("payTimer").textContent = t("payExpired");
            $("payDone").disabled = true;
            return;
        }
        show();
    }, 1000);
    $("payClose").focus();
}
$("payCopy").addEventListener("click", function () {
    const text = $("payLine").textContent;
    const done = function () { toast(t("payCopied")); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
});
$("payDone").addEventListener("click", function () {
    const orders = loadData(ORDERS_KEY, []);
    if (!orders.some(function (o) { return o.id === payOrder.id; })) {
        orders.unshift(payOrder);
        saveData(ORDERS_KEY, orders);
    }
    $("payMsg").textContent = t("payThanks");
    $("payMsg").className = "note ok";
    $("payDone").disabled = true;
});
function closePay() { clearInterval(payTimer); $("paySheet").hidden = true; }
$("payClose").addEventListener("click", closePay);
$("paySheet").addEventListener("click", function (e) { if (e.target.id === "paySheet") closePay(); });
document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!$("helpSheet").hidden) closeHelp();
    else if (!$("qbSheet").hidden) closeQuick();
    else if (!$("arriveSheet").hidden) closeArrive();
    else if (!$("introSheet").hidden) closeIntro();
    else if (!$("askSheet").hidden) $("askSheet").hidden = true;
    else if (!$("paySheet").hidden) closePay();
    else if (!$("itemSheet").hidden) closeItem();
});

// ให้ของตามรหัสสินค้า (รองรับรหัสสินค้าจากหน้าเว็บด้วย)
function grant(itemId) {
    let item = findItem(itemId) || GAME_ITEMS.find(function (x) { return x.web === itemId; });
    if (!item) return null;
    (item.contains || [item.id]).forEach(function (id) { S.owned[id] = true; });
    save();
    return item;
}

// รหัสของขวัญ: GIFT.<เลขที่>.<ยอด>.<รหัสสินค้า>.<รหัส>
function giftString(o) { return ["GIFT", o.id, Number(o.amount).toFixed(2), o.item, redeemCode(o.id, o.amount, o.item)].join("."); }

$("redeemBtn").addEventListener("click", function () {
    const raw = $("redeemInput").value.trim();
    const box = $("redeemMsg");
    const say = function (text, kind) { box.textContent = text; box.className = "note " + (kind || ""); };
    if (!raw) return;
    // 1) รหัสของขวัญจากเพื่อน
    if (/^GIFT\./i.test(raw)) {
        const p = raw.split(".");
        const id = (p[1] || "").toUpperCase(), amount = p[2] + "." + (p[3] || ""), rest = p.slice(4);
        // จำนวนเงินมีจุดทศนิยม จึงแยกเป็น 2 ช่อง: GIFT . ID . 53 . 00 . item . CODE
        const item = rest.slice(0, -1).join("."), code = (rest[rest.length - 1] || "").toUpperCase();
        if (S.used[id]) { say(t("redeemUsed"), "warn"); return; }
        if (code && redeemCode(id, amount, item) === code) {
            const got = grant(item);
            if (got) {
                S.used[id] = true;
                save();
                say(t("redeemOk", { name: itemName(got.id) }), "ok");
                $("redeemInput").value = "";
                return;
            }
        }
        say(t("redeemBad"), "warn");
        return;
    }
    // 2) รหัส 6 ตัวของคำสั่งซื้อตัวเอง
    const code = raw.toUpperCase();
    const orders = loadData(ORDERS_KEY, []);
    const o = orders.find(function (x) { return x.status !== "paid" && redeemCode(x.id, x.amount, x.item) === code; });
    if (!o) { say(t("redeemBad"), "warn"); return; }
    o.status = "paid";
    saveData(ORDERS_KEY, orders);
    $("redeemInput").value = "";
    if (o.gift) {
        say(t("giftCodeHint"), "ok");
    } else {
        const got = grant(o.item);
        say(got ? t("redeemOk", { name: itemName(got.id) }) : t("orderPaid"), "ok");
    }
    renderMe();
});

// ===== 10. ฉัน =====
function renderMe() {
    $("surveyCard").hidden = !SURVEY_URL;
    $("surveyBtn").href = SURVEY_URL || "#";
    $("redeemCard").hidden = PROMPTPAY_ID === "" && !loadData(ORDERS_KEY, []).length;   // ช่วงยังไม่เปิดขาย ซ่อนช่องรหัส
    const w = WORLDS[S.world];
    $("meWorldImg").src = img(w.pet.happy);
    $("meWorldImg").alt = petName();
    $("meName").textContent = currentUser ? "@" + currentUser : t("guest");
    $("mePlan").textContent = t("plan") + " " + PLAN_NAMES[plan] + " · " + t("world_" + S.world);

    const orders = currentUser ? loadData(ORDERS_KEY, []) : [];
    const list = $("orderList");
    list.innerHTML = "";
    if (!orders.length) list.innerHTML = '<p class="muted">' + t("noOrders") + "</p>";
    const gifts = $("giftCodes");
    gifts.innerHTML = "";
    orders.slice(0, 8).forEach(function (o) {
        const r = document.createElement("div");
        r.className = "order-row";
        r.innerHTML = "<span></span><span class=\"status\"></span>";
        const nm = findItem(o.item) ? itemName(o.item) : o.item;
        r.firstChild.textContent = "#" + o.id + " · " + nm + (o.gift ? " → @" + o.gift : "") + " · ฿" + o.amount;
        r.lastChild.textContent = o.status === "paid" ? t("orderPaid") : t("orderPending");
        r.lastChild.classList.toggle("paid", o.status === "paid");
        list.appendChild(r);
        if (o.gift && o.status === "paid") {
            const g = document.createElement("div");
            g.className = "gift-code";
            g.innerHTML = "<b></b><code></code><small></small>";
            g.querySelector("b").textContent = t("giftCode", { to: "@" + o.gift });
            g.querySelector("code").textContent = giftString(o);
            g.querySelector("small").textContent = t("giftCodeHint");
            gifts.appendChild(g);
        }
    });

    const st = $("statsBox");
    st.innerHTML = "";
    [[currentStreak(), "statStreak"], [S.activeDays || 0, "statDays"], [S.stats.letters, "statLetters"], [S.stats.breathe, "statBreathe"],
        [S.stats.qb, "statQb"], [Object.keys(S.met).length, "statVisitors"]].forEach(function (s) {
        const d = document.createElement("div");
        d.innerHTML = "<b></b>";
        d.firstChild.textContent = s[0];
        d.append(t(s[1]));
        st.appendChild(d);
    });

    const album = $("albumBox");
    album.innerHTML = "";
    Object.keys(WORLDS).forEach(function (k) {
        WORLDS[k].visitors.forEach(function (v) {
            const im = document.createElement("img");
            im.src = img(v);
            im.alt = "";
            if (!S.met[v]) im.className = "locked";
            album.appendChild(im);
        });
    });
    const stamps = $("stampBox");
    stamps.innerHTML = "";
    TRIP_STOPS.forEach(function (s) {
        const im = document.createElement("img");
        im.src = img("stamp_" + s.id);
        im.alt = placeName(s.id);
        im.title = placeName(s.id);
        if (!S.stamps[s.id]) im.className = "locked";
        stamps.appendChild(im);
    });
    renderPrivacy();
}
$("switchWorld").addEventListener("click", function () { pickChoice = S.world; showTab("pick"); });

// ===== 11. แท็บ + เริ่มเกม =====
const RENDER = { pick: renderPick, home: renderHome, breathe: renderBreathe, letters: renderLetters, shop: renderShop, me: renderMe };
function showTab(name) {
    if (name !== "breathe" && breatheRunning) stopBreathe();
    if (name !== "breathe") { stopAmbient(); setBreatheMode("calm"); }
    if (name !== "home" && typeof Pet !== "undefined") Pet.leave();
    if (!S.world) name = "pick";
    currentTab = name;
    document.querySelectorAll(".screen").forEach(function (s) { s.hidden = s.id !== "screen-" + name; });
    document.querySelectorAll("#tabs button").forEach(function (b) { b.setAttribute("aria-selected", String(b.dataset.tab === name)); });
    $("tabs").hidden = name === "pick";
    newDayCheck();
    RENDER[name]();
    renderTop();
    window.scrollTo(0, 0);
}
document.querySelectorAll("#tabs button").forEach(function (b) {
    b.setAttribute("role", "tab");
    b.addEventListener("click", function () {
        if (b.dataset.tab === "breathe") setBreatheMode("calm");      // แท็บหายใจ = 4·6 เสมอ (ถอนหายใจยาวเปิดจากพักสั้น)
        showTab(b.dataset.tab);
    });
});

// ===== 12. ขอความช่วยเหลือ / เปิดจากลิงก์จดหมาย / ความเป็นส่วนตัว / สรุปการทดสอบ =====
// ปุ่มโทรสายด่วน (ใช้ในหน้าต่างช่วยเหลือ การ์ดจดหมาย และข้อความเช็กอินอารมณ์)
function callList(numbers, small) {
    const box = document.createElement("div");
    box.className = "call-list" + (small ? " small" : "");
    numbers.forEach(function (n) {
        const a = document.createElement("a");
        a.className = "btn call-btn";
        a.href = "tel:" + n;
        a.innerHTML = "<b></b><span></span>";
        a.querySelector("b").textContent = n;
        a.querySelector("span").textContent = t("call" + n);
        box.appendChild(a);
    });
    return box;
}
let helpFrom = null;
function openHelp() {
    helpFrom = document.activeElement;
    const c = $("helpCalls");
    c.innerHTML = "";
    c.appendChild(callList(["1323", "1669", "1387"]));
    renderHelpSub();
    $("helpSheet").hidden = false;
    $("helpClose").focus();
}
// สายด่วนเลิกบุหรี่ / เลิกเหล้า: แสดงเฉพาะเมื่อโปรไฟล์บนหน้าเว็บตอบว่ามีเรื่องนั้น
// ไม่มีโปรไฟล์ หรือ none = true → ไม่แสดงอะไรเลย (ห้ามมีข้อความเรื่องนี้ที่อื่นในเกม)
function substanceCalls() {
    const pf = siteData("hikariProfile");
    if (!pf || pf.none === true) return null;
    const flags = ["smoke", "alcohol", "other"].filter(function (k) { return pf[k] === true; });
    if (!flags.length) return null;
    return flags.map(function (k) { return SUBSTANCE_CALLS[k]; }).filter(function (n) { return /^\d{3,5}$/.test(n || ""); });
}
function renderHelpSub() {
    const calls = substanceCalls(), box = $("helpSub");
    $("helpSubCalls").innerHTML = "";
    box.hidden = !calls;
    if (!calls) return;
    $("helpSubText").textContent = t("subLine");
    if (calls.length) $("helpSubCalls").appendChild(callList(calls, true));
}
function closeHelp() {
    $("helpSheet").hidden = true;
    if (helpFrom && helpFrom.focus) helpFrom.focus();
}
$("helpHome").addEventListener("click", openHelp);
$("helpMe").addEventListener("click", openHelp);
$("helpClose").addEventListener("click", closeHelp);
$("helpSheet").addEventListener("click", function (e) { if (e.target.id === "helpSheet") closeHelp(); });

// เปิดจากลิงก์จดหมาย (?letter=N&from=โลก): แสดงการ์ดจดหมายก่อน แล้วค่อยเข้าเกมตามปกติ
function checkArrival() {
    let q;
    try { q = new URLSearchParams(location.search); } catch (e) { return; }
    if (!q.has("letter")) return;
    const raw = q.get("letter"), from = q.get("from");
    const i = /^\d{1,2}$/.test(raw) ? Number(raw) : -1;
    try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) { /* บางเบราว์เซอร์ไม่ให้แก้ */ }
    if (i < 0 || i >= LETTERS[L].length) return;
    const fw = Object.prototype.hasOwnProperty.call(WORLDS, from) ? from : "cat";
    S.ref = true;
    save();
    $("arriveImg").src = img(WORLDS[fw].pet.happy);
    $("arriveText").textContent = LETTERS[L][i];
    $("arriveFrom").textContent = t("arriveFrom", { pet: t("pet_" + fw) });
    const c = $("arriveCalls");
    c.innerHTML = "";
    c.appendChild(callList(["1323"], true));
    $("arriveSheet").hidden = false;
    $("arriveGo").focus();
}
function closeArrive() {
    $("arriveSheet").hidden = true;
    if (S.world && !S.onboarded && currentTab === "home") openIntro();
}
$("arriveGo").addEventListener("click", closeArrive);

// ความเป็นส่วนตัว: บอกว่าเก็บอะไรไว้ที่ไหน + ลบข้อมูลทั้งหมดบนเครื่องนี้ (ยืนยันในหน้า ไม่ใช้ window.confirm)
function renderPrivacy() {
    const ul = $("privacyList");
    ul.innerHTML = "";
    ["privacy0", "privacy1", "privacy5", "privacy6", "privacy2", "privacy3", "privacy4"].forEach(function (k) {
        const li = document.createElement("li");
        li.textContent = t(k);
        if (k === "privacy0") li.className = "privacy-main";
        ul.appendChild(li);
    });
    if (CONTACT) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = CONTACT;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = t("privacyContact");
        li.appendChild(a);
        ul.appendChild(li);
    }
    // อีเมลติดต่อ (CONTACT_EMAIL ใน config.js)
    const mail = typeof CONTACT_EMAIL === "string" ? CONTACT_EMAIL.trim() : "";
    if (/^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(mail)) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "mailto:" + mail;
        a.textContent = mail;
        li.appendChild(a);
        ul.appendChild(li);
    }
    $("wipeBox").hidden = true;
    $("wipeBtn").hidden = false;
}
$("wipeBtn").addEventListener("click", function () {
    $("wipeBox").hidden = false;
    $("wipeBtn").hidden = true;
    $("wipeNo").focus();
});
$("wipeNo").addEventListener("click", function () {
    $("wipeBox").hidden = true;
    $("wipeBtn").hidden = false;
    $("wipeBtn").focus();
});
$("wipeYes").addEventListener("click", function () {
    try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
        keys.forEach(function (k) { if (k && k.indexOf("hikari") === 0) localStorage.removeItem(k); });
    } catch (e) { /* ลบไม่ได้ */ }
    save = function () { /* ไม่บันทึกซ้ำหลังลบ */ };
    location.reload();
});

// รหัสสรุปการทดสอบ เช่น HK2|w=cat|ad=5|d=1101011|ses=9|br=6/8|let=2|ref=Y|intro=Y|iab=LINE|int=...|snd=rain|qb=4|ca=work
// d = 7 วันล่าสุด (ซ้าย = 6 วันก่อน, ขวา = วันนี้) 1 = มีเล่น · br = หายใจ 4·6 ครบ/เริ่ม · qb = พักสั้นครบกี่ครั้ง
// ca = หมวดเรื่องที่หนักใจที่เลือกบ่อยที่สุด (รหัสหมวดเท่านั้น) · ไม่มีอารมณ์ คะแนน หรือข้อความที่พิมพ์
// ck = จำนวนครั้งที่เช็กร่างกายรายสัปดาห์บนหน้าเว็บ · pf = ตอบแบบสอบถามพฤติกรรมแล้วหรือยัง (Y/N ไม่บอกคำตอบ)
function summaryCode() {
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7.push(S.days.indexOf(dayStr(d)) >= 0 ? "1" : "0");
    }
    const keys = function (o) {
        const k = Object.keys(o || {}).filter(function (x) { return o[x]; });
        return k.length ? k.join(",") : "-";
    };
    return ["HK2", "w=" + (S.world || "-"), "ad=" + (S.activeDays || 0), "d=" + last7.join(""), "ses=" + S.sessions,
        "br=" + S.breatheFinished + "/" + S.breatheStarted, "let=" + S.lettersShared, "ref=" + (S.ref ? "Y" : "N"),
        "intro=" + (S.onboarded ? "Y" : "N"), "iab=" + keys(S.iab), "int=" + keys(S.interest), "snd=" + keys(S.soundUsed),
        "qb=" + (S.stats.qb || 0), "ca=" + topCause(), "ck=" + checkCount(), "pf=" + (siteData("hikariProfile") ? "Y" : "N")].join("|");
}
function copySummary(codeEl) {
    const code = summaryCode();
    codeEl.textContent = code;
    codeEl.hidden = false;
    const done = function () { toast(t("summaryCopied")); };
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, done);
        else done();
    } catch (e) { done(); }
}
$("summaryBtn").addEventListener("click", function () { copySummary($("summaryCode")); });
$("askCopy").addEventListener("click", function () { copySummary($("askCode")); });

// ===== 13. พักสั้น =====
// 6 แบบ: ถอนหายใจยาว 1 นาที / หายใจ 4·8 1 นาที (ใช้หน้าหายใจ) / ยืดเหยียดที่โต๊ะ 2 นาที /
//        คลายกล้ามเนื้อ 3 นาที / เดินกับน้อง 5 นาที (หน้าต่าง qbGuideView) / ก้าวเล็กถัดไป
// ทำเสร็จ = +2 แสง (ได้แสงวันละ 3 ครั้ง) และนับเป็นภารกิจหายใจของวันนั้น · เก็บแค่จำนวนครั้งใน S.stats
const QB_LIGHT = 2, QB_LIGHT_TIMES = 3;
let qbFrom = null;
function qbShow(view) {
    ["qbPick", "qbStretchView", "qbGuideView", "qbStepView", "qbDoneView"].forEach(function (id) { $(id).hidden = id !== view; });
}
function openQuick() {
    rolloverCheck();
    if (!$("qbSheet").hidden) { qbShow("qbPick"); renderQuickPick(); return; }
    qbFrom = document.activeElement;
    resetStretch();
    resetGuide();
    resetStep();
    qbShow("qbPick");
    renderQuickPick();
    $("qbSheet").hidden = false;
    $("qbClose").focus();
}
function renderQuickPick() {
    const pet = WORLDS[S.world].pet;
    $("qbTitle").textContent = t("qbTitle", { pet: petName() });
    $("qbStretchIco").src = img(pet.stretch);
    $("qbStretchD").textContent = t("qbStretchD", { pet: petName() });
    $("qbStepD").textContent = t("qbStepD", { pet: petName() });
    $("qbPmrIco").src = img(pet.belly);
    $("qbPmrD").textContent = t("qbPmrD", { pet: petName() });
    $("qbWalkIco").src = img(pet.stretch);
    $("qbWalkD").textContent = t("qbWalkD", { pet: petName() });
    const left = Math.max(0, QB_LIGHT_TIMES - (S.today.qb || 0));
    $("qbLeftMsg").textContent = left ? t("qbLeft", { n: left }) : t("qbLeftNone");
}
function closeQuick() {
    resetStretch();
    resetGuide();
    resetStep();
    $("qbSheet").hidden = true;
    if (qbFrom && qbFrom.focus && document.contains(qbFrom)) qbFrom.focus();
}
// ทำเสร็จ 1 ครั้ง: นับ + ให้แสงตามโควตา คืนข้อความบอกแสงที่ได้
function finishQuick(kind) {
    rolloverCheck();
    S.stats.qb++;
    S.stats.qbKind[kind] = (S.stats.qbKind[kind] || 0) + 1;
    S.today.qb = (S.today.qb || 0) + 1;
    const gain = S.today.qb <= QB_LIGHT_TIMES ? QB_LIGHT : 0;
    if (gain) addLight(gain); else { markActive(); save(); }
    if (currentTab === "home") renderTasks();
    return gain ? t("qbGain", { n: gain }) : t("qbGainMax");
}
function showQuickDone(title, text, gainMsg, mine) {
    $("qbDoneImg").src = img(WORLDS[S.world].pet.happy);
    $("qbDoneImg").alt = petName();
    $("qbDoneTitle").textContent = title;
    $("qbDoneText").textContent = text;
    $("qbDoneMsg").textContent = gainMsg;
    $("qbMine").hidden = !mine;
    $("qbMineText").textContent = mine || "";
    qbShow("qbDoneView");
    const art = $("qbDoneView").querySelector(".qb-art");
    art.classList.remove("cheer"); void art.offsetWidth; art.classList.add("cheer");
    $("qbFinish").focus();
}
$("qbBtn").addEventListener("click", openQuick);
$("qbClose").addEventListener("click", closeQuick);
$("qbFinish").addEventListener("click", closeQuick);
$("qbAgain").addEventListener("click", function () { resetStretch(); resetGuide(); resetStep(); qbShow("qbPick"); renderQuickPick(); });
$("qbSheet").addEventListener("click", function (e) { if (e.target.id === "qbSheet") closeQuick(); });

// ----- (ก) ถอนหายใจยาว 1 นาที / หายใจ 4·8: เปิดหน้าหายใจด้วยจังหวะนั้นแล้วเริ่มเลย -----
function quickBreathe(mode) {
    closeQuick();
    if (breatheRunning) stopBreathe();
    breatheSec = 0;
    setBreatheMode(mode);
    showTab("breathe");
    startBreathe();
}
$("qbSigh").addEventListener("click", function () { quickBreathe("sigh"); });
$("qbB48").addEventListener("click", function () { quickBreathe("b48"); });

// ----- (ข) ยืดเหยียดที่โต๊ะ 2 นาที: 6 ท่า ท่าละ 20 วินาที น้องทำท่ายืดตัวไปด้วย -----
const STRETCH_TOTAL = STRETCH_STEPS * STRETCH_STEP_SEC;
let stretchSec = 0, stretchTimer = null, stretchRunning = false;
function resetStretch() {
    clearInterval(stretchTimer);
    stretchRunning = false;
    stretchSec = 0;
}
function renderStretch() {
    const pet = WORLDS[S.world].pet;
    const step = Math.min(STRETCH_STEPS - 1, Math.floor(stretchSec / STRETCH_STEP_SEC));
    const started = stretchRunning || stretchSec > 0;
    $("stretchTitle").textContent = t("stretchTitle", { pet: petName() });
    // น้องสลับท่ายืดตัวกับท่านั่งทุก 4 วินาที (ยืดเบา ๆ ตามผู้ใช้)
    const pose = stretchRunning && stretchSec % 8 < 4 ? pet.stretch : pet.sit;
    const im = $("stretchImg");
    if (im.getAttribute("src") !== img(pose)) im.src = img(pose);
    im.alt = petName();
    im.parentNode.classList.toggle("stretching", stretchRunning);
    $("stretchNo").textContent = t("stretchNo", { n: started ? step + 1 : 1, all: STRETCH_STEPS });
    $("stretchText").textContent = started ? t("stretch" + (step + 1)) : t("stretchReady");
    $("stretchBar").style.width = Math.round(stretchSec / STRETCH_TOTAL * 100) + "%";
    const left = Math.max(0, STRETCH_TOTAL - stretchSec);
    $("stretchClock").textContent = Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0");
    $("stretchBtn").textContent = stretchRunning ? t("stretchPause") : (stretchSec > 0 ? t("stretchGo") : t("stretchStart"));
}
$("qbStretch").addEventListener("click", function () {
    resetStretch();
    qbShow("qbStretchView");
    renderStretch();
    $("stretchBtn").focus();
});
$("stretchBack").addEventListener("click", function () { resetStretch(); qbShow("qbPick"); renderQuickPick(); });
$("stretchBtn").addEventListener("click", function () {
    if (stretchRunning) { clearInterval(stretchTimer); stretchRunning = false; renderStretch(); return; }
    stretchRunning = true;
    renderStretch();
    stretchTimer = setInterval(function () {
        stretchSec++;
        if (stretchSec >= STRETCH_TOTAL) {
            resetStretch();
            showQuickDone(t("stretchDone"), "", finishQuick("stretch"));
            return;
        }
        if (stretchSec % STRETCH_STEP_SEC === 0 && S.sound === "bowl") bell(true);
        renderStretch();
    }, 1000);
});

// ----- (ง) คลายกล้ามเนื้อ 3 นาที / (จ) เดินกับน้อง 5 นาที: ใช้หน้าต่างเดียวกัน ต่างแค่ตารางเวลา -----
// at(sec) คืน { k: ช่วง, pill, phase, text, pose } ของวินาทีนั้น
const PMR_PART_SEC = PMR_TENSE + PMR_RELEASE;
const PMR_TOTAL = PMR_INTRO + PMR_PARTS.length * PMR_PART_SEC + PMR_OUTRO;
function pmrAt(sec) {
    if (sec < PMR_INTRO) return { k: "intro", pill: t("pmrPrep"), phase: "", text: t("pmrIntro"), pose: "sit" };
    const r = sec - PMR_INTRO, i = Math.floor(r / PMR_PART_SEC), inPart = r % PMR_PART_SEC;
    if (i >= PMR_PARTS.length) return { k: "outro", pill: t("pmrRest"), phase: "", text: t("pmrOutro"), pose: "sleep" };
    const pill = t("pmrNo", { n: i + 1, all: PMR_PARTS.length, part: t("pmrName_" + PMR_PARTS[i]) });
    if (inPart < PMR_TENSE) return { k: "tense", part: i, pill: pill, phase: t("pmrTense") + " " + (PMR_TENSE - inPart), text: t("pmr_" + PMR_PARTS[i]), pose: "sit" };
    return { k: "release", part: i, pill: pill, phase: t("pmrRelease") + " " + (PMR_PART_SEC - inPart), text: t("pmrLet"), pose: "happy" };
}
function walkAt(sec) {
    const m = Math.min(WALK_MIN - 1, Math.floor(sec / 60));
    return { k: "walk" + (m + 1), pill: t("walkNo", { n: m + 1, all: WALK_MIN }), phase: "", text: t("walk" + (m + 1)), pose: "stretch" };
}
const GUIDES = {
    pmr: { total: PMR_TOTAL, at: pmrAt, title: "pmrTitle", ready: "pmrReady", start: "pmrStart", note: "pmrNote", done: "pmrDone" },
    walk: { total: WALK_MIN * 60, at: walkAt, title: "walkTitle", ready: "walkReady", start: "walkStart", note: "walkNote", done: "walkDone" }
};
let guideKind = "pmr", guideSec = 0, guideTimer = null, guideRunning = false, guideLastK = "";
function resetGuide() {
    clearInterval(guideTimer);
    guideRunning = false;
    guideSec = 0;
    guideLastK = "";
}
function renderGuide() {
    const g = GUIDES[guideKind], pet = WORLDS[S.world].pet, started = guideRunning || guideSec > 0;
    const st = g.at(Math.min(guideSec, g.total - 1)), walk = guideKind === "walk";
    $("guideTitle").textContent = t(g.title, { pet: petName() });
    $("guideImg").hidden = walk;
    $("walkStage").hidden = !walk;
    const art = $("guideArt");
    if (walk) {
        // น้องเดินข้ามฉากไปมา (หยุดเดินเมื่อกดหยุดพัก)
        if ($("walkBg").getAttribute("src") !== img(stageBg())) $("walkBg").src = img(stageBg());
        if ($("walkPet").getAttribute("src") !== img(pet.stretch)) $("walkPet").src = img(pet.stretch);
        $("walkPet").alt = petName();
        $("walkStage").classList.toggle("going", guideRunning);
    } else {
        const im = $("guideImg"), src = img(pet[started ? st.pose : "sit"] || pet.sit);
        if (im.getAttribute("src") !== src) im.src = src;
        im.alt = petName();
    }
    // เกร็ง = น้องตัวหดเกร็ง · ปล่อย = น้องยุบตัวนุ่ม ๆ แล้วคลาย (เริ่มอนิเมชันใหม่ทุกครั้งที่ขึ้นช่วงปล่อย)
    const k = started ? st.k + (st.part !== undefined ? st.part : "") : "";
    if (k !== guideLastK) {
        art.classList.remove("tense", "relax");
        void art.offsetWidth;
        if (started && (st.k === "tense" || st.k === "release")) art.classList.add(st.k === "tense" ? "tense" : "relax");
        guideLastK = k;
    }
    $("guideNo").textContent = st.pill;
    $("guidePhase").textContent = started ? st.phase : "";
    $("guideText").textContent = started ? st.text : t(g.ready, { pet: petName() });
    $("guideNote").textContent = t(g.note);
    $("guideBar").style.width = Math.round(guideSec / g.total * 100) + "%";
    const left = Math.max(0, g.total - guideSec);
    $("guideClock").textContent = Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0");
    $("guideBtn").textContent = guideRunning ? t("stretchPause") : (guideSec > 0 ? t("stretchGo") : t(g.start));
    $("guideSkip").hidden = guideKind !== "pmr" || !started || st.k === "outro";
}
function openGuide(kind) {
    resetGuide();
    guideKind = kind;
    qbShow("qbGuideView");
    renderGuide();
    $("guideBtn").focus();
}
$("qbPmr").addEventListener("click", function () { openGuide("pmr"); });
$("qbWalk").addEventListener("click", function () { openGuide("walk"); });
$("guideBack").addEventListener("click", function () { resetGuide(); qbShow("qbPick"); renderQuickPick(); });
// ข้ามส่วนนี้ (เช่น ส่วนที่เจ็บ): ไปเริ่มส่วนถัดไปทันที
$("guideSkip").addEventListener("click", function () {
    const st = pmrAt(guideSec);
    if (st.k === "intro") guideSec = PMR_INTRO;
    else if (st.part !== undefined) guideSec = PMR_INTRO + (st.part + 1) * PMR_PART_SEC;
    renderGuide();
});
$("guideBtn").addEventListener("click", function () {
    if (guideRunning) { clearInterval(guideTimer); guideRunning = false; renderGuide(); return; }
    guideRunning = true;
    renderGuide();
    guideTimer = setInterval(function () {
        const g = GUIDES[guideKind];
        guideSec++;
        if (guideSec >= g.total) {
            const kind = guideKind;
            resetGuide();
            renderGuide();
            showQuickDone(t(GUIDES[kind].done, { pet: petName() }), "", finishQuick(kind));
            return;
        }
        const before = g.at(guideSec - 1).k, now = g.at(guideSec).k;
        if (before !== now && S.sound === "bowl") bell(now !== "release");
        renderGuide();
    }, 1000);
});

// ----- (ค) ก้าวเล็กถัดไป: ถามเรื่องที่หนักใจ แล้วถามก้าวที่เล็กที่สุด -----
// ข้อความที่พิมพ์อยู่แค่ในช่องพิมพ์และตัวแปรนี้ ไม่บันทึกลงเครื่อง ปิดหน้าต่างแล้วล้างทิ้ง
let stepStage = 1, stepHeavy = "";
function resetStep() {
    stepStage = 1;
    stepHeavy = "";
    $("stepInput").value = "";
    $("qbMineText").textContent = "";
}
function renderStep() {
    const pet = WORLDS[S.world].pet, two = stepStage === 2;
    $("stepImg").src = img(two ? pet.happy : pet.sit);
    $("stepImg").alt = petName();
    $("stepSay").textContent = t(two ? "stepAsk2" : "stepAsk1");
    $("stepInput").placeholder = t(two ? "stepPh2" : "stepPh1");
    $("stepInput").setAttribute("aria-label", t(two ? "stepAsk2" : "stepAsk1"));
    $("stepBack").textContent = t("qbBack");
    $("stepNext").textContent = t(two ? "stepCommit" : "stepNext");
    $("stepNext").disabled = two && !$("stepInput").value.trim();
    const ideas = $("stepIdeas");
    ideas.hidden = !two;
    ideas.innerHTML = "";
    if (two) {
        ["stepIdea1", "stepIdea2", "stepIdea3", "stepIdea4"].forEach(function (k) {
            const b = document.createElement("button");
            b.type = "button";
            b.textContent = t(k);
            b.addEventListener("click", function () { $("stepInput").value = t(k); renderStep(); $("stepNext").focus(); });
            ideas.appendChild(b);
        });
    }
}
$("qbStep").addEventListener("click", function () {
    resetStep();
    qbShow("qbStepView");
    renderStep();
    $("stepInput").focus();
});
$("stepInput").addEventListener("input", function () {
    if (stepStage === 2) $("stepNext").disabled = !$("stepInput").value.trim();
});
$("stepBack").addEventListener("click", function () {
    if (stepStage === 2) {
        stepStage = 1;
        $("stepInput").value = stepHeavy;
        renderStep();
        return;
    }
    resetStep();
    qbShow("qbPick");
    renderQuickPick();
});
$("stepNext").addEventListener("click", function () {
    if (stepStage === 1) {
        stepHeavy = $("stepInput").value;          // เก็บไว้แค่ตอนกดย้อนกลับ ไม่บันทึก
        stepStage = 2;
        $("stepInput").value = "";
        renderStep();
        $("stepInput").focus();
        return;
    }
    const next = $("stepInput").value.trim();
    if (!next) return;
    const gain = finishQuick("step");
    resetStep();
    showQuickDone(t("stepDeal"), t("stepCheer", { pet: petName() }), gain, next);
});

// ===== 14. ชวนดูแลตัวเองเบา ๆ + ชวนคนที่ไว้ใจคุย =====
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return dayStr(d);
}
// รายการเช็กร่างกายจากหน้าเว็บ (เฉพาะรายการที่มีวันที่ถูกรูปแบบ)
function siteChecks() {
    const list = siteData("hikariCheck");
    return Array.isArray(list) ? list.filter(function (e) { return e && typeof e.d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.d); }) : [];
}
function checkCount() { return siteChecks().length; }
function recentCheck() {
    const from = daysAgo(6), today = dayStr();
    return siteChecks().some(function (e) { return e.d >= from && e.d <= today; });
}
// จำนวนวันใน 7 วันล่าสุด (รวมวันนี้) ที่เช็กอินว่าเศร้าหรือเครียด
function heavyDays() {
    let n = 0;
    for (let i = 0; i < 7; i++) {
        const m = S.mood[daysAgo(i)];
        if (m === "sad" || m === "stressed") n++;
    }
    return n;
}
// แสดงได้ถ้ายังไม่เคยแสดง หรือแสดงครั้งล่าสุดมาแล้วอย่างน้อย 7 วัน
function nudgeDue(kind) {
    const last = S.nudge[kind];
    return typeof last !== "string" || last <= daysAgo(7);
}
const NUDGES = {
    mood: { text: "nudgeMood", btn: "nudgeMoodBtn", href: "index.html#mood-screen", pose: "sit" },
    check: { text: "nudgeCheck", btn: "nudgeCheckBtn", href: "index.html#check", pose: "happy" }
};
let nudgeNow = null, nudgeClosed = false;      // ในหน้านี้: แบบที่แสดงอยู่ / ปิดแล้ว (ไม่แสดงอีกจนกว่าจะครบ 7 วัน)
function renderNudge() {
    if (!nudgeNow && !nudgeClosed && S.onboarded && S.world) {
        if (heavyDays() >= 3 && nudgeDue("mood")) nudgeNow = "mood";
        else if (!recentCheck() && nudgeDue("check")) nudgeNow = "check";
        if (nudgeNow) {
            S.nudge[nudgeNow] = dayStr();
            save();
            const say = t(NUDGES[nudgeNow].text);
            // น้องพูดประโยคเดียวกัน แตะคำพูด = เลื่อนไปที่การ์ด (การ์ดอยู่ใต้ปุ่มพักสั้น อาจต้องเลื่อนจอ)
            setTimeout(function () {
                if (nudgeNow && currentTab === "home" && typeof Pet !== "undefined") {
                    Pet.say(say, function () { if (!$("nudgeBox").hidden) { $("nudgeBox").scrollIntoView({ block: "nearest" }); $("nudgeGo").focus({ preventScroll: true }); } });
                }
            }, 6000);
        }
    }
    const box = $("nudgeBox");
    box.hidden = !nudgeNow;
    if (!nudgeNow) return;
    const n = NUDGES[nudgeNow];
    box.dataset.kind = nudgeNow;
    $("nudgeImg").src = img(WORLDS[S.world].pet[n.pose]);
    $("nudgeFrom").textContent = t("causeFrom", { pet: petName() });
    $("nudgeText").textContent = t(n.text);
    $("nudgeGo").textContent = t(n.btn);
    $("nudgeGo").href = n.href;
}
function closeNudge() {
    nudgeNow = null;
    nudgeClosed = true;
    $("nudgeBox").hidden = true;
}
$("nudgeLater").addEventListener("click", closeNudge);
$("nudgeGo").addEventListener("click", function () { nudgeNow = null; nudgeClosed = true; });

// ชวนคนที่ไว้ใจคุย: ข้อความสำเร็จรูป 3 แบบ เปิดหน้าแชร์ LINE (นับเป็นการส่งจดหมายของวันนั้น ไม่ปิดกั้นแม้ส่งครบแล้ว)
let talkPick = 0;
function renderTalk() {
    const list = $("talkList");
    list.innerHTML = "";
    TALK_TEMPLATES[L].forEach(function (text, i) {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "radio");
        b.setAttribute("aria-checked", String(talkPick === i));
        b.textContent = text;
        b.addEventListener("click", function () { talkPick = i; renderTalk(); });
        list.appendChild(b);
    });
}
function talkShareUrl(i) {
    return "https://line.me/R/share?text=" + encodeURIComponent(TALK_TEMPLATES[L][i]);
}
$("talkSend").addEventListener("click", function () {
    rolloverCheck();
    const url = talkShareUrl(talkPick);
    const w = window.open(url, "_blank");
    if (w) { try { w.opener = null; } catch (e) { /* ไม่เป็นไร */ } } else location.href = url;
    S.today.letters++;
    S.stats.letters++;
    S.lettersShared++;
    const gain = S.today.letters <= LETTER_LIMIT ? 1 : 0;
    if (gain) addLight(gain); else { markActive(); save(); }
    $("talkMsg").textContent = t("talkSent") + (gain ? " +" + gain + " " + t("light") : "");
    $("talkMsg").className = "note ok";
    renderLetters();
});
// เปิดจากคำพูดน้อง / ปุ่มในเช็กอินอารมณ์: ไปแท็บจดหมาย แล้วเลื่อนถึงการ์ดชวนคุย
function openTalk() {
    showTab("letters");
    const card = $("talkCard");
    if (card.scrollIntoView) card.scrollIntoView({ block: "start" });
    $("talkSend").focus({ preventScroll: true });
}

// ===== เริ่มเกม =====
if (inAppName()) S.iab[inAppName()] = true;
save();
applyTexts();
newDayCheck();
// รับเฉพาะชื่อแท็บที่มีจริง (กัน #__proto__ / #toString ทำให้จอว่าง)
const startHash = location.hash.replace("#", "");
showTab(S.world ? (Object.prototype.hasOwnProperty.call(RENDER, startHash) ? startHash : "home") : "pick");
checkArrival();
if (guestMoved) toast(t("guestMoved"));
