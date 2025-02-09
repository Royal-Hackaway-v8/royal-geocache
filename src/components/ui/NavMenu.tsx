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
	FaSignInAlt,
	FaPortrait,
	FaBars,
	FaTimes,
} from "react-icons/fa";
import { GiPodiumWinner } from "react-icons/gi";

import { subscribeToUser } from "@/services/userService";
import { AppUser } from "@/types";
import React from "react";

interface NavMenuLinkProps {
	href: string;
	label: React.ReactNode;
	icon?: React.ElementType;
	className?: string;
}

function NavMenuLink({ href, label, icon: Icon, className }: NavMenuLinkProps) {
	const pathname = usePathname();
	const isActive = pathname === href;

	return (
		<Link href={href}>
			<div
				className={`${className} w-24 px-3 py-2 rounded-full cursor-pointer transition duration-300 flex flex-row md:flex-col items-center gap-1 text-center ${
					isActive
						? "bg-white/70 text-green-400"
						: "text-white hover:bg-white/20"
				}`}
			>
				{Icon && React.createElement(Icon, { size: 16 })}
				<span className="whitespace-nowrap">{label}</span>
			</div>
		</Link>
	);
}

export default function NavMenu() {
	const { user } = useAuth();
	const [mounted, setMounted] = useState(false);
	const [appUser, setAppUser] = useState<AppUser | null>(null);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	useEffect(() => {
		setMounted(true);
		if (user?.uid) {
			const unsubscribe = subscribeToUser(
				user.uid,
				(fetchedUser: AppUser | null) => {
					setAppUser(fetchedUser);
				}
			);
			return () => unsubscribe();
		}
	}, [user]);

	// Define the nav links for reuse with icon identifiers
	const navLinks = (
		<>
			<NavMenuLink
				href="/"
				label="CacheGrab"
				icon={FaHome}
				className="rock-font font-normal"
			/>
			<NavMenuLink href="/map" label="Map" icon={FaMap} />
			<NavMenuLink href="/about" label="About" icon={FaInfoCircle} />
			<NavMenuLink
				href="/leaderboard"
				label="Leaderboard"
				icon={GiPodiumWinner}
			/>
			{mounted && appUser?.isStaff && (
				<NavMenuLink href="/manage" label="Manage" icon={FaCog} />
			)}
			{mounted &&
				(user ? (
					<NavMenuLink
						href="/profile"
						label="Profile"
						icon={FaPortrait}
					/>
				) : (
					<NavMenuLink
						href="/login"
						label="Sign In"
						icon={FaSignInAlt}
					/>
				))}
		</>
	);

	return (
		<>
			{/* Mobile Toggle Button */}
			<div className="fixed top-4 left-4 z-50 md:hidden">
				<button
					onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
					className="bg-black text-white p-2 rounded-full backdrop-blur-lg shadow-xl"
				>
					{isMobileMenuOpen ? <FaTimes /> : <FaBars />}
				</button>
			</div>

			{/* Desktop Menu */}
			<nav className="hidden md:flex fixed top-4 w-full justify-center z-50 pointer-events-none px-2">
				<div className="max-w-[90%] w-fit bg-black text-white backdrop-blur-lg flex gap-0 items-center p-2 text-sm rounded-full shadow-xl font-semibold pointer-events-auto overflow-x-auto whitespace-nowrap">
					{navLinks}
				</div>
			</nav>

			{/* Mobile Menu Panel */}
			{isMobileMenuOpen && (
				<nav className="md:hidden fixed top-16 left-4 right-4 bg-black text-white backdrop-blur-lg rounded-lg shadow-xl z-40 pointer-events-auto p-4">
					<div className="flex flex-col gap-2">{navLinks}</div>
				</nav>
			)}
		</>
	);
}
