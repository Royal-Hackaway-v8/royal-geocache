"use client";
import React, { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

interface MapProps {
	initialCenter?: [number, number];
	zoom?: number;
	selectedMarkers?: MarkerLocation[];
}

const Map: React.FC<MapProps> = ({
	initialCenter = [51.42595, -0.56521], // Egham, UK
	zoom = 16,
	selectedMarkers = markers,
}) => {
	useEffect(() => {
		// Define the SVG for the marker (based on FontAwesome's FaMapMarkerAlt)
		const iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="red" width="30" height="30">
        <path d="M172.268 501.67C47.961 332.033 0 275.195 0 208c0-79.5 64.5-144 144-144s144 64.5 144 144c0 67.195-47.961 124.03-172.268 293.67a24.005 24.005 0 0 1-39.464 0zM144 208a28 28 0 1 0 56 0 28 28 0 1 0-56 0z"></path>
      </svg>
    `;
		// Create a data URL for the icon
		const iconUrl = "data:image/svg+xml;base64," + btoa(iconSvg);

		// Create a custom Leaflet icon using the data URL
		const customIcon = L.icon({
			iconUrl,
			iconSize: [30, 30],
			iconAnchor: [15, 30],
		});

		// Initialize map
		const map = L.map("map").setView(initialCenter, zoom);

		// Add OpenStreetMap tiles
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			maxZoom: 19,
			attribution: "© OpenStreetMap contributors",
		}).addTo(map);

		// Add markers with the custom icon
		selectedMarkers.forEach((marker) => {
			const { position, name, description } = marker;
			const popupContent = `
        <div>
          <h3 class="font-bold">${name}</h3>
          ${description ? `<p>${description}</p>` : ""}
        </div>
      `;
			L.marker(position, { icon: customIcon })
				.addTo(map)
				.bindPopup(popupContent);
		});

		// Cleanup on unmount
		return () => {
			map.remove();
		};
	}, [initialCenter, zoom, selectedMarkers]);

	return <div id="map" className="h-96 w-full" />;
};

export default Map;
