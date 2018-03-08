/**
 * @constructor
 * @param {StateGL} stategl
 * @param {Surface} surface
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
    gl.useProgram(this.program);
    var stride = 4 + 2 * GLSL.N;
    var size = stride * surface.numIndices;
    gl.enableVertexAttribArray(0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    TransformFeedback.withTransformFeedback(gl, surface, size, function() {
        gl.drawArrays(gl.TRIANGLES, 0, surface.numIndices);
    });

    // store feedback values in textures
    TransformFeedback.toTextures(gl, surface);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};
