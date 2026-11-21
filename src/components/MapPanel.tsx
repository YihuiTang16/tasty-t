import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Recommendation, Station } from "../types.ts";

function pinIcon(index: number, active: boolean) {
  return L.divIcon({
    className: "tasty-pin",
    html: `<span class="pin${active ? " pin-active" : ""}">${index + 1}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

function startIcon() {
  return L.divIcon({
    className: "tasty-pin",
    html: `<span class="pin pin-start">Start</span>`,
    iconSize: [58, 32],
    iconAnchor: [29, 16],
    popupAnchor: [0, -16],
  });
}

function MapController({ points, follow }: { points: [number, number][]; follow: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (follow) {
      map.flyTo(follow, 15, { duration: reduce ? 0 : 0.55 });
      return;
    }
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 15 });
  }, [follow, map, points]);

  return null;
}

interface MapPanelProps {
  results: Recommendation[];
  origin: Station;
  selectedId: string | null;
  followedId: string | null;
  onSelect: (id: string) => void;
}

export function MapPanel({ results, origin, selectedId, followedId, onSelect }: MapPanelProps) {
  const points = useMemo<[number, number][]>(
    () => [[origin.lat, origin.lon], ...results.map((result) => [result.place.lat, result.place.lon] as [number, number])],
    [origin.lat, origin.lon, results],
  );
  const follow = useMemo<[number, number] | null>(() => {
    const followed = results.find((result) => result.place.id === followedId);
    return followed ? [followed.place.lat, followed.place.lon] : null;
  }, [followedId, results]);

  return (
    <MapContainer
      center={[origin.lat, origin.lon]}
      zoom={13}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <MapController points={points} follow={follow} />
      <Marker position={[origin.lat, origin.lon]} icon={startIcon()} zIndexOffset={200}>
        <Popup>Start at {origin.name}</Popup>
      </Marker>
      {results.map((result, index) => (
        <Marker
          key={result.place.id}
          position={[result.place.lat, result.place.lon]}
          icon={pinIcon(index, result.place.id === selectedId)}
          zIndexOffset={result.place.id === selectedId ? 400 : index}
          eventHandlers={{ click: () => onSelect(result.place.id) }}
        >
          <Popup>
            <strong>{result.place.name}</strong>
            <br />
            {result.place.categoryLabel}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
