/** @param {HTMLCanvasElement} canvas
 *  @param {number=} lat
 *  @param {number=} lon
 *  @param {boolean=} ortho
 *  @constructor */
export function SingularityExplorer(canvas, lat = 0, lon = 0, ortho = false) {
    this.canvas = canvas;
    this.state3d = State3D.fromLatLong(lat, lon, ortho);
    this.stategl = new StateGL(canvas);
    this.registerEventHandlers();
}

/** @param {HTMLCanvasElement} canvas
 *  @param {string} equation
 *  @param {number} depth
 *  @param {number=} lat
 *  @param {number=} lon
 *  @param {boolean=} ortho
 *  @return {SingularityExplorer} */
export function SingularityExplorerFromEquation(canvas, equation, depth, lat = 0, lon = 0, ortho = false) {
    var p = PolynomialParser.eval(PolynomialParser.parse(equation));
    return SingularityExplorerFromPolynomial(canvas, p, depth, lat, lon, ortho);
}

/** @param {HTMLCanvasElement} canvas
 *  @param {string} file
 *  @param {number=} lat
 *  @param {number=} lon
 *  @param {boolean=} ortho
 *  @param {function()=} onload
 *  @return {SingularityExplorer} */
export function SingularityExplorerFromFile(canvas, file, lat = 0, lon = 0, ortho = false, onload) {
    var singularityExplorer = new SingularityExplorer(canvas, lat, lon, ortho);
    var gl = singularityExplorer.stategl;
    gl.renderer = new CachedSurface(gl, file, function() {
        singularityExplorer.renderSurface();
        if (onload)
            onload();
    });
    return singularityExplorer;
}

/** @param {HTMLCanvasElement} canvas
 *  @param {Polynomial} polynomial
 *  @param {number} depth
 *  @param {number=} lat
 *  @param {number=} lon
 *  @param {boolean=} ortho
 *  @return {SingularityExplorer} */
function SingularityExplorerFromPolynomial(canvas, polynomial, depth, lat = 0, lon = 0, ortho = false) {
    var singularityExplorer = new SingularityExplorer(canvas, lat, lon, ortho);
    var gl = singularityExplorer.stategl;
    gl.renderer = new Surface(gl, polynomial, depth);
    singularityExplorer.renderSurface();
    return singularityExplorer;
}

/** @param {boolean=} big */
SingularityExplorer.prototype.domainColouring = function(big = false) {
    var gl = this.stategl;
    return gl.renderer.domainColouring(gl, big);
};

/** @param {string=} name */
SingularityExplorer.prototype.exportBinary = function(name = "surface.bin") {
    var gl = this.stategl;
    gl.renderer.exportBinary(gl, name);
};

/** @param {string=} name
 *  @param {boolean=} big */
SingularityExplorer.prototype.exportScreenshot = function(name = "surface.png", big = false) {
    var singularityExplorer = this;
    var stategl = this.stategl;
    stategl.withRenderToTexture(function() {
        singularityExplorer.renderSurface();
    }, big);
    var pixels = /** @type {Uint8Array} */
        (stategl.readTexture(big ? stategl.rttBigTexture : stategl.rttTexture));
    Export.download(name, Export.pixelsToImageDataURL(pixels));
};

/** @param {string=} name
 *  @param {boolean=} big */
SingularityExplorer.prototype.exportSurface = function(name = "surface", big = true) {
    var gl = this.stategl;
    gl.renderer.exportSurface(gl, name, big);
};

/** @param {number} keyCode */
SingularityExplorer.prototype.keyDown = function(keyCode) {
    switch (keyCode) {
        case 65: // 'a'
            this.toggleAntialiasing();
            break;
        case 66: // 'b'
            this.exportBinary();
            break;
        case 67: // 'c'
            this.toggleClipping();
            break;
        case 69: // 'e'
            this.exportSurface();
            break;
        case 79: // 'o'
            this.toggleOrtho();
            break;
        case 82: // 'r'
            this.toggleAutorotate();
            break;
        case 83: // 's'
            this.exportScreenshot();
            break;
        case 84: // 't'
            this.toggleTransparency();
            break;
        case 49: // '1'
            this.rotateFront();
            break;
        case 51: // '3'
            this.rotateRight();
            break;
        case 53: // '5'
            this.toggleOrtho();
            break;
        case 55: // '7'
            this.rotateTop();
            break;
        case 48: // '0'
            this.rotateLatLong(5 / 12 * Math.PI, Math.PI / 6);
            break;
    }
};

SingularityExplorer.prototype.registerEventHandlers = function() {
    var canvas = this.canvas,
        state3d = this.state3d,
        gl = this.stategl;
    var singularityExplorer = this;
    this.keydownHandler = function(evt) {
        singularityExplorer.keyDown(evt.keyCode); // TODO make portable
    };
    this.mousedownHandler = function(evt) {
        evt.preventDefault();
        if (state3d.autorotate)
            return;
        state3d.mouseDown([evt.clientX, evt.clientY]);
        singularityExplorer.renderSurface();
    };
    this.mousemoveHandler = function(evt) {
        evt.preventDefault();
        state3d.mouseMove(evt.clientX, evt.clientY);
    };
    this.mouseupHandler = function(evt) {
        evt.preventDefault();
        state3d.mouseUp();
    };
    this.touchstartHandler = function(evt) {
        evt.preventDefault();
        var touch = evt.touches[0];
        state3d.mouseDown([touch.clientX, touch.clientY]);
        singularityExplorer.renderSurface();
    };
    this.touchmoveHandler = function(evt) {
        evt.preventDefault();
        var touch = evt.touches[0];
        state3d.mouseMove(touch.clientX, touch.clientY);
    };
    this.touchendHandler = function(evt) {
        evt.preventDefault();
        state3d.mouseUp();
    };
    this.wheelHandler = function(evt) {
        evt.preventDefault();
        state3d.mouseWheel(evt.deltaY);
        singularityExplorer.renderSurface();
    };
    window.addEventListener('keydown', this.keydownHandler);
    canvas.addEventListener('mousedown', this.mousedownHandler);
    canvas.addEventListener('mousemove', this.mousemoveHandler);
    canvas.addEventListener('mouseup', this.mouseupHandler);
    canvas.addEventListener('touchstart', this.touchstartHandler);
    canvas.addEventListener('touchmove', this.touchmoveHandler);
    canvas.addEventListener('touchend', this.touchendHandler);
    canvas.addEventListener('wheel', this.wheelHandler);
};

SingularityExplorer.prototype.renderSurface = function() {
    var state3d = this.state3d,
        gl = this.stategl;
    var singularityExplorer = this;
    gl.renderSurface(state3d);
    if (state3d.isRotating()) {
        state3d.updateRotation();
        requestAnimationFrame(function() {
            singularityExplorer.renderSurface();
        });
    }
};

SingularityExplorer.prototype.rotateFront = function() {
    this.rotateLatLong(Math.PI / 2, 0);
};

/** @param {number} lat
 *  @param {number} lon */
SingularityExplorer.prototype.rotateLatLong = function(lat, lon) {
    this.state3d.autorotate = false;
    this.state3d.target1 = Quaternion.fromLatLong(lat, lon);
    this.renderSurface();
};

SingularityExplorer.prototype.rotateRight = function() {
    this.rotateLatLong(Math.PI / 2, Math.PI / 2);
};

SingularityExplorer.prototype.rotateTop = function() {
    this.rotateLatLong(0, 0);
};

/** @param {boolean} fxaa */
SingularityExplorer.prototype.setAntialiasing = function(fxaa) {
    this.stategl.setAntialiasing(fxaa);
    this.renderSurface();
};

/** @param {boolean} autorotate */
SingularityExplorer.prototype.setAutorotate = function(autorotate) {
    this.state3d.setAutorotate(autorotate);
    this.renderSurface();
};

/** @param {boolean} clipping */
SingularityExplorer.prototype.setClipping = function(clipping) {
    this.stategl.setClipping(clipping);
    this.renderSurface();
};

/** @param {number} lat
 *  @param {number} lon */
SingularityExplorer.prototype.setLatLong = function(lat, lon) {
    var q = Quaternion.fromLatLong(lat, lon);
    this.state3d.autorotate = false;
    this.state3d.rotating = false;
    this.state3d.rotation = this.state3d.target1 = q;
    this.renderSurface();
};

/** @param {boolean} ortho */
SingularityExplorer.prototype.setOrtho = function(ortho) {
    this.state3d.setOrtho(ortho);
    this.renderSurface();
};

/** @param {boolean} transparency */
SingularityExplorer.prototype.setTransparency = function(transparency) {
    this.stategl.setTransparency(transparency);
    this.renderSurface();
};

SingularityExplorer.prototype.toggleAntialiasing = function() {
    this.stategl.toggleAntialiasing();
    this.renderSurface();
};

SingularityExplorer.prototype.toggleAutorotate = function() {
    this.state3d.toggleAutorotate();
    this.renderSurface();
};

SingularityExplorer.prototype.toggleClipping = function() {
    this.stategl.toggleClipping();
    this.renderSurface();
};

SingularityExplorer.prototype.toggleOrtho = function() {
    this.state3d.toggleOrtho();
    this.renderSurface();
};

SingularityExplorer.prototype.toggleTransparency = function() {
    this.stategl.toggleTransparency();
    this.renderSurface();
};

SingularityExplorer.prototype.unregisterEventHandlers = function() {
    var canvas = this.canvas;
    window.removeEventListener('keydown', this.keydownHandler);
    canvas.removeEventListener('mousedown', this.mousedownHandler);
    canvas.removeEventListener('mousemove', this.mousemoveHandler);
    canvas.removeEventListener('mouseup', this.mouseupHandler);
    canvas.removeEventListener('touchstart', this.touchstartHandler);
    canvas.removeEventListener('touchmove', this.touchmoveHandler);
    canvas.removeEventListener('touchend', this.touchendHandler);
    canvas.removeEventListener('wheel', this.wheelHandler);
};
