-- TravelTank300 Step 38
-- Public preview policies required for editing and deleting plan photos.
-- Replace these permissive policies with owner-only auth.uid() policies when login is enabled.

alter table public.travel_plans enable row level security;
alter table public.travel_plan_photos enable row level security;

drop policy if exists "travel_plans_public_update" on public.travel_plans;
create policy "travel_plans_public_update"
on public.travel_plans
for update
to anon, authenticated
using (true)
with check (user_id is null or user_id = (select auth.uid()));

drop policy if exists "travel_plan_photos_public_update" on public.travel_plan_photos;
create policy "travel_plan_photos_public_update"
on public.travel_plan_photos
for update
to anon, authenticated
using (exists (select 1 from public.travel_plans p where p.id = plan_id))
with check (exists (select 1 from public.travel_plans p where p.id = plan_id));

drop policy if exists "travel_plan_photos_public_delete" on public.travel_plan_photos;
create policy "travel_plan_photos_public_delete"
on public.travel_plan_photos
for delete
to anon, authenticated
using (exists (select 1 from public.travel_plans p where p.id = plan_id));
