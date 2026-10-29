/**
 * Hikari: แบบสอบถามรอบทดสอบจริง ฉบับที่ 2 (เว็บ + เกมสวนแสง) 2 ภาษา ไทย / English
 * ------------------------------------------------------------------
 * วิธีใช้ (ทำครั้งเดียว เหมือนฉบับแรก):
 *   1. เปิด https://script.google.com → "New project" (โปรเจกต์ใหม่ ไม่ต้องลบโปรเจกต์เดิม)
 *   2. ลบโค้ดเดิมในหน้าจอ แล้ววางโค้ดในไฟล์นี้ทั้งหมด → แก้ CONTACT ด้านล่าง → กด Save
 *   3. เลือกฟังก์ชัน createSurvey แล้วกด Run (▶) → อนุญาตสิทธิ์ (ทำแบบเดียวกับครั้งก่อน)
 *   4. ดู "Execution log" จะได้ลิงก์แบบสอบถามใหม่ → นำไปใส่ SURVEY_URL ใน config.js
 *   5. ดูผล: เลือก analyzeResults → Run → ดูแท็บ "สรุปผล" ใน Google Sheet
 *
 * ความเป็นส่วนตัว (PDPA):
 *   - หน้าแรกเป็นหนังสือแจ้งและขอความยินยอม ถ้า "ไม่ยินยอม" หรืออายุ "ต่ำกว่า 18 ปี" ฟอร์มจะจบทันที
 *     และไม่ถามเรื่องสุขภาพใจ
 *   - ไม่เก็บอีเมล ช่องติดต่อสำหรับผู้ทดสอบ beta ต้องติ๊กยินยอมแยก
 *   - analyzeResults นับเฉพาะคนที่ยินยอมและอายุ 18 ปีขึ้นไป
 *
 * เกณฑ์ตัดสินใจลงทุนทำแอป (แก้ตัวเลขได้ที่ "ตั้งค่า"):
 *   1) สนใจใช้แอปหรือเว็บ (ใช้แน่นอน / น่าจะใช้) > 30%
 *   2) ยินดีจ่ายแผนรายเดือน > 10%
 *   3) ในคนที่เล่นเกม: เล่น 3 วันขึ้นไป ≥ 40%
 *   4) ยินดีซื้อของในเกม > 10%
 *   5) NPS > 0
 *   ดูแยกกลุ่ม "คนที่เครียดจริง" (ระดับ 4–5 จาก 5) ทุกครั้ง
 */

// ===== ตั้งค่า =====
const SURVEY_TITLE = 'แบบสอบถาม Hikari (เว็บ + เกมสวนแสง) / Hikari Survey (website + Light Garden game)';
const ORG_NAME = 'บริษัท โมคารุ เอนเตอร์เทนเมนท์ จำกัด';
const CONTACT = 'LINE OA @833aevlx (https://line.me/R/ti/p/@833aevlx) หรืออีเมล mokaru.entertainment.admin@gmail.com';
const KEEP_MONTHS = 12;          // เก็บคำตอบไม่เกินกี่เดือน
const USE_THRESHOLD = 0.30;
const PAY_THRESHOLD = 0.10;
const RETAIN_THRESHOLD = 0.40;
const ITEM_THRESHOLD = 0.10;
const NPS_THRESHOLD = 0;
const STRESSED_MIN = 4;

function b(th, en) {
  return th + ' / ' + en;
}

// ชื่อคำถามที่ใช้วิเคราะห์ (ต้องตรงกับในฟอร์ม)
const Q_CONSENT = b('คุณยินยอมให้เก็บและใช้คำตอบตามที่แจ้งไว้ข้างต้นหรือไม่?', 'Do you consent to the collection and use of your answers as described above?');
const Q_AGE = b('อายุ', 'Age');
const Q_STATUS = b('สถานะของคุณ', 'Your status');
const Q_STRESS_SRC = b('ช่วงนี้อะไรทำให้คุณเครียดมากที่สุด (เลือกได้สูงสุด 3 ข้อ)', 'What stresses you most lately? (choose up to 3)');
const Q_WHEN = b('ช่วงเวลาไหนที่คุณน่าจะเปิดใช้ Hikari (เลือกได้หลายข้อ)', 'When would you most likely open Hikari? (choose any)');
const Q_EMPLOYER = b('ถ้าที่ทำงานหรือมหาวิทยาลัยจ่ายค่าแผนให้ (เป็นสวัสดิการ) คุณจะใช้ไหม?', 'If your employer or university paid for a plan (as a benefit), would you use it?');
const STUDENT = b('นักศึกษา', 'Student');
const Q_STRESS = b('ช่วงนี้คุณรู้สึกเครียดบ่อยแค่ไหน?', 'How often do you feel stressed lately?');
const Q_TRIED = b('คุณได้ลองใช้ส่วนไหนของ Hikari แล้วบ้าง?', 'Which parts of Hikari did you try?');
const Q_GAME_DAYS = b('คุณเล่นเกมสวนแสงไปกี่วัน (ไม่จำเป็นต้องติดกัน)?', 'On how many days did you play the Light Garden game (not necessarily in a row)?');
const Q_WEB_SAT = b('ความพึงพอใจต่อเว็บไซต์โดยรวม', 'Overall satisfaction with the website');
const Q_GAME_SAT = b('ความพึงพอใจต่อเกมสวนแสงโดยรวม', 'Overall satisfaction with the Light Garden game');
const Q_RELIEF = b('หลังเล่นเกมหรือใช้เว็บ คุณรู้สึกผ่อนคลายขึ้นแค่ไหน?', 'After playing or using the website, how much more relaxed did you feel?');
const Q_WORLD = b('ชอบโลกไหนมากที่สุด?', 'Which world did you like most?');
const Q_GAME_PARTS = b('ส่วนไหนของเกมที่ชอบ (เลือกได้หลายข้อ)', 'Which parts of the game did you like? (choose any)');
const Q_ITEM_BUY = b('ถ้าเปิดขายจริง คุณจะซื้อของแต่งในเกมไหม?', 'If items were on sale, would you buy in-game items?');
const Q_ITEM_PRICE = b('ราคาต่อชิ้นที่รู้สึกว่า "คุ้ม" สำหรับของแต่งในเกม', 'Price per item that feels worth it');
const Q_ITEM_TYPES = b('ของแบบไหนที่อยากซื้อ (เลือกได้หลายข้อ)', 'What kind of items would you buy? (choose any)');
const Q_ITEM_MONTH = b('ใช้จ่ายกับของในเกมได้เดือนละประมาณเท่าไร', 'About how much would you spend on game items per month?');
const Q_WEB = b('หลังจากลองแล้ว คุณจะกลับมาใช้ Hikari (เว็บหรือเกม) อีกไหม?', 'After trying it, would you keep using Hikari (website or game)?');
const Q_APP = b('ถ้า Hikari เป็นแอปมือถือ (รวมเกม) คุณจะใช้ไหม?', 'If Hikari became a mobile app (with the game), would you use it?');
const Q_FEATURES = b('ฟีเจอร์ที่อยากให้มีในแอป (เลือกได้หลายข้อ)', 'Features you want in the app (choose any)');
const Q_PAY = b('ถ้ามีแอป Hikari ตามแผนข้างต้น คุณยินดีจ่ายแผนรายเดือน (Premium หรือ Care+) ไหม?', 'If Hikari became an app with these plans, would you pay for a monthly plan (Premium or Care+)?');
const Q_PLAN = b('คุณสนใจแผนไหนมากที่สุด?', 'Which plan interests you most?');
const Q_PRICE = b('ราคา Premium ต่อเดือนที่คุณยินดีจ่าย', 'How much would you pay per month for Premium?');
const Q_CARE_PRICE = b('ราคา Care+ ต่อเดือน (โค้ชติดตามทางแชท + กลุ่มฝึกทักษะกับนักจิตวิทยาเดือนละครั้ง) ที่คุณยินดีจ่าย', 'How much would you pay per month for Care+ (weekly coach chat check-ins + one monthly group skills session with a psychologist)?');
const Q_ONE_PRICE = b('ถ้าต้องการคุยกับนักจิตวิทยาแบบตัวต่อตัว 30 นาที (จ่ายเป็นครั้ง) ราคาที่รับได้', 'If you wanted a one-to-one 30-minute psychologist session (pay per session), what price is acceptable?');
const Q_PAY_REASONS = b('อะไรจะทำให้คุณยอมจ่ายเงิน? (เลือกได้หลายข้อ)', 'What would make you pay? (choose any)');
const Q_NOPAY_REASONS = b('เหตุผลที่อาจไม่จ่ายเงิน (เลือกได้หลายข้อ)', 'Reasons you might not pay (choose any)');
const Q_NPS = b('คุณจะแนะนำ Hikari ให้เพื่อนใช้มากแค่ไหน?', 'How likely are you to recommend Hikari to a friend?');

const YES_CONSENT = b('ยินยอม', 'I consent');
const UNDER_18 = b('ต่ำกว่า 18 ปี', 'Under 18');
const USE_YES = [b('ใช้แน่นอน', 'Definitely'), b('น่าจะใช้', 'Probably')];
const PAY_YES = b('ยินดีจ่าย', 'Yes, I would pay');
const PAY_MAYBE = b('อาจจะจ่าย ถ้าราคาหรือฟีเจอร์เหมาะสม', 'Maybe, if the price or features are right');
const PAY_NO = b('ไม่จ่าย ใช้แค่แผน Free', 'No, I would only use the Free plan');
const ITEM_YES = b('ซื้อแน่นอน', 'Definitely');
const ITEM_MAYBE = b('อาจจะซื้อ ถ้าชอบชิ้นนั้นจริง ๆ', 'Maybe, if I really like the item');
const ITEM_NO = b('ไม่ซื้อ เล่นฟรีพอแล้ว', 'No, free play is enough');
const DAYS = [b('ยังไม่ได้เล่น', 'Did not play'), b('1 วัน', '1 day'), b('2 วัน', '2 days'),
  b('3–4 วัน', '3–4 days'), b('5–6 วัน', '5–6 days'), b('7 วันขึ้นไป', '7 days or more')];
const RETAINED = DAYS.slice(3);   // 3 วันขึ้นไป


// ===== 1. สร้างแบบสอบถาม =====
function createSurvey() {
  const form = FormApp.create(SURVEY_TITLE);
  form.setDescription(
    'ขอบคุณที่ช่วยทดลองใช้ Hikari (เว็บไซต์ดูแลความเครียด และเกมสวนแสง) ใช้เวลาประมาณ 7–8 นาที\n' +
    'Thank you for testing Hikari (stress-care website and the Light Garden game). About 7–8 minutes.\n\n' +
    'Hikari ไม่ใช่การวินิจฉัยหรือการรักษาทางการแพทย์ ถ้ารู้สึกไม่ไหว โทรสายด่วนสุขภาพจิต 1323 ได้ตลอด 24 ชั่วโมง\n' +
    'Hikari is not medical diagnosis or treatment. In Thailand, call the mental health hotline 1323 (24 hours).'
  );
  form.setProgressBar(true);
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage(
    'ขอบคุณมาก ๆ ที่ช่วยตอบแบบสอบถาม 💛 ความคิดเห็นของคุณช่วยตัดสินใจว่า Hikari ควรเป็นแอปหรือไม่\n' +
    'Thank you so much 💛 Your answers help decide whether Hikari should become an app.'
  );

  // ---------- หน้า 1: แจ้งความเป็นส่วนตัว + ยินยอม + อายุ ----------
  form.addSectionHeaderItem()
    .setTitle(b('การเก็บข้อมูลส่วนบุคคล', 'Personal data notice'))
    .setHelpText(
      '• ผู้เก็บข้อมูล: ' + ORG_NAME + ' ติดต่อ: ' + CONTACT + '\n' +
      '• เก็บอะไร: คำตอบในแบบสอบถามนี้ รวมถึงระดับความเครียดโดยประมาณ (ข้อมูลสุขภาพ) ไม่เก็บชื่อหรืออีเมล\n' +
      '• ใช้เพื่อ: ประเมินว่าควรพัฒนา Hikari เป็นแอปหรือไม่ และปรับปรุงบริการ รายงานเป็นภาพรวมเท่านั้น\n' +
      '• เก็บไว้: ไม่เกิน ' + KEEP_MONTHS + ' เดือน แล้วลบ  • ไม่ขายหรือส่งต่อให้บุคคลอื่น\n' +
      '• คุณเลือกไม่ตอบข้อใดก็ได้ หยุดได้ทุกเมื่อ และขอให้ลบคำตอบได้ทางช่องทางติดต่อด้านบน\n' +
      '• ช่วงนี้รับเฉพาะผู้ที่อายุ 18 ปีขึ้นไป (กลุ่มหลักคือวัยทำงาน 18–45 ปี)\n\n' +
      '• Collected by: ' + ORG_NAME + '. Contact: ' + CONTACT + '\n' +
      '• What: your answers, including an approximate stress level (health data). No name or email.\n' +
      '• Why: to decide whether to build the Hikari app and improve it. Reported only in aggregate.\n' +
      '• Kept for up to ' + KEEP_MONTHS + ' months, then deleted. Never sold or shared.\n' +
      '• You may skip questions, stop anytime, or ask us to delete your answers.\n' +
      '• This round is for people aged 18 or older (mainly working adults aged 18–45).'
    );

  const consent = form.addMultipleChoiceItem();
  consent.setTitle(Q_CONSENT)
    .setChoices([
      consent.createChoice(YES_CONSENT, FormApp.PageNavigationType.CONTINUE),
      consent.createChoice(b('ไม่ยินยอม (จบแบบสอบถาม)', 'I do not consent (end the survey)'), FormApp.PageNavigationType.SUBMIT)
    ])
    .setRequired(true);

  form.addPageBreakItem().setTitle(b('อายุ', 'Age'));
  const age = form.addMultipleChoiceItem();
  age.setTitle(Q_AGE)
    .setChoices([
      age.createChoice(UNDER_18, FormApp.PageNavigationType.SUBMIT),
      age.createChoice(b('18–24 ปี', '18–24'), FormApp.PageNavigationType.CONTINUE),
      age.createChoice(b('25–34 ปี', '25–34'), FormApp.PageNavigationType.CONTINUE),
      age.createChoice(b('35–45 ปี', '35–45'), FormApp.PageNavigationType.CONTINUE),
      age.createChoice(b('มากกว่า 45 ปี', 'Over 45'), FormApp.PageNavigationType.CONTINUE)
    ])
    .setHelpText('ถ้าอายุต่ำกว่า 18 ปี แบบสอบถามจะจบที่ข้อนี้ ขอบคุณที่สนใจนะ / If you are under 18, the survey ends here. Thank you!')
    .setRequired(true);

  // ---------- หน้า 2: เกี่ยวกับคุณ ----------
  form.addPageBreakItem().setTitle(b('ส่วนที่ 1: เกี่ยวกับคุณ', 'Part 1: About you'));

  form.addMultipleChoiceItem()
    .setTitle(Q_STATUS)
    .setChoiceValues([
      b('พนักงานบริษัทเอกชน', 'Private company employee'),
      b('ข้าราชการ / พนักงานรัฐวิสาหกิจ', 'Government / state enterprise'),
      b('ฟรีแลนซ์ / รับจ้างอิสระ', 'Freelancer'),
      b('เจ้าของกิจการ / ค้าขาย', 'Business owner / trader'),
      STUDENT,
      b('กำลังหางาน', 'Looking for work')
    ])
    .showOtherOption(true)
    .setRequired(true);

  // ถามต้นเหตุความเครียด เพื่อดูว่าคนทำงานกับนักศึกษาต่างกันอย่างไร
  form.addCheckboxItem()
    .setTitle(Q_STRESS_SRC)
    .setChoiceValues([
      b('งานล้น / เส้นตาย', 'Workload / deadlines'),
      b('หัวหน้า / เพื่อนร่วมงาน', 'Boss / coworkers'),
      b('การเรียน / สอบ', 'Study / exams'),
      b('เงิน / หนี้ / ค่าใช้จ่าย', 'Money / debt / expenses'),
      b('ความมั่นคงในงาน / อนาคต', 'Job security / the future'),
      b('ครอบครัว / ความรัก', 'Family / relationships'),
      b('สุขภาพ / นอนไม่พอ', 'Health / not enough sleep'),
      b('การเดินทาง / รถติด', 'Commute / traffic')
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addScaleItem()
    .setTitle(Q_STRESS)
    .setBounds(1, 5)
    .setLabels(b('แทบไม่เครียด', 'Rarely'), b('เครียดมาก', 'Very often'))
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle(b('ปกติคุณคลายเครียดด้วยอะไร (เลือกได้หลายข้อ)', 'How do you usually relieve stress? (choose any)'))
    .setChoiceValues([
      b('เล่นเกมมือถือ', 'Mobile games'), b('ดูคลิป / ฟังเพลง', 'Videos / music'),
      b('แอปสมาธิหรือสุขภาพจิต (เช่น Calm, Headspace, Ooca)', 'Meditation or mental health apps (e.g. Calm, Headspace, Ooca)'),
      b('คุยกับเพื่อนหรือครอบครัว', 'Talk to friends or family'), b('ออกกำลังกาย', 'Exercise'),
      b('คุยกับนักจิตวิทยา / สายด่วน', 'A psychologist / hotline'), b('ไม่ได้ทำอะไรเป็นพิเศษ', 'Nothing in particular')
    ])
    .showOtherOption(true)
    .setRequired(true);

  // ถามช่วงเวลาที่จะใช้ เพื่อออกแบบโหมดพักสั้นระหว่างวันทำงาน
  form.addCheckboxItem()
    .setTitle(Q_WHEN)
    .setChoiceValues([
      b('ตอนเช้าก่อนเริ่มงาน / เรียน', 'Morning before work / class'),
      b('พักเที่ยง', 'Lunch break'),
      b('ระหว่างวัน ก่อนประชุมหรือหลังงานหนัก', 'During the day, before a meeting or after a tough task'),
      b('ระหว่างเดินทาง', 'While commuting'),
      b('หลังเลิกงาน / เลิกเรียน', 'After work / class'),
      b('ก่อนนอน', 'Before bed')
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle(b('คุณเคยจ่ายเงินในเกมมือถือ หรือแอปดูแลสุขภาพใจไหม?', 'Have you ever paid in a mobile game or a mental wellbeing app?'))
    .setChoiceValues([
      b('ไม่เคย', 'Never'),
      b('เคยซื้อของในเกม', 'Bought in-game items'),
      b('เคยสมัครสมาชิกรายเดือน / รายปี', 'Paid a monthly / yearly subscription'),
      b('เคยทั้งสองแบบ', 'Both')
    ])
    .setRequired(true);

  // ---------- หน้า 3: ใช้อะไรไปบ้าง ----------
  form.addPageBreakItem().setTitle(b('ส่วนที่ 2: สิ่งที่คุณได้ลอง', 'Part 2: What you tried'));

  form.addMultipleChoiceItem()
    .setTitle(Q_TRIED)
    .setChoiceValues([b('เว็บไซต์อย่างเดียว', 'Website only'), b('เกมอย่างเดียว', 'Game only'), b('ทั้งเว็บไซต์และเกม', 'Both')])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle(Q_GAME_DAYS)
    .setChoiceValues(DAYS)
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle(b('ส่วนใหญ่เปิด Hikari จากที่ไหน', 'Where did you mostly open Hikari?'))
    .setChoiceValues([
      b('มือถือ เปิดจากลิงก์ใน LINE', 'Phone, from a link in LINE'),
      b('มือถือ เปิดใน Safari / Chrome', 'Phone, in Safari / Chrome'),
      b('คอมพิวเตอร์', 'Computer')
    ])
    .setRequired(true);

  form.addScaleItem()
    .setTitle(Q_RELIEF)
    .setBounds(1, 5)
    .setLabels(b('ไม่ต่างเลย', 'No difference'), b('ผ่อนคลายขึ้นมาก', 'Much more relaxed'))
    .setRequired(true);

  // ---------- หน้า 4: เว็บไซต์ ----------
  form.addPageBreakItem()
    .setTitle(b('ส่วนที่ 3: เว็บไซต์', 'Part 3: The website'))
    .setHelpText('ถ้าไม่ได้ลองเว็บไซต์ ข้ามหน้านี้ได้ / Skip this page if you did not try the website');

  form.addGridItem()
    .setTitle(b('ให้คะแนนเว็บไซต์ (1 = ไม่เห็นด้วยอย่างยิ่ง, 5 = เห็นด้วยอย่างยิ่ง)', 'Rate the website (1 = strongly disagree, 5 = strongly agree)'))
    .setRows([
      b('ใช้งานง่าย หาเมนูเจอ', 'Easy to use'),
      b('ข้อมูลน่าเชื่อถือ (มีงานวิจัยอ้างอิง)', 'Information is trustworthy'),
      b('ภารกิจ 60 วันและคลิปช่วยให้อยากกลับมาใช้', 'The 60-day journey and clips make me want to come back'),
      b('ฝึกหายใจช่วยให้ผ่อนคลาย', 'The breathing exercise helps me relax'),
      b('ใช้งานบนมือถือสะดวก', 'Works well on mobile')
    ])
    .setColumns(['1', '2', '3', '4', '5']);

  form.addScaleItem().setTitle(Q_WEB_SAT).setBounds(1, 5)
    .setLabels(b('ไม่พอใจเลย', 'Not satisfied'), b('พอใจมาก', 'Very satisfied'));

  // ---------- หน้า 5: เกม ----------
  form.addPageBreakItem()
    .setTitle(b('ส่วนที่ 4: เกมสวนแสง', 'Part 4: The Light Garden game'))
    .setHelpText('ถ้าไม่ได้เล่นเกม ข้ามหน้านี้ได้ / Skip this page if you did not play the game');

  form.addGridItem()
    .setTitle(b('ให้คะแนนเกม (1 = ไม่เห็นด้วยอย่างยิ่ง, 5 = เห็นด้วยอย่างยิ่ง)', 'Rate the game (1 = strongly disagree, 5 = strongly agree)'))
    .setRows([
      b('เล่นง่าย เข้าใจได้เองโดยไม่ต้องมีคนสอน', 'Easy to understand without help'),
      b('ภาพและตัวละครน่ารัก น่าเล่น', 'The art and characters are lovely'),
      b('หายใจกับตัวละครช่วยให้ผ่อนคลาย', 'Breathing with the character helps me relax'),
      b('เสียงประกอบช่วยให้ผ่อนคลาย', 'The ambient sounds help me relax'),
      b('จดหมายใจดีทำให้รู้สึกดี', 'Kind letters make me feel good'),
      b('อยากกลับมาเล่นทุกวัน', 'I want to come back every day')
    ])
    .setColumns(['1', '2', '3', '4', '5']);

  form.addMultipleChoiceItem()
    .setTitle(Q_WORLD)
    .setChoiceValues([b('สวนแมว (มิว)', 'Cat Garden (Mew)'), b('ลานน้องหมา (ปิ๊ป)', 'Dog Yard (Pip)'),
      b('เพื่อนตัวเล็ก (ปุยฝ้าย)', 'Small Friends (Puff)'), b('ทริปแสง (ฮิคาริ)', 'Light Trip (Hikari)')]);

  form.addCheckboxItem()
    .setTitle(Q_GAME_PARTS)
    .setChoiceValues([
      b('ทักทาย / เล่นกับตัวละคร', 'Petting / playing with the character'),
      b('เพื่อนที่แวะมาเยี่ยม และอัลบั้ม', 'Visiting friends and the album'),
      b('เช็กอินอารมณ์', 'Mood check-in'),
      b('หายใจ 1 นาที', '1-minute breathing'),
      b('จดหมายใจดี', 'Kind letters'),
      b('แต่งตัวและแต่งบ้าน', 'Dressing up and decorating'),
      b('สะสมแสตมป์ทริปแสง', 'Collecting Light Trip stamps'),
      b('สะสมแสงและวันต่อเนื่อง', 'Collecting light and streaks')
    ]);

  form.addScaleItem().setTitle(Q_GAME_SAT).setBounds(1, 5)
    .setLabels(b('ไม่พอใจเลย', 'Not satisfied'), b('พอใจมาก', 'Very satisfied'));

  // ---------- หน้า 6: ของในเกม ----------
  form.addPageBreakItem()
    .setTitle(b('ส่วนที่ 5: ของแต่งในเกม', 'Part 5: In-game items'))
    .setHelpText('ช่วงทดสอบยังไม่เปิดขายจริง ของแต่งเป็นของตกแต่งเท่านั้น ไม่มีกาชา และไม่ทำให้เล่นได้เปรียบ\n' +
                 'Items are not on sale during the test. They are cosmetic only, with no gacha and no gameplay advantage.');

  form.addMultipleChoiceItem()
    .setTitle(Q_ITEM_BUY)
    .setChoiceValues([ITEM_YES, ITEM_MAYBE, ITEM_NO])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle(Q_ITEM_PRICE)
    .setChoiceValues([b('ไม่ซื้อ', 'Would not buy'), '฿19', '฿29–39', '฿49–59', '฿79–99', b('฿100 ขึ้นไป', '฿100 or more')])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle(Q_ITEM_TYPES)
    .setChoiceValues([
      b('ชุดและหมวกให้ตัวละคร', 'Outfits and hats for my character'),
      b('ของแต่งบ้าน / สวน', 'Home and garden decor'),
      b('ของเดินทาง (ทริปแสง)', 'Travel items (Light Trip)'),
      b('แพ็กรวมหลายชิ้นราคาคุ้ม', 'Value packs'),
      b('ของขวัญส่งให้เพื่อน', 'Gifts for friends'),
      b('ของตามเทศกาล (ลอยกระทง สงกรานต์ ปีใหม่)', 'Festival items (Loy Krathong, Songkran, New Year)'),
      b('เสียงประกอบเพิ่ม', 'More ambient sounds'),
      b('ไม่สนใจซื้อ', 'Not interested')
    ]);

  form.addMultipleChoiceItem()
    .setTitle(Q_ITEM_MONTH)
    .setChoiceValues([b('฿0', '฿0'), b('ไม่เกิน ฿50', 'Up to ฿50'), '฿50–99', '฿100–199', b('฿200 ขึ้นไป', '฿200 or more')])
    .setRequired(true);

  // ---------- หน้า 7: แอปและแผนรายเดือน ----------
  form.addPageBreakItem()
    .setTitle(b('ส่วนที่ 6: แอปและแผนสมาชิก', 'Part 6: App and plans'))
    .setHelpText(
      'แผนที่วางไว้ (ยังไม่เปิดให้บริการจริง):\n' +
      '• Free ฿0: เว็บ เกม แบบประเมินความเครียดและภาวะหมดไฟ พักสั้น 1–3 นาที วิธีรับมือที่ต้นเหตุ ภารกิจ 60 วัน จดหมายใจดี 3 ฉบับ/วัน สายด่วนฟรีเสมอ\n' +
      '• Premium ฿99/เดือน: ทุกอย่างใน Free + โปรแกรม 4 สัปดาห์ (ฟื้นจากภาวะหมดไฟ นอนดี ขอบเขตกับงาน) รายงานความเปลี่ยนแปลง เสียงภาษาไทย ส่วนลดของในเกม 10%\n' +
      '• Care+ (ราคากำลังทดสอบ): ทุกอย่างใน Premium + โค้ชที่ผ่านการฝึกติดตามทางแชทสัปดาห์ละครั้ง + กลุ่มฝึกทักษะออนไลน์กับนักจิตวิทยาเดือนละ 1 ครั้ง\n' +
      '• คุยกับนักจิตวิทยาตัวต่อตัว: จ่ายเป็นครั้งเมื่อต้องการ สมาชิกได้ส่วนลด\n\n' +
      'Planned plans (not available yet):\n' +
      '• Free ฿0: website, game, stress and burnout checks, 1–3 minute quick resets, root-cause skills, 60-day journey, 3 kind letters/day, hotlines always free\n' +
      '• Premium ฿99/month: Free + 4-week programs (burnout recovery, better sleep, work boundaries), progress reports, Thai audio, 10% off items\n' +
      '• Care+ (price being tested): Premium + weekly chat check-ins with a trained coach + one monthly online group skills session with a psychologist\n' +
      '• One-to-one psychologist: pay per session when needed, members get a discount'
    );

  form.addMultipleChoiceItem().setTitle(Q_WEB)
    .setChoiceValues([b('ใช้แน่นอน', 'Definitely'), b('น่าจะใช้', 'Probably'), b('ไม่แน่ใจ', 'Not sure'), b('น่าจะไม่ใช้', 'Probably not'), b('ไม่ใช้', 'No')])
    .setRequired(true);

  form.addMultipleChoiceItem().setTitle(Q_APP)
    .setChoiceValues([b('ใช้แน่นอน', 'Definitely'), b('น่าจะใช้', 'Probably'), b('ไม่แน่ใจ', 'Not sure'), b('น่าจะไม่ใช้', 'Probably not'), b('ไม่ใช้', 'No')])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle(Q_FEATURES)
    .setChoiceValues([
      b('แจ้งเตือนให้หายใจ / เช็กอินอารมณ์', 'Reminders to breathe / check in'),
      b('เสียงนำสมาธิและนิทานก่อนนอนภาษาไทย', 'Thai guided meditation and bedtime stories'),
      b('จดหมายใจดีถึงเพื่อนจริง', 'Kind letters to real friends'),
      b('โลกใหม่และตัวละครใหม่ในเกม', 'New worlds and characters'),
      b('เกมคลายเครียดแบบอื่น (เช่น ลอยความกังวล)', 'Other calming games (e.g. float away worries)'),
      b('โปรแกรม 14 วัน (นอนดี รับมือสอบ เครียดเรื่องเงิน)', '14-day programs (sleep, exams, money stress)'),
      b('คุยกับนักจิตวิทยาตัวจริง', 'Talk to a real psychologist'),
      b('แชทระบายกับ AI', 'Chat with an AI to vent'),
      b('รายงานสรุปรายเดือน', 'Monthly summary report'),
      b('ใช้แบบออฟไลน์ได้', 'Works offline')
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addMultipleChoiceItem().setTitle(Q_PAY)
    .setChoiceValues([PAY_YES, PAY_MAYBE, PAY_NO])
    .setRequired(true);

  form.addMultipleChoiceItem().setTitle(Q_PLAN)
    .setChoiceValues(['Free', 'Premium', 'Care+'])
    .setRequired(true);

  form.addMultipleChoiceItem().setTitle(Q_PRICE)
    .setChoiceValues([b('ไม่จ่าย', 'Would not pay'), b('ไม่เกิน ฿49', 'Up to ฿49'), '฿50–99', '฿100–149', '฿150–249', b('฿250 ขึ้นไป', '฿250 or more')])
    .setRequired(true);

  form.addMultipleChoiceItem().setTitle(Q_CARE_PRICE)
    .setChoiceValues([b('ไม่ใช้บริการนี้', 'Would not use'), b('ไม่เกิน ฿199', 'Up to ฿199'), '฿200–299', '฿300–399', '฿400–499', b('฿500 ขึ้นไป', '฿500 or more')])
    .setRequired(true);

  form.addMultipleChoiceItem().setTitle(Q_ONE_PRICE)
    .setChoiceValues([b('ไม่ใช้บริการนี้', 'Would not use'), b('ไม่เกิน ฿400', 'Up to ฿400'), '฿401–600', '฿601–800', b('มากกว่า ฿800', 'More than ฿800')])
    .setRequired(true);

  form.addMultipleChoiceItem().setTitle(Q_EMPLOYER)
    .setChoiceValues([b('ใช้แน่นอน', 'Definitely'), b('น่าจะใช้', 'Probably'), b('ไม่แน่ใจ', 'Not sure'),
      b('ไม่ใช้ กังวลว่าที่ทำงานจะเห็นข้อมูล', 'No, I worry they would see my data'), b('ไม่ใช้', 'No')])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle(b('ช่องทางจ่ายเงินที่สะดวก (เลือกได้หลายข้อ)', 'Convenient payment methods (choose any)'))
    .setChoiceValues([b('พร้อมเพย์ / สแกน QR', 'PromptPay / QR'), b('บัตรเครดิต / เดบิต', 'Credit / debit card'),
      'TrueMoney Wallet', 'App Store / Google Play'])
    .showOtherOption(true)
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle(Q_PAY_REASONS)
    .setChoiceValues([
      b('รู้สึกว่าความเครียดลดลงจริง', 'I feel less stressed'),
      b('ตัวละครและของแต่งน่ารัก', 'Lovely characters and items'),
      b('เนื้อหาและเสียงเป็นภาษาไทย', 'Thai content and audio'),
      b('มีราคานักศึกษา', 'Student pricing'),
      b('บริษัทออกค่าใช้จ่ายให้ (สวัสดิการ)', 'My employer pays (benefit)'),
      b('ใช้สั้น ๆ 1–3 นาทีระหว่างวันทำงานได้', 'Quick 1–3 minute use during the workday'),
      b('ที่ทำงานหรือหัวหน้าไม่เห็นข้อมูลของฉัน', 'My employer cannot see my data'),
      b('ทดลองใช้ฟรีก่อน', 'A free trial first'),
      b('ได้คุยกับผู้เชี่ยวชาญตัวจริง', 'Talking to real professionals'),
      b('ข้อมูลปลอดภัย เป็นความลับ', 'Private, secure data'),
      b('ไม่มีโฆษณา', 'No ads')
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle(Q_NOPAY_REASONS)
    .setChoiceValues([
      b('ใช้ฟรีก็พอแล้ว', 'Free is enough'), b('ราคาแพงเกินไป', 'Too expensive'),
      b('ยังไม่มั่นใจว่าได้ผล', 'Not sure it works'), b('กังวลเรื่องความเป็นส่วนตัว', 'Privacy concerns'),
      b('ใช้แอปอื่นอยู่แล้ว', 'Already use another app'), b('ไม่ค่อยเครียด', 'Not very stressed')
    ])
    .showOtherOption(true);

  // ---------- หน้า 8: ปิดท้าย ----------
  form.addPageBreakItem().setTitle(b('ส่วนที่ 7: ปิดท้าย', 'Part 7: Last questions'));

  form.addScaleItem()
    .setTitle(Q_NPS)
    .setBounds(0, 10)
    .setLabels(b('ไม่แนะนำเลย', 'Not at all'), b('แนะนำแน่นอน', 'Definitely'))
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle(b('มีปัญหา จุดที่งง หรือสิ่งที่อยากให้ปรับไหม? (ไม่บังคับ)', 'Any problems, confusing parts or suggestions? (optional)'));

  // รหัสสรุปจากเกม (ปุ่ม "คัดลอกสรุปการทดสอบ" ในแท็บ "ฉัน") ไม่มีอารมณ์หรือคะแนนใด ๆ
  // รูปแบบ: HK2|w=โลก|ad=วันที่เล่น|d=7 วันล่าสุด|ses=ครั้งที่เปิด|br=หายใจครบ/เริ่ม|let=จดหมาย|ref=มาจากจดหมาย|iab=แอปที่เปิด|int=ของที่สนใจ|snd=เสียง
  form.addTextItem()
    .setTitle(b('วางรหัสสรุปจากเกม (ไม่บังคับ)', 'Paste your game summary code (optional)'))
    .setHelpText(b('ในเกม แท็บ "ฉัน" → "คัดลอกสรุปการทดสอบ" รหัสนี้ไม่มีอารมณ์หรือข้อมูลส่วนตัว', 'In the game, Me tab → "Copy test summary". It contains no moods or personal data'));

  const beta = form.addMultipleChoiceItem();
  const contactPage = form.addPageBreakItem()
    .setTitle(b('ช่องทางติดต่อผู้ทดสอบ', 'Beta tester contact'))
    .setHelpText('ใช้ติดต่อเรื่องทดสอบแอปเท่านั้น เก็บแยกจากคำตอบอื่นเมื่อสรุปผล และลบเมื่อจบการทดสอบ\n' +
                 'Used only to contact you about beta testing. Kept separate from other answers when reporting and deleted after testing.');
  beta.setTitle(b('สนใจเป็นผู้ทดสอบแอปเวอร์ชันแรก (beta) และยินยอมให้ติดต่อกลับไหม?', 'Would you like to beta test the app and agree to be contacted?'))
    .setChoices([
      beta.createChoice(b('สนใจ และยินยอมให้ติดต่อ', 'Yes, and you may contact me'), contactPage),
      beta.createChoice(b('ไม่สนใจ', 'No'), FormApp.PageNavigationType.SUBMIT)
    ])
    .setRequired(true);

  form.addTextItem()
    .setTitle(b('LINE ID หรือ Discord', 'LINE ID or Discord'));

  // ---------- เก็บคำตอบลง Google Sheet ----------
  const sheet = SpreadsheetApp.create(SURVEY_TITLE + ' (คำตอบ / Responses)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());
  form.setAcceptingResponses(true);
  if (typeof form.setPublished === 'function') {
    try { form.setPublished(true); } catch (e) { /* บางบัญชีไม่มีคำสั่งนี้ */ }
  }

  const props = PropertiesService.getScriptProperties();
  props.setProperty('FORM_ID', form.getId());
  props.setProperty('SHEET_ID', sheet.getId());

  let shortUrl = form.getPublishedUrl();
  try { shortUrl = form.shortenFormUrl(form.getPublishedUrl()); } catch (e) { /* ใช้ลิงก์ยาว */ }

  if (CONTACT.indexOf('[') === 0) {
    Logger.log('⚠️ ยังไม่ได้แก้ CONTACT: แก้ข้อความในฟอร์มหน้าแรกให้เป็นอีเมลหรือ LINE OA จริง ก่อนส่งลิงก์ให้คนอื่น');
  }
  Logger.log('✅ สร้างแบบสอบถามฉบับที่ 2 เรียบร้อย');
  Logger.log('🔗 ลิงก์แบบสอบถาม (ใส่ใน SURVEY_URL ของ config.js): ' + shortUrl);
  Logger.log('✏️ ลิงก์แก้ไขฟอร์ม: ' + form.getEditUrl());
  Logger.log('📊 Google Sheet เก็บคำตอบ: ' + sheet.getUrl());
}


// ===== 2. วิเคราะห์ผล =====
function analyzeResults() {
  const props = PropertiesService.getScriptProperties();
  const formId = props.getProperty('FORM_ID');
  if (!formId) {
    Logger.log('ยังไม่พบฟอร์ม กรุณารัน createSurvey ก่อน');
    return;
  }
  const all = FormApp.openById(formId).getResponses().map(function (r) {
    const row = {};
    r.getItemResponses().forEach(function (ir) { row[ir.getItem().getTitle()] = ir.getResponse(); });
    return row;
  });
  // นับเฉพาะคนที่ยินยอม และอายุ 18 ปีขึ้นไป
  const people = all.filter(function (p) { return p[Q_CONSENT] === YES_CONSENT && p[Q_AGE] && p[Q_AGE] !== UNDER_18; });
  Logger.log('ตอบทั้งหมด ' + all.length + ' คน · นับได้ (ยินยอม + อายุ 18 ขึ้นไป) ' + people.length + ' คน');
  if (people.length === 0) { return; }

  function pct(x, n) { return n ? Math.round(x / n * 1000) / 10 + '%' : '-'; }
  function count(group, fn) { return group.filter(fn).length; }
  function nps(group) {
    const xs = group.map(function (p) { return Number(p[Q_NPS]); }).filter(function (x) { return !isNaN(x); });
    if (!xs.length) { return null; }
    return Math.round((xs.filter(function (x) { return x >= 9; }).length - xs.filter(function (x) { return x <= 6; }).length) / xs.length * 100);
  }
  function avg(title, group) {
    const xs = group.map(function (p) { return Number(p[title]); }).filter(function (x) { return !isNaN(x) && x > 0; });
    return xs.length ? Math.round(xs.reduce(function (a, c) { return a + c; }, 0) / xs.length * 100) / 100 : '-';
  }
  function measure(g) {
    const n = g.length;
    const players = g.filter(function (p) { return p[Q_GAME_DAYS] && p[Q_GAME_DAYS] !== DAYS[0]; });
    const m = {
      n: n,
      interested: count(g, function (p) { return USE_YES.indexOf(p[Q_APP]) !== -1 || USE_YES.indexOf(p[Q_WEB]) !== -1; }),
      payYes: count(g, function (p) { return p[Q_PAY] === PAY_YES; }),
      payMaybe: count(g, function (p) { return p[Q_PAY] === PAY_MAYBE; }),
      players: players.length,
      retained: count(players, function (p) { return RETAINED.indexOf(p[Q_GAME_DAYS]) !== -1; }),
      itemYes: count(g, function (p) { return p[Q_ITEM_BUY] === ITEM_YES; }),
      itemMaybe: count(g, function (p) { return p[Q_ITEM_BUY] === ITEM_MAYBE; }),
      nps: nps(g)
    };
    m.pass = {
      use: n > 0 && m.interested / n > USE_THRESHOLD,
      pay: n > 0 && m.payYes / n > PAY_THRESHOLD,
      retain: m.players > 0 && m.retained / m.players >= RETAIN_THRESHOLD,
      item: n > 0 && m.itemYes / n > ITEM_THRESHOLD,
      nps: m.nps !== null && m.nps > NPS_THRESHOLD
    };
    m.passed = Object.keys(m.pass).filter(function (k) { return m.pass[k]; }).length;
    return m;
  }
  function decision(m) {
    if (m.n === 0) { return 'ยังไม่มีผู้ตอบในกลุ่มนี้'; }
    if (m.passed === 5) { return '✅ ผ่านครบ 5 เกณฑ์ → ลงทุนทำแอปได้ (เริ่มจาก MVP แอป + ร้านค้าในแอป)'; }
    if (m.pass.use && m.pass.retain && (m.pass.pay || m.pass.item)) {
      return '✅ มีคนอยากใช้ กลับมาเล่น และมีทางหารายได้ → ทำแอปเวอร์ชันเล็กก่อน แล้ววัดผลจริงอีกรอบ';
    }
    if (m.pass.use && !m.pass.retain) { return '⚠️ คนสนใจ แต่ไม่ค่อยกลับมาเล่น → ปรับเกมให้อยากกลับมา (แจ้งเตือน เนื้อหาใหม่) แล้วทดสอบอีกรอบ'; }
    if (m.pass.use) { return '⚠️ คนสนใจใช้ แต่ยังไม่ยอมจ่าย → ปรับราคา/ของในร้าน หรือหารายได้แบบ B2B (มหาวิทยาลัย บริษัท)'; }
    return '⏸️ ยังไม่ควรลงทุนทำแอป → ปรับตามข้อเสนอแนะ แล้วทดสอบอีกรอบ';
  }
  function ranking(title, group) {
    const c = {};
    group.forEach(function (p) {
      const a = p[title];
      (Array.isArray(a) ? a : [a]).forEach(function (x) { if (x) { c[x] = (c[x] || 0) + 1; } });
    });
    return Object.keys(c).sort(function (x, y) { return c[y] - c[x]; }).map(function (k) { return [k, c[k], pct(c[k], group.length)]; });
  }

  const stressedGroup = people.filter(function (p) { return Number(p[Q_STRESS]) >= STRESSED_MIN; });
  const A = measure(people), S = measure(stressedGroup);
  // แยกกลุ่มหลัก (วัยทำงาน = ทุกคนที่ไม่ใช่นักศึกษา) กับกลุ่มรอง (นักศึกษา)
  const workGroup = people.filter(function (p) { return p[Q_STATUS] && p[Q_STATUS] !== STUDENT; });
  const studentGroup = people.filter(function (p) { return p[Q_STATUS] === STUDENT; });
  const W = measure(workGroup), U = measure(studentGroup);

  [['ผู้ตอบทั้งหมด', A], ['คนที่เครียดจริง (ระดับ 4–5)', S], ['วัยทำงาน (กลุ่มหลัก)', W], ['นักศึกษา (กลุ่มรอง)', U]].forEach(function (g) {
    const m = g[1];
    Logger.log('===== ' + g[0] + ': ' + m.n + ' คน =====');
    Logger.log('1) สนใจใช้: ' + pct(m.interested, m.n) + (m.pass.use ? ' ✅' : ' ❌') + ' (เกณฑ์ > 30%)');
    Logger.log('2) ยินดีจ่ายแผนรายเดือน: ' + pct(m.payYes, m.n) + (m.pass.pay ? ' ✅' : ' ❌') + ' · อาจจะ ' + pct(m.payMaybe, m.n));
    Logger.log('3) เล่นเกม 3 วันขึ้นไป: ' + pct(m.retained, m.players) + ' ของคนที่เล่น ' + m.players + ' คน' + (m.pass.retain ? ' ✅' : ' ❌') + ' (เกณฑ์ ≥ 40%)');
    Logger.log('4) ซื้อของในเกมแน่นอน: ' + pct(m.itemYes, m.n) + (m.pass.item ? ' ✅' : ' ❌') + ' · อาจจะ ' + pct(m.itemMaybe, m.n));
    Logger.log('5) NPS: ' + (m.nps === null ? '-' : m.nps) + (m.pass.nps ? ' ✅' : ' ❌') + ' (เกณฑ์ > 0)');
    Logger.log('ผล: ' + decision(m));
  });
  if (A.n < 30) { Logger.log('หมายเหตุ: ผู้ตอบยังน้อยกว่า 30 คน ผลอาจคลาดเคลื่อนมาก ควรเก็บเพิ่ม'); }

  const ss = SpreadsheetApp.openById(props.getProperty('SHEET_ID'));
  let sh = ss.getSheetByName('สรุปผล');
  if (!sh) { sh = ss.insertSheet('สรุปผล'); }
  sh.clear();
  const rows = [];
  const yn = function (x) { return x ? '✅ ผ่าน' : '❌ ไม่ผ่าน'; };
  rows.push(['สรุปผลแบบสอบถาม Hikari ฉบับที่ 2', '', '', '']);
  rows.push(['อัปเดตเมื่อ', new Date(), 'ตอบทั้งหมด ' + all.length + ' · นับได้ ' + people.length, '']);
  rows.push(['', '', '', '']);
  rows.push(['ตัวชี้วัด', 'ผู้ตอบทั้งหมด', 'คนที่เครียดจริง (4–5)', 'เกณฑ์']);
  rows.push(['จำนวนผู้ตอบ', A.n, S.n, '']);
  rows.push(['1) สนใจใช้แอปหรือเว็บ', pct(A.interested, A.n) + ' ' + yn(A.pass.use), pct(S.interested, S.n) + ' ' + yn(S.pass.use), '> 30%']);
  rows.push(['2) ยินดีจ่ายแผนรายเดือน', pct(A.payYes, A.n) + ' ' + yn(A.pass.pay), pct(S.payYes, S.n) + ' ' + yn(S.pass.pay), '> 10%']);
  rows.push(['   อาจจะจ่าย', pct(A.payMaybe, A.n), pct(S.payMaybe, S.n), '']);
  rows.push(['3) เล่นเกม 3 วันขึ้นไป (ในคนที่เล่น)', pct(A.retained, A.players) + ' ' + yn(A.pass.retain), pct(S.retained, S.players) + ' ' + yn(S.pass.retain), '≥ 40%']);
  rows.push(['4) ซื้อของในเกมแน่นอน', pct(A.itemYes, A.n) + ' ' + yn(A.pass.item), pct(S.itemYes, S.n) + ' ' + yn(S.pass.item), '> 10%']);
  rows.push(['   อาจจะซื้อ', pct(A.itemMaybe, A.n), pct(S.itemMaybe, S.n), '']);
  rows.push(['5) NPS (−100 ถึง 100)', (A.nps === null ? '-' : A.nps) + ' ' + yn(A.pass.nps), (S.nps === null ? '-' : S.nps) + ' ' + yn(S.pass.nps), '> 0']);
  rows.push(['ผ่านกี่เกณฑ์', A.passed + ' / 5', S.passed + ' / 5', '']);
  rows.push(['ผลการตัดสินใจ', decision(A), decision(S), '']);
  rows.push(['', '', '', '']);
  rows.push(['แยกตามกลุ่ม', 'วัยทำงาน (กลุ่มหลัก)', 'นักศึกษา (กลุ่มรอง)', 'เกณฑ์']);
  rows.push(['จำนวนผู้ตอบ', W.n, U.n, '']);
  rows.push(['1) สนใจใช้แอปหรือเว็บ', pct(W.interested, W.n) + ' ' + yn(W.pass.use), pct(U.interested, U.n) + ' ' + yn(U.pass.use), '> 30%']);
  rows.push(['2) ยินดีจ่ายแผนรายเดือน', pct(W.payYes, W.n) + ' ' + yn(W.pass.pay), pct(U.payYes, U.n) + ' ' + yn(U.pass.pay), '> 10%']);
  rows.push(['3) เล่นเกม 3 วันขึ้นไป (ในคนที่เล่น)', pct(W.retained, W.players) + ' ' + yn(W.pass.retain), pct(U.retained, U.players) + ' ' + yn(U.pass.retain), '≥ 40%']);
  rows.push(['4) ซื้อของในเกมแน่นอน', pct(W.itemYes, W.n) + ' ' + yn(W.pass.item), pct(U.itemYes, U.n) + ' ' + yn(U.pass.item), '> 10%']);
  rows.push(['5) NPS (−100 ถึง 100)', (W.nps === null ? '-' : W.nps) + ' ' + yn(W.pass.nps), (U.nps === null ? '-' : U.nps) + ' ' + yn(U.pass.nps), '> 0']);
  rows.push(['ผลการตัดสินใจ', decision(W), decision(U), '']);
  rows.push(['', '', '', '']);
  rows.push(['ความพึงพอใจเว็บ (เต็ม 5)', avg(Q_WEB_SAT, people), avg(Q_WEB_SAT, stressedGroup), '']);
  rows.push(['ความพึงพอใจเกม (เต็ม 5)', avg(Q_GAME_SAT, people), avg(Q_GAME_SAT, stressedGroup), '']);
  rows.push(['ผ่อนคลายขึ้นหลังใช้ (เต็ม 5)', avg(Q_RELIEF, people), avg(Q_RELIEF, stressedGroup), '']);
  rows.push(['', '', '', '']);
  [[Q_AGE, 'ช่วงอายุ'], [Q_STATUS, 'สถานะ'], [Q_STRESS_SRC, 'ต้นเหตุความเครียด'], [Q_WHEN, 'ช่วงเวลาที่จะใช้'], [Q_EMPLOYER, 'ถ้าที่ทำงานจ่ายให้'],
   [Q_TRIED, 'ลองส่วนไหน'], [Q_GAME_DAYS, 'จำนวนวันที่เล่นเกม'], [Q_WORLD, 'โลกที่ชอบ'], [Q_GAME_PARTS, 'ส่วนของเกมที่ชอบ'],
   [Q_ITEM_PRICE, 'ราคาของในเกมที่คุ้ม'], [Q_ITEM_TYPES, 'ของที่อยากซื้อ'], [Q_ITEM_MONTH, 'งบของในเกมต่อเดือน'],
   [Q_PLAN, 'แผนที่สนใจ'], [Q_PRICE, 'ราคา Premium/เดือน'], [Q_CARE_PRICE, 'ราคา Care+/เดือน'], [Q_ONE_PRICE, 'ราคานักจิตวิทยา 1:1/ครั้ง'],
   [Q_FEATURES, 'ฟีเจอร์ที่อยากได้'], [Q_PAY_REASONS, 'สิ่งที่ทำให้ยอมจ่าย'], [Q_NOPAY_REASONS, 'เหตุผลที่ไม่จ่าย']].forEach(function (q) {
    rows.push([q[1] + ' · ผู้ตอบทั้งหมด', 'จำนวน', '%', '']);
    ranking(q[0], people).forEach(function (r) { rows.push([r[0], r[1], r[2], '']); });
    rows.push([q[1] + ' · คนที่เครียดจริง', 'จำนวน', '%', '']);
    ranking(q[0], stressedGroup).forEach(function (r) { rows.push([r[0], r[1], r[2], '']); });
    rows.push(['', '', '', '']);
  });
  sh.getRange(1, 1, rows.length, 4).setValues(rows);
  sh.getRange('A1').setFontWeight('bold').setFontSize(14);
  sh.getRange('A4:D4').setFontWeight('bold').setBackground('#fff0c8');
  sh.getRange('A14:C14').setFontWeight('bold');
  sh.autoResizeColumns(1, 4);
  Logger.log('📊 เขียนสรุปลงแท็บ "สรุปผล" แล้ว: ' + ss.getUrl());
}
