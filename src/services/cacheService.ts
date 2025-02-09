import { ref, onValue, push, set, update, remove } from "firebase/database";
import { DB } from "@/config/firebase";
import { CacheGallery, Cache, CacheGroup } from "@/types";

// Utility function to remove undefined properties
const sanitizeObject = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// ----------------------
// Gallery Functions
// ----------------------

// Subscribe to cache galleries
export const subscribeToCacheGalleries = (
	callback: (galleries: CacheGallery[]) => void
) => {
	const galleriesRef = ref(DB, "cacheGalleries/");
	return onValue(galleriesRef, (snapshot) => {
		const data = snapshot.val();
		if (data) {
			const galleries = Object.entries(data).map(([id, gallery]) => ({
				...(gallery as CacheGallery),
				id, // Assign Firebase key as the id
			}));
			callback(galleries);
		} else {
			callback([]);
		}
	});
};

// Create a new cache gallery (with an initial cache)
// We omit the "id" field because Firebase generates it for us.
export const createCacheGallery = async (
	galleryData: Omit<CacheGallery, "id" | "cacheList"> & {
		initialCache: Omit<Cache, "id">;
	}
) => {
	const newGalleryRef = push(ref(DB, "cacheGalleries/"));
	const { initialCache, ...galleryInfo } = galleryData;

	// Sanitize the initial cache to remove undefined values
	const sanitizedCache = sanitizeObject({
		updatedAt: Date.now(),
		updatedByUid: galleryInfo.createdByUid,
		image: initialCache.image,
		audio: initialCache.audio,
		gifUrl: initialCache.gifUrl,
	});

	const newGallery: Omit<CacheGallery, "id"> = {
		...galleryInfo,
		cacheList: [sanitizedCache],
	};
	await set(newGalleryRef, newGallery);
};

// Update an existing cache gallery (and optionally update the first cache)
export const updateCacheGallery = async (
	id: string,
	galleryData: Partial<Omit<CacheGallery, "id" | "cacheList">> & {
		updatedCache?: Partial<Omit<Cache, "id">>;
	}
) => {
	const galleryRef = ref(DB, `cacheGalleries/${id}`);
	if (galleryData.updatedCache) {
		galleryData.updatedCache.updatedAt = Date.now();
		galleryData.updatedCache = sanitizeObject(galleryData.updatedCache);
	}
	await update(galleryRef, galleryData);
};

// Delete a cache gallery
export const deleteCacheGallery = async (id: string) => {
	const galleryRef = ref(DB, `cacheGalleries/${id}`);
	await remove(galleryRef);
};

// Add a new cache to an existing gallery
export const addCacheToGallery = async (
	galleryId: string,
	newCache: Omit<Cache, "id">
) => {
	const cacheListRef = ref(DB, `cacheGalleries/${galleryId}/cacheList`);
	const sanitizedCache = sanitizeObject(newCache);
	const newCacheRef = push(cacheListRef);
	await set(newCacheRef, sanitizedCache);
};

// ----------------------
// Group Functions
// ----------------------

// Subscribe to cache groups
export const subscribeToCacheGroups = (
	callback: (groups: CacheGroup[]) => void
) => {
	const groupsRef = ref(DB, "cacheGroups/");
	return onValue(groupsRef, (snapshot) => {
		const data = snapshot.val();
		if (data) {
			const groups = Object.entries(data).map(([id, group]) => ({
				...(group as CacheGroup),
				id,
			}));
			callback(groups);
		} else {
			callback([]);
		}
	});
};

// Create a new cache group
export const createCacheGroup = async (groupData: Omit<CacheGroup, "id">) => {
	const newGroupRef = push(ref(DB, "cacheGroups/"));
	await set(newGroupRef, groupData);
};

// Update an existing cache group
export const updateCacheGroup = async (
	id: string,
	groupData: Partial<Omit<CacheGroup, "id">>
) => {
	const groupRef = ref(DB, `cacheGroups/${id}`);
	await update(groupRef, groupData);
};

// Delete a cache group
export const deleteCacheGroup = async (id: string) => {
	const groupRef = ref(DB, `cacheGroups/${id}`);
	await remove(groupRef);
};
