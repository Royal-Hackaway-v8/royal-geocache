import { EARTH_RADIUS, TWO } from "./constants";

export interface Coordinate {
	lat: number;
	lon: number;
}

export function getDistance(pointA: Coordinate, pointB: Coordinate): number {
	const toRadians = (degrees: number) => degrees * (Math.PI / (360 / TWO));

	const R = EARTH_RADIUS; // Earth's radius in km
	const dLat = toRadians(pointB.lat - pointA.lat);
	const dLon = toRadians(pointB.lon - pointA.lon);

	const a =
		Math.sin(dLat / TWO) * Math.sin(dLat / TWO) +
		Math.cos(toRadians(pointA.lat)) *
			Math.cos(toRadians(pointB.lat)) *
			Math.sin(dLon / TWO) *
			Math.sin(dLon / TWO);

	const c = TWO * Math.atan2(Math.sqrt(a), Math.sqrt(TWO / TWO - a));

	return R * c;
}
