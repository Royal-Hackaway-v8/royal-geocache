"use client";

import React, { useEffect, useState } from "react";
import PageView from "@/components/ui/PageView";
import { useAuth } from "@/context/AuthContext";
import { subscribeToUser } from "@/services/userService";
import {
	subscribeToCacheGalleries,
	addCacheToGallery,
} from "@/services/cacheService";
import { AppUser, CacheGallery } from "@/types";

export default function ProfilePage() {
	const { user, loading, handleSignOut } = useAuth();
	const [userData, setUserData] = useState<AppUser | null>(null);
	const [visitedCacheGalleries, setVisitedCacheGalleries] = useState<
		CacheGallery[]
	>([]);
	// const [galleries, setGalleries] = useState<CacheGallery[]>([]);

	useEffect(() => {
		if (userData === null) return;
		const unsubscribe = subscribeToCacheGalleries(
			(galleries: CacheGallery[]) => {
				setVisitedCacheGalleries(
					galleries.filter(
						(gal) => gal.id in userData.cachesCollected
					)
				);
			}
		);
		return () => unsubscribe();
	}, [userData]);

	useEffect(() => {
		console.log(visitedCacheGalleries);
	}, [visitedCacheGalleries]);

	useEffect(() => {
		if (user) {
			const unsubscribe = subscribeToUser(user.uid, (data) =>
				setUserData(data)
			);
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
			<div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden transform transition duration-200 hover:-translate-y-1">
				{/* Profile Header */}
				<div className="bg-gradient-to-br from-green-200 to-green-500 p-6 text-center text-white">
					<img
						src={user.photoURL || "/default-avatar.png"}
						alt="User Avatar"
						className="w-24 h-24 rounded-full shadow-lg border-4 border-white mx-auto mb-4 object-cover"
					/>
					<h2 className="text-xl font-semibold">
						{user.displayName || "Anonymous"}
					</h2>
					<p className="text-sm">{user.email}</p>
					<div>
						<div>Visited Caches</div>
						{visitedCacheGalleries.map((cg) => {
							return <div>{cg.name}</div>;
						})}
					</div>
				</div>

				{/* Profile Body */}
				<div className="p-6 text-gray-800">
					<p className="mb-2">
						<span className="font-semibold">UID:</span> {user.uid}
					</p>
					{userData && userData.createdAt && (
						<p className="mb-2">
							<span className="font-semibold">Member Since:</span>{" "}
							{new Date(userData.createdAt).toLocaleDateString()}
						</p>
					)}
				</div>

				{/* Profile Footer */}
				<div className="flex p-6 pt-0 text-center gap-2 justify-center">
					<button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300">
						Edit Profile
					</button>
					{user && (
						<button
							type="button"
							onClick={handleSignOut}
							className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full shadow-lg"
						>
							Sign Out
						</button>
					)}
				</div>
			</div>
		</PageView>
	);
}
