'use strict';

const cleanLine = require('src/download/cleanLine');

function writeWaitingInfo(state, materialsName, msg) {
  cleanLine();
  const percent = (state.percent * 100).toFixed(2),
        transferred = formatBytes(state.size.transferred),
        total = formatBytes(state.size.total),
        remaining = secondsToHms(state.time.remaining),
        speed = formatBytes(state.speed),
        t = `Downloading: ${percent}% | ${transferred} / ${total} | ${speed}/sec | ${remaining} - ${materialsName}`;
  //process.stdout.write(text);
  msg.text = t
}

function formatBytes(bytes, decimals) {
   if (bytes == 0) return '0 Bytes';
   let k = 1024,
       dm = decimals || 2,
       sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
       i = Math.floor(Math.log(bytes) / Math.log(k));
   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function secondsToHms(sec) {
    var h = Math.floor(sec / 3600);
    var m = Math.floor(sec % 3600 / 60);
    var s = Math.floor(sec % 3600 % 60);
    var hh = h < 10 ? '0' + h : h;
    var mm = m < 10 ? '0' + m : m;
    var ss = s < 10 ? '0' + s : s;
    return `${hh}:${mm}:${ss}`;
}

// module.exports = writeWaitingInfo;
// module.exports = formatBytes;

module.exports = {
  writeWaitingInfo,
  formatBytes
}
