import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAuth } from "../auth/middleware.js";
import { submitScan, fetchScanResult, slugify, categoriesOf } from "../cloudflare.js";

export const scansRouter = Router();

const SubmitBody = z.object({
  url: z.string().url(),
});

scansRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const { url } = SubmitBody.parse(req.body);
    const uuid = await submitScan(url);
    const { rows } = await pool.query<{ id: string }>(
      `insert into scans (url, cf_uuid, status, requested_by)
       values ($1,$2,'pending',$3) returning id`,
      [url, uuid, req.session.user!.sub],
    );
    res.status(202).json({ id: rows[0].id, status: "pending" });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.flatten() });
    next(e);
  }
});

scansRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `select id, url, status, created_at, finished_at
       from scans
       where requested_by = $1
       order by created_at desc
       limit 25`,
      [req.session.user!.sub],
    );
    res.json({ scans: rows });
  } catch (e) {
    next(e);
  }
});

scansRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "bad id" });

    const { rows } = await pool.query<{
      id: string;
      url: string;
      cf_uuid: string | null;
      status: "pending" | "ready" | "error";
      error: string | null;
      requested_by: string;
    }>(
      `select id, url, cf_uuid, status, error, requested_by from scans where id = $1`,
      [id],
    );
    const scan = rows[0];
    if (!scan) return res.status(404).json({ error: "not found" });
    if (scan.requested_by !== req.session.user!.sub && !req.session.user!.isAdmin) {
      return res.status(403).json({ error: "forbidden" });
    }

    if (scan.status === "pending" && scan.cf_uuid) {
      try {
        const result = await fetchScanResult(scan.cf_uuid);
        if (result.ready) {
          await persistScanResult(Number(scan.id), result.technologies ?? [], result.raw);
        }
      } catch (e) {
        await pool.query(
          `update scans set status='error', error=$2, finished_at=now() where id=$1`,
          [id, (e as Error).message],
        );
      }
    }

    const final = await pool.query(
      `select s.id, s.url, s.status, s.error, s.created_at, s.finished_at,
              coalesce(json_agg(
                json_build_object(
                  'slug', t.slug,
                  'name', t.name,
                  'categories', t.categories,
                  'roast_text', t.roast_text,
                  'rating', t.rating,
                  'logo_filename', t.logo_filename,
                  'confidence', st.confidence
                ) order by t.name
              ) filter (where t.slug is not null), '[]') as technologies
       from scans s
       left join scan_technologies st on st.scan_id = s.id
       left join technologies t on t.slug = st.tech_slug
       where s.id = $1
       group by s.id`,
      [id],
    );
    res.json(final.rows[0]);
  } catch (e) {
    next(e);
  }
});

async function persistScanResult(
  scanId: number,
  techs: ReturnType<typeof Object>[] | any[],
  raw: unknown,
) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const t of techs) {
      const name = String(t.app ?? t.name ?? "").trim();
      if (!name) continue;
      const slug = t.slug ? String(t.slug) : slugify(name);
      const cats = categoriesOf(t);
      await client.query(
        `insert into technologies (slug, name, categories)
         values ($1,$2,$3)
         on conflict (slug) do update set
           name = excluded.name,
           categories = case
             when array_length(excluded.categories,1) is null then technologies.categories
             else excluded.categories
           end`,
        [slug, name, cats],
      );
      await client.query(
        `insert into scan_technologies (scan_id, tech_slug, confidence)
         values ($1,$2,$3)
         on conflict do nothing`,
        [scanId, slug, t.confidence ?? null],
      );
    }
    await client.query(
      `update scans set status='ready', result=$2, finished_at=now() where id=$1`,
      [scanId, raw ?? null],
    );
    await client.query("commit");
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}
