#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#define EPS 5e-3

/* complex division */
vec2 cd (in vec2 a, in vec2 b) {
	return vec2 (a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / dot (b, b);
}

vec2 cinv (in vec2 z) {
    return vec2(z.x, -z.y) / dot(z, z);
}

/* complex square root */
vec2 csqrt (in vec2 z)
{
    float r = sqrt (length (z));
    float phi = 0.5 * atan (z.y, z.x);
    return r * vec2 (cos (phi), sin (phi));
}

vec2 laguerre (in int n, in vec2 cs[N+1], in vec2 x, in int maxiter)
{
    const int MAXITER = 80;
    const float TOL = 2e-16;
    float rand[10];
    rand[0] = 1.0;
    rand[1] = 0.3141;
    rand[2] = 0.5926;
    rand[3] = 0.5358;
    rand[4] = 0.9793;
    rand[5] = 0.2385;
    rand[6] = 0.6264;
    rand[7] = 0.3383;
    rand[8] = 0.2795;
    rand[9] = 0.0288;
    float fn = float(n);
    vec2 a, p, q, s, g, g2, h, r, d1, d2;
    for (int iter = 1; iter <= MAXITER; iter++)
    {
        if (iter <= maxiter) {
            s = vec2(0.0, 0.0);
            q = vec2(0.0, 0.0);
            for (int i = N; i >= 0; i--)
                if (i == n)
                    p = cs[i];

            for (int i = N; i >= 0; i--)
            {
                if (i < n) {
                    s = q + cm(s, x);
                    q = p + cm(q, x);
                    p = cs[i] + cm(p, x);
                }
            }

            if (length (p) < EPS)
                return x;

            g = cd (q, p);
            g2 = cm (g, g);
            h = g2 - cd (2.0 * s, p);
            r = csqrt (float (n - 1) * (fn * h - g2));
            d1 = g + r;
            d2 = g - r;
            if (length (d2) > length (d1))
                d1 = d2;
            if (length (d1) > EPS)
                a = fn * cinv (d1);
            else
                a = (length (x) + 1.0) * vec2 (cos (float (iter)), sin (float (iter)));
            if (length (a) < TOL)
                return x;
            if (mod (float (iter), 20.0) == 0.0 && iter < maxiter - 19)
                a *= rand[iter / 20];
            x -= a;
        }
    }
    return x;
}

vec2 horner (in int n, in vec2 cs[N+1], in vec2 x) {
    vec2 p;
    for (int i = N - 1; i >= 0; i--)
        if (i >= n)
            p = cs[i];
        else if (i < n)
            p = cs[i] + cm(p, x);
    return p;
}

void weierstrass (in vec2 cs[N+1], out vec2 roots2[N]) {
	/* polynomial must be monic! */
    vec2 csn = cs[sheets];
    if (csn != vec2 (1.0, 0.0))
        for (int i = 0; i <= sheets; i++)
            cs[i] = cd (cs[i], csn);

    float maxabs = length (cs[0]);
    for (int i = 1; i < N; i++)
        if (i < sheets)
            maxabs = max (maxabs, length (cs[i]));
    float upperBound = 1.0 + maxabs; /// length (cs[n]);
    float phi = 2.0 * acos (-1.0) / float (sheets + 1);
    float d = upperBound / float (sheets);
    d = clamp (d, 1.0, 10.0);
	for (int i = 0; i < sheets; i++)
        roots2[i] = float (i) * d * vec2 (cos (float (i) * phi), sin (float (i) * phi));

	const int maxiter = 50;
	bool changing;
	for (int iter = 0; iter < maxiter; iter++)
	{
		changing = false;
		for (int i = 0; i < sheets; i++)
        {
            vec2 result = vec2 (1.0, 0.0);
            for (int j = 0; j < sheets; j++)
                if (j != i)
                    result = cm (result, roots2[i] - roots2[j]);
            vec2 update = cd (horner (sheets, cs, roots2[i]), result);
            ///* safe-guard against large update */
            //if (sheets > 1 && length (update) > 10)
            //	update /= length (update);
            if (length (update) > 1e-2)
                changing = true;
            roots2[i] -= update;
        }
        if (!changing)
            break;
	}
}

void quadratic_roots (in vec2 cs[N+1], out vec2 qroots[2]) {
    if (cs[0] == vec2 (0.0, 0.0)) {
        qroots[0] = vec2 (0.0, 0.0);
        qroots[1] = -cd (cs[1], cs[2]);
    }
    else
    {
        vec2 r = csqrt (cm (cs[1], cs[1]) - 4.0 * cm (cs[2], cs[0]));
        if (cs[1].x >= 0.0)
            r = -r;
        qroots[0] = cd (r - cs[1], 2.0 * cs[2]);
        qroots[1] = cd (2.0 * cs[0], r - cs[1]);
    }
}

void deflate (in int n, inout vec2 cs[N+1], in vec2 root) {
    vec2 fx[N+1];
    for (int j = 0; j < N + 1; j++)
        if (j < n + 1)
            fx[j] = cs[j];
    for (int j = N; j > 0; j--)
        fx[j-1] = cs[j-1] + cm (fx[j], root);
    for (int j = 1; j < N + 1; j++)
        if (j < n + 1)
            cs[j-1] = fx[j];
}

void roots (in int n, in vec2 cs[N+1], out vec2 roots[N])
{
    if (n == 1) {
        roots[0] = -cd (cs[0], cs[1]);
        return;
    }
    if (n == 2) {
        vec2 qroots[2];
        quadratic_roots (cs, qroots);
        roots[0] = qroots[0];
        roots[1] = qroots[1];
        return;
    }
    vec2 cs_orig[N+1];
    for (int i = 0; i < N + 1; i++)
        cs_orig[i] = cs[i];
    for (int i = 0; i < N; i++)
    {
        roots[i] = laguerre (n - i, cs, vec2 (0.0, 0.0), 80);
        roots[i] = laguerre (n, cs_orig, roots[i], 1);
        deflate (n - i, cs, roots[i]);
    }
    /* selection sort by real part */
    /*
    for(int i = 0; i < n - 1; i++)
    {
        int jmin = i;
        for (int j = i + 1; j < n; j++)
            if (roots[j].x < roots[jmin].x)
                jmin = j;
        vec2 z = roots[i];
        roots[i] = roots[jmin];
        roots[jmin] = z;
    }
    */
}

void f (in vec2 x, out vec2 cs[N+1]);
vec2 fx (in vec2 x, in vec2 y);
vec2 fy (in vec2 x, in vec2 y);
float rho (in vec2 x);
float M (in vec2 x, in float rho);

float epsilon (in vec2 ys[N]) {
    float d = distance (ys[0], ys[1]);
    for (int j = 0; j < sheets; j++) {
        for (int k = 0; k < sheets; k++) {
            if (k > j)
                d = min (d, distance (ys[j], ys[k]));
        }
    }
    return d / 2.0;
}

float Y (in vec2 x, in vec2 ys[N]) {
    float y = length (cd (fx (x, ys[0]), fy (x, ys[0])));
    for (int j = 0; j < sheets; j++)
        y = max (y, length (cd (fx (x, ys[j]), fy (x, ys[j]))));
    return y;
}

float Delta (in vec2 x, in vec2 ys[N]) {
    float eps = epsilon (ys);
    float r = rho (x);
    float m = M (x, r);
    float y = Y (x, ys);
    return r * (sqrt (pow (r * y - eps, 2.0) + 4.0 * eps * m) -
        (r * y + eps)) / (2.0 * (m - r * y));
}
