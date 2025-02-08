"use client";

import React, { useEffect, useState, useRef } from "react";
import PageView from "@/components/ui/PageView";
import { DB } from "@/config/firebase";
import { ref, onValue, push, set, update, remove } from "firebase/database";
import { Cache } from "@/types";

// Convert Blob to Base64 (returns full data URL)
const blobToBase64 = (blob: Blob): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
};

// Audio Recorder Component
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
			<label className="block mb-1">Audio Recording</label>
			{!isRecording ? (
				<button
					type="button"
					onClick={startRecording}
					className="w-full bg-green-500 text-white p-2 rounded"
				>
					Start Recording
				</button>
			) : (
				<button
					type="button"
					onClick={stopRecording}
					className="w-full bg-red-500 text-white p-2 rounded"
				>
					Stop Recording
				</button>
			)}
		</div>
	);
};

// Image Uploader Component
const ImageUploader = ({
	setImageBlob,
}: {
	setImageBlob: React.Dispatch<React.SetStateAction<Blob | null>>;
}) => {
	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setImageBlob(e.target.files[0]);
		}
	};

	return (
		<div className="mb-4">
			<label className="block mb-1">Image Upload</label>
			<input
				type="file"
				accept="image/*"
				onChange={handleImageChange}
				className="w-full border p-2 rounded"
			/>
		</div>
	);
};

// Cache Form Component
const CacheForm = ({
	formData,
	setFormData,
	handleSubmit,
	handleFillLocation,
	setImageBlob,
	setAudioBlob,
	editing,
	cancelEdit,
}: {
	formData: any;
	setFormData: React.Dispatch<React.SetStateAction<any>>;
	handleSubmit: (e: React.FormEvent) => void;
	handleFillLocation: () => void;
	setImageBlob: React.Dispatch<React.SetStateAction<Blob | null>>;
	setAudioBlob: React.Dispatch<React.SetStateAction<Blob | null>>;
	editing: boolean;
	cancelEdit: () => void;
}) => {
	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="mb-8 p-4 bg-white rounded shadow"
		>
			<h2 className="text-xl font-bold mb-4">
				{editing ? "Edit Cache" : "Add Cache"}
			</h2>
			<input
				type="text"
				name="name"
				value={formData.name}
				onChange={handleChange}
				placeholder="Cache name"
				className="w-full border p-2 rounded mb-4"
			/>
			<textarea
				name="description"
				value={formData.description}
				onChange={handleChange}
				placeholder="Cache description"
				className="w-full border p-2 rounded mb-4"
			></textarea>

			{/* Latitude & Longitude */}
			<div className="flex space-x-4 mb-4">
				<input
					type="number"
					step="any"
					name="lat"
					value={formData.lat}
					onChange={handleChange}
					placeholder="Latitude"
					className="w-full border p-2 rounded"
				/>
				<input
					type="number"
					step="any"
					name="lng"
					value={formData.lng}
					onChange={handleChange}
					placeholder="Longitude"
					className="w-full border p-2 rounded"
				/>
			</div>

			<button
				type="button"
				onClick={handleFillLocation}
				className="w-full bg-gray-300 text-black p-2 rounded mb-4"
			>
				Use My Location
			</button>

			<ImageUploader setImageBlob={setImageBlob} />
			<AudioRecorder setAudioBlob={setAudioBlob} />

			<div className="flex space-x-2">
				<button
					type="submit"
					className="w-full bg-blue-500 text-white p-2 rounded"
				>
					{editing ? "Update Cache" : "Save Cache"}
				</button>
				{editing && (
					<button
						type="button"
						onClick={cancelEdit}
						className="w-full bg-gray-500 text-white p-2 rounded"
					>
						Cancel Edit
					</button>
				)}
			</div>
		</form>
	);
};

// Cache List Component (using stored full data URLs)
const CacheList = ({
	caches,
	onEdit,
	onDelete,
}: {
	caches: Cache[];
	onEdit: (cache: Cache) => void;
	onDelete: (id: string) => void;
}) => {
	// Modal state for viewing images/audio
	const [modalContent, setModalContent] = useState<{
		type: "image" | "audio";
		src: string;
	} | null>(null);

	// Simply set modal content to the stored data URL
	const handleOpenModal = (type: "image" | "audio", dataUrl: string) => {
		setModalContent({ type, src: dataUrl });
	};

	const handleCloseModal = () => {
		setModalContent(null);
	};

	return (
		<div>
			<h2 className="text-xl font-bold mb-4">Caches</h2>
			{caches.length === 0 && <p>No caches found.</p>}
			{caches.map((cache) => (
				<div
					key={cache.id}
					className="p-4 mb-4 bg-gray-100 rounded shadow"
				>
					<h3 className="text-lg font-semibold">{cache.name}</h3>
					<p>{cache.description}</p>
					<p>
						<span>Lat: {cache.lat}</span>,{" "}
						<span>Lng: {cache.lng}</span>
					</p>

					{/* Clickable image preview */}
					{cache.image && (
						<div
							className="cursor-pointer hover:opacity-75 mb-2"
							onClick={() =>
								handleOpenModal("image", cache.image!)
							}
						>
							<img
								src={cache.image}
								alt="Cache"
								className="max-w-xs"
							/>
						</div>
					)}

					{/* Audio player with modal trigger */}
					{cache.audio && (
						<div className="mb-2">
							<audio
								controls
								src={cache.audio}
								className="w-full"
							/>
							<button
								onClick={() =>
									handleOpenModal("audio", cache.audio!)
								}
								className="mt-2 bg-blue-500 text-white p-1 rounded"
							>
								View Audio
							</button>
						</div>
					)}

					<div className="mt-2 flex space-x-2">
						<button
							onClick={() => onEdit(cache)}
							className="bg-yellow-500 text-white p-1 rounded"
						>
							Edit
						</button>
						<button
							onClick={() => onDelete(cache.id)}
							className="bg-red-500 text-white p-1 rounded"
						>
							Delete
						</button>
					</div>
				</div>
			))}

			{/* Modal for viewing images or audio */}
			{modalContent && (
				<div
					className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
					onClick={handleCloseModal}
				>
					<div
						className="bg-white p-4 rounded relative"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							onClick={handleCloseModal}
							className="absolute top-0 right-0 m-2 text-gray-700"
						>
							X
						</button>
						{modalContent.type === "image" ? (
							<img
								src={modalContent.src}
								alt="Preview"
								className="max-w-full max-h-[80vh]"
							/>
						) : (
							<audio
								controls
								src={modalContent.src}
								autoPlay
								className="w-full"
							/>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

// ManagePage (Main Component)
export default function ManagePage() {
	const [caches, setCaches] = useState<Cache[]>([]);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		lat: "",
		lng: "",
	});
	const [imageBlob, setImageBlob] = useState<Blob | null>(null);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [editingCacheId, setEditingCacheId] = useState<string | null>(null);

	useEffect(() => {
		const cachesRef = ref(DB, "caches/");
		const unsubscribe = onValue(cachesRef, (snapshot) => {
			const data = snapshot.val();
			if (data) {
				setCaches(
					Object.entries(data).map(([id, cache]) => ({
						...(cache as Cache),
						id,
					}))
				);
			} else {
				setCaches([]);
			}
		});
		return () => unsubscribe();
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const cacheData = {
			...formData,
			lat: parseFloat(formData.lat),
			lng: parseFloat(formData.lng),
			...(imageBlob ? { image: await blobToBase64(imageBlob) } : {}),
			...(audioBlob ? { audio: await blobToBase64(audioBlob) } : {}),
		};

		if (editingCacheId) {
			// Update existing cache
			await update(ref(DB, `caches/${editingCacheId}`), cacheData);
			setEditingCacheId(null);
		} else {
			// Add new cache
			await set(push(ref(DB, "caches/")), cacheData);
		}
		// Reset form
		setFormData({ name: "", description: "", lat: "", lng: "" });
		setImageBlob(null);
		setAudioBlob(null);
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

	const handleEdit = (cache: Cache) => {
		setFormData({
			name: cache.name,
			description: cache.description,
			lat: cache.lat.toString(),
			lng: cache.lng.toString(),
		});
		setEditingCacheId(cache.id);
	};

	const handleDelete = async (id: string) => {
		if (confirm("Are you sure you want to delete this cache?")) {
			await remove(ref(DB, `caches/${id}`));
			if (editingCacheId === id) {
				cancelEdit();
			}
		}
	};

	const cancelEdit = () => {
		setEditingCacheId(null);
		setFormData({ name: "", description: "", lat: "", lng: "" });
		setImageBlob(null);
		setAudioBlob(null);
	};

	return (
		<PageView title="Manage Caches">
			<CacheForm
				formData={formData}
				setFormData={setFormData}
				handleSubmit={handleSubmit}
				handleFillLocation={handleFillLocation}
				setImageBlob={setImageBlob}
				setAudioBlob={setAudioBlob}
				editing={!!editingCacheId}
				cancelEdit={cancelEdit}
			/>
			<CacheList
				caches={caches}
				onEdit={handleEdit}
				onDelete={handleDelete}
			/>
		</PageView>
	);
}
