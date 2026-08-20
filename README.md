# VinylBox

Browse and manage an existing Discogs vinyl collection through a tactile, cover-first shelf UI.

## Quickstart

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

## How it works

Open the app, paste a Discogs personal access token, and VinylBox verifies the associated account before loading its collection. The token is saved only in that browser's local storage; it is not saved in Supabase, an environment file, or the application database.

Use the shelf to filter, sort, inspect, and remove copies. Use the Discogs search below it to add a specific vinyl release. VinylBox displays the required “Data provided by Discogs” attribution.

Responsive SCSS lives in `src/styles` and per-component modules. Supabase client is provided via `SupabaseProvider`.
