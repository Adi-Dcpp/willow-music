export const THEMES = [
  {
    id: "emerald-night",
    label: "Emerald Night",
    emoji: "🌿",
    palette: {
      bg: "radial-gradient(circle at 20% 10%, #12372f 0%, #08120f 40%, #040707 100%)",
      accent: "#34d399",
      accentSoft: "rgba(52, 211, 153, 0.35)",
      card: "rgba(10, 18, 15, 0.66)",
      border: "rgba(110, 231, 183, 0.28)",
      button: "linear-gradient(135deg, #10b981 0%, #22c55e 100%)",
      blobA: "rgba(16, 185, 129, 0.45)",
      blobB: "rgba(52, 211, 153, 0.35)",
      text: "#ecfdf5",
      muted: "#a7f3d0",
    },
  },
  {
    id: "neon-pulse",
    label: "Neon Pulse",
    emoji: "⚡",
    palette: {
      bg: "radial-gradient(circle at 30% 0%, #401053 0%, #150217 45%, #08040b 100%)",
      accent: "#f472b6",
      accentSoft: "rgba(244, 114, 182, 0.42)",
      card: "rgba(17, 6, 22, 0.72)",
      border: "rgba(236, 72, 153, 0.35)",
      button: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
      blobA: "rgba(236, 72, 153, 0.45)",
      blobB: "rgba(139, 92, 246, 0.38)",
      text: "#fdf4ff",
      muted: "#fbcfe8",
    },
  },
  {
    id: "ocean-mist",
    label: "Ocean Mist",
    emoji: "🌊",
    palette: {
      bg: "radial-gradient(circle at 20% 0%, #2b6cb0 0%, #13395d 45%, #081420 100%)",
      accent: "#7dd3fc",
      accentSoft: "rgba(125, 211, 252, 0.32)",
      card: "rgba(9, 30, 54, 0.64)",
      border: "rgba(147, 197, 253, 0.34)",
      button: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)",
      blobA: "rgba(56, 189, 248, 0.42)",
      blobB: "rgba(59, 130, 246, 0.35)",
      text: "#f0f9ff",
      muted: "#bae6fd",
    },
  },
  {
    id: "sunset-aura",
    label: "Sunset Aura",
    emoji: "🌇",
    palette: {
      bg: "radial-gradient(circle at 25% 0%, #ff8f3f 0%, #a93165 45%, #2b122a 100%)",
      accent: "#fdba74",
      accentSoft: "rgba(251, 146, 60, 0.35)",
      card: "rgba(48, 16, 31, 0.66)",
      border: "rgba(253, 186, 116, 0.3)",
      button: "linear-gradient(135deg, #fb923c 0%, #f43f5e 100%)",
      blobA: "rgba(251, 146, 60, 0.44)",
      blobB: "rgba(244, 63, 94, 0.32)",
      text: "#fff7ed",
      muted: "#fed7aa",
    },
  },
  {
    id: "mono-minimal",
    label: "Mono Minimal",
    emoji: "⚪",
    palette: {
      bg: "radial-gradient(circle at 30% 0%, #303030 0%, #111111 45%, #050505 100%)",
      accent: "#f5f5f5",
      accentSoft: "rgba(245, 245, 245, 0.25)",
      card: "rgba(18, 18, 18, 0.8)",
      border: "rgba(255, 255, 255, 0.2)",
      button: "linear-gradient(135deg, #d4d4d4 0%, #737373 100%)",
      blobA: "rgba(229, 229, 229, 0.25)",
      blobB: "rgba(115, 115, 115, 0.26)",
      text: "#fafafa",
      muted: "#d4d4d4",
    },
  },
];

export const DEFAULT_THEME_ID = THEMES[0].id;

export const getThemeById = (themeId) => {
  return THEMES.find((theme) => theme.id === themeId) || THEMES[0];
};
