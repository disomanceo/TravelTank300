export function driveOriginalUrl(fileId: string | null | undefined, fallback: string) {
  return fileId ? `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}` : fallback;
}

export function drivePreviewUrl(fileId: string | null | undefined, fallback: string, width = 1600) {
  return fileId ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${width}` : fallback;
}
