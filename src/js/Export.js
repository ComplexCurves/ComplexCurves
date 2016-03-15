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

/** @param {StateGL} stategl
 *  @param {Float32Array} pixels
 *  @param {string=} name */
Export.exportSurface = function(stategl, pixels, name = "surface") {
    var d, i, j, k, u, v, x, y, z, w;
    var length, vertices, faces, uvs, maxValue = -Infinity,
        minValue = Infinity;
    length = pixels.byteLength / pixels.BYTES_PER_ELEMENT / 4;
    vertices = [];
    for (i = 0; i < length * 4; i += 4) {
        x = pixels[i];
        y = pixels[i + 1];
        z = pixels[i + 2];
        w = pixels[i + 3];
        vertices.push("v " + x + " " + y + " " + z);
        minValue = Math.min(minValue, Math.min(z, w));
        maxValue = Math.max(maxValue, Math.max(z, w));
    }
    d = maxValue - minValue;
    uvs = [];
    for (i = 2; i < length * 4; i += 4) {
        u = (pixels[i] - minValue) / d;
        v = (pixels[i + 1] - minValue) / d;
        uvs.push("vt " + u + " " + v);
    }
    faces = [];
    for (i = 1; i <= length; i += 3) {
        j = i + 1;
        k = i + 2;
        faces.push("f " + i + "/" + i + " " + j + "/" + j + " " + k + "/" + k);
    }

    var obj = ["mtllib " + name + ".mtl", "usemtl surface", "s 1"];
    obj = obj.concat(vertices);
    obj = obj.concat(uvs);
    obj = obj.concat(faces);
    obj = "data:text/plain," + encodeURIComponent(obj.join("\n"));
    Export.download(name + ".obj", obj);

    var gl = stategl.gl;
    var sources = StateGL.getShaderSources("Export");
    var program = stategl.mkProgram(sources);
    var loc;
    stategl.withRenderToTexture(function() {
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, stategl.rttArrayBuffer);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        loc = gl.getUniformLocation(program, "minValue");
        gl.uniform1f(loc, minValue);
        loc = gl.getUniformLocation(program, "maxValue");
        gl.uniform1f(loc, maxValue);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
    var texels = /** @type {Uint8Array} */
        (stategl.readTexture(stategl.rttTexture));
    Export.download(name + ".png", Export.pixelsToImageDataURL(texels));

    var mtl = ["newmtl surface", "map_Kd " + name + ".png", "illum 0"];
    mtl = "data:text/plain," + encodeURIComponent(mtl.join("\n"));
    Export.download(name + ".mtl", mtl);
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
