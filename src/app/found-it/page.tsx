"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { CacheGallery, Cache, AppUser } from "@/types";
import { useEffect, useState, useRef } from "react";
import {
	subscribeToCacheGalleries,
	addCacheToGallery,
} from "@/services/cacheService";
import PageView from "@/components/ui/PageView";
import { getDistance } from "@/lib/distance";
import { CACHING_THRESHOLD } from "@/lib/constants";
import { FaInfoCircle } from "react-icons/fa";
import { PiSealWarningFill } from "react-icons/pi";
import { useAuth } from "@/context/AuthContext";
import {
	addGalleryToUserCachesCollected,
	getUser,
	subscribeToUser,
} from "@/services/userService";

const AudioRecorder = ({
	setAudioBlob,
}: {
	setAudioBlob: React.Dispatch<React.SetStateAction<Blob | null>>;
}) => {
	const [isRecording, setIsRecording] = useState(false);
	const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
		null
	);
	const audioChunksRef = useRef<Blob[]>([]);

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
			});
			const recorder = new MediaRecorder(stream);
			audioChunksRef.current = [];
			recorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);
				}
			};
			recorder.onstop = () => {
				const blob = new Blob(audioChunksRef.current, {
					type: "audio/webm",
				});
				setAudioBlob(blob);
			};
			recorder.start();
			setMediaRecorder(recorder);
			setIsRecording(true);
		} catch (err) {
			alert("Unable to access microphone.");
		}
	};

	const stopRecording = () => {
		mediaRecorder?.stop();
		setIsRecording(false);
	};

	return (
		<div className="mb-4">
			<label className="block mb-1">Record Audio</label>
			{!isRecording ? (
				<button
					type="button"
					onClick={startRecording}
					className="w-full bg-green-500 text-white p-2 rounded-full shadow-md"
				>
					Start Recording
				</button>
			) : (
				<button
					type="button"
					onClick={stopRecording}
					className="w-full bg-red-500 text-white p-2 rounded-full shadow-md"
				>
					Stop Recording
				</button>
			)}
		</div>
	);
};

const ImageUploader = ({
	setImageBlob,
}: {
	setImageBlob: React.Dispatch<React.SetStateAction<Blob | null>>;
}) => {
	const [preview, setPreview] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (!file.type.startsWith("image/")) {
				setError("Please upload a valid image file.");
				return;
			}
			if (file.size > 5 * 1024 * 1024) {
				setError("File size should not exceed 5MB.");
				return;
			}
			setImageBlob(file);
			setFileName(file.name);
			setPreview(URL.createObjectURL(file));
			setError(null);
		}
	};

	const handleRemoveImage = () => {
		setImageBlob(null);
		setPreview(null);
		setFileName(null);
		setError(null);
	};

	return (
		<div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
			{preview ? (
				<div className="relative w-full">
					<img
						src={preview}
						alt="Preview"
						className="w-full h-48 object-cover rounded-lg shadow-md"
					/>
					<p className="mt-2 text-sm text-gray-600 text-center">
						{fileName}
					</p>
					<button
						onClick={handleRemoveImage}
						className="mt-2 bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-md transition"
					>
						Remove
					</button>
				</div>
			) : (
				<label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 p-6 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer transition">
					<input
						type="file"
						accept="image/*"
						onChange={handleImageChange}
						hidden
					/>
					<div className="flex flex-col items-center">
						<span className="text-3xl">📷</span>
						<p className="mt-1 text-sm">Click to upload an image</p>
					</div>
				</label>
			)}
			{error && <p className="text-red-500 text-xs">{error}</p>}
		</div>
	);
};

const blobToBase64 = (blob: Blob): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});

// Helper to get a display name for a user based on uid.
// If the current user matches, we use their displayName.
const getUserDisplayName = (uid: string, currentUser: AppUser | null) => {
	if (currentUser && currentUser.uid === uid && currentUser.displayName) {
		return currentUser.displayName;
	}
	return uid; // fallback to uid if no display name available
};

export default function FoundItPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const cacheGalleryID = searchParams.get("cacheGalleryID");
	const { user } = useAuth();

	// Create a state for extended user data (AppUser)
	const [appUser, setAppUser] = useState<AppUser | null>(null);
	useEffect(() => {
		if (user) {
			const unsubscribe = subscribeToUser(
				user.uid,
				(data: AppUser | null) => {
					if (data) {
						setAppUser(data);
					}
				}
			);
			return () => unsubscribe();
		}
	}, [user]);

	const [leaderboard, setLeaderboard] = useState<{
		[uid: string]: { displayName: string; count: number };
	}>({});
	const [userLocation, setUserLocation] = useState<{
		lat: number;
		lon: number;
	} | null>(null);
	const [isWithinDistance, setIsWithinDistance] = useState<boolean>(false);
	const [cacheGallery, setCacheGallery] = useState<CacheGallery | null>(null);
	const [imageBlob, setImageBlob] = useState<Blob | null>(null);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [gifUrl, setGifUrl] = useState("");
	const [adding, setAdding] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");
	const [hasVisited, setHasVisited] = useState(false);

	// Check if the extended user has already visited this gallery
	useEffect(() => {
		if (appUser && cacheGalleryID) {
			if (appUser.cachesCollected.includes(cacheGalleryID)) {
				setHasVisited(true);
			}
		}
	}, [appUser, cacheGalleryID]);

	// Watch user location
	useEffect(() => {
		const watchId = navigator.geolocation.watchPosition(
			(position) => {
				setUserLocation({
					lat: position.coords.latitude,
					lon: position.coords.longitude,
				});
			},
			(error) => console.error("Error watching position:", error),
			{ enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
		);
		return () => navigator.geolocation.clearWatch(watchId);
	}, []);

	// Subscribe to cache galleries and get the requested gallery
	useEffect(() => {
		if (!cacheGalleryID) {
			router.push("/map");
			return;
		}
		const unsubscribe = subscribeToCacheGalleries(
			(galleries: CacheGallery[]) => {
				const foundGallery = galleries.find(
					(gal) => gal.id === cacheGalleryID
				);
				if (!foundGallery) {
					router.push("/map");
				} else {
					const cacheList = Array.isArray(foundGallery.cacheList)
						? foundGallery.cacheList
						: (Object.values(
								foundGallery.cacheList || {}
						  ) as Cache[]);
					setCacheGallery({ ...foundGallery, cacheList });
				}
			}
		);
		return () => unsubscribe();
	}, [cacheGalleryID, router]);

	useEffect(() => {
		async function updateLeaderboardNames() {
			// Make a copy of the current leaderboard
			const updatedLeaderboard = { ...leaderboard };
			// For each uid, fetch user data and update the displayName if available
			const uids = Object.keys(updatedLeaderboard);
			await Promise.all(
				uids.map(async (uid) => {
					const userData = await getUser(uid);
					if (userData && userData.displayName) {
						updatedLeaderboard[uid].displayName =
							userData.displayName;
					}
				})
			);
			setLeaderboard(updatedLeaderboard);
		}
		if (Object.keys(leaderboard).length > 0) {
			updateLeaderboardNames();
		}
	}, [leaderboard]);

	// Compute leaderboard using reduce and get proper display names
	useEffect(() => {
		if (!cacheGallery) return;
		const newLeaderboard = cacheGallery.cacheList.reduce((acc, cache) => {
			if (!acc[cache.updatedByUid]) {
				acc[cache.updatedByUid] = {
					displayName: getUserDisplayName(
						cache.updatedByUid,
						appUser
					),
					count: 0,
				};
			}
			acc[cache.updatedByUid].count++;
			return acc;
		}, {} as { [uid: string]: { displayName: string; count: number } });
		setLeaderboard(newLeaderboard);
	}, [cacheGallery, appUser]);

	// Check distance from user to gallery
	useEffect(() => {
		if (!userLocation || !cacheGallery) return;
		const distanceTo = getDistance(userLocation, {
			lat: cacheGallery.lat,
			lon: cacheGallery.lng,
		});
		setIsWithinDistance(distanceTo < CACHING_THRESHOLD);
	}, [userLocation, cacheGallery]);

	// Mark gallery as visited and update user's cachesCollected
	const markGalleryAsVisited = async (galleryId: string) => {
		if (!user) return;
		try {
			await addGalleryToUserCachesCollected(user.uid, galleryId);
			setHasVisited(true);
		} catch (error) {
			console.error("Failed to update user's cachesCollected:", error);
		}
	};

	const handleAddCache = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!cacheGallery) return;
		if (!user) {
			alert("You must be logged in to add a cache.");
			setAdding(false);
			return;
		}
		setAdding(true);
		setErrorMsg("");
		try {
			await addCacheToGallery(cacheGallery.id, {
				updatedAt: Date.now(),
				updatedByUid: user.uid,
				image: imageBlob ? await blobToBase64(imageBlob) : undefined,
				audio: audioBlob ? await blobToBase64(audioBlob) : undefined,
				gifUrl: gifUrl.trim() ? gifUrl.trim() : undefined,
			});
			if (!hasVisited) {
				await markGalleryAsVisited(cacheGallery.id);
			}
			setImageBlob(null);
			setAudioBlob(null);
			setGifUrl("");
		} catch (err) {
			console.error("Error adding cache:", err);
			setErrorMsg("Failed to add cache. Please try again.");
		}
		setAdding(false);
	};

	return (
		<PageView
			title={cacheGallery ? `Found it: ${cacheGallery.name}` : "Found it"}
		>
			{!cacheGallery ? (
				<p>Loading...</p>
			) : (
				<div className="container mx-auto p-4 space-y-6">
					<div className="bg-gray-100 p-4 rounded-xl shadow">
						<h1 className="text-2xl font-bold mb-2">
							{cacheGallery.name}
						</h1>
						<p className="text-gray-700">
							{cacheGallery.description}
						</p>
						<div className="mt-2">
							<span className="font-semibold">Location:</span> (
							{cacheGallery.lat}, {cacheGallery.lng})
						</div>
						<div className="mt-1">
							<span className="font-semibold">Expires on:</span>{" "}
							{new Date(
								cacheGallery.expiryDate
							).toLocaleDateString()}
						</div>
						<div className="mt-1">
							<span className="font-semibold">In distance:</span>{" "}
							{isWithinDistance ? "Yes" : "No"}
						</div>
					</div>

					{/* If not visited, show the submission form */}
					{!hasVisited && (
						<>
							<div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-xl flex gap-2 shadow">
								<FaInfoCircle size={20} className="my-auto" />
								<span>
									To view the caches inside this gallery, you
									must first submit a cache.
								</span>
							</div>
							{isWithinDistance && (
								<div className="bg-gray-100 p-4 rounded-xl shadow">
									<h2 className="text-xl font-bold mb-2">
										Add a New Cache
									</h2>
									{errorMsg && (
										<div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-2 rounded mb-2">
											{errorMsg}
										</div>
									)}
									<form
										onSubmit={handleAddCache}
										className="flex flex-col gap-4"
									>
										<ImageUploader
											setImageBlob={setImageBlob}
										/>
										<AudioRecorder
											setAudioBlob={setAudioBlob}
										/>
										<input
											type="text"
											placeholder="GIF URL"
											className="p-2 border rounded"
											value={gifUrl}
											onChange={(e) =>
												setGifUrl(e.target.value)
											}
											disabled={!isWithinDistance}
										/>
										<button
											type="submit"
											className="bg-green-500 text-white p-2 rounded-full shadow-lg"
											disabled={
												!isWithinDistance || adding
											}
										>
											{adding ? "Adding..." : "Add Cache"}
										</button>
									</form>
								</div>
							)}
						</>
					)}

					{/* Leaderboard (always shown) */}
					<div>
						<h2 className="text-xl font-bold mb-2">Leaderboard</h2>
						{Object.keys(leaderboard).map((key) => {
							const data = leaderboard[key];
							return (
								<div key={key}>
									{data.displayName}: {data.count}
								</div>
							);
						})}
					</div>

					{/* Display caches if gallery is visited */}
					{hasVisited ? (
						<div className="bg-white p-4 rounded-xl shadow">
							<h2 className="text-xl font-bold mb-2">Caches</h2>
							<div className="grid grid-cols-1 gap-4">
								{(Array.isArray(cacheGallery.cacheList)
									? cacheGallery.cacheList
									: (Object.values(
											cacheGallery.cacheList || {}
									  ) as Cache[])
								).map((cache, index) => (
									<div
										key={index}
										className="bg-gray-50 p-4 rounded-xl shadow"
									>
										<div className="mb-2">
											<span className="font-semibold">
												Updated By:
											</span>{" "}
											{cache.updatedByUid}
										</div>
										<div className="mb-2">
											<span className="font-semibold">
												Updated At:
											</span>{" "}
											{new Date(
												cache.updatedAt
											).toLocaleString()}
										</div>
										{cache.image && (
											<div className="mb-2">
												<img
													src={cache.image}
													alt="Cache Image"
													className="w-full h-auto rounded"
												/>
											</div>
										)}
										{cache.gifUrl && (
											<div className="mb-2">
												<img
													src={cache.gifUrl}
													alt="Cache GIF"
													className="w-full h-auto rounded"
												/>
											</div>
										)}
										{cache.audio && (
											<div className="mb-2">
												<audio
													controls
													className="w-full"
												>
													<source src={cache.audio} />
													Your browser does not
													support the audio element.
												</audio>
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					) : (
						<div className="bg-gray-50 border-l-4 border-gray-500 text-gray-700 p-4 rounded-xl flex gap-2">
							<FaInfoCircle size={20} className="my-auto" />
							<span>
								Once you add a cache, this gallery will be
								marked as visited and its contents will be
								displayed.
							</span>
						</div>
					)}
				</div>
			)}
		</PageView>
	);
}
