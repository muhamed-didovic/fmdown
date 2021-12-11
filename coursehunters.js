"use strict";
require('app-module-path').addPath(__dirname);
const Promise = require('bluebird');
const path = require("path");
const he = require("he");
// const colors = require('colors');
// const request = require("request");
const fs = require("fs-extra");
// const progress = require("request-progress");
const ora = require("ora");
const prompts = require("prompts");
const isValidPath = require("is-valid-path");
const meow = require("meow");


const createFolder = require("src/create/createFolder");
const getVideos = require("src/download/getVideos.js");
const downloadAllMaterials = require("src/download/downloadMaterials");
const downloadVideos = require("src/download/downloadVideos");
// const { writeWaitingInfo } = require("src/download/writeWaitingInfo");
// const cleanLine = require("src/download/cleanLine");
const getToken = require("src/download/getToken");

const getLastSegment = url => {
  let parts = url.split('/');
  return parts.pop() || parts.pop(); // handle potential trailing slash
};

const getVideosFromFile = async ({json, course, index, token, downDir, fileName, code, zip}) => {
  // console.log('json---', json, 'index', index, 'downDir', downDir, 'fileName', fileName);
  if (course?.done === true) {
    return;
  }

  const courseUrl = course?.url;
  let downloadFolder = downDir + path.sep + getLastSegment(courseUrl);
  console.log('downloadFolder', downloadFolder);
  createFolder(downloadFolder);

  // const logger = await createLogger(downloadFolder);

  //const lessonNumbers = null;//getLessonNumbers(0);

  let source;
  return await getVideos(courseUrl, token)
    .then(async data => {
      // console.log('1DATA', data);
      source = data;
      let videos=  data.result.map((url, i) => {
        const name = he.decode(data.names[i].toString());//.replace(/[^A-Za-zА-Яа-я\d\s]/gmi, ''); // alelov
        //console.log('name', name);
        data.names[i] = name;
        //videos.push({ url, name });
        return { url, name }
      });
      // console.log('data', data);
      return { videos, data }
    })
    .then(async ({videos, data}) => {

      //console.log('Start download videos, please wait...', videos);
      await downloadVideos(logger, videos, downloadFolder);
      console.log('COURSE INDEX:', index, json.courses[index].url, 'filename', fileName);
      json.courses[index].done = true;
      fs.writeFileSync(fileName, JSON.stringify(json, null, 2), 'utf8');
      return data;
    })
    .then(async data => {
      if (data.urlMaterials.length > 0) {
        //console.log('Start download materials, please wait...');
        await downloadAllMaterials({urlMaterials: data.urlMaterials, downloadFolder, code, zip});
      }

      return data;
    })
};

const logger = ora()
const run = async ({ json, email, password, downDir, fileName, code, zip }) => {
  Promise
    .resolve()
    .then(() => {
      return getToken(email, password);
    })
    .then(token => {
      return Promise.each(json.courses, (course, index) => getVideosFromFile({json, course, index, token, downDir, fileName, code, zip}))
    })
    .then(() => {
      console.log("Done!")
    })
    .catch(rejection => {
      console.error("Catch: ", rejection);
    });
};


const cli = meow(`
    Usage
      $ ch <?courseUrl>

    Options
      --email, -e 
      --password, -p
      --directory, -d
      --type, -t  source|course
      --code, -c 
      --zip, -z
      
    Examples
      $ ch
      $ ch test.json
      $ ch -a -f webm -r high
`, {
  flags: {
    email    : {
      type : 'string',
      alias: 'e'
    },
    password : {
      type : 'string',
      alias: 'p'
    },
    directory: {
      type : 'string',
      alias: 'd'
    },
    type     : {
      type : 'string',
      alias: 't'
    },
    code     : {
      type   : 'boolean',
      alias  : 'c',
      default: true
    },
    zip      : {
      type   : 'boolean',
      alias  : 'z',
      default: false
    },
  }
})

/**
 * @param {Omit<import('prompts').PromptObject, 'name'>} question
 */
async function askOrExit(question) {
  const res = await prompts({ name: 'value', ...question }, { onCancel: () => process.exit(1) })
  return res.value
}

async function prompt({
  url = '',
  email = '',
  password = '',
  downDir = '',
  type = '',
  code = '',
  zip = ''
}) {
  const {
          flags,
          input
        } = cli


  flags.directory = downDir;

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
    type: 'toggle',
    name: 'value',
    message: 'Download code if it exists?',
    initial: flags.code,
    active: 'yes',
    inactive: 'no'
  })

  zip = await askOrExit({
    type: 'toggle',
    name: 'value',
    message: 'Download archive of the course if it exists?',
    initial: flags.zip,
    active: 'yes',
    inactive: 'no'
  })

  return { url: input[0], email, password, downDir, type, code, zip };
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

  const { input, email, password, downDir, code, zip } = await prompt();
  console.log('{ input, email, password, downDir, code, zip }', { input, email, password, downDir, code, zip });
  // console.log('file:', require(options.file));
  const json = require(input[0]);
  if (json?.courses.length > 0) {
    //file, email, password, downDir
    await run({ json, email, password, downDir, fileName: getFileName(input[0]) });
  }
}

module.exports = {
  coursehunters,
  run,
  prompt
}
