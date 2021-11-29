'use strict';

const fs = require('fs');
const path = require('path');
const progress = require('request-progress');
const request = require('request');
// const fileSize = require('./fileSize');
const remote = require('remote-file-size');
const cleanLine = require('src/download/cleanLine');
const {writeWaitingInfo} = require('src/download/writeWaitingInfo');

// const getFilesizeInBytes = filename => {
//     var stats = fs.statSync(filename);
//     // console.log('stats', stats);
//     return stats["size"];
// };
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

const downloadMaterials = async (urlMaterials, downloadFolder) => {
  let materialsName = urlMaterials.split('/');
  materialsName = (materialsName.includes('materials') ? 'code-' : '') + materialsName[materialsName.length - 1];

  /*fileSize(encodeURI(urlMaterials))
    .then(remoteFileSize => {
      if (remoteFileSize == getFilesizeInBytes(`${downloadFolder}${path.sep}${materialsName}`)) {//fs.existsSync(materialsName) &&
        console.log('Materials exist:', materialsName, remoteFileSize, getFilesizeInBytes(`${downloadFolder}${path.sep}${materialsName}`));
        return nextMaterial()
      }
      console.log('333');
      console.log(`Start download materials: ${materialsName}`.blue);
      progress(request(encodeURI(urlMaterials)), { throttle: 2000, delay: 1000 })
        .on('progress', function (state) {
          writeWaitingInfo(state, `${downloadFolder}${path.sep}${materialsName}`);
        })
        .on('error', function (err) {
          console.log(`${err}`.red);
        })
        .on('end', function () {
          cleanLine();
          console.log(`End download materials - ${materialsName}`.green);

          nextMaterial();
        })
        .pipe(fs.createWriteStream(`${downloadFolder}${path.sep}${materialsName}`));
    })*/

  return new Promise((resolve, reject) => {
    remote(encodeURI(urlMaterials), (err, remoteFileSize) => {
      const localSize = getFilesizeInBytes(`${downloadFolder}${path.sep}${materialsName}`)
      console.log('Remote size - local size: ', remoteFileSize, localSize, 'comparison:', remoteFileSize == localSize);
      if (remoteFileSize == localSize) {//fs.existsSync(materialsName) &&
        console.log('Materials exist:', materialsName, remoteFileSize, getFilesizeInBytes(`${downloadFolder}${path.sep}${materialsName}`));
        resolve();
      }

      console.log(`2222Start download materials: ${materialsName}`.blue);
      progress(request(encodeURI(urlMaterials)), { throttle: 2000, delay: 1000 })
        .on('error', function (err) {
          console.log(`${err}`.red);
          reject(err)
        })
        .on('progress', function (state) {
          writeWaitingInfo(state, `${downloadFolder}${path.sep}${materialsName}`);
        })
        .pipe(fs.createWriteStream(`${downloadFolder}${path.sep}${materialsName}`))
        .on('end', function () {
          cleanLine();
          console.log(`End download materials - ${materialsName}`.green);
          resolve();
        })
        .on('finish', () => {
          console.log('Finish Downloaded event');
          resolve();
        })

    })
  })

  // if (fs.existsSync(materialsName) && isCompletelyDownloaded(materialsName, downloadFolder)) {
  //     console.log('-----------video found:', materialsName, downloadFolder);
  // }


};

const downloadAllMaterials = async (urlMaterials, downloadFolder) => {
  /*let materialsNumber = [];
  let x = 0;
  for (let i = x; i < urlMaterials.length; i++) {
      materialsNumber.push(i + 1);
  }*/
  console.log(`Will be downloaded materials: ${urlMaterials.join(', ')}`.blue);

  for (let doc of urlMaterials) {
    await downloadMaterials(doc, downloadFolder);
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
