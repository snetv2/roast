import type { RequestHandler } from "express";

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: "unauthenticated" });
  next();
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: "unauthenticated" });
  if (!req.session.user.isAdmin) return res.status(403).json({ error: "forbidden" });
  next();
};
