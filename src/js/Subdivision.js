const GLSL = require('./GLSL.js');
const StateGL = require('./StateGL.js');
const TransformFeedback = require('./TransformFeedback.js');

module.exports = class Subdivision {
    /**
     * @param {StateGL} stategl
     * @param {./SurfaceDTO} surfaceDTO
     */
    constructor(stategl, surfaceDTO) {
        this.program = /** WebGLProgram */ null;
        this.textures = /** Array<WebGLTexture> */ null;
        this.mkProgram(stategl, surfaceDTO);
    }

    /**
     * @param {StateGL} stategl
     * @param {./SurfaceDTO} surfaceDTO
     */
    mkProgram(stategl, surfaceDTO) {
        const sources = [
            StateGL.getShaderSource('Subdivision.vert'),
            StateGL.getShaderSource('Dummy.frag')
        ];
        sources[0] = surfaceDTO.withCustomAndCommon(sources[0]);
        this.program = stategl.mkProgram(sources, ["position", "delta", "subdivisionFlag", "values"]);
    }

    /**
     * @param {StateGL} stategl
     * @param {./SurfaceDTO} surfaceDTO
     * @param {WebGLRenderingContext} gl
     */
    render(stategl, surfaceDTO, gl) {
        let i, l;
        const textures = surfaceDTO.textures;
        const program = this.program;
        gl.useProgram(program);

        // read subdivision flags from transform feedback buffer
        const subdivisionFlags = new Float32Array(surfaceDTO.numIndices);
        const buf = TransformFeedback.toFloat32Array(gl, surfaceDTO);
        const stride = 4 + 2 * GLSL.N;
        let size = stride * surfaceDTO.numIndices;
        for (i = 3, l = 0; i < size; i += stride, l++)
            subdivisionFlags[l] = buf[i];

        // prepare subdivision patterns and buffers
        // subdivision patterns are given in barycentric coordinates
        const subdivisionPattern = [
            // 1st pattern (no subdivision)
            1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0,
            // 2nd pattern (split 3rd edge)
            1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.5, 0.0, 0.5,
            0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.5, 0.0, 0.5,
            // 3rd pattern (split 2nd edge)
            1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.5, 0.5,
            0.0, 0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0,
            // 4th pattern (split 2nd and 3rd edge)
            1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.5, 0.0, 0.5,
            0.0, 0.5, 0.5, 0.0, 0.0, 1.0, 0.5, 0.0, 0.5,
            0.5, 0.0, 0.5, 0.0, 1.0, 0.0, 0.0, 0.5, 0.5,
            // 5th pattern (split 1st edge)
            1.0, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 0.5, 0.5, 0.0, 0.0, 1.0, 0.0,
            // 6th pattern (split 1st and 3rd edge)
            1.0, 0.0, 0.0, 0.5, 0.5, 0.0, 0.5, 0.0, 0.5,
            0.5, 0.0, 0.5, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.0,
            // 7th pattern (split 1st and 2nd edge)
            1.0, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.5, 0.5,
            0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.5, 0.5,
            0.0, 0.5, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 0.0,
            // 8th pattern (split all edges)
            1.0, 0.0, 0.0, 0.5, 0.5, 0.0, 0.5, 0.0, 0.5,
            0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0, 0.5, 0.5,
            0.0, 0.5, 0.5, 0.0, 0.0, 1.0, 0.5, 0.0, 0.5,
            0.5, 0.5, 0.0, 0.0, 0.5, 0.5, 0.5, 0.0, 0.5,
            // 9th pattern (variation of 4th pattern)
            1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.5, 0.5,
            0.0, 0.5, 0.5, 0.5, 0.0, 0.5, 1.0, 0.0, 0.0,
            0.5, 0.0, 0.5, 0.0, 0.5, 0.5, 0.0, 0.0, 1.0,
            // 10th pattern (variation of 6th pattern)
            1.0, 0.0, 0.0, 0.5, 0.5, 0.0, 0.5, 0.0, 0.5,
            0.5, 0.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 0.0,
            0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.5, 0.0, 0.5,
            // 11th pattern (variation of 7th pattern)
            1.0, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 0.5, 0.5, 0.0, 0.0, 0.5, 0.5,
            0.0, 0.5, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 0.0
        ];
        const subdivisionPatternFirst = [0, 3, 9, 15, 24, 30, 39, 48, 60, 69, 78];
        const subdivisionPatternCount = [3, 6, 6, 9, 6, 9, 9, 12, 9, 9, 9];

        // prepare input textures
        const texIs = [];
        for (i = 0, l = textures.length; i < l; i++) {
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

        const offsetsIn = [];
        let patterns = [];
        let /** number */ primitivesWritten = 0;
        // identify and prepare subdivision patterns
        for (i = 0, l = surfaceDTO.numIndices / 3; i < l; i++) {
            const /** number */ patternIndex = subdivisionFlags[3 * i];
            const /** number */ first = subdivisionPatternFirst[patternIndex];
            const /** number */ numIndices = subdivisionPatternCount[patternIndex];
            const pattern = subdivisionPattern.slice(3 * first,
                3 * (first + numIndices));
            patterns.push(pattern);
            for (let j = 0; j < numIndices; j++)
                offsetsIn.push(3 * i);
            primitivesWritten += numIndices;
        }
        patterns = Array.prototype.concat.apply([], patterns);

        size = stride * primitivesWritten;

        const patternsBuffer = gl.createBuffer();
        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, patternsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(patterns), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        const offsetsInBuffer = gl.createBuffer();
        gl.enableVertexAttribArray(1);
        gl.bindBuffer(gl.ARRAY_BUFFER, offsetsInBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(offsetsIn), gl.STATIC_DRAW);
        gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);

        TransformFeedback.withTransformFeedback(gl, surfaceDTO, size, function() {
            gl.drawArrays(gl.TRIANGLES, 0, primitivesWritten);
        });

        surfaceDTO.numIndices = primitivesWritten;

        // store feedback values in textures
        TransformFeedback.toTextures(gl, surfaceDTO);

        for (i = 0, l = textures.length + 1; i < l; i++) {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.deleteBuffer(offsetsInBuffer);
        gl.deleteBuffer(patternsBuffer);
        gl.disableVertexAttribArray(1);
    }
};
