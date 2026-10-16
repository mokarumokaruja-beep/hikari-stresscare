/**
 * Hikari StressCare: สคริปต์สร้างแบบสอบถาม Google Form อัตโนมัติ (2 ภาษา ไทย / English)
 * ------------------------------------------------------------------
 * วิธีใช้ (ทำครั้งเดียว):
 *   1. เปิด https://script.google.com → กด "New project" (โปรเจกต์ใหม่)
 *   2. ลบโค้ดเดิมทั้งหมด แล้ววางโค้ดในไฟล์นี้ทั้งหมด → กด Save (ไอคอนแผ่นดิสก์)
 *   3. ด้านบน เลือกฟังก์ชัน createSurvey แล้วกด Run (▶)
 *      - ครั้งแรก Google จะขอสิทธิ์ → Review permissions → เลือกบัญชีของคุณ
 *        → ถ้าขึ้น "Google hasn't verified this app" กด Advanced → Go to ... (unsafe)
 *        → Allow (สคริปต์นี้เป็นของคุณเอง สร้างฟอร์มและชีตในบัญชีคุณเท่านั้น)
 *   4. ดูผลที่ "Execution log" ด้านล่าง จะมีลิงก์:
 *        - ลิงก์สำหรับให้เพื่อนทำแบบสอบถาม (เอาไปทำ QR Code)
 *        - ลิงก์แก้ไขฟอร์ม และลิงก์ Google Sheet ที่เก็บคำตอบ
 *
 * เกณฑ์ตัดสินใจ 2 ข้อ:
 *   1) คนที่สนใจใช้ (แอปหรือเว็บไซต์ ตอบ "ใช้แน่นอน" หรือ "น่าจะใช้") มากกว่า 30% → พัฒนาแอปได้
 *   2) คนที่ "ยินดีจ่าย" มากกว่า 10% → มีโอกาสสร้างรายได้จากแอป
 *   และแยกดูกลุ่มเป้าหมาย "คนที่เครียดจริง" (ตอบระดับความเครียด 4–5 จาก 5)
 *
 * ดูผลว่าผ่านเกณฑ์หรือยัง:
 *   เลือกฟังก์ชัน analyzeResults แล้วกด Run → ดูผลใน Execution log
 *   และในชีตแท็บ "สรุปผล" (สร้างให้อัตโนมัติ)
 *
 * ทุกคำถามและตัวเลือกเขียนเป็น "ไทย / English" ในข้อเดียวกัน
 * คำตอบจึงรวมอยู่ชุดเดียว วิเคราะห์ได้ทันทีไม่ต้องแยกภาษา
 */

// ===== ตั้งค่า =====
const SURVEY_TITLE = 'แบบประเมินเว็บไซต์ Hikari StressCare / Hikari StressCare Website Survey';
const USE_THRESHOLD = 0.30;   // เกณฑ์ 1: คนสนใจใช้แอปหรือเว็บไซต์ มากกว่า 30% → พัฒนาแอปได้
const PAY_THRESHOLD = 0.10;   // เกณฑ์ 2: คน "ยินดีจ่าย" มากกว่า 10% → มีโอกาสสร้างรายได้
const STRESSED_MIN = 4;       // กลุ่มเป้าหมาย: ระดับความเครียด 4–5 จาก 5

// รวมข้อความ 2 ภาษา: "ไทย / English"
function b(th, en) {
  return th + ' / ' + en;
}

// ชื่อคำถามที่ใช้ในการวิเคราะห์ (ต้องตรงกับในฟอร์ม)
const Q_PAY = b('ถ้ามีแอป Hikari ตามแผนข้างต้น คุณยินดีจ่ายเงินสมัครแผนเสียเงิน (Premium หรือ Care+) ไหม?',
                'If Hikari became an app with these plans, would you pay for a paid plan (Premium or Care+)?');
const Q_PLAN = b('คุณสนใจแผนไหนมากที่สุด?', 'Which plan interests you most?');
const Q_PRICE = b('ราคา Premium ต่อเดือนที่คุณยินดีจ่าย', 'How much would you pay per month for Premium?');
const Q_APP = b('ถ้า Hikari พัฒนาเป็นแอปมือถือ คุณจะใช้ไหม?', 'If Hikari became a mobile app, would you use it?');
const Q_FEATURES = b('ฟีเจอร์ที่อยากให้มีในเว็บหรือแอป (เลือกได้หลายข้อ)', 'Features you want in the website or app (choose any)');
const Q_PAY_REASONS = b('อะไรจะทำให้คุณยอมจ่ายเงิน? (เลือกได้หลายข้อ)', 'What would make you pay? (choose any)');
const Q_NOPAY_REASONS = b('เหตุผลที่อาจไม่จ่ายเงิน (เลือกได้หลายข้อ)', 'Reasons you might not pay (choose any)');
const Q_SATISFY = b('ความพึงพอใจต่อเว็บไซต์โดยรวม', 'Overall satisfaction with the website');
const Q_STRESS = b('ช่วงนี้คุณรู้สึกเครียดบ่อยแค่ไหน?', 'How often do you feel stressed lately?');
const Q_WEB = b('หลังจากลองแล้ว คุณจะกลับมาใช้เว็บไซต์ Hikari อีกไหม?', 'After trying it, would you keep using the Hikari website?');
const USE_YES = [b('ใช้แน่นอน', 'Definitely'), b('น่าจะใช้', 'Probably')];   // นับเป็น "สนใจใช้"
const Q_NPS = b('คุณจะแนะนำ Hikari ให้เพื่อนใช้มากแค่ไหน?', 'How likely are you to recommend Hikari to a friend?');

const PAY_YES = b('ยินดีจ่าย', 'Yes, I would pay');
const PAY_MAYBE = b('อาจจะจ่าย ถ้าราคาหรือฟีเจอร์เหมาะสม', 'Maybe, if the price or features are right');
const PAY_NO = b('ไม่จ่าย ใช้แค่แผน Free', 'No, I would only use the Free plan');


// ===== 1. สร้างแบบสอบถาม =====
function createSurvey() {
  const form = FormApp.create(SURVEY_TITLE);
  form.setDescription(
    'ขอบคุณที่ลองใช้เว็บไซต์ Hikari StressCare (โปรเจกต์ Rush · 42 Bangkok)\n' +
    'แบบสอบถามนี้ใช้เวลาประมาณ 5–7 นาที คำตอบของคุณจะใช้ตัดสินใจว่าควรพัฒนาต่อเป็นแอปหรือไม่ และผู้ใช้ต้องการอะไรมากที่สุด\n' +
    '• ไม่ต้องใส่ชื่อหรืออีเมล คำตอบไม่ระบุตัวตน  • ข้อมูลใช้เพื่อพัฒนาโปรเจกต์นี้เท่านั้น\n\n' +
    'Thank you for trying the Hikari StressCare website (Rush project · 42 Bangkok).\n' +
    'This survey takes about 5–7 minutes. Your answers will help decide whether to develop Hikari into an app and what users need most.\n' +
    '• No name or email needed. Answers are anonymous.  • Data is used only to develop this project.'
  );
  form.setProgressBar(true);
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage(
    'ขอบคุณมาก ๆ ที่ช่วยตอบแบบสอบถาม 💙 ความคิดเห็นของคุณช่วยให้ Hikari ดีขึ้นจริง ๆ\n' +
    'Thank you so much for your feedback 💙 It really helps make Hikari better.'
  );

  // ---------- ส่วนที่ 1: เกี่ยวกับคุณ ----------
  form.addSectionHeaderItem()
    .setTitle(b('ส่วนที่ 1: เกี่ยวกับคุณ', 'Part 1: About you'));

  form.addMultipleChoiceItem()
    .setTitle(b('สถานะของคุณ', 'Your status'))
    .setChoiceValues([
      b('นักเรียน / นักศึกษา', 'Student'),
      b('ผู้เรียนที่ 42 Bangkok', '42 Bangkok learner'),
      b('คนทำงาน', 'Working')
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle(b('อายุ', 'Age'))
    .setChoiceValues([
      b('ต่ำกว่า 18 ปี', 'Under 18'),
      b('18–24 ปี', '18–24'),
      b('25–34 ปี', '25–34'),
      b('35 ปีขึ้นไป', '35 or older')
    ])
    .setRequired(true);

  form.addScaleItem()
    .setTitle(Q_STRESS)
    .setBounds(1, 5)
    .setLabels(b('แทบไม่เครียด', 'Rarely'), b('เครียดมาก', 'Very often'))
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle(b('คุณเคยใช้แอปหรือบริการดูแลสุขภาพจิตอะไรบ้าง? (เลือกได้หลายข้อ)',
                'Which mental health apps or services have you used? (choose any)'))
    .setChoiceValues([
      b('ไม่เคยใช้', 'None'),
      'Calm', 'Headspace', 'Wysa', 'Ooca', 'Raksa', 'Sati',
      b('สายด่วนสุขภาพจิต 1323', 'Mental health hotline 1323'),
      b('นักจิตวิทยา / จิตแพทย์โดยตรง', 'A psychologist / psychiatrist directly')
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle(b('คุณเคยจ่ายเงินให้แอปหรือบริการด้านสุขภาพจิตไหม?', 'Have you ever paid for a mental health app or service?'))
    .setChoiceValues([
      b('ไม่เคย', 'Never'),
      b('เคย จ่ายเป็นครั้ง ๆ', 'Yes, pay per session'),
      b('เคย สมัครสมาชิกรายเดือน / รายปี', 'Yes, a monthly / yearly subscription')
    ])
    .setRequired(true);

  // ---------- ส่วนที่ 2: ประเมินการใช้งานเว็บไซต์ ----------
  form.addPageBreakItem()
    .setTitle(b('ส่วนที่ 2: ประเมินการใช้งานเว็บไซต์', 'Part 2: Rate the website'))
    .setHelpText('ให้คะแนนจากที่คุณได้ลองใช้เว็บไซต์ (1 = ไม่เห็นด้วยอย่างยิ่ง, 5 = เห็นด้วยอย่างยิ่ง)\n' +
                 'Rate based on your experience (1 = strongly disagree, 5 = strongly agree)');

  form.addGridItem()
    .setTitle(b('คุณเห็นด้วยกับข้อความต่อไปนี้แค่ไหน?', 'How much do you agree with these statements?'))
    .setRows([
      b('เว็บใช้งานง่าย หาเมนูเจอ', 'Easy to use, menus are easy to find'),
      b('หน้าตาเว็บสวยงาม น่าใช้', 'The design looks good and inviting'),
      b('ข้อมูลน่าเชื่อถือ (มีงานวิจัยอ้างอิง)', 'Information is trustworthy (research-based)'),
      b('แบบประเมินความเครียดมีประโยชน์', 'The stress assessment is useful'),
      b('ตัวจับเวลาฝึกหายใจช่วยให้ผ่อนคลาย', 'The breathing timer helps me relax'),
      b('กราฟความเปลี่ยนแปลงช่วยให้เห็นพัฒนาการของตัวเอง', 'The progress charts help me see my progress'),
      b('สมัครสมาชิก / เข้าสู่ระบบง่าย', 'Signing up / logging in is easy'),
      b('ใช้งานบนมือถือสะดวก', 'Works well on mobile')
    ])
    .setColumns(['1', '2', '3', '4', '5'])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle(b('ส่วนไหนของเว็บที่คุณชอบที่สุด? (เลือกได้หลายข้อ)', 'Which parts did you like most? (choose any)'))
    .setChoiceValues([
      b('แบบประเมินความเครียด 18 ข้อ', '18-question stress assessment'),
      b('วิธีดูแลตัวเอง 8 แบบ', '8 self-care activities'),
      b('ฝึกหายใจ (วงกลม)', 'Breathing timer (circle)'),
      b('งานวิจัยอ้างอิง', 'Research references'),
      b('กราฟความเปลี่ยนแปลง', 'Progress charts'),
      b('บันทึกอารมณ์', 'Mood check-in'),
      b('บันทึกกิจกรรม (log)', 'Activity log'),
      b('เปลี่ยนได้ 10 ภาษา', '10 languages'),
      b('สายด่วนขอความช่วยเหลือ', 'Help hotlines')
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle(b('มีปัญหาหรือจุดที่ใช้งานยากไหม? (ไม่บังคับ)', 'Any problems or confusing parts? (optional)'));

  form.addScaleItem()
    .setTitle(Q_SATISFY)
    .setBounds(1, 5)
    .setLabels(b('ไม่พอใจเลย', 'Not satisfied'), b('พอใจมาก', 'Very satisfied'))
    .setRequired(true);

  form.addScaleItem()
    .setTitle(Q_NPS)
    .setBounds(0, 10)
    .setLabels(b('ไม่แนะนำเลย', 'Not at all'), b('แนะนำแน่นอน', 'Definitely'))
    .setRequired(true);

  // ---------- ส่วนที่ 3: สิ่งที่อยากให้มี ----------
  form.addPageBreakItem()
    .setTitle(b('ส่วนที่ 3: สิ่งที่คุณอยากให้มี', 'Part 3: What you want'))
    .setHelpText('ช่วยบอกว่าถ้าพัฒนาต่อ ควรมีอะไรบ้าง\nTell us what Hikari should have next');

  form.addMultipleChoiceItem()
    .setTitle(Q_WEB)
    .setChoiceValues([
      b('ใช้แน่นอน', 'Definitely'),
      b('น่าจะใช้', 'Probably'),
      b('ไม่แน่ใจ', 'Not sure'),
      b('น่าจะไม่ใช้', 'Probably not'),
      b('ไม่ใช้', 'No')
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle(Q_APP)
    .setChoiceValues([
      b('ใช้แน่นอน', 'Definitely'),
      b('น่าจะใช้', 'Probably'),
      b('ไม่แน่ใจ', 'Not sure'),
      b('น่าจะไม่ใช้', 'Probably not'),
      b('ไม่ใช้', 'No')
    ])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle(Q_FEATURES)
    .setChoiceValues([
      b('แอปมือถือ (iOS / Android)', 'Mobile app (iOS / Android)'),
      b('แจ้งเตือนให้ฝึกหายใจ / บันทึกอารมณ์', 'Reminders to breathe / log mood'),
      b('เสียงนำสมาธิและนิทานก่อนนอนภาษาไทย', 'Thai guided meditation and bedtime stories'),
      b('วิดีโอพาฝึกหายใจ / ทำสมาธิ ภาษาไทย', 'Thai guided breathing / meditation videos'),
      b('โปรแกรมดูแลตัวเอง 14 วัน (นอนดี, รับมือสอบ, เครียดเรื่องเงิน)', '14-day programs (sleep, exams, money stress)'),
      b('แผนดูแลตัวเองเฉพาะคนทุกสัปดาห์', 'A personal self-care plan every week'),
      b('แชทระบายกับ AI', 'Chat with an AI to vent'),
      b('คุยกับนักจิตวิทยาตัวจริง', 'Talk to a real psychologist'),
      b('รายงานสรุปรายเดือน (PDF)', 'Monthly summary report (PDF)'),
      b('เชื่อมต่อสมาร์ทวอทช์ (การนอน / การเต้นหัวใจ)', 'Smartwatch sync (sleep / heart rate)'),
      b('ชุมชนแบ่งปันแบบไม่ระบุตัวตน', 'Anonymous community'),
      b('ใช้งานแบบออฟไลน์ได้', 'Works offline')
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addTextItem()
    .setTitle(b('ถ้าเลือกได้แค่ 1 อย่าง อยากให้มีอะไรมากที่สุด?', 'If you could pick only one feature, what would it be?'));

  form.addMultipleChoiceItem()
    .setTitle(b('คุณอยากใช้ Hikari บนอุปกรณ์ไหนมากที่สุด?', 'Which device would you use Hikari on most?'))
    .setChoiceValues([
      b('มือถือ iPhone (iOS)', 'iPhone (iOS)'),
      b('มือถือ Android', 'Android phone'),
      b('คอมพิวเตอร์ (เว็บไซต์)', 'Computer (website)'),
      b('ใช้ได้ทุกอุปกรณ์', 'All devices')
    ])
    .setRequired(true);

  // ---------- ส่วนที่ 4: การสมัครและจ่ายเงิน ----------
  form.addPageBreakItem()
    .setTitle(b('ส่วนที่ 4: การสมัครสมาชิกและการจ่ายเงิน', 'Part 4: Plans and payment'))
    .setHelpText(
      'แผนที่วางไว้ (ยังไม่เปิดให้บริการจริง):\n' +
      '• Free ฿0 : แบบประเมิน, ฝึกหายใจ 3 แบบ, กิจกรรมดูแลตัวเอง, บันทึกอารมณ์ 7 วัน, สายด่วนฟรีเสมอ\n' +
      '• Premium ฿99/เดือน หรือ ฿790/ปี (นักศึกษาลด 50%) : กราฟเปรียบเทียบ, แผนเฉพาะคน, โปรแกรม 14 วัน, เสียงภาษาไทย, รายงานรายเดือน\n' +
      '• Care+ ฿300–900/ครั้ง : คุยกับนักจิตวิทยาที่มีใบอนุญาต (แชท/วิดีโอ)\n\n' +
      'Planned plans (not available yet):\n' +
      '• Free ฿0: assessment, 3 breathing patterns, self-care activities, 7-day mood log, hotlines always free\n' +
      '• Premium ฿99/month or ฿790/year (50% off for students): comparison charts, personal plan, 14-day programs, Thai audio, monthly report\n' +
      '• Care+ ฿300–900/session: talk to a licensed psychologist (chat/video)'
    );

  form.addMultipleChoiceItem()
    .setTitle(Q_PAY)
    .setChoiceValues([PAY_YES, PAY_MAYBE, PAY_NO])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle(Q_PLAN)
    .setChoiceValues(['Free', 'Premium', 'Care+', b('Premium และ Care+', 'Premium and Care+')])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle(Q_PRICE)
    .setChoiceValues([
      b('ไม่จ่าย', 'Would not pay'),
      b('ไม่เกิน ฿49', 'Up to ฿49'),
      '฿50–99',
      '฿100–149',
      '฿150–199',
      b('฿200 ขึ้นไป', '฿200 or more')
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle(b('ถ้าจะคุยกับนักจิตวิทยา (Care+) ยินดีจ่ายต่อครั้งเท่าไร?', 'How much would you pay per psychologist session (Care+)?'))
    .setChoiceValues([
      b('ไม่ใช้บริการนี้', 'Would not use this'),
      b('ไม่เกิน ฿300', 'Up to ฿300'),
      '฿300–500',
      '฿501–900',
      b('มากกว่า ฿900', 'More than ฿900')
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle(b('รูปแบบการจ่ายที่คุณชอบ', 'Preferred way to pay'))
    .setChoiceValues([
      b('รายเดือน', 'Monthly'),
      b('รายปี (ถูกกว่า)', 'Yearly (cheaper)'),
      b('จ่ายครั้งเดียวใช้ได้ตลอด', 'One-time lifetime payment'),
      b('จ่ายเป็นครั้งตามที่ใช้', 'Pay per use')
    ])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle(b('ช่องทางจ่ายเงินที่สะดวก (เลือกได้หลายข้อ)', 'Convenient payment methods (choose any)'))
    .setChoiceValues([
      b('พร้อมเพย์ / สแกน QR', 'PromptPay / QR'),
      b('บัตรเครดิต / เดบิต', 'Credit / debit card'),
      'TrueMoney Wallet',
      'App Store / Google Play'
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle(Q_PAY_REASONS)
    .setChoiceValues([
      b('เห็นว่าความเครียดลดลงจริง (มีกราฟ / รายงาน)', 'Seeing my stress really go down (charts / reports)'),
      b('เนื้อหาและเสียงเป็นภาษาไทย', 'Content and audio in Thai'),
      b('มีราคานักศึกษา', 'Student pricing'),
      b('ทดลองใช้ฟรีก่อนตัดสินใจ', 'A free trial first'),
      b('ได้คุยกับผู้เชี่ยวชาญตัวจริง', 'Talking to real professionals'),
      b('ข้อมูลปลอดภัย เป็นความลับ', 'Private, secure data'),
      b('ไม่มีโฆษณา', 'No ads'),
      b('มหาวิทยาลัย / บริษัทจ่ายให้', 'My university / company pays')
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle(Q_NOPAY_REASONS)
    .setChoiceValues([
      b('ใช้แผนฟรีก็พอแล้ว', 'The free plan is enough'),
      b('ราคาแพงเกินไป', 'Too expensive'),
      b('ยังไม่มั่นใจว่าได้ผล', 'Not sure it works'),
      b('กังวลเรื่องความเป็นส่วนตัวของข้อมูล', 'Privacy concerns'),
      b('ใช้แอปอื่นอยู่แล้ว', 'Already use another app'),
      b('ไม่ค่อยเครียด ไม่จำเป็น', 'Not stressed, don\'t need it')
    ])
    .showOtherOption(true);

  form.addMultipleChoiceItem()
    .setTitle(b('ระยะเวลาทดลองใช้ฟรีที่พอให้คุณตัดสินใจ', 'How long a free trial do you need to decide?'))
    .setChoiceValues([
      b('3 วัน', '3 days'),
      b('7 วัน', '7 days'),
      b('14 วัน', '14 days'),
      b('30 วัน', '30 days')
    ])
    .setRequired(true);

  // ---------- ส่วนที่ 5: ข้อเสนอแนะ ----------
  form.addPageBreakItem()
    .setTitle(b('ส่วนที่ 5: ข้อเสนอแนะ', 'Part 5: Feedback'));

  form.addMultipleChoiceItem()
    .setTitle(b('สนใจเป็นผู้ทดสอบแอปเวอร์ชันแรก (beta) ไหม?', 'Would you like to be a beta tester?'))
    .setChoiceValues([b('สนใจ', 'Yes'), b('ไม่สนใจ', 'No')])
    .setRequired(true);

  form.addTextItem()
    .setTitle(b('ถ้าสนใจเป็นผู้ทดสอบ ฝากช่องทางติดต่อ เช่น LINE ID หรือ Discord (ไม่บังคับ)',
                'If yes, leave a contact such as LINE ID or Discord (optional)'));

  form.addParagraphTextItem()
    .setTitle(b('ข้อเสนอแนะอื่น ๆ ถึงทีม Hikari (ไม่บังคับ)', 'Any other suggestions for the Hikari team? (optional)'));

  // ---------- เก็บคำตอบลง Google Sheet ----------
  const sheet = SpreadsheetApp.create(SURVEY_TITLE + ' (คำตอบ / Responses)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  // ---------- เปิดรับคำตอบ ----------
  form.setAcceptingResponses(true);
  if (typeof form.setPublished === 'function') {
    try { form.setPublished(true); } catch (e) { /* บัญชีบางแบบไม่มีคำสั่งนี้ */ }
  }

  // จำ id ไว้ใช้ตอนวิเคราะห์ผล
  const props = PropertiesService.getScriptProperties();
  props.setProperty('FORM_ID', form.getId());
  props.setProperty('SHEET_ID', sheet.getId());

  let shortUrl = form.getPublishedUrl();
  try { shortUrl = form.shortenFormUrl(form.getPublishedUrl()); } catch (e) { /* ใช้ลิงก์ยาวแทน */ }

  Logger.log('✅ สร้างแบบสอบถามเรียบร้อย');
  Logger.log('🔗 ลิงก์ให้เพื่อนทำแบบสอบถาม (เอาไปทำ QR Code): ' + shortUrl);
  Logger.log('✏️ ลิงก์แก้ไขฟอร์ม: ' + form.getEditUrl());
  Logger.log('📊 Google Sheet เก็บคำตอบ: ' + sheet.getUrl());
}


// ===== 2. วิเคราะห์ผล: เกณฑ์ "สนใจใช้ > 30%" และ "ยินดีจ่าย > 10%" =====
function analyzeResults() {
  const props = PropertiesService.getScriptProperties();
  const formId = props.getProperty('FORM_ID');
  if (!formId) {
    Logger.log('ยังไม่พบฟอร์ม กรุณารัน createSurvey ก่อน');
    return;
  }
  const responses = FormApp.openById(formId).getResponses();
  if (responses.length === 0) {
    Logger.log('ยังไม่มีคนตอบแบบสอบถาม');
    return;
  }

  // แปลงคำตอบแต่ละคนเป็น { ชื่อคำถาม: คำตอบ }
  const people = responses.map(function (r) {
    const row = {};
    r.getItemResponses().forEach(function (ir) {
      row[ir.getItem().getTitle()] = ir.getResponse();
    });
    return row;
  });

  // ตัวชี้วัดของกลุ่มใดกลุ่มหนึ่ง (ทุกคน หรือ เฉพาะคนที่เครียดจริง)
  function measure(group) {
    const n = group.length;
    const interested = group.filter(function (p) {
      return USE_YES.indexOf(p[Q_APP]) !== -1 || USE_YES.indexOf(p[Q_WEB]) !== -1;
    }).length;
    const appUsers = group.filter(function (p) { return USE_YES.indexOf(p[Q_APP]) !== -1; }).length;
    const webUsers = group.filter(function (p) { return USE_YES.indexOf(p[Q_WEB]) !== -1; }).length;
    const yes = group.filter(function (p) { return p[Q_PAY] === PAY_YES; }).length;
    const maybe = group.filter(function (p) { return p[Q_PAY] === PAY_MAYBE; }).length;
    const no = group.filter(function (p) { return p[Q_PAY] === PAY_NO; }).length;
    return {
      n: n, interested: interested, appUsers: appUsers, webUsers: webUsers,
      yes: yes, maybe: maybe, no: no,
      usePass: n > 0 && interested / n > USE_THRESHOLD,
      payPass: n > 0 && yes / n > PAY_THRESHOLD
    };
  }
  function pct(x, n) { return n ? Math.round(x / n * 1000) / 10 + '%' : '-'; }

  function decision(m) {
    if (m.n === 0) { return 'ยังไม่มีผู้ตอบในกลุ่มนี้'; }
    if (m.usePass && m.payPass) {
      return '✅ พัฒนาแอปได้ และมีโอกาสสร้างรายได้ → ทำแอปพร้อมแผน Premium / Care+';
    }
    if (m.usePass) {
      return '✅ พัฒนาแอปได้ แต่ยินดีจ่ายยังไม่เกิน 10% → เริ่มแบบฟรี แล้วปรับราคา/ฟีเจอร์ หรือหารายได้จาก B2B';
    }
    if (m.payPass) {
      return '⚠️ มีคนยอมจ่าย แต่คนสนใจใช้ยังไม่เกิน 30% → ปรับเว็บให้น่าใช้ขึ้นก่อน แล้วสำรวจอีกครั้ง';
    }
    return '⏸️ ยังไม่ผ่านทั้ง 2 เกณฑ์ → ปรับตามข้อเสนอแนะ แล้วสำรวจอีกครั้ง';
  }

  const all = measure(people);
  const stressedGroup = people.filter(function (p) { return Number(p[Q_STRESS]) >= STRESSED_MIN; });
  const stressed = measure(stressedGroup);

  // นับตัวเลือกของคำถาม (รองรับคำถามเลือกได้หลายข้อ)
  function ranking(title, group) {
    const c = {};
    group.forEach(function (p) {
      const a = p[title];
      (Array.isArray(a) ? a : [a]).forEach(function (x) {
        if (x !== undefined && x !== null && x !== '') { c[x] = (c[x] || 0) + 1; }
      });
    });
    return Object.keys(c).sort(function (x, y) { return c[y] - c[x]; })
      .map(function (k) { return [k, c[k], pct(c[k], group.length)]; });
  }
  function avg(title, group) {
    const xs = group.map(function (p) { return Number(p[title]); }).filter(function (x) { return !isNaN(x); });
    if (xs.length === 0) { return '-'; }
    return Math.round(xs.reduce(function (a, c) { return a + c; }, 0) / xs.length * 100) / 100;
  }
  // NPS = % ผู้สนับสนุน (9–10) − % ผู้ไม่สนับสนุน (0–6)
  const nps = people.map(function (p) { return Number(p[Q_NPS]); }).filter(function (x) { return !isNaN(x); });
  const npsScore = nps.length ? Math.round((nps.filter(function (x) { return x >= 9; }).length -
    nps.filter(function (x) { return x <= 6; }).length) / nps.length * 100) : '-';

  // ---------- แสดงใน Execution log ----------
  [['ผู้ตอบทั้งหมด', all], ['กลุ่มเป้าหมาย: คนที่เครียดจริง (ระดับ 4–5)', stressed]].forEach(function (g) {
    const m = g[1];
    Logger.log('===== ' + g[0] + ': ' + m.n + ' คน =====');
    Logger.log('เกณฑ์ 1 สนใจใช้แอปหรือเว็บ: ' + m.interested + ' คน (' + pct(m.interested, m.n) + ') ' +
               (m.usePass ? '✅ เกิน 30%' : '❌ ไม่เกิน 30%'));
    Logger.log('เกณฑ์ 2 ยินดีจ่าย: ' + m.yes + ' คน (' + pct(m.yes, m.n) + ') ' +
               (m.payPass ? '✅ เกิน 10%' : '❌ ไม่เกิน 10%') +
               ' · อาจจะจ่าย ' + m.maybe + ' คน (' + pct(m.maybe, m.n) + ')');
    Logger.log('ผล: ' + decision(m));
  });
  if (all.n < 30) {
    Logger.log('หมายเหตุ: ผู้ตอบยังน้อยกว่า 30 คน ผลอาจคลาดเคลื่อนได้มาก ควรเก็บเพิ่ม โดยเฉพาะกลุ่มคนที่เครียดจริง');
  }

  // ---------- เขียนสรุปลงแท็บ "สรุปผล" ใน Google Sheet ----------
  const ss = SpreadsheetApp.openById(props.getProperty('SHEET_ID'));
  let sh = ss.getSheetByName('สรุปผล');
  if (!sh) { sh = ss.insertSheet('สรุปผล'); }
  sh.clear();

  const rows = [];
  rows.push(['สรุปผลแบบประเมิน Hikari StressCare', '', '', '']);
  rows.push(['อัปเดตเมื่อ', new Date(), '', '']);
  rows.push(['', '', '', '']);
  rows.push(['ตัวชี้วัด', 'ผู้ตอบทั้งหมด', 'คนที่เครียดจริง (ระดับ 4–5)', 'เกณฑ์']);
  rows.push(['จำนวนผู้ตอบ', all.n, stressed.n, '']);
  rows.push(['สนใจใช้แอปหรือเว็บไซต์', pct(all.interested, all.n), pct(stressed.interested, stressed.n), '> 30% → พัฒนาแอปได้']);
  rows.push(['  • สนใจใช้แอปมือถือ', pct(all.appUsers, all.n), pct(stressed.appUsers, stressed.n), '']);
  rows.push(['  • จะกลับมาใช้เว็บไซต์', pct(all.webUsers, all.n), pct(stressed.webUsers, stressed.n), '']);
  rows.push(['ยินดีจ่าย', pct(all.yes, all.n), pct(stressed.yes, stressed.n), '> 10% → มีโอกาสสร้างรายได้']);
  rows.push(['อาจจะจ่าย', pct(all.maybe, all.n), pct(stressed.maybe, stressed.n), '']);
  rows.push(['ไม่จ่าย', pct(all.no, all.n), pct(stressed.no, stressed.n), '']);
  rows.push(['ผลการตัดสินใจ', decision(all), decision(stressed), '']);
  rows.push(['', '', '', '']);
  rows.push(['ความพึงพอใจเฉลี่ย (เต็ม 5)', avg(Q_SATISFY, people), avg(Q_SATISFY, stressedGroup), '']);
  rows.push(['NPS (−100 ถึง 100) ผู้ตอบทั้งหมด', npsScore, '', '']);
  rows.push(['', '', '', '']);

  [[Q_PLAN, 'แผนที่สนใจ'], [Q_PRICE, 'ราคา Premium ที่ยินดีจ่าย/เดือน'],
   [Q_FEATURES, 'ฟีเจอร์ที่อยากได้ (เรียงจากมากไปน้อย)'], [Q_PAY_REASONS, 'สิ่งที่ทำให้ยอมจ่าย'],
   [Q_NOPAY_REASONS, 'เหตุผลที่ไม่จ่าย']].forEach(function (q) {
    rows.push([q[1] + ' · ผู้ตอบทั้งหมด', 'จำนวน', '% ของผู้ตอบ', '']);
    ranking(q[0], people).forEach(function (r) { rows.push([r[0], r[1], r[2], '']); });
    rows.push([q[1] + ' · คนที่เครียดจริง', 'จำนวน', '% ของกลุ่ม', '']);
    ranking(q[0], stressedGroup).forEach(function (r) { rows.push([r[0], r[1], r[2], '']); });
    rows.push(['', '', '', '']);
  });

  sh.getRange(1, 1, rows.length, 4).setValues(rows);
  sh.getRange('A1').setFontWeight('bold').setFontSize(14);
  sh.getRange('A4:D4').setFontWeight('bold').setBackground('#e6eeff');
  sh.getRange('B6').setBackground(all.usePass ? '#d9f2e3' : '#fff1d6');
  sh.getRange('C6').setBackground(stressed.usePass ? '#d9f2e3' : '#fff1d6');
  sh.getRange('B9').setBackground(all.payPass ? '#d9f2e3' : '#fff1d6');
  sh.getRange('C9').setBackground(stressed.payPass ? '#d9f2e3' : '#fff1d6');
  sh.getRange('A12:C12').setFontWeight('bold');
  sh.autoResizeColumns(1, 4);

  Logger.log('📊 เขียนสรุปลงแท็บ "สรุปผล" แล้ว: ' + ss.getUrl());
}
