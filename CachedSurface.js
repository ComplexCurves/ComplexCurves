/** @constructor
 *  @param {StateGL} stategl
 *  @param {string} file
 *  @param {function()} onload
 *  @implements {Stage} */
function CachedSurface(stategl, file, onload) {
    var cachedSurface = this;
    var schedule = new Schedule([
        new Task("loadModel", [], function(oncomplete) {
            cachedSurface.loadModel(stategl, file, oncomplete);
        }),
        new Task("mkProgram", [], function(oncomplete) {
            cachedSurface.mkProgram(stategl, oncomplete);
        }),
        new Task("ready", ["loadModel", "mkProgram"], onload)
    ]);
    schedule.run();
}

/** @param {StateGL} stategl
 *  @param {string} file
 *  @param {function()} onload */
CachedSurface.prototype.loadModel = function(stategl, file, onload) {
    var req = new XMLHttpRequest();
    req.open("GET", file, true);
    req.responseType = "arraybuffer";
    req.onload = function() {
        var positions = /** @type {ArrayBuffer|null} */ (req.response);
        stategl.mkBuffer(positions);
        stategl.size = positions.byteLength / 16;
        onload();
    };
    req.send();
};

/** @param {StateGL} stategl
 *  @param {function()} onload */
CachedSurface.prototype.mkProgram = function(stategl, onload) {
    var cachedSurface = this;
    StateGL.getShaderSources("cached-surface", function(sources) {
        cachedSurface.program = stategl.mkProgram(sources);
        stategl.cached = true;
        onload();
    });
};

/** @param {StateGL} stategl
 *  @param {WebGLRenderingContext} gl
 *  @param {State3D} state3d */
CachedSurface.prototype.render = function(stategl, gl, state3d) {
    gl.useProgram(this.program);
    stategl.updateClipping();
    stategl.updateModelViewProjectionMatrices(state3d);
    stategl.updateTransparency();
    gl.bindBuffer(gl.ARRAY_BUFFER, stategl.positionsBuffer);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, stategl.size);
    stategl.updateTransparency(false);
};
