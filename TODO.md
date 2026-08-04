# TravelTank300 TODO — Step 14

## เสร็จแล้ว
- [x] ลดความสูง Hero ทุกหน้าให้เหลือประมาณ 2–3 แถว
- [x] แยกช่องค้นหาตำแหน่งเป็นอีกหนึ่งบรรทัด
- [x] รองรับ Google Maps JavaScript API, Places search และหมุดลากได้
- [x] แสดงผลค้นหาสถานที่หลายรายการ
- [x] เติมตำบล อำเภอ จังหวัด ละติจูด และลองจิจูดอัตโนมัติ
- [x] รองรับคะแนนครั้งละ 0.5 ดาว
- [x] แก้ Lightbox ให้ใช้ URL ภาพความละเอียดสูงที่แสดงใน `<img>` ได้
- [x] ลด Preview เป็น 1280px / JPEG 0.72 เพื่อโหลดและอัปโหลดเร็วขึ้น
- [x] เพิ่ม Batch ฝั่ง API เป็น 5 คู่รูปต่อคำขอ GAS

## ต้องตั้งค่า
- [ ] เพิ่ม `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` ใน `.env.local` และ Vercel
- [ ] เปิด Google Maps JavaScript API และ Places API สำหรับ API Key

## ทดสอบก่อน Commit
- [ ] `npm.cmd run lint`
- [ ] `npm.cmd run build`
- [ ] ค้นหาชื่อสถานที่/จังหวัดแล้วเห็นหลายตัวเลือก
- [ ] เลือกผลลัพธ์แล้วหมุดย้ายและข้อมูลพื้นที่เติมอัตโนมัติ
- [ ] ลากหมุดแล้วพิกัดเปลี่ยน
- [ ] เลือกคะแนน 4.5 ดาว
- [ ] กดรูปในหน้ารายละเอียดแล้ว Lightbox แสดงและปัดได้
- [ ] ทดสอบอัปโหลด 5–10 รูปและจับเวลา

## งานถัดไป
- [ ] สร้าง Thumbnail แยก 320px ใน Google Drive
- [ ] Background upload/retry สำหรับอินเทอร์เน็ตไม่เสถียร
- [ ] หน้าแก้ไขสถานที่และเปลี่ยนรูปหน้าปก

## Step 15 — Drive image proxy and cache

- [x] แก้รูป Google Drive ไม่แสดงในหน้าแรกและหน้ารายละเอียด
- [x] เพิ่ม `/api/images/[fileId]` เป็น Image Proxy ฝั่ง Next.js
- [x] ตรวจ Content-Type ก่อนส่งภาพ ป้องกันหน้า HTML ของ Google ถูกใช้เป็นรูป
- [x] ใช้ Preview file ID จาก `thumbnail_url` แทน Original ID เมื่อแสดงภาพย่อ
- [x] Lightbox โหลด Original เฉพาะเมื่อผู้ใช้กดดูเต็มจอ
- [x] เพิ่ม Vercel CDN cache 7 วัน และ stale-while-revalidate
- [x] เพิ่ม lazy loading และ async image decoding
- [ ] ทดสอบรูปเก่าทุกชุดบน Production หลัง Deploy

## Step 16 — 2026-08-04
- [x] พักการโหลด Google Maps เพื่อไม่ให้หน้าฟอร์มขึ้นข้อผิดพลาด API
- [x] ค้นหาสถานที่หลายผลลัพธ์ด้วยข้อมูลแผนที่สาธารณะและเติมพิกัดอัตโนมัติ
- [x] ใช้ GPS ปัจจุบันและเติมตำบล อำเภอ จังหวัดอัตโนมัติ
- [x] คะแนนแสดงดาว 5 ดวงเต็ม และเลื่อนค่าได้ทีละ 0.5
- [x] ลด Preview เหลือด้านยาว 1120px คุณภาพ 0.68 เพื่อโหลดเร็วขึ้น
- [x] แบ่งอัปโหลดฝั่งมือถือครั้งละ 3 รูป พร้อมกันสูงสุด 2 ชุด
- [x] แสดงเปอร์เซ็นต์ระหว่างเตรียมและอัปโหลดรูป
- [ ] กลับมาเปิด Google Maps หลังตั้งค่า API Key และ Billing พร้อม


## Step 17 - Build Fix
- [x] แก้ ESLint set-state-in-effect ใน LocationPicker
- [x] แก้ Lightbox ไม่ให้ setState โดยตรงใน effect
- [x] แก้ no-unused-expressions ใน gesture swipe
- [x] จัด ZIP ให้ไฟล์อยู่ระดับราก ไม่ซ้อนโฟลเดอร์ release
- [x] ป้องกัน TypeScript ตรวจโฟลเดอร์ TravelTank300-step-* และ backup


## Step 18 - Lightbox fallback + OpenStreetMap
- [x] แก้ Lightbox ให้ลองรูปต้นฉบับก่อน และสลับเป็น Preview ความละเอียดสูงอัตโนมัติเมื่อ Google Drive ต้นฉบับเปิดไม่ได้
- [x] เพิ่ม loading state และข้อความภาพสำรองใน Lightbox
- [x] เพิ่ม URL Google Drive สำรองหลายรูปแบบใน Image Proxy
- [x] เปลี่ยนแผนที่เป็น Leaflet + OpenStreetMap ไม่ต้องใช้ Google Maps API key หรือ Billing
- [x] เพิ่มค้นหาสถานที่แบบกดปุ่มและแสดงหลายผลลัพธ์
- [x] แตะแผนที่และลากหมุดเพื่อเติมพิกัด/พื้นที่อัตโนมัติ
- [x] เพิ่ม API proxy geocoding พร้อม cache เพื่อลดการเรียกบริการสาธารณะซ้ำ
- [ ] หากมีผู้ใช้จำนวนมาก ให้ย้าย geocoding ไปผู้ให้บริการเฉพาะหรือโฮสต์ Nominatim เอง


## Step 19
- ช่องค้นหาสถานที่แยกเต็มหนึ่งบรรทัด
- คะแนนแตะ/ลากได้ครั้งละ 0.5 ดาว
- Lightbox ใช้ภาพ Preview ความละเอียดสูงและมี GAS fallback สำหรับไฟล์ Drive ที่ URL สาธารณะเปิดไม่ได้
- ต้องอัปเดตและ Deploy GAS Code.gs เป็นเวอร์ชันใหม่
