//appication logic for the test runner
_app = {};

//container for the tests
_app.tests = {
    unit: {},
};
_app.tests.unit = require("./unit");

//count all the tests
_app.countTests = () => {
    let counter = 0;
    for (let key in _app.tests) {
        if (_app.tests.hasOwnProperty(key)) {
            let subTests = _app.tests[key];
            for (let testName in subTests) {
                if (subTests.hasOwnProperty(testName)) {
                    counter++;
                }
            }
        }
    }
    return counter;
};

//produce  a test outcome report
_app.produceTestReport = (limit, success, errors) => {
    console.log("");
    console.log("-----------------BEGIN TEST REPORT-------------------");
    console.log("");
    console.log("Total Tests: ", limit);
    console.log("Pass: ", success);
    console.log("Fail: ", errors.length);
    console.log("");

    //if there are errors print them in details
    if (errors.length > 0) {
        console.log("-----------------BEGIN ERROR DETAILS-------------------");
        console.log("");
        errors.forEach((error) => {
            console.log("\x1b[31m%s\x1b[0m", error.name);
            console.log(error.error);
            console.log("");
        });
        console.log("");
        console.log("-----------------END ERROR DETAILS-------------------");
    }

    console.log("");
    console.log("-----------------END TEST REPORT-------------------");
};

//run all the tests, collecting the errors and functions
_app.runTests = () => {
    let errors = [];
    let success = 0;
    let limit = _app.countTests();
    let counter = 0;
    for (let key in _app.tests) {
        let subTests = _app.tests[key];
        for (let testName in subTests) {
            if (subTests.hasOwnProperty(testName)) {
                (() => {
                    let temporaryTestName = testName;
                    let testValue = subTests[testName];
                    //call the tests
                    try {
                        testValue(() => {
                            //if it calls back w/o throwing, then it succeded so log it in green
                            console.log("\x1b[32m%s\x1b[0m", temporaryTestName);
                            counter++;
                            success++;
                            if (counter == limit) {
                                console.log("try test value");
                                _app.produceTestReport(limit, success, errors);
                            }
                        });
                    } catch (error) {
                        //if it throws, then capture the error thrown and log it in the red
                        errors.push({ name: testName, error });
                        console.log("\x1b[31m%s\x1b[0m", temporaryTestName);
                        counter++;
                        if (counter == limit) {
                            _app.produceTestReport(limit, success, errors);
                        }
                    }
                })();
            }
        }
    }
};

//RUN THE TESTS
_app.runTests();
