/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Immersive background

import { preferences } from "../preferences/index.tsx";
import { truncate } from "../utils";
import { autoResizeCanvas } from "../utils/canvas.ts";
import { DebugCategory, DebugDisplay } from "../utils/debug-displays.ts";
import bgFrag from "./shaders/bg.frag?raw";
import bgVert from "./shaders/bg.vert?raw";
import { initBuffers } from "./webgl/buffers.ts";
import { drawScene } from "./webgl/draw-scene.ts";
import { initShaderProgram } from "./webgl/shader-program.ts";
import type { ProgramInfo } from "./webgl/types";

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

// TODO: consider refactoring this
let immersiveModeSupported = false;
let canvas: HTMLCanvasElement | null;

function resizeCanvas() {
	if (!canvas) {
		return;
	}

	const dpr =
		devicePixelRatio > 1
			? 1 + (devicePixelRatio - 1) * preferences.bgDPIFactor.get()
			: devicePixelRatio;
	const renderScale = dpr * preferences.bgRenderScale.get();

	const bounds = canvas.getBoundingClientRect();
	const displayWidth = Math.round(bounds.width * renderScale);
	const displayHeight = Math.round(bounds.height * renderScale);

	if (
		(canvas.width !== displayWidth || canvas.height !== displayHeight) &&
		displayWidth > 0 &&
		displayHeight > 0
	) {
		canvas.width = displayWidth;
		canvas.height = displayHeight;
	}
}

function main() {
	canvas = document.querySelector<HTMLCanvasElement>(".immersive-background");
	if (!canvas) {
		return console.error("Could not find the canvas element for the immersive background.");
	}

	const gl = canvas?.getContext("webgl");
	if (!gl) {
		return console.error("WebGL is unavailable. The immersive background will be disabled.");
	}

	const shaderProgram = initShaderProgram(gl, bgVert, bgFrag);
	if (!shaderProgram) {
		return;
	}

	const programInfo: ProgramInfo = {
		program: shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
		},
		uniformLocations: {
			resolution: gl.getUniformLocation(shaderProgram, "uResolution"),
			time: gl.getUniformLocation(shaderProgram, "uTime"),
			scrollY: gl.getUniformLocation(shaderProgram, "uScrollY"),
		},
	};
	const buffers = initBuffers(gl);

	let framesSinceRender = -1;
	let lastUpdateTime = 0;
	let frames = 0;
	let animationFrames = 0;
	let then = 0;
	let time = 0;
	const onPassiveFrame = (now: number) => {
		if (++framesSinceRender > preferences.bgFrameSkip.get()) {
			framesSinceRender = 0;

			// document.hasFocus was causing issues on mobile, so it has been commented out for now
			if (
				preferences.bgEnabled.isEnabled() /* && document.hasFocus() */ &&
				!document.fullscreenElement
			) {
				time += (now - then) / 1000;
				render();
			}
		}

		const timeSinceUpdate = (now - lastUpdateTime) / 1000;
		if (timeSinceUpdate > 1) {
			debugFPS.set(
				`${truncate(frames / timeSinceUpdate)} / ${truncate(animationFrames / timeSinceUpdate)}`,
			);
			lastUpdateTime = now;
			frames = 0;
			animationFrames = 0;
		}

		then = now;
		animationFrames++;
		requestAnimationFrame(onPassiveFrame);
	};

	const render = () => {
		frames++;
		drawScene(gl, programInfo, buffers, time);
	};

	const onActiveFrame = () => {
		if (framesSinceRender >= preferences.bgActiveFrameSkip.get()) {
			framesSinceRender = -1;
			if (preferences.bgEnabled.isEnabled()) {
				render();
			}
		}
	};

	window.addEventListener("resize", () => {
		resizeCanvas();
		onActiveFrame();
	});
	window.addEventListener("scroll", onActiveFrame);

	immersiveModeSupported = true;
	updateImmersiveBackgroundState();

	autoResizeCanvas(canvas, {
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
		},
	});
	requestAnimationFrame(onPassiveFrame);
	if (preferences.bgEnabled.isEnabled()) {
		render();
	}
}

function updateImmersiveBackgroundState() {
	document.documentElement.classList.add("loaded");
	document.documentElement.classList.toggle("bg-supported", immersiveModeSupported);
}

main();
document.addEventListener("astro:after-swap", updateImmersiveBackgroundState);
document.addEventListener("custom:preferences-updated", () => {
	resizeCanvas();
	updateImmersiveBackgroundState();
});
