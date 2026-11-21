const EARTH_M = 6371000;

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance in meters. This is not a walking or transit travel time. */
export function haversineMeters(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function haversineMiles(lat1, lon1, lat2, lon2) {
  return haversineMeters(lat1, lon1, lat2, lon2) / 1609.344;
}
