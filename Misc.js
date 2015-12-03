var Misc = {};

Misc.lerp = function(x, y, mu) {
    return x + mu * (y - x);
};

Misc.loadTextFiles = function(files, onload) {
    var sources = [],
        count = 0;
    files.forEach(function(file, i, files) {
        var req = new XMLHttpRequest();
        req.open("GET", file, true);
        req.responseType = "text";
        req.onload = function() {
            sources[i] = req.responseText;
            if (++count == files.length)
                onload(sources);
        };
        req.send();
    });
};
