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
