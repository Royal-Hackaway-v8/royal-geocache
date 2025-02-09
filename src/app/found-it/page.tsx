"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { CacheGallery } from "@/types";
import { useEffect, useState, useRef } from "react";
import {
	subscribeToCacheGalleries,
	addCacheToGallery,
} from "@/services/cacheService";
import PageView from "@/components/ui/PageView";
import { getDistance } from "@/lib/distance";

const CACHING_THRESHOLD = 0.5; // in km

// --- Audio Recorder Component ---
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

// --- Image Uploader Component ---
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
			// Validate file type
			if (!file.type.startsWith("image/")) {
				setError("Please upload a valid image file.");
				return;
			}
			// Validate file size (max 5MB)
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

// --- Blob to Base64 utility ---
const blobToBase64 = (blob: Blob): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});

// ---------- FoundItPage Component ----------
export default function FoundItPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const cacheGalleryID = searchParams.get("cacheGalleryID");

	// User location & distance state
	const [userLocation, setUserLocation] = useState<{
		lat: number;
		lon: number;
	} | null>(null);
	const [isWithinDistance, setIsWithinDistance] = useState<boolean>(false);

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

	// Gallery state
	const [cacheGallery, setCacheGallery] = useState<CacheGallery | null>(null);
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
					setCacheGallery(foundGallery);
				}
			}
		);
		return () => unsubscribe();
	}, [cacheGalleryID, router]);

	// Calculate distance to gallery
	useEffect(() => {
		if (!userLocation || !cacheGallery) return;
		const distanceTo = getDistance(userLocation, {
			lat: cacheGallery.lat,
			lon: cacheGallery.lng,
		});
		setIsWithinDistance(distanceTo < CACHING_THRESHOLD);
	}, [userLocation, cacheGallery]);

	// New states for cache form using file upload and recording
	const [imageBlob, setImageBlob] = useState<Blob | null>(null);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [gifUrl, setGifUrl] = useState("");
	const [adding, setAdding] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");

	const handleAddCache = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!cacheGallery) return;
		setAdding(true);
		setErrorMsg("");
		try {
			await addCacheToGallery(cacheGallery.id, {
				updatedAt: Date.now(),
				updatedByUid: "anonymous", // TODO: Replace with actual user ID if available
				image: imageBlob ? await blobToBase64(imageBlob) : undefined,
				audio: audioBlob ? await blobToBase64(audioBlob) : undefined,
				gifUrl: gifUrl.trim() ? gifUrl.trim() : undefined,
			});
			// Reset cache form fields
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
				<div className="container mx-auto p-4">
					{/* Gallery Header */}
					<div className="mb-6 bg-gray-100 p-4 rounded-xl">
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

					{/* Add Cache Form */}
					<div className="mb-6 border p-4 rounded-xl bg-gray-100">
						<h2 className="text-xl font-bold mb-2">
							Add a New Cache
						</h2>
						{!isWithinDistance && (
							<p className="text-red-500 mb-2">
								You must be within {CACHING_THRESHOLD} km to add
								a cache.
							</p>
						)}
						{errorMsg && (
							<p className="text-red-500 mb-2">{errorMsg}</p>
						)}
						<form
							onSubmit={handleAddCache}
							className="flex flex-col gap-4"
						>
							<ImageUploader setImageBlob={setImageBlob} />
							<AudioRecorder setAudioBlob={setAudioBlob} />
							<input
								type="text"
								placeholder="GIF URL"
								className="p-2 border rounded"
								value={gifUrl}
								onChange={(e) => setGifUrl(e.target.value)}
								disabled={!isWithinDistance}
							/>
							<button
								type="submit"
								className="bg-green-500 text-white p-2 rounded-full shadow-lg"
								disabled={!isWithinDistance || adding}
							>
								{adding ? "Adding..." : "Add Cache"}
							</button>
						</form>
					</div>

					{/* Cache List */}
					<div>
						<h2 className="text-xl font-bold mb-2">Caches</h2>
						<div className="grid grid-cols-1 gap-4">
							{cacheGallery.cacheList.map((cache, index) => (
								<div
									key={index}
									className="bg-white rounded-xl shadow p-4"
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
											<audio controls className="w-full">
												<source src={cache.audio} />
												Your browser does not support
												the audio element.
											</audio>
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</PageView>
	);
}
