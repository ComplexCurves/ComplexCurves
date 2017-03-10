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
    var textures = surface.textures;
    gl.useProgram(this.program);

    var numIndicesLoc = gl.getUniformLocation(this.program, 'numIndices');
    var numIndices = surface.numIndices;
    gl.uniform1f(numIndicesLoc, numIndices);

    surface.fillIndexBuffer(stategl);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);

    var sheets = surface.sheets;
    var stride = 4;
    var size = stride * numIndices * sheets;

    var texIs = [];
    for (var i = 0, l = textures.length; i < l; i++) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, textures[i]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        texIs[i] = i;
    }
    var samplersLocation = gl.getUniformLocation(this.program, 'samplers');
    gl.uniform1iv(samplersLocation, texIs);
    gl.disable(gl.DEPTH_TEST);

    var sheetLoc = gl.getUniformLocation(this.program, 'sheet');
    TransformFeedback.withTransformFeedback(gl, surface, size, function() {
        for (var sheet = 0; sheet < sheets; sheet++) {
            gl.uniform1f(sheetLoc, sheet);
            gl.drawArrays(gl.POINTS, 0, numIndices);
        }
    });

    surface.numIndices *= sheets;
    gl.enable(gl.DEPTH_TEST);
};
