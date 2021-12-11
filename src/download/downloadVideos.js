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

function downloadSubtitle(uri, dest, msg) {
  return new Promise(function (resolve, reject) {
    let req = request(encodeURI(uri)); //request(uri);
    progress(req, { throttle: 2000, delay: 1000 })
      .on('progress', state => {
        writeWaitingInfo(state, dest, msg);//`${downloadFolder}${path.sep}${videoName}.mp4`
      })
      .on('response', (resp) => {
        if (dest.includes('.srt')) {
          if (parseInt(resp.statusCode) !== 404) {
            this.pipe(fs.createWriteStream(dest));//`${downloadFolder}${path.sep}${videoName}.srt`//.vtt
          } else {
            msg.fail(`Subtitle does not exist: ${dest}`);
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
        msg.fail(err);
        reject(err);
      })

    //.pipe(fs.createWriteStream(`${downloadFolder}${path.sep}${videoName}.mp4`));
  });
}
function downloadVideo(uri, dest, msg) {
  return new Promise(function (resolve, reject) {
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
}

const downloadOneVideo = async (logger, downloadFolder, video) => {

  let videoName = sanitize(video.name.replace('Урок ', '').replace('\\', ''));

  //download subtitle
  let subtitleUrl = video.url.replace('.mp4', '.srt');//.vtt
  const subtitleMsg = ora('Checking the subtitle..').start()
  await downloadSubtitle(subtitleUrl, `${downloadFolder}${path.sep}${videoName}.srt`, subtitleMsg)

  //download videos
  let url = encodeURI(video.url)
  const msg = ora('Checking size of the video..').start()
  let remoteFileSize = await fileSize(url);
  let localSize = getFilesizeInBytes(`${downloadFolder}${path.sep}${videoName}.mp4`)
  let localSizeInBytes = formatBytes(getFilesizeInBytes(`${downloadFolder}${path.sep}${videoName}.mp4`))
  // console.log('remoteFileSize === localSize', remoteFileSize === localSize, formatBytes(remoteFileSize), localSizeInBytes);
  if (remoteFileSize === localSize) {
    msg.succeed(`Video already downloaded: ${downloadFolder}${path.sep}${videoName}.mp4`);
    return;
  }
  //ora(`Remote/Local:${formatBytes(remoteFileSize)}/${localSizeInBytes} Files are: ${(remoteFileSize === localSize)} File:${downloadFolder}${path.sep}${videoName}.mp4`).fail();
  msg.text = `Different Remote/Local:${formatBytes(remoteFileSize)}/${localSizeInBytes} - Start download video: ${videoName}`.blue;
  return await downloadVideo(url, `${downloadFolder}${path.sep}${videoName}.mp4`, msg)

  /*Promise
    .resolve()
    .then(async () => {
      //download subtitle if exists
      let subtitleUrl = video.url.replace('.mp4', '.srt');//.vtt
      const subtitleMsg = ora('Checking the subtitle..').start()
      await download(subtitleUrl, `${downloadFolder}${path.sep}${videoName}.srt`, subtitleMsg)
      /!*progress(request(encodeURI(subtitleUrl)), { throttle: 2000, delay: 1000 })
        .on('response', function (resp) {
          if (parseInt(resp.statusCode) !== 404) {
            this.pipe(fs.createWriteStream(`${downloadFolder}${path.sep}${videoName}.srt`));//.vtt
          } else {
            //msg.fail(`Subtitle does not exist: ${downloadFolder}${path.sep}${videoName}.srt`);
            ora(`Subtitle does not exist: ${downloadFolder}${path.sep}${videoName}.srt`).fail()
          }
        })
        .on('progress', function (state) {
          writeWaitingInfo(state, `${downloadFolder}${path.sep}${videoName}.srt`, msg);
        })
        .on('error', err => {
          console.error(`${err}`.red);
          // msg.fail(`Subtitle does not exist: ${downloadFolder}${path.sep}${videoName}.srt`);
          ora(`Subtitle does not exist: ${downloadFolder}${path.sep}${videoName}.srt`).fail()
        })
        .on('end', function () {
          cleanLine();
          // msg.succeed(`End download subtitle for ${videoName}`.green);
          ora(`End download subtitle for ${videoName}`).succeed()
          resolve();
        });*!/
    })*/

  /*const msg = ora('Checking size of the video..').start()
  let remoteFileSize = await fileSize(url);
  return new Promise((resolve, reject) => {
    let localSize = getFilesizeInBytes(`${downloadFolder}${path.sep}${videoName}.mp4`)
    let localSizeInBytes = formatBytes(getFilesizeInBytes(`${downloadFolder}${path.sep}${videoName}.mp4`))
    //console.log('remoteFileSize === localSize', remoteFileSize, localSize, remoteFileSize === localSize);
    if (remoteFileSize === localSize) {
      msg.succeed(`Video already downloaded: ${downloadFolder}${path.sep}${videoName}.mp4`);
      return resolve();
    }
    //ora(`Remote/Local:${formatBytes(remoteFileSize)}/${localSizeInBytes} Files are: ${(remoteFileSize === localSize)} File:${downloadFolder}${path.sep}${videoName}.mp4`).fail();
    msg.text = `Different Remote/Local:${formatBytes(remoteFileSize)}/${localSizeInBytes} - Start download video: ${videoName}`.blue;
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
        resolve();
      })
      .pipe(fs.createWriteStream(`${downloadFolder}${path.sep}${videoName}.mp4`));
  })*/

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

const downloadVideos = async (logger, videos, downloadFolder) => {
  /*if (lessonNumbers !== null) {
    await downloadSelectively(logger, videos, downloadFolder, lessonNumbers);
    return true;
  }*/
  await downloadAll(logger, videos, downloadFolder);
  return true;
};

module.exports = downloadVideos;
