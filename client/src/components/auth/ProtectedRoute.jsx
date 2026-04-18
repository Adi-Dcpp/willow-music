import { Navigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isBooting } = useAuth();
  const location = useLocation();

  if (isBooting) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[420px] items-center justify-center px-4">
        <motion.div
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="rounded-3xl border border-white/20 bg-white/10 px-6 py-4 text-sm text-white backdrop-blur-xl"
        >
          Syncing your Willow session...
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  return children;
}

export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isBooting } = useAuth();

  if (isBooting) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[420px] items-center justify-center px-4">
        <div className="rounded-3xl border border-white/20 bg-white/10 px-6 py-4 text-sm text-white/80 backdrop-blur-xl">
          Checking session...
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
