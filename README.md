
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

var gulp = require('gulp')
var Qiniu = require('gulp-qiniu-utils')

var qiniuOptions = {
  ak: 'your accessKey',
  sk: 'your secretKey',
  zone: 'Zone_z2',//空间对应存储区域（华东：z0，华北：z1，华南：z2，北美：na0）
  bucket: '...',//七牛对应空间
  upload: {
    dir: './public/dist',//上传本地目录
    prefix: 'test/',//上传时添加的前缀，可省略
    except: /\.(html|js)$/ //上传时不上传文件的正则匹配
  },
  remote: {
    url: 'http...',//七牛空间域名
    prefix: {
      default: 'test/',//七牛空间默认前缀，如果下面三个相同可省略
      remove: 'test/',//七牛空间删除前缀
      prefetch: 'test/',//七牛空间预取前缀
      refresh: 'test/'//七牛空间刷新前缀
    }
  }
}

gulp.task('upload', function (cb) {
  var qiniu = new Qiniu(qiniuOptions)
  qiniu.remove()
    .then(r => qiniu.upload().then(files=>console.log(files))) //根据自己的需求来调用相应的方法
    .then(r => qiniu.refresh())
    .then(r => qiniu.prefetch())
    .then(r => cb())
})

```


PS：有什么问题或者建议可以在[github](https://github.com/justb/gulp-qiniu-utils)上面提，觉得好用的话可以点个`star`