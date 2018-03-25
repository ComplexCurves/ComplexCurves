const expect = require('chai').expect;
const ArgumentError = require('../src/js/ArgumentError.js');
const Complex = require('../src/js/Complex.js');
const Monomial = require('../src/js/Monomial.js');
const Polynomial = require('../src/js/Polynomial.js');
const Term = require('../src/js/Term.js');

function roundToPrecision(x, precision) {
    return precision * Math.round(x / precision);
}

function roundComplex(z) {
    return new Complex(roundToPrecision(z.re, 1e-10), roundToPrecision(z.im, 1e-10));
}

describe('Polynomial', function() {
    describe('coefficientList_', function() {
        it('lists the coefficients of a univariate Polynomial ordered from highest to lowest degree', function() {
            const p = new Polynomial([new Term(Complex.real(1), new Monomial({})), new Term(Complex.real(2), new Monomial({
                'x': 1
            })), new Term(Complex.real(3), new Monomial({
                'x': 2
            }))]);
            const cs = p.coefficientList_();
            expect(cs).to.deep.equal([Complex.real(3), Complex.real(2), Complex.real(1)]);
        });
        it('throws an ArgumentError if the Polynomial is not univariate', function() {
            const p = new Polynomial([new Term(Complex.real(1), new Monomial({
                'x': 2
            })), new Term(Complex.real(3), new Monomial({
                'y': 4
            }))]);
            expect(function() {
                p.coefficientList_();
            }).to.throw(ArgumentError, 'univariate');
        });
    });
    describe('complex', function() {
        it('turns a Complex number into a Polynomial', function() {
            const z = new Complex(1, 2);
            const p = Polynomial.complex(z);
            const cs = p.coefficientList_();
            expect(cs).to.deep.equal([z]);
        });
    });
    describe('diff', function() {
        it('computes the derivative of a univariate Polynomial', function() {
            const p = new Polynomial([new Term(Complex.real(1), new Monomial({})), new Term(Complex.real(2), new Monomial({
                'x': 1
            })), new Term(Complex.real(3), new Monomial({
                'x': 2
            }))]);
            const cs = p.diff('x').coefficientList_();
            expect(cs).to.deep.equal([Complex.real(6), Complex.real(2)]);
        });
        it('computes a partial derivative of a multivariate Polynomial', function() {
            const p = new Polynomial([new Term(Complex.real(1), new Monomial({})), new Term(Complex.real(2), new Monomial({
                'x': 1
            })), new Term(Complex.real(3), new Monomial({
                'x': 2
            })), new Term(Complex.real(1 / 3), new Monomial({
                'x': 3,
                'y': 1
            }))]);
            const cs = p.diff('x').coefficientList('x');
            expect(cs).to.deep.equal([Polynomial.variable('y'), Polynomial.real(6), Polynomial.real(2)]);
        });
    });
    describe('roots', function() {
        it('returns an empty list for a constant Polynomial', function() {
            expect(Polynomial.roots([])).to.deep.equal([]);
            expect(Polynomial.roots([0])).to.deep.equal([]);
            expect(Polynomial.roots([1])).to.deep.equal([]);
        });
        it('computes the root of a linear Polynomial', function() {
            expect(Polynomial.roots([Complex.real(2), Complex.real(-1)])).to.deep.equal([new Complex(0.5, -0)]);
        });
        it('computes the roots of a quadratic Polynomial', function() {
            expect(Polynomial.roots([Complex.real(1), Complex.real(-3), Complex.real(2)])).to.deep.equal([Complex.real(2), Complex.real(1)]);
        });
        it('approximates the roots of 2 x^3 - 3 x^2 + 3 x - 1', function() {
            const cs = [Complex.real(2), Complex.real(-3), Complex.real(3), Complex.real(-1)];
            const roots = Polynomial.roots(cs);
            const rootsRounded = roots.map(roundComplex);
            expect(rootsRounded).to.deep.contain(new Complex(0.5, 0.8660254038));
            expect(rootsRounded).to.deep.contain(new Complex(0.5, -0.8660254038));
            expect(rootsRounded).to.deep.contain(new Complex(0.5, 0));
        });
        it('approximates the roots of p(x) and p(x) * x consistently', function() {
            const cs1 = [Complex.real(8), Complex.real(-12), Complex.real(12), Complex.real(-4)];
            const cs2 = [Complex.real(8), Complex.real(-12), Complex.real(12), Complex.real(-4), Complex.zero()];
            expect(Polynomial.roots(cs2)).to.deep.equal([Complex.zero()].concat(Polynomial.roots(cs1)));
        });
        it('approximates the roots of p(x) and p(x) / x consistently', function() {
            const cs1 = [Complex.real(8), Complex.real(-12), Complex.real(12), Complex.real(-4)];
            const cs2 = [Complex.zero(), Complex.real(8), Complex.real(-12), Complex.real(12), Complex.real(-4)];
            expect(Polynomial.roots(cs2)).to.deep.equal(Polynomial.roots(cs1).concat([Complex.infinity()]));
        });
    });
    describe('sheets', function() {
        it('determines the number of sheets of the corresponding Riemann surface', function() {
            expect(new Polynomial([new Term(Complex.real(1), new Monomial({
                'x': 2
            })), new Term(Complex.real(2), new Monomial({
                'y': 3
            }))]).sheets()).to.equal(3);
            expect(new Polynomial([new Term(Complex.real(1), new Monomial({
                'x': 2
            })), new Term(Complex.real(2), new Monomial({
                'y': 3,
                'x': 4
            }))]).sheets()).to.equal(3);
        });
        it('throws an ArgumentError if the polynomial is not multivariate', function() {
            expect(function() {
                new Polynomial([new Term(Complex.real(1), new Monomial({}))]).sheets();
            }).to.throw(ArgumentError, 'multivariate');
            expect(function() {
                new Polynomial([new Term(Complex.real(1), new Monomial({
                    'x': 2
                }))]).sheets();
            }).to.throw(ArgumentError, 'multivariate');
        });
    });
});
