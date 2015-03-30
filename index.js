var fs       = require('fs');
var Path     = require('path');
var through2 = require('through2');
var gutil    = require('gulp-util');
var defaults = require('lodash.defaults');
var mtmin    = require('./lib/mtmin');
var jsProc   = require('./lib/jsproc');
var Error    = gutil.PluginError;

function parsePath(path) {
  var extname = Path.extname(path);

  return {
    dirname: Path.dirname(path),
    basename: Path.basename(path, extname),
    extname: extname
  };
}

function combine(js, html, v) {
  var newViewContent = '';
  var minTempContent = mtmin(html);
  newViewContent = jsProc.removeConsoleX(js);

  if (v == 1.0) {
    newViewContent = jsProc.addProp4v1(newViewContent, minTempContent);
  } else if (v == 1.1 || v == 1.2) {
    newViewContent = jsProc.addProp4v1plus(newViewContent, minTempContent);
  } else if (v == 2.0) {
    newViewContent = jsProc.addProp4v2(newViewContent, minTempContent);
  }
  
  return newViewContent;
}

module.exports = function (options) {
  options = defaults(options || {}, {
    magixVersion: 1.0
  });

  return through2.obj(function(file, enc, cb) {
    var jsStr = file.contents.toString('utf8');
    var parsedPath = parsePath(file.relative);
    var htmlPath = Path.join(parsedPath.dirname, parsedPath.basename + '.html');
    htmlPath = Path.join(file.base, htmlPath);

    fs.readFile(htmlPath, function (err, data) {
      if (err) {
        var notfound = ['ENOENT', 'ENAMETOOLONG', 'ENOTDIR'];
        // js对应的html没有找到，不处理，直接跳过
        if (~notfound.indexOf(err.code)) {
          return cb(null, file);
        } else {
          return cb(new Error('gulp-magix-combine', err.message));
        }
      }

      var htmlStr = data.toString('utf8');

      file.contents = new Buffer(combine(jsStr, htmlStr, options.magixVersion));

      cb(null, file);
    });
  });
}