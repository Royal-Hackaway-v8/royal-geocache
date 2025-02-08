// src/app/manage/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import PageView from "@/components/ui/PageView";
import { DB } from "@/config/firebase";
import { ref, onValue, push, set, update, remove } from "firebase/database";
import { Cache } from "@/types";

export default function ManagePage() {
	const [caches, setCaches] = useState<Cache[]>([]);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		lat: "",
		lng: "",
	});
	const [editingId, setEditingId] = useState<string | null>(null);

	// Fetch caches from Firebase on component mount
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const { name, description, lat, lng } = formData;
		if (!name || !description || !lat || !lng) return;

		const cacheData = {
			name,
			description,
			lat: parseFloat(lat),
			lng: parseFloat(lng),
			createdAt: Date.now(),
		};

		if (editingId) {
			// Update an existing cache
			const cacheRef = ref(DB, `caches/${editingId}`);
			await update(cacheRef, cacheData);
			setEditingId(null);
		} else {
			// Create a new cache
			const cachesRef = ref(DB, "caches/");
			const newCacheRef = push(cachesRef);
			await set(newCacheRef, cacheData);
		}
		setFormData({ name: "", description: "", lat: "", lng: "" });
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
					<div className="mb-4 flex space-x-4">
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
						type="submit"
						className="w-full bg-blue-500 text-white p-2 rounded"
					>
						{editingId ? "Update Cache" : "Add Cache"}
					</button>
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
