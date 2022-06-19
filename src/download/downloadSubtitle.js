const YoutubeDlWrap = require("youtube-dl-wrap")
const Promise = require("bluebird");
const path = require("path");

const download = async ({ url, dest }) => {
    try  {
        const youtubeDlWrap = new YoutubeDlWrap()
        return await youtubeDlWrap.execPromise([url, "-o", path.toNamespacedPath(dest)]);
    } catch (e) {
        console.log('Error downloading subtitle', e);
    }
};

const downloadSubtitle = async ({ subtitle, dest }) => {
    // let videoName = sanitize(video.title.replace('Урок ', '').replace('\\', ''));
    //const subtitleUrl = video.url.replace('.mp4', '.srt')
    // console.log('subtitleUrl', subtitleUrl);
    // ms.add(subtitleUrl, { text: `Checking if subtitle is downloaded: ${videoName}` });
    return await download({
        url: subtitle,//.vtt
        dest
    });

}

module.exports = downloadSubtitle
