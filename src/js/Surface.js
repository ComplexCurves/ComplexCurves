/**
 * @constructor
 * @param {StateGL} stategl
 * @param {Polynomial} polynomial
 * @param {number} depth
 * @implements {Stage}
 */
function Surface(stategl, polynomial, depth) {
    var surface = this;
    this.polynomial = polynomial;
    this.depth = depth;
    surface.sheets = polynomial.sheets();
    // surface must be bivariate and at least quadratic
    if (!polynomial.isBivariate()) {
        console.log("Equation must be bivariate!");
        return;
    }
    if (surface.sheets < 2) {
        console.log("There must be at least two sheets!");
        return;
    }

    var gl = stategl.gl;

    this.indexBuffer = gl.createBuffer();
    this.mkTextures(stategl);
    this.mkTransformFeedback(stategl);

    surface.commonShaderSrc = /** @type {string} */ (resources["Common.glsl"]).trim();
    surface.customShaderSrc = GLSL.polynomialShaderSource(polynomial);
    surface.initial = new Initial(stategl, surface);
    surface.initial.render(stategl, surface, gl);
    surface.subdivisionPre = new SubdivisionPre(stategl, surface);
    surface.subdivision = new Subdivision(stategl, surface);
    for (var i = 0; i < surface.depth; i++) {
        surface.subdivisionPre.render(stategl, surface, gl);
        surface.subdivision.render(stategl, surface, gl);
    }
    surface.assembly = new Assembly(stategl, surface);
    surface.assembly.render(stategl, surface, gl);
    surface.mkProgram(stategl);
    var canvas = gl.canvas;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

/** @type {string} */
Surface.prototype.commonShaderSrc = "";

/** @type {string} */
Surface.prototype.customShaderSrc = "";

/**
 * @param {StateGL} stategl
 * @param {boolean=} big
 * @return {Array<string>}
 */
Surface.prototype.domainColouring = function(stategl, big = false) {
    return Export.domainColouring(this.polynomial, stategl, big);
};

/**
 * @param {StateGL} stategl
 * @param {string=} name
 */
Surface.prototype.exportBinary = function(stategl, name = "surface.bin") {
    var url = TransformFeedback.toURL(stategl.gl, this, 4);
    Export.download(name, url);
};

/**
 * @param {StateGL} stategl
 * @param {string} name
 * @param {boolean=} big
 */
Surface.prototype.exportDomainColouring = function(stategl, name = "sheet", big = true) {
    Export.exportDomainColouring(this.polynomial, stategl, name, big);
};

/**
 * @param {StateGL} stategl
 * @param {string=} name
 * @param {boolean=} big
 */
Surface.prototype.exportSurface = function(stategl, name = "surface", big = true) {
    var pixels = TransformFeedback.toFloat32Array(stategl.gl, this, 4);
    Export.exportSurface(stategl, pixels, name, big);
};

/** @param {StateGL} stategl */
Surface.prototype.fillIndexBuffer = function(stategl) {
    var gl = stategl.gl;
    var indices = [];
    for (var i = 0; i < this.numIndices; i++)
        indices[i] = i;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);
};

/** @type {WebGLBuffer} */
Surface.prototype.indexBuffer = null;

/** @param {StateGL} stategl */
Surface.prototype.mkProgram = function(stategl) {
    var sources = StateGL.getShaderSources("Surface");
    sources[1] = this.withCustomAndCommon(sources[1]);
    this.program = stategl.mkProgram(sources);
};

/** @param {StateGL} stategl */
Surface.prototype.mkTextures = function(stategl) {
    var gl = stategl.gl,
        textures = [];
    for (var i = 0; i < 5; i++) {
        textures[i] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, textures[i]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl["RGBA16F"], 2048, 2048, 0, gl.RGBA,
            gl.FLOAT, null);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.textures = textures;
};

/**
 * @param {StateGL} stategl
 */
Surface.prototype.mkTransformFeedback = function(stategl) {
    var gl = stategl.gl;
    this.transformFeedback = gl["createTransformFeedback"]();
    this.transformFeedbackBuffer = gl.createBuffer();
};

/** @type {number} */
Surface.prototype.numIndices = 0;

/** @type {WebGLProgram} */
Surface.prototype.program = null;

/**
 * @param {StateGL} stategl
 * @param {WebGLRenderingContext} gl
 * @param {State3D} state3d
 */
Surface.prototype.render = function(stategl, gl, state3d) {
    if (!this.program)
        return;
    gl.useProgram(this.program);
    stategl.updateClipping();
    stategl.updateModelViewProjectionMatrices(state3d);
    stategl.updateTransparency();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.transformFeedbackBuffer);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, this.numIndices);
    stategl.updateTransparency(false);
};

/** @type {number} */
Surface.prototype.sheets = 0;

/** @type {Array<WebGLTexture>} */
Surface.prototype.textures = [];

/** @type {WebGLBuffer} */
Surface.prototype.transformFeedbackBuffer = null;

/**
 * @param {string} src
 * @return {string}
 */
Surface.prototype.withCustomAndCommon = function(src) {
    return [this.customShaderSrc, this.commonShaderSrc, src].join("\n");
};
