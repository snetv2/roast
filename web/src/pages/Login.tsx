import { loginRedirect } from "../auth";
import { SnetSignInButton, SnetFooter } from "../components/snet";

export function Login() {
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-card__brand">
          <h1>roast</h1>
          <p className="muted">
            Find out what a site is built on, then say what you actually think.
          </p>
        </div>

        <div className="login-card__divider" />

        <p className="login-card__hint">
          Access is restricted. Sign in with your S NET identity to continue.
        </p>
        <SnetSignInButton onClick={loginRedirect} />
      </div>
      <SnetFooter />
    </div>
  );
}
