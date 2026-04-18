import { Link, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, Camera, ListMusic } from "lucide-react";
import AuraBackground from "./components/common/AuraBackground";
import { ProtectedRoute, PublicOnlyRoute } from "./components/auth/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import PlaylistPage from "./pages/PlaylistPage";
import SharePage from "./pages/SharePage";
import SnapshotPage from "./pages/SnapshotPage";
import { useTheme } from "./context/ThemeContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/snapshot", label: "Snapshot", Icon: Camera },
  { to: "/playlist", label: "Playlist", Icon: ListMusic },
];

function RouteTransition() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -14, scale: 0.99 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
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

function BottomNav() {
  const location = useLocation();
  const { theme } = useTheme();

  return (
    <nav className="fixed inset-x-0 bottom-5 z-30 mx-auto flex w-[92%] max-w-[400px] items-center justify-around rounded-full border px-2 py-2 backdrop-blur-2xl"
      style={{
        background: "rgba(0,0,0,0.5)",
        borderColor: "rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px -8px rgba(0,0,0,0.5)",
      }}
    >
      {navItems.map(({ to, label, Icon }) => {
        const active = location.pathname === to;
        return (
          <Link key={to} to={to} className="relative flex-1">
            <motion.div
              className="mx-auto flex flex-col items-center justify-center gap-1 rounded-full py-2"
              style={
                active
                  ? {
                      background: theme.palette.accentSoft,
                    }
                  : {}
              }
              whileTap={{ scale: 0.92 }}
            >
              <Icon
                size={18}
                style={{ color: active ? theme.palette.accent : "rgba(255,255,255,0.45)" }}
              />
              <span
                className="text-[9px] font-semibold tracking-wide"
                style={{ color: active ? theme.palette.accent : "rgba(255,255,255,0.4)" }}
              >
                {label}
              </span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
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
      {showNav && <BottomNav />}
    </div>
  );
}

export default App;

