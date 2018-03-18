const Assembly = require('./Assembly.js');
const GLSL = require('./GLSL.js');
const Export = require('./Export.js');
const Initial = require('./Initial.js');
const Polynomial = require('./Polynomial.js');
const State3D = require('./State3D.js');
const StateGL = require('./StateGL.js');
const Subdivision = require('./Subdivision.js');
const SubdivisionPre = require('./SubdivisionPre.js');
const TransformFeedback = require('./TransformFeedback.js');

module.exports = class Surface {
    /**
     * @param {StateGL} stategl
     * @param {Polynomial} polynomial
     * @param {number} depth
     */
    constructor(stategl, polynomial, depth) {
        this.commonShaderSrc = "";
        this.customShaderSrc = "";
        this.depth = depth;
        this.numIndices = 0;
        this.polynomial = polynomial;
        this.program = /** WebGLProgram */ null;
        this.sheets = polynomial.sheets();
        this.textures = /** Array<WebGLTexture> */ null;
        this.transformFeedback = /** WebGLTransformFeedback */ null;
        this.transformFeedbackBuffer = /** WebGLBuffer */ null;

        // surface must be bivariate and at least quadratic
        if (!polynomial.isBivariate()) {
            console.log("Equation must be bivariate!");
            return;
        }
        if (this.sheets < 2) {
            console.log("There must be at least two sheets!");
            return;
        }

        const gl = stategl.gl;

        this.indexBuffer = gl.createBuffer();
        this.mkTextures(stategl);
        this.mkTransformFeedback(stategl);

        this.commonShaderSrc = /** @type {string} */ (resources["Common.glsl"]).trim();
        this.customShaderSrc = GLSL.polynomialShaderSource(polynomial);
        this.initial = new Initial(stategl, this);
        this.initial.render(stategl, this, gl);
        this.subdivisionPre = new SubdivisionPre(stategl, this);
        this.subdivision = new Subdivision(stategl, this);
        for (let i = 0; i < this.depth; i++) {
            this.subdivisionPre.render(stategl, this, gl);
            this.subdivision.render(stategl, this, gl);
        }
        this.assembly = new Assembly(stategl, this);
        this.assembly.render(stategl, this, gl);
        this.mkProgram(stategl);
        const canvas = gl.canvas;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    /**
     * @param {StateGL} stategl
     * @param {boolean=} big
     * @return {Array<string>}
     */
    domainColouring(stategl, big = false) {
        return Export.domainColouring(this.polynomial, stategl, big);
    }

    /**
     * @param {StateGL} stategl
     * @param {string=} name
     */
    exportBinary(stategl, name = "surface.bin") {
        const url = TransformFeedback.toURL(stategl.gl, this, 4);
        Export.download(name, url);
    }

    /**
     * @param {StateGL} stategl
     * @param {string} name
     * @param {boolean=} big
     */
    exportDomainColouring(stategl, name = "sheet", big = true) {
        Export.exportDomainColouring(this.polynomial, stategl, name, big);
    }

    /**
     * @param {StateGL} stategl
     * @param {string=} name
     * @param {boolean=} big
     */
    exportSurface(stategl, name = "surface", big = true) {
        const pixels = TransformFeedback.toFloat32Array(stategl.gl, this, 4);
        Export.exportSurface(stategl, pixels, name, big);
    }

    /** @param {StateGL} stategl */
    fillIndexBuffer(stategl) {
        const gl = stategl.gl;
        const indices = [];
        for (let i = 0; i < this.numIndices; i++)
            indices[i] = i;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);
    }

    /** @param {StateGL} stategl */
    mkProgram(stategl) {
        const sources = StateGL.getShaderSources("Surface");
        sources[1] = this.withCustomAndCommon(sources[1]);
        this.program = stategl.mkProgram(sources);
    }

    /** @param {StateGL} stategl */
    mkTextures(stategl) {
        const gl = stategl.gl,
            textures = [];
        for (let i = 0; i < 5; i++) {
            textures[i] = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, textures[i]);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl["RGBA16F"], 2048, 2048, 0, gl.RGBA,
                gl.FLOAT, null);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);
        this.textures = textures;
    }

    /**
     * @param {StateGL} stategl
     * @suppress {reportUnknownTypes}
     */
    mkTransformFeedback(stategl) {
        const gl = stategl.gl;
        this.transformFeedback = gl["createTransformFeedback"]();
        this.transformFeedbackBuffer = gl.createBuffer();
    }

    /**
     * @param {StateGL} stategl
     * @param {WebGLRenderingContext} gl
     * @param {State3D} state3d
     */
    render(stategl, gl, state3d) {
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
    }

    /**
     * @param {string} src
     * @return {string}
     */
    withCustomAndCommon(src) {
        return ["#version 300 es", this.customShaderSrc, this.commonShaderSrc, src].join("\n");
    }
};
