const StateGL = require('./StateGL.js');
const Surface = require('./Surface.js');
const TransformFeedback = require('./TransformFeedback.js');

module.exports = class Assembly {
    /**
     * @param {StateGL} stategl
     * @param {Surface} surface
     */
    constructor(stategl, surface) {
        this.program = /** WebGLProgram */ null;
        this.mkProgram(stategl, surface);
    }

    /**
     * @param {StateGL} stategl
     * @param {Surface} surface
     */
    mkProgram(stategl, surface) {
        const sources = [
            StateGL.getShaderSource('Assembly.vert'),
            StateGL.getShaderSource('Dummy.frag')
        ];
        sources[0] = surface.withCustomAndCommon(sources[0]);
        this.program = /** WebGLProgram */ stategl.mkProgram(sources, ["posValue"]);
    }

    /**
     * @param {StateGL} stategl
     * @param {Surface} surface
     * @param {WebGLRenderingContext} gl
     */
    render(stategl, surface, gl) {
        const textures = surface.textures;
        gl.useProgram(this.program);

        const numIndicesLoc = gl.getUniformLocation(this.program, 'numIndices');
        const numIndices = surface.numIndices;
        gl.uniform1f(numIndicesLoc, numIndices);

        surface.fillIndexBuffer(stategl);
        gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);

        const sheets = surface.sheets;
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
        TransformFeedback.withTransformFeedback(gl, surface, size, function() {
            for (let sheet = 0; sheet < sheets; sheet++) {
                gl.uniform1f(sheetLoc, sheet);
                gl.drawArrays(gl.TRIANGLES, 0, numIndices);
            }
        });

        surface.numIndices *= sheets;
        gl.enable(gl.DEPTH_TEST);
    }
};
