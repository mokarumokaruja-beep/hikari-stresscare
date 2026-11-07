// =====================================================================
// Hikari สวนแสง - game-world.js (v28) "โลก 2.5D ที่เดินได้"
// - ฉากกว้าง (ภาพแนวนอน) เดินได้ทั้งภาพ กล้องเลื่อนตามน้องนุ่ม ๆ · ลากเพื่อมองรอบ ๆ · แตะตรงไหนน้องก็เดินไป
// - ความลึก: แถบพื้นต่อฉาก น้องเล็กลงเมื่ออยู่ไกล ซ้อนหน้า-หลังตามความลึก เงาใต้ตัว
//   พารัลแลกซ์ 3 ชั้น: ภาพฉาก (1×) · ประกายแสงจาก game-life.js (0.8×) · หญ้า/ใบไม้ด้านหน้า (1.25×) วาดเองด้วย SVG
// - ออกไปเดินเล่น: สนามหญ้าหน้าบ้าน · ในบ้านวันฝนตก · ทริป (ใช้แผนที่ทริปเดิมใน game.js) · ทางออกที่ขอบฉาก · กลับบ้านได้เสมอ
// - จุดเรืองแสง 2–3 จุดต่อที่: กิจกรรม 1 นาทีแบบมีงานวิจัยรองรับ (ฟังเสียง, 5-4-3-2-1, ชื่นชมสิ่งเล็ก ๆ,
//   ปล่อยความคิดให้ลอยไป (ACT), ยืดตัว (behavioral activation), หายใจกับเสียงฝน) ไม่บังคับ ทำเมื่อไรก็ได้
// - ไม่มีพลังงาน/เวลารอ ไม่มีที่เที่ยวแบบจ่ายเงิน ไม่ลงโทษเมื่อหายไป · เคารพ "ลดการเคลื่อนไหว"
// ใช้จาก game.js: S, save, L, t, img, $, petName, placeName, addLight, markActive, rolloverCheck, toast,
//   renderHome, timeOfDay, tripStop, tripStampEarn, openMap, quickBreathe · จาก game-pet.js: Pet
// เพิ่มสถานที่ใหม่: ใส่ใน PLACES (หรือ TRIP_EXTRA สำหรับที่เที่ยวใน TRIP_STOPS) ดูรูปแบบด้านล่าง
// =====================================================================
var HikariWorld = (function () {   // var: game.js เช็ก typeof ได้แม้ไฟล์นี้ยังโหลดไม่เสร็จ
    "use strict";
    const stage = $("stage"), petEl = $("petBtn");
    const ok = !!(stage && petEl && typeof Pet !== "undefined" && Pet.bounds);
    const reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const FG_SPEED = 1.25, LIFE_SPEED = 0.8;          // พารัลแลกซ์: หน้า > ฉาก > ประกายแสง
    const WALK_LIGHT = 1, WALK_LIGHT_TIMES = 3;       // แสงจากจุดเรืองแสง: 1 แสง สูงสุด 3 ครั้งต่อวัน (ทำต่อได้ ไม่ได้แสงเพิ่ม)

    // ---------- ข้อความ 10 ภาษา (ไฟล์ภาษาเกมเป็นของคนอื่น จึงเก็บไว้ที่นี่) ----------
    // act_* = [หัวข้อ, ขั้นที่ 1, ขั้นที่ 2, ...]
    const TX = {
        th: {
            goOut: "ออกไปเดินเล่น", goElse: "ไปที่อื่น", home: "กลับบ้าน", pickTitle: "ไปไหนกันดี?", pickSub: "ไม่ต้องรีบนะ กลับบ้านได้ทุกเมื่อ",
            place_home: "บ้าน", place_lawn: "สนามหญ้าหน้าบ้าน", place_rainy: "ในบ้านวันฝนตก", place_map: "แผนที่ทริป", place_mapSub: "10 สถานที่ในไทย",
            here: "อยู่ที่นี่", exitTo: "ไป{place}", hint: "แตะพื้นให้น้องเดิน · ลากเพื่อมองรอบ ๆ · แตะจุดเรืองแสง",
            next: "ต่อไป", done: "เสร็จแล้ว", later: "ไว้ก่อนนะ", start: "เริ่มเลย", rainBtn: "หายใจ 1 นาทีกับเสียงฝน",
            gain: "+{n} แสง · ช่วงเวลาสงบกับ{pet}", gainMax: "ช่วงเวลาดี ๆ นะ วันนี้แสงจากการเดินเล่นครบแล้ว แต่ยังมีค่าเสมอ",
            doneToday: "ทำแล้ววันนี้", oneMin: "ราว 1 นาที · ทำตามจังหวะของเราเอง",
            say_lawn: "หญ้านุ่มจัง! กลิ่นแดดอุ่น ๆ", say_rainy: "ฝนตกเปาะแปะ… อบอุ่นดีจัง", say_home: "กลับถึงบ้านแล้ว~", say_sniff: "ฟุดฟิด… ตรงนี้มีอะไรดี ๆ แน่เลย",
            act_listen: ["ฟังเสียง 3 เสียง", "นั่งสบาย ๆ จะหลับตาก็ได้นะ", "หาเสียงที่อยู่ไกล ๆ หนึ่งเสียง", "ทีนี้หาเสียงที่อยู่ใกล้ ๆ หนึ่งเสียง", "และเสียงเบา ๆ อีกหนึ่ง… อาจเป็นลมหายใจของเราเอง"],
            act_ground: ["5-4-3-2-1 กลับมาอยู่ตรงนี้", "มองรอบ ๆ หาสิ่งที่เห็น 5 อย่าง", "สิ่งที่สัมผัสได้ 4 อย่าง เช่น เท้า หรือลมที่ผิว", "เสียงที่ได้ยิน 3 เสียง", "กลิ่น 2 อย่าง แล้วหายใจช้า ๆ ใจดีกับตัวเอง 1 ครั้ง"],
            act_savor: ["หาสิ่งที่ชอบหนึ่งอย่าง", "มองไปรอบ ๆ ที่นี่ช้า ๆ", "เลือกสิ่งที่ชอบหนึ่งอย่าง สี แสง หรือรูปทรงก็ได้", "อยู่กับมันสัก 3 ลมหายใจ ให้ตัวเองได้เพลิน ๆ"],
            act_float: ["ปล่อยความกังวลให้ลอยไป", "นึกถึงเรื่องกังวลเล็ก ๆ หนึ่งเรื่อง ไม่ต้องแก้ตอนนี้", "พูดในใจเบา ๆ ว่า \"ฉันกำลังมีความคิดว่า…\"", "วางมันไว้บนโคมลอย แล้วดูมันลอยขึ้นช้า ๆ", "ถ้ามันกลับมาก็ไม่เป็นไร ปล่อยให้ลอยไปใหม่ได้เสมอ"],
            act_stretch: ["ยืดเหยียดกับ{pet}", "นั่งหรือยืนตัวตรง เหมือน{pet}", "ยกแขนขึ้นสูง ๆ… แล้วค่อย ๆ ลดลง", "หมุนไหล่ไปด้านหลัง 3 รอบ", "สะบัดมือเบา ๆ ขยับนิดเดียวก็นับนะ"],
            act_rain: ["หายใจอุ่น ๆ กับเสียงฝน", "ซุกตัวให้สบาย ฟังเสียงฝนที่หน้าต่าง", "หายใจเข้าช้า ๆ… หายใจออกยาวกว่านิดนึง เหมือนหยดฝนไหลลง"],
            act_breathe: ["หายใจ 1 นาทีที่นี่", "หายใจช้า ๆ ไปด้วยกัน 1 นาที สูดอากาศของที่นี่"]
        },
        en: {
            goOut: "Go for a walk", goElse: "Go somewhere", home: "Home", pickTitle: "Where shall we go?", pickSub: "No rush. You can come home anytime.",
            place_home: "Home", place_lawn: "Front lawn", place_rainy: "Rainy-day room", place_map: "Trip map", place_mapSub: "10 places in Thailand",
            here: "You're here", exitTo: "Go to {place}", hint: "Tap the ground to walk · drag to look around · tap a glowing dot",
            next: "Next", done: "Done", later: "Maybe later", start: "Start", rainBtn: "Breathe 1 min with rain sounds",
            gain: "+{n} light · a calm moment with {pet}", gainMax: "A lovely moment. Walk light is full today, but this still counts",
            doneToday: "done today", oneMin: "About 1 minute · go at your own pace",
            say_lawn: "Fresh grass! It smells like sunshine", say_rainy: "Pitter-patter… so cozy in here", say_home: "Home sweet home~", say_sniff: "Sniff sniff… something nice here",
            act_listen: ["Listen for 3 sounds", "Get comfy. You can close your eyes if you like.", "Find one sound far away.", "Now one sound close by.", "And one very soft sound… maybe your own breath."],
            act_ground: ["5-4-3-2-1 grounding", "Look around. Notice 5 things you can see.", "4 things you can feel, like your feet or the air.", "3 things you can hear.", "2 things you can smell, and 1 slow, kind breath."],
            act_savor: ["Notice one thing you like", "Look around this place gently.", "Pick one thing you like here: a color, a light, a shape.", "Stay with it for 3 slow breaths. Let yourself enjoy it."],
            act_float: ["Let one worry float away", "Think of one small worry. You don't have to solve it.", "Say it softly: \"I'm having the thought that…\"", "Place it on a lantern and watch it drift up.", "If it comes back, that's okay. You can let it float again."],
            act_stretch: ["Stretch with {pet}", "Sit or stand tall, just like {pet}.", "Reach your arms up high… then slowly down.", "Roll your shoulders back 3 times.", "Shake out your hands. Small moves count."],
            act_rain: ["Cozy breathing with the rain", "Snuggle in and listen to the rain.", "Breathe in slowly… and out a little longer, like raindrops sliding down."],
            act_breathe: ["Breathe 1 min here", "Let's breathe slowly together for one minute and take in this place."]
        },
        zh: {
            goOut: "出去散步", goElse: "去别处", home: "回家", pickTitle: "我们去哪儿呢？", pickSub: "不着急，随时都可以回家。",
            place_home: "家", place_lawn: "门前草坪", place_rainy: "雨天的小屋", place_map: "旅行地图", place_mapSub: "泰国 10 个地方",
            here: "你在这里", exitTo: "去{place}", hint: "点地面让它走 · 拖动看看四周 · 点发光的小点",
            next: "下一步", done: "完成", later: "下次吧", start: "开始", rainBtn: "伴着雨声呼吸 1 分钟",
            gain: "+{n} 光 · 和{pet}的安静时光", gainMax: "很美好的一刻。今天散步的光已满，但这依然很有意义",
            doneToday: "今天已完成", oneMin: "大约 1 分钟 · 按自己的节奏来",
            say_lawn: "草好软！有阳光的味道", say_rainy: "滴答滴答……屋里好温暖", say_home: "到家啦~", say_sniff: "嗅嗅……这里有好东西",
            act_listen: ["听 3 种声音", "找个舒服的姿势，想闭眼也可以。", "找一个远处的声音。", "再找一个近处的声音。", "还有一个很轻的声音……也许是你的呼吸。"],
            act_ground: ["5-4-3-2-1 回到当下", "看看四周，找出 5 样看得见的东西。", "4 样能感觉到的，比如双脚或空气。", "3 种听得见的声音。", "2 种气味，再给自己 1 次温柔的慢呼吸。"],
            act_savor: ["找一样你喜欢的", "慢慢看看这个地方。", "选一样你喜欢的：颜色、光线或形状。", "陪它 3 次慢呼吸，让自己好好享受。"],
            act_float: ["让一个烦恼飘走", "想一个小烦恼，现在不用解决它。", "轻轻说：“我有一个想法是……”", "把它放在天灯上，看它慢慢飘远。", "如果它回来了也没关系，可以再让它飘走。"],
            act_stretch: ["和{pet}一起伸展", "坐直或站直，就像{pet}一样。", "双手高高举起……再慢慢放下。", "肩膀向后转 3 圈。", "轻轻甩甩手。小小的动作也算数。"],
            act_rain: ["伴着雨声温暖呼吸", "窝舒服一点，听听窗外的雨。", "慢慢吸气……呼气再长一点，像雨滴慢慢滑落。"],
            act_breathe: ["在这里呼吸 1 分钟", "我们一起慢慢呼吸一分钟，感受这里的空气。"]
        },
        hi: {
            goOut: "टहलने चलें", goElse: "कहीं और चलें", home: "घर चलें", pickTitle: "कहाँ चलें?", pickSub: "कोई जल्दी नहीं। जब चाहें घर लौट सकते हैं।",
            place_home: "घर", place_lawn: "आँगन का लॉन", place_rainy: "बारिश वाला कमरा", place_map: "यात्रा नक्शा", place_mapSub: "थाईलैंड की 10 जगहें",
            here: "आप यहाँ हैं", exitTo: "{place} चलें", hint: "ज़मीन पर टैप करें · खींचकर चारों ओर देखें · चमकते बिंदु पर टैप करें",
            next: "आगे", done: "हो गया", later: "बाद में", start: "शुरू करें", rainBtn: "बारिश की आवाज़ के साथ 1 मिनट साँस",
            gain: "+{n} रोशनी · {pet} के साथ एक शांत पल", gainMax: "प्यारा पल। आज टहलने की रोशनी पूरी है, पर यह फिर भी मायने रखता है",
            doneToday: "आज हो गया", oneMin: "लगभग 1 मिनट · अपनी रफ़्तार से",
            say_lawn: "ताज़ी घास! धूप जैसी खुशबू", say_rainy: "टिप-टिप… अंदर कितना आरामदायक है", say_home: "घर आ गए~", say_sniff: "सूँघ-सूँघ… यहाँ कुछ अच्छा है",
            act_listen: ["3 आवाज़ें सुनें", "आराम से बैठें। चाहें तो आँखें बंद कर लें।", "दूर की एक आवाज़ ढूँढें।", "अब पास की एक आवाज़।", "और एक बहुत धीमी आवाज़… शायद आपकी अपनी साँस।"],
            act_ground: ["5-4-3-2-1 ग्राउंडिंग", "चारों ओर देखें। 5 चीज़ें जो दिख रही हैं।", "4 चीज़ें जो महसूस हो रही हैं, जैसे पैर या हवा।", "3 आवाज़ें जो सुनाई दे रही हैं।", "2 खुशबू, और 1 धीमी, प्यार भरी साँस।"],
            act_savor: ["एक पसंद की चीज़ देखें", "इस जगह को धीरे-धीरे देखें।", "यहाँ की एक पसंदीदा चीज़ चुनें: रंग, रोशनी या आकार।", "3 धीमी साँसों तक उसके साथ रहें। उसका आनंद लें।"],
            act_float: ["एक चिंता को उड़ने दें", "एक छोटी चिंता सोचें। अभी हल करने की ज़रूरत नहीं।", "धीरे से कहें: \"मेरे मन में यह विचार है कि…\"", "उसे एक लालटेन पर रखें और ऊपर उड़ते देखें।", "अगर वह लौट आए तो कोई बात नहीं। फिर से उड़ने दें।"],
            act_stretch: ["{pet} के साथ स्ट्रेच", "{pet} की तरह सीधे बैठें या खड़े हों।", "बाहें ऊपर उठाएँ… फिर धीरे से नीचे।", "कंधों को 3 बार पीछे घुमाएँ।", "हाथ हल्के से झटकें। छोटी हरकतें भी गिनती हैं।"],
            act_rain: ["बारिश के साथ आरामदायक साँस", "आराम से बैठें और बारिश सुनें।", "धीरे साँस लें… और थोड़ा लंबा छोड़ें, जैसे बूँदें फिसलती हैं।"],
            act_breathe: ["यहाँ 1 मिनट साँस लें", "आइए एक मिनट साथ में धीरे-धीरे साँस लें और इस जगह को महसूस करें।"]
        },
        es: {
            goOut: "Salir a pasear", goElse: "Ir a otro sitio", home: "A casa", pickTitle: "¿A dónde vamos?", pickSub: "Sin prisa. Puedes volver a casa cuando quieras.",
            place_home: "Casa", place_lawn: "Jardín de casa", place_rainy: "Cuarto en día de lluvia", place_map: "Mapa de viaje", place_mapSub: "10 lugares de Tailandia",
            here: "Estás aquí", exitTo: "Ir a {place}", hint: "Toca el suelo para caminar · arrastra para mirar · toca un punto brillante",
            next: "Siguiente", done: "Listo", later: "Quizás luego", start: "Empezar", rainBtn: "Respirar 1 min con la lluvia",
            gain: "+{n} luz · un momento tranquilo con {pet}", gainMax: "Qué momento tan bonito. La luz de paseos de hoy está completa, pero esto cuenta igual",
            doneToday: "hecho hoy", oneMin: "Cerca de 1 minuto · a tu ritmo",
            say_lawn: "¡Césped fresco! Huele a sol", say_rainy: "Plic, plic… qué acogedor", say_home: "¡Hogar, dulce hogar!", say_sniff: "Snif, snif… aquí hay algo bonito",
            act_listen: ["Escucha 3 sonidos", "Ponte cómodo. Puedes cerrar los ojos si quieres.", "Busca un sonido lejano.", "Ahora uno cercano.", "Y uno muy suave… quizá tu propia respiración."],
            act_ground: ["Anclaje 5-4-3-2-1", "Mira alrededor. 5 cosas que puedes ver.", "4 cosas que puedes sentir, como tus pies o el aire.", "3 cosas que puedes oír.", "2 cosas que puedes oler, y 1 respiración lenta y amable."],
            act_savor: ["Fíjate en algo que te guste", "Mira este lugar con calma.", "Elige algo que te guste: un color, una luz, una forma.", "Quédate con ello 3 respiraciones lentas. Disfrútalo."],
            act_float: ["Deja ir una preocupación", "Piensa en una pequeña preocupación. No hace falta resolverla.", "Dilo suave: \"Estoy teniendo el pensamiento de que…\"", "Ponla en un farolillo y mírala subir despacio.", "Si vuelve, está bien. Puedes dejarla flotar otra vez."],
            act_stretch: ["Estírate con {pet}", "Siéntate o ponte recto, como {pet}.", "Sube los brazos bien alto… y bájalos despacio.", "Gira los hombros hacia atrás 3 veces.", "Sacude las manos. Los pequeños movimientos cuentan."],
            act_rain: ["Respiración acogedora con la lluvia", "Acurrúcate y escucha la lluvia.", "Inhala despacio… y exhala un poco más largo, como gotas que resbalan."],
            act_breathe: ["Respirar 1 min aquí", "Respiremos despacio juntos un minuto y sintamos este lugar."]
        },
        fr: {
            goOut: "Sortir se promener", goElse: "Aller ailleurs", home: "Maison", pickTitle: "On va où ?", pickSub: "Rien ne presse. Tu peux rentrer quand tu veux.",
            place_home: "Maison", place_lawn: "Pelouse devant la maison", place_rainy: "Chambre un jour de pluie", place_map: "Carte de voyage", place_mapSub: "10 lieux en Thaïlande",
            here: "Tu es ici", exitTo: "Aller à : {place}", hint: "Touche le sol pour marcher · glisse pour regarder · touche un point lumineux",
            next: "Suivant", done: "Terminé", later: "Plus tard", start: "Commencer", rainBtn: "Respirer 1 min avec la pluie",
            gain: "+{n} lumière · un moment calme avec {pet}", gainMax: "Joli moment. La lumière des balades est complète aujourd'hui, mais ça compte quand même",
            doneToday: "fait aujourd'hui", oneMin: "Environ 1 minute · à ton rythme",
            say_lawn: "De l'herbe fraîche ! Ça sent le soleil", say_rainy: "Plic, ploc… qu'on est bien ici", say_home: "De retour à la maison~", say_sniff: "Snif snif… il y a quelque chose de joli ici",
            act_listen: ["Écoute 3 sons", "Installe-toi. Tu peux fermer les yeux si tu veux.", "Trouve un son lointain.", "Puis un son tout proche.", "Et un son très doux… peut-être ta respiration."],
            act_ground: ["Ancrage 5-4-3-2-1", "Regarde autour de toi : 5 choses que tu vois.", "4 choses que tu sens, comme tes pieds ou l'air.", "3 choses que tu entends.", "2 odeurs, puis 1 respiration lente et douce."],
            act_savor: ["Remarque une chose que tu aimes", "Regarde cet endroit tranquillement.", "Choisis une chose que tu aimes : une couleur, une lumière, une forme.", "Reste avec elle 3 respirations lentes. Savoure."],
            act_float: ["Laisse un souci s'envoler", "Pense à un petit souci. Pas besoin de le résoudre.", "Dis doucement : « J'ai la pensée que… »", "Pose-le sur une lanterne et regarde-la monter.", "S'il revient, ce n'est pas grave. Tu peux le laisser s'envoler encore."],
            act_stretch: ["S'étirer avec {pet}", "Assieds-toi ou tiens-toi droit, comme {pet}.", "Lève les bras bien haut… puis redescends doucement.", "Roule les épaules vers l'arrière 3 fois.", "Secoue les mains. Les petits gestes comptent."],
            act_rain: ["Respiration douillette sous la pluie", "Blottis-toi et écoute la pluie.", "Inspire lentement… expire un peu plus longtemps, comme des gouttes qui glissent."],
            act_breathe: ["Respirer 1 min ici", "Respirons doucement ensemble une minute, en goûtant cet endroit."]
        },
        ar: {
            goOut: "لنخرج في نزهة", goElse: "مكان آخر", home: "البيت", pickTitle: "إلى أين نذهب؟", pickSub: "لا داعي للعجلة. يمكنك العودة إلى البيت في أي وقت.",
            place_home: "البيت", place_lawn: "الحديقة الأمامية", place_rainy: "غرفة اليوم الممطر", place_map: "خريطة الرحلات", place_mapSub: "10 أماكن في تايلاند",
            here: "أنت هنا", exitTo: "اذهب إلى {place}", hint: "المس الأرض للمشي · اسحب لتنظر حولك · المس نقطة مضيئة",
            next: "التالي", done: "تم", later: "ربما لاحقًا", start: "ابدأ", rainBtn: "تنفّس دقيقة مع صوت المطر",
            gain: "+{n} نور · لحظة هادئة مع {pet}", gainMax: "لحظة جميلة. اكتمل نور النزهات اليوم، لكنها ما زالت مهمة",
            doneToday: "تم اليوم", oneMin: "نحو دقيقة · على راحتك",
            say_lawn: "عشب منعش! رائحته كالشمس", say_rainy: "طق طق… ما أدفأ المكان", say_home: "عدنا إلى البيت~", say_sniff: "شمّ شمّ… هنا شيء لطيف",
            act_listen: ["استمع إلى 3 أصوات", "اجلس براحة. يمكنك إغلاق عينيك إن أحببت.", "ابحث عن صوت بعيد.", "والآن صوت قريب.", "وصوت خافت جدًا… ربما أنفاسك."],
            act_ground: ["تمرين 5-4-3-2-1", "انظر حولك: 5 أشياء تراها.", "4 أشياء تشعر بها، مثل قدميك أو الهواء.", "3 أصوات تسمعها.", "رائحتان، ثم نفس بطيء ولطيف واحد."],
            act_savor: ["لاحظ شيئًا تحبه", "انظر إلى هذا المكان بهدوء.", "اختر شيئًا تحبه هنا: لونًا أو ضوءًا أو شكلًا.", "ابقَ معه 3 أنفاس بطيئة. استمتع به."],
            act_float: ["دع قلقًا يطفو بعيدًا", "فكّر في قلق صغير. لا حاجة لحله الآن.", "قل بلطف: «لديّ فكرة أن…»", "ضعه على فانوس وشاهده يرتفع ببطء.", "إن عاد فلا بأس. يمكنك أن تدعه يطفو مرة أخرى."],
            act_stretch: ["تمدّد مع {pet}", "اجلس أو قف مستقيمًا مثل {pet}.", "ارفع ذراعيك عاليًا… ثم أنزلهما ببطء.", "دوّر كتفيك للخلف 3 مرات.", "انفض يديك برفق. الحركات الصغيرة مهمة."],
            act_rain: ["تنفّس دافئ مع المطر", "تدثّر واستمع إلى المطر.", "شهيق بطيء… وزفير أطول قليلًا، كقطرات تنزلق."],
            act_breathe: ["تنفّس دقيقة هنا", "لنتنفّس معًا ببطء لمدة دقيقة ونستمتع بهذا المكان."]
        },
        pt: {
            goOut: "Sair para passear", goElse: "Ir a outro lugar", home: "Casa", pickTitle: "Para onde vamos?", pickSub: "Sem pressa. Você pode voltar para casa quando quiser.",
            place_home: "Casa", place_lawn: "Gramado da frente", place_rainy: "Quarto em dia de chuva", place_map: "Mapa de viagem", place_mapSub: "10 lugares na Tailândia",
            here: "Você está aqui", exitTo: "Ir para {place}", hint: "Toque no chão para andar · arraste para olhar · toque num ponto brilhante",
            next: "Próximo", done: "Pronto", later: "Talvez depois", start: "Começar", rainBtn: "Respirar 1 min com a chuva",
            gain: "+{n} luz · um momento calmo com {pet}", gainMax: "Que momento bonito. A luz dos passeios de hoje está completa, mas isso ainda conta",
            doneToday: "feito hoje", oneMin: "Cerca de 1 minuto · no seu ritmo",
            say_lawn: "Grama fresquinha! Cheiro de sol", say_rainy: "Plic, plic… que aconchego", say_home: "Lar, doce lar~", say_sniff: "Fuç, fuç… tem algo legal aqui",
            act_listen: ["Ouça 3 sons", "Fique à vontade. Pode fechar os olhos se quiser.", "Encontre um som distante.", "Agora um som bem perto.", "E um som bem suave… talvez sua respiração."],
            act_ground: ["Aterramento 5-4-3-2-1", "Olhe em volta: 5 coisas que você vê.", "4 coisas que você sente, como os pés ou o ar.", "3 coisas que você ouve.", "2 cheiros, e 1 respiração lenta e gentil."],
            act_savor: ["Repare em algo de que gosta", "Olhe este lugar com calma.", "Escolha algo de que gosta: uma cor, uma luz, uma forma.", "Fique com isso por 3 respirações lentas. Aproveite."],
            act_float: ["Deixe uma preocupação flutuar", "Pense numa pequena preocupação. Não precisa resolvê-la.", "Diga baixinho: \"Estou tendo o pensamento de que…\"", "Coloque-a numa lanterna e veja-a subir devagar.", "Se ela voltar, tudo bem. Você pode deixá-la flutuar de novo."],
            act_stretch: ["Alongar com {pet}", "Sente ou fique em pé reto, como {pet}.", "Erga os braços bem alto… e desça devagar.", "Gire os ombros para trás 3 vezes.", "Sacuda as mãos. Pequenos movimentos contam."],
            act_rain: ["Respiração aconchegante com a chuva", "Aconchegue-se e ouça a chuva.", "Inspire devagar… e expire um pouco mais longo, como gotas escorrendo."],
            act_breathe: ["Respirar 1 min aqui", "Vamos respirar devagar juntos por um minuto e sentir este lugar."]
        },
        ru: {
            goOut: "Пойти гулять", goElse: "В другое место", home: "Домой", pickTitle: "Куда пойдём?", pickSub: "Не спеши. Домой можно вернуться в любой момент.",
            place_home: "Дом", place_lawn: "Лужайка у дома", place_rainy: "Комната в дождливый день", place_map: "Карта путешествий", place_mapSub: "10 мест Таиланда",
            here: "Ты здесь", exitTo: "Пойти: {place}", hint: "Коснись земли, чтобы идти · проведи, чтобы осмотреться · коснись светящейся точки",
            next: "Дальше", done: "Готово", later: "Может, позже", start: "Начать", rainBtn: "Подышать 1 мин под дождь",
            gain: "+{n} света · спокойная минутка: {pet}", gainMax: "Чудесная минутка. Свет за прогулки на сегодня собран, но это всё равно важно",
            doneToday: "сделано сегодня", oneMin: "Около 1 минуты · в своём темпе",
            say_lawn: "Свежая травка! Пахнет солнышком", say_rainy: "Кап-кап… как уютно", say_home: "Мы дома~", say_sniff: "Нюх-нюх… тут что-то приятное",
            act_listen: ["Услышь 3 звука", "Устройся удобно. Можно закрыть глаза.", "Найди один далёкий звук.", "Теперь один близкий.", "И один совсем тихий… может, твоё дыхание."],
            act_ground: ["Заземление 5-4-3-2-1", "Оглядись: 5 вещей, которые видишь.", "4 ощущения, например ступни или воздух.", "3 звука, которые слышишь.", "2 запаха и 1 медленный добрый вдох."],
            act_savor: ["Заметь то, что нравится", "Спокойно осмотри это место.", "Выбери то, что нравится: цвет, свет, форму.", "Побудь с этим 3 медленных вдоха. Насладись."],
            act_float: ["Отпусти одну тревогу", "Вспомни одну маленькую тревогу. Решать её сейчас не нужно.", "Скажи мягко: «У меня есть мысль, что…»", "Положи её на фонарик и смотри, как он поднимается.", "Если она вернётся — ничего страшного. Можно отпустить снова."],
            act_stretch: ["Потянись вместе: {pet}", "Сядь или встань ровно, как {pet}.", "Подними руки высоко… и медленно опусти.", "Покрути плечами назад 3 раза.", "Встряхни кисти. Маленькие движения тоже считаются."],
            act_rain: ["Уютное дыхание под дождь", "Устройся поудобнее и послушай дождь.", "Медленный вдох… и выдох чуть длиннее, как скользящие капли."],
            act_breathe: ["Подышать здесь 1 мин", "Давай медленно подышим вместе минуту и почувствуем это место."]
        },
        ja: {
            goOut: "おさんぽに行く", goElse: "ほかの場所へ", home: "おうちへ", pickTitle: "どこへ行こう？", pickSub: "あせらなくて大丈夫。いつでもおうちに帰れます。",
            place_home: "おうち", place_lawn: "おうちの前の芝生", place_rainy: "雨の日のお部屋", place_map: "旅の地図", place_mapSub: "タイの10か所",
            here: "いまここ", exitTo: "{place}へ", hint: "地面をタップで歩く · ドラッグで見回す · 光る点をタップ",
            next: "つぎへ", done: "できた", later: "またあとで", start: "はじめる", rainBtn: "雨の音と1分呼吸",
            gain: "+{n} ひかり · {pet}とおだやかなひととき", gainMax: "すてきなひととき。今日のおさんぽのひかりはいっぱいだけど、ちゃんと意味があるよ",
            doneToday: "今日はできた", oneMin: "約1分 · 自分のペースで",
            say_lawn: "ふかふかの芝生！おひさまの匂い", say_rainy: "ぽつぽつ…お部屋はぬくぬく", say_home: "ただいま〜", say_sniff: "くんくん…ここ、いいものがありそう",
            act_listen: ["3つの音を聴く", "楽な姿勢で。目を閉じてもいいよ。", "遠くの音をひとつ見つけて。", "次は近くの音をひとつ。", "そして、とても小さな音…自分の呼吸かも。"],
            act_ground: ["5-4-3-2-1 グラウンディング", "見回して、見えるものを5つ。", "感じるものを4つ。足の裏や空気など。", "聞こえる音を3つ。", "匂いを2つ。そしてやさしくゆっくり1呼吸。"],
            act_savor: ["好きなものをひとつ見つける", "この場所をゆっくり眺めて。", "好きなものをひとつ選んで。色、光、かたち。", "3回ゆっくり呼吸するあいだ、それを味わって。"],
            act_float: ["心配ごとをひとつ空へ", "小さな心配ごとをひとつ思い浮かべて。今は解決しなくていい。", "そっと言ってみて。「〜という考えが浮かんでいる」", "それをランタンにのせて、ゆっくり昇るのを見送って。", "戻ってきても大丈夫。また何度でも浮かべられるよ。"],
            act_stretch: ["{pet}といっしょにのびのび", "{pet}みたいに、背すじをすっと。", "両手を高く上げて…ゆっくり下ろす。", "肩をうしろに3回まわす。", "手をぶらぶら。小さな動きでも十分。"],
            act_rain: ["雨音とぬくぬく呼吸", "ぬくぬくして、雨の音を聴いて。", "ゆっくり吸って…少し長めに吐く。しずくがつたうように。"],
            act_breathe: ["ここで1分呼吸", "いっしょにゆっくり1分呼吸して、この場所を感じよう。"]
        }
    };
    function fill(s, v) { for (const k in v || {}) s = s.split("{" + k + "}").join(v[k]); return s; }
    function wt(key, v) {
        const d = TX[L] || TX.en;
        const s = d[key] !== undefined ? d[key] : TX.en[key];
        v = Object.assign({ pet: (S && S.world) ? petName() : "" }, v || {});
        return Array.isArray(s) ? s.map(function (x) { return fill(x, v); }) : fill(String(s), v);
    }

    // ---------- ข้อมูลสถานที่ ----------
    // bg = ชื่อภาพใน game/img (null = ภาพบ้านตามช่วงเวลาเดิม) · band = [yMin, yMax] แถบพื้นที่เดินได้ (% จากขอบล่าง)
    // fg = ของด้านหน้า { type: grass | fern | leaves | none, g: สีใบ, f: สีดอก } · tint = ให้ฉากมืดลงตอนกลางคืน
    // exits = ทางออกขอบซ้าย/ขวา (ชื่อสถานที่ หรือ "map" = เปิดแผนที่ทริป) · spots = [กิจกรรม, x %, y %]
    // กิจกรรม: listen | ground | savor | float | stretch | rain | breathe (breathe = เปิดหน้าหายใจเดิม ได้แสตมป์ทริปตามเดิม)
    const GRASS = ["#5f9e47", "#78b456", "#93c86a", "#4b8a3a"], FLOWERS = ["#fff7f0", "#f7b8cf", "#ffe08a"];
    const FERN = ["#3f8a4a", "#5aa55a", "#2f7040", "#6bb36a"];
    const PLACES = {
        home: { bg: null, band: [3, 16], fg: { type: "none" }, exits: { left: "rainy", right: "lawn" }, say: "say_home", spots: [] },
        lawn: { bg: "bg_dog_lawn", band: [3, 19], fg: { type: "grass", g: GRASS, f: FLOWERS }, tint: true, exits: { left: "home", right: "map" }, say: "say_lawn",
            spots: [["stretch", 30, 6], ["listen", 58, 17], ["savor", 88, 8]] },
        rainy: { bg: "bg_rainy_room", band: [3, 14], fg: { type: "leaves", g: ["#5f7f55", "#7a9a68", "#4c6a46"] }, exits: { right: "home" }, say: "say_rainy",
            spots: [["rain", 42, 10], ["savor", 84, 6]] }
    };
    // ที่เที่ยวใน TRIP_STOPS (game-data.js): จุดเรืองแสง + ของด้านหน้า (ที่ไหนไม่มีในนี้ใช้ค่าเริ่มต้น)
    const TRIP_EXTRA = {
        "doi-inthanon": { fg: { type: "grass", g: GRASS, f: ["#f39ab8", "#fff7f0", "#e46a8f"] }, spots: [["ground", 36, 9], ["breathe", 72, 7]] },
        "krabi": { fg: { type: "fern", g: FERN, f: ["#f39ab8"] }, spots: [["listen", 58, 14], ["breathe", 24, 6]] },
        "erawan-waterfall": { fg: { type: "fern", g: FERN }, spots: [["listen", 56, 15], ["savor", 18, 6]] },
        "lopburi-sunflower": { fg: { type: "grass", g: ["#4f8a3a", "#6aa04a", "#7fb556"], f: ["#ffd23f", "#f7b733"] }, spots: [["ground", 40, 9], ["savor", 76, 13]] },
        "floating-market": { fg: { type: "fern", g: FERN, f: ["#f06fa0"] }, spots: [["savor", 30, 8], ["listen", 68, 12]] },
        "phu-chi-fa": { fg: { type: "grass", g: ["#6f9a4a", "#88ad5a", "#b9b07a"], f: ["#fff7f0"] }, spots: [["ground", 30, 9], ["breathe", 66, 12]] },
        "chiang-mai-yi-peng": { fg: { type: "grass", g: ["#2f4b3a", "#3d5e45", "#26402f"], f: ["#ffcf7a"] }, spots: [["float", 52, 15], ["breathe", 20, 6]] },
        "ayutthaya": { fg: { type: "fern", g: FERN, f: ["#f39ab8"] }, spots: [["savor", 50, 11], ["ground", 82, 6]] },
        "khao-yai": { fg: { type: "fern", g: FERN }, spots: [["listen", 62, 11], ["ground", 25, 6]] },
        "phang-nga": { fg: { type: "fern", g: FERN }, spots: [["listen", 45, 13], ["savor", 80, 6]] }
    };

    function placeId() {
        if (!S.world || S.world === "trip") return "trip";
        const p = S.place;
        return (p === "trip" || Object.prototype.hasOwnProperty.call(PLACES, p)) ? p : "home";
    }
    function scene() {
        const id = placeId();
        if (id === "trip") {
            const st = tripStop(), ex = TRIP_EXTRA[st.id] || {};
            return { id: "trip", key: "trip:" + st.id, bg: st.bg, band: [3, 18], fg: ex.fg || { type: "grass", g: GRASS, f: FLOWERS },
                exits: S.world === "trip" ? { left: "map", right: "map" } : { left: "lawn", right: "map" },
                spots: ex.spots || [["breathe", 50, 8]], name: placeName(st.id) };
        }
        return Object.assign({ id: id, key: id, name: wt("place_" + id) }, PLACES[id]);
    }
    function exitName(dest) {
        if (dest === "map") return wt("place_map");
        if (dest === "trip") return placeName(tripStop().id);
        return wt("place_" + dest);
    }

    // ---------- สร้าง DOM: ย้ายของในฉากเข้า "โลก" ที่กว้างกว่าจอได้ ----------
    let world, fgEl, spotsEl, lifeEl, homeBtn, exitL, exitR, goBtn;
    function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }
    const CHEV = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    function build() {
        world = el("div", "w-world");
        world.id = "wWorld";
        stage.insertBefore(world, stage.firstChild);
        ["stageBg"].forEach(function (id) { if ($(id)) world.appendChild($(id)); });
        lifeEl = stage.querySelector(".life");
        if (lifeEl) world.appendChild(lifeEl);
        const shade = stage.querySelector(".stage-shade");
        if (shade) world.appendChild(shade);
        ["decorRow", "visitorBtn"].forEach(function (id) { if ($(id)) world.appendChild($(id)); });
        spotsEl = el("div", "w-spots");
        world.appendChild(spotsEl);
        ["toy", "petBtn", "fx"].forEach(function (id) { if ($(id)) world.appendChild($(id)); });
        fgEl = el("div", "w-fg");
        fgEl.setAttribute("aria-hidden", "true");
        stage.insertBefore(fgEl, world.nextSibling);

        homeBtn = el("button", "w-ui w-home", '<span aria-hidden="true">🏠</span><b></b>');
        homeBtn.type = "button";
        homeBtn.addEventListener("click", function (e) { e.stopPropagation(); go("home", null); });
        exitL = el("button", "w-ui w-exit w-left", '<i>' + CHEV + '</i><b></b>');
        exitR = el("button", "w-ui w-exit w-right", '<b></b><i>' + CHEV + '</i>');
        [exitL, exitR].forEach(function (b) {
            b.type = "button";
            b.addEventListener("click", function (e) { e.stopPropagation(); go(b.dataset.dest, b === exitL ? "left" : "right", b); });
            stage.appendChild(b);
        });
        stage.appendChild(homeBtn);

        // ปุ่ม "ออกไปเดินเล่น" ข้างปุ่มพักสั้น (ใช้หน้าตาแบบปุ่มแผนที่เดิม)
        goBtn = el("button", "map-btn w-go", '<span class="w-go-ico" aria-hidden="true">🚪</span><span><b></b></span>');
        goBtn.type = "button";
        goBtn.id = "wGoBtn";
        goBtn.addEventListener("click", function () { openPicker(goBtn); });
        const row = $("qbRow");
        if (row) row.appendChild(goBtn);

        buildSheets();
        bindCamera();
        $("stageBg").addEventListener("load", function () { layout(); });
        if (window.ResizeObserver) new ResizeObserver(function () { layout(); }).observe(stage);
        else window.addEventListener("resize", layout);
        document.addEventListener("visibilitychange", function () { if (!document.hidden) kick(); });
    }

    // ---------- เลย์เอาต์ + กล้อง ----------
    const B = Pet.bounds || {};
    let cur = null, lastKey = "", sw = 0, sh = 0, W = 0, wide = false, cam = 0, lastCam = -1;
    let lookX = null, lookUntil = 0, dragging = false, raf = 0, lastT = 0, edgeT = 0, fgKey = "";
    let pendingEntry = null, pendingSay = false;
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function layout() {
        if (!cur || !world) return;
        sw = stage.clientWidth;
        sh = stage.clientHeight;
        if (!sw || !sh) return;
        const bg = $("stageBg");
        let ar = 0;
        if (cur.bg) ar = (bg.naturalWidth && bg.getAttribute("src") === img(cur.bg)) ? bg.naturalWidth / bg.naturalHeight : 16 / 9;
        wide = ar > 0 && sh * ar > sw * 1.08;
        W = wide ? Math.round(sh * ar) : sw;
        world.style.width = W + "px";
        stage.style.setProperty("--sw", sw + "px");
        stage.classList.toggle("w-wide", wide);
        B.ratio = W / sw;
        B.scale = wide ? 0.86 : 1;
        B.y0 = cur.band[0];
        B.y1 = cur.band[1];
        if (wide) { B.x0 = (sw * 0.44 * 0.5 * B.scale) / W * 100 * 0.75; B.x1 = 100 - B.x0; }
        else { B.x0 = 16; B.x1 = 84; }
        B.center = function () { return (cam + sw / 2) / W * 100; };
        // ของด้านหน้า (วาดใหม่เมื่อขนาด/ฉากเปลี่ยน)
        const fgW = Math.round(sw + (W - sw) * (reduced ? 1 : FG_SPEED));
        const k = cur.key + "|" + fgW + "|" + sh;
        if (k !== fgKey) {
            fgKey = k;
            fgEl.className = "w-fg w-fg-" + cur.fg.type;
            fgEl.style.width = fgW + "px";
            fgEl.innerHTML = fgSvg(fgW, Math.round(sh * (cur.fg.type === "grass" ? 0.11 : 0.2)), cur.fg, cur.key);
        }
        // วางน้องเมื่อเพิ่งมาถึง
        if (pendingEntry) {
            const side = pendingEntry;
            pendingEntry = null;
            const p = Pet.pos, y = clamp(p.y, B.y0 + 2, B.y1 - 3);
            if (side === "left") { cam = 0; Pet.moveTo(B.x0, y, B.x0 + 30 / B.ratio); }
            else if (side === "right") { cam = Math.max(0, W - sw); Pet.moveTo(B.x1, y, B.x1 - 30 / B.ratio); }
            else { cam = Math.max(0, (W - sw) / 2); Pet.moveTo(50, y); }
            lookX = null;
            if (pendingSay && cur.say) { pendingSay = false; setTimeout(function () { Pet.say(wt(cur.say)); }, reduced ? 50 : 900); }
        } else if (Pet.pos.x < B.x0 || Pet.pos.x > B.x1) {
            Pet.moveTo(clamp(Pet.pos.x, B.x0, B.x1), Pet.pos.y);
        }
        cam = clamp(cam, 0, Math.max(0, W - sw));
        lastCam = -1;
        apply();
        kick();
    }
    function apply() {
        if (cam === lastCam) return;
        lastCam = cam;
        const c = Math.round(cam * 10) / 10;
        world.style.transform = "translate3d(" + (-c) + "px,0,0)";
        fgEl.style.transform = "translate3d(" + (-(reduced ? c : c * FG_SPEED)).toFixed(1) + "px,0,0)";
        if (lifeEl && lifeEl.parentNode === world) lifeEl.style.transform = reduced ? "" : "translate3d(" + (c * (1 - LIFE_SPEED)).toFixed(1) + "px,0,0)";
    }
    function running() { return !document.hidden && !$("screen-home").hidden && !!cur; }
    function kick() { if (!raf && running()) { lastT = 0; raf = requestAnimationFrame(frame); } }
    function frame(now) {
        raf = 0;
        if (!running()) return;
        const dt = lastT ? Math.min(64, now - lastT) : 16.7;
        lastT = now;
        const maxCam = Math.max(0, W - sw);
        let target;
        if (lookX !== null && (dragging || now < lookUntil)) target = lookX;
        else { lookX = null; target = petEl.offsetLeft - sw / 2; }
        target = clamp(target, 0, maxCam);
        if (reduced || dragging) cam = target;
        else {
            cam += (target - cam) * (1 - Math.pow(0.9, dt / 16.7));
            if (Math.abs(target - cam) < 0.3) cam = target;
        }
        apply();
        if (now - edgeT > 180) { edgeT = now; edges(); }
        raf = requestAnimationFrame(frame);
    }
    // ทางออกขอบฉาก: โผล่เมื่อน้องเดินไปถึงขอบ (หรือเลื่อนมองไปสุดขอบ)
    function edges() {
        if (!cur) return;
        const x = W ? petEl.offsetLeft / W * 100 : 50, zone = 3, maxCam = Math.max(0, W - sw);
        const looking = lookX !== null;
        showExit(exitL, cur.exits.left, x <= B.x0 + zone || (looking && wide && cam <= 2));
        showExit(exitR, cur.exits.right, x >= B.x1 - zone || (looking && wide && cam >= maxCam - 2));
    }
    function showExit(b, dest, on) {
        on = !!(dest && on);
        if (b.classList.contains("show") === on && b.dataset.dest === (dest || "")) return;
        b.dataset.dest = dest || "";
        b.classList.toggle("show", on);
        b.tabIndex = on ? 0 : -1;
        b.setAttribute("aria-hidden", String(!on));
        if (dest) {
            b.querySelector("b").textContent = exitName(dest);
            b.setAttribute("aria-label", wt("exitTo", { place: exitName(dest) }));
        }
    }

    // ลากเพื่อมองรอบ ๆ (เฉพาะฉากกว้าง) · แตะพื้น = น้องเดินไป (game-pet.js) แล้วกล้องกลับมาตามน้อง
    function bindCamera() {
        let d = null, swallow = false;
        $("stageBg").draggable = false;
        stage.addEventListener("dragstart", function (e) { e.preventDefault(); });   // เมาส์ลากภาพ = มองรอบ ๆ ไม่ใช่ลากไฟล์
        stage.addEventListener("pointerdown", function (e) {
            if (!wide || e.button > 0 || e.target.closest(".pet, .w-ui, .stage-say, .bond-chip")) return;
            d = { x: e.clientX, cam: cam, moved: false, id: e.pointerId };
        });
        stage.addEventListener("pointermove", function (e) {
            if (!d || e.pointerId !== d.id) return;
            const dx = e.clientX - d.x;
            if (!d.moved && Math.abs(dx) > 8) {
                d.moved = true;
                dragging = true;
                try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ไม่รองรับ */ }
            }
            if (d.moved) { lookX = clamp(d.cam - dx, 0, Math.max(0, W - sw)); kick(); }
        });
        function end() {
            if (d && d.moved) { swallow = true; lookUntil = performance.now() + 3500; setTimeout(function () { swallow = false; }, 350); }
            d = null;
            dragging = false;
        }
        stage.addEventListener("pointerup", end);
        stage.addEventListener("pointercancel", end);
        // ลากแล้วปล่อย ไม่นับเป็นแตะ (กันน้องเดินไปเอง)
        $("screen-home").addEventListener("click", function (e) {
            if (swallow && stage.contains(e.target)) { swallow = false; e.stopPropagation(); e.preventDefault(); }
        }, true);
        stage.addEventListener("click", function (e) { if (!e.target.closest(".w-ui")) lookX = null; });
    }

    // ---------- ของด้านหน้า: หญ้า ดอกไม้ ใบไม้ วาดด้วย SVG (สุ่มแบบคงที่ต่อฉาก) ----------
    function rng(seed) {
        let h = 2166136261;
        for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
        return function () {
            h += 0x6D2B79F5;
            let t2 = h;
            t2 = Math.imul(t2 ^ (t2 >>> 15), t2 | 1);
            t2 ^= t2 + Math.imul(t2 ^ (t2 >>> 7), t2 | 61);
            return ((t2 ^ (t2 >>> 14)) >>> 0) / 4294967296;
        };
    }
    function leaf(bx, by, ang, len, wid, col) {
        const tx = bx + Math.cos(ang) * len, ty = by - Math.sin(ang) * len;
        const mx = (bx + tx) / 2, my = (by + ty) / 2, nx = Math.sin(ang) * wid, ny = Math.cos(ang) * wid;
        return '<path d="M' + bx.toFixed(1) + " " + by.toFixed(1) + "Q" + (mx - nx).toFixed(1) + " " + (my - ny).toFixed(1) + " " + tx.toFixed(1) + " " + ty.toFixed(1) +
            "Q" + (mx + nx).toFixed(1) + " " + (my + ny).toFixed(1) + " " + bx.toFixed(1) + " " + by.toFixed(1) + 'Z" fill="' + col + '"/>';
    }
    function fgSvg(w, h, cfg, seed) {
        if (!cfg || cfg.type === "none" || !w || !h) return "";
        const r = rng(seed), g = cfg.g || GRASS, f = cfg.f || [];
        function pick(a) { return a[Math.floor(r() * a.length)]; }
        let p = "";
        if (cfg.type === "grass") {
            const n = Math.round(w / 4.5);
            for (let i = 0; i < n; i++) {
                const x = r() * w, tuft = r() < 0.18, bh = h * (tuft ? 0.6 + r() * 0.4 : 0.22 + r() * 0.4), lean = (r() - 0.5) * bh * 0.6, bw = 1.6 + r() * 2.6;
                p += '<path d="M' + (x - bw).toFixed(1) + " " + h + "Q" + (x + lean * 0.3).toFixed(1) + " " + (h - bh * 0.6).toFixed(1) + " " + (x + lean).toFixed(1) + " " + (h - bh).toFixed(1) +
                    "Q" + (x + lean * 0.3 + bw).toFixed(1) + " " + (h - bh * 0.5).toFixed(1) + " " + (x + bw).toFixed(1) + " " + h + 'Z" fill="' + pick(g) + '"/>';
            }
            const nf = f.length ? Math.round(w / 70) : 0;
            for (let i = 0; i < nf; i++) {
                const x = r() * w, y = h * (0.35 + r() * 0.4), c = pick(f), s = 2.4 + r() * 1.6;
                for (let k = 0; k < 5; k++) { const a = k * 1.2566; p += '<circle cx="' + (x + Math.cos(a) * s).toFixed(1) + '" cy="' + (y + Math.sin(a) * s).toFixed(1) + '" r="' + (s * 0.75).toFixed(1) + '" fill="' + c + '"/>'; }
                p += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (s * 0.55).toFixed(1) + '" fill="#f2b84b"/>';
            }
        } else if (cfg.type === "fern") {
            const n = Math.max(2, Math.round(w / 170));
            for (let i = 0; i < n; i++) {
                const x = (i + 0.2 + r() * 0.6) * (w / n);
                const k = 4 + Math.floor(r() * 4);
                for (let j = 0; j < k; j++) p += leaf(x + (r() - 0.5) * 20, h + 2, 0.5 + r() * 2.1, h * (0.45 + r() * 0.6), 5 + r() * 6, pick(g));
                if (f.length && r() < 0.5) { const c = pick(f); p += '<circle cx="' + (x + 6).toFixed(1) + '" cy="' + (h * 0.55).toFixed(1) + '" r="4" fill="' + c + '"/>'; }
            }
            // หญ้าเตี้ย ๆ ตลอดแนว
            for (let i = 0; i < w / 9; i++) { const x = r() * w, bh = h * (0.12 + r() * 0.2); p += leaf(x, h + 1, 1.3 + (r() - 0.5) * 0.6, bh, 1.6, pick(g)); }
        } else if (cfg.type === "leaves") {
            const n = Math.max(2, Math.round(w / 320));
            for (let i = 0; i < n; i++) {
                const x = (i + 0.1 + r() * 0.8) * (w / n);
                for (let j = 0; j < 5; j++) p += leaf(x, h + 4, 0.6 + r() * 1.9, h * (0.5 + r() * 0.5), 9 + r() * 7, pick(g));
            }
        }
        return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" focusable="false">' + p + "</svg>";
    }

    // ---------- จุดเรืองแสง ----------
    function spotKey(sp) { return cur.key + ":" + sp[0] + ":" + sp[1]; }
    function renderSpots() {
        spotsEl.textContent = "";
        const done = (S.today && S.today.wdone) || {};
        cur.spots.forEach(function (sp) {
            const b = el("button", "w-spot w-ui" + (done[spotKey(sp)] ? " done" : ""), "<i></i>");
            b.type = "button";
            b.style.left = sp[1] + "%";
            b.style.bottom = sp[2] + "%";
            b.style.zIndex = String(40 - Math.round(sp[2]));
            b.style.animationDelay = (-((sp[1] * 37) % 30) / 10) + "s";
            b.setAttribute("aria-label", wt("act_" + sp[0])[0] + (done[spotKey(sp)] ? " · " + wt("doneToday") : ""));
            b.addEventListener("click", function (e) { e.stopPropagation(); tapSpot(sp, b); });
            spotsEl.appendChild(b);
        });
    }
    function tapSpot(sp, btn) {
        lookX = null;
        audioCtxSafe();
        let opened = false;
        function open() { if (opened) return; opened = true; openAct(sp, btn); }
        const side = Pet.pos.x < sp[1] ? -1 : 1;
        const tx = clamp(sp[1] + side * (sw * 0.16 / W * 100), B.x0, B.x1);
        if (Pet.isActive()) {
            Pet.sniffAt(tx, clamp(sp[2], B.y0, B.y1), function () {
                Pet.say(wt("say_sniff"));
                setTimeout(open, reduced ? 0 : 700);
            });
            setTimeout(open, 4500);                     // เดินไกลมาก: ไม่ให้รอนาน
        } else open();
    }
    function audioCtxSafe() { try { if (typeof audioCtx === "function") audioCtx(); } catch (e) { /* ไม่มีเสียงก็ได้ */ } }

    // ---------- หน้าต่างกิจกรรม 1 นาที ----------
    let act = null, actFrom = null;
    function buildSheets() {
        const app = $("app");
        const a = el("div", "sheet sheet-center w-act-sheet");
        a.id = "wActSheet";
        a.hidden = true;
        a.innerHTML = '<div class="sheet-box w-act" role="dialog" aria-modal="true" aria-labelledby="wActTitle">' +
            '<button class="sheet-close" type="button" id="wActClose">×</button>' +
            '<div class="w-act-art"><img id="wActImg" alt=""></div>' +
            '<h2 class="h-display" id="wActTitle"></h2><p class="muted w-act-meta" id="wActMeta"></p>' +
            '<div class="w-act-dots" id="wActDots" aria-hidden="true"></div>' +
            '<p class="w-act-step" id="wActStep" aria-live="polite"></p>' +
            '<div class="item-actions"><button class="btn" type="button" id="wActLater"></button><button class="btn btn-primary" type="button" id="wActNext"></button></div>' +
            '<button class="btn btn-small w-act-extra" type="button" id="wActExtra" hidden></button></div>';
        app.appendChild(a);
        const p = el("div", "sheet w-pick-sheet");
        p.id = "wPickSheet";
        p.hidden = true;
        p.innerHTML = '<div class="sheet-box" role="dialog" aria-modal="true" aria-labelledby="wPickTitle">' +
            '<button class="sheet-close" type="button" id="wPickClose">×</button>' +
            '<h2 class="h-display" id="wPickTitle"></h2><p class="muted" id="wPickSub"></p><div class="w-pick-list" id="wPickList"></div></div>';
        app.appendChild(p);
        $("wActClose").addEventListener("click", closeAct);
        $("wActLater").addEventListener("click", closeAct);
        $("wActNext").addEventListener("click", nextAct);
        $("wActExtra").addEventListener("click", function () { const k = act && act.sp[0]; closeAct(); breatheHere(k === "rain"); });
        a.addEventListener("click", function (e) { if (e.target === a) closeAct(); });
        $("wPickClose").addEventListener("click", closePicker);
        p.addEventListener("click", function (e) { if (e.target === p) closePicker(); });
        document.addEventListener("keydown", function (e) {
            if (e.key !== "Escape") return;
            if (!a.hidden) closeAct(); else if (!p.hidden) closePicker();
        });
    }
    function openAct(sp, from) {
        const lines = wt("act_" + sp[0]);
        act = { sp: sp, lines: lines, i: 1 };
        actFrom = from || document.activeElement;
        $("wActImg").src = img(WORLDS[S.world].pet.happy);
        $("wActImg").alt = petName();
        $("wActTitle").textContent = lines[0];
        $("wActMeta").textContent = wt("oneMin");
        $("wActClose").setAttribute("aria-label", t("close"));
        $("wActLater").textContent = wt("later");
        const extra = sp[0] === "rain";
        $("wActExtra").hidden = !extra;
        $("wActExtra").textContent = wt("rainBtn");
        const dots = $("wActDots");
        dots.textContent = "";
        for (let i = 1; i < lines.length; i++) dots.appendChild(el("i"));
        renderAct();
        $("wActSheet").hidden = false;
        $("wActNext").focus();
    }
    function renderAct() {
        const n = act.lines.length - 1, last = act.i >= n;
        $("wActStep").textContent = act.lines[act.i];
        $("wActDots").querySelectorAll("i").forEach(function (d, k) { d.className = k < act.i ? "on" : ""; });
        $("wActNext").textContent = act.sp[0] === "breathe" ? wt("start") : (last ? wt("done") : wt("next"));
        const art = $("wActSheet").querySelector(".w-act-art");
        art.classList.remove("pulse"); void art.offsetWidth; art.classList.add("pulse");
    }
    function nextAct() {
        if (!act) return;
        if (act.sp[0] === "breathe") { closeAct(); breatheHere(false); return; }
        if (act.i < act.lines.length - 1) { act.i++; renderAct(); return; }
        const sp = act.sp;
        closeAct();
        complete(sp);
    }
    function closeAct() {
        $("wActSheet").hidden = true;
        act = null;
        if (actFrom && actFrom.focus && document.contains(actFrom)) actFrom.focus({ preventScroll: true });
        actFrom = null;
    }
    // หายใจ 1 นาทีด้วยหน้าหายใจเดิม (แสง/แสตมป์ตามกติกาเดิม)
    function breatheHere(rain) {
        // v29: ใช้เสียงฝนเฉพาะรอบนี้ ออกจากหน้าหายใจแล้วคืนเสียงที่ผู้เล่นเลือกไว้ (ไม่เปลี่ยนค่าที่บันทึก)
        if (rain && S.sound !== "rain") { window.hkSoundRestore = S.sound; S.sound = "rain"; }
        if (typeof quickBreathe === "function") quickBreathe("calm"); else showTab("breathe");
    }
    // ทำเสร็จ: แสงเล็กน้อยตามโควตาต่อวัน + แสตมป์ทริป (ถ้าอยู่ที่เที่ยว) · ไม่มีบทลงโทษ
    function complete(sp) {
        rolloverCheck();
        S.today.wspot = (S.today.wspot || 0) + 1;
        if (!S.today.wdone || typeof S.today.wdone !== "object") S.today.wdone = {};
        S.today.wdone[spotKey(sp)] = true;
        S.stats.walk = (S.stats.walk || 0) + 1;
        const gain = S.today.wspot <= WALK_LIGHT_TIMES ? WALK_LIGHT : 0;
        if (gain) addLight(gain); else { markActive(); save(); }
        let msg = gain ? wt("gain", { n: gain }) : wt("gainMax");
        const stamp = tripStampEarn();
        if (stamp) msg += " · " + stamp;
        toast(msg);
        renderSpots();
        if (typeof renderTasks === "function" && !$("screen-home").hidden) renderTasks();
        if (Pet.isActive()) Pet.say(t("hello", { pet: petName() }));
    }

    // ---------- เลือกที่ไป ----------
    let pickFrom = null;
    function openPicker(from) {
        pickFrom = from || document.activeElement;
        $("wPickTitle").textContent = wt("pickTitle");
        $("wPickSub").textContent = wt("pickSub");
        $("wPickClose").setAttribute("aria-label", t("close"));
        const list = $("wPickList"), here = placeId();
        list.textContent = "";
        const opts = [["home", img(WORLDS[S.world].bg ? WORLDS[S.world].bg.day : "bg_cat_day")], ["lawn", img(PLACES.lawn.bg)], ["rainy", img(PLACES.rainy.bg)], ["map", "game/img/trip_map.webp"]];
        opts.forEach(function (o) {
            const b = el("button", "w-pick-item" + (o[0] === here ? " here" : ""));
            b.type = "button";
            const im = el("img");
            im.src = o[1];
            im.alt = "";
            im.loading = "lazy";
            const s = el("span");
            const nb = el("b");
            nb.textContent = wt("place_" + o[0]);
            const sm = el("small");
            sm.textContent = o[0] === here ? wt("here") : (o[0] === "map" ? wt("place_mapSub") + (here === "trip" ? " · " + wt("here") + ": " + placeName(tripStop().id) : "") : "");
            s.append(nb, sm);
            b.append(im, s);
            if (o[0] === here) b.setAttribute("aria-current", "location");
            b.addEventListener("click", function () {
                if (o[0] === here) { closePicker(); return; }
                closePicker(true);
                go(o[0], null, goBtn);
            });
            list.appendChild(b);
        });
        $("wPickSheet").hidden = false;
        $("wPickClose").focus();
    }
    function closePicker(silent) {
        $("wPickSheet").hidden = true;
        if (!silent && pickFrom && pickFrom.focus && document.contains(pickFrom)) pickFrom.focus();
        pickFrom = null;
    }

    // ---------- ย้ายที่ ----------
    let moving = false;
    function go(dest, side, from) {
        if (!dest || moving) return;
        if (dest === "map") { openMap(null, from || goBtn); return; }
        if (S.world === "trip") { if (dest !== "trip") openMap(null, from || goBtn); return; }
        if (dest === placeId()) return;
        moving = true;
        stage.classList.add("w-fade");
        setTimeout(function () {
            S.place = dest;
            save();
            pendingEntry = side === "right" ? "left" : (side === "left" ? "right" : "left");
            pendingSay = true;
            if (typeof renderHome === "function") renderHome(); else render();
            requestAnimationFrame(function () { stage.classList.remove("w-fade"); moving = false; });
        }, reduced ? 0 : 240);
    }

    // ---------- วาด (เรียกจาก renderHome ใน game.js) ----------
    function render() {
        if (!ok || !S.world) return;
        if (!world) build();
        if (S.place === undefined || (S.place !== "trip" && !Object.prototype.hasOwnProperty.call(PLACES, S.place))) S.place = "home";
        cur = scene();
        const away = cur.id !== "home";
        const tod = timeOfDay();
        stage.classList.toggle("w-away", away);
        stage.classList.toggle("w-tint", !!cur.tint);
        stage.dataset.tod = tod;
        stage.dataset.place = cur.id;
        if (away) $("visitorBtn").hidden = true;             // เพื่อนมาเยี่ยม + ของแต่งบ้าน อยู่ที่บ้าน
        if (cur.key !== lastKey) {
            if (lastKey && !pendingEntry) pendingEntry = "left";   // มาถึงที่เที่ยวจากแผนที่: เดินเข้าจากซ้าย
            lastKey = cur.key;
            renderSpots();
            if (away && !S.walkHint) { S.walkHint = true; save(); setTimeout(function () { toast(wt("hint")); }, 1400); }
        } else renderSpots();
        // ปุ่มกลับบ้าน (บนฉาก) + ปุ่มออกไปเดินเล่น/ไปที่อื่น (ข้างปุ่มพักสั้น)
        const pets = S.world !== "trip";
        homeBtn.hidden = !(pets && away);
        homeBtn.querySelector("b").textContent = wt("home");
        homeBtn.setAttribute("aria-label", wt("home"));
        goBtn.hidden = !pets;
        goBtn.querySelector(".w-go-ico").textContent = away ? "📍" : "🚪";
        goBtn.querySelector("b").textContent = away ? wt("goElse") : wt("goOut");
        if (pets) $("qbRow").classList.add("trip");          // ปุ่มพักสั้นแบบกะทัดรัด (สไตล์เดิมของแถวทริป)
        layout();
        edges();
        kick();
    }

    if (ok && S.world && !$("screen-home").hidden) render();
    return {
        // ภาพฉากของสถานที่ปัจจุบัน (null = ใช้ภาพบ้าน/ทริปตามเดิม)
        bg: function () {
            if (!ok || !S.world || S.world === "trip") return null;
            const id = placeId();
            if (id === "home") return null;
            return id === "trip" ? tripStop().bg : PLACES[id].bg;
        },
        render: render,
        go: function (dest) { go(dest, null); },
        places: PLACES, trips: TRIP_EXTRA, text: TX
    };
})();

// v29: ปุ่มบนฉาก (ผูกพัน / กลับบ้าน) ขยับลงตามความสูงคำพูดของน้อง ไม่ทับกันเมื่อคำพูดยาว 2 บรรทัด
(function () {
    const say = document.getElementById("petSay"), stage = document.getElementById("stage");
    if (!say || !stage || typeof ResizeObserver === "undefined") return;
    function place() {
        const top = say.hidden || !say.textContent.trim() ? 12 : say.offsetTop + say.offsetHeight + 6;
        stage.style.setProperty("--say-bottom", Math.max(58, top) + "px");
    }
    new ResizeObserver(place).observe(say);
    new MutationObserver(place).observe(say, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
    place();
})();
