"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TravelHero } from "@/components/travel-hero";
import { drivePreviewUrl } from "@/lib/travel/image-url";
import { listPlaces, type TravelPlaceRow } from "@/lib/travel/repository";

export default function PlacesPage() {
  const [rows, setRows] = useState<TravelPlaceRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPlaces = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const nextRows = await listPlaces();
      setRows(nextRows);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "โหลดรายการสถานที่ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadPlaces(true);
    }, 0);

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void loadPlaces();
    };
    const refreshOnPageShow = () => void loadPlaces();

    window.addEventListener("focus", refreshOnPageShow);
    window.addEventListener("pageshow", refreshOnPageShow);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("focus", refreshOnPageShow);
      window.removeEventListener("pageshow", refreshOnPageShow);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadPlaces]);

  const shown = useMemo(
    () =>
      rows.filter((place) =>
        `${place.name} ${place.province ?? ""} ${place.category}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [rows, query],
  );

  return (
    <main className="app-shell">
      <TravelHero title="สถานที่ท่องเที่ยว" subtitle="เก็บทุกความทรงจำไว้ในที่เดียว" />
      <section className="content-area">
        <div className="search-row">
          <label className="search-box">
            <span>⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาสถานที่ จังหวัด..."
            />
          </label>
          <button className="icon-button" type="button" aria-label="ตัวกรอง">
            ☰
          </button>
        </div>

        <div className="tabs compact-tabs">
          <button className="active" type="button">ทั้งหมด</button>
          <button type="button">ไปแล้ว</button>
          <button type="button">อยากไป</button>
        </div>

        <div className="compact-summary">
          <span><strong>{rows.length}</strong> สถานที่</span>
          <span><strong>{new Set(rows.map((place) => place.province).filter(Boolean)).size}</strong> จังหวัด</span>
          <span><strong>{rows.reduce((total, place) => total + (place.photo_count || 0), 0)}</strong> รูปภาพ</span>
        </div>

        {loading ? (
          <p className="empty-state">กำลังโหลด…</p>
        ) : error ? (
          <div className="empty-state">
            <strong>โหลดข้อมูลไม่สำเร็จ</strong>
            <p>{error}</p>
            <button type="button" onClick={() => void loadPlaces(true)}>ลองใหม่</button>
          </div>
        ) : shown.length ? (
          <div className="compact-list">
            {shown.map((place) => (
              <Link className="place-row" href={`/places/${place.id}`} key={place.id}>
                {/* ใช้ Drive file id ก่อน URL เพื่อให้รูปหน้าปกใหม่แสดงแน่นอน */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="place-thumb"
                  src={drivePreviewUrl(
                    place.cover_drive_file_id ?? null,
                    place.cover_image_url,
                    640,
                  )}
                  alt={place.name}
                />
                <div className="place-row-info">
                  <div className="place-row-title">
                    <h2>{place.name}</h2>
                    <span className="status-chip visited">บันทึกแล้ว</span>
                  </div>
                  <p className="place-category">
                    {place.category} · {place.province || "ไม่ระบุจังหวัด"}
                  </p>
                  <p className="place-location">
                    ⌖ {[place.subdistrict, place.district, place.province].filter(Boolean).join(" · ") || "ยังไม่ระบุพื้นที่"}
                  </p>
                  <p className="place-summary">
                    ★ {(place.rating || 0).toFixed(1)} · {place.photo_count || 0} รูป
                  </p>
                </div>
                <span className="row-chevron">›</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>ยังไม่พบสถานที่</strong>
            <p>ลองเปลี่ยนคำค้นหา หรือเพิ่มสถานที่ใหม่</p>
          </div>
        )}

        <Link className="fab" href="/places/new" aria-label="เพิ่มสถานที่">＋</Link>
      </section>
    </main>
  );
}
