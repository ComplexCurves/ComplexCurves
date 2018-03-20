const ArgumentError = require('./ArgumentError.js');
const Assembly = require('./Assembly.js');
const Export = require('./Export.js');
const Initial = require('./Initial.js');
const StateGL = require('./StateGL.js');
const Subdivision = require('./Subdivision.js');
const SubdivisionPre = require('./SubdivisionPre.js');
const SurfaceDTO = require('./SurfaceDTO.js');
const TransformFeedback = require('./TransformFeedback.js');

module.exports = class Surface {
    /**
     * @param {StateGL} stategl
     * @param {./Polynomial} polynomial
     * @param {number} depth
     */
    constructor(stategl, polynomial, depth) {

        this.surfaceDTO = new SurfaceDTO(stategl, polynomial, depth);
        const surfaceDTO = this.surfaceDTO;

        // surface must be bivariate and at least quadratic
        if (!polynomial.isBivariate()) {
            throw new ArgumentError("Equation must be bivariate!");
        }
        if (surfaceDTO.sheets < 2) {
            throw new ArgumentError("There must be at least two sheets!");
        }

        const gl = stategl.gl;

        this.initial = new Initial(stategl, surfaceDTO);
        this.initial.render(stategl, surfaceDTO, gl);
        this.subdivisionPre = new SubdivisionPre(stategl, surfaceDTO);
        this.subdivision = new Subdivision(stategl, surfaceDTO);
        for (let i = 0; i < surfaceDTO.depth; i++) {
            this.subdivisionPre.render(stategl, surfaceDTO, gl);
            this.subdivision.render(stategl, surfaceDTO, gl);
        }
        this.assembly = new Assembly(stategl, surfaceDTO);
        this.assembly.render(stategl, surfaceDTO, gl);
        this.program = /** WebGLProgram */ null;
        this.mkProgram(stategl);
        const canvas = gl.canvas;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    /**
     * @param {StateGL} stategl
     * @param {boolean=} big
     * @return {Array<string>}
     */
    domainColouring(stategl, big = false) {
        return Export.domainColouring(this.surfaceDTO.polynomial, stategl, big);
    }

    /**
     * @param {StateGL} stategl
     * @param {string=} name
     */
    exportBinary(stategl, name = "surface.bin") {
        const url = TransformFeedback.toURL(stategl.gl, this.surfaceDTO, 4);
        Export.download(name, url);
    }

    /**
     * @param {StateGL} stategl
     * @param {string} name
     * @param {boolean=} big
     */
    exportDomainColouring(stategl, name = "sheet", big = true) {
        Export.exportDomainColouring(this.surfaceDTO.polynomial, stategl, name, big);
    }

    /**
     * @param {StateGL} stategl
     * @param {string=} name
     * @param {boolean=} big
     */
    exportSurface(stategl, name = "surface", big = true) {
        const pixels = TransformFeedback.toFloat32Array(stategl.gl, this.surfaceDTO, 4);
        Export.exportSurface(stategl, pixels, name, big);
    }

    /** @param {StateGL} stategl */
    mkProgram(stategl) {
        const sources = StateGL.getShaderSources("Surface");
        sources[1] = this.surfaceDTO.withCustomAndCommon(sources[1]);
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

        gl.bindBuffer(gl.ARRAY_BUFFER, this.surfaceDTO.transformFeedbackBuffer);
        gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, this.surfaceDTO.numIndices);
        stategl.updateTransparency(false);
    }
};
