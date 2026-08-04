"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarIcon, ExternalLinkIcon, MapIcon, PinIcon } from "@/components/icons";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { TravelHero } from "@/components/travel-hero";
import { getPlaceById, listPlacePhotos, type TravelPlaceRow, type TravelPhotoRow } from "@/lib/travel/repository";
import { coverPreviewUrl, drivePreviewUrl } from "@/lib/travel/image-url";

export default function PlaceDetailPage() {
  const params = useParams<{ id: string }>();
  const [place, setPlace] = useState<TravelPlaceRow | null>(null);
  const [photos, setPhotos] = useState<TravelPhotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [placeRow, photoRows] = await Promise.all([getPlaceById(params.id), listPlacePhotos(params.id)]);
        if (active) {
          setPlace(placeRow);
          setPhotos(photoRows);
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [params.id]);

  const orderedPhotos = useMemo(
    () => [...photos].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order),
    [photos],
  );

  if (loading) return <main className="app-shell"><TravelHero title="กำลังโหลด" subtitle="กำลังดึงรายละเอียดสถานที่" backHref="/places" compact /><div className="data-state"><span className="loading-dot" />กำลังโหลด…</div></main>;
  if (error || !place) return <main className="app-shell"><TravelHero title="ไม่พบข้อมูล" subtitle="ไม่สามารถเปิดสถานที่นี้ได้" backHref="/places" compact /><div className="data-state error">{error || "ไม่พบสถานที่"}</div></main>;

  const latitude = place.latitude ?? 0;
  const longitude = place.longitude ?? 0;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  const embedUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
  const coverPreview = orderedPhotos[0]
    ? drivePreviewUrl(orderedPhotos[0].drive_file_id, orderedPhotos[0].thumbnail_url || orderedPhotos[0].drive_url)
    : coverPreviewUrl(place.cover_image_url, 1280);

  function openPhoto(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  return (
    <main className="app-shell detail-shell">
      <TravelHero title={place.name} subtitle={`${place.category} · ${place.province || "ไม่ระบุจังหวัด"}`} backHref="/places" editable editHref="/places/new" />
      <section className="detail-content">
        <button className="hero-image-button" type="button" onClick={() => orderedPhotos.length && openPhoto(0)}>
          <img fetchPriority="high" decoding="async" src={coverPreview} alt={place.name} />
          <span>{orderedPhotos.length ? "กดดูรูปต้นฉบับ" : "ยังไม่มีรูปภาพ"}</span>
        </button>

        {orderedPhotos.length > 1 && (
          <div className="mini-gallery">
            {orderedPhotos.slice(0, 5).map((photo, index) => (
              <button key={photo.id} type="button" onClick={() => openPhoto(index)} aria-label={`เปิดรูปที่ ${index + 1}`}>
                <img loading="lazy" decoding="async" src={drivePreviewUrl(photo.drive_file_id, photo.thumbnail_url || photo.drive_url, 640)} alt={`${place.name} รูปที่ ${index + 1}`} />
                {index === 4 && orderedPhotos.length > 5 && <span className="gallery-more-count">+{orderedPhotos.length - 5}</span>}
              </button>
            ))}
          </div>
        )}

        <section className="detail-card place-intro">
          <div className="title-with-status"><div><span className="category-label">{place.category}</span><h2>{place.name}</h2></div><span className="status-chip visited">บันทึกแล้ว</span></div>
          <p>{place.note || "ยังไม่มีบันทึกเพิ่มเติม"}</p>
        </section>

        <section className="detail-card">
          <h2>ข้อมูลการเดินทาง</h2>
          <div className="info-grid">
            <div><CalendarIcon /><span><small>วันที่เดินทาง</small><strong>{place.visit_date || "ไม่ระบุ"}</strong></span></div>
            <div><PinIcon /><span><small>พื้นที่</small><strong>{[place.subdistrict, place.district, place.province].filter(Boolean).join(" · ") || "ไม่ระบุ"}</strong></span></div>
          </div>
        </section>

        <section className="detail-card map-card">
          <div className="map-heading"><div><span className="category-label">LOCATION</span><h2>แผนที่และพิกัด</h2></div><MapIcon /></div>
          <p className="address-line"><PinIcon />{place.location_name || "ตำแหน่งที่บันทึก"}</p>
          <div className="coordinate-row readonly-coordinates"><span>ละติจูด <strong>{latitude.toFixed(6)}</strong></span><span>ลองจิจูด <strong>{longitude.toFixed(6)}</strong></span></div>
          <div className="map-frame"><iframe title={`แผนที่ ${place.name}`} src={embedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
          <a className="maps-button" href={mapsUrl} target="_blank" rel="noreferrer"><ExternalLinkIcon /> เปิดใน Google Maps</a>
        </section>
      </section>

      <PhotoLightbox key={`${lightboxOpen}-${lightboxIndex}`} photos={orderedPhotos} placeName={place.name} initialIndex={lightboxIndex} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </main>
  );
}
