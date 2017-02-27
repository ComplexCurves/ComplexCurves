/**
 * @constructor
 * @param {StateGL} stategl
 * @param {Surface} surface
 * @implements {Stage}
 */
function Assembly(stategl, surface) {
    this.mkProgram(stategl, surface);
}

/**
 * @param {StateGL} stategl
 * @param {Surface} surface
 */
Assembly.prototype.mkProgram = function(stategl, surface) {
    var sources = [
        StateGL.getShaderSource('Assembly.vert'),
        StateGL.getShaderSource('Dummy.frag')
    ];
    sources[0] = surface.withCustomAndCommon(sources[0]);
    this.program = stategl.mkProgram(sources, ["posValue"]);
};

/** @type {WebGLProgram} */
Assembly.prototype.program = null;

/**
 * @param {StateGL} stategl
 * @param {Surface} surface
 * @param {WebGLRenderingContext} gl
 */
Assembly.prototype.render = function(stategl, surface, gl) {
    var texturesIn = surface.texturesIn,
        textureOut = surface.texturesOut[0];
    gl.useProgram(this.program);

    var numIndicesLoc = gl.getUniformLocation(this.program, 'numIndices');
    var numIndices = surface.numIndices;
    gl.uniform1f(numIndicesLoc, numIndices);

    surface.fillIndexBuffer(stategl);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);

    var sheets = surface.sheets;
    var stride = 4;
    var size = stride * numIndices * sheets;
    gl.bindBuffer(gl.ARRAY_BUFFER, surface.transformFeedbackBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, size * Float32Array.BYTES_PER_ELEMENT, gl["STATIC_COPY"]);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

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
    var samplersLocation = gl.getUniformLocation(this.program, 'samplers');
    gl.uniform1iv(samplersLocation, texIs);
    gl.disable(gl.DEPTH_TEST);

    gl["bindTransformFeedback"](gl["TRANSFORM_FEEDBACK"], surface.transformFeedback);
    gl["bindBufferBase"](gl["TRANSFORM_FEEDBACK_BUFFER"], 0, surface.transformFeedbackBuffer);
    gl["beginTransformFeedback"](gl.POINTS);

    var sheetLoc = gl.getUniformLocation(this.program, 'sheet');
    for (var sheet = 0; sheet < sheets; sheet++) {
        gl.uniform1f(sheetLoc, sheet);
        gl.drawArrays(gl.POINTS, 0, numIndices);
    }

    gl["endTransformFeedback"]();
    gl["bindBufferBase"](gl["TRANSFORM_FEEDBACK_BUFFER"], 0, null);
    gl["bindTransformFeedback"](gl["TRANSFORM_FEEDBACK"], null);

    surface.numIndices *= sheets;
    gl.enable(gl.DEPTH_TEST);
};
