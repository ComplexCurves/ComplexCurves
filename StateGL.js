/** @constructor */
function StateGL(canvas) {
    var gl = canvas.getContext('webgl', {
        preserveDrawingBuffer: true
    });
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    this.gl = gl;
}

/** @type {boolean} */
StateGL.prototype.cached;

/** @type {WebGLProgram} */
StateGL.prototype.cachedSurfaceProgram;

/** @param {string} shaderId
 *  @param {function(Array<string>)} onload */
StateGL.getShaderSources = function(shaderId, onload) {
    var files = [shaderId + '-vs.glsl', shaderId + '-fs.glsl'];
    Misc.loadTextFiles(files, onload);
};

/** @type {WebGLRenderingContext} */
StateGL.prototype.gl;

/** @param {ArrayBuffer} positions */
StateGL.prototype.mkBuffer = function(positions) {
    var gl = this.gl;
    gl.enableVertexAttribArray(0);
    var positionsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
};

/** @param {Array<string>} sources
 *  @return {WebGLProgram} */
StateGL.prototype.mkProgram = function(sources) {
    var gl = this.gl;
    var vertexShaderSource = sources[0],
        fragmentShaderSource = sources[1];
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
        console.log(gl.getShaderInfoLog(vertexShader));
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
        console.log(gl.getShaderInfoLog(fragmentShader));
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
        console.log(gl.getProgramInfoLog(shaderProgram));
    gl.useProgram(shaderProgram);
    return shaderProgram;
};

/** @param {State3D} st */
StateGL.prototype.renderSurface = function(st) {
    var gl = this.gl;
    this.updateModelViewProjectionMatrices(st);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, this.size);
};

/** @type {number} */
StateGL.prototype.size = 0;

/** @param {State3D} st */
StateGL.prototype.updateModelMatrix = function(st) {
    this.updateUniformMatrix("m", st.modelMatrix());
};

/** @param {State3D} st */
StateGL.prototype.updateModelViewProjectionMatrices = function(st) {
    this.updateModelMatrix(st);
    this.updateViewMatrix(st);
    this.updateProjectionMatrix(st);
};

/** @param {State3D} st */
StateGL.prototype.updateProjectionMatrix = function(st) {
    var gl = this.gl,
        vp = gl.getParameter(gl.VIEWPORT),
        w = vp[2],
        h = vp[3];
    this.updateUniformMatrix("p", st.projectionMatrix(w, h));
};

/** @param {string} i
 *  @param {Array<number>} ms */
StateGL.prototype.updateUniformMatrix = function(i, ms) {
    var gl = this.gl;
    var program = /** @type {WebGLProgram|null} */ (gl.getParameter(gl.CURRENT_PROGRAM));
    var loc = gl.getUniformLocation(program, i);
    gl.uniformMatrix4fv(loc, false, ms);
};

/** @param {State3D} st */
StateGL.prototype.updateViewMatrix = function(st) {
    this.updateUniformMatrix("v", st.viewMatrix());
};
