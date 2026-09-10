/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

//#region Gradient helpers

interface GradientSettings {
	/** Whether to mirror the gradient. */
	mirrored?: boolean;

	/** The pixel coordinates of the gradient. */
	coords?: [fromX: number, fromY: number, toX: number, toY: number];

	/** Sets the alpha to the returned value for the given offset. */
	setAlpha?: (offset: number) => number;
}

/**
 * Creates a linear gradient with evenly spaced colours.
 *
 * @param ctx The canvas context.
 * @param colors The colours in hex format. Cannot have an alpha value if setAlpha is set.
 */
export function createGradient(
	ctx: CanvasRenderingContext2D,
	colors: string | string[],
	{ mirrored, coords = [0, ctx.canvas.height, 0, 0], setAlpha }: GradientSettings = {},
) {
	const gradient = ctx.createLinearGradient(...coords);
	if (typeof colors === "string") {
		colors = [colors, colors];
	} else if (colors.length < 2) {
		throw new RangeError("Arrays passed to `colors` must contain at least 2 elements");
	}

	for (let i = 0; i < colors.length; i++) {
		let color = colors[i];
		if (setAlpha && !/#[\da-f]{6}/.test(color)) {
			throw new Error(`Expected a hex color (#xxxxxx) at index ${i}: ${color}`);
		}

		const offset = i / (colors.length - 1);
		if (setAlpha) {
			color += Math.round(setAlpha(offset)).toString(16);
		}

		if (mirrored) {
			gradient.addColorStop(0.5 + offset / 2, color);
			if (i > 0) {
				gradient.addColorStop(0.5 - offset / 2, color);
			}
		} else {
			gradient.addColorStop(offset, color);
		}
	}
	return gradient;
}

//#endregion

//#region Drawing extensions

export function drawLine(
	ctx: CanvasRenderingContext2D,
	fromX: number,
	fromY: number,
	toX: number,
	toY: number,
) {
	ctx.beginPath();
	ctx.moveTo(fromX, fromY);
	ctx.lineTo(toX, toY);
	ctx.stroke();
}

//#endregion
