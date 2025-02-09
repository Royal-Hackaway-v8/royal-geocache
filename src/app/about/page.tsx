import PageView from "@/components/ui/PageView";

export default function AboutPage() {
	return (
		<PageView title="">
			<div className="min-h-screen bg-white py-12">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
					<div className="prose lg:prose-xl">
						{/* Main Title with Animation */}
						<h1 className="text-4xl font-bold mb-8 text-green-600 animate-fade-in-down">
							About CacheGrab
						</h1>

						{/* Hero Section */}
						<div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 mb-8 shadow-lg transition-all hover:shadow-xl">
							<p className="text-lg leading-relaxed text-gray-700">
								Welcome to{" "}
								<span className="font-semibold text-green-600">
									CacheGrab
								</span>
								, the revolutionary way to explore your
								university campus! We blend the excitement of
								treasure hunting with cutting-edge augmented
								reality technology to create unforgettable
								adventures.
							</p>
						</div>

						{/* Mission Section */}
						<div className="space-y-8">
							<div className="animate-fade-in delay-100">
								<h2 className="text-3xl font-bold mb-4 text-green-600 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
									Our Mission
								</h2>
								<div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl">
									<p className="text-gray-700 leading-relaxed">
										We're transforming campus exploration
										into an immersive game. Our platform
										combines:
									</p>
									<ul className="list-disc pl-6 mt-4 space-y-2 text-gray-600">
										<li>
											📍 Real-world navigation challenges
										</li>
										<li>
											📱 Augmented reality experiences
										</li>
										<li>🎮 Gamified learning adventures</li>
										<li>
											👥 Social collaboration features
										</li>
									</ul>
								</div>
							</div>

							{/* How It Works Section */}
							<div className="animate-fade-in delay-200">
								<h2 className="text-3xl font-bold mb-4 text-green-600 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
									How It Works
								</h2>
								<div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl">
									<div className="grid gap-6">
										<div className="space-y-2">
											<h3 className="text-xl font-semibold text-gray-800">
												🗺️ Discover Virtual Capsules
											</h3>
											<p className="text-gray-600">
												Find hidden AR capsules
												containing multimedia content -
												unlock stories, challenges, and
												campus history when you're
												physically nearby.
											</p>
										</div>

										<div className="space-y-2">
											<h3 className="text-xl font-semibold text-gray-800">
												📸 Augmented Reality Mode
											</h3>
											<p className="text-gray-600">
												Use your phone's camera to view
												virtual artifacts superimposed
												on real campus locations through
												our AR interface.
											</p>
										</div>

										<div className="space-y-2">
											<h3 className="text-xl font-semibold text-gray-800">
												🏆 Collaborative Challenges
											</h3>
											<p className="text-gray-600">
												Team up with friends to solve
												location-based puzzles, earn
												achievements, and climb the
												leaderboards.
											</p>
										</div>
									</div>
								</div>
							</div>

							{/* Call to Action */}
							<div className="animate-fade-in delay-300 mt-12 text-center shadow-lg transition-all hover:shadow-xl">
								<a
									href="/map"
									className="inline-block bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
								>
									Start Exploring Now →
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</PageView>
	);
}
