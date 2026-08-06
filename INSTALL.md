# Step 29 — Cover Image Fix

1. คัดลอกไฟล์ทั้งหมดใน ZIP ไปทับ `D:\TravelTank300`
2. รัน:

```powershell
cd D:\TravelTank300
npm.cmd install
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

3. เปิดสถานที่ เลือกรูปเป็นหน้าปก แล้วกลับหน้า `/places`
4. รูปหน้าปกใหม่ต้องแสดงทันทีโดยไม่ต้องกด Refresh

รอบนี้ไม่ต้อง Deploy GAS ใหม่ เพราะแก้เฉพาะ Supabase และหน้าเว็บ


## Step 29.1
ZIP วางไฟล์ไว้ระดับราก ให้ใช้คำสั่งค้นหา ZIP อัตโนมัติจาก Downloads เพื่อหลีกเลี่ยงปัญหาชื่อไฟล์หรือพาธไม่ตรง

## ตรวจ Step 31
หลังติดตั้ง ให้เปิดสถานที่ที่มีหลายรูป กดที่ตัวรูปโดยตรงและปัดซ้าย–ขวา ภาพในกริดควรโหลดเป็นภาพย่อ ส่วน Lightbox โหลด Preview ความละเอียดสูงโดยไม่ต้องมีปุ่ม `ดูรูป`

## Step 32 — ตรวจ GAS ก่อนทดสอบรูป
เปิดค่า `GAS_WEB_APP_URL` ใน Browser ต้องได้ JSON จาก `doGet()` และ URL ต้องลงท้าย `/exec` หากได้หน้า HTML หรือ HTTP 404 ให้ Deploy Apps Script แบบ New version และนำ URL `/exec` ใหม่มาใส่ `.env.local` และ Vercel แล้ว restart `npm.cmd run dev`.
