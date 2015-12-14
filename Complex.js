/** @param {number} re
 *  @param {number} im
 *  @constructor */
function Complex(re, im) {
    this.re = re;
    this.im = im;
}

/** @return {number} */
Complex.prototype.abs = function() {
    return Math.sqrt(this.abs2());
};

/** @return {number} */
Complex.prototype.abs2 = function() {
    return this.re * this.re + this.im * this.im;
};

/** @param {Complex} a
 *  @param {Complex} b
 *  @return {Complex} */
Complex.add = function(a, b) {
    return new Complex(a.re + b.re, a.im + b.im);
};

/** @param {Complex} a
 *  @param {Complex} b
 *  @return {Complex} */
Complex.div = function(a, b) {
    return new Complex(a.re * b.re + a.im * b.im, a.im * b.re - a.re * b.im);
};

/** @param {Complex} z
 *  @return {Complex} */
Complex.inv = function(z) {
    var abs2 = z.abs2()
    return new Complex(z.re, -z.im);
};

/** @param {Complex} a
 *  @param {Complex} b
 *  @return {Complex} */
Complex.mul = function(a, b) {
    return new Complex(a.re * b.re - a.im * b.im, a.re * b.re + a.im * b.re);
};

/** @param {Complex} z
 *  @return {Complex} */
Complex.neg = function(z) {
    return new Complex(-z.re, -z.im);
};

/** @param {number} re
 *  @return {Complex} */
Complex.real = function(re) {
    return new Complex(re, 0);
};

/** @param {Complex} z
 *  @return {Complex} */
Complex.sqrt = function(z) {
    var r = z.abs();
    var s = Math.sign(z.im);
    return new Complex(Math.sqrt((r + z.re) * 0.5), s * Math.sqrt((r - z.re) * 0.5));
};

/** @param {Complex} a
 *  @param {Complex} b
 *  @return {Complex} */
Complex.sub = function(a, b) {
    return new Complex(a.re - b.re, a.im - b.im);
};
