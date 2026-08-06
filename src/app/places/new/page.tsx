"use client";

import { type CSSProperties, useState } from "react";
import { useRouter } from "next/navigation";
import { TravelHero } from "@/components/travel-hero";
import { PlaceForm } from "@/components/place-form";
import { PhotoPicker, type PhotoItem } from "@/components/photo-picker";
import { appendPlacePhotos, createPlace } from "@/lib/travel/repository";
import { uploadTravelPhotos } from "@/lib/travel/uploads";

export default function NewPlacePage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [coverId, setCoverId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);

  return (
    <main>
      <TravelHero
        title="เพิ่มสถานที่"
        subtitle="บันทึกข้อมูลและอัปโหลดรูปอย่างเป็นลำดับ"
        backHref="/places"
      />
      <section className="content">
        <section className="card">
          <h2>รูปภาพ</h2>
          <PhotoPicker
            photos={photos}
            coverId={coverId}
            onPhotos={setPhotos}
            onCover={setCoverId}
          />

          {uploadProgress && (
            <div className="upload-gauge-panel" aria-live="polite">
              <div
                className="upload-gauge"
                style={{
                  "--upload-progress": `${Math.round((uploadProgress.done / Math.max(uploadProgress.total, 1)) * 100)}%`,
                } as CSSProperties}
                aria-label={`อัปโหลดแล้ว ${uploadProgress.done} จาก ${uploadProgress.total} รูป`}
              >
                <span>
                  {Math.round((uploadProgress.done / Math.max(uploadProgress.total, 1)) * 100)}%
                </span>
              </div>
              <div className="upload-gauge-copy">
                <strong>{saving ? "กำลังอัปโหลดรูปภาพ" : "อัปโหลดเสร็จแล้ว"}</strong>
                <span>{uploadProgress.done} / {uploadProgress.total} รูป</span>
                <small>แต่ละรูปจะถูกลดขนาดและส่งทีละรูป</small>
              </div>
            </div>
          )}

          {status && <p className="hint">{status}</p>}
        </section>

        <PlaceForm
          saving={saving}
          onSave={async (data) => {
            setSaving(true);
            setStatus("กำลังบันทึกข้อมูลสถานที่…");
            try {
              const placeId = await createPlace(data);

              if (photos.length) {
                const ordered = [...photos].sort((a, b) =>
                  a.id === coverId ? -1 : b.id === coverId ? 1 : 0,
                );
                setUploadProgress({ done: 0, total: ordered.length });
                setStatus("บันทึกข้อมูลแล้ว กำลังเตรียมรูปภาพ…");

                const uploaded = await uploadTravelPhotos(
                  ordered.map((photo) => photo.file),
                  placeId,
                  (done, total) => {
                    setUploadProgress({ done, total });
                    setStatus(done === total ? "กำลังบันทึกข้อมูลรูป…" : "กำลังอัปโหลดรูปภาพ…");
                  },
                  data.name,
                );
                await appendPlacePhotos(placeId, uploaded);
              }

              router.push(`/places/${placeId}?saved=1`);
            } catch (error) {
              setStatus(error instanceof Error ? error.message : "บันทึกข้อมูลไม่สำเร็จ");
              setSaving(false);
            }
          }}
        />
      </section>
    </main>
  );
}
