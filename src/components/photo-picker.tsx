"use client";
import { ChangeEvent, useMemo, useState } from "react";
import { CameraIcon, ImageIcon, TrashIcon } from "./icons";

export type PhotoItem = { id: string; file: File; previewUrl: string };
type Props = { photos: PhotoItem[]; coverId: string | null; onPhotos: (photos: PhotoItem[]) => void; onCover: (id: string) => void };

export function PhotoPicker({ photos, coverId, onPhotos, onCover }: Props) {
  const [showAll, setShowAll] = useState(false);
  const ordered = useMemo(()=>[...photos].sort((a,b)=>a.id===coverId?-1:b.id===coverId?1:0),[photos,coverId]);
  function add(event: ChangeEvent<HTMLInputElement>) {
    const items = Array.from(event.target.files ?? []).map(file=>({id:crypto.randomUUID(),file,previewUrl:URL.createObjectURL(file)}));
    if (!coverId && items[0]) onCover(items[0].id);
    onPhotos([...photos,...items]); event.target.value="";
  }
  function remove(id:string){ const found=photos.find(p=>p.id===id); if(found) URL.revokeObjectURL(found.previewUrl); const next=photos.filter(p=>p.id!==id); onPhotos(next); if(id===coverId && next[0]) onCover(next[0].id); }
  const visible=showAll?ordered:ordered.slice(0,5);
  return <div>
    <div className="photo-action-row">
      <label className="photo-action primary"><CameraIcon/><span>ถ่ายรูป</span><input type="file" accept="image/*" capture="environment" multiple onChange={add}/></label>
      <label className="photo-action"><ImageIcon/><span>เลือกหลายรูป</span><input type="file" accept="image/*" multiple onChange={add}/></label>
    </div>
    {visible.length>0 && <div className="compact-gallery">
      {visible.map((photo,index)=><article className={photo.id===coverId?"gallery-thumb cover":"gallery-thumb"} key={photo.id}>
        <img src={photo.previewUrl} alt={`รูป ${index+1}`}/><span>{photo.id===coverId?"หน้าปก":`รูป ${index+1}`}</span>
        <div><button type="button" onClick={()=>onCover(photo.id)}>หน้าปก</button><button type="button" onClick={()=>remove(photo.id)}><TrashIcon/></button></div>
      </article>)}
      {!showAll && photos.length>5 && <button type="button" className="more-photos" onClick={()=>setShowAll(true)}>+{photos.length-5}<small>ดูรูปเพิ่ม</small></button>}
    </div>}
    {showAll && photos.length>5 && <button type="button" className="collapse-gallery" onClick={()=>setShowAll(false)}>แสดงเฉพาะ 5 รูป</button>}
  </div>;
}
