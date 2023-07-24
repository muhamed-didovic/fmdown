// @ts-check
const fileSize = require('promisify-remote-file-size')
const { formatBytes } = require('./writeWaitingInfo');
const { createLogger, isCompletelyDownloaded } = require('./fileChecker');
const path = require('path')
const fs = require('fs-extra')
const Promise = require('bluebird')
const youtubedl = require("youtube-dl-wrap")
const colors = require('colors');

// const { MultiProgressBars } = require('multi-progress-bars');
// const mpb = new MultiProgressBars({
//     initMessage: ' CourseHunter ',
//     anchor: "top",
//     persist: true,
//     progressWidth: 40,
//     numCrawlers: 7,
//     border: true,
// });

const getFilesizeInBytes = filename => {
    return fs.existsSync(filename) ? fs.statSync(filename)["size"] : 0;
};

/**
 * Retries the given function until it succeeds given a number of retries and an interval between them. They are set
 * by default to retry 5 times with 1sec in between. There's also a flag to make the cooldown time exponential
 * @author Daniel Iñigo <danielinigobanos@gmail.com>
 * @param {Function} fn - Returns a promise
 * @param {Number} retriesLeft - Number of retries. If -1 will keep retrying
 * @param {Number} interval - Millis between retries. If exponential set to true will be doubled each retry
 * @param {Boolean} exponential - Flag for exponential back-off mode
 * @return {Promise<*>}
 */
async function retry(fn, retriesLeft = 5, interval = 1000, exponential = false) {
    try {
        const val = await fn();
        return val;
    } catch (error) {
        if (retriesLeft) {
            console.log('.... p-cluster retrying left (' + retriesLeft + ')');
            console.log('retrying err', error);
            await new Promise(r => setTimeout(r, interval));
            return retry(fn, retriesLeft - 1, exponential ? interval*2 : interval, exponential);
        } else {
            console.log('Max retries reached');
            throw error
            //throw new Error('Max retries reached');
        }
    }
}

const download = (url, dest, {
    localSizeInBytes,
    remoteSizeInBytes,
    downFolder,
    index = 0,
    mpb
    // m
}) => new Promise(async (resolve, reject) => {
    const videoLogger = createLogger(downFolder);
    await fs.remove(dest) // not supports overwrite..
    // console.log(`to be processed by youtube-dl... ${dest.split('/').pop()} Found:${localSizeInBytes}/${remoteSizeInBytes}`)

    return await retry(async () => {//return
        const youtubeDlWrap = new youtubedl()
        let youtubeDlEventEmitter = youtubeDlWrap
            .exec([url, "--socket-timeout", "15", "-o", dest])//"-R", "infinte", //path.toNamespacedPath(dest)
            .on("progress", (progress) => {
                // m.update(progress.percent, {
                //     filename: dest.split('/').pop(),
                //     l       : localSizeInBytes,
                //     r       : remoteSizeInBytes,
                //     eta     : progress.eta,
                //     total   : progress.totalSize,
                //     speed   : progress.currentSpeed
                // })
                mpb.updateTask(dest.split('/').pop(), {percentage: progress.percent / 100});
            })
            // .on("youtubeDlEvent", (eventType, eventData) => console.log(eventType, eventData))
            .on("error", (error) => {
                // m.stop()
                mpb.done(dest.split('/').pop(), { message: `Error happend while downloading ${index} - ${dest}` });
                console.log('error--', error)
                /*fs.unlink(dest, (err) => {
                    reject(error);
                });*/
                reject(error);

            })
            .on("close", () => {
                mpb.done(dest.split('/').pop(), { message: `${index} - ${dest} - Downloaded successfully.` });
                setTimeout(() => mpb.removeTask(dest.split('/').pop()), 3000);
                // mpb.removeTask(dest.split('/').pop())
                // m.stop()
                // console.log(`${index}. End download ytdl: ${dest} compare L/R:${localSizeInBytes}/${remoteSizeInBytes} - Local in bytes:${formatBytes(getFilesizeInBytes(dest))}`.blue);
                videoLogger.write(`${dest} Size:${getFilesizeInBytes(dest)}\n`);
                resolve()
            })

    }, 6, 2e3, true)
});

/**
 * @param url
 * @param {import("fs").PathLike} dest
 * @param downFolder
 * @param index
 * @param ms
 */
module.exports = async ({ url, dest, downFolder, index, mpb } = {}) => {//, multibar
    url = encodeURI(url)
    //const dest = path.join(downloadFolder, course.title)
    mpb.addTask(dest.split('/').pop(), {type: "percentage", message: `${index} - ${dest}`});
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
        mpb.done(dest.split('/').pop(), { message: `${index} - ${dest} - Resource already downloaded.` });
        setTimeout(() => mpb.removeTask(dest.split('/').pop()), 3000);
        // console.log(`${index}. Resource already downloaded: ${dest.split('/').pop()} - ${localSizeInBytes}/${formatBytes(remoteFileSize)}`.blue);
        return new Promise.resolve().delay(100)
    } else {
        //const m = multibar.create(100, 0);
        // mpb.addTask(chapter.name, { type: "percentage", message: `${chapter.number} - ${course.title}` });
        // mpb.addTask(dest, {type: "percentage", message: `${index} - ${url}`});
        return await download(url, dest, {
            localSizeInBytes,
            remoteSizeInBytes: formatBytes(remoteFileSize),
            downFolder,
            index,
            mpb
            // m
        });
    }
}

