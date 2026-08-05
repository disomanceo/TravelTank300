import { getSupabaseBrowserClient } from "@/lib/supabase/client";import type{TravelLocation,UploadedPhoto}from"@/types/travel";
export type TravelPlaceRow={id:string;name:string;category:string;visit_date:string|null;rating:number|null;note:string|null;latitude:number|null;longitude:number|null;location_name:string|null;subdistrict:string|null;district:string|null;province:string|null;cover_image_url:string|null;cover_drive_file_id?:string|null;photo_count:number|null;created_at:string};
export type TravelPhotoRow={id:string;drive_file_id:string|null;drive_url:string;thumbnail_url:string|null;file_name:string|null;mime_type?:string|null;sort_order:number;is_cover:boolean};
export type PlacePayload=TravelLocation&{name:string;category:string;visitDate:string;rating:number;note:string};
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
  photo_count: number | null;
  created_at: string;
};

const db=()=>{const c=getSupabaseBrowserClient();if(!c)throw new Error("ไม่พบการตั้งค่า Supabase ใน .env.local");return c};
const row=(x:PlacePayload)=>({name:x.name,category:x.category,visit_date:x.visitDate||null,rating:x.rating,note:x.note,latitude:Number(x.latitude),longitude:Number(x.longitude),location_name:x.locationName,subdistrict:x.subdistrict,district:x.district,province:x.province});
export async function createPlace(input:PlacePayload){const s=db(),u=(await s.auth.getUser()).data.user;const{data,error}=await s.from("travel_places").insert({...row(input),user_id:u?.id??null,photo_count:0}).select("id").single();if(error)throw new Error(error.message);return data.id as string}
export async function updatePlace(id:string,input:PlacePayload){const{error}=await db().from("travel_places").update(row(input)).eq("id",id);if(error)throw new Error(error.message)}
export async function appendPlacePhotos(placeId:string,photos:UploadedPhoto[]){if(!photos.length)return;const s=db();const existing=await listPlacePhotos(placeId);const start=existing.length;const rows=photos.map((p,i)=>({place_id:placeId,drive_file_id:p.driveFileId,drive_url:p.driveUrl,thumbnail_url:p.thumbnailUrl,file_name:p.fileName,mime_type:p.mimeType,sort_order:start+i,is_cover:start===0&&i===0}));const{error}=await s.from("travel_place_photos").insert(rows);if(error)throw new Error(error.message);const cover=existing.find(p=>p.is_cover)||rows[0];const{error:e2}=await s.from("travel_places").update({photo_count:start+photos.length,...(start===0?{cover_image_url:cover.thumbnail_url||cover.drive_url,cover_drive_file_id:cover.drive_file_id}: {})}).eq("id",placeId);if(e2)throw new Error(e2.message)}
export async function setCoverPhoto(placeId:string,photo:TravelPhotoRow){const s=db();await s.from("travel_place_photos").update({is_cover:false}).eq("place_id",placeId);const{error}=await s.from("travel_place_photos").update({is_cover:true}).eq("id",photo.id);if(error)throw new Error(error.message);const{error:e}=await s.from("travel_places").update({cover_image_url:photo.thumbnail_url||photo.drive_url,cover_drive_file_id:photo.drive_file_id}).eq("id",placeId);if(e)throw new Error(e.message)}
export async function deletePhoto(placeId:string,photo:TravelPhotoRow){const s=db();const{error}=await s.from("travel_place_photos").delete().eq("id",photo.id);if(error)throw new Error(error.message);try{if(photo.drive_file_id)await fetch("/api/uploads",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({fileId:photo.drive_file_id})})}catch{}const left=(await listPlacePhotos(placeId)).filter(p=>p.id!==photo.id);if(photo.is_cover&&left[0])await setCoverPhoto(placeId,left[0]);await s.from("travel_places").update({photo_count:left.length,...(!left.length?{cover_image_url:null,cover_drive_file_id:null}:{})}).eq("id",placeId)}
export async function deletePlace(id:string){const s=db();const photos=await listPlacePhotos(id);for(const p of photos){try{if(p.drive_file_id)await fetch("/api/uploads",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({fileId:p.drive_file_id})})}catch{}}await s.from("travel_place_photos").delete().eq("place_id",id);const{error}=await s.from("travel_places").delete().eq("id",id);if(error)throw new Error(error.message)}
export async function listPlaces(){const{data,error}=await db().from("travel_places").select("*").order("created_at",{ascending:false});if(error)throw new Error(error.message);return(data??[])as TravelPlaceRow[]}
export async function getPlaceById(id:string){const{data,error}=await db().from("travel_places").select("*").eq("id",id).maybeSingle();if(error)throw new Error(error.message);return data as TravelPlaceRow|null}
export async function listPlacePhotos(id:string){const{data,error}=await db().from("travel_place_photos").select("id,drive_file_id,drive_url,thumbnail_url,file_name,mime_type,sort_order,is_cover").eq("place_id",id).order("sort_order");if(error)throw new Error(error.message);return(data??[])as TravelPhotoRow[]}


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
  const { data, error } = await db()
    .from("travel_plans")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as TravelPlanRow[];
}
