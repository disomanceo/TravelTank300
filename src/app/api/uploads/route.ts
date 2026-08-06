import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_INCOMING_JSON_BYTES = 3_900_000;

type UploadItem = {
  fileName?: string;
  mimeType?: string;
  originalBase64?: string;
  previewBase64?: string;
};

type UploadBody = {
  groupId?: string;
  placeName?: string;
  files?: UploadItem[];
  photoPairs?: UploadItem[];
  pairs?: UploadItem[];
};

type GasResponse = {
  success?: boolean;
  files?: unknown[];
  data?: unknown[];
  message?: string;
};

function normalizeFiles(body: UploadBody): UploadItem[] {
  const candidates = [body.files, body.photoPairs, body.pairs];
  return candidates.find((value) => Array.isArray(value) && value.length > 0) ?? [];
}

function validateFiles(files: UploadItem[]): void {
  if (!files.length) throw new Error("ไม่พบข้อมูลรูปภาพสำหรับอัปโหลด");
  if (files.length > 1) throw new Error("ระบบอัปโหลดรองรับครั้งละ 1 รูปต่อคำขอ");

  for (const [index, file] of files.entries()) {
    if (!file.originalBase64 || !file.previewBase64) {
      throw new Error(`ข้อมูลรูปที่ ${index + 1} ไม่ครบถ้วน`);
    }
  }
}

function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

async function callGas(action: string, data: unknown): Promise<GasResponse> {
  const url = process.env.GAS_WEB_APP_URL;
  const token = process.env.GAS_UPLOAD_TOKEN;
  if (!url || !token) throw new Error("ยังไม่ได้ตั้งค่า GAS_WEB_APP_URL หรือ GAS_UPLOAD_TOKEN");

  // ส่ง JSON โดยตรงเพื่อลด overhead จาก URL encoding ของ Base64
  const jsonBody = JSON.stringify({ action, token, data });
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json;charset=UTF-8" },
    body: jsonBody,
    redirect: "follow",
    cache: "no-store",
  });

  const text = await response.text();
  let payload: GasResponse;
  try {
    payload = JSON.parse(text) as GasResponse;
  } catch {
    const snippet = text.replace(/\s+/g, " ").slice(0, 180);
    throw new Error(
      `GAS ตอบกลับไม่ใช่ JSON (HTTP ${response.status})${snippet ? `: ${snippet}` : ""}`,
    );
  }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `GAS request failed (HTTP ${response.status})`);
  }
  return payload;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    if (byteLength(rawBody) > MAX_INCOMING_JSON_BYTES) {
      throw new Error("ข้อมูลรูปยังมีขนาดใหญ่เกินไป กรุณาลองใหม่ ระบบจะลดขนาดรูปให้อัตโนมัติ");
    }

    const body = JSON.parse(rawBody) as UploadBody;
    const files = normalizeFiles(body);
    validateFiles(files);

    // ส่งเพียงชื่อเดียว ไม่ทำสำเนา Base64 ซ้ำสามชุด
    const gasPayload = {
      groupId: body.groupId || crypto.randomUUID(),
      placeName: (body.placeName || "สถานที่ไม่ระบุชื่อ").trim(),
      files,
    };

    const result = await callGas("uploadBatchV2", gasPayload);
    const uploaded = result.files || result.data || [];
    if (!uploaded.length) throw new Error("GAS ไม่ได้คืนข้อมูลไฟล์ที่อัปโหลด");

    return NextResponse.json({ files: uploaded });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("[TravelTank300 upload]", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { fileId } = (await request.json()) as { fileId?: string };
    if (!fileId) throw new Error("ไม่พบ File ID");
    await callGas("delete", { fileId });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    console.error("[TravelTank300 delete image]", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
