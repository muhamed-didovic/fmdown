"use strict";
require('app-module-path').addPath(__dirname)
const Promise = require('bluebird')
const path = require("path")
const he = require("he")
const fs = require("fs-extra")
const prompts = require("prompts")
const isValidPath = require("is-valid-path")
const meow = require("meow")

const getVideos = require("src/download/getVideos.js")
const downloadAllMaterials = require("src/download/downloadMaterials")
const downloadSubtitle = require("./src/download/downloadSubtitle")
const downOverYoutubeDL = require("src/download/downOverYoutubeDL")
const getToken = require("src/download/getToken")

const Spinnies = require('dreidels')
const fileSize = require("./src/download/fileSize");
const { formatBytes } = require("./src/download/writeWaitingInfo");
const ms = new Spinnies()

// const downloadVideos = require("src/download/downloadVideos")
// const createFolder = require("src/create/createFolder")


const getLastSegment = url => {
  let parts = url.split('/');
  return parts.pop() || parts.pop(); // handle potential trailing slash
};

const getVideosFromFile = async ({
  json,
  course,
  index,
  token,
  downDir,
  fileName,
  code,
  zip,
  concurrency,
  subtitle,
  videos
}) => {
  if (course?.done === true) {
    return;
  }

  const courseUrl = course?.url;
  let downloadFolder = path.join(downDir, getLastSegment(courseUrl));
  fs.ensureDir(downloadFolder)

  // let source;
  return Promise
    .resolve(course)
    .then(async course => await getVideos(course))

    /*
    .getVideos(course)
    .then(async data => {
      source = data;
      let episodes = data.result.map((url, i) => {
        const title = he.decode(data.titles[i].toString());//.replace(/[^A-Za-zА-Яа-я\d\s]/gmi, ''); // alelov
        data.titles[i] = title;
        return { url, title }
      });
      return { episodes, data }
    })*/
    .then(async ({ episodes, data }) => {
      //download subtitles
      if (subtitle) {
        let cnt = 0
        await Promise.map(episodes, async (video, index) => {
          await downloadSubtitle({ video, downloadFolder: path.join(downloadFolder, `${course.title}.srt`), ms })
          cnt++
        }, {
          concurrency// : 1
        })
        ms.stopAll();
      }
      return { episodes, data }
    })
    .then(async ({ episodes, data }) => {
      // console.log('episodes', episodes);
      // await downloadVideos(episodes, downloadFolder, concurrency, subtitle);

      /*if (data.done) {
        console.log('Course is downloaded:', data.title);
        return data;
      }*/
      if (videos) {
        await Promise.map(episodes, async (course, index) => {
          await downOverYoutubeDL(course.url, path.join(downloadFolder, (`${course.title}.mp4`).replace('/', '\u2215')), {
            downFolder: downloadFolder,
            index,
            ms
          })

        }, {
          concurrency// : 1
        })
      }
      ms.stopAll();
      return data;
    })
    .then(async data => {
      /*if (data.urlMaterials.length > 0) {
        // console.log('Start download materials, please wait...');
        await downloadAllMaterials({ urls: data.urlMaterials, downloadFolder, code, zip, concurrency });
      }*/
      if (data.urlMaterials.length > 0) {
        // console.log('downloadFolder', downloadFolder);
        await Promise.map(data.urlMaterials, async (url, index) => {
          let materialsName = url.split('/');
          materialsName = (materialsName.includes('materials') ? 'code-' : '') + materialsName[materialsName.length - 1];

          // let file = path.join(dest, materialsName).replace('/', '\u2215')
          //ms.add(url, { text: `Checking if material is downloaded: ${materialsName}` });
          if ((!code && materialsName.includes('code'))
            || (!zip && !materialsName.includes('code'))) {
            console.log('skipping materials');
            //ms.succeed(url, { text: `Material is skipped: ${materialsName}` });
            return;
          } else {
            // ms.remove(url)
          }
          return await downOverYoutubeDL(url, path.join(downloadFolder, materialsName), {
            downFolder: downloadFolder,
            index,
            ms
          })
        }, {
          concurrency//: 10
        })
      }

      json.courses[index].done = true;
      fs.writeFileSync(fileName, JSON.stringify(json.courses, null, 2), 'utf8');
      // console.log('COURSE INDEX:', index, json.courses[index].url, 'filename', fileName);
      return data;
    })
};

//const logger = ora()
const run = async ({ json, fileName, email, password, downDir, code, zip, concurrency, subtitle, videos }) => {
  Promise
    .resolve()
    .then(() => {
      return getToken(email, password);
    })
    .then(async token => {
      return Promise.each(json.courses, (course, index) => getVideosFromFile({
        json,
        course,
        index,
        token,
        downDir,
        fileName,
        code,
        zip,
        concurrency,
        subtitle,
        videos
      }))

      /*await Promise.map(json.courses, async (course, index) => {
        let cnt = 0
        await getVideosFromFile({json, course, index, token, downDir, fileName, code, zip})
        console.log(`DONE - downloaded videos: ${cnt}`);
      }, {
        concurrency: 10
      })*/
    })
    .then(() => {
      console.log("Done!")
    })
    .catch(rejection => {
      //console.error('course url', course.url);
      console.error("Catch::: ", rejection);
    });
};


const cli = meow(`
  Usage
    $ chdown <?courseUrl>
  
  Options
    --email, -e 
    --password, -p
    --directory, -d
    --type, -t  source|course
    --code, -c 
    --zip, -z
    --concurrency, -c
    --subtitle, -s    Download subtitles if available.
    
  Examples
    $ chdown
    $ chdown https://coursehunter.net/source/laraveldaily-com [-e user@gmail.com] [-p password]
    $ chdown --all [-e user@mail.com] [-p password] [-t source-or-course] [-d path-to-directory] [-cc concurrency-number]`, {
  flags: {
    email      : { type: 'string', alias: 'e' },
    password   : { type: 'string', alias: 'p' },
    directory  : { type: 'string', alias: 'd' },
    type       : { type: 'string', alias: 't' },
    code       : { type: 'boolean', alias: 'c', default: true },
    zip        : { type: 'boolean', alias: 'z', default: false },
    concurrency: { type: 'number', alias: 'c', default: 10 },
    subtitle   : { type: 'boolean', alias: 's', default: false },
  }
})

/**
 * @param {Omit<import('prompts').PromptObject, 'name'>} question
 */
async function askOrExit(question) {
  const res = await prompts({ name: 'value', ...question }, { onCancel: () => process.exit(1) })
  return res.value
}

const folderContents = async (folder) => {
  const options = [];
  await fs.readdir(folder, function (err, files) {
    //handling error
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    }
    //listing all files using forEach
    files.forEach(function (file) {
      options.push({
        title: file,
        value: path.join(folder, file)
      });
    });
  });
  return options;
}

async function prompt({
  url = '',
  email = '',
  password = '',
  downDir = '',
  type = '',
  code = '',
  zip = '',
  subtitle = ''
}) {
  const fileChoices = await folderContents(path.resolve(process.cwd(), 'json'))
  const file = await askOrExit({
    type   : 'confirm',
    message: 'Do you want download from a file',
    initial: false
  })

  const filePath = await askOrExit({
    type    : file ? 'autocomplete' : null,
    message : `Enter a file path eg: ${path.resolve(process.cwd(), 'json/*.json')} `,
    choices : fileChoices,
    validate: isValidPath
  })

  return {
    ...(filePath && { courses: require(filePath) }),
    ...(filePath && { fileName: path.resolve(filePath) })
  };
  /*const { flags, input } = cli

  flags.directory = downDir;
  flags.subtitle = subtitle;

  if (url) {
    input.push(url)
  }

  if (input.length === 0) {
    input.push(await askOrExit({
      type: 'text',
      // name    : 'file',
      message: `Enter a reference file to scrape from (eg: ${path.resolve(process.cwd())}): `,
      // initial: path.resolve(process.cwd()),
      initial: './frontendmasters.json'
      // validate: value => value.includes('coursehunter.net') ? true : 'Url is not valid'
    }))
  }

  email = flags.email || await askOrExit({
    type    : 'text',
    message : 'Enter email',
    validate: value => value.length < 5 ? `Sorry, enter correct email` : true
  })

  password = flags.password || await askOrExit({
    type    : 'text',
    message : 'Enter password',
    validate: value => value.length < 5 ? `Sorry, password must be longer` : true
  })

  downDir = flags.directory || path.resolve(await askOrExit({
    type   : 'text',
    message: `Enter a directory to save (eg: ${path.resolve(process.cwd())})`,
    // initial: path.resolve(process.cwd()),
    initial : path.resolve(process.cwd(), 'videos/'),
    validate: isValidPath
  }))

  code = await askOrExit({
    type    : 'toggle',
    name    : 'value',
    message : 'Download code if it exists?',
    initial : flags.code,
    active  : 'yes',
    inactive: 'no'
  })

  zip = await askOrExit({
    type    : 'toggle',
    name    : 'value',
    message : 'Download archive of the course if it exists?',
    initial : flags.zip,
    active  : 'yes',
    inactive: 'no'
  })

  /!*subtitle = flags.subtitle || await askOrExit({
    type: 'toggle',
    name: 'value',
    message: 'Download subtitles of the course if it exists?',
    initial: flags.subtitle ? 'yes' : 'no',
    active: 'yes',
    inactive: 'no'
  })*!/

  const concurrency = flags.concurrency || await askOrExit({
    type   : 'number',
    message: `Enter concurrency`,
    initial: 10
  })

  return { url: input[0], email, password, downDir, type, code, zip, subtitle, concurrency };*/
}

/**
 * @description
 * get file name from path
 * @param {string} path path to get file name
 * @returns {string} file name
 * @example
 * getFileName('getFileName/index.js') // => index.js
 */
const getFileName = path => path.replace(/^.*[\\\/]/, '');

const coursehunters = async () => {

  const { input, email, password, downDir, code, zip, concurrency } = await prompt();
  const json = require(input[0]);
  if (json?.courses.length > 0) {
    await run({ json, email, password, downDir, fileName: getFileName(input[0]) });
  }
}

module.exports = {
  coursehunters,
  run,
  prompt
}
