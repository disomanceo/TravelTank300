# TravelTank300 - Step 39

## Edit travel plan
- [x] Add pencil edit action on plan detail hero.
- [x] Add route `/plans/[id]/edit`.
- [x] Load existing title, dates, budget, note, and location into the edit form.
- [x] Reuse LocationPicker so the destination can be searched, pinned, or moved on the map.
- [x] Save edited plan data to `travel_plans` and verify the update returned the plan id.
- [x] Keep existing plan photos unchanged while editing plan details.
- [x] `npm run lint` passes with 0 errors (2 existing img warnings).
- [x] `npm run build` passes and includes `/plans/[id]/edit`.
- [ ] Test editing a real plan on mobile and verify the updated card on `/plans`.
- [ ] Commit/push only after real-device verification.
