/** @param {Array<Array<T>>} m
 *  @constructor
 *  @template T */
function Matrix(m) {
    this.values = m;
}

/** Richard S. Bird, A simple division-free algorithm for computing determinants
 *  @return {T} */
Matrix.prototype.det = function() {
    var as = this.values;
    var n = as.length;
    if (n === 0)
        console.error('matrix must be non-empty');
    for (var i = 0; i < n; i++)
        if (as[i].length !== n)
            console.error('matrix must be square');
    var a = new Matrix(as);
    for (var j = 1; j < n; j++)
        a = Matrix.mul(Matrix.mu(a), this);
    var d = a.values[0][0];
    if (n % 2 === 0)
        d = Complex.neg(d);
    return d;
};

/** @param {Array<T>} v
 *  @return {Matrix<T>}
 *  @template T */
Matrix.diag = function(v) {
    var as = [];
    for (var i = 0; i < v.length; i++) {
        as[i] = [];
        for (var j = 0; j < v.length; j++)
            as[i][j] = i === j ? v[i] : 0;
    }
    return new Matrix(as);
};


/** @param {Matrix} mu
 *  @return {Matrix} */
Matrix.mu = function(x) {
    var xs = x.values;
    var ms = [];
    for (var i = 0; i < xs.length; i++) {
        ms[i] = [];
        for (var j = 0; j < xs.length; j++) {
            if (j < i) {
                ms[i][j] = Complex.zero();
            } else if (j === i) {
                var sum = Complex.zero();
                for (var k = j + 1; k < xs.length; k++)
                    sum = Complex.add(sum, Complex.neg(xs[k][k]));
                ms[i][j] = sum;
            } else {
                ms[i][j] = xs[i][j];
            }
        }
    }
    return new Matrix(ms);
};

/** @param {Matrix<Complex>} a
 *  @param {Matrix<Complex>} b
 *  @return {Matrix<Complex>} */
Matrix.mul = function(a, b) {
    var as = a.values,
        bs = b.values;
    if (as[0].length !== bs.length)
        console.error('matrix dimensions must match');
    var cs = [];
    var rows = as.length,
        cols = bs[0].length;
    for (var i = 0; i < rows; i++) {
        cs[i] = [];
        for (var j = 0; j < cols; j++) {
            var sum = Complex.zero();
            for (var k = 0; k < as[0].length; k++)
                sum = Complex.add(sum, Complex.mul(as[i][k], bs[k][j]));
            cs[i][j] = sum;
        }
    }
    return new Matrix(cs);
};
