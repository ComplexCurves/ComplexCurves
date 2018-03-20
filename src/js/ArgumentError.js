const CustomError = require('./CustomError.js');

module.exports = class ArgumentError extends CustomError {
    constructor(...args) {
        super(args);
        this.name = 'ArgumentError';
    }
};
