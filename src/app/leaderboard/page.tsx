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
				<div className="container mx-2 p-4 bg-white rounded-xl shadow-lg">
					<p className="text-gray-600 text-center">
						Loading leaderboard data...
					</p>
				</div>
			</PageView>
		);
	}

	return (
		<PageView title="Global Leaderboard">
			<div className="container mx-auto p-4">
				{leaderboard.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="min-w-full bg-white shadow-lg rounded-xl overflow-hidden">
							<thead>
								<tr className="bg-gradient-to-br from-green-400 to-green-600 text-white">
									<th className="py-3 px-4 text-left">
										Rank
									</th>
									<th className="py-3 px-4 text-left">
										Name
									</th>
									<th className="py-3 px-4 text-left">
										Galleries Visited
									</th>
									<th className="py-3 px-4 text-left">
										Caches Made
									</th>
								</tr>
							</thead>
							<tbody>
								{leaderboard.map((entry, index) => {
									// Rank styling
									const rankColors = [
										"text-yellow-500 font-bold", // Gold for 1st place
										"text-gray-500 font-bold", // Silver for 2nd place
										"text-orange-500 font-bold", // Bronze for 3rd place
									];

									return (
										<tr
											key={entry.uid}
											className={`border-b transition duration-200 ease-in-out ${
												index % 2 === 0
													? "bg-gray-50"
													: "bg-white"
											} hover:bg-gray-100`}
										>
											<td
												className={`py-3 px-4 ${
													rankColors[index] ||
													"text-gray-700"
												}`}
											>
												{index + 1}
											</td>
											<td className="py-3 px-4 text-gray-900">
												{entry.displayName}
											</td>
											<td className="py-3 px-4 text-gray-700">
												{entry.galleriesVisited}
											</td>
											<td className="py-3 px-4 text-gray-700">
												{entry.cachesLeft}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				) : (
					<p className="text-gray-600 text-center mt-4">
						No leaderboard data available.
					</p>
				)}
			</div>
		</PageView>
	);
}
