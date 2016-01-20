/** @constructor
 *  @param {StateGL} stategl
 *  @param {Surface} surface
 *  @param {function()} onload
 *  @implements {Stage} */
function Initial(stategl, surface, onload) {
    var initial = this;
    var schedule = new Schedule([
        new Task("mkProgram", [], function(oncomplete) {
            initial.mkProgram(stategl, surface, oncomplete);
        }),
        new Task("loadModel", [], function(oncomplete) {
            // TODO generate mesh instead?
            initial.loadModel(stategl, "initial.bin", oncomplete);
        }),
        new Task("mkBuffers", ["loadModel"], function(oncomplete) {
            initial.mkBuffers(stategl, initial.positions);
            surface.numIndices = initial.positions.byteLength / (2 * 8);
            oncomplete();
        }),
        new Task("ready", ["mkBuffers", "mkProgram"], onload)
    ]);
    schedule.run();
}

/** @type {WebGLBuffer} */
Initial.prototype.indexBuffer = null;

/** @param {StateGL} stategl
 *  @param {string} file
 *  @param {function()} onload */
Initial.prototype.loadModel = function(stategl, file, onload) {
    var initial = this;
    var req = new XMLHttpRequest();
    req.open("GET", file, true);
    req.responseType = "arraybuffer";
    req.onload = function() {
        initial.positions = /** @type {ArrayBuffer|null} */ (req.response);
        onload();
    };
    req.send();
};

/** @param {StateGL} stategl
 *  @param {ArrayBuffer} positions */
Initial.prototype.mkBuffers = function(stategl, positions) {
    var gl = stategl.gl;
    this.size = positions.byteLength / 8;
    gl.enableVertexAttribArray(0);
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    this.indexBuffer = gl.createBuffer();
    var indices = [];
    for (var i = 0; i < this.size / 2; i++)
        indices[i] = i;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);
    this.framebuffer = gl.createFramebuffer();
};

/** @param {StateGL} stategl
 *  @param {Surface} surface
 *  @param {function()} onload */
Initial.prototype.mkProgram = function(stategl, surface, onload) {
    var initial = this;
    StateGL.getShaderSources("initial", function(sources) {
        sources[1] = [surface.customShaderSrc, surface.commonShaderSrc,
            sources[1]
        ].join("\n");
        initial.program = stategl.mkProgram(sources);
        onload();
    });
};

/** @type {ArrayBuffer} */
Initial.prototype.positions = null;

/** @type {WebGLBuffer} */
Initial.prototype.positionBuffer = null;

/** @param {StateGL} stategl
 *  @param {Surface} surface
 *  @param {WebGLRenderingContext} gl */
Initial.prototype.render = function(stategl, surface, gl) {
    var texturesIn = surface.texturesIn,
        texturesOut = surface.texturesOut;
    var numIndices = this.size / 2;
    var webgl_draw_buffers = stategl["WEBGL_draw_buffers"];
    gl.useProgram(this.program);
    gl.enableVertexAttribArray(0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.indexBuffer);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
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
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, 2048, 2048);
    gl.drawArrays(gl.POINTS, 0, numIndices);
    gl.flush();

    webgl_draw_buffers.drawBuffersWEBGL([
        webgl_draw_buffers.COLOR_ATTACHMENT0_WEBGL
    ]);
    for (i = 0; i < texturesOut.length; i++) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i,
            gl.TEXTURE_2D, null, 0);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(1);
};

/** @type {number} */
Initial.prototype.size = 0;
