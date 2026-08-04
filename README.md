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

## Step 14
เพิ่ม Google Maps + Places search, หมุดลากได้, คะแนนครึ่งดาว, Hero แบบกระชับ และปรับระบบรูปให้โหลด/บันทึกเร็วขึ้น

Environment เพิ่มเติม:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

## Step 15: Google Drive image proxy

รูปจาก Google Drive จะไม่ถูกเรียกตรงจาก Browser อีกต่อไป หน้าเว็บใช้ `/api/images/[fileId]` เพื่อดึง ตรวจชนิดไฟล์ และ Cache ผ่าน Vercel CDN ช่วยแก้รูปแตกและลดเวลาโหลดซ้ำ ส่วน Lightbox จะดึงภาพต้นฉบับเมื่อเปิดดูเท่านั้น

### Step 16
Google Maps ถูกพักไว้ชั่วคราว ฟอร์มยังค้นหาสถานที่หลายรายการ ใช้ GPS และเติมข้อมูลพื้นที่ได้โดยไม่โหลด Maps JavaScript API คะแนนใช้ดาวเต็ม 5 ดวงและเลื่อนได้ทีละครึ่งดาว การอัปโหลดถูกแบ่งเป็นชุดเล็กเพื่อให้มือถือบันทึกได้เร็วและเสถียรกว่าเดิม


## Step 17 installation note
ไฟล์ ZIP รอบนี้จัดโครงสร้างแบบแบน เมื่อแตกแล้วให้คัดลอกไฟล์ภายใน `TravelTank300-step-17` ไปยังรากโปรเจกต์ และลบโฟลเดอร์ release ที่ซ้อนอยู่ในโปรเจกต์ก่อน lint/build.


## Step 18

ระบบแผนที่เปลี่ยนเป็น Leaflet + OpenStreetMap จึงไม่ต้องมี Google Maps API key หรือเปิด Billing การค้นหาสถานที่ทำงานเมื่อผู้ใช้กดปุ่มค้นหา (ไม่ยิงทุกครั้งที่พิมพ์) และผลลัพธ์ถูก cache ผ่าน Next.js API route. Lightbox จะโหลดต้นฉบับก่อนและ fallback ไปยัง preview ความละเอียดสูงอัตโนมัติ.


## Step 19
- ช่องค้นหาสถานที่แยกเต็มหนึ่งบรรทัด
- คะแนนแตะ/ลากได้ครั้งละ 0.5 ดาว
- Lightbox ใช้ภาพ Preview ความละเอียดสูงและมี GAS fallback สำหรับไฟล์ Drive ที่ URL สาธารณะเปิดไม่ได้
- ต้องอัปเดตและ Deploy GAS Code.gs เป็นเวอร์ชันใหม่
