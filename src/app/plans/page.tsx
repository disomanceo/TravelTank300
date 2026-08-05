"use client";
import Link from "next/link";
import { useState } from "react";
import { TravelHero } from "@/components/travel-hero";
import { CalendarIcon, PinIcon, PlusIcon } from "@/components/icons";

const plans = [
  { id: 1, title: "เที่ยวเหนือ 4 วัน 3 คืน", locations: "เชียงใหม่ · เชียงราย · พะเยา", date: "10–13 มิ.ย. 2569", progress: 60, image: "linear-gradient(145deg,#244a34,#74a667 50%,#d0bb85)" },
  { id: 2, title: "ทะเลใต้ 3 วัน 2 คืน", locations: "กระบี่ · พังงา", date: "5–7 ก.ค. 2569", progress: 20, image: "linear-gradient(145deg,#087a9a,#55c0ce 55%,#f4d08b)" },
  { id: 3, title: "อีสานหน้าฝน 5 วัน 4 คืน", locations: "เลย · หนองคาย · บึงกาฬ", date: "15–19 ส.ค. 2569", progress: 0, image: "linear-gradient(145deg,#1f4a42,#719884 55%,#bcc6a3)" },
];

export default function PlansPage() {
  const [tab, setTab] = useState("แผนของฉัน");
  return (
    <main className="app-shell">
      <TravelHero title="การวางแผน" subtitle="วางแผนวันนี้ ออกเดินทางพรุ่งนี้" editable editHref="/plans/new" />
      <section className="content-area plans-content">
        <div className="tabs plan-tabs">
          {["แผนของฉัน", "สำเร็จแล้ว"].map((item) => (
            <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>
          ))}
        </div>
        <Link href="/plans/new" className="create-plan"><PlusIcon /><span><strong>สร้างแผนการเดินทางใหม่</strong><small>กำหนดสถานที่ วันเดินทาง และงบประมาณ</small></span></Link>
        <div className="section-title"><div><span className="eyebrow">UPCOMING TRIPS</span><h2>แผนที่กำลังเตรียม</h2></div><span className="count-pill">{plans.length} แผน</span></div>
        <div className="plan-list">
          {plans.map((plan) => (
            <Link className="plan-card" href={`/plans?selected=${plan.id}`} key={plan.id}>
              <div className="plan-image" style={{ background: plan.image }}><CalendarIcon /></div>
              <div className="plan-info"><div className="plan-title-row"><h3>{plan.title}</h3><button aria-label="เมนูเพิ่มเติม">⋮</button></div><p><PinIcon />{plan.locations}</p><p><CalendarIcon />{plan.date}</p><div className="progress-label"><span>ความคืบหน้า</span><strong>{plan.progress}%</strong></div><div className="progress"><span style={{ width: `${plan.progress}%` }} /></div></div>
            </Link>
          ))}
        </div>
      </section>
      <Link className="fab" href="/plans/new" aria-label="สร้างแผน"><PlusIcon /></Link>
    </main>
  );
}
