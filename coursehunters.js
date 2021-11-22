"use strict";
require('app-module-path').addPath(__dirname);
const Promise = require('bluebird');
const path = require("path");
const createFolder = require("src/create/createFolder");
const createLogger = require("src/create/createLogger");
const getVideos = require("src/download/getVideos.js");
const he = require("he");
const downloadAllMaterials = require("src/download/downloadMaterials");
const downloadVideos = require("src/download/downloadVideos");
const colors = require('colors');
const request = require("request");
const fs = require("fs-extra");
const progress = require("request-progress");
const { writeWaitingInfo } = require("src/download/writeWaitingInfo");
const cleanLine = require("src/download/cleanLine");
const getToken = require("./src/download/getToken");

// const c = require('./frontendmasters.json')
const ora = require("ora");
const prompts = require("prompts");
const isValidPath = require("is-valid-path");
const meow = require("meow");

const getLastSegment = url => {
  let parts = url.split('/');
  return parts.pop() || parts.pop(); // handle potential trailing slash
};
const getLessonNumbers = lessonsString => {
  let lessonNumbers = [];
  const regExpComma = /\s*,\s*/,
        regExpDash  = /\s*-\s*/,
        lessonList  = lessonsString.split(regExpComma);
  for (let item of lessonList) {
    const dashCounter = (item.match(/-/g) || []).length;
    if (dashCounter === 1) {
      const periodList = item.split(regExpDash);
      let firstNumber = Number(periodList[0]),
          lastNumber  = Number(periodList[1]),
          buf         = 0;
      if (firstNumber > lastNumber) {
        buf = firstNumber;
        firstNumber = lastNumber;
        lastNumber = buf;
      }
      for (let i = firstNumber; i <= lastNumber; i++) {
        lessonNumbers.push(i);
      }
    } else if (dashCounter === 0) {
      lessonNumbers.push(Number(item));
    }
  }
  lessonNumbers = lessonNumbers
    .sort(function (a, b) {
      return a - b;
    })
    .filter(function (value, index, self) {
      return self.indexOf(value) === index;
    });
  return lessonNumbers;
};
const getVideosFromFile = async (json, course, index, token, downDir) => {

  if (course?.done === true) {
    return;
  }

  const courseUrl = course?.url;
  let downloadFolder = downDir + path.sep + getLastSegment(courseUrl);
  console.log('downloadFolder', downloadFolder);
  createFolder(downloadFolder);

  const logger = await createLogger(downloadFolder);

  const lessonNumbers = null;//getLessonNumbers(0);
  console.log('lessonNumbers', lessonNumbers);
  /*const videos = course.chapters.map((url, i) => {
    const name = he.decode(course.names[i].toString());//.replace(/[^A-Za-zА-Яа-я\d\s]/gmi, ''); // alelov
    //console.log('name', name);
    //data.names[i] = name;
    return { url, name };
  });*/

  /*if (course.materials.length > 0) {
    console.log('Start download materials, please wait...', course.materials);
    await downloadAllMaterials(course.materials, downloadFolder);
  }*/
  // console.log('Start download videos, please wait...');
  // await downloadVideos(logger, videos, downloadFolder, lessonNumbers);
  //
  // return course;
  const videos = [];
  return await getVideos(courseUrl, token)
    .then(async data => {
      console.log('1DATA', data);
      data.result.map((url, i) => {
        const name = he.decode(data.names[i].toString());//.replace(/[^A-Za-zА-Яа-я\d\s]/gmi, ''); // alelov
        //console.log('name', name);
        data.names[i] = name;
        videos.push({ url, name });
      });

      return data
    })
    .then(async data => {

      console.log('Start download videos, please wait...');
      await downloadVideos(logger, videos, downloadFolder, lessonNumbers);
      console.log('COURSE INDEX:', index, json.courses[index].url);
      json.courses[index].done = true;
      fs.writeFileSync('frontendmasters.json', JSON.stringify(json, null, 2), 'utf8');
      return data;
    })
    .then(async data => {
      // if (data.urlMaterials.length > 0) {
      //   console.log('Start download materials, please wait...');
      //   await downloadAllMaterials(data.urlMaterials, downloadFolder);
      // }

      return data;
    })
};

const logger = ora()
const ask = async config => await prompts(config, { onCancel: () => logger.fail('plz answer..') && process.exit() });
const run = async ({json, email, password, downDir}) => {
  Promise
    .resolve()
    .then(() => {
      return getToken(email, password);
    })
    .then(token => {
      console.log('TOKEN', token);
      return Promise.each(json.courses, (course, index) => getVideosFromFile(json, course, index, token, downDir))
    })
    .then(result => {
      console.log("Done!")
      console.log(result);
    })
    .catch(rejection => {
      console.error("Catch: ", rejection);
    });
};


const cli = meow(`
    Usage
      $ coursehunters <?courseUrl>

    Options
      --email, -e 
      --password, -p
      --directory, -d
      --type, -t  source|course
      
    Examples
      $ coursehunters
      $ coursehunters test.json
      $ coursehunters -a -f webm -r high
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
    }
  }
})

/**
 * @param {Omit<import('prompts').PromptObject, 'name'>} question
 */
async function askOrExit(question) {
  const res = await prompts({ name: 'value', ...question }, { onCancel: () => process.exit(1) })
  return res.value
}

async function prompt() {
  const {
          flags,
          input
        } = cli

  if (input.length === 0) {
    input.push(await askOrExit({
      type: 'text',
      message: `Enter a reference file to scrape from (eg: ${path.resolve(process.cwd())}): `,
      // initial: path.resolve(process.cwd()),
      initial: './frontendmasters.json'
      // validate: value => value.includes('coursehunter.net') ? true : 'Url is not valid'
    }))
  }

  const email = flags.email || await askOrExit({
    type: 'text',
    message : 'Enter email',
    initial : 'abhagsain@gmail.com',
    validate: value => value.length < 5 ? `Sorry, enter correct email` : true
  })

  const password = flags.password || await askOrExit({
    type: 'text',
    message : 'Enter password',
    initial : '$munniB@dna@m1$',
    validate: value => value.length < 5 ? `Sorry, password must be longer` : true
  })

  const downDir = flags.directory || path.resolve(await askOrExit({
    type: 'text',
    message: `Enter a directory to save (eg: ${path.resolve(process.cwd())})`,
    // initial: path.resolve(process.cwd()),
    initial : path.resolve(process.cwd(), 'videos/'),
    validate: isValidPath
  }))

  console.log('flags', flags);
  console.log('input', input);

  console.log('etc', { file: input[0], email, password, downDir });
  return { input, email, password, downDir };
}

const coursehunters = async () => {

  const { input, email, password, downDir } = await prompt();
  const json = require(input[0]);
  if (json?.courses.length > 0) {
    await run({ json, email, password, downDir });
  }
}

module.exports = {
  coursehunters,
  run
}
