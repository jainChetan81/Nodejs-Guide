/*
*primary file for the api

*/

//dependencies
const server = require("./lib/server");
const workers = require("./lib/workers");
const cli = require("./lib/cli");

//declare the app
const app = {};

// init function
app.init = (callback) => {
    // start the server
    server.init();

    //start the workers
    workers.init();

    //start cli
    setTimeout(() => {
        cli.init();
        callback();
    }, 50);
};

//self invoke only if required directly
if (require.main === module) {
    // execute
    app.init(() => {});
}

//export this
module.exports = app;
