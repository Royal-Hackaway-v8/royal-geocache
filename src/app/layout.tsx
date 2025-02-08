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
				className={`bg-background text-foreground bg-gradient-to-r from-blue-200 to-blue-600`}
			>
				<main className="min-h-screen flex flex-col">
					{/* Main Content */}
					{children}
				</main>
			</body>
		</html>
	);
}
