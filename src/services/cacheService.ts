import { ref, onValue, push, set, update, remove } from "firebase/database";
import { DB } from "@/config/firebase";
import { Cache } from "@/types";

// Subscribe to caches and invoke a callback with an array of Cache objects
export const subscribeToCaches = (callback: (caches: Cache[]) => void) => {
	const cachesRef = ref(DB, "caches/");
	const unsubscribe = onValue(cachesRef, (snapshot) => {
		const data = snapshot.val();
		if (data) {
			const caches = Object.entries(data).map(([id, cache]) => ({
				...(cache as Cache),
				id,
			}));
			callback(caches);
		} else {
			callback([]);
		}
	});
	return unsubscribe;
};

// Create a new cache entry
export const createCache = async (cacheData: Omit<Cache, "id">) => {
	const newCacheRef = push(ref(DB, "caches/"));
	await set(newCacheRef, cacheData);
};

// Update an existing cache entry
export const updateCache = async (id: string, cacheData: Partial<Cache>) => {
	const cacheRef = ref(DB, `caches/${id}`);
	await update(cacheRef, cacheData);
};

// Delete a cache entry
export const deleteCache = async (id: string) => {
	const cacheRef = ref(DB, `caches/${id}`);
	await remove(cacheRef);
};
