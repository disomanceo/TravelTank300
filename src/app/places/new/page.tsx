"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { TravelHero } from "@/components/travel-hero";
import { LocationPicker, LocationValue } from "@/components/location-picker";
import { PhotoItem, PhotoPicker } from "@/components/photo-picker";
import { CheckIcon } from "@/components/icons";
import { RatingSlider } from "@/components/rating-slider";
import { savePlace } from "@/lib/travel/repository";
import { uploadTravelPhotos } from "@/lib/travel/uploads";

const categories = ["อุทยานแห่งชาติ","น้ำตก","ทะเลและชายหาด","ภูเขาและจุดชมวิว","วัดและศาสนสถาน","คาเฟ่และร้านอาหาร","จุดกางเต็นท์","สถานที่อื่น ๆ"];
const emptyLocation: LocationValue = { latitude:"", longitude:"", locationName:"", subdistrict:"", district:"", province:"" };
function today(){ const d=new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); }

export default function NewPlacePage(){
  const router=useRouter();
  const [photos,setPhotos]=useState<PhotoItem[]>([]);
  const [coverId,setCoverId]=useState<string|null>(null);
  const [name,setName]=useState("");
  const [category,setCategory]=useState(categories[0]);
  const [date,setDate]=useState(today());
  const [rating,setRating]=useState(0);
  const [note,setNote]=useState("");
  const [location,setLocation]=useState<LocationValue>(emptyLocation);
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState(false);

  async function submit(e:FormEvent){
    e.preventDefault();
    if(!name.trim()) return setMessage("กรุณากรอกชื่อสถานที่");
    if(!coverId) return setMessage("กรุณาเพิ่มรูปหน้าปกอย่างน้อย 1 รูป");
    if(!location.latitude||!location.longitude) return setMessage("กรุณาปักหมุดตำแหน่งบนแผนที่");
    setSaving(true); setMessage("กำลังบันทึกข้อมูล…");
    try {
      const ordered = [...photos].sort((a,b)=>a.id===coverId?-1:b.id===coverId?1:0);
      const uploaded = await uploadTravelPhotos(ordered.map(p=>p.file), crypto.randomUUID(), (done,total)=>{
        const percent=Math.round((done/total)*100);
        setMessage(`กำลังเตรียมและอัปโหลดรูป ${percent}%`);
      });
      const result = await savePlace({
        name:name.trim(), category, visitDate:date, rating, note:note.trim(), ...location,
        photos:uploaded, coverIndex:0,
      });
      router.push(`/places?saved=1&mode=${result.mode}`);
    } catch(error) {
      setMessage(error instanceof Error ? error.message : "บันทึกข้อมูลไม่สำเร็จ");
      setSaving(false);
    }
  }

  return <main className="app-shell form-shell">
    <TravelHero title="บันทึกการท่องเที่ยว" subtitle="เพิ่มรูป ปักหมุด และบันทึกความทรงจำ" backHref="/places" compact editable editHref="#photo-section"/>
    <form className="place-form" onSubmit={submit}>
      {message&&<div className={`form-message ${saving?"":"error"}`}><span>{message}</span></div>}
      <section id="photo-section" className="form-card">
        <div className="form-section-heading"><div><span className="form-step">1</span><h2>รูปภาพ</h2></div><small>{photos.length} รูป</small></div>
        <p className="field-hint">เพิ่มได้หลายรูป แสดงตัวอย่าง 5 รูป และรูปแรกใช้เป็นหน้าปก</p>
        <PhotoPicker photos={photos} coverId={coverId} onPhotos={setPhotos} onCover={setCoverId}/>
      </section>
      <section className="form-card">
        <div className="form-section-heading"><div><span className="form-step">2</span><h2>ข้อมูลสำคัญ</h2></div></div>
        <div className="form-grid">
          <label className="full">ชื่อสถานที่ *<input value={name} onChange={e=>setName(e.target.value)} placeholder="เช่น น้ำตกเอราวัณ"/></label>
          <label>หมวด<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
          <label>วันที่เดินทาง<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
          <div className="full rating-field"><span>ความประทับใจ <strong>{rating.toFixed(1)}</strong></span><RatingSlider value={rating} onChange={setRating}/></div>
          <label className="full">บันทึกสั้น ๆ<textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder="ความประทับใจ สิ่งที่ควรรู้ หรือสิ่งที่อยากจำ"/></label>
        </div>
      </section>
      <section className="form-card">
        <div className="form-section-heading"><div><span className="form-step">3</span><h2>ตำแหน่งสถานที่</h2></div></div>
        <p className="field-hint">พิมพ์ชื่อสถานที่ ตำบล อำเภอ หรือจังหวัด แล้วเลือกจากหลายผลลัพธ์ ระบบจะเติมพิกัดและพื้นที่ให้อัตโนมัติ</p>
        <LocationPicker value={location} onChange={setLocation} onSelectName={(selected)=>{ if(!name.trim()) setName(selected); }}/>
      </section>
      <div className="sticky-submit"><button type="submit" disabled={saving}><CheckIcon/>{saving?"กำลังบันทึก…":"บันทึกและกลับหน้าแรก"}</button></div>
    </form>
  </main>;
}
