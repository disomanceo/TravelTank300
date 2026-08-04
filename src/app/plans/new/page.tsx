"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { TravelHero } from "@/components/travel-hero";
import { PhotoItem, PhotoPicker } from "@/components/photo-picker";
import { LocationPicker, LocationValue } from "@/components/location-picker";
import { CheckIcon } from "@/components/icons";
import { savePlan } from "@/lib/travel/repository";
import { uploadTravelPhotos } from "@/lib/travel/uploads";

const empty:LocationValue={latitude:"",longitude:"",locationName:"",subdistrict:"",district:"",province:""};

export default function NewPlanPage(){
  const router=useRouter();
  const [photos,setPhotos]=useState<PhotoItem[]>([]);
  const [coverId,setCoverId]=useState<string|null>(null);
  const [title,setTitle]=useState("");
  const [start,setStart]=useState("");
  const [end,setEnd]=useState("");
  const [budget,setBudget]=useState("");
  const [note,setNote]=useState("");
  const [location,setLocation]=useState<LocationValue>(empty);
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState(false);

  async function submit(e:FormEvent){
    e.preventDefault();
    if(!title.trim()) return setMessage("กรุณากรอกชื่อแผน");
    if(!location.latitude||!location.longitude) return setMessage("กรุณาเลือกจุดหมายบนแผนที่");
    if(start&&end&&end<start) return setMessage("วันสิ้นสุดต้องไม่น้อยกว่าวันเริ่มต้น");
    setSaving(true); setMessage("กำลังบันทึกแผน…");
    try {
      const ordered=[...photos].sort((a,b)=>a.id===coverId?-1:b.id===coverId?1:0);
      const uploaded=ordered.length?await uploadTravelPhotos(ordered.map(p=>p.file),crypto.randomUUID()):[];
      const result=await savePlan({
        title:title.trim(), startDate:start||null, endDate:end||null, budget:Number(budget||0), note:note.trim(),
        ...location, photos:uploaded, coverIndex:0,
      });
      router.push(`/plans?saved=1&mode=${result.mode}`);
    } catch(error) {
      setMessage(error instanceof Error?error.message:"บันทึกแผนไม่สำเร็จ");
      setSaving(false);
    }
  }

  return <main className="app-shell form-shell">
    <TravelHero title="วางแผนการเที่ยว" subtitle="กำหนดจุดหมาย วันเดินทาง และงบประมาณ" backHref="/plans" compact editable editHref="#plan-photo"/>
    <form className="place-form" onSubmit={submit}>
      {message&&<div className={`form-message ${saving?"":"error"}`}>{message}</div>}
      <section id="plan-photo" className="form-card">
        <div className="form-section-heading"><div><span className="form-step">1</span><h2>รูปหน้าปกแผน</h2></div><small>{photos.length} รูป</small></div>
        <PhotoPicker photos={photos} coverId={coverId} onPhotos={setPhotos} onCover={setCoverId}/>
      </section>
      <section className="form-card">
        <div className="form-section-heading"><div><span className="form-step">2</span><h2>รายละเอียดแผน</h2></div></div>
        <div className="form-grid">
          <label className="full">ชื่อแผน *<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="เช่น เที่ยวกาญจนบุรี 3 วัน 2 คืน"/></label>
          <label>วันเริ่มต้น<input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label>
          <label>วันสิ้นสุด<input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label>
          <label className="full">งบประมาณ<input type="number" min="0" value={budget} onChange={e=>setBudget(e.target.value)} placeholder="0"/></label>
          <label className="full">สิ่งที่วางแผนไว้<textarea rows={4} value={note} onChange={e=>setNote(e.target.value)} placeholder="สถานที่ย่อย ที่พัก ของที่ต้องเตรียม หรือกิจกรรม"/></label>
        </div>
      </section>
      <section className="form-card">
        <div className="form-section-heading"><div><span className="form-step">3</span><h2>จุดหมายหลัก</h2></div></div>
        <p className="field-hint">ปักหมุดจุดหมายหลัก ระบบจะเติมตำบล อำเภอ จังหวัดให้</p>
        <LocationPicker value={location} onChange={setLocation}/>
      </section>
      <div className="sticky-submit"><button type="submit" disabled={saving}><CheckIcon/>{saving?"กำลังบันทึก…":"บันทึกแผนและกลับหน้าวางแผน"}</button></div>
    </form>
  </main>;
}
