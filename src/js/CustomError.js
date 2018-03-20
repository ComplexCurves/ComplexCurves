module.exports = class CustomError extends Error {
    constructor(...args) {
        super(...args);
        this.name = 'CustomError';
        if (Error.hasOwnProperty('captureStackTrace'))
            Error['captureStackTrace'](this, this.constructor);
    }
};
