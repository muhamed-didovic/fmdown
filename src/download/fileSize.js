"use strict";

const remote = require('remote-file-size')

/*function bytesToSize(bytes) {
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return 'n/a';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  if (i == 0) return bytes + ' ' + sizes[i];
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
};
var url = 'https://github.com/reasonml/reason-cli/archive/3.0.4-bin-darwin.tar.gz'
remote(url, function(err, o) {
  console.log(bytesToSize(o))
  // => 146.3 MB
})*/


const getFileSize = (url) => {
  return new Promise((resolve, reject) => {
    remote(url, function(err, size) {
      if( err ) reject(err);
      resolve(size);
    });
  });
}

module.exports = getFileSize;