const CachedSurface = require('./CachedSurface.js');
const Export = require('./Export.js');
const Surface = require('./Surface.js');
const State3D = require('./State3D.js');

module.exports = class StateGL {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {string=} contextType
     */
    constructor(canvas, contextType = 'webgl2') {
        let gl;
        this.bigTextureSize = 8192;
        this.clipping = false;
        this.contextType = contextType;
        this.fxaa = true;
        this.fxaaProgram = /** WebGLProgram */ null;
        this.polynomial = /** Polynomial */ null;
        this.renderer = ( /** @type {CachedSurface|Surface} */ (null));
        this.rttArrayBuffer = /** WebGLBuffer */ null;
        this.rttBigFramebuffer = /** WebGLFramebuffer */ null;
        this.rttBigRenderbuffer = /** WebGLRenderbuffer */ null;
        this.rttBigTexture = /** WebGLTexture */ null;
        this.rttFramebuffer = /** WebGLFramebuffer */ null;
        this.rttRenderbuffer = /** WebGLRenderbuffer */ null;
        this.rttTexture = /** WebGLTexture */ null;
        this.transparency = false;
        if (contextType === 'webgl') {
            this.gl = /** @type WebGLRenderingContext */ (canvas.getContext('webgl', {
                preserveDrawingBuffer: true
            }));
            gl = this.gl;
            let hasWebGL = !!gl;
            if (!hasWebGL) {
                alert('WebGL not supported. Please try another browser or platform.');
                throw new Error('WebGL not supported.');
            }

        } else {
            this.gl = /** @type WebGLRenderingContext */ (canvas.getContext('webgl2', {
                preserveDrawingBuffer: true
            }));
            gl = this.gl;
            let hasWebGL2 = !!gl;
            if (!hasWebGL2) {
                alert('WebGL 2 not supported. Please try another browser or platform.');
                throw new Error('WebGL 2 not supported.');
            }
        }
        gl.enable(gl.DEPTH_TEST);
        this.mkFXAAProgram();
        this.mkRenderToTextureObjects();
    }

    /** @param {string} name */
    getExtension(name) {
        if (this[name] === undefined) {
            this[name] = this.gl.getExtension(name);
            if (!this[name]) {
                alert('Required extension ' + name + ' not supported.' +
                    ' Please try another browser or platform.');
            }
        }
    }

    /**
     * @param {string} shader
     * @return {string}
     */
    static getShaderSource(shader) {
        return /** @type {string} */ (resources[shader]).trim();
    }

    /**
     * @param {string} shaderId
     * @return {Array<string>}
     */
    static getShaderSources(shaderId) {
        return [
            StateGL.getShaderSource(shaderId + '.vert'),
            StateGL.getShaderSource(shaderId + '.frag')
        ];
    }

    mkFXAAProgram() {
        const sources = StateGL.getShaderSources("FXAA");
        this.fxaaProgram = this.mkProgram(sources);
    }

    /**
     * @param {Array<string>} sources
     * @param {Array<string>=} transformFeedbackVaryings
     * @return {WebGLProgram}
     */
    mkProgram(sources, transformFeedbackVaryings) {
        const gl = this.gl;
        const vertexShaderSource = sources[0],
            fragmentShaderSource = sources[1];
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
            console.log(gl.getShaderInfoLog(vertexShader));
        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        if (sources[1]) {
            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, fragmentShaderSource);
            gl.compileShader(fragmentShader);
            if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
                console.log(gl.getShaderInfoLog(fragmentShader));
            gl.attachShader(shaderProgram, fragmentShader);
        }
        if (transformFeedbackVaryings) {
            gl["transformFeedbackVaryings"](shaderProgram, transformFeedbackVaryings,
                gl["INTERLEAVED_ATTRIBS"]);
            gl.enable(gl["RASTERIZER_DISCARD"]);
        } else if (this.contextType === 'webgl2') {
            gl.disable(gl["RASTERIZER_DISCARD"]);
        }
        gl.linkProgram(shaderProgram);
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
            console.log(gl.getProgramInfoLog(shaderProgram));
        gl.useProgram(shaderProgram);
        return shaderProgram;
    }

    mkRenderToTextureObjects() {
        const gl = this.gl;
        const big = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 8192);
        this.bigTextureSize = big;

        this.rttArrayBuffer = /** @type {WebGLBuffer} */ (gl.createBuffer());
        gl.bindBuffer(gl.ARRAY_BUFFER, this.rttArrayBuffer);
        const vertices = [-1, -1, 3, -1, -1, 3];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        this.rttBigFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttBigFramebuffer);

        this.rttBigRenderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.rttBigRenderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, big, big);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER,
            this.rttBigRenderbuffer);

        this.rttBigTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.rttBigTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, big, big, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
            this.rttBigTexture, 0);

        this.rttFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);

        this.rttRenderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.rttRenderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 2048, 2048);
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
    }


    /**
     * @param {WebGLTexture} texture
     * @param {number} length
     * @param {number=} offset
     * @suppress {checkTypes}
     */
    printTexture(texture, length, offset = 0) {
        console.log(JSON.stringify(Array.from(this.readTexture(texture, length, offset))));
    }

    /**
     * @param {WebGLTexture} texture
     * @param {number=} length
     * @param {number=} offset
     * @return {Float32Array|Uint8Array|null}
     */
    readTexture(texture, length, offset = 0) {
        const gl = this.gl;
        const framebuffer = /** @type {WebGLFramebuffer} */
            (gl.getParameter(gl.FRAMEBUFFER_BINDING));
        const readBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, readBuffer);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
            texture, 0);
        const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (complete !== gl.FRAMEBUFFER_COMPLETE) {
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D, null, 0);
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.deleteFramebuffer(readBuffer);
            return null;
        }
        let pixels;
        if (texture === this.rttTexture) {
            pixels = new Uint8Array(4 * 2048 * 2048);
            gl.getError();
            gl.readPixels(0, 0, 2048, 2048, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        } else if (texture === this.rttBigTexture) {
            const bigTextureSize = this.bigTextureSize;
            pixels = new Uint8Array(4 * bigTextureSize * bigTextureSize);
            gl.getError();
            gl.readPixels(0, 0, bigTextureSize, bigTextureSize, gl.RGBA,
                gl.UNSIGNED_BYTE, pixels);
        } else {
            pixels = new Float32Array(4 * 2048 * 2048);
            gl.getError();
            gl.readPixels(0, 0, 2048, 2048, gl.RGBA, gl.FLOAT, pixels);
        }
        const err = gl.getError();
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
            null, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.deleteFramebuffer(readBuffer);
        if (err !== gl.NO_ERROR)
            return null;
        if (length) {
            return pixels.subarray(offset, offset + length);
        } else {
            return pixels;
        }
    }

    /** @param {State3D} st */
    renderSurface(st) {
        const gl = this.gl;
        const stategl = this;
        this.withOptionalFXAA(function() {
            stategl.renderer.render(stategl, gl, st);
        });
    }

    /** @param {boolean} fxaa */
    setAntialiasing(fxaa) {
        this.fxaa = fxaa;
    }

    /** @param {boolean} clipping */
    setClipping(clipping) {
        this.clipping = clipping;
    }

    /** @param {boolean} transparency */
    setTransparency(transparency) {
        this.transparency = transparency;
    }

    /**
     * @param {WebGLTexture} texture
     * @param {number=} length
     * @return {string}
     */
    textureToURL(texture, length) {
        const pixels = this.readTexture(texture, length);
        return Export.pixelsToObjectURL(pixels);
    }

    toggleAntialiasing() {
        this.fxaa = !this.fxaa;
    }

    toggleClipping() {
        this.clipping = !this.clipping;
    }

    toggleTransparency() {
        this.transparency = !this.transparency;
    }

    updateClipping() {
        const gl = this.gl;
        const program = /** @type {WebGLProgram|null} */ (gl.getParameter(gl.CURRENT_PROGRAM));
        const loc = gl.getUniformLocation(program, "clipping");
        gl.uniform1f(loc, this.clipping ? 1 : 0);
    }

    /** @param {State3D} st */
    updateModelMatrix(st) {
        this.updateUniformMatrix("m", st.modelMatrix());
    }

    /** @param {State3D} st */
    updateModelViewProjectionMatrices(st) {
        this.updateModelMatrix(st);
        this.updateViewMatrix(st);
        this.updateProjectionMatrix(st);
    }

    /** @param {State3D} st */
    updateProjectionMatrix(st) {
        const gl = this.gl;
        const vp = gl.getParameter(gl.VIEWPORT);
        const w = /** @type {number} */ (vp[2]);
        const h = /** @type {number} */ (vp[3]);
        this.updateUniformMatrix("p", st.projectionMatrix(w, h));
    }

    /** @param {boolean=} transparency */
    updateTransparency(transparency) {
        const gl = this.gl;
        if (this.transparency && transparency !== false) {
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.enable(gl.BLEND);
            gl.disable(gl.DEPTH_TEST);
        } else {
            gl.disable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LESS);
        }
    }

    /**
     * @param {string} i
     * @param {Array<number>} ms
     */
    updateUniformMatrix(i, ms) {
        const gl = this.gl;
        const program = /** @type {WebGLProgram|null} */ (gl.getParameter(gl.CURRENT_PROGRAM));
        const loc = gl.getUniformLocation(program, i);
        gl.uniformMatrix4fv(loc, false, ms);
    }

    /** @param {State3D} st */
    updateViewMatrix(st) {
        this.updateUniformMatrix("v", st.viewMatrix());
    }

    /** @param {function()} action */
    withFXAA(action) {
        if (this.fxaaProgram === null)
            return;
        this.withRenderToTexture(action);
        const gl = this.gl;
        const program = this.fxaaProgram;
        gl.useProgram(program);
        let loc = gl.getUniformLocation(program, "width");
        gl.uniform1f(loc, gl.canvas.width);
        loc = gl.getUniformLocation(program, "height");
        gl.uniform1f(loc, gl.canvas.height);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.rttArrayBuffer);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.rttTexture);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    /** @param {function()} action */
    withOptionalFXAA(action) {
        if (this.fxaa && this.fxaaProgram !== null)
            this.withFXAA(action);
        else
            action();
    }

    /**
     * @param {function()} action
     * @param {boolean=} big
     */
    withRenderToTexture(action, big = false) {
        const gl = this.gl;
        if (big) {
            const bigTextureSize = this.bigTextureSize;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttBigFramebuffer);
            gl.viewport(0, 0, bigTextureSize, bigTextureSize);
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);
            gl.viewport(0, 0, 2048, 2048);
        }
        action();
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
};
