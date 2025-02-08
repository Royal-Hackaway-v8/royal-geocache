"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";

interface NavMenuLinkProps {
	href: string;
	label: React.ReactNode;
	className?: string;
}

function NavMenuLink({ href, label, className }: NavMenuLinkProps) {
	const pathname = usePathname();
	const isActive = pathname === href;

	return (
		<Link href={href}>
			<div
				className={`${className} p-2 px-4 rounded-full cursor-pointer transition duration-300 ${
					isActive
						? "bg-white/70 text-green-400"
						: "text-white hover:bg-white/20"
				}`}
			>
				{label}
			</div>
		</Link>
	);
}

export default function NavMenu() {
	const { user, signOutUser, loading } = useAuth();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<nav className="fixed top-4 w-full flex justify-center z-50 pointer-events-none">
			<div className="w-fit bg-black text-white backdrop-blur-lg flex gap-2 items-center p-2 text-sm rounded-full shadow-xl font-semibold pointer-events-auto">
				<NavMenuLink
					href="/"
					label="CacheGrab"
					className="rock-font font-normal"
				/>
				<NavMenuLink href="/caches" label="Caches" />
				<NavMenuLink href="/map" label="Map" />
				<NavMenuLink href="/about" label="About" />
				<NavMenuLink href="/manage" label="Manage" />

				{user && (
					<>
						<NavMenuLink href="/manage" label="Manage DB" />
						<NavMenuLink href="/read" label="Read from DB" />
						<NavMenuLink href="/write" label="Write to DB" />

						<button
							onClick={signOutUser}
							className="px-4 py-1 bg-red-500 text-white rounded-full shadow-xl cursor-pointer transition-colors hover:bg-red-600 disabled:opacity-50"
							disabled={loading}
						>
							Sign Out
						</button>
					</>
				)}

				<NavMenuLink href="/login" label="Sign In" />
			</div>
		</nav>
	);
}
