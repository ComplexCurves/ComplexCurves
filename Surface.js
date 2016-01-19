/** @constructor
 *  @param {StateGL} stategl
 *  @param {Polynomial} polynomial
 *  @param {number} depth
 *  @param {function()} onload
 *  @implements {Stage} */
function Surface(stategl, polynomial, depth, onload) {
    this.polynomial = polynomial;
    this.depth = depth;
    var gl = stategl.gl;
    var surface = this;
    var schedule = new Schedule([
        new Task("commonShaderSrc", [], function(oncomplete) {
            Misc.loadTextFiles(["common.glsl"], function (sources) {
                surface.commonShaderSrc = sources[0];
                oncomplete();
            });
        }),
        new Task("customShaderSrc", [], function(oncomplete) {
            surface.customShaderSrc = GLSL.polynomialShaderSource(polynomial);
            oncomplete();
        }),
        new Task("initial", ["commonShaderSrc", "customShaderSrc"], function(oncomplete) {
            surface.initial = new Initial(stategl, function() {
                surface.initial.render(stategl, gl);
                oncomplete();
            });
        }),
        new Task("subdivisionPre", [], function(oncomplete) {
            surface.subdivisionPre = new SubdivisionPre(stategl,
                oncomplete);
        }),
        new Task("subdivision", ["commonShaderSrc", "customShaderSrc"], function(oncomplete) {
            surface.subdivision = new Subdivision(stategl,
                oncomplete);
        }),
        new Task("subdivide", ["initial", "subdivisionPre",
            "subdivision"
        ], function(oncomplete) {
            for (var i = 0; i < this.depth; i++) {
                surface.subdivisionPre.render(stategl, gl);
                surface.subdivision.render(stategl, gl);
            }
            oncomplete();
        }),
        new Task("assembly", ["commonShaderSrc", "customShaderSrc", "subdivide"], function(oncomplete) {
            surface.assembly = new Assembly(stategl, function() {
                surface.assembly.render(stategl, gl);
                oncomplete();
            });
        }),
        new Task("mkBuffers", [], function(oncomplete) {
            surface.mkBuffers(stategl, surface.positions);
            oncomplete();
        }),
        new Task("mkProgram", [], function(oncomplete) {
            surface.mkProgram(stategl, oncomplete);
        }),
        new Task("ready", ["assembly", "mkBuffers", "mkProgram"],
            onload)
    ]);
    schedule.run();
}

/** @type {WebGLBuffer} */
Surface.prototype.indexBuffer = null;

/** @param {StateGL} stategl
 *  @param {ArrayBuffer} positions */
Surface.prototype.mkBuffers = function(stategl, positions) {
    var gl = stategl.gl;
    this.indexBuffer = gl.createBuffer();
    var indices = [];
    for (var i = 0; i < this.size / 2; i++)
        indices[i] = i;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);
    this.framebuffer = gl.createFramebuffer();
};

/** @param {StateGL} stategl
 *  @param {function()} onload */
Surface.prototype.mkProgram = function(stategl, onload) {
    var surface = this;
    StateGL.getShaderSources("surface", function(sources) {
        surface.program = stategl.mkProgram(sources);
        onload();
    });
};

/** @param {StateGL} stategl
 *  @param {WebGLRenderingContext} gl
 *  @param {State3D} state3d */
Surface.prototype.render = function(stategl, gl, state3d) {
    gl.useProgram(this.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, 800, 800);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, this.size);
    gl.flush();
};

/** @type {number} */
Surface.prototype.size = 0;
