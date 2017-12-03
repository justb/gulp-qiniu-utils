var fs=require('fs-extra');
fs = require('fs')
fs.readdir('zz',function(err,data){
    if(err){
        console.log(err)
    }else{
        console.log(data)
    }
})