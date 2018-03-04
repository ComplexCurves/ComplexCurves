var assert = require('chai').assert;
var rewire = require('rewire');
var MatrixSrc = rewire('../src/js/Matrix.js');
var Matrix = MatrixSrc.__get__('Matrix');
var ComplexSrc = rewire('../src/js/Complex.js');
var Complex = ComplexSrc.__get__('Complex');
var one = Complex.one;
var zero = Complex.zero();

describe('Matrix', function() {
  describe('det', function() {
    it('should compute the determinant of a 3x3 identity matrix', function() {
      var m = new Matrix([[one, zero, zero], [zero, one, zero], [zero, zero, one]]);
      var det = m.det();
      assert.equal(det.re, one.re);
      assert.equal(det.im, one.im);
    });
  });
});
