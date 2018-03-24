const expect = require('chai').expect;
const ArgumentError = require('../src/js/ArgumentError.js');
const Complex = require('../src/js/Complex.js');
const Monomial = require('../src/js/Monomial.js');
const Term = require('../src/js/Term.js');

describe('Complex', function() {
    describe('abs', function() {
        it('computes the modulus of a Complex number', function() {
            expect(Complex.zero().abs()).to.equal(0);
            expect(new Complex(3, 4).abs()).to.equal(5);
        });
    });
    describe('div', function() {
        it('computes the quotient of two Complex numbers', function() {
            expect(Complex.div(new Complex(1, 2), new Complex(3, 4))).to.deep.equal(new Complex(0.44, 0.08));
        });
    });
    describe('infinity', function() {
        it('returns a Complex number infinity', function() {
            expect(Complex.infinity()).to.deep.equal(new Complex(Infinity, Infinity));
        });
    });
    describe('inv', function() {
        it('computes the inverse of a Complex number', function() {
            expect(Complex.inv(Complex.real(1))).to.deep.equal(new Complex(1, -0));
            expect(Complex.inv(new Complex(0, 1))).to.deep.equal(new Complex(0, -1));
        });
    });
    describe('isZero', function() {
        it('tests if a Complex number equals zero', function() {
            expect(Complex.isZero(Complex.zero())).to.equal(true);
            expect(Complex.isZero(new Complex(0, 0))).to.equal(true);
            expect(Complex.isZero(new Complex(-0, 0))).to.equal(true);
            expect(Complex.isZero(new Complex(0, -0))).to.equal(true);
            expect(Complex.isZero(new Complex(-0, -0))).to.equal(true);
            expect(Complex.isZero(new Complex(1, 0))).to.equal(false);
            expect(Complex.isZero(new Complex(0, 1))).to.equal(false);
        });
    });
    describe('one', function() {
        it('returns a Complex number one', function() {
            expect(Complex.one()).to.deep.equal(new Complex(1, 0));
        });
    });
    describe('sqrt', function() {
        it('computes the square root of a Complex number', function() {
            expect(Complex.sqrt(Complex.real(1))).to.deep.equal(Complex.real(1));
            expect(Complex.sqrt(Complex.real(2))).to.deep.equal(Complex.real(Math.sqrt(2)));
            expect(Complex.sqrt(new Complex(3, 4))).to.deep.equal(new Complex(2, 1));
            expect(Complex.sqrt(Complex.zero())).to.deep.equal(Complex.zero());
        });
    });
    describe('sub', function() {
        it('computes the difference of two Complex numbers', function() {
            expect(Complex.sub(new Complex(1, 2), new Complex(3, 5))).to.deep.equal(new Complex(-2, -3));
        });
    });
});
