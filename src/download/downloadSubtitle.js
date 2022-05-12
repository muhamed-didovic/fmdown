// const sanitize = require("sanitize-filename");
const request = require("request");
const progress = require("request-progress");
const fs = require("fs-extra");

function download({ url, dest }) {
    return new Promise((resolve, reject) => {

        let req = request(encodeURI(url));
        progress(req)//, { throttle: 2000, delay: 1000 }
            /*.on('progress', state => {
                // writeWaitingInfo(state, dest, ms, url, { localSizeInBytes, remoteSizeInBytes });//`${downloadFolder}${path.sep}${videoName}.mp4`
            })*/
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
    });
}

const downloadSubtitle = async ({ subtitle, dest }) => {
    // let videoName = sanitize(video.title.replace('Урок ', '').replace('\\', ''));
    //const subtitleUrl = video.url.replace('.mp4', '.srt')

    // console.log('subtitleUrl', subtitleUrl);
    // ms.add(subtitleUrl, { text: `Checking if subtitle is downloaded: ${videoName}` });
    const s = await download({
        url : subtitle,//.vtt
        dest
    })
    //console.log('111', s);
    return s;

}

module.exports = downloadSubtitle
