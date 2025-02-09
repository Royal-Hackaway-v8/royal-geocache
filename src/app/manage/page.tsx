"use client";

import React, { useEffect, useState, useRef } from "react";
import PageView from "@/components/ui/PageView";
import { CacheGallery, Cache, CacheGroup } from "@/types";
import {
	subscribeToCacheGalleries,
	createCacheGallery,
	updateCacheGallery,
	deleteCacheGallery,
	addCacheToGallery,
	subscribeToCacheGroups,
	updateCacheGroup,
	createCacheGroup,
	deleteCacheGroup,
} from "@/services/cacheService";
import { useAuth } from "@/context/AuthContext";

// Convert a Blob to a Base64 string
const blobToBase64 = (blob: Blob): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});

// Updated CacheFormInput with gifUrl field
interface CacheFormInput {
	name: string;
	description: string;
	lat: string;
	lng: string;
	gifUrl: string;
}

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
			<input
				type="text"
				name="gifUrl"
				value={formData.gifUrl}
				onChange={handleChange}
				placeholder="GIF URL"
				className="w-full border p-2 rounded mb-4"
			/>
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
						className="w-full bg-gray-500 text-white p-2 rounded-full shadow-lg"
					>
						Cancel Edit
					</button>
				)}
			</div>
		</form>
	);
};

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
					{gallery.cacheList[0]?.gifUrl && (
						<div
							className="cursor-pointer hover:opacity-75 mb-2"
							onClick={() =>
								handleOpenModal(
									"image",
									gallery.cacheList[0].gifUrl!
								)
							}
						>
							<img
								src={gallery.cacheList[0].gifUrl}
								alt="Gallery GIF Preview"
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
	const [gifUrl, setGifUrl] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const newCacheData: Omit<Cache, "id"> = {
			updatedAt: Date.now(),
			updatedByUid: user.uid,
		};
		if (imageBlob) {
			newCacheData.image = await blobToBase64(imageBlob);
		}
		if (audioBlob) {
			newCacheData.audio = await blobToBase64(audioBlob);
		}
		if (gifUrl.trim()) {
			newCacheData.gifUrl = gifUrl.trim();
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
				<form onSubmit={handleSubmit} className="space-y-4">
					<ImageUploader setImageBlob={setImageBlob} />
					<AudioRecorder setAudioBlob={setAudioBlob} />
					<div>
						<label className="block mb-1">GIF URL</label>
						<input
							type="text"
							value={gifUrl}
							onChange={(e) => setGifUrl(e.target.value)}
							placeholder="Enter GIF URL"
							className="w-full border p-2 rounded"
						/>
					</div>
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

// ---------- Group Management Components ----------

interface GroupFormInput {
	name: string;
	description: string;
	groupList: string[]; // List of CacheGallery IDs
}

const GroupForm = ({
	groupForm,
	setGroupForm,
	handleGroupSubmit,
	editingGroup,
	cancelGroupEdit,
	galleries,
}: {
	groupForm: GroupFormInput;
	setGroupForm: React.Dispatch<React.SetStateAction<GroupFormInput>>;
	handleGroupSubmit: (e: React.FormEvent) => void;
	editingGroup: string | null;
	cancelGroupEdit: () => void;
	galleries: CacheGallery[];
}) => {
	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		setGroupForm({ ...groupForm, [e.target.name]: e.target.value });
	};

	const handleCheckboxChange = (galleryId: string) => {
		if (groupForm.groupList.includes(galleryId)) {
			setGroupForm({
				...groupForm,
				groupList: groupForm.groupList.filter((id) => id !== galleryId),
			});
		} else {
			setGroupForm({
				...groupForm,
				groupList: [...groupForm.groupList, galleryId],
			});
		}
	};

	return (
		<form
			onSubmit={handleGroupSubmit}
			className="mb-8 p-4 bg-white rounded-2xl shadow-lg"
		>
			<h2 className="text-xl font-bold mb-4">
				{editingGroup ? "Edit Cache Group" : "Add Cache Group"}
			</h2>
			<input
				type="text"
				name="name"
				value={groupForm.name}
				onChange={handleChange}
				placeholder="Group name"
				className="w-full border p-2 rounded mb-4"
			/>
			<textarea
				name="description"
				value={groupForm.description}
				onChange={handleChange}
				placeholder="Group description"
				className="w-full border p-2 rounded mb-4"
			/>
			<div className="mb-4">
				<h3 className="font-bold mb-2">Select Galleries:</h3>
				<div className="grid grid-cols-2 gap-2">
					{galleries.map((gallery) => (
						<label key={gallery.id} className="flex items-center">
							<input
								type="checkbox"
								checked={groupForm.groupList.includes(
									gallery.id
								)}
								onChange={() =>
									handleCheckboxChange(gallery.id)
								}
								className="mr-2"
							/>
							{gallery.name}
						</label>
					))}
				</div>
			</div>
			<div className="flex space-x-2">
				<button
					type="submit"
					className="w-full bg-blue-500 text-white p-2 rounded-full shadow-md"
				>
					{editingGroup ? "Update Group" : "Save Group"}
				</button>
				{editingGroup && (
					<button
						type="button"
						onClick={cancelGroupEdit}
						className="w-full bg-gray-500 text-white p-2 rounded-full shadow-lg"
					>
						Cancel Edit
					</button>
				)}
			</div>
		</form>
	);
};

const GroupList = ({
	groups,
	onEditGroup,
	onDeleteGroup,
}: {
	groups: CacheGroup[];
	onEditGroup: (group: CacheGroup) => void;
	onDeleteGroup: (id: string) => void;
}) => {
	return (
		<div>
			<h2 className="text-xl font-bold mb-4">Cache Groups</h2>
			{groups.length === 0 && <p>No groups found.</p>}
			{groups.map((group) => (
				<div
					key={group.id}
					className="p-4 mb-4 bg-gray-100 rounded-2xl shadow-lg"
				>
					<h3 className="text-lg font-semibold">{group.name}</h3>
					<p>{group.description}</p>
					<p className="text-gray-600 text-sm">
						Galleries: {group.groupList.join(", ")}
					</p>
					<div className="mt-2 flex space-x-2">
						<button
							onClick={() => onEditGroup(group)}
							className="bg-yellow-500 text-white px-4 py-2 rounded-full shadow-md"
						>
							Edit
						</button>
						<button
							onClick={() => onDeleteGroup(group.id)}
							className="bg-red-500 text-white px-4 py-2 rounded-full shadow-md"
						>
							Delete
						</button>
					</div>
				</div>
			))}
		</div>
	);
};

// ---------- Main ManagePage Component ----------

export default function ManagePage() {
	const { user } = useAuth();

	// Gallery state & handlers
	const [galleries, setGalleries] = useState<CacheGallery[]>([]);
	const [formData, setFormData] = useState<CacheFormInput>({
		name: "",
		description: "",
		lat: "",
		lng: "",
		gifUrl: "",
	});
	const [imageBlob, setImageBlob] = useState<Blob | null>(null);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [editingGalleryId, setEditingGalleryId] = useState<string | null>(
		null
	);
	const [selectedGalleryForNewCache, setSelectedGalleryForNewCache] =
		useState<CacheGallery | null>(null);
	const [cacheAddedSuccess, setCacheAddedSuccess] = useState<string | null>(
		null
	);

	// Group state & handlers
	const [groups, setGroups] = useState<CacheGroup[]>([]);
	const [groupForm, setGroupForm] = useState<GroupFormInput>({
		name: "",
		description: "",
		groupList: [],
	});
	const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

	// Subscribe to galleries
	useEffect(() => {
		const unsubscribe = subscribeToCacheGalleries((galleries) =>
			setGalleries(galleries)
		);
		return () => unsubscribe();
	}, []);

	// Subscribe to groups
	useEffect(() => {
		const unsubscribe = subscribeToCacheGroups((groups) =>
			setGroups(groups)
		);
		return () => unsubscribe();
	}, []);

	const handleCacheAdded = () => {
		setCacheAddedSuccess("Cache added successfully!");
		setTimeout(() => {
			setCacheAddedSuccess(null);
		}, 3000);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) {
			alert("User not found. Please sign in.");
			return;
		}
		if (editingGalleryId) {
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
					gifUrl: formData.gifUrl ? formData.gifUrl : undefined,
				},
			});
			setEditingGalleryId(null);
		} else {
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
					gifUrl: formData.gifUrl ? formData.gifUrl : undefined,
				},
			};
			await createCacheGallery(galleryData);
		}
		setFormData({
			name: "",
			description: "",
			lat: "",
			lng: "",
			gifUrl: "",
		});
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
			gifUrl: gallery.cacheList[0]?.gifUrl || "",
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
		setFormData({
			name: "",
			description: "",
			lat: "",
			lng: "",
			gifUrl: "",
		});
		setImageBlob(null);
		setAudioBlob(null);
	};

	const handleAddCache = (gallery: CacheGallery) => {
		setSelectedGalleryForNewCache(gallery);
	};

	// Group handlers
	const handleGroupSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) {
			alert("User not found. Please sign in.");
			return;
		}
		if (editingGroupId) {
			// Optimistically update the group in local state
			setGroups((prev) =>
				prev.map((group) =>
					group.id === editingGroupId
						? {
								...group,
								name: groupForm.name,
								description: groupForm.description,
								groupList: groupForm.groupList,
						  }
						: group
				)
			);
			try {
				await updateCacheGroup(editingGroupId, {
					name: groupForm.name,
					description: groupForm.description,
					groupList: groupForm.groupList,
				});
			} catch (error) {
				alert("Failed to update group.");
				// Optionally revert by re-fetching groups
			}
			setEditingGroupId(null);
		} else {
			// Create a temporary group object for optimistic update
			const tempId = "temp-" + Date.now();
			const newGroup: CacheGroup = {
				id: tempId,
				name: groupForm.name,
				description: groupForm.description,
				groupList: groupForm.groupList,
			};
			// Optimistically add the new group to local state
			setGroups((prev) => [...prev, newGroup]);
			try {
				await createCacheGroup({
					name: groupForm.name,
					description: groupForm.description,
					groupList: groupForm.groupList,
				});
			} catch (error) {
				alert("Failed to create group.");
				// Revert optimistic update
				setGroups((prev) =>
					prev.filter((group) => group.id !== tempId)
				);
			}
		}
		setGroupForm({ name: "", description: "", groupList: [] });
	};

	const handleEditGroup = (group: CacheGroup) => {
		setGroupForm({
			name: group.name,
			description: group.description,
			groupList: group.groupList,
		});
		setEditingGroupId(group.id);
	};

	const handleDeleteGroup = async (id: string) => {
		if (confirm("Are you sure you want to delete this group?")) {
			// Keep a copy of the current groups for potential rollback
			const originalGroups = groups;
			// Optimistically remove the group
			setGroups((prev) => prev.filter((group) => group.id !== id));
			try {
				await deleteCacheGroup(id);
			} catch (error) {
				alert("Failed to delete group.");
				// Revert deletion on error
				setGroups(originalGroups);
			}
		}
	};

	const cancelGroupEdit = () => {
		setEditingGroupId(null);
		setGroupForm({ name: "", description: "", groupList: [] });
	};

	return (
		<PageView title="Manage Galleries & Groups">
			<div className="flex flex-col md:flex-row gap-4">
				{/* Galleries Management Panel */}
				<div className="flex-1">
					{cacheAddedSuccess && (
						<div className="bg-green-100 text-green-800 p-2 rounded mb-4">
							{cacheAddedSuccess}
						</div>
					)}
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
				</div>
				{/* Groups Management Panel */}
				<div className="flex-1">
					<GroupForm
						groupForm={groupForm}
						setGroupForm={setGroupForm}
						handleGroupSubmit={handleGroupSubmit}
						editingGroup={editingGroupId}
						cancelGroupEdit={cancelGroupEdit}
						galleries={galleries}
					/>
					<GroupList
						groups={groups}
						onEditGroup={handleEditGroup}
						onDeleteGroup={handleDeleteGroup}
					/>
				</div>
			</div>
		</PageView>
	);
}
