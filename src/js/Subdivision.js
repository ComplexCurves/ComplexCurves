/**
 * @constructor
 * @param {StateGL} stategl
 * @param {Surface} surface
 * @implements {Stage}
 */
function Subdivision(stategl, surface) {
    this.mkProgram(stategl, surface);
}

/**
 * @param {StateGL} stategl
 * @param {Surface} surface
 */
Subdivision.prototype.mkProgram = function(stategl, surface) {
    var sources = [
        StateGL.getShaderSource('Subdivision.vert'),
        StateGL.getShaderSource('Dummy.frag')
    ];
    sources[0] = surface.withCustomAndCommon(sources[0]);
    this.program = stategl.mkProgram(sources, ["position", "delta",
        "subdivisionFlag", "values"
    ]);
};

/** @type {WebGLProgram} */
Subdivision.prototype.program = null;

/**
 * @param {StateGL} stategl
 * @param {Surface} surface
 * @param {WebGLRenderingContext} gl
 */
Subdivision.prototype.render = function(stategl, surface, gl) {
    var i, l;
    var textures = surface.textures;
    var program = this.program;
    gl.useProgram(program);

    // read subdivision flags from transform feedback buffer
    var subdivisionFlags = new Float32Array(surface.numIndices);
    var buf = TransformFeedback.toFloat32Array(gl, surface);
    var stride = 4 + 2 * GLSL.N;
    var size = stride * surface.numIndices;
    for (i = 3, l = 0; i < size; i += stride, l++)
        subdivisionFlags[l] = buf[i];

    // prepare subdivision patterns and buffers
    var subdivisionPattern = [
        // 1st pattern (no subdivision)
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 2.0, 0.0, 0.0, 1.0,
        // 2nd pattern
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 2.0, 0.5, 0.0, 0.5,
        3.0, 0.0, 1.0, 0.0, 4.0, 0.0, 0.0, 1.0, 5.0, 0.5, 0.0, 0.5,
        // 3rd pattern
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 2.0, 0.0, 0.5, 0.5,
        3.0, 0.0, 0.5, 0.5, 4.0, 0.0, 0.0, 1.0, 5.0, 1.0, 0.0, 0.0,
        // 4th pattern
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 2.0, 0.5, 0.0, 0.5,
        3.0, 0.0, 0.5, 0.5, 4.0, 0.0, 0.0, 1.0, 5.0, 0.5, 0.0, 0.5,
        6.0, 0.5, 0.0, 0.5, 7.0, 0.0, 1.0, 0.0, 8.0, 0.0, 0.5, 0.5,
        // 5th pattern
        0.0, 1.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.0, 2.0, 0.0, 0.0, 1.0,
        3.0, 0.0, 0.0, 1.0, 4.0, 0.5, 0.5, 0.0, 5.0, 0.0, 1.0, 0.0,
        // 6th pattern
        0.0, 1.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.0, 2.0, 0.5, 0.0, 0.5,
        3.0, 0.5, 0.0, 0.5, 4.0, 0.5, 0.5, 0.0, 5.0, 0.0, 0.0, 1.0,
        6.0, 0.0, 1.0, 0.0, 7.0, 0.0, 0.0, 1.0, 8.0, 0.5, 0.5, 0.0,
        // 7th pattern
        0.0, 1.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.0, 2.0, 0.0, 0.5, 0.5,
        3.0, 0.0, 0.0, 1.0, 4.0, 1.0, 0.0, 0.0, 5.0, 0.0, 0.5, 0.5,
        6.0, 0.0, 0.5, 0.5, 7.0, 0.5, 0.5, 0.0, 8.0, 0.0, 1.0, 0.0,
        // 8th pattern
        0.0, 1.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.0, 2.0, 0.5, 0.0, 0.5,
        3.0, 0.5, 0.5, 0.0, 4.0, 0.0, 1.0, 0.0, 5.0, 0.0, 0.5, 0.5,
        6.0, 0.0, 0.5, 0.5, 7.0, 0.0, 0.0, 1.0, 8.0, 0.5, 0.0, 0.5,
        9.0, 0.5, 0.5, 0.0, 10.0, 0.0, 0.5, 0.5, 11.0, 0.5, 0.0, 0.5
    ];
    var subdivisionPatternFirst = [0, 3, 9, 15, 24, 30, 39, 48];
    var subdivisionPatternCount = [3, 6, 6, 9, 6, 9, 9, 12];

    // prepare input textures
    var texIs = [];
    for (i = 0, l = textures.length; i < l; i++) {
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

    var offsetsIn = [];
    var patterns = [];
    var /** number */ primitivesWritten = 0;
    // identify and prepare subdivision patterns
    for (i = 0, l = surface.numIndices / 3; i < l; i++) {
        var /** number */ patternIndex = 4 * subdivisionFlags[3 * i] +
            2 * subdivisionFlags[3 * i + 1] + subdivisionFlags[3 * i + 2];
        var /** number */ first = subdivisionPatternFirst[patternIndex];
        var /** number */ numIndices = subdivisionPatternCount[patternIndex];
        var pattern = subdivisionPattern.slice(4 * first,
            4 * (first + numIndices));
        patterns.push(pattern);
        for (var j = 0; j < numIndices; j++)
            offsetsIn.push(3 * i);
        primitivesWritten += numIndices;
    }
    patterns = Array.prototype.concat.apply([], patterns);

    size = stride * primitivesWritten;

    var patternsBuffer = gl.createBuffer();
    gl.enableVertexAttribArray(0);
    gl.bindBuffer(gl.ARRAY_BUFFER, patternsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(patterns), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);

    var offsetsInBuffer = gl.createBuffer();
    gl.enableVertexAttribArray(1);
    gl.bindBuffer(gl.ARRAY_BUFFER, offsetsInBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(offsetsIn), gl.STATIC_DRAW);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);

    TransformFeedback.withTransformFeedback(gl, surface, size, function() {
        gl.drawArrays(gl.TRIANGLES, 0, primitivesWritten);
    });

    surface.numIndices = primitivesWritten;

    // store feedback values in textures
    TransformFeedback.toTextures(gl, surface);

    for (i = 0, l = textures.length + 1; i < l; i++) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.deleteBuffer(offsetsInBuffer);
    gl.deleteBuffer(patternsBuffer);
    gl.disableVertexAttribArray(1);
};
