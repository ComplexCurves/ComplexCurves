var Misc = {};

/** @param {string} name
 *  @param {string} url */
Misc.download = function(name, url) {
    var link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/** @param {number} x
 *  @param {number} y
 *  @param {number} mu
 *  @return {number} */
Misc.lerp = function(x, y, mu) {
    return x + mu * (y - x);
};

/** @param {Array<string>} files
 *  @param {function(Array<string>)} onload */
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

/** @param {Uint8Array} pixels
 *  @return {string} */
Misc.pixelsToImageDataURL = function(pixels) {
    var canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 2048;
    var context = canvas.getContext("2d");
    var imageData = context.createImageData(canvas.width, canvas.height);
    imageData.data.set(pixels);
    context.putImageData(imageData, 0, 0);
    var canvasFlip = document.createElement("canvas");
    canvasFlip.width = 2048;
    canvasFlip.height = 2048;
    var contextFlip = canvasFlip.getContext("2d");
    contextFlip.translate(0, canvasFlip.height - 1);
    contextFlip.scale(1, -1);
    contextFlip.drawImage(canvas, 0, 0);
    return canvasFlip.toDataURL();
};
