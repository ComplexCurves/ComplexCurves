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
            Misc.loadTextFiles(["common.glsl"], function(sources) {
                surface.commonShaderSrc = sources[0];
                oncomplete();
            });
        }),
        new Task("customShaderSrc", [], function(oncomplete) {
            surface.customShaderSrc = GLSL.polynomialShaderSource(
                polynomial);
            oncomplete();
        }),
        new Task("OES_texture_float", [], function(oncomplete) {
            stategl.getExtension("OES_texture_float");
            if (stategl["OES_texture_float"])
                oncomplete();
        }),
        new Task("WEBGL_draw_buffers", [], function(oncomplete) {
            stategl.getExtension("WEBGL_draw_buffers");
            if (stategl["WEBGL_draw_buffers"])
                oncomplete();
        }),
        new Task("mkTextures", ["OES_texture_float", "WEBGL_draw_buffers"],
        function(oncomplete) {
            surface.mkTextures(stategl);
            oncomplete();
        }),
        new Task("initial", ["commonShaderSrc", "customShaderSrc", "mkTextures"], function(oncomplete) {
            surface.initial = new Initial(stategl, surface,
                function() {
                    surface.initial.render(stategl, surface, gl);
                    oncomplete();
                });
        }),
        new Task("subdivisionPre", ["initial"], function(oncomplete) {
            surface.subdivisionPre = new SubdivisionPre(stategl, oncomplete);
        }),
        new Task("subdivision", ["commonShaderSrc", "customShaderSrc"],
            function(oncomplete) {
                surface.subdivision = new Subdivision(stategl, surface,
                    oncomplete);
            }),
        new Task("subdivide", ["initial", "subdivisionPre", "subdivision"],
            function(oncomplete) {
                for (var i = 0; i < surface.depth; i++) {
                    surface.subdivisionPre.render(stategl, surface, gl);
                    surface.subdivision.render(stategl, surface, gl);
                }
                oncomplete();
            }),
        new Task("assembly", ["commonShaderSrc", "customShaderSrc", "subdivide"
        ], function(oncomplete) {
            surface.assembly = new Assembly(stategl, surface, function() {
                surface.assembly.render(stategl, surface, gl);
                for (var j = 0; j < 5; j++)
                    stategl.printTexture(20, surface.texturesIn[j]);
                oncomplete();
            });
        }),
        new Task("mkProgram", [], function(oncomplete) {
            surface.mkProgram(stategl, oncomplete);
        }),
        new Task("ready", ["assembly", "mkProgram"], onload)
    ]);
    schedule.run();
}

/** @type {WebGLFramebuffer} */
Surface.prototype.frameBuffer;

/** @type {WebGLBuffer} */
Surface.prototype.indexBuffer;

/** @param {StateGL} stategl */
Surface.prototype.fillIndexBuffer = function(stategl) {
    var gl = stategl.gl;
    var indices = [];
    for (var i = 0; i < this.numIndices; i++)
        indices[i] = i;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);
};

/** @param {StateGL} stategl
 *  @param {function()} onload */
Surface.prototype.mkProgram = function(stategl, onload) {
    var surface = this;
    StateGL.getShaderSources("surface", function(sources) {
        sources[1] = surface.withCustomAndCommon(sources[1]);
        surface.program = stategl.mkProgram(sources);
        onload();
    });
};

/** @param {StateGL} stategl */
Surface.prototype.mkTextures = function(stategl) {
    var gl = stategl.gl,
        texturesIn = [],
        texturesOut = [];
    for (var i = 0; i < 5; i++) {
        texturesIn[i] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texturesIn[i]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2048, 2048, 0, gl.RGBA,
            gl.FLOAT, null);
        texturesOut[i] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texturesOut[i]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2048, 2048, 0, gl.RGBA,
            gl.FLOAT, null);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.texturesIn = texturesIn;
    this.texturesOut = texturesOut;
};

/** @type {number} */
Surface.prototype.numIndices = 0;

/** @param {StateGL} stategl
 *  @param {WebGLRenderingContext} gl
 *  @param {State3D} state3d */
Surface.prototype.render = function(stategl, gl, state3d) {
    gl.useProgram(this.program);
    stategl.updateClipping();
    stategl.updateModelViewProjectionMatrices(state3d);
    stategl.updateTransparency();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texturesIn[0]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var samplerLocation = gl.getUniformLocation(this.program, 'sampler');
    gl.uniform1i(samplerLocation, 0);

    this.fillIndexBuffer(stategl);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, 800, 800);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, this.numIndices);
    stategl.updateTransparency(false);
};

/** @param {string} src
 *  @return {string} */
Surface.prototype.withCustomAndCommon = function(src) {
    return [this.customShaderSrc, this.commonShaderSrc, src].join("\n");
};
