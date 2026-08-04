import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ORIGINAL_BYTES = 20 * 1024 * 1024;
const BATCH_SIZE = 3;

type GasFile = {
  driveFileId: string;
  driveUrl: string;
  thumbnailUrl: string;
  fileName: string;
  mimeType: string;
  previewDriveFileId?: string;
};

type Pair = { original: File; preview: File };

async function parseGasResponse(response: Response) {
  const raw = await response.text();
  let parsed: { success?: boolean; files?: GasFile[]; message?: string };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    throw new Error(`GAS ไม่ได้ตอบกลับเป็น JSON: ${raw.replace(/\s+/g, " ").slice(0, 220)}`);
  }
  if (!response.ok || !parsed.success) throw new Error(parsed.message || `GAS HTTP ${response.status}`);
  return parsed;
}

async function encodeFile(file: File) {
  return {
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
  };
}

async function uploadBatch(gasUrl: string, token: string, collectionId: string, pairs: Pair[]): Promise<GasFile[]> {
  const encodedPairs = await Promise.all(
    pairs.map(async ({ original, preview }) => {
      if (!original.type.startsWith("image/")) throw new Error(`${original.name} ไม่ใช่ไฟล์รูปภาพ`);
      if (original.size > MAX_ORIGINAL_BYTES) throw new Error(`${original.name} มีขนาดเกิน 20 MB`);
      return { original: await encodeFile(original), preview: await encodeFile(preview) };
    }),
  );

  const body = new URLSearchParams();
  body.set("action", "uploadBatchV2");
  body.set("token", token);
  body.set("data", JSON.stringify({ collectionId, pairs: encodedPairs }));

  const response = await fetch(gasUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
    redirect: "follow",
    cache: "no-store",
  });
  const result = await parseGasResponse(response);
  return result.files ?? [];
}

export async function POST(request: Request) {
  const gasUrl = process.env.GAS_WEB_APP_URL;
  const token = process.env.GAS_UPLOAD_TOKEN;
  if (!gasUrl || !token) {
    return NextResponse.json({ success: false, message: "ยังไม่ได้ตั้งค่า GAS_WEB_APP_URL และ GAS_UPLOAD_TOKEN" }, { status: 503 });
  }

  try {
    const form = await request.formData();
    const collectionId = String(form.get("collectionId") || crypto.randomUUID());
    const originals = form.getAll("originals").filter((item): item is File => item instanceof File);
    const previews = form.getAll("previews").filter((item): item is File => item instanceof File);

    if (originals.length !== previews.length) throw new Error("จำนวนรูปต้นฉบับและรูปตัวอย่างไม่ตรงกัน");
    if (!originals.length) return NextResponse.json({ success: true, files: [] });

    const pairs = originals.map((original, index) => ({ original, preview: previews[index] }));
    const groups: Pair[][] = [];
    for (let index = 0; index < pairs.length; index += BATCH_SIZE) groups.push(pairs.slice(index, index + BATCH_SIZE));

    const uploadedGroups = await Promise.all(groups.map((group) => uploadBatch(gasUrl, token, collectionId, group)));
    return NextResponse.json({ success: true, files: uploadedGroups.flat() });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "อัปโหลดรูปภาพไม่สำเร็จ" }, { status: 400 });
  }
}
