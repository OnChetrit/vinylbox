# VinylBox

VinylBox is a responsive vinyl-record collection and wishlist manager with Supabase authentication and Discogs-powered record search.

## Highlights

- Email/password authentication with Supabase.
- Search Discogs for record data and artwork.
- Save records to a collection or wishlist.
- Browse collection and wishlist pages with responsive SCSS styling.

## Tech

Next.js, React, TypeScript, Supabase, Discogs API, and Sass.

## Run locally

~~~bash
npm install
cp env.sample .env.local
npm run dev
~~~

Set these values in .env.local:

~~~text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DISCOGS_TOKEN=
~~~

Open http://localhost:3000.

## Production build

~~~bash
npm run build
npm start
~~~
