const gulp = require("gulp");
const sync = require("browser-sync");
const htmlmin = require("gulp-htmlmin");
const del = require("del");
const sass = require("gulp-sass");
const inject = require("gulp-inject");
const autoprefixer = require("gulp-autoprefixer");
const groupMedia = require("gulp-group-css-media-queries");
const cleanCss = require("gulp-clean-css");
const rename = require("gulp-rename");
const babel = require("gulp-babel");
const terser = require("gulp-terser");

const appPath = {
  output: "dist",
  input: "src",
};
const mediaPattern = "jpg,png,svg,gif,ico,webp";

function htmlTranspile() {
  return gulp
    .src(`${appPath.input}/*.html`)
    .pipe(inject(gulp.src(["./src/styles/main.scss"], { read: false })))
    .pipe(
      htmlmin({
        removeComments: true,
        collapseWhitespace: true,
      })
    )
    .pipe(gulp.dest(appPath.output))
    .pipe(sync.stream());
}

exports.htmlTranspile = htmlTranspile;

function styleTranspile() {
  return gulp
    .src(`${appPath.input}/styles/main.scss`)
    .pipe(
      sass({
        outputStyle: "expanded",
      })
    )
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
    .pipe(gulp.dest(appPath.output))
    .pipe(sync.stream());
}

exports.styleTranspile = styleTranspile;

function scripts() {
  return gulp
    .src(`${appPath.input}/scripts/index.js`)
    .pipe(
      babel({
        presets: ["@babel/preset-env"],
      })
    )
    .pipe(terser())
    .pipe(gulp.dest(appPath.output))
    .pipe(sync.stream());
}

exports.scripts = scripts;

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
  gulp.watch(`${appPath.input}/*.html`, gulp.series(htmlTranspile));
  gulp.watch(`${appPath.input}/styles/**/*.scss`, gulp.series(styleTranspile));
  gulp.watch(`${appPath.input}/scripts/**/*.js`, gulp.series(scripts));
}

exports.watch = watch;

function clean() {
  return del(appPath.output);
}

exports.clean = clean;

exports.default = gulp.series(
  clean,
  gulp.parallel(htmlTranspile, styleTranspile, scripts),
  gulp.parallel([watch, server])
);
