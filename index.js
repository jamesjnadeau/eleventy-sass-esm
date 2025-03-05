import "./lib/eleventy/patch.js";
import eleventySass from "./lib/eleventy-sass.js";
const plugin = {
    configFunction: eleventySass,
    name: "eleventy-sass"
};
export default plugin;
