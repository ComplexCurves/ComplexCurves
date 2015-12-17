var GLSL = {};

/** @param {Polynomial} p
 *  @return {Array<string>} */
GLSL.glslCoefficients = function(p) {
    /*
    glslCoefficients :: GLSLNumber a => Polynomial a -> [String]
    glslCoefficients p
      | isConstant p = [glslComplex (constant p)]
      | isUnivariate p = map glslComplex (coefficientList' p)
      | isBivariate p = let [vx,vy] = variableList p in
          map (glslHorner vx . glslCoefficients) (coefficientList vy p)
      | otherwise = error "not implemented yet"
    */
};

/** @param {Complex} z
 *  @return {string} */
GLSL.glslComplex = function(z) {
    return "vec2 (" + z.re + "," + z.im + ")";
};

/** @param {Polynomial} p
 *  @param {string} vx
 *  @param {string} vy
 *  @return {string} */
GLSL.glslF = function(p, vx, vy) {
    /*
    glslF :: GLSLNumber a => Polynomial a -> Char -> Char -> String
    glslF p vx _ = unlines $
      [ ""
      , "void f (in vec2 " ++ vx : ", out vec2 cs[N+1])"
      , "{"
      ]
      ++ 
      zipWith (\i c -> "cs[" ++ show (i :: Int) ++ "] = " ++ c ++ ";") [0..8] cs'
      ++
      [ "}"
      ]
      where
        cs' = pad $ reverse $ glslCoefficients p
        pad cs = cs ++ replicate (8 - length cs + 1) (glslComplex (0 :: Int))
    */
};

/** @param {Polynomial} p
 *  @param {string} vx
 *  @param {string} vy
 *  @return {string} */
GLSL.glslFx = function(p, vx, vy) {
    /*
    glslFx :: GLSLNumber a => Polynomial a -> Char -> Char -> String
    glslFx p vx vy = unlines
      [ ""
      , "vec2 fx (in vec2 " ++ vx : ", in vec2 " ++ vy : ")"
      , "{"
      , "    return " ++ glslHorner vy cs ++ ";"
      , "}"
      ]
      where
        cs = map (glslHorner vx . glslCoefficients) (coefficientList vy dfdx)
        dfdx = diff vx p
    */
};

/** @param {Polynomial} p
 *  @param {string} vx
 *  @param {string} vy
 *  @return {string} */
GLSL.glslFy = function(p, vx, vy) {
    /*
    glslFy :: GLSLNumber a => Polynomial a -> Char -> Char -> String
    glslFy p vx vy = unlines
      [ ""
      , "vec2 fy (in vec2 " ++ vx : ", in vec2 " ++ vy : ")"
      , "{"
      , "    return " ++ glslHorner vx cs ++ ";"
      , "}"
      ]
      where
        cs = map (glslHorner vy . glslCoefficients) (coefficientList vx dfdy)
        dfdy = diff vy p
    */
};

/** @param {Polynomial} p
 *  @param {string} vx
 *  @param {string} vy
 *  @return {string} */
GLSL.glslHeader = function(p, vx, vy) {
    /*
    glslHeader :: Polynomial a -> Char -> Char -> String
    glslHeader p _ vy = unlines 
    #ifdef __HASTE__
      [ "precision highp float;"
    #else
      [ "#version 330 core"
    #endif
      , "const int N = 8;"
      , "const int sheets = " ++ show (degree vy p) ++ ";"
      , ""
      , "/* complex multiplication */
    /*" // FIXME comment!
      , "vec2 cm (in vec2 a, in vec2 b)"
      , "{"
      , "    return vec2 (a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);"
      , "}"
      ]
    */
};

/** @param {string} v
 *  @param {Array<string>} cs */
GLSL.glslHorner = function(v, cs) {
    /*
    glslHorner :: Char -> [String] -> String
    glslHorner v = foldl1 glslHorner' where
      glslHorner' y c = cm ++ c' where
        c' = if c == "vec2(0.0,0.0)" then "" else '+' : c
        cm = case y of
          "vec2(1.0,0.0)" -> [v]
          "vec2(-1.0,0.0)" -> '-' : [v]
          _ -> "cm(" ++ v : ',' : y ++ ")"
    */
};

/** @param {Polynomial} p
 *  @param {string} vx
 *  @param {string} vy
 *  @return {string} */
GLSL.glslM = function(p, vx, vy) {
    /*
    glslM :: (GLSLNumber a) => Polynomial a -> Char -> Char -> String
    glslM p vx vy = unlines $
      [ ""
      , "float M (in vec2 " ++ vx : ", in float rho)"
      , "{"
      , "    float a[" ++ show (length cs) ++ "];"
      , "    a[0] = length (" ++ glslComplex (constant a0a0) ++ ");"
      ]
      ++
      map (\c -> "    a[0] *= distance (" ++ vx : ", " ++ glslComplex c ++
        ") - rho;") leadRoots
      ++
      [ "    vec2 r = vec2 (length (" ++ vx : ") + rho, 0.0);"
      ]
      ++
      zipWith (\k q -> "    a[" ++ show k ++ "] = length (" ++
        (glslHorner 'r' . glslCoefficients) q ++ ");") [(1 :: Int)..] (tail cs)
      ++ -- FIXME: 'r' must not conflict with variables of polynomial p
      [ "    float m = a[1] / a[0];"
      , "    for (int j = 2; j < " ++ show (length cs) ++ "; j++) {"
      , "        m = max (m, pow (a[j] / a[0], 1.0 / float (j)));"
      , "    }"
      , "    return 2.0 * m;"
      , "}"
      ]
      where
        a0a0 = leading vx (head cs)
        an = leading vy p'
        cs = map (fmap abs) (coefficientList vy p)
        leadRoots = roots (coefficientList' an)
        p' = fmap complexify p
    */
};

/** @param {Polynomial} p
 *  @param {string} vx
 *  @param {string} vy
 *  @return {string} */
GLSL.glslRho = function(p, vx, vy) {
    /*
    glslRho :: GLSLNumber a => Polynomial a -> Char -> Char -> String
    glslRho p vx vy = unlines $
      [ ""
      , "float rho (in vec2 " ++ vx : ") {"
      , "    float d = 100.0;"
      ]
      ++
      map (\c -> "    d = min (d, distance (" ++ vx : ", " ++ glslComplex c ++
        "));") critical
      ++
      [ "    return 0.999 * d;"
      , "}"
      ]
      where
        p' = fmap complexify p
        an = leading vy p'
        disc = discriminant vy p'
        leadRoots = roots (coefficientList' an)
        critical = filter (not . isInfinite . magnitude)
          (leadRoots ++ roots (coefficientList' disc))
    */
};

/** @param {Polynomial} p
 *  @return {string} */
GLSL.polynomialShaderSource = function(p) {
    /*
    polynomialShaderSource :: GLSLNumber a => Polynomial a -> String
    {-# SPECIALIZE polynomialShaderSource :: Polynomial Int -> String #-}
    polynomialShaderSource p = sources where
      sources = concatMap (\f -> f p vx vy) [glslHeader, glslF, glslFx, glslFy,
        glslRho, glslM]
      vx = if length vars < 2 then 'x' else head vars
      vy = if null vars then 'y' else last vars
      vars = variableList p
    */
};
