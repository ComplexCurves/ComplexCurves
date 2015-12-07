var SingularityExplorer = {};

/** @param {HTMLCanvasElement} canvas
 *  @param {string} file */
SingularityExplorer.fromFile = function(canvas, file) {
    var gl = new StateGL(canvas, true);
    var state3d = State3D.topView(false);
    gl.mkCachedSurfaceProgram(); // TODO rendering must wait for shader creation
    gl.mkFXAAProgram(); // TODO rendering must wait for shader creation
    gl.mkRenderToTextureObjects();
    SingularityExplorer.loadModel(file, function(positions) {
        gl.mkBuffer(positions);
        gl.size = positions.byteLength / 16;
        SingularityExplorer.renderSurface(state3d, gl);
    });
    SingularityExplorer.registerEventHandlers(canvas, state3d, gl);
};

/** @param {string} file
 *  @param {function(ArrayBuffer)} onload */
SingularityExplorer.loadModel = function(file, onload) {
    var req = new XMLHttpRequest();
    req.open("GET", file, true);
    req.responseType = "arraybuffer";
    req.onload = function() {
        onload( /** @type {ArrayBuffer|null} */ (req.response));
    };
    req.send();
};

/** @param {HTMLCanvasElement} canvas
 *  @param {State3D} state3d
 *  @param {StateGL} gl */
SingularityExplorer.registerEventHandlers = function(canvas, state3d, gl) {
    canvas.addEventListener('mousedown', function(evt) {
        state3d.mouseDown([evt.clientX, evt.clientY]);
        SingularityExplorer.renderSurface(state3d, gl);
    });
    canvas.addEventListener('mousemove', function(evt) {
        state3d.mouseMove(evt.clientX, evt.clientY);
    });
    canvas.addEventListener('mouseup', function() {
        state3d.mouseUp();
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

window['SingularityExplorer'] = SingularityExplorer;
window['SingularityExplorer']['fromFile'] = SingularityExplorer.fromFile;
