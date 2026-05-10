import { Router } from "express";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { extname, join } from "node:path";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import multer from "multer";
import { pool } from "../db.js";
import { env } from "../env.js";
import { requireAuth, requireAdmin } from "../auth/middleware.js";

export const techRouter = Router();

if (!existsSync(env.LOGO_DIR)) mkdirSync(env.LOGO_DIR, { recursive: true });

const ALLOWED_LOGO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, env.LOGO_DIR),
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase().slice(0, 6) || "";
      const safeExt = /^\.[a-z0-9]+$/.test(ext) ? ext : "";
      cb(null, `${randomBytes(16).toString("hex")}${safeExt}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_LOGO_TYPES.has(file.mimetype)) {
      cb(new Error("unsupported logo type"));
      return;
    }
    cb(null, true);
  },
});

techRouter.get("/", requireAuth, async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `select slug, name, categories, roast_text, rating, logo_filename, updated_at
       from technologies order by name`,
    );
    res.json({ technologies: rows });
  } catch (e) {
    next(e);
  }
});

techRouter.get("/:slug", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `select slug, name, categories, roast_text, rating, logo_filename, updated_at
       from technologies where slug = $1`,
      [req.params.slug],
    );
    if (!rows[0]) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

const PatchBody = z.object({
  roast_text: z.string().max(4000).nullable().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

techRouter.patch("/:slug", requireAdmin, async (req, res, next) => {
  try {
    const body = PatchBody.parse(req.body);
    const fields: string[] = [];
    const values: unknown[] = [req.params.slug];
    if (body.roast_text !== undefined) {
      values.push(body.roast_text);
      fields.push(`roast_text = $${values.length}`);
    }
    if (body.rating !== undefined) {
      values.push(body.rating);
      fields.push(`rating = $${values.length}`);
    }
    if (!fields.length) return res.status(400).json({ error: "no fields" });
    values.push(req.session.user!.sub);
    fields.push(`updated_by = $${values.length}`);
    fields.push(`updated_at = now()`);

    const { rows } = await pool.query(
      `update technologies set ${fields.join(", ")} where slug = $1
       returning slug, name, categories, roast_text, rating, logo_filename, updated_at`,
      values,
    );
    if (!rows[0]) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.flatten() });
    next(e);
  }
});

techRouter.put("/:slug/logo", requireAdmin, upload.single("logo"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "no file" });
    const filename = req.file.filename;

    const prev = await pool.query<{ logo_filename: string | null }>(
      `select logo_filename from technologies where slug = $1`,
      [req.params.slug],
    );
    if (!prev.rows[0]) {
      tryUnlink(join(env.LOGO_DIR, filename));
      return res.status(404).json({ error: "not found" });
    }
    const oldFilename = prev.rows[0].logo_filename;

    await pool.query(
      `update technologies
       set logo_filename = $2, updated_by = $3, updated_at = now()
       where slug = $1`,
      [req.params.slug, filename, req.session.user!.sub],
    );
    if (oldFilename) tryUnlink(join(env.LOGO_DIR, oldFilename));
    res.json({ slug: req.params.slug, logo_filename: filename });
  } catch (e) {
    next(e);
  }
});

techRouter.delete("/:slug/logo", requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await pool.query<{ logo_filename: string | null }>(
      `update technologies set logo_filename = null, updated_by = $2, updated_at = now()
       where slug = $1
       returning logo_filename`,
      [req.params.slug, req.session.user!.sub],
    );
    if (!rows[0]) return res.status(404).json({ error: "not found" });
    if (rows[0].logo_filename) tryUnlink(join(env.LOGO_DIR, rows[0].logo_filename));
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

function tryUnlink(p: string) {
  try {
    if (existsSync(p)) unlinkSync(p);
  } catch {
    /* swallow */
  }
}
