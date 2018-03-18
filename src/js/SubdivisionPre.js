const GLSL = require('./GLSL.js');
const StateGL = require('./StateGL.js');
const Surface = require('./Surface.js');
const TransformFeedback = require('./TransformFeedback.js');

module.exports = class SubdivisionPre {
    /**
     * @param {StateGL} stategl
     * @param {Surface} surface
     */
    constructor(stategl, surface) {
        this.program = /** WebGLProgram */ null;
        this.size = 0;
        this.textures = /** Array<WebGLTexture> */ null;
        this.mkProgram(stategl, surface);
    }

    /**
     * @param {StateGL} stategl
     * @param {Surface} surface
     */
    mkProgram(stategl, surface) {
        const sources = [
            StateGL.getShaderSource('SubdivisionPre.vert'),
            StateGL.getShaderSource('Dummy.frag')
        ];
        sources[0] = surface.withCustomAndCommon(sources[0]);
        this.program = stategl.mkProgram(sources, ["position", "delta",
            "subdivisionFlag", "values"
        ]);
    }

    /**
     * @param {StateGL} stategl
     * @param {Surface} surface
     * @param {WebGLRenderingContext} gl
     */
    render(stategl, surface, gl) {
        const textures = surface.textures;
        const program = this.program;
        gl.useProgram(program);
        surface.fillIndexBuffer(stategl);
        gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
        const stride = 4 + 2 * GLSL.N;
        const size = stride * surface.numIndices;

        // prepare input textures
        const texIs = [];
        let i = 0;
        const l = textures.length;
        for (; i < l; i++) {
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

        TransformFeedback.withTransformFeedback(gl, surface, size, function() {
            gl.drawArrays(gl.TRIANGLES, 0, surface.numIndices);
        });

        // store feedback values in textures
        TransformFeedback.toTextures(gl, surface);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
};
