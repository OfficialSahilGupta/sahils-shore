"use client";

// ============================================================================
// Sahil's Shore: Interactive Leaflet + OpenStreetMap Component
// Custom themed SVG map pins, interactive popups, and click-to-pick coordinates
// ============================================================================

import React, { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import type { Place, PlaceCategory } from "@/lib/places";
import { PLACE_CATEGORIES } from "@/lib/places";
import { formatISTDate } from "@/lib/date-utils";

interface LeafletMapProps {
  places: Place[];
  selectedPlaceId?: string | null;
  onSelectPlace?: (place: Place) => void;
  // Picker mode support
  isPickerMode?: boolean;
  pickerCoords?: { lat: number; lng: number } | null;
  onPickCoords?: (lat: number, lng: number) => void;
  className?: string;
}

export default function LeafletMap({
  places,
  selectedPlaceId,
  onSelectPlace,
  isPickerMode = false,
  pickerCoords,
  onPickCoords,
  className = "h-[450px] w-full",
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const pickerMarkerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Dynamically import Leaflet client-side
    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Default center: India [20.5937, 78.9629] or first place with coordinates
      const firstValid = places.find((p) => p.lat != null && p.lng != null);
      const defaultCenter: [number, number] = firstValid
        ? [firstValid.lat!, firstValid.lng!]
        : [28.6139, 77.2090]; // New Delhi

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: firstValid ? 13 : 5,
        zoomControl: true,
      });

      // OpenStreetMap Tile Layer (no paid key required)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Map click handler for picker mode
      map.on("click", (e: any) => {
        if (onPickCoords) {
          onPickCoords(e.latlng.lat, e.latlng.lng);
        }
      });

      renderMarkers(L, map, markersGroup);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when places or selection changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    import("leaflet").then((L) => {
      renderMarkers(L, mapInstanceRef.current, markersLayerRef.current);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, selectedPlaceId, isPickerMode, pickerCoords]);

  const renderMarkers = (L: any, map: any, markersGroup: any) => {
    markersGroup.clearLayers();

    const validPlaces = places.filter((p) => p.lat != null && p.lng != null);
    const bounds: [number, number][] = [];

    validPlaces.forEach((place) => {
      const categoryConfig = PLACE_CATEGORIES[place.category as PlaceCategory] || PLACE_CATEGORIES.other;
      const isSelected = place.id === selectedPlaceId;

      // Create SVG Map Pin
      const pinHtml = `
        <div style="
          position: relative;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${categoryConfig.color};
          border: 2px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          cursor: pointer;
          ${isSelected ? "transform: rotate(-45deg) scale(1.25); border-color: #FAF7F2; box-shadow: 0 0 15px rgba(31,122,140,0.8);" : ""}
        ">
          <div style="
            transform: rotate(45deg);
            color: #ffffff;
            font-size: 13px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#ffffff" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-map-pin",
        html: pinHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([place.lat!, place.lng!], { icon: customIcon });

      // Popup Content
      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; min-width: 160px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 600; text-transform: uppercase; background: ${categoryConfig.color}22; color: ${categoryConfig.color}; padding: 2px 6px; border-radius: 6px;">
              ${place.category}
            </span>
            <span style="color: #E0A458; font-weight: bold; font-size: 11px;">
              ${place.rating ? `Rating: ${place.rating}/5` : ""}
            </span>
          </div>
          <h4 style="font-size: 14px; font-weight: 700; margin: 0 0 4px 0; color: #14232E;">
            ${place.name}
          </h4>
          <p style="font-size: 11px; color: #5B6B76; margin: 0 0 8px 0;">
            Visited: ${formatISTDate(place.visited_at)}
          </p>
          <a href="/places/${place.id}" style="
            display: inline-block;
            font-size: 11px;
            font-weight: 600;
            color: #ffffff;
            background: #1F7A8C;
            padding: 4px 10px;
            border-radius: 8px;
            text-decoration: none;
          ">
            View Details & Expenses →
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on("click", () => {
        onSelectPlace?.(place);
      });

      markersGroup.addLayer(marker);
      bounds.push([place.lat!, place.lng!]);
    });

    // Render picker marker if in picker mode
    if (isPickerMode && pickerCoords) {
      const pickerPinHtml = `
        <div style="
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #D1495B;
          border: 3px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 6px 14px rgba(209,73,91,0.5);
          animation: bounce 0.8s infinite alternate;
        ">
          <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        </div>
      `;

      const pickerIcon = L.divIcon({
        className: "picker-map-pin",
        html: pickerPinHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const pMarker = L.marker([pickerCoords.lat, pickerCoords.lng], {
        icon: pickerIcon,
        draggable: true,
      });

      pMarker.on("dragend", (event: any) => {
        const position = event.target.getLatLng();
        onPickCoords?.(position.lat, position.lng);
      });

      markersGroup.addLayer(pMarker);
      bounds.push([pickerCoords.lat, pickerCoords.lng]);
    }

    // Auto-fit bounds if we have pins
    if (bounds.length > 1 && !isPickerMode) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      } catch {
        // Fallback
      }
    } else if (bounds.length === 1 && !isPickerMode) {
      map.setView(bounds[0], 14);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border bg-surface ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Floating map hint */}
      {isPickerMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 rounded-xl bg-surface/90 px-3 py-1.5 text-xs font-semibold text-text shadow-md backdrop-blur-md border border-border flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span>Click anywhere on the map or drag the pin to set location</span>
        </div>
      )}
    </div>
  );
}
