const GLSL = require('./GLSL.js');
const StateGL = require('./StateGL.js');

module.exports = class SurfaceDTO {
    /**
     * @param {StateGL} stategl
     * @param {./Polynomial} polynomial
     * @param {number} depth
     */
    constructor(stategl, polynomial, depth) {
        this.commonShaderSrc = /** @type {string} */ (resources["Common.glsl"]).trim();
        this.customShaderSrc = GLSL.polynomialShaderSource(polynomial);
        this.depth = depth;
        this.indexBuffer = stategl.gl.createBuffer();
        this.numIndices = ( /** @type {number} */ (0));
        this.polynomial = polynomial;
        this.sheets = polynomial.sheets();
        this.textures = /** Array<WebGLTexture> */ null;
        this.transformFeedback = /** WebGLTransformFeedback */ null;
        this.transformFeedbackBuffer = /** WebGLBuffer */ null;

        this.mkTextures(stategl);
        this.mkTransformFeedback(stategl);
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
     * @param {string} src
     * @return {string}
     */
    withCustomAndCommon(src) {
        return ["#version 300 es", this.customShaderSrc, this.commonShaderSrc, src].join("\n");
    }
};
