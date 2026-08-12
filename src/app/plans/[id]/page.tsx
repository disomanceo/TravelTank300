"use client";

import { ChangeEvent, type CSSProperties, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { TravelHero } from "@/components/travel-hero";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { drivePreviewUrl } from "@/lib/travel/image-url";
import {
  appendPlanPhotos,
  deletePlanPhoto,
  getPlanById,
  listPlanPhotos,
  setPlanCoverPhoto,
  type TravelPlanPhotoRow,
  type TravelPlanRow,
} from "@/lib/travel/repository";
import { uploadTravelPhotos } from "@/lib/travel/uploads";

function PlusIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>}
function TrashIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5"/></svg>}

function formatDate(value:string|null){return value?new Intl.DateTimeFormat("th-TH",{day:"numeric",month:"short",year:"numeric"}).format(new Date(`${value}T00:00:00`)):"ยังไม่กำหนด"}

export default function PlanDetailPage(){
  const {id}=useParams<{id:string}>();
  const inputRef=useRef<HTMLInputElement>(null);
  const [plan,setPlan]=useState<TravelPlanRow|null>(null);
  const [photos,setPhotos]=useState<TravelPlanPhotoRow[]>([]);
  const [selected,setSelected]=useState<string|null>(null);
  const [lightbox,setLightbox]=useState<number|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [progress,setProgress]=useState<{done:number;total:number}|null>(null);

  async function reload(){const [nextPlan,nextPhotos]=await Promise.all([getPlanById(id),listPlanPhotos(id)]);setPlan(nextPlan);setPhotos(nextPhotos)}
  useEffect(()=>{let active=true;Promise.all([getPlanById(id),listPlanPhotos(id)]).then(([nextPlan,nextPhotos])=>{if(active){setPlan(nextPlan);setPhotos(nextPhotos)}}).catch((error:unknown)=>active&&setMessage(error instanceof Error?error.message:"โหลดแผนไม่สำเร็จ"));return()=>{active=false}},[id]);

  async function addPhotos(event:ChangeEvent<HTMLInputElement>){
    const files=Array.from(event.target.files??[]).filter(file=>file.type.startsWith("image/"));event.target.value="";if(!files.length||busy)return;
    setBusy(true);setProgress({done:0,total:files.length});setMessage("กำลังเตรียมรูปภาพ…");
    try{const uploaded=await uploadTravelPhotos(files,id,(done,total)=>{setProgress({done,total});setMessage(done===total?"กำลังบันทึกรูป…":"กำลังอัปโหลดรูปภาพ…")},plan?.title||"แผนการเดินทาง");await appendPlanPhotos(id,uploaded);await reload();setMessage(`เพิ่มรูปเรียบร้อย ${uploaded.length} รูป`)}
    catch(error){setMessage(error instanceof Error?error.message:"เพิ่มรูปไม่สำเร็จ")}finally{setBusy(false);window.setTimeout(()=>setProgress(null),1200)}
  }
  async function makeCover(photo:TravelPlanPhotoRow){if(busy||photo.is_cover)return;setBusy(true);try{await setPlanCoverPhoto(id,photo);await reload();setSelected(null);setMessage("เปลี่ยนรูปหน้าปกเรียบร้อย")}catch(error){setMessage(error instanceof Error?error.message:"เปลี่ยนรูปหน้าปกไม่สำเร็จ")}finally{setBusy(false)}}
  async function removePhoto(photo:TravelPlanPhotoRow){if(busy||!window.confirm("ต้องการลบรูปนี้หรือไม่"))return;setBusy(true);try{await deletePlanPhoto(id,photo);await reload();setMessage("ลบรูปเรียบร้อย")}catch(error){setMessage(error instanceof Error?error.message:"ลบรูปไม่สำเร็จ")}finally{setBusy(false)}}

  if(!plan)return <p className="loading-page">{message||"กำลังโหลด…"}</p>;
  return <main>
    <TravelHero title={plan.title} subtitle={plan.province||plan.location_name||"แผนการเดินทาง"} backHref="/plans"/>
    <section className="content place-detail-content">
      <section className="card place-photo-card">
        <div className="card-title-row"><h2>รูปภาพแผนการเดินทาง</h2><small>{photos.length} รูป</small></div>
        <input ref={inputRef} hidden type="file" accept="image/*" multiple capture="environment" onChange={addPhotos}/>
        <div className="detail-photo-grid">
          {photos.map((photo,index)=><article key={photo.id} className={`detail-photo-tile${selected===photo.id?" selected":""}`}>
            <button type="button" className="detail-photo-select" onClick={()=>setLightbox(index)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={drivePreviewUrl(photo.drive_file_id,photo.thumbnail_url||photo.drive_url,480)} alt={`${plan.title} รูปที่ ${index+1}`} loading={index===0?"eager":"lazy"}/>
            </button>
            <button type="button" className="photo-trash-button" disabled={busy} onClick={()=>void removePhoto(photo)} aria-label="ลบรูป"><TrashIcon/></button>
            {photo.is_cover?<span className="cover-status-badge">รูปหน้าปก</span>:<>
              <button type="button" className={`cover-choice-button${selected===photo.id?" active":""}`} onClick={()=>setSelected(current=>current===photo.id?null:photo.id)}>☆</button>
              {selected===photo.id&&<button type="button" className="set-cover-button" disabled={busy} onClick={()=>void makeCover(photo)}>ตั้งรูปหน้าปก</button>}
            </>}
          </article>)}
          <button type="button" className="add-photo-tile" disabled={busy} onClick={()=>inputRef.current?.click()}><span><PlusIcon/></span><small>{busy?"กำลังอัปโหลด":"เพิ่มรูป"}</small></button>
        </div>
        {progress&&<div className="upload-gauge-panel"><div className="upload-gauge" style={{"--upload-progress":`${Math.round(progress.done/Math.max(progress.total,1)*100)}%`} as CSSProperties}><span>{Math.round(progress.done/Math.max(progress.total,1)*100)}%</span></div><div className="upload-gauge-copy"><strong>{busy?"กำลังอัปโหลดรูปภาพ":"อัปโหลดเสร็จแล้ว"}</strong><span>{progress.done} / {progress.total} รูป</span></div></div>}
        {message&&<p className="detail-photo-message">{message}</p>}
      </section>
      <section className="card detail-info-card"><h2>รายละเอียดแผน</h2><p>{plan.note||"ยังไม่มีรายละเอียด"}</p><p>📅 {formatDate(plan.start_date)} – {formatDate(plan.end_date)}</p><p>💰 {new Intl.NumberFormat("th-TH").format(plan.budget||0)} บาท</p><p>⌖ {[plan.subdistrict,plan.district,plan.province].filter(Boolean).join(" · ")||plan.location_name}</p></section>
    </section>
    {lightbox!==null&&<PhotoLightbox photos={photos} index={lightbox} onClose={()=>setLightbox(null)}/>}
  </main>
}
