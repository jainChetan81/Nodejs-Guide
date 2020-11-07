const helpers = require("../lib/helpers");
const assert = require("assert");
const logs = require("../lib/logs");
const exampleDebuggingProblem = require("../lib/exampleDebuggingProblem");

//holder for tests
let unit = {};

//assert that the getAnumber function is returning a number1
unit["helpers.getANumber should return 1"] = (done) => {
    const val = helpers.getANumber();
    assert.equal(val, 1);
    done();
};
//assert that the getAnumber function is returning a anumber
unit["helpers.getANumber should return a number"] = (done) => {
    const val = helpers.getANumber();
    assert.equal(typeof val, "number");
    done();
};
//assert that the getAnumber function is returning a 2
unit["helpers.getANumber should return a 2"] = (done) => {
    const val = helpers.getANumber();
    assert.equal(val, 2);
    done();
};

//logs.list should callback an  arrray and a false error
unit["logs.list should callback a false error and an array of log names"] = (
    done
) => {
    logs.list(true, (err, logFileNames) => {
        assert.equal(err, false);
        assert.ok(logFileNames instanceof Array);
        assert.ok(logFileNames.length > 1);
        done();
    });
};

//logs truncate should not throw if the logId doesnot exist
unit[
    "logs.truncate should not throw if the logId does not exist. It should callback an error instead"
] = (done) => {
    assert.doesNotThrow(() => {
        logs.truncate("I do not exist", (err) => {
            assert.ok(err);
            done();
        });
    }, TypeError);
};

// exampleDebuggingProblem.init should not throw (but it does)
unit["exampleDebuggingProblem.init should not throw when called"] = (done) => {
    assert.doesNotThrow(() => {
        exampleDebuggingProblem.init();
        done();
    }, TypeError);
};

module.exports = unit;
