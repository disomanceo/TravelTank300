"use client";

import { useEffect, useRef, useState } from "react";
import type { TravelPhotoRow } from "@/lib/travel/repository";
import { driveOriginalUrl, drivePreviewUrl } from "@/lib/travel/image-url";

type Props = {
  photos: TravelPhotoRow[];
  placeName: string;
  initialIndex: number;
  open: boolean;
  onClose: () => void;
};

export function PhotoLightbox({ photos, placeName, initialIndex, open, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const touchStart = useRef<number | null>(null);

  useEffect(() => setIndex(initialIndex), [initialIndex, open]);
  useEffect(() => {
    if (!open) return;
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setIndex((value) => (value + 1) % photos.length);
      if (event.key === "ArrowLeft") setIndex((value) => (value - 1 + photos.length) % photos.length);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", keydown);
    };
  }, [open, onClose, photos.length]);

  if (!open || !photos.length) return null;
  const current = photos[index];
  const previous = () => setIndex((value) => (value - 1 + photos.length) % photos.length);
  const next = () => setIndex((value) => (value + 1) % photos.length);

  return (
    <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={`รูปภาพ ${placeName}`}>
      <button className="lightbox-close" type="button" onClick={onClose} aria-label="ปิด">×</button>
      <div
        className="lightbox-stage"
        onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const distance = event.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(distance) > 45) distance < 0 ? next() : previous();
          touchStart.current = null;
        }}
      >
        <img src={driveOriginalUrl(current.drive_file_id, current.drive_url)} alt={`${placeName} รูปที่ ${index + 1}`} />
      </div>
      {photos.length > 1 && (
        <>
          <button className="lightbox-arrow previous" type="button" onClick={previous} aria-label="รูปก่อนหน้า">‹</button>
          <button className="lightbox-arrow next" type="button" onClick={next} aria-label="รูปถัดไป">›</button>
        </>
      )}
      <div className="lightbox-counter">{index + 1} / {photos.length}</div>
      <div className="lightbox-strip">
        {photos.map((photo, photoIndex) => (
          <button key={photo.id} className={photoIndex === index ? "active" : ""} type="button" onClick={() => setIndex(photoIndex)}>
            <img src={drivePreviewUrl(photo.drive_file_id, photo.thumbnail_url || photo.drive_url, 320)} alt={`ภาพย่อ ${photoIndex + 1}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
