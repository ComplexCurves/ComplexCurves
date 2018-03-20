const CustomError = require('./CustomError.js');

module.exports = class ParseError extends CustomError {
    constructor(...args) {
        super(args);
        this.name = 'ParseError';
    }
};
