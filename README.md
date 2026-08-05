# TravelTank300 — Step 20

เว็บบันทึกสถานที่ท่องเที่ยวแบบ Mobile-first: Next.js 16, Supabase และ Google Drive ผ่าน GAS

## ติดตั้ง

```powershell
cd D:\TravelTank300
npm.cmd install
copy .env.example .env.local
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

ตั้งค่า `.env.local` ด้วย Supabase URL/key และ GAS Web App URL/token ก่อนใช้งานจริง

## สิ่งที่เพิ่ม
- หน้าแก้ไขสถานที่ `/places/[id]/edit`
- เพิ่มรูปและเปลี่ยนหน้าปกจากหน้ารายละเอียด
- ลบรูปและลบสถานที่พร้อมยืนยัน
- ดาว 5 ดวง เลือกทีละ 0.5
- ค้นหาสถานที่อัตโนมัติใต้แผนที่ด้วย debounce 500ms และแสดงหลายผลลัพธ์
- บันทึกข้อมูลหลักก่อน แล้วอัปโหลดรูปเป็น batch/concurrency เพื่อลดเวลารอ

## GAS
นำ `gas/Code.gs` ไปแทนเวอร์ชันเดิม ตั้ง Script Properties:
- `UPLOAD_TOKEN`
- `ROOT_FOLDER_ID`
แล้ว Deploy เป็น Web app เวอร์ชันใหม่


## Step 20.1 — Windows compatibility
หาก Windows Application Control บล็อก Next.js SWC native ให้ใช้ Webpack ผ่านสคริปต์ที่ตั้งไว้แล้ว:

```powershell
npm.cmd run build
npm.cmd run dev
```

สคริปต์ภายในใช้ `next build --webpack` และ `next dev --webpack`.

## Step 21 — Clean root package

ไฟล์ ZIP ของ Step 21 วางไฟล์ทั้งหมดไว้ระดับราก ไม่มีโฟลเดอร์โปรเจกต์ซ้อน และใช้ Webpack สำหรับทั้ง development และ production build เพื่อรองรับเครื่อง Windows ที่ SWC native ถูก Application Control บล็อก
