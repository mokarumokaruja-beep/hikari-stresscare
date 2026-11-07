// =====================================================================
// Hikari - share.js (v27)  ใช้ร่วมกันทั้งหน้าเว็บ index.html และเกม game.html · โหลดหลัง safety.js
// แผง"ส่งข้อความ" แผงเดียว: แชร์ด้วยแอปในเครื่อง (navigator.share) / LINE / WhatsApp / Facebook /
// Instagram / TikTok / WeChat / Discord / คัดลอก
//
// ข้อจำกัดของแต่ละแอป (หน้าเว็บใส่ข้อความล่วงหน้าให้บางแอปไม่ได้):
//   LINE, WhatsApp  = เปิดลิงก์แชร์พร้อมข้อความ
//   Facebook        = รับได้แค่ลิงก์ (Facebook เลิกรับข้อความแล้ว) → คัดลอกข้อความให้ก่อน แล้วเปิดหน้าแชร์ลิงก์
//   Instagram / TikTok / WeChat / Discord = ไม่มีลิงก์แชร์ข้อความ → คัดลอกให้ แล้วลองเปิดแอป (ถ้าเปิดได้โดยไม่ออกจากหน้านี้)
//   WeChat + มีลิงก์ = แสดง QR ของลิงก์ (ใช้ไลบรารี qrcode-generator ที่หน้าโหลดไว้แล้ว ถ้ามี)
//
// ความปลอดภัย: kind "public" (เช่น จดหมายใจดี) + พบข้อความเสี่ยง (HikariSafety.hasRiskText) = ไม่เปิดแผง เรียก onRisk แทน
//              kind "private" (ข้อความถึงคนที่ไว้ใจ) = ส่งได้เสมอ (นั่นคือจุดประสงค์) แต่เรียก onRisk ให้แสดงการ์ดช่วยเหลือด้วย
// ความเป็นส่วนตัว: ไม่ส่งข้อมูลไปที่ไหน ไม่มี analytics เปิดเฉพาะแอปที่ผู้ใช้กดเลือกเอง
//
// ใช้: HikariShare.open({ text, url?, kind: "public"|"private", lang?, onShared(app)?, onRisk()? })
//      HikariShare.text(key, lang) = ข้อความของไฟล์นี้ (เช่น "sendBtn")
// =====================================================================

const HK_SHARE_TEXT = {
    th: { title: "ส่งข้อความ", native: "แชร์ด้วยแอปในเครื่อง", copy: "คัดลอกข้อความ", copied: "คัดลอกแล้ว", copyFail: "คัดลอกอัตโนมัติไม่ได้ กดค้างที่ข้อความด้านบนเพื่อคัดลอกเองได้นะ", fbCopied: "ข้อความถูกคัดลอกแล้ว วางในโพสต์หรือแชตได้เลย", pasteIn: "คัดลอกแล้ว นำไปวางใน {app} ได้เลย", close: "ปิด", sendBtn: "ส่งข้อความ…", hint: "บางแอปรับข้อความจากหน้าเว็บไม่ได้ เราจะคัดลอกให้ แล้วคุณวางเองได้เลย", qr: "สแกนใน WeChat เพื่อเปิดลิงก์", readyFriend: "เลือกเพื่อนในแอปที่เปิดได้เลย", readyTrust: "เลือกคนที่อยากคุยด้วยในแอปที่เปิดได้เลย", preview: "ข้อความที่จะส่ง" },
    en: { title: "Send message", native: "Share with apps on this device", copy: "Copy message", copied: "Copied", copyFail: "Couldn't copy automatically. Press and hold the message above to copy it.", fbCopied: "Message copied. Paste it into your post or chat.", pasteIn: "Copied — paste it in {app}", close: "Close", sendBtn: "Send…", hint: "Some apps can't receive text from a website, so we copy it for you to paste.", qr: "Scan in WeChat to open the link", readyFriend: "Pick a friend in the app you opened.", readyTrust: "Pick the person you'd like to talk to in the app you opened.", preview: "Message to send" },
    zh: { title: "发送消息", native: "用本机应用分享", copy: "复制消息", copied: "已复制", copyFail: "无法自动复制。请长按上面的消息手动复制。", fbCopied: "消息已复制，可以粘贴到帖子或聊天中。", pasteIn: "已复制，请粘贴到 {app}", close: "关闭", sendBtn: "发送…", hint: "有些应用无法接收网页传来的文字，我们会帮你复制，你再粘贴即可。", qr: "用微信扫一扫打开链接", readyFriend: "在打开的应用里选择一位朋友吧。", readyTrust: "在打开的应用里选择你想聊聊的人吧。", preview: "要发送的消息" },
    hi: { title: "संदेश भेजें", native: "इस डिवाइस के ऐप से शेयर करें", copy: "संदेश कॉपी करें", copied: "कॉपी हो गया", copyFail: "अपने-आप कॉपी नहीं हुआ। ऊपर के संदेश को दबाकर रखें और कॉपी करें।", fbCopied: "संदेश कॉपी हो गया। इसे अपनी पोस्ट या चैट में पेस्ट करें।", pasteIn: "कॉपी हो गया — इसे {app} में पेस्ट करें", close: "बंद करें", sendBtn: "भेजें…", hint: "कुछ ऐप वेबसाइट से टेक्स्ट नहीं ले सकते, इसलिए हम इसे कॉपी कर देते हैं ताकि आप पेस्ट कर सकें।", qr: "लिंक खोलने के लिए WeChat में स्कैन करें", readyFriend: "खुले हुए ऐप में किसी दोस्त को चुनें।", readyTrust: "खुले हुए ऐप में उस व्यक्ति को चुनें जिससे आप बात करना चाहते हैं।", preview: "भेजा जाने वाला संदेश" },
    es: { title: "Enviar mensaje", native: "Compartir con apps de este dispositivo", copy: "Copiar mensaje", copied: "Copiado", copyFail: "No se pudo copiar automáticamente. Mantén pulsado el mensaje de arriba para copiarlo.", fbCopied: "Mensaje copiado. Pégalo en tu publicación o chat.", pasteIn: "Copiado: pégalo en {app}", close: "Cerrar", sendBtn: "Enviar…", hint: "Algunas apps no aceptan texto desde una web, así que lo copiamos para que lo pegues.", qr: "Escanea en WeChat para abrir el enlace", readyFriend: "Elige a un amigo en la app que se abrió.", readyTrust: "Elige a la persona con quien quieres hablar en la app que se abrió.", preview: "Mensaje a enviar" },
    fr: { title: "Envoyer le message", native: "Partager avec les apps de l'appareil", copy: "Copier le message", copied: "Copié", copyFail: "Copie automatique impossible. Appuie longuement sur le message ci-dessus pour le copier.", fbCopied: "Message copié. Colle-le dans ta publication ou ta discussion.", pasteIn: "Copié — colle-le dans {app}", close: "Fermer", sendBtn: "Envoyer…", hint: "Certaines apps n'acceptent pas le texte venant d'un site, alors on le copie pour que tu le colles.", qr: "Scanne dans WeChat pour ouvrir le lien", readyFriend: "Choisis un ami dans l'app ouverte.", readyTrust: "Choisis la personne à qui tu veux parler dans l'app ouverte.", preview: "Message à envoyer" },
    ar: { title: "إرسال رسالة", native: "المشاركة بتطبيقات هذا الجهاز", copy: "نسخ الرسالة", copied: "تم النسخ", copyFail: "تعذّر النسخ تلقائيًا. اضغط مطوّلًا على الرسالة أعلاه لنسخها.", fbCopied: "تم نسخ الرسالة. الصقها في منشورك أو محادثتك.", pasteIn: "تم النسخ — الصقها في {app}", close: "إغلاق", sendBtn: "إرسال…", hint: "بعض التطبيقات لا تستقبل النص من موقع ويب، لذلك ننسخه لك لتلصقه بنفسك.", qr: "امسح الرمز في WeChat لفتح الرابط", readyFriend: "اختر صديقًا في التطبيق الذي فُتح.", readyTrust: "اختر الشخص الذي تودّ التحدث معه في التطبيق الذي فُتح.", preview: "الرسالة المراد إرسالها" },
    pt: { title: "Enviar mensagem", native: "Compartilhar com apps do aparelho", copy: "Copiar mensagem", copied: "Copiado", copyFail: "Não deu para copiar automaticamente. Toque e segure a mensagem acima para copiar.", fbCopied: "Mensagem copiada. Cole no seu post ou chat.", pasteIn: "Copiado — cole no {app}", close: "Fechar", sendBtn: "Enviar…", hint: "Alguns apps não recebem texto de um site, então copiamos para você colar.", qr: "Escaneie no WeChat para abrir o link", readyFriend: "Escolha um amigo no app que abriu.", readyTrust: "Escolha a pessoa com quem quer conversar no app que abriu.", preview: "Mensagem a enviar" },
    ru: { title: "Отправить сообщение", native: "Поделиться через приложения устройства", copy: "Копировать сообщение", copied: "Скопировано", copyFail: "Не удалось скопировать автоматически. Нажмите и удерживайте сообщение выше, чтобы скопировать.", fbCopied: "Сообщение скопировано. Вставьте его в пост или чат.", pasteIn: "Скопировано — вставьте в {app}", close: "Закрыть", sendBtn: "Отправить…", hint: "Некоторые приложения не принимают текст с сайта, поэтому мы копируем его, чтобы вы вставили сами.", qr: "Отсканируйте в WeChat, чтобы открыть ссылку", readyFriend: "Выберите друга в открывшемся приложении.", readyTrust: "Выберите человека, с которым хотите поговорить, в открывшемся приложении.", preview: "Сообщение для отправки" },
    ja: { title: "メッセージを送る", native: "この端末のアプリで共有", copy: "メッセージをコピー", copied: "コピーしました", copyFail: "自動でコピーできませんでした。上のメッセージを長押ししてコピーしてね。", fbCopied: "メッセージをコピーしました。投稿やチャットに貼り付けてね。", pasteIn: "コピーしました。{app} に貼り付けてね", close: "閉じる", sendBtn: "送る…", hint: "Web ページから文字を受け取れないアプリもあるので、コピーしておきます。貼り付けて使ってね。", qr: "WeChat でスキャンしてリンクを開く", readyFriend: "開いたアプリで友だちを選んでね。", readyTrust: "開いたアプリで話したい人を選んでね。", preview: "送るメッセージ" }
};

const HikariShare = (function () {
    // ไม่ใช้โลโก้ของแอป ใช้วงกลมสี + ตัวอักษรแรก + ชื่อแอปเป็นตัวหนังสือ
    const APPS = [
        { id: "line", name: "LINE", dot: "L", color: "#05a646" },
        { id: "whatsapp", name: "WhatsApp", dot: "W", color: "#128c4a" },
        { id: "facebook", name: "Facebook", dot: "f", color: "#1877f2" },
        { id: "instagram", name: "Instagram", dot: "I", color: "#c13584" },
        { id: "tiktok", name: "TikTok", dot: "T", color: "#161823" },
        { id: "wechat", name: "WeChat", names: { zh: "微信" }, dot: "W", color: "#078a44" },
        { id: "discord", name: "Discord", dot: "D", color: "#5865f2" }
    ];
    const SITE = (typeof SITE_URL !== "undefined" && SITE_URL) ? SITE_URL : "https://mokarumokaruja-beep.github.io/hikari-stresscare/";
    const UA = navigator.userAgent || "";
    const MOBILE = /Android|iPhone|iPad|iPod/i.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);

    let root = null, sheet = null, toastEl = null, toastTimer = null, opts = null, returnTo = null, sharedOnce = false;

    function curLang(l) {
        l = l || document.documentElement.lang || "th";
        return HK_SHARE_TEXT[l] ? l : "en";
    }
    function text(key, l) {
        const pack = HK_SHARE_TEXT[curLang(l)];
        return pack[key] !== undefined ? pack[key] : HK_SHARE_TEXT.en[key];
    }
    function T(key) { return text(key, opts && opts.lang); }
    function appName(app) { return (app.names && app.names[curLang(opts && opts.lang)]) || app.name; }
    function full() { return opts.url ? opts.text + "\n" + opts.url : opts.text; }
    function risky(s) {
        try { return typeof HikariSafety !== "undefined" && HikariSafety.hasRiskText(s); } catch (e) { return false; }
    }

    function css() {
        if (document.getElementById("hks-style")) return;
        const s = document.createElement("style");
        s.id = "hks-style";
        s.textContent =
            ".hks-back{position:fixed;inset:0;z-index:10000;background:rgba(20,20,40,.45);display:flex;align-items:flex-end;justify-content:center}" +
            ".hks-back[hidden]{display:none}" +
            ".hks-sheet{box-sizing:border-box;width:100%;max-width:480px;max-height:92vh;overflow:auto;background:var(--card,var(--white,#fff));color:var(--text,var(--ink,#222));" +
            "border-radius:20px 20px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));box-shadow:0 -6px 24px rgba(0,0,0,.18);font:inherit}" +
            "@media (min-width:600px){.hks-back{align-items:center}.hks-sheet{border-radius:20px}}" +
            ".hks-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}" +
            ".hks-head h2{margin:0;font-size:1.15rem}" +
            ".hks-sheet button,.hks-sheet a{font:inherit;color:inherit;cursor:pointer}" +
            ".hks-x{min-width:44px;min-height:44px;border:0;background:transparent;font-size:1.5rem;line-height:1;border-radius:12px}" +
            ".hks-label{margin:0 0 4px;font-size:.85rem;color:var(--muted,#666)}" +
            ".hks-preview{margin:0 0 12px;padding:10px 12px;border-radius:12px;background:var(--bg,var(--cream,#f4f4f8));white-space:pre-wrap;word-break:break-word;" +
            "max-height:7.5em;overflow:auto;font-size:.95rem;-webkit-user-select:text;user-select:text}" +
            ".hks-native,.hks-copy{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;border-radius:14px;font-weight:600;margin:0 0 12px;padding:8px 14px}" +
            ".hks-native{border:0;background:var(--primary,var(--sage,#3e6ee0));color:#fff !important}" +
            ".hks-copy{border:2px solid var(--primary,var(--cocoa,#3e6ee0));background:transparent;margin:12px 0 0}" +
            ".hks-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0;padding:0;list-style:none}" +
            ".hks-app{display:flex;flex-direction:column;align-items:center;gap:4px;min-height:72px;padding:6px 2px;border:0;background:transparent;border-radius:14px;text-decoration:none;font-size:.8rem;text-align:center;width:100%}" +
            ".hks-dot{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;color:#fff;font-weight:700;font-size:1.2rem;font-family:system-ui,sans-serif}" +
            ".hks-sheet :focus-visible{outline:3px solid var(--primary,#3e6ee0);outline-offset:2px}" +
            ".hks-app:hover,.hks-x:hover{background:rgba(0,0,0,.06)}" +
            ".hks-hint{margin:10px 0 0;font-size:.8rem;color:var(--muted,#666)}" +
            ".hks-qr{text-align:center;margin:12px 0 0}.hks-qr[hidden]{display:none}.hks-qr svg{width:180px;height:180px;background:#fff;padding:8px;border-radius:12px}" +
            ".hks-qr p{margin:4px 0 0;font-size:.85rem}" +
            ".hks-toast{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:10001;max-width:min(92vw,440px);" +
            "background:#2b2b3a;color:#fff;padding:10px 16px;border-radius:14px;font-size:.95rem;box-shadow:0 4px 16px rgba(0,0,0,.25);text-align:center}" +
            ".hks-toast:empty{display:none}";
        document.head.appendChild(s);
    }

    function build() {
        if (root) return;
        css();
        toastEl = document.createElement("div");
        toastEl.className = "hks-toast";
        toastEl.setAttribute("role", "status");
        toastEl.setAttribute("aria-live", "polite");
        document.body.appendChild(toastEl);

        root = document.createElement("div");
        root.className = "hks-back";
        root.hidden = true;
        root.innerHTML =
            '<div class="hks-sheet" role="dialog" aria-modal="true" aria-labelledby="hks-title">' +
            '<div class="hks-head"><h2 id="hks-title"></h2><button type="button" class="hks-x">×</button></div>' +
            '<p class="hks-label" id="hks-plabel"></p><p class="hks-preview" aria-labelledby="hks-plabel"></p>' +
            '<button type="button" class="hks-native"></button>' +
            '<ul class="hks-grid"></ul>' +
            '<div class="hks-qr" hidden></div>' +
            '<button type="button" class="hks-copy"></button>' +
            '<p class="hks-hint"></p>' +
            "</div>";
        sheet = root.querySelector(".hks-sheet");
        document.body.appendChild(root);
        root.addEventListener("click", function (e) { if (e.target === root) close(); });
        root.querySelector(".hks-x").addEventListener("click", close);
        root.querySelector(".hks-copy").addEventListener("click", function () {
            copy(full()).then(function (ok) {
                if (ok) { done("copy"); toast(T("copied")); close(); } else toast(T("copyFail"));
            });
        });
        root.querySelector(".hks-native").addEventListener("click", nativeShare);
        sheet.addEventListener("keydown", function (e) {
            if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); return; }
            if (e.key !== "Tab") return;
            const f = Array.prototype.filter.call(sheet.querySelectorAll("button,a[href]"), function (x) { return !x.hidden && x.offsetParent !== null; });
            if (!f.length) return;
            const first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        });
    }

    function toast(msg) {
        if (!toastEl) build();
        clearTimeout(toastTimer);
        toastEl.textContent = "";
        setTimeout(function () { toastEl.textContent = msg; }, 30);       // ให้โปรแกรมอ่านหน้าจออ่านซ้ำได้
        toastTimer = setTimeout(function () { toastEl.textContent = ""; }, 4200);
    }

    // คัดลอก: ใช้ Clipboard API ก่อน ถ้าไม่ได้ใช้วิธีเก่า (execCommand) · คืน Promise<true|false>
    function legacyCopy(s) {
        const ta = document.createElement("textarea");
        ta.value = s;
        ta.setAttribute("readonly", "");
        ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;width:1px;height:1px";
        (sheet || document.body).appendChild(ta);
        const back = document.activeElement;
        ta.select();
        try { ta.setSelectionRange(0, s.length); } catch (e) { /* ไม่เป็นไร */ }
        let ok = false;
        try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
        ta.remove();
        if (back && back.focus) back.focus({ preventScroll: true });
        return ok;
    }
    function copy(s) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
                return navigator.clipboard.writeText(s).then(function () { return true; }, function () { return legacyCopy(s); });
            }
        } catch (e) { /* ใช้วิธีเก่า */ }
        return Promise.resolve(legacyCopy(s));
    }

    function done(app) {
        if (sharedOnce) return;
        sharedOnce = true;
        if (opts && typeof opts.onShared === "function") {
            try { opts.onShared(app); } catch (e) { /* ไม่ให้แผงพัง */ }
        }
    }
    function openTab(u) {
        const w = window.open(u, "_blank");     // ไม่ใส่ "noopener" ใน features เพราะจะคืนค่า null เสมอ
        if (w) { try { w.opener = null; } catch (e) { /* ไม่เป็นไร */ } }
        return w;
    }
    // ลองเปิดแอปด้วย scheme (เฉพาะมือถือ) · ถ้าหน้านี้ถูกซ่อนไปแล้ว (แอปเปิดแล้ว) ไม่ทำอะไรเพิ่ม · ไม่เปิดก็ยังอยู่หน้าเดิม
    function tryApp(scheme) {
        if (!MOBILE || !scheme) return;
        setTimeout(function () {
            if (document.hidden) return;
            try { window.location.href = scheme; } catch (e) { /* เปิดไม่ได้ ไม่เป็นไร */ }
        }, 400);
    }

    function nativeShare() {
        const data = { text: opts.text };
        if (opts.url) data.url = opts.url;
        let p;
        try { p = navigator.share(data); } catch (e) { p = Promise.reject(e); }
        Promise.resolve(p).then(function () { done("native"); close(); }, function (e) {
            if (e && e.name === "AbortError") return;      // ผู้ใช้ยกเลิก ไม่ต้องทำอะไร
            root.querySelector(".hks-grid a, .hks-grid button").focus();
        });
    }

    function act(app, ev) {
        const s = full();
        if (app.id === "line" || app.id === "whatsapp") { done(app.id); setTimeout(close, 0); return; }  // ลิงก์ <a> เปิดเอง
        ev.preventDefault();
        if (app.id === "facebook") {
            const fb = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(opts.url || SITE);
            const c = copy(s);                       // เริ่มคัดลอกก่อน แล้วเปิดหน้าต่างทันที (ยังอยู่ในจังหวะที่ผู้ใช้กด)
            if (!openTab(fb)) location.href = fb;
            c.then(function (ok) { toast(ok ? T("fbCopied") : T("copyFail")); });
            done(app.id);
            close();
            return;
        }
        copy(s).then(function (ok) {
            if (!ok) { toast(T("copyFail")); return; }
            toast(T("pasteIn").replace("{app}", appName(app)));
            done(app.id);
            if (app.id === "instagram") { if (MOBILE) tryApp("instagram://app"); else openTab("https://www.instagram.com/direct/inbox/"); }
            else if (app.id === "tiktok") { if (!MOBILE) openTab("https://www.tiktok.com/messages"); }
            else if (app.id === "discord") { if (MOBILE) tryApp("discord://"); else openTab("https://discord.com/app"); }
            else if (app.id === "wechat") {
                if (showQr()) return;                // มี QR ให้สแกน แผงยังเปิดอยู่
                tryApp("weixin://");
            }
            close();
        });
    }

    function showQr() {
        const box = root.querySelector(".hks-qr");
        if (!opts.url || typeof qrcode === "undefined") return false;
        try {
            const qr = qrcode(0, "M");
            qr.addData(opts.url);
            qr.make();
            box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
            const svg = box.querySelector("svg");
            if (svg) { svg.setAttribute("role", "img"); svg.setAttribute("aria-label", T("qr")); }
            const p = document.createElement("p");
            p.textContent = T("qr");
            box.appendChild(p);
            box.hidden = false;
            return true;
        } catch (e) { return false; }
    }

    function fill() {
        const dir = curLang(opts.lang) === "ar" ? "rtl" : (document.documentElement.dir || "ltr");
        sheet.setAttribute("dir", dir);
        sheet.setAttribute("lang", curLang(opts.lang));
        root.querySelector("#hks-title").textContent = T("title");
        const x = root.querySelector(".hks-x");
        x.setAttribute("aria-label", T("close"));
        x.title = T("close");
        root.querySelector("#hks-plabel").textContent = T("preview");
        root.querySelector(".hks-preview").textContent = full();
        const nat = root.querySelector(".hks-native");
        nat.textContent = T("native") + " …";
        nat.hidden = typeof navigator.share !== "function";
        root.querySelector(".hks-copy").textContent = T("copy");
        root.querySelector(".hks-hint").textContent = T("hint");
        const qr = root.querySelector(".hks-qr");
        qr.hidden = true;
        qr.innerHTML = "";
        const grid = root.querySelector(".hks-grid");
        grid.innerHTML = "";
        const enc = encodeURIComponent(full());
        APPS.forEach(function (app) {
            const li = document.createElement("li");
            let b;
            if (app.id === "line" || app.id === "whatsapp") {
                b = document.createElement("a");
                b.href = (app.id === "line" ? "https://line.me/R/share?text=" : "https://wa.me/?text=") + enc;
                b.target = "_blank";
                b.rel = "noopener noreferrer";
            } else {
                b = document.createElement("button");
                b.type = "button";
            }
            b.className = "hks-app hks-" + app.id;
            b.dataset.app = app.id;
            const dot = document.createElement("span");
            dot.className = "hks-dot";
            dot.setAttribute("aria-hidden", "true");
            dot.style.background = app.color;
            dot.textContent = app.dot;
            const name = document.createElement("span");
            name.className = "hks-name";
            name.textContent = appName(app);
            b.append(dot, name);
            b.addEventListener("click", function (e) { act(app, e); });
            li.appendChild(b);
            grid.appendChild(li);
        });
    }

    function open(o) {
        o = o || {};
        const msg = String(o.text || "").trim();
        if (!msg) return false;
        const isRisky = risky(msg);
        if (isRisky && typeof o.onRisk === "function") { try { o.onRisk(); } catch (e) { /* ไม่เป็นไร */ } }
        if (isRisky && o.kind !== "private") return false;        // ข้อความสาธารณะที่เสี่ยง: ไม่เปิดแผงแชร์
        build();
        opts = { text: msg, url: o.url || "", kind: o.kind === "private" ? "private" : "public", lang: o.lang, onShared: o.onShared };
        sharedOnce = false;
        returnTo = document.activeElement;
        fill();
        root.hidden = false;
        const first = root.querySelector(".hks-native:not([hidden])") || root.querySelector(".hks-app");
        first.focus();
        return true;
    }
    function close() {
        if (!root || root.hidden) return;
        root.hidden = true;
        if (returnTo && returnTo.focus && document.contains(returnTo)) returnTo.focus({ preventScroll: true });
        returnTo = null;
    }

    return { open: open, close: close, text: text, copy: copy, isOpen: function () { return !!root && !root.hidden; } };
})();
