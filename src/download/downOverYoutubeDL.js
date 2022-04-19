// @ts-check
const fileSize = require('promisify-remote-file-size')
const { formatBytes } = require('./writeWaitingInfo');
const { createLogger, isCompletelyDownloaded } = require('./fileChecker');
const path = require('path')
// const ytdl = require('ytdl-run')
const fs = require('fs-extra')
const Promise = require('bluebird')
const youtubedl = require("youtube-dl-wrap")
const colors = require('colors');

const pRetry = require('@byungi/p-retry').pRetry
// const pDelay = require('@byungi/p-delay').pDelay

const getFilesizeInBytes = filename => {
    return fs.existsSync(filename) ? fs.statSync(filename)["size"] : 0;
};

const download = (url, dest, {
    localSizeInBytes,
    remoteSizeInBytes,
    downFolder,
    index = 0,
    m
}) => new Promise(async (resolve, reject) => {
    const videoLogger = createLogger(downFolder);
    await fs.remove(dest) // not supports overwrite..
    // console.log(`to be processed by youtube-dl... ${dest.split('/').pop()} Found:${localSizeInBytes}/${remoteSizeInBytes}`)
    const youtubeDlWrap = new youtubedl()
    let youtubeDlEventEmitter = youtubeDlWrap
        .exec([url, "-o", path.toNamespacedPath(dest)])
        .on("progress", (progress) => {
            m.update(progress.percent, {
                filename: dest.split('/').pop(),
                l: localSizeInBytes,
                r: remoteSizeInBytes,
                eta: progress.eta,
                total: progress.totalSize,
                speed: progress.currentSpeed
            })
        })
        // .on("youtubeDlEvent", (eventType, eventData) => console.log(eventType, eventData))
        .on("error", (error) => {
            m.stop()
            console.log('error--', error)
            fs.unlink(dest, (err) => {
                reject(error);
            });

        })
        .on("close", () => {
            m.stop()
            // console.log(`${index}. End download ytdl: ${dest} compare L/R:${localSizeInBytes}/${remoteSizeInBytes} - Local in bytes:${formatBytes(getFilesizeInBytes(dest))}`.blue);
            videoLogger.write(`${dest} Size:${getFilesizeInBytes(dest)}\n`);
            resolve()
        })

});

const downloadVideo = async (url, dest, {
    localSizeInBytes,
    remoteSizeInBytes,
    downFolder,
    index = 0,
    m
}) => {
    try {
        await pRetry(
            () => download(url, dest,
                {
                    localSizeInBytes,
                    remoteSizeInBytes,
                    downFolder,
                    index,
                    m
                }),
            {
                retries        : 3,
                onFailedAttempt: error => {
                    console.log(`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`);
                    // 1st request => Attempt 1 failed. There are 4 retries left.
                    // 2nd request => Attempt 2 failed. There are 3 retries left.
                    // …
                }
            })
    } catch (e) {
        console.error('Issue with downloading', e);
        //reject(e)
    }
}


/**
 * @param url
 * @param {import("fs").PathLike} dest
 * @param downFolder
 * @param index
 * @param ms
 */
module.exports = async ({ url, dest, downFolder, index, multibar } = {}) => {
    url = encodeURI(url)
    //const dest = path.join(downloadFolder, course.title)
    // const m = multibar.create(100, 0);
    // console.log(`Checking if video is downloaded: ${dest.split('/').pop()}`);
    let isDownloaded = false;
    let remoteFileSize = 0;
    try {
        remoteFileSize = await fileSize(url); //await fileSize(encodeURI(url));
    } catch (err) {
        if (err.message === 'Received invalid status code: 404') {
            console.error(`${index}. ERROR WITH THE URL ${url}, Error message: ${err.message}`);
            return Promise.resolve();
        }
    }
    let localSize = getFilesizeInBytes(`${dest}`)
    let localSizeInBytes = formatBytes(getFilesizeInBytes(`${dest}`))
    isDownloaded = isCompletelyDownloaded(downFolder, dest)
    // console.log('remoteFileSize', remoteFileSize);
    if (remoteFileSize === localSize || isDownloaded) {
        /*m.update(100, {
            filename: dest.split('/').pop(),
            l: localSizeInBytes,
            r: formatBytes(remoteFileSize),
            eta: 0,
            total: 100,
            speed: 0
        })
        */
        console.log(`${index}. Video already downloaded: ${dest.split('/').pop()} - ${localSizeInBytes}/${formatBytes(remoteFileSize)}`.blue);
        return new Promise.resolve().delay(100)
    } else {
        const m = multibar.create(100, 0);
        return await downloadVideo(url, dest, {
            localSizeInBytes,
            remoteSizeInBytes: formatBytes(remoteFileSize),
            downFolder,
            index,
            m
        });
    }
}

