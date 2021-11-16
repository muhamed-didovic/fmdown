'use strict';

const path = require('path');
const fs = require('fs');

const makeDownloadFolderPath = downloadFolder => {
  const sep = path.sep;
  const folders = process.argv[1].split(sep);
  folders.pop();
  folders.push(downloadFolder);
  const downloadFolderPath = folders.join(sep);
  return downloadFolderPath;
};

const createFolder = downloadFolder => {
  const sep = path.sep;
  const initDir = path.isAbsolute(downloadFolder) ? sep : '';
  downloadFolder
    .split(sep)
    .reduce((parentDir, childDir) => {
      const curDir = path.resolve(parentDir, childDir);
      try {
        fs.mkdirSync(curDir);
      } catch (err) {
        if (err.code !== 'EEXIST' && err.code !== 'EISDIR') {
          throw err;
        }
        if (curDir == makeDownloadFolderPath(downloadFolder))
          console.log(`Directory ${curDir} already exists`.blue);
        return curDir;
      }
      console.log(`Directory ${curDir} created`.blue);
      return curDir;
    }, initDir);
};

module.exports = createFolder;
