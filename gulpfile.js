var gulp = require('gulp');
var zip = require('gulp-zip');
var clean = require('gulp-clean');
var runSequence = require('run-sequence');


gulp.task('deploy', function (cb) {
    return runSequence(
        'clean',
        'zip-package'
    );
});

gulp.task('zip-package', function () {
    return gulp.src(['server.js', 'package.json'])
        .pipe(zip('pusher.zip'))
        .pipe(gulp.dest('build'))
});

gulp.task('clean', function () {
    return gulp.src('build', {read: false}).
        pipe(clean());
});

