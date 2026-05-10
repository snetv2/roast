import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Scan } from "../api";
import { useAuth } from "../auth";
import { StarRating } from "../components/StarRating";

export function ScanDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [scan, setScan] = useState<Scan | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const polling = useRef<number | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;

    const tick = async () => {
      try {
        const s = await api.scan(id);
        if (!alive) return;
        setScan(s);
        if (s.status === "pending") {
          polling.current = window.setTimeout(tick, 2500);
        }
      } catch (e) {
        if (alive) setErr((e as Error).message);
      }
    };
    tick();

    return () => {
      alive = false;
      if (polling.current) window.clearTimeout(polling.current);
    };
  }, [id]);

  if (err) return <div className="page error">{err}</div>;
  if (!scan) return <div className="page">Loading…</div>;

  return (
    <div className="page">
      <h1>
        Scan <code>{scan.url}</code>
      </h1>
      <p>
        Status: <span className={`status ${scan.status}`}>{scan.status}</span>
        {scan.status === "pending" && " — polling Cloudflare…"}
      </p>
      {scan.error && <div className="error">{scan.error}</div>}

      {scan.status === "ready" && (
        <>
          <h2>Detected technologies ({scan.technologies?.length ?? 0})</h2>
          {(scan.technologies?.length ?? 0) === 0 && <p>None detected.</p>}
          <ul className="tech-grid">
            {scan.technologies?.map((t) => (
              <li key={t.slug} className="tech-card">
                <div className="tech-head">
                  {t.logo_filename ? (
                    <img src={api.logoUrl(t.logo_filename)} alt="" className="tech-logo" />
                  ) : (
                    <div className="tech-logo placeholder">?</div>
                  )}
                  <div>
                    <h3>{t.name}</h3>
                    <small>{t.categories.join(", ")}</small>
                  </div>
                </div>
                <StarRating value={t.rating} />
                {t.roast_text ? (
                  <blockquote>{t.roast_text}</blockquote>
                ) : (
                  <p className="muted">No roast yet.</p>
                )}
                {user?.isAdmin && (
                  <Link to={`/technologies/${t.slug}/edit`} className="edit-link">
                    Edit
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
