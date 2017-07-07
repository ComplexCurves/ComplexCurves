const gulp = require('gulp');
const del = require('del');
const jshint = require('gulp-jshint');
const beautify = require('gulp-beautify');

const paths = {
    js: ['index.js', 'src/js/*.js']
};

gulp.task('beautify', function () {
    return gulp.src(paths.js)
        .pipe(beautify({
            'max-preserve-newlines': 3,
            'end-with-newline': true
        }))
        .pipe(gulp.dest('.'));
});

gulp.task('clean:build', function () {
    return del(['build']);
});

gulp.task('jshint', function () {
    return gulp.src(paths.js)
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('default', ['jshint', 'beautify']);
