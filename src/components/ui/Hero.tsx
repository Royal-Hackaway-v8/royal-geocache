"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import React from "react";
import { LatLngExpression } from "leaflet";

// Dynamically import react-leaflet components to prevent SSR issues
const MapContainer = dynamic(
	() => import("react-leaflet").then((mod) => mod.MapContainer),
	{ ssr: false }
);
const TileLayer = dynamic(
	() => import("react-leaflet").then((mod) => mod.TileLayer),
	{ ssr: false }
);
const Marker = dynamic(
	() => import("react-leaflet").then((mod) => mod.Marker),
	{ ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
	ssr: false,
});

const position: LatLngExpression = [51.505, -0.09];

const Hero: React.FC = () => {
	return (
		<div className="bg-black h-screen w-screen flex justify-center items-center">
			<MapContainer
				center={position}
				zoom={13}
				style={{ height: "100%", width: "100%" }}
			>
				<TileLayer
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				/>
				<Marker position={position}>
					<Popup>
						A pretty CSS3 popup. <br /> Easily customizable.
					</Popup>
				</Marker>
			</MapContainer>
		</div>
	);
};

export default Hero;
