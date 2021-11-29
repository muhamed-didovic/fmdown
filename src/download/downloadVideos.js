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
const ora = require("ora");

function getFilesizeInBytes(filename) {
  // console.log('stats', stats);
  return fs.existsSync(filename) ? fs.statSync(filename)["size"] : 0;
}

const downloadOneVideo = async (logger, downloadFolder, video) => {
  let videoName = sanitize(video.name.replace('Урок ', '').replace('\\', ''));
  let subtitleUrl = video.url.replace('.mp4', '.srt');//.vtt
  let url = encodeURI(video.url)
  const msg = ora('Checking size of the video..').start()
  /*return fileSize(url)
    .then(remoteFileSize => {
      if (remoteFileSize == getFilesizeInBytes(`${downloadFolder}${path.sep}${videoName}.mp4`)) {
        //console.log('videos are the same');
        return nextVideo();
      }
      console.log(`Start download video: ${videoName}`.blue);
      progress(request(encodeURI(video.url)), { throttle: 2000, delay: 1000 })
        .on('progress', state => {
          writeWaitingInfo(state);
        })
        .on('error', err => {
          console.log(`${err}`.red);
        })
        .on('end', () => {
          cleanLine();
          console.log(`End download video ${videoName}`.green);
          logger.write(`${videoName}\n`);

          progress(request(encodeURI(subtitleUrl)), { throttle: 2000, delay: 5000 })
            .on('response', function (resp) {
              if (parseInt(resp.statusCode) !== 404) {
                this.pipe(fs.createWriteStream(`${downloadFolder}${path.sep}${videoName}.srt`));//.vtt
              } else {
                console.log('Subtitle does not exist');
              }
            })
            .on('progress', function (state) {
              writeWaitingInfo(state);
            })
            .on('error', function (err) {
              console.log(`${err}`.red);
              console.log('Subtitle does not exist');
            })
            .on('end', function () {
              cleanLine();
              console.log(`End download subtitle for ${videoName}`.green);
            });

          nextVideo();
        })
        .pipe(fs.createWriteStream(`${downloadFolder}${path.sep}${videoName}.mp4`));
    })*/


  let remoteFileSize = await fileSize(url);
  return new Promise((resolve, reject) => {
    let localSize = getFilesizeInBytes(`${downloadFolder}${path.sep}${videoName}.mp4`)
    let localSizeInBytes = formatBytes(getFilesizeInBytes(`${downloadFolder}${path.sep}${videoName}.mp4`))
    if (remoteFileSize == localSize) {
      msg.succeed(`Video already downloaded: ${downloadFolder}${path.sep}${videoName}.mp4`.blue);
      return resolve();
    }
    ora(`\nRemote/Local:${formatBytes(remoteFileSize)}/${localSizeInBytes} Same?: ${(remoteFileSize === localSize)} File:${downloadFolder}${path.sep}${videoName}.mp4`).fail();
    msg.text = `Start download video: ${videoName}`.blue;
    progress(request(encodeURI(video.url)), { throttle: 2000, delay: 1000 })
      .on('progress', function (state) {
        writeWaitingInfo(state, `${downloadFolder}${path.sep}${videoName}.mp4`, msg);
      })
      .on('error', function (err) {
        msg.fail(`${err}`.red);
        reject(err)
      })
      .on('end', function () {
        cleanLine();
        msg.succeed(`End download video ${videoName}`.green);
        // logger.write(`${videoName}\n`);

        progress(request(encodeURI(subtitleUrl)), { throttle: 2000, delay: 1000 })
          .on('response', function (resp) {
            if (parseInt(resp.statusCode) !== 404) {
              this.pipe(fs.createWriteStream(`${downloadFolder}${path.sep}${videoName}.srt`));//.vtt
            } else {
              msg.fail(`Subtitle does not exist: ${downloadFolder}${path.sep}${videoName}.srt`);
            }
          })
          .on('progress', function (state) {
            writeWaitingInfo(state, `${downloadFolder}${path.sep}${videoName}.srt`, msg);
          })
          .on('error', err => {
            console.error(`${err}`.red);
            msg.fail(`Subtitle does not exist: ${downloadFolder}${path.sep}${videoName}.srt`);
          })
          .on('end', function () {
            cleanLine();
            msg.succeed(`End download subtitle for ${videoName}`.green);
            resolve();
          });

        // resolve();
      })
      .pipe(fs.createWriteStream(`${downloadFolder}${path.sep}${videoName}.mp4`));
  })

};

const downloadSelectively = async (logger, videos, downloadFolder, lessonNumbers) => {
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
};

const downloadAll = async (logger, videos, downloadFolder) => {
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
  for (let i = 0; i < videos.length; i++) {
    let video = videos[i];
    await downloadOneVideo(logger, downloadFolder, video);
  }
};

const downloadVideos = async (logger, videos, downloadFolder, lessonNumbers) => {
  if (lessonNumbers !== null) {
    await downloadSelectively(logger, videos, downloadFolder, lessonNumbers);
    return true;
  }
  await downloadAll(logger, videos, downloadFolder);
  return true;
};

module.exports = downloadVideos;
