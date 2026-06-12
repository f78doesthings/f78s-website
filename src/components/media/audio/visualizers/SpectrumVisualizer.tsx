/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { clamp } from "../../../../scripts/utils";
import { createGradient, drawLine } from "../../../../scripts/utils/canvas";
import { AudioVisualizer, visualizerGradients, type VisualizerProps } from "./AudioVisualizer";

/** A visualizer that displays the audio spectrum. */
export function SpectrumVisualizer(props: VisualizerProps) {
	//#region Spectrum settings

	// Slope settings derived from the default in Voxengo SPAN
	/** Slope amount per octave (dB) */
	const slope = 4.5;

	/** Slope center frequency (Hz) */
	const slopeCenter = 1000;

	/** Lowest displayed frequency (Hz) */
	const minFreq = 10;

	// Not much point in going higher because of the filter cutoff from the 128kbps AAC files
	// that this website uses
	/** Highest displayed frequency (Hz) */
	const maxFreq = 16000;

	/** Highest displayed volume (dBFS) */
	const maxVol = 0;

	/** Lowest displayed volume (dBFS) */
	const minVol = -144;

	//#endregion

	return (
		<AudioVisualizer
			{...props}
			init={({ analyser }) => {
				analyser.fftSize = 8192;
				analyser.smoothingTimeConstant = 0.875;
				return new Float32Array(analyser.frequencyBinCount);
			}}
			draw={({ analyser, ctx, data }) => {
				const width = ctx.canvas.width;
				const height = ctx.canvas.height;
				const renderScale = Number(ctx.canvas.dataset.renderScale ?? 1) || 1;
				const bufferLength = data.length;
				analyser.getFloatFrequencyData(data);

				const fontSize = Math.ceil(renderScale * 10 + height / 200);
				const textPadding = Math.ceil(fontSize / 5);
				const textMargin = Math.floor(fontSize / 2);
				const minX = Math.log10(minFreq + 1);
				const maxX = Math.log10(maxFreq + 1);

				/** Gets the appropriate X coordinate for the given frequency. */
				const getX = (frequency: number) =>
					((Math.log10(frequency + 1) - minX) / (maxX - minX)) * width;

				/** Gets the appropriate Y coordinate for the given volume (in dBFS). */
				const getY = (decibels: number) => ((decibels - maxVol) / (minVol - maxVol)) * height;

				const drawLegend = (text: string, x: number, y: number) => {
					// Clear an area around the text for legibility
					const metrics = ctx.measureText(text);
					ctx.clearRect(
						x - metrics.actualBoundingBoxLeft - textPadding,
						y - metrics.actualBoundingBoxAscent - textPadding,
						metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight + textPadding * 2,
						metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + textPadding * 2,
					);

					ctx.lineWidth = textPadding;
					ctx.fillText(text, x, y);
				};

				// Clear canvas
				ctx.clearRect(0, 0, width, height);

				// Draw frequency lines
				ctx.lineJoin = "round";
				ctx.fillStyle = "hsl(0, 0%, 50%)";
				ctx.font = `${fontSize}px "Cascadia Code", monospace`;
				ctx.textAlign = "center";
				ctx.textBaseline = "top";

				for (let baseFreq = 10; baseFreq < maxFreq; baseFreq *= 10) {
					for (let multiplier = 2; multiplier <= 10; multiplier++) {
						const frequency = baseFreq * multiplier;
						const x = Math.round(getX(frequency));

						ctx.strokeStyle =
							multiplier === 10 ? "hsla(0, 0%, 50%, 0.45)" : "hsla(0, 0%, 50%, 0.3)";
						ctx.lineWidth = renderScale;
						drawLine(ctx, x, 0, x, height);

						if (multiplier === 10) {
							drawLegend(
								`${frequency >= 1000 ? frequency / 1000 + "k" : frequency.toString()}Hz`,
								x,
								textMargin,
							);
						}
					}
				}

				// Draw volume lines
				const volumeLineSpacing = 48 * 2 ** -Math.round(height / renderScale / 360);
				ctx.textAlign = "left";
				ctx.textBaseline = "middle";

				for (
					let decibels =
						Math.round((maxVol - volumeLineSpacing) / volumeLineSpacing) * volumeLineSpacing;
					decibels > minVol;
					decibels -= volumeLineSpacing
				) {
					const y = Math.round(getY(decibels));
					ctx.strokeStyle = "hsla(0, 0%, 50%, 0.22)";
					ctx.lineWidth = renderScale;
					drawLine(ctx, 0, y, width, y);
					drawLegend(`${decibels}dB`, textMargin, y);
				}

				// Spectrum gradient
				const strokeGradient = createGradient(ctx, visualizerGradients.Lit);
				const fillGradient = createGradient(ctx, visualizerGradients.Lit, {
					setAlpha: (offset) => 24 + 30 * offset ** 0.9,
				});

				// Draw spectrum path
				let prevX = 0;
				let prevY = 0;
				let prevCurveX = 0;
				let prevCurveY = 0;
				const maxThickness = renderScale + (width + height) / 640;
				let prevThickness = maxThickness;

				const path = new Path2D();
				ctx.strokeStyle = strokeGradient;
				ctx.lineWidth = maxThickness;
				ctx.beginPath();

				const halfSampleRate = analyser.context.sampleRate / 2;
				const floor = height - getX(0);
				for (let i = 0; i < bufferLength; i++) {
					const frequency = (i / bufferLength) * halfSampleRate;
					const decibels = data[i] + slope * Math.log2(frequency / slopeCenter);
					const x = getX(frequency);
					const y = isFinite(decibels) ? getY(decibels) : floor;

					if (i === 0) {
						ctx.moveTo(x, y);
						path.moveTo(x, y);
						prevCurveX = x;
						prevCurveY = y;
					} else {
						// Crudely approximate a smooth curve, probably should be replaced at some point
						// Adapted from https://stackoverflow.com/questions/7054272/how-to-draw-smooth-curve-through-n-points-using-javascript-html5-canvas#7058606
						const cx = (prevX + x) / 2;
						const cy = (prevY + y) / 2;

						// Make the line progressively thinner as the frequencies get closer together,
						// in order to improve detail (the formula could probably be improved though)
						const thickness =
							clamp(((x - prevX) * (1.9 / renderScale)) ** 0.38 / 1.9, 0.05, 1) * maxThickness;
						if (prevThickness - thickness > 0.05 + prevThickness / 40) {
							ctx.stroke();
							ctx.lineWidth = thickness;
							prevThickness = thickness;

							// Start a new curve where the previous one ended off
							ctx.beginPath();
							ctx.moveTo(prevCurveX, prevCurveY);
						}

						ctx.quadraticCurveTo(prevX, prevY, cx, cy);
						path.quadraticCurveTo(prevX, prevY, cx, cy);
						prevCurveX = cx;
						prevCurveY = cy;
					}

					// Exit early if the frequency is off-screen to improve performance
					if (x > width) {
						break;
					}

					prevX = x;
					prevY = y;
				}

				// Finish the path and fill in the spectrum
				path.lineTo(width, height); // bottom right
				path.lineTo(0, height); // bottom left
				path.closePath();
				ctx.fillStyle = fillGradient;
				ctx.stroke();
				ctx.fill(path);
			}}
		></AudioVisualizer>
	);
}
