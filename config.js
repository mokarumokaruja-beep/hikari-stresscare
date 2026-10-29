// =====================================================================
// Hikari - config.js  (ไฟล์ตั้งค่า แก้ได้ที่ไฟล์นี้ไฟล์เดียว ใช้ทั้งเว็บและเกม)
// แก้เฉพาะข้อความระหว่างเครื่องหมาย "" เท่านั้น
// =====================================================================

// ลิงก์แบบสอบถาม (Google Form) ถ้าเว้นว่าง ส่วน "ลองใช้แล้วเป็นอย่างไรบ้าง?" จะถูกซ่อน
const SURVEY_URL = "https://forms.gle/7NdDp2vfEaroHQ6d6";

// รหัส Google OAuth Client ID สำหรับปุ่ม "Sign in with Google" (วิธีทำ README ข้อ 12)
// ถ้าเว้นว่าง ปุ่ม Google จะถูกซ่อน และใช้ชื่อผู้ใช้/รหัสผ่านตามเดิม
const GOOGLE_CLIENT_ID = "";

// รับชำระเงินด้วย PromptPay (README ข้อ 15)
// PROMPTPAY_ID = เบอร์มือถือ 10 หลัก หรือเลขผู้เสียภาษี 13 หลักที่ผูก PromptPay (แนะนำบัญชีบริษัท)
// ถ้าเว้นว่าง ปุ่มซื้อด้วยเงินจะขึ้นว่า "เร็ว ๆ นี้" และยังไม่รับชำระ
const PROMPTPAY_ID = "";
const PROMPTPAY_NAME = "[ชื่อบัญชีผู้รับเงิน]";   // ชื่อที่ผู้ใช้จะเห็นในแอปธนาคาร
const SLIP_URL = "";                            // ลิงก์ส่งสลิป เช่น Google Form หรือ LINE Official Account

// รหัสลับสำหรับสร้าง "รหัสรับของ" หลังทีมงานตรวจสลิปแล้ว (ใช้คู่กับหน้า staff.html)
// เปลี่ยนเป็นคำของคุณเอง ภาษาอังกฤษหรือตัวเลข 8 ตัวขึ้นไป
// หมายเหตุ: เว็บนี้ไม่มีเซิร์ฟเวอร์ คนที่เปิดดูโค้ดจะเห็นคำนี้ได้ จึงเหมาะกับช่วงทดลองขายเท่านั้น
const STAFF_KEY = "hikari-change-me";

// ช่องทางติดต่อ Hikari (แสดงในส่วนท้ายและส่วนความเป็นส่วนตัว)
// ใส่ลิงก์ LINE Official Account เช่น "https://lin.ee/xxxx" หรืออีเมล เช่น "mailto:hello@example.com"
// ถ้าเว้นว่าง ลิงก์ "ติดต่อเรา" จะถูกซ่อน
const CONTACT_URL = "https://line.me/R/ti/p/@833aevlx";   // LINE OA: Hikari StressCare (@833aevlx)

// อีเมลติดต่อ (แสดงคู่กับลิงก์ LINE) ถ้าเว้นว่างจะซ่อน
const CONTACT_EMAIL = "mokaru.entertainment.admin@gmail.com";

// ที่อยู่เว็บไซต์จริง (ใช้กับรูปตัวอย่างเวลาแชร์ลิงก์ใน LINE / Facebook)
// ถ้าย้ายเว็บไปที่อื่น ให้แก้ทั้งที่นี่และ og:url / og:image ในส่วน <head> ของ index.html
const SITE_URL = "https://mokarumokaruja-beep.github.io/hikari-stresscare/";
