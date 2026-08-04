import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { TravelLocation, UploadedPhoto } from "@/types/travel";

export type SavePlaceInput = TravelLocation & {
  name: string;
  category: string;
  visitDate: string;
  rating: number;
  note: string;
  photos: UploadedPhoto[];
  coverIndex: number;
};

export type SavePlanInput = TravelLocation & {
  title: string;
  startDate: string | null;
  endDate: string | null;
  budget: number;
  note: string;
  photos: UploadedPhoto[];
  coverIndex: number;
};

export type TravelPlaceRow = {
  id: string;
  name: string;
  category: string;
  visit_date: string | null;
  rating: number | null;
  note: string | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  subdistrict: string | null;
  district: string | null;
  province: string | null;
  cover_image_url: string | null;
  photo_count: number | null;
  created_at: string;
};

export type TravelPhotoRow = {
  id: string;
  drive_file_id: string | null;
  drive_url: string;
  thumbnail_url: string | null;
  file_name: string | null;
  sort_order: number;
  is_cover: boolean;
};

export type TravelPlanRow = {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  note: string | null;
  province: string | null;
  district: string | null;
  cover_image_url: string | null;
  photo_count: number | null;
  created_at: string;
};

function requireSupabase() {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("ไม่พบการตั้งค่า Supabase ใน .env.local");
  return client;
}

export async function savePlace(input: SavePlaceInput): Promise<{ id: string; mode: "supabase" }> {
  const supabase = requireSupabase();
  const user = (await supabase.auth.getUser()).data.user;
  const cover = input.photos[input.coverIndex];

  const { data: place, error } = await supabase
    .from("travel_places")
    .insert({
      user_id: user?.id ?? null,
      name: input.name,
      category: input.category,
      visit_date: input.visitDate,
      rating: input.rating,
      note: input.note,
      latitude: Number(input.latitude),
      longitude: Number(input.longitude),
      location_name: input.locationName,
      subdistrict: input.subdistrict,
      district: input.district,
      province: input.province,
      cover_image_url: cover?.thumbnailUrl || cover?.driveUrl || null,
      cover_drive_file_id: cover?.driveFileId || null,
      photo_count: input.photos.length,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (input.photos.length) {
    const rows = input.photos.map((photo, index) => ({
      place_id: place.id,
      drive_file_id: photo.driveFileId,
      drive_url: photo.driveUrl,
      thumbnail_url: photo.thumbnailUrl,
      file_name: photo.fileName,
      mime_type: photo.mimeType,
      sort_order: index,
      is_cover: index === input.coverIndex,
    }));
    const { error: photoError } = await supabase.from("travel_place_photos").insert(rows);
    if (photoError) throw new Error(photoError.message);
  }

  return { id: place.id, mode: "supabase" };
}

export async function savePlan(input: SavePlanInput): Promise<{ id: string; mode: "supabase" }> {
  const supabase = requireSupabase();
  const user = (await supabase.auth.getUser()).data.user;
  const cover = input.photos[input.coverIndex];

  const { data: plan, error } = await supabase
    .from("travel_plans")
    .insert({
      user_id: user?.id ?? null,
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
      cover_image_url: cover?.thumbnailUrl || cover?.driveUrl || null,
      cover_drive_file_id: cover?.driveFileId || null,
      photo_count: input.photos.length,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (input.photos.length) {
    const rows = input.photos.map((photo, index) => ({
      plan_id: plan.id,
      drive_file_id: photo.driveFileId,
      drive_url: photo.driveUrl,
      thumbnail_url: photo.thumbnailUrl,
      file_name: photo.fileName,
      mime_type: photo.mimeType,
      sort_order: index,
      is_cover: index === input.coverIndex,
    }));
    const { error: photoError } = await supabase.from("travel_plan_photos").insert(rows);
    if (photoError) throw new Error(photoError.message);
  }

  return { id: plan.id, mode: "supabase" };
}

export async function listPlaces(): Promise<TravelPlaceRow[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("travel_places")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as TravelPlaceRow[];
}

export async function listPlans(): Promise<TravelPlanRow[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("travel_plans")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as TravelPlanRow[];
}


export async function getPlaceById(id: string): Promise<TravelPlaceRow | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("travel_places").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as TravelPlaceRow | null;
}

export async function listPlacePhotos(placeId: string): Promise<TravelPhotoRow[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("travel_place_photos").select("id, drive_file_id, drive_url, thumbnail_url, file_name, sort_order, is_cover").eq("place_id", placeId).order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TravelPhotoRow[];
}
