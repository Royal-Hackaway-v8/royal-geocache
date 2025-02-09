// "use client";
// import React, { useEffect, useRef } from "react";
// import "@google/model-viewer";

// const ARCapsule = () => {
// 	const modelRef = useRef<HTMLDivElement>(null);

// 	useEffect(() => {
// 		console.log("WebGLRenderingContext:", WebGLRenderingContext);

// 		if (modelRef.current) {
// 			console.log("Model-Viewer Mounted!");
// 		}
// 	}, []);

// 	return (
// 		<div className="my-8" ref={modelRef}>
// 			<model-viewer
// 				src="https://modelviewer.dev/shared-assets/models/Astronaut.glb"
// 				alt="Astronaut Model"
// 				auto-rotate
// 				camera-controls
// 				style={{
// 					width: "100%",
// 					height: "500px",
// 					backgroundColor: "lightgray",
// 				}}
// 			/>
// 		</div>
// 	);
// };

// export default ARCapsule;
