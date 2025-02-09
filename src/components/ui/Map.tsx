"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { LatLngLiteral } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
	subscribeToCacheGalleries,
	subscribeToCacheGroups,
} from "@/services/cacheService";
import { CacheGallery, CacheGroup } from "@/types";
import { getDistance } from "@/lib/distance";
import { WITHIN_RANGE_RADIUS } from "@/lib/constants";

// Types for marker data
export interface MarkerLocation {
	id: string;
	name: string;
	position: [number, number];
	description?: string;
}

interface MarkerLocationToPlayer extends MarkerLocation {
	distanceToPlayer: number;
}

export interface MapProps {
	initialCenter?: [number, number];
	zoom?: number;
}

/**
 * ReactLeafletMap renders the map using react-leaflet.
 * It expects marker data, user location, and selected galleries.
 */
const ReactLeafletMap: React.FC<
	MapProps & {
		markerWithDistance: MarkerLocationToPlayer[];
		userLocation: L.LatLngExpression | null;
		selectedGalleries: Set<string>;
	}
> = ({
	initialCenter = [51.42595, -0.56521],
	zoom = 16,
	markerWithDistance,
	userLocation,
	selectedGalleries,
}) => {
	const [mounted, setMounted] = useState<boolean>(false);
	useEffect(() => setMounted(true), []);

	if (!mounted) return null;

	// Helper function to create a custom icon from an SVG color.
	const createCustomIcon = (iconColour: string) => {
		const iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="${iconColour}" width="30" height="30">
        <path d="M172.268 501.67C47.961 332.033 0 275.195 0 208c0-79.5 64.5-144 144-144s144 64.5 144 144c0 67.195-47.961 124.03-172.268 293.67a24.005 24.005 0 0 1-39.464 0zM144 208a28 28 0 1 0 56 0 28 28 0 1 0-56 0z"></path>
      </svg>
    `;
		const iconUrl = "data:image/svg+xml;base64," + btoa(iconSvg);
		return L.icon({
			iconUrl,
			iconSize: [30, 30],
			iconAnchor: [15, 30],
		});
	};

	// Define a blue icon for the user location.
	const userIcon = (() => {
		const iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="blue" width="30" height="30">
        <path d="M172.268 501.67C47.961 332.033 0 275.195 0 208c0-79.5 64.5-144 144-144s144 64.5 144 144c0 67.195-47.961 124.03-172.268 293.67a24.005 24.005 0 0 1-39.464 0zM144 208a28 28 0 1 0 56 0 28 28 0 1 0-56 0z"></path>
      </svg>
    `;
		const iconUrl = "data:image/svg+xml;base64," + btoa(iconSvg);
		return L.icon({
			iconUrl,
			iconSize: [30, 30],
			iconAnchor: [15, 30],
		});
	})();

	return (
		<MapContainer
			center={initialCenter}
			zoom={zoom}
			style={{ height: "100%", width: "100%" }}
		>
			<TileLayer
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				attribution="© OpenStreetMap contributors"
				maxZoom={19}
			/>
			{userLocation && (
				<Marker position={userLocation} icon={userIcon}>
					<Popup>Your Location</Popup>
				</Marker>
			)}
			{markerWithDistance.map((marker) => {
				// Compute a dynamic color based on the marker's distance.
				const scalar =
					(1 / Math.pow(WITHIN_RANGE_RADIUS, 1 / 3)) *
					Math.pow(marker.distanceToPlayer, 1 / 3);
				const red = (scalar > 1 ? 1 : scalar) * 255;
				const green = (1 - (scalar > 1 ? 1 : scalar)) * 255;
				const computedColor = `rgb(${red}, ${green}, 80)`;
				const iconColour = selectedGalleries.has(marker.id)
					? computedColor
					: "gray";
				const customIcon = createCustomIcon(iconColour);
				return (
					<Marker
						key={marker.id}
						position={marker.position}
						icon={customIcon}
					>
						<Popup>
							<div>
								<h3 className="font-bold">
									{marker.name} (
									{marker.distanceToPlayer < 1
										? `${Math.ceil(
												marker.distanceToPlayer * 1000
										  )}m`
										: `${marker.distanceToPlayer.toFixed(
												2
										  )}km`}
									)
								</h3>
								{marker.description && (
									<p>{marker.description}</p>
								)}
								<a
									href={`/found-it/?cacheGalleryID=${marker.id}`}
									className="inline-block bg-indigo-100 hover:bg-indigo-200 text-white px-3 py-1 w-full text-center rounded-full shadow-md mt-2"
								>
									View Details
								</a>
							</div>
						</Popup>
					</Marker>
				);
			})}
		</MapContainer>
	);
};

const Map: React.FC<MapProps> = ({
	initialCenter = [51.42595, -0.56521],
	zoom = 16,
}) => {
	// State hooks for marker data, user location, and sidebar selections.
	const [cacheMarkers, setCacheMarkers] = useState<MarkerLocation[]>([]);
	const [markerWithDistance, setMarkerWithDistance] = useState<
		MarkerLocationToPlayer[]
	>([]);
	const [userLocation, setUserLocation] = useState<L.LatLngExpression | null>(
		null
	);
	const [selectedGalleries, setSelectedGalleries] = useState<Set<string>>(
		new Set()
	);
	const [expandedGroups, setExpandedGroups] = useState<{
		[groupId: string]: boolean;
	}>({});
	const [cacheGroups, setCacheGroups] = useState<CacheGroup[]>([]);

	// Subscribe to cache groups.
	useEffect(() => {
		const unsubscribe = subscribeToCacheGroups((groups: CacheGroup[]) => {
			setCacheGroups(groups);
		});
		return () => unsubscribe();
	}, []);

	// Watch user location.
	useEffect(() => {
		const watchId = navigator.geolocation.watchPosition(
			(position) => {
				setUserLocation({
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				});
			},
			(error) => console.error("Error watching position:", error),
			{ enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
		);
		return () => navigator.geolocation.clearWatch(watchId);
	}, []);

	// Subscribe to cache galleries.
	useEffect(() => {
		const unsubscribe = subscribeToCacheGalleries(
			(galleries: CacheGallery[]) => {
				const markersFromGalleries = galleries.map((gallery) => ({
					id: gallery.id,
					name: gallery.name,
					description: gallery.description,
					position: [gallery.lat, gallery.lng] as [number, number],
				}));
				setCacheMarkers(markersFromGalleries);
			}
		);
		return () => unsubscribe();
	}, []);

	// Initialize selectedGalleries when markers load.
	useEffect(() => {
		if (cacheMarkers.length > 0 && selectedGalleries.size === 0) {
			setSelectedGalleries(
				new Set(cacheMarkers.map((marker) => marker.id))
			);
		}
	}, [cacheMarkers, selectedGalleries]);

	// Compute distances from userLocation to each marker.
	useEffect(() => {
		if (!cacheMarkers || userLocation === null) return;
		const markersWithDistance = cacheMarkers.map((marker) => ({
			...marker,
			distanceToPlayer: getDistance(
				{
					lat: (userLocation as LatLngLiteral).lat,
					lon: (userLocation as LatLngLiteral).lng,
				},
				{ lat: marker.position[0], lon: marker.position[1] }
			),
		}));
		setMarkerWithDistance(markersWithDistance);
	}, [cacheMarkers, userLocation]);

	// Sidebar handlers.
	const toggleExpand = (groupId: string) => {
		setExpandedGroups((prev) => ({
			...prev,
			[groupId]: !prev[groupId],
		}));
	};

	const toggleGroupCheckbox = (group: CacheGroup) => {
		const allSelected = group.groupList.every((id) =>
			selectedGalleries.has(id)
		);
		setSelectedGalleries((prev) => {
			const newSelected = new Set(prev);
			if (allSelected) {
				group.groupList.forEach((id) => newSelected.delete(id));
			} else {
				group.groupList.forEach((id) => newSelected.add(id));
			}
			return newSelected;
		});
	};

	const toggleGallery = (galleryId: string) => {
		setSelectedGalleries((prev) => {
			const newSelected = new Set(prev);
			newSelected.has(galleryId)
				? newSelected.delete(galleryId)
				: newSelected.add(galleryId);
			return newSelected;
		});
	};

	return (
		<div className="flex w-full">
			{/* Map Container */}
			<div className="overflow-hidden rounded-xl shadow-lg w-full ml-5">
				<div className="h-96 w-full">
					<ReactLeafletMap
						initialCenter={initialCenter}
						zoom={zoom}
						markerWithDistance={markerWithDistance}
						userLocation={userLocation}
						selectedGalleries={selectedGalleries}
					/>
				</div>
			</div>

			{/* Sidebar Container */}
			<div className="w-80 mx-5 p-5 bg-white flex flex-col rounded-xl shadow-md">
				<h2 className="text-lg font-semibold mb-4">Cache Groups</h2>
				{cacheGroups.map((group) => {
					const groupGalleryIds = group.groupList;
					const allSelected = groupGalleryIds.every((id) =>
						selectedGalleries.has(id)
					);
					return (
						<div
							key={group.id}
							className="rounded-xl mb-3 shadow-lg overflow-hidden"
						>
							<div
								className="flex items-center justify-between p-2 bg-gray-100 cursor-pointer rounded-xl shadow"
								onClick={() => toggleExpand(group.id)}
							>
								<div className="flex items-center gap-2">
									<input
										type="checkbox"
										checked={allSelected}
										onChange={(e) => {
											e.stopPropagation();
											toggleGroupCheckbox(group);
										}}
										onClick={(e) => e.stopPropagation()}
										className="h-4 w-4 border border-gray-300 rounded-sm bg-white checked:bg-green-400 checked:border-green-400 focus:outline-none transition-colors cursor-pointer"
									/>
									<span className="font-bold">
										{group.name}
									</span>
								</div>
								<div className="text-xl">
									{expandedGroups[group.id] ? "-" : "+"}
								</div>
							</div>
							{expandedGroups[group.id] && (
								<div className="pl-6 p-2 space-y-2">
									{group.groupList.map((galleryId) => {
										const gallery = cacheMarkers.find(
											(g) => g.id === galleryId
										);
										if (!gallery) return null;
										return (
											<div
												key={galleryId}
												className="flex items-center gap-2"
											>
												<input
													type="checkbox"
													checked={selectedGalleries.has(
														galleryId
													)}
													onChange={() =>
														toggleGallery(galleryId)
													}
													className="h-4 w-4 border border-gray-300 rounded-sm bg-white checked:bg-green-400 checked:border-green-400 focus:outline-none transition-colors cursor-pointer"
												/>
												<a
													href={`/found-it/?cacheGalleryID=${gallery.id}`}
													className="text-green-600 hover:underline text-sm"
												>
													{gallery.name}
												</a>
											</div>
										);
									})}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default Map;
