"use client";

import React, { useEffect, useRef, useState } from "react";
import Leaflet, { LatLngLiteral } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
	subscribeToCacheGalleries,
	subscribeToCacheGroups,
} from "@/services/cacheService";
import { CacheGallery, CacheGroup } from "@/types";
import { getDistance } from "@/lib/distance";
import { WITHIN_RANGE_RADIUS } from "@/lib/constants";

import dynamic from "next/dynamic";

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

const Map: React.FC<MapProps> = ({
	initialCenter = [51.42595, -0.56521],
	zoom = 16,
}) => {
	// Refs for Leaflet map and layers
	const mapRef = useRef<Leaflet.Map | null>(null);
	const markersLayerRef = useRef<Leaflet.LayerGroup | null>(null);
	const userLocationLayerRef = useRef<Leaflet.LayerGroup | null>(null);

	const [markerWithDistance, setMarkerWithDistance] = useState<
		MarkerLocationToPlayer[]
	>([]);
	const [userLocation, setUserLocation] =
		useState<Leaflet.LatLngExpression | null>(null);
	const [cacheMarkers, setCacheMarkers] = useState<MarkerLocation[]>([]);

	// Sidebar state: global selection of galleries and group expansion
	const [selectedGalleries, setSelectedGalleries] = useState<Set<string>>(
		new Set()
	);
	const [expandedGroups, setExpandedGroups] = useState<{
		[groupId: string]: boolean;
	}>({});

	// Example cache groups; these can come from RTDB as needed
	const [cacheGroups, setCacheGroups] = useState<CacheGroup[]>([]);

	// Leaflet client
	const [LEAFLET_CLIENT, set_LEAFLET_CLIENT] = useState<any>(null);

	useEffect(() => {
		// Ensure leaflet is only loaded on the client side
		import("leaflet").then((L) => set_LEAFLET_CLIENT(L));
	}, []);

	// Subscribe to cache galleries from RTDB and set cache markers
	useEffect(() => {
		const unsubscribe = subscribeToCacheGroups((groups: CacheGroup[]) => {
			setCacheGroups(groups);
		});
		return () => unsubscribe();
	}, []);

	// Watch user location
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

	// Subscribe to cache galleries from RTDB and set cache markers
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

	// Initialize selectedGalleries once cacheMarkers load (all markers selected by default)
	useEffect(() => {
		if (cacheMarkers.length > 0 && selectedGalleries.size === 0) {
			setSelectedGalleries(
				new Set(cacheMarkers.map((marker) => marker.id))
			);
		}
	}, [cacheMarkers, selectedGalleries]);

	// Compute distances from user location to each marker
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

	// Initialize Leaflet map on first render
	useEffect(() => {
		if (!LEAFLET_CLIENT) return;

		if (mapRef.current) return;

		mapRef.current = LEAFLET_CLIENT.map("map", {
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
		LEAFLET_CLIENT.tileLayer(
			"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
			{
				maxZoom: 19,
				attribution: "© OpenStreetMap contributors",
			}
		).addTo(mapRef.current);
		markersLayerRef.current = LEAFLET_CLIENT.layerGroup().addTo(
			mapRef.current
		);
		userLocationLayerRef.current = LEAFLET_CLIENT.layerGroup().addTo(
			mapRef.current
		);
	}, [initialCenter, zoom, LEAFLET_CLIENT]);

	// Update user location marker on the map
	useEffect(() => {
		if (!userLocation || !mapRef.current || !userLocationLayerRef.current)
			return;
		userLocationLayerRef.current.clearLayers();
		const iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="blue" width="30" height="30">
        <path d="M172.268 501.67C47.961 332.033 0 275.195 0 208c0-79.5 64.5-144 144-144s144 64.5 144 144c0 67.195-47.961 124.03-172.268 293.67a24.005 24.005 0 0 1-39.464 0zM144 208a28 28 0 1 0 56 0 28 28 0 1 0-56 0z"></path>
      </svg>
    `;
		const iconUrl = "data:image/svg+xml;base64," + btoa(iconSvg);
		const customIcon = LEAFLET_CLIENT.icon({
			iconUrl,
			iconSize: [30, 30],
			iconAnchor: [15, 30],
		});
		LEAFLET_CLIENT.marker(userLocation, { icon: customIcon }).addTo(
			userLocationLayerRef.current
		);
	}, [userLocation]);

	// Update map markers based on distance and selection state
	useEffect(() => {
		if (
			!mapRef.current ||
			!markersLayerRef.current ||
			!markerWithDistance ||
			!LEAFLET_CLIENT
		)
			return;
		markersLayerRef.current.clearLayers();
		markerWithDistance.forEach((marker) => {
			// Compute dynamic color based on distance
			const scalar =
				(1 / Math.pow(WITHIN_RANGE_RADIUS, 1 / 3)) *
				Math.pow(marker.distanceToPlayer, 1 / 3);
			const RED = (scalar > 1 ? 1 : scalar) * 255;
			const GREEN = (1 - (scalar > 1 ? 1 : scalar)) * 255;
			const computedColor = `rgb(${RED}, ${GREEN}, 80)`;

			// Use computed color if selected, else gray
			const iconColour = selectedGalleries.has(marker.id)
				? computedColor
				: "gray";

			const iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="${iconColour}" width="30" height="30">
          <path d="M172.268 501.67C47.961 332.033 0 275.195 0 208c0-79.5 64.5-144 144-144s144 64.5 144 144c0 67.195-47.961 124.03-172.268 293.67a24.005 24.005 0 0 1-39.464 0zM144 208a28 28 0 1 0 56 0 28 28 0 1 0-56 0z"></path>
        </svg>
      `;
			const iconUrl = "data:image/svg+xml;base64," + btoa(iconSvg);
			const customIcon = LEAFLET_CLIENT.icon({
				iconUrl,
				iconSize: [30, 30],
				iconAnchor: [15, 30],
			});
			const popupContent = `
  <div>
    <h3 class="font-bold">${marker.name} (${
				marker.distanceToPlayer < 1
					? `${Math.ceil(marker.distanceToPlayer * 1000)}m`
					: `${marker.distanceToPlayer.toFixed(2)}km`
			})</h3>
          ${marker.description ? `<p>${marker.description}</p>` : ""}
          <a href="/found-it/?cacheGalleryID=${
				marker.id
			}" class="inline-block bg-indigo-100 hover:bg-indigo-200 text-white px-3 py-1 w-full text-center rounded-full shadow-md mt-2">
            View Details
          </a>
        </div>
      `;
			LEAFLET_CLIENT.marker(marker.position, { icon: customIcon })
				.addTo(markersLayerRef.current!)
				.bindPopup(popupContent);
		});
	}, [markerWithDistance, selectedGalleries, LEAFLET_CLIENT]);

	// Toggle expansion/collapse of a cache group
	const toggleExpand = (groupId: string) => {
		setExpandedGroups((prev) => ({
			...prev,
			[groupId]: !prev[groupId],
		}));
	};

	// Toggle a group's checkbox to select/deselect all galleries in the group
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

	// Toggle individual gallery checkbox
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
				<div id="map" className="h-96 w-full" />
			</div>

			{/* Sidebar Container */}
			<div className="w-80 mx-5 p-5 bg-white flex flex-col rounded-xl shadow-md">
				<h2 className="text-lg font-semibold mb-4">Cache Groups</h2>
				{cacheGroups.map((group) => {
					// Determine checkbox status for the group
					const groupGalleryIds = group.groupList;
					const allSelected = groupGalleryIds.every((id) =>
						selectedGalleries.has(id)
					);

					return (
						<div
							key={group.id}
							className="rounded-xl mb-3 shadow-lg overflow-hidden"
						>
							{/* Group Header */}
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

							{/* Collapsible Gallery List */}
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

export default dynamic(() => Promise.resolve(Map), { ssr: false });
