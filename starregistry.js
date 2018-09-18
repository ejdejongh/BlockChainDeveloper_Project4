// required classes
//const SHA256 = require('crypto-js/sha256');
const level = require('level');
const starRegistryDB = './starregistrydata';
const db = level(starRegistryDB);
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
const ValidationRequest = require('./validationrequest')

// add data to levelDB with key/value pair
function addLevelDBData(key,value) {
    db.put(key, value, function(err) {
        if (err) return console.log(key + ' submission failed', err);
    })
}

// remove data from levelDB associated with key
function deleteLevelDBData(key) {
    db.del(key, function(err) {
        if (err) return console.log(key + ' deletion failed', err);
    })
}

// get data from levelDB with key
function getLevelDBData(key) {

    return new Promise((resolve, reject) => {
        db.get(key, function(error, value) {
            if (error) {
                //console.log("Not found!", error);
                reject(error);
            } else {
                resolve(value);
            }
        });
    });
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class StarRegistry {

    // constructor
    constructor() {
    }
    
    // requestValidation returns a message to be signed for the specified address
    async requestValidation(address) {
     
        // check for existing record
        try {
            
            // check db
            const validationRequest = await this.getValidationRequest(address);
            
            // debug
            console.log("StarRegistry.requestValidation(" + address + ") - RECORD FOUND");

            // helper var
            const time = new Date().getTime().toString().slice(0,-3);
                        
            // update requested timestamp, validation window
            validationRequest.requestTimeStamp = time;
            validationRequest.validationWindow = 300;
            
            // debug
            console.log("validationRequest.requestTimeStamp UPDATED=" + validationRequest.requestTimeStamp);
            console.log("validationRequest.validationWindow UPDATED=" + validationRequest.validationWindow);
            
            // save in level db
            addLevelDBData(validationRequest.address, JSON.stringify(validationRequest));
            
            // done, return result
            return validationRequest;
        }
        // no record found
        catch (error) {
            
            // insert new record into db
            const validationRequest = await this.addValidationRequest(address);
            
            // debug
            console.log("StarRegistry.requestValidation(" + address + ") - RECORD INSERTED WITH MESSAGE="  + validationRequest.message);
            
            // done, return result
            return validationRequest;
        }
    }

    // validateMessageSignature validates the message signature for the specified address
    async validateMessageSignature(address, signature) {
     
        // check for existing record
        try {
            
            // check db
            const validationRequest = await this.getValidationRequest(address);
            
            // debug
            console.log("StarRegistry.validateMessageSignature(" + address + ") - RECORD FOUND");
            
            // check if the request is still valid
            const time = new Date().getTime().toString().slice(0,-3);
            const validuntil = parseInt(validationRequest.requestTimeStamp,10) + parseInt(validationRequest.validationWindow,10);
            const remaining = validuntil - time;
            
            // update validation window
            validationRequest.validationWindow = remaining;
            
            // debug
            //console.log('validuntil = validationRequest.requestTimeStamp + validationRequest.validationWindow=' + validuntil);
            //console.log('remaining = validuntil - time =' + validuntil + ' - ' + time + '=' + remaining);
                        
            // if the validation request is no longer valid
            if (remaining < 0) {

                // set signature, update status
                validationRequest.messageSignature = "";
                validationRequest.registerStar = false;

                // debug
                console.log("StarRegistry.validateMessageSignature(" + address + ") - RECORD NO LONGER VALID, REMOVING FROM DB");

                // remove from db
                deleteLevelDBData(address);
                
                // done, return result
                return validationRequest;
            }
            // all is well so far, check signature
            else {
                
                // verify signature
                const isValid = bitcoinMessage.verify(validationRequest.message, address, signature);

                // debug
                console.log("bitcoinMessage.verify(" + validationRequest.message + ", " + address + ", " + signature + ")=" + isValid);

                // set signature, update status
                validationRequest.messageSignature = isValid ? 'valid' : 'invalid';
                validationRequest.registerStar = true;

                // save in level db
                addLevelDBData(validationRequest.address, JSON.stringify(validationRequest));

                // done, return result
                return validationRequest;
            }
        }
        // no record found
        catch (error) {
            
            // debug
            console.log("StarRegistry.validateMessageSignature(" + address + "," + signature + ") - NO RECORD FOUND");
            
            // done, return result
            return new ValidationRequest(address, 0, "", 0);
        }
    }
    
    // register star
    async validateRequestStatus(address) {
     
        // check for existing record
        try {
            
            // check db
            const validationRequest = await this.getValidationRequest(address);
            
            // debug
            console.log("StarRegistry.validateRequestStatus(" + address + ") - RECORD FOUND");
            
            // check if the request is still valid
            const time = new Date().getTime().toString().slice(0,-3);
            const validuntil = parseInt(validationRequest.requestTimeStamp,10) + parseInt(validationRequest.validationWindow,10);
            const remaining = validuntil - time;
            
            // update validation window
            validationRequest.validationWindow = remaining;
            
            // debug
            //console.log('validuntil = validationRequest.requestTimeStamp + validationRequest.validationWindow=' + validuntil);
            //console.log('remaining = validuntil - time =' + validuntil + ' - ' + time + '=' + remaining);

            // no matter what, the validation request will no longer be relevant
            //deleteLevelDBData(address);
                
            // if the validation request is no longer valid
            if (remaining < 0) {

                // update status
                validationRequest.registerStar = false;

                // debug
                console.log("StarRegistry.registerStar(" + address + ") - RECORD NO LONGER VALID");
                
                // done, return result
                return validationRequest;
            }
            // not valid
            else if (validationRequest.registerStar == false) {

                // debug
                console.log("StarRegistry.registerStar(" + address + ") - RECORD NOT VALID, REGISTER STAR NOT ALLOWED");

                // done, return result
                return validationRequest;
                
            }
            // all is well, register
            else {
                
                // debug
                console.log("StarRegistry.registerStar(" + address + ") - ALL IS WELL, REGISTER STAR ALLOWED");

                // done, return result
                return validationRequest;
            }
        }
        // no record found
        catch (error) {
            
            // debug
            console.log("StarRegistry.registerStar(" + address + ") - NO RECORD FOUND");
            
            // done, return result
            return new ValidationRequest(address, 0, "", 0);
        }
    }
    
    // get validation request
    async getValidationRequest(address) {
        
        // debug
        console.log("StarRegistry.getValidationRequest(" + address + ")");

        // retrieve from db, return as promise
        return new Promise((resolve, reject) => {
            getLevelDBData(address)
            .then(
                (validationRequest) => {

                    // done, return result
                    resolve(JSON.parse(validationRequest));
                }
            )
            .catch(
                err => {
                    reject(err);
                }
            );                    
        });
    }

    // save validation request
    async addValidationRequest(address) {

        // debug
        console.log("StarRegistry.addValidationRequest(" + address + ")");
        
        // helper var
        const time = new Date().getTime().toString().slice(0,-3);
    
        // new object
        const newValidationRequest = new ValidationRequest(address, time, address + ":" + time + ":starRegistry", 300);

        // save in level db
        addLevelDBData(newValidationRequest.address, JSON.stringify(newValidationRequest));
                    
        // return new validation request
        return newValidationRequest;
    }
}

// make available
module.exports = StarRegistry