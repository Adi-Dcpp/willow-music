export const calculateTasteDrift = (shortArtists, longArtists) => {
  const shortIds = new Set(shortArtists.map((a) => a.id));
  const longIds = new Set(longArtists.map((a) => a.id));

  // intersection
  const overlap = [...shortIds].filter((id) => longIds.has(id)).length;

  // union
  const totalUnique = new Set([...shortIds, ...longIds]).size;

  if (totalUnique === 0) return 0;

  const similarity = (overlap / totalUnique) * 100;

  return Math.round(100 - similarity); // drift %
};

export const getTopGenres = (artists) => {
  const genreMap = {};

  for (const artist of artists) {
    for (const genre of artist.genres || []) {
      genreMap[genre] = (genreMap[genre] || 0) + 1;
    }
  }

  return Object.entries(genreMap)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // top 5 genres
};