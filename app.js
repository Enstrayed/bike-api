const { json } = require('body-parser'); // I didn't write this (did vsc add it?)
const express = require('express') // Provides core of API
const fs = require('fs'); // Provides filesystem modification
const randkey = require('random-key') // Provides "random" API key generation
const date = new Date; // Provides Date and Time
const app = express()

// launch argument check
if (process.argv[2] === undefined || process.argv[3] === undefined) {
    console.log(`ERR | ${getLoggableDateTime()} | You need to pass a port and proxy URL!`);
    process.exit(1);
}

// set listening port and url listen for reverse proxy
const port = process.argv[2]; //no input validation
const proxyUrl = process.argv[3]; //no input validation

// regenerate api keys check
allowedAuths = JSON.parse(fs.readFileSync('authorization.json', 'utf8'));
if (allowedAuths.regenerateKeys === true) {
    allowedAuths.allowedKeys = []; //empty allowedkeys
    allowedAuths.allowedKeys.push(randkey.generate(10)); //push 3 fresh keys
    allowedAuths.allowedKeys.push(randkey.generate(10));
    allowedAuths.allowedKeys.push(randkey.generate(10));
    allowedAuths.regenerateKeys = false; //dont repeat this on next start

    fs.writeFileSync('authorization.json', JSON.stringify(allowedAuths)); //write that to disk
    console.log(`INF | ${getLoggableDateTime()} | Regenerated and wrote new API keys`);
}

//startup information
console.log(`INF | ${getLoggableDateTime()} | Proxy URL is set to ${proxyUrl}`);

// handles posts
app.post(proxyUrl, (req, res) => {

    if (checkAuth(req.query.authorization) === true) { //authentication check

        switch (req.query.action) { //action parameter switch (add new actions here)
            case "log":
                logRequestToScreen("INF",req.query.authorization,`Log: ${req.query.log}`)

                switch (req.query.log) { //log parameter switch (add new loggables here)

                    case "bikeTamperTrip":
                        logRequestToDisk("INF",req.query.authorization,"Bike Tamper Alarm Tripped.");
                        statusToSend = 200 //always respond with 200 (OK) when completed successfully
                        //additional actions here
                        break;

                    case "bikeDisarmed":
                        logRequestToDisk("INF",req.query.authorization,"Bike was disarmed.");
                        statusToSend = 200
                        break;

                    default: //if loggable does not exist, respond with server error
                        logRequestToScreen("ERR",req.query.authorization,"Unable to process log request.");
                        statusToSend = 500; // TODO: find more appropriate status code
                }

                res.sendStatus(statusToSend); // probably unnecessary
                break;

            default:
                logRequestToScreen("ERR",req.query.authorization,"Unable to process query."); //if action doesnt exist, respond with server error
                res.sendStatus(500);
                break;  
        }

    } else {
        res.sendStatus(401); //authentication failed (unauthorized)
    }
})

// get date and time as string
// TODO: make less messy
function getLoggableDateTime() {
    return date.getFullYear()+"-"+date.getMonth()+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
}

//yes
function checkAuth(auth) {
    if (allowedAuths.allowedKeys.includes(auth)) {
        return true;
    } else {
        return false;
    }
}

//these just write the same thing to different places (maybe make this a class or consolidate?)
function logRequestToDisk(code,authKey,message) {
    fs.appendFileSync('log.txt',`${code} | ${getLoggableDateTime()} | Auth Key: ${authKey} | ${message} \n`);
}

function logRequestToScreen(code,authKey,message) {
    console.log(`${code} | ${getLoggableDateTime()} | Auth Key: ${authKey} | ${message}`);
}

// start server
app.listen(port, () => {
  console.log(`INF | ${getLoggableDateTime()} | Bike API started on port ${port}`)
})