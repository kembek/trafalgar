const gulp = require("gulp");

// browser
const sync = require("browser-sync");

// html
const htmlmin = require("gulp-htmlmin");

// styles
const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const groupMedia = require("gulp-group-css-media-queries");
const cleanCss = require("gulp-clean-css");

// scripts
const browserify = require("browserify");
const babelify = require("babelify");
const source = require("vinyl-source-stream");
const terser = require("gulp-terser");
const buffer = require("vinyl-buffer");

// media
const imagemin = require("gulp-imagemin");

// utils
const rename = require("gulp-rename");
const del = require("del");
const sourcemaps = require("gulp-sourcemaps");

const appPath = {
  output: "dist",
  input: "src",
};

function html() {
  return gulp
    .src(`${appPath.input}/*.html`)
    .pipe(
      htmlmin({
        removeComments: true,
        collapseWhitespace: true,
      })
    )
    .pipe(gulp.dest(appPath.output))
    .pipe(sync.stream());
}

exports.html = html;

function style() {
  return gulp
    .src(`${appPath.input}/styles/main.scss`)
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle: "expanded",
        errLogToConsole: true,
      })
    )
    .on("error", sass.logError)
    .pipe(groupMedia())
    .pipe(
      autoprefixer({
        cascade: true,
      })
    )
    .pipe(gulp.dest(appPath.output))
    .pipe(cleanCss())
    .pipe(
      rename({
        extname: ".min.css",
      })
    )
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest(appPath.output))
    .pipe(sync.stream());
}

exports.style = style;

function scripts() {
  return browserify({
    entries: [`${appPath.input}/scripts/index.js`],
  })
    .transform(babelify)
    .bundle()
    .on("error", function (err) {
      console.error(err);
      this.emit("end");
    })
    .pipe(source("index.js"))
    .pipe(
      rename({
        extname: ".min.js",
      })
    )
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(terser())
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest(appPath.output))
    .pipe(sync.stream());
}

exports.scripts = scripts;

function media() {
  return gulp
    .src(`${appPath.input}/img/**/*.{jpg,png,svg,gif,ico,webp}`)
    .pipe(
      imagemin([
        imagemin.mozjpeg({ quality: 75, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [
            {
              removeViewBox: true,
            },
            { cleanupIDs: false },
          ],
        }),
      ])
    )
    .pipe(gulp.dest(`${appPath.output}/img`))
    .pipe(sync.stream());
}

exports.media = media;

function server() {
  sync.init({
    ui: false,
    notify: false,
    port: 3000,
    server: {
      baseDir: appPath.output,
    },
    open: false,
  });
}

exports.server = server;

function watch() {
  gulp.watch(`${appPath.input}/*.html`, gulp.series(html));
  gulp.watch(`${appPath.input}/styles/**/*.scss`, gulp.series(style));
  gulp.watch(`${appPath.input}/scripts/**/*.js`, gulp.series(scripts));
  gulp.watch(
    `${appPath.input}/img/**/*.{jpg,png,svg,gif,ico,webp}`,
    gulp.series(media)
  );
}

exports.watch = watch;

function clean() {
  return del(appPath.output);
}

exports.clean = clean;

exports.default = gulp.series(
  clean,
  gulp.parallel(html, style, scripts, media),
  gulp.parallel([watch, server])
);
