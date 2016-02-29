var SingularityExplorer = {};

/** @param {HTMLCanvasElement} canvas
 *  @param {string} equation
 *  @param {number} depth
 *  @return {{state3d: State3D, gl: StateGL}} */
SingularityExplorer.fromEquation = function(canvas, equation, depth) {
    var p = PolynomialParser.eval(PolynomialParser.parse(equation));
    return SingularityExplorer.fromPolynomial(canvas, p, depth);
};

/** @param {HTMLCanvasElement} canvas
 *  @param {string} file
 *  @return {{state3d: State3D, gl: StateGL}} */
SingularityExplorer.fromFile = function(canvas, file) {
    var state3d = State3D.topView(false);
    var gl = new StateGL(canvas);
    gl.renderer = new CachedSurface(gl, file, function() {
        SingularityExplorer.renderSurface(state3d, gl);
        SingularityExplorer.registerEventHandlers(canvas, state3d, gl);
    });
    return { "state3d": state3d, "gl": gl };
};

/** @param {HTMLCanvasElement} canvas
 *  @param {Polynomial} polynomial
 *  @param {number} depth
 *  @return {{state3d: State3D, gl: StateGL}} */
SingularityExplorer.fromPolynomial = function(canvas, polynomial, depth) {
    var state3d = State3D.topView(false);
    var gl = new StateGL(canvas);
    gl.renderer = new Surface(gl, polynomial, depth);
    SingularityExplorer.renderSurface(state3d, gl);
    SingularityExplorer.registerEventHandlers(canvas, state3d, gl);
    return { "state3d": state3d, "gl": gl };
};

/** @param {HTMLCanvasElement} canvas
 *  @param {State3D} state3d
 *  @param {StateGL} gl */
SingularityExplorer.registerEventHandlers = function(canvas, state3d, gl) {
    canvas.addEventListener('mousedown', function(evt) {
        evt.preventDefault();
        state3d.mouseDown([evt.clientX, evt.clientY]);
        SingularityExplorer.renderSurface(state3d, gl);
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
        SingularityExplorer.renderSurface(state3d, gl);
    });
    canvas.addEventListener('touchstart', function(evt) {
        evt.preventDefault();
        var touch = evt.touches[0];
        state3d.mouseDown([touch.clientX, touch.clientY]);
        SingularityExplorer.renderSurface(state3d, gl);
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
        SingularityExplorer.keyDown(evt.keyCode, state3d, gl);
    });
};

/** @param {number} keyCode
 *  @param {State3D} state3d
 *  @param {StateGL} gl */
SingularityExplorer.keyDown = function(keyCode, state3d, gl) {
    switch (keyCode) {
        case 65: // 'a'
            SingularityExplorer.toggleAntialiasing(state3d, gl);
            break;
        case 67: // 'c'
            SingularityExplorer.toggleClipping(state3d, gl);
            break;
        case 79: // 'o'
            SingularityExplorer.toggleOrtho(state3d, gl);
            break;
        case 84: // 't'
            SingularityExplorer.toggleTransparency(state3d, gl);
            break;
        case 49: // '1'
            SingularityExplorer.rotateFront(state3d, gl);
            break;
        case 51: // '3'
            SingularityExplorer.rotateRight(state3d, gl);
            break;
        case 53: // '5'
            SingularityExplorer.toggleOrtho(state3d, gl);
            break;
        case 55: // '7'
            SingularityExplorer.rotateTop(state3d, gl);
            break;
        case 48: // '0'
            SingularityExplorer.rotateLatLong(state3d, gl, 5 / 12 * Math.PI,
                Math.PI / 6);
            break;
    }
};

/** @param {State3D} state3d
 *  @param {StateGL} gl */
SingularityExplorer.renderSurface = function(state3d, gl) {
    gl.renderSurface(state3d);
    if (state3d.isRotating()) {
        state3d.updateRotation();
        requestAnimationFrame(function() {
            SingularityExplorer.renderSurface(state3d, gl);
        });
    }
};

/** @param {State3D} state3d
 *  @param {StateGL} gl */
SingularityExplorer.rotateFront = function(state3d, gl) {
    SingularityExplorer.rotateLatLong(state3d, gl, Math.PI / 2, 0);
};

/** @param {State3D} state3d
 *  @param {StateGL} gl
 *  @param {number} lat
 *  @param {number} lon */
SingularityExplorer.rotateLatLong = function(state3d, gl, lat, lon) {
    state3d.target1 = Quaternion.fromLatLong(lat, lon);
    SingularityExplorer.renderSurface(state3d, gl);
};

/** @param {State3D} state3d
 *  @param {StateGL} gl */
SingularityExplorer.rotateRight = function(state3d, gl) {
    SingularityExplorer.rotateLatLong(state3d, gl, Math.PI / 2, Math.PI / 2);
};

/** @param {State3D} state3d
 *  @param {StateGL} gl */
SingularityExplorer.rotateTop = function(state3d, gl) {
    SingularityExplorer.rotateLatLong(state3d, gl, 0, 0);
};

/** @param {State3D} state3d
 *  @param {StateGL} gl
 *  @param {boolean} fxaa */
SingularityExplorer.setAntialiasing = function(state3d, gl, fxaa) {
    gl.setAntialiasing(fxaa);
    SingularityExplorer.renderSurface(state3d, gl);
};

/** @param {State3D} state3d
 *  @param {StateGL} gl
 *  @param {boolean} clipping */
SingularityExplorer.setClipping = function(state3d, gl, clipping) {
    gl.setClipping(clipping);
    SingularityExplorer.renderSurface(state3d, gl);
};

/** @param {State3D} state3d
 *  @param {StateGL} gl
 *  @param {boolean} ortho */
SingularityExplorer.setOrtho = function(state3d, gl, ortho) {
    state3d.setOrtho(ortho);
    SingularityExplorer.renderSurface(state3d, gl);
};

/** @param {State3D} state3d
 *  @param {StateGL} gl
 *  @param {boolean} transparency */
SingularityExplorer.setTransparency = function(state3d, gl, transparency) {
    gl.setTransparency(transparency);
    SingularityExplorer.renderSurface(state3d, gl);
};

/** @param {State3D} state3d
 *  @param {StateGL} gl */
SingularityExplorer.toggleAntialiasing = function(state3d, gl) {
    gl.toggleAntialiasing();
    SingularityExplorer.renderSurface(state3d, gl);
};

/** @param {State3D} state3d
 *  @param {StateGL} gl */
SingularityExplorer.toggleClipping = function(state3d, gl) {
    gl.toggleClipping();
    SingularityExplorer.renderSurface(state3d, gl);
};

/** @param {State3D} state3d
 *  @param {StateGL} gl */
SingularityExplorer.toggleOrtho = function(state3d, gl) {
    state3d.toggleOrtho();
    SingularityExplorer.renderSurface(state3d, gl);
};

/** @param {State3D} state3d
 *  @param {StateGL} gl */
SingularityExplorer.toggleTransparency = function(state3d, gl) {
    gl.toggleTransparency();
    SingularityExplorer.renderSurface(state3d, gl);
};

export default SingularityExplorer;
