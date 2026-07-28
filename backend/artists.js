// artists.js
// -----------------------------------------------------------------
// Handles: checking if the current user is an artist, and letting
// them become one. This is the practical implementation of the
// User -ISA- Artist relationship from the ER model: an artist row
// is just a users row that ALSO has a matching row here, with the
// same id (artistid = userid).
// -----------------------------------------------------------------

import { db } from './supabaseClient.js';

// Returns true/false depending on whether the current user already
// has a row in the artists table.
export async function isCurrentUserArtist() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return false;

  const { data, error } = await db
    .from('artists')
    .select('artistid')
    .eq('artistid', user.id)
    .maybeSingle(); // returns null instead of throwing if no row found

  if (error) {
    console.error(error);
    return false;
  }
  return data !== null;
}

// Inserts a new row into artists for the current logged-in user.
export async function becomeArtist(artistRole) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    alert('You must be logged in first.');
    return false;
  }

  const { error } = await db.from('artists').insert({
    artistid: user.id,
    popularity: 0,
    artist_role: artistRole
  });

  if (error) {
    alert('Could not become an artist: ' + error.message);
    return false;
  }

  alert('You are now an artist!');
  return true;
}