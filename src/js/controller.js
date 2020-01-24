import { toIsometric } from "./isometric";
import { slurp, easeInOut } from "./util";

const PROJECTION_ANGLE = Math.atan(Math.SQRT1_2);

const hexSide = 35;
const hexHeight = Math.sqrt(3) * hexSide;
const hexWidth = 2 * hexSide;
const cubeSide = hexHeight * Math.SQRT2 / 2;

export default class Controller {

	constructor() {
		this.animAmt = 0;
		this.period = 3;

		this.points = [];
		for (const x of [-1, 1]) {
			for (const y of [-1, 1]) {
				for (const z of [-1, 1]) {
					this.points.push({x, y, z});
				}
			}
		}

		this.lines = [];
		for (let i = 0; i < this.points.length; i++) {
			for (let j = i + 1; j < this.points.length; j++) {
				const p1 = this.points[i];
				const p2 = this.points[j];
				const dist = 
					Math.abs(p1.x - p2.x) + 
					Math.abs(p1.y - p2.y) + 
					Math.abs(p1.z - p2.z);
				if (dist != 2) {
					continue;
				}
				this.lines.push([this.points[i], this.points[j]]);
			}
		}

		this.points = this.points.map(point => ({
			x: 0.5 * cubeSide * point.x,
			y: 0.5 * cubeSide * point.y,
			z: 0.5 * cubeSide * point.z,
		}));
		this.lines = this.lines.map(line => line.map(point => ({
			x: 0.5 * cubeSide * point.x,
			y: 0.5 * cubeSide * point.y,
			z: 0.5 * cubeSide * point.z,
		})));
	}

	/**
	 * Simulate time passing.
	 *
	 * @param {number} dt Time since the last frame, in seconds 
	 */
	update(dt) {
		this.animAmt += dt / this.period;
		this.animAmt %= 1;
	}

	/**
	 * Render the current state of the controller.
	 *
	 * @param {!CanvasRenderingContext2D} context
	 */
	render(context) {
		this.renderCubeSet(context, {x: 0, y: 0});
	}

	renderCubeSet(context, center) {
		const directions = [
			{x: 1, y: 0, z: 0},
			{x: -1, y: 0, z: 0},
			{x: 0, y: 1, z: 0},
			{x: 0, y: -1, z: 0},
			{x: 0, y: 0, z: 1},
			{x: 0, y: 0, z: -1},
		].map(p => ({
			x: 2 * cubeSide * p.x,
			y: 2 * cubeSide * p.y,
			z: 2 * cubeSide * p.z,
		}));
		for (const dir of directions) {
			const dirSS = toIsometric(dir.x, dir.y, dir.z, Math.PI / 4, PROJECTION_ANGLE);
			this.renderCube(context, dirSS);
		}
	}

	/**
	 * @param {!CanvasRenderingContext2D} context
	 */
	renderCubes(context) {
		const halfLayers = 5;
		for (let y = -halfLayers; y <= halfLayers; y++) {
			for (let x = -halfLayers; x <= halfLayers; x++) {
				var adjustedX = y % 2 == 0 ? x : x + 0.5;
				if (y % 2 == 0) {
					if (x % 3 == 0) {
						continue;
					}
				}
				else {
					if ((x + 2) % 3 == 0) {
						continue;
					}
				}
				this.renderCube(
					context,
					{
						y: hexWidth * adjustedX,
						x: hexHeight * y
					}
				);
			}
		}
	}

	/**
	 * @param {!CanvasRenderingContext2D} context
	 */
	renderCube(context, center) {
		const rotateAmt = 0.5;//easeInOut(this.animAmt) + 0.5;
		const xzAngle = rotateAmt * Math.PI / 2;
		context.save();
		context.translate(center.x, center.y);

		let mostZPoint = null;
		let mostZPointSS = null;
		let leastZPoint = null;
		let leastZPointSS = null;
		for (const point3d of this.points) {
			const pointSS = toIsometric(point3d.x, point3d.y, point3d.z, xzAngle, PROJECTION_ANGLE);
			if (mostZPoint == null || pointSS.z > mostZPointSS.z) {
				mostZPoint = point3d;
				mostZPointSS = pointSS;
			}
			if (leastZPoint == null || pointSS.z < leastZPointSS.z) {
				leastZPoint = point3d;
				leastZPointSS = pointSS;
			}
		}

		for (const line of this.lines) {
			context.beginPath();
			context.strokeStyle = 'black';
			context.lineCap = 'round';
			context.lineJoin = 'round';

			const [start3d, end3d] = line;
			if (pointsAreEqual(start3d, mostZPoint) ||
				pointsAreEqual(start3d, leastZPoint) ||
				pointsAreEqual(end3d, mostZPoint) ||
				pointsAreEqual(end3d, leastZPoint)) {
				continue;
			}

			// SS = screen space (?)
			const startSS = toIsometric(start3d.x, start3d.y, start3d.z, xzAngle, PROJECTION_ANGLE);
			const endSS = toIsometric(end3d.x, end3d.y, end3d.z, xzAngle, PROJECTION_ANGLE);

			context.moveTo(startSS.x, startSS.y);
			context.lineTo(endSS.x, endSS.y);
			context.stroke();
		}
		context.restore();
	}

}

function pointsAreEqual(p1, p2) {
	return p1.x == p2.x && p1.y == p2.y && p1.z == p2.z;
}
