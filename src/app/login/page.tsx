"use client";

import { useState } from "react";
import { AUTH } from "../../config/firebase";
import {
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	GoogleAuthProvider,
	signInWithCredential,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import PageView from "@/components/ui/PageView";

export default function AuthPage() {
	// Mode can be "signin" or "signup"
	const [mode, setMode] = useState<"signin" | "signup">("signin");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const { user } = useAuth();
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);

	// Redirect if user is already signed in
	if (user) {
		router.push("/manage");
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		try {
			if (mode === "signin") {
				await signInWithEmailAndPassword(AUTH, email, password);
			} else {
				await createUserWithEmailAndPassword(AUTH, email, password);
			}
			router.push("/manage");
		} catch (err: any) {
			setError(err.message);
		}
	};
	const handleGoogleSignIn = async () => {
		setError(null);
		try {
			const provider = new GoogleAuthProvider();
			await signInWithCredential(AUTH, provider);
			router.push("/manage");
		} catch (err: any) {
			setError(err.message);
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
					className="bg-white/50 p-6 rounded-3xl w-96 backdrop-blur-md shadow-xl"
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
			</div>
		</PageView>
	);
}
