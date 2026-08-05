# Travel Tank300 — Step 24 ติดตั้ง

## ติดตั้งโค้ดบน Windows
```powershell
# หยุด npm run dev ด้วย Ctrl+C ก่อน
$zip = "$env:USERPROFILE\Downloads\TravelTank300-step-24-pwa-map-nav-clean-root.zip"
$temp = "$env:USERPROFILE\Downloads\TravelTank300-step-24-temp"
Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue
Expand-Archive -Path $zip -DestinationPath $temp -Force
Remove-Item "D:\TravelTank300\TravelTank300" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "$temp\*" -Destination "D:\TravelTank300" -Recurse -Force
Set-Location "D:\TravelTank300"
npm.cmd install
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```
เปิด `http://localhost:3000`

## ติดตั้งเป็นแอป Android
1. Deploy เว็บบน HTTPS เช่น Vercel
2. เปิดด้วย Chrome
3. กดเมนู ⋮ แล้วเลือก **ติดตั้งแอป** หรือ **เพิ่มลงในหน้าจอหลัก**
4. ไอคอน Travel Tank300 จะปรากฏบนหน้าจอและเปิดแบบเต็มจอ

## ติดตั้งเป็นแอป iPhone/iPad
1. เปิดเว็บ Production ด้วย Safari
2. กดปุ่ม Share
3. เลือก **Add to Home Screen / เพิ่มไปยังหน้าจอโฮม**
4. กด Add

หมายเหตุ: การติดตั้ง PWA และ GPS ต้องใช้งานผ่าน HTTPS ยกเว้น localhost
