import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { LocationValue } from "@/components/location-picker";

export type EditPlanInput = LocationValue & {
  title: string;
  startDate: string | null;
  endDate: string | null;
  budget: number;
  note: string;
};

export async function saveEditedPlan(id: string, input: EditPlanInput) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Supabase is not configured");
  const patch = {
    title: input.title,
    start_date: input.startDate,
    end_date: input.endDate,
    budget: input.budget,
    note: input.note,
    latitude: Number(input.latitude),
    longitude: Number(input.longitude),
    location_name: input.locationName,
    subdistrict: input.subdistrict,
    district: input.district,
    province: input.province,
  };
  const result = await client.from("travel_plans").update(patch).eq("id", id).select("id").maybeSingle();
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw new Error("Plan edit was not permitted by the database policy");
}
