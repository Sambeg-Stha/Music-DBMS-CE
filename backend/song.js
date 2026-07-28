// songs.js
// -----------------------------------------------------------------
// Handles: publishing a song (optionally attached to one of the
// artist's own albums, or as a standalone single), and browsing
// all songs (public read).
// -----------------------------------------------------------------

import { db } from './supabaseClient.js';

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