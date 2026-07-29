// songs.js
// -----------------------------------------------------------------
// Handles: publishing a song (optionally attached to one of the
// artist's own albums, or as a standalone single), browsing all songs,
// and editing an artist's own songs.
// Genre is stored in the separate song_genres table (songid, genre_name).
// -----------------------------------------------------------------

import { db } from './supabaseClient.js';
import { shuffleArray } from './utils.js';

// albumId can be null -> song is published as a single, matching
// the "Contains" relationship being optional/partial on Song's side.
export async function publishSong(songTitle, duration, albumId, genre) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    alert('You must be logged in.');
    return null;
  }

  const { data, error } = await db
    .from('songs')
    .insert({
      song_title: songTitle,
      duration:   duration,
      artistid:   user.id,
      albumid:    albumId || null   // null = single release
    })
    .select()
    .single();

  if (error) {
    alert('Could not publish song: ' + error.message);
    return null;
  }

  // Insert genre into song_genres table if one was selected
  if (genre && data) {
    const { error: genreError } = await db
      .from('song_genres')
      .insert({ songid: data.songid, genre_name: genre });
    if (genreError) console.error('Could not save genre:', genreError.message);
  }

  return data;
}

// Public browse: anyone logged in can see all songs (RLS: songs_select_all).
// Includes genre join for the playlist manager song list.
export async function getAllSongs() {
  const { data, error } = await db
    .from('songs')
    .select('songid, song_title, duration, rating, albumid, song_genres(genre_name)');

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

// Returns 10 randomly selected songs, each including the artist's
// username (joined via artists -> users) and genre. Used for the dashboard
// "showcase" view, per the requirement that the dashboard only
// previews a small random sample rather than the full catalog.
export async function getRandomSongs(limit = 10) {
  const { data, error } = await db
    .from('songs')
    .select('songid, song_title, duration, albumid, song_genres(genre_name), artists(users(username))');

  if (error) {
    console.error(error);
    return [];
  }
  return shuffleArray(data).slice(0, limit);
}

// Returns ALL songs, joined with artist username and genre, sorted
// alphabetically by artist name. Used on the "All Songs" page.
export async function getAllSongsSortedByArtist() {
  const { data, error } = await db
    .from('songs')
    .select('songid, song_title, duration, albumid, song_genres(genre_name), artists(users(username))');

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

// Returns the logged-in artist's own songs with genre info.
// Used for the "My Published Songs" edit section on publish-song.html.
export async function getMySongs() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return [];

  const { data, error } = await db
    .from('songs')
    .select('songid, song_title, duration, albumid, song_genres(genre_name)')
    .eq('artistid', user.id);

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

// Updates a song's title, duration, album, and genre.
// RLS policy "songs_update_own" ensures only the owner artist can do this.
// Genre update is a delete-then-insert on song_genres (replaces old entry).
export async function updateSong(songId, { songTitle, duration, albumId, genre }) {
  const { error } = await db
    .from('songs')
    .update({
      song_title: songTitle,
      duration:   duration,
      albumid:    albumId || null
    })
    .eq('songid', songId);

  if (error) {
    alert('Could not update song: ' + error.message);
    return false;
  }

  // Replace genre entry: remove old, insert new
  if (genre !== undefined) {
    await db.from('song_genres').delete().eq('songid', songId);
    if (genre) {
      const { error: genreError } = await db
        .from('song_genres')
        .insert({ songid: songId, genre_name: genre });
      if (genreError) console.error('Could not update genre:', genreError.message);
    }
  }

  return true;
}

// Deletes a song owned by the current artist.
// Cleans up song_genres first (in case there's no ON DELETE CASCADE on the FK),
// then removes the songs row. playlist_songs entries are expected to cascade
// automatically if the FK is set up with ON DELETE CASCADE.
// RLS policy "songs_delete_own" must exist -- see README note.
export async function deleteSong(songId) {
  // Remove genre entry first (safe even if none exists)
  await db.from('song_genres').delete().eq('songid', songId);

  const { error } = await db
    .from('songs')
    .delete()
    .eq('songid', songId);

  if (error) {
    alert('Could not delete song: ' + error.message);
    return false;
  }
  return true;
}