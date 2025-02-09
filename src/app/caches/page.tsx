"use client";

import { MarkerLocation } from "@/components/ui/Map";
import PageView from "@/components/ui/PageView";
import { subscribeToCacheGalleries } from "@/services/cacheService";
import { useEffect, useState } from "react";
import { Cache } from "@/types";
import ARCapsule from "@/components/ar/ARCapsule";

export default function CachePage() {
	// Initialize state as an array of MarkerLocation objects
	const [cacheMarkers, setCacheMarkers] = useState<MarkerLocation[]>([]);

	useEffect(() => {
		const unsubscribe = subscribeToCacheGalleries((galleries) => {
			const markers = galleries.map((gallery) => ({
				id: gallery.id,
				name: gallery.name,
				description: gallery.description,
				position: [gallery.lat, gallery.lng] as [number, number],
			}));
			setCacheMarkers(markers);
		});
		return () => unsubscribe();
	}, []);

	return (
		<PageView title="Caches">
			<div>
				<ARCapsule />
			</div>

			{/* Render the list of caches */}
			{cacheMarkers.length ? (
				cacheMarkers.map((marker) => (
					<div
						key={marker.id}
						style={{
							marginBottom: "1rem",
							padding: "1rem",
							border: "1px solid #ccc",
							borderRadius: "4px",
						}}
					>
						<h2>{marker.name}</h2>
						<p>{marker.description}</p>
						<p>
							<strong>Location:</strong> {marker.position[0]},{" "}
							{marker.position[1]}
						</p>
					</div>
				))
			) : (
				<p>No caches available.</p>
			)}
		</PageView>
	);
}
