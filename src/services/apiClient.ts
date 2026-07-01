import { API_CONFIG } from "./config";
import { clearSession, getSession, isExpired, setSession } from "./tokenStorage";
import { showGlobalToast } from "../utils/globalToast";
import { router } from "expo-router";

// ============================================================================
// TYPES
// ============================================================================
type ApiEnvelope<T> = {
  Success: boolean;
  StatusCode: number;
  Message: string;
  ErrorCode: string | null;
  TraceId: string;
  Data: T | null;
};

type BackendAuthData = {
  UserId: string;
  Name: string;
  Mobile: string;
  Email?: string;

  AccessToken: string;
  AccessTokenExpiresAt: string;
  RefreshToken: string;
  RefreshTokenExpiresAt: string;
};

export class ApiError extends Error {
  status: number;
  url: string;
  traceId?: string;
  errorCode?: string | null;
  details?: unknown;

  constructor(params: {
    message: string;
    status: number;
    url: string;
    traceId?: string;
    errorCode?: string | null;
    details?: unknown;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status;
    this.url = params.url;
    this.traceId = params.traceId;
    this.errorCode = params.errorCode;
    this.details = params.details;
  }
}

export const isSessionExpiredError = (err: unknown) =>
  err instanceof ApiError &&
  err.status === 401 &&
  err.message === "Session expired";

let refreshPromise: Promise<string> | null = null;
let isNavigatingToLogin = false;
export let sessionExpiredFlag = false;
export let justLoggedOutFlag = false;

export function resetJustLoggedOutFlag() {
  justLoggedOutFlag = false;
}

export function setJustLoggedOutFlag(value: boolean) {
  justLoggedOutFlag = value;
}

function buildUrl(path: string) {
  if (path.startsWith("http")) return path;
  if (!path.startsWith("/")) path = `/${path}`;
  const full = `${API_CONFIG.BASE_URL}${path}`;
  return full;
}

async function parseError(res: Response): Promise<ApiError> {
  const url = res.url || "unknown";
  const status = res.status;

  let message = `Request failed (${status})`;
  let traceId: string | undefined;
  let errorCode: string | null | undefined;
  let details: unknown;

  try {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await res.json();

      const envMessage =
        j?.Message ??
        j?.message ??
        j?.title ??
        j?.error ??
        j?.error_description;

      const envTrace = j?.TraceId ?? j?.traceId ?? j?.trace_id ?? j?.traceid;
      const envErrorCode = j?.ErrorCode ?? j?.errorCode ?? j?.code;

      if (envMessage) message = String(envMessage);
      if (envTrace) traceId = String(envTrace);
      if (envErrorCode !== undefined) errorCode = String(envErrorCode);

      details = j;

      return new ApiError({ message, status, url, traceId, errorCode, details });
    }
  } catch {
  }

  try {
    const t = await res.text();
    if (t) message = t.slice(0, 500);
  } catch {
  }

  return new ApiError({ message, status, url, traceId, errorCode, details });
}

async function handleSessionExpired() {
  if (isNavigatingToLogin) {
    return;
  }
  isNavigatingToLogin = true;

  sessionExpiredFlag = true;

  await clearSession();
  showGlobalToast("Session expired. Please login again.", { type: "error" });

  setTimeout(() => {
    router.replace("/(auth)/login");
    isNavigatingToLogin = false;
  }, 50);
}

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const session = await getSession();

    if (!session.refreshToken || isExpired(session.refreshTokenExpiresAt)) {
      await handleSessionExpired();
      throw new ApiError({
        message: "Session expired",
        status: 401,
        url: buildUrl("/api/auth/refresh"),
      });
    }

    const res = await fetch(buildUrl("/api/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Never log token values!
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });

    if (!res.ok) {
      await handleSessionExpired();
      throw await parseError(res);
    }

    const json = (await res.json()) as ApiEnvelope<BackendAuthData>;
    const d = json?.Data;

    if (!json?.Success || !d?.AccessToken || !d?.RefreshToken) {
      await handleSessionExpired();
      throw new ApiError({
        message: json?.Message || "Refresh failed",
        status: json?.StatusCode ?? 500,
        url: res.url || buildUrl("/api/auth/refresh"),
        traceId: json?.TraceId,
        errorCode: json?.ErrorCode,
        details: json,
      });
    }

    sessionExpiredFlag = false;

    await setSession({
      accessToken: d.AccessToken,
      accessTokenExpiresAt: d.AccessTokenExpiresAt,
      refreshToken: d.RefreshToken,
      refreshTokenExpiresAt: d.RefreshTokenExpiresAt,
    });
    return d.AccessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  cfg: { auth?: boolean; retryOn401?: boolean } = {}
) {
  const { auth = true, retryOn401 = true } = cfg;

  const url = buildUrl(path);
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const session = await getSession();
    if (session.accessToken) {
      headers.set("Authorization", `Bearer ${session.accessToken}`);
    }
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && auth && retryOn401) {
    try {
      const newToken = await refreshAccessToken();

      const retryHeaders = new Headers(headers);
      retryHeaders.set("Authorization", `Bearer ${newToken}`);
      return fetch(url, { ...options, headers: retryHeaders });
    } catch {
      await handleSessionExpired();
      throw new ApiError({
        message: "Session expired",
        status: 401,
        url,
      });
    }
  }

  return res;
}

export async function apiJson<T>(
  path: string,
  options: RequestInit = {},
  cfg: { auth?: boolean; retryOn401?: boolean } = {}
): Promise<T> {
  const res = await apiFetch(path, options, cfg);

  if (!res.ok) {
    throw await parseError(res);
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ApiError({
      message: "Invalid JSON response",
      status: res.status,
      url: res.url || buildUrl(path),
    });
  }

  const maybeEnv = json as Partial<ApiEnvelope<unknown>>;
  const looksLikeEnvelope =
    typeof maybeEnv === "object" &&
    maybeEnv !== null &&
    ("Success" in maybeEnv || "StatusCode" in maybeEnv || "Message" in maybeEnv);

  if (looksLikeEnvelope) {
    if (maybeEnv.Success === false) {
      throw new ApiError({
        message: String(maybeEnv.Message || "Request failed"),
        status: Number(maybeEnv.StatusCode ?? res.status ?? 500),
        url: res.url || buildUrl(path),
        traceId: (maybeEnv as ApiEnvelope<unknown>).TraceId,
        errorCode: (maybeEnv as ApiEnvelope<unknown>).ErrorCode,
        details: json,
      });
    }
  }

  return json as T;
}

// Suppress duplicate unhandled-rejection noise for known session-expired errors.
(() => {
  const g: any = (globalThis ?? (global as any) ?? {}) as any;
  if (g && !g.__blinkdemoUnhandledPatch) {
    const prev = g.onunhandledrejection;
    g.onunhandledrejection = (e: any) => {
      const r = e?.reason;
      if (
        r?.name === "ApiError" &&
        r?.status === 401 &&
        r?.message === "Session expired"
      ) {
        return;
      }
      prev?.(e);
    };
    g.__blinkdemoUnhandledPatch = true;
  }
})();
