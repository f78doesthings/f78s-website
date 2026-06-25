/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { createGradient } from "../../../../scripts/utils/canvas/2d";
import { AudioVisualizer, visualizerColors, type VisualizerProps } from "./AudioVisualizer";

/** A visualizer that displays the audio waveform. */
export function OscilloscopeVisualizer(props: VisualizerProps) {
	//#region Waveform settings (to be moved to preferences)

	/**
	 * Analyser window size in samples. Must be a power of 2 between 32 and 32768.
	 *
	 * Increasing this improves {@linkcode zeroTrigger} functionality at the cost of performance.
	 */
	const sampleWindow = 8192;

	/** Zooms into the waveform vertically. Must be greater than 0. */
	const verticalZoom = 2;

	/** Attempts to synchronize the waveform to the last zero crossing (experimental). */
	const zeroTrigger = true;

	/**
	 * Zooms into the waveform horizontally. Must be greater than 1.
	 *
	 * Lowering this too much can reduce {@linkcode zeroTrigger} performance.
	 */
	const horizontalZoom = 4;

	//#endregion

	return (
		<AudioVisualizer
			{...props}
			init={({ analyser }) => {
				analyser.fftSize = sampleWindow;
				return new Float32Array(analyser.fftSize);
			}}
			draw={({ analyser, ctx, data }) => {
				const width = ctx.canvas.width;
				const height = ctx.canvas.height;
				const renderScale = Number(ctx.canvas.dataset.renderScale ?? 1) || 1;
				analyser.getFloatTimeDomainData(data);

				// Clear canvas
				ctx.clearRect(0, 0, width, height);

				// Begin waveform path
				ctx.lineWidth = renderScale + (width + height) / 960;
				ctx.strokeStyle = visualizerColors.Red;
				ctx.fillStyle = createGradient(ctx, [visualizerColors.Red, visualizerColors.Red], {
					mirrored: true,
					setAlpha: (offset) => 48 * (1 + offset),
				});
				ctx.beginPath();

				// Draw waveform points
				let prevX = 0;
				let prevY = 0;
				const displayWindow = zeroTrigger ? sampleWindow / horizontalZoom : sampleWindow;
				const lastZeroCrossing = zeroTrigger
					? data.findLastIndex((v, i) => v < 0 && data[i - 1] > 0)
					: -1;
				const endIndex = lastZeroCrossing >= 0 ? lastZeroCrossing : sampleWindow;
				const startIndex = Math.max(endIndex - displayWindow, 0);

				const path = new Path2D();
				const halfHeight = height / 2;
				path.moveTo(0, halfHeight);

				for (let i = 0; i < displayWindow; i++) {
					const v = data[startIndex + i] * verticalZoom;
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
			}}
		/>
	);
}
