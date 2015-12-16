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
Polynomial.prototype.roots = function(cs) {
    return []; // TODO
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
