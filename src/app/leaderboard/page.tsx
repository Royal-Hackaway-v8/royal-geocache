"use client";

import { useEffect, useState } from "react";
import PageView from "@/components/ui/PageView";
import { AppUser, CacheGallery } from "@/types";
import { subscribeToAllUsers } from "@/services/userService";
import { subscribeToCacheGalleries } from "@/services/cacheService";

interface LeaderboardEntry {
	uid: string;
	displayName: string;
	galleriesVisited: number;
	cachesLeft: number;
}

export default function GlobalLeaderboardPage() {
	const [users, setUsers] = useState<{ [uid: string]: AppUser }>({});
	const [galleries, setGalleries] = useState<CacheGallery[]>([]);
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

	// Subscribe to all users using our service helper
	useEffect(() => {
		const unsubscribe = subscribeToAllUsers((data) => {
			console.log("Users data:", data);
			if (data && Object.keys(data).length > 0) {
				setUsers(data);
			}
		});
		return () => unsubscribe();
	}, []);

	// Subscribe to all cache galleries using cacheService
	useEffect(() => {
		const unsubscribe = subscribeToCacheGalleries((galleriesData) => {
			console.log("Galleries data:", galleriesData);
			if (galleriesData && galleriesData.length > 0) {
				// Ensure each gallery has a cacheList as an array:
				const galleriesArr = galleriesData.map((gallery) => {
					const cacheList = Array.isArray(gallery.cacheList)
						? gallery.cacheList
						: Object.values(gallery.cacheList || {});
					return { ...gallery, cacheList } as CacheGallery;
				});
				setGalleries(galleriesArr);
			}
		});
		return () => unsubscribe();
	}, []);

	// Compute the global leaderboard
	useEffect(() => {
		console.log("Number of users:", Object.keys(users).length);
		console.log("Number of galleries:", galleries.length);

		if (Object.keys(users).length === 0 || galleries.length === 0) {
			console.log("No users or galleries data available yet");
			return;
		}

		const entries: LeaderboardEntry[] = Object.entries(users).map(
			([uid, userData]) => {
				// Safely handle potentially missing cachesCollected array
				const galleriesVisited = (userData.cachesCollected || [])
					.length;

				// Count caches left by this user
				let cachesLeft = 0;
				galleries.forEach((gallery) => {
					if (Array.isArray(gallery.cacheList)) {
						cachesLeft += gallery.cacheList.filter(
							(cache) => cache && cache.updatedByUid === uid
						).length;
					}
				});

				return {
					uid,
					displayName:
						userData.displayName || `User ${uid.slice(0, 6)}`,
					galleriesVisited,
					cachesLeft,
				};
			}
		);

		console.log("Computed leaderboard entries:", entries);

		// Only update if we have entries
		if (entries.length > 0) {
			// Sort by cachesLeft descending
			entries.sort((a, b) => b.cachesLeft - a.cachesLeft);
			setLeaderboard(entries);
		}
	}, [users, galleries]);

	// Show loading state if no data
	if (Object.keys(users).length === 0 || galleries.length === 0) {
		return (
			<PageView title="Global Leaderboard">
				<div className="container mx-auto p-4">
					<h1 className="text-3xl font-bold mb-4">
						Global Leaderboard
					</h1>
					<p className="text-gray-600">Loading leaderboard data...</p>
				</div>
			</PageView>
		);
	}

	return (
		<PageView title="Global Leaderboard">
			<div className="container mx-auto p-4">
				<h1 className="text-3xl font-bold mb-4">Global Leaderboard</h1>
				{leaderboard.length > 0 ? (
					<table className="min-w-full bg-white border border-gray-200">
						<thead>
							<tr>
								<th className="py-2 px-4 border-b">Rank</th>
								<th className="py-2 px-4 border-b">Name</th>
								<th className="py-2 px-4 border-b">
									Galleries Visited
								</th>
								<th className="py-2 px-4 border-b">
									Caches Left
								</th>
							</tr>
						</thead>
						<tbody>
							{leaderboard.map((entry, index) => (
								<tr key={entry.uid} className="text-center">
									<td className="py-2 px-4 border-b">
										{index + 1}
									</td>
									<td className="py-2 px-4 border-b">
										{entry.displayName}
									</td>
									<td className="py-2 px-4 border-b">
										{entry.galleriesVisited}
									</td>
									<td className="py-2 px-4 border-b">
										{entry.cachesLeft}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				) : (
					<p className="text-gray-600">
						No leaderboard data available.
					</p>
				)}
			</div>
		</PageView>
	);
}
