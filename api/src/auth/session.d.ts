import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: {
      sub: string;
      email?: string;
      name?: string;
      isAdmin: boolean;
      roles: string[];
    };
    pkce?: {
      code_verifier: string;
      state: string;
      nonce: string;
      returnTo?: string;
    };
  }
}
