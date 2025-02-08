import NavMenu from "../components/ui/NavMenu";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
	? `https://${process.env.VERCEL_URL}`
	: "http://localhost:3000";

export const metadata = {
	metadataBase: new URL(defaultUrl),
	title: "CacheGrab",
	description: "KTLJ",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="gradient-background">
				<main className="min-h-screen flex flex-col">
					<NavMenu />

					{/* Main Content */}
					<div>{children}</div>
				</main>
			</body>
		</html>
	);
}
