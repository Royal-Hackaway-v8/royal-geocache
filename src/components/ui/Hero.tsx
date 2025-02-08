import React from "react";
import Map from "./Map";

const Hero = () => {
	return (
		<div className="w-screen h-screen  flex flex-col justify-center items-center">
			<div className=" m-28 h-full w-full flex flex-col justify-center items-center ">
				<Map />
			</div>
		</div>
	);
};

export default Hero;
