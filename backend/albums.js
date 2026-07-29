// albums.js
// -----------------------------------------------------------------
// Handles: an artist creating an album, listing their own albums
// (needed for the "attach to album" dropdown when publishing a song),
// editing an existing album, and fetching an album's songs for the
// dashboard detail popup.
// -----------------------------------------------------------------

import { db } from './supabaseClient.js';
import { shuffleArray } from './utils.js';

export async function createAlbum(albumTitle) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    alert('You must be logged in.');
    return null;
  }

  const { data, error } = await db
    .from('albums')
    .insert({ album_title: albumTitle, artistid: user.id })
    .select()
    .single();

  if (error) {
    alert('Could not create album: ' + error.message);
    return null;
  }
  return data; // includes the new albumid
}

// Returns the logged-in artist's own albums, e.g. for a dropdown.
export async function getMyAlbums() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return [];

  const { data, error } = await db
    .from('albums')
    .select('albumid, album_title')
    .eq('artistid', user.id);

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

// Returns the logged-in artist's own songs that are NOT yet attached
// to any album (albumid is null) -- these are the candidates that
// can be added to an album after the fact.
export async function getMyUnattachedSongs() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return [];

  const { data, error } = await db
    .from('songs')
    .select('songid, song_title')
    .eq('artistid', user.id)
    .is('albumid', null);

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

// Attaches an existing song to an album (used when an artist releases
// songs first, then later groups some of them into an album).
export async function attachSongToAlbum(songId, albumId) {
  const { error } = await db
    .from('songs')
    .update({ albumid: albumId })
    .eq('songid', songId);

  if (error) {
    alert('Could not attach song to album: ' + error.message);
    return false;
  }
  return true;
}

// Updates an album's title.
// RLS policy "albums_update_own" ensures only the owning artist can do this.
export async function updateAlbum(albumId, albumTitle) {
  const { error } = await db
    .from('albums')
    .update({ album_title: albumTitle })
    .eq('albumid', albumId);

  if (error) {
    alert('Could not update album: ' + error.message);
    return false;
  }
  return true;
}

// Deletes an album owned by the current artist.
// First detaches all songs from this album (sets their albumid to null so
// they become singles rather than being deleted). Then removes the album row.
// RLS policy "albums_delete_own" must exist on the albums table.
export async function deleteAlbum(albumId) {
  // Detach songs: set albumid = null so songs survive as singles
  await db
    .from('songs')
    .update({ albumid: null })
    .eq('albumid', albumId);

  const { error } = await db
    .from('albums')
    .delete()
    .eq('albumid', albumId);

  if (error) {
    alert('Could not delete album: ' + error.message);
    return false;
  }
  return true;
}

// Returns all songs belonging to a specific album.
// Used for the dashboard album detail popup.
export async function getAlbumSongs(albumId) {
  const { data, error } = await db
    .from('songs')
    .select('songid, song_title, duration, song_genres(genre_name)')
    .eq('albumid', albumId);

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

// Returns 10 randomly selected albums, each including the artist's
// username. Used for the dashboard "showcase" view.
export async function getRandomAlbums(limit = 10) {
  const { data, error } = await db
    .from('albums')
    .select('albumid, album_title, artists(users(username))');

  if (error) {
    console.error(error);
    return [];
  }
  return shuffleArray(data).slice(0, limit);
}

// Returns ALL albums, joined with artist username, sorted alphabetically
// by artist name. Used on the "All Albums" page.
export async function getAllAlbumsSortedByArtist() {
  const { data, error } = await db
    .from('albums')
    .select('albumid, album_title, artists(users(username))');

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