"use client";

import Map from "@/components/ui/Map";

const MapClient = Map as unknown as React.FC;

export default function MapPage() {
	return (
		<div className="w-screen h-screen  flex flex-col justify-center items-center">
			<div className=" m-28 h-full w-full flex flex-col justify-center items-center ">
				<MapClient />
			</div>
		</div>
	);
}
