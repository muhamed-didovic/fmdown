// @ts-check
const fileSize = require('promisify-remote-file-size')
const { formatBytes, writeWaitingInfoDL } = require('./writeWaitingInfo');
const { createLogger, isCompletelyDownloaded } = require('./fileChecker');
const path = require('path')
const ytdl = require('ytdl-run')
const fs = require('fs-extra')
const Promise = require('bluebird')
const youtubedl = require("youtube-dl-wrap")
const colors = require('colors');

const pRetry = require('@byungi/p-retry').pRetry
const pDelay = require('@byungi/p-delay').pDelay

const getFilesizeInBytes = filename => {
    return fs.existsSync(filename) ? fs.statSync(filename)["size"] : 0;
};

const download = (url, dest, {
    localSizeInBytes,
    remoteSizeInBytes,
    downFolder,
    index = 0,
    ms
}) => new Promise(async (resolve, reject) => {
    const videoLogger = createLogger(downFolder);
    await fs.remove(dest) // not supports overwrite..
    ms.update(dest, {
        text : `to be processed by youtube-dl... ${dest.split('/').pop()} Found:${localSizeInBytes}/${remoteSizeInBytes}`,
        color: 'blue'
    });
    // console.log(`to be processed by youtube-dl... ${dest.split('/').pop()} Found:${localSizeInBytes}/${remoteSizeInBytes}`)
    const youtubeDlWrap = new youtubedl()
    let youtubeDlEventEmitter = youtubeDlWrap
        .exec([url, "-o", path.toNamespacedPath(dest)])
        .on("progress", (progress) => {
            ms.update(dest, { text: `${index}. Downloading: ${progress.percent}% of ${progress.totalSize} at ${progress.currentSpeed} in ${progress.eta} | ${dest.split('/').pop()} Found:${localSizeInBytes}/${remoteSizeInBytes}` })
        })
        // .on("youtubeDlEvent", (eventType, eventData) => console.log(eventType, eventData))
        .on("error", (error) => {
            ms.remove(dest, { text: error })
            console.log('error--', error)
            //ms.remove(dest);
            fs.unlink(dest, (err) => {
                reject(error);
            });

        })
        .on("close", () => {
            // ms.succeed(dest, { text: `${index}. End download ytdl: ${dest} Found:${localSizeInBytes}/${remoteSizeInBytes} - Size:${formatBytes(getFilesizeInBytes(dest))}` })//.split('/').pop()
            ms.remove(dest);
            console.log(`${index}. End download ytdl: ${dest} compare L/R:${localSizeInBytes}/${remoteSizeInBytes} - Local in bytes:${formatBytes(getFilesizeInBytes(dest))}`.blue);
            videoLogger.write(`${dest} Size:${getFilesizeInBytes(dest)}\n`);
            resolve()
        })

});

const downloadVideo = async (url, dest, {
    localSizeInBytes,
    remoteSizeInBytes,
    downFolder,
    index = 0,
    ms
}) => {
    try {
        await pRetry(
            () => download(url, dest,
                {
                    localSizeInBytes,
                    remoteSizeInBytes,
                    downFolder,
                    index,
                    ms
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
        console.log('eeee', e);
        ms.remove(dest, { text: `Issue with downloading` });
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
module.exports = async (url, dest, { downFolder, index, ms } = {}) => {
    url = encodeURI(url)
    //const dest = path.join(downloadFolder, course.title)

    ms.add(dest, { text: `Checking if video is downloaded: ${dest.split('/').pop()}` });
    // console.log(`Checking if video is downloaded: ${dest.split('/').pop()}`);
    let isDownloaded = false;
    // let remoteFileSize = await fileSize(url);
    // console.log('---remoteFileSize', remoteFileSize);
    let remoteFileSize = 0;
    try {
        remoteFileSize = await fileSize(url); //await fileSize(encodeURI(url));
    } catch (err) {
        if (err.message === 'Received invalid status code: 404'){
            ms.fail(dest, { text: `${index}. ERROR WITH THE URL ${url}, Error message: ${err.message}` });
            return Promise.resolve();
        }
    }
    let localSize = getFilesizeInBytes(`${dest}`)
    let localSizeInBytes = formatBytes(getFilesizeInBytes(`${dest}`))
    isDownloaded = isCompletelyDownloaded(downFolder, dest)
    // console.log(`Checking ${localSizeInBytes}/${formatBytes(remoteFileSize)} isCompletelyDownloaded: ${isDownloaded} for ${dest}`);
    ms.update(dest, { text: `Checking size over file: ${formatBytes(remoteFileSize)} isCompletelyDownloaded: ${isDownloaded} for ${dest}` });
    // fs.writeFileSync(`${dest}.json`, JSON.stringify(info, null, 2), 'utf8');
    // console.log(`locale/remote comparison:`, localSize , remoteFileSize,  isDownloaded);
    if (remoteFileSize === localSize || isDownloaded) {
        ms.succeed(dest, { text: `${index}. Video already downloaded: ${dest.split('/').pop()} - ${localSizeInBytes}/${formatBytes(remoteFileSize)}` });
        // console.log(`${index}. Video already downloaded: ${dest.split('/').pop()} - ${localSizeInBytes}/${formatBytes(remoteFileSize)}`);
        // ms.remove(dest);
        // console.log(`${index}. Video already downloaded: ${dest.split('/').pop()} - ${localSizeInBytes}/${formatBytes(remoteFileSize)}`.blue);
        // downloadBars.create(100, 100, { eta: 0, filename: dest })
        return;
    } else {
        ms.update(dest, { text: `${index} Start download video: ${dest.split('/').pop()} - ${localSizeInBytes}/${formatBytes(remoteFileSize)} ` });
        // console.log(`${index} Start ytdl download: ${dest.split('/').pop()} - ${localSizeInBytes}/${formatBytes(remoteFileSize)} `);
        return await downloadVideo(url, dest, {
            localSizeInBytes,
            remoteSizeInBytes: formatBytes(remoteFileSize),
            downFolder,
            index,
            ms
        });
    }
}

