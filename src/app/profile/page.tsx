"use client";

import React, { useEffect, useState } from "react";
import PageView from "@/components/ui/PageView";
import { useAuth } from "@/context/AuthContext";
import { subscribeToUser } from "@/services/userService";
import { subscribeToCacheGalleries } from "@/services/cacheService";
import { AppUser, CacheGallery } from "@/types";
import { FaShieldAlt } from "react-icons/fa";

export default function ProfilePage() {
	const { user, loading, handleSignOut } = useAuth();
	const [userData, setUserData] = useState<AppUser | null>(null);
	const [visitedCacheGalleries, setVisitedCacheGalleries] = useState<
		CacheGallery[]
	>([]);

	// Subscribe to the logged in user's data
	useEffect(() => {
		if (user) {
			const unsubscribe = subscribeToUser(user.uid, (data) =>
				setUserData(data)
			);
			return () => unsubscribe();
		}
	}, [user]);

	// Once userData is loaded, subscribe to cache galleries and filter those visited by the user.
	useEffect(() => {
		if (!userData) return;
		const userCaches = userData.cachesCollected || [];
		const unsubscribe = subscribeToCacheGalleries(
			(galleries: CacheGallery[]) => {
				setVisitedCacheGalleries(
					galleries.filter((gal) => userCaches.includes(gal.id))
				);
			}
		);
		return () => unsubscribe();
	}, [userData]);

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

	const formatDateWithOrdinal = (date: number) => {
		const d = new Date(date);
		const day = d.getDate();
		const month = d.toLocaleString("en-US", { month: "long" });
		const year = d.getFullYear();

		// Function to get ordinal suffix (st, nd, rd, th)
		const getOrdinalSuffix = (n: number) => {
			if (n > 3 && n < 21) return "th"; // Covers 11th-19th
			switch (n % 10) {
				case 1:
					return "st";
				case 2:
					return "nd";
				case 3:
					return "rd";
				default:
					return "th";
			}
		};

		return `${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
	};
	return (
		<PageView>
			<div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden transform transition duration-200 hover:-translate-y-1">
				{/* Profile Header */}
				<div className="bg-gradient-to-br from-green-200 to-green-500 p-6 text-center text-white">
					<img
						src={user.photoURL || "/default-avatar.png"}
						alt="User Avatar"
						className="w-24 h-24 rounded-full shadow-lg border-4 border-white mx-auto mb-4 object-cover"
					/>
					<h2 className="text-xl font-semibold flex items-center justify-center gap-2">
						{user.displayName || "Anonymous"}
						{userData?.isStaff && (
							<span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
								<FaShieldAlt className="text-xs" /> Staff
							</span>
						)}
					</h2>
					<p className="text-sm">{user.email}</p>
				</div>

				{/* Profile Body */}
				<div className="p-6 text-gray-800">
					{/* <p className="mb-2">
						<span className="font-semibold">UID:</span> {user.uid}
					</p> */}
					{userData && userData.createdAt && (
						<p className="mb-2 mx-auto text-center">
							<span className="font-semibold">Member Since:</span>{" "}
							{formatDateWithOrdinal(userData.createdAt)}
						</p>
					)}
				</div>

				{/* Profile Footer */}
				<div className="flex p-6 pt-0 text-center gap-2 justify-center">
					<button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300">
						Edit Profile
					</button>
					<button
						type="button"
						onClick={handleSignOut}
						className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full shadow-lg"
					>
						Sign Out
					</button>
				</div>
			</div>

			{/* Visited Caches */}
			<div className="mt-8 bg-white max-w-md w-full rounded-2xl shadow-lg p-6">
				<h2 className="text-xl font-bold mb-4">Visited Caches</h2>
				{!userData ? (
					<p>Loading caches...</p>
				) : visitedCacheGalleries.length > 0 ? (
					visitedCacheGalleries.map((cg) => (
						<div key={cg.id} className="mb-2">
							{cg.name}
						</div>
					))
				) : (
					<p>No visited caches found.</p>
				)}
			</div>
		</PageView>
	);
}
