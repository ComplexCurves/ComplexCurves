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

    /**
     * @param {Array<string>} files
     * @param {function(Array<string>)} onload
     */
    static loadTextFiles(files, onload) {
        const sources = [];
        let count = 0;
        files.forEach(function(file, i, files) {
            const req = new XMLHttpRequest();
            req.open("GET", file, true);
            req.responseType = "text";
            req.onload = function() {
                sources[i] = req.responseText;
                if (++count === files.length)
                    onload(sources);
            };
            req.send();
        });
    }
};
