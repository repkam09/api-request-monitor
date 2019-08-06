/**
 * Simple monitor program to make a request against different rest APIs
 * and record their response time. This should be run via cron every 30 minutes.
 */

const axios = require("axios");
const urls = require("./urls.json");
const fs = require('fs');
const logfile = "vgr-func-test-results.txt";

const runtime = Date.now();
const logdefault = "time, error, name, overtime, responsetime, url \n"
if (!fs.existsSync(logfile)) {
    fs.writeFileSync(logfile, logdefault);
}

const requests = urls.map((req) => {
    // Make a request via Axios to get the response time
    return makeRequest(req.rid, req.type, req.url, req.maxtime, req.body);
});

Promise.all(requests).then((results) => {
    console.log("All requests finished!");
    results.forEach((res) => {
        let logline = runtime + ", " + res.error + ", " + res.rid + ", " + res.overtime + ", " + res.responseTime + ", " + res.url + "\n";
        fs.appendFileSync(logfile, logline);
    });
});


/**
 * Makes a request and returns a payload containing time, name, url, and response details
 * 
 * @param {*} rid The friendly name for the URL
 * @param {*} type The type of request to make, GET, POST, HEAD, etc
 * @param {*} url The URL that should be requested
 */
function makeRequest(rid, type, url, timeout, body) {
    console.log("Starting " + type + " request for " + rid + " [" + url + "]");
    // Grab a start time
    const startTime = new Date();
    return new Promise((resolve) => {
        // Create the axios request object
        let config = {
            method: type,
            url: url,
        }

        if (body) {
            config.data = body;
            console.log("   Body: " + JSON.stringify(body));
        }

        // Make the axios request to the url

        let error = false;
        let details = null;
        let overtime = false;

        axios.request(config).then((response) => {
            error = false;
            details = response;
        }).catch((err) => {
            console.log("Error: " + err.message + " for request " + url);
            error = true;
            details = err;
        }).finally(() => {
            // Calculate the finish time of the request and return to the promise array
            const endTime = new Date();
            const diffTime = endTime - startTime;

            if (diffTime > timeout) {
                overtime = true;
            }

            const results = { error, responseTime: diffTime, details, rid, url, overtime: overtime };
            resolve(results);
        });
    });
}

