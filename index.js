var qiniu = require('qiniu')
var fs = require('fs')

module.exports = class Qiniu {
  constructor(option) {
    this.mac = new qiniu.auth.digest.Mac(option.ak, option.sk)
    if (option.remote.url) {
      if (!option.remote.url.endsWith('/')) {
        option.remote.url += '/'
      }
    }
    this.option = option
  }
  getFiles() {
    var options = {
      prefix: this.option._DIR || this.option.remote.prefix.default
    }
    var config = new qiniu.conf.Config()
    //config.useHttpsDomain = true;
    config.zone = qiniu.zone[this.option.zone]
    var bucketManager = new qiniu.rs.BucketManager(this.mac, config)
    return new Promise((resolve, reject) => {
      bucketManager.listPrefix(this.option.bucket, options, function (
        err,
        respBody,
        respInfo
      ) {
        if (err) {
          console.log(err)
          throw err
        }
        if (respInfo.statusCode == 200) {
          //如果这个nextMarker不为空，那么还有未列举完毕的文件列表，下次调用listPrefix的时候，
          //指定options里面的marker为这个值
          var nextMarker = respBody.marker
          var commonPrefixes = respBody.commonPrefixes
          // console.log(nextMarker);
          // console.log(commonPrefixes);
          var items = respBody.items
          resolve({
            items,
            bucketManager
          })
        } else {
          console.log(respInfo.statusCode)
          console.log(respBody)
          reject(respBody)
        }
      })
    })
  }
  remove() {
    this.option._DIR = this.option.remote.prefix.remove
    return new Promise((resovle, reject) => this.getFiles(this.option).then((data) => {
      if (data.items.length) {
        var deleteOperations = [];
        data.items.map((item) => {
          deleteOperations.push(qiniu.rs.deleteOp(this.option.bucket, item.key))
        })
        data.bucketManager.batch(deleteOperations, function (err, respBody, respInfo) {
          if (err) {
            console.log(err);
            //throw err;
          } else {
            // 200 is success, 298 is part success
            if (parseInt(respInfo.statusCode / 100) == 2) {
              respBody.forEach(function (item, i) {
                if (item.code == 200) {
                  console.log("remove success" + "\t" + item.code + "\t" + data.items[i].key);
                } else {
                  console.log(item.data.error + "\t" + item.code + "\t" + data.items[i].key);
                }
              });
              resovle(true)
            } else {
              console.log(respInfo.deleteusCode);
              console.log(respBody);
              reject()
            }
          }
        });
      } else {
        console.log("There is no file in this removeDir!")
        resovle(true)
      }
    }))
  }
  prefetch() {
    this.option._DIR = this.option.remote.prefix.prefetch
    return new Promise((resovle, reject) => this.getFiles(this.option).then(data => {
      var urls = []
      var cdnManager = new qiniu.cdn.CdnManager(this.mac)
      data.items.map((item) => {
        console.log(this.option.remote.url + item.key)
        urls.push(this.option.remote.url + item.key)
      })
      cdnManager.prefetchUrls(urls, function (err, respBody, respInfo) {
        if (err) {
          reject()
          throw err
        }
        // console.log("prefetch "+respInfo.statusCode);
        if (respInfo.statusCode == 200) {
          var jsonBody = JSON.parse(respBody)
          // console.log(jsonBody.code);
          console.log('Prefetch ' + jsonBody.error + '\t' + jsonBody.code)
          resovle(data.items)
        }
      })
    }))
  }
  refresh() {
    this.option._DIR = this.option.remote.prefix.refresh
    return new Promise((resovle, reject) => this.getFiles(this.option).then(data => {
      var urls = []
      var cdnManager = new qiniu.cdn.CdnManager(this.mac);
      data.items.map((item) => {
        console.log(this.option.remote.url + item.key)
        urls.push(this.option.remote.url + item.key)
      })
      cdnManager.refreshUrls(urls, function (err, respBody, respInfo) {
        if (err) {
          reject()
          throw err;
        }
        // console.log("Refresh "+respInfo.statusCode);
        if (respInfo.statusCode == 200) {
          var jsonBody = JSON.parse(respBody);
          // console.log(jsonBody.code);
          console.log("Refresh " + jsonBody.error + '\t' + jsonBody.code);
          resovle(data.items)
        }
      })
    }))
  }
  upload() {
    var bucket = this.option.bucket
    var config = new qiniu.conf.Config()
    // 空间对应的机房
    config.zone = qiniu.zone[this.option.zone]
    let fileAffay = [];

    function Traversal(path) {

      if (path.endsWith('/')) {
        path = path.substr(0, path.length - 1)
      }
      var files = fs.readdirSync(path)

      files
        .map(function (file) {
          var stat = fs.statSync(path + '/' + file)
          if (stat.isDirectory()) {
             Traversal(path + '/' + file)
          } else {
            fileAffay.push(path + '/' + file);
          }
        });
    }
    Traversal(this.option.upload.dir)
    // 文件上传
    return Promise.all(
      fileAffay.filter(l => !l.match(this.option.upload.except)).map(localFile => {
        var key = (this.option.upload.prefix ? this.option.upload.prefix : "") +
          (localFile[0] == '.' ?
            localFile
            .split('/')
            .filter((x, i) => i > 0)
            .join('/') :
            localFile)
        var options = {
          scope: bucket + ":" + key
        }
        var putPolicy = new qiniu.rs.PutPolicy(options)
        var uploadToken = putPolicy.uploadToken(this.mac)
        var formUploader = new qiniu.form_up.FormUploader(config)
        var putExtra = new qiniu.form_up.PutExtra()
        return new Promise((resolve, reject) =>
          formUploader.putFile(
            uploadToken,
            key,
            localFile,
            putExtra,
            function (respErr, respBody, respInfo) {
              if (respErr) {
                throw respErr
              }
              if (respInfo.statusCode == 200) {
                console.log("upload success" + "\t" + respInfo.statusCode + "\t" + localFile + "\t" + respInfo.data.key)
                resolve({
                  local: localFile,
                  remote: respInfo.data.key
                })
              } else {
                reject(respBody.error)
              }
            }
          )
        )
      })
    )
  }
}
