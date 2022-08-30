# Bike API
API built to receive POSTs from an arduino in a bike and log events to disk. 

## Installation
Operating dependencies are Node.JS 16, NPM and Git
1. `git clone https://github.com/ctaetcsh/bike-api.git`
2. `npm install`
3. Copy the example authorization.json `cp authorization.example.json authorization.json`
4. Create the log.txt file `touch log.txt`

## Running
Requires two arguments to run: Port and reverse proxy URL. Pass as such:
* `node app.js 3000 /bike-api`

On launch the script will check authorization.json if the API keys need to be regenerated. Change `regenerateKeys` to `true` to do this.