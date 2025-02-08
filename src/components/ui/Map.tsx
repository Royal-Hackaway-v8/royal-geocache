"use client";
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { subscribeToCaches } from "@/services/cacheService";

export interface MarkerLocation {
	id: string;
	name: string;
	position: [number, number];
	description?: string;
}

export interface Cache {
	id: string;
	name: string;
	description: string;
	lat: number;
	lng: number;
	createdAt: number;
	image?: string;
	audio?: string;
}

interface MapProps {
	initialCenter?: [number, number];
	zoom?: number;
}

const Map: React.FC<MapProps> = ({
	initialCenter = [51.42595, -0.56521], // Egham, UK
	zoom = 16,
}) => {
	// Refs for the Leaflet map and the markers layer group
	const mapRef = useRef<L.Map | null>(null);
	const markersLayerRef = useRef<L.LayerGroup | null>(null);

	// State to store Firebase caches as marker locations
	const [cacheMarkers, setCacheMarkers] = useState<MarkerLocation[]>([]);

	// Subscribe to caches from Firebase on component mount
	useEffect(() => {
		const unsubscribe = subscribeToCaches((caches: Cache[]) => {
			const markersFromCaches: MarkerLocation[] = caches.map((cache) => ({
				id: cache.id,
				name: cache.name,
				description: cache.description,
				position: [cache.lat, cache.lng] as [number, number],
			}));
			setCacheMarkers(markersFromCaches);
		});
		return unsubscribe;
	}, []);

	// Initialize the map only once
	useEffect(() => {
		if (!mapRef.current) {
			mapRef.current = L.map("map").setView(initialCenter, zoom);

			L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
				maxZoom: 19,
				attribution: "© OpenStreetMap contributors",
			}).addTo(mapRef.current);

			// Create a layer group for markers to manage them easily
			markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
		}
	}, [initialCenter, zoom]);

	// Update markers on the map whenever cacheMarkers change
	useEffect(() => {
		if (!mapRef.current || !markersLayerRef.current) return;

		// Clear existing markers
		markersLayerRef.current.clearLayers();

		// Define a custom SVG icon for the markers
		const iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="red" width="30" height="30">
        <path d="M172.268 501.67C47.961 332.033 0 275.195 0 208c0-79.5 64.5-144 144-144s144 64.5 144 144c0 67.195-47.961 124.03-172.268 293.67a24.005 24.005 0 0 1-39.464 0zM144 208a28 28 0 1 0 56 0 28 28 0 1 0-56 0z"></path>
      </svg>
    `;
		const iconUrl = "data:image/svg+xml;base64," + btoa(iconSvg);
		const customIcon = L.icon({
			iconUrl,
			iconSize: [30, 30],
			iconAnchor: [15, 30],
		});

		// Add a marker for each cache
		cacheMarkers.forEach((marker) => {
			const popupContent = `
        <div>
          <h3 class="font-bold">${marker.name}</h3>
          ${marker.description ? `<p>${marker.description}</p>` : ""}
        </div>
      `;
			L.marker(marker.position, { icon: customIcon })
				.addTo(markersLayerRef.current!)
				.bindPopup(popupContent);
		});
	}, [cacheMarkers]);

	return <div id="map" className="h-96 w-full" />;
};

export default Map;
