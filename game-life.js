// =====================================================================
// Hikari สวนแสง - game-life.js (v26) "สวนที่มีชีวิต"
// เพิ่มความเคลื่อนไหวเบา ๆ ในฉาก ไม่แย่งความสนใจจากน้อง:
//   กลางวัน  = กลีบดอกไม้/ใบไม้ปลิวช้า ๆ + ผีเสื้อบินผ่านเป็นครั้งคราว
//   เย็น     = ฝุ่นแสงสีทองลอยขึ้น
//   กลางคืน  = หิ่งห้อยกะพริบช้า ๆ
//   ทริปแสง  = ประกายแสงลอยเบา ๆ
//   วันที่เช็กอินว่าเศร้า/เครียด = ฝนพรำบาง ๆ ในฉาก (เหมือนสวนอยู่ข้าง ๆ เรา ไม่ได้ทำให้มืดหม่น)
// เคารพการตั้งค่า "ลดการเคลื่อนไหว" ของเครื่อง และหยุดเมื่อสลับไปแอปอื่น
// อ่านค่า S (สถานะเกม) อย่างเดียว ไม่เขียน
// =====================================================================
(function () {
    const stage = document.getElementById("stage");
    if (!stage) return;
    const calmMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const layer = document.createElement("div");
    layer.className = "life";
    layer.setAttribute("aria-hidden", "true");
    const bg = document.getElementById("stageBg");
    stage.insertBefore(layer, bg ? bg.nextSibling : stage.firstChild);   // อยู่หลังน้องและคำพูด แต่อยู่หน้าภาพพื้นหลัง

    let lastKey = "", butterflyTimer = null;

    function hour() { return new Date().getHours(); }
    function phase() {
        const h = hour();
        return (h >= 20 || h < 6) ? "night" : (h >= 17 ? "evening" : "day");
    }
    function state() {
        const g = (typeof S !== "undefined" && S) ? S : {};
        const mood = g.mood && g.day ? g.mood[g.day] : null;
        return { world: g.world || "cat", phase: phase(), rainy: mood === "sad" || mood === "stressed" };
    }
    function rand(a, b) { return a + Math.random() * (b - a); }
    function add(cls, style) {
        const el = document.createElement("i");
        el.className = cls;
        for (const k in style) el.style.setProperty(k, style[k]);
        layer.appendChild(el);
        return el;
    }

    function build() {
        const st = state();
        const key = st.world + "|" + st.phase + "|" + st.rainy;
        if (key === lastKey) return;
        lastKey = key;
        layer.innerHTML = "";
        layer.className = "life life-" + st.phase + " life-" + st.world + (st.rainy ? " life-rain" : "");
        clearTimeout(butterflyTimer);
        if (calmMotion) return;                       // แสงสีของช่วงเวลายังอยู่ แต่ไม่มีอะไรขยับ

        if (st.world === "trip") {
            for (let i = 0; i < 10; i++) add("sparkle", { "--x": rand(4, 96) + "%", "--y": rand(20, 85) + "%", "--d": rand(5, 9) + "s", "--delay": -rand(0, 9) + "s", "--s": rand(4, 8) + "px" });
        } else if (st.phase === "night") {
            for (let i = 0; i < 9; i++) add("firefly", { "--x": rand(5, 95) + "%", "--y": rand(35, 90) + "%", "--d": rand(7, 12) + "s", "--delay": -rand(0, 12) + "s", "--dx": rand(-30, 30) + "px", "--dy": rand(-26, 10) + "px" });
        } else if (st.phase === "evening") {
            for (let i = 0; i < 10; i++) add("mote", { "--x": rand(0, 100) + "%", "--d": rand(9, 15) + "s", "--delay": -rand(0, 15) + "s", "--s": rand(3, 6) + "px" });
        } else {
            const kind = st.world === "dog" ? "leaf" : "petal";
            for (let i = 0; i < 7; i++) add(kind, { "--x": rand(-5, 95) + "%", "--d": rand(10, 17) + "s", "--delay": -rand(0, 17) + "s", "--dx": rand(30, 90) + "px", "--r": rand(180, 540) + "deg", "--s": rand(11, 17) + "px" });
            scheduleButterfly();
        }
        if (st.rainy) {
            for (let i = 0; i < 34; i++) add("drop", { "--x": rand(0, 100) + "%", "--d": rand(1.1, 1.8) + "s", "--delay": -rand(0, 2) + "s", "--h": rand(10, 18) + "px" });
        }
    }
    function scheduleButterfly() {
        butterflyTimer = setTimeout(function () {
            if (!document.hidden && state().phase === "day") {
                const b = add("butterfly", { "--y": rand(18, 55) + "%", "--d": rand(9, 13) + "s", "--hue": rand(-25, 25) + "deg" });
                b.innerHTML = "<b></b><b></b>";
                b.addEventListener("animationend", function () { b.remove(); });
            }
            scheduleButterfly();
        }, rand(14000, 30000));
    }

    document.addEventListener("visibilitychange", function () { layer.classList.toggle("paused", document.hidden); });
    // ตรวจทุก 20 วินาที: เปลี่ยนโลก ช่วงเวลา หรืออารมณ์วันนี้ แล้วค่อยวาดใหม่ (ไม่กระตุก)
    setTimeout(build, 600);
    setInterval(build, 20000);
    document.addEventListener("click", function () { setTimeout(build, 400); });   // เช่น หลังเช็กอินอารมณ์ หรือเปลี่ยนโลก
    window.HikariLife = { refresh: function () { lastKey = ""; build(); } };
})();
