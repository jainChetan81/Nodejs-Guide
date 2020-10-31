//? server related tasks

//dependencies
const http = require("http");
const https = require("https");
const url = require("url");
const { StringDecoder } = require("string_decoder");
const config = require("./config");
const fs = require("fs");
const handlers = require("./handlers");
const helpers = require("./helpers");
const htmlHandlers = require("./htmlHandlers");
const path = require("path");
const util = require("util");
const debug = util.debuglog("server");

//instantiate the server module object
let server = {};

// instatiating the http server
server.httpServer = http.createServer((req, res) => {
    server.unifiedServer(req, res);
});

//instatiate the http server
server.httpsServerOptions = {
    key: fs.readFileSync(path.join(__dirname, "/../https/key.pen")),
    cert: fs.readFileSync(path.join(__dirname, "/../https/cert.pem")),
};

server.httpsServer = https.createServer(
    server.httpsServerOptions,
    (req, res) => {
        unifiedServer(req, res);
    }
);

//all the server logic for both the htttp and https
server.unifiedServer = (req, res) => {
    //get url and parse it
    const parsedUrl = url.parse(req.url, true);
    // get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, "");

    //get query string as an object
    const queryStringObject = parsedUrl.query;

    //get http method
    const method = req.method.toLowerCase();

    // get the headers as an object
    const headers = req.headers;

    //getting payload if any
    const decoder = new StringDecoder("utf-8");
    var buffer = "";
    req.on("data", (data) => {
        buffer += decoder.write(data);
    });
    req.on("end", () => {
        buffer += decoder.end();
        //choose the handler this request should goto
        //if not found then choose notfound handler
        var chosenHandler =
            typeof server.router[trimmedPath] !== "undefined"
                ? server.router[trimmedPath]
                : handlers.notFound;

        // if the request is in pubic directory use the public handler instead
        if (trimmedPath.indexOf("public/") > -1)
            chosenHandler = htmlHandlers.public;

        // construct the data handler to send to the handler
        const data = {
            trimmedPath: trimmedPath,
            queryStringObject: queryStringObject,
            method: method,
            payload: helpers.parseJsonToObject(buffer),
            headers: headers,
        };

        // route the request to the handler specified in the router
        chosenHandler(data, (statusCode, payload, contentType) => {
            //determine the type of response(fallback to JSON)
            contentType = typeof contentType == "string" ? contentType : "json";

            // Use the status code returned from the handler, or set the default status code to 200
            statusCode = typeof statusCode == "number" ? statusCode : 200;

            //return the response-parts that are content-specific
            let payloadString = "";
            if (contentType == "json") {
                res.setHeader("Content-Type", "application/json");
                //Use the payload from the handler, or set the default payload to an empty object
                payload = typeof payload == "object" ? payload : {};
                // Convert the payload to a string
                payloadString = JSON.stringify(payload);
            }
            if (contentType == "html") {
                res.setHeader("Content-Type", "text/html");
                payloadString = typeof payload == "string" ? payload : "";
            }
            if (contentType == "css") {
                res.setHeader("Content-Type", "text/css");
                payloadString = typeof payload !== "undefined" ? payload : "";
            }
            if (contentType == "png") {
                res.setHeader("Content-Type", "image/png");
                payloadString = typeof payload == "string" ? payload : "";
            }
            if (contentType == "favicon") {
                res.setHeader("Content-Type", "image/x-icon");
                payloadString = typeof payload !== "undefined" ? payload : "";
            }
            if (contentType == "jpg") {
                res.setHeader("Content-Type", "image/jpeg");
                payloadString = typeof payload !== "undefined" ? payload : "";
            }
            if (contentType == "plain") {
                res.setHeader("Content-Type", "text/plain");
                payloadString = typeof payload !== "undefined" ? payload : "";
            }
            // Return the response-parts that are common to all content-types
            res.writeHead(statusCode);
            res.end(payloadString);

            //if the response is 200 print green otherwise red
            //prettier-ignore
            if (statusCode == 200)
                debug("\x1b[36m%s\x1b[0m",method.toUpperCase()+" /"+trimmedPath + "" + statusCode);
            else debug("\x1b[35m%s\x1b[0m",method.toUpperCase()+" /"+trimmedPath + "" + statusCode);
            debug("Status: ", statusCode);
            debug(";buffer :", helpers.parseJsonToObject(buffer));
        });

        //send response
        // res.end("Hello World!");
        //logging
        // console.log(";path: ", trimmedPath);
        // console.log(";method : ", method);
        // console.log(";queryParams: ", queryStringObject);
        // console.log(";headers: ", headers);
        // console.log(";payload: ", buffer);
    });
};

// define a request router
server.router = {
    "": htmlHandlers.index,
    "account/create": htmlHandlers.accountCreate,
    "account/edit": htmlHandlers.accountEdit,
    "account/deleted": htmlHandlers.accountDeleted,
    "session/create": htmlHandlers.sessionCreate,
    "session/deleted": htmlHandlers.sessionDeleted,
    "checks/all": handlers.checksList,
    "checks/create": handlers.checksCreate,
    "checks/edit": handlers.checksEdit,
    ping: handlers.ping,
    "api/tokens": handlers.tokens,
    "api/users": handlers.users,
    "api/checks": handlers.checks,
    "favicon.ico": htmlHandlers.favicon,
    public: htmlHandlers.public,
};

//init script
//prettier-ignore
server.init = () => {

    
    //start the http server
    server.httpServer.listen(config.httpPort, () => {
        console.log("\x1b[36m%s\x1b[0m","server is listening at :"+config.httpPort)
    });

    //start the https server
    server.httpsServer.listen(config.httpsPort, () => {
        console.log("\x1b[35m%s\x1b[0m","server is listening at :"+config.httpsPort );
    });
};

module.exports = server;
