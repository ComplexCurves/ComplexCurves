const CustomError = require('./CustomError.js');

module.exports = class ShaderError extends CustomError {
    constructor(...args) {
        super(args);
        this.name = 'ShaderError';
    }
};
