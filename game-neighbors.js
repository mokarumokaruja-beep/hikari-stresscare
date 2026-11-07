// =====================================================================
// Hikari สวนแสง - game-neighbors.js (v30 neighbors) "เพื่อนบ้าน"
// - เพื่อนบ้านแวะมาเยี่ยมเอง วันละ 1 ตัวต่อโลก (todaysVisitor ใน game.js) → ป้ายบอกชื่อ + "แตะเพื่อทักทาย"
//   ครั้งแรกที่ยังไม่เคยทักใครเลย น้องหันไปมองแล้วชวนทักทาย (ครั้งเดียว)
// - อัลบั้ม (แท็บฉัน): กติกาสั้น ๆ + สถานะวันนี้ + ปุ่ม "?" อธิบาย + ปุ่ม "ไปเยี่ยม" เพื่อนที่เคยเจอ
// - ไปเยี่ยมบ้านเพื่อน: ฉากสั้น ๆ น้องเดินไปหาเพื่อน ทักทาย (หัวใจ) แล้วเลือกกิจกรรม ~1 นาที
//   (พูดคำใจดี = self-compassion ผ่านเพื่อน · เล่าเรื่องดีเล็ก ๆ = savoring · รดน้ำต้นไม้ = behavioral activation · หายใจด้วยกัน)
//   แสง +1 ได้วันละ 1 ครั้ง ไม่มีเวลารอ ไม่มีบทลงโทษ ไม่บังคับไป
// - ชวนเพื่อนบ้านไปเที่ยว: ตอนอยู่ที่เที่ยว (ฉาก trip) เพื่อนเดินเล่นข้าง ๆ น้อง จนกว่าจะกลับบ้าน
// ข้อความอยู่ที่ GTEXT (คีย์ nb_*) ใน game-data.js + game/lang/*.js
// ใช้จาก game.js: S, save, L, t, img, $, petName, placeName, addLight, markActive, rolloverCheck, toast,
//   todaysVisitor, renderMe, currentTab, quickBreathe, openHelp · game-pet.js: Pet · game-world.js: HikariWorld
// =====================================================================
var HikariNeighbors = (function () {
    "use strict";
    const reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const VISIT_LIGHT = 1;                                    // แสงจากการไปเยี่ยม: 1 แสง วันละ 1 ครั้ง

    // ----- บ้านของเพื่อนแต่ละตัว: [ภาพฉาก, ชื่อสถานที่] (ชื่อขึ้นต้น pl_ = GTEXT nb_pl_*, นอกนั้น = รหัสที่เที่ยวใน TRIP_STOPS) -----
    const HOMES = {
        "vcat_orange-tabby": ["bg_trip_lopburi-sunflower", "lopburi-sunflower"],
        "vcat_black": ["bg_cat_night", "pl_night"],
        "vcat_brown-tabby": ["bg_cat_sunset", "pl_sunset"],
        "vcat_calico": ["bg_trip_floating-market", "floating-market"],
        "vcat_tuxedo": ["bg_rainy_room", "pl_rainy"],
        "vcat_light-grey": ["bg_trip_phu-chi-fa", "phu-chi-fa"],
        "vcat_wichienmaat": ["bg_trip_ayutthaya", "ayutthaya"],
        "vcat_khao-manee": ["bg_trip_doi-inthanon", "doi-inthanon"],
        "vcat_korat": ["bg_trip_phang-nga", "phang-nga"],
        "vcat_suphalak": ["bg_cat_day", "pl_garden"],
        "vcat_festival": ["bg_trip_chiang-mai-yi-peng", "chiang-mai-yi-peng"],
        "vdog_tricolor": ["bg_dog_lawn", "pl_lawn"],
        "vdog_grey": ["bg_trip_mountain-lookout", "pl_lookout"],
        "vdog_cream": ["bg_trip_krabi", "krabi"],
        "vdog_corgi": ["bg_dog_day", "pl_yard"],
        "vdog_golden": ["bg_trip_erawan-waterfall", "erawan-waterfall"],
        "vdog_black-tan": ["bg_trip_khao-yai", "khao-yai"],
        "bird_idle": ["bg_dog_lawn", "pl_lawn"],
        "turtle_idle": ["bg_trip_krabi", "krabi"],
        "elephant_idle": ["bg_trip_khao-yai", "khao-yai"]
    };
    const ACTS = ["kind", "share", "water", "breathe"];
    const ACT_ICON = { kind: "💬", share: "🌼", water: "🪴", breathe: "🍃" };

    function name(v) { return t("nb_n_" + v); }
    function home(v) {
        const h = HOMES[v] || ["bg_dog_lawn", "pl_lawn"];
        return { bg: h[0], name: h[1].indexOf("pl_") === 0 ? t("nb_" + h[1]) : placeName(h[1]) };
    }
    function steps(k, v) { return t("nb_act_" + k, { name: name(v), pet: petName() }).split("|"); }
    // ปุ่ม ต่อไป / เสร็จแล้ว / ไว้ก่อนนะ / เริ่มเลย / ราว 1 นาที ใช้ข้อความ 10 ภาษาของ game-world.js
    function wt(k) {
        const tx = (typeof HikariWorld !== "undefined" && HikariWorld.text) || null;
        if (!tx) return k;
        return (tx[L] && tx[L][k]) || tx.en[k] || k;
    }
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
    function todayObj() { if (!S.today || typeof S.today !== "object") S.today = {}; return S.today; }
    function metList() {
        const out = [];
        Object.keys(WORLDS).forEach(function (k) { WORLDS[k].visitors.forEach(function (v) { if (S.met[v]) out.push(v); }); });
        return out;
    }

    // ===================== 1. เพื่อนที่แวะมาบ้าน: ป้ายชื่อ + คำใบ้ครั้งแรก =====================
    let tagEl = null, hintTimer = 0;
    function visitor(v) {
        const btn = $("visitorBtn");
        if (!btn) return;
        if (!tagEl) {
            tagEl = el("span", "nb-tag");
            tagEl.setAttribute("aria-hidden", "true");
            btn.appendChild(tagEl);
        }
        if (!v) return;
        const label = t("nb_tag", { name: name(v) });
        tagEl.textContent = label;
        btn.setAttribute("aria-label", label);
        $("visitorImg").alt = name(v);
        // ยังไม่เคยทักใครเลย: น้องหันไปมองแล้วชวนทักทาย (ครั้งเดียว)
        const atHome = !$("stage") || $("stage").dataset.place === undefined || $("stage").dataset.place === "home" || !S.place || S.place === "home";
        if (!btn.hidden && atHome && !S.nbHint && !Object.keys(S.met).length && typeof Pet !== "undefined") {
            S.nbHint = true;
            save();
            clearTimeout(hintTimer);
            tagEl.classList.add("nb-glow");
            hintTimer = setTimeout(function () {
                if ($("visitorBtn").hidden || !Pet.isActive()) return;
                Pet.say(t("nb_petHint", { name: name(v) }));
                if (Pet._api && Pet._api.face) Pet._api.face(10);
            }, 2600);
        }
    }

    // ===================== 2. อัลบั้ม =====================
    function renderAlbum(album) {
        album.textContent = "";
        let rule = $("nbRule"), st = $("nbStatus");
        if (!rule) {
            rule = el("p", "nb-rule");
            rule.id = "nbRule";
            st = el("p", "nb-status");
            st.id = "nbStatus";
            st.setAttribute("role", "status");
            album.parentNode.insertBefore(rule, album);
            album.parentNode.insertBefore(st, album);
        }
        rule.textContent = t("nb_rule");
        st.textContent = statusText();
        const seen = todayObj().nbSeen || {};
        Object.keys(WORLDS).forEach(function (k) {
            WORLDS[k].visitors.forEach(function (v) {
                const im = el("img");
                im.src = img(v);
                im.alt = "";
                if (!S.met[v]) {
                    const lk = el("span", "nb-tile locked");
                    lk.setAttribute("role", "img");
                    lk.setAttribute("aria-label", t("nb_locked"));
                    im.className = "locked";
                    lk.appendChild(im);
                    album.appendChild(lk);
                    return;
                }
                const b = el("button", "nb-tile");
                b.type = "button";
                b.setAttribute("aria-label", t("nb_visitAria", { name: name(v) }) + (seen[v] ? " · " + t("nb_visited") : ""));
                b.append(im, el("b", "nb-name", name(v)), el("small", "nb-go" + (seen[v] ? " done" : ""), seen[v] ? "✓ " + t("nb_visited") : t("nb_visit")));
                b.addEventListener("click", function () { openVisit(v, b); });
                album.appendChild(b);
            });
        });
    }
    function statusText() {
        if (S.world === "trip") return t("nb_stTrip");
        const v = todaysVisitor();
        if (!v) return "";
        if (todayObj().visitor) return t("nb_stDone");
        return t("nb_stWait", { name: name(v) });
    }

    // ===================== 3. หน้าต่างอธิบาย "?" =====================
    let infoFrom = null;
    function openInfo(from) {
        let sh = $("nbInfo");
        if (!sh) {
            sh = el("div", "sheet sheet-center nb-layer");
            sh.id = "nbInfo";
            sh.hidden = true;
            sh.innerHTML = '<div class="sheet-box nb-info-box" role="dialog" aria-modal="true" aria-labelledby="nbInfoTitle">' +
                '<button class="sheet-close" type="button" id="nbInfoClose">×</button>' +
                '<h2 class="h-display" id="nbInfoTitle"></h2><ul class="nb-info-list" id="nbInfoList"></ul>' +
                '<div class="item-actions"><button class="btn btn-primary" type="button" id="nbInfoOk"></button></div></div>';
            $("app").appendChild(sh);
            $("nbInfoClose").addEventListener("click", closeInfo);
            $("nbInfoOk").addEventListener("click", closeInfo);
            sh.addEventListener("click", function (e) { if (e.target === sh) closeInfo(); });
        }
        infoFrom = from || document.activeElement;
        $("nbInfoTitle").textContent = t("nb_infoTitle");
        $("nbInfoClose").setAttribute("aria-label", t("close"));
        $("nbInfoOk").textContent = wt("done");
        const list = $("nbInfoList");
        list.textContent = "";
        [["🏡", t("nb_rule")], ["📖", statusText()], ["🧺", t("nb_info2")], ["🗺️", t("nb_info3", { pet: petName() })], ["🌱", t("nb_info4")]].forEach(function (r) {
            if (!r[1]) return;
            const li = el("li");
            li.append(el("span", "nb-ico", r[0]), el("span", "", r[1]));
            li.firstChild.setAttribute("aria-hidden", "true");
            list.appendChild(li);
        });
        sh.hidden = false;
        $("nbInfoOk").focus();
    }
    function closeInfo() {
        $("nbInfo").hidden = true;
        if (infoFrom && infoFrom.focus && document.contains(infoFrom)) infoFrom.focus();
        infoFrom = null;
    }

    // ===================== 4. ไปเยี่ยมบ้านเพื่อน =====================
    let vis = null, visFrom = null, arriveTimer = 0;
    function buildVisit() {
        const sh = el("div", "sheet nb-layer nb-visit");
        sh.id = "nbVisit";
        sh.hidden = true;
        sh.innerHTML = '<div class="sheet-box nb-box" role="dialog" aria-modal="true" aria-labelledby="nbTitle">' +
            '<div class="nb-scene" id="nbScene">' +
            '<img class="nb-bg" id="nbBg" alt="">' +
            '<p class="nb-title" id="nbTitle"></p>' +
            '<p class="nb-say" id="nbSay" hidden></p>' +
            '<div class="nb-friend" id="nbFriend"><img id="nbFriendImg" alt=""></div>' +
            '<div class="nb-pet" id="nbPet"><img id="nbPetImg" alt=""></div>' +
            '<div class="fx nb-fx" id="nbFx" aria-hidden="true"></div>' +
            '<button class="sheet-close nb-x" type="button" id="nbClose">×</button></div>' +
            '<div class="nb-panel" id="nbPanel" aria-live="polite"></div>' +
            '<button class="btn btn-small help-btn nb-help" type="button" id="nbHelp"></button></div>';
        $("app").appendChild(sh);
        $("nbClose").addEventListener("click", closeVisit);
        $("nbHelp").addEventListener("click", function () { if (typeof openHelp === "function") openHelp(); });
        $("nbFriend").addEventListener("click", function () { if (vis) greet(); });
        sh.addEventListener("click", function (e) { if (e.target === sh) closeVisit(); });
        document.addEventListener("keydown", function (e) {
            if (e.key !== "Escape") return;
            if ($("helpSheet") && !$("helpSheet").hidden) return;
            if (!sh.hidden) closeVisit();
            else if ($("nbInfo") && !$("nbInfo").hidden) closeInfo();
            else if ($("nbInvite") && !$("nbInvite").hidden) closeInvite();
        });
    }
    function openVisit(v, from) {
        if (!S.met[v]) return;
        if (!$("nbVisit")) buildVisit();
        if (typeof rolloverCheck === "function") rolloverCheck();
        vis = { v: v, act: null, i: 0 };
        visFrom = from || document.activeElement;
        const h = home(v);
        $("nbBg").src = img(h.bg);
        $("nbTitle").textContent = t("nb_homeOf", { name: name(v), place: h.name });
        $("nbFriendImg").src = img(v);
        $("nbFriendImg").alt = name(v);
        $("nbPetImg").src = img(WORLDS[S.world].pet.happy);
        $("nbPetImg").alt = petName();
        $("nbClose").setAttribute("aria-label", t("close"));
        $("nbHelp").textContent = t("helpBtn");
        $("nbSay").hidden = true;
        $("nbFx").textContent = "";
        const pet = $("nbPet");
        pet.className = "nb-pet";
        void pet.offsetWidth;
        $("nbVisit").hidden = false;
        renderPick();
        clearTimeout(arriveTimer);
        // น้องเดินไปหาเพื่อน แล้วทักทายกัน (ลดการเคลื่อนไหว = ไปถึงเลย)
        if (reduced) { pet.classList.add("there"); greet(); }
        else {
            requestAnimationFrame(function () { pet.classList.add("walk", "there"); });
            arriveTimer = setTimeout(function () { pet.classList.remove("walk"); greet(); }, 1700);
        }
    }
    function greet() {
        if (!vis) return;
        const f = $("nbFriend");
        f.classList.remove("hop"); void f.offsetWidth; f.classList.add("hop");
        hearts(5);
        const say = $("nbSay");
        say.textContent = name(vis.v) + ": " + t("nb_hi");
        say.hidden = false;
    }
    function hearts(n) {
        const fx = $("nbFx");
        if (!fx || reduced) return;
        for (let i = 0; i < n; i++) {
            const s = el("span", "heart", "♥");
            s.style.left = (44 + Math.random() * 22) + "%";
            s.style.top = (48 + Math.random() * 14) + "%";
            s.style.animationDelay = (i * 0.12) + "s";
            fx.appendChild(s);
            setTimeout(function () { s.remove(); }, 2200);
        }
    }
    function panel() { const p = $("nbPanel"); p.textContent = ""; return p; }
    function renderPick() {
        vis.act = null;
        const p = panel();
        p.appendChild(el("p", "nb-ask", t("nb_pick")));
        const grid = el("div", "nb-acts");
        ACTS.forEach(function (k) {
            const b = el("button", "nb-act");
            b.type = "button";
            b.dataset.act = k;
            const ico = el("span", "nb-act-ico", ACT_ICON[k]);
            ico.setAttribute("aria-hidden", "true");
            b.append(ico, el("span", "", steps(k, vis.v)[0]));
            b.addEventListener("click", function () { startAct(k); });
            grid.appendChild(b);
        });
        p.appendChild(grid);
        const row = el("div", "item-actions nb-row");
        const back = el("button", "btn", wt("home"));
        back.type = "button";
        back.addEventListener("click", closeVisit);
        row.appendChild(back);
        p.appendChild(row);
    }
    function startAct(k) {
        vis.act = k;
        vis.lines = steps(k, vis.v);
        vis.i = 1;
        renderStep();
    }
    function renderStep() {
        const p = panel(), n = vis.lines.length - 1, last = vis.i >= n;
        p.appendChild(el("h2", "h-display nb-act-title", vis.lines[0]));
        p.appendChild(el("p", "muted nb-meta", wt("oneMin")));
        const dots = el("div", "w-act-dots");
        dots.setAttribute("aria-hidden", "true");
        for (let i = 1; i <= n; i++) dots.appendChild(el("i", i <= vis.i ? "on" : ""));
        p.appendChild(dots);
        p.appendChild(el("p", "w-act-step nb-step", vis.lines[vis.i]));
        const row = el("div", "item-actions nb-row");
        const later = el("button", "btn", wt("later"));
        later.type = "button";
        later.addEventListener("click", renderPick);
        const next = el("button", "btn btn-primary", vis.act === "breathe" ? wt("start") : (last ? wt("done") : wt("next")));
        next.type = "button";
        next.id = "nbNext";
        next.addEventListener("click", nextStep);
        row.append(later, next);
        p.appendChild(row);
        next.focus({ preventScroll: true });
    }
    function nextStep() {
        if (!vis || !vis.act) return;
        if (vis.act === "breathe") {
            const v = vis.v;
            complete(v, true);
            closeVisit(true);
            if (typeof quickBreathe === "function") quickBreathe("calm"); else showTab("breathe");
            return;
        }
        if (vis.i < vis.lines.length - 1) { vis.i++; renderStep(); return; }
        complete(vis.v, false);
        renderDone();
    }
    // ทำกิจกรรมเสร็จ: แสง +1 วันละครั้ง (ไปเยี่ยมกี่บ้านก็ได้ ทำต่อได้ ไม่ได้แสงเพิ่ม) · ไม่มีบทลงโทษ
    function complete(v, quiet) {
        if (typeof rolloverCheck === "function") rolloverCheck();
        const td = todayObj();
        if (!td.nbSeen || typeof td.nbSeen !== "object") td.nbSeen = {};
        td.nbSeen[v] = true;
        S.stats.nbVisits = (S.stats.nbVisits || 0) + 1;
        const gain = td.nbLight ? 0 : VISIT_LIGHT;
        if (gain) { td.nbLight = true; addLight(gain); } else { markActive(); save(); }
        const msg = gain ? t("nb_gain", { n: gain, name: name(v) }) : t("nb_gainMax", { name: name(v) });
        toast(msg);
        if (!quiet) { hearts(6); const f = $("nbFriend"); f.classList.remove("hop"); void f.offsetWidth; f.classList.add("hop"); }
        return msg;
    }
    function renderDone() {
        const p = panel();
        const ico = el("p", "nb-done-ico", "♥");
        ico.setAttribute("aria-hidden", "true");
        p.appendChild(ico);
        p.appendChild(el("p", "nb-step", todayObj().nbLight ? t("nb_gain", { n: VISIT_LIGHT, name: name(vis.v) }) : t("nb_gainMax", { name: name(vis.v) })));
        const row = el("div", "item-actions nb-row");
        const more = el("button", "btn", t("nb_again"));
        more.type = "button";
        more.addEventListener("click", renderPick);
        const back = el("button", "btn btn-primary", wt("home"));
        back.type = "button";
        back.id = "nbHome";
        back.addEventListener("click", function () { closeVisit(); });
        row.append(more, back);
        p.appendChild(row);
        back.focus({ preventScroll: true });
    }
    function closeVisit(silent) {
        clearTimeout(arriveTimer);
        if ($("nbVisit")) $("nbVisit").hidden = true;
        vis = null;
        if (typeof currentTab !== "undefined" && currentTab === "me" && typeof renderMe === "function") renderMe();
        if (silent !== true && visFrom && visFrom.focus && document.contains(visFrom)) visFrom.focus();
        else if (silent !== true && $("albumBox")) { const b = $("albumBox").querySelector(".nb-tile:not(.locked)"); if (b) b.focus(); }
        visFrom = null;
    }

    // ===================== 5. ชวนเพื่อนบ้านไปเที่ยว (เดินเล่นข้าง ๆ น้อง) =====================
    let invBtn = null, comp = null, compTimer = 0, invFrom = null;
    function onTrip() {
        const st = $("stage");
        return !!(st && st.dataset.place === "trip");
    }
    function afterRender() {
        const stage = $("stage");
        if (!stage || !S.world) return;
        if (!invBtn) {
            invBtn = el("button", "w-ui nb-invite");
            invBtn.type = "button";
            invBtn.id = "nbInviteBtn";
            invBtn.addEventListener("click", function (e) { e.stopPropagation(); if (comp) sayBye(); else openInvite(invBtn); });
            stage.appendChild(invBtn);
        }
        const trip = onTrip();
        invBtn.hidden = !trip;
        if (!trip) {
            // กลับบ้าน (หรือไปที่อื่นที่ไม่ใช่ที่เที่ยว) = เพื่อนกลับบ้านตัวเอง
            if (S.nbComp) { S.nbComp = null; save(); }
            removeComp();
            return;
        }
        if (S.nbComp && S.met[S.nbComp]) showComp(S.nbComp, false); else removeComp();
        invBtn.textContent = comp ? "👋 " + t("nb_bye", { name: name(comp.v) }) : "🐾 " + t("nb_invite");
    }
    function openInvite(from) {
        let sh = $("nbInvite");
        if (!sh) {
            sh = el("div", "sheet nb-layer");
            sh.id = "nbInvite";
            sh.hidden = true;
            sh.innerHTML = '<div class="sheet-box" role="dialog" aria-modal="true" aria-labelledby="nbInvTitle">' +
                '<button class="sheet-close" type="button" id="nbInvClose">×</button>' +
                '<h2 class="h-display" id="nbInvTitle"></h2><p class="muted" id="nbInvSub"></p><div class="nb-inv-list" id="nbInvList"></div></div>';
            $("app").appendChild(sh);
            $("nbInvClose").addEventListener("click", closeInvite);
            sh.addEventListener("click", function (e) { if (e.target === sh) closeInvite(); });
        }
        invFrom = from || document.activeElement;
        $("nbInvTitle").textContent = t("nb_inviteTitle");
        $("nbInvClose").setAttribute("aria-label", t("close"));
        const list = $("nbInvList"), met = metList();
        list.textContent = "";
        $("nbInvSub").textContent = met.length ? t("nb_inviteSub", { pet: petName() }) : t("nb_inviteNone");
        met.forEach(function (v) {
            const b = el("button", "nb-inv-item");
            b.type = "button";
            const im = el("img");
            im.src = img(v);
            im.alt = "";
            b.append(im, el("b", "", name(v)));
            b.addEventListener("click", function () {
                S.nbComp = v;
                save();
                closeInvite(true);
                showComp(v, true);
                afterRender();
                if (typeof Pet !== "undefined") Pet.say(t("nb_withYou", { name: name(v) }));
            });
            list.appendChild(b);
        });
        sh.hidden = false;
        $("nbInvClose").focus();
    }
    function closeInvite(silent) {
        $("nbInvite").hidden = true;
        if (silent !== true && invFrom && invFrom.focus && document.contains(invFrom)) invFrom.focus();
        invFrom = null;
    }
    function sayBye() {
        if (!comp) return;
        const v = comp.v;
        S.nbComp = null;
        save();
        removeComp();
        afterRender();
        if (typeof Pet !== "undefined") Pet.say(t("nb_byeSay", { name: name(v) }));
        if (invBtn) invBtn.focus();
    }
    function showComp(v, fresh) {
        const world = $("wWorld");
        if (!world || typeof Pet === "undefined") return;
        if (comp && comp.v === v && comp.el.parentNode === world) return;
        removeComp();
        const d = el("button", "nb-comp");
        d.type = "button";
        d.setAttribute("aria-label", name(v));
        const fl = el("span", "nb-comp-flip");
        const im = el("img");
        im.src = img(v);
        im.alt = "";
        im.draggable = false;
        fl.appendChild(im);
        d.append(el("span", "nb-comp-shadow"), fl);
        d.addEventListener("click", function (e) {
            e.stopPropagation();
            d.classList.remove("hop"); void d.offsetWidth; d.classList.add("hop");
            if (typeof Pet !== "undefined") Pet.say(t("nb_compLine", { name: name(v) }));
        });
        world.appendChild(d);
        comp = { v: v, el: d, x: 0, y: 0 };
        const B = Pet.bounds || {}, p = Pet.pos || { x: 50, y: 9 };
        const off = 20 / Math.max(1, B.ratio || 1);
        place(p.x > 50 ? p.x - off : p.x + off, p.y + 2, 0);
        if (fresh && !reduced) d.classList.add("pop");
        clearTimeout(compTimer);
        compTimer = setTimeout(wander, 1200);
    }
    function place(x, y, sec) {
        const B = Pet.bounds || {};
        const x0 = B.x0 !== undefined ? B.x0 : 16, x1 = B.x1 !== undefined ? B.x1 : 84;
        const y0 = B.y0 !== undefined ? B.y0 : 3, y1 = B.y1 !== undefined ? B.y1 : 18;
        x = Math.max(x0, Math.min(x1, x));
        y = Math.max(y0, Math.min(y1, y));
        const d = comp.el;
        if (Math.abs(x - comp.x) > 0.5) d.classList.toggle("left", x < comp.x);
        comp.x = x;
        comp.y = y;
        const far = (y - y0) / Math.max(1, y1 - y0);
        d.style.setProperty("--walk", (reduced ? 0 : sec) + "s");
        d.style.setProperty("--depth", ((1.1 - far * 0.29) * (B.scale || 1)).toFixed(3));
        d.style.zIndex = String(40 - Math.round(y));
        d.style.left = x + "%";
        d.style.bottom = y + "%";
        d.classList.toggle("walking", !reduced && sec > 0.2);
        if (!reduced && sec > 0.2) setTimeout(function () { if (comp && comp.el === d) d.classList.remove("walking"); }, sec * 1000);
    }
    // เดินเล่นใกล้ ๆ น้อง (หยุดเมื่อแท็บซ่อน / ไม่ได้อยู่หน้าบ้าน)
    function wander() {
        clearTimeout(compTimer);
        if (!comp) return;
        const visible = !document.hidden && $("screen-home") && !$("screen-home").hidden;
        if (visible && document.contains(comp.el)) {
            const B = Pet.bounds || {}, p = Pet.pos || { x: 50, y: 9 }, r = Math.max(1, B.ratio || 1);
            const side = Math.random() < 0.5 ? -1 : 1;
            const tx = p.x + side * (16 + Math.random() * 10) / r, ty = p.y + (Math.random() * 6 - 2);
            const dx = (tx - comp.x) * r, dy = ty - comp.y, dist = Math.sqrt(dx * dx + dy * dy * 4);
            if (dist > 4) place(tx, ty, Math.max(0.6, Math.min(3, dist / 18)));
        }
        compTimer = setTimeout(wander, 2400 + Math.random() * 2600);
    }
    function removeComp() {
        clearTimeout(compTimer);
        if (comp && comp.el) comp.el.remove();
        comp = null;
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden && comp) wander(); });

    // ----- ต่อเข้ากับโลก 2.5D: ทุกครั้งที่วาดฉากใหม่ (ไม่แก้ game-world.js) -----
    if (typeof HikariWorld !== "undefined" && HikariWorld.render) {
        const baseRender = HikariWorld.render;
        HikariWorld.render = function () { baseRender.apply(this, arguments); afterRender(); };
        if ($("screen-home") && !$("screen-home").hidden) afterRender();
    }
    // game.js วาดหน้าบ้านครั้งแรกก่อนไฟล์นี้โหลด: ใส่ป้ายชื่อเพื่อนที่แวะมาตอนนี้เลย
    if (S.world && typeof todaysVisitor === "function") visitor(todaysVisitor());
    // ปุ่ม "?" ที่หัวอัลบั้ม
    if ($("nbInfoBtn")) $("nbInfoBtn").addEventListener("click", function () { openInfo($("nbInfoBtn")); });

    return { visitor: visitor, renderAlbum: renderAlbum, openInfo: openInfo, openVisit: openVisit, openInvite: openInvite,
        afterRender: afterRender, homes: HOMES, name: name };
})();
