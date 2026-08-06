/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { createGradient, drawLine } from "../../../../scripts/utils/canvas/2d";
import { AudioVisualizer, visualizerThemes, type VisualizerProps } from "./AudioVisualizer";

interface MeterChannelState {
	/** The meter value of the previous frame in dBFS. */
	prevValue: number;

	/** The most recent highest volume reached in dBFS. */
	maxPeak: number;

	/** The number of seconds since the last highest peak. */
	timeSincePeak: number;

	/** The number of seconds since the last time this channel went above 0 dBFS. */
	timeSinceClipping: number;
}

/** A visualizer that displays the audio waveform. */
export function MeterVisualizer(props: VisualizerProps) {
	//#region Visualizer settings (to be moved to preferences)

	/**
	 * Analyser window size in samples. Must be a power of 2 between 32 and 32768.
	 *
	 * Increasing this improves the meter's accuracy, especially at lower framerates, at the cost of
	 * performance.
	 */
	const sampleWindow = 2048;

	// Meter
	const volumeRange = 48;
	const reductionRate = 12;
	const weight = 2;

	// Clipping
	const clippingHighlightTime = 0.5;
	const aboveZeroHeight = 0.05;

	// Peak display
	const peakDropDelay = 3;
	const peakDropRate = 24;

	//#endregion

	/** How much of the width should be taken up by the bars. */
	const BAR_PERCENT = 0.55;

	return (
		<AudioVisualizer
			{...props}
			stereo
			init={({ analysers }) => {
				const sampleArrays: Float32Array<ArrayBuffer>[] = [];
				const states: MeterChannelState[] = [];
				for (const analyser of analysers) {
					analyser.fftSize = sampleWindow;
					sampleArrays.push(new Float32Array(analyser.fftSize));
					states.push({
						prevValue: -Infinity,
						maxPeak: -Infinity,
						timeSincePeak: peakDropDelay + 1,
						timeSinceClipping: clippingHighlightTime + 1,
					});
				}

				return { sampleArrays, states };
			}}
			draw={({ analysers, ctx, deltaTime, data, running }) => {
				const width = ctx.canvas.width;
				const height = ctx.canvas.height;
				const dtSeconds = deltaTime / 1000;
				const renderScale = Number(ctx.canvas.dataset.renderScale ?? 1) || 1;
				const barWidth = Math.floor((width / analysers.length) * BAR_PERCENT);

				const getY = (decibels: number) => {
					if (decibels > 0) {
						return height * aboveZeroHeight * 0.5 ** decibels;
					} else if (decibels < -volumeRange) {
						return height;
					}

					let percent = decibels / -volumeRange;
					const sqrtPercent = Math.sqrt(percent);
					percent = sqrtPercent * percent ** (1 / weight) + (1 - sqrtPercent) * percent;

					return (aboveZeroHeight + percent * (1 - aboveZeroHeight)) * height;
				};

				// Clear canvas
				ctx.clearRect(0, 0, width, height);

				// Draw volume lines
				const fontSize = Math.ceil(renderScale * 7 + ((width + height / 16) / 16) ** 0.875);
				let volumeLineSpacing =
					2 ** (Math.ceil(Math.log2(volumeRange)) - Math.round(height / renderScale / 480) - 5) * 3;

				ctx.font = `${fontSize}px "Cascadia Code", monospace`;
				ctx.textBaseline = "middle";
				ctx.fillStyle = "hsl(0, 0%, 50%)";
				let legendNext = false;
				for (
					let decibels = -volumeLineSpacing;
					decibels < volumeRange;
					decibels += volumeLineSpacing
				) {
					const y = Math.round(getY(-decibels));
					ctx.lineWidth = renderScale;

					let lineSize = 0.055;
					if (legendNext) {
						lineSize = 0.1;
						ctx.strokeStyle = "hsla(0, 0%, 50%, 0.75)";
						ctx.fillText(`${decibels}`, width * (BAR_PERCENT + 0.15), y);
					} else {
						ctx.strokeStyle = "hsla(0, 0%, 50%, 0.5)";
					}

					drawLine(ctx, width * BAR_PERCENT, y, width * (BAR_PERCENT + lineSize), y);
					legendNext = !legendNext;
				}

				const normalGradient = createGradient(ctx, visualizerThemes.Lit.gradient, {
					coords: [0, height, 0, height * aboveZeroHeight],
				});
				const clippingGradient = createGradient(ctx, visualizerThemes.Lit.clippingGradient);
				for (let i = 0; i < analysers.length; i++) {
					// Get the channel state and audio samples
					const state = data.states[i];
					if (running) {
						analysers[i].getFloatTimeDomainData(data.sampleArrays[i]);
					}

					// Determine the current volume
					const volume = running
						? data.sampleArrays[i].reduce((max, sample) => Math.max(Math.abs(sample), max), 0)
						: 0;
					const decibels = running ? 20 * Math.log10(volume) : -Infinity;
					const currentDecibels = Math.max(decibels, state.prevValue - reductionRate * dtSeconds);
					state.prevValue = currentDecibels;

					// Update the highest peak
					if (currentDecibels >= state.maxPeak) {
						state.maxPeak = currentDecibels;
						if (decibels >= currentDecibels) {
							state.timeSincePeak = 0;
						}
					} else if (peakDropDelay > 0 || !running) {
						state.timeSincePeak += dtSeconds;
						if (state.timeSincePeak > peakDropDelay) {
							state.maxPeak -= peakDropRate * dtSeconds;
						}
					}

					const peakY = Math.round(getY(state.maxPeak) - 0.5);
					ctx.fillStyle = state.maxPeak > 0 ? clippingGradient : normalGradient;
					ctx.fillRect(i * barWidth, peakY, barWidth - renderScale, 2);

					// Detect clipping
					if (currentDecibels > 0) {
						state.timeSinceClipping = 0;
					} else {
						state.timeSinceClipping += dtSeconds;
					}

					// Draw the bar
					const y = Math.round(getY(currentDecibels));
					ctx.fillStyle =
						state.timeSinceClipping < clippingHighlightTime ? clippingGradient : normalGradient;
					ctx.fillRect(i * barWidth, y, barWidth - renderScale, height - y);
				}
			}}
		/>
	);
}
