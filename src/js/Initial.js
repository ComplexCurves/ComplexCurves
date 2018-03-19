const GLSL = require('./GLSL.js');
const Mesh = require('./Mesh.js');
const StateGL = require('./StateGL.js');
const TransformFeedback = require('./TransformFeedback.js');

module.exports = class Initial {
    /**
     * @param {StateGL} stategl
     * @param {./Surface} surface
     */
    constructor(stategl, surface) {
        this.positionBuffer = /** WebGLBuffer */ null;
        this.program = /** WebGLProgram */ null;
        this.mkBuffers(stategl, surface, Mesh.tetrakis(2));
        this.mkProgram(stategl, surface);
    }

    /**
     * @param {StateGL} stategl
     * @param {./Surface} surface
     * @param {Array<number>} positions
     */
    mkBuffers(stategl, surface, positions) {
        const gl = stategl.gl;
        surface.numIndices = positions.length / 2;
        gl.enableVertexAttribArray(0);
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    }

    /**
     * @param {StateGL} stategl
     * @param {./Surface} surface
     */
    mkProgram(stategl, surface) {
        const sources = [
            StateGL.getShaderSource('Initial.vert'),
            StateGL.getShaderSource('Dummy.frag')
        ];
        sources[0] = surface.withCustomAndCommon(sources[0]);
        this.program = /** WebGLProgram */ stategl.mkProgram(sources, ["position", "delta",
            "subdivisionFlag", "values"
        ]);
    }

    /**
     * @param {StateGL} stategl
     * @param {./Surface} surface
     * @param {WebGLRenderingContext} gl
     */
    render(stategl, surface, gl) {
        gl.useProgram(this.program);
        const stride = 4 + 2 * GLSL.N;
        const size = stride * surface.numIndices;
        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        TransformFeedback.withTransformFeedback(gl, surface, size, function() {
            gl.drawArrays(gl.TRIANGLES, 0, surface.numIndices);
        });

        // store feedback values in textures
        TransformFeedback.toTextures(gl, surface);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
};
