const { json } = require('body-parser'); // I didn't write this (did vsc add it?)
const express = require('express') // Provides core of API
const fs = require('fs'); // Provides filesystem modification
const randkey = require('random-key') // Provides "random" API key generation
const date = new Date; // Provides Date and Time
const fetch = import('node-fetch') //Provides fetch support
const app = express()
timeSinceAPIKeyRequest = 0;

// launch argument check
if (process.argv[2] === undefined || process.argv[3] === undefined || process.argv[4]) {
    console.log(`ERR | ${getLoggableDateTime()} | You need to pass a port, proxy URL and Discord webhook URL!`);
    process.exit(1);
}

// set listening port and url listen for reverse proxy
const port = process.argv[2]; //no input validation
const proxyUrl = process.argv[3]; //no input validation
const discordWebhookURL = process.argv[4] //no input validation (how even?)

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

                    case "biketamperTrip":
                        logRequestToDisk("INF",req.query.authorization,"Bike Tamper Alarm Tripped.");
                        statusToSend = 200 //always respond with 200 (OK) when completed successfully
                        //additional actions here
                        break;

                    case "bikedisarmed":
                        logRequestToDisk("INF",req.query.authorization,"Bike was disarmed.");
                        statusToSend = 200
                        break;
                        
                    case "bumpnotification":
                        logRequestToDisk("INF",req.query.authorization,`Discord notification bumped, message: `);
                        discordWebhookSend(req.query.webhookmessage,req.query.authorization);
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
        logRequestToScreen("ERR",req.query.authorization,`Unauthorized POST from ${req.ip}`)
        res.sendStatus(401); //authentication failed (unauthorized)
    }
})

// responds to get requests
app.get(proxyUrl, (req, res) => {

    if (checkAuth(req.query.authorization) === true) { //authentication check
        
        switch (req.query.request) { //action parameter switch (add new actions here)
            case "status":
                logRequestToScreen("INF",req.query.authorization,`Responded to status request from ${req.ip}`)
                res.send(`Running OK! \nWorking Directory: ${process.argv[1]} \nPort: ${port} \nReverse Proxy Path: ${proxyUrl} \nYour IP: ${req.ip} \nHTTP Version: ${req.httpVersion}`);
                break;
            
            case "logfile":
                logRequestToScreen("INF",req.query.authorization,`Sent full log to ${req.ip}`)
                res.send(fs.readFileSync('log.txt','utf-8'))
                break;

            case "apikeys":
                if (Date.now() > timeSinceAPIKeyRequest+300000) { //timeout to only allow request every 5 minutes
                    timeSinceAPIKeyRequest = Date.now()
                    logRequestToScreen("INF",req.query.authorization,`Sent all API keys to ${req.ip}!!!`)
                    res.send(allowedAuths.allowedKeys);
                } else {
                    timeSinceAPIKeyRequest = Date.now()
                    logRequestToScreen("ERR",req.query.authorization,`${req.ip} attempted to get all API keys more than once in 5 minutes`)
                    res.sendStatus(420);
                }
                break;

            case "arduino":
                logRequestToScreen("INF",req.query.authorization,`GET Arduino: ${req.query.config}`)

                switch (req.query.config) {
                    case "full": //would return full arduino configuration
                        res.send(null);
                    return true;

                    default:
                        logRequestToScreen("ERR",req.query.authorization,"Unable to process Arduino configuration request.");
                        res.sendStatus(500);
                        return true; // Prevents double res.sendStatus(500);
                }

            default:
                logRequestToScreen("ERR",req.query.authorization,"Unable to process query."); //if action doesnt exist, respond with server error
                res.sendStatus(500);
                break;  
        }

    } else {
        logRequestToScreen("ERR",req.query.authorization,`Unauthorized GET from ${req.ip}`)
        res.sendStatus(401); //authentication failed (unauthorized)
    }
})

// get date and time as string
// TODO: make less messy
function getLoggableDateTime() {
    return `${date.getFullYear()}-${(date.getMonth()+1)}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
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
    fs.appendFileSync('log.txt',`${code} | ${getLoggableDateTime()} | API Key: ${authKey} | ${message} \n`);
}

function logRequestToScreen(code,authKey,message) {
    console.log(`${code} | ${getLoggableDateTime()} | API Key: ${authKey} | ${message}`);
}

function discordWebhookSend(message,apikeylog) {
    logRequestToScreen("INF",apikeylog,`Sent Discord webhook w/ contents: ${message}`)
    fetch(discordWebhookURL, {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: {
            username: "Bike API",
            avatar_url: "",
            content: message
        }
    }).then(res => {
        console.log(res);
    }) 
}

// start server
app.listen(port, () => {
  console.log(`INF | ${getLoggableDateTime()} | Bike API started on port ${port}`)
})