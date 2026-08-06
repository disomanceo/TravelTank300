-- TravelTank300 Step 25
-- ใช้ใน Supabase SQL Editor เฉพาะกรณีลบสถานที่แล้วขึ้นข้อความว่าไม่มีสิทธิ์
-- โปรเจกต์ปัจจุบันยังเป็นโหมดพัฒนาแบบ public/anonymous

alter table public.travel_place_photos enable row level security;
alter table public.travel_places enable row level security;

drop policy if exists "travel_place_photos_delete_public" on public.travel_place_photos;
create policy "travel_place_photos_delete_public"
on public.travel_place_photos
for delete
to anon, authenticated
using (true);

drop policy if exists "travel_places_delete_public" on public.travel_places;
create policy "travel_places_delete_public"
on public.travel_places
for delete
to anon, authenticated
using (true);

-- ควรเปลี่ยนเป็น policy แบบ user_id = auth.uid() เมื่อเพิ่มระบบล็อกอิน
