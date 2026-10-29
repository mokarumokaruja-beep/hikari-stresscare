// =====================================================================
// Hikari สวนแสง - game-pet.js  "น้องมีชีวิต"
// - น้องเดินเล่นเอง เปลี่ยนท่า บิดขี้เกียจ นอนหงาย กลางคืนหลับ (มี Zzz)
// - แตะ = ทักทาย กระโดด มีหัวใจ · ลากนิ้วบนตัว = ลูบ (น้องอ้อน เสียงคราง)
// - แตะพื้น = น้องเดินไปตรงนั้น · โยนบอล · ให้ขนม · เรียกน้องมาใกล้ ๆ
// - เช็กอินว่าเศร้า/เครียด → น้องเดินมาใกล้ ปลอบ และชวนพักสั้นก่อน (แตะคำพูดเพื่อเปิดพักสั้น)
// - คำทักตามช่วงเวลาทำงาน (เช้าก่อนงาน พักเที่ยง บ่ายง่วง เลิกงาน ดึก วันจันทร์ เย็นวันศุกร์ วันหยุด)
// - ความผูกพัน (Lv.) เพิ่มจากการเล่นด้วยกัน
// - เลือกเรื่องครอบครัว → น้องชวนคุยกับคนที่ไว้ใจ (แตะคำพูดเพื่อไปเลือกข้อความ) · ชวนเช็กใจ/เช็กร่างกายเบา ๆ ผ่าน Pet.say
// ใช้ตัวแปรและฟังก์ชันจาก game.js (S, save, t, img, $, petName, addLight, toast, showTab, audioCtx, workMoment, openQuick, openTalk)
// =====================================================================

const Pet = (function () {
    const stage = $("stage"), el = $("petBtn"), body = $("petBody"), flip = $("petFlip"), pimg = $("petImg");
    const fxBox = $("fx"), toyEl = $("toy"), say = $("petSay");
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DAILY_BOND = 40;              // แต้มผูกพันสูงสุดต่อวัน (กันกดรัว)

    let active = false, mode = "idle", pos = { x: 50, y: 9 }, thinkTimer = null, sayTimer = null, zzzTimer = null;
    let walkTimer = null, petTimer = null, purr = null, lastBondAt = 0, lastTapAt = 0;

    if (S.bond === undefined) S.bond = 0;
    if (S.petSound === undefined) S.petSound = true;

    // ---------- เครื่องมือ ----------
    function rand(a, b) { return a + Math.random() * (b - a); }
    function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
    function night() { return timeOfDay() === "night"; }
    function line(kind) {
        const lines = (PET_LINES[L] || PET_LINES.en)[kind];
        return pick(lines).split("{s}").join((PET_VOICE[L] || PET_VOICE.en)[S.world]).split("{pet}").join(petName());
    }
    // คำทักตามช่วงเวลาทำงาน ถ้าไม่มีช่วงพิเศษใช้คำทักปกติ · พักเที่ยง/บ่ายง่วง แตะคำพูดเพื่อเปิดพักสั้น
    function workSpeak(fallback, ms) {
        const k = workMoment();
        if (!k) { speak(line(fallback), ms); return; }
        speak(line(k), ms, (k === "lunch" || k === "slump") ? function () { openQuick(); } : null);
    }
    function defaultSay() {
        if (mode === "sleep") return t("sleeping", { pet: petName() });
        return S.today.pet ? t("hello", { pet: petName() }) : t("petTap", { pet: petName() });
    }
    function speak(text, ms, onTap) {
        clearTimeout(sayTimer);
        say.textContent = text;
        say.classList.remove("pop");
        void say.offsetWidth;
        say.classList.add("pop");
        say.classList.toggle("link", !!onTap);
        say.onclick = onTap || null;
        sayTimer = setTimeout(function () {
            say.textContent = defaultSay();
            say.classList.remove("link");
            say.onclick = null;
        }, ms || 3600);
    }

    // ---------- ท่าทาง / ตำแหน่ง ----------
    function setPose(name) {
        const src = img(WORLDS[S.world].pet[name] || WORLDS[S.world].pet.sit);
        if (pimg.getAttribute("src") !== src) pimg.src = src;
    }
    function setAnim(name) {
        body.className = "pet-body" + (name ? " " + name : "");
        if (name === "hop" || name === "squish" || name === "wiggle") {
            void body.offsetWidth;
        }
    }
    function restAnim() {
        if (mode === "sleep") return "sleep";
        return S.world === "trip" ? "float" : "";
    }
    function place(x, y, seconds) {
        pos.x = Math.max(16, Math.min(84, x));
        pos.y = Math.max(3, Math.min(16, y));
        el.style.setProperty("--walk", (seconds || 0) + "s");
        el.style.setProperty("--depth", (1.1 - (pos.y - 3) * 0.022).toFixed(3));
        el.style.left = pos.x + "%";
        el.style.bottom = pos.y + "%";
    }
    function face(dx) {
        if (Math.abs(dx) > 1) flip.classList.toggle("left", dx < 0);
    }
    // เดินไปที่ (x, y) แล้วเรียก done
    function walkTo(x, y, done, speed) {
        clearTimeout(walkTimer);
        const dx = x - pos.x, dy = y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy * 4);
        if (dist < 2 || reduced) {
            place(x, y, 0);
            if (done) done();
            return;
        }
        const sec = Math.max(0.35, Math.min(3.2, dist / (speed || 22)));
        mode = "walk";
        face(dx);
        setPose("stretch");
        setAnim(S.world === "small" ? "hopwalk" : (S.world === "trip" ? "float" : "walk"));
        place(x, y, sec);
        walkTimer = setTimeout(function () {
            mode = "idle";
            setPose("sit");
            setAnim(restAnim());
            if (done) done();
        }, sec * 1000);
    }
    function hop() {
        setAnim("hop");
        setTimeout(function () { if (mode !== "walk") setAnim(restAnim()); }, 600);
    }

    // ---------- เอฟเฟกต์ ----------
    function petPoint() {
        const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
        return { x: (r.left + r.width / 2 - s.left) / s.width * 100, y: (r.top + r.height * 0.25 - s.top) / s.height * 100 };
    }
    function fx(kind, n, at) {
        const p = at || petPoint();
        const chars = { heart: "♥", note: "♪", zzz: "z", spark: "✦", crumb: "•" };
        for (let i = 0; i < (n || 1); i++) {
            const sp = document.createElement("span");
            sp.className = kind;
            sp.textContent = kind === "zzz" ? (i % 2 ? "Z" : "z") : chars[kind];
            sp.style.left = (p.x + rand(-8, 8)) + "%";
            sp.style.top = (p.y + rand(-4, 6)) + "%";
            sp.style.setProperty("--dx", rand(-30, 30) + "px");
            sp.style.animationDelay = (i * 0.12) + "s";
            fxBox.appendChild(sp);
            setTimeout(function () { sp.remove(); }, 2800);
        }
    }

    // ---------- เสียงน้อง (สร้างด้วย Web Audio) ----------
    function tone(type, f0, f1, dur, vol, filterHz) {
        const ctx = audioCtx();
        if (!ctx || !S.petSound) return;
        const o = ctx.createOscillator(), g = ctx.createGain(), now = ctx.currentTime;
        o.type = type;
        o.frequency.setValueAtTime(f0, now);
        o.frequency.exponentialRampToValueAtTime(f1, now + dur * 0.6);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(vol, now + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        let node = o;
        if (filterHz) { const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = filterHz; f.Q.value = 1.4; node = o.connect(f); }
        node.connect(g).connect(ctx.destination);
        o.start(now); o.stop(now + dur + 0.05);
    }
    function voice() {
        if (S.world === "cat") { tone("sawtooth", 620, 900, 0.5, 0.12, 1300); setTimeout(function () { tone("sawtooth", 880, 560, 0.35, 0.08, 1200); }, 180); }
        else if (S.world === "dog") { tone("square", 330, 190, 0.16, 0.08, 900); setTimeout(function () { tone("square", 300, 180, 0.16, 0.07, 900); }, 210); }
        else if (S.world === "small") { tone("sine", 1500, 2100, 0.12, 0.08); setTimeout(function () { tone("sine", 1700, 2300, 0.1, 0.06); }, 140); }
        else { tone("sine", 880, 1320, 0.9, 0.1); tone("sine", 1320, 1760, 1.1, 0.05); }
    }
    function startPurr() {
        const ctx = audioCtx();
        if (!ctx || !S.petSound || purr) return;
        const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
        const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = S.world === "cat" ? 170 : 420;
        const am = ctx.createGain(); am.gain.value = 0.4;
        const lfo = ctx.createOscillator(), depth = ctx.createGain();
        lfo.frequency.value = S.world === "cat" ? 24 : 6; depth.gain.value = 0.35;
        lfo.connect(depth).connect(am.gain);
        const out = ctx.createGain(); out.gain.value = 0;
        out.gain.linearRampToValueAtTime(S.world === "cat" ? 0.9 : 0.25, ctx.currentTime + 0.4);
        src.connect(lp).connect(am).connect(out).connect(ctx.destination);
        src.start(); lfo.start();
        purr = { src: src, lfo: lfo, out: out };
    }
    function stopPurr() {
        if (!purr) return;
        const p = purr, ctx = audioCtx();
        purr = null;
        p.out.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        setTimeout(function () { try { p.src.stop(); p.lfo.stop(); } catch (e) { /* หยุดแล้ว */ } }, 400);
    }
    function crunch() {
        const ctx = audioCtx();
        if (!ctx || !S.petSound) return;
        for (let i = 0; i < 3; i++) setTimeout(function () { tone("triangle", 260, 140, 0.08, 0.06, 700); }, i * 160);
    }
    function buzz() { if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) { /* บางเครื่องไม่รองรับ */ } } }

    // ---------- ความผูกพัน ----------
    function bondLevel(points) {
        let lv = 1;
        BOND_LEVELS.forEach(function (need, i) { if (points >= need) lv = i + 1; });
        return lv;
    }
    function renderBond() {
        const lv = bondLevel(S.bond);
        const from = BOND_LEVELS[lv - 1], to = BOND_LEVELS[lv] || from;
        $("bondLv").textContent = "♥ " + t("bond", { n: lv });
        $("bondBar").style.width = (to > from ? Math.round((S.bond - from) / (to - from) * 100) : 100) + "%";
    }
    function addBond(n) {
        const now = Date.now();
        if (now - lastBondAt < 900) return;           // กดรัวไม่นับ
        lastBondAt = now;
        S.today.bond = S.today.bond || 0;
        if (S.today.bond >= DAILY_BOND) return;
        const before = bondLevel(S.bond);
        S.bond += n;
        S.today.bond += n;
        save();
        renderBond();
        const after = bondLevel(S.bond);
        if (after > before) {
            fx("spark", 6);
            toast(t("bondUp", { pet: petName(), n: after }));
        }
    }
    function firstPetToday() {
        rolloverCheck();                          // เปิดค้างข้ามคืน: เริ่มภารกิจของวันใหม่ก่อน
        if (!S.today.pet) {
            S.today.pet = true;
            addLight(1);
            renderTasks();
            toast(t("petGain", { pet: petName(), n: 1 }));
        }
    }

    // ---------- พฤติกรรมอัตโนมัติ ----------
    function schedule(ms) {
        clearTimeout(thinkTimer);
        if (active) thinkTimer = setTimeout(think, ms);
    }
    function think() {
        if (!active || mode === "pet" || mode === "busy" || mode === "walk") { schedule(2500); return; }
        if (night()) { goSleep(); return; }
        if (reduced) { schedule(8000); return; }
        const r = Math.random();
        const v = !$("visitorBtn").hidden;
        if (r < 0.38) {
            walkTo(rand(20, 80), rand(4, 15), function () { schedule(rand(2500, 5000)); });
            return;
        }
        if (r < 0.48 && v) {
            walkTo(62, rand(6, 10), function () {
                face(1);
                fx("heart", 2);
                const vb = $("visitorBtn");
                vb.classList.remove("hop"); void vb.offsetWidth; vb.classList.add("hop");
                if (Math.random() < 0.5) speak(line("friend"), 3000);
                schedule(rand(3000, 5000));
            });
            return;
        }
        if (r < 0.6) { doPose("stretch", 2200); }
        else if (r < 0.72) { doPose("belly", 3500); fx("heart", 1); }
        else if (r < 0.82) { doPose("play", 1600); hop(); }
        else if (r < 0.9) { face(Math.random() < 0.5 ? -5 : 5); }
        else {
            if (Math.random() < 0.5 && workMoment()) workSpeak("idle", 3600); else speak(line("idle"), 3000);
            if (Math.random() < 0.5) fx("note", 2);
        }
        schedule(rand(3500, 6500));
    }
    function doPose(name, ms) {
        mode = "busy";
        setPose(name);
        setAnim(name === "play" ? "hop" : "squish");
        setTimeout(function () {
            if (mode === "busy") { mode = "idle"; setPose("sit"); setAnim(restAnim()); }
        }, ms);
    }
    function goSleep() {
        mode = "sleep";
        setPose("sleep");
        setAnim("sleep");
        say.textContent = defaultSay();
        clearInterval(zzzTimer);
        zzzTimer = setInterval(function () { if (active && mode === "sleep") fx("zzz", 2); }, 2600);
        schedule(30000);
    }
    function wake() {
        clearInterval(zzzTimer);
        mode = "idle";
        setPose("sit");
        setAnim(restAnim());
        hop();
        if (workMoment() === "lateNight") speak(line("lateNight"), 4500); else speak(line("wake"), 3500);
        schedule(12000);                          // ถ้ายังกลางคืน อีกสักพักจะกลับไปหลับ
    }

    // ---------- การเล่นด้วยกัน ----------
    function react() {
        if (mode === "sleep") { wake(); firstPetToday(); addBond(1); return; }
        if (mode === "walk") { clearTimeout(walkTimer); place(petCurrentX(), pos.y, 0); }
        mode = "busy";
        setPose(pick(["happy", "play", "happy", "belly"]));
        hop();
        voice();
        buzz();
        fx("heart", 3);
        speak(line("tap"), 3200);
        firstPetToday();
        addBond(1);
        setTimeout(function () { if (mode === "busy") { mode = "idle"; setPose("sit"); setAnim(restAnim()); } }, 2600);
        schedule(5000);
    }
    function petCurrentX() {
        const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
        return (r.left + r.width / 2 - s.left) / s.width * 100;
    }
    function startPetting() {
        if (mode === "sleep") { clearInterval(zzzTimer); }
        clearTimeout(walkTimer);
        mode = "pet";
        el.classList.add("petting");
        setPose("happy");
        startPurr();
        speak(line("pet"), 4000);
        firstPetToday();
        clearInterval(petTimer);
        petTimer = setInterval(function () { fx("heart", 1); addBond(1); }, 450);
    }
    function stopPetting() {
        clearInterval(petTimer);
        el.classList.remove("petting");
        stopPurr();
        if (mode === "pet") { mode = "idle"; setPose("sit"); setAnim(restAnim()); }
        schedule(4000);
    }

    let down = null;
    el.addEventListener("pointerdown", function (e) {
        down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, t: Date.now(), moved: 0, petting: false };
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ไม่รองรับ */ }
        audioCtx();
    });
    el.addEventListener("pointermove", function (e) {
        if (!down) return;
        down.moved += Math.abs(e.clientX - down.lx) + Math.abs(e.clientY - down.ly);   // ระยะที่ลากนิ้ว (ใช้ได้ทั้งเมาส์และนิ้ว)
        down.lx = e.clientX;
        down.ly = e.clientY;
        if (!down.petting && down.moved > 45) { down.petting = true; startPetting(); }
    });
    function endPointer() {
        if (!down) return;
        const d = down;
        down = null;
        if (d.petting) stopPetting();
        else if (Date.now() - d.t < 600 && Date.now() - lastTapAt > 250) { lastTapAt = Date.now(); react(); }
    }
    el.addEventListener("pointerup", endPointer);
    el.addEventListener("pointercancel", function () { if (down && down.petting) stopPetting(); down = null; });
    el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); react(); }
    });

    // แตะพื้น → น้องเดินไปตรงนั้น
    stage.addEventListener("click", function (e) {
        if (e.target.closest(".pet, .visitor, .stage-say, .bond-chip")) return;
        if (mode === "pet") return;
        const r = stage.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width * 100;
        const yFromBottom = (r.bottom - e.clientY) / r.height * 100;
        if (mode === "sleep") { wake(); return; }
        walkTo(x, Math.min(16, Math.max(3, yFromBottom - 6)), function () {
            if (Math.random() < 0.4) { fx("note", 1); }
            schedule(rand(3000, 5000));
        }, 26);
    });

    // โยนบอล: บอลลอยไปไกล น้องวิ่งไปคาบ แล้ววิ่งกลับมา
    function playBall() {
        if (!active || mode === "pet") return;
        if (mode === "sleep") wake();
        audioCtx();
        const tx = pos.x < 50 ? rand(62, 84) : rand(16, 38), ty = rand(5, 14);
        toyEl.className = "toy ball";
        toyEl.hidden = false;
        toyEl.style.left = pos.x + "%";
        toyEl.style.bottom = (pos.y + 18) + "%";
        void toyEl.offsetWidth;
        toyEl.classList.add("flying");
        toyEl.style.left = tx + "%";
        toyEl.style.bottom = ty + "%";
        mode = "busy";
        speak(line("play"), 2600);
        setTimeout(function () {
            walkTo(tx, ty, function () {
                toyEl.hidden = true;
                toyEl.classList.remove("flying");
                setPose("play");
                hop();
                voice();
                fx("spark", 3);
                addBond(2);
                firstPetToday();
                setTimeout(function () {
                    walkTo(50, 6, function () {
                        setPose("happy"); hop(); fx("heart", 3);
                        speak(line("play"), 3000);
                        setTimeout(function () { if (mode === "idle") setPose("sit"); }, 1800);
                        schedule(6000);
                    }, 30);
                }, 700);
            }, 34);
        }, 450);
    }
    // ให้ขนม: ขนมวางข้างหน้า น้องเดินมากิน
    function giveTreat() {
        if (!active || mode === "pet") return;
        if (mode === "sleep") wake();
        audioCtx();
        const tx = Math.max(22, Math.min(78, pos.x + (pos.x > 50 ? -20 : 20))), ty = Math.max(3, pos.y - 2);
        toyEl.className = "toy treat";
        toyEl.hidden = false;
        toyEl.style.left = tx + "%";
        toyEl.style.bottom = ty + "%";
        mode = "busy";
        walkTo(tx + (tx > pos.x ? -6 : 6), ty + 1, function () {
            face(tx - pos.x);
            mode = "busy";
            setPose("sit");
            setAnim("wiggle");
            crunch();
            fx("crumb", 4, { x: tx, y: 100 - ty - 6 });
            setTimeout(function () {
                toyEl.hidden = true;
                setPose("happy");
                hop();
                fx("heart", 4);
                speak(line("eat"), 3000);
                addBond(2);
                firstPetToday();
                setTimeout(function () { mode = "idle"; setPose("sit"); setAnim(restAnim()); }, 1500);
                schedule(6000);
            }, 1600);
        }, 24);
    }
    // เรียกน้อง: วิ่งมาตรงกลางด้านหน้า
    function call() {
        if (!active || mode === "pet") return;
        if (mode === "sleep") { wake(); return; }
        audioCtx();
        walkTo(50, 3, function () {
            face(Math.random() < 0.5 ? -5 : 5);
            setPose("happy"); hop(); voice(); fx("heart", 2);
            speak(line("call"), 3000);
            firstPetToday();
            addBond(1);
            setTimeout(function () { if (mode === "idle") setPose("sit"); }, 1800);
            schedule(7000);
        }, 34);
    }
    function renderSoundBtn() {
        $("playSound").setAttribute("aria-pressed", String(!!S.petSound));
        $("playSoundTxt").textContent = S.petSound ? t("petSoundOn") : t("petSoundOff");
    }
    $("playBall").addEventListener("click", playBall);
    $("playTreat").addEventListener("click", giveTreat);
    $("playCall").addEventListener("click", call);
    $("playSound").addEventListener("click", function () {
        S.petSound = !S.petSound;
        save();
        renderSoundBtn();
        if (S.petSound) voice();
    });

    // ---------- เข้า/ออกหน้าบ้าน ----------
    function enter() {
        renderBond();
        renderSoundBtn();
        pimg.alt = petName();
        el.setAttribute("aria-label", t("petTap", { pet: petName() }));
        if (active) {
            if (mode === "idle") setPose("sit");
            return;
        }
        active = true;
        toyEl.hidden = true;
        if (night()) {
            place(rand(35, 65), 8, 0);
            goSleep();
            return;
        }
        // วิ่งเข้ามาจากขอบฉาก แล้วทักทาย
        mode = "idle";
        setPose("sit");
        setAnim(restAnim());
        say.textContent = defaultSay();
        if (reduced) {
            place(50, 8, 0);
            schedule(4000);
            return;
        }
        place(8, 8, 0);
        setTimeout(function () {
            walkTo(50, 8, function () {
                hop();
                fx("heart", 2);
                workSpeak("greet", 4500);
                const mood = S.mood[S.day];
                if (mood === "sad" || mood === "stressed") setTimeout(function () { onMood(mood); }, 3800);
                schedule(5000);
            }, 30);
        }, 250);
    }
    function leave() {
        active = false;
        clearTimeout(thinkTimer);
        clearTimeout(walkTimer);
        clearInterval(zzzTimer);
        clearInterval(petTimer);
        stopPurr();
        fxBox.innerHTML = "";
    }
    // เช็กอินอารมณ์แล้วน้องตอบสนอง
    function onMood(id) {
        if (!active) return;
        if (id === "sad" || id === "stressed") {
            if (mode === "sleep") wake();
            walkTo(50, 3, function () {
                setPose("sit");
                setAnim("squish");
                fx("heart", 4);
                speak(line("comfort") + " " + t("tapQuick"), 9000, function () { openQuick(); });
                addBond(1);
                schedule(9000);
            }, 30);
        } else if (id === "great" || id === "good") {
            if (mode === "sleep") wake();
            setPose("happy"); hop(); voice(); fx("spark", 3);
            speak(line("happyMood"), 3000);
            schedule(5000);
        }
    }
    function greetVisitor() {
        if (!active) return;
        walkTo(60, 7, function () { face(1); setPose("happy"); hop(); fx("heart", 3); speak(line("friend"), 3000); schedule(5000); }, 30);
    }
    document.addEventListener("visibilitychange", function () {
        if (document.hidden) { if (active) { leave(); Pet._wasActive = true; } }
        else if (Pet._wasActive && !$("screen-home").hidden) { Pet._wasActive = false; enter(); }
    });

    // น้องพูด (เช่น คำแนะนำหลังเลือกเรื่องที่หนักใจ) ถ้าอยู่หน้าบ้าน · onTap = แตะคำพูดแล้วทำต่อ (เช่น ไปชวนคนที่ไว้ใจคุย)
    function sayLine(text, onTap) {
        if (!active) return;
        if (mode === "sleep") wake();
        setPose("happy"); hop(); fx("heart", 2);
        speak(text, onTap ? 9000 : 7000, onTap || null);
        schedule(7000);
    }
    return { enter: enter, leave: leave, onMood: onMood, greetVisitor: greetVisitor, say: sayLine, _wasActive: false };
})();

// game.js วาดหน้าบ้านไปก่อนไฟล์นี้โหลด จึงเริ่มน้องตรงนี้ถ้าหน้าบ้านเปิดอยู่
if (S.world && !$("screen-home").hidden) Pet.enter();
