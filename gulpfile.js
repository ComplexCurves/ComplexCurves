const beautify = require('gulp-beautify');
const concat = require('gulp-concat');
const compilerPackage = require('google-closure-compiler');
const closureCompiler = compilerPackage.gulp();
const del = require('del');
const gap = require('gulp-append-prepend');
const gulp = require('gulp');
const jshint = require('gulp-jshint');
const jsstring = require('gulp-js-string');
const sourcemaps = require('gulp-sourcemaps');

const paths = {
    js: 'src/js/*.js',
    glsl: 'src/glsl/*'
};

gulp.task('beautify', function() {
    return gulp.src(['index.js', 'gulpfile.js', paths.js], {
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

gulp.task('lint', function() {
    return gulp.src(['index.js', 'gulpfile.js', paths.js])
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

gulp.task('js-compile', ['lint', 'beautify', 'resources'], function() {
    return gulp.src(['build/resources.js', paths.js], {
            base: './'
        })
        .pipe(sourcemaps.init())
        .pipe(closureCompiler({
            language_in: 'ECMASCRIPT6_STRICT',
            language_out: 'ECMASCRIPT5_STRICT',
            dependency_mode: 'LOOSE',
            module_resolution: 'NODE',
            compilation_level: 'ADVANCED',
            warning_level: 'VERBOSE',
            jscomp_warning: 'reportUnknownTypes',
            rewrite_polyfills: false,
            output_wrapper_file: 'src/js/ComplexCurves.js.wrapper',
            summary_detail_level: '3',
            js_output_file: 'ComplexCurves.js',
        }))
        .pipe(sourcemaps.write('/'))
        .pipe(gulp.dest('./build/'));
});

gulp.task('default', ['js-compile']);
