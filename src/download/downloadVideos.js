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

function downloadSubtitle(url, dest, ms, { localSizeInBytes, remoteSizeInBytes }) {
  return new Promise(function (resolve, reject) {
    let req = request(encodeURI(url)); //request(url);
    progress(req)//, { throttle: 2000, delay: 1000 }
      .on('progress', state => {
        writeWaitingInfo(state, dest, ms, url,{ localSizeInBytes, remoteSizeInBytes });//`${downloadFolder}${path.sep}${videoName}.mp4`
      })
      .on('response', (resp) => {
        if (dest.includes('.srt')) {
          if (parseInt(resp.statusCode) !== 404) {
            //msg.succeed(`subtitle downloaded for ${dest}`);
            ms.succeed(url, { text: `subtitle downloaded for ${dest}` });
            req.pipe(fs.createWriteStream(dest));//`${downloadFolder}${path.sep}${videoName}.srt`//.vtt
          } else {
            ms.fail(url, { text: `Subtitle does not exist: ${dest}` });
            // msg.fail(`Subtitle does not exist: ${dest}`);
            //throw new Error (`Subtitle does not exist: ${dest}`)
            //ora(`Subtitle does not exist: ${downloadFolder}${path.sep}${videoName}.srt`).fail()
          }
        }
      })
      .on('end', () => {
        //msg.info(`End reached for ${dest}`);
        resolve()
      })
      .on('error', err => {
        ms.fail(url, { text: err });
        reject(err);
      })

    //.pipe(fs.createWriteStream(`${downloadFolder}${path.sep}${videoName}.mp4`));
  });
}
function downloadVideo(url, dest, ms, { localSizeInBytes, remoteSizeInBytes }) {
  return new Promise(function (resolve, reject) {
    let req = request(encodeURI(url)); //request(url);
    progress(req, { throttle: 2000, delay: 1000 })
      .on('progress', state => {
        writeWaitingInfo(state, dest, ms, url,{ localSizeInBytes, remoteSizeInBytes });//`${downloadFolder}${path.sep}${videoName}.mp4`
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

  //download subtitle
  if (subtitle) {
    let subtitleUrl = video.url.replace('.mp4', '.srt');//.vtt
    ms.add(subtitleUrl, { text: `Checking if subtitle is downloaded: ${videoName}` });
    await downloadSubtitle(subtitleUrl, `${downloadFolder}${path.sep}${videoName}.srt`, ms, { localSizeInBytes: 0, remoteSizeInBytes: formatBytes(0) })
  }

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
  return await downloadVideo(url, `${downloadFolder}${path.sep}${videoName}.mp4`, ms, { localSizeInBytes, remoteSizeInBytes: formatBytes(remoteFileSize) })
};

/*const downloadSelectively = async (logger, videos, downloadFolder, lessonNumbers) => {
  var i = 0;
  if (lessonNumbers[i] >= videos.length) {
    return false;
  }
  console.log(`Will be downloaded videos number ${lessonNumbers.join(', ')}`.blue);
  const loopArr = function (videos) {
    downloadOneVideo(logger, downloadFolder, videos[lessonNumbers[i] - 1], function () {
      i++;
      if (i < videos.length && i < lessonNumbers.length) {
        loopArr(videos);
      }
    });
  }
  loopArr(videos);
  return true;
};*/

const downloadAll = async (videos, downloadFolder, concurrency, subtitle) => {
  /*let x             = findNotExistingVideo(videos, downloadFolder),
      lessonNumbers = [];
  let y = findNotExistingSubtitle(videos, downloadFolder);
  if (x >= videos.length)
    return false;
  if (y >= videos.length)
    console.log('All Subtitles was download');
  for (let i = x; i < videos.length; i++) {
    lessonNumbers.push(i + 1);
  }
  console.log(`Will be downloaded videos number ${lessonNumbers.join(', ')}`.blue);*/


  /*const loopArray = function (videos) {
    downloadOneVideo(logger, downloadFolder, videos[x], function () {
      x++;
      if (x < videos.length) {
        loopArray(videos);
      }
    });
  };
  loopArray(videos);
  return true;*/
  // console.log('videos', videos);
  /*for (let video of videos) {
    await downloadOneVideo(logger, downloadFolder, video);
  }*/
  /*for (let i = 0; i < videos.length; i++) {
    let video = videos[i];
    await downloadOneVideo(logger, downloadFolder, video);
  }*/

  await Promise.map(videos, async (video) => {
    //let cnt = 0
    await downloadOneVideo(downloadFolder, video, subtitle);
    //console.log(`DONE - downloaded videos: ${cnt}`);
  }, {
    concurrency//: 10
  })
};

const downloadVideos = async (videos, downloadFolder, concurrency, subtitle) => {
  /*if (lessonNumbers !== null) {
    await downloadSelectively(logger, videos, downloadFolder, lessonNumbers);
    return true;
  }*/
  // console.log('concurrency', concurrency, subtitle);
  await downloadAll(videos, downloadFolder, concurrency, subtitle);
  return true;
};

module.exports = downloadVideos;
