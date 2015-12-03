/** @constructor */
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
