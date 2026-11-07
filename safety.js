// =====================================================================
// Hikari - safety.js  (ใช้ร่วมกันทั้งหน้าเว็บ index.html และเกม game.html · โหลดหลัง config.js ก่อน script.js / game.js)
// 1) hasRiskText(ข้อความ): ตรวจคำที่สื่อว่าอยากตาย / ไม่อยากมีชีวิต / ทำร้ายตัวเอง / สิ้นหวัง
//    v27: 10 ภาษา (th en zh hi es fr ar pt ru ja) ตรวจทุกภาษาพร้อมกันเสมอ ไม่ขึ้นกับภาษาที่เลือก · มีขั้นตัดสำนวน (IDIOMS)
//    ตรวจในเครื่องเท่านั้น ไม่ส่งข้อความไปที่ไหน ไม่เก็บข้อความ เก็บแค่ "เวลา" ที่พบ (ใช้ซ่อนการขาย 7 วัน)
//    กฎไม่สมมาตร: ชวนขอความช่วยเหลือกับคนที่ไม่ได้ต้องการ = ไม่เป็นไร ดีกว่าพลาดคนที่ต้องการ (คำบวกลวงยอมรับได้)
//    ห้ามใส่รายการ "วิธี" ทำร้ายตัวเอง และห้ามแสดงคำในรายการนี้ให้ผู้ใช้เห็น
// 2) inDistress(ผู้ใช้): true = ช่วงนี้อาจกำลังหนัก → ไม่แสดงของขายด้วยเงิน / แบนเนอร์ Premium / Care+ / ราคา
//    (ไม่บอกผู้ใช้ว่าซ่อนเพราะอะไร แค่ไม่แสดง) ของที่แลกด้วยแสง (ฟรี) ยังแสดงได้
//    - คัดกรอง 9Q ครั้งล่าสุดได้ ≥ 7 คะแนน
//    - 9Q ข้อ 9 (คิดทำร้ายตัวเอง) ≥ 1 ภายใน 14 วัน
//    - พบข้อความเสี่ยงภายใน 7 วัน: hikariCare_<ผู้ใช้> (หน้าเว็บเขียน) / hikariCareGame_<ผู้ใช้> (เกมเขียน) = เวลา ms
//    - เช็กอินอารมณ์ 3 ครั้งล่าสุดบนหน้าเว็บ (hikariMoods_<ผู้ใช้>) เป็นระดับต่ำสุด "very" (เกมตรวจอารมณ์ของเกมเองเพิ่ม)
// =====================================================================

const HikariSafety = (function () {
    const DAY = 86400000;
    const CARE_DAYS = 7;           // พบข้อความเสี่ยง → ไม่ขายของ 7 วัน
    const SELF_HARM_DAYS = 14;     // 9Q ข้อ 9 ≥ 1 → ไม่ขายของ 14 วัน
    const DEP_HIGH = 7;            // 9Q ≥ 7 = มีอาการระดับน้อยขึ้นไป
    const SELF_HARM_ITEM = 8;      // ลำดับข้อ 9 (นับจาก 0) ตรงกับ DEP_SELF_HARM_ITEM ใน content.js

    // ทำข้อความให้อยู่รูปเดียวกันก่อนเทียบ (ข้อความผู้ใช้และรายการคำผ่านขั้นตอนเดียวกัน จึงเทียบได้ตรงกัน)
    // - NFKC: ตัวเต็มความกว้าง/ครึ่งความกว้าง (ญี่ปุ่น จีน) เป็นรูปปกติ · ตัวเล็ก · ตัดอักขระมองไม่เห็น
    // - ละติน: ตัดเครื่องหมายเหนือ/ใต้ตัวอักษร (não = nao, daño = dano, réveiller = reveiller) · รัสเซีย ё = е, й = и
    // - อาหรับ: ตัดสระ/ทัชกีล/ตัตวีล, أ إ آ ٱ = ا, ى = ي, ة = ه, ؤ = و, ئ = ي
    // - ฮินดี: ตัดนุกตา (ख़ = ख), จันทรพินทุ ँ = อนุสวาร ं
    // - ญี่ปุ่น: คาตากานะ = ฮิรางานะ (シニタイ = しにたい) · จีนตัวเต็มบางตัว = ตัวย่อ (ตาราง ZH_T2S)
    // - ไทย: ตัดวรรณยุกต์ ่ ้ ๊ ๋ ์ ็ (เฉพาะช่วงอักษรไทย U+0E47–U+0E4C ไม่แตะเทวนาครี/อาหรับ)
    // - ตัดช่องว่าง เครื่องหมาย แล้วยุบตัวอักษรซ้ำติดกันเหลือตัวเดียว (ตายยยย → ตาย, diiie → die, 想死死 → 想死)
    const ZH_T2S = {
        "殺": "杀", "傷": "伤", "殘": "残", "結": "结", "沒": "没", "義": "义", "輕": "轻", "會": "会", "個": "个",
        "麼": "么", "麽": "么", "著": "着", "贅": "赘", "絕": "绝", "絶": "绝", "戀": "恋", "撐": "撑", "來": "来",
        "從": "从", "為": "为", "爲": "为", "尋": "寻", "開": "开", "無": "无", "裡": "里", "裏": "里", "們": "们",
        "減": "减", "動": "动", "躍": "跃", "讓": "让", "還": "还", "離": "离", "臉": "脸", "這": "这", "麗": "丽",
        "總": "总", "於": "于", "負": "负", "擔": "担", "嗎": "吗", "說": "说", "説": "说", "實": "实", "隻": "只"
    };
    const ZH_T2S_RE = new RegExp("[" + Object.keys(ZH_T2S).join("") + "]", "g");
    function normalize(text) {
        let s = String(text || "");
        try { s = s.normalize("NFKC"); } catch (e) { /* เบราว์เซอร์เก่า */ }
        s = s.toLowerCase()
            .replace(/[​-‏⁠﻿­]/g, "")      // zero-width / soft hyphen
            .replace(/ํา/g, "ำ");                     // NFKC แยก ำ เป็น ํ+า → รวมกลับ
        try {
            s = s.normalize("NFD")
                .replace(/[̀-ًͯ-ٰٟۖ-़ۭ]/g, "")   // เครื่องหมายละติน/อาหรับ/นุกตา
                .normalize("NFC");
        } catch (e) { /* เบราว์เซอร์เก่า */ }
        s = s.replace(/ـ/g, "")                                  // ตัตวีล ـ
            .replace(/[آأإٱ]/g, "ا")          // آ أ إ ٱ → ا
            .replace(/ى/g, "ي").replace(/ی/g, "ي") // ى ی → ي
            .replace(/ة/g, "ه")                              // ة → ه
            .replace(/ؤ/g, "و").replace(/ئ/g, "ي") // ؤ → و, ئ → ي
            .replace(/ک/g, "ك")                              // ک → ك
            .replace(/ँ/g, "ं")                              // ँ → ं
            .replace(/ё/g, "е").replace(/й/g, "и")
            .replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); })  // カタカナ → ひらがな
            .replace(ZH_T2S_RE, function (c) { return ZH_T2S[c]; })
            .replace(/[\u0e47-\u0e4c]/g, "")                      // วรรณยุกต์ ่ ้ ๊ ๋ การันต์ ์ ไม้ไต่คู้ ็
            .replace(/[\sๆฯ.,!?;:'"`’‘“”()\[\]{}\-_~*+=/\\|<>@#$%^&…。、！？¿¡«»„‚–—―·•「」『』【】〈〉《》〜～・،؛؟।॥]/g, "")   // ช่องว่าง ๆ ฯ เครื่องหมาย
            .replace(/(.)\1+/g, "$1");                                   // ตัวซ้ำติดกัน
        return s;
    }
    // วลีที่สื่อความเสี่ยง (ไม่มีคำบอก "วิธี") · เพิ่มคำได้ เขียนแบบปกติ ระบบจะ normalize ให้เอง
    const PHRASES_TH = [
        "อยากตาย", "อยากจะตาย", "อยากตายไปเลย", "ตายไปซะ", "ตายไปคงดี", "ตายดีกว่า", "ตายซะดีกว่า", "ตายไปก็ดี",
        "ไม่อยากอยู่แล้ว", "ไม่อยากอยู่ต่อ", "ไม่อยากอยู่บนโลก", "ไม่อยากมีชีวิต", "ไม่อยากมีชีวิตอยู่", "ไม่อยากเกิดมา",
        "ไม่อยากตื่น", "ไม่อยากตื่นขึ้นมา", "หลับไม่ต้องตื่น", "หลับไปไม่ตื่น", "อยากหลับยาว", "ไม่อยากหายใจ",
        "อยากหายไป", "อยากหายไปจากโลก", "อยากไปให้พ้น", "อยากลาโลก", "ลาโลก", "อยากไปสบาย", "อยากตุย", "อยากม่องเท่ง",
        "จบชีวิต", "จบชีวิตตัวเอง", "ปลิดชีวิต", "ฆ่าตัวตาย", "ฆ่าตัวเอง", "คิดสั้น",
        "ทำร้ายตัวเอง", "ทำร้ายร่างกายตัวเอง", "ทำให้ตัวเองเจ็บ",
        "ไม่มีใครต้องการ", "ไม่มีใครต้องการฉัน", "ไม่มีใครต้องการเรา", "ถ้าไม่มีฉันคงดี", "ถ้าไม่มีเราคงดี", "เป็นภาระของทุกคน",
        "อยู่ไปก็ไม่มีความหมาย", "อยู่ไปทำไม", "อยู่ไปก็เท่านั้น", "ไม่มีเหตุผลที่จะอยู่", "ชีวิตไม่มีความหมาย",
        "หมดหวัง", "สิ้นหวัง", "ไม่มีทางออก", "ไร้ค่า", "ไม่ไหวแล้วจริงๆ"
    ];
    const PHRASES_EN = [
        "want to die", "wanna die", "wish i was dead", "wish i were dead", "better off dead", "rather be dead",
        "kill myself", "killing myself", "suicide", "suicidal", "unalive",
        "end my life", "end it all", "want to end it", "take my own life", "take my life",
        "self harm", "selfharm", "hurt myself", "harm myself", "cut myself",
        "dont want to live", "do not want to live", "dont want to be alive", "dont want to be here anymore",
        "dont want to wake up", "do not want to wake up", "never wake up", "no reason to live", "not worth living",
        "better off without me", "nobody needs me", "no one needs me", "nobody would miss me", "no one would miss me",
        "cant go on", "hopeless", "want to disappear"
    ];
    // v27: วลีภาษาอื่น (ไม่มีคำบอก "วิธี" · ห้ามแสดงให้ผู้ใช้เห็น) · ตรวจทุกภาษาเสมอ ไม่ขึ้นกับภาษาที่เลือกบนหน้าจอ
    // เขียนรูปปกติได้เลย (มีหรือไม่มีเครื่องหมายก็ได้ ระบบ normalize ให้) · เพศชาย/หญิง ใส่ทั้งสองรูป หรือใช้ต้นคำที่ครอบทั้งคู่
    const PHRASES_ZH = [   // จีนตัวย่อ (ตัวเต็มแปลงเป็นตัวย่อใน normalize) + กวางตุ้งบางคำ
        "想死", "好想死", "想去死", "寻死", "不如死了", "死了算了", "死了就好了", "一死了之", "想不开",
        "不想活", "活不下去", "不想活下去", "为什么要活着", "活着没意思", "活着没有意思", "活着没意义", "活着没有意义",
        "活着有什么意思", "活着有什么意义", "活着好累", "活着太累", "没有活下去的理由",
        "不想醒来", "不想再醒来", "永远不要醒来", "睡着不再醒",
        "想消失", "想从世界上消失", "消失算了", "不想存在",
        "结束生命", "结束自己的生命", "结束我的生命", "了结自己", "了结生命", "自杀", "轻生",
        "自残", "自伤", "伤害自己",
        "没有我会更好", "没有我更好", "没有我大家会更好", "我是累赘", "是个累赘", "拖累大家",
        "没有希望了", "活着没希望", "绝望", "生无可恋", "撑不下去了",
        "唔想生存", "唔想活", "死咗算"
    ];
    const PHRASES_JA = [
        "死にたい", "しにたい", "死にてえ", "死にてぇ", "死にたみ", "タヒにたい", "氏にたい", "死にたくなる",
        "死のうかな", "死のうと思", "死んだほうがまし", "死んだ方がまし", "死んだ方が楽", "死んだほうが楽",
        "消えたい", "消えてしまいたい", "消えてなくなりたい", "いなくなりたい", "いない方がいい", "いないほうがいい",
        "生きていたくない", "生きてたくない", "生きたくない", "生きるのがつらい", "生きるのが辛い",
        "生きる意味がない", "生きてる意味がない", "生きている意味がない", "生きる価値がない", "生きる希望がない",
        "生まれてこなければ", "目が覚めなければ", "目覚めたくない",
        "自殺", "自死", "自傷", "自分を傷つけ", "命を絶", "人生を終わらせ", "人生終わらせ", "終わりにしたい",
        "楽になりたい", "希望がない", "絶望"
    ];
    const PHRASES_HI = [   // เทวนาครี + ฮินกลิช (โรมัน) · ชาย/หญิง: ใช้ต้นคำ "चाह" / "chah" ครอบ चाहता/चाहती/चाहिए
        "मरना चाह", "मर जाना चाह", "मुझे मरना है", "मरने का मन", "मुझे मर जाना चाहिए", "जीने से अच्छा मरना", "जीने से बेहतर मरना",
        "जीना नहीं चाह", "अब जीना नहीं", "जीने का मन नहीं", "जीने की इच्छा नहीं", "जीने की कोई वजह नहीं", "जीने का कोई मतलब नहीं",
        "ज़िंदगी से तंग", "जिंदगी से थक गया", "जिंदगी से थक गई", "उठना नहीं चाह", "गायब हो जाना चाह",
        "आत्महत्या", "ख़ुदकुशी", "खुद को मार", "अपने आप को मार", "खुद को खत्म", "अपनी जान ले", "अपनी जान दे", "जान देना चाह",
        "खुद को नुकसान", "खुद को चोट", "अपने आप को नुकसान", "अपने आप को चोट",
        "मैं बोझ हूं", "सब पर बोझ", "बोझ बन गया", "बोझ बन गई", "मेरे बिना सब खुश", "मेरे बिना सब बेहतर",
        "उम्मीद नहीं बची",
        "marna chah", "mar jana chah", "mujhe marna hai", "marne ka man", "mujhe mar jana chahiye",
        "jeena nahi chah", "jina nahi chah", "jeena nahin chah", "jina nahin chah", "jeena nai chah", "jina nai chah",
        "jeene ka man nahi", "jine ka man nahi", "jeene ki ichha nahi", "jeene ki koi wajah nahi",
        "zindagi se tang", "zindagi se thak gaya", "zindagi se thak gayi",
        "aatmahatya", "atmahatya", "khudkushi", "khudkhushi", "khud ko maar", "khud ko khatam", "apni jaan le",
        "khud ko nuksan", "khud ko nuksaan", "khud ko hurt", "main bojh hoon", "main bojh hu", "sab pe bojh", "sab par bojh", "bojh ban gaya", "bojh ban gayi",
        "mere bina sab khush", "mere bina sab behtar", "umeed nahi bachi", "ummeed nahi bachi"
    ];
    const PHRASES_ES = [
        "quiero morir", "quiero morirme", "ganas de morir", "ganas de morirme", "quisiera morir", "quisiera morirme",
        "ojala me muera", "ojala estuviera muerto", "ojala estuviera muerta", "mejor muerto", "mejor muerta",
        "no quiero vivir", "no quiero seguir viviendo", "no quiero seguir con vida", "no puedo seguir viviendo",
        "no quiero existir", "dejar de existir", "ojala no existiera", "mejor si no existiera",
        "no quiero despertar", "no despertar nunca", "no volver a despertar", "quiero desaparecer", "desaparecer para siempre",
        "quitarme la vida", "acabar con mi vida", "terminar con mi vida", "quiero acabar con todo",
        "suicidarme", "suicidio", "suicida", "me voy a matar", "voy a matarme", "quiero matarme", "ganas de matarme", "pienso en matarme",
        "hacerme daño", "me hago daño", "lastimarme", "autolesion",
        "soy una carga", "estarian mejor sin mi", "estan mejor sin mi", "seria mejor si no estuviera",
        "nadie me extrañaria", "nadie me echaria de menos",
        "no tengo razones para vivir", "no tengo motivos para vivir", "no tengo razon para vivir", "no hay razon para vivir",
        "mi vida no tiene sentido", "la vida no tiene sentido", "no le veo sentido a la vida", "no le encuentro sentido a la vida",
        "cansado de vivir", "cansada de vivir", "harto de vivir", "harta de vivir", "no hay esperanza", "sin esperanza"
    ];
    const PHRASES_FR = [
        "veux mourir", "voudrais mourir", "aimerais mourir", "envie de mourir", "envie de crever", "veux crever",
        "voudrais etre mort", "aimerais etre mort", "prefererais etre mort",
        "veux en finir", "vais en finir", "envie d'en finir", "en finir avec la vie", "en finir avec ma vie",
        "me suicider", "suicidaire", "me tuer", "mettre fin a mes jours", "mettre fin a ma vie", "me foutre en l'air",
        "me faire du mal", "me blesser", "m'automutiler", "automutilation",
        "je ne veux plus vivre", "veux plus vivre", "plus envie de vivre", "pas envie de vivre",
        "ne plus me reveiller", "pas me reveiller", "plus me reveiller", "envie de disparaitre", "veux disparaitre",
        "je suis un fardeau", "je suis un poids", "mieux sans moi", "personne ne me regretterait",
        "aucune raison de vivre", "plus de raison de vivre", "pas de raison de vivre",
        "la vie n'a pas de sens", "ma vie n'a pas de sens", "ma vie n'a aucun sens", "la vie n'a aucun sens",
        "sans espoir", "n'y a plus d'espoir", "aucun espoir", "perdu tout espoir",
        "marre de vivre", "fatigue de vivre", "fatiguee de vivre", "las de vivre", "lasse de vivre"
    ];
    const PHRASES_PT = [   // บราซิล + โปรตุเกส
        "quero morrer", "queria morrer", "vontade de morrer", "queria estar morto", "queria estar morta", "melhor morto", "melhor morta",
        "apetece-me morrer", "nao quero mais viver", "nao quero viver", "nao quero continuar vivendo", "nao aguento mais viver",
        "cansado de viver", "cansada de viver", "nao quero existir", "nao queria existir", "nao quero ca estar",
        "quero sumir", "vontade de sumir", "quero desaparecer",
        "nao quero acordar", "nunca mais acordar", "dormir e nao acordar",
        "me matar", "matar-me", "me suicidar", "suicidar-me", "suicidio", "suicida",
        "tirar minha vida", "tirar a minha vida", "tirar a propria vida", "acabar com minha vida", "acabar com a minha vida", "por fim a vida",
        "me machucar", "me ferir", "automutilacao", "autolesao",
        "sou um peso", "sou um fardo", "melhor sem mim", "ninguem sentiria minha falta", "ninguem vai sentir minha falta",
        "sem razao para viver", "nao tenho motivo para viver", "nao tenho razao para viver",
        "nao vejo sentido na vida", "a vida nao tem sentido", "minha vida nao tem sentido", "sem esperanca", "nao ha esperanca"
    ];
    const PHRASES_RU = [
        "хочу умереть", "хочется умереть", "хочу сдохнуть", "хочется сдохнуть", "лучше бы я умер", "лучше бы я умерла", "лучше умереть",
        "не хочу жить", "не хочется жить", "жить не хочу", "жить не хочется", "не хочу больше жить", "нет сил жить",
        "устал жить", "устала жить", "не хочу существовать",
        "не хочу просыпаться", "не проснуться", "хочу исчезнуть", "исчезнуть навсегда",
        "покончить с собой", "покончу с собой", "покончить с жизнью", "свести счёты с жизнью",
        "суицид", "самоубийств", "убить себя", "убью себя", "наложить на себя руки", "выпилиться", "выпилюсь",
        "самоповреждени", "навредить себе", "причинить себе боль",
        "я обуза", "всем будет лучше без меня", "лучше без меня", "я никому не нужен", "я никому не нужна",
        "нет смысла жить", "незачем жить", "не вижу смысла жить", "не вижу смысла в жизни",
        "жизнь не имеет смысла", "жизнь бессмысленна", "нет надежды", "безнадёжно"
    ];
    const PHRASES_AR = [   // فصحى + لهجات (مصري، شامي، خليجي، مغاربي) · الهمزات/التشكيل تُوحَّد في normalize
        "أريد أن أموت", "أريد الموت", "أتمنى الموت", "أتمنى أن أموت", "أتمنى لو مت", "أتمنى لو كنت ميت", "أود أن أموت",
        "لا أريد أن أعيش", "لا أريد العيش", "لا أريد الحياة", "لا أرغب في الحياة", "لا أريد أن أستيقظ", "لا أريد الاستيقاظ",
        "سئمت الحياة", "سئمت من الحياة", "تعبت من الحياة", "تعبت من حياتي", "مليت من الحياة", "مليت من حياتي",
        "زهقت من الحياة", "زهقت من حياتي",
        "أنتحر", "انتحار", "هنتحر", "أقتل نفسي", "قتل نفسي", "هموت نفسي", "نقتل روحي",
        "إنهاء حياتي", "أنهي حياتي", "إيذاء نفسي", "أؤذي نفسي", "أذية نفسي", "إيذاء النفس", "أؤذي حالي",
        "أريد أن أختفي", "أتمنى أن أختفي", "أختفي من الدنيا", "أختفي من العالم",
        "أنا عبء", "عبء على الجميع", "أفضل بدوني",
        "لا سبب للعيش", "لا يوجد سبب للعيش", "لا معنى لحياتي", "حياتي بلا معنى", "الحياة بلا معنى", "لا معنى للحياة",
        "فقدت الأمل", "فقدت كل أمل", "لم يعد لدي أمل", "ما عندي أمل", "يائس من الحياة", "يائسة من الحياة",
        "نفسي أموت", "عايز أموت", "عاوز أموت", "عايزة أموت", "عاوزة أموت", "مش عايز أعيش", "مش عايزة أعيش", "مش عاوز أعيش",
        "بدي موت", "بدي اموت", "ما بدي عيش", "ما بدي اعيش", "بدي اختفي",
        "أبي أموت", "ابغى اموت", "ودي اموت", "ما ابي اعيش", "ما ابغى اعيش",
        "بغيت نموت", "نحب نموت", "ما بغيتش نعيش"
    ];
    // คำเพิ่มภาษาอังกฤษ (v27)
    const PHRASES_EN2 = [
        "want to be dead", "dont want to exist", "do not want to exist", "wish i didnt exist", "wish i was never born",
        "im a burden", "i am a burden", "no point in living", "no point living", "end myself", "want to vanish", "wanna disappear"
    ];

    // สำนวนที่ไม่ใช่ความเสี่ยง: ถ้าคำที่พบอยู่ "ข้างใน" สำนวนเหล่านี้ทุกครั้ง → ไม่นับ (ถ้าพบคำนั้นนอกสำนวนแม้ครั้งเดียว → นับ)
    // ใส่เฉพาะสำนวนที่ชัดเจน · ไม่แน่ใจ = ไม่ใส่ (กฎไม่สมมาตร: สงสัยไว้ก่อน ชวนขอความช่วยเหลือ)
    function combos(heads, tails) {
        const out = [];
        heads.forEach(function (h) { tails.forEach(function (t) { out.push(h + " " + t); }); });
        return out;
    }
    const IDIOMS = [].concat(
        // ไทย
        ["ไร้ค่าใช้จ่าย", "ไร้ค่าธรรมเนียม", "ลาโลกโซเชียล", "ลาโลกออนไลน์", "อะไรค้าง", "ไรค้าง", "ไรค้างคา", "ค้างใจ", "ค้างคาใจ", "ค้างอยู่"],
        // อังกฤษ
        ["hopeless romantic", "hopelessly"],
        // จีน: 想死你了 = คิดถึงมาก, 思想死板, 年轻生活 / 减轻生活压力, 各自伤心, 不想活动 (ไม่อยากขยับ), 生无可恋脸 (มีม)
        ["想死你", "想死您", "想死我了", "思想死", "年轻生", "减轻生", "轻生活", "自伤心", "自伤感", "不想活动", "不想活跃",
            "生无可恋脸", "生无可恋的表情", "累死了", "笑死", "困死了", "热死了"],
        // ญี่ปุ่น: 〜しに大変 / 〜に対して (ฮิรางานะ) · 〜ていないほうがいい · 希望がないわけでは
        ["しにたいへん", "しにたいして", "しにたいする", "しにたいおう", "ていないほうがいい", "ていない方がいい", "希望がないわけでは",
            "死ぬほど", "死ぬかと思った"],
        // สเปน
        combos(["quiero morir", "quiero morirme", "ganas de morir", "ganas de morirme"],
            ["de risa", "de la risa", "de verguenza", "de la verguenza", "de hambre", "de sueño", "de calor", "de frio", "de ganas", "de aburrimiento"]),
        ["me voy a matar de risa", "me muero de risa", "me muero de hambre", "va a matarme", "van a matarme"],
        // โปรตุเกส: "vai me matar" = (คนอื่น) จะฆ่าฉัน (สำนวน แม่จะฆ่าฉัน)
        combos(["quero morrer", "queria morrer", "vontade de morrer"],
            ["de rir", "de vergonha", "de fome", "de sono", "de calor", "de frio", "de saudade", "de inveja", "de tedio"]),
        ["vai me matar", "vao me matar", "vai matar-me", "vao matar-me", "me matar de rir", "matar-me de rir", "morrendo de fome", "morrendo de rir"],
        // ฝรั่งเศส: "va me tuer" = (คนอื่น) จะฆ่าฉัน · "en finir avec ce dossier" = ทำงานให้เสร็จ
        combos(["veux mourir", "envie de mourir", "voudrais mourir"],
            ["de rire", "de honte", "de faim", "de chaud", "de froid", "d'ennui", "de sommeil", "de fatigue"]),
        combos(["veux en finir", "vais en finir", "envie d'en finir"],
            ["avec ce", "avec cette", "avec ces", "avec le", "avec mon", "avec mes", "avec ton", "avec ta", "avec tes", "avec ca", "avec cela", "avec lui", "avec elle", "avec eux", "avec toi", "avec vous"]),
        ["va me tuer", "vont me tuer", "mort de rire", "mort de fatigue"],
        // รัสเซีย
        combos(["хочу умереть", "хочется умереть", "хочу сдохнуть"], ["со смеху", "от смеха", "от стыда", "от скуки", "от голода"]),
        ["лучше умереть стоя", "безнадёжно влюблён", "безнадёжно влюблена", "умираю от смеха"],
        // อาหรับ: أموت من الضحك = ขำจะตาย, أموت فيك = รักมาก
        combos(["نفسي اموت", "عايز اموت", "عاوز اموت", "عايزه اموت", "بدي اموت", "بدي موت", "ابي اموت", "ابغى اموت", "ودي اموت"],
            ["من الضحك", "من الجوع", "من الحر", "من البرد", "فيك", "فيكي", "فيه", "فيها", "عليك", "عليكي"]),
        ["اموت من الضحك", "هموت من الضحك"],
        // ฮินดี
        ["हंसते हंसते मर गया", "हंसते हंसते मर गई"]
    );

    const PHRASES = PHRASES_TH.concat(PHRASES_EN, PHRASES_EN2, PHRASES_ZH, PHRASES_JA, PHRASES_HI,
        PHRASES_ES, PHRASES_FR, PHRASES_PT, PHRASES_RU, PHRASES_AR)
        .map(normalize)
        .filter(function (p, i, all) {
            // ยาว ≥ 3 ตัว (จีน/ญี่ปุ่น ≥ 2 ตัว เช่น 自杀 想死) · ตัดตัวซ้ำ
            return (p.length >= 3 || (p.length >= 2 && /[぀-ヿ㐀-鿿]/.test(p))) && all.indexOf(p) === i;
        });
    const IDIOM_N = IDIOMS.map(normalize).filter(function (p) { return p.length >= 2; });

    // ช่วงตำแหน่งในข้อความที่เป็นสำนวนไม่เสี่ยง
    function idiomSpans(s) {
        const spans = [];
        IDIOM_N.forEach(function (d) {
            let at = s.indexOf(d);
            while (at !== -1) {
                spans.push([at, at + d.length]);
                at = s.indexOf(d, at + 1);
            }
        });
        return spans;
    }

    function hasRiskText(text) {
        const s = normalize(text);
        if (s.length < 2) return false;
        let spans = null;
        for (let i = 0; i < PHRASES.length; i++) {
            const p = PHRASES[i];
            let at = s.indexOf(p);
            while (at !== -1) {
                if (spans === null) spans = idiomSpans(s);
                const end = at + p.length;
                const inIdiom = spans.some(function (r) { return r[0] <= at && r[1] >= end; });
                if (!inIdiom) return true;
                at = s.indexOf(p, at + 1);
            }
        }
        return false;
    }

    // ----- v29 ถูกทำร้าย / ความรุนแรง (คนอื่นทำร้ายเรา): การ์ดคนละแบบ → 1300 ศูนย์ช่วยเหลือสังคม + 191 ตำรวจ -----
    // วลีที่ผู้เขียน "เล่าว่าตัวเองถูกทำร้าย/ถูกข่มขู่/ถูกล่วงละเมิด" · ไม่มีรายละเอียดวิธีการ · ไม่แสดงรายการนี้ให้ผู้ใช้เห็น
    // ตรวจทุกภาษาเสมอ ไม่ว่าหน้าจอจะเป็นภาษาอะไร · ผิดพลาดแบบ "เสนอความช่วยเหลือเกิน" ยอมรับได้
    const ABUSE_RAW = [].concat(
        // ไทย
        ["แฟนตี", "แฟนต่อย", "แฟนตบ", "แฟนทำร้าย", "แฟนทุบ", "แฟนขู่", "สามีตี", "สามีทำร้าย", "สามีต่อย", "สามีตบ", "ผัวตี", "ผัวทำร้าย", "ผัวต่อย", "ผัวตบ",
         "ภรรยาทำร้าย", "เมียทำร้าย", "พ่อตี", "แม่ตี", "พ่อทำร้าย", "แม่ทำร้าย", "พ่อเลี้ยงทำร้าย", "ถูกทำร้าย", "โดนทำร้าย", "ถูกทุบตี", "โดนทุบตี",
         "ถูกตบ", "โดนตบ", "ถูกต่อย", "โดนต่อย", "ถูกเตะ", "โดนเตะ", "ถูกบีบคอ", "โดนบีบคอ", "ถูกข่มขืน", "โดนข่มขืน", "ถูกล่วงละเมิด", "โดนล่วงละเมิด",
         "ถูกลวนลาม", "โดนลวนลาม", "ถูกข่มขู่", "โดนข่มขู่", "ขู่จะฆ่า", "ขู่ฆ่า", "ขู่จะทำร้าย", "กลัวแฟนจะทำร้าย", "กลัวสามีจะทำร้าย", "กลัวกลับบ้าน",
         "ความรุนแรงในครอบครัว", "ถูกกักขัง", "ไม่ให้ออกจากบ้าน", "ถูกตี", "โดนตี"],
        // English
        ["he hits me", "she hits me", "he hit me", "she hit me", "they hit me", "partner hit me", "husband hit me", "boyfriend hit me", "dad hit me", "beats me", "beat me up", "slapped me", "punched me", "kicked me", "choked me", "strangled me", "hurts me", "abuses me",
         "abusing me", "being abused", "i was abused", "i am abused", "domestic violence", "raped me", "i was raped", "sexually assaulted", "assaulted me",
         "molested", "threatened to kill me", "threatens to kill me", "threatened to hurt me", "threatens to hurt me", "afraid of my husband",
         "afraid of my boyfriend", "afraid of my partner", "scared to go home", "won't let me leave", "locked me in"],
        // 中文
        ["他打我", "她打我", "男朋友打我", "老公打我", "丈夫打我", "爸爸打我", "妈妈打我", "被打了", "被家暴", "家暴", "家庭暴力", "被强奸", "被性侵",
         "被性骚扰", "威胁要杀我", "威胁要打我", "不让我出门", "害怕回家", "被虐待"],
        // हिन्दी + Hinglish
        ["मुझे मारता", "मुझे मारती", "मुझे पीटता", "मुझे पीटती", "पति मारता", "पति मारते", "घरेलू हिंसा", "मेरे साथ बलात्कार", "यौन शोषण", "जान से मारने की धमकी",
         "घर जाने से डर", "mujhe marta", "mujhe peet", "pati marta", "gharelu hinsa", "maar dalne ki dhamki"],
        // Español
        ["me pega", "me golpea", "me golpeo", "me pego", "me maltrata", "me abofeteo", "me ahorco", "violencia domestica", "me violo", "me violaron", "abuso sexual",
         "me amenaza con matarme", "me amenazo con matarme", "me amenaza con pegarme", "miedo de mi pareja", "miedo de mi marido", "miedo de volver a casa", "no me deja salir"],
        // Français
        ["il me frappe", "elle me frappe", "il m'a frappe", "il me bat", "il m'a battu", "on me frappe", "violence conjugale", "violences conjugales", "violence domestique",
         "il m'a viole", "j'ai ete violee", "j'ai ete viole", "agression sexuelle", "il menace de me tuer", "peur de mon mari", "peur de mon conjoint",
         "peur de rentrer", "il m'empeche de sortir"],
        // العربية
        ["يضربني", "ضربني", "تضربني", "زوجي يضربني", "يعنفني", "عنف اسري", "عنف منزلي", "اغتصبني", "تم اغتصابي", "تحرش بي", "يهددني بالقتل",
         "هددني بالقتل", "اخاف من زوجي", "اخاف العوده للبيت", "لا يسمح لي بالخروج"],
        // Português
        ["ele me bate", "ela me bate", "me bateu", "me agride", "me agrediu", "violencia domestica", "me estuprou", "fui estuprada", "fui estuprado",
         "abuso sexual", "ameacou me matar", "ameaca me matar", "medo do meu marido", "medo do meu namorado", "medo de voltar pra casa", "nao me deixa sair"],
        // Русский
        ["он меня бьет", "она меня бьет", "меня бьет", "избил меня", "избивает меня", "муж бьет", "домашнее насилие", "меня изнасиловали",
         "изнасиловал меня", "сексуальное насилие", "угрожает убить", "угрожал убить", "боюсь мужа", "боюсь идти домой", "не выпускает из дома"],
        // 日本語
        ["彼氏に殴られ", "夫に殴られ", "親に殴られ", "殴られる", "殴られた", "親に叩かれ", "夫に叩かれ", "彼氏に叩かれ", "暴力を振るわれ", "家庭内暴力", "レイプされ", "性暴力",
         "性的暴行", "殺すと脅され", "夫が怖い", "彼氏が怖い", "家に帰るのが怖い", "外に出してもらえない"]
    );
    // สำนวนที่ไม่ใช่การถูกทำร้าย (ตัดออกก่อนตรวจ)
    const ABUSE_IDIOMS = ["ตีกลับ", "ตีความ", "ตีเนียน", "ตีตั๋ว", "ตีพิมพ์", "ตีราคา", "ตีบท", "ตีลังกา", "ตีแบด", "ตีกอล์ฟ", "ตีปิงปอง", "ตีเทนนิส",
        "ตีมึน", "ตีซี้", "ตีสนิท", "ตีโจทย์", "ตีหน้าเศร้า", "ตีกลอง", "ตีฆ้อง", "ตีระฆัง", "ตีไข่", "ตีวง", "ตีตก", "ตีเสมอ", "ตีปีก", "ตีอก",
        "hit me up", "hits me up", "hit me with", "it hit me", "that hit me", "hit me hard", "song hit me", "beat me to it", "beat me at", "kicked me out",
        "ネットで叩かれ", "被打了一针", "被打了针", "เตะออก", "kicked me off", "me pego un susto", "me pega la gana", "me pego la gana", "golpeo la realidad", "me pega el sol", "me pega la", "me golpeo la cabeza contra", "me bate a saudade", "me bateu a saudade", "me bateu uma"];
    const ABUSE_N = ABUSE_RAW.map(normalize).filter(function (p, i, all) { return p.length >= 2 && all.indexOf(p) === i; });
    const ABUSE_IDIOM_N = ABUSE_IDIOMS.map(normalize).filter(function (p) { return p.length >= 2; });
    function hasAbuseText(text) {
        let s = normalize(text);
        if (s.length < 2) return false;
        ABUSE_IDIOM_N.forEach(function (d) { s = s.split(d).join("|"); });
        return ABUSE_N.some(function (p) { return s.indexOf(p) !== -1; });
    }
    // ----- อ่าน/เขียน localStorage แบบปลอดภัย (ใช้ไม่ได้ก็ทำงานต่อ) -----
    function read(key, fallback) {
        try {
            const v = localStorage.getItem(key);
            if (v !== null) return JSON.parse(v);
        } catch (e) { /* ใช้ค่าเริ่มต้น */ }
        return fallback;
    }
    function write(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* บันทึกไม่ได้ */ }
    }
    function dayMs(d) {
        const t = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + "T12:00:00").getTime() : NaN;
        return isNaN(t) ? null : t;
    }

    // บันทึกว่าพบข้อความเสี่ยง (เก็บแค่เวลา ไม่เก็บข้อความ) · page = "site" หรือ "game" (แต่ละหน้าเขียน key ของตัวเอง)
    function markRisk(user, page) {
        write((page === "game" ? "hikariCareGame_" : "hikariCare_") + (user || "guest"), Date.now());
    }

    function recentRisk(user, now) {
        return ["hikariCare_", "hikariCareGame_"].some(function (p) {
            const t = Number(read(p + user, 0));
            return Number.isFinite(t) && t > 0 && now - t >= -DAY && now - t <= CARE_DAYS * DAY;
        });
    }

    function depSignal(user, now) {
        const list = read("hikariDep_" + user, []);
        if (!Array.isArray(list) || !list.length) return false;
        const valid = list.filter(function (e) { return e && typeof e === "object" && dayMs(e.d) !== null; });
        // คิดคะแนนใหม่จากคำตอบ (ไม่เชื่อคะแนนที่เก็บไว้)
        function q9Of(e) {
            return Array.isArray(e.q9) && e.q9.length === 9 && e.q9.every(function (v) { return v === 0 || v === 1 || v === 2 || v === 3; }) ? e.q9 : null;
        }
        const last = valid[valid.length - 1];
        const lastQ9 = last ? q9Of(last) : null;
        if (lastQ9 && lastQ9.reduce(function (a, b) { return a + b; }, 0) >= DEP_HIGH) return true;
        return valid.some(function (e) {
            const q9 = q9Of(e);
            return q9 && q9[SELF_HARM_ITEM] >= 1 && now - dayMs(e.d) <= SELF_HARM_DAYS * DAY;
        });
    }

    // เช็กอินอารมณ์ 3 วันล่าสุดที่มีบันทึก เป็น "เครียดมาก" ทั้งหมด (และครั้งล่าสุดไม่เกิน 14 วัน)
    function lowMoods(days, isLow, now) {
        const keys = Object.keys(days || {}).filter(function (k) { return dayMs(k) !== null; }).sort();
        if (keys.length < 3) return false;
        const last3 = keys.slice(-3);
        if (now - dayMs(last3[2]) > 14 * DAY) return false;
        return last3.every(function (k) { return isLow(days[k]); });
    }

    function inDistress(user) {
        user = user || "guest";
        const now = Date.now();
        try {
            const moods = read("hikariMoods_" + user, {});
            return depSignal(user, now) || recentRisk(user, now) ||
                (moods && typeof moods === "object" && !Array.isArray(moods) && lowMoods(moods, function (m) { return m === "very"; }, now));
        } catch (e) {
            return false;
        }
    }

    return { normalize: normalize, hasRiskText: hasRiskText, hasAbuseText: hasAbuseText, markRisk: markRisk, inDistress: inDistress, lowMoods: lowMoods };
})();

// เบอร์สายด่วนจาก config.js (ถ้าไม่มี config ใช้ค่าเดิม)
const HK_LINES = (typeof HOTLINES !== "undefined" && HOTLINES) ? HOTLINES : { mental: "1323", emergency: "1669", samaritans: "02-113-6789", child: "1387" };
function hkTel(number) { return "tel:" + String(number).replace(/[^\d+]/g, ""); }

// ----- v27 ข้อความการ์ดช่วยเหลือ 10 ภาษา (ใช้ทั้งหน้าเว็บ riskCard และเกม riskBox) -----
// ภาษาปัจจุบัน: <html lang> ที่ script.js / game.js ตั้งไว้ → ถ้าไม่มีใช้ localStorage "hikariLang" → ไทย
// care = ขอบคุณ + มีคนพร้อมฟัง · tell = บอกคนที่ไว้ใจ · intl = ลิงก์สายด่วนฟรีทั่วโลก (findahelpline.com ของ ThroughLine)
// นอกประเทศไทย ลิงก์ intl ขึ้นก่อนเบอร์ 1323 / 1669 · ภาษาไทย ขึ้นหลังเบอร์ (intlFirst)
const HK_HELP_URL = "https://findahelpline.com";
const HK_HELP_TEXT = {
    th: {
        care: "ขอบคุณที่เขียนออกมานะ คุณไม่ต้องผ่านเรื่องนี้คนเดียว ถ้าตอนนี้รู้สึกไม่ปลอดภัย มีคนที่พร้อมฟังคุณอยู่ คุยได้ทันที ฟรี",
        tell: "💬 บอกคนที่ไว้ใจ",
        intl: "🌍 อยู่นอกประเทศไทย? หาสายด่วนฟรีในประเทศของคุณ"
    },
    en: {
        care: "Thank you for writing this. You don't have to go through it alone. If you don't feel safe right now, there are people ready to listen, for free, right now.",
        tell: "💬 Tell someone you trust",
        intl: "🌍 Outside Thailand? Find a free helpline in your country"
    },
    zh: {
        care: "谢谢你愿意把它写下来。你不用一个人扛着。如果你现在觉得不安全，有人愿意倾听你，现在就可以免费聊聊。",
        tell: "💬 告诉你信任的人",
        intl: "🌍 不在泰国？查找你所在国家的免费求助热线"
    },
    hi: {
        care: "इसे लिखने के लिए शुक्रिया। आपको यह सब अकेले नहीं सहना है। अगर अभी आप सुरक्षित महसूस नहीं कर रहे हैं, तो कोई आपकी बात सुनने के लिए तैयार है, अभी, मुफ़्त में।",
        tell: "💬 किसी भरोसेमंद व्यक्ति को बताएं",
        intl: "🌍 थाईलैंड से बाहर हैं? अपने देश की मुफ़्त हेल्पलाइन खोजें"
    },
    es: {
        care: "Gracias por escribirlo. No tienes que pasar por esto a solas. Si ahora mismo no te sientes a salvo, hay personas dispuestas a escucharte, gratis, ahora mismo.",
        tell: "💬 Cuéntaselo a alguien de confianza",
        intl: "🌍 ¿Fuera de Tailandia? Encuentra una línea de ayuda gratuita en tu país"
    },
    fr: {
        care: "Merci de l'avoir écrit. Vous n'avez pas à traverser ça sans soutien. Si vous ne vous sentez pas en sécurité en ce moment, des personnes sont prêtes à vous écouter, gratuitement, dès maintenant.",
        tell: "💬 En parler à une personne de confiance",
        intl: "🌍 Hors de Thaïlande ? Trouvez une ligne d'écoute gratuite dans votre pays"
    },
    ar: {
        care: "شكرًا لأنك كتبت هذا. لست مضطرًا لمواجهة هذا وحدك. إذا كنت لا تشعر بالأمان الآن، فهناك من هو مستعد للاستماع إليك، مجانًا، الآن.",
        tell: "💬 أخبر شخصًا تثق به",
        intl: "🌍 خارج تايلاند؟ ابحث عن خط مساعدة مجاني في بلدك"
    },
    pt: {
        care: "Obrigado por escrever isso. Você não precisa enfrentar isso sem apoio. Se agora você não se sente em segurança, há pessoas prontas para te ouvir, de graça, agora mesmo.",
        tell: "💬 Contar a alguém de confiança",
        intl: "🌍 Fora da Tailândia? Encontre uma linha de apoio gratuita no seu país"
    },
    ru: {
        care: "Спасибо, что написали об этом. Вам не нужно справляться с этим в одиночку. Если сейчас вы не чувствуете себя в безопасности, есть люди, готовые выслушать, бесплатно, прямо сейчас.",
        tell: "💬 Рассказать тому, кому доверяете",
        intl: "🌍 Не в Таиланде? Найдите бесплатную линию помощи в вашей стране"
    },
    ja: {
        care: "書いてくれてありがとう。ひとりで抱えこまなくて大丈夫です。もし今、安全だと感じられないなら、話を聞いてくれる人がいます。無料で、今すぐ相談できます。",
        tell: "💬 信頼できる人に伝える",
        intl: "🌍 タイ以外にいますか？あなたの国の無料相談窓口を探す"
    }
};
function hkHelpLang() {
    let code = "";
    try { code = String(document.documentElement.lang || "").toLowerCase().slice(0, 2); } catch (e) { /* ไม่มี document */ }
    if (!HK_HELP_TEXT[code]) {
        try { code = JSON.parse(localStorage.getItem("hikariLang")); } catch (e) { code = ""; }
    }
    return HK_HELP_TEXT[code] ? code : "th";
}
function hkHelpText(key) {
    const pack = HK_HELP_TEXT[hkHelpLang()];
    return pack[key] || HK_HELP_TEXT.en[key] || "";
}
function hkIntlFirst() { return hkHelpLang() !== "th"; }
// ลิงก์สายด่วนทั่วโลก (เปิดแท็บใหม่ ไม่ส่งข้อมูลอะไรไปด้วย)
function hkIntlLink(className) {
    const a = document.createElement("a");
    a.className = className || "btn btn-outline";
    a.href = HK_HELP_URL;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = hkHelpText("intl");
    return a;
}


// ----- v29 การ์ด "ถูกทำร้าย" 10 ภาษา: 1300 ศูนย์ช่วยเหลือสังคม (พม. ฟรี 24 ชม. เป็นความลับ) + 191 ตำรวจ + สายด่วนทั่วโลก + บอกคนที่ไว้ใจ -----
// ตรวจเบอร์เมื่อ 2026-11-07: 1300 (thailand.prd.go.th 2024, findahelpline.com verified) · 191 เหตุด่วนเหตุร้าย
const HK_ABUSE_TEXT = {
    th: { care: "ขอบคุณที่กล้าบอกนะ สิ่งที่เกิดขึ้นไม่ใช่ความผิดของคุณ ถ้าตอนนี้ไม่ปลอดภัย โทร 191 ได้ทันที หรือปรึกษาศูนย์ช่วยเหลือสังคม 1300 ฟรี 24 ชม. เป็นความลับ", social: "ศูนย์ช่วยเหลือสังคม ฟรี 24 ชม.", police: "แจ้งเหตุตำรวจ" },
    en: { care: "Thank you for telling me. What's happening is not your fault. If you're not safe right now, call 191 (police). You can also talk to the 1300 Social Help Center: free, 24 hours, confidential.", social: "Social Help Center, free 24h", police: "Police emergency" },
    zh: { care: "谢谢你愿意说出来。发生的事不是你的错。如果你现在不安全，请立刻拨打 191（警察）。也可以拨打 1300 社会援助中心，免费、24 小时、保密。", social: "社会援助中心，免费 24 小时", police: "报警" },
    hi: { care: "बताने के लिए शुक्रिया। जो हो रहा है उसमें आपकी कोई गलती नहीं है। अगर अभी आप सुरक्षित नहीं हैं, तो 191 (पुलिस) पर कॉल करें। आप 1300 सोशल हेल्प सेंटर से भी बात कर सकते हैं: मुफ़्त, 24 घंटे, गोपनीय।", social: "सोशल हेल्प सेंटर, मुफ़्त 24 घंटे", police: "पुलिस आपातकाल" },
    es: { care: "Gracias por contármelo. Lo que te pasa no es culpa tuya. Si ahora no estás a salvo, llama al 191 (policía). También puedes hablar con el Centro de Ayuda Social 1300: gratis, 24 horas y confidencial.", social: "Centro de Ayuda Social, gratis 24 h", police: "Emergencias policiales" },
    fr: { care: "Merci de me l'avoir dit. Ce qui se passe n'est pas de votre faute. Si vous n'êtes pas en sécurité maintenant, appelez le 191 (police). Vous pouvez aussi parler au centre d'aide sociale 1300 : gratuit, 24 h/24, confidentiel.", social: "Centre d'aide sociale, gratuit 24 h/24", police: "Urgence police" },
    ar: { care: "شكرًا لأنك أخبرتني. ما يحدث ليس ذنبك. إذا لم تكن في أمان الآن، اتصل بالرقم 191 (الشرطة). ويمكنك أيضًا التحدث إلى مركز المساعدة الاجتماعية 1300: مجاني، على مدار 24 ساعة، وسري.", social: "مركز المساعدة الاجتماعية، مجاني 24 ساعة", police: "طوارئ الشرطة" },
    pt: { care: "Obrigado por me contar. O que está acontecendo não é culpa sua. Se agora você não está em segurança, ligue 191 (polícia). Você também pode falar com o Centro de Ajuda Social 1300: gratuito, 24 horas e confidencial.", social: "Centro de Ajuda Social, grátis 24h", police: "Emergência policial" },
    ru: { care: "Спасибо, что рассказали. В том, что происходит, нет вашей вины. Если вы сейчас не в безопасности, звоните 191 (полиция). Можно также обратиться в центр социальной помощи 1300: бесплатно, круглосуточно, конфиденциально.", social: "Центр социальной помощи, бесплатно 24 ч", police: "Полиция" },
    ja: { care: "話してくれてありがとう。起きていることはあなたのせいではありません。今安全でないなら、191（警察）に電話してください。1300 ソーシャルヘルプセンターにも相談できます。無料・24時間・秘密厳守です。", social: "ソーシャルヘルプセンター 無料24時間", police: "警察（緊急）" }
};
function hkAbuseText(key) {
    const pack = HK_ABUSE_TEXT[hkHelpLang()] || HK_ABUSE_TEXT.en;
    return pack[key] || HK_ABUSE_TEXT.en[key] || "";
}
// ปุ่มโทร 1300 / 191 (ใช้ได้ทั้งเว็บและเกม) · btnClass = คลาสปุ่มของแต่ละหน้า
function hkAbuseCalls(btnClass) {
    const box = document.createElement("div");
    box.className = "abuse-calls";
    [[HK_LINES.social || "1300", "social"], [HK_LINES.police || "191", "police"]].forEach(function (x) {
        const a = document.createElement("a");
        a.className = btnClass || "btn btn-outline";
        a.href = hkTel(x[0]);
        a.innerHTML = "<b></b> <span></span>";
        a.querySelector("b").textContent = x[0];
        a.querySelector("span").textContent = hkAbuseText(x[1]);
        box.appendChild(a);
    });
    return box;
}
// การ์ดทั้งใบ: ข้อความ + 1300/191 + สายด่วนทั่วโลก + บอกคนที่ไว้ใจ (onTell = ฟังก์ชันเปิดหน้าส่งข้อความ หรือ href)
function hkAbuseCard(opts) {
    opts = opts || {};
    const box = document.createElement("div");
    box.className = (opts.className || "crisis-card risk-card") + " abuse-card";
    box.setAttribute("role", "note");
    const p = document.createElement("p");
    p.textContent = hkAbuseText("care");
    const calls = hkAbuseCalls(opts.btnClass);
    const intl = hkIntlLink(opts.intlClass || "btn btn-outline");
    const tell = document.createElement(opts.tellHref ? "a" : "button");
    tell.className = opts.btnClass || "btn btn-outline";
    tell.textContent = hkHelpText("tell");
    if (opts.tellHref) tell.href = opts.tellHref; else { tell.type = "button"; tell.addEventListener("click", function () { if (opts.onTell) opts.onTell(); }); }
    if (hkIntlFirst()) box.append(p, intl, calls, tell); else box.append(p, calls, intl, tell);
    return box;
}
