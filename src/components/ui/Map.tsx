// components/Map.tsx
"use client";

import React, { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MarkerData {
	position: [number, number];
	popup?: string;
}

interface MapProps {
	center?: [number, number];
	zoom?: number;
	markers?: MarkerData[];
}

// Fix for default markers not showing
const fixLeafletMarker = () => {
	// Instead of trying to delete a property that might not exist,
	// we'll directly set the icon options
	L.Icon.Default.mergeOptions({
		iconRetinaUrl: "/leaflet/marker-icon-2x.png",
		iconUrl: "/leaflet/marker-icon.png",
		shadowUrl: "/leaflet/marker-shadow.png",
	});
};

const Map: React.FC<MapProps> = ({
	center = [51.505, -0.09],
	zoom = 13,
	markers = [],
}) => {
	useEffect(() => {
		// Fix marker icons
		fixLeafletMarker();

		// Initialize map
		const map = L.map("map").setView(center, zoom);

		// Add OpenStreetMap tiles
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			maxZoom: 19,
			attribution: "© OpenStreetMap contributors",
		}).addTo(map);

		// Add markers if provided
		markers.forEach(({ position, popup }) => {
			const marker = L.marker(position).addTo(map);
			if (popup) {
				marker.bindPopup(popup);
			}
		});

		// Cleanup on component unmount
		return () => {
			map.remove();
		};
	}, [center, zoom, markers]);

	return <div id="map" className="h-96 w-full" />;
};

export default Map;
