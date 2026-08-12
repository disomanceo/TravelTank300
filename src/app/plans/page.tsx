"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TravelHero } from "@/components/travel-hero";
import { drivePreviewUrl } from "@/lib/travel/image-url";
import { listPlans, type TravelPlanRow } from "@/lib/travel/repository";

const CURRENT_DATE = new Date().toISOString().slice(0, 10);

function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return "ยังไม่กำหนดวันเดินทาง";
  const formatter = new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const startText = start ? formatter.format(new Date(`${start}T00:00:00`)) : "";
  const endText = end ? formatter.format(new Date(`${end}T00:00:00`)) : "";
  return startText && endText && startText !== endText ? `${startText} – ${endText}` : startText || endText;
}

function formatBudget(value: number | null) {
  if (!value) return "ยังไม่ระบุงบประมาณ";
  return `งบประมาณ ${new Intl.NumberFormat("th-TH").format(value)} บาท`;
}

function planState(plan: TravelPlanRow) {
  if (!plan.end_date) return { label: "กำลังวางแผน", className: "planned" };
  if (plan.end_date < CURRENT_DATE) return { label: "เดินทางแล้ว", className: "visited" };
  return { label: "กำลังวางแผน", className: "planned" };
}

export default function PlansPage() {
  const [plans, setPlans] = useState<TravelPlanRow[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "upcoming" | "completed">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void listPlans()
      .then((rows) => {
        if (!active) return;
        setPlans(rows);
        setError("");
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "โหลดแผนการเดินทางไม่สำเร็จ");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const shown = useMemo(() => {
    const term = query.trim().toLowerCase();
    return plans.filter((plan) => {
      const completed = Boolean(plan.end_date && plan.end_date < CURRENT_DATE);
      if (tab === "upcoming" && completed) return false;
      if (tab === "completed" && !completed) return false;
      if (!term) return true;
      return `${plan.title} ${plan.location_name ?? ""} ${plan.district ?? ""} ${plan.province ?? ""} ${plan.note ?? ""}`
        .toLowerCase()
        .includes(term);
    });
  }, [plans, query, tab]);

  return (
    <main className="app-shell">
      <TravelHero title="การวางแผน" subtitle="วางแผนวันนี้ ออกเดินทางพรุ่งนี้" />
      <section className="content-area plans-content">
        <div className="search-row">
          <label className="search-box">
            <span>⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาชื่อแผน จังหวัด..."
            />
          </label>
          <Link className="icon-button" href="/plans/new" aria-label="สร้างแผนใหม่">＋</Link>
        </div>

        <div className="tabs compact-tabs plan-tabs">
          <button type="button" className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>ทั้งหมด</button>
          <button type="button" className={tab === "upcoming" ? "active" : ""} onClick={() => setTab("upcoming")}>กำลังวางแผน</button>
          <button type="button" className={tab === "completed" ? "active" : ""} onClick={() => setTab("completed")}>เดินทางแล้ว</button>
        </div>

        <div className="compact-summary">
          <span><strong>{plans.length}</strong> แผน</span>
          <span><strong>{plans.filter((plan) => plan.end_date && plan.end_date < CURRENT_DATE).length}</strong> สำเร็จ</span>
          <span><strong>{plans.reduce((sum, plan) => sum + (plan.photo_count || 0), 0)}</strong> รูปภาพ</span>
        </div>

        {loading ? (
          <p className="empty-state">กำลังโหลด…</p>
        ) : error ? (
          <div className="empty-state"><strong>โหลดข้อมูลไม่สำเร็จ</strong><p>{error}</p></div>
        ) : shown.length ? (
          <div className="compact-list">
            {shown.map((plan) => {
              const state = planState(plan);
              return (
                <Link className="place-row plan-place-row" href={`/plans/${plan.id}`} key={plan.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="place-thumb"
                    src={drivePreviewUrl(plan.cover_drive_file_id ?? null, plan.cover_image_url, 640)}
                    alt={plan.title}
                  />
                  <div className="place-row-info">
                    <div className="place-row-title">
                      <h2>{plan.title}</h2>
                      <span className={`status-chip ${state.className}`}>{state.label}</span>
                    </div>
                    <p className="place-category">
                      {plan.province || plan.location_name || "ยังไม่ระบุจุดหมาย"}
                    </p>
                    <p className="place-location">⌖ {[plan.subdistrict, plan.district, plan.province].filter(Boolean).join(" · ") || plan.location_name || "ยังไม่ระบุพื้นที่"}</p>
                    <p className="place-summary">▣ {formatDateRange(plan.start_date, plan.end_date)} · {formatBudget(plan.budget)}</p>
                    {plan.note && <p className="place-summary plan-note">{plan.note}</p>}
                  </div>
                  <span className="row-chevron">›</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <strong>ยังไม่มีแผนการเดินทาง</strong>
            <p>เพิ่มรูป เลือกจุดหมาย วันเดินทาง และงบประมาณ</p>
            <Link className="primary" href="/plans/new">สร้างแผนแรก</Link>
          </div>
        )}

        <Link className="fab" href="/plans/new" aria-label="สร้างแผน">＋</Link>
      </section>
    </main>
  );
}
