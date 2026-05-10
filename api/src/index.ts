import express from "express";
import session from "express-session";
import connectPgSimpleFactory from "connect-pg-simple";
import { env } from "./env.js";
import { pool, runMigrations } from "./db.js";
import { authRouter } from "./auth/routes.js";
import { scansRouter } from "./routes/scans.js";
import { techRouter } from "./routes/technologies.js";
import { logosRouter } from "./routes/logos.js";

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "256kb" }));

const PgStore = connectPgSimpleFactory(session);
app.use(
  session({
    name: "roast.sid",
    store: new PgStore({ pool, tableName: "session", createTableIfMissing: false }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(env.PUBLIC_BASE_URL).protocol === "https:",
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/scans", scansRouter);
app.use("/technologies", techRouter);
app.use("/logos", logosRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[api] error", err);
  if (res.headersSent) return;
  const msg = err instanceof Error ? err.message : "internal error";
  res.status(500).json({ error: msg });
});

const start = async () => {
  await runMigrations();
  app.listen(env.PORT, () => {
    console.log(`[api] listening on :${env.PORT}`);
  });
};

start().catch((e) => {
  console.error("[api] startup failed", e);
  process.exit(1);
});
