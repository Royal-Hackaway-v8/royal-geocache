import { AuthProvider } from "@/context/AuthContext";
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
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="gradient-background">
				<AuthProvider>
					<main className="min-h-screen flex flex-col">
						<NavMenu />
						<div>{children}</div>
					</main>
				</AuthProvider>
			</body>
		</html>
	);
}
