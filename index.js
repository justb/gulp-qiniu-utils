var qiniu = require('qiniu')
var fs = require('fs')

module.exports = class Qiniu {
  constructor(option) {
    this.mac = new qiniu.auth.digest.Mac(option.ak, option.sk)
    this.option = option
  }
  getFiles() {
    var options = {
      prefix: this.option._DIR||this.option.remoteDir
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
    this.option._DIR = this.option.removeDir
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
              resovle()
            } else {
              console.log(respInfo.deleteusCode);
              console.log(respBody);
              reject()
            }
          }
        });
      } else {
        console.log("There is no file in this removeDir!")
        resovle()
      }
    }))
  }
  prefetch() {
    this.option._DIR = this.option.prefetchDir
    return new Promise((resovle, reject) => this.getFiles(this.option).then(data => {
      var urls = []
      var cdnManager = new qiniu.cdn.CdnManager(this.mac)
      data.items.map((item) => {
        console.log(this.option.url + item.key)
        urls.push(this.option.url + item.key)
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
          console.log('prefetch ' + jsonBody.error)
          resovle()
        }
      })
    }))
  }
  refresh() {
    this.option._DIR = this.option.refreshDir
    return new Promise((resovle, reject) => this.getFiles(this.option).then(data => {
      var urls = []
      var cdnManager = new qiniu.cdn.CdnManager(this.mac);
      data.items.map((item) => {
        console.log(this.option.url + item.key)
        urls.push(this.option.url + item.key)
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
          console.log("Refresh " + jsonBody.error);
          resovle()
        }
      })
    }))
  }
  upload() {
    var bucket = this.option.bucket
    var config = new qiniu.conf.Config()
    // 空间对应的机房
    config.zone = qiniu.zone[this.option.zone]

    function Traversal(path) {
      if (path.endsWith('/')) {
        path = path.substr(0, path.length - 1)
      }
      var files = fs.readdirSync(path)
      return files
        .map(function (file) {
          var stat = fs.statSync(path + '/' + file)
          if (stat.isDirectory()) {
            return Traversal(path + '/' + file)
          } else {
            return path + '/' + file
          }
        })
        .reduce((a, b) => a + ',' + b)
        .split(',')
    }
    // 文件上传
    return Promise.all(
        Traversal(this.option.uploadDir).map(localFile => {
          if (!localFile.endsWith('.html')) {
            var key = (this.option.prefix ? this.option.prefix : "") +
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
                  console.log(localFile)
                  if (respInfo.statusCode == 200) {
                    resolve(respBody)
                  } else {
                    reject(respBody.error)
                  }
                }
              )
            )
          }
        })
      )
      .then(() => {
        console.log('------All files upload ok!------')
      })
      .catch(data => {
        console.log('------Some files upload failed! Because ' + data + " ------")
      })
  }
}