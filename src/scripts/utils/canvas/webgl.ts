/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import fullscreenVert from "./fullscreen.vert?raw";

//#region Shader program

/** Creates a WebGL shader program for the given vertex and fragment shader code. */
export function initShaderProgram(
	gl: WebGLRenderingContext,
	fragSource: string,
	vertSource: string = fullscreenVert,
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

//#endregion

//#region Buffers

/** Creates a simple vertex position buffer for filling the screen. */
export function createPositionBuffer(gl: WebGLRenderingContext) {
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	const positions = [1, 1, -1, 1, 1, -1, -1, -1];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	return positionBuffer;
}

/** Updates the vertex position with the given buffer from {@linkcode createPositionBuffer}. */
export function setPositionAttribute(
	gl: WebGLRenderingContext,
	attribLocation: number,
	buffer: WebGLBuffer | null,
) {
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.vertexAttribPointer(attribLocation, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(attribLocation);
}

//#endregion
