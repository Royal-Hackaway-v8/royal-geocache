"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { CacheGallery } from "@/types";
import { useEffect, useState } from "react";
import { subscribeToCacheGalleries } from "@/services/cacheService";
import PageView from "@/components/ui/PageView";

export default function FoundItPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const cacheGalleryID = searchParams.get("cacheGalleryID");

	const [cacheGallery, setCacheGallery] = useState<CacheGallery | null>(null);

	useEffect(() => {
		if (!cacheGalleryID) {
			// Redirect if no ID is provided in the query
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

	if (!cacheGallery) {
		return (
			<PageView title="Found it">
				<p>Loading...</p>
			</PageView>
		);
	}

	return (
		<PageView title={`Found it: ${cacheGallery.name}`}>
			<div className="container mx-auto p-4">
				{/* Gallery Header */}
				<div className="mb-6">
					<h1 className="text-2xl font-bold mb-2">
						{cacheGallery.name}
					</h1>
					<p className="text-gray-700">{cacheGallery.description}</p>
					<div className="mt-2">
						<span className="font-semibold">Location:</span> (
						{cacheGallery.lat}, {cacheGallery.lng})
					</div>
					<div className="mt-1">
						<span className="font-semibold">Expires on:</span>{" "}
						{new Date(cacheGallery.expiryDate).toLocaleDateString()}
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
										Your browser does not support the audio
										element.
									</audio>
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</PageView>
	);
}
