"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { CacheGallery } from "@/types";
import { useEffect, useState } from "react";
import {
	subscribeToCacheGalleries,
	addCacheToGallery,
} from "@/services/cacheService";
import PageView from "@/components/ui/PageView";
import { getDistance } from "@/lib/distance";

const CACHING_THRESHOLD = 0.5; // Define your caching threshold distance here

export default function FoundItPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const cacheGalleryID = searchParams.get("cacheGalleryID");

	// User location & distance state
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

	// Calculate distance using the defined threshold
	useEffect(() => {
		if (!userLocation || !cacheGallery) return;
		const distanceTo = getDistance(userLocation, {
			lat: cacheGallery.lat,
			lon: cacheGallery.lng,
		});
		setIsWithinDistance(distanceTo < CACHING_THRESHOLD);
	}, [userLocation, cacheGallery]);

	// States for the Add Cache form
	const [newCacheData, setNewCacheData] = useState({
		image: "",
		audio: "",
		gifUrl: "",
	});
	const [adding, setAdding] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");

	const handleAddCache = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!cacheGallery) return;
		setAdding(true);
		setErrorMsg("");
		try {
			await addCacheToGallery(cacheGallery.id, {
				updatedAt: Date.now(),
				updatedByUid: "anonymous", // TODO: Replace with actual user ID if available
				image: newCacheData.image ? newCacheData.image : undefined,
				audio: newCacheData.audio ? newCacheData.audio : undefined,
				gifUrl: newCacheData.gifUrl ? newCacheData.gifUrl : undefined,
			});
			setNewCacheData({ image: "", audio: "", gifUrl: "" });
		} catch (err) {
			console.error("Error adding cache:", err);
			setErrorMsg("Failed to add cache. Please try again.");
		}
		setAdding(false);
	};

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

					{/* Add Cache Form (always rendered) */}
					<div className="mb-6 border p-4 rounded-xl bg-gray-100">
						<h2 className="text-xl font-bold mb-2">
							Add a New Cache
						</h2>
						{!isWithinDistance && (
							<p className="text-red-500 mb-2">
								You must be within {CACHING_THRESHOLD} km to add
								a cache.
							</p>
						)}
						{errorMsg && (
							<p className="text-red-500 mb-2">{errorMsg}</p>
						)}
						<form
							onSubmit={handleAddCache}
							className="flex flex-col gap-2"
						>
							<input
								type="text"
								placeholder="Image URL"
								className="p-2 border rounded"
								value={newCacheData.image}
								onChange={(e) =>
									setNewCacheData({
										...newCacheData,
										image: e.target.value,
									})
								}
								disabled={!isWithinDistance}
							/>
							<input
								type="text"
								placeholder="Audio URL"
								className="p-2 border rounded"
								value={newCacheData.audio}
								onChange={(e) =>
									setNewCacheData({
										...newCacheData,
										audio: e.target.value,
									})
								}
								disabled={!isWithinDistance}
							/>
							<input
								type="text"
								placeholder="GIF URL"
								className="p-2 border rounded"
								value={newCacheData.gifUrl}
								onChange={(e) =>
									setNewCacheData({
										...newCacheData,
										gifUrl: e.target.value,
									})
								}
								disabled={!isWithinDistance}
							/>
							<button
								type="submit"
								className="bg-green-500 text-white p-2 rounded-full shadow-lg"
								disabled={!isWithinDistance || adding}
							>
								{adding ? "Adding..." : "Add Cache"}
							</button>
						</form>
					</div>

					{/* Full Cache List */}
					<div>
						<h2 className="text-xl font-bold mb-2">Caches</h2>
						<div className="grid grid-cols-1 gap-4">
							{cacheGallery.cacheList.map((cache, index) => (
								<div
									key={index}
									className="bg-white rounded-xl shadow p-4"
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
										{new Date(
											cache.updatedAt
										).toLocaleString()}
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
												Your browser does not support
												the audio element.
											</audio>
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</PageView>
	);
}
