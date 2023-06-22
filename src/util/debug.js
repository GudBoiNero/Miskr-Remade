const { DEBUG_MODE } = require('../config.json')

let debug = {
    log(message, optionalParams = []) {
    if (!DEBUG_MODE) return 

    console.log(message, optionalParams)
}}

module.exports = debug