import PageView from "@/components/ui/PageView";

export default function AboutPage() {
	return (
		<PageView title="About">
			<div className="container mx-auto p-8">
				<div className="prose lg:prose-xl">
					<h1 className="text-3xl font-bold mb-4">
						About Uni Geocache Hunt
					</h1>

					<p>
						Welcome to CacheGrab, the exciting new way to explore
						your university campus! We've combined the thrill of
						geocaching with the power of augmented reality to create
						a unique and engaging experience.
					</p>

					<h2 className="text-2xl font-bold mt-6 mb-4">
						Our Mission
					</h2>
					<p>
						Our mission is to make exploring your campus more fun
						and interactive. We believe that learning about your
						surroundings should be an adventure, and we're
						passionate about creating a platform that brings people
						together and encourages discovery.
					</p>

					<h2 className="text-2xl font-bold mt-6 mb-4">
						How It Works
					</h2>
					<p>
						Using our app, you can discover hidden virtual
						"capsules" scattered across campus. These capsules
						contain multimedia content – images, audio, video, and
						messages – that are unlocked when you're physically near
						their location. Use your phone's camera in AR mode to
						see the capsules in the real world!
					</p>

					<p className="mt-8">
						We're excited to have you join the CacheGrab community!
						Start exploring and discover the hidden gems on your
						campus.
					</p>
				</div>
			</div>
		</PageView>
	);
}
