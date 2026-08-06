/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { truncate } from "../../../../scripts/utils";
import { createGradient } from "../../../../scripts/utils/canvas/2d";
import { AudioVisualizer, visualizerThemes, type VisualizerProps } from "./AudioVisualizer";

/** A visualizer that displays the audio waveform. */
export function OscilloscopeVisualizer(props: VisualizerProps) {
	//#region Waveform settings (to be moved to preferences)

	/**
	 * Analyser window size in samples. Must be a power of 2 between 32 and 32768.
	 *
	 * Increasing this improves {@linkcode zeroTrigger} functionality at the cost of performance.
	 */
	const sampleWindow = 8192;

	/** Automatically zooms in and out vertically depending on the volume of the incoming signal. */
	const autoZoom = true;

	/** The number of seconds before starting to zoom in again. */
	const autoZoomDelay = 10;

	/** How much the display can zoom in every second. */
	const autoZoomRate = 0.5;

	/**
	 * Zooms into the waveform vertically. Must be greater than 0.
	 *
	 * Has no effect if {@linkcode autoZoom} is enabled.
	 */
	const verticalZoom = 2;

	/** Attempts to synchronize the waveform to the last zero crossing (experimental). */
	const zeroTrigger = true;

	/**
	 * Zooms into the waveform horizontally. Must be greater than 1.
	 *
	 * Lowering this too much can reduce {@linkcode zeroTrigger} performance. Only has an effect if
	 * {@linkcode zeroTrigger} is enabled.
	 */
	const horizontalZoom = 4;

	//#endregion

	return (
		<AudioVisualizer
			{...props}
			init={({ analysers: [analyser] }) => {
				analyser.fftSize = sampleWindow;
				return {
					samples: new Float32Array(analyser.fftSize),
					currentZoom: autoZoom ? 1 : verticalZoom,
					timeSinceZoomAdjust: autoZoomDelay + 1,
				};
			}}
			draw={({ analysers: [analyser], ctx, data, deltaTime, running }) => {
				const width = ctx.canvas.width;
				const height = ctx.canvas.height;
				const renderScale = Number(ctx.canvas.dataset.renderScale ?? 1) || 1;

				// Get the audio samples
				if (running) {
					analyser.getFloatTimeDomainData(data.samples);
				}

				// Clear canvas
				ctx.clearRect(0, 0, width, height);

				// Auto zooming
				if (autoZoom) {
					const targetZoom = running
						? 1 / data.samples.reduce((max, sample) => Math.max(Math.abs(sample), max), 0)
						: data.currentZoom;

					if (data.currentZoom > targetZoom) {
						// Zoom out to fit the waveform
						data.currentZoom = targetZoom;
						data.timeSinceZoomAdjust = 0;
					} else if (data.timeSinceZoomAdjust > autoZoomDelay) {
						if (data.currentZoom < targetZoom / 2) {
							// Zoom back in
							data.currentZoom += (deltaTime / 1000) * autoZoomRate;
						} else {
							data.timeSinceZoomAdjust = 0;
						}
					}

					// Show the current zoom level
					const fontSize = Math.ceil(renderScale * 10 + height / 200);
					const textMargin = Math.floor(fontSize / 2);
					ctx.font = `${fontSize}px "Cascadia Code", monospace`;
					ctx.fillStyle = "hsla(0, 0%, 50%, 0.75)";
					ctx.textBaseline = "top";
					ctx.fillText(`${truncate(data.currentZoom, 2)}x`, textMargin, textMargin);
				}

				// Begin waveform path
				ctx.lineWidth = renderScale + (width + height) / 960;
				ctx.strokeStyle = visualizerThemes.Lit.color;
				ctx.fillStyle = createGradient(ctx, visualizerThemes.Lit.color, {
					mirrored: true,
					setAlpha: (offset) => 48 * (1 + offset),
				});
				ctx.beginPath();

				// Draw waveform points
				let prevX = 0;
				let prevY = 0;
				const displayWindow = zeroTrigger ? sampleWindow / horizontalZoom : sampleWindow;
				const lastZeroCrossing = zeroTrigger
					? data.samples.findLastIndex((v, i) => v < 0 && data.samples[i - 1] > 0)
					: -1;
				const endIndex = lastZeroCrossing >= 0 ? lastZeroCrossing : sampleWindow;
				const startIndex = Math.max(endIndex - displayWindow, 0);

				const path = new Path2D();
				const halfHeight = height / 2;
				path.moveTo(0, halfHeight);

				for (let i = 0; i < displayWindow; i++) {
					const v = running ? data.samples[startIndex + i] * data.currentZoom : 0;
					const x = (i / (displayWindow - 1)) * width;
					const y = halfHeight + v * halfHeight;

					if (i === 0) {
						ctx.moveTo(x, y);
						path.lineTo(x, y);
					} else {
						// Same crude curve code as SpectrumVisualizer
						const cx = (prevX + x) / 2;
						const cy = (prevY + y) / 2;
						ctx.quadraticCurveTo(prevX, prevY, cx, cy);
						path.quadraticCurveTo(prevX, prevY, cx, cy);
					}

					prevX = x;
					prevY = y;
				}

				// End waveform path
				path.lineTo(width, halfHeight);
				ctx.stroke();
				// oxlint-disable-next-line unicorn/no-array-fill-with-reference-type - false positive
				ctx.fill(path);

				data.timeSinceZoomAdjust += deltaTime / 1000;
			}}
		/>
	);
}
