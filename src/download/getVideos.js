"use strict";

const cheerio = require("cheerio");
let request = require("request");
request = request.defaults({
  jar: true,
});

const videoMaterialScriptContainerSelector = ".main-content script:nth-of-type(3)";

const getCourseId = ($) => {
  // console.log('da vidmo', $('form input[name="course_id"]').attr("value"));
  return $('form input[name="course_id"]').attr("value")
  // const lessonsScriptContainer = $(videoMaterialScriptContainerSelector);
  // console.log('lessonsScriptContainer.get()', lessonsScriptContainer.get());
  // if (lessonsScriptContainer.get().length) {
  //   const lessonsScriptCode = lessonsScriptContainer.get()[0].children[0].data;
  //
  //   const courseId = lessonsScriptCode
  //     .replace(/\s/g, "")
  //     .match(/axios.get\('\/course\/(\d+)\/lessons'\)/g)[0]
  //     .match(/\d+/)[0];
  //
  //   return courseId;
  // } else {
  //   return null;
  // }
};

const courseMaterialsAnchorSelector = ".book-wrap-poster a:nth-of-type(2)";
const getCourseMaterialsUrl = ($) => {
  let urlMaterials = [];
  $('.book-wrap-poster').find('a').map((i, elem) => {
    // console.log('iii', i, 'elem:', $(elem).attr('href'));
    urlMaterials.push($(elem).attr('href'));
    // return $(elem).attr('href')
  });
  return urlMaterials
  // const materialsAnchorEl = $(courseMaterialsAnchorSelector);
  // return materialsAnchorEl.get()[0]?.attribs.href;
};

const getVideos = async (url, token) => {
  const options = { url };
  if (token) {
    const cookie = request.cookie(token);
    options.headers = {
      Cookie: cookie,
    };
  }
  return new Promise((resolve, reject) => {
    request(options, async function (err, res, html) {
      if (!err) {
        let $ = cheerio.load(html);
        const courseId = getCourseId($);

        if (!courseId) {
          console.log(
            "\nPlease check the course url or This course is only available to premium users!"
              .red
          );
          console.log("Try using credentials!".red);
          return;
        }

        const options = {
          url: `https://coursehunter.net/course/${courseId}/lessons`,
        };

        if (token) {
          const cookie = request.cookie(token);
          options.headers = {
            Cookie: cookie,
          };
        }

        request(options, function (err, res) {
          if (!err) {
            const lessonsData = JSON.parse(res.body);
            // console.log('etCourseMaterialsUrl($)', getCourseMaterialsUrl($));
            resolve({
              result: lessonsData.map((lesson) => lesson.file),
              titles: lessonsData.map((lesson) => {
                const str = lesson.title.replace(
                  /\s\|\s\d{2}:\d{2}:\d{2}/g,
                  ""
                );
                const match = str.match(/\d+\.\s.*/g);
                if (match && match.length) {
                  return match[0];
                }

                return str;
              }),
              urlMaterials: getCourseMaterialsUrl($),
            });
          }
        });
      } else {
        reject(err);
      }
    });
  });
};

module.exports = getVideos;
