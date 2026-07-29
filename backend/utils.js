// backend/utils.js
// -----------------------------------------------------------------
// Small shared helpers used across multiple backend modules.
// -----------------------------------------------------------------

// Fisher-Yates shuffle. Used to pick a random subset (e.g. 10 songs)
// from a full list fetched from the database. Supabase/PostgREST
// doesn't have a simple "ORDER BY random()" through the JS client,
// so we fetch the data normally and shuffle it client-side instead --
// simplest approach for a dataset this size.
export function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
