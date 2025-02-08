"use client";

import { useEffect, useRef, useState } from "react";
import PageView from "@/components/ui/PageView";
import Link from "next/link";

export default function Home() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [isPlaying, setIsPlaying] = useState(true);

	useEffect(() => {
		const video = videoRef.current;
		if (video) {
			video.muted = true;
			const playPromise = video.play();

			if (playPromise !== undefined) {
				playPromise
					.then(() => {
						setIsPlaying(true);
					})
					.catch((error) => {
						console.error("Autoplay failed:", error);
						setIsPlaying(false);
					});
			}

			const handlePlay = () => setIsPlaying(true);
			const handlePause = () => setIsPlaying(false);

			video.addEventListener("play", handlePlay);
			video.addEventListener("pause", handlePause);

			return () => {
				video.removeEventListener("play", handlePlay);
				video.removeEventListener("pause", handlePause);
			};
		}
	}, []);

	return (
		<PageView>
			{/* Background Video */}
			<video
				autoPlay
				loop
				muted
				playsInline
				preload="auto"
				ref={videoRef}
				className="fixed top-0 left-0 w-screen h-screen object-cover"
			>
				<source src="/video/hero.mp4" type="video/mp4" />
				Your browser doesn't support the video tag.
			</video>

			{/* Overlay Content */}
			<div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-white text-center bg-black/40">
				<h1 className="text-4xl md:text-6xl font-bold drop-shadow-lg text-green-400">
					Adventure Awaits
				</h1>
				<h2 className="text-3xl italic md:text-6xl font-bold drop-shadow-lg text-green-400 opacity-80">
					Start Your Hunt Today!
				</h2>
				<Link href="/manage">
					<button className="mt-6 px-6 py-3 text-lg font-semibold bg-green-500 hover:bg-green-600 transition-all rounded-full shadow-lg">
						Start Hunting
					</button>
				</Link>
			</div>
		</PageView>
	);
}
