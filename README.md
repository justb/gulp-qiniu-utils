
<p align="center"><img src="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1512500664746&di=fc81cf16126ea6dad57f93040fa1cf28&imgtype=0&src=http%3A%2F%2Fimg.mp.itc.cn%2Fupload%2F20170704%2F588fdedfab224d34a6a0dcc7f6687686.jpg" alt="七牛云存储"></p>

gulp-qiniu-utils, such as upload, remove, prefetch, refresh and so on

##Example:

```js

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

```

PS: 有什么问题或者建议直接在GitHub上面提，请各位大爷给我点个star，在此谢过各位