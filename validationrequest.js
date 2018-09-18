/* ===== ValidationRequest Class ====================
|  Class with a constructor for validation request  |
|  ================================================*/

class ValidationRequest {

    // constructor
	constructor(address, requestTimeStamp, message, validationWindow) {
         this.address = address,
         this.requestTimeStamp = requestTimeStamp,
         this.message = message,
         this.validationWindow = validationWindow,
         this.messageSignature = "",
         this.registerStar = false
    }
}

// make available
module.exports = ValidationRequest