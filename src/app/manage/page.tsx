"use client";

import React, { useEffect, useState, useRef } from "react";
import PageView from "@/components/ui/PageView";
import { CacheGallery, Cache } from "@/types";
import {
	subscribeToCacheGalleries,
	createCacheGallery,
	updateCacheGallery,
	deleteCacheGallery,
	addCacheToGallery,
} from "@/services/cacheService";
import { useAuth } from "@/context/AuthContext";

// Convert blob to Base64 string and ensure we don't pass undefined values
const blobToBase64 = (blob: Blob): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});

// Interface for gallery form input state
interface CacheFormInput {
	name: string;
	description: string;
	lat: string;
	lng: string;
}

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
				className="w-full border p-2 rounded-full shadow-md"
			/>
		</div>
	);
};

// Cache Gallery Form Component (for creating/updating a gallery)
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
	formData: CacheFormInput;
	setFormData: React.Dispatch<React.SetStateAction<CacheFormInput>>;
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
			className="mb-8 p-4 bg-white rounded-2xl shadow-lg"
		>
			<h2 className="text-xl font-bold mb-4">
				{editing ? "Edit Cache Gallery" : "Add Cache Gallery"}
			</h2>
			<input
				type="text"
				name="name"
				value={formData.name}
				onChange={handleChange}
				placeholder="Gallery name"
				className="w-full border p-2 rounded mb-4"
			/>
			<textarea
				name="description"
				value={formData.description}
				onChange={handleChange}
				placeholder="Gallery description"
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
				className="w-full bg-gray-300 text-black p-2 rounded-full shadow-md mb-4"
			>
				Use My Location
			</button>

			<ImageUploader setImageBlob={setImageBlob} />
			<AudioRecorder setAudioBlob={setAudioBlob} />

			<div className="flex space-x-2">
				<button
					type="submit"
					className="w-full bg-blue-500 text-white p-2 rounded-full shadow-md"
				>
					{editing ? "Update Gallery" : "Save Gallery"}
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

// Component for displaying cache galleries and offering edit, delete, and add-cache options
const CacheList = ({
	galleries,
	onEdit,
	onDelete,
	onAddCache,
}: {
	galleries: CacheGallery[];
	onEdit: (gallery: CacheGallery) => void;
	onDelete: (id: string) => void;
	onAddCache: (gallery: CacheGallery) => void;
}) => {
	const [modalContent, setModalContent] = useState<{
		type: "image" | "audio";
		src: string;
	} | null>(null);

	const formatTimestamp = (timestamp: string | number | Date) => {
		if (!timestamp) return "Unknown date";
		const date = new Date(timestamp);
		return new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "short",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: true,
		}).format(date);
	};

	const handleOpenModal = (type: "image" | "audio", dataUrl: string) => {
		setModalContent({ type, src: dataUrl });
	};

	const handleCloseModal = () => {
		setModalContent(null);
	};

	return (
		<div>
			<h2 className="text-xl font-bold mb-4">Cache Galleries</h2>
			{galleries.length === 0 && <p>No galleries found.</p>}
			{galleries.map((gallery) => (
				<div
					key={gallery.id}
					className="p-4 mb-4 bg-gray-100 rounded-2xl shadow-lg"
				>
					<h3 className="text-lg font-semibold">{gallery.name}</h3>
					<p>{gallery.description}</p>
					<p>
						<span>Lat: {gallery.lat}</span>,{" "}
						<span>Lng: {gallery.lng}</span>
					</p>
					<p className="text-gray-600 text-sm">
						Created: {formatTimestamp(gallery.createdAt)}
					</p>

					{gallery.cacheList[0]?.image && (
						<div
							className="cursor-pointer hover:opacity-75 mb-2"
							onClick={() =>
								handleOpenModal(
									"image",
									gallery.cacheList[0].image!
								)
							}
						>
							<img
								src={gallery.cacheList[0].image}
								alt="Gallery Preview"
								className="max-w-xs"
							/>
						</div>
					)}

					{gallery.cacheList[0]?.audio && (
						<div className="mb-2">
							<audio
								controls
								src={gallery.cacheList[0].audio}
								className="w-full rounded-full shadow-md"
							/>
						</div>
					)}

					<div className="mt-2 flex space-x-2">
						<button
							onClick={() => onEdit(gallery)}
							className="bg-yellow-500 text-white px-4 py-2 rounded-full shadow-md"
						>
							Edit
						</button>
						<button
							onClick={() => onDelete(gallery.id)}
							className="bg-red-500 text-white px-4 py-2 rounded-full shadow-md"
						>
							Delete
						</button>
						<button
							onClick={() => onAddCache(gallery)}
							className="bg-green-500 text-white px-4 py-2 rounded-full shadow-md"
						>
							Add Cache
						</button>
					</div>
				</div>
			))}

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

// Modal Component for adding an additional cache to a gallery
const AddCacheModal = ({
	gallery,
	user,
	onClose,
	onCacheAdded,
}: {
	gallery: CacheGallery;
	user: { uid: string };
	onClose: () => void;
	onCacheAdded: () => void;
}) => {
	const [imageBlob, setImageBlob] = useState<Blob | null>(null);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const newCacheData: Omit<Cache, "id"> = {
			updatedAt: Date.now(),
			updatedByUid: user.uid,
		};
		// Only add properties if they exist
		if (imageBlob) {
			newCacheData.image = await blobToBase64(imageBlob);
		}
		if (audioBlob) {
			newCacheData.audio = await blobToBase64(audioBlob);
		}
		try {
			await addCacheToGallery(gallery.id, newCacheData);
			onCacheAdded();
			onClose();
		} catch (error) {
			console.error("Error adding cache:", error);
			alert("Failed to add cache.");
		}
	};

	return (
		<div
			className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
			onClick={onClose}
		>
			<div
				className="bg-white p-4 rounded relative"
				onClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={onClose}
					className="absolute top-0 right-0 m-2 text-gray-700"
				>
					X
				</button>
				<h2 className="text-xl font-bold mb-4">Add Cache to Gallery</h2>
				<form onSubmit={handleSubmit}>
					<ImageUploader setImageBlob={setImageBlob} />
					<AudioRecorder setAudioBlob={setAudioBlob} />
					<button
						type="submit"
						className="w-full bg-blue-500 text-white p-2 rounded-full mt-4"
					>
						Add Cache
					</button>
				</form>
			</div>
		</div>
	);
};

// ManagePage Component
export default function ManagePage() {
	const { user } = useAuth();
	const [galleries, setGalleries] = useState<CacheGallery[]>([]);
	const [formData, setFormData] = useState<CacheFormInput>({
		name: "",
		description: "",
		lat: "",
		lng: "",
	});
	const [imageBlob, setImageBlob] = useState<Blob | null>(null);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [editingGalleryId, setEditingGalleryId] = useState<string | null>(
		null
	);
	const [selectedGalleryForNewCache, setSelectedGalleryForNewCache] =
		useState<CacheGallery | null>(null);

	// Subscribe to cache galleries on component mount
	useEffect(() => {
		const unsubscribe = subscribeToCacheGalleries((galleries) =>
			setGalleries(galleries)
		);
		return () => unsubscribe();
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) {
			alert("User not found. Please sign in.");
			return;
		}
		if (editingGalleryId) {
			// Update existing gallery
			await updateCacheGallery(editingGalleryId, {
				name: formData.name,
				description: formData.description,
				lat: parseFloat(formData.lat),
				lng: parseFloat(formData.lng),
				updatedCache: {
					updatedAt: Date.now(),
					updatedByUid: user.uid,
					...(imageBlob
						? { image: await blobToBase64(imageBlob) }
						: {}),
					...(audioBlob
						? { audio: await blobToBase64(audioBlob) }
						: {}),
					gifUrl: undefined,
				},
			});
			setEditingGalleryId(null);
		} else {
			// Create new gallery with an initial cache
			const galleryData: Omit<CacheGallery, "id" | "cacheList"> & {
				initialCache: Omit<Cache, "id">;
			} = {
				name: formData.name,
				description: formData.description,
				lat: parseFloat(formData.lat),
				lng: parseFloat(formData.lng),
				createdAt: Date.now(),
				createdByUid: user.uid,
				expiryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
				featured: false,
				initialCache: {
					updatedAt: Date.now(),
					updatedByUid: user.uid,
					...(imageBlob
						? { image: await blobToBase64(imageBlob) }
						: {}),
					...(audioBlob
						? { audio: await blobToBase64(audioBlob) }
						: {}),
					gifUrl: undefined,
				},
			};
			await createCacheGallery(galleryData);
		}
		// Reset form state
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

	const handleEdit = (gallery: CacheGallery) => {
		setFormData({
			name: gallery.name,
			description: gallery.description,
			lat: gallery.lat.toString(),
			lng: gallery.lng.toString(),
		});
		setEditingGalleryId(gallery.id);
	};

	const handleDelete = async (id: string) => {
		if (confirm("Are you sure you want to delete this gallery?")) {
			await deleteCacheGallery(id);
			if (editingGalleryId === id) {
				cancelEdit();
			}
		}
	};

	const cancelEdit = () => {
		setEditingGalleryId(null);
		setFormData({ name: "", description: "", lat: "", lng: "" });
		setImageBlob(null);
		setAudioBlob(null);
	};

	const handleAddCache = (gallery: CacheGallery) => {
		setSelectedGalleryForNewCache(gallery);
	};

	const handleCacheAdded = () => {
		// Optionally, refresh galleries after adding a cache.
		// For now, our subscription should pick up the change.
	};

	return (
		<PageView title="Manage Cache Galleries">
			<CacheForm
				formData={formData}
				setFormData={setFormData}
				handleSubmit={handleSubmit}
				handleFillLocation={handleFillLocation}
				setImageBlob={setImageBlob}
				setAudioBlob={setAudioBlob}
				editing={!!editingGalleryId}
				cancelEdit={cancelEdit}
			/>
			<CacheList
				galleries={galleries}
				onEdit={handleEdit}
				onDelete={handleDelete}
				onAddCache={handleAddCache}
			/>
			{selectedGalleryForNewCache && user && (
				<AddCacheModal
					gallery={selectedGalleryForNewCache}
					user={user}
					onClose={() => setSelectedGalleryForNewCache(null)}
					onCacheAdded={handleCacheAdded}
				/>
			)}
		</PageView>
	);
}
