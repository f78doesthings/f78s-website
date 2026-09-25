/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { effect, signal } from "@preact/signals";

import { preferences } from "../../scripts/preferences";
import { truncate } from "../../scripts/utils";
import { autoResizeCanvas } from "../../scripts/utils/canvas/auto-resize";
import {
	createPositionBuffer,
	initShaderProgram,
	setPositionAttribute,
} from "../../scripts/utils/canvas/webgl";
import { DebugCategory, DebugDisplay } from "../../scripts/utils/debug-displays";
import fragSource from "./ImmersiveBackground.frag?raw";

import styles from "./ImmersiveBackground.module.scss";

let immersiveModeSupported = signal<boolean>();
effect(updateImmersiveBackgroundState);

function updateImmersiveBackgroundState() {
	if (!("document" in globalThis)) {
		return;
	}

	document.documentElement.dataset.bgSupported =
		immersiveModeSupported.value !== undefined
			? immersiveModeSupported.value
				? "true"
				: "false"
			: undefined;
}

export function ImmersiveBackground() {
	return (
		<canvas
			class={styles["immersive-background"]}
			ref={(canvas) => {
				// Set up WebGL
				if (!canvas) {
					immersiveModeSupported.value = false;
					return;
				}

				const gl = canvas.getContext("webgl");
				if (!gl) {
					immersiveModeSupported.value = false;
					return console.error("WebGL is unavailable. The immersive background will be disabled.");
				}

				const shaderProgram = initShaderProgram(gl, fragSource);
				if (!shaderProgram) {
					immersiveModeSupported.value = false;
					return;
				}

				const aVertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
				const uResolution = gl.getUniformLocation(shaderProgram, "uResolution");
				const uTime = gl.getUniformLocation(shaderProgram, "uTime");
				const uScrollY = gl.getUniformLocation(shaderProgram, "uScrollY");
				const positionBuffer = createPositionBuffer(gl);

				// Rendering callbacks
				let destroyed = false;
				let framesSinceRender = -1;
				let lastUpdateTime = 0;
				let frames = 0;
				let animationFrames = 0;
				let then = 0;
				let time = 0;

				/**
				 * Renders a frame and sets {@linkcode framesSinceRender} to `-1` to prevent the animation
				 * loop from rendering more frames during these actions.
				 */
				const activeFrame = () => {
					framesSinceRender = -1;
					if (preferences.bgEnabled.get()) {
						render();
					}
				};

				/** Immediately renders a frame. */
				const render = () => {
					// Update the viewport size
					gl.viewport(0, 0, canvas.width, canvas.height);

					// Clear the canvas
					gl.clearColor(0, 0, 0, 1);
					gl.clear(gl.COLOR_BUFFER_BIT);

					// Tell WebGL to use the program containing our shaders
					gl.useProgram(shaderProgram);

					// Set the vertex position
					setPositionAttribute(gl, aVertexPosition, positionBuffer);

					// Set uniforms
					gl.uniform1f(uScrollY, window.scrollY / window.innerHeight);
					gl.uniform1f(uTime, time);
					gl.uniform2f(uResolution, gl.canvas.width, gl.canvas.height);

					// Draw the scene
					gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
					frames++;
				};

				const onAnimationFrame = (now: number) => {
					if (destroyed) {
						return;
					}

					// Render
					const isRunning =
						preferences.bgEnabled.isEnabled() &&
						(document.hasFocus() || !preferences.bgRequireFocus.get()) &&
						!document.fullscreenElement;

					if (isRunning) {
						time += (now - then) / 1000;
					}

					if (++framesSinceRender > preferences.bgFrameSkip.get()) {
						framesSinceRender = 0;
						if (isRunning) {
							render();
						}
					}

					// Update debug display
					const timeSinceUpdate = (now - lastUpdateTime) / 1000;
					if (timeSinceUpdate > 1) {
						debugFPS.set(
							`${truncate(frames / timeSinceUpdate)} / ${truncate(animationFrames / timeSinceUpdate)}`,
						);
						lastUpdateTime = now;
						frames = 0;
						animationFrames = 0;
					}

					// Finish
					then = now;
					animationFrames++;
					requestAnimationFrame(onAnimationFrame);
				};

				const onScroll = () => {
					if (framesSinceRender >= preferences.bgActiveFrameSkip.get()) {
						activeFrame();
					}
				};

				// Debug displays
				const debugCategory = new DebugCategory("Background");
				const debugFPS = new DebugDisplay(
					{
						name: "FPS",
						description:
							"The current FPS of the immersive background. " +
							"The second value represents the browser's FPS, which is typically your screen's refresh rate.",
						category: debugCategory,
						dependencies: [preferences.bgDebug.asDependency("fps", "resolution", "full")],
					},
					"N / A",
				);

				const debugResolution = new DebugDisplay({
					name: "Resolution",
					description: "The final resolution the immersive background is being rendered at.",
					category: debugCategory,
					dependencies: [preferences.bgDebug.asDependency("resolution", "full")],
				});

				const debugScreen = new DebugDisplay({
					name: "Page Size",
					description: "Information about the page size.",
					category: debugCategory,
					dependencies: [preferences.bgDebug.asDependency("full")],
				});
				const debugDPI = new DebugDisplay({
					name: "Pixel Density",
					description:
						"Information about the pixel density." +
						"\n- Native is the pixel density of your screen. In most browsers this is also affected by the page zoom." +
						"\n- Scaled is the pixel density scaled by the Pixel Density Scaling setting." +
						"\n- Final is the final pixel density of the background.",
					category: debugCategory,
					dependencies: [preferences.bgDebug.asDependency("full")],
				});

				// Automatically resize the canvas
				const canvasResizer = autoResizeCanvas(canvas, {
					renderScale: () => preferences.bgRenderScale.get(),
					dpiFactor: () => preferences.bgDPIFactor.get(),
					onResize: (data) => {
						debugResolution.set(`${data.renderWidth} x ${data.renderHeight}`);
						debugScreen.set(
							`Perceived: ${Math.round(data.elementWidth)} x ${Math.round(data.elementHeight)}\n` +
								`Native: ${Math.round(data.elementWidth * window.devicePixelRatio)} x ${Math.round(data.elementHeight * window.devicePixelRatio)}`,
						);
						debugDPI.set(
							`Native: ${truncate(window.devicePixelRatio, 3)}x\n` +
								`Scaled: ${truncate(data.scaledPixelRatio, 3)}x\n` +
								`Final: ${truncate(data.renderScale, 3)}x`,
						);

						// Always render a frame if the background is enabled to avoid flickering
						activeFrame();
					},
				});

				// Register event listeners
				window.addEventListener("scroll", onScroll);
				document.addEventListener("custom:preferences-updated", canvasResizer.update);
				document.addEventListener("astro:after-swap", updateImmersiveBackgroundState);
				requestAnimationFrame(onAnimationFrame);
				immersiveModeSupported.value = true;
				activeFrame();

				return () => {
					destroyed = true;
					immersiveModeSupported.value = false;
					window.removeEventListener("scroll", onScroll);
					document.removeEventListener("custom:preferences-updated", canvasResizer.update);
					document.removeEventListener("astro:after-swap", updateImmersiveBackgroundState);
					canvasResizer.destroy();
				};
			}}
		></canvas>
	);
}
