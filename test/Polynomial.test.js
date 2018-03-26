const expect = require('chai').expect;
const ArgumentError = require('../src/js/ArgumentError.js');
const Complex = require('../src/js/Complex.js');
const Monomial = require('../src/js/Monomial.js');
const Polynomial = require('../src/js/Polynomial.js');
const Term = require('../src/js/Term.js');

const cissoidOfDiocles = new Polynomial([new Term(Complex.real(1), new Monomial({
    'x': 1,
    'y': 2
})), new Term(Complex.real(2), new Monomial({
    'x': 3
})), new Term(Complex.real(-3), new Monomial({
    'x': 2
})), new Term(Complex.real(3), new Monomial({
    'x': 1
})), new Term(Complex.real(-1), new Monomial({}))]);

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
    describe('isBivariate', function() {
        it('determines if a Polynomial is bivariate', function() {
            expect(new Polynomial([]).isBivariate()).to.equal(false);
            expect(Polynomial.real(1).isBivariate()).to.equal(false);
            expect(Polynomial.variable('x').isBivariate()).to.equal(false);
            expect(new Polynomial([new Term(Complex.real(1), new Monomial({
                'x': 1,
                'y': 1
            }))]).isBivariate()).to.equal(true);
            expect(new Polynomial([new Term(Complex.real(1), new Monomial({
                'x': 1,
                'y': 1,
                'z': 1
            }))]).isBivariate()).to.equal(false);
        });
    });
    describe('discriminant', function() {
        it('computes the discriminant of a Polynomial', function() {
            let p = new Polynomial([new Term(Complex.real(1), new Monomial({
                    'y': 5
                })),
                new Term(Complex.real(-1), new Monomial({
                    'y': 1
                })), new Term(Complex.real(1), new Monomial({
                    'x': 1
                }))
            ]);
            expect(p.discriminant('y').coefficientList_()).to.deep.equal([3125, 0, 0, 0, -256].map(Complex.real));
        });
        it('computes the discriminant of x*(x^2+y^2)-(1-x)^3', function() {
            let p = cissoidOfDiocles;
            expect(p.discriminant('y').coefficientList_()).to.deep.equal([8, -12, 12, -4, 0, 0].map(Complex.real));
            // the discriminant as we compute it has the origin as a zero of order 2
            // others reduce the discriminant such that there are no multiple zeros
        });

    });
    describe('leading', function() {
        it('determines the leading coefficient of a Polynomial in a given variable', function() {
            expect(cissoidOfDiocles.leading('x')).to.deep.equal(Polynomial.real(2));
            expect(cissoidOfDiocles.leading('y')).to.deep.equal(Polynomial.variable('x'));
        });
    });
    describe('pow', function() {
        it('computes an integer power of a Polynomial', function() {
            const p = new Polynomial([new Term(Complex.real(1), new Monomial({
                'x': 1
            })), new Term(Complex.real(2), new Monomial({}))]);
            expect(Polynomial.pow(p, 2)).to.deep.equal(Polynomial.mul(p, p));
            const q = new Polynomial([new Term(Complex.real(1), new Monomial({
                'x': 1
            })), new Term(Complex.real(-2), new Monomial({}))]);
            expect(Polynomial.pow(q, 2)).to.deep.equal(Polynomial.mul(q, q));
        });
        it('throws an ArgumentError if the exponent is not an integer', function() {
            expect(function() {
                Polynomial.variable('x').pow(0.5);
            }).to.throw(ArgumentError, 'integer');
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
            expect(Polynomial.roots([Complex.real(1), Complex.real(-2), Complex.zero()])).to.deep.equal([Complex.zero(), new Complex(2, -0)]);
            expect(Polynomial.roots([Complex.real(-1), Complex.real(3), Complex.real(-2)])).to.deep.equal([Complex.real(2), new Complex(1, -0)]);
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
    describe('sub', function() {
        it('computes the difference of two Polynomials', function() {
            let p = new Polynomial([new Term(Complex.real(1), new Monomial({
                'x': 2
            })), new Term(Complex.real(3), new Monomial({
                'x': 4
            }))]);
            let q = new Polynomial([new Term(Complex.real(5), new Monomial({
                'y': 6
            })), new Term(Complex.real(7), new Monomial({
                'y': 8
            }))]);
            let difference = new Polynomial([new Term(new Complex(-7, -0), new Monomial({
                'y': 8
            })), new Term(new Complex(-5, -0), new Monomial({
                'y': 6
            })), new Term(Complex.real(1), new Monomial({
                'x': 2
            })), new Term(Complex.real(3), new Monomial({
                'x': 4
            }))]);
            expect(p.sub(q)).to.deep.equal(difference);
        });
    });
});
