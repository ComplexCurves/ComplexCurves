/** @constructor
 *  @extends {WebGLRenderingContext} */
function StateGL(canvas) {
    return canvas.getContext('webgl', {
        preserveDrawingBuffer: true
    });
}

StateGL.prototype.size = 0;

StateGL.getShaderSources = function(shaderId, onload) {
    var files = [shaderId + '-vs.glsl', shaderId + '-fs.glsl'];
    Misc.loadTextFiles(files, onload);
};

StateGL.mkBuffer = function(gl, positions) {
    gl.enableVertexAttribArray(0);
    var positionsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
};

StateGL.mkProgram = function(gl, sources) {
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

StateGL.renderSurface = function(st, gl) {
    StateGL.updateModelViewProjectionMatrices(st, gl);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, gl.size);
};

StateGL.updateModelMatrix = function(st, gl) {
    StateGL.updateUniformMatrix(gl, "m", State3D.modelMatrix(st));
};

StateGL.updateModelViewProjectionMatrices = function(st, gl) {
    StateGL.updateModelMatrix(st, gl);
    StateGL.updateViewMatrix(st, gl);
    StateGL.updateProjectionMatrix(st, gl);
};

StateGL.updateProjectionMatrix = function(st, gl) {
    var vp = gl.getParameter(gl.VIEWPORT),
        w = vp[2],
        h = vp[3];
    StateGL.updateUniformMatrix(gl, "p", State3D.projectionMatrix(st, w, h));
};

StateGL.updateUniformMatrix = function(gl, i, ms) {
    var program = gl.getParameter(gl.CURRENT_PROGRAM);
    var loc = gl.getUniformLocation(program, i);
    gl.uniformMatrix4fv(loc, false, ms);
};

StateGL.updateViewMatrix = function(st, gl) {
    StateGL.updateUniformMatrix(gl, "v", State3D.viewMatrix(st));
};
