/** @param {Object<string,number>} monomial
 *  @constructor */
function Monomial(monomial) {
    this.value = monomial;
}

/** @param {Monomial} a
 *  @return {Monomial} */
Monomial.clone = function(a) {
    var monomial = {};
    for (var key in a.value)
        monomial[key] = a[key];
    return new Monomial(monomial);
};

/** @param {Monomial} a
 *  @param {Monomial} b
 *  @return {boolean} */
Monomial.is = function(a, b) {
    for (var key in a.value)
        if (!b.value.hasOwnProperty(key) || a[key] != b[key])
            return false;
    for (key in b.value)
        if (!a.value.hasOwnProperty(key) || a[key] != b[key])
            return false;
    return true;
};

/** @param {Complex} coefficient
 *  @param {Monomial} monomial
 *  @constructor */
function Term(coefficient, monomial) {
    this.coefficient = coefficient;
    this.monomial = monomial;
}

/** @param {Term} a
 *  @param {Term} b
 *  @return {Term} */
Term.add = function(a, b) {
    if (!Monomial.is(a.monomial, b.monomial))
        console.error('Monomials do not match');
    return new Term(Complex.add(a.coefficient, b.coefficient), a.monomial);
};

/** @param {Term} a
 *  @param {Term} b
 *  @return {Term} */
Term.mul = function(a, b) {
    var monomial = {};
    var oa = a.monomial.value,
        ob = a.monomial.value;
    for (var key in oa) {
        monomial[key] = oa[key];
        if (ob.hasOwnProperty(key))
            monomial[key] += ob[key];
    }
    for (key in ob) {
        monomial[key] = ob[key];
        if (oa.hasOwnProperty(key))
            monomial[key] += oa[key];
    }
    return new Term(Complex.mul(a.coefficient, b.coefficient),
        new Monomial(monomial));
};

/** @param {Term} a
 *  @return {Term} */
Term.neg = function(a) {
    return new Term(a.coefficient.neg(), a.monomial);
};

/** @param {Array<Term>} terms
 *  @return {Array<Term>} */
Term.reduce = function(terms) {
    function reduce_(ps, qs) {
        if (qs.length === 0)
            return ps;
        else if (qs.length === 1)
            return ps.push(qs[0]);
        else {
            var q = qs.pop();
            var c = q.coefficient;
            var m = q.monomial;
            var otherTerms = [];
            for (var i = 0; i < qs.length; i++) {
                if (Monomial.is(m, qs[i].monomial))
                    c = Complex.add(c, qs[i].coefficient);
                else
                    otherTerms.push(qs[i]);
            }
            ps.push(new Term(c, m));
            return reduce_(ps, otherTerms);
        }
    }
    return reduce_([], terms);
};

/** @param {Array<Term>} terms
 *  @constructor */
function Polynomial(terms) {
    if (terms.length === 0)
        this.terms = [new Term(Complex.zero(), new Monomial({}))];
    else
        this.terms = Term.reduce(terms);
}

/** @param {Polynomial} p
 *  @param {Polynomial} q
 *  @return {Polynomial} */
Polynomial.add = function(p, q) {
    return new Polynomial(Term.reduce(p.terms.concat(q.terms)));
};

/** @param {Polynomial} p
 *  @param {Polynomial} q
 *  @return {Polynomial} */
Polynomial.mul = function(p, q) {
    var ps = p.terms,
        qs = q.terms;
    var terms = [];
    for (var i = 0; i < ps.length; i++)
        for (var j = 0; j < qs.length; j++)
            terms.push(Term.mul(ps[i], qs[j]));
    return new Polynomial(Term.reduce(terms));
};

/** j-th coefficient of a Polynomial in a given variable
 *  @param {string} v
 *  @param {number} j
 *  @return {Polynomial} */
Polynomial.prototype.coefficient = function(v, j) {
    var terms = this.terms;
    var ps = [];
    for (var i = 0; i < terms.length; i++) {
        var term = terms[i];
        if (term.monomial.value[v] === j) {
            var m = Monomial.clone(term.monomial);
            m.value[v] = 0; // FIXME should be undefined?
            ps.push(new Term(term.coefficient, m));
        }
    }
    return new Polynomial(ps);
};

/** list of coefficients of a given variable
 *  ordered from highest to lowest degree
 *  @param {string} v
 *  @return {Array<Polynomial>} */
Polynomial.prototype.coefficientList = function(v) {
    var n = this.degree(v);
    var cs = [];
    for (var i = n; i >= 0; i--)
        cs[n - i] = this.coefficient(v, i);
    return cs;
};

Polynomial.prototype.coefficientList_ = function() {
    var vars = this.variableList;
    var l = vars.length;
    if (l > 1)
        console.error("Polynomial is not univariate");
    var v = l > 0 ? vars[0] : "x";
    var cs = this.coefficientList(v);
    var cs_ = [];
    for (var i = 0; i < cs.length; i++)
        cs_[i] = cs[i].constant();
    return cs_;
};

/** constant term of Polynomial as number
 *  @return {Complex} */
Polynomial.prototype.constant = function() {
    var c = Complex.zero();
    var terms = this.terms;
    for (var i = 0; i < terms.length; i++) {
        var term = terms[i];
        var m = term.monomial.value;
        var constant = true;
        for (var key in m) {
            if (m[key] !== 0) {
                constant = false;
                break;
            }
        }
        if (constant)
            c = Complex.add(c, term.coefficient);
    }
    return c;
};

/** determine the degree of a Polynomial in a given variable
 *  @param {string} v
 *  @return {number} */
Polynomial.prototype.degree = function(v) {
    var n = 0;
    var terms = this.terms;
    for (var i = 0; i < terms.length; i++)
        n = Math.max(n, terms[i].monomial.value[v] || 0);
    return n;
};

/** @param {string} v
 *  @return {Polynomial} */
Polynomial.prototype.diff = function(v) {
    var terms = this.terms;
    var ps = [];
    for (var i = 0; i < terms.length; i++) {
        var m = terms[i].monomial;
        var e = m.value[v] || 0;
        if (e > 0) {
            m = Monomial.clone(m);
            m.value[v] = e - 1;
            ps.push(Complex.mul(terms[i].coefficient, Complex.real(e)), m);
        }
    }
    return new Polynomial(ps);
};

/** discriminant of a Polynomial w.r.t. a given variable
 *  @param {string} v
 *  @return {Polynomial} */
Polynomial.prototype.discriminant = function(v) {
    return Polynomial.resultant(v, this, this.diff(v));
};

/** @return {boolean} */
Polynomial.prototype.isBivariate = function() {
    return this.variableList.length === 2;
};

/** @return {boolean} */
Polynomial.prototype.isConstant = function() {
    return this.variableList.length === 0 && this.terms.length !== 0;
};

/** @return {boolean} */
Polynomial.prototype.isUnivariate = function() {
    return this.variableList.length === 1;
};

/** approximate one root of a given Polynomial up to given tolerance
 *  using at most a given number of Laguerre iterations
 *  Polynomial must be given as coefficient list
 *  @param {Array<Complex>} cs
 *  @param {Complex} x
 *  @param {number} maxiter
 *  @return {Complex} */
Polynomial.laguerre = function(cs, x, maxiter) {
    var n = cs.length - 1;
    var rand = [1.0, 0.3141, 0.5926, 0.5358, 0.9793, 0.2385, 0.6264, 0.3383, 0.2795, 0.0288];
    var a, p, q, s, g, g2, h, r, d1, d2;
    var tol = 1e-14;
    for (var iter = 1; iter <= maxiter; iter++) {
        s = Complex.real(0);
        q = Complex.real(0);
        p = cs[n];

        for (var i = n - 1; i >= 0; i--) {
            s = Complex.add(q, Complex.mul(s, x));
            q = Complex.add(p, Complex.mul(q, x));
            p = Complex.add(cs[i], Complex.mul(p, x));
        }

        if (p.abs() < tol)
            return x;

        g = Complex.div(q, p);
        g2 = Complex.mul(g, g);
        h = Complex.sub(g2, Complex.div(Complex.mul(Complex.real(2), s), p));
        r = Complex.sqrt(Complex.mul(Complex.real(n - 1), Complex.sub(Complex.mul(Complex.real(n), h), g2)));
        d1 = Complex.add(g, r);
        d2 = Complex.sub(g, r);
        if (d1.abs() < d2.abs())
            d1 = d2;
        if (tol < d1.abs())
            a = Complex.div(Complex.real(n), d1);
        else
            a = Complex.mul(Complex.real(x.abs() + 1), new Complex(Math.cos(iter), Math.sin(iter)));
        if (a.abs() < tol)
            return x;
        if (iter % 20 === 0)
            a = Complex.mul(a, Complex.real(rand[iter / 20]));
        x = Complex.sub(x, a);
    }
    return x;
};

/** leading coefficient of a Polynomial in a given variable
 *  @param {string} v
 *  @return {Polynomial} */
Polynomial.prototype.leading = function(v) {
    return this.coefficient(v, this.degree(v));
};

/** @param {string} v
 *  @param {Polynomial} p
 *  @param {Polynomial} q
 *  @return {Polynomial} */
Polynomial.resultant = function(v, p, q) {
    return Polynomial.sylvester(v, p, q).det();
};

/** @param {Array<Complex>} cs
 *  @return {Array<Complex>} */
Polynomial.roots = function(cs) {
    var roots = [];
    var cs_orig = cs;
    var n = cs.length - 1;
    for (var i = 0; i < n; i++) {
        roots[i] = Polynomial.laguerre(cs, Complex.zero(), 200);
        roots[i] = Polynomial.laguerre(cs_orig, roots[i], 1);
        var fx = [];
        fx[n - i] = cs[n - i];
        for (var j = n - i; j > 0; j--)
            fx[j - 1] = Complex.add(cs[j - 1], Complex.mul(fx[j], roots[i]));
        fx.shift();
        cs = fx;
    }
    return roots; // TODO sort?
};

/** @param {string} v
 *  @param {Polynomial} p
 *  @param {Polynomial} q
 *  @return {Matrix} */
Polynomial.sylvester = function(v, p, q) {
    var m = p.degree(v);
    var n = q.degree(v);
    var p_ = p.coefficientList(v);
    var q_ = q.coefficientList(v);
    var ms = [];

    function zeros(n) {
        var zs = [];
        for (var i = 0; i < n; i++)
            zs[i] = Polynomial.zero();
        return zs;
    }

    function shift(f, i) {
        return zeros(i).concat(f).concat(zeros(m + n - f.length - i));
    }
    for (var i = 0; i < n; i++)
        ms.push(shift(p_, i));
    for (var j = 0; j < m; j++)
        ms.push(shift(q_, j));
    return new Matrix(ms);
};

/** @return {Array<string>} */
Polynomial.prototype.variableList = function() {
    var terms = this.terms;
    var vars = [];
    var hasVar = {};
    for (var i = 0; i < terms.length; i++) {
        var m = terms[i].monomial.value;
        for (var key in m) {
            if (!hasVar[key]) {
                vars.push(key);
                hasVar[key] = true;
            }
        }
    }
    return vars.sort();
};

/** @return {Polynomial} */
Polynomial.zero = function() {
    return new Polynomial([]);
};
