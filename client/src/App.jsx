import { Link, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import AuraBackground from "./components/common/AuraBackground";
import { ProtectedRoute, PublicOnlyRoute } from "./components/auth/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import PlaylistPage from "./pages/PlaylistPage";
import SharePage from "./pages/SharePage";
import SnapshotPage from "./pages/SnapshotPage";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/snapshot", label: "Snapshot" },
  { to: "/playlist", label: "Playlist" },
];

function RouteTransition() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 26, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -18, scale: 0.985 }}
        transition={{ duration: 0.55, ease: "easeInOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/snapshot" element={<ProtectedRoute><SnapshotPage /></ProtectedRoute>} />
          <Route path="/share/:id" element={<SharePage />} />
          <Route path="/playlist" element={<ProtectedRoute><PlaylistPage /></ProtectedRoute>} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const location = useLocation();
  const showNav =
    location.pathname !== "/" &&
    location.pathname !== "/auth/callback" &&
    !location.pathname.startsWith("/share/");

  return (
    <div className="min-h-screen">
      <AuraBackground />
      <RouteTransition />

      {showNav && (
        <nav className="fixed inset-x-0 bottom-5 z-30 mx-auto flex w-[92%] max-w-[420px] items-center justify-center gap-2 rounded-full border border-white/20 bg-black/35 px-2 py-2 backdrop-blur-xl">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-4 py-2 text-xs font-semibold tracking-wide text-white/85 transition hover:bg-white/15"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

export default App;
