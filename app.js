const { json } = require('body-parser');
const express = require('express')
const fs = require('fs');
const randkey = require('random-key')
const date = new Date;
const app = express()
const port = 3000

allowedAuths = JSON.parse(fs.readFileSync('authorization.json', 'utf8'));

if (allowedAuths.regenerateKeys === true) {
    console.log("Regenerating API keys...")
    allowedAuths.allowedKeys = [];
    allowedAuths.allowedKeys.push(randkey.generate(10));
    allowedAuths.allowedKeys.push(randkey.generate(10));
    allowedAuths.allowedKeys.push(randkey.generate(10));
    allowedAuths.regenerateKeys = false;

    fs.writeFileSync('authorization.json', JSON.stringify(allowedAuths));
    console.log("Regenerated API keys and saved to file.")
}

function getLoggableDateTime() {
    return date.getFullYear()+"-"+date.getMonth()+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
}

app.post('/api', (req, res) => {
    // console.log(req.query);
    if (checkAuth(req.query.authorization) === true) {
        switch (req.query.action) {
            case "log":
                logRequestToScreen("INF",req.query.authorization,`Log: ${req.query.log}`)

                switch (req.query.log) {
                    case "bikeTamperTrip":
                        logRequestToDisk("INF",req.query.authorization,"Bike Tamper Alarm Tripped.");
                        statusToSend = 200
                        //additional actions here
                        break;
                    case "bikeDisarmed":
                        logRequestToDisk("INF",req.query.authorization,"Bike was disarmed.");
                        statusToSend = 200
                        //additional actions here
                        break;
                        
                    default:
                        logRequestToScreen("ERR",req.query.authorization,"Unable to process log request.");
                        statusToSend = 500;
                }

                res.sendStatus(statusToSend);
                break;
            default:
                logRequestToScreen("ERR",req.query.authorization,"Unable to process query.");
                res.sendStatus(500);
                break;  
        }

    } else {
        res.sendStatus(401);
    }
})

function logRequestToDisk(code,authKey,message) {
    fs.appendFileSync('log.txt',`${code} | ${getLoggableDateTime()} | Auth Key: ${authKey} | ${message} \n`);
}

function checkAuth(auth) {
    if (allowedAuths.allowedKeys.includes(auth)) {
        return true;
    } else {
        return false;
    }
}

function logRequestToScreen(code,authKey,message) {
    console.log(`${code} | ${getLoggableDateTime()} | Auth Key: ${authKey} | ${message}`);
}

app.listen(port, () => {
  console.log(`INF | ${getLoggableDateTime()} | Bike API started on ${port}`)
})