const beautify = require('gulp-beautify');
const concat = require('gulp-concat');
const del = require('del');
const gap = require('gulp-append-prepend');
const gulp = require('gulp');
const jshint = require('gulp-jshint');
const jsstring = require('gulp-js-string');

const paths = {
    js: ['index.js', 'src/js/*.js', 'gulpfile.js'],
    glsl: 'src/glsl/*'
};

gulp.task('beautify', function() {
    return gulp.src(paths.js, {
            base: './'
        })
        .pipe(beautify({
            'max_preserve_newlines': 3,
            'end_with_newline': true
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('clean:build', function() {
    return del(['build']);
});

gulp.task('jshint', function() {
    return gulp.src(paths.js)
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('resources', function() {
    return gulp.src(paths.glsl)
        .pipe(jsstring(function(escapedstring, file) {
            var name = file.basename;
            return 'resources[\'' + name + '\'] = \'' + escapedstring + '\';';
        }))
        .pipe(concat('resources.js'))
        .pipe(gap.prependText('var resources = {};'))
        .pipe(gulp.dest('build/'));
});

gulp.task('default', ['jshint', 'beautify']);
