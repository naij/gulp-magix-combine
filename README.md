# gulp-magix-combine

> Magix 应用view代码压缩工具

[![NPM version](https://img.shields.io/badge/npm-v1.0.0-orange.svg)](https://www.npmjs.org/package/gulp-magix-combine)

## Installation

```sh
npm install gulp-magix-combine
```

## Usage

```javascript
var combine = require('gulp-magix-combine');

gulp.task('compress', function() {
    gulp.src('./app/views/**/*.js')
        .pipe(combine({
            magixVersion: 2.0
        }))
        .pipe(gulp.dest('./build/app/views'))
        .pipe(rename(function (path) {
            path.basename += "-min";
        }))
        .pipe(uglify({
            output:{ascii_only:true}
        }))
        .pipe(gulp.dest('./build/app/views'))
})
```

## Options

- `magixVersion`
    
    默认为1.0，使用Magix 1.0的view拼接方式
    如果使用1.0以上版本的Magix，必须指定magixVersion为2.0

