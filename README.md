==============
framework used
==============
https://hapijs.com

=====================
required dependencies
=====================
npm install crypto-js --save
npm install level --save
npm install hapi --save
npm install bitcoinjs-lib --save
npm install bitcoinjs-message --save

============
start server
============
node index.js

===================
retrieve all blocks
===================

URL format:
http://localhost:8000/blocks

example:

curl "http://localhost:8000/blocks"

========================
retrieve block by height
========================

URL format:
http://localhost:8000/block/{BLOCK_HEIGHT}

examples:

curl "http://localhost:8000/block/0"
curl "http://localhost:8000/block/1"
curl "http://localhost:8000/block/2"

==========================
retrieve blocks by address
==========================

URL format:
http://localhost:8000/stars/address:{ADDRESS}

example:

curl "http://localhost:8000/stars/address:17CQoP8YtokVDrxFLSRbWa3pwSLQqqvBWu"

=======================
retrieve blocks by hash
=======================

URL format:
http://localhost:8000/stars/hash:{HASH}

examples:

curl "http://localhost:8000/stars/hash:6df9edca1a873b5f2ca7717fce3e3d42af6ce295c5476a919d7cce0bd90103d4"
curl "http://localhost:8000/stars/hash:e3722266c3982a2bee4fc5c357fa7c5272408f0720734594f3bbaf34a71a8ca0"
curl "http://localhost:8000/stars/hash:b91a6dc290ccf45f5d35d86555b49367ebe8204d7fb70f20efcb1cea799c283c"

==================
request validation
==================

URL format:
http://localhost:8000/requestValidation

example:

curl -X "POST" "http://localhost:8000/requestValidation" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "17CQoP8YtokVDrxFLSRbWa3pwSLQqqvBWu"
}'

============================
message signature validation
============================

URL format:
http://localhost:8000/message-signature/validate

example:

curl -X "POST" "http://localhost:8000/message-signature/validate" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "17CQoP8YtokVDrxFLSRbWa3pwSLQqqvBWu",
  "signature": "H7teJ9mAGFnYd4nVspjA4wJDP51+O0QMpq2kfo+Q1F20Rg0xkQlZQ45Cb6fovphlWzCjgEp8YRHg3Bz7a3/ghPM="
}'

=========
add block
=========

URL format:
http://localhost:8000/block

Parameters:
address: the address with which to associate the new star
star: star object to add, with 'star.mag' and 'star.con' optional

examples:

curl -X "POST" "http://localhost:8000/block" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "17CQoP8YtokVDrxFLSRbWa3pwSLQqqvBWu",
  "star": {
    "dec": "-26° 29'\'' 24.9",
    "ra": "16h 29m 1.0s",
    "story": "Found star using https://www.google.com/sky/"
  }
}'

curl -X "POST" "http://localhost:8000/block" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "17CQoP8YtokVDrxFLSRbWa3pwSLQqqvBWu",
  "star": {
    "dec": "-26° 29'\'' 24.9",
    "ra": "16h 29m 1.0s",
    "mag": "mag_test",
    "con": "con_test",
    "story": "Found star using https://www.google.com/sky/"
  }
}'
