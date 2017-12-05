var gulp = require('gulp');
var Qiniu = require('gulp-qiniu-utils')

var qiniuOptions = {
  ak: 'your accessKey',
  sk: 'your secretKey',
  uploadDir: './dist', //本地目录
  bucket: '...', //七牛对应空间
  prefix: 'test/', //上传时添加的前缀，可省略
  zone: 'Zone_z2', //空间
  url: 'http...', //域名
  remoteDir: 'test', //七牛空间目录（前缀），如果下面三个相同可省略
  prefetchDir: 'test',
  removeDir: 'test',
  refreshDir: 'test'
}

gulp.task('upload', function (cb) {
  var qiniu = new Qiniu(qiniuOptions)
  qiniu.remove()
    .then(r => qiniu.upload()) //根据自己的需求来调用相应的方法
    .then(r => qiniu.refresh())
    .then(r => qiniu.prefetch())
    .then(r => cb())
})