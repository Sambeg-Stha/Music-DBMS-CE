// app.js
// -----------------------------------------------------------------
// Entry point. For now, this just confirms the connection works by
// checking if anyone is logged in. Auth/songs/playlists logic will
// be added to their own files (auth.js, songs.js, playlists.js)
// and imported here as we build them.
// -----------------------------------------------------------------

import { db } from './supabaseClient.js';
import { signUp, signIn, signOut } from './auth.js';
import { isCurrentUserArtist, becomeArtist } from './artists.js';
import { createAlbum, getMyAlbums } from './album.js';
import { publishSong, getAllSongs } from './song.js';

async function refreshStatus() {
  const { data: { user } } = await db.auth.getUser();
  document.getElementById('status').textContent = user
    ? `Logged in as ${user.email}`
    : 'Not connected.';

  await refreshArtistStatus();
  await refreshAlbumDropdown();
}

async function refreshArtistStatus() {
  const { data: { user } } = await db.auth.getUser();
  const el = document.getElementById('artist-status');
  if (!user) {
    el.textContent = 'Log in to check artist status.';
    return;
  }
  const isArtist = await isCurrentUserArtist();
  el.textContent = isArtist ? 'You are an artist.' : 'You are a regular listener.';
}

// Fills the "attach to album" dropdown with the logged-in artist's own albums.
async function refreshAlbumDropdown() {
  const select = document.getElementById('song-album');
  select.innerHTML = '<option value="">-- Single / no album --</option>';
  const albums = await getMyAlbums();
  albums.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.albumid;
    opt.textContent = a.album_title;
    select.appendChild(opt);
  });
}

document.getElementById('become-artist-btn').addEventListener('click', async () => {
  const role = document.getElementById('artist-role').value;
  const success = await becomeArtist(role);
  if (success) await refreshArtistStatus();
});

document.getElementById('create-album-btn').addEventListener('click', async () => {
  const title = document.getElementById('album-title').value;
  const album = await createAlbum(title);
  if (album) {
    alert(`Album "${album.album_title}" created.`);
    await refreshAlbumDropdown();
  }
});

document.getElementById('publish-song-btn').addEventListener('click', async () => {
  const title = document.getElementById('song-title').value;
  const duration = parseInt(document.getElementById('song-duration').value, 10);
  const albumId = document.getElementById('song-album').value; // "" if single
  const song = await publishSong(title, duration, albumId);
  if (song) {
    alert(`Song "${song.song_title}" published.`);
    await loadSongs();
  }
});

async function loadSongs() {
  const songs = await getAllSongs();
  const list = document.getElementById('song-list');
  list.innerHTML = '';
  songs.forEach(s => {
    const li = document.createElement('li');
    li.textContent = `${s.song_title} — ${s.duration}s${s.albumid ? '' : ' (single)'}`;
    list.appendChild(li);
  });
}

document.getElementById('refresh-songs-btn').addEventListener('click', loadSongs);

// Wire up the buttons defined in index.html to the auth.js functions
document.getElementById('signup-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const gender = document.getElementById('gender').value;
  const nationality = document.getElementById('nationality').value;
  const dob = document.getElementById('dob').value;
  await signUp(email, password, gender, nationality, dob);
  refreshStatus();
});

document.getElementById('signin-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  await signIn(email, password);
  refreshStatus();
});

document.getElementById('signout-btn').addEventListener('click', async () => {
  await signOut();
  refreshStatus();
});

refreshStatus();
loadSongs();