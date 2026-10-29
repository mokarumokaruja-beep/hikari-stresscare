// =====================================================================
// Hikari - pay.js  ฟังก์ชันชำระเงินที่ใช้ร่วมกัน (เว็บ index.html + เกม game.html + staff.html)
// สร้าง QR ตามมาตรฐาน Thai QR Payment (EMVCo) ในเบราว์เซอร์ ไม่ส่งข้อมูลออกไปไหน
// ต้องโหลดหลัง config.js และไลบรารี qrcode-generator
// =====================================================================

// ตัวตรวจความถูกต้อง CRC16-CCITT (ค่าเริ่ม 0xFFFF) ตามมาตรฐาน EMVCo
function crc16(text) {
    let crc = 0xFFFF;
    for (let i = 0; i < text.length; i++) {
        crc ^= text.charCodeAt(i) << 8;
        for (let b = 0; b < 8; b++) {
            crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
            crc &= 0xFFFF;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
}

// รวมข้อมูลแบบ ID + ความยาว 2 หลัก + ค่า
function tlv(id, value) {
    return id + String(value.length).padStart(2, "0") + value;
}

// ข้อความใน QR PromptPay: รับเบอร์มือถือ 10 หลัก หรือเลขประจำตัวผู้เสียภาษี/บัตรประชาชน 13 หลัก
function promptpayPayload(id, amount) {
    const digits = String(id).replace(/[^0-9]/g, "");
    let target;
    if (digits.length === 13) {
        target = tlv("02", digits);                                   // เลขประจำตัว 13 หลัก
    } else {
        target = tlv("01", ("0000000000000" + digits.replace(/^0/, "66")).slice(-13));   // เบอร์มือถือ → 0066xxxxxxxxx
    }
    let data = tlv("00", "01") +
        tlv("01", amount ? "12" : "11") +                            // 12 = ใช้ครั้งเดียว มียอดเงิน
        tlv("29", tlv("00", "A000000677010111") + target) +
        tlv("58", "TH") +
        tlv("53", "764");                                             // 764 = บาท
    if (amount) {
        data += tlv("54", Number(amount).toFixed(2));
    }
    data += "6304";
    return data + crc16(data);
}

// วาด QR เป็น SVG (ใช้ไลบรารี qrcode-generator ตัวเดียวกับหน้า qr.html)
function qrSvg(text) {
    if (typeof qrcode === "undefined") {
        return "";
    }
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    let path = "";
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (qr.isDark(r, c)) {
                path += "M" + c + " " + r + "h1v1h-1z";
            }
        }
    }
    const q = 4;
    return '<svg viewBox="' + (-q) + " " + (-q) + " " + (n + 2 * q) + " " + (n + 2 * q) +
        '" shape-rendering="crispEdges"><rect x="' + (-q) + '" y="' + (-q) + '" width="' + (n + 2 * q) +
        '" height="' + (n + 2 * q) + '" fill="#fff"/><path d="' + path + '" fill="#1f2a5c"/></svg>';
}

// ===== รหัสรับของ =====
// ทีมงานตรวจสลิปแล้ว เปิด staff.html วาง "ข้อความคำสั่งซื้อ" ที่ลูกค้าส่งมา (เลขที่ · ของ · ยอด) → ได้รหัส 6 ตัว
// ลูกค้าใส่รหัสในเกม (แท็บ "ฉัน") หรือเว็บ → ของเข้ากระเป๋า
// ข้อจำกัด: ไม่มีเซิร์ฟเวอร์ คนที่อ่านโค้ดเป็นสามารถคำนวณรหัสเองได้ ใช้ในช่วงทดลองขายเท่านั้น
function redeemCode(orderId, amount, item) {
    const text = STAFF_KEY + "|" + String(orderId).trim().toUpperCase() + "|" + Number(amount).toFixed(2) + "|" + String(item || "").trim();
    let h1 = 0x811c9dc5, h2 = 0x01000193;
    for (let i = 0; i < text.length; i++) {
        h1 = Math.imul(h1 ^ text.charCodeAt(i), 16777619) >>> 0;
        h2 = Math.imul(h2 + text.charCodeAt(i), 2246822507) >>> 0;
    }
    const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";   // ไม่มี I O 0 1 ที่อ่านสับสน
    let n = (h1 ^ h2) >>> 0, out = "";
    for (let i = 0; i < 6; i++) {
        out += abc[n % abc.length];
        n = Math.floor(n / abc.length) + (i === 2 ? h2 : 0);
        n = n >>> 0;
    }
    return out;
}

// เลขคำสั่งซื้อใหม่ เช่น HK7Q2M9A
function newOrderId() {
    return "HK" + Date.now().toString(36).toUpperCase().slice(-6) + Math.floor(Math.random() * 36).toString(36).toUpperCase();
}

// ข้อความคำสั่งซื้อที่ลูกค้าส่งพร้อมสลิป เช่น "HK7Q2M9A · acc_thai-outfit · 53.00"
function orderLine(order) {
    return order.id + " · " + order.item + " · " + Number(order.amount).toFixed(2);
}

// อ่านข้อความคำสั่งซื้อกลับเป็นข้อมูล (ใช้ใน staff.html) ถ้าอ่านไม่ได้คืนค่า null
function parseOrderLine(text) {
    const parts = String(text).split(/[·|,]/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (parts.length < 3 || !/^HK[0-9A-Z]+$/i.test(parts[0]) || isNaN(Number(parts[2]))) {
        return null;
    }
    return { id: parts[0].toUpperCase(), item: parts[1], amount: Number(parts[2]) };
}
