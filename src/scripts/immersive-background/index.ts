// Immersive background
import { initShaderProgram } from "./webgl/shaders.ts";
import type { ProgramInfo } from "./webgl/types";
import { initBuffers } from "./webgl/buffers.ts";
import { drawScene } from "./webgl/draw-scene.ts";
import { preferences } from "./preferences";
import { DebugCategory, DebugDisplay } from "./debug-displays.ts";
import { truncate } from "../utils.ts";

// language=GLSL
const VERTEX_SHADER_SOURCE = `
	attribute vec2 aVertexPosition;

	void main() {
		gl_Position = vec4(aVertexPosition, 0., 1.);
	}
`;

// language=GLSL
const FRAGMENT_SHADER_SOURCE = `
	precision highp float;

	uniform vec3 uResolution;
	uniform float uTime;
	uniform float uScrollY;

	// Remap hash function from 0..1 to -0.5..0.5, which the simplex noise function expects
	#define random3(x) (hash33(x) - 0.5)

	#define saturate(x) clamp(x, 0.0, 1.0)

	// Taken from https://www.shadertoy.com/view/4djSRW (MIT licence)
	// Hash function (0..1)
	vec3 hash33(vec3 p3)
	{
		p3 = fract(p3 * vec3(.1031, .1030, .0973));
		p3 += dot(p3, p3.yxz + 33.33);
		return fract((p3.xxy + p3.yxx) * p3.zyx);
	}

	// Based on https://www.shadertoy.com/view/XsX3zB (MIT licence)
	// 3D simplex noise (-1..1)
	float simplex3d(vec3 p) {
	/* skew constants for 3d simplex functions */
		const float F3 = 0.3333333;
		const float G3 = 0.1666667;

	/* 1. find current tetrahedron T and it's four vertices */
	/* s, s+i1, s+i2, s+1.0 - absolute skewed (integer) coordinates of T vertices */
	/* x, x1, x2, x3 - unskewed coordinates of p relative to each of T vertices*/

	/* calculate s and x */
		vec3 s = floor(p + dot(p, vec3(F3)));
		vec3 x = p - s + dot(s, vec3(G3));

	/* calculate i1 and i2 */
		vec3 e = step(vec3(0.0), x - x.yzx);
		e.z = min(e.z, 3.0 - dot(e, vec3(1.0))); // singularity prevention (whatever that means)

		vec3 i1 = e * (1.0 - e.zxy);
		vec3 i2 = 1.0 - e.zxy * (1.0 - e);

	/* x1, x2, x3 */
		vec3 x1 = x - i1 + G3;
		vec3 x2 = x - i2 + 2.0 * G3;
		vec3 x3 = x - 1.0 + 3.0 * G3;

	/* 2. find four surflets and store them in d */
		vec4 w, d;

	/* calculate surflet weights */
		w.x = dot(x, x);
		w.y = dot(x1, x1);
		w.z = dot(x2, x2);
		w.w = dot(x3, x3);

	/* w fades from 0.6 at the center of the surflet to 0.0 at the margin */
		w = max(0.6 - w, 0.0);

	/* calculate surflet components */
		d.x = dot(random3(s), x);
		d.y = dot(random3(s + i1), x1);
		d.z = dot(random3(s + i2), x2);
		d.w = dot(random3(s + 1.0), x3);

	/* multiply d by w^4 */
		w *= w;
		w *= w;
		d *= w;

	/* 3. return the sum of the four surflets */
		return dot(d, vec4(52.0));
	}

	void main() {
		// Coordinates
		const float parallax = 0.9;
		vec2 uv = (gl_FragCoord.xy / uResolution.xy) - 0.5;
		float aspectRatio = uResolution.x / uResolution.y;
		uv.x *= aspectRatio; // Maintain the canvas aspect ratio

		vec3 noiseCoords = vec3(uv.x, uv.y - uScrollY * (1.0 - parallax), 0.0);

		// Stars
		const float starsScale = 80.0;
		vec3 starsOffset = vec3(0.02, 0.0, 0.0) * uTime;
		float stars = min(pow(saturate(simplex3d(noiseCoords * starsScale + starsOffset)), 7.5) * 4.0, 1.0);

		// Flicker noise
		const float noiseScale = 10.0;
		vec3 noiseOffset = vec3(-0.08, -0.24, 0.16) * uTime;
		float noise = saturate(simplex3d(noiseCoords * noiseScale + noiseOffset) + 0.5);

		// Vignette
		const float vignetteFalloff = 0.8;
		const float vignetteCircular = 0.7;
		uv.y *= mix(aspectRatio, 1.0, vignetteCircular);
		float rf = 1.0 + dot(uv.xy, uv.xy) * (vignetteFalloff * vignetteFalloff);
		float vignette = 1.0 / (rf * rf);

		// Final colour
		vec3 background = vec3(0.0354, 0.0354, 0.0436);
		vec3 colour = mix(background * vignette, vec3(1.0), stars * noise * (0.5 + vignette * 0.5));
		//vec3 colour = vec3(noise);
		gl_FragColor = vec4(colour, 1.0);
	}
`;

const debugCategory = new DebugCategory("Background");
const debugFPS = new DebugDisplay({
	name: "FPS",
	description:
		"The current FPS of the immersive background. " +
		"The second value represents the browser's FPS, which is typically your screen's refresh rate.",
	category: debugCategory,
	dependencies: [
		preferences.bgDebug.asDependency("fps", "resolution", "full"),
	],
}, "N / A");

const debugResolution = new DebugDisplay({
	name: "Resolution",
	description: "The final resolution the immersive background is being rendered at.",
	category: debugCategory,
	dependencies: [
		preferences.bgDebug.asDependency("resolution", "full"),
	],
});

const debugScreen = new DebugDisplay({
	name: "Page Size",
	description: "Information about the page size.",
	category: debugCategory,
	dependencies: [
		preferences.bgDebug.asDependency("full"),
	],
});
const debugDPI = new DebugDisplay({
	name: "Pixel Density",
	description:
		"Information about the pixel density." +
		"\n- Native is the pixel density of your screen. In most browsers this is also affected by the page zoom." +
		"\n- Scaled is the pixel density scaled by the Pixel Density Scaling setting." +
		"\n- Final is the final pixel density of the background.",
	category: debugCategory,
	dependencies: [
		preferences.bgDebug.asDependency("full"),
	],
});

// TODO: better immersive background toggle / refactoring
let immersiveModeSupported = false;
let canvas: HTMLCanvasElement | null;

function resizeCanvas() {
	if (!canvas) {
		return;
	}

	const dpr = devicePixelRatio > 1
		? 1 + (devicePixelRatio - 1) * preferences.bgDPIFactor.get()
		: devicePixelRatio;
	const renderScale = dpr * preferences.bgRenderScale.get();

	const bounds = canvas.getBoundingClientRect();
	const displayWidth = Math.round(bounds.width * renderScale);
	const displayHeight = Math.round(bounds.height * renderScale);

	debugResolution.set(`${displayWidth} x ${displayHeight}`);
	debugScreen.set(
		`Perceived: ${Math.round(bounds.width)} x ${Math.round(bounds.height)}\n` +
		`Native: ${Math.round(bounds.width * devicePixelRatio)} x ${Math.round(bounds.height * devicePixelRatio)}`,
	);
	debugDPI.set(
		`Native: ${truncate(devicePixelRatio, 3)}x\n` +
		`Scaled: ${truncate(dpr, 3)}x\n` +
		`Final: ${truncate(renderScale, 3)}x`,
	);

	if ((canvas.width !== displayWidth || canvas.height !== displayHeight) && displayWidth > 0 && displayHeight > 0) {
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

	resizeCanvas();
	const shaderProgram = initShaderProgram(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
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
			if (preferences.bgEnabled.isEnabled() && document.hasFocus()) {
				time += (now - then) / 1000;
				render();
			}
		}

		const timeSinceUpdate = (now - lastUpdateTime) / 1000;
		if (timeSinceUpdate > 1) {
			debugFPS.set(`${truncate(frames / timeSinceUpdate)} / ${truncate(animationFrames / timeSinceUpdate)}`);
			//`${canvas!.width} x ${canvas!.height}`,
			//Math.round(frames / timeSinceUpdate),
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
			if (preferences.bgEnabled.isEnabled() && document.hasFocus()) {
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

	resizeCanvas();
	requestAnimationFrame(onPassiveFrame);
	if (preferences.bgEnabled.isEnabled()) {
		render();
	}
}

function updateImmersiveBackgroundState() {
	document.documentElement.classList.toggle(
		"bg-supported",
		immersiveModeSupported && preferences.bgEnabled.isEnabled(),
	);
}

main();
document.addEventListener("astro:after-swap", updateImmersiveBackgroundState);
document.addEventListener("custom:preferences-updated", resizeCanvas);
