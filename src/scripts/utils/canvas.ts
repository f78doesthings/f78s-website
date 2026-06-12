/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

//#region Gradients

interface GradientSettings {
	mirrored?: boolean;
	coords?: [fromX: number, fromY: number, toX: number, toY: number];
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
	colors: string[],
	{ mirrored, coords = [0, ctx.canvas.height, 0, 0], setAlpha }: GradientSettings = {},
) {
	const gradient = ctx.createLinearGradient(...coords);

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

//#region Automatic resizing

interface CanvasScaleSettings {
	renderScale?: () => number;
	dpiFactor?: () => number;
	onResize?: (data: CanvasSizeData) => void;
}

interface CanvasSizeData {
	/** The base width of the canvas. */
	elementWidth: number;

	/** The height of the canvas. */
	elementHeight: number;

	/** The width the canvas will now render at. */
	renderWidth: number;

	/** The height the canvas will now render at. */
	renderHeight: number;

	/** The scaled pixel ratio. */
	scaledPixelRatio: number;

	/** The final render scale. */
	renderScale: number;
}

const canvasScaleSettings = new Map<HTMLCanvasElement, CanvasScaleSettings>();
let resizeObserver: ResizeObserver | undefined;

function resizeCanvas(
	canvas: HTMLCanvasElement,
	elementWidth: number,
	elementHeight: number,
	settings: CanvasScaleSettings = {},
) {
	const scaledPixelRatio =
		window.devicePixelRatio > 1
			? 1 + (window.devicePixelRatio - 1) * (settings.dpiFactor?.() ?? 1)
			: window.devicePixelRatio;
	const renderScale = (settings.renderScale?.() ?? 1) * scaledPixelRatio;

	const renderWidth = Math.round(elementWidth * renderScale);
	const renderHeight = Math.round(elementHeight * renderScale);

	if (
		renderWidth > 0 &&
		renderHeight > 0 &&
		(canvas.width !== renderWidth || canvas.height !== renderHeight)
	) {
		canvas.width = renderWidth;
		canvas.height = renderHeight;
		settings.onResize?.({
			elementWidth,
			elementHeight,
			renderWidth,
			renderHeight,
			scaledPixelRatio,
			renderScale,
		});
	}
}

/**
 * Automatically updates the width and height of the canvas when it resizes.
 *
 * Returns a function to stop resizing the canvas.
 */
export function autoResizeCanvas(canvas: HTMLCanvasElement, settings?: CanvasScaleSettings) {
	resizeObserver ??= new ResizeObserver((entries) => {
		for (const entry of entries) {
			const size = entry.contentBoxSize?.[0];
			if (!size) {
				continue;
			}

			const target = entry.target;
			if (!(target instanceof HTMLCanvasElement)) {
				continue;
			}

			resizeCanvas(target, size.inlineSize, size.blockSize, canvasScaleSettings.get(target));
		}
	});
	resizeObserver.observe(canvas);

	if (settings) {
		canvasScaleSettings.set(canvas, settings);
	}

	const rect = canvas.getBoundingClientRect();
	resizeCanvas(canvas, rect.width, rect.height, settings);
	return () => {
		resizeObserver?.unobserve(canvas);
		canvasScaleSettings.delete(canvas);
	};
}

//#endregion
