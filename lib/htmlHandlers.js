//?these are the request handlers for html API Handlers and html
//dependencies
const htmlHelpers = require("./htmlHelpers");
//define all handlers
let htmlHandlers = {};

//? html handlers

//index handlers
htmlHandlers.index = (data, callback) => {
    //reject any request that isn't a get
    if (data.method == "get") {
        //prepare data for interpolation
        const templateData = {
            "head.title": "This is the Title",
            "head.description": "This is the meta description",
            "body.title": "Hello Templated World",
            "body.close": "index",
        };

        //read in the index template as a string
        htmlHelpers.getTemplate("index", templateData, (err, str) => {
            if (!err && str) {
                //add the universal header and footer
                //prettier-ignore
                htmlHelpers.addUniversalTemplates(str, templateData, (err, modifiedStr) => {
                        //return a page as html
                    if (!err && modifiedStr) callback(200, modifiedStr, "html");
                    if (err || !modifiedStr) callback(500, undefined, html);
                })
            }
            if (err || !str) callback(500, undefined, "html");
        });
    }
    if (data.method != "get") callback(405, undefined, "html");
};

// ?favicon
htmlHandlers.favicon = (data, callback) => {
    //reject any request that isn't a get
    if (data.method == "get") {
        //read in favicon's data
        htmlHelpers.getStaticAsset("favicon.ico", (err, data) => {
            if (!err && data) callback(200, data, "favicon");
            if (err || !data) callback(500);
        });
    }
    if (data.method != "get") callback(405, undefined, "html");
};

//?public assests
htmlHandlers.public = (data, callback) => {
    //reject any request that isn't a get
    if (data.method == "get") {
        //get the file name being requested
        const trimmedAssetName = data.trimmedPath.replace("public/", "").trim();
        if (trimmedAssetName.length > 0) {
            //read in the asssest's data
            htmlHelpers.getStaticAsset(trimmedAssetName, (err, data) => {
                if (!err && data) {
                    //determine the content type (default to plain text)
                    let contentType = "plain";
                    if (trimmedAssetName.indexOf(".css") > -1)
                        contentType = "css";
                    if (trimmedAssetName.indexOf(".png") > -1)
                        contentType = "png";
                    if (trimmedAssetName.indexOf(".jpg") > -1)
                        contentType = "jpg";
                    if (trimmedAssetName.indexOf(".ico") > -1)
                        contentType = "ico";

                    //callback the data
                    console.log("data", data);
                    callback(200, data, contentType);
                }
                if (err || !data) callback(404);
            });
        }
    }
    if (data.method != "get") callback(405, undefined, "html");
};

module.exports = htmlHandlers;
