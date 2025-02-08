type Nullable<T> = T | null;

// Firebase Auth User
export interface AuthUser {
	uid: string;
	displayName: Nullable<string>;
	email: Nullable<string>;
	photoURL: Nullable<string>;
}
