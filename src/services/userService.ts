import { ref, update, onValue, get } from "firebase/database";
import { DB } from "@/config/firebase";
import { AppUser, AuthUser } from "@/types";

// Create or update a user's data in the database
export const createOrUpdateUser = async (user: AuthUser) => {
	const userRef = ref(DB, `users/${user.uid}`);
	const timestamp = Date.now();

	// Create the app-specific user object
	const appUser: Partial<AppUser> = {
		...user,
		updatedAt: timestamp,
	};

	// Write the basic auth data along with the update timestamp
	await update(userRef, appUser);

	// If this is a new user (or no createdAt exists), set createdAt timestamp
	const snapshot = await get(userRef);
	if (!snapshot.exists() || !snapshot.val().createdAt) {
		await update(userRef, { createdAt: timestamp });
	}
};

// Subscribe to changes for a specific user
export const subscribeToUser = (
	uid: string,
	callback: (user: AppUser | null) => void
) => {
	const userRef = ref(DB, `users/${uid}`);
	const unsubscribe = onValue(userRef, (snapshot) => {
		const data = snapshot.exists() ? snapshot.val() : null;
		console.log("User data from RTDB:", data);
		callback(data);
	});
	return unsubscribe;
};

// Retrieve user data once
export const getUser = async (uid: string): Promise<AppUser | null> => {
	const userRef = ref(DB, `users/${uid}`);
	const snapshot = await get(userRef);
	return snapshot.exists() ? snapshot.val() : null;
};

// Add a gallery ID to the user's cachesCollected array if not already present
export const addGalleryToUserCachesCollected = async (
	uid: string,
	galleryId: string
) => {
	const userRef = ref(DB, `users/${uid}`);
	const snapshot = await get(userRef);
	const userData = snapshot.exists() ? snapshot.val() : null;
	let updatedCaches: string[] = [];
	if (userData && Array.isArray(userData.cachesCollected)) {
		updatedCaches = userData.cachesCollected;
	}
	if (!updatedCaches.includes(galleryId)) {
		updatedCaches.push(galleryId);
	}
	await update(userRef, { cachesCollected: updatedCaches });
};
