/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

// required classes
const Block = require('./block')
const Blockchain = require('./blockchain')
const ValidationRequest = require('./validationrequest')
const StarRegistry = require('./starregistry')

// init reference to blockchain, star registry object
let blockchain = new Blockchain();
let starRegistry = new StarRegistry();

// SERVER CODE

// require hapi 
const Hapi = require('hapi');

// create a server with a host and port
const server = Hapi.server({
    host    :   'localhost',
    port    :   8000
});

// add route to request validation
server.route({
    method  :   'POST',
    path    :   '/requestValidation',
    handler :   async function(request,h) {
        
        // retrieve address
        const address = request.payload.address;

        // if not set
        if (address === undefined) {
         
            // return error message
            return "Missing or invalid parameter 'address'";            
        }
        else {
    
            // debug
            console.log('=========================================================');
            console.log('POST INIT requestValidation: address=' + address);
            
            // validate
            const validationRequest = await starRegistry.requestValidation(address);

            // debug
            console.log('POST DONE requestValidation validationRequest=' + JSON.stringify(validationRequest));

            // return as JSON
            return JSON.stringify(validationRequest);
        }
    }
});

// add route to validate a message signature
server.route({
    method  :   'POST',
    path    :   '/message-signature/validate',
    handler :   async function(request,h) {
        
        // retrieve parameters
        const address = request.payload.address;
        const signature = request.payload.signature;

        // check address parameter
        if (address === undefined) {
         
            // return error message
            return "Missing or invalid parameter 'address'";
        }
        // check signature parameter
        else if (signature === undefined) {
         
            // return error message
            return "Missing or invalid parameter 'signature'";
        }
        else {
    
            // debug
            console.log('=========================================================');
            console.log('POST INIT message-signature/validate: address=' + address);
            console.log('POST INIT message-signature/validate: signature=' + signature);
            
            // validate
            const validationRequest = await starRegistry.validateMessageSignature(address, signature);

            // debug
            console.log('POST DONE message-signature/validate validationRequest=' + JSON.stringify(validationRequest));

            // return as JSON
            return JSON.stringify(validationRequest);
        }
    }
});

// add route to add a block
server.route({
    method  :   'POST',
    path    :   '/block',
    handler :   async function(request,h) {
        
        // retrieve parameters
        const address = request.payload.address;
        const star = request.payload.star;
        const dec = request.payload.star.dec;
        const ra = request.payload.star.ra;
        const mag = request.payload.star.mag;
        const con = request.payload.star.con;
        const story = request.payload.star.story;

        // check address parameter
        if (address === undefined) {
         
            // return error message
            return "Missing or invalid parameter 'address'";
        }
        // check star parameter
        else if (star === undefined) {
         
            // return error message
            return "Missing or invalid parameter 'star'";
        }
        // check dec parameter
        else if (dec === undefined) {
         
            // return error message
            return "Missing or invalid parameter 'star.dec'";
        }
        // check ra parameter
        else if (ra === undefined) {
         
            // return error message
            return "Missing or invalid parameter 'star.ra'";
        }
        // check story parameter
        else if (story === undefined) {
         
            // return error message
            return "Missing or invalid parameter 'star.story'";
        }
        // story parameter max length = 500 bytes
        else if (Buffer.byteLength(story, 'utf8') > 500) {
            
            // return error message
            return "Parameter 'star.story' too long; max 500 bytes allowed";
        }
        // story may only contain ascii characters
        else if (!/^[\x00-\x7F]*$/.test(story)) {

            // return error message
            return "Parameter 'star.story' invalid; onlyu ASCII characters allowed";
        }        
        else {
    
            // debug
            console.log('=========================================================');
            console.log('POST INIT registerStar: address=' + address);
            console.log('POST INIT registerStar: star.dec=' + dec);
            console.log('POST INIT registerStar: star.ra=' + ra);
            console.log('POST INIT registerStar: star.mag=' + mag);
            console.log('POST INIT registerStar: star.con=' + con);
            console.log('POST INIT registerStar: star.story=' + story);
            
            // check status
            const validationRequest = await starRegistry.validateRequestStatus(address);

            // if allowed
            if (validationRequest.registerStar == true) {
                
                // create new block body
                const newBlockBody = {
                    "address" : address,
                    "star"    : {
                        "dec"   : star.dec,
                        "ra"    : star.ra,                      
                        "mag"   : star.mag === undefined ? "" : star.mag,
                        "con"   : star.con === undefined ? "" : star.con,
                        "story" : Buffer.from(star.story, 'utf8').toString('hex')
                    }
                }

                // add block
                const newBlock = await blockchain.addBlock(new Block(newBlockBody));
                            
                // debug
                console.log('POST DONE registerStar newBlock=' + JSON.stringify(newBlock));
                
                // return new block as JSON
                return JSON.stringify(newBlock);
            }
            else {
                
                // debug
                console.log('POST DONE registerStar: an unexpected error occured');
                
                // return error
                return "Star registration currently not allowed for address " + address;
            }
        }
    }
});

// add route to retrieve all blocks
server.route({
    method  :   'GET',
    path    :   '/blocks',
    handler :   async function(request,h) {
        

        // retrieve blocks
        const blocks = await blockchain.getBlocks();
        
        // and return as JSON
        return JSON.stringify(blocks);
    }
});

// add route to retrieve a block by height
server.route({
    method  :   'GET',
    path    :   '/block/{BLOCK_HEIGHT}',
    handler :   async function(request,h) {
        
        // retrieve requested, current block height
        const requestedBlockHeight = request.params.BLOCK_HEIGHT;
        const currentBlockHeight = await blockchain.getBlockHeight();

        // debug
        console.log('requestedBlockHeight=' + requestedBlockHeight);
        console.log('currentBlockHeight=' + currentBlockHeight);

        // make sure the requested block height is larger than or equal to 0
        if (requestedBlockHeight < 0) {
            
            // blockheight invalid, return error message
            return 'Invalid block height: must be larger than or equal to 0';
        }
        // only if the specified block height is smaller than or equal to the current block height
        else if (requestedBlockHeight <= currentBlockHeight) {

            // retrieve specified block
            const retrievedBlock = await blockchain.getBlock(requestedBlockHeight);
            
            // and return as JSON
            return JSON.stringify(retrievedBlock);
        }
        else {
            
            // blockheight to large, return error message
            return 'Invalid block height ' + requestedBlockHeight + ' (max block height=' + currentBlockHeight + ')';
        }
    }
});

// add route to retrieve all stars associated with a wallet address
server.route({
    method  :   'GET',
    path    :   '/stars/address:{ADDRESS}',
    handler :   async function(request,h) {
        
        // retrieve address
        const address = request.params.ADDRESS;
        
        // debug
        console.log('/stars/address:' + address);

        // retrieve specified blocks
        const blocks = await blockchain.getBlocksByAddress(address);
            
        // and return as JSON
        return JSON.stringify(blocks);
    }
});

// add route to retrieve the star associated with the specified hash
server.route({
    method  :   'GET',
    path    :   '/stars/hash:{HASH}',
    handler :   async function(request,h) {
        
        // retrieve hash
        const hash = request.params.HASH;
        
        // debug
        console.log('/stars/hash:' + hash);

        // retrieve specified block
        const block = await blockchain.getBlockByHash(hash);
            
        // and return as JSON
        return JSON.stringify(block);
    }
});

// add test route
server.route({
    method  :   'GET',
    path    :   '/test',
    handler :   async function(request,h) {
        
        const t1 = new ValidationRequest(false, 'address', 0, "", 0);
        return JSON.stringify(t1);
    }
});

// start the server
async function start() {

    try {
        await server.start();
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }
    console.log('Server running at:', server.info.uri);
};

start();