import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type Technology } from "../api";
import { useAuth } from "../auth";
import { StarRating } from "../components/StarRating";

export function TechEdit() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [tech, setTech] = useState<Technology | null>(null);
  const [roast, setRoast] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.technology(slug)
      .then((t) => {
        setTech(t);
        setRoast(t.roast_text ?? "");
        setRating(t.rating ?? null);
      })
      .catch((e) => setErr(e.message));
  }, [slug]);

  if (!user?.isAdmin) {
    return <div className="page error">Admins only.</div>;
  }
  if (err) return <div className="page error">{err}</div>;
  if (!tech || !slug) return <div className="page">Loading…</div>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api.updateTech(slug, {
        roast_text: roast.trim() ? roast : null,
        rating,
      });
      if (logo) {
        await api.uploadLogo(slug, logo);
      }
      nav("/technologies");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const removeLogo = async () => {
    if (!confirm("Remove the current logo?")) return;
    try {
      await api.deleteLogo(slug);
      setTech({ ...tech, logo_filename: null });
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div className="page">
      <h1>Edit {tech.name}</h1>
      <p>
        <small>{tech.categories.join(", ")}</small>
      </p>

      <form onSubmit={save} className="tech-edit">
        <label>
          Roast
          <textarea
            rows={6}
            value={roast}
            onChange={(e) => setRoast(e.target.value)}
            maxLength={4000}
            placeholder="Tell us what you really think…"
          />
        </label>

        <label>
          Rating
          <StarRating value={rating} onChange={setRating} />
        </label>

        <label>
          Logo
          <div className="logo-row">
            {tech.logo_filename ? (
              <img src={api.logoUrl(tech.logo_filename)} alt="" className="tech-logo" />
            ) : (
              <div className="tech-logo placeholder">?</div>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
              onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
            />
            {tech.logo_filename && (
              <button type="button" onClick={removeLogo}>
                Remove
              </button>
            )}
          </div>
        </label>

        {err && <div className="error">{err}</div>}

        <div className="actions">
          <button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => nav(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
