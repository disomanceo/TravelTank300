# TravelTank300

เว็บบันทึกการท่องเที่ยวแบบ Mobile-first ใช้ Next.js, Supabase และ Google Drive ผ่าน Google Apps Script

## Step 27

แก้ `POST /api/uploads 500` โดยไม่ส่ง Base64 ซ้ำหลายชื่ออีกต่อไป ระบบส่งครั้งละ 1 รูปด้วย JSON โดยตรง ตรวจขนาด Request จริง และลดขนาด/คุณภาพรูปอัตโนมัติก่อนส่งไป Vercel และ GAS

GAS เวอร์ชันที่ต้อง Deploy คือ `1.4.0` และ URL ต้องลงท้ายด้วย `/exec`

คำสั่งตรวจ:

```powershell
npm.cmd install
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

ดูขั้นตอนทั้งหมดใน `INSTALL.md` และสถานะงานใน `TODO.md`


## Step 28
Google Drive แยกรูปตามชื่อสถานที่ โดยมีโฟลเดอร์ `originals`, `previews` และไฟล์ `place-info.json` ภายในแต่ละสถานที่

## Step 29
แก้หน้าปกสถานที่ไม่แสดงบนหน้าแรก โดยใช้ Drive file ID โดยตรงและโหลดรายการใหม่เมื่อย้อนกลับจากหน้ารายละเอียดหรือ PWA กลับมาทำงาน

## Step 31
หน้าแสดงรายละเอียดสถานที่ใช้ภาพย่อ 480px เพื่อโหลดเร็วขึ้น กดรูปได้โดยตรงเพื่อเปิด Lightbox และปัดซ้าย–ขวาบนมือถือได้ Lightbox ใช้ Preview 1600px พร้อม preload รูปข้างเคียงแทนการโหลด Original ขนาดใหญ่ทันที

## Step 32
เพิ่มเกจอัปโหลดใต้กรอบรูป แสดงเปอร์เซ็นต์และจำนวนรูปสำเร็จ/ทั้งหมด พร้อมตรวจ GAS Web App URL ก่อนส่ง ลด Payload ต่อรูป เพิ่ม timeout และหยุด Retry เมื่อพบ URL ผิด, Unauthorized หรือหน้า HTML 404.
