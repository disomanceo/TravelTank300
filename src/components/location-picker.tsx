"use client";

import { useEffect, useState } from "react";

export type LocationValue = {
  latitude: string;
  longitude: string;
  locationName: string;
  subdistrict: string;
  district: string;
  province: string;
};

type SearchItem = LocationValue & {
  id: string;
  name: string;
  address: string;
};

type Props = {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  onSelectName?: (name: string) => void;
};

export function LocationPicker({ value, onChange, onSelectName }: Props) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/geocode?q=${encodeURIComponent(trimmedQuery)}`, {
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) throw new Error("ค้นหาสถานที่ไม่สำเร็จ");
          return response.json() as Promise<{ results?: SearchItem[] }>;
        })
        .then((data) => setItems(data.results ?? []))
        .catch((error: unknown) => {
          if (error instanceof Error && error.name === "AbortError") return;
          setItems([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 500);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    if (nextQuery.trim().length < 2) {
      setItems([]);
      setLoading(false);
    }
  }

  function choose(item: SearchItem) {
    onChange({
      latitude: item.latitude,
      longitude: item.longitude,
      locationName: item.locationName,
      subdistrict: item.subdistrict,
      district: item.district,
      province: item.province,
    });
    onSelectName?.(item.name);
    setQuery(item.name);
    setItems([]);
  }

  function useCurrentLocation() {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        onChange({ ...value, latitude, longitude });

        try {
          const response = await fetch(
            `/api/geocode?mode=reverse&lat=${latitude}&lon=${longitude}`,
          );
          const data = (await response.json()) as { result?: LocationValue };
          if (data.result) onChange(data.result);
        } catch {
          // พิกัดยังถูกบันทึกได้ แม้ reverse geocoding ไม่สำเร็จ
        }
      },
      undefined,
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="location-picker">
      <div className="map-placeholder">
        <span>แผนที่ Leaflet / OpenStreetMap</span>
        <small>
          {value.latitude && value.longitude
            ? `${value.latitude}, ${value.longitude}`
            : "ยังไม่ได้เลือกพิกัด"}
        </small>
      </div>

      <label className="full">
        ค้นหาสถานที่
        <input
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder="พิมพ์อย่างน้อย 2 ตัวอักษร"
          autoComplete="off"
        />
      </label>

      {loading && <p className="hint">กำลังค้นหา…</p>}
      {items.length > 0 && (
        <div className="search-results">
          {items.map((item) => (
            <button type="button" key={item.id} onClick={() => choose(item)}>
              <strong>{item.name}</strong>
              <span>{item.address}</span>
            </button>
          ))}
        </div>
      )}

      <button type="button" className="secondary" onClick={useCurrentLocation}>
        ใช้ตำแหน่งปัจจุบัน
      </button>

      <div className="form-grid">
        <label>
          ละติจูด
          <input
            value={value.latitude}
            onChange={(event) =>
              onChange({ ...value, latitude: event.target.value })
            }
          />
        </label>
        <label>
          ลองจิจูด
          <input
            value={value.longitude}
            onChange={(event) =>
              onChange({ ...value, longitude: event.target.value })
            }
          />
        </label>
        <label className="full">
          ชื่อสถานที่/ที่อยู่
          <input
            value={value.locationName}
            onChange={(event) =>
              onChange({ ...value, locationName: event.target.value })
            }
          />
        </label>
        <label>
          ตำบล
          <input
            value={value.subdistrict}
            onChange={(event) =>
              onChange({ ...value, subdistrict: event.target.value })
            }
          />
        </label>
        <label>
          อำเภอ
          <input
            value={value.district}
            onChange={(event) =>
              onChange({ ...value, district: event.target.value })
            }
          />
        </label>
        <label className="full">
          จังหวัด
          <input
            value={value.province}
            onChange={(event) =>
              onChange({ ...value, province: event.target.value })
            }
          />
        </label>
      </div>
    </div>
  );
}
