export interface Coordinate {
	lat: number;
	lon: number;
}

export function getDistance(pointA: Coordinate, pointB: Coordinate): number {
	const toRadians = (degrees: number) => degrees * (Math.PI / 180);

	const R = 6371; // Earth's radius in km
	const dLat = toRadians(pointB.lat - pointA.lat);
	const dLon = toRadians(pointB.lon - pointA.lon);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRadians(pointA.lat)) *
			Math.cos(toRadians(pointB.lat)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c;
}
