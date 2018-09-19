/* ===== ValidationRequest Class ====================
|  Class with a constructor for validation request  |
|  ================================================*/

class ValidationRequest {

    // constructor
	constructor(registerStar, address, requestTimeStamp, message, validationWindow) {
        this.registerStar = registerStar,
        this.status = {
             address: address,
             requestTimeStamp: requestTimeStamp,
             message: message,
             validationWindow: validationWindow,
             messageSignature: ""
        }
    }
}

// make available
module.exports = ValidationRequest