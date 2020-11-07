//primary file for the api

//dependencies
const server = require("./lib/server");
const workers = require("./lib/workers");
const cli = require("./lib/cli");
const exampleDebuggingProblem = require("./lib/exampleDebuggingProblem");

//declare the app
const app = {};

// init function
app.init = () => {
    // start the server
    debugger;
    server.init();
    debugger;

    //start the workers
    debugger;
    workers.init();
    debugger;

    //start cli
    debugger;
    setTimeout(() => {
        cli.init();
    }, 50);
    debugger;

    debugger;
    let foo = 1;
    debugger;

    foo++;
    debugger;

    foo = foo * foo;
    debugger;

    foo = foo.toString();
    debugger;

    //call init script that will throw
    exampleDebuggingProblem.init();
    debugger;
};

// execute
app.init();

//export this
module.exports = app;
