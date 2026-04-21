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
