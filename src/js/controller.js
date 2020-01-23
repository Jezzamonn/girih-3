import { toIsometric } from "./isometric";
import { slurp } from "./util";

const hexSide = 35;
const hexHeight = Math.sqrt(3) * hexSide;
const hexWidth = 2 * hexSide;
const cubeSide = hexWidth * Math.SQRT2 / 4;

export default class Controller {

	constructor() {
		this.animAmt = 0;
		this.period = 3;

		const size = 100;
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
		this.renderCubes(context);
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
						x: hexWidth * adjustedX,
						y: hexHeight * y
					}
				);
			}
		}
	}

	/**
	 * @param {!CanvasRenderingContext2D} context
	 */
	renderCube(context, center) {
		context.save();
		context.translate(center.x, center.y);
		const cutOff = cubeSide * Math.SQRT1_2;
		for (const line of this.lines) {
			context.beginPath();
			context.strokeStyle = 'black';
			context.lineCap = 'round';
			context.lineJoin = 'round';

			const yAngle = Math.PI / 4;
			const xzAngle = this.animAmt * Math.PI / 2;
			const [start3d, end3d] = line;
			// SS = screen space (?)
			const startSS = toIsometric(start3d.x, start3d.y, start3d.z, xzAngle, yAngle);
			const endSS = toIsometric(end3d.x, end3d.y, end3d.z, xzAngle, yAngle);
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
