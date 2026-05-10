import { Router } from "express";
import { join, basename } from "node:path";
import { env } from "../env.js";
import { requireAuth } from "../auth/middleware.js";

export const logosRouter = Router();

logosRouter.get("/:filename", requireAuth, (req, res) => {
  const safe = basename(req.params.filename);
  if (!/^[a-f0-9]{16,64}(\.[a-z0-9]+)?$/.test(safe)) {
    return res.status(400).json({ error: "bad filename" });
  }
  res.sendFile(join(env.LOGO_DIR, safe), (err) => {
    if (err && !res.headersSent) res.status(404).json({ error: "not found" });
  });
});
