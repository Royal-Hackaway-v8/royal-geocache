import NavMenu from "../components/ui/NavMenu";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
	? `https://${process.env.VERCEL_URL}`
	: "http://localhost:3000";

export const metadata = {
	metadataBase: new URL(defaultUrl),
	title: "Royal Geocache",
	description: "KTLJ",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`bg-background text-foreground bg-gradient-to-br from-green-200 to-green-600`}
			>
				<main className="min-h-screen flex flex-col">
					<NavMenu />

					{/* Main Content */}
					<div>{children}</div>
				</main>
			</body>
		</html>
	);
}
