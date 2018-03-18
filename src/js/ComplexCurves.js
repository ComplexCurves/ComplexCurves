const PolynomialParser = require('./PolynomialParser.js');

const defaultLat = 5 / 12 * Math.PI;
const defaultLon = Math.PI / 6;

module.exports = class ComplexCurves {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {number=} lat
     * @param {number=} lon
     * @param {boolean=} ortho
     * @param {string} contextType
     */
    constructor(canvas, lat = defaultLat, lon = defaultLon, ortho = false, contextType = 'webgl2') {
        this.canvas = canvas;
        this.state3d = State3D.fromLatLong(lat, lon, ortho);
        this.stategl = new StateGL(canvas, contextType);
        this.registerEventHandlers();
    }

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {string} equation
     * @param {number} depth
     * @param {number=} lat
     * @param {number=} lon
     * @param {boolean=} ortho
     * @return {ComplexCurves}
     */
    static fromEquation(canvas, equation, depth, lat = defaultLat, lon = defaultLon, ortho = false) {
        const p = PolynomialParser.eval(PolynomialParser.parse(equation));
        return ComplexCurves.fromPolynomial(canvas, p, depth, lat, lon, ortho);
    }

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {string} file
     * @param {string=} equation
     * @param {number=} lat
     * @param {number=} lon
     * @param {boolean=} ortho
     * @param {function()=} onload
     * @return {ComplexCurves}
     */
    static fromFile(canvas, file, equation = "", lat = defaultLat, lon = defaultLon, ortho = false, onload = function () {}) {
        const p = PolynomialParser.eval(PolynomialParser.parse(equation));
        const complexCurves = new ComplexCurves(canvas, lat, lon, ortho, 'webgl');
        const gl = complexCurves.stategl;
        gl.renderer = new CachedSurface(gl, file, p, function () {
            complexCurves.renderSurface();
            onload();
        });
        return complexCurves;
    }

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {Polynomial} polynomial
     * @param {number} depth
     * @param {number=} lat
     * @param {number=} lon
     * @param {boolean=} ortho
     * @return {ComplexCurves}
     */
    static fromPolynomial(canvas, polynomial, depth, lat = defaultLat, lon = defaultLon, ortho = false) {
        const complexCurves = new ComplexCurves(canvas, lat, lon, ortho);
        const gl = complexCurves.stategl;
        gl.renderer = new Surface(gl, polynomial, depth);
        // equation must be bivariate and at least quadratic
        if (!polynomial.isBivariate() || gl.renderer.sheets < 2)
            return null;
        complexCurves.renderSurface();
        return complexCurves;
    }

    /**
     * @param {boolean=} big
     * @return {Array<string>} */
    domainColouring(big = false) {
        const gl = this.stategl;
        return gl.renderer.domainColouring(gl, big);
    }

    /** @param {string=} name */
    exportBinary(name = "surface.bin") {
        const gl = this.stategl;
        gl.renderer.exportBinary(gl, name);
    }

    /**
     * @param {string=} name
     * @param {boolean=} big
     */
    exportDomainColouring(name = "sheet", big = true) {
        const gl = this.stategl;
        gl.renderer.exportDomainColouring(gl, name, big);
    }

    /**
     * @param {string=} name
     * @param {boolean=} big
     */
    exportScreenshot(name = "surface.png", big = false) {
        const complexCurves = this;
        const stategl = this.stategl;
        stategl.withRenderToTexture(function () {
            complexCurves.renderSurface();
        }, big);
        const pixels = /** @type {Uint8Array} */
            (stategl.readTexture(big ? stategl.rttBigTexture : stategl.rttTexture));
        Export.download(name, Export.pixelsToImageDataURL(pixels));
    }

    /**
     * @param {string=} name
     * @param {boolean=} big
     */
    exportSurface(name = "surface", big = true) {
        const gl = this.stategl;
        gl.renderer.exportSurface(gl, name, big);
    }

    registerEventHandlers() {
        const canvas = this.canvas,
            state3d = this.state3d;
        const complexCurves = this;
        /** @type {function(!Event) : undefined} */
        this.mousedownHandler = function (evt) {
            evt.preventDefault();
            if (state3d.autorotate)
                return;
            state3d.mouseDown([evt.clientX, evt.clientY]);
            complexCurves.renderSurface();
        };
        /** @type {function(!Event) : undefined} */
        this.mousemoveHandler = function (evt) {
            evt.preventDefault();
            state3d.mouseMove(evt.clientX, evt.clientY);
        };
        /** @type {function(!Event) : undefined} */
        this.mouseupHandler = function (evt) {
            evt.preventDefault();
            state3d.mouseUp();
        };
        /** @type {function(!Event) : undefined} */
        this.touchstartHandler = function (evt) {
            evt.preventDefault();
            const touch = /** @type {TouchEvent} */ (evt).touches[0];
            state3d.mouseDown([touch.clientX, touch.clientY]);
            complexCurves.renderSurface();
        };
        /** @type {function(!Event) : undefined} */
        this.touchmoveHandler = function (evt) {
            evt.preventDefault();
            const touch = /** @type {TouchEvent} */ (evt).touches[0];
            state3d.mouseMove(touch.clientX, touch.clientY);
        };
        /** @type {function(!Event) : undefined} */
        this.touchendHandler = function (evt) {
            evt.preventDefault();
            state3d.mouseUp();
        };
        /** @type {function(!Event) : undefined} */
        this.wheelHandler = function (evt) {
            evt.preventDefault();
            state3d.mouseWheel((/** @type {WheelEvent} */ (evt)).deltaY);
            complexCurves.renderSurface();
        };
        canvas.addEventListener('mousedown', this.mousedownHandler);
        canvas.addEventListener('mousemove', this.mousemoveHandler);
        canvas.addEventListener('mouseup', this.mouseupHandler);
        canvas.addEventListener('touchstart', this.touchstartHandler);
        canvas.addEventListener('touchmove', this.touchmoveHandler);
        canvas.addEventListener('touchend', this.touchendHandler);
        canvas.addEventListener('wheel', this.wheelHandler);
    }

    renderSurface() {
        const state3d = this.state3d,
            gl = this.stategl;
        const complexCurves = this;
        gl.renderSurface(state3d);
        if (state3d.isRotating()) {
            state3d.updateRotation();
            requestAnimationFrame(function () {
                complexCurves.renderSurface();
            });
        }
    }

    rotateBack() {
        this.rotateLatLong(Math.PI / 2, Math.PI);
    }

    rotateBottom() {
        this.rotateLatLong(Math.PI, 0);
    }

    rotateDefault() {
        this.rotateLatLong(defaultLat, defaultLon);
    }

    rotateFront() {
        this.rotateLatLong(Math.PI / 2, 0);
    }

    /**
     * @param {number} lat
     * @param {number} lon
     */
    rotateLatLong(lat, lon) {
        this.state3d.autorotate = false;
        this.state3d.target1 = this.state3d.target0 = this.state3d.rotation;
        this.state3d.target1 = Quaternion.fromLatLong(lat, lon);
        this.renderSurface();
    }

    rotateLeft() {
        this.rotateLatLong(Math.PI / 2, -Math.PI / 2);
    }

    rotateRight() {
        this.rotateLatLong(Math.PI / 2, Math.PI / 2);
    }

    rotateTop() {
        this.rotateLatLong(0, 0);
    }

    /** @param {boolean} fxaa */
    setAntialiasing(fxaa) {
        this.stategl.setAntialiasing(fxaa);
        this.renderSurface();
    }

    /** @param {boolean} autorotate */
    setAutorotate(autorotate) {
        this.state3d.setAutorotate(autorotate);
        this.renderSurface();
    }

    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     */
    setBackground(r, g, b, a) {
        this.stategl.gl.clearColor(r, g, b, a);
        this.renderSurface();
    }

    /** @param {boolean} clipping */
    setClipping(clipping) {
        this.stategl.setClipping(clipping);
        this.renderSurface();
    }

    /**
     * @param {number} lat
     * @param {number} lon
     */
    setLatLong(lat, lon) {
        const q = Quaternion.fromLatLong(lat, lon);
        this.state3d.autorotate = false;
        this.state3d.rotating = false;
        this.state3d.rotation = this.state3d.target1 = q;
        this.renderSurface();
    }

    /** @param {boolean} ortho */
    setOrtho(ortho) {
        this.state3d.setOrtho(ortho);
        this.renderSurface();
    }

    /** @param {boolean} transparency */
    setTransparency(transparency) {
        this.stategl.setTransparency(transparency);
        this.renderSurface();
    }

    /** @param {number} zoomLevel */
    setZoom(zoomLevel) {
        this.state3d.updateZoom(zoomLevel || 1);
        this.renderSurface();
    }

    toggleAntialiasing() {
        this.stategl.toggleAntialiasing();
        this.renderSurface();
    }

    toggleAutorotate() {
        this.state3d.toggleAutorotate();
        this.renderSurface();
    }

    toggleClipping() {
        this.stategl.toggleClipping();
        this.renderSurface();
    }

    toggleOrtho() {
        this.state3d.toggleOrtho();
        this.renderSurface();
    }

    toggleTransparency() {
        this.stategl.toggleTransparency();
        this.renderSurface();
    }

    unregisterEventHandlers() {
        const canvas = this.canvas;
        canvas.removeEventListener('mousedown', this.mousedownHandler);
        canvas.removeEventListener('mousemove', this.mousemoveHandler);
        canvas.removeEventListener('mouseup', this.mouseupHandler);
        canvas.removeEventListener('touchstart', this.touchstartHandler);
        canvas.removeEventListener('touchmove', this.touchmoveHandler);
        canvas.removeEventListener('touchend', this.touchendHandler);
        canvas.removeEventListener('wheel', this.wheelHandler);
    }
};