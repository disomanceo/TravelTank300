import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ID = /^[a-zA-Z0-9_-]{20,}$/;

function googleImageCandidates(fileId: string, width: number | null, original: boolean) {
  if (original) {
    return [
      `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=view&authuser=0`,
      `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=s0`,
      `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`,
      `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w2400`,
    ];
  }

  const safeWidth = Math.min(Math.max(width || 960, 160), 2400);
  return [
    `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${safeWidth}`,
    `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w${safeWidth}`,
    `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`,
  ];
}


async function fetchImageThroughGas(fileId: string) {
  const gasUrl = process.env.GAS_WEB_APP_URL;
  const token = process.env.GAS_UPLOAD_TOKEN;
  if (!gasUrl || !token) return null;

  const body = new URLSearchParams();
  body.set("action", "getImage");
  body.set("token", token);
  body.set("data", JSON.stringify({ fileId }));

  const response = await fetch(gasUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
    redirect: "follow",
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload = await response.json() as { success?: boolean; base64?: string; mimeType?: string };
  if (!payload.success || !payload.base64 || !payload.mimeType?.startsWith("image/")) return null;
  return { body: Buffer.from(payload.base64, "base64"), contentType: payload.mimeType };
}

async function fetchImage(url: string) {
  const response = await fetch(url, {
    redirect: "follow",
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0 TravelTank300/1.0",
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
  });

  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.toLowerCase().startsWith("image/")) return null;
  return { response, contentType };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await context.params;
  if (!ALLOWED_ID.test(fileId)) {
    return NextResponse.json({ message: "Invalid image id" }, { status: 400 });
  }

  const widthValue = Number(request.nextUrl.searchParams.get("w"));
  const width = Number.isFinite(widthValue) ? widthValue : null;
  const original = request.nextUrl.searchParams.get("original") === "1";

  const cacheHeaders = {
    "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
    "CDN-Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000",
    "Vercel-CDN-Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000",
    "X-Content-Type-Options": "nosniff",
  };

  for (const sourceUrl of googleImageCandidates(fileId, width, original)) {
    try {
      const result = await fetchImage(sourceUrl);
      if (!result) continue;
      return new NextResponse(await result.response.arrayBuffer(), {
        status: 200,
        headers: { "Content-Type": result.contentType, ...cacheHeaders },
      });
    } catch {
      // Try the authenticated GAS fallback below.
    }
  }

  try {
    const gasImage = await fetchImageThroughGas(fileId);
    if (gasImage) {
      return new NextResponse(gasImage.body, {
        status: 200,
        headers: { "Content-Type": gasImage.contentType, ...cacheHeaders },
      });
    }
  } catch {
    // Fall through to the local placeholder.
  }

  return NextResponse.redirect(new URL("/places/forest.svg", request.url), 307);
}
