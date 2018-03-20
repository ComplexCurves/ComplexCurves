const ArgumentError = require('./ArgumentError.js');

module.exports = class Matrix {
    /**
     * @param {Array<Array<./Polynomial>>} m
     */
    constructor(m) {
        this.values = m;
    }

    /**
     * Richard S. Bird
     * A simple division-free algorithm for computing determinants
     * @return {./Polynomial}
     */
    det() {
        if (this.values === null || this.values.length === 0 || this.values[0].length === 0)
            throw new ArgumentError('matrix must be non-empty');
        const as = this.values;
        const n = as.length;
        for (let i = 0; i < n; i++)
            if (as[i].length !== n)
                throw new ArgumentError('matrix must be square');
        let a = this;
        for (let j = 1; j < n; j++)
            a = Matrix.mul(Matrix.mu(a), this);
        const d = a.values[0][0];
        return n % 2 === 0 ? d.neg() : d;
    }

    /**
     * @param {Matrix} x
     * @return {Matrix}
     */
    static mu(x) {
        const xs = x.values;
        const zero = xs[0][0].zero();
        const ms = [];
        const l = xs.length;
        for (let i = 0; i < l; i++) {
            ms[i] = [];
            for (let j = 0; j < l; j++) {
                if (j < i) {
                    ms[i][j] = zero;
                } else if (j === i) {
                    let sum = zero;
                    for (let k = j + 1; k < l; k++)
                        sum = sum.add(xs[k][k].neg());
                    ms[i][j] = sum;
                } else {
                    ms[i][j] = xs[i][j];
                }
            }
        }
        return new Matrix(ms);
    }

    /**
     * @param {Matrix} a
     * @param {Matrix} b
     * @return {Matrix}
     */
    static mul(a, b) {
        const as = a.values,
            bs = b.values;
        if (as[0].length !== bs.length)
            throw new ArgumentError('matrix dimensions must match');
        const cs = [];
        const rows = as.length,
            cols = bs[0].length,
            zero = as[0][0].zero();
        for (let i = 0; i < rows; i++) {
            cs[i] = [];
            for (let j = 0; j < cols; j++) {
                let sum = zero;
                const l = as[0].length;
                for (let k = 0; k < l; k++)
                    sum = sum.add(as[i][k].mul(bs[k][j]));
                cs[i][j] = sum;
            }
        }
        return new Matrix(cs);
    }
};
