import { toIsometric } from "./isometric";
import { slurp, easeInOut } from "./util";

const DEG_TO_RAD = Math.PI / 180;
const PROJECTION_ANGLE = 35.264 * DEG_TO_RAD;

const hexSide = 100;
const hexHeight = Math.sqrt(3) * hexSide;
const hexWidth = 2 * hexSide;
const cubeSide = hexHeight * Math.SQRT2 / 4;

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

		this.lines = this.lines.map(line => line.map(point => ({
			x: cubeSide * point.x,
			y: cubeSide * point.y,
			z: cubeSide * point.z,
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
		this.renderCube(context, {x: 0, y: 0});
		
		// Debug: draw a hex
		context.beginPath();
		context.strokeStyle = 'red';
		for (let i = 0; i < 6; i++) {
			const amt = i / 6;
			const angle = 2 * Math.PI * amt + Math.PI / 2;
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
		context.save();
		context.translate(center.x, center.y);
		const cutOff = cubeSide * Math.SQRT1_2;
		for (const line of this.lines) {
			context.beginPath();
			context.strokeStyle = 'black';
			context.lineCap = 'round';
			context.lineJoin = 'round';

			const xzAngle =  rotateAmt * Math.PI / 2;
			const [start3d, end3d] = line;
			// SS = screen space (?)
			const startSS = toIsometric(start3d.x, start3d.y, start3d.z, xzAngle, PROJECTION_ANGLE);
			const endSS = toIsometric(end3d.x, end3d.y, end3d.z, xzAngle, PROJECTION_ANGLE);
			const midZ = (startSS.z + endSS.z) / 2;

			if (midZ < -cutOff || midZ > cutOff) {
				continue;
			}

			context.moveTo(startSS.x, startSS.y);
			context.lineTo(endSS.x, endSS.y);
			context.stroke();
		}
		context.restore();
	}

}
