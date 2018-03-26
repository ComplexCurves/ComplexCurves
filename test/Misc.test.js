const expect = require('chai').expect;
const Misc = require('../src/js/Misc.js');

describe('Misc', function() {
    describe('lerp', function() {
        it('interpolates linearly between two numbers', function() {
            const x = 2,
                y = 3;
            expect(Misc.lerp(x, y, 0)).to.equal(x);
            expect(Misc.lerp(x, y, 0.5)).to.equal((x + y) / 2);
            expect(Misc.lerp(x, y, 1)).to.equal(y);
        });
    });
});
