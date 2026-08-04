import type { UploadedPhoto } from "@/types/travel";

const PREVIEW_MAX_EDGE = 1600;
const PREVIEW_QUALITY = 0.8;

async function createPreview(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} ไม่ใช่ไฟล์รูปภาพ`);

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, PREVIEW_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("ไม่สามารถเตรียมรูปตัวอย่างได้");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("บีบอัดรูปภาพไม่สำเร็จ"))),
      "image/jpeg",
      PREVIEW_QUALITY,
    );
  });

  const stem = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${stem}-preview.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}

export async function uploadTravelPhotos(files: File[], collectionId: string): Promise<UploadedPhoto[]> {
  if (files.length === 0) return [];

  const previews = await Promise.all(files.map(createPreview));
  const body = new FormData();
  body.set("collectionId", collectionId);

  files.forEach((file, index) => {
    body.append("originals", file, file.name);
    body.append("previews", previews[index], previews[index].name);
  });

  const response = await fetch("/api/uploads", { method: "POST", body });
  const text = await response.text();
  let payload: { success?: boolean; files?: UploadedPhoto[]; message?: string };
  try {
    payload = JSON.parse(text) as typeof payload;
  } catch {
    throw new Error(`ระบบอัปโหลดตอบกลับไม่ถูกต้อง: ${text.slice(0, 180)}`);
  }

  if (!response.ok || !payload.success || !payload.files) {
    throw new Error(payload.message || "อัปโหลดรูปภาพไม่สำเร็จ");
  }
  return payload.files;
}
