var SingularityExplorer = {};

/** @param {HTMLCanvasElement} canvas
 *  @param {string} equation
 *  @param {number} depth */
SingularityExplorer.fromEquation = function(canvas, equation, depth) {
    var p = PolynomialParser.eval(PolynomialParser.parse(equation));
    SingularityExplorer.fromPolynomial(canvas, p, depth);
};

/** @param {HTMLCanvasElement} canvas
 *  @param {string} file */
SingularityExplorer.fromFile = function(canvas, file) {
    var state3d = State3D.topView(false);
    var gl = new StateGL(canvas);
    gl.renderer = new CachedSurface(gl, file, function() {
        SingularityExplorer.renderSurface(state3d, gl);
        SingularityExplorer.registerEventHandlers(canvas, state3d, gl);
    });
};

/** @param {HTMLCanvasElement} canvas
 *  @param {Polynomial} polynomial
 *  @param {number} depth */
SingularityExplorer.fromPolynomial = function(canvas, polynomial, depth) {
    var state3d = State3D.topView(false);
    var gl = new StateGL(canvas);
    gl.renderer = new Surface(gl, polynomial, depth);
    SingularityExplorer.renderSurface(state3d, gl);
    SingularityExplorer.registerEventHandlers(canvas, state3d, gl);
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
            gl.toggleAntialiasing();
            break;
        case 67: // 'c'
            gl.toggleClipping();
            break;
        case 79: // 'o'
            state3d.toggleOrtho();
            break;
        case 84: // 't'
            gl.toggleTransparency();
            break;
        case 49: // '1'
            state3d.target1 = Quaternion.fromLatLong(Math.PI / 2, 0);
            break;
        case 51: // '3'
            state3d.target1 = Quaternion.fromLatLong(Math.PI / 2, Math.PI /
                2);
            break;
        case 53: // '5'
            state3d.toggleOrtho();
            break;
        case 55: // '7'
            state3d.target1 = Quaternion.fromLatLong(0, 0);
            break;
        case 48: // '0'
            state3d.target1 = Quaternion.fromLatLong(75 / 180 * Math.PI,
                30 / 180 * Math.PI);
            break;
    }
    SingularityExplorer.renderSurface(state3d, gl);
};

/** @param {State3D} st
 *  @param {StateGL} gl */
SingularityExplorer.renderSurface = function(st, gl) {
    gl.renderSurface(st);
    if (st.isRotating()) {
        st.updateRotation();
        requestAnimationFrame(function() {
            SingularityExplorer.renderSurface(st, gl);
        });
    }
};

export default SingularityExplorer;
