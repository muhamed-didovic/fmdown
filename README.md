# Download videos (course) from coursehunter.net
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
    $ chdown <?CourseUrl|SourceUrl>

Options
      --email, -e   Your email.
      --password, -p    Your password.
      --directory, -d   Directory to save.
      --type, -t  source|course Type of download.

    Examples
      $ ch
      $ ch https://coursehunter.net/course/intermediate-typescript/ -t course
      $ ch -e user@gmail.com -p password -d path-to-directory -t source
```


## License
MIT
