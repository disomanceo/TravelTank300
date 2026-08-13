"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TravelHero } from "@/components/travel-hero";
import { LocationPicker, type LocationValue } from "@/components/location-picker";
import { CheckIcon } from "@/components/icons";
import { getPlanById } from "@/lib/travel/repository";
import { saveEditedPlan } from "@/lib/travel/edit-plan";

const empty: LocationValue = { latitude:"", longitude:"", locationName:"", subdistrict:"", district:"", province:"" };
const t = {
  title:"\u0e41\u0e01\u0e49\u0e44\u0e02\u0e41\u0e1c\u0e19\u0e01\u0e32\u0e23\u0e40\u0e17\u0e35\u0e48\u0e22\u0e27",
  sub:"\u0e1b\u0e23\u0e31\u0e1a\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25 \u0e08\u0e38\u0e14\u0e2b\u0e21\u0e32\u0e22 \u0e27\u0e31\u0e19\u0e17\u0e35\u0e48 \u0e41\u0e25\u0e30\u0e07\u0e1a\u0e1b\u0e23\u0e30\u0e21\u0e32\u0e13",
  detail:"\u0e23\u0e32\u0e22\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14\u0e41\u0e1c\u0e19",
  name:"\u0e0a\u0e37\u0e48\u0e2d\u0e41\u0e1c\u0e19 *",
  start:"\u0e27\u0e31\u0e19\u0e40\u0e23\u0e34\u0e48\u0e21\u0e15\u0e49\u0e19",
  end:"\u0e27\u0e31\u0e19\u0e2a\u0e34\u0e49\u0e19\u0e2a\u0e38\u0e14",
  budget:"\u0e07\u0e1a\u0e1b\u0e23\u0e30\u0e21\u0e32\u0e13",
  note:"\u0e2a\u0e34\u0e48\u0e07\u0e17\u0e35\u0e48\u0e27\u0e32\u0e07\u0e41\u0e1c\u0e19\u0e44\u0e27\u0e49",
  location:"\u0e08\u0e38\u0e14\u0e2b\u0e21\u0e32\u0e22\u0e2b\u0e25\u0e31\u0e01",
  hint:"\u0e04\u0e49\u0e19\u0e2b\u0e32 \u0e1b\u0e31\u0e01\u0e2b\u0e21\u0e38\u0e14 \u0e2b\u0e23\u0e37\u0e2d\u0e25\u0e32\u0e01\u0e2b\u0e21\u0e38\u0e14\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e41\u0e01\u0e49\u0e44\u0e02\u0e15\u0e33\u0e41\u0e2b\u0e19\u0e48\u0e07",
  save:"\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e01\u0e32\u0e23\u0e41\u0e01\u0e49\u0e44\u0e02",
  saving:"\u0e01\u0e33\u0e25\u0e31\u0e07\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01...",
};

export default function EditPlanPage(){
  const {id}=useParams<{id:string}>(); const router=useRouter();
  const [title,setTitle]=useState(""); const [start,setStart]=useState(""); const [end,setEnd]=useState("");
  const [budget,setBudget]=useState(""); const [note,setNote]=useState(""); const [location,setLocation]=useState<LocationValue>(empty);
  const [message,setMessage]=useState(""); const [saving,setSaving]=useState(false); const [loading,setLoading]=useState(true);
  useEffect(()=>{let active=true; getPlanById(id).then(plan=>{if(!active)return;if(!plan){setMessage("Plan not found");return;}setTitle(plan.title||"");setStart(plan.start_date||"");setEnd(plan.end_date||"");setBudget(String(plan.budget??""));setNote(plan.note||"");setLocation({latitude:plan.latitude==null?"":String(plan.latitude),longitude:plan.longitude==null?"":String(plan.longitude),locationName:plan.location_name||"",subdistrict:plan.subdistrict||"",district:plan.district||"",province:plan.province||""});}).catch(e=>setMessage(e instanceof Error?e.message:"Load failed")).finally(()=>active&&setLoading(false));return()=>{active=false}},[id]);
  async function submit(e:FormEvent){e.preventDefault();if(!title.trim())return setMessage("Title is required");if(!location.latitude||!location.longitude)return setMessage("Location is required");if(start&&end&&end<start)return setMessage("End date must not be before start date");setSaving(true);setMessage("");try{await saveEditedPlan(id,{title:title.trim(),startDate:start||null,endDate:end||null,budget:Number(budget||0),note:note.trim(),...location});router.replace(`/plans/${id}`);router.refresh();}catch(err){setMessage(err instanceof Error?err.message:"Save failed");setSaving(false)}}
  if(loading)return <p className="loading-page">Loading...</p>;
  return <main className="app-shell form-shell"><TravelHero title={t.title} subtitle={t.sub} backHref={`/plans/${id}`} compact/><form className="place-form" onSubmit={submit}>{message&&<div className="form-message error">{message}</div>}<section className="form-card"><div className="form-section-heading"><div><span className="form-step">1</span><h2>{t.detail}</h2></div></div><div className="form-grid"><label className="full">{t.name}<input value={title} onChange={e=>setTitle(e.target.value)}/></label><label>{t.start}<input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><label>{t.end}<input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label><label className="full">{t.budget}<input type="number" min="0" value={budget} onChange={e=>setBudget(e.target.value)}/></label><label className="full">{t.note}<textarea rows={4} value={note} onChange={e=>setNote(e.target.value)}/></label></div></section><section className="form-card"><div className="form-section-heading"><div><span className="form-step">2</span><h2>{t.location}</h2></div></div><p className="field-hint">{t.hint}</p><LocationPicker value={location} onChange={setLocation}/></section><div className="sticky-submit"><button type="submit" disabled={saving}><CheckIcon/>{saving?t.saving:t.save}</button></div></form></main>;
}
