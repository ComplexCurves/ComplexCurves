module.exports = class Misc {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} mu
     * @return {number}
     */
    static lerp(x, y, mu) {
        return x + mu * (y - x);
    }
};
