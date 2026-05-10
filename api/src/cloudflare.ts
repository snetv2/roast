import { env } from "./env.js";

const BASE = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/urlscanner/v2`;

const headers = () => ({
  Authorization: `Bearer ${env.CF_API_TOKEN}`,
  "Content-Type": "application/json",
});

export async function submitScan(url: string): Promise<string> {
  const r = await fetch(`${BASE}/scan`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ url, visibility: "Unlisted" }),
  });
  const body = await r.json().catch(() => ({}) as any);
  if (!r.ok) {
    const msg = body?.errors?.[0]?.message ?? r.statusText;
    throw new Error(`cloudflare submit failed (${r.status}): ${msg}`);
  }
  const uuid: string | undefined = body?.result?.uuid ?? body?.uuid;
  if (!uuid) throw new Error("cloudflare submit returned no uuid");
  return uuid;
}

export type WappaTech = {
  app: string;
  slug?: string;
  categories?: { name: string }[] | string[];
  confidence?: number;
  icon?: string;
};

export type ScanResult = {
  ready: boolean;
  technologies?: WappaTech[];
  raw?: unknown;
};

export async function fetchScanResult(uuid: string): Promise<ScanResult> {
  const r = await fetch(`${BASE}/result/${uuid}`, { headers: headers() });
  if (r.status === 404 || r.status === 202) return { ready: false };
  const body = await r.json().catch(() => ({}) as any);
  if (!r.ok) {
    const msg = body?.errors?.[0]?.message ?? r.statusText;
    throw new Error(`cloudflare result failed (${r.status}): ${msg}`);
  }
  const wappa = body?.data?.scan?.meta?.processors?.wappa
    ?? body?.scan?.meta?.processors?.wappa
    ?? body?.meta?.processors?.wappa;
  return { ready: true, technologies: Array.isArray(wappa) ? wappa : [], raw: body };
}

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function categoriesOf(t: WappaTech): string[] {
  if (!t.categories) return [];
  return t.categories.map((c) => (typeof c === "string" ? c : c.name)).filter(Boolean);
}
