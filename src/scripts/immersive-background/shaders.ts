/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Shader source code for the immersive background

// language=GLSL
export const bgVert = `
	attribute vec2 aVertexPosition;

	void main() {
		gl_Position = vec4(aVertexPosition, 0., 1.);
	}
`;

// language=GLSL
export const bgFrag = `
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
		vec3 background = vec3(0.0266, 0.0266, 0.0327);
		vec3 colour = mix(background * vignette, vec3(1.0), stars * noise * (0.5 + vignette * 0.5));
		//vec3 colour = vec3(noise);
		gl_FragColor = vec4(colour, 1.0);
	}
`;
