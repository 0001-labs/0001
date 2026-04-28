import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

interface Env {
  CONVEX_URL: string;
  META_APP_SECRET: string;
}

interface MetaSignedRequestPayload {
  algorithm?: string;
  issued_at?: number;
  expires?: number;
  user_id?: string;
}

interface JsonBody {
  signed_request?: string;
}

interface PagesContext<TEnv> {
  request: Request;
  env: TEnv;
}

type EnqueueArgs = {
  confirmationCode: string;
  metaUserId: string;
  requestedAt: number;
};

const enqueueFromMetaCallback =
  makeFunctionReference<"mutation", EnqueueArgs>("dataDeletionRequests:enqueueFromMetaCallback");

const jsonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });
}

function decodeBase64Url(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function decodeBase64UrlText(input: string): string {
  return new TextDecoder().decode(decodeBase64Url(input));
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }

  return difference === 0;
}

async function hmacSha256(payload: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return new Uint8Array(signature);
}

function isJsonBody(value: unknown): value is JsonBody {
  return typeof value === "object" && value !== null && "signed_request" in value;
}

async function extractSignedRequest(request: Request): Promise<string | null> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body: unknown = await request.json();
    if (isJsonBody(body) && typeof body.signed_request === "string") {
      return body.signed_request;
    }
    return null;
  }

  const formData = await request.formData();
  const signedRequest = formData.get("signed_request");
  return typeof signedRequest === "string" ? signedRequest : null;
}

export async function parseMetaSignedRequest(
  signedRequest: string,
  appSecret: string
): Promise<MetaSignedRequestPayload | null> {
  const parts = signedRequest.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [encodedSignature, encodedPayload] = parts;
  const signature = decodeBase64Url(encodedSignature);
  const expectedSignature = await hmacSha256(encodedPayload, appSecret);

  if (!timingSafeEqual(signature, expectedSignature)) {
    return null;
  }

  const payload: unknown = JSON.parse(decodeBase64UrlText(encodedPayload));
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const data = payload as MetaSignedRequestPayload;
  if (data.algorithm?.toUpperCase() !== "HMAC-SHA256" || typeof data.user_id !== "string") {
    return null;
  }

  return data;
}

function createConfirmationCode(metaUserId: string): string {
  const random = crypto.getRandomValues(new Uint8Array(12));
  const randomText = Array.from(random, (byte) => byte.toString(36).padStart(2, "0")).join("");
  return `meta-${metaUserId}-${Date.now().toString(36)}-${randomText}`.replace(/[^a-zA-Z0-9-]/g, "");
}

export const onRequestPost = async ({ request, env }: PagesContext<Env>): Promise<Response> => {
  if (!env.META_APP_SECRET) {
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  if (!env.CONVEX_URL) {
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  let signedRequest: string | null;
  try {
    signedRequest = await extractSignedRequest(request);
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  if (!signedRequest) {
    return jsonResponse({ error: "Missing signed_request" }, 400);
  }

  const payload = await parseMetaSignedRequest(signedRequest, env.META_APP_SECRET);
  if (!payload?.user_id) {
    return jsonResponse({ error: "Invalid signed_request" }, 401);
  }

  const requestedAt = Date.now();
  const confirmationCode = createConfirmationCode(payload.user_id);
  const url = `https://0001.dev/data-deletion?code=${encodeURIComponent(confirmationCode)}`;

  try {
    const convex = new ConvexHttpClient(env.CONVEX_URL);
    await convex.mutation(enqueueFromMetaCallback, {
      confirmationCode,
      metaUserId: payload.user_id,
      requestedAt,
    });
  } catch (error) {
    console.error("Failed to enqueue Meta data deletion request:", error);
    return jsonResponse({ error: "Failed to enqueue deletion request" }, 500);
  }

  return jsonResponse({ url, confirmation_code: confirmationCode });
};

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    headers: jsonHeaders,
  });
};
