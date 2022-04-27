// const sanitize = require("sanitize-filename");
// const path = require("path");
// const { formatBytes,  } = require("./writeWaitingInfo");
const request = require("request");
const progress = require("request-progress");
const fs = require("fs-extra");

function download({url, dest }) {
    return new Promise(function (resolve, reject) {

        let req = request(encodeURI(url)); //request(url);
        progress(req)//, { throttle: 2000, delay: 1000 }
            /*.on('progress', state => {
                // writeWaitingInfo(state, dest, ms, url, { localSizeInBytes, remoteSizeInBytes });//`${downloadFolder}${path.sep}${videoName}.mp4`
            })*/
            .on('response', (resp) => {
                if (dest.includes('.srt')) {
                    if (parseInt(resp.statusCode) !== 404) {
                        //msg.succeed(`subtitle downloaded for ${dest}`);
                        console.log(`subtitle downloaded for ${dest}`);
                        req.pipe(fs.createWriteStream(dest));//`${downloadFolder}${path.sep}${videoName}.srt`//.vtt
                    }
                }
            })
            .on('end', () => {
                resolve()
            })
            .on('error', err => {
                reject(err);
            })
    });
}

const downloadSubtitle = async ({ video, downloadFolder }) => {
    // let videoName = sanitize(video.title.replace('Урок ', '').replace('\\', ''));

    //download subtitle
    let subtitleUrl = video.url.replace('.mp4', '.srt');//.vtt
    // console.log('subtitleUrl', subtitleUrl);
    // ms.add(subtitleUrl, { text: `Checking if subtitle is downloaded: ${videoName}` });
    await download({
        url: subtitleUrl,
        dest: downloadFolder
    })

}

module.exports = downloadSubtitle
