//primary file for the api

//dependencies
const server = require("./lib/server");
const workers = require("./lib/workers");

//declare the app
const app = {};

// init function
app.init = () => {
    // start the server
    server.init();

    //start the workers
    workers.init();
};

// execute
app.init();

//export this
module.exports = app;
