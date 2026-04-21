export function initShaderProgram(gl: WebGLRenderingContext, vertSource: string, fragSource: string) {
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertSource)!;
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragSource)!;
	const shaderProgram = gl.createProgram();

	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		console.error("Failed to initialize the shader program:", gl.getProgramInfoLog(shaderProgram));
	} else {
		return shaderProgram;
	}
}

function loadShader(gl: WebGLRenderingContext, type: GLenum, source: string) {
	const shader = gl.createShader(type)!;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error("Failed to compile shader:", gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
	} else {
		return shader;
	}
}
