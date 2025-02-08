"use client";

import React, { useEffect, useState, useRef } from "react";
import PageView from "@/components/ui/PageView";
import { DB } from "@/config/firebase";
import { ref, onValue, push, set, update, remove } from "firebase/database";
import { Cache } from "@/types";

export default function ManagePage() {
	// Cache & form state
	const [caches, setCaches] = useState<Cache[]>([]);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		lat: "",
		lng: "",
	});
	const [editingId, setEditingId] = useState<string | null>(null);

	// Media state
	const [imageBlob, setImageBlob] = useState<Blob | null>(null);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [isRecording, setIsRecording] = useState(false);
	const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
		null
	);
	const audioChunksRef = useRef<Blob[]>([]);

	// Helper: Convert Blob to Base64 string
	const blobToBase64 = (blob: Blob): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	};

	// Fetch caches from Firebase
	useEffect(() => {
		const cachesRef = ref(DB, "caches/");
		const unsubscribe = onValue(cachesRef, (snapshot) => {
			const data = snapshot.val();
			const loadedCaches: Cache[] = [];
			for (let id in data) {
				loadedCaches.push({
					id,
					name: data[id].name,
					description: data[id].description,
					lat: data[id].lat,
					lng: data[id].lng,
					createdAt: data[id].createdAt,
					image: data[id].image, // optional Base64 string
					audio: data[id].audio, // optional Base64 string
				});
			}
			setCaches(loadedCaches);
		});
		return () => unsubscribe();
	}, []);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleFillLocation = () => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					setFormData((prev) => ({
						...prev,
						lat: latitude.toString(),
						lng: longitude.toString(),
					}));
				},
				(error) => {
					console.error("Error getting location:", error);
					alert(
						"Failed to retrieve your location. Please try again."
					);
				}
			);
		} else {
			alert("Geolocation is not supported by this browser.");
		}
	};

	// Handle image upload
	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setImageBlob(e.target.files[0]);
		}
	};

	// Audio recording: start/stop
	const startRecording = async () => {
		if (navigator.mediaDevices && window.MediaRecorder) {
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
				console.error("Error starting audio recording:", err);
				alert("Unable to access microphone.");
			}
		} else {
			alert("Audio recording is not supported in this browser.");
		}
	};

	const stopRecording = () => {
		if (mediaRecorder) {
			mediaRecorder.stop();
			setIsRecording(false);
			setMediaRecorder(null);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const { name, description, lat, lng } = formData;
		if (!name || !description || !lat || !lng) return;

		let imageData: string | null = null;
		let audioData: string | null = null;

		if (imageBlob) {
			imageData = await blobToBase64(imageBlob);
		}
		if (audioBlob) {
			audioData = await blobToBase64(audioBlob);
		}

		const cacheData = {
			name,
			description,
			lat: parseFloat(lat),
			lng: parseFloat(lng),
			createdAt: Date.now(),
			image: imageData || undefined, // Convert null to undefined
			audio: audioData || undefined, // Convert null to undefined
		};

		if (editingId) {
			// Update existing cache
			const cacheRef = ref(DB, `caches/${editingId}`);
			await update(cacheRef, cacheData);
			setCaches((prev) =>
				prev.map((cache) =>
					cache.id === editingId ? { ...cache, ...cacheData } : cache
				)
			);
			setEditingId(null);
		} else {
			// Create a new cache
			const cachesRef = ref(DB, "caches/");
			const newCacheRef = push(cachesRef);
			await set(newCacheRef, cacheData);
			const newCacheId = newCacheRef.key ?? crypto.randomUUID();
			setCaches((prev) => {
				if (!prev.some((cache) => cache.id === newCacheId)) {
					return [...prev, { id: newCacheId, ...cacheData }];
				}
				return prev;
			});
		}

		// Reset form and media
		setFormData({ name: "", description: "", lat: "", lng: "" });
		setImageBlob(null);
		setAudioBlob(null);
	};

	const handleEdit = (cache: Cache) => {
		setFormData({
			name: cache.name,
			description: cache.description,
			lat: cache.lat.toString(),
			lng: cache.lng.toString(),
		});
		setEditingId(cache.id);
	};

	const handleDelete = async (id: string) => {
		const cacheRef = ref(DB, `caches/${id}`);
		await remove(cacheRef);
	};

	return (
		<PageView title="Manage Caches">
			<div className="w-full max-w-xl mx-auto">
				<form
					onSubmit={handleSubmit}
					className="mb-8 p-4 bg-white rounded shadow"
				>
					<h2 className="text-xl font-bold mb-4">
						{editingId ? "Edit Cache" : "Add New Cache"}
					</h2>
					<div className="mb-4">
						<label className="block mb-1">Name</label>
						<input
							type="text"
							name="name"
							value={formData.name}
							onChange={handleChange}
							className="w-full border p-2 rounded"
							placeholder="Cache name"
						/>
					</div>
					<div className="mb-4">
						<label className="block mb-1">Description</label>
						<textarea
							name="description"
							value={formData.description}
							onChange={handleChange}
							className="w-full border p-2 rounded"
							placeholder="Cache description"
						></textarea>
					</div>
					<div className="mb-4 flex flex-col space-y-4">
						<div className="flex space-x-4">
							<div className="flex-1">
								<label className="block mb-1">Latitude</label>
								<input
									type="number"
									step="any"
									name="lat"
									value={formData.lat}
									onChange={handleChange}
									className="w-full border p-2 rounded"
									placeholder="Latitude"
								/>
							</div>
							<div className="flex-1">
								<label className="block mb-1">Longitude</label>
								<input
									type="number"
									step="any"
									name="lng"
									value={formData.lng}
									onChange={handleChange}
									className="w-full border p-2 rounded"
									placeholder="Longitude"
								/>
							</div>
						</div>
						<button
							type="button"
							onClick={handleFillLocation}
							className="w-full bg-gray-300 text-black p-2 rounded-full shadow-md hover:bg-gray-400 transition"
						>
							Use My Location
						</button>
					</div>

					{/* Image Upload */}
					<div className="mb-4">
						<label className="block mb-1">Image Upload</label>
						<input
							type="file"
							accept="image/*"
							onChange={handleImageChange}
							className="w-full border p-2 rounded"
						/>
						{imageBlob && (
							<img
								src={URL.createObjectURL(imageBlob)}
								alt="Preview"
								className="mt-2 max-h-40"
							/>
						)}
					</div>

					{/* Audio Recording */}
					<div className="mb-4">
						<label className="block mb-1">Audio Recording</label>
						{!isRecording && (
							<button
								type="button"
								onClick={startRecording}
								className="w-full bg-green-500 text-white p-2 rounded-full shadow-md hover:bg-green-600 transition"
							>
								Start Recording
							</button>
						)}
						{isRecording && (
							<button
								type="button"
								onClick={stopRecording}
								className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 transition"
							>
								Stop Recording
							</button>
						)}
						{audioBlob && !isRecording && (
							<audio
								controls
								src={URL.createObjectURL(audioBlob)}
								className="mt-2 w-full"
							></audio>
						)}
					</div>

					<div className="flex gap-2">
						<button
							type="submit"
							className="w-full bg-blue-500 text-white p-2 rounded-full shadow-md"
						>
							{editingId ? "Update Cache" : "Add Cache"}
						</button>
					</div>
				</form>

				<div>
					<h2 className="text-xl font-bold mb-4">Caches</h2>
					{caches.length === 0 && <p>No caches found.</p>}
					{caches.map((cache) => (
						<div
							key={cache.id}
							className="p-4 mb-4 bg-gray-100 rounded shadow"
						>
							<h3 className="text-lg font-semibold">
								{cache.name}
							</h3>
							<p>{cache.description}</p>
							<p>
								<span>Lat: {cache.lat}</span>,{" "}
								<span>Lng: {cache.lng}</span>
							</p>
							{cache.image && (
								<img
									src={cache.image}
									alt="Cache"
									className="mt-2 max-h-40"
								/>
							)}
							{cache.audio && (
								<audio
									controls
									src={cache.audio}
									className="mt-2 w-full"
								></audio>
							)}
							<p className="text-xs text-gray-500">
								Created:{" "}
								{new Date(cache.createdAt).toLocaleString()}
							</p>
							<div className="mt-2 flex space-x-2">
								<button
									onClick={() => handleEdit(cache)}
									className="bg-yellow-500 text-white px-3 py-1 rounded"
								>
									Edit
								</button>
								<button
									onClick={() => handleDelete(cache.id)}
									className="bg-red-500 text-white px-3 py-1 rounded"
								>
									Delete
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</PageView>
	);
}
