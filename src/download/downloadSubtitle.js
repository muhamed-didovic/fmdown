// const sanitize = require("sanitize-filename");
// const path = require("path");
const { formatBytes,  } = require("./writeWaitingInfo");
const request = require("request");
const progress = require("request-progress");
const fs = require("fs-extra");

function download({url, dest, m, multibar, localSizeInBytes, remoteSizeInBytes }) {
    return new Promise(function (resolve, reject) {
        let req = request(encodeURI(url)); //request(url);
        progress(req)//, { throttle: 2000, delay: 1000 }
            .on('progress', state => {
                // writeWaitingInfo(state, dest, ms, url, { localSizeInBytes, remoteSizeInBytes });//`${downloadFolder}${path.sep}${videoName}.mp4`
                m.update(progress.percent, {
                    filename: url.split('/').pop(),
                    l: localSizeInBytes,
                    r: remoteSizeInBytes,
                    eta: state.time.remaining,
                    total: state.size.total,
                    speed: state.speed
                })
            })
            .on('response', (resp) => {
                if (dest.includes('.srt')) {
                    if (parseInt(resp.statusCode) !== 404) {
                        //msg.succeed(`subtitle downloaded for ${dest}`);
                        m.update(100, {
                            filename: url.split('/').pop(),
                            l: localSizeInBytes,
                            r: remoteSizeInBytes,
                            eta: 0,
                            total: 100,
                            speed: 0
                        })
                        req.pipe(fs.createWriteStream(dest));//`${downloadFolder}${path.sep}${videoName}.srt`//.vtt
                    } else {
                        multibar.remove(m)
                    }
                }
            })
            .on('end', () => {
                resolve()
            })
            .on('error', err => {
                multibar.remove(m)
                reject(err);
            })
    });
}

const downloadSubtitle = async ({ video, downloadFolder, multibar }) => {
    // let videoName = sanitize(video.title.replace('Урок ', '').replace('\\', ''));

    //download subtitle
    let subtitleUrl = video.url.replace('.mp4', '.srt');//.vtt
    // console.log('subtitleUrl', subtitleUrl);
    // ms.add(subtitleUrl, { text: `Checking if subtitle is downloaded: ${videoName}` });
    const m = multibar.create(100, 0);
    await download({
        url: subtitleUrl,
        dest: downloadFolder,
        m,
        multibar,
        localSizeInBytes : 0,
        remoteSizeInBytes: formatBytes(0)
    })

}

module.exports = downloadSubtitle
