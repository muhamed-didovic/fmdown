# Download videos (course) from coursehunter.net for PRO members (also includes the free ones :))

[![npm](https://badgen.net/npm/v/chdown)](https://www.npmjs.com/package/chdown)
[![Hits](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Fmuhamed-didovic%2Ffmdown&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=hits&edge_flat=false)](https://hits.seeyoufarm.com)
[![license](https://flat.badgen.net/github/license/muhamed-didovic/fmdown)](https://github.com/muhamed-didovic/fmdown/blob/master/LICENSE)

## Install
```sh
npm i -g chdown
```

#### without Install
```sh
npx chdown
```

# How to use:

## CLI
```sh
Usage
    $ chdown [CourseUrl|SourceUrl|CategoryUrl]

Options
  --all, -a         Get all courses.
  --email, -e       Your email.
  --password, -p    Your password.
  --directory, -d   Directory to save.
  --type, -t        source|course Type of download.
  --videos, -v      Include videos if available.
  --subtitle, -s    Include subtitles if available.
  --zip, -z         Include archive if available.
  --code, -c        Include code if available.
  --lang, -l        Include courses of certain language ('en', 'ru' or 'both')
  --concurrency, -cc

Examples:
    $ chdown
    $ chdown -a
    $ chdown https://coursehunter.net/course/intermediate-typescript/ -t course
    $ chdown [url] [-e user@gmail.com] [-p password] [-d dirname] [-c number] [-t source]
    $ chdown --all [-e user@mail.com] [-p password] [-t source-or-course] [-d path-to-directory] [-cc concurrency-number]
```


## License
MIT
