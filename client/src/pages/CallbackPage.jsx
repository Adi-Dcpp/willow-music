import { useEffect, useRef } from "react";

export default function CallbackPage() {
  const hasFinalized = useRef(false);

  useEffect(() => {
    if (hasFinalized.current) {
      return;
    }

    hasFinalized.current = true;

    const finalize = () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (token) {
        console.log("Token received:", token);
        window.localStorage.setItem("spotify_token", token);
        window.localStorage.removeItem("willow_oauth_inflight");
        window.location.replace("/dashboard");
        return;
      }

      console.log("No token found");
      window.location.replace("/");
    };

    finalize();
  }, []);

  return <div>Logging you in...</div>;
}
