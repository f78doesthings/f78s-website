/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export interface ProgramInfo {
	program: WebGLProgram;
	attribLocations: {
		vertexPosition: number;
	};
	uniformLocations: {
		resolution: WebGLUniformLocation | null;
		time: WebGLUniformLocation | null;
		scrollY: WebGLUniformLocation | null;
	};
}

export interface Buffers {
	position: WebGLBuffer;
}
