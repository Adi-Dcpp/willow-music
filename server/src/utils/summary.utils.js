const TRACK_LIMIT = 20;
const DISPLAY_LIMIT = 5;

const toSafeArray = (value) => (Array.isArray(value) ? value : []);

const normalizeTrack = (track) => {
  if (!track || typeof track !== "object") return null;

  const id = typeof track.id === "string" ? track.id : null;
  if (!id) return null;

  const artistFromNormalized = Array.isArray(track.artistNames)
    ? track.artistNames.join(", ")
    : null;
  const artistFromRaw = Array.isArray(track.artists)
    ? track.artists.map((a) => a?.name).filter(Boolean).join(", ")
    : null;

  return {
    id,
    name: track.name || "Unknown",
    artist: artistFromNormalized || artistFromRaw || "Unknown",
    image: track.albumImageUrl || track.album?.images?.[0]?.url || null,
    spotifyUrl: track.spotifyUrl || track.external_urls?.spotify || null,
  };
};

const normalizeArtist = (artist) => {
  if (!artist || typeof artist !== "object") return null;

  const id = typeof artist.id === "string" ? artist.id : null;
  if (!id) return null;

  return {
    id,
    name: artist.name || "Unknown",
    image: artist.imageUrl || artist.images?.[0]?.url || null,
    genres: toSafeArray(artist.genres).filter((genre) => typeof genre === "string"),
  };
};

const detectVibe = (genres = []) => {
  const g = genres.join(" ").toLowerCase();

  if (g.includes("indie") || g.includes("alt")) return "Indie Soul";
  if (g.includes("pop")) return "Main Character Energy";
  if (g.includes("rock") || g.includes("metal")) return "Rebel Spirit";
  if (g.includes("hip hop") || g.includes("rap") || g.includes("trap")) return "Hype and Hustle";
  if (g.includes("electronic") || g.includes("edm") || g.includes("house")) return "Night Drive Aura";
  if (g.includes("r&b") || g.includes("soul")) return "Smooth and Introspective";

  return "Balanced Listener";
};

const getEmptySummary = () => ({
  summary: {
    topGenres: [],
    topArtist: "Unknown",
    vibe: "Balanced Listener",
    depthScore: 0,
  },
  topTracks: [],
  topArtists: [],
});

export const buildUserSummary = (topTracks = [], topArtists = []) => {
  try {
    const tracks = toSafeArray(topTracks)
      .slice(0, TRACK_LIMIT)
      .map(normalizeTrack)
      .filter(Boolean);

    const artists = toSafeArray(topArtists)
      .slice(0, TRACK_LIMIT)
      .map(normalizeArtist)
      .filter(Boolean);

    if (!tracks.length || !artists.length) {
      return getEmptySummary();
    }

    const genreScore = {};

    artists.forEach((artist, index) => {
      const weight = TRACK_LIMIT - index;
      artist.genres.forEach((genre) => {
        genreScore[genre] = (genreScore[genre] || 0) + weight;
      });
    });

    const topGenres = Object.entries(genreScore)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);

    const uniqueGenres = Object.keys(genreScore).length;
    const depthScore = Number((Math.min(uniqueGenres / 10, 1)).toFixed(2));

    return {
      summary: {
        topGenres,
        topArtist: artists[0]?.name || "Unknown",
        vibe: detectVibe(topGenres),
        depthScore,
      },
      topTracks: tracks.slice(0, DISPLAY_LIMIT),
      topArtists: artists.slice(0, DISPLAY_LIMIT),
    };
  } catch {
    return getEmptySummary();
  }
};