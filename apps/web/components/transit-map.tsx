'use client';

import * as React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface TransitMapLeg {
  mode: 'bus' | 'mrt' | 'walk';
  fromName: string;
  toName: string;
  serviceNo?: string;
  fromCoords?: { lat: number; lng: number };
  toCoords?: { lat: number; lng: number };
  polyline?: Array<[number, number]>;
}

export interface TransitMapProps {
  legs: TransitMapLeg[];
  height?: number;
}

const ORIGIN_ICON = L.divIcon({
  className: 'route-pin route-pin-pickup',
  html: '<span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const DEST_ICON = L.divIcon({
  className: 'route-pin route-pin-dropoff',
  html: '<span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function transferIcon(label: number): L.DivIcon {
  return L.divIcon({
    className: 'route-pin route-pin-stop',
    html: `<span>${label}</span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

// Distinct, accessible-ish palette. Cycles if there are >5 bus legs.
const LEG_COLORS = ['#0ea5e9', '#f97316', '#8b5cf6', '#10b981', '#ef4444'];

function legColor(mode: TransitMapLeg['mode'], busIndex: number): string {
  if (mode === 'mrt') return '#059669';
  if (mode === 'walk') return '#64748b';
  return LEG_COLORS[busIndex % LEG_COLORS.length]!;
}

interface FitBoundsProps {
  positions: L.LatLngExpression[];
}

function FitBounds({ positions }: FitBoundsProps) {
  const map = useMap();
  React.useEffect(() => {
    if (positions.length === 0) return;
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [positions, map]);
  return null;
}

export function TransitMap({ legs, height = 260 }: TransitMapProps) {
  const drawableLegs = legs.filter(
    (l) => (l.fromCoords && l.toCoords) || (l.polyline && l.polyline.length > 0),
  );

  if (drawableLegs.length === 0) {
    return (
      <div
        className="overflow-hidden rounded-xl border bg-muted"
        style={{ height: `${height}px` }}
      />
    );
  }

  // Compute polylines per leg — falls back to straight from→to when no real
  // road geometry is available.
  let busIdx = 0;
  const polylines = drawableLegs.map((leg) => {
    const idx = leg.mode === 'bus' ? busIdx++ : -1;
    const positions: L.LatLngExpression[] =
      leg.polyline && leg.polyline.length > 0
        ? leg.polyline.map(([lng, lat]) => [lat, lng])
        : leg.fromCoords && leg.toCoords
          ? [
              [leg.fromCoords.lat, leg.fromCoords.lng],
              [leg.toCoords.lat, leg.toCoords.lng],
            ]
          : [];
    return {
      leg,
      positions,
      color: legColor(leg.mode, idx),
      isFallback: !leg.polyline || leg.polyline.length === 0,
    };
  });

  // Bounds: union of every polyline point.
  const allPositions: L.LatLngExpression[] = polylines.flatMap((p) => p.positions);

  // Origin = first leg's from, destination = last leg's to.
  const origin = drawableLegs[0]!.fromCoords;
  const destination = drawableLegs[drawableLegs.length - 1]!.toCoords;

  // Transfer pins: every interior boundary between consecutive legs (when
  // there are 2+ legs).
  const transfers: Array<{ coords: { lat: number; lng: number }; label: number }> = [];
  for (let i = 1; i < drawableLegs.length; i++) {
    const c = drawableLegs[i]!.fromCoords;
    if (c) transfers.push({ coords: c, label: i });
  }

  const center: L.LatLngExpression = origin
    ? [origin.lat, origin.lng]
    : (allPositions[0] ?? [1.3521, 103.8198]);

  return (
    <div
      className="overflow-hidden rounded-xl border bg-muted"
      style={{ height: `${height}px` }}
    >
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={18}
        />

        {polylines.map((p, i) =>
          p.positions.length >= 2 ? (
            <Polyline
              key={i}
              positions={p.positions}
              pathOptions={{
                color: p.color,
                weight: p.leg.mode === 'walk' ? 3 : 4.5,
                opacity: 0.9,
                dashArray: p.leg.mode === 'walk' || p.isFallback ? '6 8' : undefined,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          ) : null,
        )}

        {origin && <Marker position={[origin.lat, origin.lng]} icon={ORIGIN_ICON} />}
        {transfers.map((t, i) => (
          <Marker
            key={`xfer-${i}`}
            position={[t.coords.lat, t.coords.lng]}
            icon={transferIcon(t.label)}
          />
        ))}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={DEST_ICON} />
        )}

        <FitBounds positions={allPositions} />
      </MapContainer>
    </div>
  );
}
