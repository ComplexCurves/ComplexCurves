/**
 * @constructor
 * @param {StateGL} stategl
 * @param {Surface} surface
 * @implements {Stage}
 */
function Initial(stategl, surface) {
    this.mkBuffers(stategl, surface, Mesh.tetrakis(2));
    this.mkProgram(stategl, surface);
}

/** @type {WebGLBuffer} */
Initial.prototype.indexBuffer = null;

/**
 * @param {StateGL} stategl
 * @param {Surface} surface
 * @param {Array<number>} positions
 */
Initial.prototype.mkBuffers = function(stategl, surface, positions) {
    var gl = stategl.gl;
    surface.numIndices = positions.length / 2;
    gl.enableVertexAttribArray(0);
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    surface.framebuffer = gl.createFramebuffer();
};

/**
 * @param {StateGL} stategl
 * @param {Surface} surface
 */
Initial.prototype.mkProgram = function(stategl, surface) {
    var sources = [
        StateGL.getShaderSource('Initial.vert'),
        StateGL.getShaderSource('Dummy.frag')
    ];
    sources[0] = surface.withCustomAndCommon(sources[0]);
    this.program = stategl.mkProgram(sources, ["position", "delta",
        "subdivisionFlag", "values"
    ]);
};

/** @type {WebGLBuffer} */
Initial.prototype.positionBuffer = null;

/** @type {WebGLProgram} */
Initial.prototype.program = null;

/**
 * @param {StateGL} stategl
 * @param {Surface} surface
 * @param {WebGLRenderingContext} gl
 */
Initial.prototype.render = function(stategl, surface, gl) {
    var texturesIn = surface.texturesIn,
        texturesOut = surface.texturesOut;
    gl.useProgram(this.program);
    var sheets = surface.sheets;
    var stride = 4 + 2 * GLSL.N;
    var size = stride * surface.numIndices;
    gl.bindBuffer(gl.ARRAY_BUFFER, surface.transformFeedbackBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, size * Float32Array.BYTES_PER_ELEMENT, gl["STATIC_COPY"]);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.enableVertexAttribArray(0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl["bindTransformFeedback"](gl["TRANSFORM_FEEDBACK"], surface.transformFeedback);
    gl["bindBufferBase"](gl["TRANSFORM_FEEDBACK_BUFFER"], 0, surface.transformFeedbackBuffer);
    gl["beginTransformFeedback"](gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, surface.numIndices);
    gl["endTransformFeedback"]();
    gl["bindBufferBase"](gl["TRANSFORM_FEEDBACK_BUFFER"], 0, null);
    gl["bindTransformFeedback"](gl["TRANSFORM_FEEDBACK"], null);

    // store feedback values in textures
    TransformFeedback.toTextures(gl, surface, texturesOut);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    for (var i = 0, l = texturesOut.length; i < l; i++) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    var texturesTmp = texturesIn;
    surface.texturesIn = texturesOut;
    surface.texturesOut = texturesTmp;
};
