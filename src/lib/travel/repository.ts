import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { TravelLocation, UploadedPhoto } from "@/types/travel";

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
  cover_drive_file_id?: string | null;
  photo_count: number | null;
  created_at: string;
};

export type TravelPhotoRow = {
  id: string;
  drive_file_id: string | null;
  drive_url: string;
  thumbnail_url: string | null;
  file_name: string | null;
  mime_type?: string | null;
  sort_order: number;
  is_cover: boolean;
};

type PlacePhotoCoverRow = TravelPhotoRow & { place_id: string };

export type PlacePayload = TravelLocation & {
  name: string;
  category: string;
  visitDate: string;
  rating: number;
  note: string;
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

export type TravelPlanRow = {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  note: string | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  subdistrict: string | null;
  district: string | null;
  province: string | null;
  cover_image_url: string | null;
  cover_drive_file_id?: string | null;
  photo_count: number | null;
  created_at: string;
};

export type TravelPlanPhotoRow = TravelPhotoRow & { plan_id?: string };

type PlanPhotoCoverRow = {
  plan_id: string;
  drive_file_id: string | null;
  drive_url: string;
  thumbnail_url: string | null;
  sort_order: number;
  is_cover: boolean;
};

function db() {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("ไม่พบการตั้งค่า Supabase ใน .env.local");
  return client;
}

function placeRow(input: PlacePayload) {
  return {
    name: input.name,
    category: input.category,
    visit_date: input.visitDate || null,
    rating: input.rating,
    note: input.note,
    latitude: Number(input.latitude),
    longitude: Number(input.longitude),
    location_name: input.locationName,
    subdistrict: input.subdistrict,
    district: input.district,
    province: input.province,
  };
}

export async function createPlace(input: PlacePayload) {
  const supabase = db();
  const user = (await supabase.auth.getUser()).data.user;
  const { data, error } = await supabase
    .from("travel_places")
    .insert({ ...placeRow(input), user_id: user?.id ?? null, photo_count: 0 })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updatePlace(id: string, input: PlacePayload) {
  const { error } = await db().from("travel_places").update(placeRow(input)).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function appendPlacePhotos(placeId: string, photos: UploadedPhoto[]) {
  if (!photos.length) return;
  const supabase = db();
  const existing = await listPlacePhotos(placeId);
  const start = existing.length;
  const rows = photos.map((photo, index) => ({
    place_id: placeId,
    drive_file_id: photo.driveFileId,
    drive_url: photo.driveUrl,
    thumbnail_url: photo.thumbnailUrl,
    file_name: photo.fileName,
    mime_type: photo.mimeType,
    sort_order: start + index,
    is_cover: start === 0 && index === 0,
  }));

  const { error } = await supabase.from("travel_place_photos").insert(rows);
  if (error) throw new Error(error.message);

  const firstNewPhoto = rows[0];
  const patch: Record<string, unknown> = { photo_count: start + photos.length };
  if (start === 0 && firstNewPhoto) {
    patch.cover_image_url = firstNewPhoto.thumbnail_url || firstNewPhoto.drive_url;
    patch.cover_drive_file_id = firstNewPhoto.drive_file_id;
  }

  const { error: placeError } = await supabase.from("travel_places").update(patch).eq("id", placeId);
  if (placeError) throw new Error(placeError.message);
}

export async function setCoverPhoto(placeId: string, photo: TravelPhotoRow) {
  const supabase = db();
  const { error: clearError } = await supabase
    .from("travel_place_photos")
    .update({ is_cover: false })
    .eq("place_id", placeId);
  if (clearError) throw new Error(`ยกเลิกรูปหน้าปกเดิมไม่สำเร็จ: ${clearError.message}`);

  const { data: updatedPhoto, error: coverError } = await supabase
    .from("travel_place_photos")
    .update({ is_cover: true })
    .eq("id", photo.id)
    .eq("place_id", placeId)
    .select("id")
    .maybeSingle();
  if (coverError) throw new Error(`ตั้งรูปหน้าปกไม่สำเร็จ: ${coverError.message}`);
  if (!updatedPhoto) throw new Error("ฐานข้อมูลไม่อนุญาตให้ตั้งรูปหน้าปก");

  const coverUrl = photo.thumbnail_url || photo.drive_url;
  const { data: updatedPlace, error: placeError } = await supabase
    .from("travel_places")
    .update({
      cover_image_url: coverUrl,
      cover_drive_file_id: photo.drive_file_id,
    })
    .eq("id", placeId)
    .select("id")
    .maybeSingle();
  if (placeError) throw new Error(`อัปเดตรูปหน้าปกของสถานที่ไม่สำเร็จ: ${placeError.message}`);
  if (!updatedPlace) throw new Error("ฐานข้อมูลไม่อนุญาตให้อัปเดตรูปหน้าปกของสถานที่");
}

export async function deletePhoto(placeId: string, photo: TravelPhotoRow) {
  const supabase = db();
  const { error } = await supabase.from("travel_place_photos").delete().eq("id", photo.id);
  if (error) throw new Error(error.message);

  try {
    if (photo.drive_file_id) {
      await fetch("/api/uploads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: photo.drive_file_id }),
      });
    }
  } catch {
    // การลบข้อมูลในฐานข้อมูลสำเร็จแล้ว จึงไม่ให้ปัญหา Drive ขัดขวาง UI
  }

  const remaining = await listPlacePhotos(placeId);
  const nextCover = remaining.find((item) => item.is_cover) || remaining[0];
  if (nextCover) await setCoverPhoto(placeId, nextCover);

  const patch = nextCover
    ? {
        photo_count: remaining.length,
        cover_image_url: nextCover.thumbnail_url || nextCover.drive_url,
        cover_drive_file_id: nextCover.drive_file_id,
      }
    : { photo_count: 0, cover_image_url: null, cover_drive_file_id: null };
  const { error: placeError } = await supabase.from("travel_places").update(patch).eq("id", placeId);
  if (placeError) throw new Error(placeError.message);
}

export type DeletePlaceResult = { deletedPhotoFiles: number; failedPhotoFiles: number };

export async function deletePlace(id: string): Promise<DeletePlaceResult> {
  const supabase = db();
  const photos = await listPlacePhotos(id);

  const { error: photoRowsError } = await supabase
    .from("travel_place_photos")
    .delete()
    .eq("place_id", id);
  if (photoRowsError) throw new Error(`ลบรายการรูปภาพไม่สำเร็จ: ${photoRowsError.message}`);

  const { error: placeError } = await supabase.from("travel_places").delete().eq("id", id);
  if (placeError) throw new Error(`ลบสถานที่ไม่สำเร็จ: ${placeError.message}`);

  const { data: remaining, error: verifyError } = await supabase
    .from("travel_places")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (verifyError) throw new Error(`ตรวจสอบผลการลบไม่สำเร็จ: ${verifyError.message}`);
  if (remaining) {
    throw new Error(
      "ฐานข้อมูลยังไม่อนุญาตให้ลบสถานที่ กรุณาใช้ไฟล์ supabase/step25_delete_policies.sql ตั้งค่า Delete Policy",
    );
  }

  const results = await Promise.allSettled(
    photos
      .filter((photo) => Boolean(photo.drive_file_id))
      .map(async (photo) => {
        const response = await fetch("/api/uploads", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId: photo.drive_file_id }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(payload?.message || "ลบไฟล์จาก Google Drive ไม่สำเร็จ");
        }
      }),
  );

  return {
    deletedPhotoFiles: results.filter((result) => result.status === "fulfilled").length,
    failedPhotoFiles: results.filter((result) => result.status === "rejected").length,
  };
}

export async function listPlaces(): Promise<TravelPlaceRow[]> {
  const supabase = db();
  const { data, error } = await supabase
    .from("travel_places")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const places = (data ?? []) as TravelPlaceRow[];
  if (!places.length) return places;

  // อ่าน cover จากตารางรูปโดยตรง เพื่อไม่พึ่งเฉพาะค่าที่ cache อยู่ใน travel_places
  const { data: photoData, error: photoError } = await supabase
    .from("travel_place_photos")
    .select("place_id,id,drive_file_id,drive_url,thumbnail_url,file_name,mime_type,sort_order,is_cover")
    .in("place_id", places.map((place) => place.id))
    .order("sort_order", { ascending: true });
  if (photoError) throw new Error(photoError.message);

  const photosByPlace = new Map<string, PlacePhotoCoverRow[]>();
  for (const photo of (photoData ?? []) as PlacePhotoCoverRow[]) {
    const current = photosByPlace.get(photo.place_id) ?? [];
    current.push(photo);
    photosByPlace.set(photo.place_id, current);
  }

  return places.map((place) => {
    const photos = photosByPlace.get(place.id) ?? [];
    const cover = photos.find((photo) => photo.is_cover) || photos[0];
    if (!cover) return place;
    return {
      ...place,
      cover_drive_file_id: cover.drive_file_id,
      cover_image_url: cover.thumbnail_url || cover.drive_url || place.cover_image_url,
      photo_count: photos.length,
    };
  });
}

export async function getPlaceById(id: string) {
  const { data, error } = await db().from("travel_places").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as TravelPlaceRow | null;
}

export async function listPlacePhotos(id: string) {
  const { data, error } = await db()
    .from("travel_place_photos")
    .select("id,drive_file_id,drive_url,thumbnail_url,file_name,mime_type,sort_order,is_cover")
    .eq("place_id", id)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as TravelPhotoRow[];
}

export async function savePlan(input: SavePlanInput): Promise<{ id: string; mode: "supabase" }> {
  const supabase = db();
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

  return { id: plan.id as string, mode: "supabase" };
}

export async function listPlans(): Promise<TravelPlanRow[]> {
  const supabase = db();
  const { data, error } = await supabase
    .from("travel_plans")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const plans = (data ?? []) as TravelPlanRow[];
  if (!plans.length) return plans;

  const { data: photoData, error: photoError } = await supabase
    .from("travel_plan_photos")
    .select("plan_id,drive_file_id,drive_url,thumbnail_url,sort_order,is_cover")
    .in("plan_id", plans.map((plan) => plan.id))
    .order("sort_order", { ascending: true });

  // รองรับฐานข้อมูลเก่าที่ยังไม่มีตาราง travel_plan_photos
  if (photoError) return plans;

  const photosByPlan = new Map<string, PlanPhotoCoverRow[]>();
  for (const photo of (photoData ?? []) as PlanPhotoCoverRow[]) {
    const current = photosByPlan.get(photo.plan_id) ?? [];
    current.push(photo);
    photosByPlan.set(photo.plan_id, current);
  }

  return plans.map((plan) => {
    const photos = photosByPlan.get(plan.id) ?? [];
    const cover = photos.find((photo) => photo.is_cover) || photos[0];
    if (!cover) return plan;
    return {
      ...plan,
      cover_drive_file_id: cover.drive_file_id,
      cover_image_url: cover.thumbnail_url || cover.drive_url || plan.cover_image_url,
      photo_count: photos.length,
    };
  });
}


export async function getPlanById(id: string) {
  const { data, error } = await db().from("travel_plans").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as TravelPlanRow | null;
}

export async function listPlanPhotos(id: string): Promise<TravelPlanPhotoRow[]> {
  const { data, error } = await db()
    .from("travel_plan_photos")
    .select("id,plan_id,drive_file_id,drive_url,thumbnail_url,file_name,mime_type,sort_order,is_cover")
    .eq("plan_id", id)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as TravelPlanPhotoRow[];
}

export async function appendPlanPhotos(planId: string, photos: UploadedPhoto[]) {
  if (!photos.length) return;
  const supabase = db();
  const existing = await listPlanPhotos(planId);
  const start = existing.length;
  const rows = photos.map((photo, index) => ({
    plan_id: planId,
    drive_file_id: photo.driveFileId,
    drive_url: photo.driveUrl,
    thumbnail_url: photo.thumbnailUrl,
    file_name: photo.fileName,
    mime_type: photo.mimeType,
    sort_order: start + index,
    is_cover: start === 0 && index === 0,
  }));
  const { error } = await supabase.from("travel_plan_photos").insert(rows);
  if (error) throw new Error(error.message);
  const patch: Record<string, unknown> = { photo_count: start + photos.length };
  if (start === 0) {
    patch.cover_image_url = rows[0].thumbnail_url || rows[0].drive_url;
    patch.cover_drive_file_id = rows[0].drive_file_id;
  }
  const { error: planError } = await supabase.from("travel_plans").update(patch).eq("id", planId);
  if (planError) throw new Error(planError.message);
}

export async function setPlanCoverPhoto(planId: string, photo: TravelPlanPhotoRow) {
  const supabase = db();
  const { error: clearError } = await supabase.from("travel_plan_photos").update({ is_cover: false }).eq("plan_id", planId);
  if (clearError) throw new Error(clearError.message);
  const { error } = await supabase.from("travel_plan_photos").update({ is_cover: true }).eq("id", photo.id).eq("plan_id", planId);
  if (error) throw new Error(error.message);
  const { error: planError } = await supabase.from("travel_plans").update({
    cover_image_url: photo.thumbnail_url || photo.drive_url,
    cover_drive_file_id: photo.drive_file_id,
  }).eq("id", planId);
  if (planError) throw new Error(planError.message);
}

export async function deletePlanPhoto(planId: string, photo: TravelPlanPhotoRow) {
  const supabase = db();
  const { data: deleted, error } = await supabase
    .from("travel_plan_photos")
    .delete()
    .eq("id", photo.id)
    .eq("plan_id", planId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`ลบรูปจากฐานข้อมูลไม่สำเร็จ: ${error.message}`);
  if (!deleted) throw new Error("ฐานข้อมูลไม่อนุญาตให้ลบรูป กรุณาตรวจ Delete Policy ของ travel_plan_photos");
  try {
    if (photo.drive_file_id) await fetch("/api/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileId: photo.drive_file_id }) });
  } catch {}
  const remaining = await listPlanPhotos(planId);
  let cover = remaining.find((item) => item.is_cover) || remaining[0];
  if (cover && !cover.is_cover) await setPlanCoverPhoto(planId, cover);
  const { error: planError } = await supabase.from("travel_plans").update(cover ? {
    photo_count: remaining.length,
    cover_image_url: cover.thumbnail_url || cover.drive_url,
    cover_drive_file_id: cover.drive_file_id,
  } : { photo_count: 0, cover_image_url: null, cover_drive_file_id: null }).eq("id", planId);
  if (planError) throw new Error(planError.message);
}
