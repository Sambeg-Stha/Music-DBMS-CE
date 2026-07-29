// songs.js
// -----------------------------------------------------------------
// Handles: publishing a song (optionally attached to one of the
// artist's own albums, or as a standalone single), and browsing
// all songs (public read).
// -----------------------------------------------------------------

import { db } from './supabaseClient.js';
import { shuffleArray } from './utils.js';

// albumId can be null -> song is published as a single, matching
// the "Contains" relationship being optional/partial on Song's side.
export async function publishSong(songTitle, duration, albumId) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    alert('You must be logged in.');
    return null;
  }

  const { data, error } = await db
    .from('songs')
    .insert({
      song_title: songTitle,
      duration: duration,
      artistid: user.id,
      albumid: albumId || null   // null = single release
    })
    .select()
    .single();

  if (error) {
    alert('Could not publish song: ' + error.message);
    return null;
  }
  return data;
}

// Public browse: anyone logged in can see all songs (RLS: songs_select_all).
export async function getAllSongs() {
  const { data, error } = await db
    .from('songs')
    .select('songid, song_title, duration, rating, albumid');

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

// Returns 10 randomly selected songs, each including the artist's
// username (joined via artists -> users). Used for the dashboard
// "showcase" view, per the requirement that the dashboard only
// previews a small random sample rather than the full catalog.
export async function getRandomSongs(limit = 10) {
  const { data, error } = await db
    .from('songs')
    .select('songid, song_title, duration, albumid, artists(users(username))');

  if (error) {
    console.error(error);
    return [];
  }
  return shuffleArray(data).slice(0, limit);
}

// Returns ALL songs, joined with artist username, sorted alphabetically
// by artist name. Used on the "All Songs" page.
export async function getAllSongsSortedByArtist() {
  const { data, error } = await db
    .from('songs')
    .select('songid, song_title, duration, albumid, artists(users(username))');

  if (error) {
    console.error(error);
    return [];
  }
  return data.sort((a, b) => {
    const nameA = a.artists?.users?.username || '';
    const nameB = b.artists?.users?.username || '';
    return nameA.localeCompare(nameB);
  });
}