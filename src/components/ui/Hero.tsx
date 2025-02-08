"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import React from "react";
import { LatLngExpression } from "leaflet";

// Dynamically import react-leaflet components to prevent SSR issues
const MapContainer = dynamic(
	() => import("react-leaflet").then((mod) => mod.MapContainer),
	{ ssr: false }
) as unknown as React.FC<import("react-leaflet").MapContainerProps>;

const TileLayer = dynamic(
	() => import("react-leaflet").then((mod) => mod.TileLayer),
	{ ssr: false }
) as unknown as React.FC<import("react-leaflet").TileLayerProps>;

const PixiOverlay = dynamic(
	() => import("react-leaflet-pixi-overlay").then((mod) => mod.default),
	{ ssr: false }
) as unknown as React.FC<any>; // Type workaround for now

const position: LatLngExpression = [-37.814, 144.96332];

const Hero: React.FC = () => {
	const markers = [
		{
			id: "1",
			iconColor: "red",
			position: [-37.814, 144.96332],
			popup: "<div>All good!</div>", // ✅ Replaced `renderToString` with plain HTML string
			onClick: () => alert("marker clicked"),
			tooltip: "Hey!",
		},
		{
			id: "2",
			iconColor: "blue",
			position: [-37.815, 144.96332], // Slightly different position
			popup: "Quack!",
			popupOpen: true, // Popup opens by default
			onClick: () => alert("marker clicked"),
			tooltip: "Nice!",
		},
	];

	return (
		<div className="relative w-full h-[80vh] flex justify-center items-center">
			<MapContainer
				zoom={18}
				preferCanvas
				maxZoom={20}
				minZoom={3}
				center={position}
				className="w-full h-full rounded-lg shadow-lg"
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				<PixiOverlay markers={markers} />
			</MapContainer>
		</div>
	);
};

export default Hero;
