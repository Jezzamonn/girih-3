import { toIsometric } from "./isometric";
import { slurp, easeInOut } from "./util";

const PROJECTION_ANGLE = Math.atan(Math.SQRT1_2);

const hexSide = 35;
const hexHeight = 2 * hexSide;
const hexWidth = Math.sqrt(3) * hexSide;
const cubeSide = hexHeight * Math.SQRT2 / 2;
// const cubeSizeHackAmt = 

export default class Controller {

	constructor() {
		this.animAmt = 0;
		this.period = 9;

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
		context.save();

		const stage = Math.floor(3 * this.animAmt);
		const subAnimAmt = 0;//(3 * this.animAmt) % 1;
		
		context.rotate(stage * 2 * Math.PI / 3);

		const rotateAmt = easeInOut(subAnimAmt) + 0.5;

		this.renderCubes(context, rotateAmt);

		context.restore();
	}

	renderCubeSet(context, center, rotateAmt) {
		const directions = [
			{x: 1, y: 0, z: 0},
			{x: -1, y: 0, z: 0},
			{x: 0, y: 1, z: 0},
			{x: 0, y: -1, z: 0},
			{x: 0, y: 0, z: 1},
			{x: 0, y: 0, z: -1},
		];
		const xzAngle = rotateAmt * Math.PI / 2;

		const points = this.getCubePoints(rotateAmt);

		const screenSpacePoints = directions.map(p => ({
			x: 2 * cubeSide * p.x,
			y: 2 * cubeSide * p.y,
			z: 2 * cubeSide * p.z,
		})).map(p => toIsometric(p.x, p.y, p.z, xzAngle, PROJECTION_ANGLE));
		screenSpacePoints.sort((a, b) => a.z - b.z);

		context.save();
		context.translate(center.x, center.y);
		for (const dirSS of screenSpacePoints) {
			this.renderShape(context, points, dirSS);
		}
		context.restore();
	}

	/**
	 * @param {!CanvasRenderingContext2D} context
	 */
	renderCubes(context, rotateAmt) {
		const halfLayers = 5;
		for (let y = -halfLayers; y <= halfLayers; y++) {
			for (let x = -halfLayers; x <= halfLayers; x++) {
				var adjustedY = x % 2 == 0 ? y : y + 0.5;
				this.renderCubeSet(
					context,
					{
						x: 3.465 * hexWidth * x,
						y: 3.465 * hexHeight * adjustedY,
					},
					rotateAmt
				);
			}
		}
	}

	/**
	 * @param {!CanvasRenderingContext2D} context
	 */
	renderShape(context, points, center) {
		context.save();
		context.translate(center.x, center.y);

		context.beginPath();
		context.fillStyle = 'white';
		context.strokeStyle = 'black';
		context.lineCap = 'round';
		context.lineJoin = 'round';
		for (let i = 0; i < points.length; i++) {
			if (i == 0) {
				context.moveTo(points[i].x, points[i].y);
			}
			else {
				context.lineTo(points[i].x, points[i].y);
			}
		}

		context.closePath();
		context.fill();
		context.stroke();

		// draw a debug hex thing?
		context.beginPath();
		context.strokeStyle = 'red';
		for (let i = 0; i < 6; i ++) {
			const amt = i / 6;
			const angle = 2 * Math.PI * (amt + 0.25);
			const x = hexSide * Math.cos(angle);
			const y = hexSide * Math.sin(angle);
			if (i == 0) {
				context.moveTo(x, y);
			}
			else {
				context.lineTo(x, y);
			}
		}
		context.closePath();
		context.stroke();

		context.restore();
	}

	getCubePoints(rotateAmt) {
		const xzAngle = rotateAmt * Math.PI / 2;

		const screenSpacePoints = this.points.map(p => toIsometric(p.x, p.y, p.z, xzAngle, PROJECTION_ANGLE));

		let mostZPointSS = null;
		let leastZPointSS = null;
		for (const pointSS of screenSpacePoints) {
			if (mostZPointSS == null || pointSS.z > mostZPointSS.z) {
				mostZPointSS = pointSS;
			}
			if (leastZPointSS == null || pointSS.z < leastZPointSS.z) {
				leastZPointSS = pointSS;
			}
		}

		const drawPoints = screenSpacePoints.filter(p => p != leastZPointSS && p != mostZPointSS);
		// Sort them based on their angle around the center. Either anti-clockwise or clockwise, I'm not sure.
		drawPoints.sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));

		return drawPoints;
	}

}

function pointsAreEqual(p1, p2) {
	return p1.x == p2.x && p1.y == p2.y && p1.z == p2.z;
}