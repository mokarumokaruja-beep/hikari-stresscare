// =====================================================================
// Hikari - soundscape.js (v26)
// เครื่องเล่น "เสียงของ Hikari": เล่นเสียงธรรมชาติที่อัดจริง + โทนนุ่ม ซ้อนกันหลายชั้น วนต่อเนื่อง
// ใช้กับคลิปในภารกิจ 60 วันที่มี local: [...] (ดู content.js) · ไฟล์เสียงอยู่ใน sounds/
// ค่อย ๆ ดังขึ้นตอนเริ่ม และค่อย ๆ เบาลงตอนหยุดหรือหมดเวลา ไม่มีเสียงตัดกึก
// =====================================================================

const HK_SOUND_TEXT = {
    th: { play: "เล่น", pause: "พัก", timer: "ตั้งเวลา", forever: "ไม่จำกัด", min: "{n} นาที", hint: "หายใจตามวงแสงช้า ๆ ได้นะ ไม่ต้องรีบ", credit: "เสียงจาก Hikari · เครดิตเสียง", loading: "กำลังโหลดเสียง…", fail: "โหลดเสียงไม่ได้ ลองใหม่อีกครั้งนะ", done: "หมดเวลาแล้ว พักต่ออีกนิดก็ได้นะ" },
    en: { play: "Play", pause: "Pause", timer: "Timer", forever: "No limit", min: "{n} min", hint: "Breathe slowly with the glow if you like. No rush.", credit: "Sound by Hikari · credits", loading: "Loading sound…", fail: "Couldn't load the sound. Please try again.", done: "Time's up. Feel free to rest a little longer." },
    zh: { play: "播放", pause: "暂停", timer: "定时", forever: "不限时", min: "{n} 分钟", hint: "可以跟着光圈慢慢呼吸，不用着急。", credit: "Hikari 声音 · 声音来源", loading: "正在加载…", fail: "无法加载声音，请再试一次。", done: "时间到了，想再多休息一会儿也可以。" },
    ja: { play: "再生", pause: "一時停止", timer: "タイマー", forever: "制限なし", min: "{n} 分", hint: "光の輪に合わせて、ゆっくり呼吸してみてね。", credit: "Hikari のサウンド · クレジット", loading: "読み込み中…", fail: "音を読み込めませんでした。もう一度お試しください。", done: "時間です。もう少し休んでもいいよ。" },
    hi: { play: "चलाएँ", pause: "रोकें", timer: "टाइमर", forever: "कोई सीमा नहीं", min: "{n} मिनट", hint: "चाहें तो रोशनी के साथ धीरे-धीरे साँस लें, कोई जल्दी नहीं।", credit: "Hikari की ध्वनि · श्रेय", loading: "ध्वनि लोड हो रही है…", fail: "ध्वनि लोड नहीं हुई, फिर से कोशिश करें।", done: "समय पूरा हुआ। चाहें तो थोड़ा और आराम करें।" },
    es: { play: "Reproducir", pause: "Pausa", timer: "Temporizador", forever: "Sin límite", min: "{n} min", hint: "Si quieres, respira despacio con la luz. Sin prisa.", credit: "Sonido de Hikari · créditos", loading: "Cargando sonido…", fail: "No se pudo cargar el sonido. Inténtalo de nuevo.", done: "Se acabó el tiempo. Puedes descansar un poco más." },
    fr: { play: "Lecture", pause: "Pause", timer: "Minuteur", forever: "Sans limite", min: "{n} min", hint: "Respire lentement avec la lumière si tu veux. Rien ne presse.", credit: "Son de Hikari · crédits", loading: "Chargement du son…", fail: "Impossible de charger le son. Réessaie.", done: "C'est terminé. Tu peux te reposer encore un peu." },
    ar: { play: "تشغيل", pause: "إيقاف مؤقت", timer: "المؤقت", forever: "بلا حد", min: "{n} دقيقة", hint: "تنفّس ببطء مع الضوء إن أحببت، لا داعي للعجلة.", credit: "صوت من Hikari · المصادر", loading: "جارٍ تحميل الصوت…", fail: "تعذّر تحميل الصوت، حاول مرة أخرى.", done: "انتهى الوقت. يمكنك أن ترتاح قليلًا بعد." },
    pt: { play: "Tocar", pause: "Pausar", timer: "Timer", forever: "Sem limite", min: "{n} min", hint: "Se quiser, respire devagar com a luz. Sem pressa.", credit: "Som do Hikari · créditos", loading: "Carregando som…", fail: "Não foi possível carregar o som. Tente de novo.", done: "O tempo acabou. Pode descansar mais um pouco." },
    ru: { play: "Играть", pause: "Пауза", timer: "Таймер", forever: "Без ограничения", min: "{n} мин", hint: "Если хочется, дышите медленно вместе со светом. Без спешки.", credit: "Звук Hikari · авторы", loading: "Загрузка звука…", fail: "Не удалось загрузить звук. Попробуйте ещё раз.", done: "Время вышло. Можно отдохнуть ещё немного." }
};
// ความดังของแต่ละชั้น (ชั้นแรกเป็นหลัก ชั้นที่สองเป็นพื้นเบา ๆ)
const HK_LAYER_VOL = { "rain-soft": 0.9, "stream": 0.8, "waves": 0.85, "birds": 0.55, "night": 0.6, "wind-soft": 0.5, "fire": 0.55, "tone-432": 0.7, "tone-528": 0.7, "bowl": 0.8 };

const HkSound = (function () {
    let ctx = null, master = null, sources = [], timer = null, token = 0;
    const cache = {};

    function context() {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        if (!ctx) ctx = new C();
        if (ctx.state === "suspended") ctx.resume();
        return ctx;
    }
    function load(name) {
        const c = context();
        if (!cache[name]) {
            cache[name] = fetch("sounds/" + name + ".m4a")
                .then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
                .then(function (buf) { return new Promise(function (ok, fail) { c.decodeAudioData(buf, ok, fail); }); })
                .catch(function (e) { delete cache[name]; throw e; });
        }
        return cache[name];
    }
    function start(layers) {
        const c = context();
        if (!c) return Promise.reject(new Error("no audio"));
        stop(0.3);
        const my = ++token;
        master = c.createGain();
        master.gain.value = 0;
        master.connect(c.destination);
        const out = master;
        return Promise.all(layers.map(load)).then(function (bufs) {
            if (my !== token) return;
            bufs.forEach(function (buf, i) {
                const src = c.createBufferSource(), g = c.createGain();
                src.buffer = buf;
                src.loop = true;
                src.loopStart = Math.min(0.06, buf.duration / 4);              // ข้ามช่วงเงียบที่ตัวเข้ารหัสเติมไว้
                src.loopEnd = Math.max(src.loopStart + 1, buf.duration - 0.06);
                g.gain.value = (HK_LAYER_VOL[layers[i]] || 0.7) * (i === 0 ? 1 : 0.7);
                src.connect(g).connect(out);
                // เริ่มแต่ละชั้นคนละตำแหน่ง ฟังแล้วไม่ซ้ำเป็นแพทเทิร์น
                src.start(0, src.loopStart + (i * 17.3) % Math.max(1, buf.duration - 1));
                sources.push(src);
            });
            out.gain.setValueAtTime(0, c.currentTime);
            out.gain.linearRampToValueAtTime(1, c.currentTime + 3);
        });
    }
    function stop(fade) {
        clearTimeout(timer);
        token++;
        if (!ctx || !master) return;
        const m = master, s = sources, f = fade === undefined ? 1.5 : fade;
        master = null; sources = [];
        m.gain.cancelScheduledValues(ctx.currentTime);
        m.gain.setValueAtTime(m.gain.value, ctx.currentTime);
        m.gain.linearRampToValueAtTime(0, ctx.currentTime + f);
        setTimeout(function () { s.forEach(function (x) { try { x.stop(); } catch (e) { /* หยุดแล้ว */ } }); m.disconnect(); }, f * 1000 + 100);
    }
    function sleepAfter(minutes, onDone) {
        clearTimeout(timer);
        if (!minutes) return;
        timer = setTimeout(function () { stop(20); if (onDone) onDone(); }, minutes * 60000);   // เบาลงช้า ๆ 20 วินาที
    }
    return { start: start, stop: stop, sleepAfter: sleepAfter, playing: function () { return Boolean(master); } };
})();

function hkSoundText(key, lang) {
    const L = HK_SOUND_TEXT[lang] || HK_SOUND_TEXT.en;
    return L[key] || HK_SOUND_TEXT.en[key];
}

// วาดหน้าเล่นเสียงลงใน box (แทน iframe ของ YouTube)
function renderHkSound(box, v, lang) {
    const T = function (k) { return hkSoundText(k, lang); };
    box.innerHTML =
        '<div class="hk-sound art-' + (v.art || "tone") + '">' +
        '  <div class="hk-glow" aria-hidden="true"></div>' +
        '  <p class="hk-hint"></p>' +
        '  <div class="hk-controls">' +
        '    <button type="button" class="hk-play"></button>' +
        '    <label class="hk-timer"><span></span> <select>' +
        '      <option value="0"></option><option value="10"></option><option value="20"></option><option value="30"></option>' +
        '    </select></label>' +
        '  </div>' +
        '</div>';
    const wrap = box.querySelector(".hk-sound"), btn = box.querySelector(".hk-play"), hint = box.querySelector(".hk-hint");
    const sel = box.querySelector("select");
    box.querySelector(".hk-timer span").textContent = T("timer");
    sel.options[0].textContent = T("forever");
    [10, 20, 30].forEach(function (n, i) { sel.options[i + 1].textContent = T("min").replace("{n}", n); });
    hint.textContent = T("hint");
    function setPlaying(on) {
        btn.textContent = on ? "❚❚ " + T("pause") : "▶ " + T("play");
        btn.setAttribute("aria-pressed", String(on));
        wrap.classList.toggle("is-playing", on);
    }
    function play() {
        hint.textContent = T("loading");
        setPlaying(true);
        HkSound.start(v.local).then(function () {
            hint.textContent = T("hint");
            HkSound.sleepAfter(Number(sel.value), function () { setPlaying(false); hint.textContent = T("done"); });
        }).catch(function () { setPlaying(false); hint.textContent = T("fail"); });
    }
    btn.addEventListener("click", function () {
        if (HkSound.playing()) { HkSound.stop(); setPlaying(false); } else play();
    });
    sel.addEventListener("change", function () { if (HkSound.playing()) HkSound.sleepAfter(Number(sel.value), function () { setPlaying(false); hint.textContent = T("done"); }); });
    play();                                   // กดเปิดคลิปมาแล้ว เล่นเลยเหมือนวิดีโอ
}
