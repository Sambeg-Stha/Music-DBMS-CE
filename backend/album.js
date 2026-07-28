// albums.js
// -----------------------------------------------------------------
// Handles: an artist creating an album, and listing their own
// albums (needed to populate the "attach to album" dropdown when
// publishing a song).
// -----------------------------------------------------------------

import { db } from './supabaseClient.js';

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