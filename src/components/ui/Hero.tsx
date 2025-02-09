import React, { useEffect, useState } from "react";
import Map from "./Map";

const Hero = () => {
	const [mounted, setMounted] = useState<boolean>(false);
	useEffect(() => setMounted(true), []);

	return (
		<div className="w-screen h-screen  flex flex-col justify-center items-center">
			<div className=" m-28 h-full w-full flex flex-col justify-center items-center ">
				{mounted && <Map />}
			</div>
		</div>
	);
};

export default Hero;
