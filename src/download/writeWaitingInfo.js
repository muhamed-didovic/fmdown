'use strict';

const cleanLine = require('src/download/cleanLine');

function writeWaitingInfo(state, materialsName, ms, random, {localSizeInBytes, remoteSizeInBytes}) {
  cleanLine();
  const percent = (state.percent * 100).toFixed(2),
        transferred = formatBytes(state.size.transferred),
        total = formatBytes(state.size.total),
        remaining = secondsToHms(state.time.remaining),
        speed = formatBytes(state.speed),
        t = `Downloading: ${percent}% | ${transferred} / ${total} | ${speed}/sec | ${remaining} - ${materialsName.split('/').pop()} Found:${localSizeInBytes}/${remoteSizeInBytes}`;
  //process.stdout.write(text);
  ms.update(random, { text: t, color: 'blue' });
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
    const h = Math.floor(sec / 3600);
    const m = Math.floor(sec % 3600 / 60);
    const s = Math.floor(sec % 3600 % 60);
    const hh = h < 10 ? '0' + h : h;
    const mm = m < 10 ? '0' + m : m;
    const ss = s < 10 ? '0' + s : s;
    return `${hh}:${mm}:${ss}`;
}

// module.exports = writeWaitingInfo;
// module.exports = formatBytes;

module.exports = {
  writeWaitingInfo,
  formatBytes
}
