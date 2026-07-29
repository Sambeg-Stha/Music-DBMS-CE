// backend/playlists.js
// -----------------------------------------------------------------
// Handles: Creating playlists, managing songs in playlists,
// updating playlist metadata (name, visibility), and
// retrieving user & public playlists.
//
// IMPORTANT: playlists and playlist_songs both use COMPOSITE primary
// keys that include userid, e.g. playlist_songs PK = (userid,
// playlistid, songid). This reflects Playlist being a weak entity in
// the ER model (its playlistid is only unique per owning user).
// Every insert/delete on playlist_songs MUST include userid, both to
// satisfy the NOT NULL/foreign key constraints and because the RLS
// policies check auth.uid() = userid directly.
// -----------------------------------------------------------------

import { db } from './supabaseClient.js';
import { shuffleArray } from './utils.js';

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
      is_public:     isPublic,
      userid:        user.id
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
// NOTE: userid must be included -- it's part of the composite key
// and is required by the playlist_songs_insert_own RLS policy
// (auth.uid() = userid). Only a playlist's owner can add songs to it,
// which matches the "only the owner manages their playlist" design.
export async function addSongToPlaylist(playlistId, songId) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    alert('You must be logged in.');
    return false;
  }

  const { error } = await db
    .from('playlist_songs')
    .insert({
      userid:     user.id,
      playlistid: playlistId,
      songid:     songId
    });

  if (error) {
    alert('Could not add song to playlist: ' + error.message);
    return false;
  }
  return true;
}

// 4. Remove a song from a playlist
export async function removeSongFromPlaylist(playlistId, songId) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return false;

  const { error } = await db
    .from('playlist_songs')
    .delete()
    .eq('userid', user.id)
    .eq('playlistid', playlistId)
    .eq('songid', songId);

  if (error) {
    alert('Could not remove song from playlist: ' + error.message);
    return false;
  }
  return true;
}

// 5. Get all songs inside a specific playlist (joins playlist_songs with songs)
// Works for the playlist owner AND for browsing a public playlist --
// RLS (playlist_songs_select_visible) already restricts this to
// playlists that are the caller's own or marked public, so no extra
// filtering is needed here.
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

// 6. Updates a playlist's name and/or visibility.
// RLS policy "playlists_update_own" ensures only the owner can do this.
// userid is included in the WHERE clause as an extra safety check.
export async function updatePlaylist(playlistId, name, isPublic) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return false;

  const { error } = await db
    .from('playlists')
    .update({ playlist_name: name, is_public: isPublic })
    .eq('playlistid', playlistId)
    .eq('userid', user.id);   // belt-and-suspenders: RLS already enforces this

  if (error) {
    alert('Could not update playlist: ' + error.message);
    return false;
  }
  return true;
}

// 7. Deletes a playlist owned by the current user.
// Removes all playlist_songs entries first (in case there's no ON DELETE CASCADE
// on the FK), then deletes the playlist row itself.
// RLS policy "playlists_delete_own" must exist on the playlists table.
export async function deletePlaylist(playlistId) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return false;

  // Remove all songs from the playlist first
  await db
    .from('playlist_songs')
    .delete()
    .eq('playlistid', playlistId)
    .eq('userid', user.id);

  const { error } = await db
    .from('playlists')
    .delete()
    .eq('playlistid', playlistId)
    .eq('userid', user.id);

  if (error) {
    alert('Could not delete playlist: ' + error.message);
    return false;
  }
  return true;
}

// 7. Returns 10 randomly selected playlists, joined with the owner's
// username. Note: no filtering by userid is applied here on purpose --
// RLS (playlists_select_own_or_public) already restricts results to
// the caller's own playlists plus any public ones, so this naturally
// shows a mix without extra logic.
export async function getRandomPlaylists(limit = 10) {
  const { data, error } = await db
    .from('playlists')
    .select('userid, playlistid, playlist_name, is_public, users(username)');

  if (error) {
    console.error(error);
    return [];
  }
  return shuffleArray(data).slice(0, limit);
}

// 8. Returns ALL visible playlists (own + public, per RLS), joined
// with owner username, sorted alphabetically by owner. Used on the
// "All Playlists" page.
export async function getAllPlaylistsSortedByOwner() {
  const { data, error } = await db
    .from('playlists')
    .select('userid, playlistid, playlist_name, is_public, users(username)');

  if (error) {
    console.error(error);
    return [];
  }
  return data.sort((a, b) => {
    const nameA = a.users?.username || '';
    const nameB = b.users?.username || '';
    return nameA.localeCompare(nameB);
  });
}