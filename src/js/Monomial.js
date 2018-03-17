module.exports = class Monomial {

    /**
     * @param {!Object<string,number>} monomial
     */
    constructor(monomial) {
        this.value = monomial;
    }

    /**
     * @param {Monomial} m
     * @return {Monomial}
     */
    static clone(m) {
        const monomial = {};
        const ms = m.value;
        for (let key in ms)
            if (ms.hasOwnProperty(key))
                monomial[key] = ms[key];
        return new Monomial(monomial);
    }

    /**
     * @param {Monomial} a
     * @param {Monomial} b
     * @return {boolean}
     */
    static is(a, b) {
        let key;
        for (key in a.value)
            if (a.value.hasOwnProperty(key) && !b.value.hasOwnProperty(key) || a.value[key] !== b.value[key])
                return false;
        for (key in b.value)
            if (b.value.hasOwnProperty(key) && !a.value.hasOwnProperty(key) || a.value[key] !== b.value[key])
                return false;
        return true;
    }
};
