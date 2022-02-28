const sanitize = require("sanitize-filename");
const path = require("path");
const { formatBytes, writeWaitingInfo } = require("./writeWaitingInfo");
const Promise = require("bluebird");
const request = require("request");
const progress = require("request-progress");
const fs = require("fs");

function download(url, dest, ms, { localSizeInBytes, remoteSizeInBytes }) {
  return new Promise(function (resolve, reject) {
    let req = request(encodeURI(url)); //request(url);
    progress(req)//, { throttle: 2000, delay: 1000 }
      .on('progress', state => {
        writeWaitingInfo(state, dest, ms, url, { localSizeInBytes, remoteSizeInBytes });//`${downloadFolder}${path.sep}${videoName}.mp4`
      })
      .on('response', (resp) => {
        if (dest.includes('.srt')) {
          if (parseInt(resp.statusCode) !== 404) {
            //msg.succeed(`subtitle downloaded for ${dest}`);
            ms.succeed(url, { text: `subtitle downloaded for ${dest}` });
            req.pipe(fs.createWriteStream(dest));//`${downloadFolder}${path.sep}${videoName}.srt`//.vtt
          } else {
            ms.remove(url, { text: `Subtitle does not exist: ${dest}` });
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
  });
}

const downloadSubtitle = async ({ video, downloadFolder, ms }) => {
  let videoName = sanitize(video.title.replace('Урок ', '').replace('\\', ''));

  //download subtitle
  let subtitleUrl = video.url.replace('.mp4', '.srt');//.vtt
  ms.add(subtitleUrl, { text: `Checking if subtitle is downloaded: ${videoName}` });
  await download(subtitleUrl, downloadFolder, ms, {
    localSizeInBytes : 0,
    remoteSizeInBytes: formatBytes(0)
  })

}

module.exports = downloadSubtitle
