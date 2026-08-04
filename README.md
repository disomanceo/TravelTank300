# TravelTank300 — Step 12

เว็บบันทึกการท่องเที่ยวแบบ Mobile-first ใช้ Next.js, Supabase และ Google Drive ผ่าน GAS

## จุดเปลี่ยนใน Step 12

ระบบรูปภาพแบ่งเป็น 2 ระดับ:

- **Preview**: บีบอัดด้านยาวสูงสุด 1600px ใช้แสดงในหน้าเว็บเพื่อให้โหลดเร็ว
- **Original**: เก็บไฟล์ต้นฉบับ ใช้เมื่อกดเปิด Lightbox เต็มจอ

Lightbox รองรับการปัดซ้าย–ขวาบนมือถือ ปุ่มลูกศรบนคอมพิวเตอร์ ลำดับรูป และแถบภาพย่อ

## คำสั่งทดสอบ

```powershell
npm.cmd install
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

ก่อนทดสอบอัปโหลด ต้องนำ `gas/Code.gs` และ `gas/Config.gs` ไปอัปเดตใน Apps Script และ Deploy เป็น New version
