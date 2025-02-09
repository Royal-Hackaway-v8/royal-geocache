# CacheGrab &mdash; Explore, Discover, Collect!

## 🌍 Inspiration

We wanted to create an immersive, real-world treasure hunt that blends technology with adventure. Traditional geocaching is fun but often requires physical containers &mdash; we asked ourselves, what if geocaching could be entirely digital?

With CacheGrab, users can hide &amp; seek virtual caches in real-world locations on our campus and further, unlocking them by physically visiting the spot. We loved the idea of combining location-based gaming with community-driven content to create a fun and engaging outdoor experience.

## 📍 What it does

CacheGrab is a location-based geocaching app where users can:

-   Drop virtual caches (with audio snippets, images, messages, GIFs) at specific real-world locations.
-   Explore the world by hunting for hidden caches and unlocking their contents when nearby.
-   Compete and collaborate with others by collecting caches &amp; tracking discoveries on a leaderboard.

## 🛠️ How we built it

CacheGrab was developed using a full-stack approach:

-   **Frontend**: Next.js (React), TailwindCSS for UI styling.
-   **Backend**: Firebase (Realtime Database & Auth) for storing user data, caches, and authentication.
-   **Maps & Location**: Leaflet.js and browser Geolocation API for tracking users and displaying caches.
-   **Hosting**: Vercel for seamless frontend deployment.

We ensured a smooth user experience by implementing real-time updates, allowing players to see caches appear as they explore.

## 🚧 Challenges we ran into

-   **Ensuring location accuracy**: Mobile geolocation isn’t always precise, so we had to fine-tune the detection radius for unlocking caches.
-   **Data security & user privacy**: Since CacheGrab involves geolocation, we needed to secure user data while ensuring fair play.
-   **Real-time updates**: Implementing cache discovery and leaderboard updates in real-time required efficient database queries and optimization.
-   **Integrating AR/XR**: We were hoping to bring the cameras that everyone has on their phone into the action of viewing cache galleries.
-   **Live Share**: Over time we realized that Live Share was so flaky & janky because of the uni's networks, as well as various other variables (we also have numerous complaints about its UX!)
-   **Ngrok**: We frequently reached the limits for Ngrok due to the nature of our project and development set up &mdash; this means that

## 🏆 Accomplishments that we’re proud of

-   Successfully implemented a functional geocaching system that allows users to place and discover caches dynamically.
-   Integrated Google Sign-In authentication for seamless user onboarding.
-   Built an interactive and intuitive UI that makes exploring easy and fun.
-   Designed a scalable database structure for efficient storage of user caches and retrieval queries.
-   Created a working prototype within the hackathon timeframe that feels polished and ready to expand!

## 📚 What we learned

-   Efficient database structuring is crucial when dealing with real-time location-based interactions.
-   Firebase Realtime Database works great for live updates, but optimizing queries is key to keeping performance smooth.
-   UX matters in location-based apps &amp; an intuitive and of course a map experience improve engagement.
-   Collaboration is everything! Working as a team helped us brainstorm creative ideas and solve complex problems efficiently.

## 🚀 What’s next for CacheGrab

We’re excited about expanding CacheGrab with:

-   Augmented Reality (AR) integration to display virtual caches in the real world through the camera.
-   User-generated challenges where players can create custom quests or riddles to unlock caches.
-   Badges to gamify the experience and encourage friendly competition.
-   App for iOS and Android to improve accessibility and performance.

CacheGrab is just getting started, and we can’t wait to take geocaching to the next level!
