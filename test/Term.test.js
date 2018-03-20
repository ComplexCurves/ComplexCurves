const expect = require('chai').expect;
const ArgumentError = require('../src/js/ArgumentError.js');
const Complex = require('../src/js/Complex.js');
const Monomial = require('../src/js/Monomial.js');
const Term = require('../src/js/Term.js');

describe('Term', function() {
    describe('add', function() {
        it('computes the sum of two Terms', function() {
            let term1 = new Term(Complex.real(1), new Monomial({
                'x': 1
            }));
            let term2 = new Term(Complex.real(2), new Monomial({
                'x': 1
            }));
            let term3 = new Term(Complex.real(3), new Monomial({
                'x': 1
            }));
            expect(Term.add(term1, term2)).to.deep.equal(term3);
        });
        it('throws an ArgumentError when the Monomials of the summands do not match', function() {
            let term1 = new Term(Complex.real(1), new Monomial({
                'x': 1
            }));
            let term2 = new Term(Complex.real(2), new Monomial({
                'x': 2
            }));
            expect(function() {
                Term.add(term1, term2);
            }).to.throw(ArgumentError, "Monomials");
        });
    });
    describe('reduce', function() {
        it('cannot reduce an empty Array of Terms', function() {
            expect(Term.reduce([])).to.deep.equal([]);
        });
        it('reduces an Array of Terms by adding Terms with the same monomial', function() {
            const terms = [
                new Term(Complex.real(1), new Monomial({
                    'x': 2
                })),
                new Term(Complex.real(3), new Monomial({
                    'x': 1
                })),
                new Term(Complex.real(-2), new Monomial({
                    'x': 2
                })),
                new Term(Complex.real(4), new Monomial({
                    'y': 2
                }))
            ];
            const reducedTerms = [
                new Term(Complex.real(4), new Monomial({
                    'y': 2
                })),
                new Term(Complex.real(-1), new Monomial({
                    'x': 2
                })),
                new Term(Complex.real(3), new Monomial({
                    'x': 1
                }))
            ];
            expect(Term.reduce(terms)).to.deep.equal(reducedTerms);
        });
    });
});
