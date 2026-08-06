"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { TravelHero } from "@/components/travel-hero";
import { PhotoLightbox } from "@/components/photo-lightbox";
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

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="m7 7 1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [place, setPlace] = useState<TravelPlaceRow | null>(null);
  const [photos, setPhotos] = useState<TravelPhotoRow[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteError, setDeleteError] = useState("");

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

  async function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    event.target.value = "";
    if (!files.length || busy) return;

    setBusy(true);
    setMessage("กำลังเตรียมรูปภาพ…");
    try {
      const placeName = place?.name?.trim() || "สถานที่";
      const uploaded = await uploadTravelPhotos(files, id, (done, total) => {
        setMessage(`กำลังอัปโหลดรูป ${Math.round((done / total) * 100)}%`);
      }, placeName);
      await appendPlacePhotos(id, uploaded);
      await reload();
      setMessage(`เพิ่มรูปเรียบร้อย ${uploaded.length} รูป`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "เพิ่มรูปไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function makeCover(photo: TravelPhotoRow) {
    if (photo.is_cover || busy) return;
    setBusy(true);
    setMessage("");
    try {
      await setCoverPhoto(id, photo);
      await reload();
      setSelectedPhotoId(null);
      setMessage("เปลี่ยนรูปหน้าปกเรียบร้อย");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "เปลี่ยนรูปหน้าปกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto(photo: TravelPhotoRow) {
    const confirmed = window.confirm(
      "ต้องการลบรูปภาพนี้หรือไม่ การดำเนินการนี้ไม่สามารถย้อนกลับได้",
    );
    if (!confirmed || busy) return;

    setBusy(true);
    setMessage("");
    try {
      await deletePhoto(id, photo);
      await reload();
      if (selectedPhotoId === photo.id) setSelectedPhotoId(null);
      setMessage("ลบรูปเรียบร้อย");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ลบรูปไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
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

      <section className="content place-detail-content">
        <section className="card place-photo-card" aria-label="รูปภาพสถานที่">
          <input
            ref={fileInputRef}
            hidden
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={addPhotos}
          />

          <div className="detail-photo-grid">
            {photos.map((photo, index) => {
              const isSelected = selectedPhotoId === photo.id;
              return (
                <article
                  key={photo.id}
                  className={`detail-photo-tile${isSelected ? " selected" : ""}`}
                >
                  <button
                    type="button"
                    className="detail-photo-select"
                    aria-label={`เลือกรูปที่ ${index + 1}`}
                    onClick={() =>
                      setSelectedPhotoId((current) =>
                        current === photo.id ? null : photo.id,
                      )
                    }
                  >
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

                  <button
                    type="button"
                    className="photo-trash-button"
                    aria-label={`ลบรูปที่ ${index + 1}`}
                    disabled={busy}
                    onClick={() => void removePhoto(photo)}
                  >
                    <TrashIcon />
                  </button>

                  {photo.is_cover && (
                    <span className="cover-status-badge">รูปหน้าปก</span>
                  )}

                  {!photo.is_cover && isSelected && (
                    <button
                      type="button"
                      className="set-cover-button"
                      disabled={busy}
                      onClick={() => void makeCover(photo)}
                    >
                      ตั้งรูปหน้าปก
                    </button>
                  )}

                  <button
                    type="button"
                    className="photo-view-button"
                    aria-label={`เปิดรูปที่ ${index + 1} แบบเต็มจอ`}
                    onClick={() => setLightboxIndex(index)}
                  >
                    ดูรูป
                  </button>
                </article>
              );
            })}

            <button
              type="button"
              className="add-photo-tile"
              disabled={busy}
              aria-label="เพิ่มรูปภาพ"
              onClick={() => fileInputRef.current?.click()}
            >
              <span><PlusIcon /></span>
              <small>{busy ? "กำลังอัปโหลด" : "เพิ่มรูป"}</small>
            </button>
          </div>

          {message && <p className="detail-photo-message">{message}</p>}
        </section>

        <section className="card detail-info-card">
          <div className="card-title-row">
            <h2>รายละเอียด</h2>
            <Link
              className="edit-pencil-button"
              href={`/places/${id}/edit`}
              aria-label="แก้ไขข้อมูลสถานที่"
            >
              <PencilIcon />
            </Link>
          </div>
          <p>{place.note || "ยังไม่มีรายละเอียด"}</p>
          <p>★ {(place.rating || 0).toFixed(1)} / 5</p>
          <p>
            {[place.subdistrict, place.district, place.province]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </section>

        <button
          type="button"
          className="delete-place-only-button"
          disabled={busy}
          onClick={() => {
            setDeleteError("");
            setDeleteStep(1);
            setShowDelete(true);
          }}
        >
          ลบสถานที่
        </button>
      </section>

      {showDelete && (
        <div
          className="delete-sheet-backdrop"
          role="presentation"
          onClick={() => !busy && setShowDelete(false)}
        >
          <section
            className="delete-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            {deleteStep === 1 ? (
              <>
                <span className="delete-sheet-icon" aria-hidden="true">⌫</span>
                <h2 id="delete-title">ลบสถานที่นี้หรือไม่</h2>
                <p>
                  คุณกำลังจะลบ “{place.name}” พร้อมข้อมูลและรูปภาพทั้งหมด
                  การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </p>
                <div className="delete-actions">
                  <button
                    type="button"
                    className="cancel"
                    disabled={busy}
                    onClick={() => setShowDelete(false)}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    className="confirm"
                    disabled={busy}
                    onClick={() => setDeleteStep(2)}
                  >
                    ดำเนินการต่อ
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="delete-sheet-icon final" aria-hidden="true">!</span>
                <h2 id="delete-title">ยืนยันการลบครั้งสุดท้าย</h2>
                <p>
                  เมื่อลบแล้ว รายการนี้จะหายจากหน้าสถานที่ทันที
                  และไม่สามารถกู้คืนจากแอปได้
                </p>
                {deleteError && <p className="delete-error" role="alert">{deleteError}</p>}
                <div className="delete-actions">
                  <button
                    type="button"
                    className="cancel"
                    disabled={busy}
                    onClick={() => setDeleteStep(1)}
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    type="button"
                    className="confirm"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setDeleteError("");
                      try {
                        const result = await deletePlace(id);
                        const query = result.failedPhotoFiles
                          ? `?deleted=1&driveWarning=${result.failedPhotoFiles}`
                          : "?deleted=1";
                        setShowDelete(false);
                        router.replace(`/places${query}`);
                        router.refresh();
                      } catch (error) {
                        setDeleteError(
                          error instanceof Error
                            ? error.message
                            : "ลบสถานที่ไม่สำเร็จ",
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {busy ? "กำลังลบ…" : "ยืนยันลบสถานที่"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

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
