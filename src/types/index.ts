type Nullable<T> = T | null;

// Firebase Auth User
export interface AuthUser {
	uid: string;
	displayName: Nullable<string>;
	email: Nullable<string>;
	photoURL: Nullable<string>;
}

// Extended user interface for your app-specific data
export interface AppUser extends AuthUser {
	createdAt: number;
	updatedAt?: number; // optional update timestamp
	// Add any additional fields your app might need, e.g.:
	// score?: number;
	// preferences?: Record<string, any>;
}

// Geocache item type
export interface Cache {
	id: string;
	name: string;
	description: string;
	lat: number;
	lng: number;
	createdAt: number;
	image?: string; // Base64 encoded image blob
	audio?: string; // Base64 encoded audio blob
}
