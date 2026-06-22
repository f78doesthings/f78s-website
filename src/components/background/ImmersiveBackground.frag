/*
 * Copyright (c) 2026 f78.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uScrollY;

// From https://www.shadertoy.com/view/4djSRW (MIT licence)
// Hash function (0..1)
vec3 hash33(vec3 p3) {
	p3 = fract(p3 * vec3(.1031, .1030, .0973));
	p3 += dot(p3, p3.yxz + 33.33);
	return fract((p3.xxy + p3.yxx) * p3.zyx);
}

// Remap hash function from 0..1 to -0.5..0.5, which is what the simplex noise function expects
vec3 random3(vec3 x) {
	return hash33(x) - 0.5;
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

// From https://www.shadertoy.com/view/4sc3D7 (CC0-1.0 licence)
// Converts a colour temperature in Kelvin (1000-40000 K) to RGB
vec3 colorTemperatureToRGB(const in float temperature) {
  mat3 m = (temperature <= 6500.0) ? mat3(vec3(0.0, -2902.1955373783176, -8257.7997278925690),
	                                      vec3(0.0, 1669.5803561666639, 2575.2827530017594),
	                                      vec3(1.0, 1.3302673723350029, 1.8993753891711275)) : 
	 								 mat3(vec3(1745.0425298314172, 1216.6168361476490, -8257.7997278925690),
   	                                      vec3(-2666.3474220535695, -2173.1012343082230, 2575.2827530017594),
	                                      vec3(0.55995389139931482, 0.70381203140554553, 1.8993753891711275)); 
  return mix(clamp(vec3(m[0] / (vec3(clamp(temperature, 1000.0, 40000.0)) + m[1]) + m[2]), vec3(0.0), vec3(1.0)), vec3(1.0), smoothstep(1000.0, 0.0, temperature));
}

float saturate(float x) {
	return clamp(x, 0.0, 1.0);
}

// Some dodgy math to get a better colour temperature range out of our noise function
float remapColourNoise(float noise) {
	float x = saturate(noise * 0.5 + 0.5);
	return pow(x, 5.0) + x * (1.0 - x);
} 

void main() {
	// TODO: convert some of the constants here to (advanced) preferences
	// Coordinates
	const float parallax = 0.9;
	vec2 uv = (gl_FragCoord.xy / uResolution) - 0.5;
	float aspectRatio = uResolution.x / uResolution.y;
	uv.x *= aspectRatio; // Maintain the canvas aspect ratio
	vec3 noiseCoords = vec3(uv.x, uv.y - uScrollY * (1.0 - parallax), 0.0);

	// Stars
	const float starsScale = 120.0;
	vec3 starsOffset = vec3(0.028, 0.0, 0.0) * uTime;
	float stars = min(pow(saturate(simplex3d(noiseCoords * starsScale + starsOffset)), 10.0) * 8.0, 1.0);

	// Twinkle noise
	const float twinkleScale = 10.0;
	vec3 twinkleOffset = vec3(-0.1, -0.3, 0.2) * uTime;
	float twinkle = saturate(simplex3d(noiseCoords * twinkleScale + twinkleOffset) + 0.5);

	// Colour noise
	const float colourScale = 0.35; // Relative to star scale
	float colourNoise = simplex3d(noiseCoords * starsScale * colourScale + starsOffset);
	vec3 starColour = colorTemperatureToRGB(mix(4000.0, 12000.0, remapColourNoise(colourNoise)));

	// Vignette
	const float vignetteFalloff = 0.8;
	const float vignetteCircular = 0.7;
	uv.y *= mix(aspectRatio, 1.0, vignetteCircular);
	float rf = 1.0 + dot(uv, uv) * (vignetteFalloff * vignetteFalloff);
	float vignette = 1.0 / (rf * rf);

	// Final colour
	vec3 background = vec3(0.0266, 0.0266, 0.0327);
	vec3 colour = mix(background * vignette, starColour, stars * twinkle * (0.5 + vignette * 0.5));
	//vec3 colour = vec3(twinkle);
	gl_FragColor = vec4(colour, 1.0);
}
