// =====================================================================
// Hikari StressCare - content.js
// ข้อมูลเนื้อหาของ "ภารกิจ 60 วัน" แยกจาก script.js ให้แก้ง่าย
//   JOURNEY  = คลิป 60 วัน (วันคี่ = คลื่นเสียง/เสียงธรรมชาติ, วันคู่ = คลิปเยียวยาใจ) ไม่ซ้ำกัน
//   RESEARCH = งานวิจัย 30 ชิ้น (สรุปภาษาไทย + อังกฤษ) วนวันละ 1 ชิ้น
//   REWARDS  = ของรางวัลที่เลือกได้ฟรีเมื่อทำภารกิจครบ 7 วัน (ปกติราคาถูกสุด ฿19)
//   SHOP_ITEMS = ตัวอย่างของราคาสูงที่ยังต้องซื้อ (ราคาเต็ม / Premium −10% / Care+ −20%)
// =====================================================================

// lang: TH / EN = ภาษาของคลิป, ♪ = เสียงหรือดนตรีไม่มีคำพูด
// cat: wave คลื่นเสียง, sound เสียงธรรมชาติ, music ดนตรี, breath หายใจ, mind สมาธิ, learn ข้อคิด
const SOUNDS = [
    { id: "EA7timbQpFc", lang: "♪", cat: "sound", title: "Forest River Nature Sounds with Birdsong", source: "Naturescapes" },
    { id: "IA0874YZ8_M", lang: "♪", cat: "sound", title: "เสียงธรรมชาติบำบัด เสียงน้ำตก เสียงน้ำไหล เสียงนก (2 ชั่วโมง)", source: "ASMR Namcha" },
    { id: "riJf5eKBwf4", lang: "♪", cat: "wave", title: "1 Hour Tibetan Singing Bowls Meditation", source: "Shamanic Sound Healing by Aliano" },
    { id: "G7IzyYXTeYA", lang: "♪", cat: "music", title: "Relaxing Music for Stress Relief @ 432Hz", source: "Meditative Mind" },
    { id: "Qm846KdZN_c", lang: "♪", cat: "sound", title: "Forest Birdsong - Relaxing Nature Sounds (2 Hours)", source: "TheSilentWatcher" },
    { id: "tJ2fCih495w", lang: "♪", cat: "sound", title: "Gentle Night Rain - Rain Sounds for Sleeping", source: "Rain Sound Natural" },
    { id: "jSqCaI4DDJY", lang: "♪", cat: "music", title: "รวมเพลงบรรเลงขลุ่ยเพราะๆ 1 ชม.เต็ม Vol.4", source: "เติ้ล ขลุ่ยไทย" },
    { id: "E7qRkUYu580", lang: "♪", cat: "sound", title: "30 min relaxing ocean waves - no music", source: "Peaceful Scenes" },
    { id: "TOWO7IrchyI", lang: "♪", cat: "wave", title: "Deep Alpha Binaural Beats 15 min Meditation", source: "MusicMindMagic" },
    { id: "unCya_-8ECs", lang: "♪", cat: "wave", title: "10 Minute Crystal Singing Bowl Meditation", source: "Jess Yoga" },
    { id: "8XBpZAetcb8", lang: "♪", cat: "music", title: "Beautiful Piano Music @432Hz - Soft Soothing Music", source: "Meditative Mind" },
    { id: "2YxoiS-5KKI", lang: "♪", cat: "sound", title: "Campfire Ambience with Crickets, Owls & Water", source: "Relaxing Caribbean Vibez" },
    { id: "_MjVDHZNLYY", lang: "♪", cat: "sound", title: "Bamboo Water Sounds for Deep Sleep", source: "A U R E M" },
    { id: "u8LtQzM_gqg", lang: "♪", cat: "wave", title: "396 Hz Healing Sleep Music (Solfeggio)", source: "Meditative Mind" },
    { id: "fOobNmmUjMk", lang: "♪", cat: "music", title: "เสียงบรรเลง เพลงระนาดเอกเพราะๆ", source: "สนธินันท์ อินทสนธิ" },
    { id: "whOFhiLtcCk", lang: "♪", cat: "wave", title: "Alpha & Theta Binaural Beats for Stress Relief", source: "Sound Auralis" },
    { id: "NLtI-YV5wW0", lang: "♪", cat: "sound", title: "Forest Bird Sounds in Windy, Peaceful Nature (2 Hours)", source: "Nature Ambience Flow" },
    { id: "vuHs624dghE", lang: "♪", cat: "wave", title: "Singing Bowls Sound Bath for Relaxation (15 Min)", source: "Yoflaminga" },
    { id: "78yyxgt0XlQ", lang: "♪", cat: "wave", title: "528 Hz Soft Music + Rain Sounds", source: "Meditative Mind" },
    { id: "_a-s6dbZ6aE", lang: "♪", cat: "sound", title: "Gentle Thunderstorm and Soothing Rain Sounds", source: "Restful" },
    { id: "h9v83Kio_p8", lang: "♪", cat: "music", title: "ขลุ่ยบรรเลง กล่อมนอน ผ่อนคลาย", source: "KRU BELL OFFICIAL" },
    { id: "MpYc0Tcj85s", lang: "♪", cat: "wave", title: "6 Hz Theta Waves Deep Sleep Music", source: "3AM Relaxation" },
    { id: "9lh_becOt4Y", lang: "♪", cat: "sound", title: "Campfire by the Sea - Crickets & Ocean Waves", source: "TheSilentWatcher" },
    { id: "Mk91vMnQvIk", lang: "♪", cat: "wave", title: "Pink Noise Cloud - 1 Hour of Relaxation & Focus", source: "The Insomniacs Lounge" },
    { id: "0yOQFaAT_iQ", lang: "♪", cat: "wave", title: "528Hz Music for Meditation", source: "Spirit Tribe Awakening" },
    { id: "9zSthSCjAhk", lang: "♪", cat: "wave", title: "15-Minute Sound Bath for Sleep with Crystal Singing Bowls", source: "Yoga and Sound with Sofia" },
    { id: "I2V609E9R-g", lang: "♪", cat: "wave", title: "2 Hz Delta & 6 Hz Theta Waves Sleep Music", source: "3AM Relaxation" },
    { id: "FXKrrzy9JJw", lang: "♪", cat: "wave", title: "Alpha Binaural Beats Waves Deep Relaxation", source: "Ambient Sound" },
    { id: "iXL_MupS6NQ", lang: "♪", cat: "wave", title: "All 9 Solfeggio Frequencies Healing Music", source: "Meditative Mind" },
    { id: "ISq_zZ_k2kg", lang: "♪", cat: "wave", title: "Theta to Delta Brainwaves Sleep Music", source: "3AM Relaxation" }
];

const HEALING = [
    { id: "3VL8tQ818QM", lang: "TH", cat: "breath", title: "ฝึกหายใจ ลดความเครียด ความตื่นตระหนก : ปรับก่อนป่วย", source: "Thai PBS" },
    { id: "kv6-UwPQIm0", lang: "TH", cat: "learn", title: "5 วิธีง่ายๆ ผ่อนคลายจากภาวะเครียด", source: "RAMA Channel" },
    { id: "WuyPuH9ojCE", lang: "EN", cat: "learn", title: "How stress affects your brain - Madhumita Murgia", source: "TED-Ed" },
    { id: "lW21fyxBNs4", lang: "EN", cat: "mind", title: "Tool 3: Grounding | Managing Stress Better", source: "WHO South-East Asia" },
    { id: "KC22OHWHtPg", lang: "TH", cat: "mind", title: "นำนั่งสมาธิ 10 นาทีก่อนนอน", source: "ธรรมะธรรมชาติ" },
    { id: "Sa4NkeCnIDw", lang: "TH", cat: "breath", title: "ฝึกคลายเครียดด้วยการรู้ลมหายใจ", source: "BMHA สำนักวิชาการสุขภาพจิต" },
    { id: "RcGyVTAoXEU", lang: "EN", cat: "learn", title: "How to Make Stress Your Friend | Kelly McGonigal", source: "TED" },
    { id: "OoVoi7-YxRY", lang: "TH", cat: "learn", title: "10 วิธีขจัด “ความเครียด” เริ่มต้นทำง่ายๆ แต่ได้ผลจริง", source: "TNN Health" },
    { id: "rC3U9H3HWyk", lang: "EN", cat: "mind", title: "Tool 6: Making Room | Managing Stress Better", source: "WHO South-East Asia" },
    { id: "YymITZlsBfU", lang: "TH", cat: "breath", title: "ฝึกหายใจลึก ขยายปอด : ปรับก่อนป่วย", source: "Thai PBS" },
    { id: "qzR62JJCMBQ", lang: "EN", cat: "learn", title: "All it takes is 10 mindful minutes | Andy Puddicombe", source: "TED" },
    { id: "pwhmv9-68WA", lang: "TH", cat: "learn", title: "วิธีรับมือกับความเครียด", source: "โรงพยาบาลธนบุรี" },
    { id: "aMCyRdKd3iY", lang: "EN", cat: "mind", title: "10 Minute Guided Body Scan Meditation to Calm and Relax", source: "Jenny Dowling" },
    { id: "5O-cDEkHnCM", lang: "TH", cat: "breath", title: "ฝึกหายใจแบบ 4-7-8 | Relaxed Breathing", source: "ABCDF Share" },
    { id: "v-t1Z5-oPtU", lang: "EN", cat: "learn", title: "How stress affects your body - Sharon Horesh Bergquist", source: "TED-Ed" },
    { id: "NDQ1Mi5I4rg", lang: "EN", cat: "learn", title: "The gift and power of emotional courage | Susan David", source: "TED" },
    { id: "eXmX7N12GHo", lang: "TH", cat: "learn", title: "5 กิจกรรมที่ช่วยบำบัด ลดระดับความเครียดได้จริง", source: "TNN Health" },
    { id: "F2hc2FLOdhI", lang: "EN", cat: "learn", title: "How to practice emotional first aid | Guy Winch", source: "TED" },
    { id: "oCCYiMJ5QU8", lang: "TH", cat: "learn", title: "ดูแลใจ ให้สุขภาพจิตดี", source: "Siriraj PR" },
    { id: "Qd1oPOohU3M", lang: "TH", cat: "mind", title: "พานั่งสมาธิก่อนนอน 5 นาที สบายผ่อนคลายกล้ามเนื้อ", source: "สมาธิ 360 องศา" },
    { id: "9wTTAQt6XC0", lang: "EN", cat: "mind", title: "Exercise 2: Ground yourself (Doing What Matters in Times of Stress)", source: "PAHO TV" },
    { id: "efbEA8DAMqQ", lang: "TH", cat: "learn", title: "เทคนิคการจัดการความโกรธ ฉบับนักจิตวิทยา", source: "Alljit สุขภาพจิตใจ" },
    { id: "2BvszPpVWv8", lang: "TH", cat: "learn", title: "เครียดง่ายๆ อยากมีความสุข ลองฟังหมอจิตแพทย์ | หมอชวนคุย", source: "หมอวินัยโบเวจา" },
    { id: "IvtZBUSplr4", lang: "EN", cat: "learn", title: "The Space Between Self-Esteem and Self Compassion | Kristin Neff", source: "TEDx Talks" },
    { id: "pQQlXGeIdno", lang: "TH", cat: "learn", title: "5 วิธีจัดการอารมณ์ และความเครียดในวัยรุ่น", source: "We Mahidol" },
    { id: "Jr2ZCCbd96o", lang: "TH", cat: "breath", title: "การฝึกหายใจ เพื่อปรับสมดุลอารมณ์ | ปรับก่อนป่วย", source: "Thai PBS" },
    { id: "fLJsdqxnZb0", lang: "EN", cat: "learn", title: "The happy secret to better work | Shawn Achor", source: "TED" },
    { id: "rpdkBZ_cwM8", lang: "TH", cat: "learn", title: "การจัดการความเครียด", source: "ศูนย์สุขภาพจิตที่ 3 กรมสุขภาพจิต" },
    { id: "nG4SsMw47WQ", lang: "TH", cat: "learn", title: "ปลดล็อกปัญหาชีวิต กับนักจิตวิทยา", source: "โรงพยาบาลจิตเวชกรุงเทพ (BMHH)" },
    { id: "JZe_ARZZW8k", lang: "TH", cat: "mind", title: "หลักสูตรการดูแลจิตใจ | ฝึกสมาธิ", source: "กรมสุขภาพจิต" }
];

// สลับกัน: วันที่ 1 เสียง, วันที่ 2 คลิปเยียวยา, วันที่ 3 เสียง ... รวม 60 วัน ไม่ซ้ำกัน
const JOURNEY = [];
for (let i = 0; i < 30; i++) {
    JOURNEY.push(SOUNDS[i]);
    JOURNEY.push(HEALING[i]);
}

// งานวิจัย 30 ชิ้น: t = หัวข้อ, f = ผลการวิจัย, tip = นำไปใช้อย่างไร
const RESEARCH = [
    { cite: "Goyal et al. (2014) JAMA Internal Medicine", url: "https://pubmed.ncbi.nlm.nih.gov/24395196/",
      th: { t: "การฝึกสมาธิช่วยลดความวิตกกังวล", f: "งานทบทวน 47 งานวิจัย (ผู้เข้าร่วม 3,515 คน) พบว่าโปรแกรมฝึกสติช่วยลดความวิตกกังวล อาการซึมเศร้า และความเจ็บปวดได้ในระดับปานกลาง", tip: "เริ่มฝึกสติวันละ 5–10 นาทีอย่างสม่ำเสมอ" },
      en: { t: "Meditation eases anxiety", f: "A review of 47 trials (3,515 people) found mindfulness programs gave moderate improvements in anxiety, depression and pain.", tip: "Start with 5–10 minutes of mindfulness a day, consistently." } },
    { cite: "Zaccaro et al. (2018) Frontiers in Human Neuroscience", url: "https://pubmed.ncbi.nlm.nih.gov/30245619/",
      th: { t: "หายใจช้า ใจก็ช้าลง", f: "การหายใจช้าประมาณ 6 ครั้งต่อนาที สัมพันธ์กับระบบประสาทที่ผ่อนคลายขึ้น ความรู้สึกสงบ และความวิตกกังวลที่ลดลง", tip: "หายใจเข้า 4 วินาที ออก 6 วินาที นาน 2–5 นาที" },
      en: { t: "Slow breath, slower mind", f: "Breathing at about 6 breaths a minute was linked to a more relaxed nervous system, calmer feelings and less anxiety.", tip: "Breathe in for 4 seconds and out for 6 for 2–5 minutes." } },
    { cite: "Balban et al. (2023) Cell Reports Medicine", url: "https://doi.org/10.1016/j.xcrm.2022.100895",
      th: { t: "ถอนหายใจแบบมีจังหวะ 5 นาที", f: "ผู้ที่ฝึก 'cyclic sighing' (หายใจเข้า 2 จังหวะ แล้วหายใจออกยาว) วันละ 5 นาทีเป็นเวลา 1 เดือน มีอารมณ์ดีขึ้นมากกว่ากลุ่มที่ฝึกสมาธิอย่างเดียว", tip: "สูดจมูก 1 ครั้ง สูดซ้ำอีกนิด แล้วผ่อนลมออกทางปากยาว ๆ ทำ 5 นาที" },
      en: { t: "Five minutes of cyclic sighing", f: "People who did 'cyclic sighing' (a double inhale, then a long exhale) for 5 minutes a day for a month improved their mood more than a mindfulness-only group.", tip: "Inhale, top up with a second short inhale, then exhale slowly through the mouth for 5 minutes." } },
    { cite: "Ma et al. (2017) Frontiers in Psychology", url: "https://doi.org/10.3389/fpsyg.2017.00874",
      th: { t: "หายใจด้วยท้องช่วยสมาธิ", f: "การฝึกหายใจด้วยกระบังลม 8 สัปดาห์ช่วยให้สมาธิดีขึ้น อารมณ์ด้านลบลดลง และระดับคอร์ติซอล (ฮอร์โมนความเครียด) ลดลง", tip: "วางมือบนท้อง หายใจให้ท้องพองขึ้นแทนการยกไหล่" },
      en: { t: "Belly breathing helps focus", f: "Eight weeks of diaphragmatic breathing training improved attention and lowered negative mood and cortisol, a stress hormone.", tip: "Put a hand on your belly and let it rise as you breathe, instead of lifting your shoulders." } },
    { cite: "Emmons & McCullough (2003) Journal of Personality and Social Psychology", url: "https://doi.org/10.1037/0022-3514.84.2.377",
      th: { t: "นับสิ่งดี ๆ ทำให้มองชีวิตดีขึ้น", f: "ผู้ที่เขียนสิ่งที่รู้สึกขอบคุณทุกสัปดาห์ มองชีวิตในแง่ดีขึ้นและมีความหวังมากกว่ากลุ่มที่เขียนเรื่องทั่วไป", tip: "เขียน 3 สิ่งที่รู้สึกขอบคุณสัปดาห์ละครั้ง" },
      en: { t: "Counting blessings lifts your view of life", f: "People who listed things they were grateful for each week felt better about their lives and more optimistic than comparison groups.", tip: "Write down 3 things you are grateful for once a week." } },
    { cite: "Seligman et al. (2005) American Psychologist", url: "https://doi.org/10.1037/0003-066X.60.5.410",
      th: { t: "3 เรื่องดี ๆ ก่อนนอน", f: "การเขียน 3 เรื่องดีที่เกิดขึ้นในวันนั้นพร้อมเหตุผล ทุกคืนเป็นเวลา 1 สัปดาห์ ช่วยเพิ่มความสุขและลดอาการซึมเศร้าได้นานถึง 6 เดือน", tip: "คืนนี้เขียน 3 เรื่องดี ๆ และเหตุผลที่มันเกิดขึ้น" },
      en: { t: "Three good things at night", f: "Writing three things that went well each day, and why, for one week raised happiness and lowered depressive symptoms for up to 6 months.", tip: "Tonight, write 3 good things and why they happened." } },
    { cite: "Pennebaker (1997) Psychological Science", url: "https://doi.org/10.1111/j.1467-9280.1997.tb00403.x",
      th: { t: "เขียนระบายความรู้สึก", f: "การเขียนเรื่องที่กระทบใจอย่างเปิดเผย 15–20 นาที ติดต่อกัน 3–4 วัน สัมพันธ์กับสุขภาพกายและใจที่ดีขึ้น", tip: "เขียนความรู้สึกลงกระดาษ 15 นาที โดยไม่ต้องให้ใครอ่าน" },
      en: { t: "Writing your feelings out", f: "Writing openly about upsetting experiences for 15–20 minutes on 3–4 days was linked to better physical and mental health.", tip: "Write about your feelings for 15 minutes, just for yourself." } },
    { cite: "Lieberman et al. (2007) Psychological Science", url: "https://doi.org/10.1111/j.1467-9280.2007.01916.x",
      th: { t: "ตั้งชื่ออารมณ์ช่วยให้ใจเย็นลง", f: "การพูดหรือเขียนชื่ออารมณ์ที่รู้สึก ลดการทำงานของสมองส่วนอะมิกดาลาที่ตอบสนองต่อความกลัวและความเครียด", tip: "บอกตัวเองว่า 'ฉันกำลังรู้สึก...' ทุกครั้งที่อารมณ์แรง" },
      en: { t: "Naming feelings calms the brain", f: "Putting feelings into words reduced activity in the amygdala, a brain area that reacts to threat and stress.", tip: "Say 'I am feeling…' whenever an emotion is strong." } },
    { cite: "Killingsworth & Gilbert (2010) Science", url: "https://doi.org/10.1126/science.1192439",
      th: { t: "ใจที่ล่องลอยมักไม่มีความสุข", f: "คนเราคิดเรื่องอื่นระหว่างทำกิจกรรมเกือบครึ่งหนึ่งของเวลา และมักมีความสุขน้อยลงในช่วงที่ใจล่องลอย", tip: "เลือก 1 กิจกรรมวันนี้ แล้วอยู่กับมันเต็มที่" },
      en: { t: "A wandering mind is often unhappy", f: "People's minds wandered almost half the time, and they tended to be less happy while their minds wandered.", tip: "Pick one activity today and be fully present in it." } },
    { cite: "Bratman et al. (2015) PNAS", url: "https://doi.org/10.1073/pnas.1510459112",
      th: { t: "เดินในธรรมชาติลดการคิดวน", f: "การเดิน 90 นาทีในพื้นที่ธรรมชาติลดการคิดวนเรื่องลบ และลดการทำงานของสมองส่วนที่เกี่ยวข้อง เมื่อเทียบกับการเดินในเมือง", tip: "หาเวลาเดินในสวนหรือที่มีต้นไม้สัปดาห์ละครั้ง" },
      en: { t: "Nature walks reduce rumination", f: "A 90-minute walk in nature reduced repetitive negative thinking and related brain activity compared with an urban walk.", tip: "Take a walk somewhere green once a week." } },
    { cite: "Hunter et al. (2019) Frontiers in Psychology", url: "https://doi.org/10.3389/fpsyg.2019.00722",
      th: { t: "ยาธรรมชาติ 20 นาที", f: "การอยู่ในธรรมชาติ 20–30 นาที ช่วยลดคอร์ติซอล (ฮอร์โมนความเครียด) ได้คุ้มค่าเวลาที่สุด", tip: "ออกไปนั่งหรือเดินใกล้ต้นไม้ 20 นาที" },
      en: { t: "A 20-minute nature pill", f: "Spending 20–30 minutes in nature gave the most efficient drop in cortisol, a stress hormone.", tip: "Sit or walk near trees for 20 minutes." } },
    { cite: "Twohig-Bennett & Jones (2018) Environmental Research", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6562165/",
      th: { t: "พื้นที่สีเขียวดีต่อร่างกาย", f: "การอยู่ใกล้พื้นที่สีเขียวสัมพันธ์กับคอร์ติซอลที่ต่ำลง ชีพจรที่ช้าลง และสุขภาพโดยรวมที่ดีขึ้น", tip: "วางต้นไม้เล็ก ๆ ไว้ใกล้โต๊ะ หรือพักใกล้สวน" },
      en: { t: "Green spaces help the body", f: "Exposure to green space was linked to lower cortisol, slower heart rate and better overall health.", tip: "Keep a small plant on your desk or take breaks near greenery." } },
    { cite: "Ulrich (1984) Science", url: "https://doi.org/10.1126/science.6143402",
      th: { t: "วิวต้นไม้ช่วยให้หายเร็ว", f: "ผู้ป่วยหลังผ่าตัดที่ห้องมองเห็นต้นไม้ นอนโรงพยาบาลสั้นกว่าและใช้ยาแก้ปวดน้อยกว่าผู้ที่เห็นแต่กำแพง", tip: "หันโต๊ะหรือที่นั่งให้มองเห็นต้นไม้หรือท้องฟ้า" },
      en: { t: "A view of trees helps recovery", f: "Surgery patients with a window view of trees had shorter stays and needed fewer pain medicines than those facing a wall.", tip: "Arrange your seat to see trees or the sky." } },
    { cite: "Singh et al. (2023) British Journal of Sports Medicine", url: "https://bjsm.bmj.com/content/bjsports/early/2023/07/11/bjsports-2022-106195.full.pdf",
      th: { t: "ขยับร่างกายช่วยใจ", f: "งานทบทวนขนาดใหญ่พบว่าการออกกำลังกาย รวมถึงเดินและโยคะ ช่วยลดอาการซึมเศร้า ความวิตกกังวล และความทุกข์ใจได้ชัดเจน", tip: "เดินเร็วหรือขยับร่างกาย 20–30 นาทีวันนี้" },
      en: { t: "Moving helps the mind", f: "A large umbrella review found physical activity, including walking and yoga, clearly reduced depression, anxiety and distress.", tip: "Walk briskly or move your body for 20–30 minutes today." } },
    { cite: "Scott et al. (2021) Sleep Medicine Reviews", url: "https://pubmed.ncbi.nlm.nih.gov/34607184/",
      th: { t: "นอนดีขึ้น ใจดีขึ้น", f: "การปรับปรุงการนอนช่วยลดอาการซึมเศร้า ความวิตกกังวล และความเครียด", tip: "เข้านอนและตื่นให้ตรงเวลาเดิมทุกวัน" },
      en: { t: "Better sleep, better mood", f: "Improving sleep led to less depression, anxiety and stress.", tip: "Go to bed and wake up at the same time every day." } },
    { cite: "Holt-Lunstad et al. (2010) PLoS Medicine", url: "https://doi.org/10.1371/journal.pmed.1000316",
      th: { t: "ความสัมพันธ์ที่ดีทำให้อายุยืน", f: "ผู้ที่มีความสัมพันธ์ทางสังคมแข็งแรง มีโอกาสรอดชีวิตสูงกว่าราว 50% ในช่วงเวลาที่ติดตาม", tip: "ทักทายหรือโทรหาคนที่คุณห่วงใย 1 คน" },
      en: { t: "Good relationships, longer life", f: "People with stronger social relationships had about 50% higher likelihood of survival over the follow-up period.", tip: "Message or call one person you care about." } },
    { cite: "Cohen et al. (2015) Psychological Science", url: "https://doi.org/10.1177/0956797614559284",
      th: { t: "กอดช่วยกันความเครียด", f: "ผู้ที่ได้รับกำลังใจและได้กอดบ่อย ได้รับผลกระทบจากความเครียดต่อการติดเชื้อหวัดน้อยกว่า", tip: "กอดคนในครอบครัวหรือสัตว์เลี้ยงวันนี้" },
      en: { t: "Hugs buffer stress", f: "People with more social support and frequent hugs were better protected against the effect of stress on catching a cold.", tip: "Hug a family member or pet today." } },
    { cite: "Dunn, Aknin & Norton (2008) Science", url: "https://doi.org/10.1126/science.1150952",
      th: { t: "ให้ผู้อื่นแล้วมีความสุข", f: "การใช้เงินเพื่อผู้อื่นทำให้มีความสุขมากกว่าการใช้เงินเพื่อตัวเอง แม้จำนวนเงินจะน้อย", tip: "เลี้ยงขนมหรือช่วยเหลือใครสักคนด้วยเรื่องเล็ก ๆ" },
      en: { t: "Giving makes us happier", f: "Spending money on others made people happier than spending on themselves, even with small amounts.", tip: "Treat or help someone in a small way." } },
    { cite: "Kok et al. (2013) Psychological Science", url: "https://doi.org/10.1177/0956797612470827",
      th: { t: "ส่งความปรารถนาดี (เมตตา)", f: "การฝึกเมตตาภาวนาช่วยเพิ่มอารมณ์บวก ความรู้สึกใกล้ชิดผู้อื่น และการทำงานของเส้นประสาทวากัสที่ช่วยให้ร่างกายสงบ", tip: "นึกถึงคน 1 คน แล้วอวยพรในใจว่า 'ขอให้มีความสุข ปลอดภัย'" },
      en: { t: "Loving-kindness", f: "Loving-kindness meditation increased positive emotions, feelings of connection and vagal tone, which helps the body calm down.", tip: "Picture someone and silently wish: 'May you be happy and safe.'" } },
    { cite: "Neff & Germer (2013) Journal of Clinical Psychology", url: "https://doi.org/10.1002/jclp.21923",
      th: { t: "ใจดีกับตัวเอง", f: "โปรแกรมฝึกความเมตตาต่อตัวเอง 8 สัปดาห์ช่วยลดซึมเศร้า วิตกกังวล และความเครียด และเพิ่มความพึงพอใจในชีวิต", tip: "พูดกับตัวเองเหมือนพูดกับเพื่อนสนิทที่กำลังลำบาก" },
      en: { t: "Be kind to yourself", f: "An 8-week self-compassion program reduced depression, anxiety and stress and increased life satisfaction.", tip: "Talk to yourself as you would to a struggling friend." } },
    { cite: "Crum, Salovey & Achor (2013) Journal of Personality and Social Psychology", url: "https://doi.org/10.1037/a0031201",
      th: { t: "มองความเครียดใหม่", f: "ผู้ที่มองว่าความเครียดช่วยให้เติบโตได้ มีสุขภาพใจและผลการทำงานดีกว่าผู้ที่มองว่าความเครียดมีแต่ผลร้าย", tip: "บอกตัวเองว่า 'ความเครียดนี้กำลังช่วยให้ฉันตั้งใจ'" },
      en: { t: "Rethink stress", f: "People who saw stress as something that can help them grow had better wellbeing and work performance.", tip: "Tell yourself: 'This stress is helping me focus.'" } },
    { cite: "Jamieson et al. (2012) Journal of Experimental Psychology: General", url: "https://doi.org/10.1037/a0025719",
      th: { t: "ใจเต้นแรงคือพลัง", f: "ผู้ที่ได้เรียนรู้ว่าอาการตื่นเต้นช่วยให้ร่างกายพร้อม มีการตอบสนองของหัวใจและหลอดเลือดต่อความเครียดที่ดีขึ้น", tip: "ก่อนสอบหรือพรีเซนต์ บอกตัวเองว่า 'ร่างกายกำลังเตรียมพร้อม'" },
      en: { t: "A racing heart is energy", f: "People taught that arousal helps performance showed a healthier heart and blood-vessel response to stress.", tip: "Before a test or talk, tell yourself: 'My body is getting ready.'" } },
    { cite: "Sheldon & Lyubomirsky (2006) Journal of Positive Psychology", url: "https://doi.org/10.1080/17439760500510676",
      th: { t: "จินตนาการตัวเองในวันที่ดีที่สุด", f: "การเขียนถึงตัวเองในอนาคตที่ทุกอย่างเป็นไปด้วยดี ช่วยเพิ่มอารมณ์บวก", tip: "เขียน 5 บรรทัดถึงชีวิตของคุณในอีก 1 ปีที่เป็นไปด้วยดี" },
      en: { t: "Imagine your best possible self", f: "Writing about a future where things have gone well increased positive mood.", tip: "Write 5 lines about your life a year from now when things have gone well." } },
    { cite: "Thoma et al. (2013) PLoS ONE", url: "https://doi.org/10.1371/journal.pone.0070156",
      th: { t: "ดนตรีผ่อนคลายกับความเครียด", f: "การฟังดนตรีผ่อนคลายก่อนเจอสถานการณ์ตึงเครียด ช่วยให้ระบบประสาทอัตโนมัติฟื้นตัวเร็วขึ้นหลังความเครียด", tip: "ฟังเพลงช้า ๆ 10 นาทีก่อนงานที่กดดัน" },
      en: { t: "Relaxing music and stress", f: "Listening to relaxing music before a stressful task helped the autonomic nervous system recover faster afterwards.", tip: "Listen to slow music for 10 minutes before a stressful task." } },
    { cite: "de Witte et al. (2020) Health Psychology Review", url: "https://doi.org/10.1080/17437199.2019.1627897",
      th: { t: "ดนตรีลดความเครียดได้จริง", f: "การวิเคราะห์รวม 104 งานวิจัย พบว่าดนตรีช่วยลดความเครียดทั้งด้านร่างกาย เช่น ชีพจร และด้านจิตใจ", tip: "ทำเพลย์ลิสต์เพลงสบายใจไว้ฟังตอนเครียด" },
      en: { t: "Music really lowers stress", f: "A meta-analysis of 104 studies found music reduced both physical stress (such as heart rate) and psychological stress.", tip: "Make a calming playlist for stressful moments." } },
    { cite: "Garcia-Argibay et al. (2019) Psychological Research", url: "https://doi.org/10.1007/s00426-018-1066-8",
      th: { t: "คลื่นเสียง binaural beats", f: "การวิเคราะห์รวมงานวิจัยพบว่า binaural beats อาจช่วยลดความวิตกกังวลได้บ้าง แต่ผลยังแตกต่างกันมาก จึงควรใช้เป็นตัวช่วยผ่อนคลาย ไม่ใช่การรักษา", tip: "ใส่หูฟังเสียงเบา ๆ แล้วสังเกตว่าตัวเองรู้สึกอย่างไร" },
      en: { t: "Binaural beats", f: "A meta-analysis found binaural beats may modestly reduce anxiety, but results vary a lot, so treat them as a relaxation aid, not a treatment.", tip: "Use headphones at low volume and notice how you feel." } },
    { cite: "Khoury et al. (2015) Journal of Psychosomatic Research", url: "https://doi.org/10.1016/j.jpsychores.2015.03.009",
      th: { t: "สติช่วยคนทั่วไปด้วย", f: "โปรแกรมลดความเครียดด้วยสติ (MBSR) ในคนที่ไม่ได้ป่วย ช่วยลดความเครียด ความวิตกกังวล และเพิ่มคุณภาพชีวิต", tip: "ฝึกสังเกตลมหายใจ 1 นาทีทุกครั้งก่อนเปิดมือถือ" },
      en: { t: "Mindfulness helps healthy people too", f: "Mindfulness-based stress reduction in healthy people reduced stress and anxiety and improved quality of life.", tip: "Notice your breath for 1 minute before unlocking your phone." } },
    { cite: "Ekers et al. (2014) PLoS ONE", url: "https://doi.org/10.1371/journal.pone.0100100",
      th: { t: "ลงมือทำสิ่งที่มีความหมาย", f: "การกระตุ้นพฤติกรรม คือการวางแผนทำกิจกรรมที่มีความหมายหรือสนุก ช่วยลดอาการซึมเศร้าได้ผลดี", tip: "นัดตัวเองทำกิจกรรมที่ชอบ 1 อย่างวันนี้ แม้ยังไม่อยากทำ" },
      en: { t: "Do things that matter", f: "Behavioural activation, planning enjoyable or meaningful activities, was an effective way to reduce depression.", tip: "Schedule one activity you value today, even if you don't feel like it yet." } },
    { cite: "Aeon et al. (2021) PLOS ONE", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7799745/",
      th: { t: "จัดเวลาดี ใจสบาย", f: "การจัดการเวลาสัมพันธ์กับความเป็นอยู่ที่ดีขึ้นและความทุกข์ใจที่ลดลง มากกว่าผลต่อประสิทธิภาพงานเสียอีก", tip: "เขียนงาน 3 อย่างที่สำคัญที่สุดของวันพรุ่งนี้ก่อนนอน" },
      en: { t: "Manage time, ease the mind", f: "Time management was linked to better wellbeing and less distress, even more than to job performance.", tip: "Before bed, write tomorrow's 3 most important tasks." } },
    { cite: "Smyth et al. (2018) JMIR Mental Health", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6305886/",
      th: { t: "เขียนบันทึกด้านบวก", f: "การเขียนบันทึกด้านบวก 15 นาที สัปดาห์ละ 3 ครั้ง นาน 12 สัปดาห์ ช่วยลดความทุกข์ใจและเพิ่มความเป็นอยู่ที่ดี", tip: "เขียนสิ่งที่ทำให้ยิ้มได้วันนี้ 15 นาที" },
      en: { t: "Positive journaling", f: "Writing a positive journal for 15 minutes, 3 times a week for 12 weeks, reduced distress and improved wellbeing.", tip: "Write for 15 minutes about what made you smile today." } }
];

// ของรางวัลเมื่อทำภารกิจครบ 7 วัน: เลือกได้ฟรี 1 ชิ้น (ปกติราคาถูกสุด ฿19) ชื่อของอยู่ในไฟล์ภาษา js.rewardNames
const REWARDS = [
    { id: "bell", icon: "🔔", price: 19 },
    { id: "scarf", icon: "🧣", price: 19 },
    { id: "mouse", icon: "🐭", price: 19 },
    { id: "ball", icon: "🎾", price: 19 },
    { id: "crown", icon: "🌼", price: 19 },
    { id: "glasses", icon: "👓", price: 19 },
    { id: "beanie", icon: "🧶", price: 19 },
    { id: "mat", icon: "🧺", price: 19 }
];

// ของราคาสูงยังต้องซื้อ: ราคาเต็ม, Premium ลด 10%, Care+ ลด 20%
const SHOP_ITEMS = [
    { id: "house", icon: "🏡", price: 49 },
    { id: "thai", icon: "👘", price: 59 },
    { id: "krathong", icon: "🏮", price: 79 }
];

// =====================================================================
// v17: สำหรับคนทำงาน (ข้อความทุกภาษาอยู่ในไฟล์ภาษา lang/*.js ส่วนนี้เก็บแค่โครงสร้าง)
//   CBI_ITEMS = เช็กภาวะหมดไฟ Copenhagen Burnout Inventory (Kristensen et al., 2005) 13 ข้อ
//   RESETS    = พักสั้น 1–3 นาที 6 การ์ด
//   CAUSES    = ต้นเหตุความเครียด 8 เรื่อง และทักษะที่ใช้รับมือ (SKILLS)
// =====================================================================

// ===== เช็กภาวะหมดไฟ (CBI) =====
// sub: personal = ภาวะหมดไฟส่วนบุคคล (6 ข้อ), work = ภาวะหมดไฟจากงาน (7 ข้อ)
// scale: freq = บ่อยแค่ไหน (เสมอ/บ่อย/บางครั้ง/นาน ๆ ครั้ง/ไม่เคยหรือแทบไม่เคย)
//        deg  = มากแค่ไหน (มากที่สุด/มาก/ปานกลาง/น้อย/น้อยที่สุด) ตามต้นฉบับ CBI ข้อ work 1–3
// คะแนนคำตอบ 100 / 75 / 50 / 25 / 0 · reverse = กลับคะแนน (ข้อ "มีแรงพอสำหรับครอบครัวและเพื่อน")
// ข้อความคำถามอยู่ใน js.cbiQ ของไฟล์ภาษา (ลำดับตรงกัน)
const CBI_ITEMS = [
    { sub: "personal", scale: "freq" },   // How often do you feel tired?
    { sub: "personal", scale: "freq" },   // How often are you physically exhausted?
    { sub: "personal", scale: "freq" },   // How often are you emotionally exhausted?
    { sub: "personal", scale: "freq" },   // How often do you think: "I can't take it anymore"?
    { sub: "personal", scale: "freq" },   // How often do you feel worn out?
    { sub: "personal", scale: "freq" },   // How often do you feel weak and susceptible to illness?
    { sub: "work", scale: "deg" },        // Is your work emotionally exhausting?
    { sub: "work", scale: "deg" },        // Do you feel burnt out because of your work?
    { sub: "work", scale: "deg" },        // Does your work frustrate you?
    { sub: "work", scale: "freq" },       // Do you feel worn out at the end of the working day?
    { sub: "work", scale: "freq" },       // Are you exhausted in the morning at the thought of another day at work?
    { sub: "work", scale: "freq" },       // Do you feel that every working hour is tiring for you?
    { sub: "work", scale: "freq", reverse: true }  // Do you have enough energy for family and friends during leisure time?
];
const CBI_SOURCE = { cite: "Kristensen et al. (2005) Work & Stress 19(3):192–207", url: "https://doi.org/10.1080/02678370500297720" };

// ===== พักสั้น 1–3 นาที =====
// seconds = เวลาของตัวจับเวลา, relax = นับเป็นภารกิจข้อ 3 (หายใจ/พักสั้น) ของวันนี้
// phases = จังหวะที่วนซ้ำ (วินาที) ใช้กับการหายใจแบบถอนใจ: เข้าทางจมูก → สูดเพิ่มอีกนิด → ออกยาวทางปาก
// note = มีช่องเขียน (เก็บในหน้านี้เท่านั้น จนกว่าจะกดบันทึก)
const RESETS = [
    { id: "sigh", icon: "🌬️", seconds: 60, relax: true, phases: [2, 1, 5],
      cite: "Balban et al. (2023) Cell Reports Medicine", url: "https://doi.org/10.1016/j.xcrm.2022.100895" },
    { id: "ground", icon: "🖐️", seconds: 120, relax: true,
      cite: "WHO (2020) Doing What Matters in Times of Stress", url: "https://www.who.int/publications/i/item/9789240003927" },
    { id: "stretch", icon: "🧘", seconds: 180, relax: true, cite: "", url: "" },
    { id: "eye", icon: "👀", seconds: 60, relax: true,
      cite: "American Academy of Ophthalmology: 20-20-20 rule", url: "" },
    { id: "dump", icon: "🗒️", seconds: 120, note: "dump",
      cite: "Scullin et al. (2018) J Exp Psychol Gen", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5758411/" },
    { id: "step", icon: "👣", seconds: 120, note: "step",
      cite: "Problem-solving therapy (D'Zurilla & Nezu)", url: "" },
    // v18: phaseText = ชื่อจังหวะ (ไฟล์ภาษา), stepsTimed = ไฮไลต์ขั้นตามเวลาไปพร้อมจังหวะ
    // คลายกล้ามเนื้อทีละส่วน (PMR): 12 ส่วน ส่วนละ 15 วินาที = เกร็ง 5 + ผ่อน 10 จากเท้าขึ้นไปถึงใบหน้า
    { id: "pmr", icon: "💪", seconds: 180, relax: true, phases: [5, 10], phaseText: "pmrPhases", stepsTimed: true,
      cite: "Progressive muscle relaxation (Jacobson) · Toussaint et al. (2021) Evid Based Complement Alternat Med", url: "https://doi.org/10.1155/2021/5924040" },
    // เดินออกไปข้างนอก 5 นาที (เดินต่อถึง 10 นาทีได้) ข้อความชวนสังเกตเปลี่ยนทุก 1 นาที
    { id: "walk", icon: "🚶", seconds: 300, relax: true,
      cite: "WHO (2020) Guidelines on physical activity and sedentary behaviour", url: "https://www.who.int/publications/i/item/9789240015128" },
    // หายใจ 4-8: เข้า 4 วินาที ออก 8 วินาที 10 รอบ = 2 นาที
    { id: "breath48", icon: "🫁", seconds: 120, relax: true, phases: [4, 8], phaseText: "b48Phases",
      cite: "Zaccaro et al. (2018) Front Hum Neurosci", url: "https://pubmed.ncbi.nlm.nih.gov/30245619/" }
];

// ===== รับมือที่ต้นเหตุ =====
// ชื่อเรื่องอยู่ใน js.causeNames, ชื่อทักษะ/ขั้นตอนอยู่ใน js.skills ของไฟล์ภาษา
const CAUSES = [
    { id: "work", icon: "📋", skills: ["prio", "timebox", "sayno"] },
    { id: "people", icon: "🧑‍💼", skills: ["desc", "clarify"] },
    { id: "money", icon: "💸", skills: ["budget", "debt"] },
    { id: "job", icon: "🧭", skills: ["circle", "skillplan"] },
    { id: "family", icon: "🏠", skills: ["istate", "boundary"] },
    { id: "sleep", icon: "😴", skills: ["wake", "rule20", "caffeine"] },
    { id: "commute", icon: "🚆", skills: ["audio", "ride"] },
    { id: "study", icon: "📚", skills: ["pomodoro", "retrieval"] }
];
const MAX_CAUSES = 3;

// tool: เครื่องมือในการ์ด (desc = แม่แบบ DESC เติมคำ, budget = คำนวณ 50/30/20, debt = ลิงก์ช่วยเรื่องหนี้ฟรี)
const SKILLS = {
    prio: { cite: "Eisenhower matrix · Aeon et al. (2021) PLOS ONE", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7799745/" },
    timebox: { cite: "Aeon et al. (2021) PLOS ONE", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7799745/" },
    sayno: { cite: "Assertive communication", url: "" },
    desc: { cite: "DESC script (Bower & Bower, 1976)", url: "", tool: "desc" },
    clarify: { cite: "Assertive communication", url: "" },
    budget: { cite: "50/30/20 (Warren & Tyagi, 2005)", url: "", tool: "budget" },
    debt: { cite: "Bank of Thailand", url: "", tool: "debt" },
    circle: { cite: "Circle of control (Covey, 1989)", url: "" },
    skillplan: { cite: "Goal setting + implementation intentions", url: "" },
    istate: { cite: "I-messages (Gordon)", url: "" },
    boundary: { cite: "Assertive communication", url: "" },
    wake: { cite: "CBT-I · Edinger et al. (2021) J Clin Sleep Med", url: "https://doi.org/10.5664/jcsm.8986" },
    rule20: { cite: "CBT-I stimulus control · Edinger et al. (2021)", url: "https://doi.org/10.5664/jcsm.8986" },
    caffeine: { cite: "Gardiner et al. (2023) Sleep Medicine Reviews", url: "https://eprints.leedsbeckett.ac.uk/id/eprint/9625" },
    audio: { cite: "", url: "" },
    ride: { cite: "Zaccaro et al. (2018) Front Hum Neurosci", url: "https://pubmed.ncbi.nlm.nih.gov/30245619/" },
    pomodoro: { cite: "Pomodoro Technique (Cirillo)", url: "" },
    retrieval: { cite: "Dunlosky et al. (2013) Psychol Sci Public Interest", url: "https://doi.org/10.1177/1529100612453266" },
    // v18: กินเพราะเครียด (ไม่ใช่การลดน้ำหนัก ไม่มีการนับแคลอรี่) ใช้ในผลเช็กร่างกายและพฤติกรรม
    stresseat: { cite: "Mindful eating · hunger scale 1–10", url: "" }
};

// ลิงก์ช่วยเรื่องหนี้ฟรี (ทักษะ debt)
const DEBT_CLINIC_URL = "https://www.debtclinicbysam.com";
const BOT_HOTLINE = "1213";

// =====================================================================
// v18: อาการเครียดสะสมทางร่างกาย อารมณ์ และพฤติกรรม + เมื่อไรควรพบแพทย์ (ข้อความทุกภาษาอยู่ใน lang/*.js)
//   CHECK_AREAS  = เช็กร่างกายและพฤติกรรมรายสัปดาห์ 6 ด้าน (+ ด้านการใช้สาร เฉพาะคนที่ตอบว่าใช้)
//   SUBSTANCES   = บุหรี่/บุหรี่ไฟฟ้า, เครื่องดื่มแอลกอฮอล์, สารอื่น ๆ (ถามครั้งเดียว เก็บใน hikariProfile_)
//   CHECK_ACTIONS = วิธีดูแลที่ตรงกับแต่ละด้าน (ลิงก์ไปฟีเจอร์ที่มีอยู่)
//   DEP_*        = แบบคัดกรองโรคซึมเศร้า 2Q และแบบประเมิน 9Q ของกรมสุขภาพจิต
//   HOTLINE_*    = สายด่วนฟรี (สมุดสายด่วนในส่วน "ขอความช่วยเหลือ" แสดงทุกสายให้ทุกคน)
// =====================================================================

// ===== เช็กร่างกายและพฤติกรรม (7 วันที่ผ่านมา) =====
// คะแนน 0 = ไม่เลย, 1 = 1–2 วัน, 2 = 3–4 วัน, 3 = เกือบทุกวัน · ด้านที่ได้ 2 ขึ้นไป = แสดงวิธีดูแลที่ตรงกัน
// redflag = แสดงสัญญาณอันตราย (โทร 1669) ใต้คำถามข้อนั้นด้วย
const CHECK_AREAS = [
    { id: "sleep", icon: "😴" },
    { id: "head", icon: "🤕", redflag: true },
    { id: "gut", icon: "🌀" },
    { id: "heart", icon: "💓", redflag: true },
    { id: "eat", icon: "🍽️" },
    { id: "social", icon: "🚪" }
];
const SUBSTANCES = ["smoke", "alcohol", "other"];
const CHECK_HIGH = 2;               // 3–4 วันขึ้นไป
const CHECK_EVERY_DAYS = 7;         // แนะนำให้เช็กสัปดาห์ละครั้ง

// วิธีดูแลที่ตรงกับแต่ละด้าน: reset = เปิดการ์ดพักสั้น, skill = การ์ดทักษะ, anchor = ลิงก์ในหน้า, tel = สายด่วน
const CHECK_ACTIONS = {
    sleep: [{ skill: "rule20" }, { skill: "wake" }],
    head: [{ reset: "stretch" }, { reset: "pmr" }],
    gut: [{ reset: "breath48" }, { skill: "stresseat" }],
    heart: [{ reset: "breath48" }],
    eat: [{ skill: "stresseat" }],
    social: [{ anchor: "#talk" }],
    smoke: [{ tel: "1600" }],
    alcohol: [{ tel: "1413" }],
    other: [{ tel: "1165" }]
};

// ===== แบบคัดกรองโรคซึมเศร้า 2Q + แบบประเมินโรคซึมเศร้า 9Q (กรมสุขภาพจิต กระทรวงสาธารณสุข) =====
// 2Q: ตอบ "มี" ข้อใดข้อหนึ่ง = มีความเสี่ยง ทำ 9Q ต่อ · "ไม่มี" ทั้ง 2 ข้อ = ไม่พบความเสี่ยงในตอนนี้
// 9Q: ไม่มีเลย 0 / เป็นบางวัน 1–7 วัน 1 / เป็นบ่อย > 7 วัน 2 / เป็นทุกวัน 3 (รวม 0–27)
// ระดับ: < 7 ไม่มีหรือน้อยมาก, 7–12 น้อย, 13–18 ปานกลาง, ≥ 19 รุนแรง · ≥ 7 แนะนำพบแพทย์
// ข้อ 9 (คิดทำร้ายตนเอง) ≥ 1 = แสดงการ์ดช่วยเหลือทันทีด้านบนของผล (เว็บนี้ไม่ทำ 8Q เพราะเป็นเครื่องมือของบุคลากร)
const DEP_2Q_COUNT = 2;
const DEP_9Q_COUNT = 9;
const DEP_SELF_HARM_ITEM = 8;       // ลำดับข้อ 9 (นับจาก 0)
const DEP_DOCTOR_SCORE = 7;
const DEP_SOURCES = [
    { cite: "กรมสุขภาพจิต: แบบประเมินโรคซึมเศร้า 9Q (โรงพยาบาลจิตเวชขอนแก่นราชนครินทร์)", url: "https://www.krph.go.th/mh_test/9q/index.php" },
    { cite: "Kongsuk T. et al. (2018) Criterion-related validity of the 9Q, J Psychiatr Assoc Thailand", url: "https://he01.tci-thaijo.org/index.php/JPAT/article/view/162939" }
];

// ===== สายด่วน (โทรฟรี) =====
// 1165 ตรวจแล้ว: สายด่วนบำบัดยาเสพติด สถาบันบำบัดรักษาและฟื้นฟูผู้ติดยาเสพติดแห่งชาติบรมราชชนนี (สบยช.) 24 ชม.
// ที่มา: กรมประชาสัมพันธ์ สวท.เชียงใหม่ 21 มี.ค. 2569 https://radiochiangmai.prd.go.th/th/content/category/detail/id/57/iid/487363
const SUBSTANCE_HOTLINE = { smoke: "1600", alcohol: "1413", other: "1165" };
