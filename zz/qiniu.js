var qiniu = require("qiniu");
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


var fs = require("fs");

function Traversal(path) {
  var files = fs.readdirSync(path)
  return files.map(function (file) {
      var stat = fs.statSync(path + '/' + file);
      if (stat.isDirectory()) {
        return Traversal(path + '/' + file);
      } else {
        return path + '/' + file
      }
    })
    .reduce((a, b) => a + "," + b).split(",")
}
console.log(Traversal('zz'))
// 文件上传
Promise.all(Traversal("./dist").map((localFile) => {
  if (!localFile.endsWith(".map") && !localFile.endsWith(".html")) {
    return new Promise((resolve, reject) => formUploader.putFile(uploadToken, localFile.substr(7), localFile, putExtra, function (respErr, respBody, respInfo) {
      if (respErr) {
        throw respErr;
      }
      console.log(respInfo.statusCode)
      if (respInfo.statusCode == 200) {
        resolve(respBody);
      } else {
        reject(respBody.error);
      }
    }))
  }
})).then(() => {
  console.log("All files upload ok!")
}).catch((data) => {
  console.log("Some files upload failed! Because " + data)
})
