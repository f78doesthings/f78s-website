/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { Buffers } from "./types";

export function initBuffers(gl: WebGLRenderingContext): Buffers {
	const positionBuffer = initPositionBuffer(gl);
	return {
		position: positionBuffer,
	};
}

function initPositionBuffer(gl: WebGLRenderingContext) {
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	const positions = [1, 1, -1, 1, 1, -1, -1, -1];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	return positionBuffer;
}
