"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import {
	FaHome,
	FaMap,
	FaInfoCircle,
	FaCog,
	FaDatabase,
	FaSignInAlt,
	FaSignOutAlt,
	FaPortrait,
} from "react-icons/fa";

interface NavMenuLinkProps {
	href: string;
	label: React.ReactNode;
	icon?: React.ReactNode; // Add an optional icon prop
	className?: string;
}

function NavMenuLink({ href, label, icon, className }: NavMenuLinkProps) {
	const pathname = usePathname();
	const isActive = pathname === href;

	return (
		<Link href={href}>
			<div
				className={`${className} px-3 py-2 rounded-full cursor-pointer transition duration-300 flex flex-col items-center gap-2 ${
					isActive
						? "bg-white/70 text-green-400"
						: "text-white hover:bg-white/20"
				}`}
			>
				{icon} {/* Render the icon */}
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
			<div className="w-fit bg-black text-white backdrop-blur-lg flex gap-1 items-center p-2 text-sm rounded-full shadow-xl font-semibold pointer-events-auto">
				<NavMenuLink
					href="/"
					label="CacheGrab"
					icon={<FaHome />} // Add an icon
					className="rock-font font-normal"
				/>
				<NavMenuLink
					href="/caches"
					label="Caches"
					icon={<FaDatabase />}
				/>
				<NavMenuLink href="/map" label="Map" icon={<FaMap />} />
				<NavMenuLink
					href="/about"
					label="About"
					icon={<FaInfoCircle />}
				/>
				<NavMenuLink href="/manage" label="Manage" icon={<FaCog />} />
				<NavMenuLink
					href="/profile"
					label="Profile"
					icon={<FaPortrait />}
				/>
				<NavMenuLink
					href="/login"
					label="Sign In"
					icon={<FaSignInAlt />}
				/>
			</div>
		</nav>
	);
}
