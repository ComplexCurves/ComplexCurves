/** @param {Object<string,number>} monomial
 *  @constructor */
function Monomial(monomial) {
    this.value = monomial;
}

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

/** @param {Array<Term>} terms
 *  @constructor */
function Polynomial(terms) {
    this.terms = terms;
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

Polynomial.prototype.coefficientList = function() {};

Polynomial.prototype.coefficientList_ = function() {};

Polynomial.prototype.constant = function() {};

Polynomial.prototype.degree = function() {};

Polynomial.prototype.diff = function() {};

Polynomial.prototype.discriminant = function() {};

Polynomial.prototype.isBivariate = function() {};

Polynomial.prototype.isConstant = function() {};

Polynomial.prototype.isUnivariate = function() {};

Polynomial.prototype.leading = function() {};

Polynomial.prototype.roots = function() {};

Polynomial.prototype.variableList = function() {};
