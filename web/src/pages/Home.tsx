import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Scan } from "../api";

export function Home() {
  const nav = useNavigate();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [recent, setRecent] = useState<Scan[]>([]);

  useEffect(() => {
    api.scans().then((r) => setRecent(r.scans)).catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await api.submitScan(url);
      nav(`/scans/${r.id}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <h1>Scan a site</h1>
      <form onSubmit={submit} className="scan-form">
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button type="submit" disabled={busy || !url}>
          {busy ? "Submitting…" : "Scan"}
        </button>
      </form>
      {err && <div className="error">{err}</div>}

      {recent.length > 0 && (
        <section>
          <h2>Recent scans</h2>
          <ul className="scan-list">
            {recent.map((s) => (
              <li key={s.id}>
                <a onClick={() => nav(`/scans/${s.id}`)}>
                  <code>{s.url}</code>
                  <span className={`status ${s.status}`}>{s.status}</span>
                  <time>{new Date(s.created_at).toLocaleString()}</time>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
