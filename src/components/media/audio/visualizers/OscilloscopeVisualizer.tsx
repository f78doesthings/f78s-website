/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { createGradient } from "../../../../scripts/utils/canvas";
import { AudioVisualizer, visualizerColors, type VisualizerProps } from "./AudioVisualizer";

/** A visualizer that displays the audio waveform. */
export function OscilloscopeVisualizer(props: VisualizerProps) {
	return (
		<AudioVisualizer
			{...props}
			init={({ analyser }) => {
				analyser.fftSize = 2048;
				return new Float32Array(analyser.fftSize);
			}}
			draw={({ analyser, ctx, data }) => {
				const width = ctx.canvas.width;
				const height = ctx.canvas.height;
				const renderScale = Number(ctx.canvas.dataset.renderScale ?? 1) || 1;
				const bufferLength = data.length;
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
				const path = new Path2D();
				path.moveTo(0, height / 2);
				for (let i = 0; i < bufferLength; i++) {
					const v = data[i] * (height / 2);
					const x = width * (i / (bufferLength - 1));
					const y = height / 2 + v * 2;

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
				path.lineTo(width, height / 2);
				ctx.stroke();
				ctx.fill(path);
			}}
		/>
	);
}
