# Deployment

Tasty T is a static Vite app. The cleaned datasets are imported into the JavaScript bundle, so the deployed site does not need a database, an API key, or a server function.

Do not submit the project to Devpost unless you choose to.

## Vercel

1. Push the repository to GitHub.
2. In Vercel, import the repository.
3. Framework preset: Vite.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Leave environment variables empty.

Vercel serves `index.html` for the site root. The app has no client-side routes, so you do not need a rewrite rule.

## Netlify

1. Push the repository to GitHub.
2. In Netlify, import the repository.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Leave environment variables empty.

No `_redirects` file is required, because there is only one page.

## Before you deploy

```bash
npm install
npm test
npm run build
```

`npm run preview` serves `dist` at [http://localhost:4731](http://localhost:4731) if you want to check the production build on your machine.

## After it is live

- The first load includes the place data, so the JavaScript file is a few megabytes before compression and about 350 KB gzipped. That is expected.
- Map tiles load from the OpenStreetMap tile server. If those tiles are blocked, the list, explanations, and transit links still work.
- Place websites and Google Maps open in a new tab. They are third-party sites.
- To publish a newer OpenStreetMap or MBTA snapshot, run `npm run data:refresh`, commit `src/data`, and redeploy. Do that when you have a network connection. The refresh respects retries and tries a second Overpass server if the first one fails.

## Secrets

None. If you later set `MBTA_API_KEY` for a local refresh, do not commit it. The running website never reads it.
