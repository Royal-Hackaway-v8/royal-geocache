"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH } from "../config/firebase";
import {
	onAuthStateChanged,
	User as FirebaseUser,
	signOut,
} from "firebase/auth";
import { AuthUser } from "../types/index";

interface AuthContextType {
	// User is null when not logged in
	user: AuthUser | null;
	loading: boolean;
	signOutUser: () => Promise<void>;
	handleSignOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	loading: true,
	signOutUser: async () => {},
	handleSignOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const router = useRouter();
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(
			AUTH,
			(firebaseUser: FirebaseUser | null) => {
				if (firebaseUser) {
					const authUser: AuthUser = {
						uid: firebaseUser.uid,
						displayName: firebaseUser.displayName,
						email: firebaseUser.email,
						photoURL: firebaseUser.photoURL,
					};
					setUser(authUser);
				} else {
					setUser(null);
				}
				setLoading(false);
			}
		);

		return () => unsubscribe();
	}, []);

	const signOutUser = async () => {
		await signOut(AUTH);
	};

	const handleSignOut = async () => {
		try {
			await signOutUser();
			router.push("/login");
		} catch (error) {
			console.error("Sign-out error:", error);
		}
	};

	return (
		<AuthContext.Provider
			value={{ user, loading, signOutUser, handleSignOut }}
		>
			{children}
		</AuthContext.Provider>
	);
};
