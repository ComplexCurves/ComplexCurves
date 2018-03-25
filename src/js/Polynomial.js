const ArgumentError = require('./ArgumentError.js');
const Complex = require('./Complex.js');
const Matrix = require('./Matrix.js');
const Monomial = require('./Monomial.js');
const Term = require('./Term.js');

module.exports = class Polynomial {
    /**
     * @param {Array<Term>} terms
     */
    constructor(terms) {
        if (terms.length === 0)
            this.terms = [new Term(Complex.zero(), new Monomial({}))];
        else
            this.terms = Term.reduce(terms);
    }

    /**
     * @param {Polynomial} p
     * @param {Polynomial} q
     * @return {Polynomial}
     */
    static add(p, q) {
        return new Polynomial(Term.reduce(p.terms.concat(q.terms)));
    }

    /**
     * @param {Polynomial} p
     * @return {Polynomial}
     */
    add(p) {
        return Polynomial.add(this, p);
    }

    /**
     * @param {Complex} z
     * @return {Polynomial}
     */
    static complex(z) {
        return new Polynomial([new Term(z, new Monomial({}))]);
    }

    /**
     * j-th coefficient of a Polynomial in a given variable
     * @param {string} v
     * @param {number} j
     * @return {Polynomial}
     */
    coefficient(v, j) {
        const terms = this.terms;
        const ps = [];
        const l = terms.length;
        for (let i = 0; i < l; i++) {
            const term = terms[i];
            if ((term.monomial.value[v] || 0) === j) {
                const m = Monomial.clone(term.monomial);
                delete m.value[v];
                ps.push(new Term(term.coefficient, m));
            }
        }
        return new Polynomial(ps);
    }

    /**
     * list of coefficients of a given variable
     * ordered from highest to lowest degree
     * @param {string} v
     * @return {Array<Polynomial>}
     */
    coefficientList(v) {
        const n = this.degree(v);
        const cs = [];
        for (let i = 0; i <= n; i++)
            cs[i] = this.coefficient(v, n - i);
        return cs;
    }

    /**
     * list of coefficients of a univariate polynomial
     * ordered from highest to lowest degree
     * @return {Array<Complex>}
     */
    coefficientList_() {
        const vars = this.variableList();
        const l = vars.length;
        if (l > 1)
            throw new ArgumentError("Polynomial is not univariate");
        const v = l > 0 ? vars[0] : "x";
        const cs = this.coefficientList(v);
        const cs_ = [];
        const k = cs.length;
        for (let i = 0; i < k; i++)
            cs_[i] = cs[i].constant();
        return cs_;
    }

    /**
     * constant term of Polynomial as number
     * @return {Complex}
     */
    constant() {
        let c = Complex.zero();
        const terms = this.terms;
        const l = terms.length;
        for (let i = 0; i < l; i++) {
            const term = terms[i];
            const m = term.monomial.value;
            if (m === null || Object.keys(m).length === 0)
                c = Complex.add(c, term.coefficient);
        }
        return c;
    }

    /**
     * deflate a Polynomial coefficient list by a monomial x - x0
     * using Horner's method
     * @param {Array<Complex>} cs
     * @param {Complex} x0
     * @return {Array<Complex>}
     */
    static deflate(cs, x0) {
        const fx = [cs[0]];
        const l = cs.length - 1;
        for (let i = 1; i < l; i++)
            fx[i] = Complex.add(cs[i], Complex.mul(fx[i - 1], x0));
        return fx;
    }

    /**
     * determine the degree of a Polynomial in a given variable
     * @param {string} v
     * @return {number}
     */
    degree(v) {
        let n = 0;
        const terms = this.terms;
        const l = terms.length;
        for (let i = 0; i < l; i++)
            n = Math.max(n, terms[i].monomial.value[v] || 0);
        return n;
    }

    /**
     * @param {string} v
     * @return {Polynomial}
     */
    diff(v) {
        const terms = this.terms;
        const ps = [];
        const l = terms.length;
        for (let i = 0; i < l; i++) {
            let m = terms[i].monomial;
            const e = m.value[v] || 0;
            if (e > 0) {
                const c = Complex.mul(terms[i].coefficient, Complex.real(e));
                m = Monomial.clone(m);
                m.value[v] = e - 1;
                ps.push(new Term(c, m));
            }
        }
        return new Polynomial(ps);
    }

    /**
     * discriminant of a Polynomial w.r.t. a given variable
     * @param {string} v
     * @return {Polynomial}
     */
    discriminant(v) {
        return Polynomial.resultant(v, this, this.diff(v));
    }

    /** @return {boolean} */
    isBivariate() {
        return this.variableList().length === 2;
    }

    /** @return {boolean} */
    isConstant() {
        return this.variableList().length === 0 && this.terms.length !== 0;
    }

    /** @return {boolean} */
    isUnivariate() {
        return this.variableList().length === 1;
    }

    /**
     * approximate one root of a given Polynomial up to given tolerance
     * using at most a given number of Laguerre iterations
     * Polynomial must be given as coefficient list
     * @param {Array<Complex>} cs
     * @param {Complex} x
     * @param {number} maxiter
     * @return {Complex}
     */
    static laguerre(cs, x, maxiter) {
        const n = cs.length - 1;
        const rand = [1.0, 0.3141, 0.5926, 0.5358, 0.9793, 0.2385, 0.6264, 0.3383,
            0.2795, 0.0288
        ];
        let a, p, q, s, g, g2, h, r, d1, d2;
        const tol = 1e-14;
        for (let iter = 1; iter <= maxiter; iter++) {
            s = Complex.zero();
            q = Complex.zero();
            p = cs[0];

            for (let i = 1; i <= n; i++) {
                s = Complex.add(q, Complex.mul(s, x));
                q = Complex.add(p, Complex.mul(q, x));
                p = Complex.add(cs[i], Complex.mul(p, x));
            }

            if (p.abs() < tol)
                return x;

            g = Complex.div(q, p);
            g2 = Complex.mul(g, g);
            h = Complex.sub(g2, Complex.div(Complex.mul(Complex.real(2), s), p));
            r = Complex.sqrt(Complex.mul(Complex.real(n - 1), Complex.sub(
                Complex.mul(Complex.real(n), h), g2)));
            d1 = Complex.add(g, r);
            d2 = Complex.sub(g, r);
            if (d1.abs() < d2.abs())
                d1 = d2;
            if (tol < d1.abs())
                a = Complex.div(Complex.real(n), d1);
            else
                a = Complex.mul(Complex.real(x.abs() + 1), new Complex(Math.cos(
                    iter), Math.sin(iter)));
            if (a.abs() < tol)
                return x;
            if (iter % 20 === 0 && iter < maxiter - 19)
                a = Complex.mul(a, Complex.real(rand[Math.floor(iter / 20)]));
            x = Complex.sub(x, a);
        }
        return x;
    }

    /**
     * leading coefficient of a Polynomial in a given variable
     * @param {string} v
     * @return {Polynomial}
     */
    leading(v) {
        return this.coefficient(v, this.degree(v));
    }

    /**
     * @param {Polynomial} p
     * @param {Polynomial} q
     * @return {Polynomial}
     */
    static mul(p, q) {
        const ps = p.terms,
            qs = q.terms;
        const terms = [];
        const l = ps.length;
        for (let i = 0; i < l; i++) {
            const k = qs.length;
            for (let j = 0; j < k; j++)
                terms.push(Term.mul(ps[i], qs[j]));
        }
        return new Polynomial(Term.reduce(terms));
    }

    /**
     * @param {Polynomial} p
     * @return {Polynomial}
     */
    mul(p) {
        return Polynomial.mul(this, p);
    }

    /** @return {Polynomial} */
    neg() {
        const terms = this.terms;
        const ts = [];
        const l = terms.length;
        for (let i = 0; i < l; i++)
            ts.push(Term.neg(terms[i]));
        return new Polynomial(ts);
    }

    /**
     * @param {Polynomial} p
     * @param {number} e
     * @return {Polynomial}
     */
    static pow(p, e) {
        let res = Polynomial.real(1);
        if (!Number.isInteger(e))
            throw new ArgumentError("Non-integer power of Polynomial!");
        // TODO use fast exponentiation
        for (let i = e; i > 0; i--)
            res = Polynomial.mul(res, p);
        return res;
    }

    /**
     * @param {number} e
     * @return {Polynomial}
     */
    pow(e) {
        return Polynomial.pow(this, e);
    }

    /**
     * @param {Array<Complex>} cs
     * @return {Array<Complex>}
     */
    static quadratic_roots(cs) {
        const a = cs[0],
            b = cs[1],
            c = cs[2];
        if (c.re === 0 && c.im === 0)
            return [Complex.zero(), Complex.div(b, a).neg()];
        let r = Complex.sqrt(Complex.sub(Complex.mul(b, b),
            Complex.mul(Complex.real(4), Complex.mul(a, c))));
        if (b.re >= 0)
            r = r.neg();
        return [Complex.div(Complex.sub(r, b), Complex.mul(Complex.real(2), a)),
            Complex.div(Complex.mul(Complex.real(2), c), Complex.sub(r, b))
        ];
    }

    /**
     * @param {number} x
     * @return {Polynomial}
     */
    static real(x) {
        return new Polynomial([new Term(Complex.real(x), new Monomial({}))]);
    }

    /**
     * @param {string} v
     * @param {Polynomial} p
     * @param {Polynomial} q
     * @return {Polynomial}
     */
    static resultant(v, p, q) {
        const syl = /** @type {Matrix<Polynomial>} */ (Polynomial.sylvester(v, p, q));
        return syl.det();
    }

    /**
     * @param {Array<Complex>} cs
     * @return {Array<Complex>}
     */
    static roots(cs) {
        let roots = [];
        const cs_orig = cs;
        const n = cs.length - 1;
        if (n <= 0)
            return [];
        if (Complex.isZero(cs[0])) {
            roots = Polynomial.roots(cs.slice(1));
            roots.push(Complex.infinity());
            return roots;
        }
        if (n === 1)
            roots[0] = Complex.div(cs[1], cs[0]).neg();
        else if (n === 2)
            roots = Polynomial.quadratic_roots(cs);
        else {
            for (let i = 0; i < n - 2; i++) {
                roots[i] = Polynomial.laguerre(cs, Complex.zero(), 200);
                roots[i] = Polynomial.laguerre(cs_orig, roots[i], 1);
                cs = Polynomial.deflate(cs, roots[i]);
            }
            const qroots = Polynomial.quadratic_roots(cs);
            roots[n - 2] = qroots[0];
            roots[n - 1] = qroots[1];
        }
        return roots; // TODO sort?
    }

    /**
     * @return {number}
     */
    sheets() {
        if (this.isConstant() || this.isUnivariate())
            throw new ArgumentError('Polynomial is not multivariate');
        const vars = this.variableList();
        const vy = vars.length === 0 ? "y" : vars[vars.length - 1];
        return this.degree(vy);
    }

    /**
     * @param {Polynomial} p
     * @param {Polynomial} q
     * @return {Polynomial}
     */
    static sub(p, q) {
        return Polynomial.add(p, q.neg());
    }

    /**
     * @param {Polynomial} p
     * @return {Polynomial}
     */
    sub(p) {
        return Polynomial.sub(this, p);
    }

    /**
     * @param {string} v
     * @param {Polynomial} p
     * @param {Polynomial} q
     * @return {Matrix}
     */
    static sylvester(v, p, q) {
        const m = p.degree(v);
        const n = q.degree(v);
        const p_ = p.coefficientList(v);
        const q_ = q.coefficientList(v);
        const ms = [];

        /**
         * @param {number} n
         * @return {Array<Polynomial>}
         */
        function zeros(n) {
            const zs = [];
            for (let i = 0; i < n; i++)
                zs[i] = Polynomial.zero();
            return zs;
        }

        /**
         * @param {Array<Polynomial>} f
         * @param {number} i
         * @return {Array<Polynomial>}
         */
        function shift(f, i) {
            return zeros(i).concat(f).concat(zeros(m + n - f.length - i));
        }

        for (let i = 0; i < n; i++)
            ms.push(shift(p_, i));
        for (let j = 0; j < m; j++)
            ms.push(shift(q_, j));
        return new Matrix(ms);
    }

    /**
     * @param {string} v
     * @return {Polynomial}
     */
    static variable(v) {
        const m = {};
        m[v] = 1;
        return new Polynomial([new Term(Complex.one(), new Monomial(m))]);
    }

    /** @return {Array<string>} */
    variableList() {
        const terms = this.terms;
        const vars = [];
        const hasVar = {};
        const l = terms.length;
        for (let i = 0; i < l; i++) {
            const m = terms[i].monomial.value;
            for (let key in m) {
                if (m.hasOwnProperty(key) && !hasVar[key]) {
                    vars.push(key);
                    hasVar[key] = true;
                }
            }
        }
        vars.sort();
        return vars;
    }

    /** @return {Polynomial} */
    static zero() {
        return new Polynomial([]);
    }

    /** @return {Polynomial} */
    zero() {
        return Polynomial.zero();
    }
};
