//API TESTS

//dependencies
const app = require("./../index");
const assert = require("assert");
const http = require("http");
const config = require("../lib/config");

//holder for the test
let api = {};

//helpers
let helpers = {};
helpers.makeGetRequests = (path, callback) => {
    //configure the request detils
    let requestDetails = {
        protocol: "http:",
        hostname: "localhost",
        port: config.httpPort,
        method: "GET",
        path,
        headers: {
            "Content-Type": "application/json",
        },
    };
    //send the requests
    let req = http.request(requestDetails, (res) => {
        callback(res);
    });
    req.end();
};

//the main init() function should be able to run w/o throwing
api["app.init should start w/o throwing"] = (done) => {
    assert.doesNotThrow(() => {
        app.init((err) => done());
    }, TypeError);
};

//make a request to /ping
api["/ping should respond to GET with 200"] = () => {
    helpers.makeGetRequests("/ping", (res) => {
        assert.equal(res.statusCode, 200);
    });
};

//make a request to /api/users
api["/api/users should respond to GET with 400"] = () => {
    helpers.makeGetRequests("/api/users", (res) => {
        assert.equal(res.statusCode, 400);
    });
};

//make a request to /api/users
api["A random Path should respond to GET with 404"] = () => {
    helpers.makeGetRequests("/this/path/shouldnt/exits", (res) => {
        assert.equal(res.statusCode, 404);
    });
};

//export the tests to the number
module.exports = api;
