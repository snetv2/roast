import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Technology } from "../api";
import { useAuth } from "../auth";
import { StarRating } from "../components/StarRating";

export function TechList() {
  const { user } = useAuth();
  const [techs, setTechs] = useState<Technology[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.technologies().then((r) => setTechs(r.technologies)).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="page error">{err}</div>;

  return (
    <div className="page">
      <h1>Technologies</h1>
      {techs.length === 0 && <p>No technologies yet — run a scan first.</p>}
      <ul className="tech-grid">
        {techs.map((t) => (
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
    </div>
  );
}
