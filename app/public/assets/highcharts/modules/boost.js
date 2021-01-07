/*
 Highcharts JS v8.2.0 (2020-08-20)

 Boost module

 (c) 2010-2019 Highsoft AS
 Author: Torstein Honsi

 License: www.highcharts.com/license

 This is a Highcharts module that draws long data series on a canvas in order
 to increase performance of the initial load time and tooltip responsiveness.

 Compatible with WebGL compatible browsers (not IE < 11).

 If this module is taken in as part of the core
 - All the loading logic should be merged with core. Update styles in the
   core.
 - Most of the method wraps should probably be added directly in parent
   methods.

 Notes for boost mode
 - Area lines are not drawn
 - Lines are not drawn on scatter charts
 - Zones and negativeColor don't work
 - Dash styles are not rendered on lines.
 - Columns are always one pixel wide. Don't set the threshold too low.
 - Disable animations
 - Marker shapes are not supported: markers will always be circles, except
   heatmap series, where markers are always rectangles.

 Optimizing tips for users
 - Set extremes (min, max) explicitly on the axes in order for Highcharts to
   avoid computing extremes.
 - Set enableMouseTracking to false on the series to improve total rendering
      time.
 - The default threshold is set based on one series. If you have multiple,
   dense series, the combined number of points drawn gets higher, and you may
   want to set the threshold lower in order to use optimizations.
 - If drawing large scatter charts, it's beneficial to set the marker radius
   to a value less than 1. This is to add additional spacing to make the chart
   more readable.
 - If the value increments on both the X and Y axis aren't small, consider
   setting useGPUTranslations to true on the boost settings object. If you do
   this and the increments are small (e.g. datetime axis with small time
   increments) it may cause rendering issues due to floating point rounding
   errors, so your millage may vary.

 Settings
    There are two ways of setting the boost threshold:
    - Per series: boost based on number of points in individual series
    - Per chart: boost based on the number of series

  To set the series boost threshold, set seriesBoostThreshold on the chart
  object.
  To set the series-specific threshold, set boostThreshold on the series
  object.

  In addition, the following can be set in the boost object:
  {
      //Wether or not to use alpha blending
      useAlpha: boolean - default: true
      //Set to true to perform translations on the GPU.
      //Much faster, but may cause rendering issues
      //when using values far from 0 due to floating point
      //rounding issues
      useGPUTranslations: boolean - default: false
      //Use pre-allocated buffers, much faster,
      //but may cause rendering issues with some data sets
      usePreallocated: boolean - default: false
  }
*/
(function (b) {
    "object" === typeof module && module.exports ? (b["default"] = b, module.exports = b) : "function" === typeof define && define.amd ? define("highcharts/modules/boost", ["highcharts"], function (n) {
        b(n);
        b.Highcharts = n;
        return b
    }) : b("undefined" !== typeof Highcharts ? Highcharts : void 0)
})(function (b) {
    function n(b, l, E, m) {
        b.hasOwnProperty(l) || (b[l] = m.apply(null, E))
    }

    b = b ? b._modules : {};
    n(b, "Extensions/Boost/Boostables.js", [], function () {
        return "area arearange column columnrange bar line scatter heatmap bubble treemap".split(" ")
    });
    n(b, "Extensions/Boost/BoostableMap.js", [b["Extensions/Boost/Boostables.js"]], function (b) {
        var v = {};
        b.forEach(function (b) {
            v[b] = 1
        });
        return v
    });
    n(b, "Extensions/Boost/WGLShader.js", [b["Core/Utilities.js"]], function (b) {
        var v = b.clamp, E = b.error, m = b.pick;
        return function (d) {
            function b() {
                k.length && E("[highcharts boost] shader error - " + k.join("\n"))
            }

            function g(c, a) {
                var e = d.createShader("vertex" === a ? d.VERTEX_SHADER : d.FRAGMENT_SHADER);
                d.shaderSource(e, c);
                d.compileShader(e);
                return d.getShaderParameter(e, d.COMPILE_STATUS) ?
                    e : (k.push("when compiling " + a + " shader:\n" + d.getShaderInfoLog(e)), !1)
            }

            function z() {
                function c(c) {
                    return d.getUniformLocation(a, c)
                }

                var H = g("#version 100\n#define LN10 2.302585092994046\nprecision highp float;\nattribute vec4 aVertexPosition;\nattribute vec4 aColor;\nvarying highp vec2 position;\nvarying highp vec4 vColor;\nuniform mat4 uPMatrix;\nuniform float pSize;\nuniform float translatedThreshold;\nuniform bool hasThreshold;\nuniform bool skipTranslation;\nuniform float xAxisTrans;\nuniform float xAxisMin;\nuniform float xAxisMinPad;\nuniform float xAxisPointRange;\nuniform float xAxisLen;\nuniform bool  xAxisPostTranslate;\nuniform float xAxisOrdinalSlope;\nuniform float xAxisOrdinalOffset;\nuniform float xAxisPos;\nuniform bool  xAxisCVSCoord;\nuniform bool  xAxisIsLog;\nuniform bool  xAxisReversed;\nuniform float yAxisTrans;\nuniform float yAxisMin;\nuniform float yAxisMinPad;\nuniform float yAxisPointRange;\nuniform float yAxisLen;\nuniform bool  yAxisPostTranslate;\nuniform float yAxisOrdinalSlope;\nuniform float yAxisOrdinalOffset;\nuniform float yAxisPos;\nuniform bool  yAxisCVSCoord;\nuniform bool  yAxisIsLog;\nuniform bool  yAxisReversed;\nuniform bool  isBubble;\nuniform bool  bubbleSizeByArea;\nuniform float bubbleZMin;\nuniform float bubbleZMax;\nuniform float bubbleZThreshold;\nuniform float bubbleMinSize;\nuniform float bubbleMaxSize;\nuniform bool  bubbleSizeAbs;\nuniform bool  isInverted;\nfloat bubbleRadius(){\nfloat value = aVertexPosition.w;\nfloat zMax = bubbleZMax;\nfloat zMin = bubbleZMin;\nfloat radius = 0.0;\nfloat pos = 0.0;\nfloat zRange = zMax - zMin;\nif (bubbleSizeAbs){\nvalue = value - bubbleZThreshold;\nzMax = max(zMax - bubbleZThreshold, zMin - bubbleZThreshold);\nzMin = 0.0;\n}\nif (value < zMin){\nradius = bubbleZMin / 2.0 - 1.0;\n} else {\npos = zRange > 0.0 ? (value - zMin) / zRange : 0.5;\nif (bubbleSizeByArea && pos > 0.0){\npos = sqrt(pos);\n}\nradius = ceil(bubbleMinSize + pos * (bubbleMaxSize - bubbleMinSize)) / 2.0;\n}\nreturn radius * 2.0;\n}\nfloat translate(float val,\nfloat pointPlacement,\nfloat localA,\nfloat localMin,\nfloat minPixelPadding,\nfloat pointRange,\nfloat len,\nbool  cvsCoord,\nbool  isLog,\nbool  reversed\n){\nfloat sign = 1.0;\nfloat cvsOffset = 0.0;\nif (cvsCoord) {\nsign *= -1.0;\ncvsOffset = len;\n}\nif (isLog) {\nval = log(val) / LN10;\n}\nif (reversed) {\nsign *= -1.0;\ncvsOffset -= sign * len;\n}\nreturn sign * (val - localMin) * localA + cvsOffset + \n(sign * minPixelPadding);\n}\nfloat xToPixels(float value) {\nif (skipTranslation){\nreturn value;// + xAxisPos;\n}\nreturn translate(value, 0.0, xAxisTrans, xAxisMin, xAxisMinPad, xAxisPointRange, xAxisLen, xAxisCVSCoord, xAxisIsLog, xAxisReversed);// + xAxisPos;\n}\nfloat yToPixels(float value, float checkTreshold) {\nfloat v;\nif (skipTranslation){\nv = value;// + yAxisPos;\n} else {\nv = translate(value, 0.0, yAxisTrans, yAxisMin, yAxisMinPad, yAxisPointRange, yAxisLen, yAxisCVSCoord, yAxisIsLog, yAxisReversed);// + yAxisPos;\nif (v > yAxisLen) {\nv = yAxisLen;\n}\n}\nif (checkTreshold > 0.0 && hasThreshold) {\nv = min(v, translatedThreshold);\n}\nreturn v;\n}\nvoid main(void) {\nif (isBubble){\ngl_PointSize = bubbleRadius();\n} else {\ngl_PointSize = pSize;\n}\nvColor = aColor;\nif (skipTranslation && isInverted) {\ngl_Position = uPMatrix * vec4(aVertexPosition.y + yAxisPos, aVertexPosition.x + xAxisPos, 0.0, 1.0);\n} else if (isInverted) {\ngl_Position = uPMatrix * vec4(yToPixels(aVertexPosition.y, aVertexPosition.z) + yAxisPos, xToPixels(aVertexPosition.x) + xAxisPos, 0.0, 1.0);\n} else {\ngl_Position = uPMatrix * vec4(xToPixels(aVertexPosition.x) + xAxisPos, yToPixels(aVertexPosition.y, aVertexPosition.z) + yAxisPos, 0.0, 1.0);\n}\n}",
                    "vertex"),
                    e = g("precision highp float;\nuniform vec4 fillColor;\nvarying highp vec2 position;\nvarying highp vec4 vColor;\nuniform sampler2D uSampler;\nuniform bool isCircle;\nuniform bool hasColor;\nvoid main(void) {\nvec4 col = fillColor;\nvec4 tcol;\nif (hasColor) {\ncol = vColor;\n}\nif (isCircle) {\ntcol = texture2D(uSampler, gl_PointCoord.st);\ncol *= tcol;\nif (tcol.r < 0.0) {\ndiscard;\n} else {\ngl_FragColor = col;\n}\n} else {\ngl_FragColor = col;\n}\n}", "fragment");
                if (!H || !e) return a = !1,
                    b(), !1;
                a = d.createProgram();
                d.attachShader(a, H);
                d.attachShader(a, e);
                d.linkProgram(a);
                if (!d.getProgramParameter(a, d.LINK_STATUS)) return k.push(d.getProgramInfoLog(a)), b(), a = !1;
                d.useProgram(a);
                d.bindAttribLocation(a, 0, "aVertexPosition");
                w = c("uPMatrix");
                p = c("pSize");
                f = c("fillColor");
                B = c("isBubble");
                O = c("bubbleSizeAbs");
                h = c("bubbleSizeByArea");
                I = c("uSampler");
                l = c("skipTranslation");
                G = c("isCircle");
                t = c("isInverted");
                return !0
            }

            function q(c, k) {
                d && a && (c = r[c] = r[c] || d.getUniformLocation(a, c), d.uniform1f(c, k))
            }

            var r = {}, a, w, p, f, B, O, h, l, G, t, k = [], I;
            return d && !z() ? !1 : {
                psUniform: function () {
                    return p
                }, pUniform: function () {
                    return w
                }, fillColorUniform: function () {
                    return f
                }, setBubbleUniforms: function (c, k, e) {
                    var t = c.options, b = Number.MAX_VALUE, p = -Number.MAX_VALUE;
                    d && a && "bubble" === c.type && (b = m(t.zMin, v(k, !1 === t.displayNegative ? t.zThreshold : -Number.MAX_VALUE, b)), p = m(t.zMax, Math.max(p, e)), d.uniform1i(B, 1), d.uniform1i(G, 1), d.uniform1i(h, "width" !== c.options.sizeBy), d.uniform1i(O, c.options.sizeByAbsoluteValue), q("bubbleZMin",
                        b), q("bubbleZMax", p), q("bubbleZThreshold", c.options.zThreshold), q("bubbleMinSize", c.minPxSize), q("bubbleMaxSize", c.maxPxSize))
                }, bind: function () {
                    d && a && d.useProgram(a)
                }, program: function () {
                    return a
                }, create: z, setUniform: q, setPMatrix: function (c) {
                    d && a && d.uniformMatrix4fv(w, !1, c)
                }, setColor: function (c) {
                    d && a && d.uniform4f(f, c[0] / 255, c[1] / 255, c[2] / 255, c[3])
                }, setPointSize: function (c) {
                    d && a && d.uniform1f(p, c)
                }, setSkipTranslation: function (c) {
                    d && a && d.uniform1i(l, !0 === c ? 1 : 0)
                }, setTexture: function (c) {
                    d && a && d.uniform1i(I,
                        c)
                }, setDrawAsCircle: function (c) {
                    d && a && d.uniform1i(G, c ? 1 : 0)
                }, reset: function () {
                    d && a && (d.uniform1i(B, 0), d.uniform1i(G, 0))
                }, setInverted: function (c) {
                    d && a && d.uniform1i(t, c)
                }, destroy: function () {
                    d && a && (d.deleteProgram(a), a = !1)
                }
            }
        }
    });
    n(b, "Extensions/Boost/WGLVBuffer.js", [], function () {
        return function (b, l, E) {
            function m() {
                d && (b.deleteBuffer(d), v = d = !1);
                q = 0;
                g = E || 2;
                r = []
            }

            var d = !1, v = !1, g = E || 2, z = !1, q = 0, r;
            return {
                destroy: m, bind: function () {
                    if (!d) return !1;
                    b.vertexAttribPointer(v, g, b.FLOAT, !1, 0, 0)
                }, data: r, build: function (a,
                                             w, p) {
                    var f;
                    r = a || [];
                    if (!(r && 0 !== r.length || z)) return m(), !1;
                    g = p || g;
                    d && b.deleteBuffer(d);
                    z || (f = new Float32Array(r));
                    d = b.createBuffer();
                    b.bindBuffer(b.ARRAY_BUFFER, d);
                    b.bufferData(b.ARRAY_BUFFER, z || f, b.STATIC_DRAW);
                    v = b.getAttribLocation(l.program(), w);
                    b.enableVertexAttribArray(v);
                    return !0
                }, render: function (a, m, p) {
                    var f = z ? z.length : r.length;
                    if (!d || !f) return !1;
                    if (!a || a > f || 0 > a) a = 0;
                    if (!m || m > f) m = f;
                    b.drawArrays(b[(p || "points").toUpperCase()], a / g, (m - a) / g);
                    return !0
                }, allocate: function (a) {
                    q = -1;
                    z = new Float32Array(4 *
                        a)
                }, push: function (a, b, d, f) {
                    z && (z[++q] = a, z[++q] = b, z[++q] = d, z[++q] = f)
                }
            }
        }
    });
    n(b, "Extensions/Boost/WGLRenderer.js", [b["Core/Globals.js"], b["Extensions/Boost/WGLShader.js"], b["Extensions/Boost/WGLVBuffer.js"], b["Core/Color.js"], b["Core/Utilities.js"]], function (b, l, E, m, d) {
        var v = m.parse, g = d.isNumber, z = d.isObject, q = d.merge, r = d.objectEach, a = d.pick, w = b.win.document;
        return function (d) {
            function p(c) {
                if (c.isSeriesBoosting) {
                    var a = !!c.options.stacking;
                    var e = c.xData || c.options.xData || c.processedXData;
                    a = (a ? c.data :
                        e || c.options.data).length;
                    "treemap" === c.type ? a *= 12 : "heatmap" === c.type ? a *= 6 : ma[c.type] && (a *= 2);
                    return a
                }
                return 0
            }

            function B() {
                e.clear(e.COLOR_BUFFER_BIT | e.DEPTH_BUFFER_BIT)
            }

            function O(c, a) {
                function e(c) {
                    c && (a.colorData.push(c[0]), a.colorData.push(c[1]), a.colorData.push(c[2]), a.colorData.push(c[3]))
                }

                function b(c, a, b, k, d) {
                    e(d);
                    y.usePreallocated ? H.push(c, a, b ? 1 : 0, k || 1) : (N.push(c), N.push(a), N.push(b ? 1 : 0), N.push(k || 1))
                }

                function k() {
                    a.segments.length && (a.segments[a.segments.length - 1].to = N.length)
                }

                function d() {
                    a.segments.length &&
                    a.segments[a.segments.length - 1].from === N.length || (k(), a.segments.push({from: N.length}))
                }

                function t(c, a, k, d, t) {
                    e(t);
                    b(c + k, a);
                    e(t);
                    b(c, a);
                    e(t);
                    b(c, a + d);
                    e(t);
                    b(c, a + d);
                    e(t);
                    b(c + k, a + d);
                    e(t);
                    b(c + k, a)
                }

                function p(c, e) {
                    y.useGPUTranslations || (a.skipTranslation = !0, c.x = w.toPixels(c.x, !0), c.y = n.toPixels(c.y, !0));
                    e ? N = [c.x, c.y, 0, 2].concat(N) : b(c.x, c.y, 0, 2)
                }

                var Z = c.pointArrayMap && "low,high" === c.pointArrayMap.join(","), P = c.chart, f = c.options,
                    G = !!f.stacking, I = f.data, g = c.xAxis.getExtremes(), h = g.min;
                g = g.max;
                var B = c.yAxis.getExtremes(),
                    q = B.min;
                B = B.max;
                var l = c.xData || f.xData || c.processedXData, O = c.yData || f.yData || c.processedYData,
                    r = c.zData || f.zData || c.processedZData, n = c.yAxis, w = c.xAxis, E = c.chart.plotWidth,
                    J = !l || 0 === l.length, L = f.connectNulls, u = c.points || !1, F = !1, K = !1, Q;
                l = G ? c.data : l || I;
                var X = {x: Number.MAX_VALUE, y: 0}, M = {x: -Number.MAX_VALUE, y: 0}, T = 0, W = !1, D = -1, S = !1,
                    U = !1, ka = "undefined" === typeof P.index, fa = !1, ha = !1;
                var x = !1;
                var za = ma[c.type], ia = !1, sa = !0, ta = !0, Y = f.zones || !1, V = !1, ua = f.threshold, ja = !1;
                if (!(f.boostData && 0 < f.boostData.length)) {
                    f.gapSize &&
                    (ja = "value" !== f.gapUnit ? f.gapSize * c.closestPointRange : f.gapSize);
                    Y && (Y.some(function (c) {
                        return "undefined" === typeof c.value ? (V = new m(c.color), !0) : !1
                    }), V || (V = c.pointAttribs && c.pointAttribs().fill || c.color, V = new m(V)));
                    P.inverted && (E = c.chart.plotHeight);
                    c.closestPointRangePx = Number.MAX_VALUE;
                    d();
                    if (u && 0 < u.length) a.skipTranslation = !0, a.drawMode = "triangles", u[0].node && u[0].node.levelDynamic && u.sort(function (c, a) {
                        if (c.node) {
                            if (c.node.levelDynamic > a.node.levelDynamic) return 1;
                            if (c.node.levelDynamic < a.node.levelDynamic) return -1
                        }
                        return 0
                    }),
                        u.forEach(function (a) {
                            var e = a.plotY;
                            if ("undefined" !== typeof e && !isNaN(e) && null !== a.y) {
                                e = a.shapeArgs;
                                var b = P.styledMode ? a.series.colorAttribs(a) : b = a.series.pointAttribs(a);
                                a = b["stroke-width"] || 0;
                                x = v(b.fill).rgba;
                                x[0] /= 255;
                                x[1] /= 255;
                                x[2] /= 255;
                                "treemap" === c.type && (a = a || 1, Q = v(b.stroke).rgba, Q[0] /= 255, Q[1] /= 255, Q[2] /= 255, t(e.x, e.y, e.width, e.height, Q), a /= 2);
                                "heatmap" === c.type && P.inverted && (e.x = w.len - e.x, e.y = n.len - e.y, e.width = -e.width, e.height = -e.height);
                                t(e.x + a, e.y + a, e.width - 2 * a, e.height - 2 * a, x)
                            }
                        }); else {
                        for (; D <
                               l.length - 1;) {
                            var C = l[++D];
                            if (ka) break;
                            u = I && I[D];
                            !J && z(u, !0) && u.color && (x = v(u.color).rgba, x[0] /= 255, x[1] /= 255, x[2] /= 255);
                            if (J) {
                                u = C[0];
                                var A = C[1];
                                l[D + 1] && (U = l[D + 1][0]);
                                l[D - 1] && (S = l[D - 1][0]);
                                if (3 <= C.length) {
                                    var va = C[2];
                                    C[2] > a.zMax && (a.zMax = C[2]);
                                    C[2] < a.zMin && (a.zMin = C[2])
                                }
                            } else u = C, A = O[D], l[D + 1] && (U = l[D + 1]), l[D - 1] && (S = l[D - 1]), r && r.length && (va = r[D], r[D] > a.zMax && (a.zMax = r[D]), r[D] < a.zMin && (a.zMin = r[D]));
                            if (L || null !== u && null !== A) {
                                U && U >= h && U <= g && (fa = !0);
                                S && S >= h && S <= g && (ha = !0);
                                if (Z) {
                                    J && (A = C.slice(1, 3));
                                    var ba =
                                        A[0];
                                    A = A[1]
                                } else G && (u = C.x, A = C.stackY, ba = A - C.y);
                                null !== q && "undefined" !== typeof q && null !== B && "undefined" !== typeof B && (sa = A >= q && A <= B);
                                u > g && M.x < g && (M.x = u, M.y = A);
                                u < h && X.x > h && (X.x = u, X.y = A);
                                if (null !== A || !L) if (null !== A && (sa || fa || ha)) {
                                    if ((U >= h || u >= h) && (S <= g || u <= g) && (ia = !0), ia || fa || ha) {
                                        ja && u - S > ja && d();
                                        Y && (x = V.rgba, Y.some(function (c, a) {
                                            a = Y[a - 1];
                                            if ("undefined" !== typeof c.value && A <= c.value) {
                                                if (!a || A >= a.value) x = v(c.color).rgba;
                                                return !0
                                            }
                                            return !1
                                        }), x[0] /= 255, x[1] /= 255, x[2] /= 255);
                                        if (!y.useGPUTranslations && (a.skipTranslation =
                                            !0, u = w.toPixels(u, !0), A = n.toPixels(A, !0), u > E && "points" === a.drawMode)) continue;
                                        if (za) {
                                            C = ba;
                                            if (!1 === ba || "undefined" === typeof ba) C = 0 > A ? A : 0;
                                            Z || G || (C = Math.max(null === ua ? q : ua, q));
                                            y.useGPUTranslations || (C = n.toPixels(C, !0));
                                            b(u, C, 0, 0, x)
                                        }
                                        a.hasMarkers && ia && !1 !== F && (c.closestPointRangePx = Math.min(c.closestPointRangePx, Math.abs(u - F)));
                                        !y.useGPUTranslations && !y.usePreallocated && F && 1 > Math.abs(u - F) && K && 1 > Math.abs(A - K) ? y.debug.showSkipSummary && ++T : (f.step && !ta && b(u, K, 0, 2, x), b(u, A, 0, "bubble" === c.type ? va || 1 : 2, x), F =
                                            u, K = A, W = !0, ta = !1)
                                    }
                                } else d()
                            } else d()
                        }
                        y.debug.showSkipSummary && console.log("skipped points:", T);
                        W || !1 === L || "line_strip" !== c.drawMode || (X.x < Number.MAX_VALUE && p(X, !0), M.x > -Number.MAX_VALUE && p(M))
                    }
                    k()
                }
            }

            function h() {
                F = [];
                W.data = N = [];
                L = [];
                H && H.destroy()
            }

            function J(a) {
                c && (c.setUniform("xAxisTrans", a.transA), c.setUniform("xAxisMin", a.min), c.setUniform("xAxisMinPad", a.minPixelPadding), c.setUniform("xAxisPointRange", a.pointRange), c.setUniform("xAxisLen", a.len), c.setUniform("xAxisPos", a.pos), c.setUniform("xAxisCVSCoord",
                    !a.horiz), c.setUniform("xAxisIsLog", !!a.logarithmic), c.setUniform("xAxisReversed", !!a.reversed))
            }

            function G(a) {
                c && (c.setUniform("yAxisTrans", a.transA), c.setUniform("yAxisMin", a.min), c.setUniform("yAxisMinPad", a.minPixelPadding), c.setUniform("yAxisPointRange", a.pointRange), c.setUniform("yAxisLen", a.len), c.setUniform("yAxisPos", a.pos), c.setUniform("yAxisCVSCoord", !a.horiz), c.setUniform("yAxisIsLog", !!a.logarithmic), c.setUniform("yAxisReversed", !!a.reversed))
            }

            function t(a, e) {
                c.setUniform("hasThreshold",
                    a);
                c.setUniform("translatedThreshold", e)
            }

            function k(k) {
                if (k) n = k.chartWidth || 800, K = k.chartHeight || 400; else return !1;
                if (!(e && n && K && c)) return !1;
                y.debug.timeRendering && console.time("gl rendering");
                e.canvas.width = n;
                e.canvas.height = K;
                c.bind();
                e.viewport(0, 0, n, K);
                c.setPMatrix([2 / n, 0, 0, 0, 0, -(2 / K), 0, 0, 0, 0, -2, 0, -1, 1, -1, 1]);
                1 < y.lineWidth && !b.isMS && e.lineWidth(y.lineWidth);
                H.build(W.data, "aVertexPosition", 4);
                H.bind();
                c.setInverted(k.inverted);
                F.forEach(function (b, d) {
                    var f = b.series.options, p = f.marker;
                    var h = "undefined" !==
                    typeof f.lineWidth ? f.lineWidth : 1;
                    var I = f.threshold, l = g(I), B = b.series.yAxis.getThreshold(I);
                    I = a(f.marker ? f.marker.enabled : null, b.series.xAxis.isRadial ? !0 : null, b.series.closestPointRangePx > 2 * ((f.marker ? f.marker.radius : 10) || 10));
                    p = M[p && p.symbol || b.series.symbol] || M.circle;
                    if (!(0 === b.segments.length || b.segmentslength && b.segments[0].from === b.segments[0].to)) {
                        p.isReady && (e.bindTexture(e.TEXTURE_2D, p.handle), c.setTexture(p.handle));
                        k.styledMode ? p = b.series.markerGroup && b.series.markerGroup.getStyle("fill") :
                            (p = b.series.pointAttribs && b.series.pointAttribs().fill || b.series.color, f.colorByPoint && (p = b.series.chart.options.colors[d]));
                        b.series.fillOpacity && f.fillOpacity && (p = (new m(p)).setOpacity(a(f.fillOpacity, 1)).get());
                        p = v(p).rgba;
                        y.useAlpha || (p[3] = 1);
                        "lines" === b.drawMode && y.useAlpha && 1 > p[3] && (p[3] /= 10);
                        "add" === f.boostBlending ? (e.blendFunc(e.SRC_ALPHA, e.ONE), e.blendEquation(e.FUNC_ADD)) : "mult" === f.boostBlending || "multiply" === f.boostBlending ? e.blendFunc(e.DST_COLOR, e.ZERO) : "darken" === f.boostBlending ? (e.blendFunc(e.ONE,
                            e.ONE), e.blendEquation(e.FUNC_MIN)) : e.blendFuncSeparate(e.SRC_ALPHA, e.ONE_MINUS_SRC_ALPHA, e.ONE, e.ONE_MINUS_SRC_ALPHA);
                        c.reset();
                        0 < b.colorData.length && (c.setUniform("hasColor", 1), d = E(e, c), d.build(b.colorData, "aColor", 4), d.bind());
                        c.setColor(p);
                        J(b.series.xAxis);
                        G(b.series.yAxis);
                        t(l, B);
                        "points" === b.drawMode && (f.marker && g(f.marker.radius) ? c.setPointSize(2 * f.marker.radius) : c.setPointSize(1));
                        c.setSkipTranslation(b.skipTranslation);
                        "bubble" === b.series.type && c.setBubbleUniforms(b.series, b.zMin, b.zMax);
                        c.setDrawAsCircle(ka[b.series.type] || !1);
                        if (0 < h || "line_strip" !== b.drawMode) for (h = 0; h < b.segments.length; h++) H.render(b.segments[h].from, b.segments[h].to, b.drawMode);
                        if (b.hasMarkers && I) for (f.marker && g(f.marker.radius) ? c.setPointSize(2 * f.marker.radius) : c.setPointSize(10), c.setDrawAsCircle(!0), h = 0; h < b.segments.length; h++) H.render(b.segments[h].from, b.segments[h].to, "POINTS")
                    }
                });
                y.debug.timeRendering && console.timeEnd("gl rendering");
                d && d();
                h()
            }

            function I(a) {
                B();
                if (a.renderer.forExport) return k(a);
                T ? k(a) :
                    setTimeout(function () {
                        I(a)
                    }, 1)
            }

            var c = !1, H = !1, e = !1, n = 0, K = 0, N = !1, L = !1, W = {}, T = !1, F = [], M = {},
                ma = {column: !0, columnrange: !0, bar: !0, area: !0, arearange: !0}, ka = {scatter: !0, bubble: !0},
                y = {
                    pointSize: 1,
                    lineWidth: 1,
                    fillColor: "#AA00AA",
                    useAlpha: !0,
                    usePreallocated: !1,
                    useGPUTranslations: !1,
                    debug: {
                        timeRendering: !1,
                        timeSeriesProcessing: !1,
                        timeSetup: !1,
                        timeBufferCopy: !1,
                        timeKDTree: !1,
                        showSkipSummary: !1
                    }
                };
            return W = {
                allocateBufferForSingleSeries: function (a) {
                    var c = 0;
                    y.usePreallocated && (a.isSeriesBoosting && (c = p(a)), H.allocate(c))
                },
                pushSeries: function (a) {
                    0 < F.length && F[F.length - 1].hasMarkers && (F[F.length - 1].markerTo = L.length);
                    y.debug.timeSeriesProcessing && console.time("building " + a.type + " series");
                    F.push({
                        segments: [],
                        markerFrom: L.length,
                        colorData: [],
                        series: a,
                        zMin: Number.MAX_VALUE,
                        zMax: -Number.MAX_VALUE,
                        hasMarkers: a.options.marker ? !1 !== a.options.marker.enabled : !1,
                        showMarkers: !0,
                        drawMode: {
                            area: "lines",
                            arearange: "lines",
                            areaspline: "line_strip",
                            column: "lines",
                            columnrange: "lines",
                            bar: "lines",
                            line: "line_strip",
                            scatter: "points",
                            heatmap: "triangles",
                            treemap: "triangles",
                            bubble: "points"
                        }[a.type] || "line_strip"
                    });
                    O(a, F[F.length - 1]);
                    y.debug.timeSeriesProcessing && console.timeEnd("building " + a.type + " series")
                }, setSize: function (a, b) {
                    n === a && K === b || !c || (n = a, K = b, c.bind(), c.setPMatrix([2 / n, 0, 0, 0, 0, -(2 / K), 0, 0, 0, 0, -2, 0, -1, 1, -1, 1]))
                }, inited: function () {
                    return T
                }, setThreshold: t, init: function (a, b) {
                    function k(a, c) {
                        var b = {isReady: !1, texture: w.createElement("canvas"), handle: e.createTexture()},
                            k = b.texture.getContext("2d");
                        M[a] = b;
                        b.texture.width = 512;
                        b.texture.height =
                            512;
                        k.mozImageSmoothingEnabled = !1;
                        k.webkitImageSmoothingEnabled = !1;
                        k.msImageSmoothingEnabled = !1;
                        k.imageSmoothingEnabled = !1;
                        k.strokeStyle = "rgba(255, 255, 255, 0)";
                        k.fillStyle = "#FFF";
                        c(k);
                        try {
                            e.activeTexture(e.TEXTURE0), e.bindTexture(e.TEXTURE_2D, b.handle), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA, e.RGBA, e.UNSIGNED_BYTE, b.texture), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.LINEAR),
                                e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.LINEAR), e.bindTexture(e.TEXTURE_2D, null), b.isReady = !0
                        } catch (R) {
                        }
                    }

                    var d = 0, f = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"];
                    T = !1;
                    if (!a) return !1;
                    for (y.debug.timeSetup && console.time("gl setup"); d < f.length && !(e = a.getContext(f[d], {})); d++) ;
                    if (e) b || h(); else return !1;
                    e.enable(e.BLEND);
                    e.blendFunc(e.SRC_ALPHA, e.ONE_MINUS_SRC_ALPHA);
                    e.disable(e.DEPTH_TEST);
                    e.depthFunc(e.LESS);
                    c = l(e);
                    if (!c) return !1;
                    H = E(e, c);
                    k("circle", function (a) {
                        a.beginPath();
                        a.arc(256,
                            256, 256, 0, 2 * Math.PI);
                        a.stroke();
                        a.fill()
                    });
                    k("square", function (a) {
                        a.fillRect(0, 0, 512, 512)
                    });
                    k("diamond", function (a) {
                        a.beginPath();
                        a.moveTo(256, 0);
                        a.lineTo(512, 256);
                        a.lineTo(256, 512);
                        a.lineTo(0, 256);
                        a.lineTo(256, 0);
                        a.fill()
                    });
                    k("triangle", function (a) {
                        a.beginPath();
                        a.moveTo(0, 512);
                        a.lineTo(256, 0);
                        a.lineTo(512, 512);
                        a.lineTo(0, 512);
                        a.fill()
                    });
                    k("triangle-down", function (a) {
                        a.beginPath();
                        a.moveTo(0, 0);
                        a.lineTo(256, 512);
                        a.lineTo(512, 0);
                        a.lineTo(0, 0);
                        a.fill()
                    });
                    T = !0;
                    y.debug.timeSetup && console.timeEnd("gl setup");
                    return !0
                }, render: I, settings: y, valid: function () {
                    return !1 !== e
                }, clear: B, flush: h, setXAxis: J, setYAxis: G, data: N, gl: function () {
                    return e
                }, allocateBuffer: function (a) {
                    var c = 0;
                    y.usePreallocated && (a.series.forEach(function (a) {
                        a.isSeriesBoosting && (c += p(a))
                    }), H.allocate(c))
                }, destroy: function () {
                    h();
                    H.destroy();
                    c.destroy();
                    e && (r(M, function (a) {
                        a.handle && e.deleteTexture(a.handle)
                    }), e.canvas.width = 1, e.canvas.height = 1)
                }, setOptions: function (a) {
                    q(!0, y, a)
                }
            }
        }
    });
    n(b, "Extensions/Boost/BoostAttach.js", [b["Extensions/Boost/WGLRenderer.js"],
        b["Core/Globals.js"], b["Core/Utilities.js"]], function (b, l, n) {
        var m = l.doc, d = n.error, v = m.createElement("canvas");
        return function (g, n) {
            var q = g.chartWidth, r = g.chartHeight, a = g, w = g.seriesGroup || n.group,
                p = m.implementation.hasFeature("www.http://w3.org/TR/SVG11/feature#Extensibility", "1.1");
            a = g.isChartSeriesBoosting() ? g : n;
            p = !1;
            a.renderTarget || (a.canvas = v, g.renderer.forExport || !p ? (a.renderTarget = g.renderer.image("", 0, 0, q, r).addClass("highcharts-boost-canvas").add(w), a.boostClear = function () {
                a.renderTarget.attr({href: ""})
            },
                a.boostCopy = function () {
                    a.boostResizeTarget();
                    a.renderTarget.attr({href: a.canvas.toDataURL("image/png")})
                }) : (a.renderTargetFo = g.renderer.createElement("foreignObject").add(w), a.renderTarget = m.createElement("canvas"), a.renderTargetCtx = a.renderTarget.getContext("2d"), a.renderTargetFo.element.appendChild(a.renderTarget), a.boostClear = function () {
                a.renderTarget.width = a.canvas.width;
                a.renderTarget.height = a.canvas.height
            }, a.boostCopy = function () {
                a.renderTarget.width = a.canvas.width;
                a.renderTarget.height = a.canvas.height;
                a.renderTargetCtx.drawImage(a.canvas, 0, 0)
            }), a.boostResizeTarget = function () {
                q = g.chartWidth;
                r = g.chartHeight;
                (a.renderTargetFo || a.renderTarget).attr({x: 0, y: 0, width: q, height: r}).css({
                    pointerEvents: "none",
                    mixedBlendMode: "normal",
                    opacity: 1
                });
                a instanceof l.Chart && a.markerGroup.translate(g.plotLeft, g.plotTop)
            }, a.boostClipRect = g.renderer.clipRect(), (a.renderTargetFo || a.renderTarget).clip(a.boostClipRect), a instanceof l.Chart && (a.markerGroup = a.renderer.g().add(w), a.markerGroup.translate(n.xAxis.pos, n.yAxis.pos)));
            a.canvas.width = q;
            a.canvas.height = r;
            a.boostClipRect.attr(g.getBoostClipRect(a));
            a.boostResizeTarget();
            a.boostClear();
            a.ogl || (a.ogl = b(function () {
                a.ogl.settings.debug.timeBufferCopy && console.time("buffer copy");
                a.boostCopy();
                a.ogl.settings.debug.timeBufferCopy && console.timeEnd("buffer copy")
            }), a.ogl.init(a.canvas) || d("[highcharts boost] - unable to init WebGL renderer"), a.ogl.setOptions(g.options.boost || {}), a instanceof l.Chart && a.ogl.allocateBuffer(g));
            a.ogl.setSize(q, r);
            return a.ogl
        }
    });
    n(b, "Extensions/Boost/BoostUtils.js",
        [b["Core/Globals.js"], b["Extensions/Boost/BoostableMap.js"], b["Extensions/Boost/BoostAttach.js"], b["Core/Utilities.js"]], function (b, l, n, m) {
            function d() {
                for (var a = [], b = 0; b < arguments.length; b++) a[b] = arguments[b];
                var d = -Number.MAX_VALUE;
                a.forEach(function (a) {
                    if ("undefined" !== typeof a && null !== a && "undefined" !== typeof a.length && 0 < a.length) return d = a.length, !0
                });
                return d
            }

            function v(a, b, d) {
                a && b.renderTarget && b.canvas && !(d || b.chart).isChartSeriesBoosting() && a.render(d || b.chart)
            }

            function g(a, b) {
                a && b.renderTarget &&
                b.canvas && !b.chart.isChartSeriesBoosting() && a.allocateBufferForSingleSeries(b)
            }

            function z(a, b, d, g, h, l) {
                h = h || 0;
                g = g || 3E3;
                for (var f = h + g, t = !0; t && h < f && h < a.length;) t = b(a[h], h), ++h;
                t && (h < a.length ? l ? z(a, b, d, g, h, l) : r.requestAnimationFrame ? r.requestAnimationFrame(function () {
                    z(a, b, d, g, h)
                }) : setTimeout(function () {
                    z(a, b, d, g, h)
                }) : d && d())
            }

            function q() {
                var b = 0, d, g = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"], l = !1;
                if ("undefined" !== typeof r.WebGLRenderingContext) for (d = a.createElement("canvas"); b < g.length; b++) try {
                    if (l =
                        d.getContext(g[b]), "undefined" !== typeof l && null !== l) return !0
                } catch (h) {
                }
                return !1
            }

            var r = b.win, a = b.doc, w = m.pick;
            m = {
                patientMax: d,
                boostEnabled: function (a) {
                    return w(a && a.options && a.options.boost && a.options.boost.enabled, !0)
                },
                shouldForceChartSeriesBoosting: function (a) {
                    var b = 0, g = 0, p = w(a.options.boost && a.options.boost.allowForce, !0);
                    if ("undefined" !== typeof a.boostForceChartBoost) return a.boostForceChartBoost;
                    if (1 < a.series.length) for (var h = 0; h < a.series.length; h++) {
                        var m = a.series[h];
                        0 !== m.options.boostThreshold &&
                        !1 !== m.visible && "heatmap" !== m.type && (l[m.type] && ++g, d(m.processedXData, m.options.data, m.points) >= (m.options.boostThreshold || Number.MAX_VALUE) && ++b)
                    }
                    a.boostForceChartBoost = p && (g === a.series.length && 0 < b || 5 < b);
                    return a.boostForceChartBoost
                },
                renderIfNotSeriesBoosting: v,
                allocateIfNotSeriesBoosting: g,
                eachAsync: z,
                hasWebGLSupport: q,
                pointDrawHandler: function (a) {
                    var b = !0;
                    this.chart.options && this.chart.options.boost && (b = "undefined" === typeof this.chart.options.boost.enabled ? !0 : this.chart.options.boost.enabled);
                    if (!b || !this.isSeriesBoosting) return a.call(this);
                    this.chart.isBoosting = !0;
                    if (a = n(this.chart, this)) g(a, this), a.pushSeries(this);
                    v(a, this)
                }
            };
            b.hasWebGLSupport = q;
            return m
        });
    n(b, "Extensions/Boost/BoostInit.js", [b["Core/Chart/Chart.js"], b["Core/Globals.js"], b["Core/Utilities.js"], b["Extensions/Boost/BoostUtils.js"], b["Extensions/Boost/BoostAttach.js"]], function (b, l, n, m, d) {
        var v = n.addEvent, g = n.extend, z = n.fireEvent, q = n.wrap, r = l.Series, a = l.seriesTypes,
            w = function () {
            }, p = m.eachAsync, f = m.pointDrawHandler, B =
                m.allocateIfNotSeriesBoosting, E = m.renderIfNotSeriesBoosting, h = m.shouldForceChartSeriesBoosting, J;
        return function () {
            g(r.prototype, {
                renderCanvas: function () {
                    function a(a, c) {
                        var b = !1, d = "undefined" === typeof g.index, k = !0;
                        if (!d) {
                            if (pa) {
                                var t = a[0];
                                var f = a[1]
                            } else t = a, f = m[c];
                            la ? (pa && (f = a.slice(1, 3)), b = f[0], f = f[1]) : na && (t = a.x, f = a.stackY, b = f - a.y);
                            wa || (k = f >= v && f <= M);
                            if (null !== f && t >= q && t <= r && k) if (a = e.toPixels(t, !0), y) {
                                if ("undefined" === typeof R || a === O) {
                                    la || (b = f);
                                    if ("undefined" === typeof aa || f > da) da = f, aa = c;
                                    if ("undefined" ===
                                        typeof R || b < ca) ca = b, R = c
                                }
                                a !== O && ("undefined" !== typeof R && (f = h.toPixels(da, !0), P = h.toPixels(ca, !0), ea(a, f, aa), P !== f && ea(a, P, R)), R = aa = void 0, O = a)
                            } else f = Math.ceil(h.toPixels(f, !0)), ea(a, f, c)
                        }
                        return !d
                    }

                    function b() {
                        z(k, "renderedCanvas");
                        delete k.buildKDTree;
                        k.buildKDTree();
                        ra.debug.timeKDTree && console.timeEnd("kd tree building")
                    }

                    var k = this, f = k.options || {}, c = !1, g = k.chart, e = this.xAxis, h = this.yAxis,
                        l = f.xData || k.processedXData, m = f.yData || k.processedYData, n = f.data;
                    c = e.getExtremes();
                    var q = c.min, r = c.max;
                    c = h.getExtremes();
                    var v = c.min, M = c.max, L = {}, O, y = !!k.sampling, Z = !1 !== f.enableMouseTracking,
                        P = h.getThreshold(f.threshold),
                        la = k.pointArrayMap && "low,high" === k.pointArrayMap.join(","), na = !!f.stacking,
                        oa = k.cropStart || 0, wa = k.requireSorting, pa = !l, ca, da, R, aa,
                        xa = "x" === f.findNearestPointBy,
                        qa = this.xData || this.options.xData || this.processedXData || !1, ea = function (a, c, b) {
                            a = Math.ceil(a);
                            J = xa ? a : a + "," + c;
                            Z && !L[J] && (L[J] = !0, g.inverted && (a = e.len - a, c = h.len - c), ya.push({
                                x: qa ? qa[oa + b] : !1,
                                clientX: a,
                                plotX: a,
                                plotY: c,
                                i: oa + b
                            }))
                        };
                    c = d(g, k);
                    g.isBoosting =
                        !0;
                    var ra = c.settings;
                    if (this.visible) {
                        (this.points || this.graph) && this.destroyGraphics();
                        g.isChartSeriesBoosting() ? (this.markerGroup && this.markerGroup !== g.markerGroup && this.markerGroup.destroy(), this.markerGroup = g.markerGroup, this.renderTarget && (this.renderTarget = this.renderTarget.destroy())) : (this.markerGroup === g.markerGroup && (this.markerGroup = void 0), this.markerGroup = k.plotGroup("markerGroup", "markers", !0, 1, g.seriesGroup));
                        var ya = this.points = [];
                        k.buildKDTree = w;
                        c && (B(c, this), c.pushSeries(k), E(c, this,
                            g));
                        g.renderer.forExport || (ra.debug.timeKDTree && console.time("kd tree building"), p(na ? k.data : l || n, a, b))
                    }
                }
            });
            ["heatmap", "treemap"].forEach(function (b) {
                a[b] && q(a[b].prototype, "drawPoints", f)
            });
            a.bubble && (delete a.bubble.prototype.buildKDTree, q(a.bubble.prototype, "markerAttribs", function (a) {
                return this.isSeriesBoosting ? !1 : a.apply(this, [].slice.call(arguments, 1))
            }));
            a.scatter.prototype.fill = !0;
            g(a.area.prototype, {fill: !0, fillOpacity: !0, sampling: !0});
            g(a.column.prototype, {fill: !0, sampling: !0});
            b.prototype.callbacks.push(function (a) {
                v(a,
                    "predraw", function () {
                        a.boostForceChartBoost = void 0;
                        a.boostForceChartBoost = h(a);
                        a.isBoosting = !1;
                        !a.isChartSeriesBoosting() && a.didBoost && (a.didBoost = !1);
                        a.boostClear && a.boostClear();
                        a.canvas && a.ogl && a.isChartSeriesBoosting() && (a.didBoost = !0, a.ogl.allocateBuffer(a));
                        a.markerGroup && a.xAxis && 0 < a.xAxis.length && a.yAxis && 0 < a.yAxis.length && a.markerGroup.translate(a.xAxis[0].pos, a.yAxis[0].pos)
                    });
                v(a, "render", function () {
                    a.ogl && a.isChartSeriesBoosting() && a.ogl.render(a)
                })
            })
        }
    });
    n(b, "Extensions/Boost/BoostOverrides.js",
        [b["Core/Chart/Chart.js"], b["Core/Globals.js"], b["Core/Series/Point.js"], b["Core/Utilities.js"], b["Extensions/Boost/BoostUtils.js"], b["Extensions/Boost/Boostables.js"], b["Extensions/Boost/BoostableMap.js"]], function (b, l, n, m, d, L, g) {
            var v = m.addEvent, q = m.error, r = m.getOptions, a = m.isArray, w = m.isNumber, p = m.pick, f = m.wrap,
                B = d.boostEnabled, E = d.shouldForceChartSeriesBoosting, h = l.Series, J = l.seriesTypes,
                G = r().plotOptions;
            b.prototype.isChartSeriesBoosting = function () {
                return p(this.options.boost && this.options.boost.seriesThreshold,
                    50) <= this.series.length || E(this)
            };
            b.prototype.getBoostClipRect = function (a) {
                var b = {x: this.plotLeft, y: this.plotTop, width: this.plotWidth, height: this.plotHeight};
                a === this && this.yAxis.forEach(function (a) {
                    b.y = Math.min(a.pos, b.y);
                    b.height = Math.max(a.pos - this.plotTop + a.len, b.height)
                }, this);
                return b
            };
            h.prototype.getPoint = function (a) {
                var b = a, d = this.xData || this.options.xData || this.processedXData || !1;
                !a || a instanceof this.pointClass || (b = (new this.pointClass).init(this, this.options.data[a.i], d ? d[a.i] : void 0),
                    b.category = p(this.xAxis.categories ? this.xAxis.categories[b.x] : b.x, b.x), b.dist = a.dist, b.distX = a.distX, b.plotX = a.plotX, b.plotY = a.plotY, b.index = a.i, b.isInside = this.isPointInside(a));
                return b
            };
            f(h.prototype, "searchPoint", function (a) {
                return this.getPoint(a.apply(this, [].slice.call(arguments, 1)))
            });
            f(n.prototype, "haloPath", function (a) {
                var b = this.series, d = this.plotX, c = this.plotY, f = b.chart.inverted;
                b.isSeriesBoosting && f && (this.plotX = b.yAxis.len - c, this.plotY = b.xAxis.len - d);
                var e = a.apply(this, Array.prototype.slice.call(arguments,
                    1));
                b.isSeriesBoosting && f && (this.plotX = d, this.plotY = c);
                return e
            });
            f(h.prototype, "markerAttribs", function (a, b) {
                var d = b.plotX, c = b.plotY, f = this.chart.inverted;
                this.isSeriesBoosting && f && (b.plotX = this.yAxis.len - c, b.plotY = this.xAxis.len - d);
                var e = a.apply(this, Array.prototype.slice.call(arguments, 1));
                this.isSeriesBoosting && f && (b.plotX = d, b.plotY = c);
                return e
            });
            v(h, "destroy", function () {
                var a = this, b = a.chart;
                b.markerGroup === a.markerGroup && (a.markerGroup = null);
                b.hoverPoints && (b.hoverPoints = b.hoverPoints.filter(function (b) {
                    return b.series ===
                        a
                }));
                b.hoverPoint && b.hoverPoint.series === a && (b.hoverPoint = null)
            });
            f(h.prototype, "getExtremes", function (a) {
                return this.isSeriesBoosting && this.hasExtremes && this.hasExtremes() ? {} : a.apply(this, Array.prototype.slice.call(arguments, 1))
            });
            ["translate", "generatePoints", "drawTracker", "drawPoints", "render"].forEach(function (a) {
                function b(b) {
                    var c = this.options.stacking && ("translate" === a || "generatePoints" === a);
                    if (!this.isSeriesBoosting || c || !B(this.chart) || "heatmap" === this.type || "treemap" === this.type || !g[this.type] ||
                        0 === this.options.boostThreshold) b.call(this); else if (this[a + "Canvas"]) this[a + "Canvas"]()
                }

                f(h.prototype, a, b);
                "translate" === a && "column bar arearange columnrange heatmap treemap".split(" ").forEach(function (d) {
                    J[d] && f(J[d].prototype, a, b)
                })
            });
            f(h.prototype, "processData", function (b) {
                function d(a) {
                    return f.chart.isChartSeriesBoosting() || (a ? a.length : 0) >= (f.options.boostThreshold || Number.MAX_VALUE)
                }

                var f = this, c = this.options.data;
                B(this.chart) && g[this.type] ? (d(c) && "heatmap" !== this.type && "treemap" !== this.type &&
                !this.options.stacking && this.hasExtremes && this.hasExtremes(!0) || (b.apply(this, Array.prototype.slice.call(arguments, 1)), c = this.processedXData), (this.isSeriesBoosting = d(c)) ? (c = this.getFirstValidPoint(this.options.data), w(c) || a(c) || q(12, !1, this.chart), this.enterBoost()) : this.exitBoost && this.exitBoost()) : b.apply(this, Array.prototype.slice.call(arguments, 1))
            });
            v(h, "hide", function () {
                this.canvas && this.renderTarget && (this.ogl && this.ogl.clear(), this.boostClear())
            });
            h.prototype.enterBoost = function () {
                this.alteredByBoost =
                    [];
                ["allowDG", "directTouch", "stickyTracking"].forEach(function (a) {
                    this.alteredByBoost.push({prop: a, val: this[a], own: Object.hasOwnProperty.call(this, a)})
                }, this);
                this.directTouch = this.allowDG = !1;
                this.finishedAnimating = this.stickyTracking = !0;
                this.labelBySeries && (this.labelBySeries = this.labelBySeries.destroy())
            };
            h.prototype.exitBoost = function () {
                (this.alteredByBoost || []).forEach(function (a) {
                    a.own ? this[a.prop] = a.val : delete this[a.prop]
                }, this);
                this.boostClear && this.boostClear()
            };
            h.prototype.hasExtremes = function (a) {
                var b =
                        this.options, d = this.xAxis && this.xAxis.options, c = this.yAxis && this.yAxis.options,
                    f = this.colorAxis && this.colorAxis.options;
                return b.data.length > (b.boostThreshold || Number.MAX_VALUE) && w(c.min) && w(c.max) && (!a || w(d.min) && w(d.max)) && (!f || w(f.min) && w(f.max))
            };
            h.prototype.destroyGraphics = function () {
                var a = this, b = this.points, d, c;
                if (b) for (c = 0; c < b.length; c += 1) (d = b[c]) && d.destroyElements && d.destroyElements();
                ["graph", "area", "tracker"].forEach(function (b) {
                    a[b] && (a[b] = a[b].destroy())
                })
            };
            L.forEach(function (a) {
                G[a] &&
                (G[a].boostThreshold = 5E3, G[a].boostData = [], J[a].prototype.fillOpacity = !0)
            })
        });
    n(b, "Extensions/Boost/NamedColors.js", [b["Core/Color.js"]], function (b) {
        var l = {
            aliceblue: "#f0f8ff",
            antiquewhite: "#faebd7",
            aqua: "#00ffff",
            aquamarine: "#7fffd4",
            azure: "#f0ffff",
            beige: "#f5f5dc",
            bisque: "#ffe4c4",
            black: "#000000",
            blanchedalmond: "#ffebcd",
            blue: "#0000ff",
            blueviolet: "#8a2be2",
            brown: "#a52a2a",
            burlywood: "#deb887",
            cadetblue: "#5f9ea0",
            chartreuse: "#7fff00",
            chocolate: "#d2691e",
            coral: "#ff7f50",
            cornflowerblue: "#6495ed",
            cornsilk: "#fff8dc",
            crimson: "#dc143c",
            cyan: "#00ffff",
            darkblue: "#00008b",
            darkcyan: "#008b8b",
            darkgoldenrod: "#b8860b",
            darkgray: "#a9a9a9",
            darkgreen: "#006400",
            darkkhaki: "#bdb76b",
            darkmagenta: "#8b008b",
            darkolivegreen: "#556b2f",
            darkorange: "#ff8c00",
            darkorchid: "#9932cc",
            darkred: "#8b0000",
            darksalmon: "#e9967a",
            darkseagreen: "#8fbc8f",
            darkslateblue: "#483d8b",
            darkslategray: "#2f4f4f",
            darkturquoise: "#00ced1",
            darkviolet: "#9400d3",
            deeppink: "#ff1493",
            deepskyblue: "#00bfff",
            dimgray: "#696969",
            dodgerblue: "#1e90ff",
            feldspar: "#d19275",
            firebrick: "#b22222",
            floralwhite: "#fffaf0",
            forestgreen: "#228b22",
            fuchsia: "#ff00ff",
            gainsboro: "#dcdcdc",
            ghostwhite: "#f8f8ff",
            gold: "#ffd700",
            goldenrod: "#daa520",
            gray: "#808080",
            green: "#008000",
            greenyellow: "#adff2f",
            honeydew: "#f0fff0",
            hotpink: "#ff69b4",
            indianred: "#cd5c5c",
            indigo: "#4b0082",
            ivory: "#fffff0",
            khaki: "#f0e68c",
            lavender: "#e6e6fa",
            lavenderblush: "#fff0f5",
            lawngreen: "#7cfc00",
            lemonchiffon: "#fffacd",
            lightblue: "#add8e6",
            lightcoral: "#f08080",
            lightcyan: "#e0ffff",
            lightgoldenrodyellow: "#fafad2",
            lightgrey: "#d3d3d3",
            lightgreen: "#90ee90",
            lightpink: "#ffb6c1",
            lightsalmon: "#ffa07a",
            lightseagreen: "#20b2aa",
            lightskyblue: "#87cefa",
            lightslateblue: "#8470ff",
            lightslategray: "#778899",
            lightsteelblue: "#b0c4de",
            lightyellow: "#ffffe0",
            lime: "#00ff00",
            limegreen: "#32cd32",
            linen: "#faf0e6",
            magenta: "#ff00ff",
            maroon: "#800000",
            mediumaquamarine: "#66cdaa",
            mediumblue: "#0000cd",
            mediumorchid: "#ba55d3",
            mediumpurple: "#9370d8",
            mediumseagreen: "#3cb371",
            mediumslateblue: "#7b68ee",
            mediumspringgreen: "#00fa9a",
            mediumturquoise: "#48d1cc",
            mediumvioletred: "#c71585",
            midnightblue: "#191970",
            mintcream: "#f5fffa",
            mistyrose: "#ffe4e1",
            moccasin: "#ffe4b5",
            navajowhite: "#ffdead",
            navy: "#000080",
            oldlace: "#fdf5e6",
            olive: "#808000",
            olivedrab: "#6b8e23",
            orange: "#ffa500",
            orangered: "#ff4500",
            orchid: "#da70d6",
            palegoldenrod: "#eee8aa",
            palegreen: "#98fb98",
            paleturquoise: "#afeeee",
            palevioletred: "#d87093",
            papayawhip: "#ffefd5",
            peachpuff: "#ffdab9",
            peru: "#cd853f",
            pink: "#ffc0cb",
            plum: "#dda0dd",
            powderblue: "#b0e0e6",
            purple: "#800080",
            red: "#ff0000",
            rosybrown: "#bc8f8f",
            royalblue: "#4169e1",
            saddlebrown: "#8b4513",
            salmon: "#fa8072",
            sandybrown: "#f4a460",
            seagreen: "#2e8b57",
            seashell: "#fff5ee",
            sienna: "#a0522d",
            silver: "#c0c0c0",
            skyblue: "#87ceeb",
            slateblue: "#6a5acd",
            slategray: "#708090",
            snow: "#fffafa",
            springgreen: "#00ff7f",
            steelblue: "#4682b4",
            tan: "#d2b48c",
            teal: "#008080",
            thistle: "#d8bfd8",
            tomato: "#ff6347",
            turquoise: "#40e0d0",
            violet: "#ee82ee",
            violetred: "#d02090",
            wheat: "#f5deb3",
            white: "#ffffff",
            whitesmoke: "#f5f5f5",
            yellow: "#ffff00",
            yellowgreen: "#9acd32"
        };
        return b.names = l
    });
    n(b, "Extensions/Boost/Boost.js", [b["Core/Globals.js"], b["Extensions/Boost/BoostUtils.js"],
        b["Extensions/Boost/BoostInit.js"], b["Core/Utilities.js"]], function (b, l, n, m) {
        m = m.error;
        l = l.hasWebGLSupport;
        l() ? n() : "undefined" !== typeof b.initCanvasBoost ? b.initCanvasBoost() : m(26)
    });
    n(b, "masters/modules/boost.src.js", [], function () {
    })
});
//# sourceMappingURL=boost.js.map
