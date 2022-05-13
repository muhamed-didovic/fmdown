// const sanitize = require("sanitize-filename");
// const request = require("request");
// const progress = require("request-progress")
const fs = require("fs-extra")
// const youtubedl = require("youtube-dl-wrap")
const YoutubeDlWrap = require("youtube-dl-wrap")
const Promise = require("bluebird");
// const { createLogger } = require("./fileChecker");
const path = require("path");

const download = async ({ url, dest }) => {
    /*return new Promise((resolve, reject) => {

        let req = request(encodeURI(url));
        progress(req)//, { throttle: 2000, delay: 1000 }
            /!*.on('progress', state => {
                // writeWaitingInfo(state, dest, ms, url, { localSizeInBytes, remoteSizeInBytes });//`${downloadFolder}${path.sep}${videoName}.mp4`
            })*!/
            .on('response', (resp) => {
                if (dest.includes('.srt')) {
                    if (parseInt(resp.statusCode) !== 404) {
                        // console.log(`subtitle downloaded for ${dest}`);
                        req.pipe(fs.createWriteStream(dest));//`${downloadFolder}${path.sep}${videoName}.srt`//.vtt
                        resolve(dest)
                    }
                }
            })
            .on('end', () => {
                resolve()
            })
            .on('error', err => {
                reject(err);
            })
    });*/

    try  {
        const youtubeDlWrap = new YoutubeDlWrap()
        let stdout = await youtubeDlWrap.execPromise([url, "-o", path.toNamespacedPath(dest)]);
        // console.log('stdout',stdout);
        return stdout;
    } catch (e) {
        // console.log('Error downloading subtitle', e);
    }

    /*return new Promise(async (resolve, reject) => {
        await fs.remove(dest) // not supports overwrite..
        // console.log(`to be processed by youtube-dl... ${dest.split('/').pop()} Found:${localSizeInBytes}/${remoteSizeInBytes}`)
        const youtubeDlWrap = new youtubedl()
        let youtubeDlEventEmitter = youtubeDlWrap
            .exec([url, "-o", path.toNamespacedPath(dest)])
            .on("error", (error) => {
                reject(error);
            })
            .on("close", () => {
                resolve()
            })
    })*/
};

const downloadSubtitle = async ({ subtitle, dest }) => {
    // let videoName = sanitize(video.title.replace('Урок ', '').replace('\\', ''));
    //const subtitleUrl = video.url.replace('.mp4', '.srt')

    // console.log('subtitleUrl', subtitleUrl);
    // ms.add(subtitleUrl, { text: `Checking if subtitle is downloaded: ${videoName}` });
    const s = await download({
        url: subtitle,//.vtt
        dest
    })
    //console.log('111', s);
    return s;

}

module.exports = downloadSubtitle
