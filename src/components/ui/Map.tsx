"use client";

import React, { useEffect, useRef, useState } from "react";
import Leaflet, { LatLngLiteral } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
	subscribeToCacheGalleries,
	subscribeToCacheGroups,
	deleteCacheGallery,
	deleteCacheGroup,
} from "@/services/cacheService";
import { CacheGallery, CacheGroup } from "@/types";
import { getDistance } from "@/lib/distance";
import { WITHIN_RANGE_RADIUS } from "@/lib/constants";
import PageView from "./PageView";

const Map: React.FC = () => {
	// Map refs
	const mapRef = useRef<Leaflet.Map | null>(null);
	const markersLayerRef = useRef<Leaflet.LayerGroup | null>(null);
	const userLocationLayerRef = useRef<Leaflet.LayerGroup | null>(null);

	// States for galleries and groups
	const [cacheMarkers, setCacheMarkers] = useState<CacheGallery[]>([]);
	const [selectedGalleries, setSelectedGalleries] = useState<Set<string>>(
		new Set()
	);
	const [cacheGroups, setCacheGroups] = useState<CacheGroup[]>([]);
	const [expandedGroups, setExpandedGroups] = useState<{
		[groupId: string]: boolean;
	}>({});

	// User location state
	const [userLocation, setUserLocation] =
		useState<Leaflet.LatLngExpression | null>(null);

	// Subscribe to cache groups (using a single state)
	useEffect(() => {
		const unsubscribe = subscribeToCacheGroups(setCacheGroups);
		return () => unsubscribe();
	}, []);

	// Subscribe to cache galleries and initialize selected galleries
	useEffect(() => {
		const unsubscribe = subscribeToCacheGalleries(
			(galleries: CacheGallery[]) => {
				setCacheMarkers(galleries);
				if (galleries.length && selectedGalleries.size === 0) {
					setSelectedGalleries(
						new Set(galleries.map((gallery) => gallery.id))
					);
				}
			}
		);
		return () => unsubscribe();
	}, [selectedGalleries]);

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

	// Initialize Leaflet map on first render
	const initialCenter: [number, number] = [51.42595, -0.56521];
	const zoom = 16;
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
		markersLayerRef.current = Leaflet.layerGroup().addTo(mapRef.current);
		userLocationLayerRef.current = Leaflet.layerGroup().addTo(
			mapRef.current
		);
	}, [initialCenter, zoom]);

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
		const customIcon = Leaflet.icon({
			iconUrl,
			iconSize: [30, 30],
			iconAnchor: [15, 30],
		});
		Leaflet.marker(userLocation, { icon: customIcon }).addTo(
			userLocationLayerRef.current
		);
	}, [userLocation]);

	// Group toggling functions
	const toggleExpand = (groupId: string) => {
		setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
	};

	const toggleGroupCheckbox = (group: CacheGroup) => {
		const allSelected = group.groupList.every((id) =>
			selectedGalleries.has(id)
		);
		setSelectedGalleries((prev) => {
			const newSelected = new Set(prev);
			group.groupList.forEach((id) => {
				allSelected ? newSelected.delete(id) : newSelected.add(id);
			});
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

	// Debug log (feel free to remove this later)
	console.log("Cache Groups:", cacheGroups);

	// Render the sidebar for cache groups
	const renderSidebar = () => (
		<div className="w-80 mx-5 p-5 bg-white flex flex-col rounded-xl shadow-md">
			<h2 className="text-lg font-semibold mb-4">Cache Groups</h2>
			{cacheGroups.length === 0 ? (
				<p>No cache groups available</p>
			) : (
				cacheGroups.map((group) => {
					const allSelected = group.groupList.every((id) =>
						selectedGalleries.has(id)
					);
					return (
						<div key={group.id} className="border rounded mb-3">
							<div
								className="flex items-center justify-between p-2 bg-gray-100 cursor-pointer"
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
										className="form-checkbox h-4 w-4"
									/>
									<span className="font-bold">
										{group.name}
									</span>
								</div>
								<div className="text-xl">
									{expandedGroups[group.id] ? "−" : "+"}
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
													className="form-checkbox h-4 w-4"
												/>
												<a
													href={`/found-it/?cacheGalleryID=${gallery.id}`}
													className="text-blue-600 hover:underline text-sm"
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
				})
			)}
		</div>
	);

	return (
		<PageView title="Manage Galleries & Groups">
			<div className="flex w-full">
				{/* Map Container */}
				<div className="overflow-hidden rounded-xl shadow-lg w-full ml-5">
					<div id="map" className="h-96 w-full" />
				</div>
				{/* Sidebar */}
				{renderSidebar()}
			</div>
		</PageView>
	);
};

export default Map;
