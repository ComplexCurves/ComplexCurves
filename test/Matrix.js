const assert = require('chai').assert;
const Complex = require('../src/js/Complex.js');
const Matrix = require('../src/js/Matrix.js');
const Monomial = require('../src/js/Monomial.js');
const Term = require('../src/js/Term.js');
const Polynomial = require('../src/js/Polynomial.js');

describe('Matrix', function() {
    describe('det', function() {
        it('computes the determinant of a 3x3 identity matrix', function() {
            let m = new Matrix([
                [Complex.real(1), Complex.real(0), Complex.real(0)],
                [Complex.real(0), Complex.real(1), Complex.real(0)],
                [Complex.real(0), Complex.real(0), Complex.real(1)]
            ]);
            let det = m.det();
            assert.deepEqual(det, Complex.real(1));
        });

        it('computes the determinant of a 3x3 integer diagonal matrix', function() {
            let m = new Matrix([
                [Complex.real(2), Complex.real(0), Complex.real(0)],
                [Complex.real(0), Complex.real(3), Complex.real(0)],
                [Complex.real(0), Complex.real(0), Complex.real(4)]
            ]);
            let det = m.det();
            assert.deepEqual(det, Complex.real(24));
        });

        it('computes the determinant of a 3x3 integer matrix', function() {
            let m = new Matrix([
                [Complex.real(1), Complex.real(2), Complex.real(4)],
                [Complex.real(3), Complex.real(5), Complex.real(6)],
                [Complex.real(7), Complex.real(8), Complex.real(9)]
            ]);
            let det = m.det();
            assert.deepEqual(det, Complex.real(-17));
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
            assert.deepEqual(det.coefficientList_(), polyX3(-17).coefficientList_());
        });
    });
});
