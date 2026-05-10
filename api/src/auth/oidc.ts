import { Issuer, generators, type Client, type TokenSet } from "openid-client";
import { env } from "../env.js";

let cachedClient: Client | null = null;

export async function getOidcClient(): Promise<Client> {
  if (cachedClient) return cachedClient;
  const issuer = await Issuer.discover(env.OIDC_ISSUER);
  cachedClient = new issuer.Client({
    client_id: env.OIDC_CLIENT_ID,
    client_secret: env.OIDC_CLIENT_SECRET,
    redirect_uris: [env.OIDC_REDIRECT_URI],
    response_types: ["code"],
  });
  return cachedClient;
}

export function newPkce() {
  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);
  const state = generators.state();
  const nonce = generators.nonce();
  return { code_verifier, code_challenge, state, nonce };
}

export type Claims = ReturnType<TokenSet["claims"]> & {
  groups?: string[];
  roles?: string[];
};

export function rolesFromClaims(claims: Claims): string[] {
  const out = new Set<string>();
  for (const g of claims.groups ?? []) out.add(g);
  for (const r of claims.roles ?? []) out.add(r);
  return [...out];
}
