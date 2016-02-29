/** @param {HTMLCanvasElement} canvas
 *  @constructor */
export function SingularityExplorer(canvas) {
    this.canvas = canvas;
    this.state3d = State3D.topView(false);
    this.stategl = new StateGL(canvas);
    this.registerEventHandlers();
}

/** @param {HTMLCanvasElement} canvas
 *  @param {string} equation
 *  @param {number} depth
 *  @return {SingularityExplorer} */
export function SingularityExplorerFromEquation(canvas, equation, depth) {
    var p = PolynomialParser.eval(PolynomialParser.parse(equation));
    return SingularityExplorerFromPolynomial(canvas, p, depth);
}

/** @param {HTMLCanvasElement} canvas
 *  @param {string} file
 *  @return {SingularityExplorer} */
export function SingularityExplorerFromFile(canvas, file) {
    var singularityExplorer = new SingularityExplorer(canvas);
    var gl = singularityExplorer.stategl;
    gl.renderer = new CachedSurface(gl, file, function() {
        singularityExplorer.renderSurface();
    });
    return singularityExplorer;
}

/** @param {HTMLCanvasElement} canvas
 *  @param {Polynomial} polynomial
 *  @param {number} depth
 *  @return {SingularityExplorer} */
function SingularityExplorerFromPolynomial(canvas, polynomial, depth) {
    var singularityExplorer = new SingularityExplorer(canvas);
    var gl = singularityExplorer.stategl;
    gl.renderer = new Surface(gl, polynomial, depth);
    singularityExplorer.renderSurface();
    return singularityExplorer;
};

SingularityExplorer.prototype.registerEventHandlers = function() {
    var canvas = this.canvas,
        state3d = this.state3d,
        gl = this.stategl;
    var singularityExplorer = this;
    canvas.addEventListener('mousedown', function(evt) {
        evt.preventDefault();
        state3d.mouseDown([evt.clientX, evt.clientY]);
        singularityExplorer.renderSurface();
    });
    canvas.addEventListener('mousemove', function(evt) {
        evt.preventDefault();
        state3d.mouseMove(evt.clientX, evt.clientY);
    });
    canvas.addEventListener('mouseup', function(evt) {
        evt.preventDefault();
        state3d.mouseUp();
    });
    canvas.addEventListener('wheel', function(evt) {
        evt.preventDefault();
        state3d.mouseWheel(evt.deltaY);
        singularityExplorer.renderSurface();
    });
    canvas.addEventListener('touchstart', function(evt) {
        evt.preventDefault();
        var touch = evt.touches[0];
        state3d.mouseDown([touch.clientX, touch.clientY]);
        singularityExplorer.renderSurface();
    });
    canvas.addEventListener('touchmove', function(evt) {
        evt.preventDefault();
        var touch = evt.touches[0];
        state3d.mouseMove(touch.clientX, touch.clientY);
    });
    canvas.addEventListener('touchend', function(evt) {
        evt.preventDefault();
        state3d.mouseUp();
    });
    window.addEventListener('keydown', function(evt) {
        singularityExplorer.keyDown(evt.keyCode);
    });
};

/** @param {number} keyCode */
SingularityExplorer.prototype.keyDown = function(keyCode) {
    var state3d = this.state3d,
        gl = this.stategl;
    switch (keyCode) {
        case 65: // 'a'
            this.toggleAntialiasing();
            break;
        case 67: // 'c'
            this.toggleClipping();
            break;
        case 79: // 'o'
            this.toggleOrtho();
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

/** @param {boolean} clipping */
SingularityExplorer.prototype.setClipping = function(clipping) {
    this.stategl.setClipping(clipping);
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
