"use client";

import { useEffect, useRef, useState } from "react";

type LeafletMap = {
  setView: (coords: [number, number], zoom: number) => LeafletMap;
  on: (event: string, handler: (event: { latlng: { lat: number; lng: number } }) => void) => void;
  remove: () => void;
};
type LeafletMarker = {
  setLatLng: (coords: [number, number]) => LeafletMarker;
  addTo: (map: LeafletMap) => LeafletMarker;
  on: (event: string, handler: (event: { target: { getLatLng: () => { lat: number; lng: number } } }) => void) => LeafletMarker;
};
type LeafletApi = {
  map: (element: HTMLElement) => LeafletMap;
  tileLayer: (url: string, options: { attribution: string }) => { addTo: (map: LeafletMap) => void };
  marker: (coords: [number, number], options?: { draggable?: boolean }) => LeafletMarker;
};
declare global { interface Window { L?: LeafletApi } }

export type LocationValue = {
  latitude: string;
  longitude: string;
  locationName: string;
  subdistrict: string;
  district: string;
  province: string;
};

type SearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: Record<string, string>;
};

type Props = {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  onSelectName?: (name: string) => void;
};

const DEFAULT_LAT = 13.7563;
const DEFAULT_LNG = 100.5018;

function mapAddress(data: { display_name?: string; name?: string; address?: Record<string, string> }, lat: number, lng: number): LocationValue {
  const address = data.address ?? {};
  return {
    latitude: lat.toFixed(6),
    longitude: lng.toFixed(6),
    locationName: data.name || data.display_name || "ตำแหน่งที่เลือก",
    subdistrict: address.suburb ?? address.quarter ?? address.village ?? address.town ?? "",
    district: address.city_district ?? address.district ?? address.county ?? address.city ?? "",
    province: address.state ?? address.province ?? "",
  };
}

export function LocationPicker({ value, onChange, onSelectName }: Props) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const marker = useRef<LeafletMarker | null>(null);
  const [message, setMessage] = useState("ค้นหาสถานที่ หรือแตะแผนที่เพื่อปักหมุด");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  async function reverseGeocode(lat: number, lng: number) {
    setLoading(true);
    setMessage("กำลังค้นหาชื่อพื้นที่…");
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=th`,
        { headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw new Error("reverse geocode failed");
      const data = await response.json() as { display_name?: string; name?: string; address?: Record<string, string> };
      const next = mapAddress(data, lat, lng);
      onChange(next);
      setMessage("เติมตำบล อำเภอ จังหวัด และพิกัดให้อัตโนมัติแล้ว");
    } catch {
      onChange({ ...value, latitude: lat.toFixed(6), longitude: lng.toFixed(6), locationName: value.locationName || "ตำแหน่งที่เลือก" });
      setMessage("บันทึกพิกัดแล้ว แต่ค้นหาชื่อพื้นที่ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({
          format: "jsonv2",
          q: text,
          limit: "6",
          addressdetails: "1",
          countrycodes: "th",
          "accept-language": "th",
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("search failed");
        setResults(await response.json() as SearchResult[]);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    function initialize() {
      if (cancelled || !mapElement.current || !window.L || mapInstance.current) return;
      const lat = Number(value.latitude) || DEFAULT_LAT;
      const lng = Number(value.longitude) || DEFAULT_LNG;
      const map = window.L.map(mapElement.current).setView([lat, lng], value.latitude ? 13 : 6);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
      marker.current = window.L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.current.on("dragend", (event) => {
        const point = event.target.getLatLng();
        void reverseGeocode(point.lat, point.lng);
      });
      map.on("click", (event) => {
        marker.current?.setLatLng([event.latlng.lat, event.latlng.lng]);
        void reverseGeocode(event.latlng.lat, event.latlng.lng);
      });
      mapInstance.current = map;
    }
    if (window.L) initialize();
    else {
      if (!document.querySelector('link[data-leaflet]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.dataset.leaflet = "true";
        document.head.appendChild(link);
      }
      let script = document.querySelector<HTMLScriptElement>('script[data-leaflet]');
      if (!script) {
        script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.dataset.leaflet = "true";
        document.body.appendChild(script);
      }
      script.addEventListener("load", initialize, { once: true });
    }
    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectResult(result: SearchResult) {
    const lat = Number(result.lat);
    const lng = Number(result.lon);
    const next = mapAddress(result, lat, lng);
    onChange(next);
    onSelectName?.(result.name || result.display_name.split(",")[0] || next.locationName);
    setQuery(result.name || result.display_name.split(",")[0] || "");
    setResults([]);
    mapInstance.current?.setView([lat, lng], 16);
    marker.current?.setLatLng([lat, lng]);
    setMessage("เลือกสถานที่แล้ว ลากหมุดหรือแตะแผนที่เพื่อปรับตำแหน่งละเอียด");
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) return setMessage("อุปกรณ์นี้ไม่รองรับ GPS");
    setLoading(true);
    setMessage("กำลังค้นหาตำแหน่งปัจจุบัน…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        mapInstance.current?.setView([lat, lng], 16);
        marker.current?.setLatLng([lat, lng]);
        void reverseGeocode(lat, lng);
      },
      () => {
        setLoading(false);
        setMessage("ไม่สามารถใช้ตำแหน่งปัจจุบันได้ กรุณาค้นหาหรือแตะแผนที่");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }



  return <div className="location-picker">
    <div className="place-search-wrap">
      <label className="full">ค้นหาสถานที่ ตำบล อำเภอ หรือจังหวัด
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="เช่น น้ำตกเอราวัณ, ปากช่อง, เชียงใหม่"
          autoComplete="off"
        />
      </label>
      {(searching || results.length > 0) && <div className="place-search-results">
        {searching && <div className="place-search-status">กำลังค้นหา…</div>}
        {!searching && results.map((result) => <button type="button" key={result.place_id} onClick={() => selectResult(result)}>
          <strong>{result.name || result.display_name.split(",")[0]}</strong>
          <span>{result.display_name}</span>
        </button>)}
      </div>}
    </div>

    <div className="location-toolbar">
      <button type="button" className="location-primary" onClick={useCurrentLocation} disabled={loading}>ใช้ตำแหน่งปัจจุบัน</button>
      <span>{message}</span>
    </div>

    <div ref={mapElement} className="interactive-map" aria-label="แผนที่เลือกตำแหน่ง" />

    <div className="coordinate-display" aria-live="polite">
      <span><small>ละติจูด</small><strong>{value.latitude || "รอเลือกตำแหน่ง"}</strong></span>
      <span><small>ลองจิจูด</small><strong>{value.longitude || "รอเลือกตำแหน่ง"}</strong></span>
    </div>

    <div className="address-grid">
      <label className="full">ชื่อสถานที่/ที่อยู่<input value={value.locationName} onChange={(event) => onChange({ ...value, locationName: event.target.value })} /></label>
      <label>ตำบล<input value={value.subdistrict} onChange={(event) => onChange({ ...value, subdistrict: event.target.value })} /></label>
      <label>อำเภอ<input value={value.district} onChange={(event) => onChange({ ...value, district: event.target.value })} /></label>
      <label>จังหวัด<input value={value.province} onChange={(event) => onChange({ ...value, province: event.target.value })} /></label>
    </div>
  </div>;
}
