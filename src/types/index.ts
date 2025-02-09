type Nullable<T> = T | null;

// Firebase Auth User
export interface AuthUser {
	uid: string;
	displayName: Nullable<string>;
	email: Nullable<string>;
	photoURL: Nullable<string>;
}

export type CacheGalleryID = string;

// Extended user interface for your app-specific data
export interface AppUser extends AuthUser {
	createdAt: number;
	updatedAt?: number; // optional update timestamp
	// Add any additional fields your app might need, e.g.:
	// score?: number;
	// preferences?: Record<string, any>;
	cachesCollected: CacheGalleryID[];
}

// Geocache item type
export interface Cache {
	updatedAt: number; // Timestamp of the last update
	updatedByUid: string; // UID of the user who last updated the cache
	image?: string; // Base64 encoded image blob
	audio?: string; // Base64 encoded audio blob
	gifUrl?: string; // URL to a GIF
}

// Single cache location containg multiple caches
export interface CacheGallery {
	id: CacheGalleryID;
	cacheList: Cache[];

	// Initialization
	lat: number;
	lng: number;
	createdAt: number;
	createdByUid: string;
	name: string;
	description: string;
	expiryDate: number;
	featured: boolean;
}

export interface CacheGroup {
	id: string;
	groupList: CacheGalleryID[];
	name: string;
	description: string;
}
