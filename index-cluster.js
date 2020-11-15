/*
*primary file for the api

*/

//dependencies
const server = require("./lib/server");
const workers = require("./lib/workers");
const cli = require("./lib/cli");
const cluster = require("cluster");
const os = require("os");

//declare the app
const app = {};

// init function
app.init = (callback) => {
    //if we're on the master thread start workers and cli
    if (cluster.isMaster) {
        //start the workers
        workers.init();

        //start cli
        setTimeout(() => {
            cli.init();
            callback();
        }, 50);
        for (let i = 0; i < os.cpus(); i++) {
            cluster.fork();
        }
    } else {
        //if we are not on the master thread, start the server
        server.init();
    }
};

//self invoke only if required directly
if (require.main === module) {
    // execute
    app.init(() => {});
}
//export this
module.exports = app;
