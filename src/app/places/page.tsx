"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TravelHero } from "@/components/travel-hero";
import { BottomNav } from "@/components/bottom-nav";
import { ChevronRightIcon, FilterIcon, PinIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { listPlaces, type TravelPlaceRow } from "@/lib/travel/repository";
import { coverPreviewUrl } from "@/lib/travel/image-url";

function getLocationLabel(place: TravelPlaceRow) {
  return [place.subdistrict, place.district, place.province].filter(Boolean).join(" · ") || place.location_name || "ยังไม่ระบุพื้นที่";
}

export default function PlacesPage() {
  const [places, setPlaces] = useState<TravelPlaceRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const rows = await listPlaces();
        if (active) setPlaces(rows);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("th");
    if (!normalized) return places;
    return places.filter((place) => [
      place.name,
      place.category,
      place.location_name,
      place.subdistrict,
      place.district,
      place.province,
      place.note,
    ].filter(Boolean).join(" ").toLocaleLowerCase("th").includes(normalized));
  }, [places, query]);

  return (
    <main className="app-shell">
      <TravelHero title="สถานที่ท่องเที่ยว" subtitle="เก็บทุกความทรงจำไว้ในที่เดียว" editable editHref="/places/new" />
      <section className="content-area">
        <div className="search-row">
          <label className="search-box">
            <SearchIcon />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ชื่อสถานที่ น้ำตก ทะเล ตำบล อำเภอ จังหวัด" />
            <span className="sr-only">ค้นหาสถานที่</span>
          </label>
          <button className="icon-button" aria-label="ตัวกรอง"><FilterIcon /></button>
        </div>

        <div className="quick-categories" aria-label="หมวดค้นหาด่วน">
          {["น้ำตก", "ทะเล", "ภูเขา", "อุทยาน"].map((item) => <button key={item} onClick={() => setQuery(item)}>{item}</button>)}
        </div>

        <div className="compact-summary">
          <span><strong>{filtered.length}</strong> สถานที่</span>
          <span>รูปทั้งหมด {places.reduce((sum, place) => sum + (place.photo_count ?? 0), 0)}</span>
        </div>

        {loading && <div className="data-state"><span className="loading-dot" />กำลังโหลดข้อมูลจาก Supabase…</div>}
        {error && <div className="data-state error"><strong>โหลดข้อมูลไม่สำเร็จ</strong><span>{error}</span></div>}

        {!loading && !error && <div className="place-list compact-list">
          {filtered.map((place) => (
            <Link className="place-row" href={`/places/${place.id}`} key={place.id}>
              <img className="place-thumb" loading="lazy" decoding="async" src={coverPreviewUrl(place.cover_image_url, 480)} alt={place.name} />
              <div className="place-row-info">
                <div className="place-row-title"><h2>{place.name}</h2><span className="status-chip visited">บันทึกแล้ว</span></div>
                <p className="place-category">{place.category} · {place.province || "ไม่ระบุจังหวัด"}</p>
                <p className="place-location"><PinIcon />{getLocationLabel(place)}</p>
                {place.note && <p className="place-summary">{place.note}</p>}
              </div>
              <ChevronRightIcon className="row-chevron" />
            </Link>
          ))}
        </div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state">
            <SearchIcon />
            <strong>{places.length === 0 ? "ยังไม่มีบันทึกการเดินทาง" : "ไม่พบสถานที่"}</strong>
            <p>{places.length === 0 ? "กดเครื่องหมายบวกเพื่อเพิ่มสถานที่แรก" : "ลองค้นหาด้วยชื่อ ตำบล อำเภอ หรือจังหวัด"}</p>
          </div>
        )}
      </section>
      <Link className="fab" href="/places/new" aria-label="เพิ่มสถานที่"><PlusIcon /></Link>
      <BottomNav active="places" />
    </main>
  );
}
