// =====================================================================
// Hikari สวนแสง - game-friends.js (v30) "เพื่อนในสวนแสง" ผ่านลิงก์ชวน (ไม่มีเซิร์ฟเวอร์)
// - บ้านของฉัน: ส่งลิงก์ game.html#f=<payload> ให้เพื่อนมาเยี่ยมสวน (ชื่อเล่น โลก น้อง ของแต่ง 4 ชิ้น จำนวนแสตมป์)
// - เยี่ยมสวนเพื่อน: เปิด #f= → ฉากสวนของเพื่อน ลูบน้องได้ ฝากของขวัญ (สติกเกอร์ + ข้อความสำเร็จรูป) → ลิงก์ #g=
// - กล่องของขวัญ: เปิด #g= → เก็บในเครื่อง (ไม่ซ้ำ) น้องคาบจดหมายมาให้ · ส่งกำลังใจกลับ · ซ่อนจากคนนี้ · ลบ
// - เที่ยวด้วยกัน: ลิงก์ #t= → ไปที่เที่ยวนั้น น้องของเพื่อนเดินเล่นข้าง ๆ ได้แสตมป์ "เที่ยวด้วยกัน" ส่งโปสการ์ดกลับได้
// - ข้อความพิมพ์เอง: เฉพาะเพื่อนที่ส่งลิงก์หากันแล้วทั้งสองฝ่าย ≤ 80 ตัว ไม่มีลิงก์/อีเมล/เบอร์/@/ไอดีไลน์
//   ผ่าน HikariSafety.hasRiskText + hasAbuseText + ตัวกรองคำหยาบ 10 ภาษา · ตรวจซ้ำตอนรับ (ลิงก์แก้เองได้)
// - ไม่มีการแข่งขัน ไม่มีอันดับ ไม่มีวันติดกัน ไม่มีข้อความเร่ง/ทำให้รู้สึกผิด · ไม่มีข้อมูลอารมณ์/คะแนน/ชื่อผู้ใช้ในลิงก์
// - FriendsTransport: { name, shareVisit(snapshot, onShared?), shareGift(gift, toCode, onShared?), shareTrip(invite, onShared?), onIncoming(cb) }
//   ตอนนี้ใช้ LinkTransport (share.js + อ่าน hash) · อนาคตเปลี่ยนเป็นเซิร์ฟเวอร์ (เช่น Firebase) ได้โดยไม่แตะ UI
// ใช้จาก game.js: S, save, L, t, img, $, petName, placeName, itemName, addLight, toast, showTab, openHelp, openTalk,
//   riskBox, timeOfDay, tripStop, goPlace, dayStr, USER_KEY, mapPickIdx, currentTab · game-data.js: WORLDS, TRIP_STOPS, GAME_ITEMS
//   safety.js: HikariSafety, hkAbuseCard · share.js: HikariShare · game-world.js: HikariWorld · game-pet.js: Pet
// ทดสอบในโหนดได้: ส่วน Core ไม่แตะ DOM (ส่วน UI ทำงานเฉพาะเมื่อมี document + S)
// =====================================================================
var HikariFriends = (function () {
    "use strict";
    const GL = typeof globalThis !== "undefined" ? globalThis : this;
    // ค่าคงที่ระดับบนสุดของไฟล์อื่น (const ไม่อยู่ใน window จึงใช้ typeof ตรง ๆ)
    function gWorlds() { return typeof WORLDS !== "undefined" ? WORLDS : null; }
    function gStops() { return typeof TRIP_STOPS !== "undefined" ? TRIP_STOPS : null; }
    function gItems() { return typeof GAME_ITEMS !== "undefined" ? GAME_ITEMS : null; }
    function gSafety() { return typeof HikariSafety !== "undefined" ? HikariSafety : null; }

    // ---------- ข้อความ 10 ภาษา ----------
    const FX = {
        th: {
            title: "เพื่อนในสวนแสง", sub: "ชวนเพื่อนมาเยี่ยมสวน ส่งสติกเกอร์กับกำลังใจให้กันเบา ๆ", openBtn: "เพื่อนและของขวัญ",
            invite: "ชวนเพื่อนมาเยี่ยมสวน", inviteText: "มาเยี่ยมสวนของฉันใน Hikari สวนแสงกันนะ 🌷 มาทักทาย{pet}ได้เลย",
            giftText: "ส่งกำลังใจเล็ก ๆ จากสวนแสงมาให้ 💌 เปิดดูได้เลย", tripText: "ไปเที่ยว{place}ด้วยกันไหม 🗺️ {pet}ไปด้วยนะ",
            postText: "ส่งโปสการ์ดจาก{place}มาให้ 💌", visiting: "กำลังเยี่ยมสวนของ {name}",
            visitHint: "แตะ{pet}เพื่อลูบได้นะ · ฝากของขวัญไว้ก่อนกลับก็ได้", snapNote: "หน้าตาสวนตอนที่ส่งลิงก์มา",
            exit: "กลับสวนของฉัน", leaveGift: "ฝากของขวัญ", pickSticker: "เลือกสติกเกอร์", pickMsg: "เลือกข้อความ",
            own: "ข้อความสั้น ๆ ของคุณเอง (ไม่ใส่ก็ได้)", ownHint: "ไม่เกิน 80 ตัวอักษร · ไม่ใส่ลิงก์ เบอร์โทร หรือช่องทางติดต่อ",
            ownLocked: "พิมพ์ข้อความเองได้เมื่อส่งลิงก์หากันทั้งสองฝ่ายแล้ว ตอนนี้ส่งสติกเกอร์กับข้อความสำเร็จรูปได้เลย",
            send: "ส่งของขวัญ…", sendNoText: "ส่งแค่สติกเกอร์กับข้อความ…",
            errLen: "ยาวเกิน 80 ตัวอักษร ลองย่ออีกนิดนะ", errContact: "มีลิงก์ เบอร์โทร หรือช่องทางติดต่ออยู่ เพื่อความปลอดภัยของทั้งสองฝ่าย ลบส่วนนั้นออกก่อนนะ",
            errMean: "ข้อความนี้อาจทำให้เพื่อนเจ็บใจ ลองใช้คำที่อ่อนโยนขึ้น หรือส่งข้อความสำเร็จรูปแทนก็ได้นะ",
            riskDrop: "ข้อความที่พิมพ์จะไม่ถูกส่งไปกับของขวัญ เก็บไว้กับตัวเองก่อนก็ได้นะ",
            petted: "{pet}ดีใจจัง 💗", from: "จาก {name}", to: "ถึง {name}", mailbox: "กล่องของขวัญ", mailEmpty: "ยังไม่มีของขวัญในกล่อง",
            reply: "ส่งกำลังใจกลับ", mute: "ซ่อนจากคนนี้", unmute: "เลิกซ่อน", del: "ลบ", muted: "ซ่อนแล้ว จะไม่เห็นของขวัญและลิงก์จากคนนี้",
            newGift: "{name} ส่งของขวัญมาให้ 💌 แตะเพื่อเปิดดู", giftLight: "+1 แสง · ของขวัญชิ้นแรกของวันนี้",
            friends: "เพื่อน", friendsEmpty: "ยังไม่มีเพื่อนในรายชื่อ ลองส่งลิงก์สวนให้ใครสักคนดูไหม",
            mutual: "ส่งลิงก์หากันแล้ว", oneWay: "ได้รับลิงก์จากเพื่อนแล้ว", visit: "ไปเยี่ยม", trip: "ชวนไปเที่ยว", remove: "ลบออก",
            removed: "ลบออกจากรายชื่อแล้ว", seen: "ล่าสุด {date}", nick: "ชื่อที่เพื่อนเห็น", nickPh: "เช่น {def}", save: "บันทึก",
            nickSaved: "บันทึกชื่อแล้ว", nickBad: "ใช้ชื่อนี้ไม่ได้ ลองชื่อสั้น ๆ ไม่เกิน 16 ตัว ไม่มีเบอร์หรือช่องทางติดต่อนะ", code: "รหัสเพื่อนของฉัน",
            peer: "เพื่อนเป็นกำลังใจให้กันได้ แต่ไม่ใช่ผู้เชี่ยวชาญ ถ้าเพื่อนดูไม่ปลอดภัย ชวนเขาโทร 1323 หรือกดขอความช่วยเหลือได้เลย",
            privacy: "ลิงก์มีแค่ชื่อเล่น น้อง และหน้าตาสวน ใครมีลิงก์ก็เห็นได้ ไม่มีข้อมูลถูกอัปโหลดไปที่ไหน",
            tripPick: "เลือกที่เที่ยว", tripAsk: "{name} ชวนไปเที่ยว{place}ด้วยกัน", tripGo: "ไปด้วยกัน", later: "ไว้ก่อนนะ",
            stampGot: "ได้แสตมป์เที่ยวด้วยกันที่{place} 🐾", together: "แสตมป์เที่ยวด้วยกัน", postcard: "ส่งโปสการ์ด", postFrom: "โปสการ์ดจาก{place}",
            compSay: "{name} กับ{pet}มาเที่ยวด้วยกัน 🐾 แตะเพื่อส่งโปสการ์ด", self: "นี่คือลิงก์ของคุณเอง ส่งให้เพื่อนได้เลยนะ",
            bad: "เปิดลิงก์นี้ไม่ได้ อาจไม่ครบหรือถูกแก้ไข", mutedLink: "ลิงก์นี้มาจากคนที่คุณซ่อนไว้", inviteMap: "ชวนเพื่อนไปด้วย",
            friendDef: "เพื่อน", friendOf: "เพื่อนของ{pet}", needWorld: "เลือกโลกของคุณก่อน แล้วค่อยไปเที่ยวด้วยกันนะ",
            dup: "ของขวัญชิ้นนี้อยู่ในกล่องแล้ว", back: "ย้อนกลับ", newBadge: "ใหม่", hidden: "ซ่อนไว้"
        },
        en: {
            title: "Garden friends", sub: "Invite friends to your garden and send each other stickers and kind words.", openBtn: "Friends & gifts",
            invite: "Invite a friend to my garden", inviteText: "Come visit my garden in Hikari Light Garden 🌷 Say hi to {pet}!",
            giftText: "A little kindness from my garden 💌 Open it here", tripText: "Want to visit {place} together? 🗺️ {pet} is coming too",
            postText: "A postcard from {place} 💌", visiting: "Visiting {name}'s garden",
            visitHint: "Tap {pet} to give a pat · you can leave a gift before you go", snapNote: "The garden as it looked when the link was sent",
            exit: "Back to my garden", leaveGift: "Leave a gift", pickSticker: "Pick a sticker", pickMsg: "Pick a message",
            own: "A short note of your own (optional)", ownHint: "Up to 80 characters · no links, phone numbers or contact details",
            ownLocked: "You can write your own note once you've both sent each other a link. For now, a sticker and a message are perfect.",
            send: "Send gift…", sendNoText: "Send sticker and message only…",
            errLen: "That's over 80 characters. Try making it a little shorter.", errContact: "This has a link, phone number or contact detail. To keep you both safe, please take that part out.",
            errMean: "This might hurt your friend's feelings. Try gentler words, or send one of the ready messages.",
            riskDrop: "What you typed won't be sent with the gift. You can keep it for yourself.",
            petted: "{pet} loves that 💗", from: "From {name}", to: "To {name}", mailbox: "Gift box", mailEmpty: "No gifts here yet.",
            reply: "Send kindness back", mute: "Hide this person", unmute: "Unhide", del: "Delete", muted: "Hidden. You won't see gifts or links from this person.",
            newGift: "{name} sent you a gift 💌 Tap to open", giftLight: "+1 light · first gift today",
            friends: "Friends", friendsEmpty: "No friends listed yet. You could send your garden link to someone.",
            mutual: "You've both sent links", oneWay: "You've received their link", visit: "Visit", trip: "Invite on a trip", remove: "Remove",
            removed: "Removed from your list", seen: "Last seen {date}", nick: "Name your friends see", nickPh: "e.g. {def}", save: "Save",
            nickSaved: "Name saved", nickBad: "That name can't be used. Try a short one (up to 16 characters) with no numbers or contact details.", code: "My friend code",
            peer: "Friends can cheer each other on, but they aren't counselors. If a friend seems unsafe, encourage them to call a helpline (1323 in Thailand) or use Help.",
            privacy: "A link holds only your nickname, pet and garden look. Anyone with the link can see that. Nothing is uploaded anywhere.",
            tripPick: "Pick a place", tripAsk: "{name} invited you to {place}", tripGo: "Let's go", later: "Maybe later",
            stampGot: "Trip-together stamp: {place} 🐾", together: "Trip-together stamps", postcard: "Send a postcard", postFrom: "Postcard from {place}",
            compSay: "{name} and {pet} came along 🐾 Tap to send a postcard", self: "This is your own link. Send it to a friend!",
            bad: "This link couldn't be opened. It may be incomplete or changed.", mutedLink: "This link is from someone you've hidden.", inviteMap: "Invite a friend",
            friendDef: "A friend", friendOf: "{pet}'s friend", needWorld: "Pick your world first, then you can go together.",
            dup: "This gift is already in your box.", back: "Back", newBadge: "New", hidden: "Hidden"
        },
        zh: {
            title: "花园朋友", sub: "邀请朋友来花园做客，互送贴纸和暖心话。", openBtn: "朋友和礼物",
            invite: "邀请朋友来我的花园", inviteText: "来 Hikari 光之花园看看我的花园吧 🌷 和{pet}打个招呼！",
            giftText: "从我的花园送你一点温暖 💌 点开看看", tripText: "一起去{place}吗？🗺️ {pet}也会去哦",
            postText: "来自{place}的明信片 💌", visiting: "正在拜访 {name} 的花园",
            visitHint: "点{pet}摸摸它 · 走之前可以留一份礼物", snapNote: "这是发送链接时花园的样子",
            exit: "回我的花园", leaveGift: "留一份礼物", pickSticker: "选一张贴纸", pickMsg: "选一句话",
            own: "你自己的一句话（可不写）", ownHint: "最多 80 字 · 不放链接、电话或联系方式",
            ownLocked: "你们互相发过链接后，就可以写自己的话。现在先送贴纸和一句话就很好。",
            send: "送出礼物…", sendNoText: "只送贴纸和那句话…",
            errLen: "超过 80 字了，再短一点吧。", errContact: "这里有链接、电话或联系方式。为了你们双方的安全，请先删掉这部分。",
            errMean: "这句话可能会让朋友难过。换个温柔一点的说法，或者选一句现成的话吧。",
            riskDrop: "你写的这段话不会随礼物发出，可以先留给自己。",
            petted: "{pet}好开心 💗", from: "来自 {name}", to: "给 {name}", mailbox: "礼物盒", mailEmpty: "礼物盒里还没有礼物。",
            reply: "回送一份温暖", mute: "隐藏此人", unmute: "取消隐藏", del: "删除", muted: "已隐藏，不会再看到此人的礼物和链接。",
            newGift: "{name} 给你送来礼物 💌 点开看看", giftLight: "+1 光 · 今天的第一份礼物",
            friends: "朋友", friendsEmpty: "名单里还没有朋友。可以把花园链接发给某个人试试。",
            mutual: "你们已互发链接", oneWay: "已收到对方的链接", visit: "去拜访", trip: "邀请去旅行", remove: "移除",
            removed: "已从名单中移除", seen: "最近 {date}", nick: "朋友看到的名字", nickPh: "例如 {def}", save: "保存",
            nickSaved: "名字已保存", nickBad: "这个名字不能用。试试 16 字以内、不含号码或联系方式的短名字。", code: "我的好友码",
            peer: "朋友可以互相打气，但不是专业人士。如果朋友看起来不安全，请鼓励对方拨打求助热线（泰国 1323）或点“求助”。",
            privacy: "链接里只有昵称、小伙伴和花园的样子。拿到链接的人都能看到。不会上传任何数据。",
            tripPick: "选择地点", tripAsk: "{name} 邀你一起去{place}", tripGo: "一起去", later: "下次吧",
            stampGot: "获得同游印章：{place} 🐾", together: "同游印章", postcard: "寄明信片", postFrom: "来自{place}的明信片",
            compSay: "{name} 和{pet}一起来啦 🐾 点一下寄明信片", self: "这是你自己的链接，发给朋友吧！",
            bad: "这个链接打不开，可能不完整或被改过。", mutedLink: "这个链接来自你隐藏的人。", inviteMap: "邀请朋友同去",
            friendDef: "一位朋友", friendOf: "{pet}的朋友", needWorld: "先选好你的世界，再一起出发吧。",
            dup: "这份礼物已经在礼物盒里了。", back: "返回", newBadge: "新", hidden: "已隐藏"
        },
        hi: {
            title: "बगीचे के दोस्त", sub: "दोस्तों को अपने बगीचे में बुलाएँ और एक-दूसरे को स्टिकर और प्यारे शब्द भेजें।", openBtn: "दोस्त और तोहफ़े",
            invite: "दोस्त को अपने बगीचे में बुलाएँ", inviteText: "Hikari लाइट गार्डन में मेरे बगीचे आओ 🌷 {pet} को हैलो कहो!",
            giftText: "मेरे बगीचे से तुम्हारे लिए थोड़ी-सी अपनापन 💌 यहाँ खोलो", tripText: "साथ में {place} चलें? 🗺️ {pet} भी चलेगा",
            postText: "{place} से एक पोस्टकार्ड 💌", visiting: "{name} के बगीचे में",
            visitHint: "{pet} को सहलाने के लिए टैप करें · जाने से पहले तोहफ़ा छोड़ सकते हैं", snapNote: "लिंक भेजते समय बगीचा ऐसा दिखता था",
            exit: "मेरे बगीचे में लौटें", leaveGift: "तोहफ़ा छोड़ें", pickSticker: "स्टिकर चुनें", pickMsg: "संदेश चुनें",
            own: "अपनी एक छोटी बात (ज़रूरी नहीं)", ownHint: "80 अक्षर तक · कोई लिंक, फ़ोन नंबर या संपर्क जानकारी नहीं",
            ownLocked: "जब आप दोनों एक-दूसरे को लिंक भेज चुके होंगे, तब अपनी बात लिख सकेंगे। अभी स्टिकर और संदेश ही काफ़ी हैं।",
            send: "तोहफ़ा भेजें…", sendNoText: "सिर्फ़ स्टिकर और संदेश भेजें…",
            errLen: "यह 80 अक्षरों से ज़्यादा है। थोड़ा छोटा करके देखें।", errContact: "इसमें लिंक, फ़ोन नंबर या संपर्क जानकारी है। दोनों की सुरक्षा के लिए वह हिस्सा हटा दें।",
            errMean: "इससे दोस्त को ठेस पहुँच सकती है। नरम शब्द आज़माएँ, या कोई तैयार संदेश भेजें।",
            riskDrop: "आपने जो लिखा वह तोहफ़े के साथ नहीं जाएगा। इसे अपने पास रख सकते हैं।",
            petted: "{pet} को बहुत अच्छा लगा 💗", from: "{name} की ओर से", to: "{name} के लिए", mailbox: "तोहफ़ों का डिब्बा", mailEmpty: "अभी कोई तोहफ़ा नहीं है।",
            reply: "प्यार वापस भेजें", mute: "इस व्यक्ति को छिपाएँ", unmute: "दिखाएँ", del: "हटाएँ", muted: "छिपा दिया। अब इस व्यक्ति के तोहफ़े और लिंक नहीं दिखेंगे।",
            newGift: "{name} ने तोहफ़ा भेजा है 💌 खोलने के लिए टैप करें", giftLight: "+1 रोशनी · आज का पहला तोहफ़ा",
            friends: "दोस्त", friendsEmpty: "अभी सूची में कोई दोस्त नहीं है। किसी को अपने बगीचे का लिंक भेजकर देखें।",
            mutual: "आप दोनों ने लिंक भेजे हैं", oneWay: "उनका लिंक मिल गया है", visit: "मिलने जाएँ", trip: "घूमने बुलाएँ", remove: "हटाएँ",
            removed: "सूची से हटा दिया", seen: "आख़िरी बार {date}", nick: "दोस्तों को दिखने वाला नाम", nickPh: "जैसे {def}", save: "सहेजें",
            nickSaved: "नाम सहेज लिया", nickBad: "यह नाम नहीं चल सकता। 16 अक्षरों तक का छोटा नाम आज़माएँ, बिना नंबर या संपर्क जानकारी के।", code: "मेरा दोस्त कोड",
            peer: "दोस्त एक-दूसरे का हौसला बढ़ा सकते हैं, पर वे काउंसलर नहीं हैं। अगर कोई दोस्त सुरक्षित न लगे, तो उसे हेल्पलाइन (थाईलैंड में 1323) पर बात करने या मदद बटन दबाने को कहें।",
            privacy: "लिंक में सिर्फ़ उपनाम, पालतू और बगीचे का रूप होता है। लिंक वाला कोई भी इसे देख सकता है। कुछ भी कहीं अपलोड नहीं होता।",
            tripPick: "जगह चुनें", tripAsk: "{name} ने आपको {place} चलने बुलाया है", tripGo: "चलो साथ चलें", later: "बाद में",
            stampGot: "साथ घूमने का स्टैम्प: {place} 🐾", together: "साथ घूमने के स्टैम्प", postcard: "पोस्टकार्ड भेजें", postFrom: "{place} से पोस्टकार्ड",
            compSay: "{name} और {pet} साथ आए हैं 🐾 पोस्टकार्ड भेजने के लिए टैप करें", self: "यह आपका अपना लिंक है। इसे किसी दोस्त को भेजें!",
            bad: "यह लिंक नहीं खुल सका। शायद अधूरा है या बदला गया है।", mutedLink: "यह लिंक उस व्यक्ति का है जिसे आपने छिपाया है।", inviteMap: "दोस्त को साथ बुलाएँ",
            friendDef: "एक दोस्त", friendOf: "{pet} का दोस्त", needWorld: "पहले अपनी दुनिया चुनें, फिर साथ घूमने चलें।",
            dup: "यह तोहफ़ा पहले से डिब्बे में है।", back: "वापस", newBadge: "नया", hidden: "छिपा हुआ"
        },
        es: {
            title: "Amigos del jardín", sub: "Invita a tus amigos a tu jardín y envíense stickers y palabras amables.", openBtn: "Amigos y regalos",
            invite: "Invitar a alguien a mi jardín", inviteText: "Ven a visitar mi jardín en Hikari Jardín de Luz 🌷 ¡Saluda a {pet}!",
            giftText: "Un poquito de cariño desde mi jardín 💌 Ábrelo aquí", tripText: "¿Vamos juntos a {place}? 🗺️ {pet} también viene",
            postText: "Una postal desde {place} 💌", visiting: "De visita en el jardín de {name}",
            visitHint: "Toca a {pet} para acariciarlo · puedes dejar un regalo antes de irte", snapNote: "Así se veía el jardín cuando se envió el enlace",
            exit: "Volver a mi jardín", leaveGift: "Dejar un regalo", pickSticker: "Elige un sticker", pickMsg: "Elige un mensaje",
            own: "Una nota corta tuya (opcional)", ownHint: "Hasta 80 caracteres · sin enlaces, teléfonos ni datos de contacto",
            ownLocked: "Podrás escribir tu propia nota cuando ambos se hayan enviado un enlace. Por ahora, un sticker y un mensaje están perfectos.",
            send: "Enviar regalo…", sendNoText: "Enviar solo sticker y mensaje…",
            errLen: "Pasa de 80 caracteres. Prueba a acortarlo un poco.", errContact: "Tiene un enlace, un teléfono o un dato de contacto. Para cuidarlos a ambos, quita esa parte.",
            errMean: "Esto podría herir a tu amigo. Prueba con palabras más suaves o envía uno de los mensajes listos.",
            riskDrop: "Lo que escribiste no se enviará con el regalo. Puedes guardarlo para ti.",
            petted: "¡A {pet} le encanta! 💗", from: "De {name}", to: "Para {name}", mailbox: "Caja de regalos", mailEmpty: "Aún no hay regalos.",
            reply: "Devolver cariño", mute: "Ocultar a esta persona", unmute: "Mostrar", del: "Borrar", muted: "Oculto. No verás regalos ni enlaces de esta persona.",
            newGift: "{name} te envió un regalo 💌 Toca para abrirlo", giftLight: "+1 luz · primer regalo de hoy",
            friends: "Amigos", friendsEmpty: "Aún no hay amigos en tu lista. Podrías enviar el enlace de tu jardín a alguien.",
            mutual: "Ya se enviaron enlaces", oneWay: "Recibiste su enlace", visit: "Visitar", trip: "Invitar a un viaje", remove: "Quitar",
            removed: "Quitado de tu lista", seen: "Última vez {date}", nick: "Nombre que ven tus amigos", nickPh: "p. ej. {def}", save: "Guardar",
            nickSaved: "Nombre guardado", nickBad: "Ese nombre no se puede usar. Prueba uno corto (hasta 16 caracteres) sin números ni datos de contacto.", code: "Mi código de amistad",
            peer: "Los amigos pueden darse ánimos, pero no son consejeros. Si alguien parece no estar a salvo, anímalo a llamar a una línea de ayuda (1323 en Tailandia) o a usar Ayuda.",
            privacy: "Un enlace solo lleva tu apodo, tu mascota y cómo se ve tu jardín. Quien tenga el enlace puede verlo. No se sube nada a ningún sitio.",
            tripPick: "Elige un lugar", tripAsk: "{name} te invita a {place}", tripGo: "Vamos juntos", later: "Quizá luego",
            stampGot: "Sello de viaje juntos: {place} 🐾", together: "Sellos de viaje juntos", postcard: "Enviar una postal", postFrom: "Postal desde {place}",
            compSay: "{name} y {pet} vinieron contigo 🐾 Toca para enviar una postal", self: "Este es tu propio enlace. ¡Envíaselo a alguien!",
            bad: "No se pudo abrir este enlace. Puede estar incompleto o modificado.", mutedLink: "Este enlace es de alguien que ocultaste.", inviteMap: "Invitar a alguien",
            friendDef: "Alguien especial", friendOf: "Amistad de {pet}", needWorld: "Primero elige tu mundo y luego podrán ir juntos.",
            dup: "Este regalo ya está en tu caja.", back: "Atrás", newBadge: "Nuevo", hidden: "Oculto"
        },
        fr: {
            title: "Amis du jardin", sub: "Invite tes amis dans ton jardin et envoyez-vous des stickers et des mots doux.", openBtn: "Amis et cadeaux",
            invite: "Inviter quelqu’un dans mon jardin", inviteText: "Viens visiter mon jardin dans Hikari Jardin de lumière 🌷 Dis bonjour à {pet} !",
            giftText: "Un peu de douceur depuis mon jardin 💌 Ouvre-le ici", tripText: "On va à {place} ensemble ? 🗺️ {pet} vient aussi",
            postText: "Une carte postale de {place} 💌", visiting: "En visite dans le jardin de {name}",
            visitHint: "Touche {pet} pour une caresse · tu peux laisser un cadeau avant de partir", snapNote: "Le jardin tel qu’il était quand le lien a été envoyé",
            exit: "Retour à mon jardin", leaveGift: "Laisser un cadeau", pickSticker: "Choisis un sticker", pickMsg: "Choisis un message",
            own: "Un petit mot à toi (facultatif)", ownHint: "80 caractères max · pas de liens, de numéros ni de coordonnées",
            ownLocked: "Tu pourras écrire ton propre mot quand vous vous serez envoyé un lien tous les deux. Pour l’instant, un sticker et un message, c’est parfait.",
            send: "Envoyer le cadeau…", sendNoText: "Envoyer seulement le sticker et le message…",
            errLen: "Ça dépasse 80 caractères. Essaie de raccourcir un peu.", errContact: "Il y a un lien, un numéro ou une coordonnée. Pour votre sécurité à tous les deux, retire cette partie.",
            errMean: "Ces mots pourraient blesser. Essaie des mots plus doux, ou envoie un message tout prêt.",
            riskDrop: "Ce que tu as écrit ne sera pas envoyé avec le cadeau. Tu peux le garder pour toi.",
            petted: "{pet} adore ça 💗", from: "De la part de {name}", to: "Pour {name}", mailbox: "Boîte à cadeaux", mailEmpty: "Pas encore de cadeau.",
            reply: "Renvoyer de la douceur", mute: "Masquer cette personne", unmute: "Ne plus masquer", del: "Supprimer", muted: "Masqué. Tu ne verras plus les cadeaux ni les liens de cette personne.",
            newGift: "{name} t’a envoyé un cadeau 💌 Touche pour l’ouvrir", giftLight: "+1 lumière · premier cadeau du jour",
            friends: "Amis", friendsEmpty: "Pas encore d’amis dans ta liste. Tu pourrais envoyer le lien de ton jardin à quelqu’un.",
            mutual: "Vous vous êtes envoyé des liens", oneWay: "Tu as reçu son lien", visit: "Rendre visite", trip: "Inviter en balade", remove: "Retirer",
            removed: "Retiré de ta liste", seen: "Vu le {date}", nick: "Nom vu par tes amis", nickPh: "ex. {def}", save: "Enregistrer",
            nickSaved: "Nom enregistré", nickBad: "Ce nom ne peut pas être utilisé. Essaie un nom court (16 caractères max) sans numéro ni coordonnées.", code: "Mon code ami",
            peer: "Les amis peuvent s’encourager, mais ce ne sont pas des professionnels. Si quelqu’un semble en danger, encourage-le à appeler une ligne d’écoute (1323 en Thaïlande) ou à utiliser Aide.",
            privacy: "Un lien contient seulement ton surnom, ton compagnon et l’allure de ton jardin. Toute personne ayant le lien peut le voir. Rien n’est envoyé nulle part.",
            tripPick: "Choisis un lieu", tripAsk: "{name} t’invite à {place}", tripGo: "On y va ensemble", later: "Plus tard",
            stampGot: "Tampon balade ensemble : {place} 🐾", together: "Tampons balade ensemble", postcard: "Envoyer une carte", postFrom: "Carte postale de {place}",
            compSay: "{name} et {pet} sont venus aussi 🐾 Touche pour envoyer une carte", self: "C’est ton propre lien. Envoie-le à quelqu’un !",
            bad: "Ce lien n’a pas pu s’ouvrir. Il est peut-être incomplet ou modifié.", mutedLink: "Ce lien vient d’une personne que tu as masquée.", inviteMap: "Inviter quelqu’un",
            friendDef: "Quelqu’un de cher", friendOf: "Ami·e de {pet}", needWorld: "Choisis d’abord ton monde, puis vous pourrez partir ensemble.",
            dup: "Ce cadeau est déjà dans ta boîte.", back: "Retour", newBadge: "Nouveau", hidden: "Masqué"
        },
        ar: {
            title: "أصدقاء الحديقة", sub: "ادعُ أصدقاءك إلى حديقتك وتبادلوا الملصقات والكلمات اللطيفة.", openBtn: "الأصدقاء والهدايا",
            invite: "ادعُ صديقًا إلى حديقتي", inviteText: "تعال زر حديقتي في Hikari حديقة الضوء 🌷 قل مرحبًا لـ{pet}!",
            giftText: "قليل من اللطف من حديقتي 💌 افتحه من هنا", tripText: "هل نذهب معًا إلى {place}؟ 🗺️ {pet} سيأتي أيضًا",
            postText: "بطاقة بريدية من {place} 💌", visiting: "في زيارة لحديقة {name}",
            visitHint: "المس {pet} لتربّت عليه · يمكنك ترك هدية قبل أن تغادر", snapNote: "هكذا بدت الحديقة عند إرسال الرابط",
            exit: "العودة إلى حديقتي", leaveGift: "اترك هدية", pickSticker: "اختر ملصقًا", pickMsg: "اختر رسالة",
            own: "كلمة قصيرة منك (اختياري)", ownHint: "حتى 80 حرفًا · بلا روابط أو أرقام هواتف أو وسائل تواصل",
            ownLocked: "يمكنك كتابة كلمتك الخاصة بعد أن يرسل كلٌّ منكما رابطًا للآخر. الآن، الملصق والرسالة رائعان.",
            send: "أرسل الهدية…", sendNoText: "أرسل الملصق والرسالة فقط…",
            errLen: "تجاوزت 80 حرفًا. جرّب أن تختصر قليلًا.", errContact: "فيها رابط أو رقم هاتف أو وسيلة تواصل. حفاظًا على سلامتكما، احذف هذا الجزء.",
            errMean: "قد تجرح هذه الكلمات صديقك. جرّب كلمات ألطف أو أرسل رسالة جاهزة.",
            riskDrop: "ما كتبته لن يُرسل مع الهدية. يمكنك الاحتفاظ به لنفسك.",
            petted: "{pet} سعيد جدًا 💗", from: "من {name}", to: "إلى {name}", mailbox: "صندوق الهدايا", mailEmpty: "لا توجد هدايا بعد.",
            reply: "أرسل لطفًا بالمقابل", mute: "إخفاء هذا الشخص", unmute: "إلغاء الإخفاء", del: "حذف", muted: "تم الإخفاء. لن ترى هدايا أو روابط من هذا الشخص.",
            newGift: "{name} أرسل لك هدية 💌 المس لفتحها", giftLight: "+1 ضوء · أول هدية اليوم",
            friends: "الأصدقاء", friendsEmpty: "لا يوجد أصدقاء في قائمتك بعد. يمكنك إرسال رابط حديقتك إلى أحدهم.",
            mutual: "تبادلتما الروابط", oneWay: "وصلك رابطه", visit: "زيارة", trip: "دعوة لرحلة", remove: "إزالة",
            removed: "أزيل من قائمتك", seen: "آخر ظهور {date}", nick: "الاسم الذي يراه أصدقاؤك", nickPh: "مثلًا {def}", save: "حفظ",
            nickSaved: "تم حفظ الاسم", nickBad: "لا يمكن استخدام هذا الاسم. جرّب اسمًا قصيرًا (حتى 16 حرفًا) بلا أرقام أو وسائل تواصل.", code: "رمز الصداقة الخاص بي",
            peer: "يمكن للأصدقاء تشجيع بعضهم، لكنهم ليسوا مختصين. إن بدا صديقك غير آمن، شجّعه على الاتصال بخط مساعدة (1323 في تايلاند) أو استخدام زر المساعدة.",
            privacy: "الرابط يحمل فقط لقبك وحيوانك وشكل حديقتك. يستطيع أي شخص لديه الرابط رؤية ذلك. لا يُرفع أي شيء إلى أي مكان.",
            tripPick: "اختر مكانًا", tripAsk: "{name} يدعوك إلى {place}", tripGo: "هيا معًا", later: "ربما لاحقًا",
            stampGot: "ختم الرحلة معًا: {place} 🐾", together: "أختام الرحلات معًا", postcard: "أرسل بطاقة بريدية", postFrom: "بطاقة بريدية من {place}",
            compSay: "جاء {name} و{pet} معك 🐾 المس لإرسال بطاقة بريدية", self: "هذا رابطك أنت. أرسله إلى صديق!",
            bad: "تعذّر فتح هذا الرابط. ربما هو ناقص أو معدّل.", mutedLink: "هذا الرابط من شخص أخفيته.", inviteMap: "ادعُ صديقًا",
            friendDef: "صديق", friendOf: "صديق {pet}", needWorld: "اختر عالمك أولًا، ثم يمكنكما الذهاب معًا.",
            dup: "هذه الهدية موجودة في صندوقك.", back: "رجوع", newBadge: "جديد", hidden: "مخفي"
        },
        pt: {
            title: "Amigos do jardim", sub: "Convide amigos para o seu jardim e troquem figurinhas e palavras gentis.", openBtn: "Amigos e presentes",
            invite: "Convidar alguém para o meu jardim", inviteText: "Vem visitar meu jardim no Hikari Jardim de Luz 🌷 Dá um oi pro {pet}!",
            giftText: "Um pouquinho de carinho do meu jardim 💌 Abra aqui", tripText: "Vamos juntos a {place}? 🗺️ {pet} vai também",
            postText: "Um cartão-postal de {place} 💌", visiting: "Visitando o jardim de {name}",
            visitHint: "Toque em {pet} para fazer carinho · dá para deixar um presente antes de ir", snapNote: "O jardim como estava quando o link foi enviado",
            exit: "Voltar ao meu jardim", leaveGift: "Deixar um presente", pickSticker: "Escolha uma figurinha", pickMsg: "Escolha uma mensagem",
            own: "Um recadinho seu (opcional)", ownHint: "Até 80 caracteres · sem links, telefones ou contatos",
            ownLocked: "Você poderá escrever seu próprio recado quando vocês dois já tiverem trocado links. Por enquanto, figurinha e mensagem já são ótimas.",
            send: "Enviar presente…", sendNoText: "Enviar só figurinha e mensagem…",
            errLen: "Passou de 80 caracteres. Tente encurtar um pouco.", errContact: "Tem link, telefone ou contato aqui. Para a segurança de vocês dois, tire essa parte.",
            errMean: "Isso pode magoar seu amigo. Tente palavras mais gentis ou envie uma mensagem pronta.",
            riskDrop: "O que você escreveu não vai junto com o presente. Pode guardar para você.",
            petted: "{pet} adorou 💗", from: "De {name}", to: "Para {name}", mailbox: "Caixa de presentes", mailEmpty: "Ainda não há presentes.",
            reply: "Mandar carinho de volta", mute: "Ocultar esta pessoa", unmute: "Mostrar de novo", del: "Apagar", muted: "Ocultado. Você não verá presentes nem links desta pessoa.",
            newGift: "{name} te mandou um presente 💌 Toque para abrir", giftLight: "+1 luz · primeiro presente de hoje",
            friends: "Amigos", friendsEmpty: "Ainda não há amigos na lista. Que tal enviar o link do seu jardim para alguém?",
            mutual: "Vocês já trocaram links", oneWay: "Você recebeu o link", visit: "Visitar", trip: "Convidar para passear", remove: "Remover",
            removed: "Removido da sua lista", seen: "Visto em {date}", nick: "Nome que seus amigos veem", nickPh: "ex.: {def}", save: "Salvar",
            nickSaved: "Nome salvo", nickBad: "Esse nome não pode ser usado. Tente um curto (até 16 caracteres) sem números nem contatos.", code: "Meu código de amizade",
            peer: "Amigos podem se apoiar, mas não são profissionais. Se alguém parecer não estar seguro, incentive a pessoa a ligar para uma linha de apoio (1323 na Tailândia) ou usar Ajuda.",
            privacy: "O link leva só seu apelido, seu bichinho e o visual do jardim. Quem tiver o link pode ver isso. Nada é enviado para lugar nenhum.",
            tripPick: "Escolha um lugar", tripAsk: "{name} te convidou para {place}", tripGo: "Vamos juntos", later: "Talvez depois",
            stampGot: "Selo de passeio juntos: {place} 🐾", together: "Selos de passeio juntos", postcard: "Enviar cartão-postal", postFrom: "Cartão-postal de {place}",
            compSay: "{name} e {pet} vieram junto 🐾 Toque para enviar um cartão-postal", self: "Este é o seu próprio link. Mande para alguém!",
            bad: "Não deu para abrir este link. Ele pode estar incompleto ou alterado.", mutedLink: "Este link é de alguém que você ocultou.", inviteMap: "Convidar alguém",
            friendDef: "Alguém querido", friendOf: "Amizade de {pet}", needWorld: "Escolha seu mundo primeiro e depois vocês vão juntos.",
            dup: "Este presente já está na sua caixa.", back: "Voltar", newBadge: "Novo", hidden: "Ocultado"
        },
        ru: {
            title: "Друзья сада", sub: "Зовите друзей в гости в сад и дарите друг другу стикеры и тёплые слова.", openBtn: "Друзья и подарки",
            invite: "Позвать друга в мой сад", inviteText: "Загляни в мой сад в Hikari «Сад света» 🌷 Поздоровайся с {pet}!",
            giftText: "Немного тепла из моего сада 💌 Открой здесь", tripText: "Поедем вместе в {place}? 🗺️ {pet} тоже с нами",
            postText: "Открытка из места «{place}» 💌", visiting: "В гостях в саду у {name}",
            visitHint: "Коснитесь {pet}, чтобы погладить · перед уходом можно оставить подарок", snapNote: "Так сад выглядел, когда отправили ссылку",
            exit: "Вернуться в мой сад", leaveGift: "Оставить подарок", pickSticker: "Выберите стикер", pickMsg: "Выберите сообщение",
            own: "Короткая записка от вас (необязательно)", ownHint: "До 80 символов · без ссылок, телефонов и контактов",
            ownLocked: "Свою записку можно будет написать, когда вы оба отправите друг другу ссылку. А пока стикер и сообщение — то, что нужно.",
            send: "Отправить подарок…", sendNoText: "Отправить только стикер и сообщение…",
            errLen: "Больше 80 символов. Попробуйте чуть короче.", errContact: "Здесь есть ссылка, телефон или контакт. Ради безопасности вас обоих уберите эту часть.",
            errMean: "Эти слова могут ранить друга. Попробуйте помягче или отправьте готовое сообщение.",
            riskDrop: "То, что вы написали, не будет отправлено с подарком. Можно оставить это себе.",
            petted: "{pet} очень доволен 💗", from: "От: {name}", to: "Для: {name}", mailbox: "Коробка подарков", mailEmpty: "Подарков пока нет.",
            reply: "Ответить теплом", mute: "Скрыть этого человека", unmute: "Показать", del: "Удалить", muted: "Скрыто. Подарки и ссылки от этого человека больше не появятся.",
            newGift: "{name} прислал(а) подарок 💌 Коснитесь, чтобы открыть", giftLight: "+1 свет · первый подарок за день",
            friends: "Друзья", friendsEmpty: "В списке пока нет друзей. Можно отправить кому-нибудь ссылку на свой сад.",
            mutual: "Вы обменялись ссылками", oneWay: "Вы получили ссылку", visit: "В гости", trip: "Позвать в поездку", remove: "Убрать",
            removed: "Убрано из списка", seen: "Последний раз {date}", nick: "Имя, которое видят друзья", nickPh: "например, {def}", save: "Сохранить",
            nickSaved: "Имя сохранено", nickBad: "Это имя использовать нельзя. Попробуйте короткое (до 16 символов) без цифр и контактов.", code: "Мой код друга",
            peer: "Друзья могут поддерживать друг друга, но они не специалисты. Если другу, похоже, небезопасно, предложите ему позвонить на линию помощи (в Таиланде 1323) или нажать «Помощь».",
            privacy: "В ссылке только ваш ник, питомец и вид сада. Её содержимое видит любой, у кого есть ссылка. Ничего никуда не загружается.",
            tripPick: "Выберите место", tripAsk: "{name} зовёт вас в {place}", tripGo: "Едем вместе", later: "Может, позже",
            stampGot: "Штамп «вместе»: {place} 🐾", together: "Штампы поездок вместе", postcard: "Отправить открытку", postFrom: "Открытка: {place}",
            compSay: "{name} и {pet} приехали вместе с вами 🐾 Коснитесь, чтобы отправить открытку", self: "Это ваша собственная ссылка. Отправьте её другу!",
            bad: "Не удалось открыть ссылку. Возможно, она неполная или изменена.", mutedLink: "Эта ссылка от человека, которого вы скрыли.", inviteMap: "Позвать друга",
            friendDef: "Друг", friendOf: "Друг {pet}", needWorld: "Сначала выберите свой мир, а потом можно поехать вместе.",
            dup: "Этот подарок уже в коробке.", back: "Назад", newBadge: "Новое", hidden: "Скрыто"
        },
        ja: {
            title: "おにわの友だち", sub: "友だちをおにわに招いて、スタンプややさしい言葉を送り合おう。", openBtn: "友だちとギフト",
            invite: "友だちをおにわに招く", inviteText: "Hikari ひかりの庭の、わたしのおにわに遊びに来てね 🌷 {pet}にあいさつしてね！",
            giftText: "わたしのおにわから、ちょっとしたやさしさを 💌 ここから開いてね", tripText: "いっしょに{place}へ行かない？🗺️ {pet}も行くよ",
            postText: "{place}からのポストカード 💌", visiting: "{name}さんのおにわにおじゃま中",
            visitHint: "{pet}をタップしてなでてね · 帰る前にギフトを置いていけるよ", snapNote: "リンクを送ったときのおにわの様子です",
            exit: "自分のおにわに戻る", leaveGift: "ギフトを置く", pickSticker: "スタンプをえらぶ", pickMsg: "メッセージをえらぶ",
            own: "自分のひとこと（なくてもOK）", ownHint: "80文字まで · リンク・電話番号・連絡先は入れないでね",
            ownLocked: "おたがいにリンクを送り合ったら、自分のひとことも書けるよ。今はスタンプとメッセージで十分すてき。",
            send: "ギフトを送る…", sendNoText: "スタンプとメッセージだけ送る…",
            errLen: "80文字をこえています。もう少し短くしてみてね。", errContact: "リンク・電話番号・連絡先が入っています。ふたりの安全のため、その部分を消してね。",
            errMean: "このことばは友だちを傷つけるかも。やさしいことばにするか、用意されたメッセージを送ってみてね。",
            riskDrop: "書いたことばはギフトといっしょには送られません。自分の中にしまっておいても大丈夫。",
            petted: "{pet}うれしそう 💗", from: "{name}さんから", to: "{name}さんへ", mailbox: "ギフトボックス", mailEmpty: "まだギフトはありません。",
            reply: "やさしさを送り返す", mute: "この人を非表示", unmute: "非表示をやめる", del: "削除", muted: "非表示にしました。この人からのギフトやリンクは表示されません。",
            newGift: "{name}さんからギフトが届いたよ 💌 タップして開いてね", giftLight: "+1 ひかり · 今日はじめてのギフト",
            friends: "友だち", friendsEmpty: "まだ友だちはいません。おにわのリンクをだれかに送ってみる？",
            mutual: "おたがいにリンクを送り合いました", oneWay: "リンクを受け取りました", visit: "遊びに行く", trip: "旅にさそう", remove: "削除",
            removed: "リストから削除しました", seen: "最後に {date}", nick: "友だちに見える名前", nickPh: "例：{def}", save: "保存",
            nickSaved: "名前を保存しました", nickBad: "この名前は使えません。16文字までの短い名前で、番号や連絡先は入れないでね。", code: "わたしの友だちコード",
            peer: "友だちは応援し合えるけれど、専門家ではありません。友だちが安全でなさそうなら、相談窓口（タイでは 1323）への電話や「助けて」ボタンをすすめてね。",
            privacy: "リンクに入っているのはニックネーム、ペット、おにわの見た目だけ。リンクを持っている人はだれでも見られます。どこにもアップロードされません。",
            tripPick: "行き先をえらぶ", tripAsk: "{name}さんが{place}にさそってくれたよ", tripGo: "いっしょに行く", later: "またこんど",
            stampGot: "いっしょ旅スタンプ：{place} 🐾", together: "いっしょ旅スタンプ", postcard: "ポストカードを送る", postFrom: "{place}からのポストカード",
            compSay: "{name}さんと{pet}もいっしょに来たよ 🐾 タップしてポストカードを送ろう", self: "これはあなた自身のリンクです。友だちに送ってね！",
            bad: "このリンクは開けませんでした。足りないか、書きかえられているかもしれません。", mutedLink: "このリンクは非表示にした人からです。", inviteMap: "友だちをさそう",
            friendDef: "友だち", friendOf: "{pet}の友だち", needWorld: "先に自分の世界をえらんでから、いっしょに出かけよう。",
            dup: "このギフトはもうボックスに入っています。", back: "もどる", newBadge: "NEW", hidden: "非表示"
        }
    };

    // ---------- สติกเกอร์ (อีโมจิ ไม่มีโลโก้แบรนด์) ----------
    const STICKERS = [
        { id: "flower", e: "🌷" }, { id: "letter", e: "💌" }, { id: "bear", e: "🧸" }, { id: "tea", e: "🍵" },
        { id: "rainbow", e: "🌈" }, { id: "star", e: "⭐" }, { id: "clover", e: "🍀" }, { id: "sun", e: "🌞" },
        { id: "paw", e: "🐾" }, { id: "moon", e: "🌙" }, { id: "cookie", e: "🍪" }, { id: "hug", e: "🤗" }
    ];
    const STICKER_NAMES = {
        th: ["ดอกทิวลิป", "จดหมายรัก", "ตุ๊กตาหมี", "ชาอุ่น ๆ", "สายรุ้ง", "ดาว", "ใบโคลเวอร์", "แดดอุ่น", "รอยเท้าน้อง", "พระจันทร์", "คุกกี้", "กอด"],
        en: ["Tulip", "Love letter", "Teddy bear", "Warm tea", "Rainbow", "Star", "Clover", "Sunshine", "Paw prints", "Moon", "Cookie", "Hug"],
        zh: ["郁金香", "爱心信", "小熊", "暖茶", "彩虹", "星星", "四叶草", "暖阳", "小脚印", "月亮", "饼干", "抱抱"],
        hi: ["ट्यूलिप", "प्यारी चिट्ठी", "टेडी बियर", "गरम चाय", "इंद्रधनुष", "तारा", "क्लोवर", "धूप", "पंजों के निशान", "चाँद", "कुकी", "झप्पी"],
        es: ["Tulipán", "Carta de cariño", "Osito", "Té calentito", "Arcoíris", "Estrella", "Trébol", "Solecito", "Huellitas", "Luna", "Galleta", "Abrazo"],
        fr: ["Tulipe", "Lettre douce", "Nounours", "Thé chaud", "Arc-en-ciel", "Étoile", "Trèfle", "Soleil", "Petites pattes", "Lune", "Biscuit", "Câlin"],
        ar: ["توليب", "رسالة محبة", "دبدوب", "شاي دافئ", "قوس قزح", "نجمة", "برسيم", "شمس دافئة", "آثار أقدام", "قمر", "كعكة", "عناق"],
        pt: ["Tulipa", "Cartinha", "Ursinho", "Chá quentinho", "Arco-íris", "Estrela", "Trevo", "Solzinho", "Patinhas", "Lua", "Biscoito", "Abraço"],
        ru: ["Тюльпан", "Письмо", "Мишка", "Тёплый чай", "Радуга", "Звезда", "Клевер", "Солнышко", "Следы лапок", "Луна", "Печенье", "Обнимашки"],
        ja: ["チューリップ", "お手紙", "くまちゃん", "あったかいお茶", "にじ", "ほし", "クローバー", "おひさま", "あしあと", "おつきさま", "クッキー", "ハグ"]
    };
    // ข้อความสำเร็จรูป: ลำดับ = รหัสข้อความในลิงก์ (ห้ามสลับลำดับ เพิ่มต่อท้ายได้) · 16, 17 = โปสการ์ดหลังเที่ยวด้วยกัน
    const MSGS = {
        th: ["คิดถึงนะ", "วันนี้เหนื่อยก็พักได้นะ", "ภูมิใจในตัวเธอนะ", "ส่งกอดไปให้", "อย่าลืมดื่มน้ำนะ", "เป็นกำลังใจให้เสมอนะ",
            "ค่อย ๆ ไปก็ได้นะ", "ขอบคุณที่เป็นเพื่อนกันนะ", "หายใจลึก ๆ ไปด้วยกันนะ", "เธอทำดีที่สุดแล้วนะ", "ฝันดีนะ", "แวะมาเที่ยวสวนกันบ้างนะ",
            "หวังว่าวันนี้จะมีเรื่องดี ๆ นะ", "อยากคุยเมื่อไหร่ บอกได้นะ", "น้องฝากหัวใจมาให้ 💛", "ขอให้วันนี้ใจดีกับเธอนะ",
            "ขอบคุณที่ไปเที่ยวด้วยกันนะ", "ไว้ไปเที่ยวด้วยกันอีกนะ"],
        en: ["Thinking of you", "Tired today? It's okay to rest", "I'm proud of you", "Sending you a hug", "Remember to drink some water", "Always cheering you on",
            "Taking it slow is okay", "Thank you for being my friend", "Let's take a slow breath together", "You're doing your best", "Sweet dreams", "Come say hi in my garden anytime",
            "Hope something nice finds you today", "I'm here if you want to talk", "My pet sends you a heart 💛", "Wishing you a gentle day",
            "Thanks for the trip together", "Let's go again sometime"],
        zh: ["想你啦", "今天累了就休息吧", "我为你骄傲", "给你一个抱抱", "记得喝点水哦", "一直为你加油",
            "慢慢来就好", "谢谢你做我的朋友", "我们一起慢慢深呼吸", "你已经很努力了", "晚安，好梦", "有空来我的花园玩",
            "愿你今天遇到小美好", "想聊的时候我都在", "我的小伙伴送你一颗心 💛", "愿今天对你温柔一点",
            "谢谢你陪我一起旅行", "下次再一起去吧"],
        hi: ["तुम्हारी याद आ रही है", "थक गए हो तो आराम कर लो", "मुझे तुम पर गर्व है", "तुम्हें एक प्यारी-सी झप्पी", "पानी पीना मत भूलना", "मेरी शुभकामनाएँ हमेशा तुम्हारे साथ हैं",
            "धीरे-धीरे चलना भी ठीक है", "मेरे दोस्त बनने के लिए शुक्रिया", "चलो साथ में एक गहरी साँस लें", "तुम्हारी कोशिश बहुत मायने रखती है", "शुभ रात्रि, मीठे सपने", "कभी भी मेरे बगीचे में आना",
            "आज तुम्हारे साथ कुछ अच्छा हो", "बात करनी हो तो मैं यहीं हूँ", "मेरे पालतू दोस्त ने तुम्हें दिल भेजा है 💛", "तुम्हारा दिन सुकून भरा हो",
            "साथ घूमने के लिए शुक्रिया", "फिर कभी साथ चलेंगे"],
        es: ["Pienso en ti", "Si hoy fue cansado, está bien descansar", "Me llenas de orgullo", "Te mando un abrazo", "Recuerda tomar agua", "Siempre dándote ánimos",
            "Ir despacio también está bien", "Gracias por tu amistad", "Respiremos hondo juntos", "Lo estás haciendo lo mejor que puedes", "Dulces sueños", "Pásate por mi jardín cuando quieras",
            "Ojalá hoy te pase algo bonito", "Si quieres hablar, aquí estoy", "Mi mascota te manda un corazón 💛", "Que tengas un día tranquilo",
            "Gracias por viajar conmigo", "Repitamos otro día"],
        fr: ["Je pense à toi", "Fatigué·e aujourd’hui ? Tu peux te reposer", "Je suis fier·e de toi", "Je t’envoie un câlin", "Pense à boire un peu d’eau", "Je t’encourage toujours",
            "Aller doucement, c’est bien aussi", "Merci pour ton amitié", "Respirons doucement ensemble", "Tu fais de ton mieux", "Fais de beaux rêves", "Passe dans mon jardin quand tu veux",
            "J’espère qu’un joli moment t’attend aujourd’hui", "Si tu veux parler, je suis là", "Mon compagnon t’envoie un cœur 💛", "Je te souhaite une journée douce",
            "Merci pour cette balade ensemble", "On y retourne un de ces jours"],
        ar: ["أفكر فيك", "إن كان يومك متعبًا، لا بأس أن ترتاح", "أنا فخور بك", "أرسل لك عناقًا", "لا تنسَ أن تشرب الماء", "أشجعك دائمًا",
            "لا بأس أن تمضي ببطء", "شكرًا على صداقتك", "لنأخذ نفسًا عميقًا معًا", "أنت تبذل أفضل ما لديك", "أحلامًا سعيدة", "زر حديقتي متى شئت",
            "أتمنى أن يحمل لك اليوم شيئًا جميلًا", "إن أردت الحديث فأنا هنا", "صديقي الصغير يرسل لك قلبًا 💛", "أتمنى لك يومًا لطيفًا",
            "شكرًا على الرحلة معًا", "لنذهب معًا مرة أخرى"],
        pt: ["Pensando em você", "Se hoje foi cansativo, tudo bem descansar", "Tenho orgulho de você", "Mando um abraço", "Lembre de beber água", "Torço sempre por você",
            "Ir devagar também tudo bem", "Valeu pela amizade", "Vamos respirar fundo juntos", "Você está dando o seu melhor", "Bons sonhos", "Passa no meu jardim quando quiser",
            "Que algo bom aconteça hoje", "Se quiser conversar, estou aqui", "Meu bichinho te mandou um coração 💛", "Desejo um dia leve pra você",
            "Valeu pelo passeio juntos", "Bora de novo outro dia"],
        ru: ["Думаю о тебе", "Если день был непростым, можно отдохнуть", "Я горжусь тобой", "Обнимаю тебя", "Не забудь попить воды", "Всегда болею за тебя",
            "Можно не спешить", "Спасибо за дружбу", "Давай вместе глубоко вдохнём", "Ты стараешься, и это много значит", "Сладких снов", "Заглядывай в мой сад, когда захочешь",
            "Пусть сегодня случится что-то хорошее", "Если захочешь поговорить, я рядом", "Мой питомец шлёт тебе сердечко 💛", "Желаю тебе спокойного дня",
            "Спасибо за прогулку вместе", "Давай как-нибудь ещё съездим"],
        ja: ["元気かなって思ってたよ", "疲れた日は休んでいいよ", "あなたのこと、誇りに思うよ", "ハグを送るね", "お水飲んでね", "いつも応援してるよ",
            "ゆっくりでいいんだよ", "友だちでいてくれてありがとう", "いっしょにゆっくり深呼吸しよう", "よくがんばってるね", "おやすみ、いい夢を", "いつでもおにわに遊びに来てね",
            "今日いいことがありますように", "話したくなったらいつでもね", "うちの子からハートをどうぞ 💛", "やさしい一日になりますように",
            "いっしょに旅してくれてありがとう", "また一緒に行こうね"]
    };
    const MSG_COUNT = MSGS.th.length;
    const POSTCARD_MSGS = [16, 17, 0, 3, 7, 12];          // ข้อความที่แสดงก่อนตอนส่งโปสการ์ด

    // ---------- Core: เข้ารหัส / ตรวจรูปแบบ / กรองข้อความ (ไม่แตะ DOM) ----------
    const LIMITS = { hash: 1400, raw: 200, rawText: 400, nick: 16, text: 80, decor: 4, mail: 50, seen: 300, friends: 100 };
    const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const CODE_RE = /^[A-Z2-7]{8}$/, ID_RE = /^[A-Z2-7]{10}$/;
    const WORLD_FALLBACK = ["cat", "dog", "small", "trip"];
    const PLACE_FALLBACK = ["doi-inthanon", "krabi", "erawan-waterfall", "lopburi-sunflower", "floating-market", "phu-chi-fa",
        "chiang-mai-yi-peng", "ayutthaya", "khao-yai", "phang-nga"];

    function randCode(n) {
        const out = [];
        let bytes = null;
        try { const c = GL.crypto; if (c && c.getRandomValues) bytes = c.getRandomValues(new Uint8Array(n)); } catch (e) { /* ใช้ Math.random */ }
        for (let i = 0; i < n; i++) out.push(B32[(bytes ? bytes[i] : Math.floor(Math.random() * 256)) % 32]);
        return out.join("");
    }
    function toB64u(str) {
        const bytes = new TextEncoder().encode(str);
        let bin = "";
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }
    function fromB64u(s) {
        if (typeof s !== "string" || !/^[A-Za-z0-9_-]+$/.test(s)) return null;
        let b = s.replace(/-/g, "+").replace(/_/g, "/");
        while (b.length % 4) b += "=";
        let bin;
        try { bin = atob(b); } catch (e) { return null; }
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch (e) { return null; }
    }
    function encode(obj) { return toB64u(JSON.stringify(obj)); }

    function worldIds() { const W = gWorlds(); return W && typeof W === "object" ? Object.keys(W) : WORLD_FALLBACK; }
    function placeIds() { const T = gStops(); return Array.isArray(T) ? T.map(function (s) { return s.id; }) : PLACE_FALLBACK; }
    function itemOk(id, type) {
        if (typeof id !== "string" || id.length > 60 || !/^[a-z0-9_-]+$/.test(id)) return false;
        const items = gItems();
        if (Array.isArray(items)) return items.some(function (x) { return x.id === id && x.type === type; });
        return type === "home" ? /^decor_/.test(id) : /^acc_/.test(id);
    }
    function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
    function plain(o) { return !!o && typeof o === "object" && !Array.isArray(o) && Object.getPrototypeOf(o) === Object.prototype; }
    function cpLen(s) { return Array.from(s).length; }
    // ตัดอักขระควบคุม / ตัวกลับทิศทาง / ตัวมองไม่เห็น (คง ZWJ ไว้ให้อีโมจิ) · ช่องว่างหลายตัวเหลือตัวเดียว
    function clean(s) {
        s = String(s);
        try { s = s.normalize("NFC"); } catch (e) { /* เบราว์เซอร์เก่า */ }
        return s.replace(/[\u0000-\u001f\u007f-\u009f\u200b\u200c\u200e\u200f\u2028-\u202e\u2060-\u2069\ufeff\ufff9-\ufffb]/g, " ")
            .replace(/\s+/g, " ").trim();
    }

    // ----- ตัวกรองข้อความ -----
    function norm(s) {
        const Hs = gSafety();
        if (Hs && Hs.normalize) return Hs.normalize(s);
        return String(s).toLowerCase().replace(/[\s.,!?'"()\-_]/g, "");
    }
    const DIGITS = { "๐": 0, "๑": 1, "๒": 2, "๓": 3, "๔": 4, "๕": 5, "๖": 6, "๗": 7, "๘": 8, "๙": 9 };
    function asciiDigits(s) {
        return s.replace(/[๐-๙]/g, function (c) { return DIGITS[c]; })
            .replace(/[٠-٩]/g, function (c) { return c.charCodeAt(0) - 0x660; })
            .replace(/[۰-۹]/g, function (c) { return c.charCodeAt(0) - 0x6f0; })
            .replace(/[०-९]/g, function (c) { return c.charCodeAt(0) - 0x966; });
    }
    function lowerNFKC(s) { let x = String(s); try { x = x.normalize("NFKC"); } catch (e) { /* */ } return asciiDigits(x.toLowerCase()); }
    function tokens(s) { return lowerNFKC(s).split(/[^\p{L}\p{N}\p{M}]+/u).filter(Boolean).map(norm).filter(Boolean); }
    // รายการคำ: sub = หาในข้อความทั้งก้อน (ไทย/จีน/ญี่ปุ่น หรือคำยาว) · word = ต้องเป็นคำเต็ม ("*" ท้าย = ขึ้นต้นด้วย) · phrase = หลายคำติดกัน
    function compileList(def) {
        const sub = (def.sub || []).map(norm).filter(function (x) { return x.length >= 2; });
        const except = (def.except || []).map(norm).filter(Boolean);
        const words = [], prefixes = [], phrases = [];
        (def.word || []).forEach(function (w) {
            if (w.indexOf(" ") >= 0) { phrases.push(tokens(w).join(" ")); return; }
            if (w.slice(-1) === "*") prefixes.push(norm(w.slice(0, -1))); else words.push(norm(w));
        });
        return { sub: sub, except: except, words: words, prefixes: prefixes, phrases: phrases };
    }
    function matchList(list, text) {
        let s = norm(text);
        list.except.forEach(function (x) { s = s.split(x).join("|"); });
        if (list.sub.some(function (p) { return s.indexOf(p) !== -1; })) return true;
        const tk = tokens(text);
        if (tk.some(function (x) { return list.words.indexOf(x) !== -1 || list.prefixes.some(function (p) { return x.indexOf(p) === 0; }); })) return true;
        const joined = " " + tk.join(" ") + " ";
        return list.phrases.some(function (p) { return joined.indexOf(" " + p + " ") !== -1; });
    }
    // ช่องทางติดต่อ (นอกจาก URL / อีเมล / เบอร์ / @ ซึ่งตรวจด้วยรูปแบบ)
    const CONTACT = compileList({
        sub: ["ไลน์", "ไอดี", "ไอจี", "อินสตา", "เฟสบุ๊ก", "เฟซบุ๊ก", "เฟสบุ๊ค", "เฟซบุ๊ค", "เบอร์", "แอดไลน์", "แอดมา", "แอดเฟส", "ทักแชท", "ทักแชต", "อินบ็อกซ์", "อีเมล", "อีเมล์", "ที่อยู่บ้าน", "บ้านเลขที่", "ติ๊กต็อก", "ดิสคอร์ด", "เทเลแกรม", "วอทส์แอป", "จุดคอม", "ดอทคอม",
            "instagram", "facebook", "telegram", "whatsapp", "wechat", "kakaotalk", "snapchat", "discord", "tiktok", "twitter", "gmail", "hotmail", "outlook", "youtube",
            "微信", "加我", "电话", "电話", "手机号", "手機號", "号码", "號碼", "地址", "威信", "推特", "脸书", "臉書",
            "電話番号", "連絡先", "メアド", "メールアドレス", "インスタ", "ラインid", "ライン教えて", "ラインやって", "line教えて", "住所",
            "телеграм", "телефон", "вотсап", "ватсап", "инстаграм", "вконтакте", "номертелефона",
            "واتساب", "واتس", "رقمي", "رقم هاتفي", "هاتفي", "تلغرام", "تيليجرام", "انستغرام", "انستقرام", "سناب",
            "व्हाट्सएप", "इंस्टाग्राम", "फ़ोन नंबर", "फोन नंबर", "मेरा नंबर", "टेलीग्राम",
            "mi número", "mi numero", "meu número", "meu numero", "mon numéro", "mon numero", "agrégame", "agregame", "me adiciona", "ajoute-moi", "ajoutemoi"],
        word: ["ig", "fb", "insta", "line id", "lineid", "my line", "add me", "dm me", "text me", "call me at", "my number", "phone number", "email", "e-mail", "mail me",
            "qq", "vx", "wx", "tg", "vk", "snap", "zap", "zapzap", "номер", "teléfono", "telefono", "telefone", "téléphone", "telephone", "phone", "नंबर", "फोन", "फ़ोन", "رقم"],
        except: ["ออนไลน์", "おんらいん", "がいどらいん"]
    });
    // คำหยาบ/ด่าที่ชัดเจน 10 ภาษา (ตั้งใจให้สั้นและตรง ไม่ใช่รายการครบ) · ไม่ใส่คำที่เป็นความรู้สึกของตัวเอง (เช่น ไร้ค่า) เพราะนั่นเป็นเรื่องของ safety.js
    const MEAN = compileList({
        sub: ["ไอ้โง่", "อีโง่", "ไอ้ควาย", "อีควาย", "ไอ้บ้า", "อีบ้า", "ไอ้เหี้ย", "อีเหี้ย", "เหี้ย", "ไอ้สัตว์", "อีสัตว์", "ไอ้สัส", "อีสัส", "สันดาน", "อีดอก", "ไอ้ชั่ว", "อีชั่ว", "ส้นตีน", "หน้าโง่", "ไปตายซะ", "ไปตายไป", "ไอ้ขี้แพ้", "น่ารังเกียจ", "เกลียดแก", "เกลียดเธอ",
            "傻逼", "傻b", "煞笔", "笨蛋", "白痴", "蠢货", "废物", "廢物", "贱人", "賤人", "混蛋", "王八蛋", "他妈的", "去死", "滚开", "滾開",
            "死ね", "氏ね", "あほ", "ばか", "くず", "きもい", "うざい", "消えろ", "ぶす",
            "चूतिया", "हरामी", "कमीना", "कमीने", "बेवकूफ", "मूर्ख", "गधे"],
        word: ["idiot*", "stupid*", "moron*", "dumbass", "imbecile*", "retard*", "loser", "losers", "ugly", "bitch*", "asshole*", "bastard*", "jerk", "fuck*", "fck", "fuk", "shithead", "shut up", "hate you", "you suck", "kys", "go die",
            "idiota*", "estúpid*", "estupid*", "imbécil", "imbecil", "pendejo*", "gilipollas", "cabrón", "cabron", "puta", "mierda", "cállate", "callate", "te odio",
            "connard*", "connasse", "crétin*", "cretin*", "débile", "debile", "salope", "pute", "ta gueule", "ferme la", "je te déteste", "je te deteste",
            "otário", "otario", "babaca", "imbecil", "porra", "caralho", "cala a boca", "te odeio", "filho da puta",
            "идиот*", "дурак*", "дура", "тупой", "тупая", "урод*", "сука", "придур*", "мразь", "дебил*", "заткнись", "ненавижу тебя", "лох",
            "غبي", "احمق", "حقير", "تافه", "اخرس", "اكرهك", "يا كلب", "يلعن",
            "bewakoof", "chutiya", "harami", "kamina", "kamine", "pagal kahin ka"],
        except: ["คลื่นเหียน", "ばかり", "ばかし", "くずもち", "くずゆ", "あほうどり"]
    });
    const URL_RE = /(?:https?|ftp)\s*:|:\/\/|www\s*\.|\b[a-z0-9-]{2,}\s*(?:\.|\(dot\)|\[dot\]|\[\.\]|\s+dot\s+|。)\s*(?:com|net|org|io|co|me|th|ly|gg|app|xyz|info|link|to|cc|ru|cn|jp|in|br|fr|es|de|uk|us|biz|online|site|shop|page|dev|ai|tv|id|my|sg)\b/i;
    function hasContact(text) {
        const s = lowerNFKC(text);
        if (/[@＠]/.test(s)) return true;                              // อีเมล / @handle / LINE @id
        if (URL_RE.test(s)) return true;
        const joined = s.replace(/(\d)[\s\-.()\/_·‐-―]+(?=\d)/g, "$1");
        if (/\d{7,}/.test(joined)) return true;                        // เบอร์โทร (รวม 08x-xxx-xxxx, +66 8x xxx xxxx)
        return matchList(CONTACT, text);
    }
    function hasMean(text) { return matchList(MEAN, text); }
    // ตรวจข้อความพิมพ์เอง: { ok, reason: type|empty|risk|abuse|len|contact|mean, text }
    function checkText(raw, max) {
        max = max || LIMITS.text;
        if (typeof raw !== "string") return { ok: false, reason: "type" };
        const s = clean(raw);
        if (!s) return { ok: false, reason: "empty" };
        const Hs = gSafety();
        if (Hs && Hs.hasRiskText(s)) return { ok: false, reason: "risk", text: s };
        if (Hs && Hs.hasAbuseText(s)) return { ok: false, reason: "abuse", text: s };
        if (cpLen(s) > max) return { ok: false, reason: "len", text: s };
        if (hasContact(s)) return { ok: false, reason: "contact", text: s };
        if (hasMean(s)) return { ok: false, reason: "mean", text: s };
        return { ok: true, text: s };
    }
    function checkNick(raw) { return checkText(raw, LIMITS.nick); }

    // ----- รูปแบบลิงก์ (คีย์สั้น, v:1) -----
    // f = สวน: c รหัส, n ชื่อเล่น, w โลก, p ชื่อน้อง, d ของแต่ง[], s จำนวนแสตมป์, e ของที่ใส่, to รหัสผู้รับ (ถ้ามี)
    // g = ของขวัญ: i รหัสของขวัญ, c จาก, n ชื่อ, w โลก, to ถึง, s สติกเกอร์, m ข้อความ, x ข้อความพิมพ์เอง, ts วินาที, pl ที่เที่ยว (โปสการ์ด)
    // t = ชวนเที่ยว: i, c, n, w, p, pl, to, ts
    const SCHEMA = {
        f: { req: ["v", "k", "c", "w"], opt: ["n", "p", "d", "s", "e", "to"] },
        g: { req: ["v", "k", "i", "c", "s", "m"], opt: ["n", "w", "to", "x", "ts", "pl"] },
        t: { req: ["v", "k", "i", "c", "w", "pl"], opt: ["n", "p", "to", "ts"] }
    };
    function shortStr(v, max) { return typeof v === "string" && v.length <= (max || LIMITS.raw); }
    function validate(kind, o, now) {
        const sc = SCHEMA[kind];
        if (!sc || !plain(o)) return null;
        const keys = Object.keys(o);
        if (keys.length > sc.req.length + sc.opt.length) return null;
        if (!keys.every(function (k) { return sc.req.indexOf(k) >= 0 || sc.opt.indexOf(k) >= 0; })) return null;
        if (!sc.req.every(function (k) { return own(o, k); })) return null;
        if (o.v !== 1 || o.k !== kind) return null;
        if (typeof o.c !== "string" || !CODE_RE.test(o.c)) return null;
        const out = { v: 1, k: kind, c: o.c };
        if (own(o, "i")) { if (typeof o.i !== "string" || !ID_RE.test(o.i)) return null; out.i = o.i; }
        if (own(o, "to")) { if (typeof o.to !== "string" || !CODE_RE.test(o.to)) return null; out.to = o.to; }
        if (own(o, "w")) { if (typeof o.w !== "string" || worldIds().indexOf(o.w) < 0) return null; out.w = o.w; }
        if (own(o, "n")) { if (!shortStr(o.n)) return null; const r = checkNick(o.n); out.n = r.ok ? r.text : ""; }
        if (own(o, "p")) { if (!shortStr(o.p)) return null; const r = checkNick(o.p); out.p = r.ok ? r.text : ""; }
        if (own(o, "pl")) { if (typeof o.pl !== "string" || placeIds().indexOf(o.pl) < 0) return null; out.pl = o.pl; }
        if (own(o, "ts")) {
            if (typeof o.ts !== "number" || !Number.isInteger(o.ts) || o.ts < 1600000000 || o.ts > 4102444800) return null;
            const nowS = Math.floor((now || Date.now()) / 1000);
            out.ts = Math.min(o.ts, nowS);
        }
        if (kind === "f") {
            if (own(o, "d")) {
                if (!Array.isArray(o.d) || o.d.length > LIMITS.decor * 2) return null;
                out.d = [];
                o.d.forEach(function (id) { if (out.d.length < LIMITS.decor && itemOk(id, "home") && out.d.indexOf(id) < 0) out.d.push(id); });
            }
            if (own(o, "s")) { if (typeof o.s !== "number" || !Number.isInteger(o.s) || o.s < 0 || o.s > 999) return null; out.s = Math.min(o.s, placeIds().length); }
            if (own(o, "e")) { if (!shortStr(o.e, 60)) return null; if (itemOk(o.e, "wear")) out.e = o.e; }
        }
        if (kind === "g") {
            if (typeof o.s !== "string" || !STICKERS.some(function (x) { return x.id === o.s; })) return null;
            if (typeof o.m !== "number" || !Number.isInteger(o.m) || o.m < 0 || o.m >= MSG_COUNT) return null;
            out.s = o.s;
            out.m = o.m;
            if (own(o, "x")) {
                if (!shortStr(o.x, LIMITS.rawText)) return null;
                const r = checkText(o.x, LIMITS.text);
                if (r.ok) out.x = r.text;                                // ไม่ผ่าน = ทิ้งข้อความ เหลือสติกเกอร์ + ข้อความสำเร็จรูป
            }
        }
        return out;
    }
    function parseHash(hash, now) {
        const m = /^#([fgt])=(.*)$/.exec(String(hash || ""));
        if (!m) return null;
        if (!m[2] || m[2].length > LIMITS.hash) return { kind: m[1], error: "size" };
        const json = fromB64u(m[2]);
        if (json === null) return { kind: m[1], error: "encoding" };
        let obj;
        try { obj = JSON.parse(json); } catch (e) { return { kind: m[1], error: "json" }; }
        const data = validate(m[1], obj, now);
        if (!data) return { kind: m[1], error: "schema" };
        return { kind: m[1], data: data };
    }
    function strip(o) { Object.keys(o).forEach(function (k) { if (o[k] === undefined || o[k] === "" || (Array.isArray(o[k]) && !o[k].length)) delete o[k]; }); return o; }
    function makeVisit(p) {
        return strip({ v: 1, k: "f", c: p.code, n: p.nick || undefined, w: p.world, p: p.pet || undefined,
            d: (p.placed || []).filter(function (id) { return itemOk(id, "home"); }).slice(0, LIMITS.decor),
            s: Math.max(0, Math.min(999, p.stamps | 0)), e: p.wear && itemOk(p.wear, "wear") ? p.wear : undefined, to: p.to || undefined });
    }
    function makeGift(p) {
        return strip({ v: 1, k: "g", i: p.id || randCode(10), c: p.code, n: p.nick || undefined, w: p.world || undefined, to: p.to || undefined,
            s: p.sticker, m: p.msg, x: p.text || undefined, ts: Math.floor((p.now || Date.now()) / 1000), pl: p.place || undefined });
    }
    function makeTrip(p) {
        return strip({ v: 1, k: "t", i: p.id || randCode(10), c: p.code, n: p.nick || undefined, w: p.world, p: p.pet || undefined,
            pl: p.place, to: p.to || undefined, ts: Math.floor((p.now || Date.now()) / 1000) });
    }

    // ----- รายชื่อเพื่อน / กล่องของขวัญ (ข้อมูลล้วน) -----
    // mutual (ประมาณเอา เพราะไม่มีเซิร์ฟเวอร์): เราได้รับลิงก์ของเขาแล้ว (got) และ (เราส่งลิงก์ตอบถึงรหัสเขาแล้ว (sentTo) หรือ
    // เขาส่งลิงก์ที่ระบุรหัสเรามา (knows = เขาเคยเปิดลิงก์ของเรา)) · คนที่ซ่อนไว้ไม่นับ
    function fixState(fr) {
        fr = plain(fr) ? fr : {};
        if (typeof fr.nick !== "string") fr.nick = "";
        ["list", "sentTo", "muted", "together"].forEach(function (k) { if (!plain(fr[k])) fr[k] = {}; });
        ["mail", "seen"].forEach(function (k) { if (!Array.isArray(fr[k])) fr[k] = []; });
        if (typeof fr.giftDay !== "string") fr.giftDay = "";
        return fr;
    }
    function noteIncoming(fr, d, myCode, now) {
        now = now || Date.now();
        const c = d.c;
        let f = fr.list[c];
        const isNew = !f;
        if (!f) {
            const codes = Object.keys(fr.list);
            if (codes.length >= LIMITS.friends) {
                codes.sort(function (a, b) { return (fr.list[a].last || 0) - (fr.list[b].last || 0); });
                delete fr.list[codes[0]];
            }
            f = fr.list[c] = { first: now, n: "", w: "", p: "" };
        }
        f.got = true;
        f.last = now;
        if (own(d, "n")) f.n = d.n;
        if (d.w) f.w = d.w;
        if (d.p) f.p = d.p;
        if (d.k === "f") f.snap = strip({ w: d.w, n: d.n, p: d.p, d: d.d, s: d.s, e: d.e });
        if (d.to && d.to === myCode) f.knows = true;
        return { friend: f, isNew: isNew };
    }
    function noteSent(fr, code, now) { if (CODE_RE.test(code || "")) fr.sentTo[code] = now || Date.now(); }
    function isMutual(fr, code) {
        const f = fr.list[code];
        return !!(f && f.got && !fr.muted[code] && (fr.sentTo[code] || f.knows));
    }
    function addGift(fr, d, now) {
        if (fr.muted[d.c]) return "muted";
        if (fr.seen.indexOf(d.i) >= 0 || fr.mail.some(function (x) { return x.i === d.i; })) return "dup";
        fr.seen.unshift(d.i);
        fr.seen = fr.seen.slice(0, LIMITS.seen);
        fr.mail.unshift(strip({ i: d.i, c: d.c, n: d.n, w: d.w, s: d.s, m: d.m, x: d.x, pl: d.pl, to: d.to, ts: d.ts || Math.floor((now || Date.now()) / 1000), got: now || Date.now(), read: false }));
        fr.mail = fr.mail.slice(0, LIMITS.mail);
        return "added";
    }
    function muteCode(fr, code) { fr.muted[code] = true; fr.mail = fr.mail.filter(function (x) { return x.c !== code; }); }
    function unmuteCode(fr, code) { delete fr.muted[code]; }
    function removeFriend(fr, code) { delete fr.list[code]; delete fr.sentTo[code]; }
    function deleteGift(fr, id) { fr.mail = fr.mail.filter(function (x) { return x.i !== id; }); }
    function msgText(id, lang) { const list = MSGS[lang] || MSGS.en; return list[id] !== undefined ? list[id] : (MSGS.en[id] || ""); }
    function fxText(key, lang, vals) {
        const d = FX[lang] || FX.en;
        let s = d[key] !== undefined ? d[key] : (FX.en[key] !== undefined ? FX.en[key] : key);
        for (const k in vals || {}) s = s.split("{" + k + "}").join(vals[k]);
        return s;
    }

    const Core = {
        FX: FX, MSGS: MSGS, STICKERS: STICKERS, STICKER_NAMES: STICKER_NAMES, LIMITS: LIMITS, CODE_RE: CODE_RE, ID_RE: ID_RE,
        randCode: randCode, encode: encode, toB64u: toB64u, fromB64u: fromB64u, validate: validate, parseHash: parseHash,
        clean: clean, checkText: checkText, checkNick: checkNick, hasContact: hasContact, hasMean: hasMean,
        makeVisit: makeVisit, makeGift: makeGift, makeTrip: makeTrip,
        fixState: fixState, noteIncoming: noteIncoming, noteSent: noteSent, isMutual: isMutual, addGift: addGift,
        muteCode: muteCode, unmuteCode: unmuteCode, removeFriend: removeFriend, deleteGift: deleteGift, msgText: msgText, fxText: fxText
    };

    // ---------- ส่วนหน้าจอ: ทำงานเฉพาะในเกม ----------
    const hasUI = typeof document !== "undefined" && typeof S !== "undefined" && !!S && typeof $ === "function" && !!document.getElementById("stage");
    if (!hasUI) return { core: Core, transport: null };

    const reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    function T(key, vals) { return fxText(key, L, vals); }
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
    function btn(cls, text, fn) { const b = el("button", cls, text); b.type = "button"; if (fn) b.addEventListener("click", fn); return b; }
    function stickerOf(id) { return STICKERS.find(function (s) { return s.id === id; }) || STICKERS[0]; }
    function stickerName(id) { const i = STICKERS.findIndex(function (s) { return s.id === id; }); return ((STICKER_NAMES[L] || STICKER_NAMES.en)[i]) || id; }
    function petNameOf(w) { return w && WORLDS[w] ? t("pet_" + w) : T("friendDef"); }
    // ชื่อน้องที่มากับลิงก์: ถ้าเป็นชื่อเริ่มต้นของโลกนั้น (ภาษาใดก็ได้) แสดงเป็นภาษาของผู้รับ
    function petLabelOf(w, p) {
        if (!p || !w) return petNameOf(w);
        const builtIn = Object.keys(GTEXT).some(function (lang) { return GTEXT[lang] && GTEXT[lang]["pet_" + w] === p; });
        return builtIn ? petNameOf(w) : p;
    }
    function nameOf(n, w) { return n ? n : (w && WORLDS[w] ? T("friendOf", { pet: petNameOf(w) }) : T("friendDef")); }
    function petImg(w, pose) { return img(WORLDS[w] ? WORLDS[w].pet[pose || "sit"] : "hikari_idle"); }
    function worldBg(w) { const W = WORLDS[w]; return W && W.bg ? W.bg[timeOfDay()] : "bg_trip_mountain-lookout"; }
    function placeIndex(id) { return TRIP_STOPS.findIndex(function (s) { return s.id === id; }); }
    function onHome() { return currentTab === "home" && !$("screen-home").hidden; }

    // ----- ตัวตน -----
    if (typeof S.friendCode !== "string" || !CODE_RE.test(S.friendCode)) S.friendCode = randCode(8);
    S.fr = fixState(S.fr);
    save();
    const FR = function () { return S.fr; };
    function myNick() { return S.fr.nick || ""; }
    function myPet() { return S.world ? petName() : ""; }

    // ---------- LinkTransport: ส่งผ่าน share.js · รับจาก hash ตอนเปิดหน้า + hashchange ----------
    function baseUrl() { return location.href.split("#")[0].split("?")[0] + "?openExternalBrowser=1"; }
    function linkFor(kind, payload) { return baseUrl() + "#" + kind + "=" + encode(payload); }
    function share(text, url, onShared) {
        return HikariShare.open({ text: text, url: url, kind: "private", lang: L, onShared: function (app) { if (onShared) onShared(app); } });
    }
    const LinkTransport = {
        name: "link",
        shareVisit: function (snapshot, onShared) { return share(T("inviteText", { pet: myPet() || petNameOf("cat") }), linkFor("f", snapshot), onShared); },
        shareGift: function (gift, toCode, onShared) {
            const text = gift.pl ? T("postText", { place: placeName(gift.pl) }) : T("giftText");
            return share(text, linkFor("g", gift), onShared);
        },
        shareTrip: function (invite, onShared) { return share(T("tripText", { place: placeName(invite.pl), pet: myPet() }), linkFor("t", invite), onShared); },
        onIncoming: function (cb) {
            function check() {
                const h = location.hash;
                if (!/^#[fgt]=/.test(h)) return;
                const r = parseHash(h);
                try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* บางเบราว์เซอร์ */ }
                if (r) cb(r);
            }
            window.addEventListener("hashchange", check);
            check();
        }
    };
    let transport = LinkTransport;

    // ---------- การ์ดทางเข้า (แท็บจดหมาย + แท็บฉัน) ----------
    const cards = [];
    function buildCard() {
        const c = el("div", "card fr-card");
        c.appendChild(el("h2", "h-card", T("title")));
        c.appendChild(el("p", "muted", T("sub")));
        const row = el("div", "item-actions");
        row.appendChild(btn("btn btn-primary", T("invite"), function () { shareMyGarden(); }));
        const open = btn("btn fr-open", T("openBtn"), function () { openSheet(open); });
        const badge = el("span", "fr-badge");
        badge.hidden = true;
        open.appendChild(badge);
        row.appendChild(open);
        c.appendChild(row);
        cards.push(badge);
        return c;
    }
    function refreshBadges() {
        const n = S.fr.mail.filter(function (x) { return !x.read; }).length;
        cards.forEach(function (b) { b.hidden = !n; b.textContent = n ? T("newBadge") + " " + n : ""; });
    }
    (function injectCards() {
        const talk = $("talkCard");
        if (talk && talk.parentNode) talk.parentNode.insertBefore(buildCard(), talk.nextSibling);
        const meHead = document.querySelector("#screen-me .me-head");
        if (meHead && meHead.parentNode) meHead.parentNode.insertBefore(buildCard(), meHead.nextSibling);
        // แผนที่ทริป: ชวนเพื่อนไปด้วย (ลิงก์ #t=)
        const acts = $("mapConfirm") && $("mapConfirm").querySelector(".item-actions");
        if (acts) acts.appendChild(btn("btn fr-map-invite", "🐾 " + T("inviteMap"), function () {
            const s = TRIP_STOPS[mapPickIdx];
            if (s) shareTripInvite(s.id, null);
        }));
        refreshBadges();
    })();

    function shareMyGarden(toCode) {
        if (!S.world) { toast(T("needWorld")); return; }
        const snap = makeVisit({ code: S.friendCode, nick: myNick(), world: S.world, pet: myPet(), placed: S.placed, stamps: typeof stampCount === "function" ? stampCount() : 0, wear: S.wear, to: toCode });
        transport.shareVisit(snap, function () { if (toCode) { noteSent(S.fr, toCode); save(); } });
    }
    function shareTripInvite(placeId, toCode) {
        if (!S.world) { toast(T("needWorld")); return; }
        const inv = makeTrip({ code: S.friendCode, nick: myNick(), world: S.world, pet: myPet(), place: placeId, to: toCode });
        transport.shareTrip(inv, function () { if (toCode) { noteSent(S.fr, toCode); save(); renderSheet(); } });
    }

    // ---------- ตัวเขียนของขวัญ (ใช้ทั้งตอนเยี่ยมสวน ตอบกลับ และโปสการ์ด) ----------
    function buildComposer(box, o) {
        box.textContent = "";
        const state = { sticker: o.place ? "paw" : STICKERS[0].id, msg: o.place ? 16 : 0, dropText: false };
        const mutual = !!(o.to && isMutual(S.fr, o.to));
        if (o.to) box.appendChild(el("p", "fr-to", T("to", { name: o.toName })));
        if (o.place) box.appendChild(el("p", "fr-post-h", T("postFrom", { place: placeName(o.place) })));
        box.appendChild(el("h3", "fr-h3", T("pickSticker")));
        const sg = el("div", "fr-stickers");
        sg.setAttribute("role", "radiogroup");
        sg.setAttribute("aria-label", T("pickSticker"));
        STICKERS.forEach(function (s) {
            const b = btn("fr-sticker", s.e, function () { state.sticker = s.id; paint(); });
            b.setAttribute("role", "radio");
            b.setAttribute("aria-label", stickerName(s.id));
            b.dataset.id = s.id;
            sg.appendChild(b);
        });
        box.appendChild(sg);
        box.appendChild(el("h3", "fr-h3", T("pickMsg")));
        const ml = el("div", "letter-list fr-msgs");
        ml.setAttribute("role", "radiogroup");
        ml.setAttribute("aria-label", T("pickMsg"));
        const order = o.place ? POSTCARD_MSGS.concat(MSGS.th.map(function (_, i) { return i; }).filter(function (i) { return POSTCARD_MSGS.indexOf(i) < 0; }))
            : MSGS.th.map(function (_, i) { return i; }).filter(function (i) { return i < 16; });
        order.forEach(function (i) {
            const b = btn("", msgText(i, L), function () { state.msg = i; paint(); });
            b.setAttribute("role", "radio");
            b.dataset.m = String(i);
            ml.appendChild(b);
        });
        box.appendChild(ml);
        let ta = null;
        if (mutual) {
            const lab = el("label", "field-label", T("own"));
            const id = "frText" + Math.random().toString(36).slice(2, 7);
            lab.htmlFor = id;
            ta = el("textarea", "field fr-text");
            ta.id = id;
            ta.rows = 2;
            ta.maxLength = 200;                                         // ตรวจ 80 ตัว (นับอีโมจิเป็น 1) ด้วยตัวกรอง
            ta.autocomplete = "off";
            ta.spellcheck = false;
            ta.addEventListener("input", function () { state.dropText = false; msg.textContent = ""; msg.className = "note fr-cmsg"; sendB.textContent = T("send"); });
            box.append(lab, ta, el("p", "note fr-hint", T("ownHint")));
        } else if (o.to || o.lockNote) {
            box.appendChild(el("p", "note fr-lock", T("ownLocked")));
        }
        const msg = el("div", "note fr-cmsg");
        msg.setAttribute("role", "status");
        const sendB = btn("btn btn-primary btn-wide fr-send", T("send"), send);
        box.append(msg, sendB);
        function paint() {
            sg.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-checked", String(b.dataset.id === state.sticker)); });
            ml.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-checked", String(Number(b.dataset.m) === state.msg)); });
        }
        function showMsg(text, cls) { msg.textContent = text; msg.className = "note fr-cmsg " + (cls || "warn"); }
        function send() {
            let text = "";
            if (ta && ta.value.trim() && !state.dropText) {
                const r = checkText(ta.value, LIMITS.text);
                if (r.reason === "risk" || r.reason === "abuse") {
                    // ไม่ส่งข้อความนี้ไปกับของขวัญ · แสดงการ์ดช่วยเหลือ · ไม่ตำหนิ ไม่ลบสิ่งที่พิมพ์
                    HikariSafety.markRisk(USER_KEY, "game");
                    msg.textContent = "";
                    msg.className = "note fr-cmsg";
                    msg.appendChild(el("p", "fr-drop", T("riskDrop")));
                    const card = r.reason === "risk" ? riskBox(t("riskLetter"))
                        : hkAbuseCard({ className: "risk-box", btnClass: "btn btn-small", intlClass: "btn btn-small risk-intl", onTell: function () { closeAll(); openTalk(); } });
                    card.querySelectorAll("button").forEach(function (b) { b.addEventListener("click", function () { closeAll(); }); });
                    msg.appendChild(card);
                    state.dropText = true;
                    sendB.textContent = T("sendNoText");
                    return;
                }
                if (!r.ok) { showMsg(T(r.reason === "len" ? "errLen" : (r.reason === "mean" ? "errMean" : "errContact"))); ta.focus(); return; }
                text = r.text;
            }
            const gift = makeGift({ code: S.friendCode, nick: myNick(), world: S.world || undefined, to: o.to, sticker: state.sticker, msg: state.msg, text: text, place: o.place });
            transport.shareGift(gift, o.to, function () {
                if (o.to) noteSent(S.fr, o.to);
                save();
                showMsg(HikariShare.text("readyFriend", L), "ok");
                if (o.onSent) o.onSent();
            });
        }
        paint();
        return { focus: function () { const f = sg.querySelector('[aria-checked="true"]'); if (f) f.focus(); } };
    }

    // ---------- เยี่ยมสวนเพื่อน (ไม่แตะเซฟของผู้เยี่ยม นอกจากรายชื่อเพื่อน) ----------
    let visitRoot = null, visitFrom = null, visitData = null;
    function buildVisit() {
        visitRoot = el("div", "fr-visit");
        visitRoot.id = "frVisit";
        visitRoot.hidden = true;
        visitRoot.setAttribute("role", "dialog");
        visitRoot.setAttribute("aria-modal", "true");
        visitRoot.setAttribute("aria-labelledby", "frVisitTitle");
        const box = el("div", "fr-visit-box");
        const head = el("div", "fr-vhead");
        const h = el("h2", "h-card");
        h.id = "frVisitTitle";
        const x = btn("sheet-close fr-x", "×", closeVisit);
        x.setAttribute("aria-label", t("close"));
        head.append(h, x);
        const stage = el("div", "fr-stage");
        const bg = el("img", "fr-bg");
        bg.alt = "";
        const decor = el("div", "decor-row fr-decor");
        const pet = el("div", "fr-pet");
        pet.setAttribute("role", "button");
        pet.tabIndex = 0;
        const shadow = el("span", "pet-shadow");
        const body = el("div", "fr-pet-body");
        const pim = el("img");
        pim.alt = "";
        pim.draggable = false;
        body.appendChild(pim);
        const wear = el("span", "wear-badge fr-wear");
        const wim = el("img");
        wim.alt = "";
        wear.appendChild(wim);
        const tag = el("span", "fr-tag");
        pet.append(shadow, body, wear, tag);
        const fx = el("div", "fx");
        fx.setAttribute("aria-hidden", "true");
        const say = el("p", "stage-say fr-say");
        say.setAttribute("role", "status");
        stage.append(bg, decor, pet, fx, say);
        function pat() {
            if (!visitData) return;
            pim.src = petImg(visitData.w, "happy");
            body.classList.remove("hop");
            void body.offsetWidth;
            body.classList.add("hop");
            for (let i = 0; i < 3; i++) {
                const sp = el("span", "heart", "♥");
                sp.style.left = (44 + Math.random() * 12) + "%";
                sp.style.top = (48 + Math.random() * 10) + "%";
                sp.style.setProperty("--dx", (Math.random() * 60 - 30) + "px");
                sp.style.animationDelay = (i * 0.12) + "s";
                fx.appendChild(sp);
                setTimeout(function () { sp.remove(); }, 2000);
            }
            say.textContent = T("petted", { pet: petLabelOf(visitData.w, visitData.p) });
            clearTimeout(pat.t);
            pat.t = setTimeout(function () { pim.src = petImg(visitData.w, "sit"); }, 1600);
        }
        pet.addEventListener("click", pat);
        pet.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pat(); } });
        const hint = el("p", "muted fr-vhint");
        const acts = el("div", "item-actions");
        const giftB = btn("btn btn-primary fr-gift-btn", "💌 " + T("leaveGift"), function () { compose.hidden = false; giftB.hidden = true; comp.focus(); });
        const exitB = btn("btn fr-exit", T("exit"), closeVisit);
        acts.append(giftB, exitB);
        const compose = el("div", "fr-compose");
        compose.hidden = true;
        const foot = el("p", "note fr-privacy", T("privacy"));
        const help = btn("btn btn-small help-btn fr-help", t("helpBtn"), function () { openHelp(); });
        box.append(head, stage, hint, acts, compose, foot, help);
        visitRoot.appendChild(box);
        visitRoot.addEventListener("keydown", function (e) { if (e.key === "Escape" && $("helpSheet").hidden) closeVisit(); });
        document.body.appendChild(visitRoot);
        let comp = null;
        visitRoot._fill = function (d, from) {
            visitData = d;
            h.textContent = T("visiting", { name: nameOf(d.n, d.w) });
            bg.src = img(worldBg(d.w));
            pim.src = petImg(d.w, "sit");
            pim.alt = petLabelOf(d.w, d.p);
            pet.setAttribute("aria-label", petLabelOf(d.w, d.p));
            tag.textContent = nameOf(d.n, d.w) + " · " + petLabelOf(d.w, d.p);
            wear.hidden = !d.e;
            if (d.e) { wim.src = img(d.e); wim.alt = itemName(d.e); }
            decor.textContent = "";
            (d.d || []).forEach(function (id) { const im = el("img"); im.src = img(id); im.alt = itemName(id); decor.appendChild(im); });
            say.textContent = (d.s ? "🗺️ " + d.s + " · " : "") + T("visitHint", { pet: petLabelOf(d.w, d.p) });
            hint.textContent = from === "snap" ? T("snapNote") : "";
            hint.hidden = from !== "snap";
            giftB.hidden = !!d.self;
            compose.hidden = true;
            if (!d.self) comp = buildComposer(compose, { to: d.c, toName: nameOf(d.n, d.w), onSent: function () { renderSheet(); } });
        };
    }
    function openVisit(d, from) {
        if (!visitRoot) buildVisit();
        closeSheet(true);
        visitFrom = document.activeElement;
        visitRoot._fill(d, from);
        visitRoot.hidden = false;
        visitRoot.scrollTop = 0;
        visitRoot.querySelector(".fr-x").focus();
    }
    function closeVisit() {
        if (!visitRoot || visitRoot.hidden) return;
        visitRoot.hidden = true;
        visitData = null;
        if (S.world && currentTab !== "home") showTab("home");          // กลับสวนของตัวเอง
        else if (visitFrom && visitFrom.focus && document.contains(visitFrom)) visitFrom.focus();
    }

    // ---------- แผงเพื่อน: กล่องของขวัญ · รายชื่อเพื่อน · ชื่อเล่น · แสตมป์เที่ยวด้วยกัน ----------
    let sheet = null, sheetFrom = null;
    function buildSheet() {
        sheet = el("div", "sheet fr-sheet");
        sheet.id = "frSheet";
        sheet.hidden = true;
        const box = el("div", "sheet-box");
        box.setAttribute("role", "dialog");
        box.setAttribute("aria-modal", "true");
        box.setAttribute("aria-labelledby", "frTitle");
        const x = btn("sheet-close", "×", function () { closeSheet(); });
        x.setAttribute("aria-label", t("close"));
        const h = el("h2", "h-display", T("title"));
        h.id = "frTitle";
        const main = el("div", "fr-main");
        const sub = el("div", "fr-subview");
        sub.hidden = true;
        box.append(x, h, main, sub);
        sheet.appendChild(box);
        sheet.addEventListener("click", function (e) { if (e.target === sheet) closeSheet(); });
        sheet.addEventListener("keydown", function (e) { if (e.key === "Escape" && $("helpSheet").hidden) closeSheet(); });
        document.body.appendChild(sheet);
    }
    function openSheet(from) {
        if (!sheet) buildSheet();
        sheetFrom = from || document.activeElement;
        sheet.querySelector(".fr-subview").hidden = true;
        sheet.querySelector(".fr-main").hidden = false;
        renderSheet();
        sheet.hidden = false;
        sheet.querySelector(".sheet-box").scrollTop = 0;
        sheet.querySelector(".sheet-close").focus();
        S.fr.mail.forEach(function (m) { m.read = true; });
        save();
        refreshBadges();
    }
    function closeSheet(silent) {
        if (!sheet || sheet.hidden) return;
        sheet.hidden = true;
        if (!silent && sheetFrom && sheetFrom.focus && document.contains(sheetFrom)) sheetFrom.focus();
    }
    function closeAll() { closeSheet(true); if (visitRoot && !visitRoot.hidden) { visitRoot.hidden = true; visitData = null; } }
    function showSub(build) {
        const main = sheet.querySelector(".fr-main"), sub = sheet.querySelector(".fr-subview");
        main.hidden = true;
        sub.hidden = false;
        sub.textContent = "";
        sub.appendChild(btn("btn btn-small fr-back", "‹ " + T("back"), function () { sub.hidden = true; main.hidden = false; renderSheet(); }));
        build(sub);
        sheet.querySelector(".sheet-box").scrollTop = 0;
    }
    function dateText(ms) { try { return new Date(ms).toLocaleDateString(L === "ar" ? "ar" : L, { day: "numeric", month: "short" }); } catch (e) { return dayStr(new Date(ms)); } }
    function renderSheet() {
        if (!sheet) return;
        const main = sheet.querySelector(".fr-main");
        if (sheet.querySelector(".fr-subview").hidden === false) return;
        main.textContent = "";
        main.appendChild(el("p", "muted", T("sub")));
        main.appendChild(btn("btn btn-primary btn-wide fr-invite", "🌷 " + T("invite"), function () { shareMyGarden(); }));

        // กล่องของขวัญ
        const mh = el("h3", "fr-h3", T("mailbox"));
        main.appendChild(mh);
        const mail = el("div", "fr-mail");
        if (!S.fr.mail.length) mail.appendChild(el("p", "muted", T("mailEmpty")));
        S.fr.mail.forEach(function (m) {
            const row = el("div", "fr-gift");
            row.dataset.id = m.i;
            const st = el("span", "fr-gift-st", stickerOf(m.s).e);
            st.setAttribute("role", "img");
            st.setAttribute("aria-label", stickerName(m.s));
            const body = el("div", "fr-gift-body");
            body.appendChild(el("b", "", T("from", { name: nameOf(m.n, m.w) })));
            if (m.pl) body.appendChild(el("small", "fr-post", T("postFrom", { place: placeName(m.pl) })));
            body.appendChild(el("p", "fr-gift-msg", msgText(m.m, L)));
            if (m.x) body.appendChild(el("p", "fr-own", "“" + m.x + "”"));
            body.appendChild(el("small", "muted", dateText((m.ts || 0) * 1000)));
            const acts = el("div", "fr-row-acts");
            acts.appendChild(btn("btn btn-small btn-primary fr-reply", T("reply"), function () { openReply(m.c, nameOf(m.n, m.w)); }));
            acts.appendChild(btn("btn btn-small fr-mute", T("mute"), function () { muteCode(S.fr, m.c); save(); toast(T("muted")); renderSheet(); refreshBadges(); }));
            acts.appendChild(btn("btn btn-small fr-del", T("del"), function () { deleteGift(S.fr, m.i); save(); renderSheet(); refreshBadges(); }));
            body.appendChild(acts);
            row.append(st, body);
            mail.appendChild(row);
        });
        main.appendChild(mail);

        // รายชื่อเพื่อน
        main.appendChild(el("h3", "fr-h3", T("friends")));
        const list = el("div", "fr-friends");
        const codes = Object.keys(S.fr.list).sort(function (a, b) { return (S.fr.list[b].last || 0) - (S.fr.list[a].last || 0); });
        if (!codes.length) list.appendChild(el("p", "muted", T("friendsEmpty")));
        codes.forEach(function (c) {
            const f = S.fr.list[c], muted = !!S.fr.muted[c];
            const row = el("div", "fr-friend" + (muted ? " muted-row" : ""));
            row.dataset.code = c;
            const im = el("img");
            im.src = petImg(f.w || "trip", "sit");
            im.alt = "";
            const body = el("div", "fr-friend-body");
            body.appendChild(el("b", "", nameOf(f.n, f.w)));
            body.appendChild(el("small", "fr-status", (muted ? T("hidden") : (isMutual(S.fr, c) ? "🤝 " + T("mutual") : T("oneWay"))) + " · " + T("seen", { date: dateText(f.last || f.first) })));
            const acts = el("div", "fr-row-acts");
            if (!muted) {
                acts.appendChild(btn("btn btn-small fr-visit-btn", T("visit"), function () {
                    openVisit(Object.assign({ c: c, w: f.w || "trip", n: f.n, p: f.p }, f.snap || {}, { c: c }), "snap");
                }));
                acts.appendChild(btn("btn btn-small fr-trip-btn", T("trip"), function () { openTripPick(c, nameOf(f.n, f.w)); }));
                acts.appendChild(btn("btn btn-small fr-mute", T("mute"), function () { muteCode(S.fr, c); save(); toast(T("muted")); renderSheet(); refreshBadges(); }));
            } else {
                acts.appendChild(btn("btn btn-small fr-unmute", T("unmute"), function () { unmuteCode(S.fr, c); save(); renderSheet(); }));
            }
            acts.appendChild(btn("btn btn-small fr-remove", T("remove"), function () { removeFriend(S.fr, c); save(); toast(T("removed")); renderSheet(); }));
            body.appendChild(acts);
            row.append(im, body);
            list.appendChild(row);
        });
        main.appendChild(list);

        // แสตมป์เที่ยวด้วยกัน (สะสมไว้ดูเฉย ๆ ไม่มีนับแข่ง)
        const tg = Object.keys(S.fr.together).filter(function (id) { return placeIndex(id) >= 0; });
        if (tg.length) {
            main.appendChild(el("h3", "fr-h3", T("together")));
            const sb = el("div", "album album-stamps fr-stamps");
            tg.forEach(function (id) { const im = el("img"); im.src = img("stamp_" + id); im.alt = placeName(id); im.title = placeName(id); sb.appendChild(im); });
            main.appendChild(sb);
        }

        // ชื่อเล่น + รหัสเพื่อน
        main.appendChild(el("h3", "fr-h3", T("nick")));
        const nr = el("div", "redeem-row fr-nick-row");
        const ni = el("input", "field fr-nick");
        ni.maxLength = 32;
        ni.autocomplete = "off";
        ni.spellcheck = false;
        ni.value = S.fr.nick;
        ni.placeholder = T("nickPh", { def: S.world ? T("friendOf", { pet: petName() }) : T("friendDef") });
        ni.setAttribute("aria-label", T("nick"));
        const nmsg = el("p", "note fr-nick-msg");
        nmsg.setAttribute("role", "status");
        nr.append(ni, btn("btn btn-primary fr-nick-save", T("save"), function () {
            const v = ni.value.trim();
            if (!v) { S.fr.nick = ""; save(); nmsg.textContent = T("nickSaved"); nmsg.className = "note fr-nick-msg ok"; return; }
            const r = checkNick(v);
            if (r.reason === "risk" || r.reason === "abuse") HikariSafety.markRisk(USER_KEY, "game");
            if (!r.ok) {
                nmsg.textContent = T("nickBad");
                nmsg.className = "note fr-nick-msg warn";
                if (r.reason === "risk") nmsg.appendChild(riskBox(t("riskCare")));
                if (r.reason === "abuse") nmsg.appendChild(hkAbuseCard({ className: "risk-box", btnClass: "btn btn-small", intlClass: "btn btn-small risk-intl", onTell: function () { closeAll(); openTalk(); } }));
                return;
            }
            S.fr.nick = r.text;
            ni.value = r.text;
            save();
            nmsg.textContent = T("nickSaved");
            nmsg.className = "note fr-nick-msg ok";
        }));
        main.append(nr, nmsg);
        const code = el("p", "muted fr-code");
        code.append(T("code") + ": ");
        code.appendChild(el("code", "", S.friendCode));
        main.appendChild(code);

        // เพื่อนช่วยกันได้ แต่ไม่ใช่ผู้เชี่ยวชาญ + ปุ่มช่วยเหลือ + ความเป็นส่วนตัว
        const peer = el("div", "fr-peer");
        const pp = el("p");
        setText(pp, T("peer"));
        peer.appendChild(pp);
        peer.appendChild(btn("btn btn-small help-btn fr-help", t("helpBtn"), function () { openHelp(); }));
        main.appendChild(peer);
        main.appendChild(el("p", "note fr-privacy", T("privacy")));
    }
    function openReply(code, name, place) {
        if (!sheet || sheet.hidden) openSheet();
        showSub(function (sub) {
            const box = el("div", "fr-compose");
            sub.appendChild(box);
            buildComposer(box, { to: code, toName: name, place: place, onSent: function () {} }).focus();
        });
    }
    function openTripPick(code, name) {
        showSub(function (sub) {
            sub.appendChild(el("h3", "fr-h3", T("tripPick")));
            sub.appendChild(el("p", "fr-to", T("to", { name: name })));
            const grid = el("div", "fr-places");
            TRIP_STOPS.forEach(function (s) {
                const b = btn("map-card fr-place");
                b.dataset.place = s.id;
                const im = el("img");
                im.src = img(s.bg);
                im.alt = "";
                im.loading = "lazy";
                b.append(im, el("b", "", placeName(s.id)));
                b.addEventListener("click", function () { shareTripInvite(s.id, code); });
                grid.appendChild(b);
            });
            sub.appendChild(grid);
        });
    }

    // ---------- เที่ยวด้วยกัน: น้องของเพื่อนเดินเล่นข้าง ๆ (ในหน่วยความจำ กลับบ้าน = ลากัน) ----------
    let comp = null, compEl = null, compTimer = null, askRoot = null;
    function askTrip(d) {
        if (!askRoot) {
            askRoot = el("div", "sheet sheet-center fr-ask");
            askRoot.hidden = true;
            const box = el("div", "sheet-box intro-box");
            box.setAttribute("role", "dialog");
            box.setAttribute("aria-modal", "true");
            box.setAttribute("aria-labelledby", "frAskTitle");
            const art = el("div", "intro-art fr-ask-art");
            const ph = el("img", "fr-ask-photo");
            ph.alt = "";
            const pi = el("img", "fr-ask-pet");
            pi.alt = "";
            art.append(ph, pi);
            const h = el("h2", "h-display");
            h.id = "frAskTitle";
            const acts = el("div", "item-actions");
            const later = btn("btn fr-later", T("later"), function () { askRoot.hidden = true; });
            const go = btn("btn btn-primary fr-go", T("tripGo"));
            acts.append(later, go);
            box.append(art, h, acts);
            askRoot.appendChild(box);
            askRoot.addEventListener("keydown", function (e) { if (e.key === "Escape") askRoot.hidden = true; });
            document.body.appendChild(askRoot);
            askRoot._go = go;
        }
        const s = TRIP_STOPS[placeIndex(d.pl)];
        askRoot.querySelector(".fr-ask-photo").src = img(s.bg);
        askRoot.querySelector(".fr-ask-pet").src = petImg(d.w, "happy");
        askRoot.querySelector("h2").textContent = T("tripAsk", { name: nameOf(d.n, d.w), place: placeName(d.pl) });
        askRoot._go.onclick = function () { askRoot.hidden = true; startTrip(d); };
        askRoot.hidden = false;
        askRoot._go.focus();
    }
    function startTrip(d) {
        if (!S.world) { toast(T("needWorld")); return; }
        const i = placeIndex(d.pl);
        if (i < 0) return;
        closeAll();
        comp = { c: d.c, n: d.n, w: d.w, p: d.p, pl: d.pl };
        S.fr.together[d.pl] = { c: d.c, at: Date.now() };
        save();
        goPlace(i);
        setTimeout(function () { toast(T("stampGot", { place: placeName(d.pl) })); }, 400);
        setTimeout(function () {
            if (comp && Pet.isActive()) Pet.say(T("compSay", { name: nameOf(comp.n, comp.w), pet: petLabelOf(comp.w, comp.p) }), function () { openPostcard(); });
        }, reduced ? 300 : 3200);
    }
    function openPostcard() {
        if (!comp) return;
        openReply(comp.c, nameOf(comp.n, comp.w), comp.pl);
    }
    function compHere() {
        if (!comp) return false;
        const st = $("stage");
        return st && st.dataset.place === "trip" && tripStop().id === comp.pl;
    }
    function removeComp() { if (compEl) compEl.remove(); compEl = null; clearTimeout(compTimer); }
    function placeComp(x, y, secs) {
        const B = Pet.bounds;
        x = Math.max(B.x0, Math.min(B.x1, x));
        y = Math.max(B.y0, Math.min(B.y1, y));
        const far = (y - B.y0) / Math.max(1, B.y1 - B.y0);
        compEl.style.setProperty("--walk", (reduced ? 0 : secs || 0) + "s");
        compEl.style.setProperty("--depth", ((1.05 - far * 0.29) * (B.scale || 1)).toFixed(3));
        compEl.style.zIndex = String(40 - Math.round(y));
        const was = parseFloat(compEl.style.left) || x;
        if (Math.abs(x - was) > 0.5) compEl.querySelector(".fr-comp-flip").classList.toggle("left", x < was);
        compEl.style.left = x + "%";
        compEl.style.bottom = y + "%";
        compEl._x = x;
        compEl._y = y;
    }
    function wander() {
        clearTimeout(compTimer);
        compTimer = setTimeout(wander, 3600 + Math.random() * 2600);
        if (!compEl || document.hidden || !onHome()) return;
        const B = Pet.bounds, p = Pet.pos, side = compEl._x > p.x ? 1 : -1;
        const gap = (12 + Math.random() * 8) / (B.ratio || 1);
        const tx = p.x + side * gap, ty = p.y + (Math.random() * 4 - 2);
        const dist = Math.abs(tx - compEl._x) * (B.ratio || 1);
        const secs = Math.max(0.6, Math.min(3.5, dist / 14));
        const body = compEl.querySelector(".fr-comp-body");
        if (dist > 2 && !reduced) { body.classList.add("walk"); setTimeout(function () { body.classList.remove("walk"); }, secs * 1000); }
        placeComp(tx, ty, secs);
    }
    function ensureComp() {
        if (!compHere()) { removeComp(); comp = null; return; }            // กลับบ้าน / ไปที่อื่น = น้องของเพื่อนกลับก่อน
        const w = $("wWorld");
        if (!w) return;
        if (!compEl || compEl.parentNode !== w) {
            removeComp();
            compEl = el("div", "fr-comp");
            compEl.setAttribute("role", "button");
            compEl.tabIndex = 0;
            const label = nameOf(comp.n, comp.w) + " · " + petLabelOf(comp.w, comp.p);
            compEl.setAttribute("aria-label", label + " · " + T("postcard"));
            const flip = el("div", "fr-comp-flip");
            const body = el("div", "fr-comp-body");
            const im = el("img");
            im.src = petImg(comp.w, "sit");
            im.alt = "";
            im.draggable = false;
            body.appendChild(im);
            flip.appendChild(body);
            compEl.append(el("span", "pet-shadow"), flip, el("span", "fr-tag", label));
            function tap(e) {
                if (e) e.stopPropagation();
                im.src = petImg(comp.w, "happy");
                body.classList.remove("hop");
                void body.offsetWidth;
                body.classList.add("hop");
                setTimeout(function () { if (comp) im.src = petImg(comp.w, "sit"); }, 1500);
                openPostcard();
            }
            compEl.addEventListener("click", tap);
            compEl.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
            compEl.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(); } });
            w.appendChild(compEl);
            const p = Pet.pos;
            placeComp(p.x - 16 / (Pet.bounds.ratio || 1), p.y + 2, 0);
            wander();
        }
    }

    // ---------- จดหมายมาถึง: น้องคาบจดหมายเดินมาหา แล้ววางไว้ให้แตะเปิด ----------
    let pendingLetter = null, letterEl = null;
    function deliverLetter() {
        if (!pendingLetter || !onHome() || typeof Pet === "undefined" || !Pet.isActive() || !$("wWorld")) return;
        const m = pendingLetter;
        pendingLetter = null;
        const petEl = $("petBtn");
        const carry = el("span", "fr-carry", "💌");
        carry.setAttribute("aria-hidden", "true");
        petEl.appendChild(carry);
        const B = Pet.bounds, cx = B.center ? B.center() : 50;
        const tx = Math.max(B.x0, Math.min(B.x1, cx - 6 / (B.ratio || 1))), ty = Math.max(B.y0, Math.min(B.y1, 6));
        Pet.sniffAt(tx, ty, function () {
            carry.remove();
            if (letterEl) letterEl.remove();
            letterEl = btn("fr-letter", "💌", function (e) { e.stopPropagation(); if (letterEl) letterEl.remove(); letterEl = null; openSheet(); });
            const label = T("newGift", { name: nameOf(m.n, m.w) });
            letterEl.setAttribute("aria-label", label);
            letterEl.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
            letterEl.style.left = Math.min(B.x1, tx + 10 / (B.ratio || 1)) + "%";
            letterEl.style.bottom = (ty + 1) + "%";
            $("wWorld").appendChild(letterEl);
            Pet.say(label, function () { if (letterEl) letterEl.remove(); letterEl = null; openSheet(); });
        });
    }

    // game-world.js: วาดฉากใหม่ทุกครั้ง → ตรวจน้องของเพื่อน + จดหมายที่รอส่ง (ไม่แก้ไฟล์ของคนอื่น)
    if (typeof HikariWorld !== "undefined" && HikariWorld && typeof HikariWorld.render === "function") {
        const origRender = HikariWorld.render;
        HikariWorld.render = function () {
            const r = origRender.apply(this, arguments);
            try { ensureComp(); if (pendingLetter) setTimeout(deliverLetter, reduced ? 50 : 900); } catch (e) { /* ไม่ให้ฉากพัง */ }
            return r;
        };
    }

    // ---------- รับลิงก์ ----------
    function handleIncoming(r) {
        if (r.error) { toast(T("bad")); return; }
        const d = r.data;
        if (d.c === S.friendCode) { toast(T("self")); if (d.k === "f") openVisit(Object.assign({}, d, { self: true })); return; }
        if (S.fr.muted[d.c]) { toast(T("mutedLink")); return; }
        noteIncoming(S.fr, d, S.friendCode);
        if (d.k === "f") { save(); openVisit(d); }
        else if (d.k === "g") {
            const res = addGift(S.fr, d);
            if (res === "dup") { save(); toast(T("dup")); return; }
            if (d.pl && !S.fr.together[d.pl]) { S.fr.together[d.pl] = { c: d.c, at: Date.now() }; setTimeout(function () { toast(T("stampGot", { place: placeName(d.pl) })); }, 5200); }
            const today = dayStr();
            if (S.fr.giftDay !== today) { S.fr.giftDay = today; addLight(1); setTimeout(function () { toast(T("giftLight")); }, 2600); }
            save();
            refreshBadges();
            pendingLetter = S.fr.mail[0];
            if (onHome()) setTimeout(deliverLetter, reduced ? 50 : 700);
            else toast(T("newGift", { name: nameOf(d.n, d.w) }));
        } else if (d.k === "t") { save(); askTrip(d); }
        renderSheet();
    }
    function setTransport(tr) { if (tr && typeof tr.shareGift === "function") { transport = tr; transport.onIncoming(handleIncoming); } }
    transport.onIncoming(handleIncoming);

    return {
        core: Core, transport: function () { return transport; }, setTransport: setTransport,
        open: openSheet, shareMyGarden: shareMyGarden, inviteTrip: shareTripInvite, companion: function () { return comp; }
    };
})();
if (typeof module !== "undefined" && module.exports) module.exports = HikariFriends;
