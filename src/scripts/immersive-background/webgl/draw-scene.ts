/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { Buffers, ProgramInfo } from "./types";

export function drawScene(gl: WebGLRenderingContext, programInfo: ProgramInfo, buffers: Buffers, time: number) {
	// Update the viewport size
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	// Clear the canvas
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// Tell WebGL to use the program containing our shades
	gl.useProgram(programInfo.program);

	// Set up the vertex position buffer
	setPositionAttribute(gl, programInfo, buffers);

	// Set uniforms
	// noinspection JSSuspiciousNameCombination
	gl.uniform1f(programInfo.uniformLocations.scrollY, window.scrollY / window.innerHeight);
	gl.uniform1f(programInfo.uniformLocations.time, time);
	gl.uniform3f(programInfo.uniformLocations.resolution, gl.canvas.width, gl.canvas.height, 1);

	// Draw the scene
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function setPositionAttribute(gl: WebGLRenderingContext, programInfo: ProgramInfo, buffers: Buffers) {
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
	gl.vertexAttribPointer(
		programInfo.attribLocations.vertexPosition,
		2,
		gl.FLOAT,
		false,
		0,
		0,
	);
	gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}
