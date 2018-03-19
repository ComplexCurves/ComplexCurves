const StateGL = require('./StateGL.js');
const SurfaceDTO = require('./SurfaceDTO.js');
const TransformFeedback = require('./TransformFeedback.js');

module.exports = class Assembly {
    /**
     * @param {StateGL} stategl
     * @param {SurfaceDTO} surfaceDTO
     */
    constructor(stategl, surfaceDTO) {
        this.program = /** WebGLProgram */ null;
        this.mkProgram(stategl, surfaceDTO);
    }

    /**
     * @param {StateGL} stategl
     * @param {SurfaceDTO} surfaceDTO
     */
    mkProgram(stategl, surfaceDTO) {
        const sources = [
            StateGL.getShaderSource('Assembly.vert'),
            StateGL.getShaderSource('Dummy.frag')
        ];
        sources[0] = surfaceDTO.withCustomAndCommon(sources[0]);
        this.program = /** WebGLProgram */ stategl.mkProgram(sources, ["posValue"]);
    }

    /**
     * @param {StateGL} stategl
     * @param {SurfaceDTO} surfaceDTO
     * @param {WebGLRenderingContext} gl
     */
    render(stategl, surfaceDTO, gl) {
        const textures = surfaceDTO.textures;
        gl.useProgram(this.program);

        const numIndicesLoc = gl.getUniformLocation(this.program, 'numIndices');
        const numIndices = surfaceDTO.numIndices;
        gl.uniform1f(numIndicesLoc, numIndices);

        surfaceDTO.fillIndexBuffer(stategl);
        gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);

        const sheets = surfaceDTO.sheets;
        const stride = 4;
        const size = stride * numIndices * sheets;

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
        const samplersLocation = gl.getUniformLocation(this.program, 'samplers');
        gl.uniform1iv(samplersLocation, texIs);
        gl.disable(gl.DEPTH_TEST);

        const sheetLoc = gl.getUniformLocation(this.program, 'sheet');
        TransformFeedback.withTransformFeedback(gl, surfaceDTO, size, function() {
            for (let sheet = 0; sheet < sheets; sheet++) {
                gl.uniform1f(sheetLoc, sheet);
                gl.drawArrays(gl.TRIANGLES, 0, numIndices);
            }
        });

        surfaceDTO.numIndices *= sheets;
        gl.enable(gl.DEPTH_TEST);
    }
};
