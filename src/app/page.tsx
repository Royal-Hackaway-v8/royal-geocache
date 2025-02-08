import React from "react";

const Home = () => {
	return (
		<div className="flex flex-col min-h-screen">
			{/* Header */}
			<header className="w-full bg-blue-600 py-4 text-center">
				<h1 className="text-3xl font-bold text-white">
					Uni Geocache Hunt
				</h1>
			</header>

			{/* Main Section */}
			<main className="flex flex-col flex-grow items-center justify-center">
				<p className="text-xl mb-8">
					Welcome to the ultimate geocaching experience on campus!
				</p>
				<button className="px-6 py-3 bg-green-500 text-white font-bold rounded-full shadow-lg hover:bg-green-600 transition duration-200">
					Start Hunting!
				</button>
			</main>

			{/* Footer */}
			<footer className="w-full bg-gray-200 py-2 text-center">
				<p className="text-sm text-gray-600">
					&copy; {new Date().getFullYear()} Kenny &bull; Leo &bull;
					Jamie
				</p>
			</footer>
		</div>
	);
};

export default Home;
