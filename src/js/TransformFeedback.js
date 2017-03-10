var TransformFeedback = {};

/**
 * @param {WebGLRenderingContext} gl
 * @param {Surface} surface
 * @param {number=} stride
 * @return {Float32Array}
 */
TransformFeedback.toFloat32Array = function(gl, surface, stride = 4 + 2 * GLSL.N) {
    var size = stride * surface.numIndices;
    var output = new Float32Array(size);
    gl["bindTransformFeedback"](gl["TRANSFORM_FEEDBACK"], surface.transformFeedback);
    gl["bindBufferBase"](gl["TRANSFORM_FEEDBACK_BUFFER"], 0, surface.transformFeedbackBuffer);
    gl["getBufferSubData"](gl["TRANSFORM_FEEDBACK_BUFFER"], 0, output);
    gl["bindBufferBase"](gl["TRANSFORM_FEEDBACK_BUFFER"], 0, null);
    gl["bindTransformFeedback"](gl["TRANSFORM_FEEDBACK"], null);
    return output;
};

/**
 * @param {WebGLRenderingContext} gl
 * @param {Surface} surface
 * @param {number=} stride
 */
TransformFeedback.toTextures = function(gl, surface, stride = 4 + 2 * GLSL.N) {
    var textures = surface.textures;
    var output = TransformFeedback.toFloat32Array(gl, surface, stride);
    var texData = new Float32Array(4 * 2048 * 2048);
    for (var i = 0; i <= GLSL.N / 2; i++) {
        gl.bindTexture(gl.TEXTURE_2D, textures[i]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        for (var l = 0; l < surface.numIndices; l++) {
            for (var k = 0; k < 4; k++)
                texData[4 * l + k] = output[stride * l + 4 * i + k];
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl["RGBA16F"], 2048, 2048, 0, gl.RGBA,
            gl.FLOAT, texData);
    }
};

/**
 * @param {WebGLRenderingContext} gl
 * @param {Surface} surface
 * @param {number=} stride
 * @return {string}
 */
TransformFeedback.toURL = function(gl, surface, stride = 4 + 2 * GLSL.N) {
    var pixels = TransformFeedback.toFloat32Array(gl, surface, stride);
    return Export.pixelsToObjectURL(pixels);
};

/**
 * @param {WebGLRenderingContext} gl
 * @param {Surface} surface
 * @param {number} size
 * @param {function()} action
 */
TransformFeedback.withTransformFeedback = function(gl, surface, size, action) {
    gl["bindTransformFeedback"](gl["TRANSFORM_FEEDBACK"], surface.transformFeedback);
    gl["bindBufferBase"](gl["TRANSFORM_FEEDBACK_BUFFER"], 0, surface.transformFeedbackBuffer);
    gl.bufferData(gl["TRANSFORM_FEEDBACK_BUFFER"], size * Float32Array.BYTES_PER_ELEMENT, gl["STATIC_COPY"]);
    gl["beginTransformFeedback"](gl.TRIANGLES);
    action();
    gl["endTransformFeedback"]();
    gl["bindBufferBase"](gl["TRANSFORM_FEEDBACK_BUFFER"], 0, null);
    gl["bindTransformFeedback"](gl["TRANSFORM_FEEDBACK"], null);
};
