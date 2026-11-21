# Data sources

Snapshot date: November 21, 2026 (Eastern Time).

The app ranks the files in `src/data`. It does not call Overpass or the MBTA during a visit. Refresh those files with `npm run data:refresh`.

## OpenStreetMap places

| | |
| --- | --- |
| Provider | OpenStreetMap contributors |
| License | [Open Database License (ODbL) 1.0](https://www.openstreetmap.org/copyright) |
| Retrieval | [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) |
| Endpoint used | `https://overpass-api.de/api/interpreter` |
| Retrieved | November 21, 2026, 10:31 AM Eastern |
| Raw file | `data/raw/osm.json` |
| Clean file | `src/data/places.json` |
| Records kept | 3,446 |

The query asks for named nodes, ways, and relations inside this box:

- South 42.315, west -71.175, north 42.410, east -71.015

That box covers Boston and Cambridge campuses, downtown, the North End, Fenway, Allston, Brookline Village, and nearby squares such as Harvard, Kendall, Central, Davis, and Maverick.

Categories requested:

- Restaurants, cafes, fast food, bars, ice cream, food courts
- Bakeries, pastry shops, confectionery
- Museums, galleries, attractions
- Parks and gardens
- Theaters, cinemas, arts centers, nightclubs

### What was removed

| Reason | Count |
| --- | ---: |
| Invalid name | 5 |
| Outside the bounding box | 11 |
| Disused, abandoned, demolished, or marked closed | 7 |
| Private or no access | 11 |
| Duplicate name within 75 meters | 19 |

The query already required a `name` tag, so unnamed features never arrived. Generic names that are only a category word, such as "Restaurant" or "Park", are also dropped. In this snapshot none of the returned names were only that generic word.

Noisy attractions tagged as a statue, plaque, bust, mural, graffiti, artwork, stone, or clock are dropped when they have no website, Wikipedia, or Wikidata link. This snapshot did not need to drop any.

### What was not invented

- Names, coordinates, addresses, websites, and opening hours are copied from OpenStreetMap tags. Addresses are only the `addr:*` parts that exist. A missing street number stays missing.
- Cuisine is not guessed from the venue name. `cuisine=korean` can match the Asian choice. A restaurant with no cuisine tag stays unknown.
- Cafe, bakery, sweets, and ice cream amenities count as Coffee & Desserts even when `cuisine` is empty, because the amenity itself says what they are.
- Pizza is grouped with Italian. Seafood, burgers, diners, and barbecue are grouped with American. Bubble tea is grouped with Coffee & Desserts. A token that is not in those families stays "other" and does not count as a match.
- When several cuisine tokens are present, a meal family wins over a coffee or dessert token. Within that rule, source order wins. `japanese;barbecue` matches Asian because Japanese is the meal token.
- Prices are not estimated. `fee=no` or a charge of zero becomes "Free to enter". A single amount such as `15.00 USD` is shown as listed and placed in a budget tier: under $15, $15–$25, $25–$40, or $40+. Anything else, including `fee=yes` with no amount, stays unknown.
- This snapshot has 26 free records, 3 listed charges, and 3,417 places with no price. Most restaurants have no price. The app says so.

### Category counts

| Category | Count |
| --- | ---: |
| Restaurant | 1,333 |
| Park | 533 |
| Fast food | 487 |
| Cafe | 416 |
| Bar | 144 |
| Bakery | 97 |
| Theater | 71 |
| Garden | 68 |
| Museum | 65 |
| Ice cream | 59 |
| Attraction | 42 |
| Gallery | 34 |
| Arts center | 29 |
| Nightclub | 21 |
| Cinema | 19 |
| Food court | 17 |
| Sweets | 11 |

### Cuisine families

| Family | Count |
| --- | ---: |
| Not food (museum, park, and similar) | 881 |
| Coffee and desserts | 697 |
| Unknown | 526 |
| Other | 445 |
| Asian | 377 |
| American | 278 |
| Italian | 242 |

Opening hours are the raw `opening_hours` tag, or `opening_hours:kitchen` when that is all the source has. The app does not decide whether a place is open right now.

Website links are kept only when they are `http` or `https`. A bare domain from the source gets an `https://` prefix so the link works. Wikipedia links are built only from a `lang:Title` tag or an existing `wikipedia.org` URL.

## Curated late-night listings

The two records in `src/data/late-night.ts` are kept separate from the OpenStreetMap snapshot and are not counted among its 3,446 records.

| Place | Official source for 24/7 hours | Checked |
| --- | --- | --- |
| South Street Diner | [Late-night page](https://www.southstreetdiner.com/late-night-eats.php) | November 21, 2026 |
| Bova's Bakery | [FAQ](https://bovabakeryboston.net/faqs/) | November 21, 2026 |

The app shows these only in the **Late-night bites** preset. Prices are unknown and are not scored. A 24/7 business does not mean that MBTA service is available at that hour; riders should check current transit directions.

## MBTA stations

| | |
| --- | --- |
| Provider | MassDOT, through the MBTA V3 API |
| Agreement | [MassDOT Developers License Agreement](https://cdn.mbta.com/sites/default/files/2023-08/mbta-massdot-develop-license-agreement.pdf) |
| API | [https://api-v3.mbta.com/](https://www.mbta.com/developers/v3-api) |
| Retrieved | November 21, 2026, 10:32 AM Eastern |
| Raw file | `data/raw/mbta.json` |
| Clean file | `src/data/stations.json` |
| Stations kept | 125 |

No API key was required. The script reads route types 0 (light rail) and 1 (subway), then keeps Red, Orange, Blue, Green Line branches, and the Mattapan Trolley. The parent Green route is skipped when the B, C, D, and E branches are present, so those stops are not listed twice.

Entrances and boarding areas are not separate stations. A platform rolls up to its parent station when that parent is in the feed. Station coordinates, names, line colors, and wheelchair boarding values come from the API. Line color falls back to the published MBTA color only if the API omits it. This snapshot did not need that fallback for the line colors it displays.

Wheelchair boarding stays in three states: accessible (`1`), not step-free (`2`), or unknown (`0` or missing). Unknown is not treated as accessible.

Campus starts use these stations:

| Start | Station | API id |
| --- | --- | --- |
| Boston University | Boston University Central | `place-bucen` |
| Northeastern University | Northeastern University | `place-nuniv` |
| MIT | Kendall/MIT | `place-knncl` |
| Harvard University | Harvard | `place-harsq` |
| Downtown Boston | Park Street | `place-pktrm` |

Harvard is the Red Line station. Harvard Avenue on the Green Line is a different stop and is not used as the Harvard start.

## What the app calculates

Nearest-station distance and distance from the campus station are straight-line miles, calculated in the browser with the haversine formula. They are not walking distances, wait times, or MBTA travel times.

Google Maps links use `https://www.google.com/maps/dir/?api=1` with the campus station as the origin, the place as the destination, and `travelmode=transit`. Google may show its own routing after the link opens. Tasty T does not.

## Not included

- Menu prices for restaurants. OpenStreetMap does not have them, and this project does not estimate them.
- Silver Line and local bus stops.
- Live vehicle locations, predictions, or alerts.
- A claim that an OpenStreetMap-listed place is open now. The two curated listings show hours from the business websites as checked on the date above; those hours can change.
- MBTA or MassDOT logos, or any statement that this project is a partner of either agency.

## Attribution to keep visible

- © OpenStreetMap contributors
- Station data provided by MassDOT

The map tiles come from the OpenStreetMap tile server (`https://tile.openstreetmap.org`). The map shows the required OpenStreetMap copyright attribution. These tiles are for light, interactive use; the app does not bulk-download them.
