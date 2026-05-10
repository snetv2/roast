const BASE = (import.meta.env.VITE_API_BASE ?? "/api").replace(/\/$/, "");

export type Me = {
  sub: string;
  email?: string;
  name?: string;
  isAdmin: boolean;
  roles: string[];
};

export type Technology = {
  slug: string;
  name: string;
  categories: string[];
  roast_text: string | null;
  rating: number | null;
  logo_filename: string | null;
  updated_at?: string;
  confidence?: number | null;
};

export type Scan = {
  id: string;
  url: string;
  status: "pending" | "ready" | "error";
  error?: string | null;
  created_at: string;
  finished_at?: string | null;
  technologies?: Technology[];
};

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: "include", ...init });
  if (res.status === 401) {
    throw new AuthError();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.toString?.() ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export class AuthError extends Error {
  constructor() {
    super("unauthenticated");
  }
}

export const api = {
  base: BASE,
  me: () => req<Me>("/auth/me"),
  logout: () => req<{ ok: true }>("/auth/logout", { method: "POST" }),
  loginUrl: (returnTo: string) =>
    `${BASE}/auth/login?returnTo=${encodeURIComponent(returnTo)}`,
  submitScan: (url: string) =>
    req<{ id: string; status: string }>("/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }),
  scan: (id: string) => req<Scan>(`/scans/${id}`),
  scans: () => req<{ scans: Scan[] }>("/scans"),
  technologies: () => req<{ technologies: Technology[] }>("/technologies"),
  technology: (slug: string) => req<Technology>(`/technologies/${slug}`),
  updateTech: (slug: string, body: Partial<Pick<Technology, "roast_text" | "rating">>) =>
    req<Technology>(`/technologies/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  uploadLogo: async (slug: string, file: File) => {
    const fd = new FormData();
    fd.append("logo", file);
    return req<{ slug: string; logo_filename: string }>(`/technologies/${slug}/logo`, {
      method: "PUT",
      body: fd,
    });
  },
  deleteLogo: (slug: string) =>
    req<{ ok: true }>(`/technologies/${slug}/logo`, { method: "DELETE" }),
  logoUrl: (filename: string) => `${BASE}/logos/${filename}`,
};
