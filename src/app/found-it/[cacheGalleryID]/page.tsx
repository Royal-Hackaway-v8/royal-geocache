"use client";

import { useParams, useRouter } from "next/navigation";
import { CacheGallery } from "@/types/";
import { useEffect, useState } from "react";
import { subscribeToCacheGalleries } from "@/services/cacheService";

export default function FoundItPage() {
	// const [coordinates, setCoordinates] = useState<>()

	const [cacheGallery, setCacheGallery] = useState<CacheGallery | null>(null);

	const { cacheGalleryID } = useParams();

	const router = useRouter();

	useEffect(() => {
		const unsubscribe = subscribeToCacheGalleries(
			(galleries: CacheGallery[]) => {
				const markersFromGalleries = galleries.filter(
					(gal) => gal.id === cacheGalleryID
				);
				if (markersFromGalleries.length === 0) {
					return router.push("/map");
				}
				setCacheGallery(markersFromGalleries[0]);
			}
		);
		return () => unsubscribe();
	}, []);

	if (cacheGallery === null) {
		return <></>;
	}
	return <>{cacheGallery.name}</>;
}
