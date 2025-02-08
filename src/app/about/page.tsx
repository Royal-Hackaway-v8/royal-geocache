import PageView from "@/components/ui/PageView";

export default function AboutPage() {
	return (
		<PageView title="About">
			<div className="container mx-auto p-8">
				<div className="prose lg:prose-xl text-black">
					<h1 className="text-3xl  font-bold mb-4 text-green-400">
						About Uni Geocache Hunt
					</h1>

					<div className="bg-green-200 backdrop-blur-md rounded-lg p-4">
						<p>
							Welcome to CacheGrab, the exciting new way to
							explore your university campus! We've combined the
							thrill of geocaching with the power of augmented
							reality to create a unique and engaging experience.
						</p>
					</div>

					<h2 className="text-2xl font-bold mt-6 mb-4 text-green-400">
						Our Mission
					</h2>

					<div className="bg-green-200 backdrop-blur-md rounded-lg p-4">
						<p>
							Our mission is to make exploring your campus more
							fun and interactive. We believe that learning about
							your surroundings should be an adventure, and we're
							passionate about creating a platform that brings
							people together and encourages discovery.
						</p>
					</div>

					<h2 className="text-2xl font-bold mt-6 mb-4 text-green-400">
						How It Works
					</h2>

					<div className="bg-green-200 backdrop-blur-md rounded-lg p-4">
						<p>
							Using our app, you can discover hidden virtual
							"capsules" scattered across campus. These capsules
							contain multimedia content – images, audio, video,
							and messages – that are unlocked when you're
							physically near their location. Use your phone's
							camera in AR mode to see the capsules in the real
							world!
						</p>
						<p>
							We're excited to have you join the CacheGrab
							community! Start exploring and discover the hidden
							gems on your campus.
						</p>
					</div>
				</div>
			</div>
		</PageView>
	);
}
