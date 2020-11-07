//primary file for the api

//dependencies
const server = require("./lib/server");
const workers = require("./lib/workers");
const cli = require("./lib/cli");

//declare the app
const app = {};

//declare a global (that strict mode should crash)
foo = "bar";

// init function
app.init = () => {
    // start the server
    server.init();

    //start the workers
    workers.init();

    //start cli
    setTimeout(() => {
        cli.init();
    }, 50);
};

// execute
app.init();

//export this
module.exports = app;
