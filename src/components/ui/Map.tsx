"use client";
// types/map.ts
export interface MarkerLocation {
	id: string;
	name: string;
	position: [number, number];
	description?: string;
}

// data/markers.ts
export const markers: MarkerLocation[] = [
	{
		id: "1",
		name: "London Eye",
		position: [51.503, -0.119],
		description: "Famous Ferris wheel on the River Thames",
	},
	{
		id: "2",
		name: "Tower Bridge",
		position: [51.505, -0.075],
		description: "Iconic Victorian bridge",
	},
	{
		id: "3",
		name: "Big Ben",
		position: [51.5, -0.124],
		description: "The Great Bell of the clock at Westminster",
	},
];

// components/Map.tsx

import React, { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FaMapMarkerAlt } from "react-icons/fa";

interface MapProps {
	initialCenter?: [number, number];
	zoom?: number;
	selectedMarkers?: MarkerLocation[];
}

const Map: React.FC<MapProps> = ({
	initialCenter = [51.505, -0.09],
	zoom = 13,
	selectedMarkers = markers, // Use all markers by default
}) => {
	useEffect(() => {
		// Set default icon options

		// Initialize map
		const map = L.map("map").setView(initialCenter, zoom);

		// Add OpenStreetMap tiles
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			maxZoom: 19,
			attribution: "© OpenStreetMap contributors",
		}).addTo(map);

		// Add markers
		selectedMarkers.forEach((marker) => {
			const { position, name, description } = marker;
			const popupContent = `
        <div>
          <h3 class="font-bold">${name}</h3>
          ${description ? `<p>${description}</p>` : ""}
        </div>
      `;

			L.marker(position).addTo(map).bindPopup(popupContent);
		});

		// Cleanup on unmount
		return () => {
			map.remove();
		};
	}, [initialCenter, zoom, selectedMarkers]);

	return <div id="map" className="h-96 w-full" />;
};

export default Map;
