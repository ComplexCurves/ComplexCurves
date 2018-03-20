const expect = require('chai').expect;
const ArgumentError = require('../src/js/ArgumentError.js');
const Complex = require('../src/js/Complex.js');
const Matrix = require('../src/js/Matrix.js');
const Monomial = require('../src/js/Monomial.js');
const Term = require('../src/js/Term.js');
const Polynomial = require('../src/js/Polynomial.js');

describe('Matrix', function() {
    describe('det', function() {
        it('computes the determinant of a 2x2 matrix', function() {
            let m = new Matrix([
                [Complex.real(1), Complex.real(2)],
                [Complex.real(3), Complex.real(4)]
            ]);
            let det = m.det();
            expect(det).to.deep.equal(new Complex(1 * 4 - 2 * 3, -0));
        });
        it('computes the determinant of a 3x3 identity matrix', function() {
            let m = new Matrix([
                [Complex.real(1), Complex.real(0), Complex.real(0)],
                [Complex.real(0), Complex.real(1), Complex.real(0)],
                [Complex.real(0), Complex.real(0), Complex.real(1)]
            ]);
            let det = m.det();
            expect(det).to.deep.equal(Complex.real(1));
        });

        it('computes the determinant of a 3x3 integer diagonal matrix', function() {
            let m = new Matrix([
                [Complex.real(2), Complex.real(0), Complex.real(0)],
                [Complex.real(0), Complex.real(3), Complex.real(0)],
                [Complex.real(0), Complex.real(0), Complex.real(4)]
            ]);
            let det = m.det();
            expect(det).to.deep.equal(Complex.real(2 * 3 * 4));
        });

        it('computes the determinant of a 3x3 integer matrix', function() {
            let m = new Matrix([
                [Complex.real(1), Complex.real(2), Complex.real(4)],
                [Complex.real(3), Complex.real(5), Complex.real(6)],
                [Complex.real(7), Complex.real(8), Complex.real(9)]
            ]);
            let det = m.det();
            expect(det).to.deep.equal(Complex.real(1 * (5 * 9 - 6 * 8) - 3 * (2 * 9 - 4 * 8) + 7 * (2 * 6 - 4 * 5)));
        });

        it('computes the determinant of a 3x3 integer Polynomial matrix', function() {
            function polyX(n) {
                return new Polynomial([new Term(Complex.real(n), new Monomial({
                    'x': 1
                }))]);
            }

            function polyX3(n) {
                return new Polynomial([new Term(Complex.real(n), new Monomial({
                    'x': 3
                }))]);
            }
            let m = new Matrix([
                [polyX(1), polyX(2), polyX(4)],
                [polyX(3), polyX(5), polyX(6)],
                [polyX(7), polyX(8), polyX(9)]
            ]);
            let det = m.det();
            expect(det.coefficientList_()).to.deep.equal(polyX3(-17).coefficientList_());
        });
        it('throws an ArgumentError if Matrix is empty', function() {
            let m = new Matrix([
                []
            ]);
            expect(function() {
                m.det();
            }).to.throw(ArgumentError, 'empty');
        });
        it('throws an ArgumentError if Matrix is non-square', function() {
            let m = new Matrix([
                [Complex.real(1), Complex.real(2), Complex.real(3)],
                [Complex.real(4), Complex.real(5), Complex.real(6)]
            ]);
            expect(function() {
                m.det();
            }).to.throw(ArgumentError, 'square');
        });
    });
    describe('mul', function() {
        it('computes the product of two matrices', function() {
            let m1 = new Matrix([
                [Complex.real(1), Complex.real(2), Complex.real(3)],
                [Complex.real(4), Complex.real(5), Complex.real(6)]
            ]);
            let m2 = new Matrix([
                [Complex.real(7), Complex.real(8)],
                [Complex.real(9), Complex.real(10)],
                [Complex.real(11), Complex.real(12)]
            ]);
            let product = new Matrix([
                [Complex.real(1 * 7 + 2 * 9 + 3 * 11), Complex.real(1 * 8 + 2 * 10 + 3 * 12)],
                [Complex.real(4 * 7 + 5 * 9 + 6 * 11), Complex.real(4 * 8 + 5 * 10 + 6 * 12)]
            ]);
            expect(Matrix.mul(m1, m2)).to.deep.equal(product);
        });
        it('throws an ArgumentError if Matrix dimensions do not match', function() {
            let m = new Matrix([
                [Complex.real(1), Complex.real(2), Complex.real(3)],
                [Complex.real(4), Complex.real(5), Complex.real(6)]
            ]);
            expect(function() {
                Matrix.mul(m, m);
            }).to.throw(ArgumentError, 'dimensions');
        });
    });
});
