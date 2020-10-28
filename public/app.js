//? front-end logic for the application
//container for frntend application
const app = {};
app.config = {
    sesionToken: false,
};

//ajax client for restful api
app.client = {};
//interface for making api callsprettier-ignore

app.client.request = (
    headers,
    path,
    method,
    queryStringObject,
    payload,
    callback
) => {
    //set defaults
    headers = typeof headers == "object" && headers !== null ? headers : {};
    path = typeof path == "string" ? path : "/";
    method =
        typeof method == "string" &&
        ["POST", "GET", "PUT", "DELETE"].indexOf(method) > -1
            ? method.toUpperCase()
            : GET;
    queryStringObject =
        typeof queryStringObject == "object" && queryStringObject !== null
            ? queryStringObject
            : {};
    payload = typeof payload == "object" && payload !== null ? payload : {};
    callback = typeof callback == "function" ? callback : false;

    //for each query string params sent, add each to the path
    let requestUrl = path + "?";
    let counter = 0;
    for (let queryKey in queryStringObject) {
        if (queryStringObject.hasOwnProperty(queryKey)) {
            counter++;
            //if at least 1 query string params has been added , prepend new one with an ampersand
            if (counter > 1) requestUrl += "&";
            //add the key and value
            requestUrl += queryKey + "=" + queryStringObject[queryKey];
        }
    }
    //form  the http request as a JSON type
    let xhr = new XMLHttpRequest();
    xhr.open(method, requestUrl, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    //for each header sent , add it to the request
    for (let headerKey in headers) {
        if (headers.hasOwnProperty(headerKey))
            xhr.setRequestHeader(headerKey, headers[headerKey]);
    }

    //if there is a current session token set, add that as a header
    if (app.config.sessionToken)
        xhr.setRequestHeader("token", app.config.sessionToken.id);

    //when the request comes back , handle the request
    xhr.onreadystatechange = () => {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            let statusCode = xhr.status;
            let responseReturned = xhr.responseText;

            //callback if requested
            if (callback) {
                try {
                    let parsedResponse = JSON.parse(responseReturned);
                    callback(statusCode, parsedResponse);
                } catch (e) {
                    callback(statusCode, false);
                }
            }
        }
    };
    //send the payload as a Json
    let payloadString = JSON.stringify(payload);
    xhr.send(payloadString);
};
