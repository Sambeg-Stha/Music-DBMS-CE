// supabaseClient.js
//supabaseClient.js
// -----------------------------------------------------------------
// Single shared connection to our Supabase project.
// Every other JS file (auth.js, songs.js, playlists.js) imports
// this same `db` object instead of creating its own connection.
// This means the URL/key only ever need to be set in ONE place.
// -----------------------------------------------------------------

// --- CONFIG: replace with your actual Supabase project values ---
const SUPABASE_URL = "https://cbgorympatpvrqgtqdij.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_0VE_NlFnfZXoc9fL5125dQ_GtfFjj_7";
// -------------------------------------------------------------

// `supabase` here is the global provided by the CDN <script> tag
// loaded in index.html. createClient() sets up the actual connection.
export const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);