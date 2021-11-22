"use strict";
require('app-module-path').addPath(__dirname);

const { coursehunters } = require('./coursehunters.js')
// const getToken = require("./src/download/getToken")

/*(async () => {
  await coursehunters()
})()*/

coursehunters()
