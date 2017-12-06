
<p align="center"><img src="http://assets.qiniu.com/qiniu-409x220.png" alt="七牛云存储"></p>
gulp-qiniu-utils, such as upload, remove, prefetch, refresh and so on

## Install:

Install with `npm` or `cnpm`

```js
npm install --save-dev gulp-qiniu-utils
cnpm install --save-dev gulp-qiniu-utils
```

## Usage:

```js

var gulp = require('gulp');
var Qiniu = require('gulp-qiniu-utils')

var qiniuOptions = {
  ak: 'your accessKey',
  sk: 'your secretKey',
  uploadDir: './dist', //本地需上传的目录
  bucket: '...', //七牛空间名
  prefix: 'test/', //上传时添加的前缀，可省略
  zone: 'Zone_z0', //空间对应存储区域（华东：z0，华北：z1，华南：z2，北美：na0）
  url: 'http...', //域名
  remoteDir: 'test', //七牛空间目录（前缀），如果和下面三个相同，下面三个可省略
  prefetchDir: 'test',//需预取目录
  removeDir: 'test',//需删除目录
  refreshDir: 'test'//需刷新目录
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

## License:

Copyright (c) 2017 justb (MIT License)

PS：有什么问题或者建议直接在GitHub上面提，请各位大爷给我点个`star`，在此谢过各位