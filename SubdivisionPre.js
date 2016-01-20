/** @constructor
 *  @param {StateGL} stategl
 *  @param {function()} onload
 *  @implements {Stage} */
function SubdivisionPre(stategl, onload) {
    var subdivisionPre = this;
    var schedule = new Schedule([
        new Task("mkBuffers", [], function(oncomplete) {
            subdivisionPre.mkBuffers(stategl);
            oncomplete();
        }),
        new Task("mkProgram", [], function(oncomplete) {
            subdivisionPre.mkProgram(stategl, oncomplete);
        }),
        new Task("ready", ["mkBuffers", "mkProgram"], onload)
    ]);
    schedule.run();
}

/** @type {WebGLBuffer} */
SubdivisionPre.prototype.indexBuffer = null;

/** @param {StateGL} stategl */
SubdivisionPre.prototype.mkBuffers = function(stategl) {
    var gl = stategl.gl;
    this.indexBuffer = gl.createBuffer();
    var indices = [];
    for (var i = 0; i < this.size / 2; i++)
        indices[i] = i;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);
};

/** @param {StateGL} stategl
 *  @param {function()} onload */
SubdivisionPre.prototype.mkProgram = function(stategl, onload) {
    var subdivisionPre = this;
    StateGL.getShaderSources("subdivision-pre", function(sources) {
        subdivisionPre.program = stategl.mkProgram(sources);
        onload();
    });
};

/** @param {StateGL} stategl
 *  @param {Surface} surface
 *  @param {WebGLRenderingContext} gl */
SubdivisionPre.prototype.render = function(stategl, surface, gl) {
    var textureIn = surface.texturesIn[0],
        textureOut = surface.texturesOut[0];
    var numIndices = this.size / 2;
    gl.useProgram(this.program);

    var indices = [];
    for (var i = 0; i < numIndices; i++)
        indices[i] = i;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, surface.framebuffer);
    gl.bindTexture(gl.TEXTURE_2D, textureOut);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
        textureOut, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureIn);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var samplerLocation = gl.getUniformLocation(this.program, 'sampler');
    gl.uniform1i(samplerLocation, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, 2048, 2048);
    gl.drawArrays(gl.POINTS, 0, numIndices);
    gl.flush();
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
        null, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

/** @type {number} */
SubdivisionPre.prototype.size = 0;
