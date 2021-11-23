'use strict';

const path = require('path');
const fs = require('fs');

const createLogger = async downloadFolder => {
  const logFile =`${downloadFolder}${path.sep}videos.txt`
  fs.existsSync(logFile) ?
    console.log(`File ${logFile} already exists`.blue) :
    console.log(`File ${logFile} created`.blue);
  const logger = fs.createWriteStream(logFile, { flags: 'a' });
  return logger;
};

module.exports = createLogger;
