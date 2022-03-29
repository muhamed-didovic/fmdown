"use strict";

const cheerio = require("cheerio");
let request = require("request");
const he = require("he");
request = request.defaults({
    jar: true,
});


const getCourseId = ($) => {
    return $('form input[name="course_id"]').attr("value")
};

const getCourseMaterialsUrl = ($) => {
    let urlMaterials = [];
    $('.book-wrap-poster').find('a').map((i, elem) => {
        urlMaterials.push($(elem).attr('href'));
    });
    return urlMaterials
};


const getVideosOld = async (url, token) => {
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
                            result      : lessonsData.map((lesson) => lesson.file),
                            titles      : lessonsData.map((lesson) => {
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

const getVideos = async (course) => {
    let episodes = course.chapters.map((url, i) => {
        return { url, title: course.names[i] }
    });

    return { episodes, data: course };
}

module.exports = getVideos;
