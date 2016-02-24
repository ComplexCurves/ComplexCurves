/** @param {HTMLCanvasElement} canvas
 *  @param {function(StateGL)} onload
 *  @constructor */
function StateGL(canvas, onload) {
    var gl = /** @type WebGLRenderingContext */ (canvas.getContext('webgl', {
        preserveDrawingBuffer: true
    }));
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    this.gl = gl;
    this.mkRenderToTextureObjects();
    var stategl = this;
    stategl.mkFXAAProgram(function() {
        onload(stategl);
    });
}

/** @type {boolean} */
StateGL.prototype.clipping = false;

/** @type {boolean} */
StateGL.prototype.fxaa = true;

/** @type {WebGLProgram} */
StateGL.prototype.fxaaProgram = null;

/** @param {string} name */
StateGL.prototype.getExtension = function(name) {
    if (this[name] === undefined) {
        this[name] = this.gl.getExtension(name);
        if (!this[name]) {
            alert('Extension ' + name + ' not supported on your device');
            return;
        }
    }
};

/** @param {string} shaderId
 *  @param {function(Array<string>)} onload */
StateGL.getShaderSources = function(shaderId, onload) {
    var dir = '../shaders/';
    var files = [dir + shaderId + '.vert', dir + shaderId + '.frag'];
    Misc.loadTextFiles(files, onload);
};

/** @type {WebGLRenderingContext} */
StateGL.prototype.gl = null;

/** @param {function()} onload */
StateGL.prototype.mkFXAAProgram = function(onload) {
    var gl = this;
    StateGL.getShaderSources("FXAA", function(sources) {
        gl.fxaaProgram = gl.mkProgram(sources);
        onload();
    });
};

/** @param {Array<string>} sources
 *  @return {WebGLProgram} */
StateGL.prototype.mkProgram = function(sources) {
    var gl = this.gl;
    var vertexShaderSource = sources[0],
        fragmentShaderSource = sources[1];
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
        console.log(gl.getShaderInfoLog(vertexShader));
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
        console.log(gl.getShaderInfoLog(fragmentShader));
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
        console.log(gl.getProgramInfoLog(shaderProgram));
    gl.useProgram(shaderProgram);
    return shaderProgram;
};

StateGL.prototype.mkRenderToTextureObjects = function() {
    var gl = this.gl;

    this.rttArrayBuffer = /** @type {WebGLBuffer} */ (gl.createBuffer());
    gl.bindBuffer(gl.ARRAY_BUFFER, this.rttArrayBuffer);
    var vertices = [-1, -1, 3, -1, -1, 3];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    this.rttFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);

    this.rttRenderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.rttRenderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 2048,
        2048);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER,
        this.rttRenderbuffer);

    this.rttTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.rttTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2048, 2048, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
        this.rttTexture, 0);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

/** @type {number} */
StateGL.prototype.numIndices = 0;

/** @type {Polynomial} */
StateGL.prototype.polynomial = null;

/** @param {number} length
 *  @param {WebGLTexture} texture */
StateGL.prototype.printTexture = function(length, texture) {
    var gl = this.gl;
    var framebuffer = /** @type {WebGLFramebuffer} */ (gl.getParameter(gl.FRAMEBUFFER_BINDING));
    var readBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, readBuffer);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
        texture, 0);
    var pixels = new Float32Array(4 * 2048 * 2048);
    gl.readPixels(0, 0, 2048, 2048, gl.RGBA, gl.FLOAT, pixels);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
        null, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.deleteFramebuffer(readBuffer);
    console.log(Array.prototype.slice.call(pixels, 0, length));
};

/** @type {Stage} */
StateGL.prototype.renderer = null;

/** @param {State3D} st */
StateGL.prototype.renderSurface = function(st) {
    var gl = this.gl;
    var stategl = this;
    this.withOptionalFXAA(function() {
        stategl.renderer.render(stategl, gl, st);
    });
};

/** @type {WebGLBuffer} */
StateGL.prototype.rttArrayBuffer = null;

/** @type {WebGLFramebuffer} */
StateGL.prototype.rttFramebuffer = null;

/** @type {WebGLRenderbuffer} */
StateGL.prototype.rttRenderbuffer = null;

/** @type {WebGLTexture} */
StateGL.prototype.rttTexture = null;

StateGL.prototype.toggleAntialiasing = function() {
    this.fxaa = !this.fxaa;
};

StateGL.prototype.toggleClipping = function() {
    this.clipping = !this.clipping;
};

StateGL.prototype.toggleTransparency = function() {
    this.transparency = !this.transparency;
};

/** @type {boolean} */
StateGL.prototype.transparency = false;

StateGL.prototype.updateClipping = function() {
    var gl = this.gl;
    var program = /** @type {WebGLProgram|null} */ (gl.getParameter(gl.CURRENT_PROGRAM));
    var loc = gl.getUniformLocation(program, "clipping");
    gl.uniform1f(loc, this.clipping ? 1 : 0);
};

/** @param {State3D} st */
StateGL.prototype.updateModelMatrix = function(st) {
    this.updateUniformMatrix("m", st.modelMatrix());
};

/** @param {State3D} st */
StateGL.prototype.updateModelViewProjectionMatrices = function(st) {
    this.updateModelMatrix(st);
    this.updateViewMatrix(st);
    this.updateProjectionMatrix(st);
};

/** @param {State3D} st */
StateGL.prototype.updateProjectionMatrix = function(st) {
    var gl = this.gl,
        vp = gl.getParameter(gl.VIEWPORT),
        w = vp[2],
        h = vp[3];
    this.updateUniformMatrix("p", st.projectionMatrix(w, h));
};

/** @param {boolean=} transparency */
StateGL.prototype.updateTransparency = function(transparency) {
    var gl = this.gl;
    if (this.transparency && transparency !== false) {
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
    } else {
        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
    }
};

/** @param {string} i
 *  @param {Array<number>} ms */
StateGL.prototype.updateUniformMatrix = function(i, ms) {
    var gl = this.gl;
    var program = /** @type {WebGLProgram|null} */ (gl.getParameter(gl.CURRENT_PROGRAM));
    var loc = gl.getUniformLocation(program, i);
    gl.uniformMatrix4fv(loc, false, ms);
};

/** @param {State3D} st */
StateGL.prototype.updateViewMatrix = function(st) {
    this.updateUniformMatrix("v", st.viewMatrix());
};

/** @param {function()} action */
StateGL.prototype.withFXAA = function(action) {
    this.withRenderToTexture(action);
    var gl = this.gl;
    gl.useProgram(this.fxaaProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.rttArrayBuffer);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.rttTexture);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
};

/** @param {function()} action */
StateGL.prototype.withOptionalFXAA = function(action) {
    if (this.fxaa)
        this.withFXAA(action);
    else
        action();
};

/** @param {function()} action */
StateGL.prototype.withRenderToTexture = function(action) {
    var gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);
    action();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};
