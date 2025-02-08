"use client";

import { useEffect, useRef, useState } from "react";
import PageView from "@/components/ui/PageView";
import Link from "next/link";

export default function Home() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [isPlaying, setIsPlaying] = useState(true);
	const [isFading, setIsFading] = useState(false);

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

			// Listen for when the video ends to handle fade transition
			const handleEnded = () => {
				setIsFading(true);
				// Wait for fade-out duration (500ms)
				setTimeout(() => {
					video.currentTime = 0;
					video.play();
					setIsFading(false);
				}, 500);
			};

			video.addEventListener("ended", handleEnded);

			const handlePlay = () => setIsPlaying(true);
			const handlePause = () => setIsPlaying(false);

			video.addEventListener("play", handlePlay);
			video.addEventListener("pause", handlePause);

			return () => {
				video.removeEventListener("ended", handleEnded);
				video.removeEventListener("play", handlePlay);
				video.removeEventListener("pause", handlePause);
			};
		}
	}, []);

	return (
		<PageView>
			{/* Video Container with a black background */}
			<div className="fixed top-0 left-0 w-screen h-screen bg-black">
				<video
					autoPlay
					muted
					playsInline
					preload="auto"
					ref={videoRef}
					className={`w-full h-full object-cover transition-opacity duration-500 ${
						isFading ? "opacity-0" : "opacity-100"
					}`}
				>
					<source src="/video/hero_hd.mp4" type="video/mp4" />
					Your browser doesn't support the video tag.
				</video>
			</div>

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
