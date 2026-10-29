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
// ส่วนที่ 14: ร้านค้า ชำระเงินด้วย PromptPay
// ส่วนที่ 13: ภารกิจ 60 วัน (คลิป + ภารกิจ 3 ข้อ + วันต่อเนื่อง + กล่องรางวัล) ข้อมูลอยู่ใน content.js
// ส่วนที่ 15: ความเป็นส่วนตัว (ลบข้อมูลทั้งหมด), ลิงก์ติดต่อ, ป้ายเตือนเมื่อเปิดจากในแอป LINE / Facebook / Instagram
// ส่วนที่ 16: พักสั้น 1–3 นาที (6 การ์ด มีตัวจับเวลา) ข้อมูลอยู่ใน content.js RESETS
// ส่วนที่ 17: เช็กภาวะหมดไฟ Copenhagen Burnout Inventory (CBI) 13 ข้อ
// ส่วนที่ 18: รับมือที่ต้นเหตุ (เลือกต้นเหตุ ≤ 3 เรื่อง + การ์ดทักษะ + เคล็ดลับวันนี้ + ที่ฉันเลือกทำวันนี้)
// ส่วนที่ 19: เช็กร่างกายและพฤติกรรมรายสัปดาห์ + ข้อมูลการใช้สาร (ถามครั้งเดียว) + เมื่อไรควรพบแพทย์ + ภาพรวมของฉัน + ชวนคนที่ไว้ใจคุย
// ส่วนที่ 20: คัดกรองภาวะซึมเศร้า 2Q → 9Q (กรมสุขภาพจิต)
// =====================================================================

// ค่าตั้งค่า (SURVEY_URL, GOOGLE_CLIENT_ID, PROMPTPAY_ID, PROMPTPAY_NAME, SLIP_URL, CONTACT_URL, SITE_URL) อยู่ในไฟล์ config.js
// ฟังก์ชันสร้าง QR PromptPay อยู่ในไฟล์ pay.js (ใช้ร่วมกับหน้าเกม game.html)


// ===== 0. เครื่องมือช่วย =====

// ที่เก็บสำรองในหน่วยความจำ: ใช้เมื่อเบราว์เซอร์ไม่ให้ใช้ localStorage (เช่น โหมดส่วนตัวบางแบบ)
// เว็บจึงยังใช้งานได้ระหว่างเปิดหน้านี้ ปิดหน้าแล้วข้อมูลหาย
const memoryStore = {};

// อ่านข้อมูลจาก localStorage (แปลงจากข้อความ JSON กลับเป็นข้อมูล)
function loadData(key, defaultValue) {
    try {
        const text = localStorage.getItem(key);
        if (text !== null) {
            return JSON.parse(text);
        }
    } catch (e) {
        // บางเบราว์เซอร์ไม่ให้ใช้ localStorage: ใช้ค่าที่จำไว้ในหน่วยความจำ (ถ้ามี) หรือค่าเริ่มต้น
        if (memoryStore.hasOwnProperty(key)) {
            return JSON.parse(memoryStore[key]);
        }
    }
    return defaultValue;
}

// เขียนข้อมูลลง localStorage (แปลงเป็นข้อความ JSON ก่อน)
function saveData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        // บันทึกไม่ได้ ก็จำไว้ในหน่วยความจำแทน เว็บยังใช้งานต่อได้
        memoryStore[key] = JSON.stringify(value);
    }
}

// เติมค่าลงในช่อง {ชื่อ} ของข้อความ เช่น fill("สวัสดี {name}", { name: "mey" })
function fill(text, values) {
    for (const key in values) {
        text = text.split("{" + key + "}").join(values[key]);
    }
    return text;
}

// ทำให้เบอร์สายด่วน (1323, 1669) ในข้อความกดโทรได้: แยกเฉพาะ "ข้อความ" ออกมาสร้างลิงก์ tel:
// ใช้ textContent / createElement เท่านั้น จึงไม่มีการแทรก HTML จากข้อความ
const PHONE_PATTERN = /(1323|1669)/;
function linkPhones(root) {
    if (!root) {
        return;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
        const node = walker.currentNode;
        // ข้ามข้อความที่อยู่ในลิงก์หรือปุ่มอยู่แล้ว
        if (PHONE_PATTERN.test(node.nodeValue) && !node.parentElement.closest("a, button, option, select")) {
            nodes.push(node);
        }
    }
    nodes.forEach(function (node) {
        const parts = node.nodeValue.split(/(1323|1669)/);
        const frag = document.createDocumentFragment();
        parts.forEach(function (part) {
            if (part === "1323" || part === "1669") {
                const link = document.createElement("a");
                link.href = "tel:" + part;
                link.className = "tel-link";
                link.textContent = part;
                frag.appendChild(link);
            } else if (part !== "") {
                frag.appendChild(document.createTextNode(part));
            }
        });
        node.parentNode.replaceChild(frag, node);
    });
}

// ใส่ข้อความแบบปลอดภัย แล้วทำให้เบอร์สายด่วนกดได้
function setTextWithPhones(element, text) {
    element.textContent = text;
    linkPhones(element);
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
        linkPhones(textItems[i]);                     // เบอร์ 1323 / 1669 ในข้อความกดโทรได้
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
    renderJourney();
    renderVideos();
    renderGoogleButton();
    renderResets();
    refreshBurnout();
    renderCauses();
    refreshCheck();                     // v18: เช็กร่างกาย / คัดกรองซึมเศร้า / ชวนคุย / ภาพรวม
    refreshDep();
    renderTalk();
    renderOverview();
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

// ข้อมูลที่ทำไว้ตอนยังไม่เข้าสู่ระบบ (guest) ย้ายไปเป็นของบัญชีที่เพิ่งเข้า
// ย้ายเฉพาะเมื่อบัญชีนั้นยังไม่มีข้อมูลชนิดเดียวกัน (ไม่ทับของเดิม) แล้วลบสำเนาของ guest
// ชนิดข้อมูล: ผลประเมิน, ภารกิจ 60 วัน, จำนวนครั้งฝึกหายใจรายวัน, เกมสวนแสง, บันทึก, คำสั่งซื้อ,
// ผลเช็กภาวะหมดไฟ, จำนวนครั้งพักสั้นรายวัน, ต้นเหตุความเครียดที่เลือก
// v18: ข้อมูลการใช้สาร (ถามครั้งเดียว), เช็กร่างกายรายสัปดาห์, คัดกรองซึมเศร้า, อารมณ์รายวัน, การชวนเช็กที่กด "ไว้ทีหลัง"
const GUEST_PREFIXES = ["hikariHistory_", "hikariJourney_", "hikariGame_", "hikariLog_", "hikariOrders_",
    "hikariBurnout_", "hikariReset_", "hikariCauses_",
    "hikariProfile_", "hikariCheck_", "hikariDep_", "hikariMoods_", "hikariNudge_"];

function moveGuestData(username) {
    try {
        const moves = [];
        GUEST_PREFIXES.forEach(function (prefix) {
            moves.push([prefix + "guest", prefix + username]);
        });
        // ฝึกหายใจเก็บเป็นรายวัน เช่น hikariBreathe_guest_Sat Oct 24 2026
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.indexOf("hikariBreathe_guest_") === 0) {
                moves.push([key, "hikariBreathe_" + username + "_" + key.slice("hikariBreathe_guest_".length)]);
            }
        }
        moves.forEach(function (pair) {
            const guestValue = localStorage.getItem(pair[0]);
            if (guestValue !== null && localStorage.getItem(pair[1]) === null) {
                localStorage.setItem(pair[1], guestValue);
                localStorage.removeItem(pair[0]);
            }
        });
    } catch (e) {
        // ใช้ localStorage ไม่ได้: ย้ายข้อมูลในที่เก็บสำรอง (หน่วยความจำ) แทน
        GUEST_PREFIXES.forEach(function (prefix) {
            const from = prefix + "guest";
            const to = prefix + username;
            if (memoryStore.hasOwnProperty(from) && !memoryStore.hasOwnProperty(to)) {
                memoryStore[to] = memoryStore[from];
                delete memoryStore[from];
            }
        });
    }
}

// เข้าสู่ระบบ: นับครั้ง + จำเวลาล่าสุด + บันทึก log (ชื่อผู้ใช้ เวลา สถานะ)
function loginAs(username, logType) {
    const users = loadData("hikariUsers", {});
    users[username].loginCount = (users[username].loginCount || 0) + 1;
    users[username].lastLogin = new Date().toISOString();
    saveData("hikariUsers", users);

    moveGuestData(username);              // ของที่ทำไว้ก่อนเข้าสู่ระบบไม่หาย
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
    renderJourney();                    // ภารกิจ 30 วันแยกตามผู้ใช้
    renderVideos();
    renderLog();
    showBreatheCount();
    refreshPlanButtons();
    showResetCount();                   // พักสั้น / เช็กภาวะหมดไฟ / ต้นเหตุ แยกตามผู้ใช้
    refreshBurnout();
    renderCauses();
    resetCheckFlow();                   // v18: ข้อมูลเช็กร่างกาย / คัดกรองซึมเศร้า แยกตามผู้ใช้
    resetDepFlow();
    renderOverview();
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
    if (entry.type === "daily") {
        return fill(t("dayLabel"), { d: entry.data.day, total: JOURNEY.length }) + " · " + entry.data.title;
    }
    if (entry.type === "order") {
        return "#" + entry.data.id + " · " + t("shopNames")[entry.data.item] + " · ฿" + entry.data.amount;
    }
    if (entry.type === "reward") {
        return t("rewardNames")[entry.data.item];
    }
    if (entry.type === "research") {
        return entry.data.cite;
    }
    if (entry.type === "video") {
        return entry.data.title;        // ชื่อวิดีโอที่ดู
    }
    if (entry.type === "burnout") {
        return burnoutDetail(entry.data);
    }
    if (entry.type === "reset") {
        const r = entry.data && t("resets")[entry.data.id];
        return r ? r.t : "-";
    }
    if (entry.type === "skill") {
        const k = entry.data && t("skills")[entry.data.id];
        return k ? k.t : "-";
    }
    if (entry.type === "note") {
        return noteDetail(entry.data);
    }
    if (entry.type === "bodycheck") {
        const n = entry.data ? Number(entry.data.n) : NaN;
        return Number.isInteger(n) && n >= 0 && n <= 9 ? fill(t("detailCheck"), { n: n }) : "-";
    }
    if (entry.type === "depscreen") {
        return depDetail(entry.data);
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
    assessment: ["assessment", "burnout", "bodycheck", "depscreen"],
    breathing: ["breathing", "reset"],
    mood: ["mood"],
    daily: ["daily", "reward", "research", "order", "skill"],
    video: ["video"],
    note: ["note"],
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

// คะแนนต้องเป็นตัวเลขเต็ม 0–15 เท่านั้น ถ้าไม่ใช่ คืนค่า null
function validScore(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > 15) {
        return null;
    }
    return Math.round(n);
}

// วันที่เป็นข้อความ (ถ้าวันที่ผิดรูปแบบ คืน "-") ข้อความนี้มาจาก toLocaleDateString จึงไม่มีแท็ก HTML
function safeDate(value, options) {
    const d = new Date(value);
    if (isNaN(d.getTime())) {
        return "-";
    }
    return d.toLocaleDateString(t("locale"), options);
}

// กราฟเส้นคะแนนความเครียด 10 ครั้งล่าสุด (วาดด้วย SVG)
function renderScoreChart(log) {
    const svg = document.getElementById("scoreChart");
    const summary = document.getElementById("scoreSummary");
    // ใช้เฉพาะรายการที่คะแนนเป็นตัวเลข 0–15 จริง (กันข้อมูลใน localStorage ที่ถูกแก้มาแทรก HTML)
    const scores = log.filter(function (e) {
        return e && e.type === "assessment" && e.data && validScore(e.data.score) !== null;
    }).slice(-10);

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
        const score = validScore(scores[i].data.score);
        points.push({ x: x, y: y(score), score: score, e: scores[i] });
    }
    html += '<polyline fill="none" stroke="#3e6ee0" stroke-width="3" points="' +
        points.map(function (p) { return p.x + "," + p.y; }).join(" ") + '"/>';
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const day = safeDate(p.e.time, { day: "numeric", month: "numeric" });
        html += '<circle cx="' + p.x + '" cy="' + p.y + '" r="5" fill="#3e6ee0"/>';
        html += '<text x="' + p.x + '" y="' + (p.y - 9) + '" class="value" text-anchor="middle">' + p.score + "</text>";
        // แสดงวันที่ใต้กราฟ (ถ้าจุดเยอะ แสดงเฉพาะจุดเว้นจุด)
        if (points.length <= 6 || i % 2 === 0 || i === points.length - 1) {
            html += '<text x="' + p.x + '" y="' + (bottom + 18) + '" class="axis" text-anchor="middle">' + day + "</text>";
        }
    }
    svg.innerHTML = html;

    // สรุปการเปลี่ยนแปลง: ครั้งแรกเทียบครั้งล่าสุด
    const first = validScore(scores[0].data.score);
    const last = validScore(scores[scores.length - 1].data.score);
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
            // อารมณ์ต้องเป็นค่าที่รู้จักเท่านั้น (กันข้อมูลที่ถูกแก้)
            if (log[i] && log[i].type === "mood" && log[i].data && MOOD_VALUE.hasOwnProperty(log[i].data.mood) &&
                new Date(log[i].time).toDateString() === dayText) {
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
let advanceTimer = null; // ตัวนับเวลาไปข้อถัดไปอัตโนมัติ
const AUTO_ADVANCE_MS = 300;

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
        button.addEventListener("click", function (event) {
            answers[current] = i;              // คะแนน = ลำดับของคำตอบ (0–3)
            const fromKeyboard = event.detail === 0;   // กด Enter/Space (ไม่ใช่เมาส์/นิ้ว)
            showQuestion();
            if (fromKeyboard) {
                optionsBox.children[i].focus();
            }
            autoAdvance(current, fromKeyboard);
        });
        optionsBox.appendChild(button);
    }

    backButton.disabled = (current === 0);
    nextButton.textContent = (current === total - 1) ? t("seeResult") : t("next");
}

// ตอบแล้วไปข้อถัดไปเองหลัง 300 มิลลิวินาที (ข้อสุดท้ายรอให้กด "ดูผล" เอง)
// ถ้าระหว่างรอผู้ใช้กดย้อนกลับ/ถัดไปเอง (ข้อเปลี่ยนแล้ว) จะไม่ข้ามซ้ำ
function autoAdvance(index, fromKeyboard) {
    clearTimeout(advanceTimer);
    advanceTimer = setTimeout(function () {
        if (current !== index || answers[index] === undefined || result.classList.contains("hidden") === false) {
            return;
        }
        if (current < questionFactors.length - 1) {
            current = current + 1;
            showQuestion();
            if (fromKeyboard) {
                optionsBox.children[0].focus();      // ผู้ใช้คีย์บอร์ดทำข้อต่อไปได้ทันที
            }
        } else if (fromKeyboard) {
            nextButton.focus();                      // ข้อสุดท้าย: ไปที่ปุ่ม "ดูผล"
        }
    }, AUTO_ADVANCE_MS);
}

backButton.addEventListener("click", function () {
    clearTimeout(advanceTimer);
    if (current > 0) {
        current = current - 1;
        showQuestion();
    }
});

nextButton.addEventListener("click", function () {
    clearTimeout(advanceTimer);
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
    markTask("checkin");                // ทำแบบประเมินก็นับเป็นภารกิจข้อ 1
    renderOverview();
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
    clearTimeout(advanceTimer);
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

// ผลย้อนหลังสร้างด้วย createElement + textContent และแปลงคะแนนเป็นตัวเลข
// ข้อมูลใน localStorage ถูกแก้ได้ จึงไม่นำค่าที่เก็บไว้ไปต่อเป็น HTML โดยตรง
function historyItem(box, text) {
    const item = document.createElement("span");
    item.className = "history-item";
    item.textContent = text;
    box.appendChild(item);
    return item;
}

function showHistory() {
    const saved = loadData(historyKey(), []);
    const history = (Array.isArray(saved) ? saved : []).filter(function (h) {
        return h && validScore(h.score) !== null;
    });
    const box = document.getElementById("historyBox");
    box.textContent = "";
    if (history.length < 2) {
        historyItem(box, t("historyFirst"));
        return;
    }
    for (let i = 0; i < history.length; i++) {
        const item = historyItem(box, safeDate(history[i].time, { day: "numeric", month: "short" }) + " · ");
        const score = document.createElement("b");
        score.textContent = validScore(history[i].score);
        item.appendChild(score);
        item.appendChild(document.createTextNode("/15"));
    }
    const diff = validScore(history[history.length - 1].score) - validScore(history[history.length - 2].score);
    if (diff < 0) {
        historyItem(box, fill(t("historyDown"), { n: -diff }));
    } else if (diff > 0) {
        historyItem(box, fill(t("historyUp"), { n: diff }));
    } else {
        historyItem(box, t("historySame"));
    }
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
    setTextWithPhones(moodMessage, text);
    setTextWithPhones(checkinMessage, text);
}

for (let i = 0; i < moodButtons.length; i++) {
    moodButtons[i].addEventListener("click", function () {
        selectedMood = moodButtons[i].dataset.mood;
        // ไฮไลต์ปุ่มอารมณ์เดียวกันทั้ง 2 ที่
        for (let j = 0; j < moodButtons.length; j++) {
            moodButtons[j].classList.toggle("selected", moodButtons[j].dataset.mood === selectedMood);
        }
        addLog("mood", { mood: selectedMood });
        saveMoodDay(selectedMood);      // v18: อารมณ์รายวัน (ใช้ชวนทำ 2Q เมื่อเครียดหลายวัน) เก็บได้ทั้ง guest และสมาชิก
        refreshMood();
        markTask("checkin");            // ภารกิจข้อ 1 (ส่วนที่ 13)
        // เช็กอินในภารกิจวันนี้ว่า "เครียด" หรือ "เครียดมาก": แสดงข้อความดูแลใจ + ปุ่มโทร 1323 + หายใจ 1 นาที
        if (moodButtons[i].closest(".today-moods")) {
            showTodayCare(selectedMood === "stressed" || selectedMood === "very");
        }
    });
}

function showTodayCare(show) {
    document.getElementById("todayCare").classList.toggle("hidden", !show);
}

// ปุ่ม "หายใจ 1 นาที": เลื่อนไปที่ตัวจับเวลา ตั้ง 1 นาที แล้วเริ่มทันที
document.getElementById("todayCareBreathe").addEventListener("click", function () {
    document.querySelector('#timeButtons [data-minutes="1"]').click();   // หยุดรอบเดิม (ถ้ามี) และตั้ง 1 นาที
    if (timer === null) {
        breatheButton.click();
    }
    document.getElementById("breathe").scrollIntoView({ block: "start" });
    breatheButton.focus({ preventScroll: true });
});


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
        markTask("breathe");            // ภารกิจข้อ 3
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
        renderJourney();                // ราคาในร้านเปลี่ยนตามแผนใหม่
    });
}


// ===== 11. วิดีโอคลายเครียด =====
// เราไม่ได้เก็บไฟล์วิดีโอเอง แต่ "ฝัง" (embed) วิดีโอจาก YouTube ที่เจ้าของเปิดให้ฝังได้
// คลิปทั้ง 60 อยู่ใน JOURNEY (content.js) เรียงตามวันของภารกิจ 60 วัน
// กฎของ YouTube ที่ต้องทำตาม (YouTube API Services Developer Policies)
// - ห้ามเก็บเงินเพื่อดูวิดีโอ YouTube และห้ามให้ต้องทำอย่างอื่นนอกจากกดเล่น
// - ห้ามบล็อกหรือแก้ไขโฆษณาของ YouTube
// จึงให้ทุกคน (Free / Premium / Care+) กดแล้วเล่นทันที ไม่มีโฆษณาของเราคั่น

const videoModal = document.getElementById("videoModal");
const videoPlayer = document.getElementById("videoPlayer");
let playingVideo = null;

// วาดคลังวิดีโอ: แสดงเฉพาะคลิปที่ปลดล็อกแล้ว (วันนี้อยู่ก่อน) รูปตัวอย่างดึงจาก YouTube
function renderVideos() {
    const grid = document.getElementById("videoGrid");
    const info = journeyInfo();
    grid.innerHTML = "";
    for (let day = info.unlocked; day >= 1; day--) {
        const v = JOURNEY[day - 1];
        const card = document.createElement("button");
        card.type = "button";
        card.className = "card video-card";
        card.innerHTML = '<div class="video-thumb"><img loading="lazy" alt=""><span class="video-lang"></span>' +
            '<span class="video-day"></span><span class="video-play" aria-hidden="true">▶</span></div>' +
            '<div class="video-info"><h3></h3><p></p></div>';
        card.querySelector("img").src = thumbUrl(v.id);
        card.querySelector(".video-lang").textContent = v.lang;
        card.querySelector(".video-day").textContent = fill(t("dayShort"), { d: day });
        card.querySelector("h3").textContent = v.title;
        card.querySelector("p").textContent = t("catNames")[v.cat] + " · " + v.source;
        card.setAttribute("aria-label", t("videoPlay") + ": " + v.title);
        card.addEventListener("click", function () { openVideo(v); });
        grid.appendChild(card);
    }
    document.getElementById("videoUnlocked").textContent =
        fill(t("unlockedInfo"), { n: info.unlocked, total: JOURNEY.length });
}

function thumbUrl(id) {
    return "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
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
    if (v.id === JOURNEY[journeyInfo().day - 1].id) {
        markTask("learn");              // ฟังคลิปของวันนี้ = ภารกิจข้อ 2
    }
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


// ===== 13. ภารกิจ 60 วัน: คลิปวันละ 1 คลิป (ไม่ซ้ำ 60 วัน) + ภารกิจ 3 ข้อ + กล่องรางวัล =====
// ข้อมูลคลิป งานวิจัย และของรางวัลอยู่ใน content.js (JOURNEY, RESEARCH, REWARDS, SHOP_ITEMS)
// ภารกิจ 3 ข้อต่อวัน: checkin = เช็กอินอารมณ์หรือทำแบบประเมิน, learn = ฟังคลิปวันนี้หรืออ่านงานวิจัย, breathe = ฝึกหายใจครบ 1 รอบ
// ทำครบ 3 ข้อ = วันนั้นสำเร็จ: ได้แสง +1 และนับวันต่อเนื่อง · สำเร็จครบทุก 7 วัน = เลือกของรางวัลได้ 1 ชิ้น
const TASKS = ["checkin", "learn", "breathe"];
const STREAK_BADGES = [7, 14, 21, 30, 45, 60];
const REWARD_EVERY = 7;
const DISCOUNTS = { premium: 0.10, careplus: 0.20 };   // ส่วนลดสมาชิกในร้านค้า

// วันที่แบบ "2026-10-18" ตามเวลาในเครื่องผู้ใช้
function dateKey(date) {
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + m + "-" + d;
}

// จำนวนวันระหว่างวันที่ 2 วัน (ใช้เที่ยงวันกันปัญหาเวลาออมแสง)
function daysBetween(fromKey, toKey) {
    const a = new Date(fromKey + "T12:00:00");
    const b = new Date(toKey + "T12:00:00");
    return Math.round((b - a) / 86400000);
}

function addDays(key, n) {
    const d = new Date(key + "T12:00:00");
    d.setDate(d.getDate() + n);
    return dateKey(d);
}

// ข้อมูลภารกิจแยกตามผู้ใช้ (ยังไม่เข้าสู่ระบบ = guest)
function journeyKey() {
    return "hikariJourney_" + (currentUser || "guest");
}

function loadJourney() {
    let data = loadData(journeyKey(), null);
    if (!data || !data.start) {
        data = { start: dateKey(new Date()), done: [] };     // เปิดครั้งแรก = วันที่ 1
    }
    // ค่าเริ่มต้นของข้อมูลที่เพิ่มในรุ่นนี้ (ข้อมูลรุ่นเก่ายังใช้ต่อได้)
    data.done = data.done || [];
    data.tasks = data.tasks || {};
    data.light = data.light || 0;
    data.claimed = data.claimed || 0;
    data.inventory = data.inventory || [];
    if (!data.self || typeof data.self !== "object" || Array.isArray(data.self)) {
        data.self = {};                  // ทักษะที่เลือกทำเองรายวัน (ส่วนที่ 18) เช่น { "2026-10-24": [{ id: "prio", done: false }] }
    }
    saveData(journeyKey(), data);
    return data;
}

// วันนี้คือวันที่เท่าไรของรอบ (1–60) รอบที่เท่าไร และปลดล็อกแล้วกี่คลิป
function journeyInfo() {
    const data = loadJourney();
    const today = dateKey(new Date());
    const passed = Math.max(0, daysBetween(data.start, today));
    const round = Math.floor(passed / JOURNEY.length) + 1;
    const day = (passed % JOURNEY.length) + 1;
    return {
        data: data, today: today, day: day, round: round,
        roundStart: addDays(data.start, (round - 1) * JOURNEY.length),
        unlocked: round > 1 ? JOURNEY.length : day,
        tasks: data.tasks[today] || {},
        doneToday: data.done.indexOf(today) !== -1
    };
}

// งานวิจัยของวันนี้ วนทีละชิ้น (30 ชิ้น) ไม่ซ้ำภายใน 30 วัน
function researchOfDay(day) {
    return RESEARCH[(day - 1) % RESEARCH.length];
}

// สรุปงานวิจัยมีภาษาไทยและอังกฤษ ภาษาอื่นแสดงภาษาอังกฤษ
function researchText(item) {
    return lang === "th" ? item.th : item.en;
}

// วันต่อเนื่อง: นับย้อนจากวันนี้ (หรือเมื่อวาน ถ้าวันนี้ยังไม่ครบ) ทีละวัน
function streakCount(done, today) {
    let key = done.indexOf(today) !== -1 ? today : addDays(today, -1);
    let n = 0;
    while (done.indexOf(key) !== -1) {
        n++;
        key = addDays(key, -1);
    }
    return n;
}

// จดว่าทำภารกิจข้อหนึ่งแล้ว ถ้าครบ 3 ข้อ = วันนี้สำเร็จ
function markTask(task) {
    const info = journeyInfo();
    const data = info.data;
    const tasks = data.tasks[info.today] || {};
    if (tasks[task]) {
        return;                                  // ข้อนี้ทำไปแล้ววันนี้
    }
    tasks[task] = true;
    data.tasks[info.today] = tasks;
    let message = "";
    const allDone = TASKS.every(function (k) { return tasks[k]; });
    if (allDone && !info.doneToday) {
        data.done.push(info.today);
        data.light += 1;
        const streak = streakCount(data.done, info.today);
        if (STREAK_BADGES.indexOf(streak) !== -1) {
            message = fill(t("badge"), { n: streak });
        } else {
            message = t("doneThanks");
        }
        if (data.done.length % REWARD_EVERY === 0) {
            message += " " + t("rewardReady");
        }
        saveData(journeyKey(), data);
        addLog("daily", { day: info.day, title: JOURNEY[info.day - 1].title });
    } else {
        saveData(journeyKey(), data);
        message = fill(t("taskSaved"), { n: TASKS.filter(function (k) { return tasks[k]; }).length });
    }
    renderJourney();
    document.getElementById("todayMsg").textContent = message;
}

function renderJourney() {
    const info = journeyInfo();
    const v = JOURNEY[info.day - 1];
    const streak = streakCount(info.data.done, info.today);
    document.getElementById("todayMsg").textContent = "";

    let label = fill(t("dayLabel"), { d: info.day, total: JOURNEY.length });
    if (info.round > 1) {
        label += " · " + fill(t("roundLabel"), { r: info.round });
    }
    document.getElementById("todayDay").textContent = label;
    document.getElementById("todayCat").textContent = t("catNames")[v.cat] + " · " + v.lang;
    document.getElementById("todayStreak").textContent = streak > 0 ? fill(t("streak"), { n: streak }) : t("streak0");
    document.getElementById("todayLight").textContent = fill(t("lightLabel"), { n: info.data.light });
    document.getElementById("todayTitle").textContent = v.title;
    document.getElementById("todaySource").textContent = v.source;
    setTextWithPhones(document.getElementById("todayMission"), t("missions")[info.day - 1]);
    document.getElementById("todayImg").src = thumbUrl(v.id);
    document.getElementById("todayThumb").setAttribute("aria-label", t("videoPlay") + ": " + v.title);
    document.getElementById("todayGuest").classList.toggle("hidden", Boolean(currentUser));

    // ภารกิจ 3 ข้อ: ติ๊กถูกเมื่อทำแล้ว
    let count = 0;
    TASKS.forEach(function (k) {
        const box = document.getElementById("task" + k.charAt(0).toUpperCase() + k.slice(1));
        const isDone = Boolean(info.tasks[k]);
        box.classList.toggle("done", isDone);
        if (isDone) {
            count++;
        }
    });
    document.getElementById("taskCount").textContent = fill(t("taskCount"), { n: count, total: TASKS.length });

    renderResearch(info);
    renderDots(info);
    renderRewards(info);
    renderTodayTip(info);               // เคล็ดลับวันนี้ + ที่ฉันเลือกทำวันนี้ (ส่วนที่ 18)
    renderSelfTasks(info);
}

// งานวิจัยวันนี้ (แผงที่เปิดจากปุ่ม "อ่านงานวิจัย")
function renderResearch(info) {
    const item = researchOfDay(info.day);
    const text = researchText(item);
    document.getElementById("resTitle").textContent = text.t;
    document.getElementById("resFinding").textContent = text.f;
    document.getElementById("resTip").textContent = text.tip;
    const link = document.getElementById("resLink");
    link.textContent = item.cite + " ↗";
    link.href = item.url;
    const button = document.getElementById("resDone");
    const learned = Boolean(info.tasks.learn);
    button.disabled = learned;
    button.textContent = learned ? t("resDoneAlready") : t("resDoneBtn");
}

// จุด 60 วัน: เขียว = สำเร็จ, กรอบน้ำเงิน = วันนี้, จาง = ยังล็อก
function renderDots(info) {
    const dots = document.getElementById("todayDots");
    dots.innerHTML = "";
    let doneInRound = 0;
    for (let d = 1; d <= JOURNEY.length; d++) {
        const key = addDays(info.roundStart, d - 1);
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "today-dot";
        dot.textContent = d;
        if (info.data.done.indexOf(key) !== -1) {
            dot.classList.add("done");
            doneInRound++;
        }
        if (d === info.day) {
            dot.classList.add("today");
        }
        const name = fill(t("dayLabel"), { d: d, total: JOURNEY.length });
        if (d > info.day) {
            dot.classList.add("locked");
            dot.setAttribute("aria-label", name + " · " + t("lockedMsg"));
            dot.addEventListener("click", function () {
                document.getElementById("todayMsg").textContent = t("lockedMsg");
            });
        } else {
            dot.setAttribute("aria-label", name + " · " + JOURNEY[d - 1].title);
            dot.addEventListener("click", function () { openVideo(JOURNEY[d - 1]); });
        }
        dots.appendChild(dot);
    }
    document.getElementById("todayProgressLabel").textContent =
        fill(t("progressLabel"), { n: doneInRound, total: JOURNEY.length });
}

// ราคาตามแผนสมาชิก: ราคาเต็ม / Premium −10% / Care+ −20% (ปัดเป็นบาทเต็ม)
function priceFor(price, plan) {
    const off = DISCOUNTS[plan] || 0;
    return Math.round(price * (1 - off));
}

// กล่องรางวัล: ครบทุก 7 วันที่สำเร็จ เลือกของรางวัลได้ 1 ชิ้น
function renderRewards(info) {
    const data = info.data;
    const earned = Math.floor(data.done.length / REWARD_EVERY);
    const available = earned - data.claimed;
    const progress = data.done.length % REWARD_EVERY;
    document.getElementById("rewardProgress").textContent =
        fill(t("rewardProgress"), { n: available > 0 ? REWARD_EVERY : progress, total: REWARD_EVERY });
    document.getElementById("rewardBar").style.width = ((available > 0 ? REWARD_EVERY : progress) / REWARD_EVERY * 100) + "%";
    renderOrders();
    document.getElementById("rewardHint").textContent = available > 0 ? t("rewardPick") : fill(t("rewardLeft"), { n: REWARD_EVERY - progress });

    // ตัวเลือกของรางวัล (แสดงเมื่อมีสิทธิ์เลือก) ของที่มีแล้วเลือกซ้ำไม่ได้
    const picker = document.getElementById("rewardPicker");
    picker.innerHTML = "";
    picker.classList.toggle("hidden", available <= 0);
    REWARDS.forEach(function (r) {
        const owned = data.inventory.indexOf(r.id) !== -1;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "reward-item";
        button.disabled = owned || available <= 0;
        button.innerHTML = '<span class="reward-icon" aria-hidden="true"></span><span class="reward-name"></span><span class="reward-price"></span>';
        button.querySelector(".reward-icon").textContent = r.icon;
        button.querySelector(".reward-name").textContent = t("rewardNames")[r.id];
        button.querySelector(".reward-price").textContent = owned ? t("rewardOwned") : fill(t("rewardFree"), { p: r.price });
        button.addEventListener("click", function () { claimReward(r.id); });
        picker.appendChild(button);
    });

    // ของที่ได้แล้ว
    const inventory = document.getElementById("rewardInventory");
    inventory.innerHTML = "";
    if (data.inventory.length === 0) {
        inventory.textContent = t("rewardNone");
    }
    data.inventory.forEach(function (id) {
        const r = REWARDS.find(function (x) { return x.id === id; });
        const chip = document.createElement("span");
        chip.className = "reward-chip";
        chip.textContent = r.icon + " " + t("rewardNames")[id];
        inventory.appendChild(chip);
    });

    // ของราคาสูงยังต้องซื้อ: แสดงราคา 3 ระดับ และไฮไลต์ราคาของแผนปัจจุบัน
    const plan = currentUser ? currentPlan() : "free";
    const shop = document.getElementById("shopPreview");
    shop.innerHTML = "";
    SHOP_ITEMS.forEach(function (item) {
        const row = document.createElement("div");
        row.className = "shop-row";
        row.innerHTML = '<span class="shop-name"></span><span class="shop-prices"></span>';
        row.querySelector(".shop-name").textContent = item.icon + " " + t("shopNames")[item.id];
        const prices = row.querySelector(".shop-prices");
        [["free", "priceFull"], ["premium", "pricePremium"], ["careplus", "priceCare"]].forEach(function (pair) {
            const tag = document.createElement("span");
            tag.className = "price-tag" + (pair[0] === plan ? " mine" : "");
            tag.textContent = fill(t(pair[1]), { p: priceFor(item.price, pair[0]) });
            prices.appendChild(tag);
        });
        // มี PromptPay แล้ว = ปุ่มซื้อ, ยังไม่มี = "เร็ว ๆ นี้"
        if (PROMPTPAY_ID === "") {
            const soon = document.createElement("span");
            soon.className = "shop-soon";
            soon.textContent = t("shopSoon");
            row.appendChild(soon);
        } else {
            const buy = document.createElement("button");
            buy.type = "button";
            buy.className = "shop-buy";
            buy.textContent = fill(t("buyBtn"), { p: priceFor(item.price, plan) });
            buy.addEventListener("click", function () { openPayment(item); });
            row.appendChild(buy);
        }
        shop.appendChild(row);
    });
}

function claimReward(id) {
    const info = journeyInfo();
    const data = info.data;
    const available = Math.floor(data.done.length / REWARD_EVERY) - data.claimed;
    if (available <= 0 || data.inventory.indexOf(id) !== -1) {
        return;
    }
    data.inventory.push(id);
    data.claimed += 1;
    saveData(journeyKey(), data);
    addLog("reward", { item: id });
    renderJourney();
    document.getElementById("todayMsg").textContent = fill(t("rewardGot"), { item: t("rewardNames")[id] });
}

// ปุ่มต่าง ๆ ของภารกิจ
document.getElementById("todayThumb").addEventListener("click", function () {
    openVideo(JOURNEY[journeyInfo().day - 1]);
});
document.getElementById("taskPlay").addEventListener("click", function () {
    openVideo(JOURNEY[journeyInfo().day - 1]);
});
document.getElementById("taskRead").addEventListener("click", function () {
    const panel = document.getElementById("researchPanel");
    panel.classList.remove("hidden");
    panel.scrollIntoView({ block: "nearest" });
});
document.getElementById("resDone").addEventListener("click", function () {
    addLog("research", { cite: researchOfDay(journeyInfo().day).cite });
    markTask("learn");
});


// ===== 14. ร้านค้า: ชำระเงินด้วย PromptPay =====
// สร้าง QR ตามมาตรฐาน Thai QR Payment (EMVCo) ในเบราว์เซอร์ ไม่ต้องใช้เซิร์ฟเวอร์ และไม่ส่งข้อมูลออก
// ข้อจำกัด: เว็บนี้ "ตรวจไม่ได้" ว่าเงินเข้าจริงไหม จึงให้ผู้ใช้ส่งสลิป แล้วทีมงานตรวจและเพิ่มของให้เอง
// เมื่อมีระบบหลังบ้าน ให้เปลี่ยนไปใช้ payment gateway ที่แจ้งผลอัตโนมัติ (ดู README ข้อ 15)
const PAY_MINUTES = 15;                 // QR ใช้ได้กี่นาที

function ordersKey() {
    return "hikariOrders_" + currentUser;
}

const payModal = document.getElementById("payModal");
let payTimer = null;
let payOrder = null;

function openPayment(item) {
    if (!currentUser) {
        openAuth("login");                          // ต้องมีบัญชี เพื่อให้ทีมงานเพิ่มของให้ถูกคน
        return;
    }
    const plan = currentPlan();
    const amount = priceFor(item.price, plan);
    payOrder = {
        id: newOrderId(),
        item: item.id, amount: amount, plan: plan,
        time: new Date().toISOString(), status: "pending", confirmed: false
    };
    document.getElementById("payTitle").textContent = item.icon + " " + t("shopNames")[item.id];
    document.getElementById("payAmount").textContent = "฿" + amount.toFixed(2);
    document.getElementById("payPlan").textContent = plan === "free" ? "" : "(" + PLAN_NAMES[plan] + " −" + Math.round((DISCOUNTS[plan] || 0) * 100) + "%)";
    document.getElementById("payQr").innerHTML = qrSvg(promptpayPayload(PROMPTPAY_ID, amount));
    document.getElementById("payName").textContent = PROMPTPAY_NAME;
    document.getElementById("payOrder").textContent = orderLine(payOrder);   // ลูกค้าส่งข้อความนี้พร้อมสลิป
    document.getElementById("payMsg").textContent = "";
    const slip = document.getElementById("paySlip");
    slip.classList.toggle("hidden", SLIP_URL === "");
    slip.href = SLIP_URL;
    document.getElementById("payDone").disabled = false;
    payModal.classList.remove("hidden");
    startPayTimer();
    document.getElementById("payClose").focus();
}

// นับถอยหลัง หมดเวลาแล้วซ่อน QR ให้สร้างใหม่ (กันโอนผิดยอดหลังราคาเปลี่ยน)
function startPayTimer() {
    clearInterval(payTimer);
    let left = PAY_MINUTES * 60;
    const box = document.getElementById("payTimer");
    const show = function () {
        box.textContent = fill(t("payLeft"), { t: formatClock(left) });
    };
    show();
    payTimer = setInterval(function () {
        left--;
        if (left <= 0) {
            clearInterval(payTimer);
            document.getElementById("payQr").innerHTML = "";
            box.textContent = t("payExpired");
            document.getElementById("payDone").disabled = true;
            return;
        }
        show();
    }, 1000);
}

function closePayment() {
    clearInterval(payTimer);
    payModal.classList.add("hidden");
}

// "ฉันโอนแล้ว": บันทึกคำสั่งซื้อเป็น "รอตรวจสอบ" (ทีมงานยืนยันจากสลิป)
document.getElementById("payDone").addEventListener("click", function () {
    const orders = loadData(ordersKey(), []);
    if (!orders.some(function (o) { return o.id === payOrder.id; })) {
        orders.unshift(payOrder);
        saveData(ordersKey(), orders);
        addLog("order", { id: payOrder.id, item: payOrder.item, amount: payOrder.amount });
    }
    document.getElementById("payMsg").textContent = fill(t("payThanks"), { id: payOrder.id });
    document.getElementById("payDone").disabled = true;
    renderOrders();
});
document.getElementById("payClose").addEventListener("click", closePayment);
payModal.addEventListener("click", function (event) {
    if (event.target === payModal) {
        closePayment();
    }
});
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !payModal.classList.contains("hidden")) {
        closePayment();
    }
});

// รายการคำสั่งซื้อของผู้ใช้ (สถานะ: รอตรวจสอบ / ได้รับของแล้ว)
function renderOrders() {
    const list = document.getElementById("orderList");
    const orders = currentUser ? loadData(ordersKey(), []) : [];
    list.innerHTML = "";
    document.getElementById("orderTitle").classList.toggle("hidden", orders.length === 0);
    orders.slice(0, 5).forEach(function (o) {
        const item = SHOP_ITEMS.find(function (x) { return x.id === o.item; });
        const row = document.createElement("div");
        row.className = "order-row";
        row.innerHTML = '<span></span><span class="order-status"></span>';
        // คำสั่งซื้อจากเกม (game.html) ไม่มีใน SHOP_ITEMS ให้แสดงรหัสสินค้าแทน
        const label = item ? item.icon + " " + t("shopNames")[o.item] : "🎮 " + o.item;
        row.firstChild.textContent = "#" + o.id + " · " + label + " · ฿" + o.amount;
        row.lastChild.textContent = o.status === "paid" ? t("orderPaid") : t("orderPending");
        row.lastChild.classList.toggle("paid", o.status === "paid");
        list.appendChild(row);
    });
}


// ===== 15. ความเป็นส่วนตัว + ลิงก์ติดต่อ + ป้ายเตือนเมื่อเปิดจากในแอป =====

// ลิงก์ติดต่อ (CONTACT_URL ใน config.js) รับเฉพาะ https:, mailto: หรือ tel: ถ้าว่าง/ไม่ถูกต้อง = ซ่อน
function setupContact() {
    const url = (typeof CONTACT_URL === "string") ? CONTACT_URL.trim() : "";
    if (!/^(https:\/\/|mailto:|tel:)/i.test(url)) {
        return;
    }
    ["footerContact", "privacyContactLink"].forEach(function (id) {
        document.getElementById(id).href = url;
    });
    document.getElementById("footerContact").classList.remove("hidden");
    document.getElementById("privacyContact").classList.remove("hidden");
    // อีเมลติดต่อ (CONTACT_EMAIL ใน config.js) แสดงเป็นข้อความ + ลิงก์ mailto
    const mail = (typeof CONTACT_EMAIL === "string") ? CONTACT_EMAIL.trim() : "";
    if (/^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(mail)) {
        ["footerEmail", "privacyEmail"].forEach(function (id) {
            const a = document.getElementById(id);
            a.href = "mailto:" + mail;
            a.textContent = mail;
        });
        document.getElementById("footerEmail").classList.remove("hidden");
        document.getElementById("privacyEmailWrap").classList.remove("hidden");
    }
}

// ลบข้อมูลทั้งหมดบนเครื่องนี้: ยืนยันในหน้าเว็บ (ไม่ใช้ window.confirm) แล้วลบทุกค่าที่ขึ้นต้นด้วย "hikari"
const deleteConfirm = document.getElementById("deleteConfirm");
document.getElementById("deleteAll").addEventListener("click", function () {
    deleteConfirm.classList.remove("hidden");
    document.getElementById("deleteNo").focus();
});
document.getElementById("deleteNo").addEventListener("click", function () {
    deleteConfirm.classList.add("hidden");
    document.getElementById("deleteAll").focus();
});
document.getElementById("deleteYes").addEventListener("click", function () {
    deleteAllData();
    location.reload();
});

function deleteAllData() {
    try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.indexOf("hikari") === 0) {
                keys.push(key);         // เก็บรายชื่อก่อน เพราะลบระหว่างวนจะทำให้ลำดับเลื่อน
            }
        }
        keys.forEach(function (key) { localStorage.removeItem(key); });
    } catch (e) {
        // ใช้ localStorage ไม่ได้ ก็ไม่มีอะไรให้ลบในเบราว์เซอร์
    }
    // ที่เก็บสำรองในหน่วยความจำก็ลบด้วย
    Object.keys(memoryStore).forEach(function (key) {
        if (key.indexOf("hikari") === 0) {
            delete memoryStore[key];
        }
    });
}

// เปิดจากในแอป LINE / Facebook / Instagram: เบราว์เซอร์ในแอปเก็บข้อมูลแยกจาก Safari/Chrome
function inAppName() {
    const ua = navigator.userAgent || "";
    if (/\bLine\//i.test(ua)) { return "LINE"; }
    if (/FBAN|FBAV|FB_IAB/i.test(ua)) { return "Facebook"; }
    if (/Instagram/i.test(ua)) { return "Instagram"; }
    return "";
}

function setupInAppNotice() {
    const app = inAppName();
    if (app === "" || loadData("hikariInAppClosed", false)) {
        return;
    }
    document.getElementById("inAppName").textContent = app + ":";
    document.getElementById("inAppNotice").classList.remove("hidden");
}

// LINE เปิดลิงก์ที่มี ?openExternalBrowser=1 ใน Safari/Chrome ให้เอง
document.getElementById("inAppOpen").addEventListener("click", function () {
    const url = new URL(location.href);
    url.searchParams.set("openExternalBrowser", "1");
    location.href = url.toString();
});
document.getElementById("inAppClose").addEventListener("click", function () {
    saveData("hikariInAppClosed", true);
    document.getElementById("inAppNotice").classList.add("hidden");
});


// ===== 16. พักสั้น 1–3 นาที: 6 การ์ด มีตัวจับเวลาในตัว =====
// การ์ดทั้งหมดอยู่ใน RESETS (content.js) ข้อความทุกภาษาอยู่ใน js.resets ของไฟล์ภาษา
// เริ่มได้ทีละการ์ด ถ้าเริ่มการ์ดใหม่ การ์ดเดิมจะหยุด (ไม่นับว่าครบ)
// ทำครบ = นับจำนวนครั้งของวันนี้ (hikariReset_ชื่อผู้ใช้) + ถ้าเป็นการพัก (relax) นับเป็นภารกิจข้อ 3 ของวันนี้
// ข้อความในช่องเขียน (Brain dump / ก้าวต่อไป) เก็บในตัวแปร resetNotes เท่านั้น ไม่ลง localStorage จนกว่าจะกด "บันทึก"
const resetNotes = { dump: "", problem: "", action: "" };
let resetRun = null;            // การ์ดที่กำลังจับเวลา: { id, left, elapsed, timer }
const RESET_ANNOUNCE_EVERY = 15;    // บอกเวลาที่เหลือให้โปรแกรมอ่านหน้าจอทุก 15 วินาที (ไม่บอกทุกวินาทีให้รำคาญ)

function resetKey() {
    return "hikariReset_" + (currentUser || "guest");
}

// ข้อมูลรายวัน เช่น { "2026-10-24": { sigh: 2, eye: 1 } } ถ้าข้อมูลผิดรูปแบบ ใช้ค่าว่าง
function loadResetDays() {
    const data = loadData(resetKey(), {});
    return (data && typeof data === "object" && !Array.isArray(data)) ? data : {};
}

function resetTodayCount() {
    const day = loadResetDays()[dateKey(new Date())];
    let n = 0;
    if (day && typeof day === "object") {
        for (const id in day) {
            const v = Number(day[id]);
            if (Number.isFinite(v) && v > 0) {
                n += Math.floor(v);
            }
        }
    }
    return n;
}

function addResetDone(id) {
    const data = loadResetDays();
    const today = dateKey(new Date());
    const day = (data[today] && typeof data[today] === "object") ? data[today] : {};
    day[id] = (Number(day[id]) || 0) + 1;
    data[today] = day;
    // เก็บแค่ 30 วันล่าสุด
    Object.keys(data).sort().slice(0, -30).forEach(function (k) { delete data[k]; });
    saveData(resetKey(), data);
}

function showResetCount() {
    document.getElementById("resetCount").textContent = fill(t("resetCount"), { n: resetTodayCount() });
}

// สร้างช่องเขียน 1 ช่อง (ค่าเก็บในหน่วยความจำ resetNotes เท่านั้น)
function noteField(box, field, multiline) {
    const id = "note-" + field;
    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = t("noteLabels")[field];
    const input = document.createElement(multiline ? "textarea" : "input");
    input.id = id;
    input.className = "note-input";
    input.maxLength = multiline ? 2000 : 300;
    if (multiline) {
        input.rows = 4;
    } else {
        input.type = "text";
    }
    input.placeholder = t("notePh")[field];
    input.autocomplete = "off";
    input.value = resetNotes[field];
    input.addEventListener("input", function () {
        resetNotes[field] = input.value;
    });
    box.appendChild(label);
    box.appendChild(input);
}

// ปุ่มบันทึก / ล้าง ของการ์ดที่มีช่องเขียน
function noteButtons(card, kind) {
    const row = document.createElement("div");
    row.className = "note-actions";
    const save = document.createElement("button");
    save.type = "button";
    save.className = "btn btn-outline btn-small note-save";
    save.textContent = t("noteSave");
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "btn btn-outline btn-small note-clear";
    clear.textContent = t("noteClear");
    const msg = document.createElement("p");
    msg.className = "note-msg";
    msg.setAttribute("role", "status");
    save.addEventListener("click", function () {
        saveNote(kind, msg);
    });
    clear.addEventListener("click", function () {
        const fields = kind === "dump" ? ["dump"] : ["problem", "action"];
        fields.forEach(function (f) {
            resetNotes[f] = "";
            const input = document.getElementById("note-" + f);
            if (input) {
                input.value = "";
            }
        });
        msg.textContent = "";
    });
    row.appendChild(save);
    row.appendChild(clear);
    card.appendChild(row);
    card.appendChild(msg);
}

// บันทึกข้อความลง "บันทึกของฉัน" (log ส่วนตัวของบัญชี เก็บในเครื่องนี้เท่านั้น)
function saveNote(kind, msg) {
    const text = kind === "dump" ? resetNotes.dump.trim() : resetNotes.problem.trim();
    const step = kind === "step" ? resetNotes.action.trim() : "";
    if (text === "" && step === "") {
        msg.textContent = t("noteEmpty");
        return;
    }
    if (!currentUser) {
        msg.textContent = t("noteNeedLogin");     // ข้อความยังอยู่ในหน้านี้ ไม่หาย
        openAuth("login");
        return;
    }
    addLog("note", kind === "dump" ? { kind: "dump", text: text } : { kind: "step", text: text, step: step });
    msg.textContent = t("noteSaved");
}

function noteDetail(data) {
    if (!data || typeof data !== "object") {
        return "-";
    }
    const cut = function (v) { return String(v || "").slice(0, 120); };
    if (data.kind === "step") {
        return t("resets").step.t + ": " + cut(data.text) + " → " + cut(data.step);
    }
    return t("resets").dump.t + ": " + cut(data.text);
}

// วาดการ์ดทั้งหมด (เรียกซ้ำตอนเปลี่ยนภาษา ตัวจับเวลาที่กำลังเดินยังเดินต่อ)
function renderResets() {
    const grid = document.getElementById("resetGrid");
    grid.textContent = "";
    RESETS.forEach(function (r) {
        const text = t("resets")[r.id];
        const card = document.createElement("article");
        card.className = "card reset-card";
        card.id = "reset-" + r.id;
        card.setAttribute("aria-labelledby", "reset-title-" + r.id);

        const top = document.createElement("div");
        top.className = "reset-top";
        const icon = document.createElement("span");
        icon.className = "reset-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = r.icon;
        const head = document.createElement("div");
        const h3 = document.createElement("h3");
        h3.id = "reset-title-" + r.id;
        h3.textContent = text.t;
        const meta = document.createElement("p");
        meta.className = "reset-meta";
        meta.textContent = fill(t("resetMin"), { n: r.seconds / 60 }) + " · " + text.d;
        head.appendChild(h3);
        head.appendChild(meta);
        top.appendChild(icon);
        top.appendChild(head);
        card.appendChild(top);

        const steps = document.createElement("ol");
        steps.className = "reset-steps";
        text.steps.forEach(function (s) {
            const li = document.createElement("li");
            li.textContent = s;
            steps.appendChild(li);
        });
        card.appendChild(steps);

        // ช่องเขียน (Brain dump / ก้าวต่อไป 1 ก้าว)
        if (r.note) {
            const box = document.createElement("div");
            box.className = "note-box";
            if (r.note === "dump") {
                noteField(box, "dump", true);
            } else {
                noteField(box, "problem", true);
                noteField(box, "action", false);
            }
            card.appendChild(box);
        }

        // ตัวจับเวลา: ปุ่มเริ่ม/หยุด + เวลาที่เหลือ (+ จังหวะหายใจสำหรับการ์ดหายใจ)
        const run = document.createElement("div");
        run.className = "reset-run";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn btn-primary btn-small reset-btn";
        button.addEventListener("click", function () { toggleReset(r); });
        const clock = document.createElement("span");
        clock.className = "reset-clock";
        clock.setAttribute("role", "timer");
        run.appendChild(button);
        run.appendChild(clock);
        if (r.phases) {
            const orb = document.createElement("span");
            orb.className = "reset-orb";
            orb.dataset.kind = r.id;            // v18: จังหวะต่างกัน (ถอนใจ / PMR / 4-8) CSS ย่อ/ขยายต่างกัน
            orb.setAttribute("aria-hidden", "true");
            const phase = document.createElement("span");
            phase.className = "reset-phase";
            run.appendChild(orb);
            run.appendChild(phase);
        }
        card.appendChild(run);

        // ข้อความสำหรับโปรแกรมอ่านหน้าจอ (aria-live): เริ่ม / ขั้นปัจจุบัน / เวลาที่เหลือทุก 15 วินาที / ครบ
        const status = document.createElement("p");
        status.className = "reset-status";
        status.setAttribute("aria-live", "polite");
        card.appendChild(status);

        if (r.note) {
            noteButtons(card, r.note);
        }
        if (r.cite) {
            const cite = document.createElement("p");
            cite.className = "reset-cite";
            if (r.url) {
                const a = document.createElement("a");
                a.href = r.url;
                a.target = "_blank";
                a.rel = "noopener";
                a.textContent = r.cite + " ↗";
                cite.appendChild(a);
            } else {
                cite.textContent = r.cite;
            }
            card.appendChild(cite);
        }
        grid.appendChild(card);
        updateResetCard(r, false);
    });
    showResetCount();
}

// เขียนสถานะของการ์ดใหม่ (ปุ่ม, เวลา, ขั้นที่ไฮไลต์, จังหวะหายใจ)
function updateResetCard(r, announce) {
    const card = document.getElementById("reset-" + r.id);
    if (!card) {
        return;
    }
    const running = resetRun !== null && resetRun.id === r.id;
    const left = running ? resetRun.left : r.seconds;
    const elapsed = running ? resetRun.elapsed : 0;
    const button = card.querySelector(".reset-btn");
    button.textContent = running ? t("resetStop") : t("resetStart");
    button.setAttribute("aria-pressed", running ? "true" : "false");
    card.classList.toggle("running", running);
    card.querySelector(".reset-clock").textContent = formatClock(left);

    // ไฮไลต์ขั้นตามเวลา (แบ่งเวลาเท่า ๆ กัน) ยกเว้นการ์ดหายใจที่ใช้จังหวะแทน
    // v18: stepsTimed = มีทั้งจังหวะและขั้นตามเวลา (PMR: ส่วนของร่างกายเปลี่ยนทุก 15 วินาที)
    const items = card.querySelectorAll(".reset-steps li");
    let stepIndex = -1;
    if (running && (!r.phases || r.stepsTimed)) {
        stepIndex = Math.min(items.length - 1, Math.floor(elapsed / (r.seconds / items.length)));
    }
    for (let i = 0; i < items.length; i++) {
        items[i].classList.toggle("now", i === stepIndex);
        if (i === stepIndex) {
            items[i].setAttribute("aria-current", "step");
        } else {
            items[i].removeAttribute("aria-current");
        }
    }
    if (r.phases) {
        const phase = card.querySelector(".reset-phase");
        const orb = card.querySelector(".reset-orb");
        if (running) {
            const cycle = r.phases.reduce(function (a, b) { return a + b; }, 0);
            let pos = elapsed % cycle;
            let p = 0;
            while (pos >= r.phases[p]) {
                pos -= r.phases[p];
                p++;
            }
            phase.textContent = t(r.phaseText || "resetPhases")[p];
            orb.dataset.phase = String(p);     // 0 = เข้า, 1 = สูดเพิ่ม, 2 = ออกยาว (CSS ย่อ/ขยายวงกลม)
        } else {
            phase.textContent = "";
            orb.dataset.phase = "";
        }
    }
    if (!announce) {
        return;
    }
    const status = card.querySelector(".reset-status");
    const steps = t("resets")[r.id].steps;
    if (announce === "start") {
        status.textContent = (stepIndex >= 0 ? fill(t("resetStepOf"), { n: 1, total: steps.length, s: steps[0] }) + " · " : "") +
            fill(t("timeLeft"), { t: formatClock(left) });
    } else if (announce === "step") {
        status.textContent = fill(t("resetStepOf"), { n: stepIndex + 1, total: steps.length, s: steps[stepIndex] });
    } else if (announce === "time") {
        status.textContent = fill(t("timeLeft"), { t: formatClock(left) });
    } else if (announce === "stop") {
        status.textContent = t("resetStopped");
    } else if (announce === "done") {
        status.textContent = t("resetDoneMsg");
    }
}

function toggleReset(r) {
    if (resetRun !== null && resetRun.id === r.id) {
        stopReset("stop");
        return;
    }
    stopReset("stop");                          // หยุดการ์ดอื่นที่เดินอยู่ก่อน
    resetRun = { id: r.id, left: r.seconds, elapsed: 0, timer: null };
    resetRun.timer = setInterval(function () { resetTick(r); }, 1000);
    updateResetCard(r, "start");
}

function resetTick(r) {
    if (resetRun === null || resetRun.id !== r.id) {
        return;
    }
    const items = t("resets")[r.id].steps.length;
    const before = Math.floor(resetRun.elapsed / (r.seconds / items));
    resetRun.left -= 1;
    resetRun.elapsed += 1;
    if (resetRun.left <= 0) {
        finishReset(r);
        return;
    }
    const after = Math.floor(resetRun.elapsed / (r.seconds / items));
    let announce = false;
    if ((!r.phases || r.stepsTimed) && after !== before && after < items) {
        announce = "step";
    } else if (resetRun.left % RESET_ANNOUNCE_EVERY === 0) {
        announce = "time";
    }
    updateResetCard(r, announce);
}

function stopReset(how) {
    if (resetRun === null) {
        return;
    }
    const r = RESETS.find(function (x) { return x.id === resetRun.id; });
    clearInterval(resetRun.timer);
    resetRun = null;
    updateResetCard(r, how);
}

// ครบเวลา: นับครั้ง + บันทึก log + ภารกิจข้อ 3 (ถ้าเป็นการพัก)
function finishReset(r) {
    clearInterval(resetRun.timer);
    resetRun = null;
    addResetDone(r.id);
    addLog("reset", { id: r.id });
    if (r.relax) {
        markTask("breathe");
    }
    updateResetCard(r, "done");
    showResetCount();
}

// ปุ่ม "พักสั้น 1 นาที" ในหน้าแรก: เลื่อนไปที่การ์ดหายใจ แล้วโฟกัสปุ่มเริ่ม (ผู้ใช้กดเริ่มเอง)
document.getElementById("heroReset").addEventListener("click", function (event) {
    event.preventDefault();
    const card = document.getElementById("reset-sigh");
    card.scrollIntoView({ block: "center" });
    card.querySelector(".reset-btn").focus({ preventScroll: true });
});


// ===== 17. เช็กภาวะหมดไฟ: Copenhagen Burnout Inventory (CBI) =====
// Kristensen et al. (2005) Work & Stress 19(3):192–207 · ใช้ได้ฟรี
// 2 ส่วน: ภาวะหมดไฟส่วนบุคคล 6 ข้อ + ภาวะหมดไฟจากงาน 7 ข้อ (CBI_ITEMS ใน content.js)
// คำตอบลำดับที่ 0–4 (เสมอ → ไม่เคย หรือ มากที่สุด → น้อยที่สุด) = 100 / 75 / 50 / 25 / 0
// ข้อที่กลับคะแนน (reverse): "มีแรงพอสำหรับครอบครัวและเพื่อนในเวลาว่างไหม" = 0 / 25 / 50 / 75 / 100
// คะแนนแต่ละส่วน = ค่าเฉลี่ย 0–100 · ระดับ: < 50 ต่ำ, 50–74 ปานกลาง, 75–99 สูง, 100 รุนแรง
const bAnswers = [];
let bCurrent = 0;
let bTimer = null;
let bScores = null;         // ผลล่าสุดที่แสดงอยู่ { p, w }

const bQuiz = document.getElementById("bquiz");
const bResult = document.getElementById("bResult");
const bOptions = document.getElementById("bOptions");
const bNext = document.getElementById("bNext");
const bBack = document.getElementById("bBack");

function burnoutKey() {
    return "hikariBurnout_" + (currentUser || "guest");
}

// คะแนนของ 1 ข้อ (0–100)
function cbiItemScore(index, answer) {
    const value = (4 - answer) * 25;
    return CBI_ITEMS[index].reverse ? 100 - value : value;
}

// คะแนนเฉลี่ยของแต่ละส่วน ปัดทศนิยม 1 ตำแหน่ง (ค่าที่เป็นไปได้ห่างจากจุดตัดเกิน 0.5 จึงไม่ข้ามระดับ)
function cbiScore(list) {
    const sums = { personal: 0, work: 0 };
    const counts = { personal: 0, work: 0 };
    for (let i = 0; i < CBI_ITEMS.length; i++) {
        if (list[i] !== undefined) {
            sums[CBI_ITEMS[i].sub] += cbiItemScore(i, list[i]);
            counts[CBI_ITEMS[i].sub] += 1;
        }
    }
    const mean = function (k) { return counts[k] ? Math.round(sums[k] / counts[k] * 10) / 10 : 0; };
    return { p: mean("personal"), w: mean("work") };
}

// ระดับ 0–3: ต่ำ / ปานกลาง / สูง / รุนแรง
function cbiBand(score) {
    if (score < 50) {
        return 0;
    }
    if (score < 75) {
        return 1;
    }
    if (score < 100) {
        return 2;
    }
    return 3;
}

// คะแนนจาก localStorage ต้องเป็นตัวเลข 0–100 เท่านั้น
function validCbi(value) {
    const n = Number(value);
    return (typeof value === "number" || typeof value === "string") && Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n * 10) / 10 : null;
}

function burnoutDetail(data) {
    const p = data ? validCbi(data.p) : null;
    const w = data ? validCbi(data.w) : null;
    if (p === null || w === null) {
        return "-";
    }
    return fill(t("detailBurnout"), { p: p, w: w });
}

function loadBurnout() {
    const saved = loadData(burnoutKey(), []);
    return (Array.isArray(saved) ? saved : []).filter(function (h) {
        return h && validCbi(h.p) !== null && validCbi(h.w) !== null;
    });
}

function showBQuestion() {
    const total = CBI_ITEMS.length;
    const item = CBI_ITEMS[bCurrent];
    const part = item.sub === "personal" ? 1 : 2;
    document.getElementById("bSubLabel").textContent =
        fill(t("cbiPart"), { n: part, name: item.sub === "personal" ? t("cbiPersonal") : t("cbiWork") });
    document.getElementById("bQuestion").textContent = (bCurrent + 1) + ". " + t("cbiQ")[bCurrent];
    document.getElementById("bProgressText").textContent = (bCurrent + 1) + "/" + total;
    document.getElementById("bProgressFill").style.width = ((bCurrent + 1) / total * 100) + "%";
    document.getElementById("bMessage").textContent = "";

    const choices = item.scale === "deg" ? t("cbiDeg") : t("cbiFreq");
    bOptions.textContent = "";
    for (let i = 0; i < choices.length; i++) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "option";
        button.textContent = choices[i];
        button.setAttribute("aria-pressed", bAnswers[bCurrent] === i ? "true" : "false");
        if (bAnswers[bCurrent] === i) {
            button.classList.add("selected");
        }
        button.addEventListener("click", function (event) {
            bAnswers[bCurrent] = i;
            const fromKeyboard = event.detail === 0;
            showBQuestion();
            if (fromKeyboard) {
                bOptions.children[i].focus();
            }
            bAutoAdvance(bCurrent, fromKeyboard);
        });
        bOptions.appendChild(button);
    }
    bBack.disabled = (bCurrent === 0);
    bNext.textContent = (bCurrent === total - 1) ? t("seeResult") : t("next");
}

// เหมือนแบบประเมินความเครียด: ตอบแล้วไปข้อถัดไปเองหลัง 300 มิลลิวินาที ข้อสุดท้ายรอกด "ดูผล"
function bAutoAdvance(index, fromKeyboard) {
    clearTimeout(bTimer);
    bTimer = setTimeout(function () {
        if (bCurrent !== index || bAnswers[index] === undefined || !bResult.classList.contains("hidden")) {
            return;
        }
        if (bCurrent < CBI_ITEMS.length - 1) {
            bCurrent += 1;
            showBQuestion();
            if (fromKeyboard) {
                bOptions.children[0].focus();
            }
        } else if (fromKeyboard) {
            bNext.focus();
        }
    }, AUTO_ADVANCE_MS);
}

bBack.addEventListener("click", function () {
    clearTimeout(bTimer);
    if (bCurrent > 0) {
        bCurrent -= 1;
        showBQuestion();
    }
});

bNext.addEventListener("click", function () {
    clearTimeout(bTimer);
    if (bAnswers[bCurrent] === undefined) {
        document.getElementById("bMessage").textContent = t("needAnswer");
        return;
    }
    if (bCurrent < CBI_ITEMS.length - 1) {
        bCurrent += 1;
        showBQuestion();
    } else {
        showBResult();
    }
});

// ตอบครบ: บันทึกผล 1 ครั้ง (เก็บ 10 ครั้งล่าสุด) แล้วแสดงผล
function showBResult() {
    bScores = cbiScore(bAnswers);
    const history = loadBurnout();
    history.push({ time: new Date().toISOString(), p: bScores.p, w: bScores.w });
    while (history.length > 10) {
        history.shift();
    }
    saveData(burnoutKey(), history);
    addLog("burnout", { p: bScores.p, w: bScores.w });
    markTask("checkin");                // เช็กภาวะหมดไฟก็นับเป็นภารกิจข้อ 1
    renderOverview();
    bQuiz.classList.add("hidden");
    bResult.classList.remove("hidden");
    renderBResult();
    bResult.focus();
}

function renderBScore(boxId, name, score, meanings) {
    const box = document.getElementById(boxId);
    const band = cbiBand(score);
    box.className = "burnout-score band-" + band;
    box.querySelector(".bs-name").textContent = name;
    box.querySelector(".bs-num").textContent = score;
    box.querySelector(".bs-band").textContent = t("cbiBands")[band];
    box.querySelector(".bar-fill").style.width = score + "%";
    box.querySelector(".bs-meaning").textContent = meanings[band];
}

function renderBResult() {
    if (!bScores) {
        return;
    }
    renderBScore("bScorePersonal", t("cbiPersonal"), bScores.p, t("cbiMeanP"));
    renderBScore("bScoreWork", t("cbiWork"), bScores.w, t("cbiMeanW"));
    const worst = Math.max(cbiBand(bScores.p), cbiBand(bScores.w));
    document.getElementById("bHelp").classList.toggle("hidden", worst < 2);   // สูง / รุนแรง

    // ทักษะ 2 ใบที่ตรงกับต้นเหตุที่เลือก (ถ้ายังไม่เลือก ใช้ค่าเริ่มต้นตามส่วนที่คะแนนสูงกว่า)
    const box = document.getElementById("bSkills");
    box.textContent = "";
    burnoutSkills(bScores).forEach(function (id) {
        box.appendChild(skillCard(id));
    });
    document.getElementById("bPickCause").classList.toggle("hidden", loadCauses().length > 0);

    const list = document.getElementById("bHistory");
    list.textContent = "";
    const history = loadBurnout();
    history.slice(-5).forEach(function (h) {
        historyItem(list, safeDate(h.time, { day: "numeric", month: "short" }) + " · " + burnoutDetail(h));
    });
    showBurnoutLast();
}

// ทำล่าสุดเมื่อไร (แสดงใต้หัวข้อ)
function showBurnoutLast() {
    const history = loadBurnout();
    const box = document.getElementById("burnoutLast");
    if (history.length === 0) {
        box.textContent = t("cbiNever");
        return;
    }
    const last = history[history.length - 1];
    box.textContent = fill(t("cbiLast"), {
        date: safeDate(last.time, { day: "numeric", month: "short", year: "numeric" }),
        p: validCbi(last.p), w: validCbi(last.w)
    });
}

// เปลี่ยนภาษา / เปลี่ยนผู้ใช้
function refreshBurnout() {
    if (bResult.classList.contains("hidden")) {
        showBQuestion();
        showBurnoutLast();
    } else {
        renderBResult();
    }
}

document.getElementById("bRestart").addEventListener("click", function () {
    clearTimeout(bTimer);
    bAnswers.length = 0;
    bCurrent = 0;
    bScores = null;
    bResult.classList.add("hidden");
    bQuiz.classList.remove("hidden");
    showBQuestion();
    bOptions.children[0].focus();
});


// ===== 18. รับมือที่ต้นเหตุ: เลือกต้นเหตุ (สูงสุด 3) + การ์ดทักษะ + เคล็ดลับวันนี้ + ที่ฉันเลือกทำวันนี้ =====
// ต้นเหตุที่เลือกเก็บที่ hikariCauses_ชื่อผู้ใช้ (เช่น ["work", "sleep"])
// "ลองทำวันนี้" เก็บใน hikariJourney_ชื่อผู้ใช้ ช่อง self (เลือกทำเอง ไม่นับเป็นภารกิจ 3 ข้อ) และบันทึก log ชนิด skill
const descValues = { d: "", e: "", s: "", c: "" };   // แม่แบบ DESC เก็บในหน่วยความจำเท่านั้น
let budgetIncome = "";
let skillCardCount = 0;          // ใช้สร้าง id ไม่ซ้ำ (การ์ดเดียวกันอาจอยู่ทั้งในผลเช็กภาวะหมดไฟและในส่วนนี้)

function causesKey() {
    return "hikariCauses_" + (currentUser || "guest");
}

// อ่านต้นเหตุที่เลือก: เฉพาะรหัสที่รู้จัก ไม่ซ้ำ ไม่เกิน 3
function loadCauses() {
    const saved = loadData(causesKey(), []);
    const ids = CAUSES.map(function (c) { return c.id; });
    const out = [];
    (Array.isArray(saved) ? saved : []).forEach(function (id) {
        if (ids.indexOf(id) !== -1 && out.indexOf(id) === -1 && out.length < MAX_CAUSES) {
            out.push(id);
        }
    });
    return out;
}

function causeById(id) {
    return CAUSES.find(function (c) { return c.id === id; });
}

// ทักษะทั้งหมดของต้นเหตุที่เลือก (เรียงตามลำดับที่เลือก)
function chosenSkills() {
    const out = [];
    loadCauses().forEach(function (id) {
        causeById(id).skills.forEach(function (s) {
            out.push({ cause: id, skill: s });
        });
    });
    return out;
}

// ทักษะ 2 ใบสำหรับผลเช็กภาวะหมดไฟ: ทักษะแรกของต้นเหตุแต่ละเรื่อง แล้วเติมด้วยทักษะถัดไป
function burnoutSkills(scores) {
    const causes = loadCauses();
    const out = [];
    causes.forEach(function (id) {
        if (out.length < 2) {
            out.push(causeById(id).skills[0]);
        }
    });
    if (out.length < 2 && causes.length > 0) {
        out.push(causeById(causes[0]).skills[1]);
    }
    if (out.length === 0) {
        return scores.w >= scores.p ? ["prio", "boundary"] : ["wake", "circle"];
    }
    return out;
}

// ทักษะที่เลือกทำวันนี้ (กรองเฉพาะรหัสที่รู้จัก)
function selfTasksOf(info) {
    const list = info.data.self[info.today];
    return (Array.isArray(list) ? list : []).filter(function (x) {
        return x && SKILLS.hasOwnProperty(x.id);
    });
}

function addSelfTask(id) {
    const info = journeyInfo();
    const data = info.data;
    const list = selfTasksOf(info);
    if (list.some(function (x) { return x.id === id; })) {
        return false;
    }
    list.push({ id: id, done: false });
    data.self[info.today] = list;
    // เก็บแค่ 14 วันล่าสุด
    Object.keys(data.self).sort().slice(0, -14).forEach(function (k) { delete data.self[k]; });
    saveData(journeyKey(), data);
    addLog("skill", { id: id });
    renderJourney();
    return true;
}

function toggleSelfDone(id) {
    const info = journeyInfo();
    const list = selfTasksOf(info);
    list.forEach(function (x) {
        if (x.id === id) {
            x.done = !x.done;
        }
    });
    info.data.self[info.today] = list;
    saveData(journeyKey(), info.data);
    renderJourney();
}

function isSelfToday(id) {
    return selfTasksOf(journeyInfo()).some(function (x) { return x.id === id; });
}

// ช่องกรอก 1 ช่องพร้อมป้ายชื่อ
function labeledInput(box, id, labelText, placeholder, value, onInput, type) {
    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = labelText;
    const input = document.createElement("input");
    input.id = id;
    input.type = type || "text";
    input.className = "note-input";
    input.placeholder = placeholder;
    input.autocomplete = "off";
    input.value = value;
    if (input.type === "text") {
        input.maxLength = 200;
    }
    input.addEventListener("input", function () { onInput(input.value); });
    box.appendChild(label);
    box.appendChild(input);
    return input;
}

// เครื่องมือในการ์ด: แม่แบบ DESC, งบ 50/30/20, ลิงก์ช่วยเรื่องหนี้
function skillTool(card, tool, uid) {
    const box = document.createElement("div");
    box.className = "skill-tool";
    if (tool === "desc") {
        const out = document.createElement("p");
        out.className = "desc-out";
        out.setAttribute("aria-live", "polite");
        const update = function () {
            const filled = ["d", "e", "s", "c"].some(function (k) { return descValues[k].trim() !== ""; });
            out.textContent = filled ? fill(t("descOut"), {
                d: descValues.d.trim() || "…", e: descValues.e.trim() || "…",
                s: descValues.s.trim() || "…", c: descValues.c.trim() || "…"
            }) : "";
        };
        ["d", "e", "s", "c"].forEach(function (k) {
            labeledInput(box, uid + "-" + k, t("descLabels")[k], t("descPh")[k], descValues[k], function (v) {
                descValues[k] = v;
                update();
            });
        });
        box.appendChild(out);
        update();
    } else if (tool === "budget") {
        const out = document.createElement("p");
        out.className = "desc-out";
        out.setAttribute("aria-live", "polite");
        const update = function () {
            const income = Number(budgetIncome);
            if (!Number.isFinite(income) || income <= 0) {
                out.textContent = "";
                return;
            }
            const money = function (x) { return "฿" + Math.round(x).toLocaleString(t("locale")); };
            out.textContent = fill(t("budgetOut"), { a: money(income * 0.5), b: money(income * 0.3), c: money(income * 0.2) });
        };
        const input = labeledInput(box, uid + "-income", t("budgetLabel"), "25000", budgetIncome, function (v) {
            budgetIncome = v;
            update();
        }, "number");
        input.min = "0";
        input.inputMode = "numeric";
        box.appendChild(out);
        update();
    } else if (tool === "debt") {
        const row = document.createElement("div");
        row.className = "skill-links";
        const clinic = document.createElement("a");
        clinic.className = "btn btn-outline btn-small";
        clinic.href = DEBT_CLINIC_URL;
        clinic.target = "_blank";
        clinic.rel = "noopener";
        clinic.textContent = t("debtClinic");
        const call = document.createElement("a");
        call.className = "btn btn-outline btn-small";
        call.href = "tel:" + BOT_HOTLINE;
        call.textContent = t("debtHotline");
        row.appendChild(clinic);
        row.appendChild(call);
        box.appendChild(row);
    }
    card.appendChild(box);
}

// การ์ดทักษะ 1 ใบ: ชื่อ ขั้นตอน เครื่องมือ (ถ้ามี) แหล่งอ้างอิง และปุ่ม "ลองทำวันนี้"
function skillCard(id) {
    skillCardCount++;
    const uid = "sk" + skillCardCount + "-" + id;
    const text = t("skills")[id];
    const info = SKILLS[id];
    const card = document.createElement("article");
    card.className = "card skill-card";
    card.dataset.skill = id;
    card.setAttribute("aria-labelledby", uid + "-title");
    const h4 = document.createElement("h4");
    h4.id = uid + "-title";
    h4.textContent = text.t;
    card.appendChild(h4);
    const steps = document.createElement("ol");
    steps.className = "skill-steps";
    text.s.forEach(function (s) {
        const li = document.createElement("li");
        li.textContent = s;
        steps.appendChild(li);
    });
    card.appendChild(steps);
    if (info.tool) {
        skillTool(card, info.tool, uid);
    }
    if (info.cite) {
        const cite = document.createElement("p");
        cite.className = "reset-cite";
        if (info.url) {
            const a = document.createElement("a");
            a.href = info.url;
            a.target = "_blank";
            a.rel = "noopener";
            a.textContent = info.cite + " ↗";
            cite.appendChild(a);
        } else {
            cite.textContent = info.cite;
        }
        card.appendChild(cite);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-primary btn-small skill-try";
    const msg = document.createElement("p");
    msg.className = "skill-msg";
    msg.setAttribute("role", "status");
    const refresh = function () {
        const added = isSelfToday(id);
        button.textContent = added ? t("skillAdded") : t("skillTry");
        button.disabled = added;
    };
    button.addEventListener("click", function () {
        if (addSelfTask(id)) {
            refreshSkillButtons();
            msg.textContent = t("skillAddedMsg");
        }
    });
    card.appendChild(button);
    card.appendChild(msg);
    refresh();
    return card;
}

// ปุ่ม "ลองทำวันนี้" ทุกใบ (ทั้งในผลเช็กภาวะหมดไฟและในส่วนนี้) ต้องตรงกับสถานะล่าสุด
function refreshSkillButtons() {
    const cards = document.querySelectorAll(".skill-card");
    for (let i = 0; i < cards.length; i++) {
        const added = isSelfToday(cards[i].dataset.skill);
        const button = cards[i].querySelector(".skill-try");
        button.textContent = added ? t("skillAdded") : t("skillTry");
        button.disabled = added;
    }
}

// ปุ่มเลือกต้นเหตุ + การ์ดทักษะของเรื่องที่เลือก
function renderCauses() {
    const chosen = loadCauses();
    const chips = document.getElementById("causeChips");
    chips.textContent = "";
    CAUSES.forEach(function (c) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "chip cause-chip";
        button.dataset.cause = c.id;
        const on = chosen.indexOf(c.id) !== -1;
        button.classList.toggle("selected", on);
        button.setAttribute("aria-pressed", on ? "true" : "false");
        button.textContent = c.icon + " " + t("causeNames")[c.id];
        button.addEventListener("click", function () { toggleCause(c.id); });
        chips.appendChild(button);
    });

    const box = document.getElementById("causeSkills");
    box.textContent = "";
    chosen.forEach(function (id) {
        const c = causeById(id);
        const group = document.createElement("div");
        group.className = "cause-group";
        const h3 = document.createElement("h3");
        h3.textContent = c.icon + " " + t("causeNames")[id];
        group.appendChild(h3);
        const grid = document.createElement("div");
        grid.className = "skill-grid";
        c.skills.forEach(function (s) {
            grid.appendChild(skillCard(s));
        });
        group.appendChild(grid);
        box.appendChild(group);
    });
    document.getElementById("causeEmpty").classList.toggle("hidden", chosen.length > 0);
}

function toggleCause(id) {
    const chosen = loadCauses();
    const msg = document.getElementById("causeMsg");
    const at = chosen.indexOf(id);
    if (at !== -1) {
        chosen.splice(at, 1);
    } else if (chosen.length >= MAX_CAUSES) {
        msg.textContent = t("causeMax");
        return;
    } else {
        chosen.push(id);
    }
    msg.textContent = "";
    saveData(causesKey(), chosen);
    renderCauses();
    const again = document.querySelector('#causeChips [data-cause="' + id + '"]');
    if (again) {
        again.focus();                  // วาดปุ่มใหม่แล้ว โฟกัสยังอยู่ที่ปุ่มเดิม (ผู้ใช้คีย์บอร์ด)
    }
    renderJourney();                    // เคล็ดลับวันนี้เปลี่ยนตามต้นเหตุ
    if (!bResult.classList.contains("hidden")) {
        renderBResult();
    }
}

// เคล็ดลับวันนี้: วนทีละทักษะของต้นเหตุที่เลือก เปลี่ยนวันละ 1 ข้อ
function renderTodayTip(info) {
    const list = chosenSkills();
    const tip = document.getElementById("todayTip");
    if (list.length === 0) {
        tip.textContent = t("tipNone");
        return;
    }
    const pick = list[(info.day - 1) % list.length];
    const text = t("skills")[pick.skill];
    tip.textContent = fill(t("tipFmt"), { cause: t("causeNames")[pick.cause], skill: text.t, step: text.s[0] });
}

// ที่ฉันเลือกทำวันนี้ (จากปุ่ม "ลองทำวันนี้")
function renderSelfTasks(info) {
    const list = selfTasksOf(info);
    const box = document.getElementById("todaySelf");
    const ul = document.getElementById("todaySelfList");
    ul.textContent = "";
    box.classList.toggle("hidden", list.length === 0);
    list.forEach(function (x) {
        const li = document.createElement("li");
        li.className = "today-self-item" + (x.done ? " done" : "");
        const name = document.createElement("span");
        name.textContent = t("skills")[x.id].t;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn btn-outline btn-small";
        button.textContent = x.done ? t("selfDone") : t("selfDoneBtn");
        button.setAttribute("aria-pressed", x.done ? "true" : "false");
        button.addEventListener("click", function () {
            toggleSelfDone(x.id);
            const again = document.querySelector("#todaySelfList button[data-skill=\"" + x.id + "\"]");
            if (again) {
                again.focus();
            }
        });
        button.dataset.skill = x.id;
        li.appendChild(name);
        li.appendChild(button);
        ul.appendChild(li);
    });
    if (document.querySelector(".skill-card")) {
        refreshSkillButtons();
    }
}


// ===== 19. เช็กร่างกายและพฤติกรรมรายสัปดาห์ + ข้อมูลการใช้สาร (ถามครั้งเดียว) + เมื่อไรควรพบแพทย์ + ภาพรวมของฉัน + ชวนคนที่ไว้ใจคุย =====
// ที่เก็บข้อมูล (แยกตามผู้ใช้ ยังไม่เข้าสู่ระบบ = guest) · รูปแบบนี้เกมสวนแสงอ่านด้วย ห้ามเปลี่ยนชื่อช่อง
//   hikariProfile_ชื่อ = {"v":1,"askedAt":"YYYY-MM-DD","none":true|false,"smoke":bool,"alcohol":bool,"other":bool} (ไม่มี = ยังไม่เคยถาม)
//   hikariCheck_ชื่อ   = [{"d":"YYYY-MM-DD","sleep":0-3,"head":0-3,"gut":0-3,"heart":0-3,"eat":0-3,"social":0-3,"smoke"?,"alcohol"?,"other"?}]
//                        ช่องการใช้สารมีเฉพาะเมื่อข้อมูลการใช้สารบอกว่าใช้สิ่งนั้น · 0 ไม่เลย 1 = 1–2 วัน 2 = 3–4 วัน 3 = เกือบทุกวัน
//   hikariMoods_ชื่อ   = {"YYYY-MM-DD":"very"} อารมณ์ล่าสุดของแต่ละวัน 14 วัน (ใช้ชวนทำ 2Q)
//   hikariNudge_ชื่อ   = {"check":"YYYY-MM-DD","dep":"YYYY-MM-DD"} วันที่กด "ไว้ทีหลัง" (ไม่ชวนซ้ำภายใน 7 วัน)
// คนที่ตอบ "ไม่ใช้เลย" (หรือข้าม หรือยังไม่เคยถาม) จะไม่เห็นคำถาม คำแนะนำ หรือการ์ดสายด่วนเรื่องการใช้สารเลย
// ยกเว้น "สมุดสายด่วน" ในส่วนขอความช่วยเหลือ ที่แสดงทุกสายให้ทุกคนแบบเป็นกลาง

const STRESS_HIGH = 11;             // แบบประเมินความเครียด 11–15/15 = ระดับสูง
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function userSuffix() {
    return currentUser || "guest";
}
function profileKey() { return "hikariProfile_" + userSuffix(); }
function checkKey() { return "hikariCheck_" + userSuffix(); }
function moodsKey() { return "hikariMoods_" + userSuffix(); }
function nudgeKey() { return "hikariNudge_" + userSuffix(); }

// วันที่ "YYYY-MM-DD" ที่ถูกต้องเท่านั้น
function validDay(value) {
    return typeof value === "string" && DAY_RE.test(value) && !isNaN(new Date(value + "T12:00:00").getTime()) ? value : null;
}

// คะแนน 0–3 (จำนวนเต็ม) เท่านั้น ไม่ใช่ = null
function validLevel(value) {
    if (typeof value !== "number" && typeof value !== "string") {
        return null;
    }
    const n = Number(value);
    return value !== "" && Number.isInteger(n) && n >= 0 && n <= 3 ? n : null;
}

// ----- ข้อมูลการใช้สาร -----
function normProfile(p) {
    if (!p || typeof p !== "object" || Array.isArray(p)) {
        return null;
    }
    const out = { v: 1, askedAt: validDay(p.askedAt) || dateKey(new Date()), none: false,
        smoke: p.smoke === true, alcohol: p.alcohol === true, other: p.other === true };
    out.none = p.none === true || !(out.smoke || out.alcohol || out.other);
    if (out.none) {
        out.smoke = false;
        out.alcohol = false;
        out.other = false;
    }
    return out;
}

function loadProfile() {
    return normProfile(loadData(profileKey(), null));
}

// list = สิ่งที่เลือก เช่น ["smoke"] · ว่าง = ไม่ใช้เลย (ปุ่ม "ข้ามไปก่อน" ก็นับเป็นไม่ใช้)
function makeProfile(list) {
    const p = { v: 1, askedAt: dateKey(new Date()), none: list.length === 0, smoke: false, alcohol: false, other: false };
    SUBSTANCES.forEach(function (k) {
        p[k] = list.indexOf(k) !== -1;
    });
    return p;
}

// สิ่งที่ผู้ใช้บอกว่าใช้ (ว่าง = ไม่ใช้ / ข้าม / ยังไม่เคยถาม)
function usedSubstances(profile) {
    return profile && !profile.none ? SUBSTANCES.filter(function (k) { return profile[k]; }) : [];
}

// ----- ผลเช็กรายสัปดาห์ -----
function normCheck(c) {
    if (!c || typeof c !== "object" || Array.isArray(c)) {
        return null;
    }
    const d = validDay(c.d);
    if (!d) {
        return null;
    }
    const out = { d: d };
    for (let i = 0; i < CHECK_AREAS.length; i++) {
        const v = validLevel(c[CHECK_AREAS[i].id]);
        if (v === null) {
            return null;                // ข้อมูลไม่ครบหรือถูกแก้: ไม่ใช้รายการนี้
        }
        out[CHECK_AREAS[i].id] = v;
    }
    SUBSTANCES.forEach(function (k) {
        const v = validLevel(c[k]);
        if (v !== null) {
            out[k] = v;
        }
    });
    return out;
}

function loadChecks() {
    const saved = loadData(checkKey(), []);
    return (Array.isArray(saved) ? saved : []).map(normCheck).filter(Boolean).sort(function (a, b) {
        return a.d < b.d ? -1 : a.d > b.d ? 1 : 0;
    });
}

// วันเดียวกันเก็บแค่ครั้งล่าสุด · เก็บ 26 ครั้งล่าสุด (ประมาณครึ่งปี)
function saveCheckEntry(entry) {
    const list = loadChecks().filter(function (c) { return c.d !== entry.d; });
    list.push(entry);
    list.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
    saveData(checkKey(), list.slice(-26));
}

// ครั้งล่าสุด + ครั้งก่อนหน้าที่ห่างกันอย่างน้อย 6 วัน (= 2 สัปดาห์ติดกัน)
function weeklyPair(checks) {
    if (!checks.length) {
        return null;
    }
    const last = checks[checks.length - 1];
    for (let i = checks.length - 2; i >= 0; i--) {
        if (validDay(checks[i].d) && daysBetween(checks[i].d, last.d) >= 6) {
            return { last: last, prev: checks[i] };
        }
    }
    return { last: last, prev: null };
}

// ===== เมื่อไรควรพบแพทย์ (ฟังก์ชันล้วน ไม่อ่าน/เขียนข้อมูลเอง ทดสอบได้) =====
// data = { checks, profile, stress: [{time, score}], burnout: [{time, p, w}], dep: [{d, score}] }
// คืนรายการเหตุผล (ว่าง = ไม่ต้องแสดงการ์ด):
//   sleep   นอนไม่หลับ 3–4 วันขึ้นไป ใน 2 สัปดาห์ติดกัน
//   stress  แบบประเมินความเครียดระดับสูง (11–15) 2 ครั้งล่าสุด ห่างกันอย่างน้อย 7 วัน
//   burnout ภาวะหมดไฟระดับสูงหรือรุนแรง (ส่วนใดส่วนหนึ่ง ≥ 75) 2 ครั้งล่าสุด
//   dep     9Q ครั้งล่าสุด ≥ 7
//   smoke / alcohol / other  ใช้มากกว่าปกติเพื่อคลายเครียด 3–4 วันขึ้นไป 2 สัปดาห์ติดกัน (เฉพาะคนที่บอกว่าใช้)
function doctorReasons(data) {
    const d = data || {};
    const out = [];
    const checks = (Array.isArray(d.checks) ? d.checks : []).map(normCheck).filter(Boolean).sort(function (a, b) {
        return a.d < b.d ? -1 : a.d > b.d ? 1 : 0;
    });
    const pair = weeklyPair(checks);
    const twoWeeks = function (key) {
        return Boolean(pair && pair.prev) && validLevel(pair.last[key]) >= CHECK_HIGH && validLevel(pair.prev[key]) >= CHECK_HIGH &&
            validLevel(pair.last[key]) !== null && validLevel(pair.prev[key]) !== null;
    };
    if (twoWeeks("sleep")) {
        out.push("sleep");
    }

    const stress = (Array.isArray(d.stress) ? d.stress : []).filter(function (h) {
        return h && validScore(h.score) !== null && !isNaN(new Date(h.time).getTime());
    });
    if (stress.length >= 2) {
        const a = stress[stress.length - 2];
        const b = stress[stress.length - 1];
        if (validScore(a.score) >= STRESS_HIGH && validScore(b.score) >= STRESS_HIGH &&
            daysBetween(dateKey(new Date(a.time)), dateKey(new Date(b.time))) >= 7) {
            out.push("stress");
        }
    }

    const burnout = (Array.isArray(d.burnout) ? d.burnout : []).filter(function (h) {
        return h && validCbi(h.p) !== null && validCbi(h.w) !== null;
    });
    if (burnout.length >= 2) {
        const high = function (h) { return Math.max(cbiBand(validCbi(h.p)), cbiBand(validCbi(h.w))) >= 2; };
        if (high(burnout[burnout.length - 2]) && high(burnout[burnout.length - 1])) {
            out.push("burnout");
        }
    }

    const dep = (Array.isArray(d.dep) ? d.dep : []).map(normDep).filter(Boolean);
    if (dep.length && dep[dep.length - 1].score !== null && dep[dep.length - 1].score >= DEP_DOCTOR_SCORE) {
        out.push("dep");
    }

    usedSubstances(normProfile(d.profile)).forEach(function (k) {
        if (twoWeeks(k)) {
            out.push(k);
        }
    });
    return out;
}

// ข้อมูลของผู้ใช้ปัจจุบันสำหรับ doctorReasons
function doctorData() {
    return {
        checks: loadChecks(),
        profile: loadProfile(),
        stress: loadData(historyKey(), []),
        burnout: loadBurnout(),
        dep: loadDep()
    };
}

function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) {
        e.className = className;
    }
    if (text !== undefined) {
        e.textContent = text;
    }
    return e;
}

// ลิงก์โทรสายด่วน เช่น "📞 โทร 1600 (ศูนย์บริการเลิกบุหรี่ฯ) ฟรี"
function telButton(n, className) {
    const a = el("a", className || "btn btn-outline btn-small", fill(t("actTel"), { n: n, name: t("telNames")[n] }));
    a.href = "tel:" + n;
    return a;
}

// การ์ดแนะนำพบแพทย์/นักจิตวิทยา: ช่องทางฟรีก่อน แล้วค่อยเป็นทางเลือกที่มีค่าใช้จ่าย (ไม่ระบุชื่อแบรนด์)
function doctorCard(reasons) {
    const box = el("div", "doctor-card");
    box.setAttribute("role", "note");
    box.appendChild(el("h4", "doctor-title", t("docTitle")));
    box.appendChild(el("p", "doctor-intro", t("docIntro")));
    const why = el("ul", "doctor-why");
    reasons.forEach(function (r) {
        why.appendChild(el("li", "", t("docWhy")[r]));
    });
    box.appendChild(why);
    box.appendChild(el("p", "doctor-head", t("docFreeHead")));
    const free = el("ol", "doctor-free");
    t("docFree").forEach(function (text) {
        const li = el("li");
        setTextWithPhones(li, text);
        free.appendChild(li);
    });
    // สายด่วนเรื่องการใช้สาร: แสดงเฉพาะเมื่อเหตุผลมาจากสิ่งที่ผู้ใช้บอกว่าใช้
    reasons.forEach(function (r) {
        if (SUBSTANCE_HOTLINE[r]) {
            const li = el("li");
            li.appendChild(telButton(SUBSTANCE_HOTLINE[r], "tel-link"));
            free.appendChild(li);
        }
    });
    box.appendChild(free);
    box.appendChild(el("p", "doctor-head", t("docPaidHead")));
    const paid = el("ul", "doctor-paid");
    t("docPaid").forEach(function (text) {
        paid.appendChild(el("li", "", text));
    });
    box.appendChild(paid);
    box.appendChild(el("p", "disclaimer", t("docNote")));
    return box;
}

// วาดการ์ดลงในกล่อง (ถ้ามีเหตุผล) คืนรายการเหตุผล
function renderDoctorInto(container) {
    container.textContent = "";
    const reasons = doctorReasons(doctorData());
    if (reasons.length) {
        container.appendChild(doctorCard(reasons));
    }
    return reasons;
}

// ----- หน้าจอในส่วนเช็กร่างกาย: intro / profile / quiz / result -----
const CHECK_PANES = ["checkIntro", "checkProfile", "checkQuiz", "checkResult"];
let cMode = "intro";
let cItems = [];
let cAnswers = {};
let cCurrent = 0;
let cTimer = null;
let profileAfter = "intro";
const cOptions = document.getElementById("cOptions");
const cNext = document.getElementById("cNext");
const cBack = document.getElementById("cBack");

function showCheckPane(mode) {
    cMode = mode;
    const id = "check" + mode.charAt(0).toUpperCase() + mode.slice(1);
    CHECK_PANES.forEach(function (p) {
        document.getElementById(p).classList.toggle("hidden", p !== id);
    });
    updateProfileLine();
}

// ลิงก์ "แก้ไขข้อมูลนี้" แสดงเมื่อเคยตอบแล้ว
function updateProfileLine() {
    document.getElementById("checkProfileLine").classList.toggle("hidden", loadProfile() === null || cMode === "profile");
}

function checkItemIds() {
    return CHECK_AREAS.map(function (a) { return a.id; }).concat(usedSubstances(loadProfile()));
}

function openProfile(after, noFocus) {
    profileAfter = after;
    const p = loadProfile();
    document.getElementById("profSmoke").checked = Boolean(p && p.smoke);
    document.getElementById("profAlcohol").checked = Boolean(p && p.alcohol);
    document.getElementById("profOther").checked = Boolean(p && p.other);
    document.getElementById("profMsg").textContent = "";
    showCheckPane("profile");
    if (!noFocus) {
        document.getElementById("checkProfile").focus();
    }
}

function saveProfile(list) {
    const first = loadProfile() === null;
    saveData(profileKey(), makeProfile(list));
    if (profileAfter === "quiz") {
        startCheckQuiz();
    } else if (profileAfter === "result" && loadChecks().length) {
        showCheckPane("result");
        renderCheckResult();
        document.getElementById("checkResult").focus();
    } else {
        showCheckPane("intro");
        document.getElementById("checkStart").focus();
    }
    if (!first) {
        document.getElementById("profMsg").textContent = t("profSaved");
    }
    renderOverview();
}

document.getElementById("profNone").addEventListener("click", function () { saveProfile([]); });
document.getElementById("profSkip").addEventListener("click", function () { saveProfile([]); });
document.getElementById("profSave").addEventListener("click", function () {
    saveProfile(SUBSTANCES.filter(function (k) {
        return document.getElementById("prof" + k.charAt(0).toUpperCase() + k.slice(1)).checked;
    }));
});
document.getElementById("checkEditProfile").addEventListener("click", function () {
    clearTimeout(cTimer);
    openProfile(cMode === "result" ? "result" : "intro");
});
document.getElementById("checkStart").addEventListener("click", function () {
    if (loadProfile() === null) {
        openProfile("quiz");             // ครั้งแรก: ถามหน้าเดียวก่อน
    } else {
        startCheckQuiz();
    }
});

function startCheckQuiz() {
    clearTimeout(cTimer);
    cItems = checkItemIds();
    cAnswers = {};
    cCurrent = 0;
    showCheckPane("quiz");
    showCQuestion();
    cOptions.children[0].focus();
}

function areaInfo(id) {
    return CHECK_AREAS.find(function (a) { return a.id === id; }) || null;
}

function showCQuestion() {
    const id = cItems[cCurrent];
    const total = cItems.length;
    document.getElementById("cQuestion").textContent = (cCurrent + 1) + ". " + t("checkQ")[id];
    document.getElementById("cProgressText").textContent = (cCurrent + 1) + "/" + total;
    document.getElementById("cProgressFill").style.width = ((cCurrent + 1) / total * 100) + "%";
    document.getElementById("cMessage").textContent = "";
    const info = areaInfo(id);
    document.getElementById("cRedflag").classList.toggle("hidden", !(info && info.redflag));
    const choices = t("checkScale");
    cOptions.textContent = "";
    for (let i = 0; i < choices.length; i++) {
        const button = el("button", "option", choices[i]);
        button.type = "button";
        const on = cAnswers[id] === i;
        button.setAttribute("aria-pressed", on ? "true" : "false");
        button.classList.toggle("selected", on);
        button.addEventListener("click", function (event) {
            cAnswers[id] = i;
            const fromKeyboard = event.detail === 0;
            showCQuestion();
            if (fromKeyboard) {
                cOptions.children[i].focus();
            }
            cAutoAdvance(cCurrent, fromKeyboard);
        });
        cOptions.appendChild(button);
    }
    cBack.disabled = (cCurrent === 0);
    cNext.textContent = (cCurrent === total - 1) ? t("seeResult") : t("next");
}

// เหมือนแบบประเมินอื่น: ตอบแล้วไปข้อถัดไปเองหลัง 300 มิลลิวินาที ข้อสุดท้ายรอกด "ดูผล"
function cAutoAdvance(index, fromKeyboard) {
    clearTimeout(cTimer);
    cTimer = setTimeout(function () {
        if (cMode !== "quiz" || cCurrent !== index || cAnswers[cItems[index]] === undefined) {
            return;
        }
        if (cCurrent < cItems.length - 1) {
            cCurrent += 1;
            showCQuestion();
            if (fromKeyboard) {
                cOptions.children[0].focus();
            }
        } else if (fromKeyboard) {
            cNext.focus();
        }
    }, AUTO_ADVANCE_MS);
}

cBack.addEventListener("click", function () {
    clearTimeout(cTimer);
    if (cCurrent > 0) {
        cCurrent -= 1;
        showCQuestion();
    }
});

cNext.addEventListener("click", function () {
    clearTimeout(cTimer);
    if (cAnswers[cItems[cCurrent]] === undefined) {
        document.getElementById("cMessage").textContent = t("needAnswer");
        return;
    }
    if (cCurrent < cItems.length - 1) {
        cCurrent += 1;
        showCQuestion();
    } else {
        finishCheck();
    }
});

document.getElementById("cRestart").addEventListener("click", function () {
    startCheckQuiz();
});

function finishCheck() {
    const entry = { d: dateKey(new Date()) };
    cItems.forEach(function (id) {
        entry[id] = cAnswers[id];
    });
    saveCheckEntry(entry);
    addLog("bodycheck", { n: cItems.filter(function (id) { return entry[id] >= CHECK_HIGH; }).length });
    markTask("checkin");                // เช็กร่างกายก็นับเป็นภารกิจข้อ 1
    showCheckPane("result");
    renderCheckResult();
    document.getElementById("checkResult").focus();
    showCheckLast();
    renderOverview();
}

// ไปที่การ์ดพักสั้น แล้วโฟกัสปุ่มเริ่ม (ผู้ใช้กดเริ่มเอง)
function goToReset(id) {
    const card = document.getElementById("reset-" + id);
    if (!card) {
        return;
    }
    card.scrollIntoView({ block: "center" });
    card.querySelector(".reset-btn").focus({ preventScroll: true });
}

// ปุ่มของวิธีดูแล 1 อย่าง
function checkActionButton(action, group) {
    if (action.reset) {
        const b = el("button", "btn btn-outline btn-small", "▶ " + t("resets")[action.reset].t);
        b.type = "button";
        b.dataset.reset = action.reset;
        b.addEventListener("click", function () { goToReset(action.reset); });
        return b;
    }
    if (action.skill) {
        const b = el("button", "btn btn-outline btn-small check-skill-toggle", fill(t("actSkill"), { name: t("skills")[action.skill].t }));
        b.type = "button";
        b.dataset.skill = action.skill;
        b.setAttribute("aria-expanded", "false");
        b.addEventListener("click", function () {
            const open = group.querySelector('.skill-card[data-skill="' + action.skill + '"]');
            if (open) {
                open.remove();
                b.setAttribute("aria-expanded", "false");
                return;
            }
            const card = skillCard(action.skill);
            group.appendChild(card);
            b.setAttribute("aria-expanded", "true");
            card.querySelector("h4").setAttribute("tabindex", "-1");
            card.querySelector("h4").focus();
        });
        return b;
    }
    if (action.anchor) {
        const a = el("a", "btn btn-outline btn-small", t("actTalk"));
        a.href = action.anchor;
        a.addEventListener("click", function () {
            setTimeout(function () { document.getElementById("talk").focus({ preventScroll: true }); }, 0);
        });
        return a;
    }
    return telButton(action.tel);
}

// ข้อความสัญญาณอันตราย (คัดลอกจากกล่องในหน้า ซึ่งเป็นภาษาปัจจุบันแล้ว)
function redflagNode() {
    const p = document.querySelector("#check .redflag-box p").cloneNode(true);
    p.className = "redflag-inline";
    return p;
}

function renderCheckResult() {
    const checks = loadChecks();
    if (!checks.length) {
        showCheckPane("intro");
        return;
    }
    const last = checks[checks.length - 1];
    const prev = checks.length > 1 ? checks[checks.length - 2] : null;
    const used = usedSubstances(loadProfile());
    const ids = CHECK_AREAS.map(function (a) { return a.id; }).concat(used.filter(function (k) { return validLevel(last[k]) !== null; }));
    const scale = t("checkScale");
    const shortDate = function (d) { return safeDate(d + "T12:00:00", { day: "numeric", month: "short" }); };

    // กราฟแท่งแนวนอน: ครั้งนี้เทียบครั้งก่อน (ค่าทุกค่าแปลงเป็นเลข 0–3 ก่อนใช้)
    const chart = document.getElementById("cChart");
    chart.textContent = "";
    const legend = el("p", "check-legend");
    const now = el("span", "lg-now", fill(t("checkThis"), { date: shortDate(last.d) }));
    legend.appendChild(now);
    if (prev) {
        legend.appendChild(el("span", "lg-prev", fill(t("checkPrev"), { date: shortDate(prev.d) })));
    }
    chart.appendChild(legend);
    ids.forEach(function (id) {
        const v = validLevel(last[id]);
        const pv = prev ? validLevel(prev[id]) : null;
        const row = el("div", "check-row" + (v >= CHECK_HIGH ? " high" : ""));
        row.dataset.area = id;
        const info = areaInfo(id);
        row.appendChild(el("span", "check-name", (info ? info.icon + " " : "") + t("checkShort")[id]));
        const bars = el("div", "check-bars");
        const bar = function (value, cls) {
            const track = el("div", "bar-track " + cls);
            const fillEl = el("div", "bar-fill lvl-" + value);
            fillEl.style.width = Math.max(4, value / 3 * 100) + "%";
            track.appendChild(fillEl);
            return track;
        };
        bars.appendChild(bar(v, "now"));
        if (pv !== null) {
            bars.appendChild(bar(pv, "prev"));
        }
        row.appendChild(bars);
        row.appendChild(el("span", "check-vals", pv !== null ?
            fill(t("checkRowFmt"), { a: scale[v], b: scale[pv] }) : fill(t("checkRowFirst"), { a: scale[v] })));
        chart.appendChild(row);
    });
    if (!prev) {
        chart.appendChild(el("p", "disclaimer", t("checkFirst")));
    }

    const high = ids.filter(function (id) { return validLevel(last[id]) >= CHECK_HIGH; });
    document.getElementById("cSummary").textContent = high.length ? fill(t("checkSumSome"), { n: high.length }) : t("checkSumNone");

    // วิธีดูแลที่ตรงกับด้านที่ได้ 2 ขึ้นไป (ด้านละ 1 กลุ่ม)
    const actions = document.getElementById("cActions");
    actions.textContent = "";
    high.forEach(function (id) {
        const group = el("div", "check-action" + (SUBSTANCES.indexOf(id) !== -1 ? " kind" : ""));
        group.dataset.area = id;
        const info = areaInfo(id);
        group.appendChild(el("h4", "", (info ? info.icon + " " : "") + t("checkShort")[id]));
        const p = el("p");
        setTextWithPhones(p, t("checkAdvice")[id]);
        group.appendChild(p);
        if (info && info.redflag) {
            group.appendChild(redflagNode());
        }
        const links = el("div", "skill-links");
        CHECK_ACTIONS[id].forEach(function (a) {
            links.appendChild(checkActionButton(a, group));
        });
        group.appendChild(links);
        actions.appendChild(group);
    });

    renderDoctorInto(document.getElementById("cDoctor"));
}

function showCheckLast() {
    const checks = loadChecks();
    document.getElementById("checkLast").textContent = checks.length ?
        fill(t("checkLast"), { date: safeDate(checks[checks.length - 1].d + "T12:00:00", { day: "numeric", month: "short", year: "numeric" }) }) :
        t("checkNever");
}

// เปลี่ยนภาษา
function refreshCheck() {
    if (cMode === "quiz") {
        showCQuestion();
    } else if (cMode === "result") {
        renderCheckResult();
    }
    showCheckLast();
    updateProfileLine();
}

// เปลี่ยนผู้ใช้: ข้อมูลที่แสดงต้องเป็นของคนใหม่ (คำถามการใช้สารปรับตามข้อมูลของคนนั้น)
function resetCheckFlow() {
    clearTimeout(cTimer);
    if (cMode === "quiz" || cMode === "profile") {
        if (loadProfile() === null) {
            openProfile("quiz", true);
        } else if (cMode === "quiz") {
            const keep = cAnswers;
            cItems = checkItemIds();
            cAnswers = {};
            cItems.forEach(function (id) {
                if (keep[id] !== undefined) {
                    cAnswers[id] = keep[id];
                }
            });
            cCurrent = Math.min(cCurrent, cItems.length - 1);
            showCQuestion();
        } else {
            showCheckPane("intro");
        }
    } else if (cMode === "result") {
        if (loadChecks().length) {
            renderCheckResult();
        } else {
            showCheckPane("intro");
        }
    }
    showCheckLast();
    updateProfileLine();
}

// ----- อารมณ์รายวัน (ใช้ชวนทำ 2Q) -----
function saveMoodDay(mood) {
    if (!MOOD_VALUE.hasOwnProperty(mood)) {
        return;
    }
    const saved = loadData(moodsKey(), {});
    const data = (saved && typeof saved === "object" && !Array.isArray(saved)) ? saved : {};
    data[dateKey(new Date())] = mood;
    Object.keys(data).filter(function (k) { return !validDay(k); }).forEach(function (k) { delete data[k]; });
    Object.keys(data).sort().slice(0, -14).forEach(function (k) { delete data[k]; });
    saveData(moodsKey(), data);
    renderOverview();
}

// จำนวนวันใน 7 วันล่าสุด (รวมวันนี้) ที่เช็กอินว่า "เครียด" หรือ "เครียดมาก"
function lowMoodDays() {
    const saved = loadData(moodsKey(), {});
    const days = {};
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        for (const k in saved) {
            if (validDay(k) && MOOD_VALUE.hasOwnProperty(saved[k])) {
                days[k] = saved[k];
            }
        }
    }
    // สมาชิกที่บันทึกอารมณ์ไว้ก่อนรุ่นนี้: อ่านจากบันทึกกิจกรรมด้วย
    if (currentUser) {
        const log = loadData(logKey(), []);
        (Array.isArray(log) ? log : []).forEach(function (e) {
            if (e && e.type === "mood" && e.data && MOOD_VALUE.hasOwnProperty(e.data.mood) && !isNaN(new Date(e.time).getTime())) {
                const k = dateKey(new Date(e.time));
                if (!days[k]) {
                    days[k] = e.data.mood;
                }
            }
        });
    }
    const today = dateKey(new Date());
    let n = 0;
    for (let i = 0; i < 7; i++) {
        const m = days[addDays(today, -i)];
        if (m === "stressed" || m === "very") {
            n++;
        }
    }
    return n;
}

// ----- ภาพรวมของฉัน (ในภารกิจวันนี้) -----
function loadNudges() {
    const saved = loadData(nudgeKey(), {});
    return (saved && typeof saved === "object" && !Array.isArray(saved)) ? saved : {};
}

function snoozed(kind) {
    const day = validDay(loadNudges()[kind]);
    return Boolean(day) && daysBetween(day, dateKey(new Date())) < CHECK_EVERY_DAYS;
}

function checkDue() {
    const checks = loadChecks();
    const due = !checks.length || daysBetween(checks[checks.length - 1].d, dateKey(new Date())) >= CHECK_EVERY_DAYS;
    return due && !snoozed("check");
}

function depSuggested() {
    const dep = loadDep();
    const recent = dep.length && daysBetween(dep[dep.length - 1].d, dateKey(new Date())) < CHECK_EVERY_DAYS;
    return lowMoodDays() >= 3 && !recent && !snoozed("dep");
}

function addNudge(box, kind, text, href) {
    const row = el("div", "ov-nudge");
    row.dataset.nudge = kind;
    row.appendChild(el("p", "", text));
    const actions = el("div", "skill-links");
    const go = el("a", "btn btn-primary btn-small", t("ovStart"));
    go.href = href;
    const later = el("button", "btn btn-outline btn-small", t("ovLater"));
    later.type = "button";
    later.addEventListener("click", function () {
        const n = loadNudges();
        n[kind] = dateKey(new Date());
        saveData(nudgeKey(), n);
        renderOverview();
        document.getElementById("ovTitle").setAttribute("tabindex", "-1");
        document.getElementById("ovTitle").focus();
    });
    actions.appendChild(go);
    actions.appendChild(later);
    row.appendChild(actions);
    box.appendChild(row);
}

function renderOverview() {
    const nudges = document.getElementById("ovNudges");
    nudges.textContent = "";
    if (checkDue()) {
        addNudge(nudges, "check", t("ovNudgeCheck"), "#check");
    }
    if (depSuggested()) {
        addNudge(nudges, "dep", t("ovNudgeDep"), "#mood-screen");
    }

    const fmt = function (value) { return safeDate(value, { day: "numeric", month: "short", year: "numeric" }); };
    const stress = loadData(historyKey(), []);
    const stressList = (Array.isArray(stress) ? stress : []).filter(function (h) { return h && validScore(h.score) !== null; });
    const burnout = loadBurnout();
    const checks = loadChecks();
    const dep = loadDep();
    const rows = [
        { id: "stress", href: "#assessment", last: stressList.length ? fmt(stressList[stressList.length - 1].time) : null },
        { id: "burnout", href: "#burnout", last: burnout.length ? fmt(burnout[burnout.length - 1].time) : null },
        { id: "check", href: "#check", last: checks.length ? fmt(checks[checks.length - 1].d + "T12:00:00") : null },
        { id: "dep", href: "#mood-screen", last: dep.length ? fmt(dep[dep.length - 1].d + "T12:00:00") : null }
    ];
    const list = document.getElementById("ovList");
    list.textContent = "";
    rows.forEach(function (r) {
        const li = el("li", "ov-row");
        li.dataset.row = r.id;
        li.appendChild(el("span", "ov-name", t("ovNames")[r.id]));
        li.appendChild(el("span", "ov-date", r.last && r.last !== "-" ? fill(t("ovLast"), { date: r.last }) : t("ovNever")));
        const a = el("a", "ov-go", t("ovGo"));
        a.href = r.href;
        a.setAttribute("aria-label", t("ovGo") + " " + t("ovNames")[r.id]);
        li.appendChild(a);
        list.appendChild(li);
    });

    const doc = document.getElementById("ovDoctor");
    doc.textContent = "";
    const reasons = doctorReasons(doctorData());
    if (reasons.length) {
        const details = el("details", "ov-details");
        details.appendChild(el("summary", "", t("ovDocOn")));
        details.appendChild(doctorCard(reasons));
        doc.appendChild(details);
    } else {
        doc.appendChild(el("p", "ov-ok", t("ovDocOff")));
    }
}

// ----- ชวนคนที่ไว้ใจคุย: แม่แบบข้อความ 3 แบบ แก้ได้ ส่งทาง LINE (ไม่เก็บข้อความไว้ที่ไหน) -----
const talkEdits = [null, null, null];      // ข้อความที่แก้แล้ว (หน่วยความจำเท่านั้น) null = ใช้แม่แบบของภาษาปัจจุบัน

function lineShareUrl(text) {
    return "https://line.me/R/share?text=" + encodeURIComponent(text);
}

function renderTalk() {
    const list = document.getElementById("talkList");
    list.textContent = "";
    t("talkTemplates").forEach(function (tpl, i) {
        const item = el("div", "talk-item");
        const label = el("label", "", fill(t("talkLabel"), { n: i + 1 }));
        label.htmlFor = "talk-" + i;
        const box = el("textarea", "note-input talk-text");
        box.id = "talk-" + i;
        box.rows = 2;
        box.maxLength = 500;
        box.value = talkEdits[i] !== null ? talkEdits[i] : tpl;
        const send = el("a", "btn btn-primary btn-small talk-send", t("talkSend"));
        send.target = "_blank";
        send.rel = "noopener";
        send.setAttribute("aria-label", t("talkSend") + " · " + fill(t("talkLabel"), { n: i + 1 }));
        const update = function () {
            const text = box.value.trim();
            if (text === "") {
                send.removeAttribute("href");
                send.setAttribute("aria-disabled", "true");
            } else {
                send.href = lineShareUrl(text);
                send.removeAttribute("aria-disabled");
            }
        };
        box.addEventListener("input", function () {
            talkEdits[i] = box.value;
            update();
        });
        update();
        item.appendChild(label);
        item.appendChild(box);
        item.appendChild(send);
        list.appendChild(item);
    });
}


// ===== 20. คัดกรองภาวะซึมเศร้า 2Q → 9Q (กรมสุขภาพจิต) =====
// hikariDep_ชื่อ = [{"d":"YYYY-MM-DD","q2":[0|1,0|1],"q9":[0–3 x9] | null,"score":n | null}] เก็บ 20 ครั้งล่าสุด
// q2: 1 = มี, 0 = ไม่มี · ไม่มีทั้ง 2 ข้อ = ไม่ทำ 9Q (q9 = null, score = null)
// คัดกรองเบื้องต้น ไม่ใช่การวินิจฉัย · ข้อ 9 ≥ 1 แสดงการ์ดช่วยเหลือ (1323 / 1669 / ห้องฉุกเฉิน / บอกคนที่ไว้ใจ) บนสุดของผล
const dAnswers2 = [];
const dAnswers9 = [];
let dCurrent = 0;
let dTimer = null;
let dShown = null;                  // ผลที่แสดงอยู่
const depQuiz = document.getElementById("depQuiz");
const depResult = document.getElementById("depResult");
const dOptions = document.getElementById("dOptions");
const dNext = document.getElementById("dNext");
const dBack = document.getElementById("dBack");

function depKey() {
    return "hikariDep_" + userSuffix();
}

function depBand(score) {
    if (score < 7) {
        return 0;
    }
    if (score <= 12) {
        return 1;
    }
    if (score <= 18) {
        return 2;
    }
    return 3;
}

// ตรวจและคำนวณคะแนนใหม่จากคำตอบ (ไม่เชื่อคะแนนที่เก็บไว้)
function normDep(e) {
    if (!e || typeof e !== "object" || Array.isArray(e)) {
        return null;
    }
    const d = validDay(e.d);
    if (!d || !Array.isArray(e.q2) || e.q2.length !== DEP_2Q_COUNT || !e.q2.every(function (v) { return v === 0 || v === 1; })) {
        return null;
    }
    let q9 = null;
    let score = null;
    if (Array.isArray(e.q9) && e.q9.length === DEP_9Q_COUNT && e.q9.every(function (v) { return validLevel(v) !== null; })) {
        q9 = e.q9.map(validLevel);
        score = q9.reduce(function (a, b) { return a + b; }, 0);
    }
    if ((e.q2[0] === 1 || e.q2[1] === 1) !== (q9 !== null)) {
        return null;                    // 2Q มีความเสี่ยงต้องมี 9Q และไม่มีความเสี่ยงต้องไม่มี 9Q
    }
    return { d: d, q2: e.q2.slice(), q9: q9, score: score };
}

function loadDep() {
    const saved = loadData(depKey(), []);
    return (Array.isArray(saved) ? saved : []).map(normDep).filter(Boolean);
}

function depResultText(entry) {
    return entry.score === null ? t("depResNone") : fill(t("depResScore"), { score: entry.score, band: t("depBandNames")[depBand(entry.score)] });
}

function depDetail(data) {
    if (!data || typeof data !== "object") {
        return "-";
    }
    if (data.score === null) {
        return t("depResNone");
    }
    const n = Number(data.score);
    return Number.isInteger(n) && n >= 0 && n <= 27 ? fill(t("depResScore"), { score: n, band: t("depBandNames")[depBand(n)] }) : "-";
}

function depRisk() {
    return dAnswers2[0] === 1 || dAnswers2[1] === 1;
}

// ลำดับข้อ: 2Q 2 ข้อ แล้วต่อ 9Q 9 ข้อ ถ้ามีข้อใดตอบ "มี"
function depSteps() {
    const steps = [{ q: 2, i: 0 }, { q: 2, i: 1 }];
    if (depRisk()) {
        for (let i = 0; i < DEP_9Q_COUNT; i++) {
            steps.push({ q: 9, i: i });
        }
    }
    return steps;
}

function showDQuestion() {
    const steps = depSteps();
    dCurrent = Math.min(dCurrent, steps.length - 1);
    const step = steps[dCurrent];
    const is2 = step.q === 2;
    document.getElementById("dSubLabel").textContent = is2 ? t("dep2Label") : t("dep9Label");
    document.getElementById("dQuestion").textContent = (step.i + 1) + ". " + t(is2 ? "dep2Q" : "dep9Q")[step.i];
    document.getElementById("dProgressText").textContent = (is2 ? "2Q " : "9Q ") + (step.i + 1) + "/" + (is2 ? DEP_2Q_COUNT : DEP_9Q_COUNT);
    document.getElementById("dProgressFill").style.width = ((dCurrent + 1) / (DEP_2Q_COUNT + DEP_9Q_COUNT) * 100) + "%";
    document.getElementById("dMessage").textContent = "";
    const labels = is2 ? t("depYesNo") : t("dep9Scale");
    const values = is2 ? [1, 0] : [0, 1, 2, 3];
    const store = is2 ? dAnswers2 : dAnswers9;
    dOptions.textContent = "";
    for (let k = 0; k < labels.length; k++) {
        const button = el("button", "option", labels[k]);
        button.type = "button";
        const on = store[step.i] === values[k];
        button.setAttribute("aria-pressed", on ? "true" : "false");
        button.classList.toggle("selected", on);
        button.addEventListener("click", function (event) {
            store[step.i] = values[k];
            const fromKeyboard = event.detail === 0;
            showDQuestion();
            if (fromKeyboard) {
                dOptions.children[k].focus();
            }
            dAutoAdvance(dCurrent, fromKeyboard);
        });
        dOptions.appendChild(button);
    }
    dBack.disabled = (dCurrent === 0);
    dNext.textContent = (dCurrent === steps.length - 1) ? t("seeResult") : t("next");
}

function dAnswered(step) {
    return (step.q === 2 ? dAnswers2 : dAnswers9)[step.i] !== undefined;
}

function dAutoAdvance(index, fromKeyboard) {
    clearTimeout(dTimer);
    dTimer = setTimeout(function () {
        const steps = depSteps();
        if (dCurrent !== index || !depResult.classList.contains("hidden") || !dAnswered(steps[index])) {
            return;
        }
        if (dCurrent < steps.length - 1) {
            dCurrent += 1;
            showDQuestion();
            if (fromKeyboard) {
                dOptions.children[0].focus();
            }
        } else if (fromKeyboard) {
            dNext.focus();
        }
    }, AUTO_ADVANCE_MS);
}

dBack.addEventListener("click", function () {
    clearTimeout(dTimer);
    if (dCurrent > 0) {
        dCurrent -= 1;
        showDQuestion();
    }
});

dNext.addEventListener("click", function () {
    clearTimeout(dTimer);
    const steps = depSteps();
    if (!dAnswered(steps[dCurrent])) {
        document.getElementById("dMessage").textContent = t("needAnswer");
        return;
    }
    if (dCurrent < steps.length - 1) {
        dCurrent += 1;
        showDQuestion();
    } else {
        finishDep();
    }
});

function finishDep() {
    const risk = depRisk();
    const q9 = risk ? dAnswers9.slice(0, DEP_9Q_COUNT) : null;
    const entry = {
        d: dateKey(new Date()),
        q2: [dAnswers2[0], dAnswers2[1]],
        q9: q9,
        score: q9 ? q9.reduce(function (a, b) { return a + b; }, 0) : null
    };
    const list = loadDep();
    list.push(entry);
    saveData(depKey(), list.slice(-20));
    addLog("depscreen", { score: entry.score });
    markTask("checkin");
    dShown = entry;
    depQuiz.classList.add("hidden");
    depResult.classList.remove("hidden");
    renderDResult();
    depResult.focus();
    renderOverview();
}

function renderDResult() {
    if (!dShown) {
        return;
    }
    const entry = dShown;
    const crisis = entry.q9 !== null && entry.q9[DEP_SELF_HARM_ITEM] >= 1;
    document.getElementById("depCrisis").classList.toggle("hidden", !crisis);
    const box = document.getElementById("dScoreBox");
    const self = document.getElementById("dSelfCare");
    if (entry.score === null) {
        box.classList.add("hidden");
        self.classList.remove("hidden");
    } else {
        const band = depBand(entry.score);
        box.className = "burnout-score dep-score band-" + band;
        box.querySelector(".bs-name").textContent = t("depScoreName");
        box.querySelector(".bs-num").textContent = entry.score;
        box.querySelector(".bs-band").textContent = t("depBandNames")[band];
        box.querySelector(".bar-fill").style.width = (entry.score / 27 * 100) + "%";
        // คิดเรื่องความตาย/ทำร้ายตัวเอง แต่คะแนนรวมต่ำ: ไม่บอกว่า "ไม่มีอาการ" ให้ชวนขอความช่วยเหลือแทน
        if (crisis && band === 0) {
            box.querySelector(".bs-band").textContent = "";
            setTextWithPhones(box.querySelector(".bs-meaning"), t("depCrisisLow"));
        } else {
            setTextWithPhones(box.querySelector(".bs-meaning"), t("depMeaning")[band]);
        }
        self.classList.add("hidden");
    }
    renderDoctorInto(document.getElementById("dDoctor"));
    const list = document.getElementById("dHistory");
    list.textContent = "";
    loadDep().slice(-5).forEach(function (h) {
        historyItem(list, safeDate(h.d + "T12:00:00", { day: "numeric", month: "short" }) + " · " + depResultText(h));
    });
    showDepLast();
}

function showDepLast() {
    const dep = loadDep();
    const box = document.getElementById("depLast");
    if (!dep.length) {
        box.textContent = t("depNever");
        return;
    }
    const last = dep[dep.length - 1];
    box.textContent = fill(t("depLast"), { date: safeDate(last.d + "T12:00:00", { day: "numeric", month: "short", year: "numeric" }), result: depResultText(last) });
}

function refreshDep() {
    if (depResult.classList.contains("hidden")) {
        showDQuestion();
    } else {
        renderDResult();
    }
    showDepLast();
}

function restartDep() {
    clearTimeout(dTimer);
    dAnswers2.length = 0;
    dAnswers9.length = 0;
    dCurrent = 0;
    dShown = null;
    depResult.classList.add("hidden");
    depQuiz.classList.remove("hidden");
    showDQuestion();
}

// เปลี่ยนผู้ใช้: คำตอบและผลของคนก่อนไม่แสดงต่อ
function resetDepFlow() {
    restartDep();
    showDepLast();
}

document.getElementById("dRestart").addEventListener("click", function () {
    restartDep();
    dOptions.children[0].focus();
});


// ===== 10. เริ่มทำงานเมื่อเปิดหน้าเว็บ =====

// แสดงปุ่มแบบสอบถามเฉพาะเมื่อใส่ลิงก์ไว้แล้ว
if (SURVEY_URL !== "") {
    document.getElementById("surveyLink").href = SURVEY_URL;
    document.getElementById("feedback").classList.remove("hidden");
}
setupContact();
setupInAppNotice();
loadGoogle();
applyLanguage();
