'use strict';

var build = require('bitcore-build');
var gulp = require('gulp');
var mocha = require('gulp-mocha');

build('explorers');

var socketTest = ['socketTest/**/*.js'];

var testmocha = function() {
    return gulp.src(socketTest).pipe(mocha({
        reporter: 'spec'
    }));
};

gulp.task('test:socket', testmocha);
