"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import React from "react";
import { LatLngExpression } from "leaflet";

// Ensure `react-leaflet` components are imported correctly
const MapContainer = dynamic(
	() => import("react-leaflet").then((mod) => mod.MapContainer),
	{ ssr: false }
) as unknown as React.FC<import("react-leaflet").MapContainerProps>;

const TileLayer = dynamic(
	() => import("react-leaflet").then((mod) => mod.TileLayer),
	{ ssr: false }
) as unknown as React.FC<import("react-leaflet").TileLayerProps>;

const Marker = dynamic(
	() => import("react-leaflet").then((mod) => mod.Marker),
	{ ssr: false }
) as unknown as React.FC<import("react-leaflet").MarkerProps>;

const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
	ssr: false,
}) as unknown as React.FC<import("react-leaflet").PopupProps>;

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
