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
        w: Misc.lerp(a.w, b.w, t),
        x: Misc.lerp(a.x, b.x, t),
        y: Misc.lerp(a.y, b.y, t),
        z: Misc.lerp(a.z, b.z, t)
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