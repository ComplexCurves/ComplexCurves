const GLSL = require('./GLSL.js');
const Mesh = require('./Mesh.js');
const StateGL = require('./StateGL.js');
const TransformFeedback = require('./TransformFeedback.js');

module.exports = class Initial {
    /**
     * @param {StateGL} stategl
     * @param {./SurfaceDTO} surfaceDTO
     */
    constructor(stategl, surfaceDTO) {
        this.positionBuffer = /** WebGLBuffer */ null;
        this.program = /** WebGLProgram */ null;
        this.mkBuffers(stategl, surfaceDTO, Mesh.tetrakis(2));
        this.mkProgram(stategl, surfaceDTO);
    }

    /**
     * @param {StateGL} stategl
     * @param {./SurfaceDTO} surfaceDTO
     * @param {Array<number>} positions
     */
    mkBuffers(stategl, surfaceDTO, positions) {
        const gl = stategl.gl;
        surfaceDTO.numIndices = positions.length / 2;
        gl.enableVertexAttribArray(0);
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    }

    /**
     * @param {StateGL} stategl
     * @param {./SurfaceDTO} surfaceDTO
     */
    mkProgram(stategl, surfaceDTO) {
        const sources = [
            StateGL.getShaderSource('Initial.vert'),
            StateGL.getShaderSource('Dummy.frag')
        ];
        sources[0] = surfaceDTO.withCustomAndCommon(sources[0]);
        this.program = /** WebGLProgram */ stategl.mkProgram(sources, ["position", "delta",
            "subdivisionFlag", "values"
        ]);
    }

    /**
     * @param {StateGL} stategl
     * @param {./SurfaceDTO} surfaceDTO
     * @param {WebGLRenderingContext} gl
     */
    render(stategl, surfaceDTO, gl) {
        gl.useProgram(this.program);
        const stride = 4 + 2 * GLSL.N;
        const size = stride * surfaceDTO.numIndices;
        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        TransformFeedback.withTransformFeedback(gl, surfaceDTO, size, function() {
            gl.drawArrays(gl.TRIANGLES, 0, surfaceDTO.numIndices);
        });

        // store feedback values in textures
        TransformFeedback.toTextures(gl, surfaceDTO);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
};
