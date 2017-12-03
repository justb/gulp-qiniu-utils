var f = require('./index')
var gulp = require('gulp')

gulp.task('test', function () {
    return gulp.src('./zz/**/*')
      .pipe(f(1223123))
  });