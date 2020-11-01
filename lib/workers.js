//?worker related tasks

//dependencies
const _data = require("./data");
const http = require("http");
const https = require("https");
const helpers = require("./helpers");
const url = require("url");
const _logs = require("./logs");
const util = require("util");
const debug = util.debuglog("workers");

//instantiate the worker object
let workers = {};

//lookup all the checks, get their data and send to a validator
workers.gatherAllChecks = () => {
    _data.list("checks", (err, checks) => {
        if (!err && checks && checks.length > 0) {
            checks.forEach((check) => {
                //read in the check data
                _data.read("checks", check, (err, originalCheckData) => {
                    if (!err && originalCheckData) {
                        //pass the data to a check validator
                        //and that function continues or log data as needed
                        workers.validateCheckData(originalCheckData);
                    }
                    if (err || !originalCheckData)
                        debug("Error:reading one the check data");
                });
            });
        } else debug("Error: Couldnot find any checks to process");
    });
};

//sanity-checking the check data
workers.validateCheckData = (data) => {
    data = typeof data == "object" && data !== null ? data : {};
    data.id =
        typeof data.id == "string" && data.id.trim().length >= 20
            ? data.id.trim()
            : false;
    data.userPhone =
        typeof data.userPhone == "string" && data.userPhone.trim().length == 10
            ? data.userPhone.trim()
            : false;
    data.protocol =
        typeof data.protocol == "string" &&
        ["http", "https"].indexOf(data.protocol) > -1
            ? data.protocol
            : false;
    data.url =
        typeof data.url == "string" && data.url.trim().length > 0
            ? data.url.trim()
            : false;
    data.method =
        typeof data.method == "string" &&
        ["post", "get", "put", "delete"].indexOf(data.method) > -1
            ? data.method
            : false;
    data.successCodes =
        typeof data.successCodes == "object" &&
        data.successCodes instanceof Array &&
        data.successCodes.length > 0
            ? data.successCodes
            : false;
    data.timeoutSeconds =
        typeof data.timeoutSeconds == "number" &&
        data.timeoutSeconds % 1 === 0 &&
        5 >= data.timeoutSeconds >= 1
            ? data.timeoutSeconds
            : false;

    //set the keys that may not be set(if the workers have never seen this check before)
    data.state =
        typeof data.state == "string" && ["up", "down"].indexOf(data.state) > -1
            ? data.state
            : "down";
    data.lastChecked =
        typeof data.lastChecked == "number" && data.lastChecked > 0
            ? data.lastChecked
            : false;

    //if all the checks passed, pass the data along to the next step
    if (
        data.id &&
        data.userPhone &&
        data.protocol &&
        data.url &&
        data.method &&
        data.successCodes &&
        data.timeoutSeconds
    ) {
        workers.performCheck(data);
    } else debug("Error: One of the checks is not properly formatted");
};

//perform the check, send the original check data and the outcome of the check to next step
workers.performCheck = (data) => {
    //prepare the initial check outcome
    const checkOutcome = {
        error: false,
        responseCode: false,
    };

    //mark that the outcome has not been sent yet
    let outcomeSent = false;

    //parse the hostname and the path out  ofthe original check data
    const parsedUrl = url.parse(data.protocol + "://" + data.url, true);
    const hostName = parsedUrl.hostName;
    const path = parsedUrl.path; // Using path not pathname because we want the query string

    //construct the request
    const requestDetails = {
        protocol: data.protocol + ":",
        hostName,
        path,
        method: data.method.toUpperCase(),
        timeout: data.timeoutSeconds * 3600,
    };

    //instantiate the request object using http/https
    const _moduleToUse = data.protocol == "http" ? http : https;
    const req = _moduleToUse.request(requestDetails, (res) => {
        //grabb the status of the sent request
        const status = res.statusCode;

        //update the check outcome and pass the data along
        checkOutcome.responseCode = status;
        if (!outcomeSent) {
            workers.processCheckOutcome(data, checkOutcome);
            outcomeSent = true;
        }
    });

    //bind to the error so it doesn't get thrown
    req.on("error", (e) => {
        //update he oucome and pass the data along
        checkOutcome.error = {
            err: true,
            value: e,
        };
        if (!outcomeSent) {
            workers.processCheckOutcome(data, checkOutcome);
            outcomeSent = true;
        }
    });
    //bind to a a timeout
    req.on("timeout", () => {
        //update he oucome and pass the data along
        checkOutcome.error = {
            err: true,
            value: "timeout",
        };
        if (!outcomeSent) {
            workers.processCheckOutcome(data, checkOutcome);
            outcomeSent = true;
        }
    });

    //end the request
    req.end();
};

//to process a check outcome and update the check as needed and trigger an alert
//special logic here for accomodating a check that has never has been tested before
workers.processCheckOutcome = (data, checkOutcome) => {
    //decide if the check is considered up to down
    const state =
        !checkOutcome.error &&
        checkOutcome.responseCode &&
        data.successCodes.indexOf(checkOutcome.responseCode) > -1
            ? "up"
            : "down";

    //decide if an alert is warranted
    const alertWarranted =
        data.lastChecked && data.state !== state ? true : false;

    //log the outcome
    const timeOfCheck = Date.now();
    //prettier-ignore
    workers.log(data, checkOutcome, state, alertWarranted, timeOfCheck);

    //update the new check data
    const newCheckData = { ...data };
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    //save the updates
    _data.update("checks", newCheckData.id, newCheckData, (err) => {
        if (!err) {
            //send the new data to the next phase
            if (alertWarranted) workers.alertUsersToStatusChanged(newCheckData);
            if (!alertWarranted) debug("check outcome same,no alert");
        }
        if (err) debug("Error: tring to save updates on one of the checks");
    });
};

//alert the users as to a change in their check status
workers.alertUsersToStatusChanged = (newCheckData) => {
    const msg = `Alert: Your check for ${newCheckData.method.toUpperCase()} 
    ${newCheckData.protocol}://${newCheckData.url} is currently 
    ${newCheckData.state}`;
    helpers.sendTwilioSms(newCheckData.userPhone, msg, (err) => {
        if (!err) debug("Success: User alerted a status change via sms");
        if (err) debug("Error: Couldn't alert user with state changes");
    });
};

workers.log = (data, checkOutcome, state, alertWarranted, timeOfCheck) => {
    //from the log data
    const log = {
        check: data,
        outcome: checkOutcome,
        state,
        alert: alertWarranted,
        time: timeOfCheck,
    };

    //convert data to a string
    const logString = JSON.stringify(log);

    //determine the name of log files
    const logFileName = data.id;

    //append the log string to the file
    _logs.append(logFileName, logString, (err) => {
        if (!err) debug("logging to file succeded");
        if (err) debug("logging to file failed");
    });
};

//timer to execute the worker process once per minute
workers.loop = () => {
    setInterval(() => {
        workers.gatherAllChecks();
    }, 1000 * 180);
};

//rotate (compress) the log files
workers.rotateLogs = () => {
    //list all the (non compressed) log files
    _logs.list(false, (err, logs) => {
        if (!err && logs && logs.length > 0) {
            logs.forEach((logName) => {
                //compress the data to a different file
                const logId = logName.replace(".log", "");
                const newFileId = logId + "-" + Date.now();
                _logs.compress(logId, newFileId, (err) => {
                    if (!err) {
                        //  truncate the tags
                        _logs.truncate(logId, (err) => {
                            if (!err) debug("Success Truncating Log");
                            if (err) debug("Error: Truncating log file");
                        });
                    }
                    if (err) debug("Error: compressing log file", err);
                });
            });
        }
        if (err || !logs) debug("Error: could not find any logs to rotate");
    });
};

//timer to execute the log-rotation loop per day
workers.logRotationLoop = () => {
    setInterval(() => {
        workers.rotateLogs();
    }, 1000 * 60 * 60 * 24);
};

//init script
workers.init = () => {
    // Send to console, in yellow
    console.log("\x1b[33m%s\x1b[0m", "Background workers are running");
    //execute all the checks immediately
    workers.gatherAllChecks();
    //call the loop so the checks will execute later on
    workers.loop();
    //compress all logs immediately
    workers.rotateLogs();
    //call the compression loop so logs will be compared later on
    workers.logRotationLoop();
};

// export the module
module.exports = workers;
