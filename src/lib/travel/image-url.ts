export function extractDriveFileId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const patterns = [
    /[?&]id=([^&#]+)/i,
    /\/d\/([^/?#]+)/i,
    /googleusercontent\.com\/d\/([^=?&#/]+)/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }

  // A raw Drive file id is also accepted.
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed;
  return null;
}

function imageProxyUrl(fileId: string, width?: number, original = false) {
  const params = new URLSearchParams();
  if (width) params.set("w", String(width));
  if (original) params.set("original", "1");
  const query = params.toString();
  return `/api/images/${encodeURIComponent(fileId)}${query ? `?${query}` : ""}`;
}

export function driveOriginalUrl(fileId: string | null | undefined, fallback: string) {
  const resolvedId = fileId || extractDriveFileId(fallback);
  return resolvedId ? imageProxyUrl(resolvedId, undefined, true) : fallback;
}

export function drivePreviewUrl(fileId: string | null | undefined, fallback: string, width = 960) {
  // Prefer the preview/thumbnail file id contained in fallback. The stored
  // drive_file_id normally points to the original file.
  const previewId = extractDriveFileId(fallback);
  const resolvedId = previewId || fileId;
  return resolvedId ? imageProxyUrl(resolvedId, width) : fallback;
}

export function coverPreviewUrl(coverUrl: string | null | undefined, width = 480) {
  const fileId = extractDriveFileId(coverUrl);
  return fileId ? imageProxyUrl(fileId, width) : coverUrl || "/places/forest.svg";
}
