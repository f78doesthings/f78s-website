/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export function initShaderProgram(
	gl: WebGLRenderingContext,
	vertSource: string,
	fragSource: string,
): WebGLProgram | undefined {
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertSource);
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragSource);
	if (!vertexShader || !fragmentShader) {
		return undefined;
	}

	const shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		console.error("Failed to initialize the shader program:", gl.getProgramInfoLog(shaderProgram));
		return undefined;
	} else {
		return shaderProgram;
	}
}

function loadShader(gl: WebGLRenderingContext, type: GLenum, source: string) {
	const shader = gl.createShader(type);
	if (!shader) {
		throw new Error(`Failed to create shader (error ${gl.getError()})`);
	}

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error("Failed to compile shader:", gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return undefined;
	} else {
		return shader;
	}
}
