/*!
 * Chart.js v4.4.1
 * https://www.chartjs.org
 * (c) 2024 Chart.js Contributors
 * Released under the MIT License
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Chart = factory());
})(this, (function () { 'use strict';

    function noop() { }
    function uid() {
        let id = 0;
        return function () {
            return id++;
        };
    }
    const isNullOrUndef = (v) => v === null || v === undefined;
    const isArray = Array.isArray;
    const isObject = (o) => o !== null && typeof o === 'object';
    const isNumber = (n) => typeof n === 'number' && !isNaN(n) && isFinite(n);
    const isNaN = Number.isNaN;
    const isFinite = Number.isFinite;
    const valueOrDefault = (v, d) => typeof v === 'undefined' ? d : v;
    const toPercentage = (v, d) => typeof v === 'string' && v.endsWith('%') ? parseFloat(v) / 100 : v;
    const toDimension = (v, d) => typeof v === 'string' && v.endsWith('%') ? parseFloat(v) / 100 : v;
    const callback = (fn, args, ctx) => {
        if (fn && typeof fn.call === 'function') {
            return fn.apply(ctx, args);
        }
    };
    const each = (array, fn, start = 0) => {
        const ilen = array.length;
        for (let i = start; i < ilen; i++) {
            fn(array[i], i, array);
        }
    };
    const _elements = new Map();
    const elements = {
        get: (type) => _elements.get(type),
        has: (type) => _elements.has(type),
        register: (type, element) => {
            if (_elements.has(type)) {
                console.error(`"${type}" already registered.`);
                return;
            }
            _elements.set(type, element);
        },
        unregister: (type) => {
            if (!_elements.has(type)) {
                console.error(`"${type}" is not registered.`);
                return;
            }
            _elements.delete(type);
        }
    };
    const _datasets = new Map();
    const datasets = {
        get: (type) => _datasets.get(type),
        has: (type) => _datasets.has(type),
        register: (type, dataset) => {
            if (_datasets.has(type)) {
                console.error(`"${type}" already registered.`);
                return;
            }
            _datasets.set(type, dataset);
        },
        unregister: (type) => {
            if (!_datasets.has(type)) {
                console.error(`"${type}" is not registered.`);
                return;
            }
            _datasets.delete(type);
        }
    };
    const _scales = new Map();
    const scales = {
        get: (type) => _scales.get(type),
        has: (type) => _scales.has(type),
        register: (type, scale) => {
            if (_scales.has(type)) {
                console.error(`"${type}" already registered.`);
                return;
            }
            _scales.set(type, scale);
        },
        unregister: (type) => {
            if (!_scales.has(type)) {
                console.error(`"${type}" is not registered.`);
                return;
            }
            _scales.delete(type);
        }
    };
    const _controllers = new Map();
    const controllers = {
        get: (type) => _controllers.get(type),
        has: (type) => _controllers.has(type),
        register: (type, controller) => {
            if (_controllers.has(type)) {
                console.error(`"${type}" already registered.`);
                return;
            }
            _controllers.set(type, controller);
        },
        unregister: (type) => {
            if (!_controllers.has(type)) {
                console.error(`"${type}" is not registered.`);
                return;
            }
            _controllers.delete(type);
        }
    };
    const _plugins = new Map();
    const plugins = {
        get: (id) => _plugins.get(id),
        has: (id) => _plugins.has(id),
        register: (id, plugin) => {
            if (_plugins.has(id)) {
                console.error(`"${id}" already registered.`);
                return;
            }
            _plugins.set(id, plugin);
        },
        unregister: (id) => {
            if (!_plugins.has(id)) {
                console.error(`"${id}" is not registered.`);
                return;
            }
            _plugins.delete(id);
        }
    };
    const registerables = [];
    function addIfNotExists(array, item) {
        if (array.indexOf(item) === -1) {
            array.push(item);
        }
    }
    function register(...items) {
        items.forEach((item) => {
            const reg = item.register;
            if (reg) {
                reg();
                return;
            }
            addIfNotExists(registerables, item);
        });
    }
    function unregister(...items) {
        items.forEach((item) => {
            const unreg = item.unregister;
            if (unreg) {
                unreg();
                return;
            }
            const idx = registerables.indexOf(item);
            if (idx !== -1) {
                registerables.splice(idx, 1);
            }
        });
    }
    class Animator {
        constructor() {
            this._request = null;
            this._charts = new Map();
            this._running = false;
        }
        _notify(chart, anims, date, type) {
            const callbacks = anims.listeners[type];
            if (callbacks && callbacks.length) {
                let i, ilen;
                for (i = 0, ilen = callbacks.length; i < ilen; ++i) {
                    callbacks[i](chart);
                }
            }
        }
        _refresh() {
            if (this._request) {
                return;
            }
            this._running = true;
            this._request = requestAnimationFrame(() => {
                this._update();
                this._request = null;
                if (this._running) {
                    this._refresh();
                }
            });
        }
        _update(date = Date.now()) {
            let remaining = 0;
            this._charts.forEach((anims, chart) => {
                if (!anims.running || !anims.items.length) {
                    return;
                }
                let items = anims.items;
                let i = 0;
                let item;
                while (i < items.length) {
                    item = items[i];
                    if (item._active) {
                        if (item._total > anims.duration) {
                            anims.duration = item._total;
                        }
                        item.tick(date);
                        i++;
                    } else {
                        items.splice(i, 1);
                    }
                }
                this._notify(chart, anims, date, 'progress');
                if (!items.length) {
                    anims.running = false;
                    this._notify(chart, anims, date, 'complete');
                    anims.duration = 0;
                }
                if (anims.running) {
                    remaining++;
                }
            });
            this._running = !!remaining;
        }
        _getAnims(chart) {
            const anims = this._charts.get(chart);
            if (!anims) {
                throw new Error('Chart not found');
            }
            return anims;
        }
        listen(chart, type, listener) {
            const anims = this._getAnims(chart);
            const listeners = anims.listeners[type];
            if (!listeners) {
                throw new Error(`Invalid event type: ${type}`);
            }
            listeners.push(listener);
        }
        add(chart, items) {
            const anims = this._getAnims(chart);
            anims.items.push(...items);
            this._refresh();
        }
        has(chart) {
            return this._charts.has(chart);
        }
        start(chart) {
            const anims = this._getAnims(chart);
            if (anims.running) {
                return;
            }
            anims.running = true;
            anims.duration = 0;
            this._refresh();
            this._notify(chart, anims, Date.now(), 'start');
        }
        running(chart) {
            if (!this.has(chart)) {
                return false;
            }
            return this._getAnims(chart).running;
        }
        stop(chart) {
            const anims = this._getAnims(chart);
            if (!anims.running) {
                return;
            }
            anims.running = false;
            this._notify(chart, anims, Date.now(), 'stop');
        }
        remove(chart) {
            return this._charts.delete(chart);
        }
        register(chart) {
            const anims = {
                running: false,
                items: [],
                listeners: {
                    start: [],
                    complete: [],
                    progress: [],
                    stop: []
                },
                duration: 0
            };
            this._charts.set(chart, anims);
        }
    }
    const animator = new Animator();
    function getRelativePosition$1(event, chart) {
        if ('native' in event) {
            return event;
        }
        const { canvas, currentDevicePixelRatio } = chart;
        const canvasRect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - canvasRect.left,
            y: event.clientY - canvasRect.top,
            canvas
        };
    }
    function evaluateAllVisibleItems(chart, handler) {
        const metasets = chart.getSortedVisibleDatasetMetas();
        for (let i = 0; i < metasets.length; i++) {
            const meta = metasets[i];
            const elements = meta.data || [];
            for (let j = 0; j < elements.length; j++) {
                const element = elements[j];
                if (!element.skip) {
                    handler(element, i, j);
                }
            }
        }
    }
    function distanceBetweenPoints(pt1, pt2) {
        return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
    }
    function _angleBetween(pt1, pt2, angle) {
        const deltaX = pt2.x - pt1.x;
        const deltaY = pt2.y - pt1.y;
        const angle1 = Math.atan2(deltaY, deltaX);
        const angle2 = angle1 + angle;
        const len = distanceBetweenPoints(pt1, pt2);
        return {
            x: pt1.x + Math.cos(angle2) * len,
            y: pt1.y + Math.sin(angle2) * len
        };
    }
    function _angleDiff(a, b) {
        return (a - b + Math.PI * 2) % (Math.PI * 2);
    }
    function _normalizeAngle(a) {
        return (a + Math.PI * 2) % (Math.PI * 2);
    }
    function _factorize(n) {
        const result = [];
        let i = 2;
        while (i * i <= n) {
            if (n % i) {
                i++;
            } else {
                n = Math.floor(n / i);
                result.push(i);
            }
        }
        if (n > 1) {
            result.push(n);
        }
        return result;
    }
    const PI = Math.PI;
    const TAU = 2 * PI;
    const PITAU = TAU + PI;
    const INFINITY = Number.POSITIVE_INFINITY;
    const RAD_PER_DEG = PI / 180;
    const HALF_PI = PI / 2;
    const QUARTER_PI = PI / 4;
    const TWO_THIRDS_PI = PI * 2 / 3;
    const log10 = Math.log10;
    const sign = Math.sign;
    function almostEquals(x, y, epsilon) {
        return Math.abs(x - y) < epsilon;
    }
    function niceNum(range, round) {
        const roundedRange = Math.abs(range);
        const exponent = Math.floor(log10(roundedRange));
        const fraction = roundedRange / Math.pow(10, exponent);
        let niceFraction;
        if (round) {
            if (fraction < 1.5) {
                niceFraction = 1;
            } else if (fraction < 3) {
                niceFraction = 2;
            } else if (fraction < 7) {
                niceFraction = 5;
            } else {
                niceFraction = 10;
            }
        } else if (fraction <= 1) {
            niceFraction = 1;
        } else if (fraction <= 2) {
            niceFraction = 2;
        } else if (fraction <= 5) {
            niceFraction = 5;
        } else {
            niceFraction = 10;
        }
        return niceFraction * Math.pow(10, exponent);
    }
    function toRadians(degrees) {
        return degrees * RAD_PER_DEG;
    }
    function toDegrees(radians) {
        return radians / RAD_PER_DEG;
    }
    function _decimalPlaces(x) {
        if (!isFinite(x)) {
            return 0;
        }
        let e = 1;
        let p = 0;
        while (Math.round(x * e) / e !== x) {
            e *= 10;
            p++;
        }
        return p;
    }
    function getAngleFromPoint(centrePoint, anglePoint) {
        const distanceFromXCenter = anglePoint.x - centrePoint.x;
        const distanceFromYCenter = anglePoint.y - centrePoint.y;
        const radialDistanceFromCenter = Math.sqrt(distanceFromXCenter * distanceFromXCenter + distanceFromYCenter * distanceFromYCenter);
        let angle = Math.atan2(distanceFromYCenter, distanceFromXCenter);
        if (angle < -0.5 * PI) {
            angle += TAU;
        }
        return {
            angle,
            distance: radialDistanceFromCenter
        };
    }
    function pointInLine(p1, p2, t, mode) {
        return {
            x: p1.x + (p2.x - p1.x) * t,
            y: p1.y + (p2.y - p1.y) * t
        };
    }
    function _limitValue(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    function _int16Range(n) {
        return n > 32767 ? 32767 : n < -32768 ? -32768 : n;
    }
    function _isDomSupported() {
        return typeof window !== 'undefined' && typeof document !== 'undefined';
    }
    function _isPointInArea(point, area, margin = 0) {
        const { x, y } = point;
        const { left, top, right, bottom } = area;
        return x >= left - margin && x <= right + margin && y >= top - margin && y <= bottom + margin;
    }
    function _readValueToProps(value, props) {
        if (isObject(value)) {
            return value;
        }
        const result = {};
        for (const prop of props) {
            result[prop] = value;
        }
        return result;
    }
    const atEdge = (t) => t === 0 || t === 1;
    const elasticIn = (t, s, p) => -(Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * TAU / p));
    const elasticOut = (t, s, p) => Math.pow(2, -10 * t) * Math.sin((t - s) * TAU / p) + 1;
    const effects = {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => -t * (t - 2),
        easeInOutQuad: t => (t /= 0.5) < 1 ? 0.5 * t * t : -0.5 * (--t * (t - 2) - 1),
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => (t /= 0.5) < 1 ? 0.5 * t * t * t : 0.5 * ((t -= 2) * t * t + 2),
        easeInQuart: t => t * t * t * t,
        easeOutQuart: t => -(--t) * t * t * t + 1,
        easeInOutQuart: t => (t /= 0.5) < 1 ? 0.5 * t * t * t * t : -0.5 * ((t -= 2) * t * t * t - 2),
        easeInQuint: t => t * t * t * t * t,
        easeOutQuint: t => (--t) * t * t * t * t + 1,
        easeInOutQuint: t => (t /= 0.5) < 1 ? 0.5 * t * t * t * t * t : 0.5 * ((t -= 2) * t * t * t * t + 2),
        easeInSine: t => -Math.cos(t * HALF_PI) + 1,
        easeOutSine: t => Math.sin(t * HALF_PI),
        easeInOutSine: t => -0.5 * (Math.cos(PI * t) - 1),
        easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
        easeOutExpo: t => t === 1 ? 1 : -Math.pow(2, -10 * t) + 1,
        easeInOutExpo: t => t === 0 || t === 1 ? t : (t /= 0.5) < 1 ? 0.5 * Math.pow(2, 10 * (t - 1)) : 0.5 * (-Math.pow(2, -10 * --t) + 2),
        easeInCirc: t => t >= 1 ? t : -(Math.sqrt(1 - t * t) - 1),
        easeOutCirc: t => Math.sqrt(1 - (--t) * t),
        easeInOutCirc: t => (t /= 0.5) < 1 ? -0.5 * (Math.sqrt(1 - t * t) - 1) : 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1),
        easeInElastic: t => atEdge(t) ? t : elasticIn(t, 0.075, 0.3),
        easeOutElastic: t => atEdge(t) ? t : elasticOut(t, 0.075, 0.3),
        easeInOutElastic(t) {
            const s = 0.1125;
            const p = 0.45;
            return atEdge(t) ? t : t < 0.5 ? 0.5 * elasticIn(t * 2, s, p) : 0.5 + 0.5 * elasticOut(t * 2 - 1, s, p);
        },
        easeInBack(t) {
            const s = 1.70158;
            return t * t * ((s + 1) * t - s);
        },
        easeOutBack(t) {
            const s = 1.70158;
            return (--t) * t * ((s + 1) * t + s) + 1;
        },
        easeInOutBack(t) {
            let s = 1.70158;
            if ((t /= 0.5) < 1) {
                return 0.5 * (t * t * (((s *= 1.525) + 1) * t - s));
            }
            return 0.5 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2);
        },
        easeInBounce: t => 1 - effects.easeOutBounce(1 - t),
        easeOutBounce(t) {
            const m = 7.5625;
            const d = 2.75;
            if (t < 1 / d) {
                return m * t * t;
            }
            if (t < 2 / d) {
                return m * (t -= 1.5 / d) * t + 0.75;
            }
            if (t < 2.5 / d) {
                return m * (t -= 2.25 / d) * t + 0.9375;
            }
            return m * (t -= 2.625 / d) * t + 0.984375;
        },
        easeInOutBounce: t => t < 0.5 ? effects.easeInBounce(t * 2) * 0.5 : effects.easeOutBounce(t * 2 - 1) * 0.5 + 0.5,
    };
    const numbers = {
        easing: effects,
    };
    const color = (function () {
        const { floor, random, round, sin, PI } = Math;
        const hexRegex = /^#[a-fA-F0-9]{6}$/;
        const hex3Regex = /^#[a-fA-F0-9]{3}$/;
        const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
        const rgbaRegex = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([01]?\.?\d*)\)$/;
        const hslRegex = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/;
        const hslaRegex = /^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*([01]?\.?\d*)\)$/;
        const namedColors = {
            aliceblue: '#f0f8ff',
            antiquewhite: '#faebd7',
            aqua: '#00ffff',
            aquamarine: '#7fffd4',
            azure: '#f0ffff',
            beige: '#f5f5dc',
            bisque: '#ffe4c4',
            black: '#000000',
            blanchedalmond: '#ffebcd',
            blue: '#0000ff',
            blueviolet: '#8a2be2',
            brown: '#a52a2a',
            burlywood: '#deb887',
            cadetblue: '#5f9ea0',
            chartreuse: '#7fff00',
            chocolate: '#d2691e',
            coral: '#ff7f50',
            cornflowerblue: '#6495ed',
            cornsilk: '#fff8dc',
            crimson: '#dc143c',
            cyan: '#00ffff',
            darkblue: '#00008b',
            darkcyan: '#008b8b',
            darkgoldenrod: '#b8860b',
            darkgray: '#a9a9a9',
            darkgreen: '#006400',
            darkgrey: '#a9a9a9',
            darkkhaki: '#bdb76b',
            darkmagenta: '#8b008b',
            darkolivegreen: '#556b2f',
            darkorange: '#ff8c00',
            darkorchid: '#9932cc',
            darkred: '#8b0000',
            darksalmon: '#e9967a',
            darkseagreen: '#8fbc8f',
            darkslateblue: '#483d8b',
            darkslategray: '#2f4f4f',
            darkslategrey: '#2f4f4f',
            darkturquoise: '#00ced1',
            darkviolet: '#9400d3',
            deeppink: '#ff1493',
            deepskyblue: '#00bfff',
            dimgray: '#696969',
            dimgrey: '#696969',
            dodgerblue: '#1e90ff',
            firebrick: '#b22222',
            floralwhite: '#fffaf0',
            forestgreen: '#228b22',
            fuchsia: '#ff00ff',
            gainsboro: '#dcdcdc',
            ghostwhite: '#f8f8ff',
            gold: '#ffd700',
            goldenrod: '#daa520',
            gray: '#808080',
            green: '#008000',
            greenyellow: '#adff2f',
            grey: '#808080',
            honeydew: '#f0fff0',
            hotpink: '#ff69b4',
            indianred: '#cd5c5c',
            indigo: '#4b0082',
            ivory: '#fffff0',
            khaki: '#f0e68c',
            lavender: '#e6e6fa',
            lavenderblush: '#fff0f5',
            lawngreen: '#7cfc00',
            lemonchiffon: '#fffacd',
            lightblue: '#add8e6',
            lightcoral: '#f08080',
            lightcyan: '#e0ffff',
            lightgoldenrodyellow: '#fafad2',
            lightgray: '#d3d3d3',
            lightgreen: '#90ee90',
            lightgrey: '#d3d3d3',
            lightpink: '#ffb6c1',
            lightsalmon: '#ffa07a',
            lightseagreen: '#20b2aa',
            lightskyblue: '#87cefa',
            lightslategray: '#778899',
            lightslategrey: '#778899',
            lightsteelblue: '#b0c4de',
            lightyellow: '#ffffe0',
            lime: '#00ff00',
            limegreen: '#32cd32',
            linen: '#faf0e6',
            magenta: '#ff00ff',
            maroon: '#800000',
            mediumaquamarine: '#66cdaa',
            mediumblue: '#0000cd',
            mediumorchid: '#ba55d3',
            mediumpurple: '#9370db',
            mediumseagreen: '#3cb371',
            mediumslateblue: '#7b68ee',
            mediumspringgreen: '#00fa9a',
            mediumturquoise: '#48d1cc',
            mediumvioletred: '#c71585',
            midnightblue: '#191970',
            mintcream: '#f5fffa',
            mistyrose: '#ffe4e1',
            moccasin: '#ffe4b4',
            navajowhite: '#ffdead',
            navy: '#000080',
            oldlace: '#fdf5e6',
            olive: '#808000',
            olivedrab: '#6b8e23',
            orange: '#ffa500',
            orangered: '#ff4500',
            orchid: '#da70d6',
            palegoldenrod: '#eee8aa',
            palegreen: '#98fb98',
            paleturquoise: '#afeeee',
            palevioletred: '#db7093',
            papayawhip: '#ffefd5',
            peachpuff: '#ffdab9',
            peru: '#cd853f',
            pink: '#ffc0cb',
            plum: '#dda0dd',
            powderblue: '#b0e0e6',
            purple: '#800080',
            rebeccapurple: '#663399',
            red: '#ff0000',
            rosybrown: '#bc8f8f',
            royalblue: '#4169e1',
            saddlebrown: '#8b4513',
            salmon: '#fa8072',
            sandybrown: '#f4a460',
            seagreen: '#2e8b57',
            seashell: '#fff5ee',
            sienna: '#a0522d',
            silver: '#c0c0c0',
            skyblue: '#87ceeb',
            slateblue: '#6a5acd',
            slategray: '#708090',
            slategrey: '#708090',
            snow: '#fffafa',
            springgreen: '#00ff7f',
            steelblue: '#4682b4',
            tan: '#d2b48c',
            teal: '#008080',
            thistle: '#d8bfd8',
            tomato: '#ff6347',
            turquoise: '#40e0d0',
            violet: '#ee82ee',
            wheat: '#f5deb3',
            white: '#ffffff',
            whitesmoke: '#f5f5f5',
            yellow: '#ffff00',
            yellowgreen: '#9acd32',
            transparent: '#00000000'
        };
        function isPatternOrGradient(value) {
            return value && (value instanceof CanvasGradient || value instanceof CanvasPattern);
        }
        function isColor(value) {
            return typeof value === 'string' && (namedColors[value] || hexRegex.test(value) || hex3Regex.test(value) || rgbRegex.test(value) || rgbaRegex.test(value) || hslRegex.test(value) || hslaRegex.test(value));
        }
        function getRgba(value) {
            let rgba = parseNamedColor(value);
            if (rgba) {
                return rgba;
            }
            rgba = parseHex(value);
            if (rgba) {
                return rgba;
            }
            rgba = parseRgb(value);
            if (rgba) {
                return rgba;
            }
            rgba = parseHsl(value);
            if (rgba) {
                return rgba;
            }
            return [0, 0, 0, 1];
        }
        function parseNamedColor(value) {
            const named = namedColors[value.toLowerCase()];
            if (named) {
                return parseHex(named);
            }
            return null;
        }
        function parseHex(value) {
            let result = hexRegex.exec(value);
            if (result) {
                const hex = result[0];
                return [
                    parseInt(hex.substr(1, 2), 16),
                    parseInt(hex.substr(3, 2), 16),
                    parseInt(hex.substr(5, 2), 16),
                    1
                ];
            }
            result = hex3Regex.exec(value);
            if (result) {
                const hex = result[0];
                return [
                    parseInt(hex[1] + hex[1], 16),
                    parseInt(hex[2] + hex[2], 16),
                    parseInt(hex[3] + hex[3], 16),
                    1
                ];
            }
            return null;
        }
        function parseRgb(value) {
            let result = rgbRegex.exec(value);
            if (result) {
                return [
                    parseInt(result[1], 10),
                    parseInt(result[2], 10),
                    parseInt(result[3], 10),
                    1
                ];
            }
            result = rgbaRegex.exec(value);
            if (result) {
                return [
                    parseInt(result[1], 10),
                    parseInt(result[2], 10),
                    parseInt(result[3], 10),
                    parseFloat(result[4])
                ];
            }
            return null;
        }
        function parseHsl(value) {
            let result = hslRegex.exec(value);
            if (result) {
                const h = parseInt(result[1], 10) / 360;
                const s = parseInt(result[2], 10) / 100;
                const l = parseInt(result[3], 10) / 100;
                const rgba = hslToRgb(h, s, l);
                rgba[3] = 1;
                return rgba;
            }
            result = hslaRegex.exec(value);
            if (result) {
                const h = parseInt(result[1], 10) / 360;
                const s = parseInt(result[2], 10) / 100;
                const l = parseInt(result[3], 10) / 100;
                const rgba = hslToRgb(h, s, l);
                rgba[3] = parseFloat(result[4]);
                return rgba;
            }
            return null;
        }
        function hslToRgb(h, s, l) {
            let r, g, b;
            if (s === 0) {
                r = g = b = l;
            } else {
                const hue2rgb = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return p + (q - p) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1 / 3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1 / 3);
            }
            return [round(r * 255), round(g * 255), round(b * 255)];
        }
        function rgbToHsl(r, g, b) {
            r /= 255;
            g /= 255;
            b /= 255;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s;
            const l = (max + min) / 2;
            if (max === min) {
                h = s = 0;
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            return [h * 360, s * 100, l * 100];
        }
        function rgbaToString(rgba) {
            const [r, g, b, a] = rgba;
            return `rgba(${r},${g},${b},${a})`;
        }
        function interpolate(start, end, factor, easing = effects.linear) {
            const ease = easing(factor);
            const rgba = [];
            for (let i = 0; i < 4; i++) {
                rgba[i] = round(start[i] + (end[i] - start[i]) * ease);
            }
            return rgba;
        }
        function randomColor() {
            return `#${floor(random() * 16777215).toString(16).padStart(6, '0')}`;
        }
        function generateRandomColors(count) {
            const colors = [];
            const hueStep = 360 / count;
            for (let i = 0; i < count; i++) {
                const hue = i * hueStep;
                const rgb = hslToRgb(hue / 360, 0.7, 0.6);
                colors.push(rgbaToString([rgb[0], rgb[1], rgb[2], 1]));
            }
            return colors;
        }
        return {
            isPatternOrGradient,
            isColor,
            getRgba,
            rgbaToString,
            interpolate,
            random: randomColor,
            generate: generateRandomColors
        };
    })();
    const defaults = {
        color: {
            default: 'rgba(0,0,0,0.1)'
        },
        elements: {},
        events: [
            'mousemove',
            'mouseout',
            'click',
            'touchstart',
            'touchmove'
        ],
        font: {
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            size: 12,
            style: 'normal',
            weight: null,
            lineHeight: 1.2
        },
        hover: {
            onHover: null,
            mode: 'nearest',
            intersect: true,
            axis: 'x'
        },
        interaction: {
            mode: 'nearest',
            intersect: true,
            includeInvisible: false
        },
        maintainAspectRatio: true,
        onClick: null,
        onHover: null,
        plugins: {},
        responsive: true,
        scale: {
            display: true
        },
        scales: {},
        showLine: true,
        drawBorder: true,
        spanGaps: false,
        animation: {
            duration: 1000,
            easing: 'easeOutQuart',
            onProgress: noop,
            onComplete: noop
        }
    };
    class Animations {
        constructor(config) {
            this._config = config || {};
            this._config.animation = this._config.animation || defaults.animation;
        }
        configure(config) {
            this._config = config || {};
        }
        animate(target, prop, from, to, options) {
            if (!options || !options.duration) {
                target[prop] = to;
                return null;
            }
            const animation = {
                _active: true,
                _fn: () => {
                    target[prop] = to;
                },
                _easing: options.easing || this._config.animation.easing,
                _start: Date.now(),
                _total: options.duration,
                _loop: options.loop || false,
                _target: target,
                _prop: prop,
                _from: from,
                _to: to
            };
            animator.add(this._config, [animation]);
            return animation;
        }
        cancel(animation) {
            animator.remove(this._config);
        }
    }
    function getCanvas(item) {
        if (typeof item === 'string') {
            item = document.getElementById(item);
        } else if (item.length) {
            item = item[0];
        }
        if (item && item.canvas) {
            item = item.canvas;
        }
        return item;
    }
    function getContext(canvas, contextType) {
        if (contextType === '2d') {
            return canvas.getContext('2d');
        }
        throw new Error(`Unsupported context type: ${contextType}`);
    }
    function getMaxWidth(scale) {
        const ticks = scale.ticks;
        const tickFont = scale.options.ticks.font;
        let maxWidth = 0;
        for (let i = 0; i < ticks.length; i++) {
            const tick = ticks[i];
            const width = tick.label ? measureText(tick.label, tickFont).width : 0;
            if (width > maxWidth) {
                maxWidth = width;
            }
        }
        return maxWidth;
    }
    function getMaxHeight(scale) {
        const ticks = scale.ticks;
        const tickFont = scale.options.ticks.font;
        let maxHeight = 0;
        for (let i = 0; i < ticks.length; i++) {
            const tick = ticks[i];
            const height = tick.label ? measureText(tick.label, tickFont).height : 0;
            if (height > maxHeight) {
                maxHeight = height;
            }
        }
        return maxHeight;
    }
    function measureText(text, font) {
        const context = document.createElement('canvas').getContext('2d');
        context.font = font.string;
        const metrics = context.measureText(text);
        return {
            width: metrics.width,
            height: parseInt(font.size, 10) * font.lineHeight
        };
    }
    const rendering = {
        getCanvas,
        getContext,
        getMaxWidth,
        getMaxHeight,
        measureText
    };
    const helpers = {
        noop,
        uid: uid(),
        isNullOrUndef,
        isArray,
        isObject,
        isNumber,
        isNaN,
        isFinite,
        valueOrDefault,
        toPercentage,
        toDimension,
        callback,
        each,
        elements,
        datasets,
        scales,
        controllers,
        plugins,
        registerables,
        register,
        unregister,
        animator,
        getRelativePosition: getRelativePosition$1,
        evaluateAllVisibleItems,
        distanceBetweenPoints,
        _angleBetween,
        _angleDiff,
        _normalizeAngle,
        _factorize,
        PI,
        TAU,
        PITAU,
        INFINITY,
        RAD_PER_DEG,
        HALF_PI,
        QUARTER_PI,
        TWO_THIRDS_PI,
        log10,
        sign,
        almostEquals,
        niceNum,
        toRadians,
        toDegrees,
        _decimalPlaces,
        getAngleFromPoint,
        pointInLine,
        _limitValue,
        _int16Range,
        _isDomSupported,
        _isPointInArea,
        _readValueToProps,
        numbers,
        color,
        defaults,
        Animations,
        rendering
    };
    return helpers;
}));