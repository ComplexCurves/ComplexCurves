const Parser = {};

/** @typedef {{type : string, value : string}} */
Parser.Token;

/** @typedef {!Array<Parser.Token>} */
Parser.Tokens;

/** @typedef {{type : string, value : string, first: Parser.AST}} */
Parser.PrefixLeaf;

/** @typedef {{type : string, value : string, first: Parser.AST, second: Parser.AST}} */
Parser.InfixLeaf;

/** @typedef {Parser.Token|Parser.PrefixLeaf|Parser.InfixLeaf} */
Parser.Leaf;

/** @typedef {Parser.Leaf|Array<Parser.Leaf>|boolean|null} */
Parser.AST;

/** @typedef {function(Parser.Tokens) : Parser.AST} */
Parser.Combinator;

/**
 * @param {...Parser.Combinator} var_args
 * @return {Parser.Combinator}
 */
exports.and = function(var_args) {
    const args = arguments;

    /**
     * @param {Parser.Tokens} input
     * @return {Array<Parser.Leaf>|null}
     */
    function f(input) {
        let result;
        const results = [];
        let i = 0;
        const l = args.length;
        for (; i < l; i++) {
            const /** Parser.Combinator */ parser = args[i];
            result = parser(input);
            if (result) {
                results.push(result);
            } else {
                Array.prototype.unshift.apply(input, results);
                return null;
            }
        }
        return results;
    }
    return f;
};

/**
 * @param {Parser.Combinator} left
 * @param {Parser.Combinator} middle
 * @param {Parser.Combinator} right
 * @return {Parser.Combinator}
 */
exports.between = function(left, middle, right) {
    /**
     * @param {Parser.Tokens} input
     * @return {Parser.AST}
     */
    function f(input) {
        const /** Parser.Combinator */ parser = exports.and(left, middle, right);
        const result = /** @type {Array<Parser.Leaf>|null} */ (parser(input));
        return result ? result[1] : null;
    }
    return f;
};

/**
 * @param {Parser.Tokens} input
 * @return {boolean|null}
 */
exports.eoi = function(input) {
    return input.length === 0 ? true : null;
};

/**
 * @param {Parser.Combinator} op1
 * @param {Parser.Combinator} op
 * @param {Parser.Combinator} op2
 * @return {Parser.Combinator}
 */
exports.infix = function(op1, op, op2) {
    /**
     * @param {Parser.Tokens} input
     * @return {Parser.AST}
     */
    function f(input) {
        const /** Parser.Combinator */ parser = exports.and(op1, op, op2);
        const result = parser(input);
        if (result === null)
            return null;
        return {
            type: "infix",
            value: /** @type {Parser.Leaf} */ (result[1]).value,
            first: result[0],
            second: result[2]
        };
    }
    return f;
};

/**
 * @param {string} type
 * @return {Parser.Combinator}
 */
exports.literal = function(type) {
    /**
     * @param {Parser.Tokens} input
     * @return {Parser.Token|null}
     */
    function f(input) {
        return (input[0] || {}).type === type ? input.shift() : null;
    }
    return f;
};

/**
 * @param {Parser.Combinator} parser
 * @return {Parser.Combinator}
 */
exports.many = function(parser) {
    /**
     * @param {Parser.Tokens} input
     * @return {Parser.AST}
     */
    function f(input) {
        let result = parser(input);
        const results = [];
        while (result !== null) {
            results.push(result);
            result = parser(input);
        }
        return results;
    }
    return f;
};

/**
 * @param {...Parser.Combinator} var_args
 * @return {Parser.Combinator}
 */
exports.or = function(var_args) {
    const args = arguments;

    /**
     * @param {Parser.Tokens} input
     * @return {Parser.AST}
     */
    function f(input) {
        let result;
        const l = args.length;
        for (let i = 0; i < l; i++) {
            const /** Parser.Combinator */ parser = args[i];
            result = parser(input);
            if (result)
                return result;
        }
        return null;
    }
    return f;
};

/**
 * @param {Parser.Combinator} op
 * @return {Parser.Combinator}
 */
exports.parenthesized = function(op) {
    return exports.between(exports.symb("("), op, exports.symb(")"));
};

/**
 * @param {Parser.Combinator} op
 * @param {Parser.Combinator} op1
 * @return {Parser.Combinator}
 */
exports.prefix = function(op, op1) {
    /**
     * @param {Parser.Tokens} input
     * @return {Parser.AST}
     */
    function f(input) {
        const result = exports.and(op, op1)(input);
        if (result === null)
            return null;
        return {
            type: "prefix",
            value: /** @type {Parser.Leaf} */ (result[0]).value,
            first: result[1]
        };
    }
    return f;
};

/**
 * @param {string} value
 * @return {Parser.Combinator}
 */
exports.symb = function(value) {
    /**
     * @param {Parser.Tokens} input
     * @return {Parser.Token|null}
     */
    function f(input) {
        return (input[0] || {}).value === value ? input.shift() : null;
    }
    return f;
};

module.exports = Parser;
