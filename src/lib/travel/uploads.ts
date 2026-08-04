import type { UploadedPhoto } from "@/types/travel";

const PREVIEW_MAX_EDGE = 1120;
const PREVIEW_QUALITY = 0.68;
const CLIENT_BATCH_SIZE = 3;
const MAX_CONCURRENT_BATCHES = 2;

async function createPreview(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} ไม่ใช่ไฟล์รูปภาพ`);
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, PREVIEW_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("ไม่สามารถเตรียมรูปตัวอย่างได้");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("บีบอัดรูปภาพไม่สำเร็จ")), "image/jpeg", PREVIEW_QUALITY);
  });
  const stem = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${stem}-preview.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}

async function uploadBatch(files: File[], previews: File[], collectionId: string, batchIndex: number): Promise<UploadedPhoto[]> {
  const body = new FormData();
  body.set("collectionId", `${collectionId}-${String(batchIndex + 1).padStart(2, "0")}`);
  files.forEach((file, index) => {
    body.append("originals", file, file.name);
    body.append("previews", previews[index], previews[index].name);
  });
  const response = await fetch("/api/uploads", { method: "POST", body });
  const text = await response.text();
  let payload: { success?: boolean; files?: UploadedPhoto[]; message?: string };
  try { payload = JSON.parse(text) as typeof payload; }
  catch { throw new Error(`ระบบอัปโหลดตอบกลับไม่ถูกต้อง: ${text.slice(0, 180)}`); }
  if (!response.ok || !payload.success || !payload.files) throw new Error(payload.message || "อัปโหลดรูปภาพไม่สำเร็จ");
  return payload.files;
}

export async function uploadTravelPhotos(
  files: File[],
  collectionId: string,
  onProgress?: (completed: number, total: number) => void,
): Promise<UploadedPhoto[]> {
  if (files.length === 0) return [];
  const previews: File[] = [];
  for (let index = 0; index < files.length; index += 1) {
    previews.push(await createPreview(files[index]));
    onProgress?.(index + 1, files.length * 2);
  }

  const batches: Array<{ files: File[]; previews: File[]; index: number }> = [];
  for (let index = 0; index < files.length; index += CLIENT_BATCH_SIZE) {
    batches.push({ files: files.slice(index, index + CLIENT_BATCH_SIZE), previews: previews.slice(index, index + CLIENT_BATCH_SIZE), index: batches.length });
  }

  const results: UploadedPhoto[][] = new Array(batches.length);
  let cursor = 0;
  let uploadedCount = 0;
  async function worker() {
    while (cursor < batches.length) {
      const current = cursor++;
      const batch = batches[current];
      results[current] = await uploadBatch(batch.files, batch.previews, collectionId, batch.index);
      uploadedCount += batch.files.length;
      onProgress?.(files.length + uploadedCount, files.length * 2);
    }
  }
  await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT_BATCHES, batches.length) }, () => worker()));
  return results.flat();
}
