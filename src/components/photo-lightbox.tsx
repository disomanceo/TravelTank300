"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TravelPhotoRow } from "@/lib/travel/repository";
import { drivePreviewUrl } from "@/lib/travel/image-url";

type PhotoLightboxProps = {
  photos: TravelPhotoRow[];
  index: number;
  onClose: () => void;
};

const LIGHTBOX_WIDTH = 1600;
const SWIPE_THRESHOLD = 46;

function getPhotoUrl(photo: TravelPhotoRow | undefined, width = LIGHTBOX_WIDTH) {
  if (!photo) return "";
  return drivePreviewUrl(
    photo.drive_file_id,
    photo.thumbnail_url || photo.drive_url,
    width,
  );
}

export function PhotoLightbox({ photos, index, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(index);
  const [loading, setLoading] = useState(true);
  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);

  const move = useCallback(
    (direction: -1 | 1) => {
      if (photos.length < 2) return;
      setLoading(true);
      setCurrentIndex((current) =>
        (current + direction + photos.length) % photos.length,
      );
    },
    [photos.length],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [move, onClose]);

  useEffect(() => {
    if (photos.length < 2) return;
    const previous = photos[(currentIndex - 1 + photos.length) % photos.length];
    const next = photos[(currentIndex + 1) % photos.length];

    for (const photo of [previous, next]) {
      const image = new Image();
      image.src = getPhotoUrl(photo);
    }
  }, [currentIndex, photos]);

  const photo = photos[currentIndex];
  if (!photo) return null;

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    pointerStartX.current = event.clientX;
    pointerStartY.current = event.clientY;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerStartX.current === null || pointerStartY.current === null) return;

    const deltaX = event.clientX - pointerStartX.current;
    const deltaY = event.clientY - pointerStartY.current;
    pointerStartX.current = null;
    pointerStartY.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }
    move(deltaX < 0 ? 1 : -1);
  }

  return (
    <div
      className="lightbox gallery-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`รูปที่ ${currentIndex + 1} จาก ${photos.length}`}
      onClick={onClose}
    >
      <button
        type="button"
        className="lightbox-close"
        aria-label="ปิดรูปภาพ"
        onClick={onClose}
      >
        ×
      </button>

      <div
        className="lightbox-stage"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          pointerStartX.current = null;
          pointerStartY.current = null;
        }}
      >
        {loading && <div className="lightbox-loading">กำลังโหลดรูป…</div>}
        {/* Drive proxy/fallback ต้องใช้ img โดยตรง */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.id}
          src={getPhotoUrl(photo)}
          alt={`รูปสถานที่ลำดับที่ ${currentIndex + 1}`}
          decoding="async"
          draggable={false}
          onLoad={() => setLoading(false)}
          onError={(event) => {
            const image = event.currentTarget;
            if (!image.src.includes("w=960")) {
              image.src = getPhotoUrl(photo, 960);
              return;
            }
            setLoading(false);
          }}
        />
      </div>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            className="lightbox-arrow previous"
            aria-label="รูปก่อนหน้า"
            onClick={(event) => {
              event.stopPropagation();
              move(-1);
            }}
          >
            ‹
          </button>
          <button
            type="button"
            className="lightbox-arrow next"
            aria-label="รูปถัดไป"
            onClick={(event) => {
              event.stopPropagation();
              move(1);
            }}
          >
            ›
          </button>
        </>
      )}

      <div className="lightbox-counter" onClick={(event) => event.stopPropagation()}>
        {currentIndex + 1} / {photos.length}
      </div>
      {photos.length > 1 && (
        <p className="lightbox-swipe-hint">ปัดซ้ายหรือขวาเพื่อดูรูปถัดไป</p>
      )}
    </div>
  );
}
