import { motion } from "framer-motion";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client";
import GlassCard from "../components/common/GlassCard";
import GlowButton from "../components/common/GlowButton";
import { ErrorState, InlineLoader } from "../components/common/StatePanel";

const defaultPayload = {
  timeRange: "medium_term",
  name: "Willow Playlist 🌿",
  trackCount: 20,
  isPublic: true,
};

export default function PlaylistPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");

  const createPlaylist = async () => {
    try {
      setError("");
      setIsCreating(true);
      const response = await api.post("/playlist/from-top", defaultPayload);
      setPlaylistUrl(response.data?.data?.playlistUrl || "");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create playlist right now.");
    } finally {
      setIsCreating(false);
    }
  };

  const openPlaylist = () => {
    window.open(playlistUrl || "https://open.spotify.com", "_blank");
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col justify-center px-4 pb-20 pt-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeInOut" }}
      >
        <GlassCard className="p-6 text-center" hover={false}>
          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto mb-4 inline-flex rounded-full"
          >
            <CheckCircle2 size={54} className="text-green-300" />
          </motion.div>
          <h1 className="text-2xl font-semibold text-white">Playlist Ready</h1>
          <p className="mt-2 text-sm text-white/70">
            Your custom Willow playlist is now live on Spotify.
          </p>

          {isCreating ? <div className="mt-4"><InlineLoader text="Crafting your playlist..." /></div> : null}
          {error ? <div className="mt-4"><ErrorState title="Playlist failed" message={error} onRetry={createPlaylist} /></div> : null}

          {!playlistUrl ? (
            <GlowButton className="mt-6 w-full" onClick={createPlaylist} disabled={isCreating}>
              Generate Playlist
            </GlowButton>
          ) : null}

          <GlowButton
            className="mt-6 w-full"
            onClick={openPlaylist}
            disabled={!playlistUrl}
          >
            <span className="inline-flex items-center gap-2">
              {playlistUrl ? "Open on Spotify" : "Create first"} <ExternalLink size={16} />
            </span>
          </GlowButton>
        </GlassCard>
      </motion.div>
    </div>
  );
}
