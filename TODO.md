# TravelTank300 TODO — Step 24

## ฐานงาน
- UI Master: Commit `2e1a31d`
- ต่อจาก Step 23 ที่ lint/build ผ่าน
- Project: `D:\TravelTank300`

## ทำเสร็จใน Step 24
- [x] เพิ่ม PWA Manifest สำหรับ iOS และ Android
- [x] สร้างไอคอน 120, 152, 167, 180, 192, 384 และ 512px จากโลโก้ Travel Tank300
- [x] เพิ่ม Maskable icon สำหรับ Android
- [x] เพิ่ม Apple Touch Icon และ metadata แบบ standalone
- [x] เพิ่ม Service Worker สำหรับ App Shell และ Offline fallback เบื้องต้น
- [x] แก้ LocationPicker จาก Placeholder เป็น Leaflet/OpenStreetMap จริง
- [x] แตะแผนที่เพื่อปักหมุดได้
- [x] ลากหมุดเพื่อปรับพิกัดได้
- [x] GPS เลื่อนแผนที่และหมุดไปยังตำแหน่งปัจจุบัน
- [x] Reverse geocoding หลังแตะ/ลากหมุด
- [x] ช่องค้นหาสถานที่อยู่ใต้แผนที่
- [x] Bottom Navigation อยู่ใน Root Layout จึงแสดงทุกหน้า
- [x] รองรับ Safe Area ของ iPhone
- [x] ZIP ไม่มีโฟลเดอร์โปรเจกต์ซ้อน

## ต้องทดสอบบนเครื่อง
- [ ] `npm.cmd run lint`
- [ ] `npm.cmd run build`
- [ ] เปิด `/places/new` แล้วเห็นแผนที่จริง
- [ ] แตะแผนที่และลากหมุด
- [ ] ค้นหาสถานที่จากช่องใต้แผนที่
- [ ] ตรวจ Bottom Navigation ที่ `/places`, `/places/new`, `/places/[id]`, `/places/[id]/edit`, `/plans`, `/plans/new`
- [ ] Deploy Production HTTPS และทดสอบติดตั้ง Android
- [ ] ทดสอบ Add to Home Screen บน iPhone

## ข้อควรระวัง
- Leaflet โหลด CSS/JS จาก unpkg CDN ต้องมีอินเทอร์เน็ตในการเปิดแผนที่ครั้งแรก
- Nominatim เป็นบริการสาธารณะ ควรจำกัดความถี่และคง debounce 500ms
- SWC native ถูก Windows Application Control บล็อกได้ แต่ใช้ Webpack + WASM build ได้
- ยังไม่ Commit/Push จนกว่า lint และ build ผ่าน

## งานถัดไป
- [ ] ทดสอบ PWA บน Production จริง
- [ ] ทำ Offline queue สำหรับการบันทึกและอัปโหลดรูป
- [ ] เพิ่มปุ่มติดตั้งแอปภายใน UI สำหรับ Android
- [ ] เพิ่ม Background Sync/Retry

## Step 24.1 — Build compatibility fix
- [x] แก้หน้า `/plans` ไม่ให้เรียก `<BottomNav active="plans" />` แบบเดิม
- [x] ใช้ Bottom Navigation ส่วนกลางจาก Root Layout เพียงชุดเดียว
- [x] ป้องกันเมนูด้านล่างซ้ำในหน้าแผนการเดินทาง
- [x] แก้ TypeScript error `Property 'active' does not exist`
- [ ] รัน `npm.cmd run lint`
- [ ] รัน `npm.cmd run build`
- [ ] ตรวจ `/plans` และ `/plans/new` ว่ามี Bottom Navigation เพียงหนึ่งชุด
