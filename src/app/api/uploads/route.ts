import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_INCOMING_JSON_BYTES = 2_850_000;
const GAS_TIMEOUT_MS = 24_000;
const GAS_HEALTH_TIMEOUT_MS = 8_000;
const GAS_URL_PATTERN = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(?:\?.*)?$/;

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
  service?: string;
  version?: string;
};

class GasRequestError extends Error {
  status: number;
  retryable: boolean;

  constructor(message: string, status = 502, retryable = true) {
    super(message);
    this.name = "GasRequestError";
    this.status = status;
    this.retryable = retryable;
  }
}

let lastHealthyGasUrl = "";
let lastHealthCheckAt = 0;

function normalizeFiles(body: UploadBody): UploadItem[] {
  const candidates = [body.files, body.photoPairs, body.pairs];
  return candidates.find((value) => Array.isArray(value) && value.length > 0) ?? [];
}

function validateFiles(files: UploadItem[]): void {
  if (!files.length) throw new GasRequestError("ไม่พบข้อมูลรูปภาพสำหรับอัปโหลด", 400, false);
  if (files.length > 1) {
    throw new GasRequestError("ระบบอัปโหลดรองรับครั้งละ 1 รูปต่อคำขอ", 400, false);
  }

  for (const [index, file] of files.entries()) {
    if (!file.originalBase64 || !file.previewBase64) {
      throw new GasRequestError(`ข้อมูลรูปที่ ${index + 1} ไม่ครบถ้วน`, 400, false);
    }
  }
}

function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

function getGasConfiguration(): { url: string; token: string } {
  const url = (process.env.GAS_WEB_APP_URL || "").trim();
  const token = (process.env.GAS_UPLOAD_TOKEN || "").trim();
  if (!url || !token) {
    throw new GasRequestError("ยังไม่ได้ตั้งค่า GAS_WEB_APP_URL หรือ GAS_UPLOAD_TOKEN", 500, false);
  }
  if (!GAS_URL_PATTERN.test(url)) {
    throw new GasRequestError(
      "GAS_WEB_APP_URL ไม่ถูกต้อง ต้องเป็น URL Web App ที่ลงท้ายด้วย /exec",
      500,
      false,
    );
  }
  return { url, token };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new GasRequestError(
        "GAS ใช้เวลาตอบกลับนานเกินไป กรุณาลองใหม่อีกครั้ง",
        504,
        true,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function ensureGasHealthy(url: string): Promise<void> {
  const now = Date.now();
  if (lastHealthyGasUrl === url && now - lastHealthCheckAt < 5 * 60_000) return;

  const response = await fetchWithTimeout(
    url,
    {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: { Accept: "application/json,text/plain;q=0.9,*/*;q=0.1" },
    },
    GAS_HEALTH_TIMEOUT_MS,
  );
  const text = await response.text();
  let payload: GasResponse | null = null;
  try {
    payload = JSON.parse(text) as GasResponse;
  } catch {
    // handled below
  }

  if (!response.ok || !payload?.success || !payload.service) {
    const snippet = text.replace(/\s+/g, " ").slice(0, 120);
    throw new GasRequestError(
      `ตรวจสอบ GAS ไม่ผ่าน (HTTP ${response.status}) กรุณาตรวจ URL /exec และ Deploy เป็น New version${snippet ? `: ${snippet}` : ""}`,
      502,
      false,
    );
  }

  lastHealthyGasUrl = url;
  lastHealthCheckAt = now;
}

async function parseGasResponse(response: Response): Promise<GasResponse> {
  const text = await response.text();
  try {
    return JSON.parse(text) as GasResponse;
  } catch {
    const snippet = text.replace(/\s+/g, " ").slice(0, 160);
    const isHtml = /<!doctype html|<html/i.test(text);
    throw new GasRequestError(
      isHtml
        ? `GAS ส่งหน้า HTML กลับมา (HTTP ${response.status}) กรุณาตรวจ Deployment URL /exec และสิทธิ์ Who has access`
        : `GAS ตอบกลับไม่ใช่ JSON (HTTP ${response.status})${snippet ? `: ${snippet}` : ""}`,
      502,
      false,
    );
  }
}

async function postGasJson(url: string, token: string, action: string, data: unknown) {
  return fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        Accept: "application/json,text/plain;q=0.9,*/*;q=0.1",
      },
      body: JSON.stringify({ action, token, data }),
      redirect: "follow",
      cache: "no-store",
    },
    GAS_TIMEOUT_MS,
  );
}

async function postGasForm(url: string, token: string, action: string, data: unknown) {
  const body = new URLSearchParams();
  body.set("action", action);
  body.set("token", token);
  body.set("data", JSON.stringify(data));
  return fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        Accept: "application/json,text/plain;q=0.9,*/*;q=0.1",
      },
      body,
      redirect: "follow",
      cache: "no-store",
    },
    GAS_TIMEOUT_MS,
  );
}

async function callGas(action: string, data: unknown): Promise<GasResponse> {
  const { url, token } = getGasConfiguration();
  await ensureGasHealthy(url);

  let response = await postGasJson(url, token, action, data);
  let payload: GasResponse;

  try {
    payload = await parseGasResponse(response);
  } catch (error) {
    // บาง Deployment รับ form-urlencoded ได้เสถียรกว่า JSON จึงลองสำรองหนึ่งครั้ง
    if (!(error instanceof GasRequestError) || !/HTML|ไม่ใช่ JSON/.test(error.message)) throw error;
    response = await postGasForm(url, token, action, data);
    payload = await parseGasResponse(response);
  }

  if (!response.ok || payload.success === false) {
    const unauthorized = /unauthorized/i.test(payload.message || "");
    throw new GasRequestError(
      payload.message || `GAS request failed (HTTP ${response.status})`,
      unauthorized ? 401 : 502,
      !unauthorized && response.status >= 500,
    );
  }
  return payload;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    if (byteLength(rawBody) > MAX_INCOMING_JSON_BYTES) {
      throw new GasRequestError(
        "ข้อมูลรูปยังมีขนาดใหญ่เกินไป กรุณาลองใหม่ ระบบจะลดขนาดรูปให้อัตโนมัติ",
        413,
        false,
      );
    }

    const body = JSON.parse(rawBody) as UploadBody;
    const files = normalizeFiles(body);
    validateFiles(files);

    const gasPayload = {
      groupId: body.groupId || crypto.randomUUID(),
      placeName: (body.placeName || "สถานที่ไม่ระบุชื่อ").trim(),
      files,
    };

    const result = await callGas("uploadBatchV2", gasPayload);
    const uploaded = result.files || result.data || [];
    if (!uploaded.length) {
      throw new GasRequestError("GAS ไม่ได้คืนข้อมูลไฟล์ที่อัปโหลด", 502, true);
    }

    return NextResponse.json({ files: uploaded });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const status = error instanceof GasRequestError ? error.status : 500;
    const retryable = error instanceof GasRequestError ? error.retryable : true;
    console.error("[TravelTank300 upload]", message);
    return NextResponse.json({ message, retryable }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { fileId } = (await request.json()) as { fileId?: string };
    if (!fileId) throw new GasRequestError("ไม่พบ File ID", 400, false);
    await callGas("delete", { fileId });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    const status = error instanceof GasRequestError ? error.status : 500;
    const retryable = error instanceof GasRequestError ? error.retryable : true;
    console.error("[TravelTank300 delete image]", message);
    return NextResponse.json({ message, retryable }, { status });
  }
}
