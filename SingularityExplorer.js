var SingularityExplorer = (function() {
    "use strict";

    function _lerp(x, y, mu) {
        return x + mu * (y - x);
    }

    function loadTextFiles(files, onload) {
        var sources = [],
            count = 0;
        files.forEach(function(file, i, files) {
            var req = new XMLHttpRequest();
            req.open("GET", file, true);
            req.responseType = "text";
            req.onload = function() {
                sources[i] = req.responseText;
                if (++count == files.length)
                    onload(sources);
            };
            req.send();
        });
    }

    var Quaternion = {};

    Quaternion.abs = function(q) {
        return Math.sqrt(q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z);
    };

    Quaternion.fromLatLong = function(lat, long) {
        var theta = -lat / 2,
            phi = -long / 2,
            a = Quaternion.wxyz(Math.cos(theta), Math.sin(theta), 0, 0),
            b = Quaternion.wxyz(Math.cos(phi), 0, 0, Math.sin(phi));
        return Quaternion.mul(a, b);
    };

    Quaternion.lerp = function(a, b, t) {
        return {
            w: _lerp(a.w, b.w, t),
            x: _lerp(a.x, b.x, t),
            y: _lerp(a.y, b.y, t),
            z: _lerp(a.z, b.z, t)
        };
    };

    Quaternion.mul = function(a, b) {
        return {
            w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
            x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
            y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
            z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
        };
    };

    Quaternion.nlerp = function(a, b, t) {
        var q = Quaternion.lerp(a, b, t),
            abs = Quaternion.abs(q);
        return {
            w: q.w / abs,
            x: q.x / abs,
            y: q.y / abs,
            z: q.z / abs
        };
    };

    /* rotation matrix from quaternion, in column-major order */
    Quaternion.rotationMatrix = function(q) {
        var w = q.w,
            x = q.x,
            y = q.y,
            z = q.z;
        return [w * w + x * x - y * y - z * z, 2 * x * y + 2 * w * z, 2 * x * z - 2 * w * y, 0, 2 * x * y - 2 * w * z, w * w - x * x + y * y - z * z, 2 * y * z + 2 * w * x, 0, 2 * x * z + 2 * w * y, 2 * y * z - 2 * w * x, w * w - x * x - y * y + z * z, 0, 0, 0, 0, w * w + x * x + y * y + z * z];
    };

    Quaternion.sub = function(a, b) {
        return {
            w: a.w - b.w,
            x: a.x - b.x,
            y: a.y - b.y,
            z: a.z - b.z
        };
    };

    Quaternion.wxyz = function(w, x, y, z) {
        return {
            w: w,
            x: x,
            y: y,
            z: z
        };
    };

    function State3D() {}

    State3D.prototype.mouseCoord = [0, 0];
    State3D.prototype.ortho = false;
    State3D.prototype.rotating = false;
    State3D.prototype.rotation = Quaternion.fromLatLong(0, 0);
    State3D.prototype.rotationEasing = true;
    State3D.prototype.target0 = Quaternion.fromLatLong(0, 0);
    State3D.prototype.target1 = Quaternion.fromLatLong(0, 0);
    State3D.prototype.twoD = false;
    State3D.prototype.zoomFactor = 1;

    State3D.identityMatrix = function() {
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    };

    State3D.isRotating = function(st) {
        return st.rotating || Quaternion.abs(Quaternion.sub(st.rotation, st.target1)) > 0.01;
    };

    State3D.fromLatLong = function(theta, phi) {
        return function(ortho) {
            var q = Quaternion.fromLatLong(theta, phi),
                st = new State3D();
            st.ortho = ortho;
            st.rotation = st.target0 = st.target1 = q;
            return st;
        };
    };

    State3D.backView = State3D.fromLatLong(Math.PI / 2, Math.PI);
    State3D.frontView = State3D.fromLatLong(Math.PI / 2, 0);
    State3D.topView = State3D.fromLatLong(0, 0);
    State3D.bottomView = State3D.fromLatLong(Math.PI, 0);
    State3D.leftView = State3D.fromLatLong(Math.PI / 2, -Math.PI / 2);
    State3D.rightView = State3D.fromLatLong(Math.PI / 2, Math.PI / 2);
    State3D.fromLatLongDegrees = function(lat, long, ortho) {
        return (State3D.fromLatLong(lat / 180 * Math.PI, long / 180 * Math.PI))(ortho);
    };
    State3D.twoDimensionalView = function() {
        var st = State3D.topView;
        st.twoD = true;
        return st;
    };

    State3D.modelMatrix = function(st) {
        return Quaternion.rotationMatrix(st.rotation);
    };

    State3D.mouseDown = function(st, xy) {
        st.mouseCoord = xy;
        st.rotating = true;
        st.target0 = st.target1;
    };

    State3D.mouseMove = function(st, x, y) {
        if (!st.rotating)
            return;
        var xy = st.mouseCoord,
            xo = xy[0],
            yo = xy[1],
            dx = x - xo,
            dy = yo - y,
            dr = Math.sqrt(dx * dx + dy * dy),
            q = st.target0,
            r = 100,
            cost = r / Math.sqrt(r * r + dr * dr),
            sint = dr / Math.sqrt(r * r + dr * dr),
            q2 = Quaternion.mul(Quaternion.wxyz(cost, -sint * dy, sint * dx, 0), q);
        st.target1 = Quaternion.nlerp(q, q2, 0.05);
    };

    State3D.mouseUp = function(st) {
        st.mouseCoord = [0, 0];
        st.rotating = false;
    };

    /* orthographic projection matrix, in column-major order */
    State3D.orthographicProjectionMatrix = function(width, height, zoom) {
        var bottom = -7.5 * zoom,
            left = -7.5 * zoom,
            right = 7.5 * zoom,
            top = 7.5 * zoom,
            zFar = 100,
            zNear = -100,
            s1 = Math.min(height / width, 1),
            s2 = Math.min(width / height, 1);
        return [s1 * 2 / (right - left), 0, 0, 0, 0, s2 * 2 / (top - bottom), 0, 0, 0, 0, -2 / (zFar - zNear), 0, -s1 * (right + left) / (right - left), -s2 * (top + bottom) / (top - bottom), -(zFar + zNear) / (zFar - zNear), 1];
    };

    /* perspective projection matrix, in column-major order */
    State3D.perspectiveProjectionMatrix = function(width, height, zoom) {
        var zFar = 100,
            zNear = 1,
            aspect = height > 0 ? width / height : width;
        var fovy = 45 * zoom,
            f = 1 / Math.tan(fovy / 2 * Math.PI / 180);
        return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (zFar +
                zNear) / (zNear - zFar), -1, 0, 0, 2 * zFar *
            zNear / (zNear - zFar), 0
        ];
    };

    State3D.projectionMatrix = function(st, w, h) {
        if (st.ortho)
            return State3D.orthographicProjectionMatrix(w, h, st.zoomFactor);
        else if (st.twoD)
            return State3D.identityMatrix();
        else
            return State3D.perspectiveProjectionMatrix(w, h, st.zoomFactor);
    };

    State3D.toggleOrtho = function(st) {
        st.ortho = !st.ortho;
    };

    State3D.toggleTwoD = function(st) {
        st.twoD = !st.twoD;
    };

    State3D.updateRotation = function(st) {
        if (st.rotationEasing)
            st.rotation = Quaternion.nlerp(st.rotation, st.target1, 0.1);
        else
            st.rotation = st.target1;
    };

    State3D.updateZoom = function(st, z) {
        st.zoomFactor = z;
    };

    State3D.viewMatrix = function(st) {
        if (st.ortho || st.twoD)
            return State3D.identityMatrix();
        else
            return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -20, 1];
    };

    State3D.zoomIn = function(st) {
        State3D.updateZoom(st, Math.max(0.5, st.zoomFactor - 0.1));
    };

    State3D.zoomOut = function(st) {
        State3D.updateZoom(st, Math.min(4, st.zoomFactor + 0.1));
    };

    function StateGL(canvas) {
        return canvas.getContext('webgl', {
            preserveDrawingBuffer: true
        });
    }

    StateGL.prototype.size = 0;

    StateGL.getShaderSources = function(shaderId, onload) {
        var files = ['cached-surface-vs.glsl', 'cached-surface-fs.glsl'];
        loadTextFiles(files, onload);
    };

    StateGL.mkBuffer = function(gl, positions) {
        gl.enableVertexAttribArray(0);
        var positionsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    };

    StateGL.mkProgram = function(gl, sources) {
        var vertexShaderSource = sources[0],
            fragmentShaderSource = sources[1];
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
            console.log(gl.getShaderInfoLog(vertexShader));
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
            console.log(gl.getShaderInfoLog(fragmentShader));
        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
            console.log(gl.getProgramInfoLog(shaderProgram));
        gl.useProgram(shaderProgram);
        return shaderProgram;
    };

    StateGL.renderSurface = function(st, gl) {
        StateGL.updateModelViewProjectionMatrices(st, gl);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, gl.size);
    };

    StateGL.updateModelMatrix = function(st, gl) {
        StateGL.updateUniformMatrix(gl, "m", State3D.modelMatrix(st));
    };

    StateGL.updateModelViewProjectionMatrices = function(st, gl) {
        StateGL.updateModelMatrix(st, gl);
        StateGL.updateViewMatrix(st, gl);
        StateGL.updateProjectionMatrix(st, gl);
    };

    StateGL.updateProjectionMatrix = function(st, gl) {
        var vp = gl.getParameter(gl.VIEWPORT),
            w = vp[2],
            h = vp[3];
        StateGL.updateUniformMatrix(gl, "p", State3D.projectionMatrix(st, w, h));
    };

    StateGL.updateUniformMatrix = function(gl, i, ms) {
        var program = gl.getParameter(gl.CURRENT_PROGRAM);
        var loc = gl.getUniformLocation(program, i);
        gl.uniformMatrix4fv(loc, false, ms);
    };

    StateGL.updateViewMatrix = function(st, gl) {
        StateGL.updateUniformMatrix(gl, "v", State3D.viewMatrix(st));
    };

    var SE = {};

    SE.fromFile = function(canvasId, file) {
        var canvas = document.getElementById(canvasId);
        var gl = new StateGL(canvas);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        var state3d = State3D.topView(false);
        StateGL.getShaderSources("surface", function(sources) {
            StateGL.mkProgram(gl, sources);
            SE.loadModel(file, function(positions) {
                StateGL.mkBuffer(gl, positions);
                gl.size = positions.byteLength / 16;
                SE.renderSurface(state3d, gl);
            });
            canvas.addEventListener('mousedown', function(evt) {
                State3D.mouseDown(state3d, [evt.clientX, evt.clientY]);
                SE.renderSurface(state3d, gl);
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
                SE.renderSurface(state3d, gl);
            });
            canvas.addEventListener('touchmove', function(evt) {
                evt.preventDefault();
                var touch = evt.touches[0];
                State3D.mouseMove(state3d, touch.clientX, touch.clientY);
            });
            canvas.addEventListener('touchend', function() {
                evt.preventDefault();
                State3D.mouseUp(state3d);
            });
        });
    };

    SE.loadModel = function(file, onload) {
        var req = new XMLHttpRequest();
        req.open("GET", file, true);
        req.responseType = "arraybuffer";
        req.onload = function() {
            onload(req.response);
        };
        req.send();
    };

    SE.renderSurface = function(st, gl) {
        StateGL.renderSurface(st, gl);
        if (State3D.isRotating(st)) {
            State3D.updateRotation(st);
            requestAnimationFrame(function() {
                SE.renderSurface(st, gl);
            });
        }
    };

    return SE;
})();
