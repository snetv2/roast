import { Link, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { ScanDetail } from "./pages/ScanDetail";
import { TechEdit } from "./pages/TechEdit";
import { TechList } from "./pages/TechList";
import { SnetWordmark, VersionTag } from "./components/snet";

export function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="centered">Loading…</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">roast</Link>
        <nav>
          <Link to="/">Scan</Link>
          <Link to="/technologies">Technologies</Link>
        </nav>
        <div className="who">
          <SnetWordmark muted />
          <span className="who__user">{user.name ?? user.email ?? user.sub}</span>
          {user.isAdmin && <span className="badge">admin</span>}
          <button onClick={logout}>Sign out</button>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scans/:id" element={<ScanDetail />} />
          <Route path="/technologies" element={<TechList />} />
          <Route path="/technologies/:slug/edit" element={<TechEdit />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <VersionTag />
    </div>
  );
}
