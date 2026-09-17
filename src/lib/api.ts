import { signOut } from "firebase/auth";
import { auth } from "./firebase";

/** Thrown for any non-2xx response. `status` lets callers branch (404, 409, …). */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function readErrorMessage(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
  const message = body && typeof body.error === "string" ? body.error : "";
  return message || `HTTP ${res.status}`;
}

/**
 * Same-origin fetch with the Firebase ID token attached.
 * A 401/403 means the signed-in Google account is not the owner:
 * sign out so the user lands on the login screen instead of empty tables.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const user = auth.currentUser;
  const headers = new Headers(init.headers);
  if (user) headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, { ...init, headers });

  if (res.status === 401 || res.status === 403) {
    await signOut(auth);
    throw new ApiError(res.status, "החשבון הזה לא מורשה להיכנס למערכת.");
  }
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch<void>(path, { method: "DELETE" }),
};
