import { posix as path } from "path";
import upath from "upath";
import url from "url";
import sass from "sass";
import depMap from "./dependency-map.js";
import sourceMapStore from "./source-map-store.js";
import getLoadPathsFixedSassOptions from "./get-load-paths-fixed-sass-options.js";
import debug from "debug";
const debugDev = debug("Dev:EleventySass:Compile");
const workingDir = upath.normalize(process.cwd());
const compile = async function (inputContent, inputPath, sassOptions, config, postcss) {
    let parsed = path.parse(inputPath);
    if (parsed.name.startsWith("_")) {
        debugDev(`Actually, didn't compile ${inputPath}, because the filename starts with "_"`);
        return;
    }
    let inputURL = url.pathToFileURL(path.resolve(inputPath)).href;
    let stringOptions = getLoadPathsFixedSassOptions(sassOptions, parsed.dir, config);
    stringOptions.url = inputURL;
    if (parsed.ext === ".sass") {
        stringOptions.syntax = "indented";
    }
    // Must use sass.compileString() here. If you used sass.compile(),
    // sass would touch the file and Eleventy would compile it twice.
    let { css, sourceMap, loadedUrls } = sass.compileString(inputContent, stringOptions);
    if (postcss) {
        let postprocessed;
        if (sourceMap) {
            postprocessed = await postcss.process(css, { map: { prev: sourceMap }, from: inputURL });
            sourceMap = postprocessed.map;
        }
        else {
            postprocessed = await postcss.process(css, { map: false, from: inputURL });
        }
        css = postprocessed.css;
    }
    if (sourceMap) {
        css += sourceMapStore.set(inputPath, sourceMap);
    }
    debugDev(`Has compiled ${inputPath}`);
    this.addDependencies(inputPath, loadedUrls);
    // `depMap` is used to determine which revision hashes should be invalidated when
    // a Sass/SCSS file is updated.
    // In the following code, `loadedPaths` includes the dependent Sass/SCSS file path
    // (`dependant`) during the compilation of `inputContent`.
    // By calling `depMap.update()` with `dependant` and `loadedPaths`, dependencies
    // become self-referential. This means that `dependantsOf()` for an updated file
    // returns not only files that depend on it but also the updated file itself.
    let dependant = path.normalize(inputPath);
    let loadedPaths = loadedUrls.map(loadedUrl => {
        return path.relative(workingDir, upath.normalize(url.fileURLToPath(loadedUrl)));
    });
    depMap.update(dependant, loadedPaths);
    return css;
};
export default compile;
