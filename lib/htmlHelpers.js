//htmlHelpers for various tasks
//dependencies
const config = require("./config");
const path = require("path");
const fs = require("fs");
//container for all the htmlHelpers
const htmlHelpers = {};

//get the string content of a string function
htmlHelpers.getTemplate = (templateName, data, callback) => {
    templateName =
        typeof templateName == "string" && templateName.length > 0
            ? templateName
            : false;
    data = typeof data == "object" && data !== null ? data : {};
    if (templateName) {
        const templateDir = path.join(__dirname, "/../templates/");
        //prettier-ignore
        fs.readFile( templateDir + templateName + ".html","utf8",(err, str) => {
                if (!err && str && str.length > 0) {
                    //do the interpolation on the string
                    const finalString=htmlHelpers.interpolate(str, data)
                    // console.log("str", str);
                    callback(false, finalString)
                }
                if (err || !str) callback("no template could be found");
            }
        );
    }
    if (!templateName) callback("a valid templatename was not specified");
};

//add the universal heade and a footer to a string , and pass the provided data object to the header and footer for interpolation
htmlHelpers.addUniversalTemplates = (str, data, callback) => {
    str = typeof str == "string" && str.length > 0 ? str : "";
    data = typeof data == "object" && data !== null ? data : {};
    //get the header
    htmlHelpers.getTemplate("_header", data, (err, headerString) => {
        if (!err && headerString) {
            //get the footer
            htmlHelpers.getTemplate("_footer", data, (err, footerString) => {
                if (!err && footerString) {
                    //add the three strings together
                    const finalString = headerString + str + footerString;
                    // console.log("finalString", finalString);
                    callback(false, finalString);
                }
                if (err || !footerString) callback("couldnot find footer");
            });
        }
        if (err || !headerString) callback("couldnot find header template");
    });
};

//take a given string and a data object and find/replace all teh keys within it
htmlHelpers.interpolate = (str, data) => {
    str = typeof str == "string" && str.length > 0 ? str : "";
    data = typeof data == "object" && data !== null ? data : {};

    // add the templateGlobals to the data object , prepending their key names with 'global'
    for (let keyName in config.templateGlobals) {
        if (config.templateGlobals.hasOwnProperty(keyName)) {
            data["global." + keyName] = config.templateGlobals[keyName];
        }
    }

    //for each key in data object, insert its value into string at the corresponding placeholder
    for (let key in data) {
        if (data.hasOwnProperty(key) && typeof data[key] == "string") {
            const replace = data[key];
            const find = "{" + key + "}";
            str = str.replace(find, replace);
        }
    }
    return str;
};

//get the contents of a static (public) asset
htmlHelpers.getStaticAsset = (fileName, callback) => {
    fileName =
        typeof fileName == "string" && fileName.length > 0 ? fileName : false;
    if (fileName) {
        const publicDir = path.join(__dirname, "/../public");
        fs.readFile(publicDir + fileName, (err, data) => {
            if (!err && data) callback(false, data);
            if (err || !data) callback("no file could be found");
        });
    }
    if (!fileName) callback("A valid filename was not specified");
};

module.exports = htmlHelpers;
