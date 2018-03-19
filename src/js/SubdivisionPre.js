const GLSL = require('./GLSL.js');
const StateGL = require('./StateGL.js');
const TransformFeedback = require('./TransformFeedback.js');

module.exports = class SubdivisionPre {
    /**
     * @param {StateGL} stategl
     * @param {./SurfaceDTO} surfaceDTO
     */
    constructor(stategl, surfaceDTO) {
        this.program = /** WebGLProgram */ null;
        this.size = 0;
        this.textures = /** Array<WebGLTexture> */ null;
        this.mkProgram(stategl, surfaceDTO);
    }

    /**
     * @param {StateGL} stategl
     * @param {./SurfaceDTO} surfaceDTO
     */
    mkProgram(stategl, surfaceDTO) {
        const sources = [
            StateGL.getShaderSource('SubdivisionPre.vert'),
            StateGL.getShaderSource('Dummy.frag')
        ];
        sources[0] = surfaceDTO.withCustomAndCommon(sources[0]);
        this.program = stategl.mkProgram(sources, ["position", "delta",
            "subdivisionFlag", "values"
        ]);
    }

    /**
     * @param {StateGL} stategl
     * @param {./SurfaceDTO} surfaceDTO
     * @param {WebGLRenderingContext} gl
     */
    render(stategl, surfaceDTO, gl) {
        const textures = surfaceDTO.textures;
        const program = this.program;
        gl.useProgram(program);
        surfaceDTO.fillIndexBuffer(stategl);
        gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
        const stride = 4 + 2 * GLSL.N;
        const size = stride * surfaceDTO.numIndices;

        // prepare input textures
        const texIs = [];
        const l = textures.length;
        for (let i = 0; i < l; i++) {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, textures[i]);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            texIs[i] = i;
        }
        const samplersLocation = gl.getUniformLocation(program, 'samplers');
        gl.uniform1iv(samplersLocation, texIs);

        TransformFeedback.withTransformFeedback(gl, surfaceDTO, size, function() {
            gl.drawArrays(gl.TRIANGLES, 0, surfaceDTO.numIndices);
        });

        // store feedback values in textures
        TransformFeedback.toTextures(gl, surfaceDTO);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
};
