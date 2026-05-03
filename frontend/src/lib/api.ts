import { auth } from "./firebase";

const API_BASE = import.meta.env.VITE_API_URL || "";

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) return {};

  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export { API_BASE };
