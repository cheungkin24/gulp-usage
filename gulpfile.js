var gulp = require('gulp'),
  concat = require('gulp-concat'),
  watch = require('gulp-watch'),
  clean = require('gulp-clean'),
  minifyCss = require('gulp-minify-css'),
  wrap = require('gulp-wrapper'),
  base64 = require('gulp-base64'),
  rename = require('gulp-rename'),
  obfuscate = require('gulp-obfuscate'),
  scss = require('gulp-sass'),
  htmlmin = require('gulp-htmlmin'),
  autoprefixer = require('gulp-autoprefixer'),
  merge = require('merge-stream'),
  connect = require('gulp-connect'),
  babel = require('gulp-babel'),
  uglify = require('gulp-uglify'),
  es2015 = require('babel-preset-es2015'),
  fs = require('fs'),
  rev = require('gulp-rev'),
  revCollector = require('gulp-rev-collector'),
  imagemin = require('gulp-imagemin'),
  gulpsync = require('gulp-sync')(gulp)

function handleError(err) {
  console.log(err.toString())
  this.emit('end')
}

gulp.task('server', function() {
  console.log('创建本地服务器')
  connect.server({
    livereload: true,
    root: './dist',
    port: 9999
  })
})

gulp.task('minifyImage', function() {
  gulp
    .src('src/assets/images/*.{png,jpg,gif,ico}')
    .pipe(
      imagemin({
        optimizationLevel: 5, //类型：Number  默认：3  取值范围：0-7（优化等级）
        progressive: true, //类型：Boolean 默认：false 无损压缩jpg图片
        interlaced: true, //类型：Boolean 默认：false 隔行扫描gif进行渲染
        multipass: true //类型：Boolean 默认：false 多次优化svg直到完全优化
      })
    )
    .pipe(gulp.dest('dist/assets/images'))
})

gulp.task('minifyCss', function() {
  var merged = merge()
  var stream = gulp
    .src('src/pages/**/*.scss')
    .pipe(
      scss({
        outputStyle: 'expanded',
        includePaths: 'src/styles'
      }).on('error', handleError)
    )
    .pipe(autoprefixer({ browsers: ['not ie <= 9', '> 1%'] }))
    .pipe(concat('app.css'))
    .pipe(
      base64({
        maxImageSize: 8 * 1024, // bytes
        debug: true
      })
    )
    .pipe(minifyCss())
    .pipe(rev())
    .pipe(gulp.dest('', { cwd: 'dist/assets/css' }))
    .pipe(rev.manifest())
    .pipe(gulp.dest('', { cwd: 'rev/css' }))
  merged.add(stream)
  return merged
})

gulp.task('minifyJs', function() {
  var merged = merge()
  var stream = gulp
    .src('src/pages/**/*.js')
    .pipe(uglify({ preserveComments: 'all' }).on('error', handleError))
    .pipe(
      babel({ presets: [es2015], only: ['*.{js,es6,jsx}'] }).on(
        'error',
        handleError
      )
    )
    .pipe(
      wrap({
        header: function(file) {
          var pathArr = file.path.split('/')
          var path = pathArr[pathArr.length - 2]
          return (
            'this.require.define({"' +
            path +
            '":function(exports, require, module){'
          )
        },
        footer: function(file) {
          return ';}});'
        }
      })
    )
    .pipe(concat('app.js'))
    .pipe(
      wrap({
        header: function(file) {
          var filename = require.resolve('./utils/require_head')
          return fs.readFileSync(filename, 'utf8')
        },
        footer: function(file) {
          var filename = require.resolve('./utils/require_foot')
          return fs.readFileSync(filename, 'utf8')
        }
      })
    )
    .pipe(rev())
    .pipe(gulp.dest('', { cwd: 'dist/assets/js' }))
    .pipe(rev.manifest())
    .pipe(gulp.dest('', { cwd: 'rev/js' }))
  merged.add(stream)
  return merged
})

gulp.task('htmlMin', function() {
  return gulp
    .src(['rev/**/*.json', 'src/pages/**/*.html'])
    .pipe(
      revCollector({
        replaceReved: true,
        dirReplacements: {
          '/css/': './assets/css',
          '/js/': './assets/js/'
        }
      })
    )
    .pipe(
      base64({
        maxImageSize: 8 * 1024, // bytes
        debug: true
      })
    )
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(
      rename(function(path) {
        path.basename = path.dirname
        path.dirname = ''
      })
    )
    .pipe(gulp.dest('', { cwd: 'dist' }))
})

gulp.task('clean', function() {
  return gulp.src('dist').pipe(clean())
})

gulp.task('watch', function() {
  gulp.watch('src/pages/**/*.scss', ['minifyCss'], function(event) {})
  gulp.watch('src/pages/**/*.html', ['htmlMin'], function(event) {})
  gulp.watch('src/pages/**/*.js', ['minifyJs'], function(event) {})
  gulp.watch('src/assets/images/*.{png,jpg,gif,ico}', ['minifyImage'], function(
    event
  ) {})
})

gulp.task(
  'default',
  gulpsync.sync([
    'clean',
    'minifyImage',
    'minifyCss',
    'minifyJs',
    'htmlMin',
    'watch',
    'server'
  ]),
  function() {
    console.log('构建成功～')
  }
)
