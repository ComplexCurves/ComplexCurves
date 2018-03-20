const Complex = require('./Complex.js');
const ParseError = require('./ParseError.js');
const Parser = require('./Parser.js');
const Polynomial = require('./Polynomial.js');
const Tokenizer = require('./Tokenizer.js');

module.exports = class PolynomialParser {

    /**
     * @param {Parser.AST} tree
     * @return {Polynomial}
     */
    static eval(tree) {
        if (tree === null)
            return null;
        const type = tree.type;
        const value = tree.value;
        let first, second;
        if (type === "infix") {
            first = PolynomialParser.eval( /** @type {Parser.InfixLeaf} */ (tree).first);
            second = PolynomialParser.eval( /** @type {Parser.InfixLeaf} */ (tree).second);
            if (value === "+")
                return Polynomial.add(first, second);
            else if (value === "-")
                return Polynomial.sub(first, second);
            else if (value === "*")
                return Polynomial.mul(first, second);
            else if (value === "^") {
                if (second.isConstant()) {
                    const s = second.constant();
                    if (s.re >= 0 && s.im === 0)
                        return Polynomial.pow(first, s.re);
                }
                throw new ParseError("Illegal exponent");
            } else
                throw new ParseError("Infix operator '" + value + "' not implemented");
        } else if (type === "prefix") {
            first = PolynomialParser.eval( /** @type {Parser.PrefixLeaf} */ (tree).first);
            if (value === "+")
                return first;
            else if (value === "-")
                return first.neg();
            else
                throw new ParseError("Prefix operator '" + value + "' not implemented");
        } else if (type === "number") {
            return Polynomial.real(parseFloat(value));
        } else if (type === "variable")
            return Polynomial.variable(value);
        else if (type === "imaginary")
            return Polynomial.complex(new Complex(0, 1));
        return null;
    }

    /**
     * @param {!Polynomial} p
     * @return {boolean}
     */
    static isBivariate(p) {
        return p.isBivariate();
    }

    /**
     * @param {string} str
     * @return {Parser.AST}
     */
    static parse(str) {
        const rules = [
            ["\\d*\\.\\d*", "number"],
            ["\\d+", "number"],
            ["i", "imaginary"],
            ["[a-hj-z]", "variable"],
            ["[\\+\\*\\^-]", "operator"],
            ["[\\(\\)]", "parenthesis"]
        ];
        const tokens = new Tokenizer(rules).tokenize(str);

        /*

        polynomial = expr, eoi ;

        expr = [ sign ] term { sign, term } ;

        sign = "+" | "-" ;

        term = factor { "*", factor } ;

        factor = base [power] ;

        power = "^", number [power] ;

        base = "(", expr, ")" | number | imaginary | variable ;

        */

        const number = Parser.literal("number");
        const imaginary = Parser.literal("imaginary");
        const variable = Parser.literal("variable");
        const plus = Parser.symb("+");
        const minus = Parser.symb("-");
        const /** Parser.Combinator */ sign = Parser.or(plus, minus);
        const times = Parser.symb("*");
        const pow = Parser.symb("^");

        /**
         * @param {Parser.Leaf} f
         * @param {Array<Parser.Leaf>} fs
         * @return {Parser.AST}
         */
        function infixCombine(f, fs) {
            /**
             * @param {Parser.AST} acc
             * @param {Parser.AST} v
             * @return {Parser.AST}
             */
            function infixCombine_(acc, v) {
                return {
                    type: "infix",
                    value: /** @type {Parser.InfixLeaf} */ (v[0]).value,
                    first: acc,
                    second: v[1]
                };
            }

            return fs === [] ? f : fs.reduce(infixCombine_, f);
        }

        /**
         * @param {Parser.Tokens} input
         * @return {Parser.Leaf|null}
         */
        function polynomial(input) {
            const p = /** @type {Array<Parser.Leaf>|null} */ (Parser.and(expr, Parser.eoi)(input));
            return p === null ? null : p[0];
        }

        /**
         * @param {Parser.Tokens} input
         * @return {Parser.AST}
         */
        function expr(input) {
            const e = Parser.and(Parser.or(Parser.prefix(sign, term), term), Parser.many(Parser.and(sign, term)))(input);
            return e === null ? null : infixCombine(e[0], e[1]);
        }

        /**
         * @param {Parser.Tokens} input
         * @return {Parser.AST}
         */
        function term(input) {
            const t = Parser.and(factor, Parser.many(Parser.and(times, factor)))(input);
            return t === null ? null : infixCombine(t[0], t[1]);
        }

        /**
         * @param {Parser.Tokens} input
         * @return {Parser.AST}
         */
        function factor(input) {
            const b = base(input);
            if (b === null)
                return null;
            const p = power(input);
            return p === null ? b : {
                type: "infix",
                value: "^",
                first: b,
                second: p
            };
        }

        /**
         * @param {Parser.Tokens} input
         * @return {Parser.Token|Parser.InfixLeaf|null}
         */
        function power(input) {
            const p = Parser.and(pow, number)(input);
            if (p === null)
                return null;
            const q = /** @type {Parser.Token|Parser.InfixLeaf|null} */ (power(input));
            return q === null ? /** @type {Parser.Token} */ (p[1]) : /** @type {Parser.InfixLeaf} */ ({
                type: "infix",
                value: "^",
                first: p[1],
                second: q
            });
        }

        /**
         * @param {Parser.Tokens} input
         * @return {Parser.AST}
         */
        function base(input) {
            return Parser.or(Parser.parenthesized(expr), number, imaginary, variable)(input);
        }

        return polynomial(tokens);
    }

    /**
     * @param {!Polynomial} p
     * @return {number}
     */
    static sheets(p) {
        return p.sheets();
    }
};
