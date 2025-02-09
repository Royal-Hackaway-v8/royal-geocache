"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { CacheGallery } from "@/types";
import { useEffect, useState } from "react";
import { subscribeToCacheGalleries } from "@/services/cacheService";
import PageView from "@/components/ui/PageView";
import { getDistance } from "@/lib/distance";

export default function FoundItPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const cacheGalleryID = searchParams.get("cacheGalleryID");

	// THOMAS: User location & distance state
	const [userLocation, setUserLocation] = useState<{
		lon: number;
		lat: number;
	} | null>(null);
	const [isWithinDistance, setIsWithinDistance] = useState<boolean>(false);

	useEffect(() => {
		const watchId = navigator.geolocation.watchPosition(
			(position) => {
				setUserLocation({
					lat: position.coords.latitude,
					lon: position.coords.longitude,
				});
			},
			(error) => console.error("Error watching position:", error),
			{ enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
		);
		return () => navigator.geolocation.clearWatch(watchId);
	}, []);

	// Gallery state
	const [cacheGallery, setCacheGallery] = useState<CacheGallery | null>(null);

	useEffect(() => {
		if (!cacheGalleryID) {
			router.push("/map");
			return;
		}
		const unsubscribe = subscribeToCacheGalleries(
			(galleries: CacheGallery[]) => {
				const foundGallery = galleries.find(
					(gal) => gal.id === cacheGalleryID
				);
				if (!foundGallery) {
					router.push("/map");
				} else {
					setCacheGallery(foundGallery);
				}
			}
		);
		return () => unsubscribe();
	}, [cacheGalleryID, router]);

	// Calculate distance (hook always called)
	useEffect(() => {
		if (!userLocation || !cacheGallery) return;
		const distanceTo = getDistance(userLocation, {
			lat: cacheGallery.lat,
			lon: cacheGallery.lng,
		});
		setIsWithinDistance(distanceTo < 0.5);
	}, [userLocation, cacheGallery]);

	// Conditional rendering inside JSX (no early return that skips hooks)
	return (
		<PageView
			title={cacheGallery ? `Found it: ${cacheGallery.name}` : "Found it"}
		>
			{!cacheGallery ? (
				<p>Loading...</p>
			) : (
				<div className="container mx-auto p-4">
					{/* Gallery Header */}
					<div className="mb-6">
						<h1 className="text-2xl font-bold mb-2">
							{cacheGallery.name}
						</h1>
						<p className="text-gray-700">
							{cacheGallery.description}
						</p>
						<div className="mt-2">
							<span className="font-semibold">Location:</span> (
							{cacheGallery.lat}, {cacheGallery.lng})
						</div>
						<div className="mt-1">
							<span className="font-semibold">Expires on:</span>{" "}
							{new Date(
								cacheGallery.expiryDate
							).toLocaleDateString()}
						</div>
						<div className="mt-1">
							<span className="font-semibold">In distance:</span>{" "}
							{isWithinDistance ? "Yes" : "No"}
						</div>
					</div>

					{/* Cache List */}
					<div className="grid grid-cols-1 gap-4">
						{cacheGallery.cacheList.map((cache, index) => (
							<div
								key={index}
								className="bg-white rounded-lg shadow p-4"
							>
								<div className="mb-2">
									<span className="font-semibold">
										Updated By:
									</span>{" "}
									{cache.updatedByUid}
								</div>
								<div className="mb-2">
									<span className="font-semibold">
										Updated At:
									</span>{" "}
									{new Date(cache.updatedAt).toLocaleString()}
								</div>
								{cache.image && (
									<div className="mb-2">
										<img
											src={cache.image}
											alt="Cache Image"
											className="w-full h-auto rounded"
										/>
									</div>
								)}
								{cache.gifUrl && (
									<div className="mb-2">
										<img
											src={cache.gifUrl}
											alt="Cache GIF"
											className="w-full h-auto rounded"
										/>
									</div>
								)}
								{cache.audio && (
									<div className="mb-2">
										<audio controls className="w-full">
											<source src={cache.audio} />
											Your browser does not support the
											audio element.
										</audio>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			)}
		</PageView>
	);
}
