const Complex = require('./Complex.js');
const Monomial = require('./Monomial.js');

module.exports = class Term {
    /**
     * @param {Complex} coefficient
     * @param {Monomial} monomial
     */
    constructor(coefficient, monomial) {
        this.coefficient = coefficient;
        this.monomial = monomial;
    }

    /**
     * @param {Term} a
     * @param {Term} b
     * @return {Term}
     */
    static add(a, b) {
        if (!Monomial.is(a.monomial, b.monomial))
            console.error('Monomials do not match');
        return new Term(Complex.add(a.coefficient, b.coefficient), a.monomial);
    }


    /**
     * @param {Term} a
     * @param {Term} b
     * @return {Term}
     */
    static mul(a, b) {
        const monomial = {};
        const oa = a.monomial.value,
            ob = b.monomial.value;
        let key;
        for (key in oa) {
            if (oa.hasOwnProperty(key))
                monomial[key] = oa[key] + (ob[key] || 0);
        }
        for (key in ob) {
            if (ob.hasOwnProperty(key))
                monomial[key] = ob[key] + (oa[key] || 0);
        }
        return new Term(Complex.mul(a.coefficient, b.coefficient),
            new Monomial(monomial));
    }

    /**
     * @param {Term} a
     * @return {Term}
     */
    static neg(a) {
        return new Term(a.coefficient.neg(), a.monomial);
    }

    /**
     * @param {Array<Term>} terms
     * @return {Array<Term>}
     */
    static reduce(terms) {
        /**
         * @param {Array<Term>} ps
         * @param {Array<Term>} qs
         * @return {Array<Term>}
         */
        function _reduce(ps, qs) {
            if (qs.length === 0)
                return ps;
            else if (qs.length === 1) {
                ps.push(qs[0]);
                return ps;
            } else {
                const q = qs.pop();
                let c = q.coefficient;
                const m = q.monomial;
                const otherTerms = [];
                const l = qs.length;
                for (let i = 0; i < l; i++) {
                    if (Monomial.is(m, qs[i].monomial))
                        c = Complex.add(c, qs[i].coefficient);
                    else
                        otherTerms.push(qs[i]);
                }
                ps.push(new Term(c, m));
                return _reduce(ps, otherTerms);
            }
        }

        return _reduce([], terms);
    }
};
