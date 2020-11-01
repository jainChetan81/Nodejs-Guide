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
            "head.title": "Uptime Monitoring- Made Simple",
            "head.description":
                "We offer free siple uptime monitoring for HTTP/HTTPS sites for al kinds.Wnen you site goes down, We will send You a text to let you know",
            "body.class": "index",
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

//?create account handlers
htmlHandlers.accountCreate = (data, callback) => {
    //reject any request that isn't a get
    if (data.method == "get") {
        //prepare data for interpolation
        const templateData = {
            "head.title": "Create an Account",
            "head.description": "Signup is easy and only takes a few values",
            "body.class": "accountCreate",
        };

        //read in the index template as a string
        htmlHelpers.getTemplate("accountCreate", templateData, (err, str) => {
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
//?create session handlers
htmlHandlers.sessionCreate = (data, callback) => {
    //reject any request that isn't a get
    if (data.method == "get") {
        //prepare data for interpolation
        const templateData = {
            "head.title": "Login to your account",
            "head.description": "Please enter you phone and password ",
            "body.class": "sessionCreate",
        };

        //read in the index template as a string
        htmlHelpers.getTemplate("sessionCreate", templateData, (err, str) => {
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
//?delete session handlers
htmlHandlers.sessionDeleted = (data, callback) => {
    //reject any request that isn't a get
    if (data.method == "get") {
        //prepare data for interpolation
        const templateData = {
            "head.title": "Logged out",
            "head.description": "Logged out to your account",
            "body.class": "sessionDeleted",
        };

        //read in the index template as a string
        htmlHelpers.getTemplate("sessionDeleted", templateData, (err, str) => {
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
                    callback(200, data, contentType);
                }
                if (err || !data) callback(404);
            });
        }
    }
    if (data.method != "get") callback(405, undefined, "html");
};

//?Edit Your Account
htmlHandlers.accountEdit = (data, callback) => {
    //reject any request that isn't a get
    if (data.method == "get") {
        //prepare data for interpolation
        const templateData = {
            "head.title": "Account Settings",
            "body.class": "accountEdit",
        };

        //read in the index template as a string
        htmlHelpers.getTemplate("accountEdit", templateData, (err, str) => {
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

//? Delete Your Account
htmlHandlers.accountDelete = (data, callback) => {
    //reject any request that isn't a get
    if (data.method == "get") {
        //prepare data for interpolation
        const templateData = {
            "head.title": "Account Deleted",
            "head.description": "Your Account has been Deleted",
            "body.class": "accountDelete",
        };

        //read in the index template as a string
        htmlHelpers.getTemplate("accountDelete", templateData, (err, str) => {
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

//? Create a New Check
htmlHandlers.checksCreate = (data, callback) => {
    //reject any request that isn't a get
    if (data.method == "get") {
        //prepare data for interpolation
        const templateData = {
            "head.title": "Create a new Check",
            "body.class": "checksCreate",
        };

        //read in the index template as a string
        htmlHelpers.getTemplate("checksCreate", templateData, (err, str) => {
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

//?Dashboard view of checks
htmlHandlers.checksList = (data, callback) => {
    //reject any request that isn't a get
    if (data.method == "get") {
        //prepare data for interpolation
        const templateData = {
            "head.title": "Dashboard",
            "body.class": "checksList",
        };

        //read in the index template as a string
        htmlHelpers.getTemplate("checksList", templateData, (err, str) => {
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

module.exports = htmlHandlers;
