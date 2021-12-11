#! /usr/bin/env node

'use strict';

require('app-module-path').addPath(__dirname);

// const { fetcher, createFetcher } = require('scraping-ninja-toolkit');
// const fs = require('fs');
// const request = require('request');
// const cheerio = require('cheerio');
// const https = require('https');
// const download = require('download');
const path = require('path');
// const progress = require('request-progress');
// const colors = require('colors');
// const readline = require('readline');
// const Promise = require('bluebird');
// const isValidPath = require('is-valid-path')
// const prompts = require("prompts");
// const ora = require("ora");
// const meow = require("meow");
// const he = require('he');
const scrape = require('ch-scrape');
const coursehunters = require('./coursehunters');
// const logger = ora()

(async () => {

  // const { input, email, password, downDir, type } = await prompt();
  //let r = await startDownloading({ email, password, downDir, type, url: input[0] });

  let inputs = await scrape.prompt();
  let {url, email, password, downDir, type, code, zip} = await coursehunters.prompt(inputs);
  // console.log('{url, email, password, downDir, type, code, zip} ', {url, email, password, downDir, type, code, zip} );
  let json = await scrape.run({ url, email, password, downDir, type })

  //console.log('111RESULT:', json);

  await coursehunters.run({ json, email, password, downDir, fileName: json.fileName, code, zip })
})()

