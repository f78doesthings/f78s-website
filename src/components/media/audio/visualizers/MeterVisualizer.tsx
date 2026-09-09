/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { clamp, truncate } from "../../../../scripts/utils";
import { createGradient, drawLine } from "../../../../scripts/utils/canvas/2d";
import { AudioVisualizer, type VisualizerProps } from "./AudioVisualizer";

interface MeterChannelState {
	/** The meter value of the previous frame in dBFS. */
	prevPeak: number;

	/** The average linear volume of the previous frame. */
	prevAvg: number;

	/** The most recent highest volume reached in dBFS. */
	recentMaxVolume: number;

	/** The all-time highest volume reached in dBFS. */
	maxVolume: number;

	/** The number of seconds since the last highest peak volume. */
	timeSinceMax: number;

	/** The number of seconds since the last time this channel went above 0 dBFS. */
	timeSinceClipping: number;
}

/** A visualizer that displays the audio waveform. */
export function MeterVisualizer(props: VisualizerProps) {
	//#region Visualizer settings (to be moved to preferences)

	/**
	 * Analyser window size in samples. Must be a power of 2 between 32 and 32768.
	 *
	 * Increasing this improves the meter's accuracy (especially at lower framerates) and smoothens
	 * the average volume display, at the cost of performance.
	 */
	const sampleWindow = 4096;

	// Meter
	/** The range of the volume meter (dB). */
	const volumeRange = 48;

	/** How fast the volume meter decays (dB/s). */
	const decayRate = 12;

	/**
	 * Increasing this pulls lower volumes more towards the bottom, increasing the detail for higher
	 * volumes.
	 */
	const weight = 2;

	// Clipping
	const clippingHighlightTime = 0.4;
	const aboveZeroHeight = 0.05;

	// Peak volume displays
	const showAllTimePeak = true;
	const showPeakText = true;

	const showRecentPeak = true;
	const recentPeakDelay = 2;
	const peakDecayMultiplier = 1.5;

	// Average volume display
	const showAverage = true;

	/**
	 * If `true`, the average volume decays just like the peak volume. _(This is similar to Audacity 4
	 * beta 2's RMS meter style.)_
	 *
	 * If `false`, the volume is instead averaged over a period of time _(which is more like Audacity
	 * 3's RMS meter)_. This is smoother, but currently the volume is averaged by a fixed amount each
	 * frame, which likely results in inconsistent behaviour depending on the framerate.
	 */
	const decayAverage = true;

	//#endregion

	/** How much of the total width should be taken up by the bars. */
	const BAR_PERCENT = 0.55;

	const resetStates = (states: MeterChannelState[], count: number) => {
		for (let i = 0; i < count; i++) {
			states[i] = {
				prevPeak: -Infinity,
				prevAvg: decayAverage ? -Infinity : 0,
				recentMaxVolume: -Infinity,
				maxVolume: -Infinity,
				timeSinceMax: recentPeakDelay + 1,
				timeSinceClipping: clippingHighlightTime + 1,
			};
		}
	};

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
				}

				resetStates(states, analysers.length);
				return { sampleArrays, states };
			}}
			draw={({ analysers, ctx, deltaTime, data, running, wasRunning, theme, media }) => {
				if (running && !wasRunning) {
					resetStates(data.states, analysers.length);
				}

				const width = ctx.canvas.width;
				const height = ctx.canvas.height;
				const dtSeconds = deltaTime / 1000;
				const renderScale = Number(ctx.canvas.dataset.renderScale ?? 1) || 1;
				const barGap = Math.floor(renderScale + width / renderScale / 70);
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
				ctx.textAlign = "left";
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

				const normalGradient = createGradient(ctx, theme.gradientPrimary, {
					coords: [0, height, 0, height * aboveZeroHeight],
				});
				const clippingGradient = createGradient(ctx, theme.gradientSecondary);
				for (let index = 0; index < analysers.length; index++) {
					// Get the channel state and audio samples
					const state = data.states[index];
					const samples = data.sampleArrays[index];
					if (running) {
						analysers[index].getFloatTimeDomainData(samples);
					}

					// Determine the current volume, making sure we only consider new samples
					const startIndex = clamp(
						sampleWindow - 1 - Math.ceil((deltaTime / 1000) * media.context.sampleRate),
						0,
						sampleWindow - 2,
					);
					const volume = running
						? samples.reduce(
								(max, sample, i) => (i < startIndex ? max : Math.max(Math.abs(sample), max)),
								0,
							)
						: 0;
					const decibels = running ? 20 * Math.log10(volume) : -Infinity;
					const currentDecibels = Math.max(decibels, state.prevPeak - decayRate * dtSeconds);
					state.prevPeak = currentDecibels;

					// Detect clipping
					if (currentDecibels > 0) {
						state.timeSinceClipping = 0;
					} else {
						state.timeSinceClipping += dtSeconds;
					}

					// Draw the bar
					const x = index * (barWidth + Math.floor(barGap / 2));
					const w = barWidth - Math.ceil(barGap / 2);
					const h = Math.round(2 * renderScale);
					const peakY = Math.round(getY(currentDecibels));
					ctx.fillStyle =
						state.timeSinceClipping < clippingHighlightTime ? clippingGradient : normalGradient;
					ctx.fillRect(x, peakY, w, height - peakY);

					// Averaging - this might not be correct, but whatever
					if (showAverage) {
						const total = running ? samples.reduce((sum, value) => sum + value * value, 0) : 0;
						const avg = Math.sqrt(total / sampleWindow);

						let avgDisplay;
						if (decayAverage) {
							const avgDecibels = avg > 0 ? 20 * Math.log10(avg) : -Infinity;
							avgDisplay = Math.max(avgDecibels, state.prevAvg - decayRate * dtSeconds);
							state.prevAvg = avgDisplay;
						} else {
							// TODO: framerate-independent averaging
							const currentAvg = avg * 0.025 + state.prevAvg * 0.975;
							avgDisplay = currentAvg > 0 ? 20 * Math.log10(currentAvg) : -Infinity;
							state.prevAvg = currentAvg;
						}

						// Draw the average volume
						const avgY = Math.round(getY(avgDisplay) - 0.5);
						ctx.clearRect(x, avgY, w, h);
					}

					// Update the highest peak
					if (showRecentPeak) {
						if (currentDecibels >= state.recentMaxVolume) {
							state.recentMaxVolume = currentDecibels;
							if (decibels >= currentDecibels) {
								state.timeSinceMax = 0;
							}
						} else if (recentPeakDelay > 0 || !running) {
							state.timeSinceMax += dtSeconds;
							if (state.timeSinceMax > recentPeakDelay) {
								state.recentMaxVolume -= decayRate * peakDecayMultiplier * dtSeconds;
							}
						}

						// Draw the recent peak
						const recentPeakY = Math.round(getY(state.recentMaxVolume) - 0.5);
						ctx.fillStyle = state.recentMaxVolume > 0 ? clippingGradient : normalGradient;
						ctx.fillRect(x, recentPeakY, w, h);
					}

					if ((showAllTimePeak || showPeakText) && currentDecibels >= state.maxVolume) {
						state.maxVolume = currentDecibels;
					}

					// Draw the all-time peak
					if (showAllTimePeak) {
						const maxPeakY = Math.round(getY(state.maxVolume) - 0.5);
						ctx.fillStyle = state.maxVolume > 0 ? theme.secondaryDark : theme.primaryDark;
						ctx.fillRect(x, maxPeakY, w, h);
					}
				}

				if (showPeakText) {
					const maxPeak = Math.max(...data.states.map((x) => x.maxVolume));
					const digits = clamp(3 - Math.log10(Math.abs(maxPeak)), 0, 2);
					const peakText = truncate(maxPeak, digits, true);
					const peakX = width * BAR_PERCENT * 0.5;
					const peakY = height - barGap;

					const peakFontSize = Math.round(fontSize * 0.8);
					ctx.font = `${peakFontSize}px "Cascadia Code", monospace`;
					ctx.strokeStyle = "hsla(0, 0%, 0%, 0.5)";
					ctx.lineWidth = Math.round(renderScale * 2);
					ctx.fillStyle = "hsla(0, 0%, 100%, 0.75)";
					ctx.textAlign = "center";
					ctx.textBaseline = "bottom";
					ctx.strokeText(peakText, peakX, peakY);
					ctx.fillText(peakText, peakX, peakY);
				}
			}}
		/>
	);
}
