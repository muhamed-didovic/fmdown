# Download videos (course) from coursehunter.net for PRO members (also includes the free ones :))
[![npm](https://badgen.net/npm/v/chdown)](https://www.npmjs.com/package/chdown)

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
    --email, -e         Your email.
    --password, -p      Your password.
    --directory, -d     Directory to save.
    --type, -t          source|course type of download.
    --code, -c          Option to download code zip
    --zip, -z           Option to download source archive
    --concurrency, -c

Examples:
    $ ch
    $ ch https://coursehunter.net/course/intermediate-typescript/ -t course
    $ ch [url] [-e user@gmail.com] [-p password] [-d dirname] [-c number] [-t source]
```


## License
MIT
