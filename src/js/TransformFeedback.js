const GLSL = require('./GLSL.js');
const URLFactory = require('./URLFactory.js');

module.exports = class TransformFeedback {
    /**
     * @param {WebGLRenderingContext} gl
     * @param {./Surface} surface
     * @param {number=} stride
     * @suppress {reportUnknownTypes}
     * @return {Float32Array}
     */
    static toFloat32Array(gl, surface, stride = 4 + 2 * GLSL.N) {
        const size = stride * surface.numIndices;
        const output = new Float32Array(size);
        gl["bindTransformFeedback"](gl["TRANSFORM_FEEDBACK"], surface.transformFeedback);
        gl["bindBufferBase"](gl["TRANSFORM_FEEDBACK_BUFFER"], 0, surface.transformFeedbackBuffer);
        gl["getBufferSubData"](gl["TRANSFORM_FEEDBACK_BUFFER"], 0, output);
        gl["bindBufferBase"](gl["TRANSFORM_FEEDBACK_BUFFER"], 0, null);
        gl["bindTransformFeedback"](gl["TRANSFORM_FEEDBACK"], null);
        return output;
    }

    /**
     * @param {WebGLRenderingContext} gl
     * @param {./Surface} surface
     * @param {number=} stride
     */
    static toTextures(gl, surface, stride = 4 + 2 * GLSL.N) {
        const textures = surface.textures;
        const output = TransformFeedback.toFloat32Array(gl, surface, stride);
        const texData = new Float32Array(4 * 2048 * 2048);
        for (let i = 0; i <= GLSL.N / 2; i++) {
            gl.bindTexture(gl.TEXTURE_2D, textures[i]);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            for (let l = 0; l < surface.numIndices; l++) {
                for (let k = 0; k < 4; k++)
                    texData[4 * l + k] = output[stride * l + 4 * i + k];
            }
            gl.texImage2D(gl.TEXTURE_2D, 0, gl["RGBA16F"], 2048, 2048, 0, gl.RGBA,
                gl.FLOAT, texData);
        }
    }

    /**
     * @param {WebGLRenderingContext} gl
     * @param {./Surface} surface
     * @param {number=} stride
     * @return {string}
     */
    static toURL(gl, surface, stride = 4 + 2 * GLSL.N) {
        const pixels = TransformFeedback.toFloat32Array(gl, surface, stride);
        return URLFactory.pixelsToObjectURL(pixels);
    }

    /**
     * @param {WebGLRenderingContext} gl
     * @param {./Surface} surface
     * @param {number} size
     * @param {function()} action
     * @suppress {reportUnknownTypes}
     */
    static withTransformFeedback(gl, surface, size, action) {
        gl["bindTransformFeedback"](gl["TRANSFORM_FEEDBACK"], surface.transformFeedback);
        gl["bindBufferBase"](gl["TRANSFORM_FEEDBACK_BUFFER"], 0, surface.transformFeedbackBuffer);
        gl.bufferData(gl["TRANSFORM_FEEDBACK_BUFFER"], size * Float32Array.BYTES_PER_ELEMENT, gl["STATIC_COPY"]);
        gl["beginTransformFeedback"](gl.TRIANGLES);
        action();
        gl["endTransformFeedback"]();
        gl["bindBufferBase"](gl["TRANSFORM_FEEDBACK_BUFFER"], 0, null);
        gl["bindTransformFeedback"](gl["TRANSFORM_FEEDBACK"], null);
    }
};
