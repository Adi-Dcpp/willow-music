import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CallbackPage() {
  const hasFinalized = useRef(false);
  const navigate = useNavigate();
  const { refreshSession, clearSession } = useAuth();

  useEffect(() => {
    if (hasFinalized.current) {
      return;
    }

    hasFinalized.current = true;

    const finalize = async () => {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get("error");

      if (oauthError) {
        clearSession();
        navigate("/", { replace: true });
        return;
      }

      try {
        await refreshSession();
        navigate("/dashboard", { replace: true });
      } catch {
        clearSession();
        navigate("/", { replace: true });
      }
    };

    finalize();
  }, [clearSession, navigate, refreshSession]);

  return <div>Logging you in...</div>;
}
