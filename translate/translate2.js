#!/usr/bin/env node

var Liftoff = require("liftoff");
var argv = require("minimist")(process.argv.slice(2));

var verbose = argv.verbose === "true" || argv.verbose === true || false;

const fs = require("fs");
const util = require("util");
const readdir = util.promisify(fs.readdir);
var path = require("path");

const { Translate } = require("@google-cloud/translate").v2;
const translate = new Translate();

const xliff2js = require("xliff/cjs/xliff2js");
const js2xliff = require("xliff/cjs/js2xliff");

// Create the Liftoff instance
const XliffTranslate = new Liftoff({
    name: "xlifftranslate",
    processTitle: "xlifftranslate",
});

// Launch the Liftoff process
XliffTranslate.prepare({}, function (env) {
    if (argv.verbose) {
        console.log("LIFTOFF SETTINGS:", this);
        console.log("CLI OPTIONS:", argv);
        console.log("CWD:", env.cwd);
        console.log("YOUR LOCAL MODULE IS LOCATED:", env.modulePath);
        console.log("LOCAL PACKAGE.JSON:", env.modulePackage);
        console.log("CLI PACKAGE.JSON", require("../package"));
    }

    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.error(
            "No google credentials found. Please define GOOGLE_APPLICATION_CREDENTIALS\nexport GOOGLE_APPLICATION_CREDENTIALS="
        );
        process.exit(1);
    }

    if (process.cwd() !== env.cwd) {
        process.chdir(env.cwd);
        console.log("Working directory changed to", env.cwd);
    }

    run()
        .then((res) => {
            console.log("Complete");
        })
        .catch((err) => {
            console.error("Err:", err);
        });
});

async function run() {
    var i18nPath = argv.i18nPath || process.cwd();
    console.log("i18nPath", i18nPath);
    var englishFile = path.join(i18nPath, "messages.en.xlf2");
    const english = await readFile(englishFile);

    if (english["sourceLanguage"] != "en") {
        console.error('Source language must be "en"');
        process.exit(1);
    }

    await doEnglish(english, englishFile);
    const files = await readdir(i18nPath);
    console.log("files.length >> ", files);

    var tasks = files
        .filter((f) => f != "messages.en.xlf2" && f.endsWith(".xlf2"))
        .map((file) => processFile(i18nPath, file, english));
    await Promise.all(tasks);
}

async function doEnglish(english, englishFile) {
    english["targetLanguage"] = "en";
    for (const [key, value] of Object.entries(english["resources"]["ngi18n"])) {
        if (value["target"] == null) {
            value["target"] = value["source"];
        }
    }
    const eng = await js2xliff(english);
    fs.writeFileSync(englishFile, eng);
}

async function processFile(i18nPath, file, english) {
    let foreign = await readFile(path.join(i18nPath, file));
    const locale = getLocale(path.join(i18nPath, file));
    foreign["targetLanguage"] = locale;

    console.log(`Translating ${file} to ${locale}`);

    let eEntries = english["resources"]["ngi18n"];
    let fEntries = foreign["resources"]["ngi18n"];

    for (const [key, value] of Object.entries(fEntries)) {
        if (eEntries[key] == null) {
            delete fEntries[key];
        }
    }

    for (const [key, value] of Object.entries(eEntries)) {
        if (
            fEntries[key] == null ||
            fEntries[key]["target"] == undefined ||
            fEntries[key]["target"] == ""
        ) {
            if (fEntries[key] == null) {
                var nEntry = Object.assign({}, value);
                fEntries[key] = nEntry;
            } else {
                var nEntry = fEntries[key];
            }

            if (Array.isArray(nEntry["source"])) {
                nEntry["target"] = [];
                for (const s of nEntry["source"]) {
                    if (typeof s !== "string") {
                        nEntry["target"].push(s);
                    } else {
                        const [text] = await translate.translate(s, locale);
                        nEntry["target"].push(text);
                    }
                }
            } else if (typeof nEntry["source"] === "string") {
                const [text] = await translate.translate(
                    nEntry["source"],
                    locale
                );
                nEntry["target"] = text;
            }
        }
    }

    const f = await js2xliff(foreign);
    fs.writeFileSync(path.join(i18nPath, file), f);
    return true;
}

async function readFile(path) {
    var xlf = fs.readFileSync(path).toString();
    return xliff2js(xlf);
}

function getLocale(file) {
    var fileParts = file.split(".");
    if (fileParts.length < 3) {
        if (fileParts.length == 2) {
            var newFileParts = ["whocares", fileParts[0], fileParts[1]];
            fileParts = newFileParts;
        } else {
            console.log(
                "Error, expecting three part filename like something.en.xlf2: " +
                    file
            );
            process.exit(1);
        }
    }
    return fileParts[1];
}
