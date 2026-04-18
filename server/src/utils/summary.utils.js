const TRACK_LIMIT = 20;
const ARTIST_LIMIT = 10;

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

const detectVibe = (genres = [], metrics = {}) => {
  const genreList = toSafeArray(genres)
    .map((genre) => (typeof genre === "string" ? genre : genre?.genre))
    .filter(Boolean)
    .map((genre) => genre.toLowerCase());

  const topGenre = genreList[0] || "";
  const uniqueGenres = metrics.uniqueGenres ?? new Set(genreList).size;
  const genreCount = metrics.genreCount ?? genreList.length;
  const dominantShare = metrics.dominantShare ?? (genreCount ? 1 / Math.max(1, uniqueGenres) : 0);
  const artistSpread = metrics.artistSpread ?? 0;
  const depthScore = metrics.depthScore ?? 0;

  const joined = genreList.join(" ");
  const isHighlyDiverse = uniqueGenres >= 5 || artistSpread >= 0.7;
  const isFocused = dominantShare >= 0.4 || depthScore <= 0.35;

  if (joined.includes("indie") || joined.includes("alternative") || joined.includes("alt")) return "Indie Dreamer";
  if (joined.includes("pop") || joined.includes("synth-pop") || joined.includes("electropop")) return "Chart Chameleon";
  if (joined.includes("r&b") || joined.includes("soul") || joined.includes("neo soul") || joined.includes("funk")) return "Soul Tender";
  if (joined.includes("hip hop") || joined.includes("rap") || joined.includes("trap") || joined.includes("drill")) return "Street Poet";
  if (joined.includes("electronic") || joined.includes("edm") || joined.includes("house") || joined.includes("techno") || joined.includes("trance")) return "Night Drive Aura";
  if (joined.includes("rock") || joined.includes("metal")) return "Rebel Spirit";
  if (joined.includes("jazz") || joined.includes("blues") || joined.includes("swing")) return "Jazz Wanderer";
  if (joined.includes("folk") || joined.includes("acoustic") || joined.includes("singer-songwriter") || joined.includes("country")) return "Wandering Folk";
  if (joined.includes("lo-fi") || joined.includes("lo fi") || joined.includes("chillhop") || joined.includes("ambient") || joined.includes("downtempo")) return "Lo-Fi Soul";
  if (joined.includes("classical") || joined.includes("orchestral") || joined.includes("opera") || joined.includes("chamber")) return "Classical Phantom";

  if (isHighlyDiverse && !isFocused) return "Sonic Wanderer";
  if (isFocused && uniqueGenres <= 2) return "Deep Cut Devotee";
  if (artistSpread >= 0.6) return "Genre Drifter";
  if (depthScore >= 0.7) return "Layered Listener";

  return topGenre ? "Balanced Listener" : "Sonic Wanderer";
};

const getEmptySummary = () => ({
  summary: {
    topGenres: [],
    topArtist: "Unknown",
    vibe: "Balanced Listener",
    depthScore: 0,
  },
  insights: {
    tasteDriftScore: 0,
    tasteDriftMessage: "Your music profile is still forming. Keep listening to unlock your drift signal.",
    topGenres: [],
  },
  topTracks: [],
  topArtists: [],
});

const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(value)));
const clampUnit = (value) => Math.max(0, Math.min(1, value));

const toProbabilityValues = (counts = []) => {
  const total = counts.reduce((acc, count) => acc + count, 0);

  if (!total) {
    return [];
  }

  return counts.map((count) => count / total);
};

const computeBalanceIndex = (counts = []) => {
  const probabilities = toProbabilityValues(counts);

  if (!probabilities.length) {
    return 0;
  }

  // Simpson-style balance index: 0 = highly concentrated, 1 = evenly distributed.
  const concentration = probabilities.reduce((acc, p) => acc + p * p, 0);
  return Math.max(0, Math.min(1, 1 - concentration));
};

const computeEntropyIndex = (counts = []) => {
  const probabilities = toProbabilityValues(counts);

  if (!probabilities.length) {
    return 0;
  }

  if (probabilities.length === 1) {
    return 0;
  }

  const entropy = -probabilities.reduce((acc, p) => acc + p * Math.log(p), 0);
  const maxEntropy = Math.log(probabilities.length);
  return maxEntropy > 0 ? clampUnit(entropy / maxEntropy) : 0;
};

const computeDominanceShare = (counts = []) => {
  const probabilities = toProbabilityValues(counts);
  if (!probabilities.length) return 1;
  return Math.max(...probabilities);
};

const getTasteDriftMessage = (score) => {
  if (score >= 85) return "Boundary breaker: your rotation is in constant discovery mode.";
  if (score >= 65) return "Curious explorer: you regularly expand beyond your usual lane.";
  if (score >= 45) return "Balanced explorer: you mix comfort tracks with fresh finds.";
  if (score >= 25) return "Steady core: your taste is consistent with occasional detours.";
  return "Signature locked: you know your sound and stay true to it.";
};

const computeTasteDriftInsights = ({ tracks, artists, genreScore }) => {
  const totalTracks = tracks.length;
  const totalArtists = artists.length;

  if (!totalTracks || !totalArtists) {
    return {
      tasteDriftScore: 0,
      tasteDriftMessage: getTasteDriftMessage(0),
    };
  }

  const artistCounts = {};

  tracks.forEach((track) => {
    const names = String(track.artist || "")
      .split(",")
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean);

    if (!names.length) {
      return;
    }

    const weight = 1 / names.length;
    names.forEach((name) => {
      artistCounts[name] = (artistCounts[name] || 0) + weight;
    });
  });

  const uniqueTrackArtists = Object.keys(artistCounts).length;
  const artistSpread = clampUnit(uniqueTrackArtists / Math.max(Math.min(totalTracks, 14), 1));
  const artistEntropy = computeEntropyIndex(Object.values(artistCounts));
  const artistBalance = computeBalanceIndex(Object.values(artistCounts));

  const uniqueGenres = Object.keys(genreScore).length;
  const genreSpread = clampUnit(uniqueGenres / 8);
  const genreEntropy = computeEntropyIndex(Object.values(genreScore));
  const genreBalance = computeBalanceIndex(Object.values(genreScore));
  const artistDominance = computeDominanceShare(Object.values(artistCounts));
  const genreDominance = computeDominanceShare(Object.values(genreScore));
  const dominancePenalty = (artistDominance + genreDominance) / 2;

  const explorationIndex =
    artistEntropy * 0.24 +
    genreEntropy * 0.24 +
    artistBalance * 0.2 +
    genreBalance * 0.2 +
    artistSpread * 0.07 +
    genreSpread * 0.05;

  const adjustedIndex = clampUnit(explorationIndex - dominancePenalty * 0.18);

  const confidence =
    clampUnit(totalTracks / 20) * 0.65 +
    clampUnit(totalArtists / 10) * 0.35;

  const confidenceWeight = 0.4 + confidence * 0.6;
  const centeredScore = 50 + ((adjustedIndex * 100) - 50) * confidenceWeight;
  const tasteDriftScore = clampPercent(centeredScore);

  return {
    tasteDriftScore,
    tasteDriftMessage: getTasteDriftMessage(tasteDriftScore),
  };
};

export const buildUserSummary = (
  topTracks = [],
  topArtists = [],
  { trackDisplayCount = TRACK_LIMIT, artistDisplayCount = ARTIST_LIMIT } = {},
) => {
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

    const topGenreCounts = Object.entries(genreScore)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre, count]) => ({ genre, count }));

    const uniqueGenres = Object.keys(genreScore).length;
    const dominantGenreCount = Math.max(0, ...Object.values(genreScore));
    const totalGenreWeight = Object.values(genreScore).reduce((acc, count) => acc + count, 0) || 1;
    const dominantShare = dominantGenreCount / totalGenreWeight;
    const artistSpread = artists.length ? new Set(artists.map((artist) => artist.id)).size / artists.length : 0;
    const depthScore = Number((Math.min(uniqueGenres / 10, 1)).toFixed(2));
    const { tasteDriftScore, tasteDriftMessage } = computeTasteDriftInsights({
      tracks,
      artists,
      genreScore,
    });

    return {
      summary: {
        topGenres,
        topArtist: artists[0]?.name || "Unknown",
        vibe: detectVibe(topGenres, {
          uniqueGenres,
          genreCount: topGenres.length,
          dominantShare,
          artistSpread,
          depthScore,
        }),
        depthScore,
      },
      insights: {
        tasteDriftScore,
        tasteDriftMessage,
        topGenres: topGenreCounts,
      },
      topTracks: tracks.slice(0, trackDisplayCount),
      topArtists: artists.slice(0, artistDisplayCount),
    };
  } catch {
    return getEmptySummary();
  }
};