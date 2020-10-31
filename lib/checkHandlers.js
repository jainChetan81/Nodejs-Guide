//these are the request handlers
//dependencies
const _data = require("./data");
const helpers = require("./helpers");
const config = require("./config");
const handlers = require("./handlers");
//define all checkHandlers
let checkHandlers = {};

//?Checks
checkHandlers.checks = (data, callback) => {
    const acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.indexOf(data.method) > -1) {
        checkHandlers._checks[data.method](data, callback);
    } else callback(405);
};

checkHandlers._checks = {};

//checks-post
//required:protocol, url, method, successsCode,timeoutSeconds
//optional: none
checkHandlers._checks.post = (data, callback) => {
    //validate all these inputs
    const protocol =
        typeof data.payload.protocol == "string" &&
        ["https", "http"].indexOf(data.payload.protocol) > -1
            ? data.payload.protocol
            : false;
    const url =
        typeof data.payload.url == "string" &&
        data.payload.url.trim().length > 0
            ? data.payload.url.trim()
            : false;
    const method =
        typeof data.payload.httpmethod == "string" &&
        ["post", "get", "put", "delete"].indexOf(data.payload.httpmethod) > -1
            ? data.payload.httpmethod
            : false;
    const successCodes =
        // typeof data.payload.successCodes == "object"?
        //  &&
        // data.payload.successCodes instanceof Array &&
        // data.payload.successCodes.length > 0
        data.payload.successCodes;
    // : false;
    console.log(
        "data.payload.successCodes",
        data.payload.successCodes,
        typeof data.payload.successCodes == "boolean",
        data.payload.successCodes instanceof Array,
        data.payload.successCodes.length > 0
    );
    const timeoutSeconds =
        typeof data.payload.timeoutSeconds == "string" &&
        data.payload.timeoutSeconds % 1 == 0 &&
        5 >= data.payload.timeoutSeconds >= 1
            ? data.payload.timeoutSeconds
            : false;
    console.log("data.payload", data.payload);

    console.log(protocol, url, method, successCodes, timeoutSeconds);
    if (protocol && url && method && successCodes && timeoutSeconds) {
        //Get the token from the headers
        //prettier-ignore
        const token =typeof data.headers.token == "string" ? data.headers.token : false;
        //lookup the user by reading the token
        _data.read("tokens", token, (err, tokenData) => {
            if (!err && tokenData) {
                const userPhone = tokenData.phone;
                //lookup the user data
                _data.read("users", userPhone, (err, userData) => {
                    if (!err && data) {
                        const userChecks =
                            typeof userData.checks == "object" &&
                            userData.checks instanceof Array
                                ? userData.checks
                                : [];
                        if (userChecks.length < config.maxChecks) {
                            const checkId = helpers.createRandomString(20);
                            //create the check object and include user's phone
                            const checkObject = {
                                id: checkId,
                                userPhone,
                                protocol,
                                url,
                                method,
                                successCodes,
                                timeoutSeconds,
                            };
                            //prettier-ignore
                            _data.create("checks",checkId,checkObject,(err) => {
                                    if (!err) {
                                        //add the check id to the user's object
                                        userData.checks = userChecks;
                                        userData.checks.push(checkId);

                                        //save the new user data
                                        //prettier-ignore
                                        _data.update("users",userPhone,userData,(err) => {
                                                //return the data about the new check
                                                //prettier-ignore
                                                if (!err) {callback( 200, checkObject);}
                                                if(err)callback(500,{Error:"Couldnot update user"})
                                            }
                                        );
                                    }
                                    //prettier-ignore
                                    if (err)callback(500,{Error:"Could not create the new check"});
                                }
                            );
                        } else
                            callback(400, {
                                Error:
                                    "checks limit Eceeded(" +
                                    userData.checks.length +
                                    ")",
                            });
                    }
                    //prettier-ignore
                    if (err || !data)callback(403, { Error: "TokenData not found" });
                });
            }
            if (err || !tokenData) callback(403, { Error: "Token not found" });
        });
    } else callback(400, { Error: "Missing/Invalid required input fields" });
};

//?checks-get
//required:id
//optional: none
checkHandlers._checks.get = (data, callback) => {
    const id =
        typeof data.queryStringObject.id == "string" &&
        data.queryStringObject.id.trim().length >= 20
            ? data.queryStringObject.id.trim()
            : false;
    if (id) {
        //get the token frm the users
        //lookup the check
        _data.read("checks", id, (err, checkData) => {
            if (!err && checkData) {
                const token =
                    typeof data.headers.token == "string"
                        ? data.headers.token
                        : false;
                //verify that given token from headers is valid and belongs to the user created
                //prettier-ignore
                tokenHandlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                        if (tokenIsValid) {
                            //return the check data
                            callback(200, checkData);
                        }
                        //prettier-ignore
                        if (!tokenIsValid)
                            callback(403, { Error: "Missing/Invalid token in header"});
                    })
            }
            if (err || !checkData) callback(404, { Error: "Invalid id" });
        });
    } else callback(400, { Error: "Misssing Id" });
};

//?checks-put
//required:id
//optional: protocol,url,method,successCodes,timeoutSeconds
checkHandlers._checks.put = (data, callback) => {
    //required fields
    const id =
        typeof data.payload.id == "string" &&
        data.payload.id.trim().length >= 20
            ? data.payload.id.trim()
            : false;
    // optional fields
    const protocol =
        typeof data.payload.protocol == "string" &&
        ["https", "http"].indexOf(data.payload.protocol) > -1
            ? data.payload.protocol
            : false;
    const url =
        typeof data.payload.url == "string" &&
        data.payload.url.trim().length > 0
            ? data.payload.url.trim()
            : false;
    const method =
        typeof data.payload.method == "string" &&
        ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
            ? data.payload.method
            : false;
    const successCodes =
        typeof data.payload.successCodes == "object" &&
        data.payload.successCodes instanceof Array &&
        data.payload.successCodes.length > 0
            ? data.payload.successCodes
            : false;
    const timeoutSeconds =
        typeof data.payload.timeoutSeconds == "number" &&
        data.payload.timeoutSeconds % 1 == 0 &&
        5 >= data.payload.timeoutSeconds >= 1
            ? data.payload.timeoutSeconds
            : false;

    //check to make sure id is valid
    if (id) {
        //check is at least on optional field is there
        if (protocol || url || method || successCodes || timeoutSeconds) {
            _data.read("checks", id, (err, checkData) => {
                if (!err && checkData) {
                    const token =
                        typeof data.headers.token == "string"
                            ? data.headers.token
                            : false;
                    //verify that given token from headers is valid and belongs to the user created
                    //prettier-ignore
                    tokenHandlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                            if (tokenIsValid) {
                                //update the check whenever necessary
                                if (protocol) checkData.protocol = protocol;
                                if (url) checkData.url = url;
                                if (method) checkData.method = method;
                                if (successCodes)checkData.successCodes = successCodes;
                                if (timeoutSeconds)checkData.timeoutSeconds = timeoutSeconds;
                                
                                //store the new updates
                                _data.update('checks',id,checkData,(err)=>{
                                    if(!err) callback(200)
                                    if(err) callback(500,{Error:"Couldnot update the check"})
                                })
                                
                            }
                            //prettier-ignore
                            if(!tokenIsValid)callback(403,{Error:"Missing/Invalid token inHeader"});
                        }
                    );
                }
                //prettier-ignore
                if (err || !checkData)callback(400, { Error: "CheckId doesnot exist" });
            });
        } else callback(400, { Error: "Missing One field update" });
    }
    if (!id) callback(400, { Error: "Missing Id field" });
};
checkHandlers._checks.delete = (data, callback) => {
    const id =
        typeof data.queryStringObject.id == "string" &&
        data.queryStringObject.id.trim().length >= 20
            ? data.queryStringObject.id.trim()
            : false;
    if (id) {
        //lookup the token
        _data.read("checks", id, (err, checkData) => {
            if (!err && checkData) {
                const token =
                    typeof data.headers.token == "string"
                        ? data.headers.token
                        : false;
                //veify that tokenId is valid for the phone number
                //prettier-ignore
                tokenHandlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                        if (tokenIsValid) {
                            //delete the check
                            _data.delete("checks", id, (err) => {
                                if (!err) {
                                    //lookup the user
                                    _data.read("users",checkData.userPhone,(err, userData) => {
                                            if (!err && userData) {
                                                const userChecks =
                                                    typeof userData.checks =="object" && 
                                                    userData.checks instanceof Array
                                                        ? userData.checks
                                                        : [];

                                                //remove the deleted check from list of checks
                                                const checkPosition = userChecks.indexOf(id);
                                                if (checkPosition > -1) {
                                                    userChecks.splice(checkPosition, 1 );
                                                    //re-save the users data
                                                    _data.update("users",checkData.userPhone,
                                                        userData, (err) => {
                                                            if (!err)callback(200);
                                                            if (err)callback(500, {
                                                                    Error:"couldnot update user"});
                                                        });
                                                } else
                                                    callback(500, {
                                                        Error:"Couldnot find User Object"});
                                            }
                                            if (err)
                                                callback(404, {
                                                    Error:"Couldn't find User who created check"});
                                        });
                                }
                                if (err)callback(500, { Error:"Couldnot delete the checked data"});
                            });
                        }
                        if (!tokenIsValid)callback(403, {Error: "Missing/Invalid token in header"});
                    });
            }
            if (err || !checkData)
                callback(404, { Error: "checkId Not Found" });
        });
    }
    if (!id) callback(400, { Error: "Missing required field" });
};

module.exports = checkHandlers;
