'use client';

import { Map, Marker } from 'pigeon-maps';
import React from 'react';

interface LocationPickerMapProps {
  latitude: number | null;
  longitude: number | null;
  onSelect: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [14.6349, -90.5069]; // Ciudad de Guatemala

export function LocationPickerMap({ latitude, longitude, onSelect }: LocationPickerMapProps) {
  const center: [number, number] = latitude !== null && longitude !== null
    ? [latitude, longitude]
    : DEFAULT_CENTER;

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-200">
      <Map
        defaultCenter={center}
        center={center}
        defaultZoom={11}
        minZoom={5}
        maxZoom={18}
        onClick={({ latLng }) => {
          const [lat, lng] = latLng;
          onSelect(lat, lng);
        }}
        attributionPrefix={false}
      >
        {latitude !== null && longitude !== null && (
          <Marker anchor={[latitude, longitude]} width={40} color="#FF6A00" />
        )}
      </Map>
    </div>
  );
}
