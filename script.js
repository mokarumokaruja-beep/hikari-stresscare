// =====================================================================
// Hikari StressCare - script.js
// ส่วนที่ 0: เครื่องมือช่วย (อ่าน/เขียน localStorage, เติมคำในข้อความ)
// ส่วนที่ 1: ภาษา (10 ภาษา)
// ส่วนที่ 2: เข้าสู่ระบบ / สมัครสมาชิก
// ส่วนที่ 3: บันทึกกิจกรรม (log) + กราฟความเปลี่ยนแปลง
// ส่วนที่ 4: เมนูบนมือถือ
// ส่วนที่ 5: แบบประเมินความเครียด 18 ข้อ + ผลย้อนหลัง
// ส่วนที่ 6: การ์ดดูแลตัวเอง
// ส่วนที่ 7: เลือกอารมณ์ในตัวอย่างแอป
// ส่วนที่ 8: ตัวจับเวลาฝึกหายใจ
// ส่วนที่ 9: แผนบริการ
// ส่วนที่ 10: เริ่มทำงานเมื่อเปิดหน้าเว็บ
// ส่วนที่ 11: วิดีโอคลายเครียด (ฝังจาก YouTube ดูฟรีทุกคน)
// ส่วนที่ 12: เข้าสู่ระบบด้วย Google
// =====================================================================

// ลิงก์แบบสอบถาม (Google Form) ใส่ระหว่างเครื่องหมาย "" เช่น "https://forms.gle/xxxx"
// ถ้าเว้นว่างไว้ ส่วน "ลองใช้แล้วเป็นอย่างไรบ้าง?" จะถูกซ่อน
const SURVEY_URL = "https://forms.gle/R5iZDvvk11o1Fzeu8";

// รหัส Google OAuth Client ID สำหรับปุ่ม "Sign in with Google"
// สร้างที่ https://console.cloud.google.com/ (วิธีทำอยู่ใน README ข้อ 12)
// ถ้าเว้นว่างไว้ ปุ่ม Google จะถูกซ่อน และใช้ชื่อผู้ใช้/รหัสผ่านตามเดิม
const GOOGLE_CLIENT_ID = "";


// ===== 0. เครื่องมือช่วย =====

// อ่านข้อมูลจาก localStorage (แปลงจากข้อความ JSON กลับเป็นข้อมูล)
function loadData(key, defaultValue) {
    try {
        const text = localStorage.getItem(key);
        if (text !== null) {
            return JSON.parse(text);
        }
    } catch (e) {
        // บางเบราว์เซอร์ไม่ให้ใช้ localStorage ก็ใช้ค่าเริ่มต้นแทน
    }
    return defaultValue;
}

// เขียนข้อมูลลง localStorage (แปลงเป็นข้อความ JSON ก่อน)
function saveData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        // บันทึกไม่ได้ก็ข้ามไป เว็บยังใช้งานต่อได้
    }
}

// เติมค่าลงในช่อง {ชื่อ} ของข้อความ เช่น fill("สวัสดี {name}", { name: "mey" })
function fill(text, values) {
    for (const key in values) {
        text = text.split("{" + key + "}").join(values[key]);
    }
    return text;
}


// ===== 1. ภาษา =====

let lang = loadData("hikariLang", "th");
if (!LANG[lang]) {
    lang = "th";                         // ถ้าไม่มีภาษานี้ ใช้ภาษาไทย
}

// ดึงข้อความของ script.js ในภาษาที่เลือก
function t(key) {
    return LANG[lang].js[key];
}

const langSelect = document.getElementById("langSelect");

// เปลี่ยนข้อความทั้งหน้าเป็นภาษาที่เลือก
function applyLanguage() {
    const pack = LANG[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = pack.dir;          // ภาษาอาหรับอ่านขวาไปซ้าย (rtl)
    document.title = pack.html["page.title"];
    langSelect.value = lang;

    // แท็กที่มี data-i18n: เปลี่ยนข้อความข้างใน
    const textItems = document.querySelectorAll("[data-i18n]");
    for (let i = 0; i < textItems.length; i++) {
        textItems[i].innerHTML = pack.html[textItems[i].dataset.i18n];
    }
    // รูปภาพ: เปลี่ยนคำอธิบายรูป (alt)
    const altItems = document.querySelectorAll("[data-i18n-alt]");
    for (let i = 0; i < altItems.length; i++) {
        altItems[i].alt = pack.html[altItems[i].dataset.i18nAlt];
    }
    // ปุ่มที่มีแต่สัญลักษณ์: เปลี่ยนคำอธิบายสำหรับโปรแกรมอ่านหน้าจอ
    const ariaItems = document.querySelectorAll("[data-i18n-aria]");
    for (let i = 0; i < ariaItems.length; i++) {
        ariaItems[i].setAttribute("aria-label", pack.html[ariaItems[i].dataset.i18nAria]);
    }

    // ข้อความที่ JavaScript สร้างเอง ต้องวาดใหม่ด้วย
    refreshQuiz();
    refreshMood();
    refreshBreathing();
    updatePrice();
    updateAccountUI();
    renderLog();
    refreshPlanButtons();
    planMessage.textContent = "";
    renderVideos();
    renderGoogleButton();
}

langSelect.addEventListener("change", function () {
    lang = langSelect.value;
    saveData("hikariLang", lang);        // จำภาษาไว้ เปิดเว็บครั้งหน้าจะเป็นภาษาเดิม
    applyLanguage();
});


// ===== 2. เข้าสู่ระบบ / สมัครสมาชิก =====

let currentUser = loadData("hikariCurrentUser", null);   // ชื่อผู้ใช้ที่เข้าสู่ระบบอยู่ (null = ยังไม่เข้า)
let authMode = "login";                                  // "login" หรือ "register"

// ชื่อแผนสมาชิก (เป็นชื่อแบรนด์ จึงเหมือนกันทุกภาษา)
const PLAN_NAMES = { free: "Free", premium: "Premium", careplus: "Care+" };

const authModal = document.getElementById("authModal");
const authForm = document.getElementById("authForm");
const authUser = document.getElementById("authUser");
const authPass = document.getElementById("authPass");
const authMessage = document.getElementById("authMessage");
const accountButton = document.getElementById("accountButton");
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");

// ข้อมูลบัญชีของผู้ใช้ที่เข้าอยู่ (ชื่อ, hash, แผน, จำนวนครั้งที่เข้า)
function currentAccount() {
    const users = loadData("hikariUsers", {});
    return users[currentUser] || {};
}

// แผนของผู้ใช้ปัจจุบัน ถ้ายังไม่เคยเลือกถือว่าเป็น free
function currentPlan() {
    return currentAccount().plan || "free";
}

// เงื่อนไขชื่อผู้ใช้: a–z และ 0–9 เท่านั้น ยาว 5–30 ตัว
function userChecks(name) {
    return {
        uchars: name.length > 0 && /^[a-z0-9]+$/.test(name),
        ulen: name.length >= 5 && name.length <= 30
    };
}

// เงื่อนไขรหัสผ่าน: อย่างน้อย 8 ตัว มีพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ
function passChecks(pw) {
    return {
        plen: pw.length >= 8,
        plower: /[a-z]/.test(pw),
        pupper: /[A-Z]/.test(pw),
        pdigit: /[0-9]/.test(pw),
        pspecial: /[^A-Za-z0-9]/.test(pw)      // ตัวที่ไม่ใช่ตัวอักษรและตัวเลข = อักขระพิเศษ
    };
}

// true ถ้าผ่านทุกข้อ
function allPassed(checks) {
    for (const key in checks) {
        if (!checks[key]) {
            return false;
        }
    }
    return true;
}

// ใส่เครื่องหมาย ✓ ให้เงื่อนไขที่ผ่านแล้วในกล่องคำแนะนำ (เห็นตอนชี้เมาส์)
function updateRuleMarks() {
    const checks = Object.assign(userChecks(authUser.value), passChecks(authPass.value));
    const items = document.querySelectorAll(".rule-tip li");
    for (let i = 0; i < items.length; i++) {
        items[i].classList.toggle("ok", checks[items[i].dataset.rule]);
    }
}

// พิมพ์ชื่อผู้ใช้แล้วแปลงเป็นตัวเล็กทันที (ตามเงื่อนไข a–z)
authUser.addEventListener("input", function () {
    authUser.value = authUser.value.toLowerCase();
    updateRuleMarks();
});
authPass.addEventListener("input", updateRuleMarks);

// แปลงรหัสผ่านเป็นค่า hash (แปลงทางเดียว ย้อนกลับเป็นรหัสเดิมไม่ได้)
async function hashPassword(username, password) {
    const text = username + ":" + password;
    if (window.crypto && crypto.subtle) {
        const bytes = new TextEncoder().encode(text);
        const buffer = await crypto.subtle.digest("SHA-256", bytes);
        const list = Array.from(new Uint8Array(buffer));
        return list.map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    }
    // สำรอง: ถ้าเบราว์เซอร์ไม่มี crypto.subtle ใช้ hash แบบง่าย
    let h = 5381;
    for (let i = 0; i < text.length; i++) {
        h = (h * 33 + text.charCodeAt(i)) % 4294967296;
    }
    return "simple-" + h;
}

function setAuthMode(mode) {
    authMode = mode;
    tabLogin.classList.toggle("selected", mode === "login");
    tabRegister.classList.toggle("selected", mode === "register");
    document.getElementById("authTitle").textContent = t(mode);
    document.getElementById("authSubmit").textContent = t(mode);
    authPass.autocomplete = (mode === "login") ? "current-password" : "new-password";
    authMessage.textContent = "";
}

function openAuth(mode) {
    setAuthMode(mode);
    authModal.classList.remove("hidden");
    updateRuleMarks();
    authUser.focus();
}

function closeAuth() {
    authModal.classList.add("hidden");
    authForm.reset();
    authMessage.textContent = "";
}

tabLogin.addEventListener("click", function () { setAuthMode("login"); });
tabRegister.addEventListener("click", function () { setAuthMode("register"); });
document.getElementById("authClose").addEventListener("click", closeAuth);

// กดพื้นหลังสีเทา หรือกด Esc เพื่อปิดหน้าต่าง
authModal.addEventListener("click", function (event) {
    if (event.target === authModal) {
        closeAuth();
    }
});
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !authModal.classList.contains("hidden")) {
        closeAuth();
    }
});

// ปุ่มมุมขวาบน: ยังไม่เข้าสู่ระบบ = เปิดหน้าต่าง, เข้าแล้ว = ไปที่บันทึกของฉัน
accountButton.addEventListener("click", function () {
    if (currentUser) {
        document.getElementById("mylog").scrollIntoView();
    } else {
        openAuth("login");
    }
});

const openAuthButtons = document.querySelectorAll(".open-auth");
for (let i = 0; i < openAuthButtons.length; i++) {
    openAuthButtons[i].addEventListener("click", function () { openAuth("login"); });
}

// ส่งฟอร์ม (กดปุ่มหรือกด Enter)
authForm.addEventListener("submit", async function (event) {
    event.preventDefault();                       // ไม่ให้หน้าเว็บโหลดใหม่
    const username = authUser.value.trim().toLowerCase();
    const password = authPass.value;

    if (!allPassed(userChecks(username))) {
        authMessage.textContent = t("errUser");
        return;
    }
    if (!allPassed(passChecks(password))) {
        authMessage.textContent = t("errPass");
        return;
    }

    const users = loadData("hikariUsers", {});
    const hash = await hashPassword(username, password);

    if (authMode === "register") {
        if (users[username]) {
            authMessage.textContent = t("errExists");
            return;
        }
        users[username] = { hash: hash, created: new Date().toISOString(), plan: "free", loginCount: 0 };
        saveData("hikariUsers", users);
        loginAs(username, "register");
    } else {
        if (!users[username] || users[username].hash !== hash) {
            authMessage.textContent = t("errWrong");
            return;
        }
        loginAs(username, "login");
    }
});

let loginVia = null;                  // "google" เมื่อเข้าผ่าน Google (ส่วนที่ 12)

// เข้าสู่ระบบ: นับครั้ง + จำเวลาล่าสุด + บันทึก log (ชื่อผู้ใช้ เวลา สถานะ)
function loginAs(username, logType) {
    const users = loadData("hikariUsers", {});
    users[username].loginCount = (users[username].loginCount || 0) + 1;
    users[username].lastLogin = new Date().toISOString();
    saveData("hikariUsers", users);

    currentUser = username;
    saveData("hikariCurrentUser", currentUser);
    addLog(logType, loginVia ? { via: loginVia } : {});
    closeAuth();
    afterUserChange();
    document.getElementById("mylog").scrollIntoView();
}

document.getElementById("logoutButton").addEventListener("click", function () {
    addLog("logout", {});                 // บันทึกก่อน เพราะหลังจากนี้จะไม่รู้ว่าเป็นใคร
    currentUser = null;
    saveData("hikariCurrentUser", null);
    afterUserChange();
});

// เปลี่ยนผู้ใช้แล้ว ข้อมูลที่แสดงต้องเป็นของคนใหม่
function afterUserChange() {
    updateAccountUI();
    renderLog();
    showBreatheCount();
    refreshPlanButtons();
    if (!result.classList.contains("hidden")) {
        renderResult();
    }
}

function updateAccountUI() {
    if (currentUser) {
        // ชื่อยาวให้ตัดเป็น ... แต่แผนสมาชิกต้องเห็นเสมอ จึงแยกเป็น 2 ส่วน
        accountButton.innerHTML = '👤 <span class="acc-name"></span><span class="acc-dot">·</span><b class="acc-plan"></b>';
        accountButton.querySelector(".acc-name").textContent = currentUser;
        accountButton.querySelector(".acc-plan").textContent = PLAN_NAMES[currentPlan()];
    } else {
        accountButton.textContent = t("login");
    }
    // หัวข้อและปุ่มในหน้าต่างเข้าสู่ระบบ ต้องตรงกับภาษาปัจจุบันเสมอ
    document.getElementById("authTitle").textContent = t(authMode);
    document.getElementById("authSubmit").textContent = t(authMode);
}


// ===== 3. บันทึกกิจกรรม (log) + กราฟความเปลี่ยนแปลง =====

// ที่เก็บ log แยกตามผู้ใช้ เช่น hikariLog_mey12345
function logKey() {
    return "hikariLog_" + currentUser;
}

// เพิ่ม 1 รายการ: เวลา + ชื่อผู้ใช้ + สถานะสมาชิก + ชนิดกิจกรรม + ข้อมูลประกอบ
function addLog(type, data) {
    if (!currentUser) {
        return;                         // ยังไม่เข้าสู่ระบบ ไม่บันทึก
    }
    const log = loadData(logKey(), []);
    log.push({
        time: new Date().toISOString(),
        user: currentUser,
        plan: currentPlan(),
        type: type,
        data: data
    });
    while (log.length > 300) {
        log.shift();                    // เก็บแค่ 300 รายการล่าสุด
    }
    saveData(logKey(), log);
    renderLog();
}

// แปลงข้อมูลประกอบเป็นข้อความในภาษาปัจจุบัน
function logDetail(entry) {
    if (entry.type === "assessment") {
        return fill(t("detailAssessment"), { score: entry.data.score, level: t("levels")[entry.data.level] });
    }
    if (entry.type === "breathing") {
        return fill(t("detailBreathing"), { pattern: t("patternNames")[entry.data.pattern], min: entry.data.minutes });
    }
    if (entry.type === "mood") {
        return t("moodNames")[entry.data.mood];
    }
    if (entry.type === "plan") {
        return PLAN_NAMES[entry.data.from] + " → " + PLAN_NAMES[entry.data.to];
    }
    if (entry.type === "video") {
        return entry.data.title;        // ชื่อวิดีโอที่ดู
    }
    if (entry.data && entry.data.via === "google") {
        return "Google";                // สมัคร/เข้าสู่ระบบผ่าน Google
    }
    return "-";
}

function formatTime(iso) {
    return new Date(iso).toLocaleString(t("locale"), { dateStyle: "medium", timeStyle: "short" });
}

// แปลง 1 รายการเป็น 5 ช่อง: เวลา, ผู้ใช้, สถานะ, กิจกรรม, รายละเอียด
function logCells(entry) {
    return [
        formatTime(entry.time),
        entry.user || currentUser,
        PLAN_NAMES[entry.plan] || "-",
        t("logTypes")[entry.type],
        logDetail(entry)
    ];
}

// ตัวกรองตาราง: กลุ่มของชนิดกิจกรรม
const LOG_FILTERS = {
    all: null,
    access: ["register", "login", "logout"],
    assessment: ["assessment"],
    breathing: ["breathing"],
    mood: ["mood"],
    video: ["video"],
    plan: ["plan"]
};
let logFilter = "all";

// สร้างปุ่มตัวกรอง (ข้อความมาจากไฟล์ภาษา)
function renderFilters() {
    const box = document.getElementById("logFilters");
    box.innerHTML = "";
    for (const key in LOG_FILTERS) {
        const button = document.createElement("button");
        button.className = "chip";
        if (key === logFilter) {
            button.classList.add("selected");
        }
        if (key === "all") {
            button.textContent = t("filterAll");
        } else if (key === "access") {
            button.textContent = t("filterAccess");
        } else {
            button.textContent = t("logTypes")[key];
        }
        button.addEventListener("click", function () {
            logFilter = key;
            renderLog();
        });
        box.appendChild(button);
    }
}

// แสดงส่วนบันทึกทั้งหมด: ตัวเลขสรุป + กราฟ + ตาราง
function renderLog() {
    const guestBox = document.getElementById("logGuest");
    const userBox = document.getElementById("logUser");
    if (!currentUser) {
        guestBox.classList.remove("hidden");
        userBox.classList.add("hidden");
        return;
    }
    guestBox.classList.add("hidden");
    userBox.classList.remove("hidden");

    const account = currentAccount();
    document.getElementById("logHello").textContent = fill(t("hello"), { name: currentUser });
    document.getElementById("logSub").textContent = fill(t("loginInfo"), {
        n: account.loginCount || 0,
        time: account.lastLogin ? formatTime(account.lastLogin) : "-"
    });
    resetClearButton();

    const log = loadData(logKey(), []);
    let assess = 0;
    let breathe = 0;
    let mood = 0;
    for (let i = 0; i < log.length; i++) {
        if (log[i].type === "assessment") { assess++; }
        if (log[i].type === "breathing") { breathe++; }
        if (log[i].type === "mood") { mood++; }
    }
    document.getElementById("statAssess").textContent = assess;
    document.getElementById("statBreathe").textContent = breathe;
    document.getElementById("statMood").textContent = mood;
    document.getElementById("statPlan").textContent = PLAN_NAMES[currentPlan()];

    renderScoreChart(log);
    renderMoodChart(log);
    renderFilters();

    // ตาราง: รายการใหม่สุดอยู่บนสุด และแสดงเฉพาะกลุ่มที่เลือก
    const allowed = LOG_FILTERS[logFilter];
    const body = document.getElementById("logBody");
    body.innerHTML = "";
    let shown = 0;
    for (let i = log.length - 1; i >= 0; i--) {
        if (allowed && allowed.indexOf(log[i].type) === -1) {
            continue;                   // ไม่อยู่ในกลุ่มที่เลือก ข้ามไป
        }
        const row = document.createElement("tr");
        const cells = logCells(log[i]);
        for (let j = 0; j < cells.length; j++) {
            const cell = document.createElement("td");
            cell.textContent = cells[j];
            row.appendChild(cell);
        }
        body.appendChild(row);
        shown++;
    }
    document.getElementById("logEmpty").classList.toggle("hidden", shown > 0);
}

// กราฟเส้นคะแนนความเครียด 10 ครั้งล่าสุด (วาดด้วย SVG)
function renderScoreChart(log) {
    const svg = document.getElementById("scoreChart");
    const summary = document.getElementById("scoreSummary");
    const scores = log.filter(function (e) { return e.type === "assessment"; }).slice(-10);

    // พื้นที่วาด: ซ้าย 30, ขวา 310, บน 24, ล่าง 140 (คะแนน 0–15)
    const left = 30, right = 310, top = 24, bottom = 140;
    function y(score) { return bottom - score / 15 * (bottom - top); }

    // แถบสีพื้นหลังตามระดับ: ต่ำ / ปานกลาง / ค่อนข้างสูง / สูง
    let html = "";
    const bands = [[0, 3, "#e3f6ec"], [3, 6, "#fff4d9"], [6, 10, "#ffe9dc"], [10, 15, "#ffe4ec"]];
    for (let i = 0; i < bands.length; i++) {
        html += '<rect x="' + left + '" y="' + y(bands[i][1]) + '" width="' + (right - left) +
            '" height="' + (y(bands[i][0]) - y(bands[i][1])) + '" fill="' + bands[i][2] + '"/>';
    }
    const marks = [0, 5, 10, 15];
    for (let i = 0; i < marks.length; i++) {
        html += '<text x="' + (left - 6) + '" y="' + (y(marks[i]) + 4) + '" class="axis" text-anchor="end">' + marks[i] + "</text>";
    }

    if (scores.length === 0) {
        svg.innerHTML = html;
        summary.textContent = t("noScores");
        return;
    }

    // จุดของแต่ละครั้ง: ถ้ามีครั้งเดียวให้อยู่ตรงกลาง
    const step = scores.length > 1 ? (right - left - 30) / (scores.length - 1) : 0;
    const points = [];
    for (let i = 0; i < scores.length; i++) {
        const x = scores.length > 1 ? left + 15 + i * step : (left + right) / 2;
        points.push({ x: x, y: y(scores[i].data.score), e: scores[i] });
    }
    html += '<polyline fill="none" stroke="#3e6ee0" stroke-width="3" points="' +
        points.map(function (p) { return p.x + "," + p.y; }).join(" ") + '"/>';
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const day = new Date(p.e.time).toLocaleDateString(t("locale"), { day: "numeric", month: "numeric" });
        html += '<circle cx="' + p.x + '" cy="' + p.y + '" r="5" fill="#3e6ee0"/>';
        html += '<text x="' + p.x + '" y="' + (p.y - 9) + '" class="value" text-anchor="middle">' + p.e.data.score + "</text>";
        // แสดงวันที่ใต้กราฟ (ถ้าจุดเยอะ แสดงเฉพาะจุดเว้นจุด)
        if (points.length <= 6 || i % 2 === 0 || i === points.length - 1) {
            html += '<text x="' + p.x + '" y="' + (bottom + 18) + '" class="axis" text-anchor="middle">' + day + "</text>";
        }
    }
    svg.innerHTML = html;

    // สรุปการเปลี่ยนแปลง: ครั้งแรกเทียบครั้งล่าสุด
    const first = scores[0].data.score;
    const last = scores[scores.length - 1].data.score;
    if (scores.length === 1) {
        summary.textContent = fill(t("oneScore"), { a: last });
    } else if (last < first) {
        summary.textContent = fill(t("changeBetter"), { n: first - last, a: first, b: last });
    } else if (last > first) {
        summary.textContent = fill(t("changeWorse"), { n: last - first, a: first, b: last });
    } else {
        summary.textContent = fill(t("changeSame"), { a: last });
    }
}

// กราฟแท่งอารมณ์ 7 วันล่าสุด (ใช้อารมณ์ล่าสุดของแต่ละวัน)
const MOOD_VALUE = { very: 1, stressed: 2, ok: 3, good: 4, great: 5 };
const MOOD_EMOJI = { very: "😣", stressed: "😟", ok: "😐", good: "🙂", great: "😄" };
const MOOD_COLOR = { very: "#f0688a", stressed: "#f29b5c", ok: "#f4b63f", good: "#7bc9a0", great: "#3aa776" };

function renderMoodChart(log) {
    const svg = document.getElementById("moodChart");
    const summary = document.getElementById("moodSummary");
    const bottom = 135, maxHeight = 95, width = 30;
    let html = "";
    const counts = {};
    let total = 0;

    for (let d = 6; d >= 0; d--) {
        const day = new Date();
        day.setDate(day.getDate() - d);              // ย้อนหลัง d วัน
        const dayText = day.toDateString();
        let mood = null;
        for (let i = 0; i < log.length; i++) {
            if (log[i].type === "mood" && new Date(log[i].time).toDateString() === dayText) {
                mood = log[i].data.mood;             // ได้ค่าล่าสุดของวันนั้น (เพราะวนจากเก่าไปใหม่)
                counts[mood] = (counts[mood] || 0) + 1;
                total++;
            }
        }
        const x = 22 + (6 - d) * 43;
        const label = day.toLocaleDateString(t("locale"), { weekday: "short" });
        if (mood) {
            const h = MOOD_VALUE[mood] / 5 * maxHeight;
            html += '<rect x="' + x + '" y="' + (bottom - h) + '" width="' + width + '" height="' + h +
                '" rx="6" fill="' + MOOD_COLOR[mood] + '"/>';
            html += '<text x="' + (x + width / 2) + '" y="' + (bottom - h - 6) + '" text-anchor="middle" class="emoji">' + MOOD_EMOJI[mood] + "</text>";
        } else {
            html += '<rect x="' + x + '" y="' + (bottom - 4) + '" width="' + width + '" height="4" rx="2" fill="#dfe4f5"/>';
        }
        html += '<text x="' + (x + width / 2) + '" y="' + (bottom + 20) + '" class="axis" text-anchor="middle">' + label + "</text>";
    }
    svg.innerHTML = html;

    if (total === 0) {
        summary.textContent = t("noMood");
        return;
    }
    // อารมณ์ที่บันทึกบ่อยที่สุดใน 7 วัน
    let top = null;
    for (const key in counts) {
        if (top === null || counts[key] > counts[top]) {
            top = key;
        }
    }
    summary.textContent = fill(t("moodTop"), { mood: t("moodNames")[top], n: total });
}

// ดาวน์โหลดบันทึกเป็นไฟล์ CSV (เปิดใน Excel / Google Sheets ได้)
document.getElementById("downloadLog").addEventListener("click", function () {
    const log = loadData(logKey(), []);
    const rows = [t("csvHeader")];
    for (let i = 0; i < log.length; i++) {
        rows.push(logCells(log[i]));
    }
    let csv = "";
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].map(function (c) { return '"' + String(c).split('"').join('""') + '"'; });
        csv += cells.join(",") + "\n";
    }
    // ﻿ ช่วยให้ Excel อ่านภาษาไทยถูก
    const file = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "hikari-log-" + currentUser + ".csv";
    link.click();
    URL.revokeObjectURL(link.href);
});

// ลบบันทึก: ต้องกด 2 ครั้งภายใน 3 วินาที กันกดพลาด
const clearLogButton = document.getElementById("clearLog");
let clearPending = false;
let clearTimer = null;

function resetClearButton() {
    clearPending = false;
    clearTimeout(clearTimer);
    clearLogButton.textContent = t("clearLog");
}

clearLogButton.addEventListener("click", function () {
    if (!clearPending) {
        clearPending = true;
        clearLogButton.textContent = t("clearConfirm");
        clearTimer = setTimeout(resetClearButton, 3000);
        return;
    }
    saveData(logKey(), []);
    saveData(historyKey(), []);
    resetClearButton();
    renderLog();
});


// ===== 4. เมนูบนมือถือ =====

const menuButton = document.getElementById("menuButton");
const navLinks = document.getElementById("navLinks");

menuButton.addEventListener("click", function () {
    navLinks.classList.toggle("open");
});

const menuLinks = navLinks.querySelectorAll("a");
for (let i = 0; i < menuLinks.length; i++) {
    menuLinks[i].addEventListener("click", function () {
        navLinks.classList.remove("open");
    });
}


// ===== 5. แบบประเมินความเครียด 18 ข้อ =====
// ข้อความคำถามอยู่ในไฟล์ภาษา ส่วนนี้เก็บแค่ "หมวด" ของแต่ละข้อ (ลำดับตรงกัน)
const questionFactors = [
    "general", "general", "general", "general", "general", "general",
    "work", "work", "work",
    "money", "money", "money",
    "sleep", "sleep", "sleep",
    "relation", "relation", "relation"
];
const choiceEmojis = ["😄", "🙂", "😟", "😣"];   // คะแนน 0, 1, 2, 3 ตามลำดับ
const levelColors = ["#3aa776", "#f4b63f", "#f29b5c", "#f0688a"];

const answers = [];      // answers[0] = คะแนนข้อ 1 ...
let current = 0;         // ข้อที่กำลังแสดง (เริ่มที่ 0)

const quiz = document.getElementById("quiz");
const questionText = document.getElementById("questionText");
const optionsBox = document.getElementById("options");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const backButton = document.getElementById("backButton");
const nextButton = document.getElementById("nextButton");
const quizMessage = document.getElementById("quizMessage");
const result = document.getElementById("result");

// แสดงคำถามข้อปัจจุบัน
function showQuestion() {
    const total = questionFactors.length;
    questionText.textContent = (current + 1) + ". " + t("questions")[current];
    progressText.textContent = (current + 1) + "/" + total;
    progressFill.style.width = ((current + 1) / total * 100) + "%";
    quizMessage.textContent = "";

    optionsBox.innerHTML = "";
    for (let i = 0; i < choiceEmojis.length; i++) {
        const button = document.createElement("button");
        button.className = "option";
        button.innerHTML = '<span class="option-emoji">' + choiceEmojis[i] + "</span>" + t("choices")[i];
        if (answers[current] === i) {
            button.classList.add("selected");
        }
        button.addEventListener("click", function () {
            answers[current] = i;              // คะแนน = ลำดับของคำตอบ (0–3)
            showQuestion();
        });
        optionsBox.appendChild(button);
    }

    backButton.disabled = (current === 0);
    nextButton.textContent = (current === total - 1) ? t("seeResult") : t("next");
}

backButton.addEventListener("click", function () {
    if (current > 0) {
        current = current - 1;
        showQuestion();
    }
});

nextButton.addEventListener("click", function () {
    if (answers[current] === undefined) {
        quizMessage.textContent = t("needAnswer");
        return;
    }
    if (current < questionFactors.length - 1) {
        current = current + 1;
        showQuestion();
    } else {
        showResult();
    }
});

// คำนวณคะแนน: คืนค่า คะแนนเต็ม 15, ระดับ (0–3), รายการปัจจัยเรียงจากมากไปน้อย
function calculate() {
    let total = 0;
    for (let i = 0; i < answers.length; i++) {
        total = total + answers[i];
    }
    const score = Math.round(total / 54 * 15);       // เต็ม 54 แปลงเป็นเต็ม 15

    let level = 3;
    if (score <= 3) {
        level = 0;
    } else if (score <= 6) {
        level = 1;
    } else if (score <= 10) {
        level = 2;
    }

    const sums = { work: 0, money: 0, sleep: 0, relation: 0 };
    for (let i = 0; i < questionFactors.length; i++) {
        const f = questionFactors[i];
        if (f !== "general") {
            sums[f] = sums[f] + answers[i];
        }
    }
    const list = [];
    for (const key in sums) {
        list.push({ key: key, percent: Math.round(sums[key] / 9 * 100) });   // หมวดละ 3 ข้อ เต็ม 9
    }
    list.sort(function (a, b) {
        return b.percent - a.percent;
    });
    return { score: score, level: level, list: list };
}

// ตอบครบแล้ว: บันทึกผล 1 ครั้ง แล้วแสดงผล
function showResult() {
    const r = calculate();
    saveHistory(r.score);
    addLog("assessment", { score: r.score, level: r.level });
    renderResult();
    quiz.classList.add("hidden");
    result.classList.remove("hidden");
}

// วาดหน้าผลลัพธ์ (เรียกซ้ำได้ตอนเปลี่ยนภาษา โดยไม่บันทึกซ้ำ)
function renderResult() {
    const r = calculate();
    const color = levelColors[r.level];
    const factors = t("factors");

    document.getElementById("scoreNumber").textContent = r.score;
    document.getElementById("scoreLevel").textContent = t("levels")[r.level];
    const percent = r.score / 15 * 100;
    document.getElementById("scoreRing").style.background =
        "conic-gradient(" + color + " " + percent + "%, #eef0f8 " + percent + "%)";

    let barsHtml = "";
    for (let i = 0; i < r.list.length; i++) {
        barsHtml += '<div class="factor">' +
            "<span>" + factors[r.list[i].key].name + "</span>" +
            '<div class="bar-track"><div class="bar-fill" style="width:' + r.list[i].percent + '%"></div></div>' +
            "<b>" + r.list[i].percent + "%</b></div>";
    }
    document.getElementById("factorBars").innerHTML = barsHtml;

    document.getElementById("resultSummary").textContent = fill(t("summary"), {
        level: t("levels")[r.level],
        a: factors[r.list[0].key].name,
        b: factors[r.list[1].key].name
    });

    document.getElementById("quickTips").innerHTML =
        '<a class="tip" href="#breathe">' + t("tipBreathe") + "</a>" +
        '<span class="tip">' + factors[r.list[0].key].tip + "</span>" +
        '<span class="tip">' + factors[r.list[1].key].tip + "</span>";

    document.getElementById("helpNote").classList.toggle("hidden", r.score < 11);
    showHistory();
}

// รีเฟรชข้อความของแบบประเมินตอนเปลี่ยนภาษา
function refreshQuiz() {
    if (result.classList.contains("hidden")) {
        showQuestion();
    } else {
        renderResult();
    }
}

document.getElementById("restartButton").addEventListener("click", function () {
    answers.length = 0;
    current = 0;
    result.classList.add("hidden");
    quiz.classList.remove("hidden");
    showQuestion();
});

// ผลย้อนหลัง: แยกตามผู้ใช้ (ยังไม่เข้าสู่ระบบ = guest)
function historyKey() {
    return "hikariHistory_" + (currentUser || "guest");
}

function saveHistory(score) {
    const history = loadData(historyKey(), []);
    history.push({ time: new Date().toISOString(), score: score });
    while (history.length > 5) {
        history.shift();                 // เก็บแค่ 5 ครั้งล่าสุด
    }
    saveData(historyKey(), history);
}

function showHistory() {
    const history = loadData(historyKey(), []);
    const box = document.getElementById("historyBox");
    if (history.length < 2) {
        box.innerHTML = '<span class="history-item">' + t("historyFirst") + "</span>";
        return;
    }
    let html = "";
    for (let i = 0; i < history.length; i++) {
        const day = new Date(history[i].time).toLocaleDateString(t("locale"), { day: "numeric", month: "short" });
        html += '<span class="history-item">' + day + " · <b>" + history[i].score + "</b>/15</span>";
    }
    const diff = history[history.length - 1].score - history[history.length - 2].score;
    if (diff < 0) {
        html += '<span class="history-item">' + fill(t("historyDown"), { n: -diff }) + "</span>";
    } else if (diff > 0) {
        html += '<span class="history-item">' + fill(t("historyUp"), { n: diff }) + "</span>";
    } else {
        html += '<span class="history-item">' + t("historySame") + "</span>";
    }
    box.innerHTML = html;
}


// ===== 6. การ์ดดูแลตัวเอง: กดลูกศรเพื่อเปิด/ปิดขั้นตอน =====

const arrowButtons = document.querySelectorAll(".arrow-button");
for (let i = 0; i < arrowButtons.length; i++) {
    arrowButtons[i].addEventListener("click", function () {
        const steps = arrowButtons[i].nextElementSibling;
        steps.classList.toggle("hidden");
        arrowButtons[i].classList.toggle("open");
    });
}


// ===== 7. เลือกอารมณ์ (จอแอปตัวอย่าง + ช่องบันทึกอารมณ์ในบันทึกของฉัน) =====

const moodButtons = document.querySelectorAll(".mood-button");   // ได้ทั้ง 2 ที่ เพราะใช้ class เดียวกัน
const moodMessage = document.getElementById("moodMessage");
const checkinMessage = document.getElementById("checkinMessage");
let selectedMood = null;

function refreshMood() {
    // ชื่ออารมณ์ใต้ emoji ในช่องบันทึกอารมณ์ (ดึงจากไฟล์ภาษา)
    const labels = document.querySelectorAll(".checkin-row .mood-button small");
    for (let i = 0; i < labels.length; i++) {
        labels[i].textContent = t("moodNames")[labels[i].parentElement.dataset.mood];
    }
    if (selectedMood === null) {
        moodMessage.textContent = t("moodPrompt");
        checkinMessage.textContent = "";
        return;
    }
    let text = t("moodReplies")[selectedMood];
    if (currentUser) {
        text += " " + t("moodSaved");
    }
    moodMessage.textContent = text;
    checkinMessage.textContent = text;
}

for (let i = 0; i < moodButtons.length; i++) {
    moodButtons[i].addEventListener("click", function () {
        selectedMood = moodButtons[i].dataset.mood;
        // ไฮไลต์ปุ่มอารมณ์เดียวกันทั้ง 2 ที่
        for (let j = 0; j < moodButtons.length; j++) {
            moodButtons[j].classList.toggle("selected", moodButtons[j].dataset.mood === selectedMood);
        }
        addLog("mood", { mood: selectedMood });
        refreshMood();
    });
}


// ===== 8. ตัวจับเวลาฝึกหายใจ =====
// แต่ละรูปแบบคือรายการ "ช่วง" (phase): ชนิด, จำนวนวินาที, ขนาดวงกลม
const patterns = {
    relax: [
        { phase: "inhale", seconds: 4, scale: 1.5 },
        { phase: "hold", seconds: 4, scale: 1.5 },
        { phase: "exhale", seconds: 6, scale: 1 }
    ],
    box: [
        { phase: "inhale", seconds: 4, scale: 1.5 },
        { phase: "hold", seconds: 4, scale: 1.5 },
        { phase: "exhale", seconds: 4, scale: 1 },
        { phase: "hold", seconds: 4, scale: 1 }
    ],
    slow: [
        { phase: "inhale", seconds: 5, scale: 1.5 },
        { phase: "exhale", seconds: 5, scale: 1 }
    ]
};

let patternName = "relax";
let minutes = 1;
let timer = null;              // เก็บ setInterval ไว้หยุดภายหลัง
let phaseIndex = 0;
let phaseLeft = 0;
let totalLeft = 60;
let breatheState = "ready";    // ready / running / paused / done

const breatheButton = document.getElementById("breatheButton");
const breatheCircle = document.getElementById("breatheCircle");
const breathePhase = document.getElementById("breathePhase");
const breatheSeconds = document.getElementById("breatheSeconds");
const breatheLeft = document.getElementById("breatheLeft");
const breatheCount = document.getElementById("breatheCount");

// ทำให้ปุ่มในกลุ่มเลือกได้ทีละปุ่ม
function setupChips(groupId, onPick) {
    const buttons = document.querySelectorAll("#" + groupId + " .chip");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener("click", function () {
            for (let j = 0; j < buttons.length; j++) {
                buttons[j].classList.remove("selected");
            }
            buttons[i].classList.add("selected");
            onPick(buttons[i]);
        });
    }
}

setupChips("patternButtons", function (button) {
    patternName = button.dataset.pattern;
    stopBreathing("ready");
});

setupChips("timeButtons", function (button) {
    minutes = Number(button.dataset.minutes);
    stopBreathing("ready");
});

// แปลงวินาทีเป็น "นาที:วินาที"
function formatClock(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ":" + (s < 10 ? "0" + s : s);
}

// เริ่มช่วงใหม่ และสั่งวงกลมขยาย/หด
function startPhase() {
    const step = patterns[patternName][phaseIndex];
    phaseLeft = step.seconds;
    breathePhase.textContent = t("phases")[step.phase];
    breatheSeconds.textContent = phaseLeft;
    breatheCircle.style.transitionDuration = step.seconds + "s";
    breatheCircle.style.transform = "scale(" + step.scale + ")";
}

// ทำงานทุก 1 วินาที
function tick() {
    totalLeft = totalLeft - 1;
    phaseLeft = phaseLeft - 1;
    breatheLeft.textContent = fill(t("timeLeft"), { t: formatClock(totalLeft) });

    if (totalLeft <= 0) {
        addBreatheCount();
        addLog("breathing", { pattern: patternName, minutes: minutes });
        stopBreathing("done");
        return;
    }
    if (phaseLeft <= 0) {
        phaseIndex = (phaseIndex + 1) % patterns[patternName].length;
        startPhase();
    } else {
        breatheSeconds.textContent = phaseLeft;
    }
}

function stopBreathing(state) {
    clearInterval(timer);
    timer = null;
    breatheState = state;
    totalLeft = minutes * 60;
    breatheCircle.style.transitionDuration = "1s";
    breatheCircle.style.transform = "scale(1)";
    refreshBreathing();
}

// เขียนข้อความของส่วนหายใจใหม่ (ใช้ตอนหยุดและตอนเปลี่ยนภาษา)
function refreshBreathing() {
    breatheButton.textContent = (timer === null) ? t("start") : t("stop");
    breatheLeft.textContent = fill(t("timeLeft"), { t: formatClock(totalLeft) });
    if (breatheState === "running") {
        breathePhase.textContent = t("phases")[patterns[patternName][phaseIndex].phase];
    } else {
        breathePhase.textContent = t(breatheState);
        breatheSeconds.textContent = "";
    }
    showBreatheCount();
}

breatheButton.addEventListener("click", function () {
    if (timer !== null) {
        stopBreathing("paused");
        return;
    }
    breatheState = "running";
    totalLeft = minutes * 60;
    phaseIndex = 0;
    startPhase();
    timer = setInterval(tick, 1000);
    refreshBreathing();
});

// นับจำนวนครั้งที่ฝึกครบในวันนี้ (แยกตามผู้ใช้)
function todayKey() {
    return "hikariBreathe_" + (currentUser || "guest") + "_" + new Date().toDateString();
}

function showBreatheCount() {
    const count = loadData(todayKey(), 0);
    breatheCount.textContent = fill(t("todayCount"), { n: count });
    return count;
}

function addBreatheCount() {
    saveData(todayKey(), showBreatheCount() + 1);
    showBreatheCount();
}


// ===== 9. แผนบริการ: สลับรายเดือน/รายปี + ส่วนลดนักศึกษา =====

let billing = "month";
const studentCheck = document.getElementById("studentCheck");
const premiumPrice = document.getElementById("premiumPrice");
const premiumUnit = document.getElementById("premiumUnit");

function updatePrice() {
    let price = (billing === "month") ? 99 : 790;
    if (studentCheck.checked) {
        price = Math.round(price / 2);
    }
    premiumPrice.textContent = "฿" + price;
    premiumUnit.textContent = (billing === "month") ? t("perMonth") : t("perYear");
}

const billingButtons = document.querySelectorAll(".plan-switch .chip");
for (let i = 0; i < billingButtons.length; i++) {
    billingButtons[i].addEventListener("click", function () {
        for (let j = 0; j < billingButtons.length; j++) {
            billingButtons[j].classList.remove("selected");
        }
        billingButtons[i].classList.add("selected");
        billing = billingButtons[i].dataset.billing;
        updatePrice();
    });
}

studentCheck.addEventListener("change", updatePrice);

// เลือกแผน (จำลอง ไม่มีการชำระเงิน): เก็บสถานะไว้ในบัญชี และบันทึกลง log
const planMessage = document.getElementById("planMessage");
const planButtons = document.querySelectorAll(".plan-button");

function refreshPlanButtons() {
    const mine = currentUser ? currentPlan() : null;
    updateVideoPromo();                 // แบนเนอร์ Premium ในส่วนวิดีโอ (ส่วนที่ 11)
    for (let i = 0; i < planButtons.length; i++) {
        const isMine = planButtons[i].dataset.plan === mine;
        planButtons[i].textContent = isMine ? t("planCurrent") : t("planUse");
        planButtons[i].disabled = isMine;
    }
}

for (let i = 0; i < planButtons.length; i++) {
    planButtons[i].addEventListener("click", function () {
        if (!currentUser) {
            planMessage.textContent = t("needLogin");
            openAuth("login");
            return;
        }
        const users = loadData("hikariUsers", {});
        const from = users[currentUser].plan || "free";
        const to = planButtons[i].dataset.plan;
        users[currentUser].plan = to;
        saveData("hikariUsers", users);
        addLog("plan", { from: from, to: to });
        planMessage.textContent = fill(t("planChanged"), { plan: PLAN_NAMES[to] });
        updateAccountUI();
        refreshPlanButtons();
    });
}


// ===== 11. วิดีโอคลายเครียด =====
// เราไม่ได้เก็บไฟล์วิดีโอเอง แต่ "ฝัง" (embed) วิดีโอจาก YouTube ที่เจ้าของเปิดให้ฝังได้
// id = รหัสวิดีโอในลิงก์ youtube.com/watch?v=รหัสนี้   lang = ภาษาของวิดีโอ
// อยากเพิ่มวิดีโอ: คัดลอก 1 บรรทัด แล้วเปลี่ยน id ชื่อ และช่อง
const VIDEOS = [
    { id: "3VL8tQ818QM", lang: "TH", title: "ฝึกหายใจ ลดความเครียด ความตื่นตระหนก : ปรับก่อนป่วย", source: "Thai PBS" },
    { id: "Jr2ZCCbd96o", lang: "TH", title: "การฝึกหายใจ เพื่อปรับสมดุลอารมณ์ | ปรับก่อนป่วย", source: "Thai PBS" },
    { id: "JZe_ARZZW8k", lang: "TH", title: "หลักสูตรการดูแลจิตใจในวิกฤตโควิด 19 | วันที่ 1 ฝึกสมาธิ", source: "กรมสุขภาพจิต กระทรวงสาธารณสุข" },
    { id: "lW21fyxBNs4", lang: "EN", title: "Tool 3: Grounding | Managing Stress Better", source: "WHO South-East Asia" },
    { id: "rC3U9H3HWyk", lang: "EN", title: "Tool 6: Making Room | Managing Stress Better", source: "WHO South-East Asia" },
    { id: "9wTTAQt6XC0", lang: "EN", title: "Exercise 2: Ground yourself (Doing What Matters in Times of Stress)", source: "PAHO TV" }
];
// กฎของ YouTube ที่ต้องทำตาม (YouTube API Services Developer Policies)
// - ห้ามเก็บเงินเพื่อดูวิดีโอ YouTube และห้ามให้ต้องทำอย่างอื่นนอกจากกดเล่น
// - ห้ามบล็อกหรือแก้ไขโฆษณาของ YouTube
// จึงให้ทุกคน (Free / Premium / Care+) กดแล้วเล่นทันที ไม่มีโฆษณาของเราคั่น

const videoModal = document.getElementById("videoModal");
const videoPlayer = document.getElementById("videoPlayer");
let playingVideo = null;

// วาดการ์ดวิดีโอ (รูปตัวอย่างดึงจาก YouTube ไม่ต้องเก็บรูปเอง)
function renderVideos() {
    const grid = document.getElementById("videoGrid");
    grid.innerHTML = "";
    for (let i = 0; i < VIDEOS.length; i++) {
        const v = VIDEOS[i];
        const card = document.createElement("button");
        card.type = "button";
        card.className = "card video-card";
        card.innerHTML = '<div class="video-thumb"><img loading="lazy" alt=""><span class="video-lang"></span>' +
            '<span class="video-play" aria-hidden="true">▶</span></div>' +
            '<div class="video-info"><h3></h3><p></p></div>';
        card.querySelector("img").src = "https://i.ytimg.com/vi/" + v.id + "/hqdefault.jpg";
        card.querySelector(".video-lang").textContent = v.lang;
        card.querySelector("h3").textContent = v.title;
        card.querySelector("p").textContent = v.source;
        card.setAttribute("aria-label", t("videoPlay") + ": " + v.title);
        card.addEventListener("click", function () { openVideo(v); });
        grid.appendChild(card);
    }
}

// แบนเนอร์แนะนำ Premium (อยู่ในหน้าเว็บ ไม่ทับวิดีโอ): ซ่อนเมื่อเป็นสมาชิก Premium / Care+ แล้ว
function updateVideoPromo() {
    const paid = currentUser && currentPlan() !== "free";
    document.getElementById("videoPromo").classList.toggle("hidden", Boolean(paid));
}

function openVideo(v) {
    playingVideo = v;
    document.getElementById("videoTitle").textContent = v.title;
    document.getElementById("videoSource").href = "https://www.youtube.com/watch?v=" + v.id;
    videoPlayer.innerHTML = "";
    videoModal.classList.remove("hidden");
    addLog("video", { id: v.id, title: v.title });
    playVideo();
    document.getElementById("videoClose").focus();
}

// เล่นวิดีโอ: ใช้ youtube-nocookie.com (โหมดเก็บข้อมูลผู้ชมน้อยลง)
function playVideo() {
    const frame = document.createElement("iframe");
    frame.src = "https://www.youtube-nocookie.com/embed/" + playingVideo.id + "?autoplay=1&rel=0";
    frame.title = playingVideo.title;
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    videoPlayer.appendChild(frame);
}

function closeVideo() {
    videoPlayer.innerHTML = "";          // เอา iframe ออก เสียงจะได้หยุด
    videoModal.classList.add("hidden");
}

document.getElementById("videoClose").addEventListener("click", closeVideo);
videoModal.addEventListener("click", function (event) {
    if (event.target === videoModal) {
        closeVideo();
    }
});
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !videoModal.classList.contains("hidden")) {
        closeVideo();
    }
});


// ===== 12. เข้าสู่ระบบด้วย Google (Google Identity Services) =====
// ขั้นตอน: โหลดสคริปต์ของ Google → แสดงปุ่ม → ผู้ใช้เลือกบัญชี Gmail
// → Google ส่ง "credential" (JWT) กลับมา → อ่านอีเมล/ชื่อ → สร้างหรือหาบัญชีในเครื่อง
// หมายเหตุ: เว็บนี้ไม่มีเซิร์ฟเวอร์ จึงอ่าน JWT ฝั่งเบราว์เซอร์อย่างเดียว เหมาะกับงานเดโม
let googleReady = false;

function loadGoogle() {
    if (GOOGLE_CLIENT_ID === "") {
        return;                          // ยังไม่ได้ตั้งค่า: ไม่แสดงปุ่ม Google
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = function () {
        google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onGoogleLogin });
        googleReady = true;
        renderGoogleButton();
    };
    document.head.appendChild(script);
}

// วาดปุ่มใหม่ทุกครั้งที่เปลี่ยนภาษา (ข้อความบนปุ่มเป็นภาษาที่เลือก)
function renderGoogleButton() {
    if (!googleReady) {
        return;
    }
    document.getElementById("googleArea").classList.remove("hidden");
    const box = document.getElementById("googleButton");
    box.innerHTML = "";
    google.accounts.id.renderButton(box, {
        theme: "outline", size: "large", shape: "pill", text: "continue_with",
        width: 300, locale: t("locale")
    });
}

// อ่านข้อมูลใน JWT (ส่วนกลางระหว่างจุด . คือข้อมูลผู้ใช้ เข้ารหัสแบบ base64url)
function readJwt(token) {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(part), function (c) { return c.charCodeAt(0); });
    return JSON.parse(new TextDecoder().decode(bytes));     // รองรับชื่อภาษาไทย
}

// สร้างชื่อผู้ใช้จากอีเมล ให้ตรงกฎ a-z 0-9 ยาว 5–30 และไม่ซ้ำคนอื่น
function usernameFromEmail(email, users) {
    let base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 26);
    while (base.length < 5) {
        base += "0";
    }
    let name = base;
    let n = 1;
    while (users[name]) {
        name = base + n;
        n++;
    }
    return name;
}

function onGoogleLogin(response) {
    const info = readJwt(response.credential);    // sub = รหัสบัญชี Google ที่ไม่เปลี่ยน
    const users = loadData("hikariUsers", {});
    let username = null;
    for (const name in users) {
        if (users[name].googleSub === info.sub) {
            username = name;                         // เคยเข้าด้วย Google แล้ว
        }
    }
    let logType = "login";
    if (!username) {
        username = usernameFromEmail(info.email || "google", users);
        users[username] = {
            provider: "google", googleSub: info.sub, email: info.email, name: info.name,
            created: new Date().toISOString(), plan: "free", loginCount: 0
        };
        saveData("hikariUsers", users);
        logType = "register";
    }
    loginAsVia(username, logType, "google");
}

// เหมือน loginAs แต่บันทึกใน log ว่าเข้าผ่านช่องทางไหน
function loginAsVia(username, logType, via) {
    loginVia = via;
    loginAs(username, logType);
    loginVia = null;
}


// ===== 10. เริ่มทำงานเมื่อเปิดหน้าเว็บ =====

// แสดงปุ่มแบบสอบถามเฉพาะเมื่อใส่ลิงก์ไว้แล้ว
if (SURVEY_URL !== "") {
    document.getElementById("surveyLink").href = SURVEY_URL;
    document.getElementById("feedback").classList.remove("hidden");
}
loadGoogle();
applyLanguage();
