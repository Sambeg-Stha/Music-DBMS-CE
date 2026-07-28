// auth.js
// -----------------------------------------------------------------
// Handles: sign up, log in, log out.
// On sign up, we also create the matching row in public.users,
// since Supabase Auth only creates the auth.users row automatically.
// -----------------------------------------------------------------

import { db } from './supabaseClient.js';

export async function signUp(email, password, gender, nationality, dateOfBirth) {
  const { error } = await db.auth.signUp({
    email,
    password,
    options: {
      data: { gender, nationality, date_of_birth: dateOfBirth }
    }
  });
  if (error) {
    alert(error.message);
    return false;
  }
  // The public.users row (including these extra fields) is created
  // automatically by the handle_new_user trigger, which reads them
  // back out of this metadata.
  alert('Signed up! If email confirmation is required, check your inbox.');
  return true;
}

export async function signIn(email, password) {
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    alert(error.message);
    return false;
  }
  return true;
}

export async function signOut() {
  await db.auth.signOut();
}