'use strict';

const path = require('path');
const fs = require('fs');
const ora = require("ora");


const makeDownloadFolderPath = downloadFolder => {
  const sep = path.sep;
  const folders = process.argv[1].split(sep);
  folders.pop();
  folders.push(downloadFolder);
  const downloadFolderPath = folders.join(sep);
  return downloadFolderPath;
};

const createFolder = downloadFolder => {
  // const msg = ora('Checking folder..').start()
  const sep = path.sep;
  const initDir = path.isAbsolute(downloadFolder) ? sep : '';
  downloadFolder
    .split(sep)
    .reduce((parentDir, childDir) => {
      const curDir = path.resolve(parentDir, childDir);
      try {
        fs.mkdirSync(curDir);
        // msg.succeed(`Directory ${curDir} created`);
        return curDir;
      } catch (err) {
        if (err.code !== 'EEXIST' && err.code !== 'EISDIR') {
          console.log('--ERRRR', err);
          throw err;
        }
        /*if (curDir == makeDownloadFolderPath(downloadFolder)){
          msg.fail(`Directory ${curDir} already exists`);
        }*/

        // msg.succeed(`Directory ${curDir} created`);
        return curDir;
      }

    }, initDir);
};

module.exports = createFolder;
