import { to2dIsometric } from "./isometric";

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
			x: size * point.x,
			y: size * point.y,
			z: size * point.z,
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
		for (const line of this.lines) {
			context.beginPath();
			context.strokeStyle = 'black';
			context.lineCap = 'round';
			context.lineJoin = 'round';

			const yAngle = Math.PI / 4;
			const xzAngle = this.animAmt * Math.PI / 2;
			const [start3d, end3d] = line;
			const start2d = to2dIsometric(start3d.x, start3d.y, start3d.z, xzAngle, yAngle);
			const end2d = to2dIsometric(end3d.x, end3d.y, end3d.z, xzAngle, yAngle);
			context.moveTo(start2d.x, start2d.y);
			context.lineTo(end2d.x, end2d.y);
			context.stroke();
		}
	}

}
