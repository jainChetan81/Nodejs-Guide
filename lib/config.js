//create and export config variables

//container for all env
var environments = {};

//staging(default) object
environments.staging = {
    httpPort: 3000,
    httpsPort: 3001,
    envName: "staging",
    hashingSecret: "thisIsASecret",
    maxChecks: 5,
    twilio: {
        accountSID: "ACf213c624fcc10a2348b6bdeb44ed18db",
        authToken: "f8e1ab393bd423d8c767997d0670aaaa",
        fromPhone: "+918700776723",
    },
    templateGlobals: {
        appName: "UptimeChecker",
        companyName: "NotARealCompany, Inc",
        yearCreated: "2018",
        baseUrl: "http://localhost:3000/",
    },
};
//production environment
environments.production = {
    httpPort: 5000,
    httpsPort: 5001,
    envName: "production",
    hashingSecret: "thisIsASecret",
    maxChecks: 5,
    twilio: {
        accountSID: "",
        authToken: "",
        fromPhone: "",
    },
    templateGlobals: {
        appName: "UptimeChecker",
        companyName: "NotARealCompany, Inc",
        yearCreated: "2018",
        baseUrl: "",
    },
};

//detrmine which env was passed as a cli argument
var currentEnvironment =
    typeof process.env.NODE_ENV == "string"
        ? process.env.NODE_ENV.toLowerCase()
        : "";

//check the current env is one of the env above
//, if not , default to staging
var environmentToExport =
    typeof environments[currentEnvironment] == "object"
        ? environments[currentEnvironment]
        : environments.staging;

module.exports = environmentToExport;
