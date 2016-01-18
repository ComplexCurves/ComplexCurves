/** @constructor
 *  @implements {Stage} */
function CachedSurface(stategl, onload) {
    var cachedSurface = this;
    StateGL.getShaderSources("cached-surface", function(sources) {
        cachedSurface.program = stategl.mkProgram(sources);
        stategl.cached = true;
        onload();
    });
}

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
