"use client";

import { useEffect, useRef, useState } from "react";
import PageView from "@/components/ui/PageView";

export default function Home() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [searchQuery, setSearchQuery] = useState("");
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
						console.log("Video is playing");
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
			<video
				autoPlay
				loop
				muted
				playsInline
				preload="auto"
				ref={videoRef}
				className="fixed top-0 left-0 w-screen h-screen object-cover"
				// poster="/images/video_placeholder.jpg"
			>
				<source src="/video/hero.mp4" type="video/mp4" />
				Your browser doesn't support the video tag.
			</video>

			{/* Placeholder Image (when video paused) */}
			{/* {!isPlaying && (
				<img
					src="/images/video_placeholder.jpg"
					alt="Video Placeholder"
					className="fixed top-0 left-0 w-screen h-screen object-cover"
				/>
			)} */}

			{/* Hero Section */}
			{/* <div className="relative w-full h-[75vh] flex justify-center items-center flex-col">
				<img
					src="/images/Oaxaca.svg"
					className="h-[80vh] mix-blend-overlay"
					style={{
						filter: "drop-shadow(0 0 .5rem rgba(0, 0, 0, .5)) invert(1)",
					}}
				/>
			</div> */}
		</PageView>
	);
}
