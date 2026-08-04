"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

export type LocationValue = {
  latitude: string;
  longitude: string;
  locationName: string;
  subdistrict: string;
  district: string;
  province: string;
};

type Props = {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  onSelectName?: (name: string) => void;
};

type SearchItem = LocationValue & {
  id: string;
  name: string;
  address: string;
};

type LeafletMap = {
  setView: (coords: [number, number], zoom: number) => LeafletMap;
  on: (event: string, callback: (event: { latlng: { lat: number; lng: number } }) => void) => void;
  remove: () => void;
};

type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker;
  setLatLng: (coords: [number, number]) => LeafletMarker;
  on: (event: string, callback: (event: { target: { getLatLng: () => { lat: number; lng: number } } }) => void) => void;
};

type LeafletGlobal = {
  map: (element: HTMLElement, options?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, options: Record<string, unknown>) => { addTo: (map: LeafletMap) => void };
  marker: (coords: [number, number], options?: Record<string, unknown>) => LeafletMarker;
};

declare global {
  interface Window {
    L?: LeafletGlobal;
  }
}

const DEFAULT_LAT = 13.7563;
const DEFAULT_LNG = 100.5018;

function toLocation(item: SearchItem): LocationValue {
  return {
    latitude: item.latitude,
    longitude: item.longitude,
    locationName: item.locationName,
    subdistrict: item.subdistrict,
    district: item.district,
    province: item.province,
  };
}

async function loadLeaflet(): Promise<LeafletGlobal> {
  if (window.L) return window.L;

  if (!document.querySelector('link[data-leaflet="1"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.dataset.leaflet = "1";
    document.head.appendChild(link);
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-leaflet="1"]');
    if (existing) {
      if (window.L) resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.dataset.leaflet = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("โหลดแผนที่ไม่สำเร็จ"));
    document.body.appendChild(script);
  });

  if (!window.L) throw new Error("Leaflet unavailable");
  return window.L;
}

async function reverseLookup(lat: number, lng: number): Promise<LocationValue> {
  const params = new URLSearchParams({ mode: "reverse", lat: String(lat), lon: String(lng) });
  const response = await fetch(`/api/geocode?${params.toString()}`);
  const payload = await response.json() as { result?: SearchItem; message?: string };
  if (!response.ok || !payload.result) throw new Error(payload.message || "ค้นหาพื้นที่จากพิกัดไม่สำเร็จ");
  return toLocation(payload.result);
}

export function LocationPicker({ value, onChange, onSelectName }: Props) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("ค้นหาแล้วเลือกหนึ่งรายการ จากนั้นแตะแผนที่หรือลากหมุดเพื่อปรับตำแหน่ง");

  useEffect(() => {
    let disposed = false;

    async function initialize() {
      if (!mapElement.current || mapRef.current) return;
      try {
        const L = await loadLeaflet();
        if (disposed || !mapElement.current) return;

        const lat = Number(value.latitude) || DEFAULT_LAT;
        const lng = Number(value.longitude) || DEFAULT_LNG;
        const map = L.map(mapElement.current, { zoomControl: true }).setView([lat, lng], value.latitude ? 15 : 6);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        }).addTo(map);
        const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

        async function updateFromCoordinates(nextLat: number, nextLng: number) {
          marker.setLatLng([nextLat, nextLng]);
          try {
            const location = await reverseLookup(nextLat, nextLng);
            onChange(location);
            setMessage("ปรับหมุดและเติมข้อมูลพื้นที่อัตโนมัติแล้ว");
          } catch {
            onChange({ ...value, latitude: nextLat.toFixed(6), longitude: nextLng.toFixed(6) });
            setMessage("บันทึกพิกัดแล้ว แต่เติมชื่อพื้นที่ไม่สำเร็จ");
          }
        }

        map.on("click", (event) => { void updateFromCoordinates(event.latlng.lat, event.latlng.lng); });
        marker.on("dragend", (event) => {
          const point = event.target.getLatLng();
          void updateFromCoordinates(point.lat, point.lng);
        });

        mapRef.current = map;
        markerRef.current = marker;
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "โหลดแผนที่ไม่สำเร็จ");
      }
    }

    void initialize();
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Initialize the external map once. Value updates are synchronized below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const lat = Number(value.latitude);
    const lng = Number(value.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], 16);
  }, [value.latitude, value.longitude]);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = query.trim();
    if (text.length < 2) {
      setResults([]);
      setMessage("กรุณาพิมพ์อย่างน้อย 2 ตัวอักษร");
      return;
    }

    setSearching(true);
    setMessage("กำลังค้นหาสถานที่…");
    try {
      const response = await fetch(`/api/geocode?${new URLSearchParams({ q: text }).toString()}`);
      const payload = await response.json() as { results?: SearchItem[]; message?: string };
      if (!response.ok) throw new Error(payload.message || "ค้นหาสถานที่ไม่สำเร็จ");
      const rows = payload.results ?? [];
      setResults(rows);
      setMessage(rows.length ? `พบ ${rows.length} รายการ เลือกรายการที่ตรงที่สุด` : "ไม่พบสถานที่ ลองเพิ่มชื่อจังหวัดหรืออำเภอ");
    } catch (error) {
      setResults([]);
      setMessage(error instanceof Error ? error.message : "ค้นหาสถานที่ไม่สำเร็จ");
    } finally {
      setSearching(false);
    }
  }

  function selectResult(item: SearchItem) {
    onChange(toLocation(item));
    onSelectName?.(item.name);
    setQuery(item.name);
    setResults([]);
    setMessage("เลือกตำแหน่งแล้ว แตะแผนที่หรือลากหมุดเพื่อปรับละเอียดได้");
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage("อุปกรณ์นี้ไม่รองรับ GPS");
      return;
    }
    setLoading(true);
    setMessage("กำลังอ่านตำแหน่งปัจจุบัน…");
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      try {
        onChange(await reverseLookup(lat, lng));
        setMessage("ระบุตำแหน่งปัจจุบันและพื้นที่อัตโนมัติแล้ว");
      } catch {
        onChange({ ...value, latitude: lat.toFixed(6), longitude: lng.toFixed(6), locationName: value.locationName || "ตำแหน่งปัจจุบัน" });
        setMessage("บันทึกพิกัดแล้ว แต่ยังเติมชื่อพื้นที่ไม่ได้");
      } finally {
        setLoading(false);
      }
    }, () => {
      setLoading(false);
      setMessage("ไม่สามารถอ่านตำแหน่งปัจจุบันได้");
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  }

  return <div className="location-picker location-picker-osm">
    <label className="location-search-label">ค้นหาสถานที่</label>
    <form className="place-search-form" onSubmit={search}>
      <input
        className="location-search-input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="เช่น บางกะม่า กาญจนบุรี หรือ น้ำตกเอราวัณ"
        autoComplete="off"
      />
      <button type="submit" disabled={searching}>{searching ? "กำลังค้นหา…" : "ค้นหา"}</button>
    </form>

    {results.length > 0 && <div className="place-search-results static-results">
      {results.map((item) => <button type="button" key={item.id} onClick={() => selectResult(item)}><strong>{item.name}</strong><span>{item.address}</span></button>)}
    </div>}

    <div className="location-toolbar"><button type="button" className="location-primary" onClick={useCurrentLocation} disabled={loading}>{loading ? "กำลังค้นหา…" : "ใช้ตำแหน่งปัจจุบัน"}</button><span>{message}</span></div>

    <div ref={mapElement} className="leaflet-map" aria-label="แผนที่เลือกตำแหน่ง" />
    <p className="map-attribution-note">แผนที่ OpenStreetMap ไม่ต้องใช้ API key และไม่มีค่าบริการ Google Maps</p>

    <div className="coordinate-display" aria-live="polite"><span><small>ละติจูด</small><strong>{value.latitude || "อัตโนมัติ"}</strong></span><span><small>ลองจิจูด</small><strong>{value.longitude || "อัตโนมัติ"}</strong></span></div>
    <div className="address-grid">
      <label className="full">ชื่อสถานที่/ที่อยู่<input value={value.locationName} onChange={(event) => onChange({ ...value, locationName: event.target.value })} /></label>
      <label>ตำบล<input value={value.subdistrict} onChange={(event) => onChange({ ...value, subdistrict: event.target.value })} /></label>
      <label>อำเภอ<input value={value.district} onChange={(event) => onChange({ ...value, district: event.target.value })} /></label>
      <label>จังหวัด<input value={value.province} onChange={(event) => onChange({ ...value, province: event.target.value })} /></label>
    </div>
  </div>;
}
