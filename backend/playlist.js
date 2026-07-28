// backend/playlists.js
// -----------------------------------------------------------------
// Handles: Creating playlists, managing songs in playlists, and 
// retrieving user & public playlists.
// -----------------------------------------------------------------

import { db } from './supabaseClient.js';

// 1. Create a new playlist
export async function createPlaylist(name, isPublic) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    alert('You must be logged in.');
    return null;
  }

  const { data, error } = await db
    .from('playlists')
    .insert({
      playlist_name: name,
      is_public: isPublic,
      userid: user.id
    })
    .select()
    .single();

  if (error) {
    alert('Could not create playlist: ' + error.message);
    return null;
  }
  return data;
}

// 2. Get playlists owned by the current logged-in user
export async function getMyPlaylists() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return [];

  const { data, error } = await db
    .from('playlists')
    .select('playlistid, playlist_name, is_public')
    .eq('userid', user.id);

  if (error) {
    console.error('Error fetching playlists:', error);
    return [];
  }
  return data;
}

// 3. Add a song to a playlist
export async function addSongToPlaylist(playlistId, songId) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return false;

  const { error } = await db
    .from('playlist_songs')
    .insert({
      playlistid: playlistId,
      songid: songId
    });

  if (error) {
    alert('Could not add song to playlist: ' + error.message);
    return false;
  }
  return true;
}

// 4. Remove a song from a playlist
export async function removeSongFromPlaylist(playlistId, songId) {
  const { error } = await db
    .from('playlist_songs')
    .delete()
    .eq('playlistid', playlistId)
    .eq('songid', songId);

  if (error) {
    alert('Could not remove song from playlist: ' + error.message);
    return false;
  }
  return true;
}

// 5. Get all songs inside a specific playlist (joins playlist_songs with songs)
export async function getPlaylistSongs(playlistId) {
  const { data, error } = await db
    .from('playlist_songs')
    .select('songid, songs(songid, song_title, duration)')
    .eq('playlistid', playlistId);

  if (error) {
    console.error('Error fetching playlist songs:', error);
    return [];
  }
  return data.map(item => item.songs);
}