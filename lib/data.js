//? libraray for storing and editing data

//dependencies
const fs = require("fs");
const path = require("path");
const helpers = require("./helpers");

//container for module(to export)
const lib = {};

//base directory of the data folder
lib.baseDir = path.join(__dirname, "/../.data/");

//write data to a file
lib.create = (dir, file, data, callback) => {
    //open the file for writting
    fs.open(
        lib.baseDir + dir + "/" + file + ".json",
        "wx",
        (err, fileDescriptor) => {
            if (!err && fileDescriptor) {
                //convert data to string
                const stringData = JSON.stringify(data);
                //write to file and close it
                fs.writeFile(fileDescriptor, stringData, (err) => {
                    if (!err) {
                        fs.close(fileDescriptor, (err) => {
                            if (!err) callback(false);
                            if (err) callback("Error closing new file");
                        });
                    }
                    if (err) callback("Error  writting to new file");
                });
            }
            if (err) callback("Could not create file, it may already exists");
        }
    );
};

//read data from a file
lib.read = (dir, file, callback) => {
    fs.readFile(
        lib.baseDir + dir + "/" + file + ".json",
        "utf-8",
        (err, data) => {
            if (!err && data) {
                const parseData = helpers.parseJsonToObject(data);
                callback(false, parseData);
            }
            if (err) callback(err, data);
        }
    );
};

//update existing data
lib.update = (dir, file, data, callback) => {
    //open the file for writting
    fs.open(
        lib.baseDir + dir + "/" + file + ".json",
        "r+",
        (err, fileDescriptor) => {
            if (!err && fileDescriptor) {
                //convert data to string
                const stringData = JSON.stringify(data);
                //truncate the file
                fs.truncate(fileDescriptor, (err) => {
                    if (!err) {
                        //write to the file and close it
                        fs.writeFile(fileDescriptor, stringData, (err) => {
                            if (!err) {
                                fs.close(fileDescriptor, (err) => {
                                    if (!err) callback(false);
                                    if (err) callback("Error closing file");
                                });
                            }
                            if (err)
                                callback("Error writting to existing file");
                        });
                    }
                    if (err) callback("Error Truncating File");
                });
            }
            if (err) callback("Coudnot open the file for update,may not exist");
        }
    );
};

lib.delete = (dir, file, callback) => {
    // unlinking the file
    fs.unlink(lib.baseDir + dir + "/" + file + ".json", (err) => {
        callback(err);
    });
};

lib.list = (dir, callback) => {
    fs.readdir(lib.baseDir + dir + "/", (err, data) => {
        if (!err && data && data.length > 0) {
            let trimmedFilesNames = [];
            data.forEach((fileName) => {
                trimmedFilesNames.push(fileName.replace(".json", ""));
            });
            callback(false, trimmedFilesNames);
        } else callback(err, data);
    });
};

//exporting
module.exports = lib;
