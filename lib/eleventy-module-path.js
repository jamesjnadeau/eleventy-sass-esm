import path from "node:path";
const eleventyEleventyCommonJsPath = require.resolve("@11ty/eleventy");
const eleventySrcPath = path.dirname(eleventyEleventyCommonJsPath);
const eleventyModulePath = function (...name) {
    return path.join(eleventySrcPath, ...name);
};
export default eleventyModulePath;
