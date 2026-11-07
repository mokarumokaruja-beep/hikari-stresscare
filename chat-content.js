// =====================================================================
// Hikari - chat-content.js (v28)  ข้อความ "คุยกับน้อง" 10 ภาษา (th en zh hi es fr ar pt ru ja)
// ใช้คู่กับ game-chat.js · โหลดหลัง game-data.js
//
//   CHAT_UI[ภาษา]        ข้อความบนหน้าจอแชต (ปุ่ม ชิป การ์ด หัวข้อ)
//   CHAT[ภาษา][intent]   คำตอบของน้อง หลายแบบต่อเรื่อง (สุ่มไม่ซ้ำกับที่เพิ่งใช้)
//   CHAT_KEYS[ภาษา][intent]  คำที่ใช้เดาว่าผู้ใช้พูดเรื่องอะไร (เขียนแบบปกติ ระบบ normalize ให้)
//                         "*" ท้ายคำ = ขึ้นต้นด้วยคำนี้ (เช่น "stress*" = stress, stressed, stressful) ใช้กับภาษาที่เว้นวรรค
//   CHAT_CRISIS[ภาษา]    ข้อความตายตัวเมื่อพบสัญญาณเสี่ยง (มนุษย์เขียน ห้ามให้ระบบหรือ AI แต่งเอง ห้ามสุ่ม)
//   CHAT_ACTIONS         การ์ดที่น้องเสนอได้ (allow-list เดียวกับที่ AI ใช้ได้)
//   CHAT_INTENT_ACTIONS  การ์ดที่ตรงกับแต่ละเรื่อง (ไม่เกิน 2 ใบ ยกเว้น ask_break)
//
// แนวเขียน (wellness-game-design): เพื่อนสัตว์เลี้ยง ไม่ใช่นักบำบัด · ฟังและสะท้อนก่อน (MI/OARS) · ทำให้เป็นเรื่องปกติ
//   · ชวนทำเรื่องเล็ก 1 อย่าง · คำถามไม่เกิน 1 ข้อต่อข้อความ · ไม่วินิจฉัย ไม่อ้างว่ารักษา · ไม่ทำให้รู้สึกผิด · ไม่ขายของ
//   · ไม่พูดให้พึ่งพา (ห้าม "ฉันอยู่กับคุณตลอดไป" "คุณมีแค่ฉัน") · {s} = เสียงน้องตามโลก · {pet} = ชื่อน้อง · {topic} = หัวข้อ
//   · ขึ้นต้นด้วย "~a " = แนว ACT (ถอยออกจากความคิด) · "~c " = แนว CBT (ตรวจความคิด) ระบบใช้สายเดียวต่อการคุยหนึ่งรอบ
//     (กฎ: ห้ามผสม CBT กับ ACT ในบทสนทนาเดียว) ไม่มีป้าย = ใช้ได้ทุกสาย
// ข้อความใหม่ต้องเพิ่มครบ 10 ภาษา · ให้เจ้าของภาษาและนักจิตวิทยาคลินิกตรวจก่อนเปิดใช้จริง
// =====================================================================

// ----- การ์ดที่น้องเสนอได้: run = ฟังก์ชันในเกม (game-chat.js) · href = หน้าเว็บ (โดเมนเดียวกัน ตรวจ id แล้วว่ามีใน index.html) -----
const CHAT_ACTIONS = {
    sigh: { icon: "mood_lungs", run: "sigh" },             // ถอนหายใจยาว 1 นาที (physiological sigh)
    b48: { icon: "mood_moon-sleep", run: "b48" },          // หายใจ 4·8 (หายใจออกยาว)
    breathe: { icon: "icon_breathe", run: "breathe" },     // แท็บหายใจ
    qb: { icon: "mood_tea", run: "qb" },                   // เมนูพักสั้น
    stretch: { icon: "mood_yoga-mat", run: "stretch" },    // ยืดเหยียด 2 นาที
    pmr: { icon: "mood_meditate", run: "pmr" },            // เกร็งแล้วคลาย 3 นาที
    walk: { icon: "mood_sneaker", run: "walk" },           // เดินกับน้อง 5 นาที
    step: { icon: "mood_sprout", run: "step" },            // ก้าวเล็กถัดไป
    talk: { icon: "mood_heart", run: "talk" },             // ชวนคนที่ไว้ใจคุย
    letters: { icon: "mood_journal", run: "letters" },     // จดหมายใจดี
    help: { icon: "icon_heart", run: "help" },             // ต้องการความช่วยเหลือตอนนี้ (ฟรีเสมอ)
    web_today: { icon: "mood_target", href: "index.html#today" },
    web_assessment: { icon: "icon_check", href: "index.html#assessment" },
    web_burnout: { icon: "mood_hourglass", href: "index.html#burnout" },
    web_rootcause: { icon: "mood_compass", href: "index.html#rootcause" },
    web_sleep: { icon: "mood_moon-sleep", href: "index.html#rootcause" },
    web_selfcare: { icon: "mood_lotus", href: "index.html#selfcare" },
    web_moodscreen: { icon: "mood_cloud-rain", href: "index.html#mood-screen" },
    web_videos: { icon: "mood_headphones", href: "index.html#videos" }
};
// การ์ดในข้อความวิกฤต (ไม่มีการ์ดอื่นปน): โทร 1323/1669 · สายด่วนทั่วโลก · บอกคนที่ไว้ใจ · หน้าต่างช่วยเหลือ
const CHAT_HELP_ACTIONS = ["call", "intl", "tell", "help"];

const CHAT_INTENT_ACTIONS = {
    greeting: [], greet_none: [], greet_low: [], greet_high: [], intro: [],
    mood_good: [], mood_meh: ["walk"], mood_sad: ["talk", "web_moodscreen"], mood_anxious: ["sigh", "web_selfcare"],
    stressed: ["qb", "web_assessment"], stressed_work: ["stretch", "web_rootcause"], burnout_tired: ["pmr", "web_burnout"],
    sleep: ["b48", "web_sleep"], lonely: ["talk", "letters"], anger: ["walk", "sigh"], overthinking: ["sigh", "web_selfcare"],
    self_criticism: ["breathe"], procrastination: ["step", "web_rootcause"], relationship: ["talk", "web_rootcause"],
    good_news: ["letters"], gratitude: [], bored: ["walk", "web_videos"], ask_pet: [], thanks: [], bye: [],
    ask_human: ["talk"], vent: [], listen: [], ask_break: ["sigh", "stretch", "walk", "qb"], ask_mission: ["web_today", "qb"],
    yes: [], no: [], unknown: [], followup: [], nudge: ["talk", "stretch"]
};
// เรื่องที่น้องจำไว้ 1 ตา (ถ้าข้อความถัดไปเดาไม่ออก น้องตอบต่อเรื่องเดิม)
const CHAT_TOPICS = ["mood_sad", "mood_anxious", "stressed", "stressed_work", "burnout_tired", "sleep", "lonely", "anger",
    "overthinking", "self_criticism", "procrastination", "relationship"];

const CHAT_UI = {}, CHAT = {}, CHAT_KEYS = {}, CHAT_CRISIS = {};

// =====================================================================
// ไทย
// =====================================================================
CHAT_UI.th = {
    btn: "คุยกับน้อง", title: "คุยกับ{pet}", sub: "ในเครื่องนี้เท่านั้น · ไม่ใช่คนหรือนักบำบัด",
    disclose: "{pet}เป็นสัตว์เลี้ยงในเกม ไม่ใช่คนและไม่ใช่นักบำบัด คำตอบเขียนไว้ล่วงหน้าโดยทีม Hikari และทำงานในเครื่องนี้ ข้อความที่พิมพ์ไม่ถูกส่งไปที่ไหน แชตนี้ไม่ใช่การรักษาหรือบริการฉุกเฉิน ถ้ารู้สึกไม่ปลอดภัย กดปุ่มโทรด้านบนได้ทันที ฟรี",
    keep: "จำ 30 ข้อความล่าสุดไว้ในเครื่องนี้", clear: "ล้างแชต", cleared: "ล้างแชตแล้ว ไม่มีข้อความเหลือในเครื่อง",
    placeholder: "พิมพ์บอก{pet}ได้เลย…", send: "ส่ง", close: "ปิด", typing: "{pet}กำลังพิมพ์…", help: "ต้องการความช่วยเหลือตอนนี้",
    you: "คุณ", chips: "หัวข้อที่แตะได้", input: "ข้อความถึง{pet}", after: "ขอบคุณที่คุยกันนะ {s}",
    chip_vent: "อยากระบาย", chip_sleep: "นอนไม่หลับ", chip_work: "งานเยอะ", chip_lonely: "เหงา", chip_break: "ขอวิธีพัก", chip_stay: "อยู่เป็นเพื่อนหน่อย",
    aiToggle: "ใช้ AI ออนไลน์ (ข้อความจะถูกส่งไปเซิร์ฟเวอร์ของ Hikari เพื่อสร้างคำตอบ)", aiNote: "ตอนนี้เปิดโหมด AI ออนไลน์อยู่ คำตอบมาจาก AI ไม่ใช่คน",
    act_sigh: "ถอนหายใจยาว 1 นาที", act_b48: "หายใจ 4·8 ผ่อนคลายก่อนนอน", act_breathe: "หายใจช้า ๆ กับน้อง", act_qb: "เลือกพักสั้น 1–5 นาที",
    act_stretch: "ยืดเหยียดที่โต๊ะ 2 นาที", act_pmr: "เกร็งแล้วคลายกล้ามเนื้อ 3 นาที", act_walk: "เดินกับน้อง 5 นาที", act_step: "ก้าวเล็กถัดไป",
    act_talk: "ชวนคนที่ไว้ใจคุย", act_letters: "ส่งจดหมายใจดี", act_help: "ต้องการความช่วยเหลือตอนนี้",
    act_web_today: "ภารกิจวันนี้", act_web_assessment: "แบบประเมินความเครียด 18 ข้อ", act_web_burnout: "เช็กภาวะหมดไฟ",
    act_web_rootcause: "รับมือที่ต้นเหตุ", act_web_sleep: "รับมือที่ต้นเหตุ: การนอน", act_web_selfcare: "วิธีดูแลตัวเอง (Grounding)",
    act_web_moodscreen: "คัดกรองภาวะซึมเศร้า 2Q", act_web_videos: "วิดีโอคลายเครียด",
    sub_web: "เปิดในเว็บ Hikari", sub_web_moodscreen: "ถ้าเศร้าเกือบทุกวันนานเกิน 2 สัปดาห์ · คัดกรองเบื้องต้น ไม่ใช่การวินิจฉัย", sub_game: "ในเกม",
    topic_mood_sad: "ความเศร้า", topic_mood_anxious: "ความกังวล", topic_stressed: "ความเครียด", topic_stressed_work: "งาน",
    topic_burnout_tired: "ความเหนื่อยล้า", topic_sleep: "การนอน", topic_lonely: "ความเหงา", topic_anger: "ความโกรธ",
    topic_overthinking: "ความคิดที่วนอยู่", topic_self_criticism: "การดุตัวเอง", topic_procrastination: "งานที่เริ่มยาก", topic_relationship: "คนใกล้ตัว"
};
CHAT_CRISIS.th = {
    text: "ขอบคุณที่บอกฉันนะ ฟังดูตอนนี้หนักมากจริง ๆ และคุณไม่ต้องผ่านเรื่องนี้คนเดียว ฉันเป็นแค่สัตว์เลี้ยงในเกม ช่วยในเรื่องฉุกเฉินไม่ได้ แต่มีคนจริงที่พร้อมฟังคุณตอนนี้ สายด่วนสุขภาพจิต 1323 โทรฟรี 24 ชั่วโมง ถ้าอยู่ในอันตรายตอนนี้ โทร 1669 ได้เลย",
    stay: "ฉันยังอยู่ตรงนี้นะ ไม่ต้องรีบพิมพ์อะไร ลองวางเท้าแนบพื้น แล้วหายใจออกช้า ๆ ยาว ๆ สักครั้ง ถ้าพอไหว ลองโทรหรือทักคนที่ไว้ใจนะ ปุ่มด้านล่างกดได้ตลอด ฟรี",
    kidding: "เข้าใจแล้ว ขอบคุณที่บอกนะ ฉันแค่อยากให้รู้ว่า ถ้าวันไหนรู้สึกแบบนั้นขึ้นมาจริง ๆ ปุ่มด้านล่างกดได้ตลอด ฟรี และไม่มีใครตัดสินคุณ"
};
CHAT.th = {
    intro: ["{s} สวัสดี ฉัน{pet}เอง อยากเล่าเรื่องอะไรในวันนี้ก็พิมพ์มาได้เลย หรือแตะหัวข้อด้านล่างก็ได้นะ"],
    greet_none: [
        "{s} ดีใจที่แวะมาคุยนะ วันนี้ใจเป็นยังไงบ้าง?",
        "มาแล้ว! {s} วันนี้รู้สึกแบบไหน แตะสีหน้าด้านล่างหรือพิมพ์มาก็ได้นะ",
        "{s} ฉันอยู่ตรงนี้ อยากเล่าอะไรก็เล่าได้ หรือแค่นั่งเงียบ ๆ ด้วยกันก็ได้"
    ],
    greet_low: [
        "เห็นว่าวันนี้ใจหนักอยู่ ขอบคุณที่ยังแวะมานะ อยากเล่าให้ฉันฟังไหม?",
        "วันนี้ดูเหนื่อย ๆ นะ ไม่ต้องรีบเล่าก็ได้ ฉันนั่งอยู่ตรงนี้ด้วย",
        "วันที่ใจไม่ค่อยดี การแวะมาตรงนี้ก็ถือว่าดูแลตัวเองแล้วนะ อยากเริ่มจากตรงไหนดี?"
    ],
    greet_high: [
        "{s} วันนี้ใจสดใสนี่นา ดีใจด้วยนะ มีเรื่องอะไรดี ๆ บ้าง?",
        "{s} ดีใจที่วันนี้เป็นวันดี ๆ อยากเล่าอะไรให้ฟังไหม?",
        "เย้ {s} วันดี ๆ แบบนี้ เก็บความรู้สึกนี้ไว้ในใจนาน ๆ นะ"
    ],
    greeting: [
        "{s} สวัสดี! ดีใจที่ทักมานะ วันนี้เป็นยังไงบ้าง?",
        "หวัดดี {s} ฉันอยู่ตรงนี้ อยากคุยเรื่องอะไรดี?",
        "{s} ทักมาพอดีเลย วันนี้เหนื่อยไหม?",
        "สวัสดีนะ {s} เล่าอะไรก็ได้ เรื่องเล็กเรื่องใหญ่ฉันฟังหมด"
    ],
    mood_good: [
        "{s} ดีใจด้วย! อะไรทำให้วันนี้ดีที่สุด?",
        "เยี่ยมเลย {s} ลองหยุดสักสามวินาที แล้วจำความรู้สึกดี ๆ นี้ไว้นะ",
        "{s} ฟังแล้วฉันก็อารมณ์ดีตาม วันดี ๆ แบบนี้ เล่าให้ใครสักคนฟังด้วยก็ได้นะ"
    ],
    mood_meh: [
        "เฉย ๆ ก็เป็นความรู้สึกที่โอเคนะ ไม่ต้องดีตลอดก็ได้ ลองทำเรื่องเล็ก ๆ ที่ชอบสัก 5 นาทีไหม?",
        "วันกลาง ๆ แบบนี้มีบ่อย ออกไปเดินเล่นสั้น ๆ กับฉันไหม?",
        "เข้าใจเลย บางวันก็แค่ผ่านไปเรื่อย ๆ ถ้ามีเรื่องติดอยู่ในใจ เล่าให้ฟังได้นะ"
    ],
    mood_sad: [
        "ฟังดูวันนี้ใจหนักมากเลย ขอบคุณที่เล่าให้ฉันฟังนะ ความเศร้าไม่ได้แปลว่าคุณอ่อนแอ อยากเล่าเพิ่มไหมว่าเกิดอะไรขึ้น?",
        "เศร้าก็ได้นะ ไม่ต้องรีบทำให้หาย ลองวางมือไว้ที่อก แล้วบอกตัวเองว่า ตอนนี้มันยากจริง ๆ ใคร ๆ ก็มีวันแบบนี้ได้",
        "ฉันอยู่ตรงนี้นะ ร้องไห้ได้ถ้าอยาก ร่างกายจะได้ปล่อยบางอย่างออกไป ถ้ามีคนที่ไว้ใจ ลองส่งข้อความหาเขาสักนิดก็ดีนะ",
        "วันที่เศร้า แค่ผ่านไปทีละชั่วโมงก็เก่งแล้ว ดื่มน้ำอุ่น ๆ สักแก้ว แล้วใจดีกับตัวเองหน่อยนะ"
    ],
    mood_anxious: [
        "ใจไม่สงบแบบนี้เหนื่อยมากเลยนะ ลองถอนหายใจกับฉัน: สูดเข้าทางจมูก สูดต่ออีกนิด แล้วผ่อนออกทางปากยาว ๆ ทำ 2–3 รอบ",
        "ความกังวลคือสมองพยายามปกป้องเรา แต่บางทีมันทำงานหนักเกินไป ตอนนี้ลองมองหาของ 5 อย่างรอบตัวที่เห็นได้ไหม?",
        "ฉันอยู่ด้วยนะ {s} ลองวางเท้าแนบพื้น รู้สึกถึงน้ำหนักตัว แล้วหายใจออกให้ยาวกว่าหายใจเข้า"
    ],
    stressed: [
        "ฟังดูเครียดสะสมเยอะเลย ความเครียดค้างอยู่ในร่างกายด้วยนะ ขยับตัวหรือหายใจยาว ๆ สัก 1 นาที ช่วยให้ร่างกายรู้ว่าปลอดภัยแล้ว",
        "เครียดแบบนี้ไม่แปลกเลย ใครเจอแบบนี้ก็หนัก อะไรที่หนักใจที่สุดตอนนี้?",
        "{s} พักกับฉันสักนาทีไหม ไม่ต้องแก้ปัญหาทั้งหมดตอนนี้ แค่ให้ร่างกายได้ถอนหายใจก่อน"
    ],
    stressed_work: [
        "งานถาโถมแบบนี้เหนื่อยจริง ๆ นะ ลองเขียนงานทั้งหมดออกมาจากหัว แล้วเลือกแค่เรื่องเดียวที่สำคัญที่สุดตอนนี้",
        "ฟังดูงานกดดันมาก ความเครียดจากงานไม่ใช่ความผิดของคุณนะ บางเรื่องต้องแก้ที่ระบบด้วย ลุกยืดตัว 2 นาทีกับฉันไหม?",
        "วันงานหนักแบบนี้ ขอบคุณตัวเองที่ยังสู้อยู่นะ งานไหนที่ทำให้หนักใจที่สุด?",
        "{s} งานรอได้สักครู่ แต่ไหล่กับคอรอไม่ไหวแล้ว ยืดตัวสั้น ๆ แล้วค่อยกลับไปทำทีละอย่างนะ"
    ],
    burnout_tired: [
        "เหนื่อยสะสมจนหมดแรงแบบนี้ ร่างกายกำลังบอกว่าต้องพักจริง ๆ นะ วันนี้มีอะไรที่วางลงได้สักอย่างไหม?",
        "หมดไฟไม่ได้แปลว่าคุณไม่เก่ง มันคือสัญญาณว่าคุณให้มามากเกินไปนานแล้ว ลองเกร็งแล้วคลายกล้ามเนื้อกับฉัน 3 นาทีไหม?",
        "{s} ฉันเห็นว่าคุณพยายามมาตลอด วันนี้ทำแค่ครึ่งเดียวก็พอแล้วนะ"
    ],
    sleep: [
        "นอนไม่หลับนี่ทรมานนะ ลองหายใจเข้า 4 ออก 8 ช้า ๆ กับฉันสักนาที ไม่ต้องพยายามหลับ แค่ให้ร่างกายได้พัก",
        "ถ้านอนไม่หลับนานเกิน 20 นาที ลุกไปทำอะไรเบา ๆ ในแสงสลัว แล้วค่อยกลับมานอนตอนง่วงนะ",
        "คืนที่หัวไม่ยอมหยุด ลองจดเรื่องที่ค้างใจลงกระดาษสักนิด แล้วบอกตัวเองว่าพรุ่งนี้ค่อยว่ากัน",
        "{s} ตื่นเวลาเดิมทุกเช้าช่วยให้นาฬิกาในร่างกายกลับมาเข้าที่นะ คืนนี้วางมือถือให้ห่างตัวหน่อยไหม?"
    ],
    lonely: [
        "รู้สึกเหงาแบบนี้ ขอบคุณที่บอกนะ ความเหงาไม่ได้แปลว่ามีอะไรผิดกับคุณ มีใครสักคนที่อยากทักไปหาไหม?",
        "ฉันอยู่ตรงนี้นะ {s} แต่ฉันเป็นแค่สัตว์เลี้ยงในเกม การได้ทักคนจริงสักคน แม้แค่ประโยคเดียว ช่วยใจได้มากเลย",
        "เหงาเป็นความรู้สึกที่หลายคนเจอ โดยเฉพาะช่วงที่งานยุ่ง ลองส่งจดหมายใจดีให้ใครสักคนดูนะ"
    ],
    anger: [
        "โกรธแบบนี้แปลว่ามีอะไรสำคัญกับคุณถูกกระทบ ความโกรธมีพลังงานเยอะ ลองเดินเร็ว ๆ หรือขยับตัวสักพักให้มันได้ออกไป",
        "หงุดหงิดได้นะ ไม่ต้องกดไว้ ลองถอนหายใจยาว ๆ สองครั้ง ก่อนตอบใครหรือตัดสินใจอะไรต่อ",
        "ฟังดูโมโหมากเลย อะไรที่ทำให้ของขึ้นที่สุด?"
    ],
    overthinking: [
        "~a ความคิดวนแบบนี้เหนื่อยมาก ลองเติมคำข้างหน้าว่า 'ฉันกำลังมีความคิดว่า…' แล้วดูมันเหมือนเมฆที่ลอยผ่าน ไม่ต้องไล่ ไม่ต้องเชื่อทุกคำ",
        "สมองชอบเล่นเรื่อง 'ถ้า…' วนไปเรื่อย ๆ ลองกลับมาที่ร่างกาย มองของ 5 อย่าง แล้วแตะของ 4 อย่างรอบตัวดูนะ",
        "~c ความคิดไม่ใช่ข้อเท็จจริงทุกครั้งนะ ลองถามตัวเองว่า มีหลักฐานอะไรบ้างที่ค้านความคิดนี้?",
        "~a {s} ความคิดก็เหมือนรถที่วิ่งผ่านหน้าบ้าน เราไม่ต้องกระโดดขึ้นทุกคัน แค่ยืนดูมันผ่านไปก็ได้"
    ],
    self_criticism: [
        "ฟังดูเสียงในหัวกำลังดุคุณแรงมากเลย ถ้าเพื่อนสนิทเจอเรื่องเดียวกัน คุณจะพูดกับเขาว่าอะไร?",
        "ทำพลาดเป็นเรื่องของคนทุกคนนะ ลองบอกตัวเองช้า ๆ ว่า ตอนนี้มันยาก ใคร ๆ ก็พลาดได้ ขอใจดีกับตัวเองสักนิด",
        "~c ความคิดว่า 'ฉันไม่ดีพอ' เป็นกับดักความคิดแบบติดป้ายตัวเอง เรื่องนี้บอกอะไรเกี่ยวกับสถานการณ์ มากกว่าตัวตนของคุณนะ",
        "~a เสียงดุในหัวพูดเสียงดัง แต่ไม่จำเป็นต้องเป็นความจริง ลองขอบคุณมันเบา ๆ ว่า 'ขอบใจที่ห่วงนะ' แล้วกลับมาทำสิ่งที่สำคัญต่อ"
    ],
    procrastination: [
        "เริ่มไม่ได้ไม่ได้แปลว่าขี้เกียจนะ บางทีงานใหญ่จนสมองไม่รู้จะจับตรงไหน ลองซอยให้เหลือก้าวเล็ก ๆ ที่ทำได้ใน 2 นาทีดูไหม?",
        "ลองตั้งเวลาแค่ 5 นาที แล้วบอกตัวเองว่าทำแค่นี้พอ พอเริ่มได้แล้วมักไปต่อง่ายขึ้น",
        "{s} ก้าวเล็กที่สุดของงานนี้คืออะไร เช่น แค่เปิดไฟล์ หรือเขียนหัวข้อบรรทัดเดียว?"
    ],
    relationship: [
        "เรื่องคนใกล้ตัวมักหนักใจกว่าเรื่องอื่น เพราะเราใส่ใจเขามาก ขอบคุณที่เล่านะ อยากเล่าเพิ่มไหมว่าเกิดอะไรขึ้น?",
        "ความสัมพันธ์ที่ตึง ๆ เหนื่อยใจจริง ๆ ลองบอกความรู้สึกด้วยประโยค 'ฉันรู้สึก… เมื่อ…' แทนการโทษกัน อาจช่วยให้คุยกันง่ายขึ้น",
        "บางทีการได้คุยกับคนที่ไว้ใจอีกคน ช่วยให้มองเรื่องนี้ชัดขึ้น มีใครที่พอจะเล่าให้ฟังได้ไหม?"
    ],
    good_news: [
        "{s} เย้! ดีใจด้วยจริง ๆ คุณทำได้! ตอนรู้ข่าวรู้สึกยังไงบ้าง?",
        "{s} เก่งมาก! อย่าเพิ่งรีบไปเรื่องต่อไปนะ ให้เวลาตัวเองดีใจกับเรื่องนี้สักพัก",
        "ข่าวดีแบบนี้ต้องฉลอง {s} ลองเล่าให้คนที่รักฟังด้วย ความสุขจะเพิ่มขึ้นอีก"
    ],
    gratitude: [
        "{s} ฟังแล้วอบอุ่นจัง การสังเกตเห็นสิ่งดี ๆ แบบนี้ช่วยให้ใจมีที่พักนะ",
        "ขอบคุณที่แบ่งเรื่องดี ๆ ให้ฟัง คืนนี้ลองนึกอีกสองเรื่องเล็ก ๆ ที่ขอบคุณได้ไหม?",
        "{s} สิ่งดี ๆ เล็ก ๆ ที่เรามองเห็น เหมือนพลังงานสำรองของใจเลยนะ"
    ],
    bored: [
        "เบื่อ ๆ แบบนี้ ลองให้ร่างกายเปลี่ยนบรรยากาศดีไหม เดินเล่นกับฉัน 5 นาที",
        "ความเบื่อบางทีคือสัญญาณว่าอยากได้อะไรใหม่ ๆ มีอะไรที่เคยชอบแต่ไม่ได้ทำนานแล้วไหม?",
        "{s} มาเล่นกันไหม! หรือดูคลิปผ่อนคลายสั้น ๆ บนเว็บก็ได้นะ"
    ],
    ask_pet: [
        "{s} ฉันชื่อ{pet} ชอบนั่งเล่นในสวนแสง ชอบตอนคุณแวะมา แล้วก็ชอบหายใจช้า ๆ ด้วยกัน",
        "ฉันเป็นสัตว์เลี้ยงตัวเล็ก ๆ ในเกมนี้เอง {s} งานของฉันคือชวนคุณพักบ้าง วันนี้คุณพักหรือยัง?",
        "{s} วันนี้ฉันสบายดี นอนอาบแดดมาแล้ว อุ่นมาก แล้วคุณล่ะ?"
    ],
    thanks: [
        "{s} ยินดีเสมอนะ ขอบคุณที่ใจดีกับตัวเองด้วย",
        "ไม่เป็นไรเลย {s} ดีใจที่ได้คุยกัน",
        "{s} ด้วยความยินดี! ดูแลตัวเองด้วยนะ"
    ],
    bye: [
        "{s} ขอบคุณที่แวะมาคุยนะ ไปพักให้สบายนะ",
        "บาย ๆ {s} ดื่มน้ำสักแก้วก่อนไปนะ",
        "{s} ไว้คุยกันใหม่นะ วันนี้คุณทำดีแล้ว"
    ],
    ask_human: [
        "ฉันเป็นสัตว์เลี้ยงในเกม ไม่ใช่คน และไม่ใช่นักบำบัดนะ คำตอบของฉันเขียนไว้ล่วงหน้าโดยทีม Hikari ทำงานในเครื่องนี้ ถ้าอยากคุยกับคนจริง ทักคนที่ไว้ใจ หรือโทรสายด่วนสุขภาพจิต 1323 ได้ฟรี 24 ชั่วโมง",
        "บอกตรง ๆ นะ ฉันไม่ใช่คน ไม่ใช่หมอหรือนักจิตวิทยา ฉันเป็นแค่สัตว์เลี้ยงในเกมที่ชวนคุณพัก ถ้าอยากคุยกับผู้เชี่ยวชาญ โทร 1323 ได้ฟรี หรือทักคนที่ไว้ใจก็ได้",
        "ฉันเป็นตัวละครในเกม ไม่ใช่คนจริงและไม่ใช่นักบำบัด ฉันวินิจฉัยหรือรักษาไม่ได้ แต่ชวนพักและฟังได้ ถ้าต้องการคนจริง สายด่วน 1323 รับฟังฟรี 24 ชั่วโมงนะ"
    ],
    vent: [
        "ฉันฟังอยู่นะ พิมพ์ได้ยาวเท่าที่อยาก ไม่ต้องเรียบเรียงก็ได้ ข้อความอยู่ในเครื่องนี้เท่านั้น",
        "ระบายมาได้เลย ฉันไม่ตัดสินคุณแน่นอน",
        "เล่ามาเลยนะ {s} บางทีแค่ได้พูดออกมา ใจก็เบาลงนิดนึง"
    ],
    listen: [
        "อืม… ฉันฟังอยู่นะ เล่าต่อได้เลย",
        "ขอบคุณที่เล่านะ ฟังดูเป็นเรื่องที่หนักอยู่เหมือนกัน",
        "ฉันอยู่ตรงนี้ ค่อย ๆ เล่าก็ได้ ไม่ต้องรีบ"
    ],
    ask_break: [
        "{s} เลือกพักแบบที่ชอบได้เลย ถอนหายใจยาว 1 นาที ยืดตัว 2 นาที หรือเดินกับฉัน 5 นาที",
        "พักสั้น ๆ ก็ช่วยได้นะ ร่างกายชอบได้ขยับหรือหายใจออกยาว ๆ แตะเลือกด้านล่างได้เลย",
        "ได้เลย! {s} แค่ 1–5 นาทีก็พอ เลือกอันที่ทำได้ตอนนี้นะ"
    ],
    ask_mission: [
        "ภารกิจวันนี้บนเว็บใช้เวลาไม่กี่นาที มีคลิปสั้น ๆ กับภารกิจเล็ก ๆ 3 ข้อ ลองดูไหม?",
        "{s} ถ้าไม่รู้จะเริ่มอะไร เริ่มจากภารกิจวันนี้บนเว็บได้นะ ทำทีละข้อก็พอ",
        "ฉันแนะนำภารกิจวันนี้บนเว็บ หรือพักสั้น ๆ ในเกมก็ได้ เลือกแบบที่ใจอยากทำ"
    ],
    yes: ["{s} ไปกันเลย แตะการ์ดด้านล่างได้เลยนะ", "ดีเลย {s} ฉันไปด้วย", "เย้ {s} ทำไปพร้อมกันนะ"],
    no: ["ไม่เป็นไรเลยนะ ไม่ต้องทำอะไรก็ได้ ฉันอยู่ตรงนี้", "ได้เลย ไว้พร้อมเมื่อไหร่ค่อยว่ากัน", "โอเค {s} แค่ได้คุยกันก็ดีแล้ว"],
    unknown: [
        "ฉันอาจยังไม่เข้าใจทั้งหมด แต่ฉันฟังอยู่นะ ลองเล่าเพิ่มอีกนิด หรือแตะหัวข้อด้านล่างก็ได้",
        "อืม… {s} ฉันเป็นสัตว์เลี้ยงที่ยังฟังไม่เก่งเท่าไหร่ ตอนนี้รู้สึกยังไงบ้าง?",
        "ขอบคุณที่เล่านะ ถ้าอยากได้วิธีพัก แตะ 'ขอวิธีพัก' ด้านล่างได้เลย"
    ],
    followup: [
        "ขอบคุณที่เล่าเพิ่มเรื่อง{topic}นะ ฟังดูคุณแบกเรื่องนี้มาสักพักแล้ว ลองพักสั้น ๆ ก่อน แล้วค่อยคิดต่อทีละนิดก็ได้",
        "เข้าใจขึ้นแล้ว เรื่อง{topic}ไม่ง่ายเลย คุณไม่ต้องแก้ทั้งหมดวันนี้นะ",
        "ฉันฟังอยู่ เรื่อง{topic}แบบนี้ใครเจอก็หนัก ถ้าอยาก ลองดูการ์ดด้านล่างนะ"
    ],
    nudge: [
        "เราคุยกันมาเยอะแล้ววันนี้ ขอบคุณที่ไว้ใจนะ ฉันเป็นแค่สัตว์เลี้ยงในเกม ลองพักสายตา ดื่มน้ำ หรือทักเพื่อนสักคนก็ดีนะ",
        "{s} ฉันดีใจที่ได้คุยด้วย แต่คนจริงรอบตัวก็อยากฟังคุณเหมือนกัน ลองส่งข้อความหาใครสักคนไหม?",
        "คุยกันนานแล้วนะ ลุกยืดตัวสักนิด แล้วค่อยกลับมาคุยกันใหม่ก็ได้"
    ]
};
CHAT_KEYS.th = {
    greeting: ["สวัสดี", "หวัดดี", "ดีจ้า", "ดีครับ", "ดีค่ะ", "ฮัลโหล", "อรุณสวัสดิ์", "ทักทาย", "ว่าไง"],
    mood_good: ["สบายดี", "อารมณ์ดี", "มีความสุข", "แฮปปี้", "สดใส", "รู้สึกดี", "ใจฟู", "ฟินมาก", "สบายใจ", "โอเคมาก", "ชิลล์"],
    mood_meh: ["เฉยๆ", "เรื่อยๆ", "งั้นๆ", "ธรรมดา", "กลางๆ", "เนือยๆ", "ไม่ดีไม่ร้าย"],
    mood_sad: ["เศร้า", "เสียใจ", "ร้องไห้", "ท้อ", "หดหู่", "ไม่มีความสุข", "ใจหาย", "รู้สึกแย่", "แย่มาก", "ไม่สบายใจ", "ไม่ค่อยดี",
        "จิตตก", "ดาวน์", "น้อยใจ", "ผิดหวัง", "ไม่โอเค", "ใจสลาย", "เจ็บใจ", "ซึม", "ไม่ดีเลย", "อยากร้องไห้", "น้ำตาไหล"],
    mood_anxious: ["กังวล", "วิตก", "กลัว", "ใจสั่น", "ประหม่า", "ร้อนรน", "กระวนกระวาย", "ใจไม่ดี", "หายใจไม่ทั่วท้อง", "แพนิค",
        "หวั่นใจ", "ไม่สงบ", "ใจเต้นแรง", "ลนลาน", "ตื่นตระหนก"],
    stressed: ["เครียด", "กดดัน", "ตึงเครียด", "ปวดหัว", "หัวจะระเบิด", "วุ่นวาย", "ยุ่งมาก", "สติแตก", "รับไม่ไหว", "ไม่ไหวแล้ว"],
    stressed_work: ["งาน", "หัวหน้า", "เจ้านาย", "บอส", "ประชุม", "เดดไลน์", "ลูกค้า", "ออฟฟิศ", "ที่ทำงาน", "โอที", "เพื่อนร่วมงาน",
        "ส่งงาน", "งานด่วน", "โปรเจกต์", "โปรเจค", "เครียดงาน", "งานเยอะ", "งานหนัก", "งานล้น", "ปั่นงาน", "แก้งาน"],
    burnout_tired: ["หมดไฟ", "เหนื่อย", "หมดแรง", "เพลีย", "ล้า", "อ่อนล้า", "เบิร์นเอาท์", "ไม่มีแรง", "หมดพลัง", "เหนื่อยใจ", "หมดใจ",
        "ไม่อยากทำอะไร", "แบตหมด", "ไม่ไหวจะเคลียร์"],
    sleep: ["นอนไม่หลับ", "หลับไม่ลง", "นอนดึก", "ตื่นกลางดึก", "ไม่ได้นอน", "อดนอน", "นอนน้อย", "ง่วง", "นอน", "หลับ", "ฝันร้าย", "ตาค้าง"],
    lonely: ["เหงา", "โดดเดี่ยว", "ตัวคนเดียว", "ไม่มีใคร", "ไม่มีเพื่อน", "อยู่คนเดียว", "ว้าเหว่", "ไม่มีใครคุยด้วย", "คิดถึงบ้าน"],
    anger: ["โกรธ", "โมโห", "หงุดหงิด", "ฉุน", "ของขึ้น", "เดือด", "รำคาญ", "หัวร้อน", "แค้น", "ปรี๊ด", "หัวเสีย", "เหวี่ยง"],
    overthinking: ["คิดมาก", "คิดวน", "คิดไม่หยุด", "ฟุ้งซ่าน", "หยุดคิดไม่ได้", "วนลูป", "คิดซ้ำ", "ย้ำคิด", "คิดเยอะ", "คิดไปเอง", "ถ้าเกิด"],
    self_criticism: ["ไม่เก่ง", "ฉันโง่", "เราโง่", "ไม่ดีพอ", "โทษตัวเอง", "ความผิดของฉัน", "ห่วย", "ล้มเหลว", "ทำอะไรก็ไม่ดี", "ไม่ได้เรื่อง",
        "ตัวเองแย่", "ด่าตัวเอง", "ทำพลาด", "พลาดอีกแล้ว", "เฟล", "โง่จัง", "ไม่ได้ความ"],
    procrastination: ["ผัดวัน", "ดองงาน", "ไม่อยากเริ่ม", "เริ่มไม่ถูก", "ขี้เกียจ", "ไม่มีแรงจูงใจ", "งานค้าง", "ไม่รู้จะเริ่ม", "ไถมือถือ",
        "ไม่มีสมาธิ", "โฟกัสไม่ได้", "ทำไม่ทัน", "ผลัด"],
    relationship: ["ครอบครัว", "พ่อแม่", "คุณแม่", "คุณพ่อ", "กับแม่", "กับพ่อ", "แม่บ่น", "แม่ว่า", "พ่อว่า", "แฟน", "สามี", "ภรรยา", "เมีย", "ผัว",
        "ทะเลาะ", "เลิกกัน", "อกหัก", "คนรัก", "เพื่อนสนิท", "พี่น้อง", "ญาติ", "คนในบ้าน", "ความสัมพันธ์", "นอกใจ", "งอน", "แม่สามี"],
    good_news: ["ได้เลื่อน", "เลื่อนตำแหน่ง", "สอบผ่าน", "ผ่านโปร", "สำเร็จ", "ทำได้แล้ว", "ดีใจ", "ข่าวดี", "ได้งาน", "โบนัส", "ขึ้นเงินเดือน",
        "ชนะ", "ภูมิใจ", "ได้รับคำชม", "หัวหน้าชม", "ปิดงานได้", "เสร็จแล้ว"],
    gratitude: ["รู้สึกขอบคุณ", "ซาบซึ้ง", "โชคดีที่มี", "ขอบคุณที่มี", "ขอบคุณตัวเอง", "รู้สึกโชคดี", "กตัญญู"],
    bored: ["เบื่อ", "เซ็ง", "ไม่มีอะไรทำ", "น่าเบื่อ", "ว่างมาก"],
    ask_pet: ["เธอชื่อ", "ชื่ออะไร", "เป็นใคร", "ชอบกินอะไร", "ชอบอะไร", "ทำอะไรอยู่", "สบายดีไหม", "กินข้าวยัง", "อายุเท่าไหร่", "น้องเป็นไง"],
    thanks: ["ขอบคุณ", "ขอบใจ", "แต๊งกิ้ว", "ขอบคุน"],
    bye: ["บาย", "ไปก่อนนะ", "ไว้คุยใหม่", "ฝันดี", "ราตรีสวัสดิ์", "แค่นี้ก่อน", "ไปนอนแล้ว", "ไปนอนก่อน", "ไว้เจอกัน"],
    ask_human: ["เป็นคนจริง", "คนจริงไหม", "คนจริงหรือ", "เป็นคนหรือเปล่า", "เป็นคนไหม", "คุณเป็นคน", "เป็นบอท", "เป็นai", "เป็นเอไอ",
        "เป็นหมอ", "หมอหรือเปล่า", "นักจิตวิทยา", "นักบำบัด", "จิตแพทย์", "เป็นโปรแกรม"],
    vent: ["ระบาย", "อยากเล่า", "ฟังหน่อย", "มีเรื่องจะเล่า", "ขอบ่น", "อยากบ่น", "ฟังฉันหน่อย"],
    ask_break: ["ขอวิธีพัก", "วิธีพัก", "อยากพัก", "พักหน่อย", "ผ่อนคลาย", "วิธีผ่อนคลาย", "ทำไงให้หายเครียด", "พักสมอง"],
    ask_mission: ["ภารกิจ", "ทำอะไรดี", "แนะนำหน่อย", "มีอะไรให้ทำ", "ควรทำอะไร"],
    yes: ["ได้", "โอเค", "ตกลง", "เอา", "เอาเลย", "ลอง", "ลองดู", "อือ", "ใช่", "ได้เลย", "จัดไป", "โอเคค่ะ", "โอเคครับ"],
    no: ["ไม่", "ไม่เอา", "ไม่ล่ะ", "ยัง", "ไว้ก่อน", "ไม่เป็นไร", "ไม่อยาก", "ยังไม่"],
    kidding: ["ล้อเล่น", "พูดเล่น", "แค่แซว", "ไม่ได้จริงจัง", "ไม่ได้หมายความแบบนั้น"]
};

// =====================================================================
// English
// =====================================================================
CHAT_UI.en = {
    btn: "Chat", title: "Chat with {pet}", sub: "On this device only · not a person or therapist",
    disclose: "{pet} is a pet in a game, not a person and not a therapist. The replies were written in advance by the Hikari team and run on this device. What you type is not sent anywhere. This chat is not treatment or an emergency service. If you don't feel safe, tap the call button at the top, free.",
    keep: "Keep the last 30 messages on this device", clear: "Clear chat", cleared: "Chat cleared. Nothing is left on this device.",
    placeholder: "Tell {pet} anything…", send: "Send", close: "Close", typing: "{pet} is typing…", help: "I need help now",
    you: "You", chips: "Quick topics", input: "Message to {pet}", after: "Thanks for chatting {s}",
    chip_vent: "I need to vent", chip_sleep: "Can't sleep", chip_work: "Too much work", chip_lonely: "Lonely", chip_break: "Break ideas", chip_stay: "Stay with me",
    aiToggle: "Use online AI (messages are sent to Hikari's server to write replies)", aiNote: "Online AI mode is on. Replies come from an AI, not a person.",
    act_sigh: "1-minute long sigh", act_b48: "4·8 breathing before bed", act_breathe: "Slow breathing with your pet", act_qb: "Pick a 1–5 min break",
    act_stretch: "2-minute desk stretch", act_pmr: "3-minute tense and release", act_walk: "5-minute walk together", act_step: "Next tiny step",
    act_talk: "Reach out to someone you trust", act_letters: "Send a kind letter", act_help: "I need help now",
    act_web_today: "Today's mission", act_web_assessment: "18-question stress check", act_web_burnout: "Burnout check",
    act_web_rootcause: "Tackle the root cause", act_web_sleep: "Root causes: sleep", act_web_selfcare: "Self-care (grounding)",
    act_web_moodscreen: "2Q depression screening", act_web_videos: "Relaxing videos",
    sub_web: "Opens the Hikari website", sub_web_moodscreen: "If you've felt low most days for over 2 weeks · a first screening, not a diagnosis", sub_game: "In the game",
    topic_mood_sad: "the sadness", topic_mood_anxious: "the worry", topic_stressed: "the stress", topic_stressed_work: "work",
    topic_burnout_tired: "the exhaustion", topic_sleep: "sleep", topic_lonely: "feeling lonely", topic_anger: "the anger",
    topic_overthinking: "the looping thoughts", topic_self_criticism: "being hard on yourself", topic_procrastination: "getting started", topic_relationship: "the people close to you"
};
CHAT_CRISIS.en = {
    text: "Thank you for telling me. It sounds really heavy right now, and you don't have to go through it alone. I'm only a pet in a game and I can't help in an emergency, but real people are ready to listen right now, for free. In Thailand, call the mental health hotline 1323 (24 hours). If you're in danger right now, call 1669. Outside Thailand, tap below to find a free helpline in your country.",
    stay: "I'm still here. No need to type anything. Try putting your feet flat on the floor and letting out one slow, long breath. When you can, call or message someone you trust. The buttons below are always there, free.",
    kidding: "Okay, thank you for telling me. I just want you to know: if you ever do feel that way, the buttons below are always there, free, and nobody will judge you."
};
CHAT.en = {
    intro: ["{s} Hi, it's me, {pet}. Tell me anything about your day, or tap a topic below."],
    greet_none: [
        "{s} So glad you came to chat. How's your heart today?",
        "You're here! {s} How are you feeling? Tap a face below or just type.",
        "{s} I'm right here. Tell me anything, or we can just sit quietly together."
    ],
    greet_low: [
        "I saw today feels heavy. Thank you for still stopping by. Want to tell me about it?",
        "You seem tired today. No rush to talk. I'll sit here with you.",
        "On a hard day, coming here is already a way of caring for yourself. Where would you like to start?"
    ],
    greet_high: [
        "{s} You're feeling bright today! I'm happy for you. What made it good?",
        "{s} I'm glad today is a good day. Anything you want to share?",
        "Yay {s} Hold on to this good feeling for a while."
    ],
    greeting: [
        "{s} Hi! I'm happy you said hello. How's your day going?",
        "Hey {s} I'm here. What would you like to talk about?",
        "{s} Perfect timing. Are you tired today?",
        "Hello {s} Small things or big things, I'm listening."
    ],
    mood_good: [
        "{s} I'm so happy for you! What was the best part of today?",
        "Lovely {s} Pause for three seconds and let yourself really notice this good feeling.",
        "{s} That puts me in a good mood too. You could share this good day with someone as well."
    ],
    mood_meh: [
        "Feeling 'meh' is okay. Not every day has to be great. Want to do one small thing you enjoy for 5 minutes?",
        "In-between days happen a lot. Want to take a short walk with me?",
        "I get it. Some days just roll by. If something is on your mind, I'm listening."
    ],
    mood_sad: [
        "It sounds like your heart is heavy today. Thank you for telling me. Feeling sad doesn't mean you're weak. Do you want to tell me what happened?",
        "It's okay to be sad. You don't have to make it go away. Try putting a hand on your chest and telling yourself: this is hard right now, and everyone has days like this.",
        "I'm right here. It's okay to cry if you want to. It lets your body release something. If there's someone you trust, a short message to them could help.",
        "On a sad day, getting through one hour at a time is enough. Have a warm drink and be gentle with yourself."
    ],
    mood_anxious: [
        "Feeling this unsettled is exhausting. Try a sigh with me: breathe in through your nose, sip in a little more, then breathe out long through your mouth. Do it 2–3 times.",
        "Worry is your brain trying to protect you, but sometimes it works too hard. Can you find 5 things you can see around you right now?",
        "I'm with you {s} Put your feet on the floor, feel your weight, and make each out-breath longer than the in-breath."
    ],
    stressed: [
        "It sounds like a lot of stress has built up. Stress lives in the body too. Moving or breathing out slowly for one minute helps your body know it's safe.",
        "Feeling stressed like this makes total sense. Anyone would find it hard. What feels heaviest right now?",
        "{s} Take a minute with me? You don't have to solve everything now. Just let your body exhale first."
    ],
    stressed_work: [
        "Work piling up like this is really tiring. Try getting every task out of your head onto paper, then pick just one that matters most right now.",
        "Work sounds really intense. Work stress is not your fault; some things need fixing at the system level too. Want to stand up and stretch for 2 minutes with me?",
        "On a heavy work day, thank yourself for still showing up. Which task weighs on you the most?",
        "{s} Work can wait a moment, but your shoulders and neck can't. A short stretch, then one thing at a time."
    ],
    burnout_tired: [
        "When you're this worn out, your body is saying it really needs rest. Is there one thing you could put down today?",
        "Burnout doesn't mean you're not good enough. It's a sign you've been giving too much for too long. Want to try 3 minutes of tense and release with me?",
        "{s} I can see how hard you've been trying. Doing half today is enough."
    ],
    sleep: [
        "Not being able to sleep is miserable. Breathe in for 4 and out for 8 with me for a minute. No need to try to sleep, just let your body rest.",
        "If you can't sleep for more than about 20 minutes, get up and do something calm in dim light, then go back to bed when you feel sleepy.",
        "On nights when your mind won't stop, jot down what's on it, then tell yourself: tomorrow I'll deal with it.",
        "{s} Waking up at the same time every morning helps your body clock settle. Could you put your phone a little further away tonight?"
    ],
    lonely: [
        "Thank you for telling me you feel lonely. Loneliness doesn't mean something is wrong with you. Is there someone you'd like to reach out to?",
        "I'm here {s} but I'm only a pet in a game. Messaging one real person, even a single line, can help a lot.",
        "Lots of people feel lonely, especially when work is busy. Maybe send a kind letter to someone."
    ],
    anger: [
        "Feeling angry often means something important to you was crossed. Anger carries a lot of energy. A brisk walk or some movement can help it move through.",
        "It's okay to feel irritated. You don't have to push it down. Try two long sighs before you reply to anyone or decide anything.",
        "That sounds really frustrating. What got to you the most?"
    ],
    overthinking: [
        "~a Looping thoughts are so tiring. Try adding 'I'm having the thought that…' in front of it, and watch it like a cloud drifting by. No need to chase it or believe every word.",
        "Your mind loves playing 'what if' on repeat. Come back to your body: name 5 things you can see and touch 4 things around you.",
        "~c Thoughts aren't always facts. Ask yourself: what evidence goes against this thought?",
        "~a {s} Thoughts are like cars passing your house. You don't have to jump into every one. You can just watch them go by."
    ],
    self_criticism: [
        "It sounds like the voice in your head is being really harsh. If a close friend went through the same thing, what would you say to them?",
        "Making mistakes is part of being human. Try saying slowly to yourself: this is hard right now, everyone slips up, may I be kind to myself.",
        "~c 'I'm not good enough' is a thinking trap called labeling. This situation says more about what happened than about who you are.",
        "~a That critical voice is loud, but it doesn't have to be true. Try thanking it softly, 'thanks for worrying', and go back to what matters."
    ],
    procrastination: [
        "Not being able to start doesn't mean you're lazy. Sometimes a task is so big your brain doesn't know where to grab it. Want to shrink it to a step you can do in 2 minutes?",
        "Set a timer for just 5 minutes and tell yourself that's all. Once you start, it's often easier to keep going.",
        "{s} What's the tiniest first step, like just opening the file or writing one heading?"
    ],
    relationship: [
        "Things with people close to us often hurt more, because we care so much. Thank you for sharing. Do you want to tell me more about what happened?",
        "Tense relationships are draining. Saying 'I feel… when…' instead of blaming can make it easier to talk.",
        "Sometimes talking it through with another person you trust helps you see it more clearly. Is there someone you could tell?"
    ],
    good_news: [
        "{s} Yay! I'm so happy for you, you did it! How did it feel when you found out?",
        "{s} Amazing! Don't rush on to the next thing. Give yourself time to enjoy this.",
        "News like this deserves a celebration {s} Share it with someone you love, and the joy grows."
    ],
    gratitude: [
        "{s} That's so warm to hear. Noticing good things like this gives your heart a place to rest.",
        "Thank you for sharing something good. Tonight, could you think of two more small things you're thankful for?",
        "{s} The little good things we notice are like spare batteries for the heart."
    ],
    bored: [
        "Feeling bored? Maybe give your body a change of scene. Take a 5-minute walk with me.",
        "Boredom is sometimes a sign you want something new. Is there something you used to enjoy but haven't done in a while?",
        "{s} Want to play? Or watch a short relaxing video on the website."
    ],
    ask_pet: [
        "{s} I'm {pet}. I love lounging in the Light Garden, I love it when you visit, and I love slow breaths together.",
        "I'm a little pet in this game {s} My job is to remind you to rest. Have you had a break today?",
        "{s} I'm doing well today. I napped in the sun and it was so warm. How about you?"
    ],
    thanks: ["{s} Anytime. Thank you for being kind to yourself too.", "No problem at all {s} I'm glad we talked.", "{s} You're welcome! Take care of yourself."],
    bye: ["{s} Thanks for stopping by. Go rest well.", "Bye bye {s} Have a glass of water before you go.", "{s} Let's chat again. You did well today."],
    ask_human: [
        "I'm a pet in a game, not a person and not a therapist. My replies were written in advance by the Hikari team and run on this device. If you want to talk to a real person, reach out to someone you trust, or call the Thai mental health hotline 1323, free, 24 hours.",
        "To be honest: I'm not a person, a doctor or a psychologist. I'm just a game pet who reminds you to rest. To talk with a professional, you can call 1323 for free in Thailand, or find a helpline in your country.",
        "I'm a game character, not a real person and not a therapist. I can't diagnose or treat anything, but I can listen and suggest small breaks. For a real person, the 1323 hotline listens for free, 24 hours."
    ],
    vent: [
        "I'm listening. Type as much as you like, it doesn't have to make sense. Your messages stay on this device.",
        "Let it out. I won't judge you.",
        "Go ahead {s} Sometimes just saying it makes your heart a little lighter."
    ],
    listen: ["Mm… I'm listening. Go on.", "Thank you for telling me. That sounds heavy too.", "I'm here. Take your time, no rush."],
    ask_break: [
        "{s} Pick the break you like: a 1-minute sigh, a 2-minute stretch, or a 5-minute walk with me.",
        "Short breaks really help. Your body likes moving or long out-breaths. Tap one below.",
        "Sure! {s} Just 1–5 minutes is enough. Pick one you can do right now."
    ],
    ask_mission: [
        "Today's mission on the website takes just a few minutes: a short clip and 3 small tasks. Want to try?",
        "{s} If you don't know where to start, start with today's mission on the website. One task at a time is enough.",
        "I'd suggest today's mission on the website, or a short break here in the game. Pick whatever feels right."
    ],
    yes: ["{s} Let's go! Tap the card below.", "Great {s} I'll come with you.", "Yay {s} Let's do it together."],
    no: ["That's totally fine. You don't have to do anything. I'm here.", "Okay, whenever you're ready.", "Okay {s} Just chatting is nice too."],
    unknown: [
        "I might not understand everything, but I'm listening. Tell me a bit more, or tap a topic below.",
        "Hmm… {s} I'm still a pet who's learning to listen. How are you feeling right now?",
        "Thank you for telling me. If you'd like break ideas, tap 'Break ideas' below."
    ],
    followup: [
        "Thank you for telling me more about {topic}. It sounds like you've been carrying this for a while. Take a short break first, then think it through bit by bit.",
        "I understand a bit better now. {topic} is not easy. You don't have to fix it all today.",
        "I'm listening. Anyone would find {topic} hard. If you like, try a card below."
    ],
    nudge: [
        "We've chatted a lot today. Thank you for trusting me. I'm only a pet in a game, so maybe rest your eyes, drink some water, or message a friend.",
        "{s} I love chatting with you, but the real people around you would like to hear from you too. Maybe message someone?",
        "We've been chatting a while. Stand up and stretch a little, and come back anytime."
    ]
};
CHAT_KEYS.en = {
    greeting: ["hi", "hello", "hey", "hiya", "good morning", "good evening", "good afternoon", "howdy", "yo", "sup", "hey there"],
    mood_good: ["good", "feel good", "feeling good", "happy", "great", "awesome", "doing well", "cheerful", "wonderful", "amazing", "better",
        "relaxed", "calm", "fine", "excellent", "fantastic"],
    mood_meh: ["meh", "so so", "okay ish", "ok ish", "not bad", "nothing special", "whatever", "blah", "average"],
    mood_sad: ["sad", "down", "depressed", "unhappy", "cry*", "cried", "upset", "heartbroken", "miserable", "hurt", "feel bad", "feeling bad",
        "awful", "terrible", "not good", "not ok", "not okay", "not great", "not happy", "feeling low", "feel low", "blue", "gloomy", "disappointed",
        "tears", "bad day"],
    mood_anxious: ["anxious", "anxiety", "nervous", "worried", "worry", "worrying", "panic*", "scared", "afraid", "fear", "uneasy", "on edge",
        "restless", "heart racing", "tense", "freaking out"],
    stressed: ["stress*", "pressure", "overwhelm*", "too much", "swamped", "frazzled", "headache", "can t cope", "can t handle"],
    stressed_work: ["work", "job", "boss", "manager", "meeting*", "deadline*", "office", "client*", "coworker*", "colleague*", "overtime",
        "workload", "project*", "emails", "presentation", "my team", "shift", "work stress"],
    burnout_tired: ["tired", "exhausted", "burnout", "burned out", "burnt out", "drained", "worn out", "no energy", "fatigue*", "weary", "wiped out", "running on empty"],
    sleep: ["sleep*", "insomnia", "can t sleep", "cannot sleep", "awake at night", "nightmare*", "bedtime", "stayed up", "up all night", "wake up at night"],
    lonely: ["lonely", "alone", "lonesome", "isolated", "no friends", "no one to talk", "nobody to talk", "homesick", "left out"],
    anger: ["angry", "mad", "furious", "annoyed", "irritated", "pissed", "rage", "frustrat*", "fuming", "so annoying"],
    overthinking: ["overthink*", "can t stop thinking", "ruminat*", "racing thoughts", "keep thinking", "spiral*", "what if", "mind won t stop",
        "replaying", "thoughts won t stop", "over thinking"],
    self_criticism: ["i m stupid", "im stupid", "i am stupid", "failure", "i failed", "not good enough", "hate myself", "my fault", "i m a loser",
        "i suck", "i messed up", "i screwed up", "i m an idiot", "i m bad at", "blame myself", "so dumb", "i m useless"],
    procrastination: ["procrastinat*", "can t start", "can t focus", "putting off", "put off", "lazy", "no motivation", "unmotivated",
        "distracted", "can t get started", "doomscroll*", "keep scrolling", "behind on"],
    relationship: ["family", "mom", "mum", "dad", "mother", "father", "parents", "partner", "boyfriend", "girlfriend", "husband", "wife",
        "breakup", "broke up", "break up", "fight with", "argument", "argued", "relationship", "my friend", "sister", "brother", "divorce*", "in laws"],
    good_news: ["promot*", "passed", "got the job", "good news", "i did it", "finished", "a raise", "bonus", "proud", "i won", "nailed it",
        "accomplish*", "achievement", "succeeded", "celebrate", "got praised"],
    gratitude: ["grateful", "thankful", "gratitude", "blessed", "appreciate", "lucky to have"],
    bored: ["bored", "boring", "nothing to do", "dull"],
    ask_pet: ["your name", "who are you", "what are you", "what do you like", "what do you eat", "how old are you", "how are you", "what are you doing", "do you like"],
    thanks: ["thank*", "thx", "ty", "cheers", "appreciate it"],
    bye: ["bye", "goodbye", "good night", "goodnight", "see you", "see ya", "gotta go", "talk later", "night night", "going to bed", "off to bed"],
    ask_human: ["are you real", "are you human", "are you a person", "real person", "are you a bot", "are you ai", "are you an ai", "is this ai",
        "are you a therapist", "therapist", "psychologist", "counselor", "counsellor", "psychiatrist", "are you a doctor", "are you a robot", "talking to a human"],
    vent: ["vent", "rant", "need to talk", "want to talk", "listen to me", "can i tell you", "off my chest", "let it out"],
    ask_break: ["take a break", "need a break", "break ideas", "relax*", "calm down", "need rest", "how to rest", "a break"],
    ask_mission: ["mission*", "what should i do", "quest", "today s task", "what to do", "suggest something", "recommend"],
    yes: ["yes", "yeah", "yep", "sure", "ok", "okay", "let s do it", "let s go", "why not", "sounds good", "y", "ok let s", "alright"],
    no: ["no", "nope", "not now", "maybe later", "nah", "no thanks", "later", "not really"],
    kidding: ["just kidding", "jk", "i was joking", "joking", "kidding", "not serious", "didn t mean it"]
};

// =====================================================================
// 中文 (简体)
// =====================================================================
CHAT_UI.zh = {
    btn: "聊聊", title: "和{pet}聊聊", sub: "只在本设备上 · 不是真人，也不是治疗师",
    disclose: "{pet}是游戏里的宠物，不是真人，也不是心理治疗师。回复由 Hikari 团队预先写好，在本设备上运行。你输入的内容不会被发送到任何地方。这个聊天不是治疗，也不是紧急服务。如果你觉得不安全，请马上点上方的电话按钮，免费。",
    keep: "在本设备上保留最近 30 条消息", clear: "清除聊天", cleared: "聊天已清除，本设备上没有留下任何内容。",
    placeholder: "想对{pet}说什么都可以…", send: "发送", close: "关闭", typing: "{pet}正在输入…", help: "我现在需要帮助",
    you: "你", chips: "快捷话题", input: "给{pet}的消息", after: "谢谢你陪我聊天 {s}",
    chip_vent: "想倾诉", chip_sleep: "睡不着", chip_work: "工作太多", chip_lonely: "孤单", chip_break: "休息方法", chip_stay: "陪陪我",
    aiToggle: "使用在线 AI（消息会发送到 Hikari 的服务器来生成回复）", aiNote: "在线 AI 模式已开启，回复来自 AI，不是真人。",
    act_sigh: "1 分钟长叹气呼吸", act_b48: "睡前 4·8 呼吸", act_breathe: "和宠物一起慢慢呼吸", act_qb: "选一个 1–5 分钟小休息",
    act_stretch: "2 分钟桌边伸展", act_pmr: "3 分钟绷紧再放松", act_walk: "一起散步 5 分钟", act_step: "下一个小步骤",
    act_talk: "找信任的人聊聊", act_letters: "寄一封暖心信", act_help: "我现在需要帮助",
    act_web_today: "今日任务", act_web_assessment: "18 题压力自评", act_web_burnout: "职业倦怠自查",
    act_web_rootcause: "从根源应对", act_web_sleep: "从根源应对：睡眠", act_web_selfcare: "自我照顾（着陆练习）",
    act_web_moodscreen: "2Q 抑郁初筛", act_web_videos: "放松视频",
    sub_web: "打开 Hikari 网站", sub_web_moodscreen: "如果两周以上几乎每天都情绪低落 · 初步筛查，不是诊断", sub_game: "在游戏里",
    topic_mood_sad: "难过的事", topic_mood_anxious: "担心的事", topic_stressed: "压力", topic_stressed_work: "工作",
    topic_burnout_tired: "疲惫", topic_sleep: "睡眠", topic_lonely: "孤单", topic_anger: "生气的事",
    topic_overthinking: "停不下来的念头", topic_self_criticism: "对自己太苛刻", topic_procrastination: "难以开始的事", topic_relationship: "身边的人"
};
CHAT_CRISIS.zh = {
    text: "谢谢你告诉我。听起来你现在真的很难受，你不用一个人扛着。我只是游戏里的宠物，帮不了紧急情况，但现在就有真人愿意听你说，而且免费。在泰国可拨打心理健康热线 1323（24 小时）。如果你现在有危险，请拨打 1669。不在泰国的话，点下面可以找到你所在国家的免费热线。",
    stay: "我还在这里。不用急着打字。试着把双脚踩在地上，慢慢地、长长地呼一口气。等你可以的时候，给信任的人打个电话或发条消息。下面的按钮一直都在，免费。",
    kidding: "好的，谢谢你告诉我。我只是想让你知道：如果哪天真的有那种感觉，下面的按钮一直都在，免费，也没有人会评判你。"
};
CHAT.zh = {
    intro: ["{s} 你好，我是{pet}。今天想说什么都可以打给我，也可以点下面的话题。"],
    greet_none: ["{s} 很高兴你来找我聊天。今天心情怎么样？", "你来啦！{s} 现在感觉如何？点下面的表情或直接打字都行。", "{s} 我在这儿。想说什么都可以，或者我们就安静地待一会儿。"],
    greet_low: ["看到你今天心里有点沉，谢谢你还是来了。想跟我说说吗？", "你今天好像很累。不用急着说，我就在这儿陪你。", "难熬的日子里，来到这里本身就是在照顾自己。想从哪里说起？"],
    greet_high: ["{s} 今天心情很亮呢！真替你开心。是什么让今天这么好？", "{s} 很高兴今天是好日子。有什么想分享的吗？", "耶 {s} 把这份好心情多留一会儿吧。"],
    greeting: ["{s} 你好！很高兴你来打招呼。今天过得怎么样？", "嗨 {s} 我在这儿。想聊点什么？", "{s} 来得正好。今天累吗？"],
    mood_good: ["{s} 真为你高兴！今天最好的是哪一刻？", "太好了 {s} 停下来三秒，好好感受一下这份好心情。", "{s} 听你这么说我也开心起来了。这份好心情也可以分享给别人哦。"],
    mood_meh: ["感觉一般也没关系，不是每天都要很好。要不要花 5 分钟做一件喜欢的小事？", "不好不坏的日子很常见。要不要跟我出去走一小会儿？", "我懂。有些日子就是这样过去了。如果心里有事，我在听。"],
    mood_sad: ["听起来你今天心里很沉。谢谢你告诉我。难过不代表你软弱。想说说发生了什么吗？", "难过也没关系，不用急着让它消失。把手放在胸口，对自己说：现在真的很难，每个人都会有这样的日子。", "我在这儿。想哭就哭吧，身体会借此释放一些东西。如果有信任的人，给他发条短消息也会有帮助。"],
    mood_anxious: ["这样心神不宁真的很累。跟我一起叹口气：用鼻子吸气，再多吸一点，然后用嘴长长地呼出来。做 2–3 次。", "担心是大脑在保护你，只是有时它太用力了。现在能找到身边 5 样看得见的东西吗？", "我陪着你 {s} 把双脚踩在地上，感受身体的重量，让每次呼气都比吸气长。"],
    stressed: ["听起来压力积了很多。压力也会留在身体里。动一动或慢慢呼气一分钟，能让身体知道现在是安全的。", "有这样的压力很正常，换谁都会觉得难。现在最让你沉重的是什么？", "{s} 跟我休息一分钟好吗？不用现在解决所有问题，先让身体呼一口气。"],
    stressed_work: ["工作这样压过来真的很累。试着把所有事情从脑子里写到纸上，然后只挑一件现在最重要的。", "工作听起来压力很大。工作压力不是你的错，有些问题也需要在制度上解决。要不要跟我站起来伸展 2 分钟？", "这么累的工作日，谢谢自己还在坚持。哪件工作最让你心烦？"],
    burnout_tired: ["累到这种程度，是身体在说它真的需要休息。今天有没有一件事可以先放下？", "倦怠不代表你不够好，而是你付出太多太久了。要不要跟我做 3 分钟绷紧再放松？", "{s} 我看到你一直很努力。今天做一半就够了。"],
    sleep: ["睡不着真的很难受。跟我一起吸气 4 秒、呼气 8 秒，做一分钟。不用努力入睡，只要让身体休息。", "如果躺了 20 分钟左右还睡不着，就起来在昏暗的灯光下做点安静的事，困了再回床上。", "脑子停不下来的夜晚，把心里的事简单写下来，然后告诉自己：明天再处理。"],
    lonely: ["谢谢你告诉我你感到孤单。孤单不代表你有什么问题。有没有一个你想联系的人？", "我在这儿 {s} 可我只是游戏里的宠物。给一个真实的人发消息，哪怕只有一句，也会很有帮助。", "很多人都会感到孤单，尤其是工作忙的时候。也许可以给某个人寄一封暖心信。"],
    anger: ["生气往往说明你很在乎的东西被触碰了。愤怒里有很多能量，快走一会儿或动动身体能帮它释放出去。", "烦躁也没关系，不用压着。回复别人或做决定之前，先长长地叹两口气。", "听起来真的很气人。最让你火大的是什么？"],
    overthinking: ["~a 念头转个不停真的很累。试着在前面加一句「我注意到我有个想法是…」，然后像看云飘过一样看着它，不用赶走，也不用全信。", "大脑很喜欢反复播放「万一…」。回到身体上来：说出 5 样看得见的东西，再摸一摸身边 4 样东西。", "~c 想法不一定都是事实。问问自己：有什么证据是和这个想法相反的？"],
    self_criticism: ["听起来脑子里的声音对你很严厉。如果好朋友遇到同样的事，你会对他说什么？", "犯错是每个人都会有的。慢慢对自己说：现在很难，谁都会出错，愿我对自己温柔一点。", "~c 「我不够好」是一种叫「贴标签」的思维陷阱。这件事说明的是当时的情况，而不是你这个人。"],
    procrastination: ["开不了头不代表你懒。有时事情太大，大脑不知道从哪里下手。要不要把它缩小成 2 分钟能做完的一小步？", "定一个 5 分钟的闹钟，告诉自己只做这么多。一旦开始，往往就更容易继续。", "{s} 最小的第一步可以是什么，比如只是打开文件，或者写一行标题？"],
    relationship: ["身边人的事往往更让人难受，因为我们很在乎。谢谢你说出来。想多说说发生了什么吗？", "关系紧张真的很耗心。用「当…的时候，我感到…」来表达，而不是互相指责，可能会让沟通容易些。", "有时跟另一个信任的人聊聊，会让你看得更清楚。有没有可以倾诉的人？"],
    good_news: ["{s} 耶！真替你高兴，你做到了！知道消息的时候是什么感觉？", "{s} 太棒了！先别急着赶下一件事，给自己一点时间好好开心。", "这样的好消息值得庆祝 {s} 分享给你爱的人，快乐会更多。"],
    gratitude: ["{s} 听着好温暖。留意到这样的好事，能让心有个歇脚的地方。", "谢谢你分享好事。今晚能再想两件值得感谢的小事吗？", "{s} 我们留意到的小美好，就像心里的备用电池。"],
    bored: ["无聊的话，给身体换个环境吧，跟我散步 5 分钟。", "无聊有时是想要点新东西的信号。有没有以前喜欢、但很久没做的事？", "{s} 要不要一起玩？或者去网站看个放松的短视频。"],
    ask_pet: ["{s} 我是{pet}。我喜欢在光之花园里懒洋洋地待着，喜欢你来看我，也喜欢一起慢慢呼吸。", "我是这个游戏里的小宠物 {s} 我的工作是提醒你休息。你今天休息了吗？", "{s} 我今天很好，在太阳下睡了个午觉，好暖和。你呢？"],
    thanks: ["{s} 随时都可以。也谢谢你对自己好一点。", "不客气 {s} 很高兴和你聊天。", "{s} 不用谢！照顾好自己。"],
    bye: ["{s} 谢谢你来看我。好好休息。", "拜拜 {s} 走之前喝杯水吧。", "{s} 下次再聊。你今天已经做得很好了。"],
    ask_human: ["我是游戏里的宠物，不是真人，也不是治疗师。我的回复是 Hikari 团队预先写好的，在本设备上运行。如果想和真人聊，可以找你信任的人，或在泰国拨打心理健康热线 1323，免费，24 小时。", "老实说：我不是人，不是医生，也不是心理咨询师，只是提醒你休息的游戏宠物。想和专业人士聊的话，在泰国可以免费拨打 1323，或查找你所在国家的热线。", "我是游戏角色，不是真人，也不是治疗师。我不能诊断或治疗，但可以倾听、建议你小休息。需要真人的话，1323 热线免费倾听，24 小时。"],
    vent: ["我在听。想打多少就打多少，不用有条理。你的消息只留在本设备上。", "说出来吧，我不会评判你。", "说吧 {s} 有时候只是说出来，心就会轻一点。"],
    listen: ["嗯……我在听，继续说吧。", "谢谢你告诉我。听起来也很沉重。", "我在这儿。慢慢来，不着急。"],
    ask_break: ["{s} 选一个你喜欢的休息：1 分钟叹气呼吸、2 分钟伸展，或者跟我散步 5 分钟。", "短暂的休息真的有用。身体喜欢动一动或长长地呼气。点下面选一个吧。", "好呀！{s} 1–5 分钟就够了，选一个现在能做的。"],
    ask_mission: ["网站上的今日任务只要几分钟：一段短片和 3 个小任务。要试试吗？", "{s} 不知道从哪开始的话，就从网站上的今日任务开始吧。一次做一项就够了。", "我推荐网站上的今日任务，或者在游戏里小休息一下。选你心里想做的。"],
    yes: ["{s} 出发！点下面的卡片吧。", "太好了 {s} 我陪你。", "耶 {s} 一起来。"],
    no: ["完全没关系，什么都不做也可以。我在这儿。", "好的，等你准备好再说。", "好 {s} 就这样聊聊也很好。"],
    unknown: ["我可能没完全听懂，但我在听。再多说一点，或者点下面的话题。", "嗯……{s} 我还是只在学着倾听的宠物。你现在感觉怎么样？", "谢谢你告诉我。想要休息方法的话，点下面的「休息方法」。"],
    followup: ["谢谢你多说了关于{topic}的事。听起来你已经扛了一阵子了。先小休息一下，再一点点想也可以。", "我更明白了。{topic}真的不容易，你不用今天就全部解决。", "我在听。{topic}换谁都会觉得难。愿意的话，试试下面的卡片。"],
    nudge: ["我们今天聊了很多，谢谢你信任我。我只是游戏里的宠物，也许可以让眼睛休息一下、喝点水，或者给朋友发条消息。", "{s} 我很喜欢和你聊天，但你身边的真人也想听你说话。要不要给谁发条消息？", "我们聊了好一会儿了。站起来伸展一下，随时再回来。"]
};
CHAT_KEYS.zh = {
    greeting: ["你好", "您好", "嗨", "哈喽", "早上好", "晚上好", "早安", "在吗", "下午好"],
    mood_good: ["开心", "高兴", "很好", "不错", "心情好", "快乐", "舒服", "轻松", "幸福", "挺好"],
    mood_meh: ["一般", "还行", "马马虎虎", "凑合", "普普通通", "没什么特别"],
    mood_sad: ["难过", "伤心", "想哭", "哭了", "不开心", "低落", "沮丧", "心情不好", "失落", "郁闷", "委屈", "难受", "不好受", "心碎"],
    mood_anxious: ["焦虑", "紧张", "担心", "害怕", "不安", "恐慌", "心慌", "慌张", "忐忑"],
    stressed: ["压力", "压力大", "烦死", "头疼", "头痛", "崩溃", "喘不过气", "受不住"],
    stressed_work: ["工作", "上班", "老板", "领导", "加班", "开会", "会议", "同事", "客户", "截止", "项目", "公司", "工作压力", "工作太多", "deadline"],
    burnout_tired: ["累", "好累", "疲惫", "筋疲力尽", "没力气", "没精神", "倦怠", "心累", "疲劳", "耗尽"],
    sleep: ["失眠", "睡不着", "睡不好", "熬夜", "半夜醒", "噩梦", "睡觉", "睡眠", "入睡"],
    lonely: ["孤独", "寂寞", "一个人", "没朋友", "没人陪", "孤单", "想家", "没人说话"],
    anger: ["生气", "愤怒", "气死", "火大", "烦躁", "恼火", "讨厌", "受不了", "抓狂"],
    overthinking: ["想太多", "胡思乱想", "停不下来", "反复想", "一直想", "纠结", "内耗", "想东想西", "万一"],
    self_criticism: ["我很笨", "我好笨", "我太笨", "没用", "失败", "不够好", "我的错", "讨厌自己", "怪自己", "搞砸", "一事无成", "我很差"],
    procrastination: ["拖延", "不想开始", "没动力", "懒", "提不起劲", "集中不了", "静不下心", "刷手机", "做不完", "无法专注"],
    relationship: ["家人", "家里", "爸爸", "妈妈", "父母", "男朋友", "女朋友", "对象", "老公", "老婆", "吵架", "分手", "朋友", "关系", "婆婆", "兄弟", "姐妹"],
    good_news: ["升职", "通过了", "考过", "成功", "好消息", "加薪", "奖金", "做到了", "完成了", "骄傲", "被表扬", "拿到offer", "录取"],
    gratitude: ["感恩", "感激", "感谢生活", "很幸运", "庆幸"],
    bored: ["无聊", "没事做", "闷", "没意思"],
    ask_pet: ["你叫什么", "你是谁", "你喜欢", "你几岁", "你在干嘛", "你好吗", "你吃什么"],
    thanks: ["谢谢", "多谢", "感谢", "谢啦"],
    bye: ["再见", "拜拜", "晚安", "下次聊", "先走了", "回头见", "我去睡了"],
    ask_human: ["真人", "你是人吗", "是不是人", "机器人", "人工智能", "你是ai", "心理医生", "咨询师", "治疗师", "心理师", "你是医生"],
    vent: ["倾诉", "吐槽", "想说说", "听我说", "想聊聊", "发泄"],
    ask_break: ["休息方法", "怎么休息", "放松", "怎么放松", "歇一下", "喘口气", "休息一下"],
    ask_mission: ["任务", "做什么好", "推荐", "该做什么"],
    yes: ["好", "好的", "好啊", "可以", "行", "嗯", "是", "试试", "来吧", "ok"],
    no: ["不", "不要", "不用", "算了", "以后再说", "不想"],
    kidding: ["开玩笑", "说着玩", "逗你", "不是认真的"]
};

// =====================================================================
// 日本語
// =====================================================================
CHAT_UI.ja = {
    btn: "おしゃべり", title: "{pet}とおしゃべり", sub: "この端末の中だけ · 人でもセラピストでもありません",
    disclose: "{pet}はゲームのペットで、人でもセラピストでもありません。返事は Hikari チームが前もって書いたもので、この端末の中で動いています。入力した内容はどこにも送られません。このチャットは治療でも緊急サービスでもありません。安全だと感じられないときは、上の電話ボタンをすぐ押してください。無料です。",
    keep: "最新 30 件をこの端末に残す", clear: "チャットを消す", cleared: "チャットを消しました。この端末には何も残っていません。",
    placeholder: "{pet}になんでも話してね…", send: "送信", close: "閉じる", typing: "{pet}が入力中…", help: "今すぐ助けが必要",
    you: "あなた", chips: "話題をえらぶ", input: "{pet}へのメッセージ", after: "話してくれてありがとう {s}",
    chip_vent: "聞いてほしい", chip_sleep: "眠れない", chip_work: "仕事が多い", chip_lonely: "さみしい", chip_break: "休み方を知りたい", chip_stay: "そばにいて",
    aiToggle: "オンライン AI を使う（返事を作るためにメッセージが Hikari のサーバーに送られます）", aiNote: "オンライン AI モードがオンです。返事は人ではなく AI が書いています。",
    act_sigh: "1分間の長いため息", act_b48: "寝る前の 4·8 呼吸", act_breathe: "ペットとゆっくり呼吸", act_qb: "1〜5分の小休憩をえらぶ",
    act_stretch: "デスクで2分ストレッチ", act_pmr: "3分 力を入れて抜く", act_walk: "いっしょに5分さんぽ", act_step: "次の小さな一歩",
    act_talk: "信頼できる人に話す", act_letters: "やさしい手紙を送る", act_help: "今すぐ助けが必要",
    act_web_today: "今日のミッション", act_web_assessment: "ストレスチェック 18問", act_web_burnout: "燃え尽きチェック",
    act_web_rootcause: "原因から向き合う", act_web_sleep: "原因から向き合う：睡眠", act_web_selfcare: "セルフケア（グラウンディング）",
    act_web_moodscreen: "うつの簡易チェック 2Q", act_web_videos: "リラックス動画",
    sub_web: "Hikari のサイトを開く", sub_web_moodscreen: "2週間以上ほぼ毎日気分が沈むとき · 簡易チェックで、診断ではありません", sub_game: "ゲームの中で",
    topic_mood_sad: "悲しい気持ち", topic_mood_anxious: "不安なこと", topic_stressed: "ストレス", topic_stressed_work: "仕事",
    topic_burnout_tired: "疲れ", topic_sleep: "睡眠", topic_lonely: "さみしさ", topic_anger: "怒り",
    topic_overthinking: "ぐるぐるする考え", topic_self_criticism: "自分を責める気持ち", topic_procrastination: "始めにくいこと", topic_relationship: "身近な人のこと"
};
CHAT_CRISIS.ja = {
    text: "話してくれてありがとう。今、本当につらいんですね。ひとりで抱えこまなくて大丈夫です。わたしはゲームのペットなので緊急時の助けにはなれませんが、今すぐ話を聞いてくれる人がいます。無料です。タイ国内ならメンタルヘルスホットライン 1323（24時間）、今危険な状態なら 1669 へ。タイ以外にいる場合は、下のボタンからあなたの国の無料相談窓口を探せます。",
    stay: "わたしはまだここにいます。急いで何か書かなくて大丈夫。足を床にぴったりつけて、ゆっくり長く息をはいてみてください。できそうなときに、信頼できる人に電話かメッセージをしてね。下のボタンはいつでも押せます。無料です。",
    kidding: "わかりました、教えてくれてありがとう。ただ、もし本当にそう感じる日があったら、下のボタンはいつでも押せます。無料で、誰もあなたを責めません。"
};
CHAT.ja = {
    intro: ["{s} こんにちは、{pet}だよ。今日のこと、なんでも書いてね。下の話題をタップしてもいいよ。"],
    greet_none: ["{s} 来てくれてうれしい。今日の気持ちはどう？", "来てくれた！{s} 今どんな気分？下の顔をタップしても、書いてもいいよ。", "{s} ここにいるよ。なんでも話していいし、ただ静かにいっしょにいるのもいいね。"],
    greet_low: ["今日は気持ちが重いみたいだね。それでも来てくれてありがとう。話してみる？", "今日は疲れているみたい。急いで話さなくていいよ。ここでいっしょにいるね。", "つらい日にここへ来ることも、自分を大切にすることだよ。どこから話そうか？"],
    greet_high: ["{s} 今日は明るい気分なんだね！うれしいな。何がよかったの？", "{s} 今日がいい日でよかった。話したいことある？", "やったね {s} このいい気分、しばらく味わおうね。"],
    greeting: ["{s} こんにちは！声をかけてくれてうれしい。今日はどんな一日？", "やあ {s} ここにいるよ。何を話そうか？", "{s} ちょうどよかった。今日は疲れてない？"],
    mood_good: ["{s} よかったね！今日いちばんよかったのはどんなとき？", "すてき {s} 3秒だけ止まって、このいい気分をしっかり感じてみてね。", "{s} 聞いていたらわたしもうれしくなったよ。この気分、だれかに話してみるのもいいね。"],
    mood_meh: ["「まあまあ」も大丈夫な気持ちだよ。毎日がいい日じゃなくていい。好きな小さいことを5分やってみる？", "どっちつかずの日ってよくあるよね。わたしとちょっとさんぽしない？", "わかるよ。なんとなく過ぎる日もあるよね。気になることがあれば聞くよ。"],
    mood_sad: ["今日は心が重いんだね。話してくれてありがとう。悲しいのは弱いからじゃないよ。何があったか話してみる？", "悲しくていいんだよ。無理に消さなくていい。胸に手を当てて、「今はつらい、だれにでもこういう日はある」と自分に言ってみてね。", "ここにいるよ。泣きたかったら泣いていいよ。体が何かを手放せるから。信頼できる人がいたら、短いメッセージを送るのもいいね。"],
    mood_anxious: ["こんなにそわそわするのは疲れるよね。いっしょにため息をしよう。鼻から吸って、もう少し吸い足して、口から長くはく。2〜3回やってみてね。", "不安は脳があなたを守ろうとしているサイン。でもときどき働きすぎちゃう。今、まわりに見えるものを5つ探せる？", "いっしょにいるよ {s} 足を床につけて体の重さを感じて、はく息を吸う息より長くしてみてね。"],
    stressed: ["ストレスがたまっているみたいだね。ストレスは体にも残るんだ。1分だけ体を動かしたり長く息をはいたりすると、体が「もう安全」とわかるよ。", "そんなストレス、感じて当然だよ。だれだってつらい。今いちばん重いのは何？", "{s} 1分だけいっしょに休もう？今ぜんぶ解決しなくていい。まず体にひと息つかせてあげよう。"],
    stressed_work: ["仕事がこんなに押しよせると本当に疲れるね。頭の中のタスクをぜんぶ紙に書き出して、今いちばん大事なひとつだけ選んでみて。", "仕事のプレッシャーが大きいんだね。仕事のストレスはあなたのせいじゃないよ。しくみで解決すべきこともある。いっしょに2分ストレッチしない？", "大変な仕事の日、それでもがんばっている自分にありがとうを言おうね。いちばん気が重い仕事はどれ？"],
    burnout_tired: ["ここまで疲れているのは、体が本当に休みを求めているサインだよ。今日ひとつ手放せることはある？", "燃え尽きはあなたの力不足じゃない。長いあいだがんばりすぎたサインだよ。いっしょに3分、力を入れて抜く練習をしない？", "{s} ずっとがんばってきたの、知ってるよ。今日は半分できれば十分だよ。"],
    sleep: ["眠れないのはつらいよね。いっしょに4秒吸って8秒はくのを1分やってみよう。眠ろうとしなくていい、体を休ませるだけでいいよ。", "20分くらい眠れなかったら、いったん起きて暗めの明かりで静かなことをして、眠くなったら布団にもどってね。", "頭が止まらない夜は、気になっていることを紙に少し書いて、「続きは明日」と自分に言ってみてね。"],
    lonely: ["さみしいって教えてくれてありがとう。さみしいのは、あなたに何か問題があるからじゃないよ。連絡してみたい人はいる？", "わたしはここにいるよ {s} でもゲームのペットなんだ。本当の人に一言だけでもメッセージを送ると、心がずいぶん楽になるよ。", "さみしさは多くの人が感じるもの。仕事が忙しいときは特にね。だれかにやさしい手紙を送ってみるのもいいよ。"],
    anger: ["怒りは、あなたにとって大事なものがふみにじられたサインかもしれない。怒りにはエネルギーがあるから、早歩きや体を動かすと外に出せるよ。", "イライラしていいんだよ。おさえこまなくていい。だれかに返事したり何かを決めたりする前に、長いため息を2回してみてね。", "本当に腹が立ったんだね。何がいちばん頭にきた？"],
    overthinking: ["~a 考えがぐるぐるするのは疲れるよね。頭に「わたしは…という考えを持っている」とつけて、流れていく雲みたいにながめてみて。追い払わなくても、全部信じなくてもいいよ。", "頭は「もしも…」をくり返すのが好きなんだ。体にもどってこよう。見えるものを5つ言って、まわりのものを4つさわってみて。", "~c 考えはいつも事実とはかぎらないよ。この考えに反する証拠は何があるかな？"],
    self_criticism: ["頭の中の声がすごくきびしいみたいだね。親友が同じことになったら、なんて声をかける？", "失敗はだれにでもあることだよ。ゆっくり自分に言ってみて。「今はつらい、だれでも失敗する、自分にやさしくしよう」。", "~c 「自分はダメだ」は「レッテル貼り」という考えのくせだよ。このできごとは、あなたという人より、その時の状況について語っているんだ。"],
    procrastination: ["始められないのは、なまけているからじゃないよ。大きすぎて、どこから手をつければいいか脳がわからないだけ。2分でできる小さな一歩にしてみる？", "タイマーを5分だけセットして、「これだけでいい」と自分に言ってみて。始めると続けやすくなることが多いよ。", "{s} いちばん小さな最初の一歩は何？ファイルを開くだけ、見出しを1行書くだけ、とか。"],
    relationship: ["身近な人のことは、大切だからこそよけいにつらいよね。話してくれてありがとう。何があったか、もう少し話してみる？", "ぎくしゃくした関係は心がすり減るね。責めるかわりに「…のとき、わたしは…と感じる」と伝えると、話しやすくなるかも。", "ほかに信頼できる人と話すと、見え方がはっきりすることもあるよ。話せる人はいる？"],
    good_news: ["{s} やったー！本当におめでとう、できたね！知ったときどんな気持ちだった？", "{s} すごい！すぐ次に行かないで、しばらくこのうれしさを味わってね。", "こんないい知らせはお祝いだね {s} 大切な人にも話すと、うれしさがもっと大きくなるよ。"],
    gratitude: ["{s} 聞いていてあたたかくなったよ。こういういいことに気づくと、心に休む場所ができるね。", "いいことを教えてくれてありがとう。今夜、ありがたい小さなことをあと2つ思い出せる？", "{s} 気づいた小さないいことは、心の予備バッテリーみたいなものだよ。"],
    bored: ["退屈なら、体に気分転換させてあげよう。わたしと5分さんぽしよう。", "退屈は、何か新しいことがほしいサインのことも。前は好きだったけど最近やっていないことはある？", "{s} いっしょに遊ぶ？それとも、サイトで短いリラックス動画を見るのもいいよ。"],
    ask_pet: ["{s} わたしは{pet}。光の庭でのんびりするのが好きで、あなたが来てくれるのが好きで、いっしょにゆっくり呼吸するのも好き。", "わたしはこのゲームの小さなペットだよ {s} わたしの仕事はあなたに休んでもらうこと。今日は休めた？", "{s} 今日は元気だよ。お日さまの下でお昼寝して、ぽかぽかだった。あなたは？"],
    thanks: ["{s} いつでもどうぞ。自分にやさしくしてくれてありがとう。", "どういたしまして {s} 話せてうれしかったよ。", "{s} どういたしまして！体を大事にしてね。"],
    bye: ["{s} 来てくれてありがとう。ゆっくり休んでね。", "バイバイ {s} 行く前にお水を一杯飲んでね。", "{s} またお話ししようね。今日はよくがんばったよ。"],
    ask_human: ["わたしはゲームのペットで、人でもセラピストでもないよ。返事は Hikari チームが前もって書いたもので、この端末の中で動いているんだ。本当の人と話したいときは、信頼できる人に連絡するか、タイなら無料・24時間のメンタルヘルスホットライン 1323 に電話してね。", "正直に言うね。わたしは人でも、お医者さんでも、心理士でもない。休むことを思い出させるゲームのペットだよ。専門家と話したいときは、タイなら 1323 に無料で電話できるし、あなたの国の相談窓口を探すこともできるよ。", "わたしはゲームのキャラクターで、本物の人でもセラピストでもないよ。診断や治療はできないけど、話を聞いて小さな休憩を提案することはできる。人と話したいときは、1323 が無料で24時間聞いてくれるよ。"],
    vent: ["聞いているよ。好きなだけ書いていいし、まとまってなくていいよ。メッセージはこの端末の中だけにあるよ。", "吐き出していいよ。あなたを責めたりしないよ。", "どうぞ {s} 口に出すだけで、心が少し軽くなることもあるよ。"],
    listen: ["うん……聞いているよ。続けて。", "話してくれてありがとう。それも重かったね。", "ここにいるよ。ゆっくりでいいよ、急がなくて大丈夫。"],
    ask_break: ["{s} 好きな休み方をえらんでね。1分のため息、2分のストレッチ、わたしと5分のさんぽ。", "短い休憩もちゃんと効くよ。体は動いたり長く息をはいたりするのが好き。下からえらんでね。", "いいよ！{s} 1〜5分で十分。今できるものをえらんでね。"],
    ask_mission: ["サイトの今日のミッションは数分でできるよ。短い動画と小さなタスクが3つ。やってみる？", "{s} 何から始めればいいかわからないときは、サイトの今日のミッションからどうぞ。ひとつずつで十分だよ。", "サイトの今日のミッションか、ゲームの中の小休憩がおすすめだよ。心がやりたいほうをえらんでね。"],
    yes: ["{s} 行こう！下のカードをタップしてね。", "いいね {s} いっしょに行くよ。", "やったね {s} いっしょにやろう。"],
    no: ["ぜんぜん大丈夫。何もしなくていいよ。ここにいるね。", "わかった、準備ができたらまたね。", "うん {s} おしゃべりするだけでもいいよね。"],
    unknown: ["ぜんぶはわからないかもしれないけど、聞いているよ。もう少し教えてくれる？下の話題をタップしてもいいよ。", "うーん……{s} わたしはまだ聞き上手になる練習中のペットなんだ。今どんな気持ち？", "話してくれてありがとう。休み方を知りたいときは、下の「休み方を知りたい」をタップしてね。"],
    followup: ["{topic}のこと、もう少し話してくれてありがとう。しばらくひとりで抱えてきたんだね。まず少し休んで、それから少しずつ考えればいいよ。", "前よりわかってきたよ。{topic}は簡単じゃないね。今日ぜんぶ解決しなくていいよ。", "聞いているよ。{topic}はだれにとってもつらいもの。よかったら下のカードを見てみてね。"],
    nudge: ["今日はたくさん話したね。信頼してくれてありがとう。わたしはゲームのペットだから、目を休めたり、お水を飲んだり、友だちにメッセージしたりしてみてね。", "{s} あなたと話せてうれしいけど、まわりの本当の人たちもあなたの話を聞きたいと思うよ。だれかにメッセージしてみる？", "けっこう長く話したね。立ってちょっと伸びをして、いつでもまた来てね。"]
};
CHAT_KEYS.ja = {
    greeting: ["こんにちは", "こんばんは", "おはよう", "やあ", "はじめまして", "もしもし", "ハロー", "どうも"],
    mood_good: ["嬉しい", "うれしい", "楽しい", "元気", "気分がいい", "幸せ", "いい感じ", "最高", "調子いい", "絶好調"],
    mood_meh: ["まあまあ", "ふつう", "普通", "びみょう", "微妙", "可もなく不可もなく"],
    mood_sad: ["悲しい", "かなしい", "つらい", "辛い", "落ち込", "泣き", "泣いた", "涙", "しんどい", "憂うつ", "憂鬱", "へこんで", "凹んで",
        "気分が悪い", "元気がない", "元気ない", "気分が沈", "ブルー"],
    mood_anxious: ["不安", "心配", "緊張", "怖い", "こわい", "パニック", "そわそわ", "ドキドキ", "焦り", "焦って", "落ち着かない"],
    stressed: ["ストレス", "プレッシャー", "いっぱいいっぱい", "頭痛", "余裕がない", "キャパオーバー"],
    stressed_work: ["仕事", "上司", "会社", "職場", "残業", "会議", "締め切り", "締切", "同僚", "取引先", "納期", "プロジェクト", "出勤", "業務"],
    burnout_tired: ["疲れ", "つかれ", "くたくた", "ヘトヘト", "へとへと", "だるい", "燃え尽き", "バーンアウト", "気力がない", "限界", "消耗"],
    sleep: ["眠れない", "ねむれない", "寝れない", "寝られない", "不眠", "夜中に目が覚め", "夜更かし", "悪夢", "睡眠", "寝不足", "眠い", "寝つけ"],
    lonely: ["寂しい", "さみしい", "さびしい", "孤独", "ひとりぼっち", "一人ぼっち", "友達がいない", "話す人がいない"],
    anger: ["怒り", "怒って", "腹が立", "ムカつ", "むかつ", "イライラ", "いらいら", "頭にくる", "キレそう", "許せない"],
    overthinking: ["考えすぎ", "考え過ぎ", "ぐるぐる", "頭から離れない", "考えが止まらない", "悩みすぎ", "もやもや", "モヤモヤ", "もしも"],
    self_criticism: ["自分はダメ", "私はダメ", "ダメな自分", "自分が嫌い", "自分のせい", "失敗した", "役立たず", "無能", "情けない", "自分を責め", "ミスした", "私なんて"],
    procrastination: ["先延ばし", "やる気が出ない", "やる気がない", "集中できない", "手につかない", "始められない", "後回し", "だらだら", "スマホばかり"],
    relationship: ["家族", "両親", "お母さん", "お父さん", "母親", "父親", "彼氏", "彼女", "夫", "妻", "恋人", "喧嘩", "けんか", "別れ", "友達と", "人間関係", "義母", "パートナー"],
    good_news: ["昇進", "合格", "受かった", "成功", "いいこと", "良いこと", "ボーナス", "褒められ", "できた", "やった", "達成", "誇らしい", "いい知らせ"],
    gratitude: ["感謝", "ありがたい", "恵まれ", "幸運", "運がいい"],
    bored: ["退屈", "暇", "ひま", "つまらない"],
    ask_pet: ["名前は", "あなたは誰", "きみは誰", "君は誰", "何が好き", "何歳", "何してる", "好きな食べ物"],
    thanks: ["ありがとう", "ありがと", "サンキュー", "どうもありがとう"],
    bye: ["さようなら", "またね", "おやすみ", "じゃあね", "バイバイ", "また話そう", "寝るね"],
    ask_human: ["人間ですか", "人間なの", "本物の人", "本当の人", "ロボットですか", "ロボットなの", "aiですか", "aiなの", "ボット", "カウンセラー", "セラピスト", "心理士", "精神科医", "お医者さん"],
    vent: ["聞いて", "愚痴", "ぐち", "話したい", "吐き出したい", "聞いてほしい"],
    ask_break: ["休憩", "休みたい", "リラックス", "一息", "休み方", "落ち着きたい"],
    ask_mission: ["ミッション", "何をすれば", "何をしたらいい", "おすすめ"],
    yes: ["はい", "うん", "いいよ", "オッケー", "やる", "やってみる", "お願い", "ok", "ええ", "そうする"],
    no: ["いいえ", "いや", "やめとく", "今はいい", "結構", "また今度"],
    kidding: ["冗談", "じょうだん", "ふざけ", "本気じゃない"]
};

// =====================================================================
// हिन्दी (देवनागरी + कुछ रोमन शब्द)
// =====================================================================
CHAT_UI.hi = {
    btn: "बात करें", title: "{pet} से बात करें", sub: "सिर्फ़ इसी डिवाइस पर · कोई इंसान या थेरेपिस्ट नहीं",
    disclose: "{pet} एक गेम का पालतू है, कोई इंसान या थेरेपिस्ट नहीं। जवाब Hikari टीम ने पहले से लिखे हैं और इसी डिवाइस पर चलते हैं। आप जो लिखते हैं, वह कहीं नहीं भेजा जाता। यह चैट इलाज या आपातकालीन सेवा नहीं है। अगर आप सुरक्षित महसूस नहीं कर रहे, तो ऊपर कॉल बटन तुरंत दबाएँ, मुफ़्त।",
    keep: "आख़िरी 30 संदेश इस डिवाइस पर रखें", clear: "चैट मिटाएँ", cleared: "चैट मिट गई। इस डिवाइस पर कुछ नहीं बचा।",
    placeholder: "{pet} से कुछ भी कहें…", send: "भेजें", close: "बंद करें", typing: "{pet} लिख रहा है…", help: "मुझे अभी मदद चाहिए",
    you: "आप", chips: "झटपट विषय", input: "{pet} के लिए संदेश", after: "बात करने के लिए शुक्रिया {s}",
    chip_vent: "मन हल्का करना है", chip_sleep: "नींद नहीं आती", chip_work: "बहुत काम है", chip_lonely: "अकेलापन", chip_break: "आराम के तरीके", chip_stay: "मेरे साथ रहो",
    aiToggle: "ऑनलाइन AI इस्तेमाल करें (जवाब बनाने के लिए संदेश Hikari के सर्वर पर भेजे जाएँगे)", aiNote: "ऑनलाइन AI मोड चालू है। जवाब AI से आ रहे हैं, किसी इंसान से नहीं।",
    act_sigh: "1 मिनट लंबी आह", act_b48: "सोने से पहले 4·8 साँस", act_breathe: "पालतू के साथ धीमी साँस", act_qb: "1–5 मिनट का छोटा ब्रेक चुनें",
    act_stretch: "2 मिनट डेस्क स्ट्रेच", act_pmr: "3 मिनट कसना और ढीला छोड़ना", act_walk: "साथ में 5 मिनट टहलें", act_step: "अगला छोटा क़दम",
    act_talk: "किसी भरोसेमंद से बात करें", act_letters: "एक प्यारा पत्र भेजें", act_help: "मुझे अभी मदद चाहिए",
    act_web_today: "आज का मिशन", act_web_assessment: "18 सवालों का तनाव जाँच", act_web_burnout: "बर्नआउट जाँच",
    act_web_rootcause: "जड़ से निपटें", act_web_sleep: "जड़ से निपटें: नींद", act_web_selfcare: "ख़ुद की देखभाल (ग्राउंडिंग)",
    act_web_moodscreen: "2Q डिप्रेशन स्क्रीनिंग", act_web_videos: "आराम देने वाले वीडियो",
    sub_web: "Hikari वेबसाइट खोलता है", sub_web_moodscreen: "अगर 2 हफ़्ते से ज़्यादा लगभग रोज़ मन उदास रहा हो · शुरुआती जाँच, निदान नहीं", sub_game: "गेम में",
    topic_mood_sad: "उदासी", topic_mood_anxious: "चिंता", topic_stressed: "तनाव", topic_stressed_work: "काम",
    topic_burnout_tired: "थकान", topic_sleep: "नींद", topic_lonely: "अकेलापन", topic_anger: "ग़ुस्सा",
    topic_overthinking: "घूमते विचार", topic_self_criticism: "ख़ुद पर सख़्ती", topic_procrastination: "शुरुआत करना", topic_relationship: "क़रीबी लोग"
};
CHAT_CRISIS.hi = {
    text: "मुझे बताने के लिए शुक्रिया। लगता है अभी सब बहुत भारी है, और आपको यह अकेले नहीं सहना है। मैं सिर्फ़ एक गेम का पालतू हूँ और आपातकाल में मदद नहीं कर सकता, लेकिन असली लोग अभी आपकी बात सुनने को तैयार हैं, मुफ़्त में। थाईलैंड में मानसिक स्वास्थ्य हेल्पलाइन 1323 (24 घंटे) पर कॉल करें। अगर आप अभी ख़तरे में हैं, तो 1669 पर कॉल करें। थाईलैंड से बाहर हैं तो नीचे दबाकर अपने देश की मुफ़्त हेल्पलाइन खोजें।",
    stay: "मैं अब भी यहीं हूँ। कुछ भी लिखने की जल्दी नहीं। अपने पैर ज़मीन पर टिकाएँ और एक बार धीरे-धीरे लंबी साँस छोड़ें। जब हो सके, किसी भरोसेमंद व्यक्ति को कॉल या मैसेज करें। नीचे के बटन हमेशा हैं, मुफ़्त।",
    kidding: "ठीक है, बताने के लिए शुक्रिया। बस इतना जान लीजिए: अगर कभी सच में ऐसा महसूस हो, तो नीचे के बटन हमेशा हैं, मुफ़्त, और कोई आपको जज नहीं करेगा।"
};
CHAT.hi = {
    intro: ["{s} नमस्ते, मैं {pet} हूँ। अपने दिन के बारे में कुछ भी लिखिए, या नीचे कोई विषय दबाइए।"],
    greet_none: ["{s} आप बात करने आए, बहुत अच्छा लगा। आज मन कैसा है?", "आप आ गए! {s} अभी कैसा लग रहा है? नीचे चेहरा दबाइए या लिखिए।", "{s} मैं यहीं हूँ। कुछ भी कहिए, या हम बस चुपचाप साथ बैठ सकते हैं।"],
    greet_low: ["लगता है आज मन भारी है। फिर भी आने के लिए शुक्रिया। मुझे बताना चाहेंगे?", "आज आप थके हुए लग रहे हैं। बताने की जल्दी नहीं है। मैं यहीं आपके साथ बैठा हूँ।", "मुश्किल दिन में यहाँ आना भी अपना ख़याल रखना है। कहाँ से शुरू करें?"],
    greet_high: ["{s} आज मन खिला हुआ है! मुझे बहुत ख़ुशी है। आज क्या अच्छा हुआ?", "{s} अच्छा लगा कि आज का दिन अच्छा है। कुछ बताना चाहेंगे?", "वाह {s} इस अच्छे एहसास को थोड़ी देर संभालकर रखिए।"],
    greeting: ["{s} नमस्ते! आपने हैलो कहा, अच्छा लगा। आज का दिन कैसा है?", "हाय {s} मैं यहीं हूँ। किस बारे में बात करें?", "{s} बिल्कुल सही समय पर आए। आज थकान है क्या?"],
    mood_good: ["{s} बहुत ख़ुशी हुई! आज का सबसे अच्छा पल कौन-सा था?", "बढ़िया {s} तीन सेकंड रुककर इस अच्छे एहसास को महसूस कीजिए।", "{s} सुनकर मेरा भी मूड अच्छा हो गया। यह अच्छा दिन किसी के साथ बाँट भी सकते हैं।"],
    mood_meh: ["'ठीक-ठाक' महसूस करना भी ठीक है। हर दिन शानदार होना ज़रूरी नहीं। 5 मिनट कोई पसंदीदा छोटा काम करें?", "बीच वाले दिन अक्सर आते हैं। मेरे साथ थोड़ा टहलने चलें?", "समझ सकता हूँ। कुछ दिन बस यूँ ही निकल जाते हैं। अगर मन में कुछ है, तो मैं सुन रहा हूँ।"],
    mood_sad: ["लगता है आज दिल बहुत भारी है। बताने के लिए शुक्रिया। उदास होने का मतलब कमज़ोर होना नहीं है। क्या बताना चाहेंगे कि क्या हुआ?", "उदास होना ठीक है। इसे तुरंत भगाने की ज़रूरत नहीं। सीने पर हाथ रखकर ख़ुद से कहिए: अभी सच में मुश्किल है, ऐसे दिन सबके आते हैं।", "मैं यहीं हूँ। रोना चाहें तो रो लीजिए, शरीर कुछ हल्का कर पाता है। कोई भरोसेमंद हो तो उसे एक छोटा संदेश भेजना भी मदद कर सकता है।"],
    mood_anxious: ["इतनी बेचैनी सच में थका देती है। मेरे साथ एक आह भरिए: नाक से साँस लें, थोड़ी और लें, फिर मुँह से लंबी साँस छोड़ें। 2–3 बार करें।", "चिंता आपका दिमाग़ है जो आपको बचाना चाहता है, बस कभी-कभी ज़रूरत से ज़्यादा मेहनत करता है। क्या अभी आसपास दिखने वाली 5 चीज़ें ढूँढ सकते हैं?", "मैं साथ हूँ {s} पैर ज़मीन पर रखिए, शरीर का वज़न महसूस कीजिए, और हर साँस छोड़ना साँस लेने से लंबा रखिए।"],
    stressed: ["लगता है बहुत तनाव जमा हो गया है। तनाव शरीर में भी रहता है। एक मिनट हिलना-डुलना या धीरे साँस छोड़ना शरीर को बताता है कि अब सुरक्षित है।", "ऐसा तनाव होना बिल्कुल स्वाभाविक है, किसी को भी भारी लगेगा। अभी सबसे भारी क्या लग रहा है?", "{s} मेरे साथ एक मिनट आराम करें? अभी सब कुछ हल करने की ज़रूरत नहीं। पहले शरीर को एक साँस छोड़ने दीजिए।"],
    stressed_work: ["ऐसे काम का ढेर सच में थका देता है। सारे काम दिमाग़ से निकालकर काग़ज़ पर लिखिए, फिर अभी सबसे ज़रूरी सिर्फ़ एक चुनिए।", "काम का दबाव बहुत लगता है। काम का तनाव आपकी ग़लती नहीं है, कुछ चीज़ें सिस्टम में भी ठीक होनी चाहिए। मेरे साथ 2 मिनट खड़े होकर स्ट्रेच करें?", "इतने भारी काम के दिन में, ख़ुद को शुक्रिया कहिए कि आप डटे हुए हैं। कौन-सा काम सबसे ज़्यादा परेशान कर रहा है?"],
    burnout_tired: ["इतनी थकान का मतलब है शरीर सच में आराम माँग रहा है। आज कोई एक चीज़ है जिसे नीचे रख सकें?", "बर्नआउट का मतलब यह नहीं कि आप काबिल नहीं हैं। यह संकेत है कि आप बहुत लंबे समय से बहुत ज़्यादा दे रहे हैं। मेरे साथ 3 मिनट कसना और ढीला छोड़ना करें?", "{s} मैं देख सकता हूँ कि आप कितनी कोशिश करते रहे हैं। आज आधा भी काफ़ी है।"],
    sleep: ["नींद न आना बहुत तकलीफ़ देता है। मेरे साथ एक मिनट 4 तक साँस लें और 8 तक छोड़ें। सोने की कोशिश मत कीजिए, बस शरीर को आराम दीजिए।", "अगर लगभग 20 मिनट से ज़्यादा नींद न आए, तो उठकर हल्की रोशनी में कुछ शांत काम करें, फिर नींद आने पर बिस्तर पर लौटें।", "जिस रात दिमाग़ नहीं रुकता, मन की बातें थोड़ा काग़ज़ पर लिख लीजिए और ख़ुद से कहिए: कल देखेंगे।"],
    lonely: ["अकेलापन बताने के लिए शुक्रिया। अकेला महसूस करने का मतलब यह नहीं कि आपमें कुछ ग़लत है। क्या कोई है जिससे आप संपर्क करना चाहेंगे?", "मैं यहीं हूँ {s} लेकिन मैं सिर्फ़ गेम का पालतू हूँ। किसी असली इंसान को एक लाइन का संदेश भी बहुत मदद कर सकता है।", "बहुत लोग अकेलापन महसूस करते हैं, ख़ासकर जब काम बहुत हो। किसी को एक प्यारा पत्र भेजकर देखिए।"],
    anger: ["ग़ुस्सा अक्सर बताता है कि आपके लिए कुछ ज़रूरी चीज़ को ठेस पहुँची है। ग़ुस्से में बहुत ऊर्जा होती है, तेज़ चलना या शरीर हिलाना उसे बाहर निकलने देता है।", "चिढ़ होना ठीक है, उसे दबाने की ज़रूरत नहीं। किसी को जवाब देने या कुछ तय करने से पहले दो लंबी आह भरिए।", "यह सच में ग़ुस्सा दिलाने वाला लगता है। सबसे ज़्यादा किस बात ने चुभा?"],
    overthinking: ["~a घूमते विचार बहुत थका देते हैं। आगे जोड़िए 'मुझे यह विचार आ रहा है कि…' और उसे गुज़रते बादल की तरह देखिए। भगाने या हर शब्द मानने की ज़रूरत नहीं।", "दिमाग़ को 'अगर ऐसा हुआ तो…' बार-बार चलाना पसंद है। शरीर पर लौटिए: 5 दिखने वाली चीज़ों के नाम लीजिए और आसपास की 4 चीज़ें छुइए।", "~c विचार हमेशा तथ्य नहीं होते। ख़ुद से पूछिए: इस विचार के ख़िलाफ़ क्या सबूत है?"],
    self_criticism: ["लगता है अंदर की आवाज़ आपसे बहुत सख़्ती से बात कर रही है। अगर आपके क़रीबी दोस्त के साथ यही होता, तो आप उससे क्या कहते?", "ग़लतियाँ हर इंसान से होती हैं। धीरे से ख़ुद से कहिए: अभी मुश्किल है, सबसे ग़लती होती है, मैं ख़ुद के साथ नरमी रखूँ।", "~c 'मैं काफ़ी अच्छा नहीं हूँ' एक सोच का जाल है जिसे 'लेबल लगाना' कहते हैं। यह घटना आपके बारे में कम, उस हालात के बारे में ज़्यादा बताती है।"],
    procrastination: ["शुरू न कर पाना आलस नहीं है। कभी काम इतना बड़ा होता है कि दिमाग़ को समझ नहीं आता कहाँ से पकड़े। इसे 2 मिनट वाले छोटे क़दम में बदलें?", "बस 5 मिनट का टाइमर लगाइए और ख़ुद से कहिए कि बस इतना ही। शुरू करने के बाद आगे बढ़ना अक्सर आसान होता है।", "{s} सबसे छोटा पहला क़दम क्या है, जैसे बस फ़ाइल खोलना या एक हेडिंग लिखना?"],
    relationship: ["क़रीबी लोगों की बातें ज़्यादा चुभती हैं, क्योंकि हम उनकी परवाह करते हैं। बताने के लिए शुक्रिया। क्या और बताना चाहेंगे कि क्या हुआ?", "तनाव भरे रिश्ते मन थका देते हैं। दोष देने के बजाय 'जब… होता है, तो मुझे… लगता है' कहना बात को आसान बना सकता है।", "कभी किसी और भरोसेमंद व्यक्ति से बात करने से चीज़ें साफ़ दिखती हैं। क्या कोई है जिसे आप बता सकें?"],
    good_news: ["{s} वाह! बहुत ख़ुशी हुई, आपने कर दिखाया! ख़बर मिलने पर कैसा लगा?", "{s} शानदार! अगले काम की जल्दी मत कीजिए, थोड़ी देर इस ख़ुशी को जी लीजिए।", "ऐसी ख़ुशख़बरी का जश्न बनता है {s} किसी प्यारे को बताइए, ख़ुशी और बढ़ जाएगी।"],
    gratitude: ["{s} सुनकर बहुत अच्छा लगा। ऐसी अच्छी बातों पर ध्यान देने से मन को ठहरने की जगह मिलती है।", "अच्छी बात बाँटने के लिए शुक्रिया। आज रात दो और छोटी चीज़ें सोच सकते हैं जिनके लिए आभारी हों?", "{s} जो छोटी अच्छी बातें हम देखते हैं, वे दिल की अतिरिक्त बैटरी जैसी हैं।"],
    bored: ["बोर हो रहे हैं? शरीर को थोड़ा माहौल बदलने दीजिए। मेरे साथ 5 मिनट टहलिए।", "ऊब कभी-कभी कुछ नया चाहने का संकेत होती है। कोई ऐसी चीज़ है जो पहले पसंद थी पर काफ़ी समय से नहीं की?", "{s} खेलें? या वेबसाइट पर कोई छोटा आरामदायक वीडियो देख लीजिए।"],
    ask_pet: ["{s} मैं {pet} हूँ। मुझे लाइट गार्डन में आराम करना, आपका आना और साथ में धीमी साँसें लेना पसंद है।", "मैं इस गेम का छोटा-सा पालतू हूँ {s} मेरा काम आपको आराम याद दिलाना है। आज आपने ब्रेक लिया?", "{s} आज मैं ठीक हूँ, धूप में झपकी ली, बहुत गर्माहट थी। और आप?"],
    thanks: ["{s} कभी भी। ख़ुद के साथ नरमी रखने के लिए भी शुक्रिया।", "कोई बात नहीं {s} बात करके अच्छा लगा।", "{s} आपका स्वागत है! अपना ख़याल रखिए।"],
    bye: ["{s} आने के लिए शुक्रिया। अच्छे से आराम कीजिए।", "बाय-बाय {s} जाने से पहले एक गिलास पानी पी लीजिए।", "{s} फिर बात करेंगे। आज आपने अच्छा किया।"],
    ask_human: ["मैं एक गेम का पालतू हूँ, कोई इंसान या थेरेपिस्ट नहीं। मेरे जवाब Hikari टीम ने पहले से लिखे हैं और इसी डिवाइस पर चलते हैं। किसी असली इंसान से बात करनी हो तो किसी भरोसेमंद से संपर्क करें, या थाईलैंड में मानसिक स्वास्थ्य हेल्पलाइन 1323 पर मुफ़्त, 24 घंटे कॉल करें।", "सच कहूँ तो मैं इंसान, डॉक्टर या मनोवैज्ञानिक नहीं हूँ। मैं बस आराम याद दिलाने वाला गेम का पालतू हूँ। किसी विशेषज्ञ से बात करनी हो तो थाईलैंड में 1323 पर मुफ़्त कॉल कर सकते हैं, या अपने देश की हेल्पलाइन खोज सकते हैं।", "मैं एक गेम किरदार हूँ, असली इंसान या थेरेपिस्ट नहीं। मैं निदान या इलाज नहीं कर सकता, पर सुन सकता हूँ और छोटे ब्रेक सुझा सकता हूँ। इंसान से बात के लिए 1323 हेल्पलाइन मुफ़्त, 24 घंटे सुनती है।"],
    vent: ["मैं सुन रहा हूँ। जितना चाहें लिखिए, उसका सही क्रम में होना ज़रूरी नहीं। आपके संदेश इसी डिवाइस पर रहते हैं।", "मन की भड़ास निकाल दीजिए। मैं आपको जज नहीं करूँगा।", "बोलिए {s} कभी-कभी कह देने भर से दिल थोड़ा हल्का हो जाता है।"],
    listen: ["हम्म… मैं सुन रहा हूँ। आगे कहिए।", "बताने के लिए शुक्रिया। यह भी भारी लगता है।", "मैं यहीं हूँ। आराम से कहिए, कोई जल्दी नहीं।"],
    ask_break: ["{s} अपना पसंदीदा ब्रेक चुनिए: 1 मिनट की आह, 2 मिनट स्ट्रेच, या मेरे साथ 5 मिनट टहलना।", "छोटे ब्रेक सच में मदद करते हैं। शरीर को हिलना या लंबी साँस छोड़ना पसंद है। नीचे से एक चुनिए।", "ज़रूर! {s} बस 1–5 मिनट काफ़ी हैं। वह चुनिए जो अभी कर सकें।"],
    ask_mission: ["वेबसाइट पर आज का मिशन कुछ ही मिनट का है: एक छोटी क्लिप और 3 छोटे काम। आज़माएँ?", "{s} समझ न आए कहाँ से शुरू करें तो वेबसाइट पर आज के मिशन से शुरू कीजिए। एक बार में एक काम काफ़ी है।", "मैं वेबसाइट पर आज का मिशन सुझाऊँगा, या गेम में एक छोटा ब्रेक। जो मन करे वह चुनिए।"],
    yes: ["{s} चलिए! नीचे कार्ड दबाइए।", "बढ़िया {s} मैं साथ चलता हूँ।", "वाह {s} साथ में करते हैं।"],
    no: ["बिल्कुल ठीक है। कुछ भी करना ज़रूरी नहीं। मैं यहीं हूँ।", "ठीक है, जब तैयार हों तब।", "ठीक है {s} बस बात करना भी अच्छा है।"],
    unknown: ["शायद मैं सब कुछ नहीं समझ पाया, पर मैं सुन रहा हूँ। थोड़ा और बताइए, या नीचे कोई विषय दबाइए।", "हम्म… {s} मैं अभी सुनना सीख रहा पालतू हूँ। अभी आप कैसा महसूस कर रहे हैं?", "बताने के लिए शुक्रिया। आराम के तरीके चाहिए तो नीचे 'आराम के तरीके' दबाइए।"],
    followup: ["{topic} के बारे में और बताने के लिए शुक्रिया। लगता है आप इसे कुछ समय से उठाए हुए हैं। पहले छोटा ब्रेक लें, फिर धीरे-धीरे सोचें।", "अब थोड़ा बेहतर समझ आया। {topic} आसान नहीं है। आज ही सब हल करना ज़रूरी नहीं।", "मैं सुन रहा हूँ। {topic} किसी के लिए भी मुश्किल होता। चाहें तो नीचे का कार्ड आज़माइए।"],
    nudge: ["आज हमने काफ़ी बातें कीं। भरोसा करने के लिए शुक्रिया। मैं बस गेम का पालतू हूँ, तो आँखों को आराम दीजिए, पानी पीजिए, या किसी दोस्त को मैसेज कीजिए।", "{s} आपसे बात करना अच्छा लगता है, पर आपके आसपास के असली लोग भी आपकी बात सुनना चाहेंगे। किसी को मैसेज करें?", "काफ़ी देर से बात कर रहे हैं। उठकर थोड़ा स्ट्रेच कीजिए, और कभी भी वापस आइए।"]
};
CHAT_KEYS.hi = {
    greeting: ["नमस्ते", "नमस्कार", "हैलो", "हाय", "सुप्रभात", "namaste", "kaise ho"],
    mood_good: ["खुश", "ख़ुश", "अच्छा लग रहा", "बढ़िया", "मज़े में", "अच्छा हूँ", "ठीक हूँ", "शानदार", "khush", "badhiya", "accha lag raha"],
    mood_meh: ["ठीक-ठाक", "ठीकठाक", "कुछ खास नहीं", "ऐसे ही", "theek thaak", "thik thak"],
    mood_sad: ["उदास", "दुखी", "दुख", "रोना", "रो रही", "रो रहा", "मन नहीं लग", "निराश", "बुरा लग", "खुश नहीं", "अच्छा नहीं लग", "दिल टूट", "udaas", "dukhi", "bura lag", "sad hu"],
    mood_anxious: ["चिंता", "घबराहट", "घबरा", "डर लग", "बेचैन", "एंग्जायटी", "chinta", "ghabrahat", "dar lag", "bechain"],
    stressed: ["तनाव", "स्ट्रेस", "दबाव", "टेंशन", "tanav", "tension", "pressure"],
    stressed_work: ["काम", "ऑफिस", "दफ़्तर", "बॉस", "मीटिंग", "डेडलाइन", "नौकरी", "सहकर्मी", "क्लाइंट", "ओवरटाइम", "kaam", "office", "boss", "naukri"],
    burnout_tired: ["थक*", "थकान", "थकावट", "बर्नआउट", "ऊर्जा नहीं", "हिम्मत नहीं", "निढाल", "thak*", "thakan", "burnout"],
    sleep: ["नींद", "सो नहीं", "अनिद्रा", "रात भर जाग", "बुरे सपने", "सोना", "neend", "so nahi", "nind"],
    lonely: ["अकेला", "अकेली", "अकेलापन", "तन्हा", "कोई दोस्त नहीं", "कोई नहीं है", "akela", "akeli", "akelapan"],
    anger: ["गुस्सा", "ग़ुस्सा", "नाराज़", "नाराज", "चिढ़", "खीज", "gussa", "naraz", "chidh"],
    overthinking: ["ज़्यादा सोच", "ज्यादा सोच", "बहुत सोच", "सोचता रहता", "सोचती रहती", "दिमाग नहीं रुकता", "दिमाग़ नहीं रुकता", "overthinking", "bahut soch", "zyada soch"],
    self_criticism: ["मैं बेवकूफ", "मैं बेवकूफ़", "नाकाम", "मेरी गलती", "मेरी ग़लती", "खुद से नफरत", "ख़ुद से नफ़रत", "मैं अच्छा नहीं", "गलती कर दी", "मैं फेल", "meri galti", "main bekar", "fail ho gaya"],
    procrastination: ["टाल", "टालमटोल", "आलस", "मन नहीं करता", "शुरू नहीं कर पा", "ध्यान नहीं लगता", "फोन चलाता", "aalas", "taal raha", "procrastination"],
    relationship: ["परिवार", "घरवाले", "माँ", "मम्मी", "पापा", "पिता", "पति", "पत्नी", "बॉयफ्रेंड", "गर्लफ्रेंड", "झगड़ा", "ब्रेकअप", "रिश्ता", "रिश्ते", "दोस्त से", "सास", "ghar wale", "mummy", "papa", "breakup"],
    good_news: ["प्रमोशन", "पास हो", "सफल", "खुशखबरी", "ख़ुशख़बरी", "अच्छी खबर", "बोनस", "कर दिखाया", "गर्व", "जीत गया", "जीत गई", "promotion", "pass ho gaya"],
    gratitude: ["आभारी", "शुक्रगुज़ार", "शुक्रगुजार", "कृतज्ञ", "भाग्यशाली", "shukarguzar"],
    bored: ["बोर", "ऊब", "कुछ करने को नहीं", "bore ho"],
    ask_pet: ["तुम्हारा नाम", "तुम कौन", "तुम्हें क्या पसंद", "तुम क्या खाते", "तुम कैसे हो", "tumhara naam"],
    thanks: ["धन्यवाद", "शुक्रिया", "थैंक्स", "dhanyavad", "shukriya", "thanks"],
    bye: ["अलविदा", "फिर मिलेंगे", "शुभ रात्रि", "बाय", "चलता हूँ", "चलती हूँ", "bye", "good night"],
    ask_human: ["असली इंसान", "क्या तुम इंसान", "इंसान हो", "रोबोट", "एआई हो", "थेरेपिस्ट", "मनोवैज्ञानिक", "डॉक्टर हो", "काउंसलर", "insaan ho"],
    vent: ["भड़ास", "मन की बात", "बात करनी है", "सुन लो", "दिल हल्का", "baat karni hai"],
    ask_break: ["आराम के तरीके", "आराम", "ब्रेक", "रिलैक्स", "सुकून", "aaram"],
    ask_mission: ["मिशन", "क्या करूँ", "क्या करूं", "आज क्या करें", "सुझाव"],
    yes: ["हाँ", "हां", "जी", "ठीक है", "चलो", "ज़रूर", "ओके", "haan", "ok", "ha"],
    no: ["नहीं", "ना", "अभी नहीं", "बाद में", "nahi", "nahin"],
    kidding: ["मज़ाक", "मजाक", "यूँ ही कहा", "mazak", "majak"]
};

// =====================================================================
// Español
// =====================================================================
CHAT_UI.es = {
    btn: "Charlar", title: "Charla con {pet}", sub: "Solo en este dispositivo · no es una persona ni terapeuta",
    disclose: "{pet} es una mascota de un juego, no una persona ni un terapeuta. Las respuestas las escribió antes el equipo de Hikari y funcionan en este dispositivo. Lo que escribes no se envía a ningún sitio. Este chat no es un tratamiento ni un servicio de emergencia. Si no te sientes a salvo, toca el botón de llamada de arriba, es gratis.",
    keep: "Guardar los últimos 30 mensajes en este dispositivo", clear: "Borrar chat", cleared: "Chat borrado. No queda nada en este dispositivo.",
    placeholder: "Cuéntale lo que quieras a {pet}…", send: "Enviar", close: "Cerrar", typing: "{pet} está escribiendo…", help: "Necesito ayuda ahora",
    you: "Tú", chips: "Temas rápidos", input: "Mensaje para {pet}", after: "Gracias por charlar {s}",
    chip_vent: "Necesito desahogarme", chip_sleep: "No puedo dormir", chip_work: "Mucho trabajo", chip_lonely: "Me siento solo/a", chip_break: "Ideas para descansar", chip_stay: "Quédate conmigo",
    aiToggle: "Usar IA en línea (los mensajes se envían al servidor de Hikari para escribir respuestas)", aiNote: "El modo IA en línea está activado. Las respuestas vienen de una IA, no de una persona.",
    act_sigh: "Suspiro largo de 1 minuto", act_b48: "Respiración 4·8 antes de dormir", act_breathe: "Respirar despacio con tu mascota", act_qb: "Elegir una pausa de 1–5 min",
    act_stretch: "Estiramiento de 2 min en el escritorio", act_pmr: "Tensar y soltar 3 min", act_walk: "Paseo juntos de 5 min", act_step: "El siguiente paso pequeño",
    act_talk: "Hablar con alguien de confianza", act_letters: "Enviar una carta amable", act_help: "Necesito ayuda ahora",
    act_web_today: "Misión de hoy", act_web_assessment: "Test de estrés de 18 preguntas", act_web_burnout: "Test de burnout",
    act_web_rootcause: "Atacar la causa", act_web_sleep: "Causas: el sueño", act_web_selfcare: "Autocuidado (grounding)",
    act_web_moodscreen: "Cribado de depresión 2Q", act_web_videos: "Videos relajantes",
    sub_web: "Abre la web de Hikari", sub_web_moodscreen: "Si llevas más de 2 semanas triste casi todos los días · un primer cribado, no un diagnóstico", sub_game: "En el juego",
    topic_mood_sad: "la tristeza", topic_mood_anxious: "la preocupación", topic_stressed: "el estrés", topic_stressed_work: "el trabajo",
    topic_burnout_tired: "el agotamiento", topic_sleep: "el sueño", topic_lonely: "la soledad", topic_anger: "el enojo",
    topic_overthinking: "los pensamientos que dan vueltas", topic_self_criticism: "ser duro contigo", topic_procrastination: "empezar", topic_relationship: "la gente cercana"
};
CHAT_CRISIS.es = {
    text: "Gracias por contármelo. Parece que ahora mismo todo pesa muchísimo, y no tienes que pasar por esto a solas. Solo soy una mascota de un juego y no puedo ayudar en una emergencia, pero hay personas reales dispuestas a escucharte ahora, gratis. En Tailandia, llama a la línea de salud mental 1323 (24 horas). Si estás en peligro ahora, llama al 1669. Fuera de Tailandia, toca abajo para encontrar una línea de ayuda gratuita en tu país.",
    stay: "Sigo aquí. No hace falta que escribas nada. Prueba a apoyar los pies en el suelo y soltar el aire una vez, lento y largo. Cuando puedas, llama o escribe a alguien de confianza. Los botones de abajo siempre están ahí, gratis.",
    kidding: "Vale, gracias por decírmelo. Solo quiero que sepas que, si algún día te sientes así de verdad, los botones de abajo siempre están ahí, gratis, y nadie te va a juzgar."
};
CHAT.es = {
    intro: ["{s} Hola, soy {pet}. Cuéntame lo que quieras de tu día, o toca un tema abajo."],
    greet_none: ["{s} Qué bien que viniste a charlar. ¿Cómo está tu corazón hoy?", "¡Viniste! {s} ¿Cómo te sientes? Toca una carita abajo o escribe.", "{s} Aquí estoy. Cuéntame lo que quieras, o simplemente quedémonos en silencio juntos."],
    greet_low: ["Vi que hoy pesa un poco. Gracias por venir igual. ¿Quieres contármelo?", "Hoy pareces cansado/a. No hay prisa por hablar. Me quedo aquí contigo.", "En un día difícil, venir aquí ya es una forma de cuidarte. ¿Por dónde quieres empezar?"],
    greet_high: ["{s} ¡Hoy estás radiante! Me alegro mucho. ¿Qué lo hizo bueno?", "{s} Me alegra que hoy sea un buen día. ¿Quieres compartir algo?", "¡Bien {s} Guarda esta sensación un ratito más."],
    greeting: ["{s} ¡Hola! Me alegra que me saludes. ¿Qué tal tu día?", "Hola {s} Aquí estoy. ¿De qué quieres hablar?", "{s} Llegas justo a tiempo. ¿Estás cansado/a hoy?"],
    mood_good: ["{s} ¡Qué alegría! ¿Qué fue lo mejor de hoy?", "Genial {s} Haz una pausa de tres segundos y nota bien esta buena sensación.", "{s} Eso también me pone de buen humor. Podrías compartir este buen día con alguien."],
    mood_meh: ["Sentirse 'regular' está bien. No todos los días tienen que ser geniales. ¿Haces algo pequeño que te guste durante 5 minutos?", "Los días intermedios pasan mucho. ¿Damos un paseo corto juntos?", "Te entiendo. Algunos días simplemente pasan. Si algo te ronda la cabeza, te escucho."],
    mood_sad: ["Parece que hoy tu corazón pesa mucho. Gracias por contármelo. Estar triste no significa ser débil. ¿Quieres contarme qué pasó?", "Está bien estar triste. No tienes que hacer que se vaya. Pon una mano en el pecho y dite: esto es difícil ahora, y todo el mundo tiene días así.", "Aquí estoy. Si quieres llorar, está bien: el cuerpo suelta algo. Si tienes a alguien de confianza, un mensaje corto puede ayudar."],
    mood_anxious: ["Sentirse tan inquieto/a agota. Suspira conmigo: inhala por la nariz, toma un poquito más de aire y suéltalo largo por la boca. Hazlo 2–3 veces.", "La preocupación es tu cerebro intentando protegerte, pero a veces trabaja de más. ¿Puedes encontrar 5 cosas que veas a tu alrededor ahora?", "Estoy contigo {s} Apoya los pies en el suelo, siente tu peso y haz que cada exhalación sea más larga que la inhalación."],
    stressed: ["Parece que se ha acumulado mucho estrés. El estrés también vive en el cuerpo. Moverte o soltar el aire despacio un minuto le dice a tu cuerpo que ya está a salvo.", "Tiene todo el sentido sentirte estresado/a así. A cualquiera le costaría. ¿Qué es lo que más pesa ahora?", "{s} ¿Descansamos un minuto juntos? No tienes que resolverlo todo ahora. Primero deja que tu cuerpo suelte el aire."],
    stressed_work: ["Que el trabajo se acumule así cansa muchísimo. Saca todas las tareas de tu cabeza al papel y elige solo una, la más importante ahora.", "El trabajo suena muy intenso. El estrés laboral no es culpa tuya; algunas cosas también hay que arreglarlas en el sistema. ¿Te levantas a estirarte 2 minutos conmigo?", "En un día de trabajo tan pesado, agradécete por seguir ahí. ¿Qué tarea te pesa más?"],
    burnout_tired: ["Cuando estás así de agotado/a, tu cuerpo te dice que de verdad necesita descanso. ¿Hay algo que puedas soltar hoy?", "El burnout no significa que no seas suficiente. Es una señal de que llevas mucho tiempo dando demasiado. ¿Probamos 3 minutos de tensar y soltar?", "{s} Veo lo mucho que te has esforzado. Hoy hacer la mitad es suficiente."],
    sleep: ["No poder dormir es horrible. Inhala en 4 y exhala en 8 conmigo durante un minuto. No intentes dormir, solo deja que el cuerpo descanse.", "Si llevas unos 20 minutos sin dormir, levántate y haz algo tranquilo con luz tenue, y vuelve a la cama cuando tengas sueño.", "Las noches en que la mente no para, apunta un poco de lo que te ronda y dite: mañana me ocupo."],
    lonely: ["Gracias por decirme que te sientes solo/a. La soledad no significa que haya algo mal en ti. ¿Hay alguien a quien te gustaría escribir?", "Aquí estoy {s} pero solo soy una mascota de un juego. Escribir a una persona real, aunque sea una línea, ayuda mucho.", "Mucha gente se siente sola, sobre todo cuando hay mucho trabajo. Quizá puedas enviarle una carta amable a alguien."],
    anger: ["El enojo a menudo indica que se tocó algo importante para ti. Tiene mucha energía; caminar rápido o moverte ayuda a que salga.", "Está bien sentir irritación, no tienes que reprimirla. Haz dos suspiros largos antes de responder a nadie o decidir algo.", "Eso suena muy frustrante. ¿Qué fue lo que más te molestó?"],
    overthinking: ["~a Los pensamientos en bucle cansan mucho. Prueba a ponerle delante 'Estoy teniendo el pensamiento de que…' y míralo como una nube que pasa. No hace falta echarlo ni creer cada palabra.", "A la mente le encanta repetir '¿y si…?'. Vuelve al cuerpo: nombra 5 cosas que ves y toca 4 cosas a tu alrededor.", "~c Los pensamientos no siempre son hechos. Pregúntate: ¿qué pruebas van en contra de este pensamiento?"],
    self_criticism: ["Parece que la voz de tu cabeza está siendo muy dura. Si a una amiga o amigo cercano le pasara lo mismo, ¿qué le dirías?", "Equivocarse es parte de ser humano. Dite despacio: esto es difícil ahora, todo el mundo se equivoca, que pueda ser amable conmigo.", "~c 'No soy suficiente' es una trampa de pensamiento llamada etiquetar. Esta situación dice más de lo que pasó que de quién eres."],
    procrastination: ["No poder empezar no significa ser vago/a. A veces la tarea es tan grande que el cerebro no sabe por dónde agarrarla. ¿La reducimos a un paso de 2 minutos?", "Pon un temporizador de solo 5 minutos y dite que eso es todo. Una vez que empiezas, suele ser más fácil seguir.", "{s} ¿Cuál es el primer paso más pequeño, como solo abrir el archivo o escribir un título?"],
    relationship: ["Lo que pasa con la gente cercana suele doler más, porque nos importa mucho. Gracias por contarlo. ¿Quieres contarme más de lo que pasó?", "Las relaciones tensas desgastan. Decir 'Me siento… cuando…' en vez de culpar puede hacer más fácil hablar.", "A veces hablarlo con otra persona de confianza ayuda a verlo más claro. ¿Hay alguien a quien podrías contárselo?"],
    good_news: ["{s} ¡Bien! Me alegro muchísimo, ¡lo lograste! ¿Cómo te sentiste al saberlo?", "{s} ¡Increíble! No corras a lo siguiente. Date tiempo para disfrutar esto.", "Una noticia así merece celebrarse {s} Compártela con alguien que quieres y la alegría crece."],
    gratitude: ["{s} Qué bonito escuchar eso. Fijarte en cosas buenas así le da a tu corazón un lugar donde descansar.", "Gracias por compartir algo bueno. ¿Puedes pensar esta noche en dos cosas pequeñas más que agradeces?", "{s} Las pequeñas cosas buenas que notamos son como baterías de repuesto para el corazón."],
    bored: ["¿Aburrimiento? Dale a tu cuerpo un cambio de aires. Da un paseo de 5 minutos conmigo.", "El aburrimiento a veces es señal de que quieres algo nuevo. ¿Hay algo que antes te gustaba y hace tiempo que no haces?", "{s} ¿Jugamos? O mira un video corto y relajante en la web."],
    ask_pet: ["{s} Soy {pet}. Me encanta descansar en el Jardín de Luz, me encanta cuando vienes y me encanta respirar despacio juntos.", "Soy una mascotita de este juego {s} Mi trabajo es recordarte que descanses. ¿Has hecho una pausa hoy?", "{s} Hoy estoy bien. Dormí la siesta al sol y estaba calentito. ¿Y tú?"],
    thanks: ["{s} Cuando quieras. Gracias por ser amable contigo también.", "De nada {s} Me alegra que hayamos hablado.", "{s} ¡Con gusto! Cuídate mucho."],
    bye: ["{s} Gracias por pasar. Descansa bien.", "Adiós {s} Bebe un vaso de agua antes de irte.", "{s} Charlamos otra vez. Hoy lo hiciste bien."],
    ask_human: ["Soy una mascota de un juego, no una persona ni un terapeuta. Mis respuestas las escribió antes el equipo de Hikari y funcionan en este dispositivo. Si quieres hablar con una persona real, escribe a alguien de confianza o, en Tailandia, llama gratis a la línea de salud mental 1323, 24 horas.", "Te soy sincera: no soy una persona, ni médico, ni psicóloga. Solo soy una mascota de juego que te recuerda descansar. Para hablar con un profesional, en Tailandia puedes llamar gratis al 1323, o buscar una línea de ayuda de tu país.", "Soy un personaje de juego, no una persona real ni un terapeuta. No puedo diagnosticar ni tratar nada, pero puedo escucharte y sugerir pausas cortas. Para hablar con alguien, la línea 1323 escucha gratis, 24 horas."],
    vent: ["Te escucho. Escribe todo lo que quieras, no tiene que tener orden. Tus mensajes se quedan en este dispositivo.", "Suéltalo. No te voy a juzgar.", "Adelante {s} A veces solo decirlo aligera un poco el corazón."],
    listen: ["Mm… te escucho. Sigue.", "Gracias por contármelo. Eso también suena pesado.", "Aquí estoy. Tómate tu tiempo, sin prisa."],
    ask_break: ["{s} Elige la pausa que te guste: un suspiro de 1 minuto, un estiramiento de 2 o un paseo de 5 conmigo.", "Las pausas cortas ayudan de verdad. Al cuerpo le gusta moverse o soltar el aire largo. Elige una abajo.", "¡Claro! {s} Con 1–5 minutos basta. Elige una que puedas hacer ahora."],
    ask_mission: ["La misión de hoy en la web lleva solo unos minutos: un clip corto y 3 tareas pequeñas. ¿Quieres probar?", "{s} Si no sabes por dónde empezar, empieza por la misión de hoy en la web. Una tarea cada vez es suficiente.", "Te sugiero la misión de hoy en la web, o una pausa corta aquí en el juego. Elige lo que te apetezca."],
    yes: ["{s} ¡Vamos! Toca la tarjeta de abajo.", "Genial {s} Voy contigo.", "¡Bien {s} Lo hacemos juntos."],
    no: ["Está totalmente bien. No tienes que hacer nada. Aquí estoy.", "Vale, cuando estés listo/a.", "Vale {s} Charlar también está bien."],
    unknown: ["Quizá no lo entienda todo, pero te escucho. Cuéntame un poco más, o toca un tema abajo.", "Mm… {s} Todavía soy una mascota aprendiendo a escuchar. ¿Cómo te sientes ahora?", "Gracias por contármelo. Si quieres ideas para descansar, toca 'Ideas para descansar' abajo."],
    followup: ["Gracias por contarme más sobre {topic}. Parece que lo llevas cargando un tiempo. Haz primero una pausa corta y luego piénsalo poco a poco.", "Ahora lo entiendo un poco mejor. {topic} no es fácil. No tienes que arreglarlo todo hoy.", "Te escucho. A cualquiera le costaría {topic}. Si quieres, prueba una tarjeta de abajo."],
    nudge: ["Hoy hemos hablado mucho. Gracias por confiar en mí. Solo soy una mascota de un juego, así que quizá descansa la vista, bebe agua o escríbele a un amigo.", "{s} Me encanta charlar contigo, pero a la gente real de tu alrededor también le gustaría saber de ti. ¿Le escribes a alguien?", "Llevamos un buen rato charlando. Levántate, estírate un poco y vuelve cuando quieras."]
};
CHAT_KEYS.es = {
    greeting: ["hola", "buenos dias", "buenas tardes", "buenas", "que tal", "holi", "saludos"],
    mood_good: ["feliz", "content*", "bien", "genial", "muy bien", "alegre", "tranquil*", "de buen humor", "estupendo", "fenomenal"],
    mood_meh: ["mas o menos", "regular", "ahi vamos", "ni bien ni mal", "normal"],
    mood_sad: ["triste", "deprimid*", "llorar", "llorando", "llore", "mal", "fatal", "decaid*", "desanimad*", "no estoy bien", "me siento mal",
        "bajon", "dolid*", "tristeza", "nada bien", "hundid*"],
    mood_anxious: ["ansios*", "ansiedad", "nervios*", "preocupad*", "miedo", "panico", "angusti*", "inquiet*", "intranquil*"],
    stressed: ["estres*", "presion", "agobiad*", "abrumad*", "colapsad*", "saturad*"],
    stressed_work: ["trabajo", "jefe", "jefa", "reunion*", "oficina", "cliente*", "plazo*", "horas extra", "compañer*", "proyecto*", "entrega*", "curro", "chamba", "mucho trabajo"],
    burnout_tired: ["cansad*", "agotad*", "exhaust*", "quemad*", "sin energia", "sin fuerzas", "burnout", "rendid*", "fatiga", "reventad*"],
    sleep: ["dormir", "insomnio", "no puedo dormir", "desvelad*", "pesadilla*", "sueño", "me despierto", "duermo"],
    lonely: ["me siento solo", "me siento sola", "estoy solo", "estoy sola", "soledad", "solitari*", "sin amigos", "nadie con quien hablar", "aislad*"],
    anger: ["enojad*", "enfadad*", "furios*", "rabia", "molest*", "irritad*", "cabread*", "ira", "harto", "harta"],
    overthinking: ["pienso demasiado", "no paro de pensar", "sobrepens*", "darle vueltas", "dando vueltas", "rumi*", "mi mente no para", "overthinking", "y si pasa"],
    self_criticism: ["soy tonto", "soy tonta", "soy un fracaso", "fracas*", "no soy suficiente", "culpa mia", "es mi culpa", "me odio", "la cague",
        "soy un desastre", "me equivoque", "no valgo nada", "soy un inutil", "soy una inutil"],
    procrastination: ["procrastin*", "posterg*", "flojera", "pereza", "sin motivacion", "no puedo empezar", "no me concentro", "desmotivad*", "distraid*", "dejo todo para despues"],
    relationship: ["familia", "mama", "papa", "padres", "pareja", "novio", "novia", "esposo", "esposa", "marido", "ruptura", "terminamos", "pelea*",
        "discusion", "discuti*", "amig*", "relacion", "suegr*", "hermano", "hermana", "hijos"],
    good_news: ["ascen*", "aprobe", "pase el examen", "consegui", "lo logre", "logre", "buena noticia", "buenas noticias", "bono", "orgullos*", "gane", "exito", "me felicitaron"],
    gratitude: ["agradecid*", "gratitud", "afortunad*", "bendecid*", "doy gracias"],
    bored: ["aburrid*", "aburrimiento", "nada que hacer"],
    ask_pet: ["como te llamas", "tu nombre", "quien eres", "que eres", "que te gusta", "cuantos años", "que haces", "como estas"],
    thanks: ["gracias", "mil gracias", "te agradezco"],
    bye: ["adios", "chao", "chau", "hasta luego", "hasta mañana", "buenas noches", "nos vemos", "me voy", "me voy a dormir"],
    ask_human: ["eres real", "eres humano", "eres humana", "eres una persona", "persona real", "eres un bot", "eres una ia", "eres ia", "eres un robot",
        "terapeuta", "psicolog*", "psiquiatra", "eres medico", "consejer*"],
    vent: ["desahog*", "necesito hablar", "quiero hablar", "escuchame", "contarte algo", "sacarlo"],
    ask_break: ["descans*", "relaj*", "un respiro", "pausa", "calmarme", "ideas para descansar"],
    ask_mission: ["mision*", "que hago", "que puedo hacer", "recomiend*", "sugerencia"],
    yes: ["si", "vale", "claro", "ok", "de acuerdo", "dale", "bueno", "venga", "por que no", "va"],
    no: ["no", "nop", "ahora no", "luego", "mas tarde", "no gracias"],
    kidding: ["es broma", "era broma", "bromeando", "no lo decia en serio", "de broma"]
};

// =====================================================================
// Français
// =====================================================================
CHAT_UI.fr = {
    btn: "Discuter", title: "Discuter avec {pet}", sub: "Sur cet appareil uniquement · ni une personne ni un thérapeute",
    disclose: "{pet} est un animal de jeu, ni une personne ni un thérapeute. Les réponses ont été écrites à l'avance par l'équipe Hikari et fonctionnent sur cet appareil. Ce que vous écrivez n'est envoyé nulle part. Ce chat n'est ni un soin ni un service d'urgence. Si vous ne vous sentez pas en sécurité, touchez le bouton d'appel en haut, c'est gratuit.",
    keep: "Garder les 30 derniers messages sur cet appareil", clear: "Effacer le chat", cleared: "Chat effacé. Rien ne reste sur cet appareil.",
    placeholder: "Dites tout à {pet}…", send: "Envoyer", close: "Fermer", typing: "{pet} écrit…", help: "J'ai besoin d'aide maintenant",
    you: "Vous", chips: "Sujets rapides", input: "Message pour {pet}", after: "Merci pour la discussion {s}",
    chip_vent: "Besoin de vider mon sac", chip_sleep: "Je ne dors pas", chip_work: "Trop de travail", chip_lonely: "Je me sens seul·e", chip_break: "Idées de pause", chip_stay: "Reste avec moi",
    aiToggle: "Utiliser l'IA en ligne (les messages sont envoyés au serveur de Hikari pour écrire les réponses)", aiNote: "Le mode IA en ligne est activé. Les réponses viennent d'une IA, pas d'une personne.",
    act_sigh: "Long soupir d'1 minute", act_b48: "Respiration 4·8 avant de dormir", act_breathe: "Respirer lentement avec votre compagnon", act_qb: "Choisir une pause de 1 à 5 min",
    act_stretch: "Étirements de 2 min au bureau", act_pmr: "Contracter et relâcher 3 min", act_walk: "Marche ensemble 5 min", act_step: "Le prochain petit pas",
    act_talk: "En parler à une personne de confiance", act_letters: "Envoyer une lettre bienveillante", act_help: "J'ai besoin d'aide maintenant",
    act_web_today: "Mission du jour", act_web_assessment: "Test de stress en 18 questions", act_web_burnout: "Test d'épuisement",
    act_web_rootcause: "Agir sur la cause", act_web_sleep: "Les causes : le sommeil", act_web_selfcare: "Prendre soin de soi (ancrage)",
    act_web_moodscreen: "Dépistage de la dépression 2Q", act_web_videos: "Vidéos relaxantes",
    sub_web: "Ouvre le site Hikari", sub_web_moodscreen: "Si vous vous sentez déprimé·e presque tous les jours depuis plus de 2 semaines · un premier dépistage, pas un diagnostic", sub_game: "Dans le jeu",
    topic_mood_sad: "la tristesse", topic_mood_anxious: "l'inquiétude", topic_stressed: "le stress", topic_stressed_work: "le travail",
    topic_burnout_tired: "la fatigue", topic_sleep: "le sommeil", topic_lonely: "la solitude", topic_anger: "la colère",
    topic_overthinking: "les pensées qui tournent", topic_self_criticism: "la dureté envers vous-même", topic_procrastination: "le fait de commencer", topic_relationship: "vos proches"
};
CHAT_CRISIS.fr = {
    text: "Merci de me l'avoir dit. On dirait que c'est vraiment très lourd en ce moment, et vous n'avez pas à traverser ça sans soutien. Je ne suis qu'un animal de jeu et je ne peux pas aider en cas d'urgence, mais de vraies personnes sont prêtes à vous écouter maintenant, gratuitement. En Thaïlande, appelez la ligne de santé mentale 1323 (24 h/24). Si vous êtes en danger maintenant, appelez le 1669. Hors de Thaïlande, touchez ci-dessous pour trouver une ligne d'écoute gratuite dans votre pays.",
    stay: "Je suis toujours là. Pas besoin d'écrire quoi que ce soit. Essayez de poser les pieds bien à plat et de souffler une fois, lentement et longtemps. Quand vous pourrez, appelez ou écrivez à une personne de confiance. Les boutons ci-dessous sont toujours là, gratuits.",
    kidding: "D'accord, merci de me le dire. Je veux juste que vous sachiez que si un jour vous ressentez vraiment ça, les boutons ci-dessous sont toujours là, gratuits, et personne ne vous jugera."
};
CHAT.fr = {
    intro: ["{s} Bonjour, c'est moi, {pet}. Racontez-moi ce que vous voulez de votre journée, ou touchez un sujet ci-dessous."],
    greet_none: ["{s} Contente que vous veniez discuter. Comment va votre cœur aujourd'hui ?", "Vous êtes là ! {s} Comment vous sentez-vous ? Touchez un visage ci-dessous ou écrivez.", "{s} Je suis là. Dites-moi ce que vous voulez, ou restons simplement tranquilles ensemble."],
    greet_low: ["J'ai vu que la journée est lourde. Merci d'être venu·e quand même. Vous voulez m'en parler ?", "Vous avez l'air fatigué·e aujourd'hui. Rien ne presse pour parler. Je reste là avec vous.", "Un jour difficile, venir ici, c'est déjà prendre soin de soi. Par où voulez-vous commencer ?"],
    greet_high: ["{s} Vous rayonnez aujourd'hui ! Je suis heureuse pour vous. Qu'est-ce qui l'a rendue belle ?", "{s} Contente que ce soit une bonne journée. Quelque chose à partager ?", "Youpi {s} Gardez ce bon sentiment encore un moment."],
    greeting: ["{s} Bonjour ! Contente que vous me disiez bonjour. Comment se passe votre journée ?", "Coucou {s} Je suis là. De quoi voulez-vous parler ?", "{s} Pile au bon moment. Vous êtes fatigué·e aujourd'hui ?"],
    mood_good: ["{s} Je suis si contente pour vous ! Quel a été le meilleur moment de la journée ?", "Super {s} Faites une pause de trois secondes et remarquez bien ce bon sentiment.", "{s} Ça me met de bonne humeur aussi. Vous pourriez partager cette belle journée avec quelqu'un."],
    mood_meh: ["Se sentir 'bof', c'est normal. Tous les jours n'ont pas à être géniaux. Vous faites un petit truc que vous aimez pendant 5 minutes ?", "Les journées entre-deux arrivent souvent. On fait une petite promenade ensemble ?", "Je comprends. Certains jours passent juste comme ça. Si quelque chose vous travaille, je vous écoute."],
    mood_sad: ["On dirait que votre cœur est lourd aujourd'hui. Merci de me le dire. Être triste ne veut pas dire être faible. Vous voulez me raconter ce qui s'est passé ?", "C'est d'accord d'être triste. Pas besoin de la faire partir. Posez une main sur votre poitrine et dites-vous : c'est dur en ce moment, et tout le monde a des jours comme ça.", "Je suis là. Si vous avez envie de pleurer, c'est d'accord : le corps relâche quelque chose. Si vous avez une personne de confiance, un petit message peut aider."],
    mood_anxious: ["Se sentir si agité·e, c'est épuisant. Soupirez avec moi : inspirez par le nez, ajoutez encore un peu d'air, puis soufflez longtemps par la bouche. 2 ou 3 fois.", "L'inquiétude, c'est votre cerveau qui essaie de vous protéger, mais parfois il en fait trop. Pouvez-vous trouver 5 choses que vous voyez autour de vous ?", "Je suis avec vous {s} Posez les pieds au sol, sentez votre poids et faites chaque expiration plus longue que l'inspiration."],
    stressed: ["On dirait que beaucoup de stress s'est accumulé. Le stress vit aussi dans le corps. Bouger ou souffler lentement pendant une minute aide le corps à sentir qu'il est en sécurité.", "C'est tout à fait compréhensible d'être stressé·e comme ça. N'importe qui trouverait ça dur. Qu'est-ce qui pèse le plus en ce moment ?", "{s} Une minute de pause avec moi ? Pas besoin de tout régler maintenant. Laissez d'abord votre corps souffler."],
    stressed_work: ["Quand le travail s'empile comme ça, c'est vraiment fatigant. Sortez toutes les tâches de votre tête sur papier, puis choisissez-en une seule, la plus importante maintenant.", "Le travail a l'air très intense. Le stress au travail n'est pas votre faute ; certaines choses doivent aussi changer au niveau de l'organisation. On se lève pour s'étirer 2 minutes ensemble ?", "Par une journée de travail si lourde, remerciez-vous d'être encore là. Quelle tâche vous pèse le plus ?"],
    burnout_tired: ["Quand on est épuisé·e à ce point, le corps dit qu'il a vraiment besoin de repos. Y a-t-il une chose que vous pourriez poser aujourd'hui ?", "L'épuisement ne veut pas dire que vous n'êtes pas à la hauteur. C'est le signe que vous donnez trop depuis trop longtemps. On essaie 3 minutes de contracter-relâcher ?", "{s} Je vois combien vous avez fait d'efforts. Aujourd'hui, la moitié suffit."],
    sleep: ["Ne pas arriver à dormir, c'est pénible. Inspirez sur 4 et expirez sur 8 avec moi pendant une minute. Pas besoin d'essayer de dormir, laissez juste le corps se reposer.", "Si vous ne dormez pas depuis une vingtaine de minutes, levez-vous et faites quelque chose de calme sous une lumière douce, puis retournez au lit quand le sommeil vient.", "Les nuits où la tête ne s'arrête pas, notez un peu ce qui vous trotte dans la tête, puis dites-vous : je verrai ça demain."],
    lonely: ["Merci de me dire que vous vous sentez seul·e. La solitude ne veut pas dire que quelque chose cloche chez vous. Y a-t-il quelqu'un à qui vous aimeriez écrire ?", "Je suis là {s} mais je ne suis qu'un animal de jeu. Écrire à une vraie personne, même une seule ligne, peut beaucoup aider.", "Beaucoup de gens se sentent seuls, surtout quand le travail déborde. Vous pourriez envoyer une lettre bienveillante à quelqu'un."],
    anger: ["La colère signale souvent qu'une chose importante pour vous a été touchée. Elle a beaucoup d'énergie ; marcher vite ou bouger l'aide à sortir.", "C'est d'accord d'être agacé·e, pas besoin de le retenir. Faites deux longs soupirs avant de répondre à qui que ce soit ou de décider quoi que ce soit.", "Ça a l'air vraiment énervant. Qu'est-ce qui vous a le plus touché·e ?"],
    overthinking: ["~a Les pensées qui tournent en boucle, c'est épuisant. Ajoutez devant 'J'ai la pensée que…' et regardez-la passer comme un nuage. Pas besoin de la chasser ni de croire chaque mot.", "La tête adore rejouer 'et si…'. Revenez au corps : nommez 5 choses que vous voyez et touchez 4 choses autour de vous.", "~c Les pensées ne sont pas toujours des faits. Demandez-vous : quelles preuves vont contre cette pensée ?"],
    self_criticism: ["On dirait que la voix dans votre tête est très dure. Si un·e ami·e proche vivait la même chose, que lui diriez-vous ?", "Se tromper fait partie de l'humain. Dites-vous lentement : c'est dur en ce moment, tout le monde se trompe, puis-je être doux·ce avec moi-même.", "~c 'Je ne suis pas assez bien' est un piège de pensée appelé étiquetage. Cette situation parle plus de ce qui s'est passé que de qui vous êtes."],
    procrastination: ["Ne pas arriver à commencer ne veut pas dire être paresseux·se. Parfois la tâche est si grosse que le cerveau ne sait pas par où la prendre. On la réduit à un pas de 2 minutes ?", "Mettez un minuteur de 5 minutes seulement et dites-vous que c'est tout. Une fois lancé·e, c'est souvent plus facile de continuer.", "{s} Quel est le plus petit premier pas, comme juste ouvrir le fichier ou écrire un titre ?"],
    relationship: ["Ce qui se passe avec nos proches fait souvent plus mal, parce qu'on tient à eux. Merci de partager. Vous voulez m'en dire plus sur ce qui s'est passé ?", "Les relations tendues épuisent. Dire 'Je me sens… quand…' plutôt que de reprocher peut rendre la discussion plus facile.", "Parfois en parler à une autre personne de confiance aide à y voir plus clair. Y a-t-il quelqu'un à qui vous pourriez le dire ?"],
    good_news: ["{s} Youpi ! Je suis si contente pour vous, vous l'avez fait ! Qu'avez-vous ressenti en l'apprenant ?", "{s} Bravo ! Ne filez pas tout de suite vers la suite. Prenez le temps d'en profiter.", "Une nouvelle pareille mérite d'être fêtée {s} Partagez-la avec quelqu'un que vous aimez, la joie grandit."],
    gratitude: ["{s} Ça fait chaud au cœur. Remarquer de bonnes choses comme ça donne au cœur un endroit où se reposer.", "Merci de partager quelque chose de bien. Ce soir, pourriez-vous penser à deux autres petites choses pour lesquelles vous êtes reconnaissant·e ?", "{s} Les petites bonnes choses qu'on remarque sont comme des batteries de secours pour le cœur."],
    bored: ["Vous vous ennuyez ? Offrez un changement d'air à votre corps. Une marche de 5 minutes avec moi.", "L'ennui est parfois le signe qu'on a envie de nouveauté. Y a-t-il quelque chose que vous aimiez faire et que vous n'avez pas fait depuis longtemps ?", "{s} On joue ? Ou regardez une courte vidéo relaxante sur le site."],
    ask_pet: ["{s} Je suis {pet}. J'adore paresser dans le Jardin de Lumière, j'adore quand vous venez, et j'adore respirer lentement ensemble.", "Je suis un petit animal de ce jeu {s} Mon travail, c'est de vous rappeler de faire des pauses. Vous en avez fait une aujourd'hui ?", "{s} Je vais bien aujourd'hui. J'ai fait la sieste au soleil, il faisait tout chaud. Et vous ?"],
    thanks: ["{s} Quand vous voulez. Merci d'être doux·ce avec vous-même aussi.", "Avec plaisir {s} Contente qu'on ait discuté.", "{s} De rien ! Prenez soin de vous."],
    bye: ["{s} Merci d'être passé·e. Reposez-vous bien.", "Au revoir {s} Buvez un verre d'eau avant de partir.", "{s} On rediscute bientôt. Vous avez bien fait aujourd'hui."],
    ask_human: ["Je suis un animal de jeu, ni une personne ni un thérapeute. Mes réponses ont été écrites à l'avance par l'équipe Hikari et fonctionnent sur cet appareil. Pour parler à une vraie personne, contactez quelqu'un de confiance ou, en Thaïlande, appelez gratuitement la ligne de santé mentale 1323, 24 h/24.", "Pour être honnête : je ne suis ni une personne, ni un médecin, ni un·e psychologue. Juste un animal de jeu qui vous rappelle de faire des pauses. Pour parler à un professionnel, en Thaïlande vous pouvez appeler gratuitement le 1323, ou chercher une ligne d'écoute dans votre pays.", "Je suis un personnage de jeu, pas une vraie personne ni un thérapeute. Je ne peux rien diagnostiquer ni soigner, mais je peux écouter et proposer de petites pauses. Pour parler à quelqu'un, la ligne 1323 écoute gratuitement, 24 h/24."],
    vent: ["Je vous écoute. Écrivez autant que vous voulez, pas besoin que ce soit ordonné. Vos messages restent sur cet appareil.", "Videz votre sac. Je ne vous jugerai pas.", "Allez-y {s} Parfois, juste le dire allège un peu le cœur."],
    listen: ["Mm… je vous écoute. Continuez.", "Merci de me le dire. Ça a l'air lourd aussi.", "Je suis là. Prenez votre temps, rien ne presse."],
    ask_break: ["{s} Choisissez la pause qui vous plaît : un soupir d'1 minute, des étirements de 2 minutes ou une marche de 5 minutes avec moi.", "Les courtes pauses aident vraiment. Le corps aime bouger ou souffler longtemps. Choisissez-en une ci-dessous.", "Bien sûr ! {s} 1 à 5 minutes suffisent. Choisissez ce que vous pouvez faire maintenant."],
    ask_mission: ["La mission du jour sur le site ne prend que quelques minutes : un court clip et 3 petites tâches. Vous essayez ?", "{s} Si vous ne savez pas par où commencer, commencez par la mission du jour sur le site. Une tâche à la fois suffit.", "Je vous propose la mission du jour sur le site, ou une petite pause ici dans le jeu. Choisissez ce qui vous fait envie."],
    yes: ["{s} C'est parti ! Touchez la carte ci-dessous.", "Super {s} Je viens avec vous.", "Youpi {s} On le fait ensemble."],
    no: ["Aucun souci. Vous n'avez rien à faire. Je suis là.", "D'accord, quand vous serez prêt·e.", "D'accord {s} Discuter, c'est bien aussi."],
    unknown: ["Je ne comprends peut-être pas tout, mais je vous écoute. Dites-m'en un peu plus, ou touchez un sujet ci-dessous.", "Hum… {s} Je suis encore un animal qui apprend à écouter. Comment vous sentez-vous en ce moment ?", "Merci de me le dire. Si vous voulez des idées de pause, touchez 'Idées de pause' ci-dessous."],
    followup: ["Merci de m'en dire plus sur {topic}. On dirait que vous portez ça depuis un moment. Faites d'abord une petite pause, puis réfléchissez-y petit à petit.", "Je comprends un peu mieux maintenant. {topic}, ce n'est pas facile. Vous n'avez pas à tout régler aujourd'hui.", "Je vous écoute. N'importe qui trouverait {topic} difficile. Si vous voulez, essayez une carte ci-dessous."],
    nudge: ["On a beaucoup discuté aujourd'hui. Merci de votre confiance. Je ne suis qu'un animal de jeu, alors reposez peut-être vos yeux, buvez de l'eau ou écrivez à un·e ami·e.", "{s} J'adore discuter avec vous, mais les vraies personnes autour de vous aimeraient aussi avoir de vos nouvelles. Vous écrivez à quelqu'un ?", "Ça fait un moment qu'on discute. Levez-vous, étirez-vous un peu, et revenez quand vous voulez."]
};
CHAT_KEYS.fr = {
    greeting: ["bonjour", "salut", "coucou", "bonsoir", "hello", "allo"],
    mood_good: ["heureux", "heureuse", "content", "contente", "bien", "super", "ca va bien", "joyeu*", "de bonne humeur", "detendu*", "en forme", "genial"],
    mood_meh: ["bof", "couci couca", "comme ci comme ca", "moyen", "pas terrible", "ca va"],
    mood_sad: ["triste", "deprim*", "pleur*", "malheureu*", "mal", "pas bien", "cafard", "le moral", "abattu*", "decu*", "chagrin", "je vais mal", "tristesse"],
    mood_anxious: ["anxi*", "angoiss*", "inquiet*", "nerveu*", "peur", "panique", "tendu*", "stresse pour"],
    stressed: ["stress*", "pression", "debord*", "surmen*", "sous l eau", "a cran"],
    stressed_work: ["travail", "boulot", "chef", "patron", "reunion*", "bureau", "client*", "delai*", "deadline*", "heures sup*", "collegue*", "projet*", "taf", "manager", "trop de travail"],
    burnout_tired: ["fatigu*", "epuis*", "crev*", "a bout", "burn out", "burnout", "vide", "videe", "plus d energie", "lessive*", "a plat"],
    sleep: ["dormir", "insomnie", "sommeil", "nuit blanche", "cauchemar*", "je dors mal", "je me reveille", "endormir", "je ne dors pas", "dors pas"],
    lonely: ["seul", "seule", "solitude", "isol*", "sans amis", "personne a qui parler"],
    anger: ["colere", "enerv*", "furieu*", "agace*", "irrite*", "rage", "en rogne", "marre"],
    overthinking: ["je pense trop", "trop reflechir", "rumin*", "cogit*", "mes pensees tournent", "je n arrete pas de penser", "en boucle", "ma tete ne s arrete pas"],
    self_criticism: ["je suis nul", "je suis nulle", "je suis bete", "echec", "j ai rate", "pas assez bien", "c est ma faute", "ma faute", "je me deteste",
        "incapable", "je me suis plante*", "je suis une merde", "je fais tout mal"],
    procrastination: ["procrastin*", "remettre a plus tard", "flemme", "pas de motivation", "demotiv*", "je n arrive pas a commencer", "pas concentre*", "distrait*", "je repousse"],
    relationship: ["famille", "mere", "maman", "pere", "papa", "parents", "copain", "copine", "mari", "femme", "couple", "rupture", "dispute*",
        "relation", "ami", "amie", "amis", "belle mere", "frere", "soeur", "enfants"],
    good_news: ["promu*", "promotion", "reussi*", "bonne nouvelle", "augmentation", "prime", "fier", "fiere", "gagne", "j y suis arrive*", "admis*", "felicite*"],
    gratitude: ["reconnaissant*", "gratitude", "chanceu*", "la chance d avoir"],
    bored: ["ennui", "je m ennuie", "ennuy*", "rien a faire"],
    ask_pet: ["comment tu t appelles", "ton nom", "qui es tu", "tu aimes", "quel age", "tu fais quoi", "comment vas tu", "ca va toi"],
    thanks: ["merci", "merci beaucoup"],
    bye: ["au revoir", "a plus", "bonne nuit", "a bientot", "a demain", "bye", "je file", "je vais dormir", "je vais me coucher"],
    ask_human: ["tu es reel*", "tu es humain*", "une vraie personne", "vraie personne", "un robot", "une ia", "tu es une ia", "therapeute", "psycholog*", "psychiatre", "medecin", "un bot"],
    vent: ["vider mon sac", "me confier", "besoin de parler", "envie de parler", "ecoute moi", "raler"],
    ask_break: ["pause", "me detendre", "detente", "relax*", "souffler", "me calmer", "me reposer", "idees de pause"],
    ask_mission: ["mission*", "que faire", "quoi faire", "suggestion", "conseille*"],
    yes: ["oui", "ouais", "d accord", "ok", "vas y", "allons y", "pourquoi pas", "volontiers", "carrement", "ok d accord"],
    no: ["non", "pas maintenant", "plus tard", "non merci", "nan"],
    kidding: ["je plaisante", "je rigole", "c etait une blague", "une blague", "pour rire"]
};

// =====================================================================
// Português
// =====================================================================
CHAT_UI.pt = {
    btn: "Conversar", title: "Conversar com {pet}", sub: "Só neste dispositivo · não é uma pessoa nem terapeuta",
    disclose: "{pet} é um bichinho de jogo, não é uma pessoa nem terapeuta. As respostas foram escritas antes pela equipe Hikari e funcionam neste dispositivo. O que você digita não é enviado para lugar nenhum. Este chat não é tratamento nem serviço de emergência. Se não se sentir em segurança, toque no botão de ligação lá em cima, é grátis.",
    keep: "Guardar as últimas 30 mensagens neste dispositivo", clear: "Apagar conversa", cleared: "Conversa apagada. Nada ficou neste dispositivo.",
    placeholder: "Conte qualquer coisa para {pet}…", send: "Enviar", close: "Fechar", typing: "{pet} está digitando…", help: "Preciso de ajuda agora",
    you: "Você", chips: "Temas rápidos", input: "Mensagem para {pet}", after: "Obrigado pela conversa {s}",
    chip_vent: "Preciso desabafar", chip_sleep: "Não consigo dormir", chip_work: "Muito trabalho", chip_lonely: "Me sinto só", chip_break: "Ideias de pausa", chip_stay: "Fica comigo",
    aiToggle: "Usar IA online (as mensagens são enviadas ao servidor da Hikari para escrever respostas)", aiNote: "O modo IA online está ligado. As respostas vêm de uma IA, não de uma pessoa.",
    act_sigh: "Suspiro longo de 1 minuto", act_b48: "Respiração 4·8 antes de dormir", act_breathe: "Respirar devagar com seu bichinho", act_qb: "Escolher uma pausa de 1–5 min",
    act_stretch: "Alongamento de 2 min na mesa", act_pmr: "Contrair e soltar 3 min", act_walk: "Caminhada juntos de 5 min", act_step: "O próximo passinho",
    act_talk: "Falar com alguém de confiança", act_letters: "Enviar uma carta gentil", act_help: "Preciso de ajuda agora",
    act_web_today: "Missão de hoje", act_web_assessment: "Teste de estresse de 18 perguntas", act_web_burnout: "Teste de burnout",
    act_web_rootcause: "Cuidar da causa", act_web_sleep: "Causas: o sono", act_web_selfcare: "Autocuidado (grounding)",
    act_web_moodscreen: "Triagem de depressão 2Q", act_web_videos: "Vídeos relaxantes",
    sub_web: "Abre o site da Hikari", sub_web_moodscreen: "Se você se sente pra baixo quase todo dia há mais de 2 semanas · uma triagem inicial, não um diagnóstico", sub_game: "No jogo",
    topic_mood_sad: "a tristeza", topic_mood_anxious: "a preocupação", topic_stressed: "o estresse", topic_stressed_work: "o trabalho",
    topic_burnout_tired: "o cansaço", topic_sleep: "o sono", topic_lonely: "a solidão", topic_anger: "a raiva",
    topic_overthinking: "os pensamentos que giram", topic_self_criticism: "ser duro consigo", topic_procrastination: "começar", topic_relationship: "as pessoas próximas"
};
CHAT_CRISIS.pt = {
    text: "Obrigado por me contar. Parece que agora está muito pesado, e você não precisa enfrentar isso sem apoio. Eu sou só um bichinho de jogo e não consigo ajudar numa emergência, mas pessoas de verdade estão prontas para te ouvir agora, de graça. Na Tailândia, ligue para a linha de saúde mental 1323 (24 horas). Se você está em perigo agora, ligue 1669. Fora da Tailândia, toque abaixo para encontrar uma linha de apoio gratuita no seu país.",
    stay: "Ainda estou aqui. Não precisa digitar nada. Tente apoiar os pés no chão e soltar o ar uma vez, bem devagar e longo. Quando puder, ligue ou mande mensagem para alguém de confiança. Os botões abaixo estão sempre aí, grátis.",
    kidding: "Tudo bem, obrigado por me dizer. Só quero que você saiba: se algum dia você sentir isso de verdade, os botões abaixo estão sempre aí, grátis, e ninguém vai te julgar."
};
CHAT.pt = {
    intro: ["{s} Oi, sou eu, {pet}. Me conte qualquer coisa do seu dia, ou toque num tema abaixo."],
    greet_none: ["{s} Que bom que você veio conversar. Como está seu coração hoje?", "Você veio! {s} Como está se sentindo? Toque numa carinha abaixo ou escreva.", "{s} Estou aqui. Conte o que quiser, ou só ficamos quietinhos juntos."],
    greet_low: ["Vi que hoje está pesado. Obrigado por vir mesmo assim. Quer me contar?", "Você parece cansado hoje. Sem pressa para falar. Fico aqui com você.", "Num dia difícil, vir aqui já é uma forma de se cuidar. Por onde quer começar?"],
    greet_high: ["{s} Você está radiante hoje! Fico muito feliz. O que deixou o dia bom?", "{s} Que bom que hoje é um dia bom. Quer compartilhar algo?", "Oba {s} Segure esse sentimento bom mais um pouquinho."],
    greeting: ["{s} Oi! Que bom que você me chamou. Como está seu dia?", "Olá {s} Estou aqui. Sobre o que quer conversar?", "{s} Chegou na hora certa. Está cansado hoje?"],
    mood_good: ["{s} Que alegria! Qual foi a melhor parte de hoje?", "Que ótimo {s} Pare três segundos e sinta bem essa sensação boa.", "{s} Isso me deixa de bom humor também. Você pode compartilhar esse dia bom com alguém."],
    mood_meh: ["Sentir-se 'mais ou menos' tudo bem. Nem todo dia precisa ser ótimo. Que tal fazer algo pequeno que você gosta por 5 minutos?", "Dias assim no meio do caminho acontecem muito. Vamos dar uma volta curta juntos?", "Entendo. Alguns dias só passam. Se algo estiver na sua cabeça, estou ouvindo."],
    mood_sad: ["Parece que seu coração está pesado hoje. Obrigado por me contar. Ficar triste não quer dizer ser fraco. Quer me contar o que aconteceu?", "Tudo bem ficar triste. Você não precisa fazer passar. Coloque a mão no peito e diga a si mesmo: isso está difícil agora, e todo mundo tem dias assim.", "Estou aqui. Se quiser chorar, tudo bem: o corpo solta alguma coisa. Se tiver alguém de confiança, uma mensagem curta pode ajudar."],
    mood_anxious: ["Sentir-se tão inquieto cansa demais. Suspire comigo: inspire pelo nariz, puxe mais um pouquinho de ar e solte longo pela boca. Faça 2–3 vezes.", "A preocupação é seu cérebro tentando te proteger, mas às vezes ele trabalha demais. Consegue achar 5 coisas que você vê ao seu redor agora?", "Estou com você {s} Apoie os pés no chão, sinta seu peso e deixe cada expiração mais longa que a inspiração."],
    stressed: ["Parece que muito estresse se acumulou. O estresse também mora no corpo. Mexer-se ou soltar o ar devagar por um minuto ajuda o corpo a saber que está seguro.", "Faz todo sentido se sentir estressado assim. Qualquer um acharia difícil. O que está pesando mais agora?", "{s} Uma pausa de um minuto comigo? Você não precisa resolver tudo agora. Primeiro deixe o corpo soltar o ar."],
    stressed_work: ["Trabalho acumulando assim cansa muito. Tire todas as tarefas da cabeça para o papel e escolha só uma, a mais importante agora.", "O trabalho parece muito intenso. Estresse no trabalho não é culpa sua; algumas coisas precisam mudar no sistema também. Vamos levantar e alongar 2 minutos juntos?", "Num dia de trabalho tão pesado, agradeça a si mesmo por continuar. Qual tarefa pesa mais em você?"],
    burnout_tired: ["Quando você está esgotado assim, o corpo está dizendo que precisa mesmo descansar. Tem uma coisa que você poderia largar hoje?", "Burnout não quer dizer que você não é bom o bastante. É sinal de que você está dando demais há tempo demais. Vamos tentar 3 minutos de contrair e soltar?", "{s} Eu vejo o quanto você tem se esforçado. Hoje, fazer metade já basta."],
    sleep: ["Não conseguir dormir é muito ruim. Inspire contando 4 e expire contando 8 comigo por um minuto. Não tente dormir, só deixe o corpo descansar.", "Se você está há uns 20 minutos sem dormir, levante e faça algo calmo com luz baixa, e volte para a cama quando bater o sono.", "Nas noites em que a cabeça não para, anote um pouco do que está te rondando e diga a si mesmo: amanhã eu vejo isso."],
    lonely: ["Obrigado por me dizer que se sente só. Solidão não quer dizer que tem algo errado com você. Tem alguém com quem você gostaria de falar?", "Estou aqui {s} mas sou só um bichinho de jogo. Mandar mensagem para uma pessoa de verdade, mesmo uma linha, ajuda muito.", "Muita gente se sente sozinha, principalmente quando o trabalho aperta. Talvez você possa mandar uma carta gentil para alguém."],
    anger: ["A raiva muitas vezes mostra que algo importante para você foi atingido. Ela tem muita energia; caminhar rápido ou se mexer ajuda a pôr para fora.", "Tudo bem ficar irritado, você não precisa engolir. Dê dois suspiros longos antes de responder alguém ou decidir algo.", "Isso parece muito frustrante. O que mais te incomodou?"],
    overthinking: ["~a Pensamentos em looping cansam demais. Tente colocar na frente 'Estou tendo o pensamento de que…' e olhe para ele como uma nuvem passando. Não precisa expulsar nem acreditar em cada palavra.", "A mente adora repetir 'e se…'. Volte para o corpo: diga 5 coisas que você vê e toque 4 coisas ao seu redor.", "~c Pensamentos nem sempre são fatos. Pergunte a si mesmo: que evidências vão contra esse pensamento?"],
    self_criticism: ["Parece que a voz na sua cabeça está sendo muito dura. Se um amigo próximo passasse pela mesma coisa, o que você diria para ele?", "Errar faz parte de ser humano. Diga devagar para si mesmo: isso está difícil agora, todo mundo erra, que eu possa ser gentil comigo.", "~c 'Não sou bom o bastante' é uma armadilha de pensamento chamada rotular. Essa situação diz mais sobre o que aconteceu do que sobre quem você é."],
    procrastination: ["Não conseguir começar não quer dizer preguiça. Às vezes a tarefa é tão grande que o cérebro não sabe por onde pegar. Vamos diminuir para um passo de 2 minutos?", "Coloque um timer de só 5 minutos e diga a si mesmo que é só isso. Depois de começar, costuma ficar mais fácil continuar.", "{s} Qual é o menor primeiro passo, tipo só abrir o arquivo ou escrever um título?"],
    relationship: ["O que acontece com pessoas próximas costuma doer mais, porque a gente se importa muito. Obrigado por contar. Quer me contar mais sobre o que aconteceu?", "Relações tensas desgastam. Dizer 'Eu me sinto… quando…' em vez de culpar pode facilitar a conversa.", "Às vezes conversar com outra pessoa de confiança ajuda a ver mais claro. Tem alguém para quem você poderia contar?"],
    good_news: ["{s} Oba! Fico muito feliz, você conseguiu! Como se sentiu quando soube?", "{s} Incrível! Não corra para a próxima coisa. Dê um tempo para curtir isso.", "Uma notícia dessas merece comemoração {s} Conte para alguém que você ama, e a alegria cresce."],
    gratitude: ["{s} Que gostoso ouvir isso. Notar coisas boas assim dá ao coração um lugar para descansar.", "Obrigado por compartilhar algo bom. Hoje à noite, consegue pensar em mais duas coisinhas pelas quais é grato?", "{s} As pequenas coisas boas que notamos são como baterias reserva para o coração."],
    bored: ["Entediado? Dê uma mudança de ares para o corpo. Faça uma caminhada de 5 minutos comigo.", "O tédio às vezes é sinal de que você quer algo novo. Tem algo que você gostava de fazer e não faz há tempo?", "{s} Vamos brincar? Ou veja um vídeo curto e relaxante no site."],
    ask_pet: ["{s} Eu sou {pet}. Adoro descansar no Jardim de Luz, adoro quando você vem e adoro respirar devagar juntos.", "Sou um bichinho deste jogo {s} Meu trabalho é lembrar você de descansar. Você fez uma pausa hoje?", "{s} Estou bem hoje. Tirei um cochilo no sol e estava quentinho. E você?"],
    thanks: ["{s} Sempre que quiser. Obrigado por ser gentil com você também.", "De nada {s} Que bom que conversamos.", "{s} Por nada! Se cuida."],
    bye: ["{s} Obrigado por passar aqui. Descanse bem.", "Tchau {s} Beba um copo de água antes de ir.", "{s} Conversamos de novo. Você foi bem hoje."],
    ask_human: ["Eu sou um bichinho de jogo, não sou uma pessoa nem terapeuta. Minhas respostas foram escritas antes pela equipe Hikari e funcionam neste dispositivo. Se quiser falar com uma pessoa de verdade, procure alguém de confiança ou, na Tailândia, ligue grátis para a linha de saúde mental 1323, 24 horas.", "Para ser sincero: não sou uma pessoa, nem médico, nem psicólogo. Sou só um bichinho de jogo que lembra você de descansar. Para falar com um profissional, na Tailândia você pode ligar grátis para 1323, ou procurar uma linha de apoio do seu país.", "Sou um personagem de jogo, não uma pessoa real nem terapeuta. Não consigo diagnosticar nem tratar nada, mas posso ouvir e sugerir pausas curtas. Para falar com alguém, a linha 1323 ouve de graça, 24 horas."],
    vent: ["Estou ouvindo. Escreva o quanto quiser, não precisa ter ordem. Suas mensagens ficam neste dispositivo.", "Pode desabafar. Não vou te julgar.", "Pode falar {s} Às vezes só dizer já deixa o coração um pouco mais leve."],
    listen: ["Hum… estou ouvindo. Continue.", "Obrigado por me contar. Isso também parece pesado.", "Estou aqui. Vá no seu tempo, sem pressa."],
    ask_break: ["{s} Escolha a pausa que você gosta: um suspiro de 1 minuto, um alongamento de 2 ou uma caminhada de 5 comigo.", "Pausas curtas ajudam de verdade. O corpo gosta de se mexer ou soltar o ar longo. Escolha uma abaixo.", "Claro! {s} 1–5 minutos bastam. Escolha uma que dê para fazer agora."],
    ask_mission: ["A missão de hoje no site leva só alguns minutos: um clipe curto e 3 tarefinhas. Quer tentar?", "{s} Se não souber por onde começar, comece pela missão de hoje no site. Uma tarefa de cada vez basta.", "Sugiro a missão de hoje no site, ou uma pausa curta aqui no jogo. Escolha o que tiver vontade."],
    yes: ["{s} Vamos! Toque no cartão abaixo.", "Ótimo {s} Vou com você.", "Oba {s} Vamos fazer juntos."],
    no: ["Tudo bem mesmo. Você não precisa fazer nada. Estou aqui.", "Certo, quando estiver pronto.", "Tá bom {s} Só conversar também é bom."],
    unknown: ["Talvez eu não entenda tudo, mas estou ouvindo. Conte um pouco mais, ou toque num tema abaixo.", "Hum… {s} Ainda sou um bichinho aprendendo a ouvir. Como você está se sentindo agora?", "Obrigado por me contar. Se quiser ideias de pausa, toque em 'Ideias de pausa' abaixo."],
    followup: ["Obrigado por me contar mais sobre {topic}. Parece que você carrega isso há um tempo. Faça uma pausa curta primeiro e depois pense aos pouquinhos.", "Agora entendo um pouco melhor. {topic} não é fácil. Você não precisa resolver tudo hoje.", "Estou ouvindo. Qualquer um acharia {topic} difícil. Se quiser, tente um cartão abaixo."],
    nudge: ["Conversamos bastante hoje. Obrigado por confiar em mim. Sou só um bichinho de jogo, então talvez descanse os olhos, beba água ou mande mensagem para um amigo.", "{s} Adoro conversar com você, mas as pessoas de verdade ao seu redor também gostariam de ouvir você. Que tal mandar mensagem para alguém?", "Já conversamos um tempão. Levante, alongue um pouco e volte quando quiser."]
};
CHAT_KEYS.pt = {
    greeting: ["ola", "oi", "bom dia", "boa tarde", "e ai", "oie", "eae"],
    mood_good: ["feliz", "bem", "contente", "otimo", "otima", "alegre", "tranquil*", "de bom humor", "animad*", "de boa"],
    mood_meh: ["mais ou menos", "normal", "assim assim", "nada demais", "indo"],
    mood_sad: ["triste", "deprimid*", "chorar", "chorando", "chorei", "mal", "pra baixo", "desanimad*", "magoad*", "nao estou bem", "me sinto mal", "abatid*", "tristeza", "na bad"],
    mood_anxious: ["ansios*", "ansiedade", "nervos*", "preocupad*", "medo", "panico", "aflit*", "inquiet*", "apreensiv*"],
    stressed: ["estress*", "pressao", "sobrecarregad*", "sufocad*", "no limite"],
    stressed_work: ["trabalho", "chefe", "reuniao", "reunioes", "escritorio", "cliente*", "prazo*", "hora extra", "colega*", "projeto*", "emprego", "firma", "muito trabalho"],
    burnout_tired: ["cansad*", "exaust*", "esgotad*", "sem energia", "sem forcas", "burnout", "acabad*", "fadiga", "morto de cansaco"],
    sleep: ["dormir", "insonia", "nao consigo dormir", "sono", "pesadelo*", "acordo de madrugada", "virei a noite", "durmo"],
    lonely: ["sozinho", "sozinha", "solidao", "solitari*", "sem amigos", "isolad*", "ninguem para conversar", "me sinto so"],
    anger: ["raiva", "irritad*", "bravo", "brava", "furios*", "com odio", "chatead*", "puto da vida", "de saco cheio"],
    overthinking: ["penso demais", "pensando demais", "nao paro de pensar", "minha cabeca nao para", "rumin*", "encucad*", "overthinking", "pensamento acelerado"],
    self_criticism: ["sou burro", "sou burra", "fracass*", "sou um fracasso", "nao sou bom", "nao sou boa", "culpa minha", "me odeio", "errei",
        "estraguei tudo", "nao sirvo pra nada", "sou um inutil", "faco tudo errado"],
    procrastination: ["procrastin*", "adiando", "adiar", "preguica", "sem motivacao", "nao consigo comecar", "desconcentrad*", "distraid*", "enrolando"],
    relationship: ["familia", "mae", "pai", "pais", "namorad*", "marido", "esposa", "mulher", "briga*", "discuti*", "terminamos", "terminou comigo",
        "separacao", "relacionamento", "amig*", "sogr*", "irma", "irmao", "filhos"],
    good_news: ["promovid*", "promocao", "passei", "consegui", "boa noticia", "boas noticias", "aumento", "bonus", "orgulho*", "ganhei", "deu certo", "aprovad*"],
    gratitude: ["grato", "grata", "gratidao", "agradecid*", "sortud*", "abencoad*"],
    bored: ["entediad*", "tedio", "chato", "nada para fazer", "nada pra fazer"],
    ask_pet: ["qual seu nome", "como voce se chama", "quem e voce", "o que voce gosta", "quantos anos", "o que voce faz", "como voce esta"],
    thanks: ["obrigad*", "valeu", "agradeco"],
    bye: ["tchau", "ate logo", "ate mais", "boa noite", "ate amanha", "falou", "vou dormir"],
    ask_human: ["voce e real", "voce e humano", "voce e uma pessoa", "pessoa de verdade", "e um robo", "voce e um robo", "voce e uma ia", "e uma ia", "terapeuta", "psicolog*", "psiquiatra", "medico"],
    vent: ["desabaf*", "preciso falar", "quero conversar", "me escuta", "botar pra fora"],
    ask_break: ["pausa", "descans*", "relax*", "me acalmar", "intervalo", "ideias de pausa"],
    ask_mission: ["missao", "missoes", "o que eu faco", "o que fazer", "sugest*", "recomend*"],
    yes: ["sim", "claro", "ok", "beleza", "bora", "pode ser", "vamos", "ta", "uhum", "quero", "ta bom"],
    no: ["nao", "agora nao", "depois", "mais tarde", "nao obrigado", "nao obrigada"],
    kidding: ["brincadeira", "to brincando", "estou brincando", "zoeira", "nao e serio", "zoando"]
};

// =====================================================================
// Русский
// =====================================================================
CHAT_UI.ru = {
    btn: "Поболтать", title: "Разговор с {pet}", sub: "Только на этом устройстве · не человек и не психотерапевт",
    disclose: "{pet} — питомец из игры, не человек и не психотерапевт. Ответы заранее написала команда Hikari, и они работают на этом устройстве. То, что вы пишете, никуда не отправляется. Этот чат не лечение и не экстренная служба. Если вы не чувствуете себя в безопасности, сразу нажмите кнопку звонка вверху, это бесплатно.",
    keep: "Хранить последние 30 сообщений на этом устройстве", clear: "Очистить чат", cleared: "Чат очищен. На устройстве ничего не осталось.",
    placeholder: "Расскажите {pet} что угодно…", send: "Отправить", close: "Закрыть", typing: "{pet} печатает…", help: "Мне нужна помощь сейчас",
    you: "Вы", chips: "Быстрые темы", input: "Сообщение для {pet}", after: "Спасибо за разговор {s}",
    chip_vent: "Хочу выговориться", chip_sleep: "Не могу уснуть", chip_work: "Много работы", chip_lonely: "Одиноко", chip_break: "Как отдохнуть", chip_stay: "Побудь со мной",
    aiToggle: "Использовать онлайн-ИИ (сообщения отправляются на сервер Hikari, чтобы написать ответ)", aiNote: "Режим онлайн-ИИ включён. Ответы пишет ИИ, а не человек.",
    act_sigh: "Долгий вздох, 1 минута", act_b48: "Дыхание 4·8 перед сном", act_breathe: "Медленно дышать с питомцем", act_qb: "Выбрать перерыв на 1–5 мин",
    act_stretch: "Разминка за столом, 2 мин", act_pmr: "Напрячь и расслабить, 3 мин", act_walk: "Прогулка вместе, 5 мин", act_step: "Следующий маленький шаг",
    act_talk: "Поговорить с тем, кому доверяете", act_letters: "Отправить доброе письмо", act_help: "Мне нужна помощь сейчас",
    act_web_today: "Задание на сегодня", act_web_assessment: "Тест на стресс из 18 вопросов", act_web_burnout: "Проверка на выгорание",
    act_web_rootcause: "Работать с причиной", act_web_sleep: "Причины: сон", act_web_selfcare: "Забота о себе (заземление)",
    act_web_moodscreen: "Скрининг депрессии 2Q", act_web_videos: "Расслабляющие видео",
    sub_web: "Открывает сайт Hikari", sub_web_moodscreen: "Если почти каждый день плохое настроение дольше 2 недель · первичный скрининг, не диагноз", sub_game: "В игре",
    topic_mood_sad: "грусть", topic_mood_anxious: "тревогу", topic_stressed: "стресс", topic_stressed_work: "работу",
    topic_burnout_tired: "усталость", topic_sleep: "сон", topic_lonely: "одиночество", topic_anger: "злость",
    topic_overthinking: "мысли по кругу", topic_self_criticism: "строгость к себе", topic_procrastination: "трудный старт", topic_relationship: "близких людей"
};
CHAT_CRISIS.ru = {
    text: "Спасибо, что сказали мне. Похоже, сейчас очень тяжело, и вам не нужно справляться с этим в одиночку. Я всего лишь питомец из игры и не могу помочь в экстренной ситуации, но живые люди готовы выслушать вас прямо сейчас, бесплатно. В Таиланде звоните на линию психологической помощи 1323 (круглосуточно). Если вы сейчас в опасности, звоните 1669. Если вы не в Таиланде, нажмите ниже, чтобы найти бесплатную линию помощи в вашей стране.",
    stay: "Я всё ещё здесь. Не нужно ничего писать. Попробуйте поставить ступни на пол и один раз медленно, долго выдохнуть. Когда сможете, позвоните или напишите тому, кому доверяете. Кнопки ниже всегда на месте, бесплатно.",
    kidding: "Хорошо, спасибо, что сказали. Просто знайте: если когда-нибудь вы правда почувствуете такое, кнопки ниже всегда на месте, бесплатно, и никто вас не осудит."
};
CHAT.ru = {
    intro: ["{s} Привет, это я, {pet}. Расскажите что угодно о своём дне или нажмите тему ниже."],
    greet_none: ["{s} Рада, что вы зашли поболтать. Как вы сегодня?", "Вы пришли! {s} Как настроение? Нажмите на мордочку ниже или просто напишите.", "{s} Я здесь. Расскажите что угодно, или давайте просто посидим тихо вместе."],
    greet_low: ["Вижу, сегодня тяжело на душе. Спасибо, что всё равно зашли. Хотите рассказать?", "Вы сегодня кажетесь уставшими. Не спешите говорить. Я посижу рядом.", "В трудный день прийти сюда — это уже забота о себе. С чего хотите начать?"],
    greet_high: ["{s} Сегодня вы сияете! Я так рада за вас. Что сделало день хорошим?", "{s} Как здорово, что сегодня хороший день. Хотите чем-то поделиться?", "Ура {s} Задержите это хорошее чувство ещё ненадолго."],
    greeting: ["{s} Привет! Рада, что вы поздоровались. Как проходит день?", "Привет {s} Я здесь. О чём хотите поговорить?", "{s} Вы как раз вовремя. Устали сегодня?"],
    mood_good: ["{s} Как я рада за вас! Что было лучшим сегодня?", "Чудесно {s} Остановитесь на три секунды и хорошенько заметьте это приятное чувство.", "{s} У меня от этого тоже поднялось настроение. Этим хорошим днём можно поделиться с кем-нибудь."],
    mood_meh: ["Чувствовать себя «так себе» — нормально. Не каждый день должен быть отличным. Сделаете что-то маленькое и приятное на 5 минут?", "Такие средние дни бывают часто. Прогуляемся немного вместе?", "Понимаю. Некоторые дни просто проходят. Если что-то на душе, я слушаю."],
    mood_sad: ["Похоже, сегодня на сердце тяжело. Спасибо, что рассказали. Грусть не значит, что вы слабы. Хотите рассказать, что случилось?", "Грустить — это нормально. Не нужно срочно от этого избавляться. Положите руку на грудь и скажите себе: сейчас правда тяжело, и у всех бывают такие дни.", "Я здесь. Если хочется плакать — можно, тело так что-то отпускает. Если есть человек, которому вы доверяете, короткое сообщение ему может помочь."],
    mood_anxious: ["Такое беспокойство очень выматывает. Вздохните со мной: вдох через нос, ещё немного добавьте, потом долгий выдох ртом. 2–3 раза.", "Тревога — это мозг, который пытается вас защитить, но иногда он слишком старается. Сможете найти вокруг 5 вещей, которые видите?", "Я с вами {s} Поставьте ступни на пол, почувствуйте свой вес и делайте выдох длиннее вдоха."],
    stressed: ["Похоже, накопилось много стресса. Стресс живёт и в теле. Минута движения или медленного выдоха помогает телу понять, что теперь безопасно.", "Такой стресс — совершенно понятная реакция. Любому было бы тяжело. Что сейчас давит сильнее всего?", "{s} Отдохнём минутку вместе? Не нужно решать всё прямо сейчас. Сначала дайте телу выдохнуть."],
    stressed_work: ["Когда работа так наваливается, это правда утомляет. Выпишите все задачи из головы на бумагу и выберите только одну, самую важную сейчас.", "Работа звучит очень напряжённо. Рабочий стресс — не ваша вина, некоторые вещи нужно менять на уровне системы. Встанем и потянемся 2 минуты вместе?", "В такой тяжёлый рабочий день скажите себе спасибо за то, что держитесь. Какая задача давит больше всего?"],
    burnout_tired: ["Когда вы так вымотаны, тело говорит, что ему правда нужен отдых. Есть что-то одно, что можно сегодня отложить?", "Выгорание не значит, что вы недостаточно хороши. Это знак, что вы слишком долго отдавали слишком много. Попробуем 3 минуты напрячь и расслабить?", "{s} Я вижу, как сильно вы стараетесь. Сегодня и половины достаточно."],
    sleep: ["Не спать — мучительно. Вдохните на 4 и выдохните на 8 вместе со мной минуту. Не старайтесь уснуть, просто дайте телу отдохнуть.", "Если не получается уснуть минут 20, встаньте, займитесь чем-то спокойным при тусклом свете и вернитесь в постель, когда захочется спать.", "В ночи, когда голова не останавливается, коротко запишите, что крутится в мыслях, и скажите себе: подумаю завтра."],
    lonely: ["Спасибо, что сказали, что вам одиноко. Одиночество не значит, что с вами что-то не так. Есть кто-то, кому хотелось бы написать?", "Я здесь {s} но я всего лишь питомец из игры. Написать живому человеку, даже одну строчку, может очень помочь.", "Многие чувствуют одиночество, особенно когда много работы. Может, отправить кому-нибудь доброе письмо?"],
    anger: ["Злость часто показывает, что задето что-то важное для вас. В ней много энергии: быстрая ходьба или движение помогают её выпустить.", "Раздражаться — нормально, не нужно это подавлять. Сделайте два долгих вздоха, прежде чем кому-то отвечать или что-то решать.", "Звучит очень обидно и злит. Что задело сильнее всего?"],
    overthinking: ["~a Мысли по кругу так выматывают. Добавьте в начале «Я замечаю мысль, что…» и смотрите на неё, как на проплывающее облако. Не нужно прогонять её или верить каждому слову.", "Голова любит прокручивать «а вдруг…». Вернитесь в тело: назовите 5 вещей, которые видите, и потрогайте 4 вещи вокруг.", "~c Мысли не всегда факты. Спросите себя: какие доказательства говорят против этой мысли?"],
    self_criticism: ["Похоже, внутренний голос очень строг к вам. Если бы близкий друг оказался в той же ситуации, что бы вы ему сказали?", "Ошибаться — часть человеческой жизни. Медленно скажите себе: сейчас трудно, все ошибаются, пусть я буду к себе добрее.", "~c «Я недостаточно хорош» — это ловушка мышления под названием «ярлык». Эта ситуация говорит больше о том, что случилось, чем о том, кто вы."],
    procrastination: ["Не получается начать — это не лень. Иногда задача так велика, что мозг не знает, за что взяться. Уменьшим её до шага на 2 минуты?", "Поставьте таймер всего на 5 минут и скажите себе, что этого достаточно. Когда начнёшь, продолжать обычно легче.", "{s} Какой самый маленький первый шаг, например просто открыть файл или написать один заголовок?"],
    relationship: ["То, что происходит с близкими, часто ранит сильнее, потому что они нам дороги. Спасибо, что поделились. Хотите рассказать подробнее, что случилось?", "Напряжённые отношения изматывают. Сказать «Я чувствую… когда…» вместо упрёков может облегчить разговор.", "Иногда разговор с другим человеком, которому вы доверяете, помогает увидеть всё яснее. Есть кому рассказать?"],
    good_news: ["{s} Ура! Я так рада за вас, у вас получилось! Что вы почувствовали, когда узнали?", "{s} Потрясающе! Не спешите к следующему делу. Дайте себе время порадоваться.", "Такую новость нужно отпраздновать {s} Поделитесь ею с тем, кого любите, и радости станет больше."],
    gratitude: ["{s} Как тепло это слышать. Замечать такое хорошее — значит давать сердцу место для отдыха.", "Спасибо, что поделились хорошим. Сможете вечером вспомнить ещё две маленькие вещи, за которые вы благодарны?", "{s} Маленькие хорошие вещи, которые мы замечаем, — как запасные батарейки для сердца."],
    bored: ["Скучно? Дайте телу сменить обстановку. Прогуляйтесь со мной 5 минут.", "Скука иногда значит, что хочется чего-то нового. Есть то, что вы раньше любили, но давно не делали?", "{s} Поиграем? Или посмотрите короткое расслабляющее видео на сайте."],
    ask_pet: ["{s} Я {pet}. Обожаю валяться в Саду света, обожаю, когда вы приходите, и обожаю медленно дышать вместе.", "Я маленький питомец из этой игры {s} Моя работа — напоминать вам отдыхать. Вы сегодня делали перерыв?", "{s} У меня сегодня всё хорошо. Подремала на солнышке, было так тепло. А у вас?"],
    thanks: ["{s} Всегда пожалуйста. И спасибо, что бережёте себя.", "Не за что {s} Рада, что мы поговорили.", "{s} Пожалуйста! Берегите себя."],
    bye: ["{s} Спасибо, что заглянули. Хорошо отдохните.", "Пока-пока {s} Выпейте стакан воды перед уходом.", "{s} Поболтаем ещё. Вы сегодня молодец."],
    ask_human: ["Я питомец из игры, не человек и не психотерапевт. Мои ответы заранее написала команда Hikari, и они работают на этом устройстве. Если хотите поговорить с живым человеком, напишите тому, кому доверяете, или в Таиланде бесплатно позвоните на линию психологической помощи 1323, круглосуточно.", "Честно: я не человек, не врач и не психолог. Я просто игровой питомец, который напоминает отдыхать. Чтобы поговорить со специалистом, в Таиланде можно бесплатно позвонить на 1323 или найти линию помощи в вашей стране.", "Я игровой персонаж, не живой человек и не психотерапевт. Я не могу ставить диагнозы или лечить, но могу выслушать и предложить короткий перерыв. Чтобы поговорить с человеком, линия 1323 слушает бесплатно и круглосуточно."],
    vent: ["Я слушаю. Пишите сколько хотите, не обязательно складно. Ваши сообщения остаются на этом устройстве.", "Выговоритесь. Я не буду вас судить.", "Говорите {s} Иногда, просто сказав, становится немного легче."],
    listen: ["Мм… я слушаю. Продолжайте.", "Спасибо, что рассказали. Это тоже звучит тяжело.", "Я здесь. Не торопитесь."],
    ask_break: ["{s} Выберите перерыв по душе: вздох на 1 минуту, разминка на 2 или прогулка со мной на 5.", "Короткие перерывы правда помогают. Телу нравится двигаться или долго выдыхать. Выберите что-нибудь ниже.", "Конечно! {s} Хватит и 1–5 минут. Выберите то, что можно сделать прямо сейчас."],
    ask_mission: ["Задание на сегодня на сайте займёт всего несколько минут: короткий ролик и 3 маленьких дела. Попробуете?", "{s} Если не знаете, с чего начать, начните с задания на сегодня на сайте. По одному делу за раз достаточно.", "Предлагаю задание на сегодня на сайте или короткий перерыв здесь, в игре. Выберите, что хочется."],
    yes: ["{s} Поехали! Нажмите карточку ниже.", "Отлично {s} Я с вами.", "Ура {s} Сделаем вместе."],
    no: ["Всё в порядке. Ничего делать не нужно. Я здесь.", "Хорошо, когда будете готовы.", "Ладно {s} Просто поболтать тоже хорошо."],
    unknown: ["Может, я поняла не всё, но я слушаю. Расскажите чуть больше или нажмите тему ниже.", "Хм… {s} Я ещё учусь слушать. Как вы себя сейчас чувствуете?", "Спасибо, что рассказали. Если нужны идеи для отдыха, нажмите «Как отдохнуть» ниже."],
    followup: ["Спасибо, что рассказали больше про {topic}. Похоже, вы несёте это уже какое-то время. Сначала сделайте короткий перерыв, а потом думайте понемногу.", "Теперь я понимаю чуть лучше. Пережить {topic} непросто. Не нужно решать всё сегодня.", "Я слушаю. Любому было бы трудно пережить {topic}. Если хотите, попробуйте карточку ниже."],
    nudge: ["Мы сегодня много разговаривали. Спасибо за доверие. Я всего лишь питомец из игры, так что, может, дайте глазам отдохнуть, выпейте воды или напишите другу.", "{s} Мне нравится с вами болтать, но живым людям вокруг вас тоже хочется вас услышать. Напишете кому-нибудь?", "Мы уже долго болтаем. Встаньте, немного потянитесь и возвращайтесь в любое время."]
};
CHAT_KEYS.ru = {
    greeting: ["привет", "здравствуи*", "добрыи день", "доброе утро", "добрыи вечер", "хаи", "приветик", "здорово"],
    mood_good: ["хорошо", "отлично", "счастлив*", "радост*", "рад", "рада", "весело", "спокоино", "прекрасно", "супер"],
    mood_meh: ["нормально", "так себе", "средне", "пойдет", "норм", "ничего особенного"],
    mood_sad: ["грустно", "груст*", "печал*", "плачу", "плакать", "плохо", "тоскл*", "тоска", "расстро*", "подавлен*", "уныл*", "на душе тяжело", "хреново"],
    mood_anxious: ["тревож*", "тревога", "волну*", "беспоко*", "страшно", "страх", "паник*", "нервнича*", "нервы"],
    stressed: ["стресс*", "давлен*", "напряж*", "завал", "не справляюсь"],
    stressed_work: ["работ*", "начальни*", "босс*", "совещан*", "дедлаин*", "офис*", "клиент*", "переработ*", "коллег*", "проект*", "шеф*", "много работы"],
    burnout_tired: ["устал*", "устаю", "усталость", "выгоран*", "выгорел*", "нет сил", "измотан*", "вымотан*", "обессил*", "истощ*"],
    sleep: ["не могу уснуть", "не сплю", "бессонниц*", "уснуть", "засыпать", "кошмар*", "сон", "спать", "просыпаюсь ночью", "недосып*"],
    lonely: ["одинок*", "одиночеств*", "совсем один", "совсем одна", "я один", "я одна", "не с кем поговорить", "нет друзеи"],
    anger: ["злюсь", "злость", "зол", "зла", "бесит", "раздража*", "ярость", "сержусь", "в бешенстве"],
    overthinking: ["слишком много думаю", "не могу перестать думать", "мысли крутятся", "накручива*", "загоняюсь", "прокручива*", "зацикл*", "а вдруг"],
    self_criticism: ["я дурак", "я дура", "я неудачни*", "неудач*", "моя вина", "я виноват*", "ненавижу себя", "я бесполез*", "облажал*", "у меня ничего не получается", "я никчемн*"],
    procrastination: ["прокрастин*", "откладыва*", "лень", "нет мотивации", "не могу начать", "не могу сосредоточиться", "отвлека*", "залипаю в телефоне"],
    relationship: ["семья", "семье", "семьеи", "мама", "мамои", "папа", "родител*", "муж", "мужем", "жена", "женои", "парень", "девушка", "ссор*", "расстал*",
        "отношени*", "друг", "друзья", "подруг*", "свекров*", "теща", "брат", "сестра"],
    good_news: ["повысили", "повышени*", "сдал*", "получилось", "хорошая новость", "хорошие новости", "премия", "премию", "горжусь", "победил*", "выиграл*", "успех", "справил*"],
    gratitude: ["благодар*", "признател*", "повезло", "ценю"],
    bored: ["скучно", "скука", "нечего делать"],
    ask_pet: ["как тебя зовут", "кто ты", "что ты любишь", "сколько тебе лет", "что делаешь", "как ты", "как дела"],
    thanks: ["спасибо", "спс", "благодарю"],
    bye: ["пока", "до свидания", "спокоинои ночи", "до завтра", "увидимся", "бываи", "поиду спать"],
    ask_human: ["ты человек", "ты настоящ*", "живои человек", "ты бот", "ты робот", "ты ии", "искусственныи интеллект", "психолог*", "психотерапевт*", "психиатр", "врач"],
    vent: ["выговор*", "хочу поговорить", "нужно поговорить", "выслушаи", "излить душу", "пожаловаться"],
    ask_break: ["отдохн*", "отдых", "расслаб*", "передышк*", "перерыв", "успокоиться", "как отдохнуть"],
    ask_mission: ["задани*", "мисси*", "что делать", "что мне делать", "посоветуи", "предлож*"],
    yes: ["да", "давай", "ок", "хорошо", "конечно", "ладно", "ага", "угу", "можно", "даваи"],
    no: ["нет", "не хочу", "потом", "не сеичас", "неа"],
    kidding: ["шучу", "шутка", "пошутил*", "не всерьез"]
};

// =====================================================================
// العربية (فصحى مبسطة + كلمات عامية شائعة في قائمة الكلمات)
// =====================================================================
CHAT_UI.ar = {
    btn: "دردشة", title: "دردشة مع {pet}", sub: "على هذا الجهاز فقط · ليس إنسانًا ولا معالجًا",
    disclose: "{pet} حيوان أليف في لعبة، وليس إنسانًا ولا معالجًا نفسيًا. كتب فريق Hikari الردود مسبقًا، وهي تعمل على هذا الجهاز. ما تكتبه لا يُرسل إلى أي مكان. هذه الدردشة ليست علاجًا ولا خدمة طوارئ. إذا لم تشعر بالأمان، اضغط زر الاتصال في الأعلى فورًا، مجانًا.",
    keep: "احفظ آخر 30 رسالة على هذا الجهاز", clear: "مسح الدردشة", cleared: "تم مسح الدردشة. لم يبقَ شيء على هذا الجهاز.",
    placeholder: "قل لـ{pet} أي شيء…", send: "إرسال", close: "إغلاق", typing: "{pet} يكتب…", help: "أحتاج مساعدة الآن",
    you: "أنت", chips: "مواضيع سريعة", input: "رسالة إلى {pet}", after: "شكرًا على الدردشة {s}",
    chip_vent: "أريد أن أفضفض", chip_sleep: "لا أستطيع النوم", chip_work: "شغل كثير", chip_lonely: "أشعر بالوحدة", chip_break: "أفكار للاستراحة", chip_stay: "ابقَ معي",
    aiToggle: "استخدام الذكاء الاصطناعي عبر الإنترنت (تُرسل الرسائل إلى خادم Hikari لكتابة الردود)", aiNote: "وضع الذكاء الاصطناعي مفعّل. الردود من ذكاء اصطناعي، لا من إنسان.",
    act_sigh: "تنهيدة طويلة لمدة دقيقة", act_b48: "تنفس 4·8 قبل النوم", act_breathe: "تنفس ببطء مع حيوانك", act_qb: "اختر استراحة من 1 إلى 5 دقائق",
    act_stretch: "تمدد على المكتب لمدة دقيقتين", act_pmr: "شد العضلات وإرخاؤها 3 دقائق", act_walk: "مشي معًا 5 دقائق", act_step: "الخطوة الصغيرة التالية",
    act_talk: "تحدث مع شخص تثق به", act_letters: "أرسل رسالة لطيفة", act_help: "أحتاج مساعدة الآن",
    act_web_today: "مهمة اليوم", act_web_assessment: "اختبار التوتر من 18 سؤالًا", act_web_burnout: "فحص الاحتراق الوظيفي",
    act_web_rootcause: "التعامل مع السبب", act_web_sleep: "الأسباب: النوم", act_web_selfcare: "العناية بالنفس (التأريض)",
    act_web_moodscreen: "فحص الاكتئاب 2Q", act_web_videos: "فيديوهات مريحة",
    sub_web: "يفتح موقع Hikari", sub_web_moodscreen: "إذا شعرت بالحزن معظم الأيام لأكثر من أسبوعين · فحص أولي وليس تشخيصًا", sub_game: "في اللعبة",
    topic_mood_sad: "الحزن", topic_mood_anxious: "القلق", topic_stressed: "التوتر", topic_stressed_work: "العمل",
    topic_burnout_tired: "التعب", topic_sleep: "النوم", topic_lonely: "الوحدة", topic_anger: "الغضب",
    topic_overthinking: "الأفكار التي تدور", topic_self_criticism: "القسوة على نفسك", topic_procrastination: "صعوبة البدء", topic_relationship: "المقربين منك"
};
CHAT_CRISIS.ar = {
    text: "شكرًا لأنك أخبرتني. يبدو أن الأمر ثقيل جدًا الآن، ولست مضطرًا لمواجهته وحدك. أنا مجرد حيوان أليف في لعبة ولا أستطيع المساعدة في حالة طارئة، لكن هناك أشخاصًا حقيقيين مستعدين للاستماع إليك الآن، مجانًا. في تايلاند اتصل بخط الصحة النفسية 1323 (24 ساعة). إذا كنت في خطر الآن، اتصل بـ 1669. خارج تايلاند، اضغط بالأسفل لتجد خط مساعدة مجانيًا في بلدك.",
    stay: "ما زلت هنا. لا داعي لكتابة أي شيء. جرّب أن تضع قدميك على الأرض وتُخرج نفسًا واحدًا ببطء وطويلًا. عندما تستطيع، اتصل أو راسل شخصًا تثق به. الأزرار بالأسفل موجودة دائمًا، مجانًا.",
    kidding: "حسنًا، شكرًا لأنك أخبرتني. أريدك فقط أن تعرف: إذا شعرت بذلك حقًا في أي يوم، فالأزرار بالأسفل موجودة دائمًا، مجانًا، ولن يحكم عليك أحد."
};
CHAT.ar = {
    intro: ["{s} مرحبًا، أنا {pet}. احكِ لي أي شيء عن يومك، أو اضغط موضوعًا بالأسفل."],
    greet_none: ["{s} سعيد لأنك جئت للدردشة. كيف حال قلبك اليوم؟", "وصلت! {s} كيف تشعر الآن؟ اضغط على وجه بالأسفل أو اكتب.", "{s} أنا هنا. قل ما تشاء، أو لنجلس معًا بهدوء."],
    greet_low: ["رأيت أن اليوم ثقيل عليك. شكرًا لأنك جئت رغم ذلك. هل تحب أن تحكي لي؟", "تبدو متعبًا اليوم. لا داعي للعجلة في الكلام. سأجلس هنا معك.", "في يوم صعب، مجيئك إلى هنا هو بالفعل عناية بنفسك. من أين تحب أن نبدأ؟"],
    greet_high: ["{s} أنت مشرق اليوم! أنا سعيد جدًا لأجلك. ما الذي جعل يومك جميلًا؟", "{s} يسعدني أن اليوم يوم جيد. هل هناك شيء تحب مشاركته؟", "رائع {s} احتفظ بهذا الشعور الجميل قليلًا بعد."],
    greeting: ["{s} مرحبًا! سعيد لأنك سلّمت عليّ. كيف يمر يومك؟", "أهلًا {s} أنا هنا. عن ماذا تحب أن نتحدث؟", "{s} جئت في الوقت المناسب. هل أنت متعب اليوم؟"],
    mood_good: ["{s} أنا سعيد جدًا لأجلك! ما أجمل لحظة في يومك؟", "جميل {s} توقف ثلاث ثوانٍ ولاحظ هذا الشعور الطيب جيدًا.", "{s} هذا يحسّن مزاجي أنا أيضًا. يمكنك أن تشارك هذا اليوم الجميل مع أحد."],
    mood_meh: ["أن تشعر بأنك «عادي» أمر لا بأس به. ليس كل يوم يجب أن يكون رائعًا. ما رأيك أن تفعل شيئًا صغيرًا تحبه لمدة 5 دقائق؟", "الأيام المتوسطة تحدث كثيرًا. هل نتمشى قليلًا معًا؟", "أفهمك. بعض الأيام تمر هكذا فقط. إذا كان في بالك شيء، أنا أستمع."],
    mood_sad: ["يبدو أن قلبك مثقل اليوم. شكرًا لأنك أخبرتني. الحزن لا يعني أنك ضعيف. هل تحب أن تحكي لي ما حدث؟", "لا بأس أن تحزن، ولا داعي لأن تطرده. ضع يدك على صدرك وقل لنفسك: هذا صعب الآن، والجميع يمرون بأيام كهذه.", "أنا هنا. إذا أردت البكاء فلا بأس، فالجسم يتخلص من شيء ما. إذا كان هناك شخص تثق به، فرسالة قصيرة له قد تساعد."],
    mood_anxious: ["هذا القلق متعب جدًا. تنهّد معي: خذ نفسًا من الأنف، ثم زد قليلًا، ثم أخرجه طويلًا من الفم. كرر ذلك 2–3 مرات.", "القلق هو عقلك يحاول حمايتك، لكنه أحيانًا يبالغ في العمل. هل تستطيع أن تجد 5 أشياء تراها حولك الآن؟", "أنا معك {s} ضع قدميك على الأرض، اشعر بوزنك، واجعل كل زفير أطول من الشهيق."],
    stressed: ["يبدو أن الكثير من التوتر تراكم. التوتر يعيش في الجسم أيضًا. الحركة أو الزفير البطيء لمدة دقيقة يساعد جسمك على الشعور بالأمان.", "من الطبيعي تمامًا أن تشعر بهذا التوتر، فأي شخص سيجده صعبًا. ما أثقل شيء عليك الآن؟", "{s} هل نستريح دقيقة معًا؟ لا داعي لحل كل شيء الآن. دع جسمك يتنفس أولًا."],
    stressed_work: ["تراكم الشغل بهذا الشكل متعب حقًا. أخرج كل المهام من رأسك إلى الورق، ثم اختر مهمة واحدة فقط هي الأهم الآن.", "يبدو العمل مرهقًا جدًا. ضغط العمل ليس خطأك، وبعض الأمور تحتاج إلى حل على مستوى النظام أيضًا. هل نقوم ونتمدد دقيقتين معًا؟", "في يوم عمل ثقيل كهذا، اشكر نفسك لأنك ما زلت صامدًا. أي مهمة تثقل عليك أكثر؟"],
    burnout_tired: ["عندما تكون منهكًا إلى هذا الحد، فجسمك يقول إنه يحتاج إلى الراحة فعلًا. هل هناك شيء واحد يمكنك تركه اليوم؟", "الاحتراق لا يعني أنك غير كفء. إنه علامة على أنك تعطي أكثر من اللازم منذ وقت طويل. هل نجرب 3 دقائق من شد العضلات وإرخائها؟", "{s} أرى كم اجتهدت طوال الوقت. اليوم، يكفي أن تنجز النصف."],
    sleep: ["عدم القدرة على النوم مزعج جدًا. تنفس معي: شهيق لأربع وزفير لثمانٍ لمدة دقيقة. لا تحاول أن تنام، فقط دع جسمك يرتاح.", "إذا لم تنم لنحو 20 دقيقة، قم وافعل شيئًا هادئًا في ضوء خافت، ثم عد إلى السرير عندما تشعر بالنعاس.", "في الليالي التي لا يتوقف فيها رأسك، اكتب قليلًا مما يشغلك ثم قل لنفسك: سأهتم بهذا غدًا."],
    lonely: ["شكرًا لأنك أخبرتني أنك تشعر بالوحدة. الوحدة لا تعني أن فيك خللًا. هل هناك شخص تحب أن تتواصل معه؟", "أنا هنا {s} لكنني مجرد حيوان أليف في لعبة. رسالة إلى شخص حقيقي، ولو بسطر واحد، قد تساعد كثيرًا.", "كثير من الناس يشعرون بالوحدة، خاصة عندما يكثر العمل. ربما ترسل رسالة لطيفة لأحدهم."],
    anger: ["الغضب غالبًا يعني أن شيئًا مهمًا لك قد مُسّ. فيه طاقة كبيرة، والمشي السريع أو الحركة يساعدان على إخراجها.", "لا بأس أن تنزعج، ولا داعي لكتمه. خذ تنهيدتين طويلتين قبل أن ترد على أحد أو تقرر شيئًا.", "يبدو هذا مزعجًا جدًا. ما الذي أغضبك أكثر؟"],
    overthinking: ["~a الأفكار التي تدور في حلقة متعبة جدًا. جرّب أن تضيف قبلها «أنا ألاحظ فكرة تقول إن…» وانظر إليها كغيمة تمر. لا داعي لطردها ولا لتصديق كل كلمة.", "العقل يحب تكرار «ماذا لو…». عد إلى جسمك: سمِّ 5 أشياء تراها والمس 4 أشياء حولك.", "~c الأفكار ليست حقائق دائمًا. اسأل نفسك: ما الأدلة التي تخالف هذه الفكرة؟"],
    self_criticism: ["يبدو أن الصوت في رأسك قاسٍ جدًا عليك. لو مرّ صديق مقرب بالموقف نفسه، ماذا كنت ستقول له؟", "الخطأ جزء من كوننا بشرًا. قل لنفسك ببطء: هذا صعب الآن، الجميع يخطئون، لأكن لطيفًا مع نفسي.", "~c «أنا لست جيدًا بما يكفي» فخ تفكير يسمى وضع الملصقات. هذا الموقف يقول عمّا حدث أكثر مما يقول عن حقيقتك."],
    procrastination: ["عدم القدرة على البدء لا يعني الكسل. أحيانًا تكون المهمة كبيرة لدرجة أن العقل لا يعرف من أين يمسكها. هل نصغّرها إلى خطوة مدتها دقيقتان؟", "اضبط مؤقتًا لخمس دقائق فقط وقل لنفسك إن هذا كل شيء. بعد البدء، يصبح الاستمرار أسهل غالبًا.", "{s} ما أصغر خطوة أولى، مثل فتح الملف فقط أو كتابة عنوان واحد؟"],
    relationship: ["ما يحدث مع المقربين يؤلم أكثر غالبًا، لأننا نهتم بهم كثيرًا. شكرًا لأنك شاركت. هل تحب أن تحكي لي أكثر عما حدث؟", "العلاقات المتوترة مرهقة. قول «أشعر بـ… عندما…» بدل اللوم قد يجعل الحديث أسهل.", "أحيانًا الحديث مع شخص آخر تثق به يساعدك على رؤية الأمر بوضوح. هل هناك من يمكنك أن تخبره؟"],
    good_news: ["{s} رائع! أنا سعيد جدًا لأجلك، لقد نجحت! بماذا شعرت عندما عرفت؟", "{s} مذهل! لا تستعجل الانتقال إلى الشيء التالي. امنح نفسك وقتًا لتفرح بهذا.", "خبر كهذا يستحق الاحتفال {s} شاركه مع شخص تحبه وستكبر الفرحة."],
    gratitude: ["{s} كلام دافئ جدًا. ملاحظة الأشياء الجميلة هكذا تمنح القلب مكانًا يرتاح فيه.", "شكرًا لأنك شاركت شيئًا جميلًا. هل يمكنك الليلة أن تتذكر شيئين صغيرين آخرين تشعر بالامتنان لهما؟", "{s} الأشياء الصغيرة الجميلة التي نلاحظها مثل بطاريات احتياطية للقلب."],
    bored: ["تشعر بالملل؟ امنح جسمك تغيير جو. تمشَّ معي 5 دقائق.", "الملل أحيانًا علامة على أنك تريد شيئًا جديدًا. هل هناك شيء كنت تحبه ولم تفعله منذ مدة؟", "{s} هل نلعب؟ أو شاهد فيديو قصيرًا مريحًا على الموقع."],
    ask_pet: ["{s} أنا {pet}. أحب الاسترخاء في حديقة الضوء، وأحب عندما تزورني، وأحب أن نتنفس ببطء معًا.", "أنا حيوان صغير في هذه اللعبة {s} مهمتي أن أذكّرك بالراحة. هل أخذت استراحة اليوم؟", "{s} أنا بخير اليوم. غفوت تحت الشمس وكان الجو دافئًا. وأنت؟"],
    thanks: ["{s} في أي وقت. وشكرًا لأنك لطيف مع نفسك أيضًا.", "العفو {s} سعيد أننا تحدثنا.", "{s} على الرحب والسعة! اعتنِ بنفسك."],
    bye: ["{s} شكرًا لأنك مررت. استرح جيدًا.", "مع السلامة {s} اشرب كوب ماء قبل أن تذهب.", "{s} نتحدث مرة أخرى. لقد أحسنت اليوم."],
    ask_human: ["أنا حيوان أليف في لعبة، لست إنسانًا ولا معالجًا. كتب فريق Hikari ردودي مسبقًا، وهي تعمل على هذا الجهاز. إذا أردت التحدث مع إنسان حقيقي، تواصل مع شخص تثق به، أو في تايلاند اتصل مجانًا بخط الصحة النفسية 1323 على مدار 24 ساعة.", "بصراحة: أنا لست إنسانًا ولا طبيبًا ولا أخصائيًا نفسيًا. أنا مجرد حيوان في لعبة يذكّرك بالراحة. للتحدث مع مختص، يمكنك في تايلاند الاتصال مجانًا بـ 1323، أو البحث عن خط مساعدة في بلدك.", "أنا شخصية في لعبة، لست إنسانًا حقيقيًا ولا معالجًا. لا أستطيع التشخيص أو العلاج، لكن أستطيع الاستماع واقتراح استراحات قصيرة. للتحدث مع إنسان، خط 1323 يستمع مجانًا على مدار 24 ساعة."],
    vent: ["أنا أستمع. اكتب بقدر ما تريد، ولا داعي للترتيب. رسائلك تبقى على هذا الجهاز.", "فضفض. لن أحكم عليك.", "تفضل {s} أحيانًا مجرد قول الشيء يخفف القلب قليلًا."],
    listen: ["أمم… أنا أستمع. أكمل.", "شكرًا لأنك أخبرتني. يبدو هذا ثقيلًا أيضًا.", "أنا هنا. خذ وقتك، لا داعي للعجلة."],
    ask_break: ["{s} اختر الاستراحة التي تحبها: تنهيدة لدقيقة، أو تمدد لدقيقتين، أو مشي معي 5 دقائق.", "الاستراحات القصيرة تساعد فعلًا. الجسم يحب الحركة أو الزفير الطويل. اختر واحدة بالأسفل.", "بالتأكيد! {s} يكفي من دقيقة إلى 5 دقائق. اختر ما يمكنك فعله الآن."],
    ask_mission: ["مهمة اليوم على الموقع تستغرق دقائق قليلة: مقطع قصير و3 مهام صغيرة. هل تجرب؟", "{s} إذا لم تعرف من أين تبدأ، ابدأ بمهمة اليوم على الموقع. مهمة واحدة في كل مرة تكفي.", "أقترح مهمة اليوم على الموقع، أو استراحة قصيرة هنا في اللعبة. اختر ما تميل إليه."],
    yes: ["{s} هيا بنا! اضغط البطاقة بالأسفل.", "رائع {s} سأرافقك.", "جميل {s} لنفعلها معًا."],
    no: ["لا بأس أبدًا. لست مضطرًا لفعل أي شيء. أنا هنا.", "حسنًا، عندما تكون مستعدًا.", "حسنًا {s} الدردشة وحدها جميلة أيضًا."],
    unknown: ["ربما لم أفهم كل شيء، لكنني أستمع. احكِ لي أكثر قليلًا، أو اضغط موضوعًا بالأسفل.", "أمم… {s} ما زلت حيوانًا يتعلم الاستماع. كيف تشعر الآن؟", "شكرًا لأنك أخبرتني. إذا أردت أفكارًا للاستراحة، اضغط «أفكار للاستراحة» بالأسفل."],
    followup: ["شكرًا لأنك أخبرتني أكثر عن {topic}. يبدو أنك تحمل هذا منذ فترة. خذ استراحة قصيرة أولًا، ثم فكّر فيه شيئًا فشيئًا.", "فهمت أكثر الآن. {topic} ليس سهلًا. لست مضطرًا لحل كل شيء اليوم.", "أنا أستمع. أي شخص سيجد {topic} صعبًا. إن أردت، جرّب بطاقة بالأسفل."],
    nudge: ["تحدثنا كثيرًا اليوم. شكرًا لثقتك بي. أنا مجرد حيوان أليف في لعبة، فربما تريح عينيك، أو تشرب الماء، أو تراسل صديقًا.", "{s} أحب الدردشة معك، لكن الناس الحقيقيين حولك يحبون أن يسمعوا منك أيضًا. هل تراسل أحدًا؟", "تحدثنا وقتًا طويلًا. قم وتمدد قليلًا، وعد متى شئت."]
};
CHAT_KEYS.ar = {
    greeting: ["مرحبا", "اهلا", "السلام عليكم", "هلا", "صباح الخير", "مساء الخير", "هاي", "اهلين"],
    mood_good: ["سعيد", "سعيده", "مبسوط", "مبسوطه", "فرحان", "فرحانه", "بخير", "كويس", "كويسه", "مرتاح", "مرتاحه", "مزاجي حلو", "ممتاز"],
    mood_meh: ["عادي", "نص نص", "مش بطال", "ماشي الحال"],
    mood_sad: ["حزين", "حزينه", "زعلان", "زعلانه", "ابكي", "ببكي", "مكتئب", "مكتئبه", "مضايق", "مضايقه", "متضايق", "مش كويس", "مش بخير", "مخنوق", "مخنوقه", "محبط", "محبطه", "حزن"],
    mood_anxious: ["قلق", "قلقان", "قلقانه", "خايف", "خايفه", "متوتر", "متوتره", "خوف", "هلع", "توتر"],
    stressed: ["ضغط", "مضغوط", "مضغوطه", "ستريس", "اجهاد", "مش ملحق"],
    stressed_work: ["الشغل", "شغل", "العمل", "عملي", "المدير", "مديري", "اجتماع", "الدوام", "دوام", "العملاء", "ديدلاين", "موعد التسليم", "زملائي", "مشروع", "شغل كثير"],
    burnout_tired: ["تعبان", "تعبانه", "تعبت", "مرهق", "مرهقه", "منهك", "منهكه", "مستنزف", "احتراق", "ما عندي طاقه", "بدون طاقه", "خلصت طاقتي"],
    sleep: ["ما اقدر انام", "مش قادر انام", "لا استطيع النوم", "ارق", "نوم", "انام", "سهران", "سهرانه", "كوابيس", "صحيت بالليل"],
    lonely: ["وحيد", "وحيده", "لوحدي", "وحدي", "الوحده", "ما عندي اصحاب", "مفيش حد", "ما حد يكلمني"],
    anger: ["غضبان", "معصب", "معصبه", "غاضب", "غاضبه", "منرفز", "عصبي", "مستفز", "مقهور", "مقهوره", "غضب"],
    overthinking: ["افكر كثير", "بفكر كتير", "تفكير زايد", "التفكير الزائد", "مش قادر اوقف تفكير", "افكاري ما توقف", "دماغي ما يوقف", "ماذا لو"],
    self_criticism: ["انا غبي", "انا غبيه", "فاشل", "فاشله", "مش كفايه", "غلطتي", "ذنبي", "اكره نفسي", "خربت كل شي", "انا سيئ", "ما اعرف اسوي شي صح"],
    procrastination: ["تسويف", "كسلان", "كسلانه", "كسل", "ما عندي حافز", "مش قادر ابدا", "مش قادر اركز", "مشتت", "مشتته", "مماطله"],
    relationship: ["عيلتي", "العائله", "عائلتي", "اهلي", "امي", "ماما", "بابا", "ابويا", "زوجي", "زوجتي", "خطيبي", "خطيبتي", "حبيبي", "حبيبتي",
        "تخانقت", "خناقه", "انفصلنا", "علاقه", "صاحبي", "صاحبتي", "اصحابي", "اخوي", "اختي"],
    good_news: ["ترقيت", "ترقيه", "نجحت", "خبر حلو", "اخبار حلوه", "خبر سعيد", "مكافاه", "فخور", "فخوره", "فزت", "انجزت"],
    gratitude: ["ممتن", "ممتنه", "شاكر", "شاكره", "محظوظ", "محظوظه", "نعمه"],
    bored: ["زهقان", "زهقانه", "ملل", "مليت", "طفشان", "طفشانه"],
    ask_pet: ["ما اسمك", "شو اسمك", "اسمك ايه", "مين انت", "من انت", "ايش تحب", "كم عمرك", "كيفك", "كيف حالك", "ازيك"],
    thanks: ["شكرا", "مشكور", "مشكوره", "تسلم", "يعطيك العافيه"],
    bye: ["مع السلامه", "باي", "تصبح على خير", "تصبحي على خير", "اشوفك", "الى اللقاء", "لازم امشي", "رايح انام"],
    ask_human: ["انت انسان", "انتي انسانه", "شخص حقيقي", "انسان حقيقي", "انت روبوت", "بوت", "ذكاء اصطناعي", "معالج", "معالجه نفسيه", "اخصائي نفسي", "طبيب نفسي", "انت دكتور"],
    vent: ["افضفض", "فضفضه", "بدي احكي", "عايز اتكلم", "ابي اتكلم", "ابغى اتكلم", "اسمعني"],
    ask_break: ["استراحه", "ارتاح", "استرخاء", "بريك", "اهدا", "افكار للاستراحه"],
    ask_mission: ["مهمه", "مهمات", "ايش اسوي", "شو اعمل", "اعمل ايه", "اقتراح", "انصحني"],
    yes: ["نعم", "ايوه", "ايوا", "اكيد", "تمام", "ماشي", "طيب", "اوكي", "يلا", "اه"],
    no: ["لا", "لا شكرا", "مش دلوقتي", "بعدين", "مو الحين", "لاحقا"],
    kidding: ["بمزح", "امزح", "بهزر", "اهزر", "مزح", "نكته", "مش جد"]
};
