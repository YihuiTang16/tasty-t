/** Cuisine and category normalization. Families are grouping choices, documented in DATA_SOURCES.md. */

const ASIAN = new Set([
  "asian",
  "pan_asian",
  "asian_fusion",
  "chinese",
  "cantonese",
  "szechuan",
  "sichuan",
  "hunan",
  "shanghainese",
  "peking",
  "taiwanese",
  "hong_kong",
  "japanese",
  "sushi",
  "ramen",
  "izakaya",
  "yakitori",
  "teriyaki",
  "bento",
  "udon",
  "soba",
  "tonkatsu",
  "tempura",
  "korean",
  "korean_bbq",
  "thai",
  "vietnamese",
  "pho",
  "indian",
  "south_indian",
  "north_indian",
  "punjabi",
  "gujarati",
  "bengali",
  "tandoori",
  "malaysian",
  "malay",
  "singaporean",
  "filipino",
  "indonesian",
  "nepalese",
  "nepali",
  "burmese",
  "cambodian",
  "lao",
  "laotian",
  "mongolian",
  "tibetan",
  "pakistani",
  "bangladeshi",
  "sri_lankan",
  "dim_sum",
  "hotpot",
  "hot_pot",
  "poke",
  "dumpling",
  "dumplings",
]);

const AMERICAN = new Set([
  "american",
  "burger",
  "burgers",
  "hamburger",
  "diner",
  "barbecue",
  "bbq",
  "steak",
  "steakhouse",
  "hot_dog",
  "hotdog",
  "wings",
  "fried_chicken",
  "new_england",
  "seafood",
  "clam",
  "lobster",
  "breakfast",
  "brunch",
  "southern",
  "cajun",
  "soul_food",
]);

const ITALIAN = new Set(["italian", "pizza", "pasta", "sicilian", "neapolitan", "tuscan", "trattoria"]);

const COFFEE = new Set([
  "coffee",
  "coffee_shop",
  "cafe",
  "tea",
  "bubble_tea",
  "boba",
  "dessert",
  "desserts",
  "ice_cream",
  "gelato",
  "pastry",
  "pastries",
  "cake",
  "cakes",
  "donut",
  "donuts",
  "doughnut",
  "doughnuts",
  "bakery",
  "cookie",
  "cookies",
  "chocolate",
  "juice",
  "smoothie",
  "smoothies",
  "crepe",
  "crepes",
  "waffle",
  "waffles",
  "frozen_yogurt",
  "froyo",
  "cupcake",
  "pie",
]);

const FAMILY_BY_TOKEN = new Map();
for (const token of ASIAN) FAMILY_BY_TOKEN.set(token, "asian");
for (const token of AMERICAN) FAMILY_BY_TOKEN.set(token, "american");
for (const token of ITALIAN) FAMILY_BY_TOKEN.set(token, "italian");
for (const token of COFFEE) FAMILY_BY_TOKEN.set(token, "coffee-desserts");

const GENERIC_NAMES = new Set([
  "restaurant",
  "cafe",
  "café",
  "coffee",
  "coffee shop",
  "bar",
  "pub",
  "park",
  "garden",
  "bakery",
  "fast food",
  "food",
  "kitchen",
  "pizza",
  "sushi",
  "museum",
  "theatre",
  "theater",
  "cinema",
  "attraction",
  "gallery",
  "nightclub",
  "ice cream",
  "food court",
  "pastry",
  "untitled",
  "unknown",
  "none",
  "n/a",
  "na",
  "test",
  "fixme",
  "yes",
  "no",
]);

const NOISY_ATTRACTIONS = new Set([
  "statue",
  "plaque",
  "bust",
  "mural",
  "graffiti",
  "artwork",
  "stone",
  "clock",
]);

const FOOD_AMENITIES = new Set(["restaurant", "cafe", "fast_food", "bar", "ice_cream", "food_court"]);
const FOOD_SHOPS = new Set(["bakery", "pastry", "confectionery", "ice_cream"]);

export function normalizeName(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isGenericName(name) {
  const simplified = name.normalize("NFKC").toLowerCase().replace(/^the\s+/, "").trim();
  return GENERIC_NAMES.has(simplified);
}

export function categorize(tags) {
  const amenity = tags.amenity ?? null;
  const shop = tags.shop ?? null;
  const tourism = tags.tourism ?? null;
  const leisure = tags.leisure ?? null;

  if (FOOD_AMENITIES.has(amenity) || FOOD_SHOPS.has(shop)) {
    if (amenity === "cafe") return ["cafe", "Cafe"];
    if (amenity === "restaurant") return ["restaurant", "Restaurant"];
    if (amenity === "fast_food") return ["fast_food", "Fast food"];
    if (amenity === "bar") return ["bar", "Bar"];
    if (amenity === "food_court") return ["food_court", "Food court"];
    if (amenity === "ice_cream" || shop === "ice_cream") return ["ice_cream", "Ice cream"];
    if (shop === "bakery" || shop === "pastry") return ["bakery", "Bakery"];
    if (shop === "confectionery") return ["sweets", "Sweets"];
  }

  if (tourism === "museum") return ["museum", "Museum"];
  if (tourism === "gallery") return ["gallery", "Gallery"];
  if (amenity === "theatre") return ["theatre", "Theater"];
  if (amenity === "cinema") return ["cinema", "Cinema"];
  if (amenity === "arts_centre") return ["arts_centre", "Arts center"];
  if (amenity === "nightclub") return ["nightclub", "Nightclub"];
  if (leisure === "park") return ["park", "Park"];
  if (leisure === "garden") return ["garden", "Garden"];
  if (tourism === "attraction") return ["attraction", "Attraction"];
  return null;
}

export function isNoisyAttraction(tags, category) {
  if (category !== "attraction") return false;
  const kind = (tags.attraction || "").toLowerCase();
  if (!NOISY_ATTRACTIONS.has(kind)) return false;
  return !tags.wikipedia && !tags.wikidata && !tags.website && !tags["contact:website"];
}

export function isDisused(tags) {
  if (tags.disused || tags.abandoned || tags.demolished || tags.razed || tags.construction) return true;
  for (const key of Object.keys(tags)) {
    if (
      key.startsWith("disused:") ||
      key.startsWith("abandoned:") ||
      key.startsWith("demolished:") ||
      key.startsWith("razed:") ||
      key.startsWith("was:")
    ) {
      return true;
    }
  }
  const hours = String(tags.opening_hours || "")
    .trim()
    .toLowerCase();
  return hours === "closed" || hours === "off" || hours === "shutdown";
}

export function isPrivate(tags) {
  const access = String(tags.access || "").toLowerCase();
  return access === "private" || access === "no";
}

export function formatToken(token) {
  return token
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function cuisineTokens(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/[;,/|]/)
    .map((part) => part.trim().toLowerCase().replace(/\s+/g, "_"))
    .filter(Boolean);
}

/**
 * Meal families win over coffee when both are present, using source order within that rule.
 * The first unmatched token does not become a false Asian/American/Italian match.
 */
export function classifyCuisine(tags, category) {
  const raw = typeof tags.cuisine === "string" ? tags.cuisine.trim() : "";
  const tokens = cuisineTokens(raw);
  const mapped = tokens
    .map((token) => ({ token, family: FAMILY_BY_TOKEN.get(token) ?? null }))
    .filter((item) => item.family);
  const meal = mapped.find((item) => item.family !== "coffee-desserts");
  const chosen = meal || mapped[0] || null;

  if (chosen) {
    return {
      cuisineFamily: chosen.family,
      cuisineRaw: raw,
      cuisineLabel: tokens.map(formatToken).join(", "),
      cuisineMatchLabel: formatToken(chosen.token),
    };
  }

  if (tokens.length > 0) {
    return {
      cuisineFamily: "other",
      cuisineRaw: raw,
      cuisineLabel: tokens.map(formatToken).join(", "),
      cuisineMatchLabel: formatToken(tokens[0]),
    };
  }

  if (category === "cafe" || category === "bakery" || category === "sweets" || category === "ice_cream") {
    return {
      cuisineFamily: "coffee-desserts",
      cuisineRaw: null,
      cuisineLabel: null,
      cuisineMatchLabel: null,
    };
  }

  if (
    category === "museum" ||
    category === "gallery" ||
    category === "park" ||
    category === "garden" ||
    category === "theatre" ||
    category === "cinema" ||
    category === "arts_centre" ||
    category === "nightclub" ||
    category === "attraction"
  ) {
    return {
      cuisineFamily: "not-food",
      cuisineRaw: null,
      cuisineLabel: null,
      cuisineMatchLabel: null,
    };
  }

  return {
    cuisineFamily: "unknown",
    cuisineRaw: null,
    cuisineLabel: null,
    cuisineMatchLabel: null,
  };
}

function parseSimpleCharge(charge) {
  const text = charge.trim().toLowerCase();
  if (["0", "0 usd", "usd 0", "free", "no", "$0", "0.00", "0.00 usd"].includes(text)) {
    return { tier: "under-15", amount: 0 };
  }
  const match = text.match(/^(?:usd\s*)?\$?(\d+(?:\.\d{1,2})?)(?:\s*usd)?$/);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  if (amount < 15) return { tier: "under-15", amount };
  if (amount <= 25) return { tier: "15-25", amount };
  if (amount <= 40) return { tier: "25-40", amount };
  return { tier: "40-plus", amount };
}

export function budgetFromTags(tags) {
  const fee = typeof tags.fee === "string" ? tags.fee.trim().toLowerCase() : null;
  const charge = typeof tags.charge === "string" ? tags.charge.trim() : "";

  if (charge) {
    const parsed = parseSimpleCharge(charge);
    if (parsed?.amount === 0) {
      return {
        status: "free",
        tier: "under-15",
        label: "Free to enter",
        evidence: `OpenStreetMap charge=${charge}`,
      };
    }
    if (parsed) {
      return {
        status: "listed",
        tier: parsed.tier,
        label: `Listed charge: ${charge}`,
        evidence: `OpenStreetMap charge=${charge}`,
      };
    }
    return {
      status: "unknown",
      tier: null,
      label: `Listed charge: ${charge}`,
      evidence: `OpenStreetMap charge=${charge} is not a single amount, so it was not mapped to a budget tier`,
    };
  }

  if (fee === "no" || fee === "free") {
    return {
      status: "free",
      tier: "under-15",
      label: "Free to enter",
      evidence: `OpenStreetMap fee=${fee}`,
    };
  }

  if (fee === "yes") {
    return {
      status: "unknown",
      tier: null,
      label: "Admission fee listed, amount not included",
      evidence: "OpenStreetMap fee=yes",
    };
  }

  return {
    status: "unknown",
    tier: null,
    label: "Budget not listed",
    evidence: "No fee or charge tag in OpenStreetMap",
  };
}

export function cleanHttpUrl(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(www\.)?[-a-z0-9.]+\.[a-z]{2,}(\/\S*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return null;
}

export function websiteFromTags(tags) {
  return cleanHttpUrl(tags.website) || cleanHttpUrl(tags["contact:website"]);
}

export function wikipediaUrl(tag) {
  if (!tag || typeof tag !== "string") return null;
  const trimmed = tag.trim();
  if (/^https?:\/\/([a-z]{2,}\.)?wikipedia\.org\/.+/i.test(trimmed)) return trimmed;
  const match = trimmed.match(/^([a-z]{2,}):(.+)$/i);
  if (!match) return null;
  const title = encodeURIComponent(match[2].trim().replace(/ /g, "_"));
  return `https://${match[1].toLowerCase()}.wikipedia.org/wiki/${title}`;
}

export function addressFromTags(tags) {
  const housenumber = stringTag(tags["addr:housenumber"]);
  const street = stringTag(tags["addr:street"]);
  const unit = stringTag(tags["addr:unit"]);
  const city = stringTag(tags["addr:city"]);
  const state = stringTag(tags["addr:state"]);
  const parts = [];
  if (housenumber && street) {
    parts.push(unit ? `${housenumber} ${street}, ${unit}` : `${housenumber} ${street}`);
  } else if (street) {
    parts.push(street);
  }
  if (parts.length > 0 && city) parts.push(city);
  if (parts.length > 0 && state) parts.push(state);
  return {
    address: parts.length > 0 ? parts.join(", ") : null,
    city,
  };
}

export function openingHoursFromTags(tags) {
  const general = stringTag(tags.opening_hours);
  if (general && !["closed", "off", "shutdown"].includes(general.toLowerCase())) {
    return { openingHours: general, openingHoursScope: "general" };
  }
  const kitchen = stringTag(tags["opening_hours:kitchen"]);
  if (kitchen) return { openingHours: kitchen, openingHoursScope: "kitchen" };
  return { openingHours: null, openingHoursScope: null };
}

function stringTag(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
