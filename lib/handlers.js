//these are the request handlers
//dependencies
const _data = require("./data");
const helpers = require("./helpers");
const config = require("./config");
const tokenHandlers = require("./tokenHandler");
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
        tokenHandlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
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
            tokenHandlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
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
        console.log("token in account delettion", token);
        tokenHandlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
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
                                if (checksToDelete > 0) {
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
                                                }else callback(500,{Error:"Error occured while attempting to delete all of the users checks. All check may not have been deleetd from teh system successfully"})
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

handlers.exampleError = (data, callback) => {
    const error = new Error("This is an example error");
    throw error;
};

module.exports = handlers;
