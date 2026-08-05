import type { UploadedPhoto } from "@/types/travel";

const MAX_EDGE = 1120;
const QUALITY = 0.68;
const BATCH_SIZE = 3;
const MAX_CONCURRENT_BATCHES = 2;

type PreparedPhoto = {
  original: File;
  preview: File;
};

type UploadPayload = {
  fileName: string;
  mimeType: string;
  originalBase64: string;
  previewBase64: string;
};

async function createPreview(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("สร้าง Preview ไม่สำเร็จ"))),
      "image/jpeg",
      QUALITY,
    );
  });

  bitmap.close();
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}-preview.jpg`, {
    type: "image/jpeg",
  });
}

async function toBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function uploadTravelPhotos(
  files: File[],
  groupId: string,
  onProgress?: (done: number, total: number) => void,
): Promise<UploadedPhoto[]> {
  if (!files.length) return [];

  let preparedCount = 0;
  const preparedPhotos: PreparedPhoto[] = await Promise.all(
    files.map(async (file) => {
      const preview = await createPreview(file);
      preparedCount += 1;
      onProgress?.(preparedCount, files.length * 2);
      return { original: file, preview };
    }),
  );

  const batches: PreparedPhoto[][] = [];
  for (let index = 0; index < preparedPhotos.length; index += BATCH_SIZE) {
    batches.push(preparedPhotos.slice(index, index + BATCH_SIZE));
  }

  const results: UploadedPhoto[][] = new Array<UploadedPhoto[]>(batches.length);
  let nextBatchIndex = 0;
  let uploadedCount = 0;

  async function worker(): Promise<void> {
    while (true) {
      const batchIndex = nextBatchIndex;
      nextBatchIndex += 1;
      if (batchIndex >= batches.length) return;

      const payload: UploadPayload[] = await Promise.all(
        batches[batchIndex].map(async ({ original, preview }) => ({
          fileName: original.name,
          mimeType: original.type,
          originalBase64: await toBase64(original),
          previewBase64: await toBase64(preview),
        })),
      );

      const response = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, files: payload }),
      });
      const data = (await response.json()) as { message?: string; files?: UploadedPhoto[] };
      if (!response.ok || !data.files) {
        throw new Error(data.message || "อัปโหลดรูปไม่สำเร็จ");
      }

      results[batchIndex] = data.files;
      uploadedCount += payload.length;
      onProgress?.(files.length + uploadedCount, files.length * 2);
    }
  }

  const workerCount = Math.min(MAX_CONCURRENT_BATCHES, batches.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results.flat();
}
