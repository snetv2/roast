import { z } from "zod";

const Env = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(16),
  PUBLIC_BASE_URL: z.string().url(),

  OIDC_ISSUER: z.string().url(),
  OIDC_CLIENT_ID: z.string().min(1),
  OIDC_CLIENT_SECRET: z.string().min(1),
  OIDC_REDIRECT_URI: z.string().url(),
  OIDC_SCOPES: z.string().default("openid profile email groups"),
  ADMIN_ROLE: z.string().default("roast-admin"),

  CF_ACCOUNT_ID: z.string().min(1),
  CF_API_TOKEN: z.string().min(1),
  LOGO_DIR: z.string().default("/data/logos"),
});

export const env = Env.parse(process.env);
