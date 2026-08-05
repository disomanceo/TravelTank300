# ติดตั้ง TravelTank300 Step 21

ชุด ZIP นี้จัดไฟล์ไว้ที่ระดับรากแล้ว ไม่มีโฟลเดอร์ `TravelTank300` ซ้อนอยู่ภายใน

## วิธีติดตั้งแบบล้างโฟลเดอร์ซ้อน

เปิด PowerShell และหยุดเซิร์ฟเวอร์เดิมด้วย `Ctrl + C` ก่อน

```powershell
# 1) สำรองโปรเจกต์เดิม
Copy-Item "D:\TravelTank300" "D:\TravelTank300-backup-step20" -Recurse -Force

# 2) ลบโฟลเดอร์ซ้อนที่เกิดจาก ZIP รอบก่อน หากมี
if (Test-Path "D:\TravelTank300\TravelTank300") {
  Remove-Item "D:\TravelTank300\TravelTank300" -Recurse -Force
}

# 3) แตก ZIP ไปยังโฟลเดอร์ชั่วคราว
$zip = "$env:USERPROFILE\Downloads\TravelTank300-step-21-clean-root.zip"
$temp = "$env:USERPROFILE\Downloads\TravelTank300-step-21-clean-root"
Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue
Expand-Archive -Path $zip -DestinationPath $temp -Force

# 4) คัดลอกไฟล์จากราก ZIP ไปทับโปรเจกต์เดิม
Copy-Item "$temp\*" "D:\TravelTank300" -Recurse -Force

# 5) เข้าโปรเจกต์และติดตั้ง
Set-Location "D:\TravelTank300"
npm.cmd install

# 6) ตรวจสอบ
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

เปิดเว็บที่ `http://localhost:3000`

## จุดตรวจสำคัญ

คำสั่งใน `package.json` ต้องแสดงดังนี้

```json
"dev": "next dev --webpack",
"build": "next build --webpack"
```

และต้องไม่มี Path แบบนี้ในผล lint:

```text
D:\TravelTank300\TravelTank300\src
```

Path ที่ถูกต้องคือ:

```text
D:\TravelTank300\src
```

## Step 22 build fix

หลังคัดลอกไฟล์ชุดนี้ ให้ตรวจดังนี้:

```powershell
npm.cmd install
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

คำสั่ง `dev` และ `build` ถูกกำหนดให้ใช้ Webpack อยู่แล้ว เพื่อหลีกเลี่ยง Turbopack ที่ถูก Windows Application Control บล็อก
