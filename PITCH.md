# Pitch: Tasty T

About three minutes. Say it in your own voice. The beats below are the argument, not a script you have to memorize word for word.

## Problem (about 30 seconds)

Boston students are told to explore the city, then handed a restaurant app built for people with cars. The results are a neighborhood they cannot see, a price that was guessed, and a travel time that assumes someone is driving. If you live at Boston University, Northeastern, MIT, or Harvard, the useful question is narrower: what is actually near a T stop I can reach from the station I already use?

## Who it is for (about 20 seconds)

College students in Boston and Cambridge who do not have a car. They are choosing dinner between classes, a cafe to study in, or a Saturday that starts at their campus station. They care about cuisine, money, time, and whether the station is step-free. They do not want to create an account to find out.

## Solution (about 40 seconds)

Tasty T is a campus-to-table guide. You start at a real MBTA station: Boston University Central, Northeastern, Kendall/MIT, Harvard, or Park Street. You set a budget, a cuisine, the kind of outing, and how much time you have. The app ranks places from OpenStreetMap and explains the rank in plain language.

It does not invent the missing pieces. If OpenStreetMap has no price, the card says "Budget not listed" and the budget weight is dropped instead of filled in. Distances are straight-line miles, labeled as such. The transit button opens Google Maps with public transit selected. That is where live routing belongs. We do not pretend we calculated the ride.

## Demonstration (about 50 seconds)

1. Click **Try a Sample Trip**. The form becomes Boston University, $15–$25, Asian, date night, two hours.
2. The first result is Nud Pob, a Thai restaurant under a tenth of a mile from Boston University Central on the Green Line B branch. The card says why: it matches Asian food, it is that close to the station, and it is listed as a restaurant.
3. Point at "Budget not listed." That is intentional. We have 3,446 real places and a price for 29 of them.
4. Click **View on Map**. The numbered pin and the card are the same place. The start pin is the campus station.
5. Click **Get Transit Directions**. Google Maps opens with transit mode. Leave it there.
6. If you have a few extra seconds, click **Study cafe**. Tatte appears beside the Northeastern station. Then click **Weekend from Harvard**. Free museums rise because OpenStreetMap says `fee=no`, not because we guessed a student discount.

## How it is built (about 30 seconds)

The stack is React, TypeScript, and Vite. Places come from the Overpass API. Stations come from the MBTA V3 API, which did not need a key for this snapshot. Both are cleaned with scripts in the repo and saved as JSON, so a demo still works if those APIs are down.

The score is 35% cuisine, 30% transit access, 20% budget, and 15% experience. Transit access mixes distance to a rapid transit stop with distance from the campus station. Time changes that balance. It does not invent a timetable. Green, Red, Orange, Blue, and the Mattapan Trolley are included. Wheelchair boarding stays accessible, not step-free, or unknown.

## Impact (about 20 seconds)

Students get a list they can defend: a real name, a real station, and an honest gap where the data is thin. The city gets a small example of what public map data and public transit data can do together when nobody pretends a missing price is "$". The same pattern works for another campus city. The hard part was not the buttons. It was refusing to fill the blanks.

## If a judge asks

- **Why are so many budgets unknown?** Restaurant prices are not in OpenStreetMap. Guessing them would make the score look smarter and the product less true.
- **Why straight-line miles?** We do not have a routing engine. Google Maps does. We send people there instead of showing a fake "12 minutes."
- **Are you with the T?** No. Station data is provided by MassDOT. We do not use their logo.
- **Can it go stale?** Yes. `npm run data:refresh` downloads a new snapshot. The site you are seeing was built from data retrieved November 21, 2026.
