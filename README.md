# Muse: Music Streaming System

A simplified music streaming web app built to demonstrate relational database design — ER modeling, normalization (1NF–3NF), and implementation on Supabase (PostgreSQL). A minimal HTML/CSS/JS front end connects to the live database to showcase real workflows like artist registration, song/album publishing, and playlist management.

## Features

- User authentication & profiles (Supabase Auth)
- Artist specialization (ISA hierarchy) — users can upgrade to artists
- Song publishing & management
- Album creation & organization
- Playlist management (modeled as a weak entity)
- Genre categorization
- Row-Level Security (RLS) for per-user data access

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend-as-a-Service:** Supabase (Auth, PostgREST API, RLS)
- **Database:** PostgreSQL
- **Hosting:** GitHub Pages

## Database Design

The schema was modeled with Chen ER notation and normalized to 3NF. Core entities: `Users`, `Artists`, `Songs`, `Albums`, `Playlists`, and `Song_Genres`, with `Playlist_Songs` as a junction table for the many-to-many playlist–song relationship.

## Project Structure

```
├── backend/
│   ├── supabaseClient.js
│   ├── auth.js
│   ├── artists.js
│   ├── songs.js
│   ├── albums.js
│   ├── playlists.js
│   └── utils.js
├── index.html
├── login.html
├── signup.html
├── dashboard.html
├── become-artist.html
├── publish-song.html
├── create-album.html
├── create-playlist.html
├── all-songs.html
├── all-albums.html
├── all-playlists.html
└── style.css
```

## Getting Started

1. Clone the repo
2. Set up a Supabase project and run the SQL schema (DDL, triggers, RLS policies)
3. Add your Supabase URL and anon key to `backend/supabaseClient.js`
4. Serve the static files locally (e.g., VS Code Live Server)

## Limitations

- No full-text search/advanced indexing
- No real media streaming (audio chunking, HLS/DASH)
- No listening history or play-count tracking
- No actual audio/cover art file storage

## Future Enhancements

- Social graph & listening history tables
- Subscription/transaction models
- Supabase Storage for audio and cover art
- Mobile app

## License

This project was built for academic purposes (COMP 232).
