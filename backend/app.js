// app.js
// -----------------------------------------------------------------
// Entry point. For now, this just confirms the connection works by
// checking if anyone is logged in. Auth/songs/playlists logic will
// be added to their own files (auth.js, songs.js, playlists.js)
// and imported here as we build them.
// -----------------------------------------------------------------

import { db } from './supabaseClient.js';
import { signUp, signIn, signOut } from './auth.js';

async function refreshStatus() {
  const { data: { user } } = await db.auth.getUser();
  document.getElementById('status').textContent = user
    ? `Logged in as ${user.email}`
    : 'Not connected.';
}

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