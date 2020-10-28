//? library for storing and rotating logs

//dependencies
const path = require("path");
const fs = require("fs");
const zlib = require("zlib");
const _data = require("./data");
const http = require("http");
const https = require("https");
const helpers = require("./helpers");
const url = require("url");

//container for the module
let lib = {};

//base directory of the logs folder
lib.baseDir = path.join(__dirname, "/../.logs/");

//append a string to a file create the file if it doesnot exist
lib.append = (file, str, callback) => {
    //open the file for appending
    fs.open(lib.baseDir + file + ".log", "a", (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            //append to the file and close it
            fs.appendFile(fileDescriptor, str + "\n", (err) => {
                if (!err) {
                    fs.close(fileDescriptor, (err) => {
                        if (!err) callback(false);
                        if (err)
                            callback("Error: Closing file after appending");
                    });
                }
                if (err) console.log("Error: Appending the file");
            });
        }
        if (err || fileDescriptor) console.log("");
    });
};

//list all the logs and optionally include the compressed logs
lib.list = (includeCompressedLogs, callback) => {
    fs.readdir(lib.baseDir, (err, data) => {
        if (!err && data && data.length > 0) {
            const trimmedFileNames = [];
            data.forEach((fileName) => {
                //add the .log files
                if (fileName.indexOf(".log") > -1) {
                    trimmedFileNames.push(fileName.replace(".log", ""));
                }
                //add on the .gz files
                if (fileName.indexOf(".gz.b64") > -1 && includeCompressedLogs) {
                    trimmedFileNames.push(fileName.replace(".gz.b64", ""));
                }
            });
            callback(false, trimmedFileNames);
        }
        if (err || !data) callback(err, data);
    });
};

//compress the contents of one .log file into a .gz.b64 file within the same directory
lib.compress = (logId, newFieldId, callback) => {
    const sourceFile = `${logId}.log`;
    const destFile = newFieldId + ".gz.b64";

    //read the source file
    fs.readFile(lib.baseDir + sourceFile, "utf-8", (err, inputString) => {
        if (!err && inputString) {
            //compress the data using gzib
            zlib.gzip(inputString, (err, buffer) => {
                if (!err && buffer) {
                    //send the data to the destination file
                    //prettier-ignore
                    fs.open(lib.baseDir + destFile , "wx",(err, fileDescriptor) => {
                        if (!err && fileDescriptor) {
                            //write to the destination file
                            fs.writeFile( fileDescriptor,buffer.toString("base64"),(err) => {
                                if (!err) {
                                    fs.close(fileDescriptor, (err) => {
                                        if (!err) callback(false);
                                        if (err) callback(err);
                                    });
                                }
                                if (err) callback(err);
                            });
                        }
                        if (err || !fileDescriptor) callback(err);
                    });
                } else callback(err);
            });
        }
        if (err || !inputString) callback(err);
    });
};

//decompress the content of a .gz.b64 file into a string variable
lib.decompress = (fileId, callback) => {
    const fileName = fileId + ".gz.b64";
    fs.readFile(lib.baseDir + fileName, "utf-8", (err, str) => {
        if (!err && str) {
            //decompress the data
            const inputBuffer = Buffer.from(str, "base64");
            zlib.unzip(inputBuffer, (err, outputBuffer) => {
                if (!err && outputBuffer) {
                    //callback
                    const str = outputBuffer.toString();
                    callback(false, str);
                }
                if (err || !outputBuffer) callback(err);
            });
        }
        if (err || !str) callback(err);
    });
};

//trncate a log file
lib.truncate = (logId, callback) => {
    fs.truncate(lib.baseDir + logId + ".log", 0, (err) => {
        if (!err) callback(false);
        if (err) callback(err);
    });
};

//exporting module
module.exports = lib;
