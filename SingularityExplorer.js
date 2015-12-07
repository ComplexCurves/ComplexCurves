var SingularityExplorer = {};

SingularityExplorer.fromFile = function(canvasId, file) {
    var canvas = document.getElementById(canvasId);
    var gl = new StateGL(canvas);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    var state3d = State3D.topView(false);
    StateGL.getShaderSources("cached-surface", function(sources) {
        StateGL.mkProgram(gl, sources);
        SingularityExplorer.loadModel(file, function(positions) {
            StateGL.mkBuffer(gl, positions);
            gl.size = positions.byteLength / 16;
            SingularityExplorer.renderSurface(state3d, gl);
        });
        SingularityExplorer.registerEventHandlers(canvas, state3d, gl);
    });
};

SingularityExplorer.loadModel = function(file, onload) {
    var req = new XMLHttpRequest();
    req.open("GET", file, true);
    req.responseType = "arraybuffer";
    req.onload = function() {
        onload(req.response);
    };
    req.send();
};

SingularityExplorer.registerEventHandlers = function(canvas, state3d, gl) {
    canvas.addEventListener('mousedown', function(evt) {
        State3D.mouseDown(state3d, [evt.clientX, evt.clientY]);
        SingularityExplorer.renderSurface(state3d, gl);
    });
    canvas.addEventListener('mousemove', function(evt) {
        State3D.mouseMove(state3d, evt.clientX, evt.clientY);
    });
    canvas.addEventListener('mouseup', function() {
        State3D.mouseUp(state3d);
    });
    canvas.addEventListener('touchstart', function(evt) {
        evt.preventDefault();
        var touch = evt.touches[0];
        State3D.mouseDown(state3d, [touch.clientX, touch.clientY]);
        SingularityExplorer.renderSurface(state3d, gl);
    });
    canvas.addEventListener('touchmove', function(evt) {
        evt.preventDefault();
        var touch = evt.touches[0];
        State3D.mouseMove(state3d, touch.clientX, touch.clientY);
    });
    canvas.addEventListener('touchend', function(evt) {
        evt.preventDefault();
        State3D.mouseUp(state3d);
    });
};

SingularityExplorer.renderSurface = function(st, gl) {
    StateGL.renderSurface(st, gl);
    if (State3D.isRotating(st)) {
        State3D.updateRotation(st);
        requestAnimationFrame(function() {
            SingularityExplorer.renderSurface(st, gl);
        });
    }
};

window['SingularityExplorer'] = SingularityExplorer;
window['SingularityExplorer']['fromFile'] = SingularityExplorer.fromFile;
