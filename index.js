#! /usr/bin/env node

'use strict';

require('app-module-path').addPath(__dirname);

const { fetcher, createFetcher } = require('scraping-ninja-toolkit');
const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const https = require('https');
const download = require('download');
const path = require('path');
const progress = require('request-progress');
const colors = require('colors');
const readline = require('readline');
const Promise = require('bluebird');
const isValidPath = require('is-valid-path')
const prompts = require("prompts");
const ora = require("ora");
const meow = require("meow");
const he = require('he');

const validateParams = require('src/validate/validateParams');
const getFlagIndex = require('src/validate/getFlagIndex');
const createFolder = require('src/create/createFolder');
const createLogger = require('src/create/createLogger');
const downloadVideos = require('src/download/downloadVideos');
const downloadAllMaterials = require('src/download/downloadMaterials');
const getVideos = require('src/download/getVideos.js');
const getToken = require('src/download/getToken');
// const courses = require("./frontendmasters20211109T222322916Z.json");
const coursehunters = require('./coursehunters')
const logger = ora()

/*const getLessonNumbers = lessonsString => {
  let lessonNumbers = [];
  const regExpComma = /\s*,\s*!/,
        regExpDash  = /\s*-\s*!/,
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
};*/
const getLastSegment = url => {
  let parts = url.split('/');
  return parts.pop() || parts.pop(); // handle potential trailing slash
};
const runGetVideos = async (url, token) => {
  const courseUrl = url;
  let downloadFolder = 'videos/' + getLastSegment(courseUrl);
  // console.log('downloadFolder', downloadFolder);//'---', path.resolve(process.cwd(), 'videos/')
  await createFolder(downloadFolder);

  // const logger = await createLogger(downloadFolder);
  const videos = [];

  return await getVideos(courseUrl, token)
    .then(data => {
      /*data.result.map((url, i) => {
        //.replace(/[^A-Za-zА-Яа-я\d\s]/gmi, ''); // alelov
        data.names[i] = he.decode(data.names[i].toString());
        // videos.push({ url, name });
      });*/
      /*if (data.urlMaterials.length > 0) {
        downloadAllMaterials(data.urlMaterials, downloadFolder);
      }*/
      // console.log('Start download videos, please wait...', data);
      //downloadVideos(logger, videos, downloadFolder, lessonNumbers);

      return data;
    })
    .catch(err => console.log(`${err}`.red, 'DA VIDIMO', err))
};

const runGetCourses = async (token, downDir, type, url) => {
  // console.log('TOKEN', token);
  let categories;
  let pagesMsg = ora('start gathering data..').start()

  //if url is provided
  if (type === 'course') {
    //pagesMsg.text = 'Scraping for course'
    pagesMsg.succeed('Scraping for course')
    console.log('courseUrl', url);
    let data = await runGetVideos(url, token);
    let course = {};
    if (data?.urlMaterials && data?.urlMaterials.length > 0) {
      course.materials = data.urlMaterials
    }
    if (data?.result && data?.result.length > 0) {
      // const course = allCourses.find(c => c.url === p.location);
      course.chapters = data.result;
      course.names = data.names;
    }
    course.url = url

    return [
      {
        category: 'Single course',
        courses : [course]
      }
    ]
  }

  //if source is provided
  if (type === 'source') {
    pagesMsg.text = 'Scraping for source'
    categories = [
      url
    ];
  } else {
    // Get categories urls
    categories = await fetcher
      .get('https://coursehunter.net')
      .links('.drop-menu-left a')
    ;
    // console.log('ALL CATEGORIES', categories);
    // return;
  }
  // console.log('categories', categories);

  // CATEGORIES [
  //   'https://coursehunter.net/frontend',
  //     'https://coursehunter.net/backend',
  //     'https://coursehunter.net/systemprogramming',
  //     'https://coursehunter.net/marketing',
  //     'https://coursehunter.net/video',
  //     'https://coursehunter.net/graphic',
  //     'https://coursehunter.net/others',
  //     'https://coursehunter.net/mobile-development',
  //     'https://coursehunter.net/gamedev',
  //     'https://coursehunter.net/cms',
  //     'https://coursehunter.net/blockchain',
  //     'https://coursehunter.net/testirovanie-quality-assurance-qa',
  //     'https://coursehunter.net/drugoe'
  //   ]

  // const categories = ['https://coursehunter.net/systemprogramming'];
  // For each category
  // => frontend
  // => backend ...

  // let location;
  const results = await fetcher
    .getAll(categories)
    .map(
      async (fetchNode, index) => {

        // Get all courses from the category in an flat array
        // http://coursehunters.net/frontend?page=1 => 10 courses
        // http://coursehunters.net/frontend?page=1 => 10 courses
        // ....
        //
        // allCourses => [{
        //   title: 'Modern HTML & CSS From The Beginning',
        //   second_title: 'Modern HTML & CSS From The Beginning',
        //   url: 'http://coursehunters.net/course/sovremennyy-html-i-css-s-samogo-nachala'
        // }, ... ]
        const allCourses = await fetchNode
          .paginate('.pagination__a[rel="next"]')
          .flatMap(p => {
              pagesMsg.text = `page: ${p.location}`
              // return;
              //location = p.location;
              return p.scrapeAll('article', {
                //category_name: document.querySelector("body > div:nth-child(6) > div > span:nth-child(2) > a > span").innerText,
                title       : '.course-primary-name@text',
                second_title: '.course-secondary-name@text',
                //url: 'a[itemprop="mainEntityOfPage"]@href'
                url: '.course-figure@data-link'
              });
            }
          );
        pagesMsg.succeed(`completed pages gathering`)
        // console.log('---allCourses', allCourses);
        // const allCourses = [
        //   {
        //     title: 'Modern HTML & CSS From The Beginning',
        //     second_title: 'Modern HTML & CSS From The Beginning',
        //     url: 'https://coursehunter.net/course/c-essential'
        //   }
        // ];

        // return;
        // For each course scrape chapters
        // with a concurrency of 50 queries at the same time
        // and filter "undefined" values (courses without chapters)
        const scrapingMsg = ora('start gathering courses..').start()
        const courses = await createFetcher()
          .getAll(allCourses.map(c => c.url), {
            headers: {
              Cookie: token
            }
          })
          .map(
            async p => {
              scrapingMsg.text = `Scraping url: ${p.location}`

              let data = await runGetVideos(p.location, token);
              // console.log('-->data', data);
              const course = allCourses.find(c => c.url === p.location);

              if (data?.urlMaterials && data?.urlMaterials.length > 0) {
                course.materials = data.urlMaterials
              }
              if (data?.result && data?.result.length > 0) {
                // const course = allCourses.find(c => c.url === p.location);
                course.chapters = data.result;
                course.names = data.names;
                return course;
              }
            },
            { concurrency: 50 }//50
          )
          .filter(c => c);
        scrapingMsg.succeed(`Scraping done`)

        // console.log('courses', courses);
        // console.log('FINAL', categories[index].split('/').pop(), courses);
        let r = {
          category: categories[index].split('/').pop(),
          courses : courses
        }
        //`${downloadFolder}${path.sep}${videoName}.mp4`
        let fileName = categories[index].split('/').pop() + new Date().toISOString().slice(0, 10)
        logger.succeed(`Data gathered to a file: ${downDir}${path.sep}${fileName}.json`);
        fs.writeFileSync(`${downDir}${path.sep}${fileName}.json`, JSON.stringify(r, null, 2), 'utf8');
        return r;
      },
      { resolvePromise: false, concurrency: 6 }//6
    );

  return results;
  // fs.writeFileSync('courses' + (new Date()).toISOString().replace(/[^\w]/g, "") +  ' .json', JSON.stringify(results, null, 2), 'utf8');
};

const startDownloading = async ({ email, password, downDir, type, url }) => {
  if (email && password) {
    // with email and password
    return getToken(email, password)
      // .then(token => runGetVideos(token))
      .then(token => runGetCourses(token, downDir, type, url))
      .catch(err => console.log('Check your email or password'.red, err));
  } else {
    console.error('NO LOGIN');
    // without email and password
    //runGetVideos();
  }
};

const cli = meow(`
    Usage
      $ ch <?courseUrl>

    Options
      --email, -e 
      --password, -p
      --directory, -d
      --type, -t  source|course
      
    Examples
      $ ch
      $ ch https://coursehunter.net/course/intermediate-typescript/
      $ ch -e user@gmail.com -p password -d path-to-directory -t source`,
  {
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
      // name    : 'url',
      message: 'Enter url for download.',
      initial: 'https://coursehunter.net/source/frontendmasters',
      //validate: str => !!str.match(COURSE_ID_RE)
      validate: value => value.includes('coursehunter.net') ? true : 'Url is not valid'
    }))
  }

  const email = flags.email || await askOrExit({
    type: 'text',
    //name    : 'email',
    message : 'Enter email',
    validate: value => value.length < 5 ? `Sorry, enter correct email` : true
  })

  const password = flags.password || await askOrExit({
    type: 'text',
    // name    : 'password',
    message : 'Enter password',
    validate: value => value.length < 5 ? `Sorry, password must be longer` : true
  })

  const downDir = flags.directory || path.resolve(await askOrExit({
    type: 'text',
    // name   : 'downDir',
    message: `Enter a directory to save (eg: ${path.resolve(process.cwd())})`,
    initial: path.resolve(process.cwd()),
    // initial: path.resolve(process.cwd(), 'videos/'),
    validate: isValidPath
  }))

  const type = ['source', 'course'].includes(flags.type)
    ? flags.type
    : await askOrExit({
      type   : 'select',
      message: 'What do you want to download: course or source.',
      choices: [
        {
          title: 'source',
          value: 'source'
        },
        {
          title: 'course',
          value: 'course'
        }
      ],
      initial: 0
    })

  // console.log('flags', flags);
  // console.log('input', input);
  return { input, email, password, downDir, type };
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

(async () => {

  const { input, email, password, downDir, type } = await prompt();

  // console.log('etc', { email, password, downDir, type, url: input[0] });
  let r = await startDownloading({ email, password, downDir, type, url: input[0] });
  //if (r.length > 0) {
  console.log('111RESULT:', r);
  let json = {};// = type === 'course' ? json.courses = [r] : r[0];
  // if (type === 'course') {
  //   json['courses'] = [r]
  // } else {
  json = r[0]
  //}
  await coursehunters.run({ json, email, password, downDir, fileName: getFileName(input[0]) })
  //}

})()

