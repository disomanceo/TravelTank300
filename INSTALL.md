# ติดตั้ง Step 23

ZIP นี้ไม่มีโฟลเดอร์โปรเจกต์ซ้อน ให้แตกไฟล์แล้วคัดลอกไฟล์ทั้งหมดไปทับ `D:\TravelTank300`

```powershell
$zip = "$env:USERPROFILE\Downloads\TravelTank300-step-23-ui-restore-clean-root.zip"
$temp = "$env:USERPROFILE\Downloads\TravelTank300-step-23-temp"
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
