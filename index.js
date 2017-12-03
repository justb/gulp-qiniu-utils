var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var qiniu = require("qiniu");
// 常量
const PLUGIN_NAME = 'gulp-prefixer';


//需要填写你的 Access Key 和 Secret Key
var accessKey = 'D0kBjb8UpWlNtfKDUwkPkG1m1oIHE6mpnYIa3Yvw';
var secretKey = 'zs5E454laPxsVe3pVppClFXYgjcX1_k7Dkk82htq';
//要上传的空间
var bucket = 'file';
//上传到七牛后保存的文件名
var mac = new qiniu.auth.digest.Mac(accessKey, secretKey)

var options = {
  scope: bucket,
};
var putPolicy = new qiniu.rs.PutPolicy(options);
var uploadToken = putPolicy.uploadToken(mac);

var config = new qiniu.conf.Config();
// 空间对应的机房
config.zone = qiniu.zone.Zone_z0;


var formUploader = new qiniu.form_up.FormUploader(config);
var putExtra = new qiniu.form_up.PutExtra();



// 插件级别的函数（处理文件）
function gulpPrefixer(prefixText) {
  if (!prefixText) {
    throw new PluginError(PLUGIN_NAME, 'Missing prefix text!');
  }

  prefixText = new Buffer(prefixText); // 提前分配
  var promises = [];
  // 创建一个 stream 通道，以让每个文件通过
  var stream = through.obj(function (file, enc, cb) {
    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
      return cb();
    }
    if (file.isBuffer()) {
      function w() {
        return new Promise((resolve, reject) => formUploader.putFile(uploadToken, file.history[0].substr(9), file.history[0], putExtra, function (respErr, respBody, respInfo) {
          if (respErr) {
            throw respErr;
          }
          // console.log(respInfo.statusCode)
          if (respInfo.statusCode == 200) {
            resolve(respBody);
          } else {
            reject(respBody.error);
          }
        }))
      }
    }
    // 确保文件进入下一个 gulp 插件
    var that = this
    async function s(){
      if(w){
        var res=await w()
        console.log(res.key+" upload successfully")
      }
      that.push(file);
      cb()
    }
    s()
    // 告诉 stream 引擎，我们已经处理完了这个文件
  });
  // 返回文件 stream
  return stream;
};

// 导出插件主函数
module.exports = gulpPrefixer;