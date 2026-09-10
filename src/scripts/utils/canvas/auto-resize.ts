/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

//#region Automatic resizing

interface CanvasScaleSettings {
	/**
	 * Returns the canvas resolution scale to use.
	 *
	 * @default () => 1
	 */
	renderScale?: () => number;

	/**
	 * Returns how much the display's pixel density should affect the canvas resolution.
	 *
	 * @default () => 1
	 */
	dpiFactor?: () => number;

	/** A function that is called when the canvas is resized. */
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

interface CanvasResizer {
	/** Forces the canvas resolution to be updated. */
	update: () => void;

	/** Stops updating the canvas resolution. */
	destroy: () => void;
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

	const resizer: CanvasResizer = {
		update: () => {
			const rect = canvas.getBoundingClientRect();
			resizeCanvas(canvas, rect.width, rect.height, settings);
		},
		destroy: () => {
			resizeObserver?.unobserve(canvas);
			canvasScaleSettings.delete(canvas);
		},
	};

	resizer.update();
	return resizer;
}

//#endregion
