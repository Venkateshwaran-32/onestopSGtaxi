'use client';

import * as React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLng, Place } from '@onestopsgtaxi/shared';

const PICKUP_ICON = L.divIcon({
  className: 'route-pin route-pin-pickup',
  html: '<span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const DROPOFF_ICON = L.divIcon({
  className: 'route-pin route-pin-dropoff',
  html: '<span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

interface FitToBoundsProps {
  bounds: [LatLng, LatLng];
}

function FitToBounds({ bounds }: FitToBoundsProps) {
  const map = useMap();
  React.useEffect(() => {
    const latlngs: L.LatLngExpression[] = bounds.map((b) => [b.lat, b.lng]);
    map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 15 });
  }, [bounds, map]);
  return null;
}

export interface RouteMapProps {
  pickup: Place;
  dropoff: Place;
  polyline?: [number, number][];
  height?: number;
}

export function RouteMap({ pickup, dropoff, polyline, height = 200 }: RouteMapProps) {
  const positions: L.LatLngExpression[] = polyline
    ? polyline.map(([lng, lat]) => [lat, lng])
    : [
        [pickup.coords.lat, pickup.coords.lng],
        [dropoff.coords.lat, dropoff.coords.lng],
      ];

  return (
    <div
      className="overflow-hidden rounded-xl border bg-muted"
      style={{ height: `${height}px` }}
    >
      <MapContainer
        center={[pickup.coords.lat, pickup.coords.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        dragging
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={18}
        />
        <Marker position={[pickup.coords.lat, pickup.coords.lng]} icon={PICKUP_ICON} />
        <Marker position={[dropoff.coords.lat, dropoff.coords.lng]} icon={DROPOFF_ICON} />
        <Polyline
          positions={positions}
          pathOptions={{
            color: 'var(--color-primary)',
            weight: 4,
            opacity: 0.85,
            dashArray: polyline ? undefined : '6 8',
          }}
        />
        <FitToBounds bounds={[pickup.coords, dropoff.coords]} />
      </MapContainer>
    </div>
  );
}

export interface MultiStopMapProps {
  stops: Place[];
  height?: number;
}

export function MultiStopMap({ stops, height = 220 }: MultiStopMapProps) {
  if (stops.length < 2) return null;
  const positions: L.LatLngExpression[] = stops.map((s) => [s.coords.lat, s.coords.lng]);

  return (
    <div
      className="overflow-hidden rounded-xl border bg-muted"
      style={{ height: `${height}px` }}
    >
      <MapContainer
        center={positions[0]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
          maxZoom={18}
        />
        {stops.map((stop, i) => (
          <Marker
            key={`${stop.label}-${i}`}
            position={[stop.coords.lat, stop.coords.lng]}
            icon={
              i === 0
                ? PICKUP_ICON
                : L.divIcon({
                    className: 'route-pin route-pin-stop',
                    html: `<span>${i}</span>`,
                    iconSize: [22, 22],
                    iconAnchor: [11, 11],
                  })
            }
          />
        ))}
        <Polyline
          positions={positions}
          pathOptions={{ color: 'var(--color-primary)', weight: 3.5, opacity: 0.85 }}
        />
        <FitToBounds bounds={[stops[0]!.coords, stops[stops.length - 1]!.coords]} />
      </MapContainer>
    </div>
  );
}
