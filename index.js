#! /usr/bin/env node

'use strict';

require('app-module-path').addPath(__dirname);

const scrape = require('ch-scrape');
const coursehunters = require('./coursehunters');

(async () => {
  //get input from ch-scrape
  let inputs = await scrape.prompt();

  //get additional flags for user input
  let {url, email, password, downDir, type, code, zip, concurrency, subtitle} = await coursehunters.prompt(inputs);

  //get courses in json from ch-scrape package
  let json = await scrape.run({ url, email, password, downDir, type })

  //download courses
  await coursehunters.run({ json, email, password, downDir, fileName: json.fileName, code, zip, concurrency, subtitle })
})()

