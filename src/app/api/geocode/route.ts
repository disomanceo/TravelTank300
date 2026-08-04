import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const APP_USER_AGENT = "TravelTank300/1.0 (+https://travel-tank300.vercel.app)";

type NominatimResult = {
  place_id?: number;
  display_name?: string;
  name?: string;
  lat?: string;
  lon?: string;
  address?: Record<string, string>;
};

function normalize(row: NominatimResult) {
  const address = row.address ?? {};
  const lat = Number(row.lat);
  const lng = Number(row.lon);
  return {
    id: String(row.place_id ?? `${row.lat}-${row.lon}`),
    name: row.name || row.display_name?.split(",")[0] || "สถานที่",
    address: row.display_name || "",
    latitude: Number.isFinite(lat) ? lat.toFixed(6) : "",
    longitude: Number.isFinite(lng) ? lng.toFixed(6) : "",
    locationName: row.name || row.display_name?.split(",")[0] || row.display_name || "",
    subdistrict:
      address.suburb ||
      address.quarter ||
      address.neighbourhood ||
      address.village ||
      address.town ||
      address.city_district ||
      "",
    district:
      address.city_district ||
      address.district ||
      address.county ||
      address.city ||
      address.town ||
      "",
    province: address.state || address.province || "",
  };
}

async function nominatim(path: string, params: URLSearchParams) {
  const response = await fetch(`${NOMINATIM_BASE}${path}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "th,en;q=0.8",
      "User-Agent": APP_USER_AGENT,
    },
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    throw new Error(`Geocoding service error: ${response.status}`);
  }

  return response.json() as Promise<NominatimResult | NominatimResult[]>;
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode") || "search";

  try {
    if (mode === "reverse") {
      const lat = request.nextUrl.searchParams.get("lat") || "";
      const lon = request.nextUrl.searchParams.get("lon") || "";
      if (!lat || !lon) {
        return NextResponse.json({ message: "Missing coordinates" }, { status: 400 });
      }

      const params = new URLSearchParams({
        format: "jsonv2",
        lat,
        lon,
        addressdetails: "1",
        zoom: "18",
      });
      const row = (await nominatim("/reverse", params)) as NominatimResult;
      return NextResponse.json({ result: normalize(row) }, {
        headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
      });
    }

    const query = (request.nextUrl.searchParams.get("q") || "").trim();
    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const params = new URLSearchParams({
      format: "jsonv2",
      q: `${query}, ประเทศไทย`,
      addressdetails: "1",
      limit: "8",
      countrycodes: "th",
      dedupe: "1",
    });
    const rows = (await nominatim("/search", params)) as NominatimResult[];
    return NextResponse.json({ results: rows.map(normalize) }, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Geocoding failed" },
      { status: 502 },
    );
  }
}
