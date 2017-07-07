const gulp = require('gulp');
const jshint = require('gulp-jshint');
const beautify = require('gulp-beautify');

const sources = ['./index.js', './src/js/*.js'];

gulp.task('beautify', function () {
    return gulp.src(sources)
        .pipe(beautify())
        .pipe(gulp.dest('.'));
});

gulp.task('jshint', function () {
    return gulp.src(sources)
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('default', ['jshint', 'beautify']);
