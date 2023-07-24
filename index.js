#! /usr/bin/env node

"use strict";
// require('app-module-path').addPath(__dirname);
const coursehunters = require("./coursehunters");

(async () => {
    const [{ MultiProgressBars }] = await Promise.all([
        import("multi-progress-bars"),
    ]);

    const mpb = new MultiProgressBars({
        initMessage: " CourseHunter ",
        anchor: "bottm", //"top"
        persist: true,
        progressWidth: 40,
        numCrawlers: 7,
        border: true,
    });

    let options = await coursehunters.prompt();
    //console.log('options', options);

    //download courses
    await coursehunters.run({ ...options, mpb });
})();
