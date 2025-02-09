"use client"; // Ensures it's only used in client-side rendering

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapComponent = () => {
	const mapRef = useRef<HTMLDivElement>(null); // Reference to the map container

	useEffect(() => {
		if (!mapRef.current) return; // Check if Leaflet map is already initialized

		if (mapRef.current.hasChildNodes()) return;

		const map = L.map(mapRef.current).setView([51.505, -0.09], 13); // Default location (London)

		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		}).addTo(map);

		L.marker([51.505, -0.09])
			.addTo(map)
			.bindPopup("Hello, this is a marker!")
			.openPopup();

		return () => {
			map.remove(); // Cleanup on unmount
		};
	}, []);

	return <div ref={mapRef} style={{ height: "500px", width: "100%" }} />;
};

export default MapComponent;
