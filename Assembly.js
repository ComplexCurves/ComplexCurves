/** @constructor
 *  @param {StateGL} stategl
 *  @param {function()} onload
 *  @implements {Stage} */
function Assembly(stategl, onload) {
    var assembly = this;
    var schedule = new Schedule([
        new Task("mkBuffers", [], function(oncomplete) {
            assembly.mkBuffers(stategl, null); // FIXME assembly.positions
            oncomplete();
        }),
        new Task("mkProgram", [], function(oncomplete) {
            assembly.mkProgram(stategl, oncomplete);
        }),
        new Task("ready", ["mkBuffers", "mkProgram"], onload)
    ]);
    schedule.run();
}

/** @type {WebGLBuffer} */
Assembly.prototype.indexBuffer = null;

/** @param {StateGL} stategl
 *  @param {ArrayBuffer} positions */
Assembly.prototype.mkBuffers = function(stategl, positions) {
    var gl = stategl.gl;
    this.indexBuffer = gl.createBuffer();
    var indices = [];
    for (var i = 0; i < this.size / 2; i++)
        indices[i] = i;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);
    this.framebuffer = gl.createFramebuffer();
};

/** @param {StateGL} stategl
 *  @param {function()} onload */
Assembly.prototype.mkProgram = function(stategl, onload) {
    var assembly = this;
    StateGL.getShaderSources("assembly", function(sources) {
        assembly.program = stategl.mkProgram(sources);
        onload();
    });
};

/** @param {StateGL} stategl
 *  @param {WebGLRenderingContext} gl */
Assembly.prototype.render = function(stategl, gl) {
    var texturesIn = stategl.texturesIn,
        textureOut = stategl.texturesOut[0];
    var numIndices = this.size / 2;
    var sheets = 2; // FIXME
    var webgl_draw_buffers = stategl["WEBGL_draw_buffers"];
    gl.useProgram(this.program);

    var indices = [];
    for (var i = 0; i < sheets * numIndices; i++)
        indices[i] = i;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.bindTexture(gl.TEXTURE_2D, textureOut);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
        textureOut, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
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
    var samplersLocation = gl.getUniformLocation(this.program, 'samplers');
    gl.uniform1iv(samplersLocation, texIs);
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, 2048, 2048);
    gl.drawArrays(gl.POINTS, 0, indices.length);
    gl.flush();
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
        null, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

/** @type {number} */
Assembly.prototype.size = 0;