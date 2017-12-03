var qiniu = require("qiniu");
var config = require("../config/qiniu")
var accessKey = config.ak;
var secretKey = config.sk;
var mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
var cdnManager = new qiniu.cdn.CdnManager(mac);
cdnManager.refreshUrls(["http://file.kim1.kim/index.html"], function (err, respBody, respInfo) {
  if (err) {
    throw err;
  }

  console.log("Refresh "+respInfo.statusCode);
  if (respInfo.statusCode == 200) {
    var jsonBody = JSON.parse(respBody);
    // console.log(jsonBody.code);
    console.log("Refresh "+jsonBody.error);
    // console.log(jsonBody.requestId);
    // console.log(jsonBody.invalidUrls);
    // console.log(jsonBody.invalidDirs);
    // console.log(jsonBody.urlQuotaDay);
    // console.log(jsonBody.urlSurplusDay);
    // console.log(jsonBody.dirQuotaDay);
    // console.log(jsonBody.dirSurplusDay);
  }
})
