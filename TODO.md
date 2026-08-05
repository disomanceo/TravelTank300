# TravelTank300 TODO — Step 21 Clean Root

อัปเดต: 5 สิงหาคม 2569
ฐานอ้างอิงเดิม: Commit `2e1a31d`

## สิ่งที่แก้ใน Step 21

- [x] จัด ZIP แบบไฟล์อยู่ระดับราก ไม่มีโฟลเดอร์ `TravelTank300` ซ้อน
- [x] เพิ่มคำสั่งลบ `D:\TravelTank300\TravelTank300` ในคู่มือติดตั้ง
- [x] บังคับ `next dev --webpack`
- [x] บังคับ `next build --webpack`
- [x] แก้ `react-hooks/set-state-in-effect` ในหน้ารายละเอียดสถานที่
- [x] แก้ dependency warning ของ Effect โหลดรายละเอียดสถานที่
- [x] แก้ `react-hooks/set-state-in-effect` ในระบบค้นหาสถานที่
- [x] ย้ายการล้างผลค้นหาไปทำใน event handler แทน Effect
- [x] จัดรูปแบบโค้ดหน้ารายละเอียดและ LocationPicker ให้อ่านและแก้ไขต่อได้
- [x] คง Image Proxy/Drive fallback และใช้ `<img>` เฉพาะจุดที่จำเป็น

## ฟีเจอร์ที่มีในชุดนี้

- [x] เพิ่มสถานที่ท่องเที่ยว
- [x] แก้ไขข้อมูลสถานที่
- [x] เพิ่มรูปในสถานที่เดิม
- [x] ตั้งรูปหน้าปก
- [x] ลบรูป
- [x] ลบสถานที่
- [x] คะแนน 5 ดาวแบบครั้งละ 0.5
- [x] ค้นหาสถานที่อัตโนมัติแบบ debounce
- [x] แสดงหลายผลลัพธ์เมื่อชื่อซ้ำ
- [x] ใช้ Leaflet/OpenStreetMap และ API geocoding เดิม
- [x] อัปโหลดรูปเป็นชุด

## ผลตรวจในสภาพแวดล้อมสร้างไฟล์

- [ ] `npm run lint` — ยังรันไม่ได้ใน container เพราะ registry ภายในไม่มี `@supabase/supabase-js`
- [ ] `npm run build` — ต้องรันบนเครื่องผู้ใช้หลัง `npm.cmd install`
- [x] ตรวจโครง ZIP แล้ว: ไฟล์ `package.json`, `src`, `public`, `gas`, `TODO.md` อยู่ระดับราก
- [x] ตรวจ `package.json`: dev/build ใช้ Webpack

## ต้องทดสอบบนเครื่อง

```powershell
cd D:\TravelTank300
npm.cmd install
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

ผลที่ต้องการ:

- `lint` ไม่มี error `react-hooks/set-state-in-effect`
- `lint` ไม่ตรวจโฟลเดอร์ `D:\TravelTank300\TravelTank300`
- `build` แสดง `next build --webpack`
- `dev` แสดง `next dev --webpack`
- หน้า `/places/[id]` เปิดได้
- ปุ่มแก้ไข เพิ่มรูป ตั้งหน้าปก ลบรูป และลบสถานที่ทำงาน
- ค้นหาสถานที่เริ่มหลังพิมพ์อย่างน้อย 2 ตัวอักษร

## GAS

- [ ] นำ `gas/Code.gs` ไปอัปเดตใน Apps Script
- [ ] Deploy เป็น New version
- [ ] ตรวจ Script Properties: `UPLOAD_TOKEN`, `ROOT_FOLDER_ID`

## ก่อน Commit

- [ ] `npm.cmd run lint` ผ่าน
- [ ] `npm.cmd run build` ผ่าน
- [ ] ทดสอบบนมือถือ
- [ ] ตรวจรูปเก่าและ Lightbox
- [ ] ตรวจอัปโหลด 5–10 รูป

ยังไม่ Commit และยังไม่ Push จนกว่า lint/build บนเครื่องจะผ่าน

## Step 22 — Build compatibility fix (2026-08-05)

ฐานทดสอบจากเครื่องผู้ใช้: Step 21 / package version 0.2.2

### แก้แล้ว
- [x] คืน `savePlan()` ให้ `repository.ts` เพื่อรองรับหน้า `plans/new`
- [x] คืน `TravelPlanRow` และ `listPlans()` เพื่อรักษาความเข้ากันได้กับโมดูลแผนการเดินทางเดิม
- [x] ขยาย props ของ `TravelHero` ให้รองรับ `compact` และ `editable`
- [x] ระบุชนิด `PreparedPhoto[][]`, payload และผลอัปโหลดใน `uploads.ts`
- [x] รักษาคำสั่ง `next build --webpack` และ `next dev --webpack`
- [x] ZIP อยู่ระดับราก ไม่มีโฟลเดอร์โปรเจกต์ซ้อน

### ผลจากเครื่องผู้ใช้ก่อนแก้
- [x] `npm.cmd run lint`: ผ่าน 0 errors, 3 warnings
- [ ] `npm.cmd run build`: ไม่ผ่าน TypeScript เนื่องจาก `savePlan`, props ของ `TravelHero` และ implicit any ใน `uploads.ts`

### ต้องทดสอบหลังติดตั้ง Step 22
- [ ] `npm.cmd run lint`
- [ ] `npm.cmd run build`
- [ ] `npm.cmd run dev`
- [ ] เปิด `/plans`
- [ ] เปิด `/plans/new`
- [ ] เปิด `/places`
- [ ] เปิดรายละเอียดสถานที่และหน้าแก้ไข

### หมายเหตุ
- Warning เรื่อง `<img>` ยอมรับชั่วคราว เพราะระบบใช้ Google Drive Image Proxy, Preview และ Lightbox fallback
- ข้อความ SWC ถูก Windows Application Control บล็อกยังอาจแสดง แต่ Webpack สามารถใช้ WASM fallback ได้
- ห้าม Commit/Push จนกว่า build ผ่าน
