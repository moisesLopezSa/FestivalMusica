"use strict";

const gulp = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const sourcemaps = require("gulp-sourcemaps");
const cleanCSS = require("gulp-clean-css");
const plumber = require("gulp-plumber");
const uglify = require("gulp-uglify");
const rename = require("gulp-rename");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const glob = require("glob").glob;
const ffmpeg = require("fluent-ffmpeg");

/** SASS */
function buildStyles() {
  return gulp
    .src("./src/scss/style.scss")
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(cleanCSS({ compatibility: "ie8" }))
    .pipe(rename({ suffix: ".min" }))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("public/css"));
}

/** JavaScript */
function buildScripts() {
  return gulp
    .src("./src/js/scripts.js")
    .pipe(plumber())
    .pipe(uglify())
    .pipe(rename({ suffix: ".min" }))
    .pipe(gulp.dest("public/js"));
}

/** Crop images */
async function buildCrop(done) {
  const inputFolder = "src/img/gallery/full";
  const outputFolder = "src/img/gallery/thumb";
  const width = 250;
  const height = 180;

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  const images = fs.readdirSync(inputFolder).filter((file) => {
    return /\.(jpg|jpeg|png)$/i.test(path.extname(file));
  });

  try {
    await Promise.all(
      images.map(async (file) => {
        const inputFile = path.join(inputFolder, file);
        const outputFile = path.join(outputFolder, file);
        await sharp(inputFile).resize(width, height, { fit: "cover" }).toFile(outputFile);
      })
    );
    done();
  } catch (error) {
    console.error("Error cropping images:", error);
    done(error);
  }
}

/** Build Images */
async function buildImages(done) {
  const srcDir = "./src/img";
  const publicDir = "./public/img";
  const images = await glob("./src/img/**/*{jpg,png}");
  images.forEach((file) => {
    const relativePath = path.relative(srcDir, path.dirname(file));
    const outputSubDir = path.join(publicDir, relativePath);
    processImage(file, outputSubDir);
  });
  done();
}

function processImage(file, outputSubDir) {
  if (!fs.existsSync(outputSubDir)) {
    fs.mkdirSync(outputSubDir, { recursive: true });
  }
  const baseName = path.basename(file, path.extname(file));
  const extName = path.extname(file);
  const outputFile = path.join(outputSubDir, `${baseName}${extName}`);
  const outputFileWebp = path.join(outputSubDir, `${baseName}.webp`);
  const outputFileAvif = path.join(outputSubDir, `${baseName}.avif`);

  const options = { quality: 80 };
  sharp(file).jpeg(options).toFile(outputFile);
  sharp(file).webp(options).toFile(outputFileWebp);
  sharp(file).avif().toFile(outputFileAvif);
}

/** Build Videos */
async function buildVideo(done) {
  const inputFolder = "./src/vid";
  const outputFolder = "./public/vid";
  const formats = ["mp4", "webm"];
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }
  const videos = fs.readdirSync(inputFolder).filter((file) => {
    return /\.(mp4|avi|mov|mkv)$/i.test(path.extname(file));
  });
  try {
    await Promise.all(
      videos.map((file) => {
        const inputFile = path.join(inputFolder, file);
        formats.forEach((format) => {
          const outputFile = path.join(outputFolder, `${path.basename(file, path.extname(file))}.${format}`);
          if (format === "webm") {
            ffmpeg(inputFile)
              .output(outputFile)
              .videoCodec("libvpx-vp9")
              .audioCodec("libopus")
              .size("1920x1080")
              .videoBitrate(5000)
              .audioBitrate(192)
              .on("end", () => {
                console.log(`Converted and compressed ${file} to ${format}`);
              })
              .on("error", (err, stdout, stderr) => {
                console.error(`Error al procesar ${file}:`, err.message);
                console.error("FFmpeg stdout:", stdout);
                console.error("FFmpeg stderr:", stderr);
              })
              .run();
          } else {
            ffmpeg(inputFile)
              .output(outputFile)
              .videoCodec("libx264")
              .audioCodec("aac")
              .size("1920x1080")
              .videoBitrate(5000)
              .audioBitrate(192)
              .on("end", () => {
                console.log(`Converted and compressed ${file} to ${format}`);
              })
              .on("error", (err, stdout, stderr) => {
                console.error(`Error al procesar ${file}:`, err.message);
                console.error("FFmpeg stdout:", stdout);
                console.error("FFmpeg stderr:", stderr);
              })
              .run();
          }
        });
      })
    );
    done();
  } catch (error) {
    console.error("Error processing videos:", error);
    done(error);
  }
}

/** Watch */
function watch() {
  gulp.watch("./src/scss/**/*.scss", buildStyles);
  gulp.watch("./src/js/**/*.js", buildScripts);
  gulp.watch("./src/img/**/*.{png,jpg,jpeg,avif,webp}", buildImages);
  gulp.watch("./src/vid/**/*.{mp4,webm}", buildVideo);
}

/** Default tasks */
const build = gulp.series(buildCrop, buildImages, buildVideo, buildStyles, buildScripts, watch);

/** Exports */
module.exports = {
  default: build,
  buildScripts,
  buildStyles,
  buildImages,
  buildVideo,
  watch,
};
