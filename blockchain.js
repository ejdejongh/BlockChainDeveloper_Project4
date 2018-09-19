// required classes
const SHA256 = require('crypto-js/sha256');
const level = require('level');
const blockchainDB = './chaindata';
const db = level(blockchainDB);
const Block = require('./block')

// add data to levelDB with key/value pair
function addLevelDBData(key,value) {
    db.put(key, value, function(err) {
        if (err) return console.log('Block ' + key + ' submission failed', err);
    })
}

// get data from levelDB with key
function getLevelDBData(key) {

    return new Promise((resolve, reject) => {
        db.get(key, function(error, value) {
            if (error) {
                console.log("Not found!", error);
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

class Blockchain {
    
    // constructor
    constructor() {
        
        // init array containing all blocks
        this.chain = [];
        
        // retrieve current number of block's in the database
        this.getBlockHeight()
        .then((currentBlockHeight) => {

                // if no blocks were read we need to initialize the blockchain with a genesis block
                if (currentBlockHeight == -1) {
                    
                    // tmp debug
                    //console.log('constructor() - no blocks found - add initial genesis block to LevelDB');
                
                    // add initial genesis block to db
                    this.addBlock(new Block("Genesis block"));
                }
                else {
                    
                    // tmp debug
                    //console.log('constructor() - ' + currentBlockHeight + ' blocks found in LevelDB - no need for any further action');
                }
            }
        )
        .catch(
            err => {
                console.log(err)
            }
        );
    }

    // add new block
    async addBlock(newBlock) {
        
        // retrieve current block height
        const currentBlockHeight = await this.getBlockHeight();
        
        // debug
        console.log("addBlock(): currentBlockHeight=" + currentBlockHeight);

        // new block height
        newBlock.height = currentBlockHeight + 1;
        
        // UTC timestamp
        newBlock.time = new Date().getTime().toString().slice(0,-3);
        
        // debug height of the new block
        console.log('addBlock(): newBlock.height=' + newBlock.height + ')');

        // if there is a previous block
        if (currentBlockHeight > -1) {
            
            // retrieve it
            const previousBlock = await this.getBlock(currentBlockHeight);

            // debug
            console.log('addBlock(): previousBlock.height=' + previousBlock.height);
            console.log('addBlock(): previousBlock.hash=' + previousBlock.hash);

            // set previous block hash
            newBlock.previousBlockHash = previousBlock.hash;
            
            // block hash with SHA256 using newBlock and converting to a string
            newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
            
            // save in level db
            addLevelDBData(newBlock.height, JSON.stringify(newBlock));
                        
            // return new block
            return newBlock;
        }
        else {
            // block hash with SHA256 using newBlock and converting to a string
            newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
            
            // save in level db
            addLevelDBData(newBlock.height, JSON.stringify(newBlock));
            
            // return new block
            return newBlock;
        }
    }

    // retrieve current number of block's in the database
    getBlockHeight() {

        // helper result var
        var blockHeight = -1

        // retrieve from db, return as promise
        return new Promise((resolve, reject) => {
            
            // read all data from db
            db.createReadStream()
            
                // data found
                .on('data', (data) => {
                    
                    // update result var
                    blockHeight++;
                
                // error
                }).on('error', function(err) {
                    
                    // some unknown error occured, output to console
                    console.log('Error reading data stream from LevelDB', err);
                    
                // done
                }).on('close', function() {

                    // debug
                    //console.log("getBlockHeight().on(close) blockHeight=" + blockHeight);
                    
                    // done, return result
                    resolve(blockHeight);
                });
        });
    }

    // get block
    getBlock(blockHeight) {
        
        // retrieve from db, return as promise
        return new Promise((resolve, reject) => {
            getLevelDBData(blockHeight)
            .then(
                (block) => {

                    // conversion
                    const blockObject = JSON.parse(block);
                    
                    // decode story, if present
                    if (blockObject.body !== undefined && blockObject.body.star !== undefined) {
                        blockObject.body.star.storyDecoded = Buffer.from(blockObject.body.star.story, 'hex').toString('utf8');
                    }
                    
                    // done, return result
                    resolve(blockObject);
                }
            )
            .catch(
                err => {
                    console.log(err)
                }
            );                    
        });
    }
    
    // validate block
    validateBlock(blockHeight) {
        
        // retrieve from db, validate, return as promise        
        return new Promise((resolve, reject) => {
            this.getBlock(blockHeight)
            .then(
                (block) => {
    
                    // get block height, hash
                    let blockHeight = block.height;
                    let blockHash = block.hash;

                    // remove block hash to test block integrity
                    block.hash = '';
                    
                    // generate block hash
                    let validBlockHash = SHA256(JSON.stringify(block)).toString();
                    
                    // compare
                    if (blockHash===validBlockHash) {
                        console.log('Block #' + blockHeight + ' valid hash: ' + blockHash + '==' + validBlockHash);
                        resolve(true);
                    } else {
                        console.log('Block #' + blockHeight + ' invalid hash: ' + blockHash + '<>' + validBlockHash);
                        resolve(false);
                    }
                }
            )
            .catch(
                err => {
                    console.log(err)
                }
            );
        });
    }

    // validate entire blockchain
    validateChain() {
        
        // keep track of the current block height of the block being validated
        var currentBlockHeight = 0;
        
        // result var's
        var result = true;
        var errorBlock;
        
        // validate all blocks, return as promise
        return new Promise((resolve, reject) => {
    
            // read all blocks from db
            db.createReadStream()
            
                // data found
                .on('data', (data) => {
                    
                    // update current block height of the block being validated
                    currentBlockHeight++;

                    // retrieve previous block
                    this.validateBlock(currentBlockHeight)
                    .then((currentBlockValidOrNot) => {
        
                            // update result
                            result = result && currentBlockValidOrNot;
                            
                            // if the current block examinedwas invalid
                            if (!currentBlockValidOrNot) {
                                console.log('validateChain().on(data) invalid block found with height=' + currentBlockHeight);
                            }
                        }
                    )
                    .catch(
                        err => {
                            console.log(err)
                        }
                    );
                    
                // error
                }).on('error', function(err) {
                    
                    // some unknown error occured, output to console
                    console.log('Error reading data stream from LevelDB', err);
                    
                // done
                }).on('close', function() {
    
                    // debug
                    console.log("validateChain().on(close) result=" + (result == true ? "VALID" : "INVALID"));
                    
                    // done, return result
                    resolve(result);
                    
                });
        });
    }
    
    // view entire blockchain
    getBlocks() {

        // keep track of the current block height of the block being validated
        var currentBlockHeight = 0;
        
        // result
        var blocks = [];
                
        // validate all blocks, return as promise
        return new Promise((resolve, reject) => {
    
            // read all blocks from db
            db.createReadStream()
            
                // data found
                .on('data', (data) => {

                    // retrieve next block
                    this.getBlock(currentBlockHeight)
                    .then((currentBlock) => {

                            // update result
                            blocks.push(currentBlock);
                        }
                    )
                    .catch(
                        err => {
                            console.log(err)
                        }
                    );

                    // update current block height of the block being validated
                    currentBlockHeight++;
                                        
                // error
                }).on('error', function(err) {
                    
                    // some unknown error occured, output to console
                    console.log('Error reading data stream from LevelDB', err);
                    
                // done
                }).on('close', function() {
    
                    // debug
                    //console.log("getBlocks().on(close) " + blocks.length + " blocks retrieved");
                    
                    // done, return result
                    resolve(blocks);
                    
                });
        });        
    }
    
    // retrieve stars by address
    getBlocksByAddress(address) {

        // keep track of the current block height
        var currentBlockHeight = 0;
        
        // result
        var blocks = [];
                
        // loop through all blocks
        return new Promise((resolve, reject) => {
    
            // read all blocks from db
            db.createReadStream()
            
                // data found
                .on('data', (data) => {

                    // retrieve next block
                    this.getBlock(currentBlockHeight)
                    .then((currentBlock) => {
                        
                            // output to console
                            //console.log(JSON.stringify(currentBlock))
                        
                            // only if the address matches
                            const blockAddress = currentBlock.body.address;
                            
                            // only if the block address is set and matches
                            if (blockAddress !== undefined && blockAddress == address) {
                                
                                // update result
                                blocks.push(currentBlock);
                            }
                        }
                    )
                    .catch(
                        err => {
                            console.log(err)
                        }
                    );

                    // update current block height of the block being validated
                    currentBlockHeight++;
                                        
                // error
                }).on('error', function(err) {
                    
                    // some unknown error occured, output to console
                    console.log('Error reading data stream from LevelDB', err);
                    
                // done
                }).on('close', function() {
    
                    // done, return result
                    resolve(blocks);
                    
                });
        });        
    }
    
    // retrieve star by hash
    getBlockByHash(hash) {

        // keep track of the current block height
        var currentBlockHeight = 0;
        
        // result
        var block = "Block with hash " + hash + " not found";
                
        // loop through all blocks
        return new Promise((resolve, reject) => {
    
            // read all blocks from db
            db.createReadStream()
            
                // data found
                .on('data', (data) => {

                    // retrieve next block
                    this.getBlock(currentBlockHeight)
                    .then((currentBlock) => {
                        
                            // only if the hash matches
                            const blockHash = currentBlock.hash;
                            
                            // only if the block hash is set and matches
                            if (blockHash !== undefined && blockHash == hash) {
                                
                                // update result
                                block = currentBlock;
                            }
                        }
                    )
                    .catch(
                        err => {
                            console.log(err)
                        }
                    );

                    // update current block height of the block being validated
                    currentBlockHeight++;
                                        
                // error
                }).on('error', function(err) {
                    
                    // some unknown error occured, output to console
                    console.log('Error reading data stream from LevelDB', err);
                    
                // done
                }).on('close', function() {    
    
                    // done, return result
                    resolve(block);
                    
                });
        });        
    }
}

// make available
module.exports = Blockchain