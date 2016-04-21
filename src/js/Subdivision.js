/** @constructor
 *  @param {StateGL} stategl
 *  @param {Surface} surface
 *  @implements {Stage} */
function Subdivision(stategl, surface) {
    this.mkProgram(stategl, surface);
}

/** @param {StateGL} stategl
 *  @param {Surface} surface */
Subdivision.prototype.mkProgram = function(stategl, surface) {
    var sources = StateGL.getShaderSources("Subdivision");
    sources[0] = surface.withTextures(sources[0]);
    sources[1] = surface.withCustomAndCommon(sources[1]);
    this.program = stategl.mkProgram(sources);
};

/** @param {StateGL} stategl
 *  @param {Surface} surface
 *  @param {WebGLRenderingContext} gl */
Subdivision.prototype.render = function(stategl, surface, gl) {
    var texturesIn = surface.texturesIn,
        texturesOut = surface.texturesOut;
    var numTriangles = surface.numIndices / 3;
    var webgl_draw_buffers = stategl["WEBGL_draw_buffers"];
    var program = this.program;
    gl.useProgram(program);

    // read texture into array
    var readBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, readBuffer);
    gl.bindTexture(gl.TEXTURE_2D, texturesIn[0]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
        texturesIn[0], 0);
    var pixels = new Float32Array(4 * 2048 * 2048);
    gl.readPixels(0, 0, 2048, 2048, gl.RGBA, gl.FLOAT, pixels);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
        null, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(readBuffer);
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
    var subdivisionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, subdivisionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(subdivisionPattern),
        gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    // prepare output textures
    gl.bindFramebuffer(gl.FRAMEBUFFER, surface.framebuffer);
    for (var i = 0; i < texturesOut.length; i++) {
        gl.bindTexture(gl.TEXTURE_2D, texturesOut[i]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2048, 2048, 0, gl.RGBA,
            gl.FLOAT, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i,
            gl.TEXTURE_2D, texturesOut[i], 0);
    }
    webgl_draw_buffers.drawBuffersWEBGL([
        webgl_draw_buffers.COLOR_ATTACHMENT0_WEBGL,
        webgl_draw_buffers.COLOR_ATTACHMENT1_WEBGL,
        webgl_draw_buffers.COLOR_ATTACHMENT2_WEBGL,
        webgl_draw_buffers.COLOR_ATTACHMENT3_WEBGL,
        webgl_draw_buffers.COLOR_ATTACHMENT4_WEBGL
    ]);
    // prepare input textures
    var texIs = [];
    for (i = 0; i < texturesIn.length; i++) {
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
    // identify and render subdivision patterns
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, 2048, 2048);
    var indexOffsetInLocation = gl.getUniformLocation(program,
        'indexOffsetIn');
    var indexOffsetOutLocation = gl.getUniformLocation(program,
        'indexOffsetOut');
    var patternIndex, numIndices;
    var primitivesWritten = 0;
    for (i = 0; i < numTriangles; i++) {
        gl.uniform1f(indexOffsetInLocation, 3 * i);
        gl.uniform1f(indexOffsetOutLocation, primitivesWritten);
        patternIndex = 4 * pixels[12 * i + 3] + 2 * pixels[12 * i + 7] +
            pixels[12 * i + 11];
        numIndices = subdivisionPatternCount[patternIndex];
        gl.drawArrays(gl.POINTS, subdivisionPatternFirst[patternIndex],
            numIndices);
        primitivesWritten += numIndices;
    }

    // cleanup
    for (i = 0; i < 5; i++)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i,
            gl.TEXTURE_2D, null, 0);
    for (i = 0; i < 5; i++) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.deleteBuffer(subdivisionBuffer);

    surface.numIndices = primitivesWritten;
    var texturesTmp = texturesIn;
    surface.texturesIn = texturesOut;
    surface.texturesOut = texturesTmp;
};
