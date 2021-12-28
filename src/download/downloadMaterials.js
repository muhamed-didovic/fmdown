'use strict';

const fs = require('fs');
const path = require('path');
const progress = require('request-progress');
const request = require('request');
const Spinnies = require('spinnies')
const ms = new Spinnies();

// const fileSize = require('./fileSize');
const remote = require('remote-file-size');
const cleanLine = require('src/download/cleanLine');
const {writeWaitingInfo, formatBytes } = require('src/download/writeWaitingInfo');

const fileSize = require("./fileSize");
const Promise = require("bluebird");

const getFilesizeInBytes = filename => {
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
const downloadMaterial = (url, dest, ms, { localSizeInBytes, remoteSizeInBytes}) => new Promise(function (resolve, reject) {
  let req = request(encodeURI(url)); //request(url);
  progress(req)//, { throttle: 2000, delay: 1000 }
    .on('progress', state => {
      writeWaitingInfo(state, dest, ms, url,{ localSizeInBytes, remoteSizeInBytes });//`${downloadFolder}${path.sep}${videoName}.mp4`
    })
    .on('end', () => {
      ms.succeed(url, { text: `End download material ${dest} Found:${localSizeInBytes}/${remoteSizeInBytes}` });
      resolve()
    })
    .on('error', err => {
      ms.fail(url, { text: err });
      reject(err);
    })
    .pipe(fs.createWriteStream(dest));
});
const downloadMaterials = async ({url, downloadFolder, code, zip}) => {
  let materialsName = url.split('/');
  materialsName = (materialsName.includes('materials') ? 'code-' : '') + materialsName[materialsName.length - 1];
  let remoteFileSize = await fileSize(encodeURI(url));
  ms.add(url, { text: `Checking if material is downloaded: ${materialsName}` });

  if ((!code && materialsName.includes('code'))
    || (!zip && !materialsName.includes('code'))) {
    ms.succeed(url, { text: `Material is skipped: ${materialsName}.mp4` });
    return;
  }
  let localSizeInBytes = formatBytes(getFilesizeInBytes(`${downloadFolder}${path.sep}${materialsName}`))
  const localSize = getFilesizeInBytes(`${downloadFolder}${path.sep}${materialsName}`)
  // console.log('Remote size - local size: ', remoteFileSize, localSize, 'comparison:', remoteFileSize == localSize);
  if (remoteFileSize === localSize) {//fs.existsSync(materialsName) &&
    ms.succeed(url, { text: `Material already downloaded: ${downloadFolder}${path.sep}${materialsName}` });
    return
  }

  ms.update(url, { text: `${localSizeInBytes}/${formatBytes(remoteFileSize)} - Start download video: ${materialsName}` });
  return await downloadMaterial(url, `${downloadFolder}${path.sep}${materialsName}`, ms, { localSizeInBytes, remoteSizeInBytes: formatBytes(remoteFileSize) })
};

const downloadAllMaterials = async ({urls, downloadFolder, code, zip, concurrency}) => {
  /*let materialsNumber = [];
  let x = 0;
  for (let i = x; i < urlMaterials.length; i++) {
      materialsNumber.push(i + 1);
  }*/
  // ora(`Will be downloaded materials: ${urlMaterials.join(', ')}`).start();

  //console.log('urlMaterials', urls);
  /*for (let url of urls) {
    await downloadMaterials({url, downloadFolder, code, zip});
  }*/

  await Promise.map(urls, async (url) => {
    //let cnt = 0
    await downloadMaterials({url, downloadFolder, code, zip});
    //console.log(`DONE - downloaded videos: ${cnt}`);
  }, {
    concurrency//: 10
  })
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
