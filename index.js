#! /usr/bin/env node

'use strict';
// require('app-module-path').addPath(__dirname);
const coursehunters = require('./coursehunters');

(async () => {
  let options = await coursehunters.prompt();
  //console.log('options', options);

  //download courses
  await coursehunters.run(options)
})()

