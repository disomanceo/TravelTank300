"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TravelHero } from "@/components/travel-hero";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { PhotoPicker, type PhotoItem } from "@/components/photo-picker";
import { drivePreviewUrl } from "@/lib/travel/image-url";
import {
  appendPlacePhotos,
  deletePhoto,
  deletePlace,
  getPlaceById,
  listPlacePhotos,
  setCoverPhoto,
  type TravelPhotoRow,
  type TravelPlaceRow,
} from "@/lib/travel/repository";
import { uploadTravelPhotos } from "@/lib/travel/uploads";

export default function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [place, setPlace] = useState<TravelPlaceRow | null>(null);
  const [photos, setPhotos] = useState<TravelPhotoRow[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [newPhotos, setNewPhotos] = useState<PhotoItem[]>([]);
  const [coverId, setCoverId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([getPlaceById(id), listPlacePhotos(id)])
      .then(([nextPlace, nextPhotos]) => {
        if (!active) return;
        setPlace(nextPlace);
        setPhotos(nextPhotos);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ");
      });

    return () => {
      active = false;
    };
  }, [id]);

  async function reload() {
    const [nextPlace, nextPhotos] = await Promise.all([
      getPlaceById(id),
      listPlacePhotos(id),
    ]);
    setPlace(nextPlace);
    setPhotos(nextPhotos);
  }

  if (!place) {
    return <p className="loading-page">{message || "กำลังโหลด…"}</p>;
  }

  return (
    <main>
      <TravelHero
        title={place.name}
        subtitle={`${place.category} · ${place.province || "ไม่ระบุจังหวัด"}`}
        backHref="/places"
        editHref={`/places/${id}/edit`}
      />

      <section className="content">
        <section className="card">
          <div className="gallery">
            {photos.map((photo, index) => (
              <div key={photo.id}>
                <button type="button" onClick={() => setLightboxIndex(index)}>
                  {/* Drive proxy/fallback ต้องใช้ img โดยตรง */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={drivePreviewUrl(
                      photo.drive_file_id,
                      photo.thumbnail_url || photo.drive_url,
                    )}
                    alt={`${place.name} รูปที่ ${index + 1}`}
                  />
                </button>
                <div>
                  <button
                    type="button"
                    disabled={photo.is_cover || busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await setCoverPhoto(id, photo);
                        await reload();
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {photo.is_cover ? "หน้าปก" : "ตั้งหน้าปก"}
                  </button>
                  <button
                    type="button"
                    className="danger-text"
                    disabled={busy}
                    onClick={async () => {
                      const confirmed = window.confirm(
                        "ต้องการลบรูปภาพนี้หรือไม่ การดำเนินการนี้ไม่สามารถย้อนกลับได้",
                      );
                      if (!confirmed) return;
                      setBusy(true);
                      try {
                        await deletePhoto(id, photo);
                        await reload();
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    ลบรูป
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>รายละเอียด</h2>
          <p>{place.note || "ยังไม่มีรายละเอียด"}</p>
          <p>★ {(place.rating || 0).toFixed(1)} / 5</p>
          <p>
            {[place.subdistrict, place.district, place.province]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <Link className="primary" href={`/places/${id}/edit`}>
            แก้ไขข้อมูล
          </Link>
        </section>

        <section className="card">
          <h2>เพิ่มรูปภาพ</h2>
          <PhotoPicker
            photos={newPhotos}
            coverId={coverId}
            onPhotos={setNewPhotos}
            onCover={setCoverId}
          />
          <button
            type="button"
            className="primary"
            disabled={busy || !newPhotos.length}
            onClick={async () => {
              setBusy(true);
              setMessage("");
              try {
                const ordered = [...newPhotos].sort((a, b) =>
                  a.id === coverId ? -1 : b.id === coverId ? 1 : 0,
                );
                const uploaded = await uploadTravelPhotos(
                  ordered.map((item) => item.file),
                  id,
                  (done, total) =>
                    setMessage(`อัปโหลด ${Math.round((done / total) * 100)}%`),
                );
                await appendPlacePhotos(id, uploaded);
                setNewPhotos([]);
                setCoverId(null);
                setMessage("เพิ่มรูปเรียบร้อย");
                await reload();
              } catch (error) {
                setMessage(
                  error instanceof Error ? error.message : "เพิ่มรูปไม่สำเร็จ",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "กำลังเพิ่มรูป…" : "เพิ่มรูปเข้ารายการ"}
          </button>
          {message && <p className="hint">{message}</p>}
        </section>

        <section className="card danger-zone">
          <h2>ลบสถานที่</h2>
          <p>ข้อมูลและความสัมพันธ์ของรูปจะถูกลบ ไม่สามารถย้อนกลับได้</p>
          <button
            type="button"
            className="danger"
            disabled={busy}
            onClick={async () => {
              const confirmed = window.confirm(
                `ยืนยันลบ “${place.name}” และรูปทั้งหมดหรือไม่`,
              );
              if (!confirmed) return;
              setBusy(true);
              try {
                await deletePlace(id);
                router.push("/places?deleted=1");
              } catch (error) {
                setMessage(
                  error instanceof Error ? error.message : "ลบสถานที่ไม่สำเร็จ",
                );
                setBusy(false);
              }
            }}
          >
            ลบสถานที่ท่องเที่ยว
          </button>
        </section>
      </section>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </main>
  );
}
