import type { UploadedPhoto } from "@/types/travel";

const PREVIEW_MAX_EDGE = 900;
const PREVIEW_QUALITY = 0.6;
const ORIGINAL_START_EDGE = 1700;
const ORIGINAL_MIN_EDGE = 1100;
const ORIGINAL_START_QUALITY = 0.74;
const ORIGINAL_MIN_QUALITY = 0.46;
const MAX_REQUEST_JSON_BYTES = 2_600_000;
const MAX_CONCURRENT_UPLOADS = 1;
const MAX_RETRIES = 3;

type UploadPayload = {
  fileName: string;
  mimeType: string;
  originalBase64: string;
  previewBase64: string;
};

type UploadApiResponse = {
  files?: UploadedPhoto[];
  message?: string;
  retryable?: boolean;
};

class UploadRequestError extends Error {
  retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = "UploadRequestError";
    this.retryable = retryable;
  }
}

function jsonByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

async function canvasFile(
  source: File,
  maxEdge: number,
  quality: number,
  suffix: string,
): Promise<File> {
  const bitmap = await createImageBitmap(source);
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("ไม่สามารถเตรียมรูปภาพได้");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error("บีบอัดรูปไม่สำเร็จ"))),
        "image/jpeg",
        quality,
      );
    });

    const baseName = source.name.replace(/\.[^.]+$/, "") || "travel-photo";
    return new File([blob], `${baseName}-${suffix}.jpg`, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}

async function toBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error ?? new Error("อ่านไฟล์รูปไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

async function preparePayload(file: File, groupId: string, placeName: string): Promise<UploadPayload> {
  const preview = await canvasFile(file, PREVIEW_MAX_EDGE, PREVIEW_QUALITY, "preview");
  const previewBase64 = await toBase64(preview);

  let edge = ORIGINAL_START_EDGE;
  let quality = ORIGINAL_START_QUALITY;

  while (true) {
    const original = await canvasFile(file, edge, quality, "original");
    const originalBase64 = await toBase64(original);
    const payload: UploadPayload = {
      fileName: original.name.replace(/-original\.jpg$/, ".jpg"),
      mimeType: "image/jpeg",
      originalBase64,
      previewBase64,
    };

    const requestBody = { groupId, placeName, files: [payload] };
    if (jsonByteLength(requestBody) <= MAX_REQUEST_JSON_BYTES) return payload;

    if (quality > ORIGINAL_MIN_QUALITY) {
      quality = Math.max(ORIGINAL_MIN_QUALITY, quality - 0.08);
      continue;
    }
    if (edge > ORIGINAL_MIN_EDGE) {
      edge = Math.max(ORIGINAL_MIN_EDGE, edge - 200);
      quality = 0.62;
      continue;
    }

    throw new UploadRequestError(
      "รูปภาพมีขนาดใหญ่เกินไปหลังบีบอัด กรุณาลองเลือกรูปอื่น",
      false,
    );
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function uploadOne(
  file: File,
  groupId: string,
  placeName: string,
  attempt = 1,
): Promise<UploadedPhoto> {
  try {
    const payload = await preparePayload(file, groupId, placeName);
    const body = JSON.stringify({ groupId, placeName, files: [payload] });

    const response = await fetch("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const data = (await response.json().catch(() => ({}))) as UploadApiResponse;
    if (!response.ok || !data.files?.length) {
      throw new UploadRequestError(
        data.message || `อัปโหลดไม่สำเร็จ (HTTP ${response.status})`,
        data.retryable ?? response.status >= 500,
      );
    }
    return data.files[0];
  } catch (error) {
    const retryable = error instanceof UploadRequestError ? error.retryable : true;
    if (retryable && attempt < MAX_RETRIES) {
      await wait(900 * attempt);
      return uploadOne(file, groupId, placeName, attempt + 1);
    }
    throw error;
  }
}

export async function uploadTravelPhotos(
  files: File[],
  groupId: string,
  onProgress?: (done: number, total: number) => void,
  placeName = "สถานที่ไม่ระบุชื่อ",
): Promise<UploadedPhoto[]> {
  const images = files.filter((file) => file.type.startsWith("image/"));
  if (!images.length) return [];

  const results: UploadedPhoto[] = new Array(images.length);
  let cursor = 0;
  let completed = 0;
  onProgress?.(0, images.length);

  async function worker(): Promise<void> {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= images.length) return;
      results[index] = await uploadOne(images[index], groupId, placeName);
      completed += 1;
      onProgress?.(completed, images.length);
    }
  }

  const workerCount = Math.min(MAX_CONCURRENT_UPLOADS, images.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
