var Export = {};

/** @param {string} name
 *  @param {string} url */
Export.download = function(name, url) {
    var link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/** @param {Uint8Array} pixels
 *  @return {string} */
Export.pixelsToImageDataURL = function(pixels) {
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
