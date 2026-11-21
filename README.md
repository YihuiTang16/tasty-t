# Tasty T

Explore Boston, one T stop at a time.

Tasty T helps Boston college students who do not have a car find food, cafes, museums, and parks they can reach by subway or light rail. You pick a campus station, a budget, a cuisine, an outing, and how much time you have. The app ranks real places and links out to Google Maps public transit directions.

It is an independent student project for BostonHacks BostonBound 2026, on the Bos(tons) of Eats and Streets track. It is not affiliated with the MBTA or MassDOT.

## Try it

The sample trip starts at Boston University, chooses Asian food, a date night, the $15–$25 budget, and two hours. **Try a Sample Trip** fills the form and ranks real places, including Thai and Chinese restaurants by the Green Line B and C branches.

Two other presets are on the form:

- **Study cafe** starts at Northeastern University.
- **Weekend from Harvard** starts at Harvard and prefers places OpenStreetMap lists as free.

## Run it locally

You need Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:4731](http://localhost:4731).

The place and station files are already in `src/data`, so the app does not need an API key or a network connection to rank places. The map tiles load from the OpenStreetMap tile server when you are online.

Other commands:

```bash
npm test          # ranking tests
npm run lint      # oxlint
npm run build     # production build in dist/
npm run preview   # serve the production build on port 4731
npm run validate  # check the cleaned JSON
```

## How a recommendation is scored

| Share | Signal | What it uses |
| --- | --- | --- |
| 35% | Cuisine | OpenStreetMap `cuisine`, or the cafe, bakery, sweets, or ice cream amenity |
| 30% | Transit | Straight-line distance to your campus station and to a Red, Orange, Blue, Green, or Mattapan stop |
| 20% | Budget | Only a listed `fee` or a simple `charge`. If the price is missing, this share is dropped and the other weights are rescaled |
| 15% | Experience | The OpenStreetMap category, such as restaurant, cafe, museum, or park |

Closer places rank higher. The app never turns that distance into a ride time. For Explore the city and Weekend adventure, parks and gardens without a Wikipedia or Wikidata link rank lower than destinations the map links to an article.

The match number is this score. It is not a review, a star rating, or a price.

## Project layout

```
src/                 React app
src/data/            Cleaned places, stations, campuses, and metadata
scripts/             Download, clean, and validate the datasets
data/raw/            Raw Overpass and MBTA responses from the last refresh
```

## Refresh the data

```bash
npm run data:refresh
```

That calls the Overpass API and the MBTA V3 API, then rewrites `src/data`. A key is optional. If you set `MBTA_API_KEY`, the script sends it as `x-api-key`. Low-volume use works without one.

`npm run data:build` reuses `data/raw` when those files are already present.

## Data and licenses

Place records are © OpenStreetMap contributors, under the Open Database License. Station records are provided by MassDOT under the Developers License Agreement. The MIT license in this repository applies to the application code, not to those datasets. Read [DATA_SOURCES.md](DATA_SOURCES.md) before you redistribute the JSON.

## Deploy

See [DEPLOYMENT.md](DEPLOYMENT.md). Vercel and Netlify can build with `npm run build` and publish `dist`. No environment variables are required.

## Hackathon notes

- [PITCH.md](PITCH.md) is a three-minute pitch.
- [DEMO_SCRIPT.md](DEMO_SCRIPT.md) is a one-minute demo script.
- Do not submit the project to Devpost unless you decide to.
