import React from "react";
import Map from "./Map";

const Hero = () => {
	return (
		<div className=" h-screen flex justify-center items-center w-screen">
			<div className="h-[50%] w-[50%]">
				{" "}
				<Map />
			</div>
		</div>
	);
};

export default Hero;
