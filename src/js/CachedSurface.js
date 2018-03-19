const Export = require('./Export.js');
const StateGL = require('./StateGL.js');

module.exports = class CachedSurface {

    /**
     * @param {StateGL} stategl
     * @param {string} file
     * @param {./Polynomial=} p
     * @param {function()} onload
     */
    constructor(stategl, file, p = null, onload = function() {}) {
        this.file = file;
        this.polynomial = p;
        this.positions = ( /** @type {ArrayBuffer|null} */ (null));
        this.positionsBuffer = /** WebGLBuffer */ null;
        this.program = /** WebGLProgram */ null;
        this.size = 0;
        const cachedSurface = this;
        this.loadModel(stategl, file, function() {
            cachedSurface.mkBuffer(stategl, cachedSurface.positions);
            cachedSurface.mkProgram(stategl);
            onload();
        });
    }

    /**
     * @param {StateGL} stategl
     * @param {boolean=} big
     * @return {Array<string>}
     */
    domainColouring(stategl, big = false) {
        if (this.polynomial)
            return Export.domainColouring(this.polynomial, stategl, big);
        else
            return [];
    }

    /**
     * @param {StateGL} stategl
     * @param {string=} name
     */
    exportBinary(stategl, name = "surface.bin") {
        Export.download(name, this.file);
    }

    /**
     * @param {StateGL} stategl
     * @param {string} name
     * @param {boolean=} big
     */
    exportDomainColouring(stategl, name = "sheet", big = true) {
        if (this.polynomial)
            Export.exportDomainColouring(this.polynomial, stategl, name, big);
    }

    /**
     * @param {StateGL} stategl
     * @param {string=} name
     * @param {boolean=} big
     */
    exportSurface(stategl, name = "surface", big = true) {
        Export.exportSurface(stategl, new Float32Array(this.positions), name, big);
    }

    /**
     * @param {StateGL} stategl
     * @param {string} file
     * @param {function()} onload
     */
    loadModel(stategl, file, onload) {
        const cachedSurface = this;
        cachedSurface.file = file;
        const req = new XMLHttpRequest();
        req.open("GET", file, true);
        req.responseType = "arraybuffer";
        req.onload = function() {
            cachedSurface.positions = /** @type {ArrayBuffer|null} */ (req.response);
            onload();
        };
        req.send();
    }

    /**
     * @param {StateGL} stategl
     * @param {ArrayBuffer} positions
     */
    mkBuffer(stategl, positions) {
        const gl = stategl.gl;
        this.size = positions.byteLength / 16;
        gl.enableVertexAttribArray(0);
        this.positionsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    }

    /** @param {StateGL} stategl */
    mkProgram(stategl) {
        const sources = StateGL.getShaderSources("CachedSurface");
        this.program = stategl.mkProgram(sources);
    }

    /**
     * @param {StateGL} stategl
     * @param {WebGLRenderingContext} gl
     * @param {./State3D} state3d
     */
    render(stategl, gl, state3d) {
        if (!this.program)
            return;
        gl.useProgram(this.program);
        stategl.updateClipping();
        stategl.updateModelViewProjectionMatrices(state3d);
        stategl.updateTransparency();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionsBuffer);
        gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, this.size);
        stategl.updateTransparency(false);
    }
};
