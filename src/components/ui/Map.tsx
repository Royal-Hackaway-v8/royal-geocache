"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { subscribeToCaches } from "@/services/cacheService";
import { Cache } from "@/types/index";

export interface MarkerLocation {
	id: string;
	name: string;
	position: [number, number];
	description?: string;
}

export interface Coordinates {
	lat: number;
	long: number;
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

	// Get user coordinates
	const [userLocation, setUserLocation] = useState<Coordinates | null>(null);

	const assignUserLocation = async () => {
		navigator.geolocation.getCurrentPosition((position) => {
			setUserLocation({
				lat: position.coords.latitude,
				long: position.coords.longitude,
			});
		});
	};

	useEffect(() => {
		assignUserLocation();
	}, []);

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
		if (mapRef.current) return;

		mapRef.current = L.map("map", {
			center: initialCenter,
			zoom,
			minZoom: 2,
			maxZoom: 18,
			maxBounds: [
				[-90, -180],
				[90, 180],
			],
			maxBoundsViscosity: 1.0,
		});

		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			maxZoom: 19,
			attribution: "© OpenStreetMap contributors",
		}).addTo(mapRef.current);

		// Create a layer group for markers to manage them easily
		markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
	}, [initialCenter, zoom]);

	// Update markers on the map whenever cacheMarkers change
	useEffect(() => {
		if (!mapRef.current || !markersLayerRef.current) return;

		// Clear existing markers
		markersLayerRef.current.clearLayers();

		// NEW
		if (userLocation !== null) {
			const iconSvg = `
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="blue" width="30" height="30">
			  <path d="M172.268 501.67C47.961 332.033 0 275.195 0 208c0-79.5 64.5-144 144-144s144 64.5 144 144c0 67.195-47.961 124.03-172.268 293.67a24.005 24.005 0 0 1-39.464 0zM144 208a28 28 0 1 0 56 0 28 28 0 1 0-56 0z"></path>
			</svg>
		  `;

			const iconUrl = "data:image/svg+xml;base64," + btoa(iconSvg);
			const customIcon = L.icon({
				iconUrl,
				iconSize: [30, 30],
				iconAnchor: [15, 30],
			});

			const locationPosition = {
				lat: userLocation.lat,
				lng: userLocation.long,
			};
			// Add a marker for each cache
			const popupContent = `
			  <div>
				<h3 class="font-bold">YOU!!</h3>
				<p></p>
			  </div>
			`;
			L.marker(locationPosition, { icon: customIcon })
				.addTo(markersLayerRef.current!)
				.bindPopup(popupContent);
		}
		// END NEW

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
	}, [cacheMarkers, userLocation]);

	return <div id="map" className="h-96 w-full" />;
};

export default Map;
