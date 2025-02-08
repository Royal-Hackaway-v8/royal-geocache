"use client";

import { useState } from "react";
import { AUTH } from "../../config/firebase";
import {
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	GoogleAuthProvider,
	signInWithPopup,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import PageView from "@/components/ui/PageView";
import { FaGoogle } from "react-icons/fa";
import { createOrUpdateUser } from "@/services/userService";

export default function AuthPage() {
	// Mode can be "signin" or "signup"
	const [mode, setMode] = useState<"signin" | "signup">("signin");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const { user, handleSignOut } = useAuth();
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);

	// If user is signed in, show the profile view with a sign out button
	if (user) {
		return (
			<PageView title="Profile">
				<div className="flex flex-col items-center space-y-4">
					<p>Welcome, {user.displayName || user.email}!</p>
					<button
						type="button"
						onClick={handleSignOut}
						className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full"
					>
						Sign Out
					</button>
				</div>
			</PageView>
		);
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		try {
			if (mode === "signin") {
				await signInWithEmailAndPassword(AUTH, email, password);
			} else {
				const userCredential = await createUserWithEmailAndPassword(
					AUTH,
					email,
					password
				);
				await createOrUpdateUser({
					uid: userCredential.user.uid,
					displayName: userCredential.user.displayName,
					email: userCredential.user.email,
					photoURL: userCredential.user.photoURL,
				});
			}
			router.push("/profile");
		} catch (err: any) {
			setError(err.message);
		}
	};

	const handleGoogleSignIn = async () => {
		setError(null);
		try {
			const provider = new GoogleAuthProvider();
			const result = await signInWithPopup(AUTH, provider);
			await createOrUpdateUser({
				uid: result.user.uid,
				displayName: result.user.displayName,
				email: result.user.email,
				photoURL: result.user.photoURL,
			});
			router.push("/profile");
		} catch (err: any) {
			if (err.code === "auth/popup-closed-by-user") {
				console.log("Popup closed by user. Returning to sign-in.");
			} else {
				console.error("Google Sign-In Error:", err);
				setError(err.message);
			}
		}
	};

	return (
		<PageView title={mode === "signin" ? "Sign In" : "Sign Up"}>
			<div className="flex flex-col items-center space-y-4">
				{/* Mode Toggle */}
				<div className="flex space-x-4">
					<button
						type="button"
						onClick={() => setMode("signin")}
						className={`px-4 py-2 rounded-full transition backdrop-blur-md ${
							mode === "signin"
								? "bg-blue-500 text-white"
								: "bg-gray-200 text-gray-800"
						}`}
					>
						Sign In
					</button>
					<button
						type="button"
						onClick={() => setMode("signup")}
						className={`px-4 py-2 rounded-full transition backdrop-blur-md ${
							mode === "signup"
								? "bg-blue-500 text-white"
								: "bg-gray-200 text-gray-800"
						}`}
					>
						Sign Up
					</button>
				</div>

				{/* Auth Form */}
				<form
					onSubmit={handleSubmit}
					className="bg-white p-6 rounded-3xl w-96 shadow-xl"
				>
					{error && <p className="text-red-500 mb-2">{error}</p>}
					<div className="mb-4">
						<label htmlFor="email" className="block mb-1">
							Email:
						</label>
						<input
							type="email"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full p-2 border rounded-full"
							placeholder="email@website.com"
						/>
					</div>
					<div className="mb-4">
						<label htmlFor="password" className="block mb-1">
							Password:
						</label>
						<input
							type="password"
							id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="w-full p-2 border rounded-full"
							placeholder="********"
						/>
					</div>
					<button
						type="submit"
						className="w-full bg-blue-500 text-white p-2 rounded-full"
					>
						{mode === "signin" ? "Sign In" : "Sign Up"}
					</button>
				</form>
				<button
					type="button"
					onClick={handleGoogleSignIn}
					className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full flex items-center justify-center"
				>
					<FaGoogle className="h-5 w-5 mr-2" />
					Sign In with Google
				</button>
			</div>
		</PageView>
	);
}
