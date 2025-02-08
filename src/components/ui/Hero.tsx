// components/Map.js
"use client";

import React, { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers not showing
const fixLeafletMarker = () => {
	delete L.Icon.Default.prototype._getIconUrl;
	L.Icon.Default.mergeOptions({
		iconRetinaUrl: "/leaflet/marker-icon-2x.png",
		iconUrl: "/leaflet/marker-icon.png",
		shadowUrl: "/leaflet/marker-shadow.png",
	});
};

const Hero = ({ center = [51.505, -0.09], zoom = 13, markers = [] }) => {
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
			L.marker(position).addTo(map).bindPopup(popup);
		});

		// Cleanup on component unmount
		return () => {
			map.remove();
		};
	}, [center, zoom, markers]);

	return <div id="map" className="h-screen w-full" />;
};

export default Hero;
