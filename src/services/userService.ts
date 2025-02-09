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

export const subscribeToAllUsers = (
	callback: (users: { [uid: string]: AppUser }) => void
) => {
	const usersRef = ref(DB, "users");
	return onValue(
		usersRef,
		(snapshot) => {
			if (!snapshot.exists()) {
				console.log("No users found in database");
				callback({});
				return;
			}

			const data = snapshot.val();
			console.log("Raw users data from Firebase:", data);

			// Ensure we get an object of users
			if (typeof data === "object" && data !== null) {
				// Filter out any non-user data and ensure each user has required fields
				const validUsers = Object.entries(data).reduce(
					(acc, [uid, userData]) => {
						if (
							userData &&
							typeof userData === "object" &&
							"uid" in userData
						) {
							// Ensure cachesCollected is always an array
							const user = {
								...(userData as AppUser),
								cachesCollected: Array.isArray(
									(userData as AppUser).cachesCollected
								)
									? (userData as AppUser).cachesCollected
									: [],
							};
							acc[uid] = user;
						}
						return acc;
					},
					{} as { [uid: string]: AppUser }
				);

				console.log("Processed users data:", validUsers);
				callback(validUsers);
			} else {
				console.log("Invalid users data structure:", data);
				callback({});
			}
		},
		(error) => {
			console.error("Error subscribing to users:", error);
			callback({});
		}
	);
};
