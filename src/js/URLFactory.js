module.exports = class URLFactory {
    /**
     * @param {Uint8Array} pixels
     * @return {string}
     */
    static pixelsToImageDataURL(pixels) {
        const size = Math.sqrt(pixels.length / 4);
        const canvas =
            /** @type {HTMLCanvasElement} */
            (document.createElement("canvas"));
        canvas.width = size;
        canvas.height = size;
        const context =
            /** @type {CanvasRenderingContext2D} */
            (canvas.getContext("2d"));
        const imageData = context.createImageData(canvas.width, canvas.height);
        imageData.data.set(pixels);
        context.putImageData(imageData, 0, 0);
        const canvasFlip =
            /** @type {HTMLCanvasElement} */
            (document.createElement("canvas"));
        canvasFlip.width = size;
        canvasFlip.height = size;
        const contextFlip =
            /** @type {CanvasRenderingContext2D} */
            (canvasFlip.getContext("2d"));
        contextFlip.translate(0, canvasFlip.height - 1);
        contextFlip.scale(1, -1);
        contextFlip.drawImage(canvas, 0, 0);
        return canvasFlip.toDataURL();
    }

    /**
     * @param {Uint8Array|Float32Array} pixels
     * @return {string}
     */
    static pixelsToObjectURL(pixels) {
        return URL.createObjectURL(new Blob([pixels], {
            type: "application/octet-binary"
        }));
    }
};
