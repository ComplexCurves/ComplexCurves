const expect = require('chai').expect;
const Quaternion = require('../src/js/Quaternion.js');

describe('Quaternion', function() {
    describe('abs', function() {
        it('computes the absolute value of a Quaternion', function() {
            expect(new Quaternion(1, 0, 0, 0).abs()).to.equal(1);
            expect(new Quaternion(0, 1, 0, 0).abs()).to.equal(1);
            expect(new Quaternion(0, 0, 1, 0).abs()).to.equal(1);
            expect(new Quaternion(0, 0, 0, 1).abs()).to.equal(1);
            expect(new Quaternion(1, 2, 3, 4).abs()).to.equal(Math.sqrt(30));
        });
    });
    describe('lerp', function() {
        it('interpolates linearly between two Quaternions', function() {
            const x = new Quaternion(1, 2, 3, 4);
            const y = new Quaternion(5, 6, 7, 8);
            const z = new Quaternion(3, 4, 5, 6);
            expect(Quaternion.lerp(x, y, 0)).to.deep.equal(x);
            expect(Quaternion.lerp(x, y, 0.5)).to.deep.equal(z);
            expect(Quaternion.lerp(x, y, 1)).to.deep.equal(y);
        });
    });
    describe('nlerp', function() {
        it('interpolates linearly between two Quaternions and normalizes', function() {
            const x = new Quaternion(1, 2, 3, 4);
            const y = new Quaternion(5, 6, 7, 8);
            const z = new Quaternion(3, 4, 5, 6);
            expect(Quaternion.nlerp(x, y, 0)).to.deep.equal(x.normalize());
            expect(Quaternion.nlerp(x, y, 0.5)).to.deep.equal(z.normalize());
            expect(Quaternion.nlerp(x, y, 1)).to.deep.equal(y.normalize());
        });
    });
    describe('normalize', function() {
        it('normalizes a Quaternion', function() {
            expect(new Quaternion(2, 0, 0, 0).normalize()).to.deep.eql(new Quaternion(1, 0, 0, 0));
            expect(new Quaternion(3, 0, 4, 0).normalize()).to.deep.eql(new Quaternion(3 / 5, 0, 4 / 5, 0));
        });
    });
    describe('sub', function() {
        it('computes the difference of two Quaternions', function() {
            const x = new Quaternion(8, 7, 6, 5);
            const y = new Quaternion(1, 2, 3, 4);
            const z = new Quaternion(7, 5, 3, 1);
            expect(Quaternion.sub(x, y)).to.deep.equal(z);
        });
    });
});
