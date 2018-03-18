module.exports = class Tokenizer {
    /**
     * @param {Array<Array<string>>} rules
     */
    constructor(rules) {
        this.rules = rules;
    }

    /**
     * @param {string} str
     * @return {!Array<{type : string, value : string}>}
     */
    tokenize(str) {
        const rules = this.rules;
        let rule = "(?:";
        let i = 0;
        const l = rules.length;
        for (; i < l; i++)
            rule += (i > 0 ? "|(" : "(") + rules[i][0] + ")";
        rule += ")";
        const regexp = new RegExp(rule, "g");
        const tokens = [];
        let result;
        while ((result = regexp.exec(str)) !== null) {
            const value = result[0];
            const type = rules[result.slice(1).indexOf(value)][1];
            const token = {
                "type": type,
                "value": value
            };
            tokens.push(token);
        }
        return tokens;
    }
};
