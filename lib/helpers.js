//helpers for various tasks
//dependencies
const crypto = require("crypto");
const config = require("./config");
const queryString = require("querystring");
const https = require("https");
const path = require("path");
const fs = require("fs");
//container for all the helpers
const helpers = {};
//create a SHA256 hash
helpers.hash = (str) => {
    if (typeof str == "string" && str.length > 0) {
        const hash = crypto
            .createHmac("sha256", config.hashingSecret)
            .update(str)
            .digest("hex");
        return hash;
    } else return false;
};

//pasrse a JSon string to obj w/o throwing error
helpers.parseJsonToObject = (str) => {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch (e) {
        return {};
    }
};

//create a randomalpha numeric string of given length
helpers.createRandomString = (strLen) => {
    strLen = typeof strLen == "number" && strLen > 0 ? strLen : false;
    if (strLen) {
        //define all the possible characters that could go into string
        const possibeCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";

        //start the final string
        let str = "";
        for (let i = 0; i < strLen; ++i) {
            //get a random character from possible characters and append to string
            var randomCharacter = possibeCharacters.charAt(
                Math.floor(Math.random() * possibeCharacters.length)
            );
            str += randomCharacter;
        }
        return str;
    }
    if (!strLen) return false;
};

//send a message via twilio
helpers.sendTwilioSms = (phone, msg, callback) => {
    //validate params
    phone =
        typeof phone == "string" && phone.trim().length == 10
            ? phone.trim()
            : false;

    msg =
        typeof msg == "string" &&
        msg.trim().length > 0 &&
        msg.trim().length <= 1600
            ? msg.trim()
            : false;
    if (phone && msg) {
        //configure the request payload
        const payload = {
            From: config.twilio.fromPhone,
            To: +91 + phone,
            Body: msg,
        };
        //stringify the payload
        const stringPayload = queryString.stringify(payload);

        //configure the request details
        const requestDetails = {
            protocol: "https:",
            hostname: "api.twilio.com",
            method: "POST",
            path:
                "/2010-04-01/Accounts/" +
                config.twilio.accountSID +
                "/Messages.json",
            auth: config.twilio.accountSID + ":" + config.twilio.authToken,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": Buffer.byteLength(stringPayload),
            },
        };

        //instatiate the request object
        const req = https.request(requestDetails, (res) => {
            //grab the status of the sent request
            const status = res.statusCode;
            //callback successfully if the request went through
            if (status == 200 || status == 200) callback(false);
            else callback("Status code returned was " + status);
        });

        //bind to the error event so that it doesn't get thrown
        req.on("error", (e) => {
            callback(e);
        });

        //add the payload
        req.write(stringPayload);

        //end the request
        req.end();
    }
    if (!phone || !msg) callback("Given Params were Missing/Invalid");
};
module.exports = helpers;
