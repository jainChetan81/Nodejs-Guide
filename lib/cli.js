//? CLI-Related TAsks
//dependencies
const readLine = require("readline");
const util = require("util");
const debug = util.debuglog("cli");
const events = require("events");
class _events extends events {}
const e = new _events();

//instantiate the cli module
let cli = {};

//input handlers
e.on("man", (str) => {
    cli.responders.help();
});
e.on("help", (str) => {
    cli.responders.help();
});
e.on("exit", (str) => {
    cli.responders.exit();
});
e.on("stats", (str) => {
    cli.responders.stats();
});
e.on("list users", (str) => {
    cli.responders.listUsers();
});
e.on("more user info", (str) => {
    cli.responders.moreUserInfo(str);
});
e.on("list checks", (str) => {
    cli.responders.listChecks(str);
});
e.on("more checks", (str) => {
    cli.responders.moreCheckInfo(str);
});
e.on("list Logs", (str) => {
    cli.responders.listLogs();
});
e.on("more log info", (str) => {
    cli.responders.moreLogInfo(str);
});

//responder object
cli.responders = {};

//help / Man
cli.responders.help = () => {
    const commands = {
        exit: "Kill the CLi and The rest of the application",
        man: "Show this Help page",
        help: "Alias of the Man Command",
        stats: "Get Statistics on the system and resource utilization",
        "list users": "Show a list of all the registered(undeleted) users",
        "more user info --{userId}": "Show details of a specific user",
        "list checks --up --down":
            "All the active check in the system including their state. the up '--up' and the down '--down' flags are both optional ",
        "more checks info --{checkId}": "Show details of a specified check",
        "list logs":
            "Show a list of all the log files available to be read(compressed and uncompressed)",
        "more log info --{fileName}": "Show details of a specified log command",
    };
    //show a header for the help page that is as wide as the screen
    cli.horizontalLine();
    cli.centered("CLI MANUAL");
    cli.horizontalLine();
    cli.verticalSpaces(2);

    //show each command, followed by its explanation, in white and yellow respective
    for (let key in commands) {
        if (commands.hasOwnProperty(key)) {
            const value = commands[key];
            let line = "\x1b[33m" + key + "\x1b[0m";
            const padding = 60 - line.length;
            for (let index = 0; index < padding; index++) {
                line += " ";
            }
            line += value;
            console.log(line);
            cli.verticalSpaces();
        }
    }
    cli.verticalSpaces(1);
    //end with another horizontalLine
    cli.horizontalLine();
};

//create a vertical space
cli.verticalSpaces = (lines) => {
    lines = typeof lines == "number" && lines > 0 ? lines : 1;
    for (let index = 0; index < lines; index++) {
        console.log(" ");
    }
};

//create a horizonatl line
cli.horizontalLine = () => {
    //get the available screen size
    const width = process.stdout.columns;
    let line = "";
    for (let index = 0; index < width; index++) {
        line += "-";
    }
    console.log(line);
};

//create a centered text on screen
cli.centered = (str) => {
    str = typeof str == "string" && str.trim().length > 0 ? str.trim() : "";

    //get the available screen size
    const width = process.stdout.columns;

    //calculate the left padding there should be
    const leftPadding = Math.floor((width - str.length) / 2);

    //put a left padding spaces before the string itself
    let line = "";
    for (let index = 0; index < leftPadding; index++) {
        line += " ";
    }
    line += str;
    console.log(line);
};

//exit
cli.responders.exit = () => {
    process.exit(0);
};
cli.responders.stats = () => {
    console.log("You asked for stats");
};
cli.responders.listUsers = () => {
    console.log("You asked for list users");
};
cli.responders.moreUserInfo = (str) => {
    console.log("You asked for more user info");
};
cli.responders.listChecks = (str) => {
    console.log("You asked for list checks");
};
cli.responders.moreCheckInfo = (str) => {
    console.log("You asked for more check info");
};
cli.responders.listLogs = () => {
    console.log("You asked for list logs");
};
cli.responders.moreLogInfo = (str) => {
    console.log("You asked for more log info");
};

//input processor
cli.processInput = (str) => {
    str = typeof str == "string" && str.trim().length > 0 ? str.trim() : false;

    //only want to process input , if the user actually wrote something else ignore
    if (str) {
        //codify he unique strings that identify the unique questions allowed to be asked
        const uniqueInputs = [
            "man",
            "help",
            "exit",
            "stats",
            "list users",
            "more user info",
            "list checks",
            "more checks info",
            "list logs",
            "more log info",
        ];

        //go through the possible inputs, emit an event when a match is found
        let matchFound = false;
        let counter = 0;
        uniqueInputs.some((input) => {
            if (str.toLowerCase().indexOf(input) > -1) {
                matchFound = true;
                //emit an event matching the unique input, and includes the full string given
                e.emit(input, str);
                return true;
            }
        });

        //if no match is found, tell the user to try again
        if (!matchFound) console.log("Sorry, Try again");
    }
};

//init script
cli.init = () => {
    //send the start message to the console

    console.log("\x1b[34m%s\x1b[0m", "CLI is running");

    //start the interface
    const _interface = readLine.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: "",
    });

    //create an initial prompt
    _interface.prompt();

    //handle each line of input seperately
    _interface.on("line", (str) => {
        //send to the input processor
        cli.processInput(str);

        //re-initialize the prompt afterwards
        _interface.prompt();
    });

    //if the  user stops the cli, kill the assosiated process
    _interface.on("close", () => {
        process.exit(0);
    });
};

//export module
module.exports = cli;
