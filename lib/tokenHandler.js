//these are the request handlers
//dependencies
const _data = require("./data");
const helpers = require("./helpers");
//define all checkHandlers
let tokenHandlers = {};

//handle tokens
tokenHandlers.tokens = (data, callback) => {
    const acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.indexOf(data.method) > -1) {
        tokenHandlers._tokens[data.method](data, callback);
    } else callback(405);
};
tokenHandlers._tokens = {};

//tokens-post
// required data: phone, password
//optional data:none
tokenHandlers._tokens.post = (data, callback) => {
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
tokenHandlers._tokens.get = (data, callback) => {
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
tokenHandlers._tokens.put = (data, callback) => {
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
tokenHandlers._tokens.delete = (data, callback) => {
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
tokenHandlers._tokens.verifyToken = (id, phone, callback) => {
    //lookup the token
    _data.read("tokens", id, (err, tokenData) => {
        console.log("tokenData", tokenData);
        if (!err && tokenData) {
            //check the token is for the given user and hasnot expired
            if (tokenData.phone == phone && tokenData.expires > Date.now())
                callback(true);
            else {
                console.log("token doesn't match or has expired");
                callback(false);
            }
        } else callback(false);
    });
};

module.exports = tokenHandlers;
