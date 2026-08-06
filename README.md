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
