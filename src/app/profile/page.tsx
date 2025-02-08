"use client";

import React, { useEffect, useState } from "react";
import PageView from "@/components/ui/PageView";
import { useAuth } from "@/context/AuthContext";
import { subscribeToUser } from "@/services/userService";
import { AppUser } from "@/types";

export default function ProfilePage() {
	const { user, loading } = useAuth(); // Ensure loading is provided by your AuthContext
	const [userData, setUserData] = useState<AppUser | null>(null);

	useEffect(() => {
		console.log("ProfilePage - user:", user);
		if (user) {
			const unsubscribe = subscribeToUser(user.uid, (data) => {
				console.log("ProfilePage - received userData:", data);
				setUserData(data);
			});
			return () => unsubscribe();
		}
	}, [user]);

	if (loading) {
		return (
			<PageView title="Profile">
				<p>Loading...</p>
			</PageView>
		);
	}

	if (!user) {
		return (
			<PageView title="Profile">
				<p>You need to be signed in to view your profile.</p>
			</PageView>
		);
	}

	return (
		<PageView title="Your Profile">
			<div className="max-w-md mx-auto bg-white p-6 rounded shadow">
				<p>
					<strong>UID:</strong> {user.uid}
				</p>
				<p>
					<strong>Email:</strong> {user.email}
				</p>
				<p>
					<strong>Display Name:</strong> {user.displayName || "N/A"}
				</p>
				{userData && userData.createdAt && (
					<p>
						<strong>Member Since:</strong>{" "}
						{new Date(userData.createdAt).toLocaleDateString()}
					</p>
				)}
			</div>
		</PageView>
	);
}
