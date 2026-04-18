import { useState } from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, Camera, LogOut } from "lucide-react";
import AuraBackground from "./components/common/AuraBackground";
import { ProtectedRoute, PublicOnlyRoute } from "./components/auth/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import CallbackPage from "./pages/CallbackPage";
import SharePage from "./pages/SharePage";
import SnapshotPage from "./pages/SnapshotPage";
import { useTheme } from "./context/ThemeContext";
import { useAuth } from "./context/AuthContext";
import { api } from "./api/client";

const navItems = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/snapshot", label: "Snapshot", Icon: Camera },
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
          <Route path="/callback" element={<CallbackPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/snapshot" element={<ProtectedRoute><SnapshotPage /></ProtectedRoute>} />
          <Route path="/share/:id" element={<SharePage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function BottomNav() {
  const location = useLocation();
  const { theme } = useTheme();

  return (
    <nav className="fixed inset-x-0 bottom-5 z-30 mx-auto flex w-[92%] max-w-100 items-center justify-around rounded-full border px-2 py-2 backdrop-blur-2xl"
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

function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { clearSession } = useAuth();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await api.post("/auth/logout");
    } catch {
      // Best effort; continue clearing local session state.
    } finally {
      ["willow-theme", "willow-snapshot-themes"].forEach((key) => {
        window.localStorage.removeItem(key);
      });
      clearSession();
      setIsLoggingOut(false);
      navigate("/", { replace: true });
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="fixed bottom-24 right-4 z-30 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/45 px-3 py-2 text-[11px] font-semibold text-white/80 backdrop-blur-xl transition hover:bg-black/55 disabled:cursor-not-allowed disabled:opacity-60"
      aria-label="Log out"
      title="Log out"
    >
      <LogOut size={14} />
      {isLoggingOut ? "Signing out..." : "Logout"}
    </button>
  );
}

function App() {
  const location = useLocation();
  const showNav =
    location.pathname !== "/" &&
    location.pathname !== "/callback" &&
    !location.pathname.startsWith("/share/");

  return (
    <div className="min-h-screen">
      <AuraBackground />
      <RouteTransition />
      {showNav && <LogoutButton />}
      {showNav && <BottomNav />}
    </div>
  );
}

export default App;

