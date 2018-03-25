const expect = require('chai').expect;
const ArgumentError = require('../src/js/ArgumentError.js');
const Complex = require('../src/js/Complex.js');
const Monomial = require('../src/js/Monomial.js');
const Polynomial = require('../src/js/Polynomial.js');
const Term = require('../src/js/Term.js');

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
});
