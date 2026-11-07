// =====================================================================
// Hikari สวนแสง - game-play.js  "เล่นกับน้องให้มีชีวิตชีวา" (v28)
// - ชีวิตตอนอยู่เฉย ๆ: เอียงหัว กะพริบตา (ย่อตัว) กระดิกตัว หูกระตุก จังหวะสุ่ม ไม่ซ้ำ (หลับ = หายใจช้าอย่างเดียว)
// - โยนบอล: แตะปุ่ม หรือลาก/สะบัดจากปุ่ม/จากบอลที่วางอยู่ → บอลลอยโค้งตามแรงโน้มถ่วง เด้ง 2–3 ครั้ง กลิ้งแล้วหยุด
//   น้องย่อตัวเตรียม วิ่ง (เอนตัวตามทาง) ตะครุบ คาบกลับมาวางตรงหน้า · บางทีแกล้งวิ่งหนี / นอนหงายกอดบอล
//   เล่นต่อเนื่อง = ตื่นเต้นขึ้น (เร็วขึ้น กระดิกเร็วขึ้น ประกายมากขึ้น) · แตะน้องระหว่างวิ่ง = หยุดหันมามอง
// - ให้อาหาร: ชามหล่นเด้งลงพื้น น้องเดินมาดม เคี้ยว (เศษขนม + "งั่ม") เลียปาก หัวใจ แล้วอิ่มสักพัก (บอกว่าอิ่ม ไม่กินไม่หยุด)
// - ลูบ: เอนตัวตามทิศนิ้ว ถูแก้มเข้าหานิ้ว ตัวสั่นเบา ๆ ตอนคราง หัวใจออกตรงนิ้ว · ลูบตอนหลับ = หลับต่อ ยิ้มในฝัน
// - เสียงสังเคราะห์เบา ๆ (เด้ง "ปก" เคี้ยว ร้องดีใจ) เคารพปุ่มเสียงน้อง (S.petSound) · สั่นเบา ๆ เฉพาะเครื่องที่รองรับ
// - ลดการเคลื่อนไหว (prefers-reduced-motion): ข้ามท่าโค้ง/เด้ง แสดงผลลัพธ์สุดท้ายเลย
// - นิสัยต่างกันตามน้อง: แมวว่องไว หมาเด้งดึ๋ง กระต่ายกระโดด นกกระพือปีก ช้างช้าหนัก ฮิคาริลอย
// ใช้ Pet._api จาก game-pet.js และตัวแปร/ฟังก์ชันจาก game.js (S, L, save, petName, audioCtx, PET_VOICE)
// ไม่มีเงินใหม่ ไม่มีพลังงาน ไม่มีหลอดหิว · แต้มผูกพันยังใช้ addBond เดิม (มีเพดานต่อวันเท่าเดิม)
// =====================================================================

const PetPlay = (function () {
    let A = null;                                   // Pet._api (ผูกเมื่อ attach)
    const reducedMQ = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    function reduced() { return !!(reducedMQ && reducedMQ.matches); }
    const FULL_MS = 3 * 60 * 1000;                  // อิ่มสักพักหลังกินขนม
    const COMBO_MS = 25000;                         // โยนบอลต่อกันภายในเวลานี้ = ตื่นเต้นขึ้น

    // ---------- คำพูดใหม่ 10 ภาษา (ไม่มีคำไหน ใช้ภาษาอังกฤษ / คำพูดเดิมของน้อง) ----------
    const PLAY_LINES = {
        th: {
            chase: ["บอล! บอล!", "เดี๋ยวไปเอามาให้!", "{s} รอแป๊บนะ!"],
            keepAway: ["จับให้ได้สิ~ {s}", "ฮิฮิ ยังไม่ให้หรอก!"],
            look: ["หืม? {s}", "เรียกเหรอ? อยู่นี่แล้ว"],
            full: ["อิ่มแล้วล่ะ ขอบคุณนะ {s}", "พุงอิ่มแปล้เลย ลูบหัวแทนได้ไหม", "ไว้ทีหลังนะ ยังอิ่มอยู่เลย {s}"],
            combo: ["อีก! อีก! {s}", "วันนี้สนุกที่สุดเลย {s}", "เห็นไหม จับได้แล้ว! {s}"],
            dream: ["Zzz… ♥", "(ยิ้มในฝัน)"],
            nom: ["งั่ม", "งั่ม ๆ", "หง่ำ"]
        },
        en: {
            chase: ["Ball! Ball!", "I'll get it!", "{s} Wait for me!"],
            keepAway: ["Catch me if you can~ {s}", "Hehe, not yet!"],
            look: ["Hm? {s}", "You called? I'm right here"],
            full: ["I'm full, thank you {s}", "Tummy's happy. Pet me instead?", "Maybe later, still full {s}"],
            combo: ["Again! Again! {s}", "Best day ever {s}", "Did you see that? {s}"],
            dream: ["Zzz… ♥", "(smiling in its sleep)"],
            nom: ["nom", "nom nom", "munch"]
        },
        zh: {
            chase: ["球!球!", "我去捡!", "{s} 等等我!"],
            keepAway: ["来抓我呀~ {s}", "嘿嘿,还不给你!"],
            look: ["嗯? {s}", "你叫我吗?我在这儿"],
            full: ["吃饱啦,谢谢你 {s}", "肚子好满足,摸摸我好吗?", "等一下再吃吧,还饱着呢 {s}"],
            combo: ["再来!再来! {s}", "今天太开心了 {s}", "看到了吗? {s}"],
            dream: ["Zzz… ♥", "(在梦里笑了)"],
            nom: ["吧唧", "啊呜", "嚼嚼"]
        },
        hi: {
            chase: ["गेंद! गेंद!", "मैं लाता हूँ!", "{s} रुको, मैं आया!"],
            keepAway: ["पकड़ो तो जानें~ {s}", "हीही, अभी नहीं!"],
            look: ["हम्म? {s}", "बुलाया? मैं यहीं हूँ"],
            full: ["पेट भर गया, धन्यवाद {s}", "पेट खुश है। बदले में सहला दो?", "बाद में, अभी पेट भरा है {s}"],
            combo: ["फिर से! फिर से! {s}", "आज सबसे मज़ेदार दिन है {s}", "देखा तुमने? {s}"],
            dream: ["Zzz… ♥", "(नींद में मुस्कुरा रहा है)"],
            nom: ["चप", "चप चप", "नम"]
        },
        es: {
            chase: ["¡Pelota! ¡Pelota!", "¡Voy por ella!", "{s} ¡Espérame!"],
            keepAway: ["¡Atrápame si puedes~ {s}", "¡Jiji, todavía no!"],
            look: ["¿Mm? {s}", "¿Me llamaste? Aquí estoy"],
            full: ["Ya comí, gracias {s}", "Mi pancita está feliz. ¿Mejor unos mimos?", "Quizás luego, sigo lleno {s}"],
            combo: ["¡Otra! ¡Otra! {s}", "¡El mejor día! {s}", "¿Viste eso? {s}"],
            dream: ["Zzz… ♥", "(sonríe dormido)"],
            nom: ["ñam", "ñam ñam", "ñom"]
        },
        fr: {
            chase: ["La balle ! La balle !", "J'y vais !", "{s} Attends-moi !"],
            keepAway: ["Attrape-moi si tu peux~ {s}", "Hihi, pas encore !"],
            look: ["Hm ? {s}", "Tu m'as appelé ? Je suis là"],
            full: ["J'ai bien mangé, merci {s}", "Mon ventre est content. Un câlin plutôt ?", "Plus tard, je n'ai plus faim {s}"],
            combo: ["Encore ! Encore ! {s}", "Quelle belle journée {s}", "Tu as vu ça ? {s}"],
            dream: ["Zzz… ♥", "(sourit en dormant)"],
            nom: ["miam", "miam miam", "crunch"]
        },
        ar: {
            chase: ["الكرة! الكرة!", "سأحضرها!", "{s} انتظرني!"],
            keepAway: ["امسكني إن استطعت~ {s}", "هيهي، ليس بعد!"],
            look: ["همم؟ {s}", "هل ناديتني؟ أنا هنا"],
            full: ["شبعت، شكرًا لك {s}", "بطني سعيد. ما رأيك أن تربّت عليّ بدلًا من ذلك؟", "لاحقًا، ما زلت شبعان {s}"],
            combo: ["مرة أخرى! مرة أخرى! {s}", "أجمل يوم {s}", "هل رأيت ذلك؟ {s}"],
            dream: ["Zzz… ♥", "(يبتسم في نومه)"],
            nom: ["هام", "هام هام", "نم"]
        },
        pt: {
            chase: ["Bolinha! Bolinha!", "Eu pego!", "{s} Me espera!"],
            keepAway: ["Me pega se puder~ {s}", "Hehe, ainda não!"],
            look: ["Hm? {s}", "Me chamou? Estou aqui"],
            full: ["Já comi, obrigado {s}", "Barriguinha feliz. Que tal um carinho?", "Mais tarde, ainda estou cheio {s}"],
            combo: ["De novo! De novo! {s}", "Melhor dia de todos {s}", "Viu essa? {s}"],
            dream: ["Zzz… ♥", "(sorrindo dormindo)"],
            nom: ["nhac", "nhac nhac", "nham"]
        },
        ru: {
            chase: ["Мячик! Мячик!", "Сейчас принесу!", "{s} Подожди меня!"],
            keepAway: ["Догони меня~ {s}", "Хи-хи, пока не отдам!"],
            look: ["М? {s}", "Звал? Я здесь"],
            full: ["Я наелся, спасибо {s}", "Животик доволен. Может, погладишь?", "Попозже, я ещё сыт {s}"],
            combo: ["Ещё! Ещё! {s}", "Лучший день {s}", "Видел? {s}"],
            dream: ["Zzz… ♥", "(улыбается во сне)"],
            nom: ["ням", "ням-ням", "хрум"]
        },
        ja: {
            chase: ["ボール!ボール!", "とってくるね!", "{s} 待ってて!"],
            keepAway: ["つかまえてごらん~ {s}", "えへへ、まだだよ!"],
            look: ["ん? {s}", "呼んだ?ここにいるよ"],
            full: ["おなかいっぱい、ありがとう {s}", "おなかが満足。かわりになでてくれる?", "またあとでね、まだおなかいっぱい {s}"],
            combo: ["もっかい!もっかい! {s}", "今日はさいこう {s}", "見てた? {s}"],
            dream: ["Zzz… ♥", "(ねむりながらにっこり)"],
            nom: ["もぐ", "もぐもぐ", "はむ"]
        }
    };
    function lang() { return (typeof L !== "undefined" && PLAY_LINES[L]) ? L : (typeof L !== "undefined" && L === "th" ? "th" : "en"); }
    function say(kind, fallback) {
        const d = PLAY_LINES[lang()] || PLAY_LINES.en;
        const list = d[kind] || PLAY_LINES.en[kind];
        if (!list) return A.line(fallback || "tap");
        const voices = (typeof PET_VOICE !== "undefined") ? (PET_VOICE[L] || PET_VOICE.en || {}) : {};
        return pick(list).split("{s}").join(voices[S.world] || "").split("{pet}").join(petName()).trim();
    }

    // ---------- นิสัยน้องแต่ละตัว ----------
    // speed = ความเร็ววิ่ง (หน่วยเดียวกับ walkTo) · gait = ท่าวิ่ง (CSS) · lean = เอนตัวตอนวิ่ง (องศา)
    // crouch = ย่อตัวเตรียมกี่ ms · belly = มีท่านอนหงายจริง · keep = โอกาสแกล้งวิ่งหนี · mouth = จุดคาบบอล [x, y] สัดส่วนจากรูป
    // hop = เด้งตอนดีใจ (คูณ) · ex = ความตื่นเต้นพื้นฐาน · idle = น้ำหนักท่าตอนอยู่เฉย ๆ
    const PROFILES = {
        cat: { speed: 40, gait: "cat", lean: 7, crouch: 560, belly: true, keep: 0.3, mouth: [0.3, 0.44], ex: 0, sprite: false,
            idle: { tilt: 3, blink: 3, wag: 3, twitch: 3, peek: 1 }, chirp: [700, 1050] },
        dog: { speed: 46, gait: "dog", lean: 9, crouch: 380, belly: true, keep: 0.4, mouth: [0.3, 0.42], ex: 1, sprite: true,
            idle: { wag: 6, tilt: 3, peek: 2, blink: 1, bounce: 2 }, chirp: [420, 640] },
        small: { speed: 30, gait: "hop", lean: 4, crouch: 420, belly: false, keep: 0.25, mouth: [0.06, 0.58], ex: 0, sprite: false,
            idle: { nose: 5, twitch: 3, tilt: 2, blink: 2 }, chirp: [1500, 2100] },
        bird: { speed: 36, gait: "flutter", lean: 5, crouch: 300, belly: false, keep: 0.25, mouth: [0.18, 0.4], ex: 0, sprite: false,
            idle: { flutter: 4, tilt: 4, blink: 2, peek: 2 }, chirp: [1800, 2600] },
        elephant: { speed: 17, gait: "heavy", lean: 2, crouch: 700, belly: false, keep: 0.1, mouth: [0.3, 0.6], ex: 0, sprite: false,
            idle: { sway: 4, twitch: 3, blink: 2 }, chirp: [260, 420] },
        turtle: { speed: 12, gait: "heavy", lean: 1, crouch: 700, belly: false, keep: 0, mouth: [0.32, 0.55], ex: 0, sprite: false,
            idle: { sway: 3, blink: 3, peek: 2 }, chirp: [500, 700] },
        trip: { speed: 32, gait: "float", lean: 5, crouch: 300, belly: false, keep: 0.2, mouth: [0, -0.06], ex: 0, sprite: false,
            idle: { glow: 4, sway: 3, tilt: 2, blink: 2 }, chirp: [1180, 1770] }
    };
    const SPRITE_KIND = { mew: "cat", pip: "dog", bunny: "small", bird: "bird", elephant: "elephant", turtle: "turtle", hikari: "trip" };
    function kind() {
        if (PROFILES[S.world]) return S.world;
        const w = WORLDS[S.world], sp = w && w.pet && w.pet.sit ? String(w.pet.sit).split("_")[0] : "";
        return SPRITE_KIND[sp] || "cat";
    }
    function P() { return PROFILES[kind()]; }

    // ---------- เครื่องมือ ----------
    function rand(a, b) { return a + Math.random() * (b - a); }
    function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    // v28: ฉากกว้าง (game-world.js) → แปลง % ของ "จอที่เห็น" เป็น % ของโลก ให้บอลตกในที่ที่มองเห็น
    function view() {
        try {
            const B = Pet.bounds;
            if (B && B.center && B.ratio > 1.05) { const w = 100 / B.ratio; return { a: B.center() - w / 2, w: w, x0: B.x0, x1: B.x1 }; }
        } catch (e) { /* ยังไม่มี Pet */ }
        return null;
    }
    function vx(p) { const v = view(); return v ? clamp(v.a + p / 100 * v.w, v.x0, v.x1) : p; }
    function vmid() { const v = view(); return v ? v.a + v.w / 2 : 50; }
    function host() { return A.el.parentNode; }
    function hostRect() { return host().getBoundingClientRect(); }
    function facing() { return A.flip.classList.contains("left") ? -1 : 1; }
    // ตำแหน่งน้องที่เห็นจริงตอนนี้ (หน่วย % ของฉากเดียวกับ left/bottom)
    function petNow() {
        const h = hostRect(), r = A.el.getBoundingClientRect();
        return { x: (r.left + r.width / 2 - h.left) / h.width * 100, y: (h.bottom - r.bottom) / h.height * 100 };
    }
    // จุดบนหน้าจอ → % ของกล่องเอฟเฟกต์ (fx ใช้ % ของ stage)
    function stagePct(cx, cy) {
        const s = A.stage.getBoundingClientRect();
        return { x: (cx - s.left) / s.width * 100, y: (cy - s.top) / s.height * 100 };
    }
    function haptic(ms) {
        if (reduced() || !navigator.vibrate) return;
        if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
        try { navigator.vibrate(ms); } catch (e) { /* ไม่รองรับ */ }
    }

    // ---------- เสียง (Web Audio · เบามาก · ปิดตามปุ่มเสียงน้อง) ----------
    let noiseBuf = null;
    function ctxOK() {
        if (!S.petSound || document.hidden) return null;
        return audioCtx();
    }
    function blip(type, f0, f1, dur, vol, at) {
        const ctx = ctxOK();
        if (!ctx) return;
        const o = ctx.createOscillator(), g = ctx.createGain(), now = ctx.currentTime + (at || 0);
        o.type = type;
        o.frequency.setValueAtTime(f0, now);
        o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), now + dur * 0.8);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(vol, now + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        o.connect(g).connect(ctx.destination);
        o.start(now); o.stop(now + dur + 0.03);
    }
    function noise(dur, vol, hz, q, at) {
        const ctx = ctxOK();
        if (!ctx) return;
        if (!noiseBuf) {
            noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
            const d = noiseBuf.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        }
        const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), now = ctx.currentTime + (at || 0);
        src.buffer = noiseBuf;
        f.type = "bandpass"; f.frequency.value = hz; f.Q.value = q || 1.2;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(vol, now + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        src.connect(f).connect(g).connect(ctx.destination);
        src.start(now, Math.random() * 0.3); src.stop(now + dur + 0.02);
    }
    const sfx = {
        pok: function (k) { const v = 0.025 + 0.05 * clamp(k, 0, 1); blip("sine", 340, 150, 0.11, v); noise(0.03, v * 0.6, 2400, 0.8); },
        whoosh: function () { noise(0.22, 0.025, 900, 0.6); },
        munch: function () { noise(0.06, 0.05, rand(1100, 1700), 1.4); blip("triangle", 190, 120, 0.06, 0.025); },
        lick: function () { blip("sine", 1400, 2000, 0.06, 0.025); },
        clink: function () { blip("sine", 1650, 1600, 0.35, 0.025); blip("sine", 2480, 2450, 0.25, 0.012); },
        sniff: function () { noise(0.07, 0.02, 3200, 2, 0); noise(0.07, 0.02, 3200, 2, 0.12); },
        chirp: function () {
            const c = P().chirp;
            blip("sine", c[0], c[1], 0.13, 0.05);
            blip("sine", c[0] * 1.2, c[1] * 1.25, 0.15, 0.04, 0.12);
        },
        sparkle: function () { [0, 0.07, 0.14].forEach(function (d, i) { blip("sine", 1800 + i * 400, 1900 + i * 400, 0.18, 0.015, d); }); }
    };

    // ---------- ลำดับเหตุการณ์ (ยกเลิกได้ทั้งชุด) ----------
    let sess = null;
    function newSess(type) {
        endSess();
        sess = { type: type, timers: [], dead: false };
        return sess;
    }
    function endSess() {
        if (!sess) return;
        sess.dead = true;
        sess.timers.forEach(function (id) { clearTimeout(id); clearInterval(id); });
        sess = null;
        runOff();
        stopMunch();
        if (A) A.el.classList.remove("pp-eating");
    }
    function later(s, ms, fn) {
        const id = setTimeout(function () { if (!s.dead) fn(); }, ms);
        s.timers.push(id);
        return id;
    }
    function every(s, ms, fn) {
        const id = setInterval(function () { if (!s.dead) fn(); }, ms);
        s.timers.push(id);
        return id;
    }
    function busy() { return !!sess; }

    // ท่าเล็ก ๆ บนรูปน้อง (เอียงหัว ย่อตัว ดม เคี้ยว ฯลฯ) · ท่าเดียวต่อครั้ง
    const ACT_CLASSES = ["lf-tilt", "lf-blink", "lf-wag", "lf-twitch", "lf-peek", "lf-nose", "lf-flutter", "lf-sway", "lf-glow", "lf-bounce",
        "pp-crouch", "pp-pounce", "pp-roll", "pp-sniff", "pp-munch", "pp-lick", "pp-look", "pp-tease", "pp-content", "pp-perk", "pp-shake"];
    let actTimer = null;
    function act(name, ms) {
        const im = A.pimg;
        clearTimeout(actTimer);
        ACT_CLASSES.forEach(function (c) { im.classList.remove(c); });
        if (!name || reduced()) return;
        void im.offsetWidth;
        im.classList.add(name);
        if (ms) actTimer = setTimeout(function () { im.classList.remove(name); }, ms);
    }

    // ท่าวิ่ง: เอนตัวไปทางที่วิ่ง + จังหวะเท้าตามนิสัยน้อง
    function runOn(dx, speedMul) {
        const p = P();
        A.el.dataset.pf = kind();
        A.el.classList.add("pp-run");
        A.el.style.setProperty("--lean", (Math.abs(dx) > 1 ? Math.sign(dx) * p.lean : 0) + "deg");
        A.el.style.setProperty("--gx", (1 / (speedMul || 1)).toFixed(2));
    }
    function runOff() {
        if (!A) return;
        A.el.classList.remove("pp-run");
        A.el.style.setProperty("--lean", "0deg");
    }
    function runTo(s, x, y, speed, done) {
        const dx = x - A.pos().x;
        runOn(dx, speed / P().speed);
        let trail = null;
        if (P().gait === "float" || P().gait === "flutter") trail = every(s, 260, function () { A.fx("spark", 1); });
        A.walkTo(x, y, function () {
            clearInterval(trail);
            if (s.dead) return;
            A.mode("busy");
            runOff();
            done();
        }, speed);
    }
    // หยุดน้องตรงตำแหน่งที่เห็นอยู่ตอนนี้ (ระหว่างวิ่ง)
    function halt() {
        A.stopWalk();
        const n = petNow();
        A.place(n.x, n.y, 0);
        runOff();
    }

    // ---------- บอล: ฟิสิกส์ 2.5 มิติ (x = ซ้ายขวา %, y = ลึก %, z = สูงจากพื้น px) ----------
    const ball = { st: "hidden", x: 50, y: 4, z: 0, rot: 0, frames: null, t0: 0, raf: 0, onRest: null, last: -1, restTimer: null, hitAt: -1, hitK: 0 };
    let ballIn = null, ballSq = null, shadow = null;
    function ballSize() { return Math.round(clamp(A.stage.clientWidth * 0.085, 24, 44)); }
    function ensureBall() {
        const t = A.toyEl;
        if (t.parentNode !== host()) host().insertBefore(t, A.el);
        if (!ballIn || ballIn.parentNode !== ballSq || ballSq.parentNode !== t) {
            t.innerHTML = "";
            ballSq = document.createElement("span"); ballSq.className = "pp-ball-sq";
            ballIn = document.createElement("span"); ballIn.className = "pp-ball-in";
            ballSq.appendChild(ballIn);
            t.appendChild(ballSq);
        }
        if (!shadow || shadow.parentNode !== host()) {
            shadow = document.createElement("span");
            shadow.className = "pp-ball-shadow";
            shadow.hidden = true;
            host().insertBefore(shadow, t);
        }
        t.className = "toy ball pp-ball";
        t.style.width = ballSize() + "px";
        t.hidden = false;
    }
    function depth(y) { return 1.1 - (y - 3) * 0.022; }
    function drawBall(sq, sy) {
        const t = A.toyEl, d = depth(ball.y);
        t.style.left = ball.x + "%";
        t.style.bottom = "calc(" + ball.y.toFixed(2) + "% + " + ball.z.toFixed(1) + "px)";
        t.style.setProperty("--d", d.toFixed(3));
        ballSq.style.transform = "scale(" + (sq || 1).toFixed(3) + "," + (sy || 1).toFixed(3) + ")";
        ballIn.style.transform = "rotate(" + ball.rot.toFixed(2) + "rad)";
        const behind = ball.st !== "carry" && ball.y > A.pos().y + 0.6;
        t.style.zIndex = ball.st === "carry" ? 4 : (behind ? 2 : 4);
        if (ball.st === "carry") { shadow.hidden = true; return; }
        shadow.hidden = false;
        const k = 1 / (1 + ball.z / 60);
        shadow.style.left = ball.x + "%";
        shadow.style.bottom = ball.y.toFixed(2) + "%";
        shadow.style.width = ballSize() + "px";
        shadow.style.transform = "translate(-50%, 50%) scale(" + (d * k).toFixed(3) + ")";
        shadow.style.opacity = (0.9 * k).toFixed(2);
    }
    // จำลองล่วงหน้าทั้งเส้นทาง → รู้ว่าบอลจะหยุดที่ไหน เมื่อไร (น้องวิ่งไปดักได้พอดี)
    function simulate(s, v) {
        const H = hostRect().height || 400, W = hostRect().width || 360;
        const g = H * 3.4, rpx = ballSize() / 2, dt = 1 / 60;
        let x = s.x, y = s.y, z = s.z, vx = v.vx, vy = v.vy, vz = v.vz, rot = s.rot || 0, bounces = 0, rolling = z <= 0 && vz <= 0;
        const frames = [];
        for (let i = 0; i < 360; i++) {
            let hit = 0;
            if (!rolling) {
                vz -= g * dt; z += vz * dt;
                if (z <= 0 && vz < 0) {
                    z = 0; hit = clamp(-vz / (H * 2.2), 0.05, 1);
                    vz = -vz * 0.52; vx *= 0.78; vy *= 0.6; bounces++;
                    if (vz < H * 0.3 || bounces >= 3) { vz = 0; rolling = true; }
                }
            } else {
                const k = Math.exp(-3.6 * dt); vx *= k; vy *= k;
            }
            x += vx * dt; y += vy * dt;
            if (x < 10) { x = 10; vx = Math.abs(vx) * 0.5; }
            if (x > 90) { x = 90; vx = -Math.abs(vx) * 0.5; }
            if (y < 2) { y = 2; vy = Math.abs(vy) * 0.4; }
            if (y > 15) { y = 15; vy = -Math.abs(vy) * 0.4; }
            rot += (vx * W / 100 * dt) / rpx;
            frames.push({ x: x, y: y, z: z, rot: rot, hit: hit, vz: vz });
            if (rolling && Math.abs(vx) < 2.2 && Math.abs(vy) < 1.2) break;
        }
        const end = frames[frames.length - 1];
        return { frames: frames, T: frames.length / 60, end: end };
    }
    // หาแรงโยนให้ไปตกแถว (tx, ty)
    function aim(s, tx, ty, vz) {
        let vx = (tx - s.x) / 1.6, vy = (ty - s.y) / 1.6, sim = null;
        for (let i = 0; i < 4; i++) {
            sim = simulate(s, { vx: vx, vy: vy, vz: vz });
            const ex = sim.end.x - s.x, ey = sim.end.y - s.y;
            if (Math.abs(ex) > 0.5) vx *= clamp((tx - s.x) / ex, 0.5, 2);
            if (Math.abs(ey) > 0.3) vy *= clamp((ty - s.y) / ey, 0.5, 2);
        }
        return { vx: vx, vy: vy, vz: vz };
    }
    function fly(sim, onRest) {
        cancelAnimationFrame(ball.raf);
        clearTimeout(ball.restTimer);
        ball.frames = sim.frames; ball.t0 = performance.now(); ball.last = -1; ball.st = "fly"; ball.onRest = onRest;
        ball.hitAt = -1;
        setReady(false);
        if (reduced()) {
            const e = sim.end;
            ball.x = e.x; ball.y = e.y; ball.z = 0; ball.rot = e.rot;
            drawBall();
            rest();
            return;
        }
        ball.raf = requestAnimationFrame(tick);
    }
    function tick(now) {
        if (ball.st !== "fly") return;
        const fr = ball.frames, i = Math.max(0, Math.min(fr.length - 1, Math.floor((now - ball.t0) / 1000 * 60)));   // เวลาเฟรมแรกอาจก่อน t0 เล็กน้อย
        const H = hostRect().height || 400;
        for (let j = ball.last + 1; j <= i; j++) {
            if (fr[j].hit) { ball.hitAt = now; ball.hitK = fr[j].hit; sfx.pok(fr[j].hit); if (fr[j].hit > 0.35) haptic(10); }
        }
        ball.last = i;
        const f = fr[i];
        ball.x = f.x; ball.y = f.y; ball.z = f.z; ball.rot = f.rot;
        let sx = 1, sy = 1;
        const since = now - ball.hitAt;
        if (ball.hitAt > 0 && since < 110) {          // บี้ตอนกระทบพื้น
            const a = 0.3 * ball.hitK * (1 - since / 110);
            sx = 1 + a; sy = 1 - a;
        } else if (f.z > 1) {                          // ยืดตอนลอยเร็ว
            const st = Math.min(0.14, Math.abs(f.vz) / (H * 14));
            sx = 1 - st * 0.6; sy = 1 + st;
        }
        drawBall(sx, sy);
        if (i >= fr.length - 1) { rest(); return; }
        ball.raf = requestAnimationFrame(tick);
    }
    function rest() {
        ball.st = "rest";
        ball.z = 0;
        drawBall();
        const cb = ball.onRest;
        ball.onRest = null;
        if (cb) cb();
    }
    // บอลวางอยู่: แตะ/สะบัดเพื่อโยนได้ · ไม่มีใครเล่นสักพักก็เก็บ
    function setReady(on) {
        const t = A.toyEl;
        t.classList.toggle("ready", !!on);
        clearTimeout(ball.restTimer);
        if (on) ball.restTimer = setTimeout(function () { if (ball.st === "rest" && !busy()) hideBall(true); }, 40000);
    }
    function hideBall(fade) {
        cancelAnimationFrame(ball.raf);
        clearTimeout(ball.restTimer);
        ball.st = "hidden";
        if (!A) return;
        const t = A.toyEl;
        if (fade && !reduced()) {
            t.classList.add("pp-fade");
            if (shadow) shadow.hidden = true;
            setTimeout(function () { if (ball.st === "hidden") { t.hidden = true; t.classList.remove("pp-fade"); } }, 450);
        } else {
            t.hidden = true;
            if (shadow) shadow.hidden = true;
        }
        t.classList.remove("ready");
    }
    // คาบบอล: บอลติดปากน้องทุกเฟรม (ขยับตามจังหวะวิ่ง)
    let mouthAdj = null;
    function carry(anchor) {
        cancelAnimationFrame(ball.raf);
        ball.st = "carry";
        mouthAdj = anchor || null;
        setReady(false);
        const loop = function () {
            if (ball.st !== "carry") return;
            const h = hostRect(), r = A.pimg.getBoundingClientRect(), er = A.el.getBoundingClientRect();
            const m = mouthAdj || P().mouth, f = facing(), bs = ballSize() * 0.85;
            const mx = r.left + r.width * (0.5 + f * m[0]), my = r.top + r.height * m[1];
            ball.x = (mx - h.left) / h.width * 100;
            ball.y = (h.bottom - er.bottom) / h.height * 100;
            ball.z = Math.max(0, er.bottom - my - bs / 2);
            ball.rot += 0;
            drawBall(0.85, 0.85);
            ball.raf = requestAnimationFrame(loop);
        };
        loop();
        A.toyEl.style.visibility = "";
    }
    function hideCarried(on) { A.toyEl.style.visibility = on ? "hidden" : ""; }
    function drop(after) {
        if (ball.st !== "carry") { if (after) after(); return; }
        cancelAnimationFrame(ball.raf);
        hideCarried(false);
        const f = facing();
        const sim = simulate({ x: ball.x, y: ball.y, z: ball.z, rot: ball.rot }, { vx: f * rand(6, 12), vy: rand(-3, -1), vz: (hostRect().height || 400) * 0.35 });
        fly(sim, function () { setReady(true); if (after) after(); });
    }

    // ---------- โยนบอล ----------
    let combo = 0, lastPlayEnd = 0;
    // ปุ่มโยนบอล (แตะ = โยนให้ไกลจากน้อง)
    function throwAuto(from) {
        const pn = A.mode() === "walk" ? petNow() : A.pos(), H = hostRect().height || 400;
        const s = from || { x: vx(50 + rand(-8, 8)), y: 1.5, z: H * 0.28, rot: 0 };
        const tx = vx(pn.x < vmid() ? rand(62, 84) : rand(16, 38)), ty = rand(7, 14);
        startThrow(s, aim(s, tx, ty, H * rand(1.5, 1.9)));
    }
    // สะบัดนิ้ว: ความเร็วนิ้ว (px/s) → แรงโยน
    function throwFlick(from, gvx, gvy) {
        const h = hostRect(), H = h.height || 400, W = h.width || 360;
        const up = clamp(-gvy, 0, 2600), k = clamp((up - 150) / 1800, 0, 1);
        const v = {
            vx: clamp(gvx / W * 100 * 0.45, -80, 80),
            vy: up > 150 ? 4 + 16 * k : rand(-1, 2),
            vz: up > 150 ? H * (0.9 + 1.3 * k) : H * 0.2
        };
        startThrow(from, v);
    }
    function ballBtnStart() {
        const H = hostRect().height || 400;
        return { x: 50 + rand(-5, 5), y: 1.5, z: H * 0.28, rot: 0 };
    }
    function startThrow(from, v) {
        if (!A || !A.active() || A.mode() === "pet") return;
        if (A.mode() === "sleep") {                     // ตื่นก่อน บิดขี้เกียจ แล้วค่อยเล่น
            A.wake();
            const s0 = newSess("wake");
            later(s0, reduced() ? 0 : 900, function () { endSess(); startThrow(from, v); });
            return;
        }
        if (ball.st === "carry") hideCarried(false);
        const s = newSess("ball");
        if (A.mode() === "walk") halt();
        A.mode("busy");
        A.schedule(30000);
        const now = Date.now();
        combo = (now - lastPlayEnd < COMBO_MS) ? combo + 1 : 1;
        const p = P(), ex = Math.min(4, combo - 1 + p.ex);
        A.el.style.setProperty("--ex", ex);
        ensureBall();
        const sim = simulate(from, v);
        sfx.whoosh();
        haptic(12);
        fly(sim, null);

        const R = sim.end, me = A.pos();
        let side = Math.sign(R.x - me.x) || facing();
        A.face(R.x - me.x);
        // ย่อตัวเตรียมวิ่ง (แมว = ท่าก้มเตรียมตะครุบ ส่ายก้น · หมา = เด้งเห่า · กระต่าย = กระทืบเท้า)
        if (kind() === "cat") A.setPose("stretch"); else A.setPose("happy");
        act("pp-crouch", p.crouch + 200);
        if (kind() === "dog") A.voice();
        if (Math.random() < 0.45) A.speak(say("chase"), 2200);
        // ตามดูบอลระหว่างรอ
        const look = every(s, 120, function () { if (A.mode() === "busy") A.face(ball.x - A.pos().x); });

        const off = petHalfW() * 0.55 + 2;
        const tx = clamp(R.x - side * off, 12, 88), ty = clamp(R.y + 0.3, 3, 16);
        const spd = p.speed * (1 + 0.08 * ex);
        const dist = Math.sqrt(Math.pow(tx - me.x, 2) + Math.pow((ty - me.y) * 2, 2));
        const dur = clamp(dist / spd, 0.35, 3.2) * 1000;
        const T = sim.T * 1000;
        // ออกวิ่งหลังย่อตัวเสร็จ ไม่รอนานเกินไป (ถ้าถึงก่อนก็ยืนจ้องบอลกลิ้งมา)
        const startAt = reduced() ? 300 : clamp(T - dur, p.crouch, p.crouch + 450);
        later(s, startAt, function () {
            clearInterval(look);
            act(null);
            runTo(s, tx, ty, spd, function () {
                waitRest(s, function () { pounce(s, ex); });
            });
        });
    }
    function petHalfW() {
        const h = hostRect(), r = A.el.getBoundingClientRect();
        return r.width / 2 / (h.width || 1) * 100;
    }
    function waitRest(s, fn) {
        if (ball.st !== "fly") { fn(); return; }
        // มาถึงก่อนบอลหยุด: ย่อตัวจ้องบอล พร้อมตะครุบ
        A.face(ball.x - A.pos().x);
        A.setPose(kind() === "cat" ? "stretch" : "happy");
        act("pp-crouch");
        const id = every(s, 60, function () { if (ball.st !== "fly") { clearInterval(id); fn(); } });
    }
    function pounce(s, ex) {
        const p = P();
        A.face(ball.x - A.pos().x);
        A.setPose("play");
        act("pp-pounce", 520);
        later(s, reduced() ? 0 : 260, function () {
            sfx.pok(0.4);
            sfx.chirp();
            haptic(15);
            A.fx("spark", 2 + ex);
            if (ex >= 2) sfx.sparkle();
            carry();
            if (p.sprite) { hideCarried(true); }      // รูปหมามีบอลในปากอยู่แล้ว
            A.addBond(2);
            A.firstPetToday();
        });
        later(s, reduced() ? 400 : 900, function () {
            if (p.belly && !reduced() && Math.random() < 0.28) {
                // นอนหงายกอดบอล
                hideCarried(false);
                A.setPose("belly");
                mouthAdj = [0.02, 0.18];
                act("pp-roll", 1500);
                A.fx("heart", 2);
                sfx.chirp();
                later(s, 1600, function () { mouthAdj = null; A.setPose("sit"); goBack(s, ex); });
            } else goBack(s, ex);
        });
    }
    function goBack(s, ex) {
        const p = P();
        if (p.sprite) hideCarried(false);
        const hx = clamp(50 + rand(-8, 8), 18, 82), hy = 3.5;
        const spd = p.speed * 0.85 * (1 + 0.06 * ex);
        if (!reduced() && combo >= 2 && Math.random() < p.keep) {
            // แกล้งวิ่งหนี: เกือบถึงแล้ววิ่งกลับไป หันมามอง แล้วค่อยเอามาให้
            const me = A.pos(), mx = (me.x + hx) / 2, my = 6;
            runTo(s, mx, my, spd, function () {
                const awayX = clamp(mx + (mx < 50 ? -24 : 24), 16, 84);
                runTo(s, awayX, 10, spd * 1.25, function () {
                    A.face(hx - A.pos().x);
                    act("pp-tease", 900);
                    A.speak(say("keepAway"), 2400);
                    A.fx("note", 2);
                    sfx.chirp();
                    later(s, 1100, function () { runTo(s, hx, hy, spd, function () { arriveHome(s, ex); }); });
                });
            });
            return;
        }
        runTo(s, hx, hy, spd, function () { arriveHome(s, ex); });
    }
    function arriveHome(s, ex) {
        const p = P();
        A.face(Math.random() < 0.5 ? -5 : 5);
        const finish = function () {
            drop(function () { });
            A.setPose("happy");
            A.hop();
            A.voice();
            A.fx("heart", 2 + Math.min(3, ex));
            if (ex >= 2) A.fx("spark", ex);
            A.speak(combo >= 3 ? say("combo") : A.line("play"), 3000);
            haptic(15);
            later(s, 650, function () { act(ex >= 1 ? "lf-wag" : "pp-content", 1600); });
            later(s, 2200, function () {
                lastPlayEnd = Date.now();
                endSess();
                A.mode("idle");
                A.setPose("sit");
                A.setAnim(A.restAnim());
                A.schedule(7000);
            });
        };
        if (p.sprite && !reduced()) {              // หมาโชว์บอลในปากก่อนวาง
            hideCarried(true);
            A.setPose("play");
            act("pp-perk", 600);
            later(s, 700, function () { hideCarried(false); finish(); });
        } else finish();
    }
    // แตะน้องระหว่างวิ่งไล่บอล/กินขนม = หยุด หันมามอง
    function tapDuring() {
        const s = sess;
        if (!s) return;
        const type = s.type;
        endSess();
        halt();
        if (ball.st === "carry") drop();
        else if (ball.st === "fly") ball.onRest = function () { setReady(true); };
        if (type === "feed") hideBowl(true);
        const s2 = newSess("look");
        A.mode("busy");
        A.setPose("sit");
        A.setAnim(A.restAnim());
        act("pp-look", 1500);
        A.speak(say("look"), 2600);
        A.fx("note", 1);
        sfx.chirp();
        A.firstPetToday();
        A.addBond(1);
        later(s2, 1600, function () {
            endSess();
            lastPlayEnd = Date.now();
            A.mode("idle");
            A.schedule(5000);
        });
    }
    function ballButton() {
        if (Date.now() - suppressClickAt < 500) return;
        if (!A || !A.active()) return;
        audioCtx();
        throwAuto(null);
    }

    // ---------- การลาก/สะบัด (ปุ่มบอล และบอลที่วางอยู่) ----------
    let suppressClickAt = 0;
    function flickable(elm, fromFn, onTap) {
        let d = null;
        elm.addEventListener("pointerdown", function (e) {
            d = { id: e.pointerId, pts: [{ x: e.clientX, y: e.clientY, t: performance.now() }], moved: 0 };
            try { elm.setPointerCapture(e.pointerId); } catch (err) { /* ไม่รองรับ */ }
            audioCtx();
        });
        elm.addEventListener("pointermove", function (e) {
            if (!d || e.pointerId !== d.id) return;
            const l = d.pts[d.pts.length - 1];
            d.moved += Math.abs(e.clientX - l.x) + Math.abs(e.clientY - l.y);
            d.pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
            if (d.pts.length > 8) d.pts.shift();
        });
        elm.addEventListener("pointerup", function (e) {
            if (!d || e.pointerId !== d.id) return;
            const dd = d;
            d = null;
            const a = dd.pts[0], b = { x: e.clientX, y: e.clientY, t: performance.now() };
            const dt = Math.max(16, b.t - a.t) / 1000;
            if (dd.moved > 28) {
                suppressClickAt = Date.now();
                const from = fromFn();
                if (from) throwFlick(from, (b.x - a.x) / dt, (b.y - a.y) / dt);
            } else if (onTap) onTap(e);
        });
        elm.addEventListener("pointercancel", function () { d = null; });
    }

    // ---------- ให้อาหาร ----------
    let bowl = null;
    function showBowl(x, y) {
        if (!bowl || bowl.parentNode !== host()) {
            bowl = document.createElement("div");
            bowl.className = "pp-bowl";
            bowl.innerHTML = '<i class="pp-food"></i><b class="pp-dish"></b>';
            host().insertBefore(bowl, A.el);
        }
        bowl.hidden = false;
        bowl.className = "pp-bowl w-" + kind();
        bowl.style.left = x + "%";
        bowl.style.bottom = y + "%";
        bowl.style.width = Math.round(clamp(A.stage.clientWidth * 0.17, 44, 80)) + "px";
        bowl.style.setProperty("--d", depth(y).toFixed(3));
        bowl.style.zIndex = 4;
        bowl.dataset.food = "3";
        void bowl.offsetWidth;
        if (!reduced()) bowl.classList.add("drop");
    }
    function hideBowl(fade) {
        if (!bowl) return;
        if (fade && !reduced()) {
            bowl.classList.add("pp-fade");
            setTimeout(function () { if (bowl) { bowl.hidden = true; bowl.classList.remove("pp-fade"); } }, 450);
        } else bowl.hidden = true;
    }
    function bowlPoint() {
        const r = bowl.getBoundingClientRect();
        return stagePct(r.left + r.width / 2, r.top + r.height * 0.2);
    }
    let munchTimer = null;
    function stopMunch() { clearInterval(munchTimer); munchTimer = null; }
    function nomBubble(at) {
        const sp = document.createElement("span");
        sp.className = "pp-nom";
        sp.textContent = say("nom");
        sp.style.left = (at.x + rand(-6, 6)) + "%";
        sp.style.top = (at.y - rand(4, 10)) + "%";
        sp.style.setProperty("--dx", rand(-18, 18) + "px");
        A.fxBox.appendChild(sp);
        setTimeout(function () { sp.remove(); }, 1300);
    }
    function fedAt() { return S.fedAt || 0; }
    function feed() {
        if (!A || !A.active() || A.mode() === "pet") return;
        audioCtx();
        if (busy() && sess.type === "ball") {           // กำลังเล่นบอลอยู่ = วางบอลไว้ก่อน
            endSess(); halt();
            if (ball.st === "carry") drop(); else if (ball.st === "fly") ball.onRest = function () { setReady(true); };
        } else if (busy()) return;
        if (A.mode() === "sleep") {
            A.wake();
            const s0 = newSess("wake");
            later(s0, reduced() ? 0 : 900, function () { endSess(); feed(); });
            return;
        }
        if (A.mode() === "walk") halt();
        if (Date.now() - fedAt() < FULL_MS && Date.now() >= fedAt()) { fullReply(); return; }
        const s = newSess("feed");
        A.mode("busy");
        A.schedule(30000);
        const me = A.pos(), dir = me.x > 50 ? -1 : 1;
        const bx = clamp(me.x + dir * 24, 22, 78), by = clamp(me.y - 2, 2, 12);
        showBowl(bx, by);
        later(s, reduced() ? 0 : 430, function () { sfx.clink(); haptic(10); });
        A.face(bx - me.x);
        act("pp-perk", 600);
        // น้องยืนหลังชามเล็กน้อย (ชามอยู่หน้าน้อง ก้มหัวลงกินได้พอดี)
        const off = petHalfW() * 0.28;
        later(s, reduced() ? 0 : 650, function () {
            runTo(s, clamp(bx - dir * off, 12, 88), by + 2.4, P().speed * 0.7, function () {
                A.face(bx - A.pos().x);
                A.setPose("sit");
                // ดม ๆ
                act("pp-sniff", 900);
                sfx.sniff();
                later(s, reduced() ? 0 : 950, function () { eat(s); });
            });
        });
    }
    function eat(s) {
        const beats = reduced() ? 1 : 7;
        let n = 0;
        if (!reduced()) A.el.classList.add("pp-eating");
        act("pp-munch");
        const one = function () {
            n++;
            sfx.munch();
            const bp = bowlPoint();
            A.fx("crumb", 2, { x: bp.x, y: bp.y });
            if (n % 2 === 1) nomBubble(bp);
            if (bowl) bowl.dataset.food = String(Math.max(0, 3 - Math.floor(n / beats * 3.2)));
            if (n >= beats) { stopMunch(); done(); }
        };
        const done = function () {
            A.el.classList.remove("pp-eating");
            if (bowl) bowl.dataset.food = "0";
            act("pp-lick", 520);
            sfx.lick();
            later(s, 200, sfx.lick);
            later(s, reduced() ? 0 : 600, function () {
                A.setPose("happy");
                A.hop();
                sfx.chirp();
                haptic(15);
                A.fx("heart", 4);
                A.speak(A.line("eat"), 3200);
                A.addBond(2);
                A.firstPetToday();
                S.fedAt = Date.now();
                save();
                later(s, 900, function () {
                    hideBowl(true);
                    if (P().belly && Math.random() < 0.5) A.setPose("belly"); else A.setPose("sit");
                    act("pp-content", 2200);
                });
                later(s, 3200, function () {
                    endSess();
                    A.mode("idle");
                    A.setPose("sit");
                    A.setAnim(A.restAnim());
                    A.schedule(6000);
                });
            });
        };
        one();
        if (beats > 1) { munchTimer = setInterval(function () { if (s.dead) { stopMunch(); return; } one(); }, 330); }
    }
    // อิ่มแล้ว: ไม่กินต่อ บอกเบา ๆ ว่าอิ่ม ชวนลูบแทน (ไม่มีหลอดหิว ไม่ทำให้รู้สึกผิด)
    function fullReply() {
        const s = newSess("full");
        A.mode("busy");
        A.setPose(P().belly && Math.random() < 0.4 ? "belly" : "happy");
        act("pp-shake", 800);
        A.fx("heart", 1);
        sfx.chirp();
        A.speak(say("full"), 3400);
        later(s, 1800, function () {
            endSess();
            A.mode("idle");
            A.setPose("sit");
            A.setAnim(A.restAnim());
            A.schedule(5000);
        });
    }

    // ---------- ลูบ ----------
    let stroke = null;
    function strokeStart(sleeping) {
        endSess();
        if (ball.st === "carry") drop();
        stroke = { lean: 0, fx: null, lx: null, ly: null, sleeping: !!sleeping };
        A.el.classList.add("pp-purr");
        A.el.classList.toggle("pp-sleepy", !!sleeping);
        act(null);
        if (sleeping) A.speak(say("dream"), 3000);
    }
    function strokeMove(e) {
        if (!stroke) return;
        const r = A.el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        if (stroke.lx !== null) {
            const dx = e.clientX - stroke.lx;
            stroke.lean = stroke.lean * 0.8 + clamp(dx * 0.5, -7, 7) * 0.2;   // เอนตามทิศที่ลูบ
        }
        stroke.lx = e.clientX; stroke.ly = e.clientY;
        stroke.fx = stagePct(e.clientX, e.clientY);
        if (reduced()) return;
        const toward = clamp((e.clientX - cx) / (r.width / 2), -1, 1);              // ถูแก้มเข้าหานิ้ว
        const k = stroke.sleeping ? 0.35 : 1;
        A.el.style.setProperty("--lean", ((stroke.lean * 0.7 + toward * 4) * k).toFixed(2) + "deg");
        A.el.style.setProperty("--rub", (toward * 6 * k).toFixed(1) + "px");
    }
    function strokeEnd() {
        if (!A) return;
        stroke = null;
        A.el.classList.remove("pp-purr", "pp-sleepy");
        A.el.style.setProperty("--lean", "0deg");
        A.el.style.setProperty("--rub", "0px");
    }
    function finger() { return stroke && stroke.fx ? { x: stroke.fx.x, y: stroke.fx.y - 4 } : null; }

    // ---------- ชีวิตตอนอยู่เฉย ๆ ----------
    let lifeTimer = null;
    const LIFE_MS = { tilt: 1500, blink: 380, wag: 1300, twitch: 420, peek: 1400, nose: 700, flutter: 900, sway: 2400, glow: 1800, bounce: 700 };
    function lifeTick() {
        clearTimeout(lifeTimer);
        lifeTimer = setTimeout(lifeTick, rand(1700, 5200));
        if (!A || !A.active() || document.hidden || reduced() || busy() || stroke) return;
        if (A.mode() !== "idle") return;
        A.el.dataset.pf = kind();
        const w = P().idle, keys = Object.keys(w);
        let tot = 0;
        keys.forEach(function (k) { tot += w[k]; });
        let r = Math.random() * tot, k = keys[0];
        for (let i = 0; i < keys.length; i++) { r -= w[keys[i]]; if (r <= 0) { k = keys[i]; break; } }
        A.pimg.style.setProperty("--tilt", (Math.random() < 0.5 ? -1 : 1) * rand(2.5, 5) + "deg");
        act("lf-" + k, LIFE_MS[k]);
        // ความตื่นเต้นหลังเล่นจะค่อย ๆ จางลง
        if (Date.now() - lastPlayEnd > COMBO_MS) A.el.style.setProperty("--ex", P().ex);
    }

    // ---------- ผูกกับ game-pet.js ----------
    function attach(api) {
        if (A || !api) return;
        A = api;
        A.el.dataset.pf = kind();
        A.el.style.setProperty("--ex", P().ex);
        const btn = $("playBall");
        btn.classList.add("pp-flick");
        flickable(btn, ballBtnStart, null);
        flickable(A.toyEl, function () {
            if (ball.st !== "rest" || busy()) return null;
            return { x: ball.x, y: ball.y, z: 0, rot: ball.rot };
        }, function () {
            if (ball.st !== "rest" || busy()) return;
            const H = hostRect().height || 400;
            const s = { x: ball.x, y: ball.y, z: 0, rot: ball.rot };
            const tx = vx(ball.x < vmid() ? rand(58, 84) : rand(16, 42));
            startThrow(s, aim(s, tx, rand(7, 14), H * rand(1.3, 1.7)));
        });
        lifeTick();
    }
    function abort() {
        if (!sess) return;
        const type = sess.type;
        endSess();
        if (!A) return;
        if (A.mode() === "walk") halt();
        if (ball.st === "carry") drop();
        else if (ball.st === "fly") ball.onRest = function () { setReady(true); };
        if (type === "feed") hideBowl(true);
        act(null);
    }
    function leave() {
        endSess();
        strokeEnd();
        hideBall(false);
        hideBowl(false);
        if (A) act(null);
    }
    return {
        attach: attach, ball: ballButton, feed: feed, busy: busy, tapDuring: tapDuring, abort: abort, leave: leave,
        strokeStart: strokeStart, stroke: strokeMove, strokeEnd: strokeEnd, finger: finger, profile: kind,
        _ball: ball, _say: say, _lines: PLAY_LINES
    };
})();
// game-pet.js โหลดก่อนหรือหลังไฟล์นี้ก็ได้
if (typeof Pet !== "undefined" && Pet._api) PetPlay.attach(Pet._api);
