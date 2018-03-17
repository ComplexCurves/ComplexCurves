module.exports = class Complex {
    /**
     * @param {number} re
     * @param {number} im
     */
    constructor(re, im) {
        this.re = re;
        this.im = im;
    }

    /** @return {number} */
    abs() {
        return Math.sqrt(this.abs2());
    }

    /** @return {number} */
    abs2() {
        return this.re * this.re + this.im * this.im;
    }

    /**
     * @param {Complex} a
     * @param {Complex} b
     * @return {Complex}
     */
    static add(a, b) {
        return new Complex(a.re + b.re, a.im + b.im);
    }

    /**
     * @param {Complex} b
     * @return {Complex}
     */
    add(b) {
        return Complex.add(this, b);
    }

    /**
     * @param {Complex} a
     * @param {Complex} b
     * @return {Complex}
     */
    static div(a, b) {
        const abs2 = b.abs2();
        const re = a.re * b.re + a.im * b.im;
        const im = a.im * b.re - a.re * b.im;
        return new Complex(re / abs2, im / abs2);
    }

    /** @return {number} */
    getImaginaryPart() {
        return this.im;
    }

    /** @return {number} */
    getRealPart() {
        return this.re;
    }

    /** @return {Complex} */
    static infinity() {
        return new Complex(Infinity, Infinity);
    }

    /**
     * @param {Complex} z
     * @return {Complex}
     */
    static inv(z) {
        const abs2 = z.abs2();
        return new Complex(z.re / abs2, -z.im / abs2);
    }

    /**
     * @param {Complex} z
     *  @return {boolean}
     */
    static isZero(z) {
        return z.re === 0 && z.im === 0;
    }

    /**
     * @param {Complex} a
     * @param {Complex} b
     * @return {Complex}
     */
    static mul(a, b) {
        return new Complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
    }

    /**
     * @param {Complex} b
     * @return {Complex}
     */
    mul(b) {
        return Complex.mul(this, b);
    }

    /** @return {Complex} */
    neg() {
        return new Complex(-this.re, -this.im);
    }

    /** @return {Complex} */
    static one() {
        return new Complex(1, 0);
    }

    /**
     * @param {number} re
     * @return {Complex}
     */
    static real(re) {
        return new Complex(re, 0);
    }

    /**
     * @param {Complex} z
     * @return {Complex}
     */
    static sqrt(z) {
        if (Complex.isZero(z))
            return Complex.zero();
        const r = z.abs();
        const s = Math.sign(z.im) || 1;
        return new Complex(Math.sqrt((r + z.re) * 0.5), s * Math.sqrt((r - z.re) * 0.5));
    }

    /**
     * @param {Complex} a
     * @param {Complex} b
     * @return {Complex}
     */
    static sub(a, b) {
        return new Complex(a.re - b.re, a.im - b.im);
    }

    /** @return {Complex} */
    static zero() {
        return new Complex(0, 0);
    }

    /** @return {Complex} */
    zero() {
        return Complex.zero();
    }
};
