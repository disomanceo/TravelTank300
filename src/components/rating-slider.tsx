"use client";

import type { PointerEvent as ReactPointerEvent } from "react";

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function RatingSlider({ value, onChange }: Props) {
  const safeValue = Math.min(5, Math.max(0, Math.round(value * 2) / 2));
  const fillPercent = `${(safeValue / 5) * 100}%`;

  function updateFromPointer(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    onChange(Math.round(ratio * 10) / 2);
  }

  return (
    <div className="rating-slider">
      <div
        className="rating-stars"
        role="slider"
        aria-label="ความประทับใจ"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={safeValue}
        tabIndex={0}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) updateFromPointer(event);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowUp") onChange(Math.min(5, safeValue + 0.5));
          if (event.key === "ArrowLeft" || event.key === "ArrowDown") onChange(Math.max(0, safeValue - 0.5));
        }}
      >
        <span className="rating-stars-base">★★★★★</span>
        <span className="rating-stars-fill" style={{ width: fillPercent }}>★★★★★</span>
      </div>
      <div className="rating-scale"><span>0</span><strong>{safeValue.toFixed(1)}</strong><span>5</span></div>
      <p className="rating-help">แตะหรือลากบนดาวเพื่อเลือกครั้งละครึ่งดาว</p>
    </div>
  );
}
