# ☀ Hikari StressCare

เว็บไซต์ดูแลความเครียด: ภารกิจ 60 วัน (คลิปไม่ซ้ำวันละ 1 คลิป สลับคลื่นเสียงกับคลิปเยียวยาใจ + ภารกิจ 3 ข้อ + กล่องรางวัลทุก 7 วัน + งานวิจัย 30 ชิ้น), แบบประเมินความเครียด 18 ข้อ, ฝึกหายใจ, วิธีดูแลตัวเองจากงานวิจัย, กราฟความเปลี่ยนแปลง, บันทึกอารมณ์, วิดีโอคลายเครียดจากแหล่งที่เชื่อถือได้, เข้าสู่ระบบด้วย Google และเลือกได้ 10 ภาษา

A stress-care website: a 60-day journey (a new clip a day alternating sound waves and healing talks, 3 daily tasks, a reward every 7 days and 30 research summaries), 18-question stress check, breathing timer, research-based self-care, progress charts, mood log, stress-relief videos from trusted sources, Sign in with Google and 10 languages.

- 🌐 ลองใช้ / Try it: https://mokarumokaruja-beep.github.io/hikari-stresscare/
- 📱 หน้า QR สำหรับพรีเซนต์ / QR page: https://mokarumokaruja-beep.github.io/hikari-stresscare/qr.html
- 📝 แบบสอบถาม / Survey: https://forms.gle/7NdDp2vfEaroHQ6d6
- 💬 ติดต่อ / Contact: LINE OA [@833aevlx](https://line.me/R/ti/p/@833aevlx) · mokaru.entertainment.admin@gmail.com

## ในโฟลเดอร์มีอะไร / What's inside

| ไฟล์ / File | หน้าที่ / Purpose |
|---|---|
| `index.html`, `style.css`, `script.js` | ตัวเว็บไซต์ / The website |
| `config.js` | **ตั้งค่าทั้งหมดที่ไฟล์นี้** / all settings in one file |
| `game.html`, `game.css`, `game.js`, `game-pet.js`, `game-data.js`, `game.webmanifest`, `game/img/` | เกมสวนแสง 4 โลก + ร้านค้า / Light Garden game with shop |
| `pay.js`, `staff.html` | QR PromptPay + หน้าทีมงานสร้างรหัสรับของ / PromptPay QR + staff code page |
| `lang/` | ข้อความ 10 ภาษา / Text in 10 languages |
| `images/` | รูปภาพในเว็บ / Images |
| `#check`, `#mood-screen`, `#help` ใน `index.html` | เช็กร่างกายและพฤติกรรมรายสัปดาห์, คัดกรองซึมเศร้า 2Q/9Q (กรมสุขภาพจิต), สายด่วนช่วยเหลือ / Weekly body & behaviour check, 2Q/9Q screen, help directory |
| `#burnout`, `#reset`, `#rootcause` ใน `index.html` | เช็กภาวะหมดไฟ (CBI), พักสั้น 1–3 นาที 6 แบบ, รับมือที่ต้นเหตุ 8 เรื่อง / Burnout check (CBI), 6 quick resets, root-cause skills |
| `qr.html` | หน้า QR 2 ขั้น: ลองเว็บ → ทำแบบสอบถาม / Two-step QR page |
| `qr/` | ไฟล์ QR สำหรับพิมพ์หรือใส่สไลด์ (เว็บ แบบสอบถาม หน้า QR และ LINE OA) / QR images for slides or print |
| `survey/Hikari_Survey_v2.gs` | **แบบสอบถามรอบทดสอบจริง (เว็บ + เกม)** มีหน้าขอความยินยอม PDPA รับเฉพาะ 18+ (กลุ่มหลักวัยทำงาน 18–45 ปี) วิเคราะห์ 5 เกณฑ์ แยกผลวัยทำงานกับนักศึกษา / Real-test survey: consent page, 18+ only (main target working adults 18–45), 5 criteria, results split working vs students |
| `survey/Hikari_Survey_v2_Questions.md` | รายการคำถามฉบับที่ 2 / Question list v2 |
| `survey/Hikari_Survey.gs`, `survey/Hikari_Survey_Questions.md` | แบบสอบถามฉบับแรก (เก็บไว้เป็นประวัติ) / First survey (archive) |

## เกณฑ์ตัดสินใจจากแบบสอบถาม / Decision criteria

- สนใจใช้แอปหรือเว็บไซต์ **มากกว่า 30%** → พัฒนาเป็นแอป / >30% interested → build the app
- ยินดีจ่าย **มากกว่า 10%** → มีโอกาสสร้างรายได้ / >10% willing to pay → revenue opportunity
- ดูผลแยกกลุ่ม "คนที่เครียดจริง" (ระดับความเครียด 4–5 จาก 5) / Results also shown for the truly stressed group

ฉบับที่ 2 ตัดสินจาก 5 เกณฑ์: สนใจใช้ > 30%, ยินดีจ่ายรายเดือน > 10%, เล่นเกม 3 วันขึ้นไป ≥ 40%, ซื้อของในเกม > 10%, NPS > 0

ดูผล: เปิด Apps Script → เลือก `analyzeResults` → Run → ดูแท็บ "สรุปผล" ใน Google Sheet

## ตั้งค่า / Settings (`config.js`)

- `SURVEY_URL` ลิงก์แบบสอบถามฉบับที่ 2 (ตั้งไว้แล้ว) / v2 survey link (already set)
- `CONTACT_URL` ช่องทางติดต่อ (LINE OA, `mailto:` หรือ `tel:`) ถ้าเว้นว่างจะซ่อน / contact link, hidden when empty
- `CONTACT_EMAIL` อีเมลติดต่อ แสดงคู่กับ LINE / contact email
- `SITE_URL` ที่อยู่เว็บ ใช้สร้างลิงก์จดหมายใจดีที่แชร์ทาง LINE / site address used for shared letter links
- `PROMPTPAY_ID`, `PROMPTPAY_NAME`, `SLIP_URL` เปิดร้านค้าด้วย PromptPay (QR สร้างในเบราว์เซอร์ ตรวจสลิปเอง) ถ้าเว้นว่าง ปุ่มซื้อขึ้น "เร็ว ๆ นี้" / enable the PromptPay shop; leave empty to keep it "coming soon"
- `STAFF_KEY` รหัสลับสำหรับสร้างรหัสรับของใน `staff.html` เปลี่ยนเป็นคำของคุณเองก่อนขายจริง / change before selling
- `GOOGLE_CLIENT_ID` ใส่ OAuth Client ID เพื่อเปิดปุ่ม Sign in with Google (Authorized JavaScript origin: `https://mokarumokaruja-beep.github.io`) ถ้าเว้นว่าง ปุ่มจะถูกซ่อน / leave empty to hide the Google button

## ภารกิจ 60 วัน / 60-day journey

- คลิป 60 คลิปไม่ซ้ำ: วันคี่คลื่นเสียง/เสียงธรรมชาติ/ดนตรี 30 คลิป วันคู่คลิปเยียวยาใจไทย/อังกฤษ 30 คลิป / 60 unique clips alternating sound waves and healing talks
- ภารกิจ 3 ข้อต่อวัน: เช็กอินอารมณ์, ฟังคลิปหรืออ่านงานวิจัย, ฝึกหายใจ · ครบ 7 วันเลือกของรางวัลฟรี 1 ชิ้น / 3 daily tasks; a free reward every 7 completed days
- ข้อมูลคลิป งานวิจัย และของรางวัลอยู่ใน `content.js` / Content lives in `content.js`

## หมายเหตุเรื่องวิดีโอ / About videos

วิดีโอฝังจาก YouTube ทุกคนดูได้ฟรีและเล่นทันที ตาม YouTube API Services Developer Policies (ห้ามเก็บเงินเพื่อดู ห้ามคั่นก่อนเล่น ห้ามบล็อกโฆษณาของ YouTube)
Embedded YouTube videos are free for everyone and play immediately, following YouTube's developer policies.

> ต้นแบบเพื่อการเรียนรู้ ไม่ใช่การวินิจฉัยทางการแพทย์ หากรู้สึกไม่ปลอดภัย โทร 1323 (สายด่วนสุขภาพจิต) หรือ 1669 (ฉุกเฉิน)
> Educational prototype, not a medical diagnosis. In Thailand, call 1323 (mental health hotline) or 1669 (emergency).

เริ่มต้นจากโปรเจกต์ Rush · 42 Bangkok Discovery Piscine
