const Complex = require('./Complex.js');
const Polynomial = require('./Polynomial.js');
const Term = require('./Term.js');

class GLSL {
    /**
     * @param {Polynomial} p
     * @return {Array<string>}
     */
    static glslCoefficients(p) {
        const cs = [];
        let cs_, i, l;
        if (p.isConstant())
            return [GLSL.glslComplex(p.constant())];
        else if (p.isUnivariate()) {
            cs_ = p.coefficientList_();
            for (i = 0, l = cs_.length; i < l; i++)
                cs[i] = GLSL.glslComplex(cs_[i]);
        } else if (p.isBivariate()) {
            const vars = p.variableList();
            const vx = vars[0],
                vy = vars[1];
            cs_ = p.coefficientList(vy);
            for (i = 0, l = cs_.length; i < l; i++)
                cs[i] = GLSL.glslHorner(vx, GLSL.glslCoefficients(cs_[i]));
        }
        return cs;
    }

    /**
     * @param {Complex} z
     * @return {string}
     */
    static glslComplex(z) {
        return "vec2 (" + z.re.toPrecision(8) + ", " + z.im.toPrecision(8) +
            ")";
    }

    /**
     * @param {Polynomial} p
     * @param {string} vx
     * @param {string} vy
     * @return {string}
     */
    static glslF(p, vx, vy) {
        const cs = GLSL.pad(GLSL.glslCoefficients(p).reverse());
        const lines = ["void f (in vec2 " + vx + ", out vec2 cs[N+1])", "{"];
        for (let i = 0; i <= GLSL.N; i++)
            lines.push("cs[" + i + "] = " + cs[i] + ";");
        lines.push("}");
        return lines.join("\n");
    }

    /**
     * @param {Polynomial} p
     * @param {string} vx
     * @param {string} vy
     * @return {string}
     */
    static glslFx(p, vx, vy) {
        const cs = p.diff(vx).coefficientList(vy);
        const cs_ = [];
        const l = cs.length;
        for (let i = 0; i < l; i++)
            cs_[i] = GLSL.glslHorner(vx, GLSL.glslCoefficients(cs[i]));
        const lines = ["vec2 fx (in vec2 " + vx + ", in vec2 " + vy + ")", "{",
            "    return " + GLSL.glslHorner(vy, cs_) + ";", "}"
        ];
        return lines.join("\n");
    }

    /**
     * @param {Polynomial} p
     * @param {string} vx
     * @param {string} vy
     * @return {string}
     */
    static glslFy(p, vx, vy) {
        const cs = p.diff(vy).coefficientList(vx);
        const cs_ = [];
        const l = cs.length;
        for (let i = 0; i < l; i++)
            cs_[i] = GLSL.glslHorner(vy, GLSL.glslCoefficients(cs[i]));
        const lines = ["vec2 fy (in vec2 " + vx + ", in vec2 " + vy + ")", "{",
            "    return " + GLSL.glslHorner(vx, cs_) + ";", "}"
        ];
        return lines.join("\n");
    }

    /**
     * @param {Polynomial} p
     * @param {string} vx
     * @param {string} vy
     * @return {string}
     */
    static glslHeader(p, vx, vy) {
        const lines = [
            "#ifdef GL_FRAGMENT_PRECISION_HIGH",
            "precision highp float;",
            "#else", "precision mediump float;", "#endif",
            "const int N = " + GLSL.N + ";",
            "const int sheets = " + p.degree(vy) + ";", "",
            "/* complex multiplication */",
            "vec2 cm (in vec2 a, in vec2 b)", "{",
            "    return vec2 (a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);",
            "}"
        ];
        return lines.join("\n");
    }

    /**
     * @param {string} v
     * @param {Array<string>} cs
     * @return {string}
     */
    static glslHorner(v, cs) {
        let str = cs[0];
        const l = cs.length;
        for (let i = 1; i < l; i++) {
            if (str === "vec2 (1.0000000, 0.0000000)")
                str = v;
            else if (str === "vec2 (-1.0000000, 0.0000000)")
                str = "-" + v;
            else
                str = "cm (" + v + "," + str + ")";
            if (cs[i] !== "vec2 (0.0000000, 0.0000000)")
                str += "+" + cs[i];
        }
        return str;
    }

    /**
     * @param {Polynomial} p
     * @param {string} vx
     * @param {string} vy
     * @return {string}
     */
    static glslM(p, vx, vy) {
        let i, j, l, k;
        const cs = p.coefficientList(vy);
        for (i = 0, l = cs.length; i < l; i++) {
            const terms = cs[i].terms;
            for (j = 0, k = terms.length; j < k; j++) {
                const term = terms[j];
                terms[j] = new Term(Complex.real(term.coefficient.abs()),
                    term.monomial);
            }
            cs[i] = new Polynomial(terms);
        }
        const a0a0 = cs[0].leading(vx);
        const an = p.leading(vy);
        const leadRoots = Polynomial.roots(an.coefficientList_());
        let lines = ["float M (in vec2 " + vx + ", in float rho)", "{",
            "    vec2 r = vec2 (length (" + vx + ") + rho, 0.0);",
            "    float a[" + cs.length + "];",
            "    a[0] = length (" + GLSL.glslComplex(a0a0.constant()) +
            ");"
        ];
        for (i = 0, l = leadRoots.length; i < l; i++)
            lines.push("    a[0] *= distance (" + vx + ", " +
                GLSL.glslComplex(leadRoots[i]) + ") - rho;");
        for (i = 1, l = cs.length; i < l; i++)
            // FIXME: 'r' must not conflict with variables of polynomial p
            lines.push("    a[" + i + "] = length (" + GLSL.glslHorner('r',
                GLSL.glslCoefficients(cs[i])) + ");");
        lines = lines.concat(["    float m = a[1] / a[0];",
            "    for (int j = 2; j < " + cs.length + "; j++) {",
            "        m = max (m, pow (a[j] / a[0], 1.0 / float (j)));",
            "    }",
            "    return 2.0 * m;", "}"
        ]);
        return lines.join("\n");
    }

    /**
     * @param {Polynomial} p
     * @param {string} vx
     * @param {string} vy
     * @return {string}
     */
    static glslRho(p, vx, vy) {
        const an = p.leading(vy),
            disc = p.discriminant(vy),
            leadRoots = Polynomial.roots(an.coefficientList_()),
            discRoots = Polynomial.roots(disc.coefficientList_());
        let i, l;
        const critical = [];
        for (i = 0, l = leadRoots.length; i < l; i++)
            if (isFinite(leadRoots[i].abs()))
                critical.push(leadRoots[i]);
        for (i = 0, l = discRoots.length; i < l; i++)
            if (isFinite(discRoots[i].abs()))
                critical.push(discRoots[i]);
        let lines = ["float rho (in vec2 " + vx + ") {",
            "    float d = 100.0;"
        ];
        for (i = 0, l = critical.length; i < l; i++)
            lines.push("    d = min (d, distance (" + vx + ", " +
                GLSL.glslComplex(critical[i]) + "));");
        lines = lines.concat(["    return 0.999 * d;", "}"]);
        return lines.join("\n");
    }

    /**
     * @param {Array<string>} cs
     * @return {Array<string>}
     */
    static pad(cs) {
        const n = GLSL.N - cs.length + 1;
        const zero = GLSL.glslComplex(Complex.zero());
        for (let i = 0; i < n; i++)
            cs.push(zero);
        return cs;
    }

    /**
     * @param {Polynomial} p
     * @return {string}
     */
    static polynomialShaderSource(p) {
        const vars = p.variableList();
        const vx = vars.length < 2 ? "x" : vars[0];
        const vy = vars.length === 0 ? "y" : vars[vars.length - 1];
        return [
            GLSL.glslHeader(p, vx, vy),
            GLSL.glslF(p, vx, vy),
            GLSL.glslFx(p, vx, vy),
            GLSL.glslFy(p, vx, vy),
            GLSL.glslRho(p, vx, vy),
            GLSL.glslM(p, vx, vy)
        ].join("\n\n");
    }
}

GLSL.N = /** number */ 8;

module.exports = GLSL;
