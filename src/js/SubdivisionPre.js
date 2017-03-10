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
    var textures = surface.textures;
    var program = this.program;
    gl.useProgram(program);
    surface.fillIndexBuffer(stategl);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
    var stride = 4 + 2 * GLSL.N;
    var size = stride * surface.numIndices;

    // prepare input textures
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
    var samplersLocation = gl.getUniformLocation(program, 'samplers');
    gl.uniform1iv(samplersLocation, texIs);

    TransformFeedback.withTransformFeedback(gl, surface, size, function() {
        gl.drawArrays(gl.POINTS, 0, surface.numIndices);
    });

    // store feedback values in textures
    TransformFeedback.toTextures(gl, surface);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

/** @type {number} */
SubdivisionPre.prototype.size = 0;
