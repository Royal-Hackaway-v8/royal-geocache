type Nullable<T> = T | null;

// Firebase Auth User
export interface AuthUser {
	uid: string;
	displayName: Nullable<string>;
	email: Nullable<string>;
	photoURL: Nullable<string>;
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
