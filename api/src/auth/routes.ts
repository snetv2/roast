import { Router } from "express";
import { env } from "../env.js";
import { pool } from "../db.js";
import { getOidcClient, newPkce, rolesFromClaims, type Claims } from "./oidc.js";

export const authRouter = Router();

authRouter.get("/login", async (req, res, next) => {
  try {
    const client = await getOidcClient();
    const pkce = newPkce();
    req.session.pkce = {
      code_verifier: pkce.code_verifier,
      state: pkce.state,
      nonce: pkce.nonce,
      returnTo: typeof req.query.returnTo === "string" ? req.query.returnTo : "/",
    };
    const url = client.authorizationUrl({
      scope: env.OIDC_SCOPES,
      code_challenge: pkce.code_challenge,
      code_challenge_method: "S256",
      state: pkce.state,
      nonce: pkce.nonce,
    });
    res.redirect(url);
  } catch (e) {
    next(e);
  }
});

authRouter.get("/callback", async (req, res, next) => {
  try {
    const pkce = req.session.pkce;
    if (!pkce) return res.status(400).send("no pkce state in session");
    const client = await getOidcClient();
    const params = client.callbackParams(req);
    const tokenSet = await client.callback(env.OIDC_REDIRECT_URI, params, {
      code_verifier: pkce.code_verifier,
      state: pkce.state,
      nonce: pkce.nonce,
    });
    const claims = tokenSet.claims() as Claims;
    const roles = rolesFromClaims(claims);
    const isAdmin = roles.includes(env.ADMIN_ROLE);
    const sub = String(claims.sub);
    const email = typeof claims.email === "string" ? claims.email : undefined;
    const name = typeof claims.name === "string" ? claims.name : undefined;

    await pool.query(
      `insert into users (sub, email, name, is_admin, last_login)
       values ($1,$2,$3,$4, now())
       on conflict (sub) do update set
         email = excluded.email,
         name = excluded.name,
         is_admin = excluded.is_admin,
         last_login = now()`,
      [sub, email ?? null, name ?? null, isAdmin],
    );

    req.session.user = { sub, email, name, isAdmin, roles };
    const returnTo = pkce.returnTo ?? "/";
    delete req.session.pkce;
    res.redirect(returnTo);
  } catch (e) {
    next(e);
  }
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("roast.sid");
    res.json({ ok: true });
  });
});

authRouter.get("/me", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "unauthenticated" });
  const { sub, email, name, isAdmin, roles } = req.session.user;
  res.json({ sub, email, name, isAdmin, roles });
});
