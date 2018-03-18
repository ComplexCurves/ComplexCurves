const Quaternion = require('./Quaternion.js');

module.exports = class State3D {
    constructor() {
        this.autorotate = false;
        this.mouseCoord = [0, 0];
        this.ortho = false;
        this.rotating = false;
        this.rotation = Quaternion.fromLatLong(0, 0);
        this.rotationEasing = true;
        this.target0 = Quaternion.fromLatLong(0, 0);
        this.target1 = Quaternion.fromLatLong(0, 0);
        this.twoD = false;
        this.zoomFactor = 1;
    }

    /** @return {Array<number>} */
    static identityMatrix() {
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    }

    /** @return {boolean} */
    isRotating() {
        return this.autorotate || this.rotating || Quaternion.sub(this.rotation, this.target1).abs() > 1e-6;
    }

    /**
     * @param {number} theta
     * @param {number} phi
     * @param {boolean=} ortho
     * @return {State3D}
     */
    static fromLatLong(theta, phi, ortho = false) {
        const q = Quaternion.fromLatLong(theta, phi),
            st = new State3D();
        st.ortho = ortho;
        st.rotation = st.target0 = st.target1 = q;
        return st;
    }

    /** @return {State3D} */
    static backView() {
        return State3D.fromLatLong(Math.PI / 2, Math.PI);
    }

    /** @return {State3D} */
    static frontView() {
        return State3D.fromLatLong(Math.PI / 2, 0);
    }

    /**
     * @param {boolean=} ortho
     * @return {State3D}
     */
    static topView(ortho = false) {
        return State3D.fromLatLong(0, 0, ortho);
    }

    /** @return {State3D} */
    static bottomView() {
        return State3D.fromLatLong(Math.PI, 0);
    }

    /** @return {State3D} */
    static leftView() {
        return State3D.fromLatLong(Math.PI / 2, -Math.PI / 2);
    }

    /** @return {State3D} */
    static rightView() {
        return State3D.fromLatLong(Math.PI / 2, Math.PI / 2);
    }

    /**
     * @param {number} lat
     * @param {number} lon
     * @param {boolean} ortho
     * @return {State3D}
     */
    static fromLatLongDegrees(lat, lon, ortho) {
        const piOver180 = Math.PI / 180;
        return State3D.fromLatLong(lat * piOver180, lon * piOver180, ortho);
    }

    /** @return {State3D} */
    static twoDimensionalView() {
        const st = State3D.topView(true);
        st.twoD = true;
        return st;
    }

    /** @return {Array<number>} */
    modelMatrix() {
        return this.rotation.rotationMatrix();
    }

    /** @param {Array<number>} xy */
    mouseDown(xy) {
        if (this.autorotate)
            return;
        this.mouseCoord = xy;
        this.rotating = true;
        this.target0 = this.target1;
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    mouseMove(x, y) {
        if (!(this.rotating))
            return;
        const xy = this.mouseCoord,
            xo = xy[0],
            yo = xy[1],
            dx = x - xo,
            dy = yo - y,
            dr = Math.sqrt(dx * dx + dy * dy),
            q = this.target0,
            r = 100,
            cost = r / Math.sqrt(r * r + dr * dr);
        let sint = dr / Math.sqrt(r * r + dr * dr);
        const q2 = Quaternion.mul(new Quaternion(cost, -sint * dy, sint * dx, 0),
            q);
        this.target1 = Quaternion.nlerp(q, q2, 0.05);
    }

    mouseUp() {
        this.mouseCoord = [0, 0];
        this.rotating = false;
    }

    /** @param {number} direction */
    mouseWheel(direction) {
        if (direction > 0)
            this.zoomOut();
        else
            this.zoomIn();
    }

    /**
     * orthographic projection matrix, in column-major order
     * @param {number} width
     * @param {number} height
     * @param {number} zoom
     * @return {Array<number>}
     */
    static orthographicProjectionMatrix(width, height, zoom) {
        const bottom = -7.5 * zoom,
            left = -7.5 * zoom,
            right = 7.5 * zoom,
            top = 7.5 * zoom,
            zFar = 100,
            zNear = -100;
        let s1 = Math.min(height / width, 1),
            s2 = Math.min(width / height, 1);
        return [s1 * 2 / (right - left), 0, 0, 0, 0, s2 * 2 / (top - bottom), 0,
            0, 0, 0, -2 / (zFar - zNear), 0, -s1 * (right + left) / (right -
                left), -s2 * (top + bottom) / (top - bottom), -(zFar +
                zNear) / (zFar - zNear), 1
        ];
    }

    /**
     * perspective projection matrix, in column-major order
     * @param {number} width
     * @param {number} height
     * @param {number} zoom
     * @return {Array<number>}
     */
    static perspectiveProjectionMatrix(width, height, zoom) {
        const zFar = 100,
            zNear = 1,
            aspect = height > 0 ? width / height : width;
        const fovy = 45 * zoom,
            f = 1 / Math.tan(fovy / 2 * Math.PI / 180);
        return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (zFar +
                zNear) / (zNear - zFar), -1, 0, 0, 2 * zFar *
            zNear / (zNear - zFar), 0
        ];
    }

    /**
     * @param {number} w
     * @param {number} h
     * @return {Array<number>}
     */
    projectionMatrix(w, h) {
        if (this.ortho)
            return State3D.orthographicProjectionMatrix(w, h, this.zoomFactor);
        else if (this.twoD)
            return State3D.identityMatrix();
        else
            return State3D.perspectiveProjectionMatrix(w, h, this.zoomFactor);
    }

    /** @param {boolean} autorotate */
    setAutorotate(autorotate) {
        this.autorotate = autorotate;
    }

    /** @param {boolean} ortho */
    setOrtho(ortho) {
        this.ortho = ortho;
    }

    /** @param {boolean} twoD */
    setTwoD(twoD) {
        this.twoD = twoD;
    }

    toggleAutorotate() {
        this.autorotate = !this.autorotate;
    }

    toggleOrtho() {
        this.ortho = !this.ortho;
    }

    toggleTwoD() {
        this.twoD = !this.twoD;
    }

    updateRotation() {
        if (this.autorotate) {
            let q = new Quaternion(0.01, 0, 0, 1).normalize();
            q = Quaternion.mul(q, q);
            this.rotation = this.target1 = Quaternion.mul(this.rotation, q);
        } else if (this.rotationEasing) {
            this.rotation = Quaternion.nlerp(this.rotation, this.target1, 0.1);
        } else {
            this.rotation = this.target1;
        }
    }

    /** @param {number} z */
    updateZoom(z) {
        this.zoomFactor = z;
    }

    /** @return {Array<number>} */
    viewMatrix() {
        if (this.ortho || this.twoD)
            return State3D.identityMatrix();
        else
            return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -20, 1];
    }

    zoomIn() {
        this.updateZoom(Math.max(0.5, this.zoomFactor - 0.1));
    }

    zoomOut() {
        this.updateZoom(Math.min(4, this.zoomFactor + 0.1));
    }
};
