/**
 * @constructor
 * @param {StateGL} stategl
 * @param {Surface} surface
 * @implements {Stage}
 */
function SubdivisionPre(stategl, surface) {
    this.mkProgram(stategl, surface);
}

/**
 * @param {StateGL} stategl
 * @param {Surface} surface
 */
SubdivisionPre.prototype.mkProgram = function(stategl, surface) {
    var sources = [
        StateGL.getShaderSource('SubdivisionPre.vert'),
        StateGL.getShaderSource('Dummy.frag')
    ];
    sources[0] = surface.withCustomAndCommon(sources[0]);
    this.program = stategl.mkProgram(sources, ["position", "delta",
        "subdivisionFlag", "values"
    ]);
};

/** @type {WebGLProgram} */
SubdivisionPre.prototype.program = null;

/**
 * @param {StateGL} stategl
 * @param {Surface} surface
 * @param {WebGLRenderingContext} gl
 */
SubdivisionPre.prototype.render = function(stategl, surface, gl) {
    var texturesIn = surface.texturesIn,
        texturesOut = surface.texturesOut;
    var program = this.program;
    gl.useProgram(program);
    surface.fillIndexBuffer(stategl);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
    var stride = 4 + 2 * GLSL.N;
    var size = stride * surface.numIndices;
    gl.bindBuffer(gl.ARRAY_BUFFER, surface.transformFeedbackBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, size * Float32Array.BYTES_PER_ELEMENT, gl["STATIC_COPY"]);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // prepare input textures
    var texIs = [];
    for (var i = 0, l = texturesIn.length; i < l; i++) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, texturesIn[i]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        texIs[i] = i;
    }
    var samplersLocation = gl.getUniformLocation(program, 'samplers');
    gl.uniform1iv(samplersLocation, texIs);

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

    var texturesTmp = texturesIn;
    surface.texturesIn = texturesOut;
    surface.texturesOut = texturesTmp;
};

/** @type {number} */
SubdivisionPre.prototype.size = 0;
