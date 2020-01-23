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
					this.points.push({
						x: size * x,
						y: size * y,
						z: size * z,
					});
				}
			}
		}

		this.lines = [];
		for (let i = 0; i < this.points.length; i++) {
			for (let j = i + 1; j < this.points.length; j++) {
				this.lines.push([this.points[i], this.points[j]]);
			}
		}
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

			const [start3d, end3d] = line;
			const start2d = to2dIsometric(start3d.x, start3d.y, start3d.z);
			const end2d = to2dIsometric(end3d.x, end3d.y, end3d.z);
			context.moveTo(start2d.x, start2d.y);
			context.lineTo(end2d.x, end2d.y);
			context.stroke();
		}
	}

}
