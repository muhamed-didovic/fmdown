'use strict';

const path = require('path');
const fs = require('fs');
const ora = require("ora");


const createLogger = async downloadFolder => {
  const msg = ora('Checking logger..').start()
  const logFile =`${downloadFolder}${path.sep}videos.txt`
  fs.existsSync(logFile) ?
    msg.fail(`File ${logFile} already exists`) :
    msg.succeed()`File ${logFile} created)`;
  const logger = fs.createWriteStream(logFile, { flags: 'a' });
  return logger;
};

module.exports = createLogger;
