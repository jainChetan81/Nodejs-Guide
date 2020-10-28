//these are the request handlers
//dependencies
const _data = require("./data");
const helpers = require("./helpers");
const config = require("./config");
//define all handlers
let handlers = {};

// ping handlers
handlers.ping = (data, callback) => {
    // callback a http status code and a payload
    callback(200, { name: "ping handler" });
};
//not found handler
handlers.notFound = (data, callback) => {
    callback(404);
};

//handle users
handlers.users = (data, callback) => {
    const acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else callback(405);
};

handlers._users = {};

//required data;fname,lname,phone,pass,tosAgreement
//optional data:none
handlers._users.post = (data, callback) => {
    //check all required field are filled
    const firstName =
        typeof data.payload.firstName == "string" &&
        data.payload.firstName.trim().length > 0
            ? data.payload.firstName.trim()
            : false;
    const lastName =
        typeof data.payload.lastName == "string" &&
        data.payload.lastName.trim().length > 0
            ? data.payload.lastName.trim()
            : false;
    const phone =
        typeof data.payload.phone == "string" &&
        data.payload.phone.trim().length == 10
            ? data.payload.phone.trim()
            : false;
    const password =
        typeof data.payload.password == "string" &&
        data.payload.password.trim().length > 0
            ? data.payload.password.trim()
            : false;
    const tosAgreement =
        typeof data.payload.tosAgreement == "boolean" &&
        data.payload.tosAgreement == true
            ? true
            : false;
    console.log(
        "everything is here",
        firstName,
        lastName,
        phone,
        password,
        tosAgreement
    );
    if (firstName && lastName && phone && password && tosAgreement) {
        //make sure that the user doesn't already exists
        _data.read("users", phone, (err, data) => {
            if (err) {
                //hash the password
                const hashedPassword = helpers.hash(password);

                // create a user object
                if (hashedPassword) {
                    const userObject = {
                        firstName,
                        lastName,
                        phone,
                        hashedPassword,
                        tosAgreement: true,
                    };

                    //store the user
                    _data.create("users", phone, userObject, (err) => {
                        if (!err) callback(200);
                        if (err) {
                            console.log("err", err);
                            callback(500, {
                                Error: "Couldn't create new user",
                            });
                        }
                    });
                } else
                    callback(500, {
                        Error: "Couldnot create hash",
                    });
            } else callback(400, { Error: "A User already exists" });
        });
    } else callback(400, { Error: "Missing required fields" });
};

//required data :phone
//optional data:none
handlers._users.get = (data, callback) => {
    //check the phone provided is valid
    const phone =
        typeof data.queryStringObject.phone == "string" &&
        data.queryStringObject.phone.trim().length == 10
            ? data.queryStringObject.phone.trim()
            : false;
    if (phone) {
        //get the token frm the users
        const token =
            typeof data.headers.token == "string" ? data.headers.token : false;
        //verify that given token from headers is valid
        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                //lookup the user
                _data.read("users", phone, (err, data) => {
                    if (!err && data) {
                        //remove the hashed password
                        delete data.hashedPassword;
                        callback(200, data);
                    }
                    if (err) callback(404, { Error: "User Not Found" });
                });
            }
            if (!tokenIsValid)
                callback(403, { Error: "Missing/Invalid token in header" });
        });
    } else callback(400, { Error: "Misssing required field" });
};

//required data :phone
//optional data:fname, lname, password (at least one must be specified)
handlers._users.put = (data, callback) => {
    //check for required fields
    const phone =
        typeof data.payload.phone == "string" &&
        data.payload.phone.trim().length == 10
            ? data.payload.phone.trim()
            : false;
    //check for the optional field
    const firstName =
        typeof data.payload.firstName == "string" &&
        data.payload.firstName.trim().length > 0
            ? data.payload.firstName.trim()
            : false;
    const lastName =
        typeof data.payload.lastName == "string" &&
        data.payload.lastName.trim().length > 0
            ? data.payload.lastName.trim()
            : false;
    const password =
        typeof data.payload.password == "string" &&
        data.payload.password.trim().length > 0
            ? data.payload.password.trim()
            : false;
    //error if the phone is invalid
    if (phone) {
        if (firstName || lastName || password) {
            const token =
                typeof data.headers.token == "string"
                    ? data.headers.token
                    : false;
            handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
                if (tokenIsValid) {
                    _data.read("users", phone, (err, userData) => {
                        if (!err && userData) {
                            if (firstName) userData.firstName = firstName;
                            if (lastName) userData.lastName = lastName;
                            if (password)
                                userData.hashedPassword = helpers.hash(
                                    password
                                );
                            //store the new updates
                            _data.update("users", phone, userData, (err) => {
                                if (!err) callback(200, "User Ceated");
                                if (err)
                                    callback(500, {
                                        Error: "couldnot update user",
                                    });
                            });
                        }

                        if (err && !userData)
                            callback(400, { Error: "user not exists" });
                    });
                }
                if (!tokenIsValid)
                    callback(403, { Error: "Missing/Invalid token in header" });
            });
        } else callback(400, { Error: "Missing fields to update" });
    }
    if (!phone) callback(400, { Error: "missing required Field" });
};

//required data :phone
handlers._users.delete = (data, callback) => {
    //check for required fields
    const phone =
        typeof data.queryStringObject.phone == "string" &&
        data.queryStringObject.phone.trim().length >= 10
            ? data.queryStringObject.phone.trim()
            : false;
    if (phone) {
        const token =
            typeof data.headers.token == "string" ? data.headers.token : false;
        console.log("token", token);
        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                _data.read("users", phone, (err, userData) => {
                    if (!err && userData) {
                        //remove the hashed password
                        _data.delete("users", phone, (err) => {
                            if (!err) {
                                const userChecks =
                                    typeof userData.checks == "object" &&
                                    userData.checks instanceof Array
                                        ? userData.checks
                                        : [];
                                const checksToDelete = userChecks.length;
                                if (CharacterData > 0) {
                                    let checksDeleted = 0;
                                    let deletionErrors = false;

                                    //loop through the checks
                                    userChecks.forEach((checkId) => {
                                        //delete the checks
                                        //prettier-ignore
                                        _data.delete("checks",checkId, (err) => {
                                                if (err) deletionErrors = true;
                                                checksDeleted++; 
                                                if(checksDeleted==checksToDelete){
                                                    if(!deletionErrors)callback(200)
                                                }else callback(500,{Error:"Error occured while attempting to delete  all of the users checks. All check may not have been deleetd from teh system successfully"})
                                            }
                                        );
                                    });
                                } else callback(200);
                            }
                            if (err)
                                callback(500, {
                                    Error: "Couldnot delete User",
                                });
                        });
                    }
                    if (err) callback(400, { Error: "User Not Found" });
                });
            }
            if (!tokenIsValid)
                callback(403, { Error: "Missing/Invalid token in header" });
        });
        //lookup the user
    } else callback(400, { Error: "Misssing required field" });
};

//handle tokens
handlers.tokens = (data, callback) => {
    const acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else callback(405);
};
handlers._tokens = {};

//tokens-post
// required data: phone, password
//optional data:none
handlers._tokens.post = (data, callback) => {
    //check for required fields
    const phone =
        typeof data.payload.phone == "string" &&
        data.payload.phone.trim().length == 10
            ? data.payload.phone.trim()
            : false;
    const password =
        typeof data.payload.password == "string" &&
        data.payload.password.trim().length > 0
            ? data.payload.password.trim()
            : false;
    if (phone && password) {
        //lookup the user
        _data.read("users", phone, (err, userData) => {
            if (!err && userData) {
                //hash the sent password and compare it to stored user pass
                const hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword) {
                    //if valid create a new token with random name
                    //expiration date 1 hour in the future
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenObject = {
                        phone,
                        id: tokenId,
                        expires,
                    };
                    //store the token
                    _data.create("tokens", tokenId, tokenObject, (err) => {
                        console.log("tokenObject", tokenObject);
                        if (!err) callback(200, tokenObject);
                        if (err)
                            callback(500, { Error: "Couldnot create Token" });
                    });
                } else {
                    callback(400, { Error: "Password didnot match" });
                }
            }
            if (err) callback(400, { Error: "User Not Found" });
        });
    } else callback(400, { Error: "Missing required fields" });
};

//tokens-get required: id optional:none
handlers._tokens.get = (data, callback) => {
    //check that the id is valid
    const id =
        typeof data.queryStringObject.id == "string" &&
        data.queryStringObject.id.trim().length >= 20
            ? data.queryStringObject.id.trim()
            : false;
    if (id) {
        //lookup the token
        _data.read("tokens", id, (err, tokenData) => {
            if (!err && tokenData) {
                callback(200, tokenData);
            }
            if (err) callback(404, { Error: "token Not Found" });
        });
    } else callback(400, { Error: "Misssing required field" });
};

//tokens-get required: id,token optional:none
handlers._tokens.put = (data, callback) => {
    const id =
        typeof data.payload.id == "string" &&
        data.payload.id.trim().length >= 20
            ? data.payload.id.trim()
            : false;
    const extend =
        typeof data.payload.extend == "boolean" && data.payload.extend == true
            ? true
            : false;
    console.log("id && extend", id, extend);
    if (id && extend) {
        //lookup the token
        _data.read("tokens", id, (err, tokenData) => {
            if (!err && tokenData) {
                //check to make sur etoken is not already expired
                if (tokenData.expires > Date.now()) {
                    //set the expiration an hour from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    //store the new updates
                    _data.update("tokens", id, tokenData, (err) => {
                        if (!err) callback(200, "Updated Token");
                        if (err)
                            callback(500, {
                                Error: "Couldnot update token's expiration",
                            });
                    });
                } else callback(400, { Error: "Token has already expired" });
            }
            if (err) callback(404, { Error: "token Not Found" });
        });
    }
    if (!id || !extend)
        callback(400, { Error: "Missing required field(s) are invalid" });
};

//token-delete required : id optional:none
handlers._tokens.delete = (data, callback) => {
    const id =
        typeof data.queryStringObject.id == "string" &&
        data.queryStringObject.id.trim().length >= 20
            ? data.queryStringObject.id.trim()
            : false;
    if (id) {
        //lookup the token
        _data.read("tokens", id, (err, tokenData) => {
            if (!err && tokenData) {
                //store the new updates
                _data.delete("tokens", id, (err) => {
                    if (!err) callback(200, "Deleted Token");
                    if (err) callback(500, { Error: "Couldnot delete token" });
                });
            }
            if (err) callback(404, { Error: "token Not Found" });
        });
    }
    if (!id) callback(400, { Error: "Missing required field" });
};

//verify a token id is currently valid for a given user
handlers._tokens.verifyToken = (id, phone, callback) => {
    //lookup the token
    _data.read("tokens", id, (err, tokenData) => {
        console.log("tokenData", tokenData);
        if (!err && tokenData) {
            //check the token is for the given user and hasnot expired
            if (tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true);
            } else callback(false);
        } else callback(false);
    });
};

//?Checks
handlers.checks = (data, callback) => {
    const acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else callback(405);
};

handlers._checks = {};

//checks-post
//required:protocol, url, method, successsCode,timeOutSeconds
//optional: none
handlers._checks.post = (data, callback) => {
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
    const timeOutSeconds =
        typeof data.payload.timeOutSeconds == "number" &&
        data.payload.timeOutSeconds % 1 == 0 &&
        5 >= data.payload.timeOutSeconds >= 1
            ? data.payload.timeOutSeconds
            : false;
    if (protocol && url && method && successCodes && timeOutSeconds) {
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
                                timeOutSeconds,
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
handlers._checks.get = (data, callback) => {
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
                handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
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
//optional: protocol,url,method,successCodes,timeOutSeconds
handlers._checks.put = (data, callback) => {
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
    const timeOutSeconds =
        typeof data.payload.timeOutSeconds == "number" &&
        data.payload.timeOutSeconds % 1 == 0 &&
        5 >= data.payload.timeOutSeconds >= 1
            ? data.payload.timeOutSeconds
            : false;

    //check to make sure id is valid
    if (id) {
        //check is at least on optional field is there
        if (protocol || url || method || successCodes || timeOutSeconds) {
            _data.read("checks", id, (err, checkData) => {
                if (!err && checkData) {
                    const token =
                        typeof data.headers.token == "string"
                            ? data.headers.token
                            : false;
                    //verify that given token from headers is valid and belongs to the user created
                    //prettier-ignore
                    handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                            if (tokenIsValid) {
                                //update the check whenever necessary
                                if (protocol) checkData.protocol = protocol;
                                if (url) checkData.url = url;
                                if (method) checkData.method = method;
                                if (successCodes)checkData.successCodes = successCodes;
                                if (timeOutSeconds)checkData.timeOutSeconds = timeOutSeconds;
                                
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
handlers._checks.delete = (data, callback) => {
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
                handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
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

module.exports = handlers;
