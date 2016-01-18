/** @interface */
function Stage() {}

/** @param {StateGL} stategl
 *  @param {WebGLRenderingContext} gl
 *  @param {State3D} state3d */
Stage.prototype.render = function(stategl, gl, state3d) {};
