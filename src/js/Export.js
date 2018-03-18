const GLSL = require('./GLSL.js');
const Polynomial = require('./Polynomial.js');
const StateGL = require('./StateGL.js');

module.exports = class Export {
    /**
     * @param {Polynomial} p
     * @param {StateGL} stategl
     * @param {boolean=} big
     * @return {Array<string>}
     */
    static domainColouring(p, stategl, big = false) {
        const gl = stategl.gl;
        const sources = StateGL.getShaderSources("DomainColouring");
        const customShaderSrc = GLSL.polynomialShaderSource(p);
        const commonShaderSrc = /** @type {string} */ (resources["Common.glsl"]);
        sources[1] = [customShaderSrc, commonShaderSrc, sources[1]].join("\n");
        const program = stategl.mkProgram(sources);
        let loc;
        const vars = p.variableList();
        const vy = vars.length === 0 ? "y" : vars[vars.length - 1];
        const numSheets = p.degree(vy);
        const sheets = [];
        let pixels;

        /** @param {number} sheet */
        function renderSheet(sheet) {
            gl.useProgram(program);
            gl.bindBuffer(gl.ARRAY_BUFFER, stategl.rttArrayBuffer);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            loc = gl.getUniformLocation(program, "sheet");
            gl.uniform1i(loc, sheet);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        for (let sheet = 1; sheet <= numSheets; sheet++) {
            stategl.withRenderToTexture(renderSheet.bind(null, sheet), big);
            const texture = big ? stategl.rttBigTexture : stategl.rttTexture;
            pixels = /** @type {Uint8Array} */
                (stategl.readTexture(texture));
            sheets[sheet - 1] = Export.pixelsToImageDataURL(pixels);
        }
        return sheets;
    }

    /**
     * @param {string} name
     * @param {string} url
     */
    static download(name, url) {
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * @param {Polynomial} p
     * @param {StateGL} stategl
     * @param {string=} name
     * @param {boolean=} big
     */
    static exportDomainColouring(p, stategl, name = "sheet", big = true) {
        const sheets = Export.domainColouring(p, stategl, big);
        const l = sheets.length;
        for (let i = 0; i < l; i++)
            Export.download(name + (i + 1) + ".png", sheets[i]);
    }

    /**
     * @param {StateGL} stategl
     * @param {Float32Array} pixels
     * @param {string=} name
     * @param {boolean=} big
     */
    static exportSurface(stategl, pixels, name = "surface", big = true) {
        // FIXME much too slow
        let d, i, j, k, u, v, x, y, z, w;
        let length, indices, maxValue = -Infinity,
            minValue = Infinity;
        length = pixels.byteLength / pixels.BYTES_PER_ELEMENT / 4;
        let /** Array<Array<number>> */ vertices = [];
        for (i = 0; i < length * 4; i += 4) {
            x = pixels[i];
            y = pixels[i + 1];
            z = pixels[i + 2];
            w = pixels[i + 3];
            vertices.push([x, y, z]);
            minValue = Math.min(minValue, Math.min(z, w));
            maxValue = Math.max(maxValue, Math.max(z, w));
        }
        d = maxValue - minValue;
        let /** Array<Array<number>> */ uvs = [];
        for (i = 2; i < length * 4; i += 4) {
            u = (pixels[i] - minValue) / d;
            v = (pixels[i + 1] - minValue) / d;
            uvs.push([u, v]);
        }
        let /** Array<Array<number>> */ faces = [];
        for (i = 1; i <= length; i += 3) {
            j = i + 1;
            k = i + 2;
            faces.push([i, j, k]);
        }

        /* deduplicate mesh data */
        indices = vertices.map(function(v1, i) {
            const uv1 = uvs[i];
            return vertices.findIndex(function(v2, j) {
                const uv2 = uvs[j];
                return v1[0] === v2[0] && v1[1] === v2[1] && v1[2] === v2[2] &&
                    uv1[0] === uv2[0] && uv1[1] === uv2[1];
            });
        });
        const /** @type {Array<number>} */ indices2 = Array.from(new Set(indices));
        vertices = indices2.map(function(ii) {
            return vertices[ii];
        });
        uvs = indices2.map(function(i) {
            return uvs[i];
        });
        faces = faces.map(function(f) {
            return f.map(function(i) {
                return indices2.findIndex(function(j) {
                    return j === indices[i - 1];
                }) + 1;
            });
        });

        const vertexStrings = vertices.map( /** @param {Array<number>} v */ function(v) {
            return "v " + v[0] + " " + v[1] + " " + v[2];
        });
        const uvStrings = uvs.map( /** @param {Array<number>} uv */ function(uv) {
            return "vt " + uv[0] + " " + uv[1];
        });
        const faceStrings = faces.map( /** @param {Array<number>} f */ function(f) {
            const i = f[0],
                j = f[1],
                k = f[2];
            return "f " + i + "/" + i + " " + j + "/" + j + " " + k + "/" + k;
        });

        let obj = ["mtllib " + name + ".mtl", "usemtl surface", "s 1"];
        obj = obj.concat(vertexStrings, uvStrings, faceStrings);
        obj = "data:text/plain," + encodeURIComponent(obj.join("\n"));
        Export.download(name + ".obj", obj);

        const gl = stategl.gl;
        const sources = StateGL.getShaderSources("Export");
        const program = stategl.mkProgram(sources);
        let loc;
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
        }, big);
        const texels = /** @type {Uint8Array} */
            (stategl.readTexture(big ? stategl.rttBigTexture : stategl.rttTexture));
        Export.download(name + ".png", Export.pixelsToImageDataURL(texels));

        let mtl = ["newmtl surface", "map_Kd " + name + ".png", "illum 0"];
        mtl = "data:text/plain," + encodeURIComponent(mtl.join("\n"));
        Export.download(name + ".mtl", mtl);
    }

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
