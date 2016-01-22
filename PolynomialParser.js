function PolynomialParser() {};

PolynomialParser.eval = function(tree) {
    var type = tree.type;
    var value = tree.value;
    var first, second;
    if (type === "infix") {
        first = PolynomialParser.eval(tree.first);
        second = PolynomialParser.eval(tree.second);
        if (value === "+")
            return Polynomial.add(first, second);
        else if (value === "-")
            return Polynomial.sub(first, second);
        else if (value === "*")
            return Polynomial.mul(first, second);
        else if (value === "^") {
            if (second.isConstant()) {
                var s = second.constant();
                if (s.re >= 0 && s.im === 0)
                    return Polynomial.pow(first, s.re);
            }
            console.error("Illegal exponent");
        } else
            console.error("Infix operator '" + value + "' not implemented");
    } else if (type === "prefix") {
        first = PolynomialParser.eval(tree.first);
        if (value === "+")
            return first;
        else if (value === "-")
            return first.neg();
        else
            console.error("Prefix operator '" + value + "' not implemented");
    } else if (type === "number") {
        return Polynomial.real(parseFloat(value));
    } else if (type === "variable")
        return Polynomial.variable(value);
    else if (type === "imaginary")
        return Polynomial.complex(new Complex(0, 1));
    return null;
};

/** @param {string} str */
PolynomialParser.parse = function(str) {
    var tokens = PolynomialParser.tokenize(str);

    function literal(type) {
        return function(input) {
            return (input[0] || {}).type === type ? input.shift() : null;
        };
    }

    function symbol(value) {
        return function(input) {
            return (input[0] || {}).value === value ? input.shift() : null;
        };
    }

    function eoi(input) {
        return input.length === 0 ? true : null;
    }

    function and() {
        var args = arguments;
        return function(input) {
            var result, results = [];
            for (var i = 0, l = args.length; i < l; i++) {
                result = args[i](input);
                if (result) {
                    results.push(result);
                } else {
                    Array.prototype.unshift.apply(input, results);
                    return null;
                }
            }
            return results;
        };
    }

    function many(parser) {
        return function(input) {
            var result = parser(input), results = [];
            while (result !== null) {
                results.push(result);
                result = parser(input);
            }
            return results;
        };
    }

    function or() {
        var args = arguments;
        return function(input) {
            var result;
            for (var i = 0, l = args.length; i < l; i++) {
                result = args[i](input);
                if (result)
                    return result;
            }
            return null;
        };
    }

    function between(left, middle, right) {
        return function(input) {
            var result = and(left, middle, right)(input);
            return result ? result[1] : null;
        };
    }

    function parenthesized(op) {
        return between(symbol("("), op, symbol(")"));
    }

    function infix(op1, op, op2) {
        return function(input) {
            var result = and(op1, op, op2)(input);
            if (result === null)
                return null;
            return {
                type: "infix",
                value: result[1].value,
                first: result[0],
                second: result[2]
            };
        }
    }

    function prefix(op, op1) {
        return function(input) {
            var result = and(op, op1)(input);
            if (result === null)
                return null;
            return {
                type: "prefix",
                value: result[0].value,
                first: result[1]
            };
        }
    }

    function andMany(p1, p2, combine) {
        return function(input) {
            var p = p1(input);
            if (p === null)
                return null;
            var ps = many(p2)(input);
            return ps === [] ? p : combine(p, ps);
        };
    }

    function infixCombine(f, fs) {
        return fs.reduce(function(acc, v) {
                return {
                    type: "infix",
                    value: v[0].value,
                    first: acc,
                    second: v[1]
                };
            }, f);
    }

    /*

    polynomial = expr, eoi ;

    expr = [ sign ] term { sign, term } ;

    sign = "+" | "-" ;

    term = factor { "*", factor } ;

    factor = base [power] ;

    power = "^", number [power] ;

    base = "(", expr, ")" | number | imaginary | variable ;
    */

    var number = literal("number");
    var imaginary = literal("imaginary");
    var variable = literal("variable");
    var plus = symbol("+");
    var minus = symbol("-");
    var sign = or(plus, minus);
    var times = symbol("*");
    var pow = symbol("^");

    function polynomial(input) {
        var p = and(expr, eoi)(input);
        return p === null ? null : p[0];
    }
    function expr(input) {
        return andMany(or(prefix(sign, term), term), and(sign, term),
            infixCombine)(input);
    }
    function term(input) {
        return andMany(factor, and(times, factor), infixCombine)(input);
    }
    function factor(input) {
        var b = base(input);
        if (b === null)
            return null;
        var p = power(input);
        return p === null ? b : {
            type: "infix",
            value: "^",
            first: b,
            second: p
        };
    }
    function power(input) {
        var p = and(pow, number)(input);
        if (p === null)
            return null;
        var q = power(input);
        return q === null ? p[1] : {
            type: "infix",
            value: "^",
            first: p[1],
            second: q
        };
    }
    function base(input) {
        return or(parenthesized(expr), number, imaginary, variable)(input);
    }

    var parse = polynomial;
    var tree = parse(tokens);
    return tree;
};

/** @param {string} str
 *  @return {Array<{type : string, value : string}>} */
PolynomialParser.tokenize = function(str) {
    var rules = [
        ["\\d*\\.\\d*", "number"],
        ["\\d+", "number"],
        ["i", "imaginary"],
        ["[a-hj-z]", "variable"],
        ["[\\+\\*\\^-]", "operator"],
        ["[\\(\\)]", "parenthesis"]
    ];
    var rule = "(?:";
    for (var i = 0; i < rules.length; i++)
        rule += (i > 0 ? "|(" : "(") + rules[i][0] + ")";
    rule += ")";
    var regexp = new RegExp(rule, "g");
    var tokens = [];
    var result;
    while ((result = regexp.exec(str)) !== null) {
        var value = result[0];
        var type = rules[result.slice(1).indexOf(value)][1];
        var token = {
            "type": type,
            "value": value
        };
        tokens.push(token);
    }
    return tokens;
};

window['PolynomialParser'] = PolynomialParser;
window['PolynomialParser']['parse'] = PolynomialParser.parse;
window['PolynomialParser']['eval'] = PolynomialParser.eval;
