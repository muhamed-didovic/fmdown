'use strict';

const fs = require('fs');
const path = require('path');
const progress = require('request-progress');
const request = require('request');
const sanitize = require("sanitize-filename");

const findNotExistingVideo = require('src/download/findNotExistingVideo');
const findNotExistingSubtitle = require('src/download/findNotExistingSubtitle');
const cleanLine = require('src/download/cleanLine');
const { writeWaitingInfo, formatBytes } = require('src/download/writeWaitingInfo');
const fileSize = require('./fileSize');
const remote = require('remote-file-size');
// const ora = require("ora");

const Spinnies = require('spinnies')
const Promise = require("bluebird");
const ms = new Spinnies();

function getFilesizeInBytes(filename) {
  // console.log('stats', stats);
  return fs.existsSync(filename) ? fs.statSync(filename)["size"] : 0;
}



function downloadVideo(url, dest, ms, { localSizeInBytes, remoteSizeInBytes }) {
  return new Promise(function (resolve, reject) {
    let req = request(encodeURI(url)); //request(url);
    progress(req, { throttle: 2000, delay: 1000 })
      .on('progress', state => {
        writeWaitingInfo(state, dest, ms, url, { localSizeInBytes, remoteSizeInBytes });//`${downloadFolder}${path.sep}${videoName}.mp4`
      })
      .on('end', () => {
        ms.succeed(url, { text: `End download video: ${dest.split('/').pop()} Found:${localSizeInBytes}/${remoteSizeInBytes}` });
        resolve()
      })
      .on('error', err => {
        ms.fail(url, { text: err });
        reject(err);
      })
      .pipe(fs.createWriteStream(dest));
  });
}

const downloadOneVideo = async (downloadFolder, video, subtitle) => {
  let videoName = sanitize(video.name.replace('Урок ', '').replace('\\', ''));

  //download videos
  let url = encodeURI(video.url)
  ms.add(url, { text: `Checking if video is downloaded: ${videoName}` });
  let remoteFileSize = await fileSize(url);
  let localSize = getFilesizeInBytes(`${downloadFolder}${path.sep}${videoName}.mp4`)
  let localSizeInBytes = formatBytes(getFilesizeInBytes(`${downloadFolder}${path.sep}${videoName}.mp4`))
  // console.log('remoteFileSize === localSize', remoteFileSize === localSize, formatBytes(remoteFileSize), localSizeInBytes);
  if (remoteFileSize === localSize) {
    ms.succeed(url, { text: `Video already downloaded: ${videoName}.mp4` });
    return;
  }

  ms.update(url, { text: `${localSizeInBytes}/${formatBytes(remoteFileSize)} - Start download video: ${videoName}.mp4` });
  return await downloadVideo(url, `${downloadFolder}${path.sep}${videoName}.mp4`, ms, {
    localSizeInBytes,
    remoteSizeInBytes: formatBytes(remoteFileSize)
  })
};

const downloadAll = async (videos, downloadFolder, concurrency, subtitle) => {
  await Promise
    .map(videos, async (video) => await downloadOneVideo(downloadFolder, video, subtitle), { concurrency })
};

const downloadVideos = async (videos, downloadFolder, concurrency, subtitle) => {
  await downloadAll(videos, downloadFolder, concurrency, subtitle);
  return true;
};

module.exports = downloadVideos;
