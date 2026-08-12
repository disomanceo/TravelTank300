import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const BASE = "https://nominatim.openstreetmap.org";

type RawResult = {
  place_id?: number;
  display_name?: string;
  name?: string;
  lat?: string;
  lon?: string;
  importance?: number;
  address?: Record<string, string>;
};

type NormalizedResult = ReturnType<typeof normalize>;

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("th")
    .replace(/[.,/\\()[\]{}\-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(item: RawResult) {
  const address = item.address || {};
  const latitude = Number(item.lat);
  const longitude = Number(item.lon);
  return {
    id: String(item.place_id || `${item.lat}-${item.lon}`),
    name: item.name || item.display_name?.split(",")[0] || "สถานที่",
    address: item.display_name || "",
    latitude: Number.isFinite(latitude) ? latitude.toFixed(6) : "",
    longitude: Number.isFinite(longitude) ? longitude.toFixed(6) : "",
    locationName: item.name || item.display_name || "",
    subdistrict:
      address.suburb ||
      address.quarter ||
      address.neighbourhood ||
      address.village ||
      address.town ||
      "",
    district:
      address.city_district ||
      address.district ||
      address.county ||
      address.city ||
      address.town ||
      "",
    province: address.state || address.province || "",
    importance: Number(item.importance || 0),
  };
}

function score(item: NormalizedResult, query: string) {
  const wanted = normalizeText(query);
  const name = normalizeText(item.name);
  const address = normalizeText(item.address);
  const words = wanted.split(" ").filter(Boolean);

  let total = item.importance;
  if (name === wanted) total += 100;
  else if (name.startsWith(wanted)) total += 70;
  else if (name.includes(wanted)) total += 50;
  if (address.includes(wanted)) total += 30;
  total += words.filter((word) => name.includes(word)).length * 12;
  total += words.filter((word) => address.includes(word)).length * 5;
  return total;
}

async function call(path: string, params: URLSearchParams) {
  const response = await fetch(`${BASE}${path}?${params}`, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "th,en;q=.8",
      "User-Agent": "TravelTank300/1.1",
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Geocode ${response.status}`);
  return response.json();
}

async function search(query: string) {
  const params = new URLSearchParams({
    format: "jsonv2",
    q: query,
    addressdetails: "1",
    namedetails: "1",
    limit: "20",
    countrycodes: "th",
    dedupe: "1",
  });
  return (await call("/search", params)) as RawResult[];
}

export async function GET(request: NextRequest) {
  try {
    if (request.nextUrl.searchParams.get("mode") === "reverse") {
      const lat = request.nextUrl.searchParams.get("lat") || "";
      const lon = request.nextUrl.searchParams.get("lon") || "";
      const item = (await call(
        "/reverse",
        new URLSearchParams({
          format: "jsonv2",
          lat,
          lon,
          addressdetails: "1",
        }),
      )) as RawResult;
      const { importance: _importance, ...result } = normalize(item);
      void _importance;
      return NextResponse.json({ result });
    }

    const query = (request.nextUrl.searchParams.get("q") || "").trim();
    if (query.length < 2) return NextResponse.json({ results: [] });

    const variants = [query, `${query} ประเทศไทย`];
    const batches = await Promise.allSettled(variants.map(search));
    const unique = new Map<string, NormalizedResult>();

    for (const batch of batches) {
      if (batch.status !== "fulfilled") continue;
      for (const raw of batch.value) {
        const item = normalize(raw);
        const key = raw.place_id
          ? String(raw.place_id)
          : `${item.latitude},${item.longitude}`;
        if (!unique.has(key)) unique.set(key, item);
      }
    }

    const results = [...unique.values()]
      .sort((a, b) => score(b, query) - score(a, query))
      .slice(0, 10)
      .map(({ importance: _importance, ...item }) => {
        void _importance;
        return item;
      });

    return NextResponse.json(
      { results },
      {
        headers: {
          "Cache-Control": "public,s-maxage=3600,stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "ค้นหาสถานที่ไม่สำเร็จ",
      },
      { status: 502 },
    );
  }
}
