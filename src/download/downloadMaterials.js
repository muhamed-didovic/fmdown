'use strict';

const fs = require('fs');
const path = require('path');
const progress = require('request-progress');
const request = require('request');
// const fileSize = require('./fileSize');
const remote = require('remote-file-size');
const cleanLine = require('src/download/cleanLine');
const {writeWaitingInfo, formatBytes } = require('src/download/writeWaitingInfo');
const ora = require("ora");
const fileSize = require("./fileSize");

const getFilesizeInBytes = filename => {
  // console.log('stats', stats);
  return fs.existsSync(filename) ? fs.statSync(filename)["size"] : 0;
};

const findDownloadedVideos = downloadFolder => {
  const logFile = `${downloadFolder}${path.sep}videos.txt`;
  if (!fs.existsSync(logFile)) return [];
  return fs.readFileSync(logFile).toString().split("\n");
};

// const isCompletelyDownloaded = (videoName, downloadFolder) => {
//     const downloadedVideos = findDownloadedVideos(downloadFolder);
//     if (typeof downloadedVideos === 'undefined' || downloadedVideos.length === 0) {
//         return true;
//     }
//     for (let downloadedVideoName of downloadedVideos) {
//         console.log('videoName === downloadedVideoName', videoName,  downloadedVideoName);
//         if (videoName === downloadedVideoName)
//             return true;
//     }
//     return false;
// };
const downloadMaterial = (uri, dest, msg) => new Promise(function (resolve, reject) {
  let req = request(encodeURI(uri)); //request(uri);
  progress(req, { throttle: 2000, delay: 1000 })
    .on('progress', state => {
      writeWaitingInfo(state, dest, msg);//`${downloadFolder}${path.sep}${videoName}.mp4`
    })
    .on('end', () => {
      msg.succeed(`End download video ${dest}`);
      resolve()
    })
    .on('error', err => {
      msg.fail(err);
      reject(err);
    })
    .pipe(fs.createWriteStream(dest));
  //.pipe(fs.createWriteStream(`${downloadFolder}${path.sep}${videoName}.mp4`));
});
const downloadMaterials = async ({material, downloadFolder, code, zip}) => {
  let materialsName = material.split('/');
  materialsName = (materialsName.includes('materials') ? 'code-' : '') + materialsName[materialsName.length - 1];
  let remoteFileSize = await fileSize(encodeURI(material));
  const msg = ora(`Checking the material..${material}`).start()

  if ((!code && materialsName.includes('code'))
    || (!zip && !materialsName.includes('code'))) {
    msg.succeed(`Material is skipped: ${materialsName}`)
    return;
  }
  let localSizeInBytes = formatBytes(getFilesizeInBytes(`${downloadFolder}${path.sep}${materialsName}`))
  const localSize = getFilesizeInBytes(`${downloadFolder}${path.sep}${materialsName}`)
  // console.log('Remote size - local size: ', remoteFileSize, localSize, 'comparison:', remoteFileSize == localSize);
  if (remoteFileSize === localSize) {//fs.existsSync(materialsName) &&
    // console.log('Materials exist:', materialsName, remoteFileSize, getFilesizeInBytes(`${downloadFolder}${path.sep}${materialsName}`));
    msg.succeed(`Material already downloaded: ${downloadFolder}${path.sep}${materialsName}`);
    return
  }

  msg.text = `Different Remote/Local:${formatBytes(remoteFileSize)}/${localSizeInBytes} - Start download video: ${materialsName}`;//.blue
  return await downloadMaterial(material, `${downloadFolder}${path.sep}${materialsName}`, msg)
};

const downloadAllMaterials = async ({urlMaterials, downloadFolder, code, zip}) => {
  /*let materialsNumber = [];
  let x = 0;
  for (let i = x; i < urlMaterials.length; i++) {
      materialsNumber.push(i + 1);
  }*/
  // ora(`Will be downloaded materials: ${urlMaterials.join(', ')}`).start();

  for (let material of urlMaterials) {
    await downloadMaterials({material, downloadFolder, code, zip});
  }
  /*const loopArray = materials => {
    console.log('loopArray', x, materials[x]);
    downloadMaterials(materials[x], downloadFolder, () => {
      console.log('inside---');
      x++;
      if (x < materials.length) {
        loopArray(materials);
      }
    });
  };
  loopArray(urlMaterials);
  return true;*/
};


module.exports = downloadMaterials;
module.exports = downloadAllMaterials;
