# ☀ Hikari StressCare

เว็บไซต์ดูแลความเครียด: แบบประเมินความเครียด 18 ข้อ, ฝึกหายใจ, วิธีดูแลตัวเองจากงานวิจัย, กราฟความเปลี่ยนแปลง, บันทึกอารมณ์, วิดีโอคลายเครียดจากแหล่งที่เชื่อถือได้, เข้าสู่ระบบด้วย Google และเลือกได้ 10 ภาษา

A stress-care website: 18-question stress check, breathing timer, research-based self-care, progress charts, mood log, stress-relief videos from trusted sources, Sign in with Google and 10 languages.

- 🌐 ลองใช้ / Try it: https://mokarumokaruja-beep.github.io/hikari-stresscare/
- 📱 หน้า QR สำหรับพรีเซนต์ / QR page: https://mokarumokaruja-beep.github.io/hikari-stresscare/qr.html
- 📝 แบบสอบถาม / Survey: https://forms.gle/R5iZDvvk11o1Fzeu8

## ในโฟลเดอร์มีอะไร / What's inside

| ไฟล์ / File | หน้าที่ / Purpose |
|---|---|
| `index.html`, `style.css`, `script.js` | ตัวเว็บไซต์ / The website |
| `lang/` | ข้อความ 10 ภาษา / Text in 10 languages |
| `images/` | รูปภาพในเว็บ / Images |
| `qr.html` | หน้า QR 2 ขั้น: ลองเว็บ → ทำแบบสอบถาม / Two-step QR page |
| `qr/` | ไฟล์ QR สำหรับพิมพ์หรือใส่สไลด์ / QR images for slides or print |
| `survey/Hikari_Survey.gs` | Apps Script สร้างแบบสอบถาม 2 ภาษา (`createSurvey`) และสรุปผล (`analyzeResults`) |
| `survey/Hikari_Survey_Questions.md` | รายการคำถามทั้งหมด / Full question list |

## เกณฑ์ตัดสินใจจากแบบสอบถาม / Decision criteria

- สนใจใช้แอปหรือเว็บไซต์ **มากกว่า 30%** → พัฒนาเป็นแอป / >30% interested → build the app
- ยินดีจ่าย **มากกว่า 10%** → มีโอกาสสร้างรายได้ / >10% willing to pay → revenue opportunity
- ดูผลแยกกลุ่ม "คนที่เครียดจริง" (ระดับความเครียด 4–5 จาก 5) / Results also shown for the truly stressed group

ดูผล: เปิด Apps Script → เลือก `analyzeResults` → Run → ดูแท็บ "สรุปผล" ใน Google Sheet

## ตั้งค่า / Settings (`script.js`)

- `SURVEY_URL` ลิงก์แบบสอบถาม (ตั้งไว้แล้ว) / survey link (already set)
- `GOOGLE_CLIENT_ID` ใส่ OAuth Client ID เพื่อเปิดปุ่ม Sign in with Google (Authorized JavaScript origin: `https://mokarumokaruja-beep.github.io`) ถ้าเว้นว่าง ปุ่มจะถูกซ่อน / leave empty to hide the Google button

## หมายเหตุเรื่องวิดีโอ / About videos

วิดีโอฝังจาก YouTube ทุกคนดูได้ฟรีและเล่นทันที ตาม YouTube API Services Developer Policies (ห้ามเก็บเงินเพื่อดู ห้ามคั่นก่อนเล่น ห้ามบล็อกโฆษณาของ YouTube)
Embedded YouTube videos are free for everyone and play immediately, following YouTube's developer policies.

> ต้นแบบเพื่อการเรียนรู้ ไม่ใช่การวินิจฉัยทางการแพทย์ หากรู้สึกไม่ปลอดภัย โทร 1323 (สายด่วนสุขภาพจิต) หรือ 1669 (ฉุกเฉิน)
> Educational prototype, not a medical diagnosis. In Thailand, call 1323 (mental health hotline) or 1669 (emergency).

เริ่มต้นจากโปรเจกต์ Rush · 42 Bangkok Discovery Piscine
