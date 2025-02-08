"use client";

import React, { useEffect, useRef, useState } from "react";
import Leaflet, { LatLngLiteral } from "leaflet";
import "leaflet/dist/leaflet.css";
import { subscribeToCaches } from "@/services/cacheService";
import { Cache } from "@/types/index";
import { getDistance } from "@/lib/distance";
import { GoPackage } from "react-icons/go";

export interface MarkerLocation {
	id: string;
	name: string;
	position: [number, number];
	description?: string;
}

interface MarkerLocationToPlayer extends MarkerLocation {
	distanceToPlayer: number;
}

interface MapProps {
	initialCenter?: [number, number];
	zoom?: number;
}

const Map: React.FC<MapProps> = ({
	initialCenter = [51.42595, -0.56521], // Egham, UK
	zoom = 16,
}) => {
	// Refs for the Leaflet map and the markers layer groups
	const mapRef = useRef<Leaflet.Map | null>(null);
	const markersLayerRef = useRef<Leaflet.LayerGroup | null>(null);
	const userLocationLayerRef = useRef<Leaflet.LayerGroup | null>(null);

	const [markerWithDistance, setMarkerWithDistance] = useState<
		MarkerLocationToPlayer[]
	>([]);

	// State for the user's live coordinates
	const [userLocation, setUserLocation] =
		useState<Leaflet.LatLngExpression | null>(null);

	// Use watchPosition for live updates
	useEffect(() => {
		const watchId = navigator.geolocation.watchPosition(
			(position) => {
				setUserLocation({
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				});
			},
			(error) => {
				console.error("Error watching position:", error);
			},
			{
				enableHighAccuracy: true,
				maximumAge: 10000,
				timeout: 5000,
			}
		);

		// Clear the watcher on component unmount
		return () => navigator.geolocation.clearWatch(watchId);
	}, []);

	// Update user marker on the map whenever userLocation changes
	useEffect(() => {
		if (
			userLocation === null ||
			mapRef.current === null ||
			userLocationLayerRef.current === null
		)
			return;
		console.log(userLocation);
		userLocationLayerRef.current.clearLayers();
		const iconSvg = `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="blue" width="30" height="30">
		  <path d="M172.268 501.67C47.961 332.033 0 275.195 0 208c0-79.5 64.5-144 144-144s144 64.5 144 144c0 67.195-47.961 124.03-172.268 293.67a24.005 24.005 0 0 1-39.464 0zM144 208a28 28 0 1 0 56 0 28 28 0 1 0-56 0z"></path>
		</svg>
	  `;
		const iconUrl = "data:image/svg+xml;base64," + btoa(iconSvg);
		const customIcon = Leaflet.icon({
			iconUrl,
			iconSize: [30, 30],
			iconAnchor: [15, 30],
		});

		Leaflet.marker(userLocation, { icon: customIcon }).addTo(
			userLocationLayerRef.current
		);
	}, [userLocation]);

	// State to store caches as marker locations
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

	useEffect(() => {
		if (cacheMarkers === null || userLocation === null) return;

		setMarkerWithDistance(
			cacheMarkers.map((mark) => {
				return {
					...mark,
					distanceToPlayer: getDistance(
						{
							lat: (userLocation as LatLngLiteral).lat,
							lon: (userLocation as LatLngLiteral).lng,
						},
						{
							lat: mark.position[0],
							lon: mark.position[1],
						}
					),
				};
			})
		);
	}, [cacheMarkers, userLocation]);

	// Initialize the map only once
	useEffect(() => {
		if (mapRef.current) return;

		mapRef.current = Leaflet.map("map", {
			center: initialCenter,
			zoom,
			minZoom: 10,
			maxZoom: 18,
			maxBounds: [
				[-90, -180],
				[90, 180],
			],
			maxBoundsViscosity: 1.0,
		});

		Leaflet.tileLayer(
			"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
			{
				maxZoom: 19,
				attribution: "© OpenStreetMap contributors",
			}
		).addTo(mapRef.current);

		// Create layer groups for cache markers and user location marker
		markersLayerRef.current = Leaflet.layerGroup().addTo(mapRef.current);
		userLocationLayerRef.current = Leaflet.layerGroup().addTo(
			mapRef.current
		);
	}, [initialCenter, zoom]);

	// Update markers on the map whenever cacheMarkers change
	useEffect(() => {
		if (
			!mapRef.current ||
			!markersLayerRef.current ||
			markerWithDistance === null
		)
			return;
		markersLayerRef.current.clearLayers();

		// Clear existing markers

		markerWithDistance.forEach((marker) => {
			// rgb(115, 129, 0) -> rgb(122, 0, 0)

			const scalar = marker.distanceToPlayer / 5;

			const RED = (scalar > 1 ? 1 : scalar) * 255;
			const GREEN = (1 - (scalar > 1 ? 1 : scalar)) * 255;
			console.log({ RED, GREEN });

			const icon_colour = `rgb(${RED}, ${GREEN}, 80)`;
			const iconSvg = `
		  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="${icon_colour}" width="30" height="30">
			<path d="M172.268 501.67C47.961 332.033 0 275.195 0 208c0-79.5 64.5-144 144-144s144 64.5 144 144c0 67.195-47.961 124.03-172.268 293.67a24.005 24.005 0 0 1-39.464 0zM144 208a28 28 0 1 0 56 0 28 28 0 1 0-56 0z"></path>
		  </svg>
		`;
			const iconUrl = "data:image/svg+xml;base64," + btoa(iconSvg);
			const customIcon = Leaflet.icon({
				iconUrl,
				iconSize: [30, 30],
				iconAnchor: [15, 30],
			});

			const popupContent = `
        <div>
          <h3 class="font-bold">${marker.name}</h3>
          ${marker.description ? `<p>${marker.description}</p>` : ""}
        </div>
      `;
			Leaflet.marker(marker.position, { icon: customIcon })
				.addTo(markersLayerRef.current!)
				.bindPopup(popupContent);
		});
	}, [markerWithDistance]);

	return (
		<div className="flex w-full">
			<div className="overflow-hidden rounded-xl shadow-lg w-full">
				<div id="map" className="h-96 w-full" />
			</div>
			<div className="w-72 mx-5 p-5 bg-white flex flex-col rounded-xl">
				{markerWithDistance.map((cm, index) => {
					const distance =
						cm.distanceToPlayer < 1
							? `${(cm.distanceToPlayer * 1000).toPrecision(1)}m`
							: `${cm.distanceToPlayer.toPrecision(2)}km`;
					return (
						<div key={index} className={`flex gap-1`}>
							<GoPackage size={20} className="my-auto" />
							<div>
								{cm.name} | {distance}
							</div>
							<div className="text-gray-400">
								{cm.description}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default Map;
