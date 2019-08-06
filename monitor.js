/**
 * Simple monitor program to make a request against different rest APIs
 * and record their response time. This should be run via cron every 30 minutes.
 */

const axios = require("axios");
const urls = require("./urls.json");

const requests = urls.map((req) => {
    // Make a request via Axios to get the response time
    return makeRequest(req.rid, req.type, req.url, req.maxtime);
});

/**
 * Makes a request and returns a payload containing time, name, url, and response details
 * 
 * @param {*} rid The friendly name for the URL
 * @param {*} type The type of request to make, GET, POST, HEAD, etc
 * @param {*} url The URL that should be requested
 */
function makeRequest(rid, type, url, timeout) {
    // Grab a start time
    const startTime = new Date();
    return new Promise((resolve) => {
        // Create the axios request object
        const config = {
            method: type,
            url: url,
        }

        // Make the axios request to the url

        let error = false;
        let details = null;
        let overtime = false;

        axios.request(config).then((response) => {
            error = false; details = response;
        }).catch((err) => {
            error = true; details = err;
        }).finally(() => {
            // Calculate the finish time of the request and return to the promise array
            const endTime = new Date();
            const diffTime = endTime - startTime;

            if (diffTime > timeout) {
                overtime = true;
                console.warn("Warning: API request " + rid + " returned after the allowed time");
            }

            resolve({ error, responseTime: diffTime, details, rid, url, overtime: overtime });
        });
    });
}

Promise.all(requests).then((results) => {
    console.log("All requests finished!");
    results.forEach((res) => {
        let addString = ", which is within the allowed time";
        if (res.overtime) {
            addString = ", which is outside of the allowed time! This request was slow.";
        }

        if (res.error) {
            console.log("Request '" + res.rid + "' finished with an error: " + res.details.message);
        } else {
            console.log("Request '" + res.rid + "' finished in " + (res.responseTime / 1000) + " seconds" + addString);
        }
    });
});

