'use strict';

const path = require('path');
const fs = require('fs');

function getFilesizeInBytes(filename) {
  return fs.existsSync(filename) ? fs.statSync(filename)["size"] : 0;
}

function findNotExistingVideo(videos, downloadFolder) {
  // console.log('findNotExistingVideos:', videos, 'downloadFolder:', downloadFolder);
  let i = 0;
  for (let video of videos) {
    const name = video.name.toString().replace(/[^A-Za-zА-Яа-я\d\s]/gmi, '').replace('Урок ', '');
    let filename = `${downloadFolder}${path.sep}${name}.mp4`;

    // console.log('if statement', name, getFilesizeInBytes(filename), isCompletelyDownloaded(name, downloadFolder));
    if (fs.existsSync(filename) && getFilesizeInBytes(filename) > 500 && isCompletelyDownloaded(name, downloadFolder)) {
      console.log(`File "${name}" already exists, Size: ${getFilesizeInBytes(filename)}`.red);
      i++;
    } else {
      break ;
    }
  }
  return i;
}

function isCompletelyDownloaded(videoName, downloadFolder) {
  const downloadedVideos = findDownloadedVideos(downloadFolder);
  //console.log('downloadedVideos', downloadedVideos);
  if (typeof downloadedVideos === 'undefined' || downloadedVideos.length === 0) {
    return true;
  }
  for (let downloadedVideoName of downloadedVideos) {
    //console.log('Checking for existance of videos:', videoName, downloadedVideoName);
    if (videoName === downloadedVideoName)
      return true;
  }
  return false;
}

function findDownloadedVideos(downloadFolder) {
  const logFile =`${downloadFolder}${path.sep}videos.txt`;
  if (!fs.existsSync(logFile)) return [];
  return fs.readFileSync(logFile).toString().split("\n");
}

module.exports = findNotExistingVideo;
