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
