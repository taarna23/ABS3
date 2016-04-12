/*:
 * @plugindesc v1.07 Support methods and javascript extensions.
 * @author Gilgamar
 * @license MIT
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 * Support methods and javascript extensions.
 *
 * ============================================================================
 * Changelog
 * ============================================================================
 * Version 1.07:
 * - GIL.prototype.makePrototype()
 * - GIL.prototype.protoChain()
 * - GIL.prototype.makeChain()
 * - GIL.prototype.extend()
 *
 * Version 1.06:
 * - GIL object -> Gilgamar class
 * - GIL functions -> Gilgamar prototype methods
 * - var GIL = new Gilgamar()
 * - Gilgamar.prototype.configure()
 * - Gilgamar.prototype.makeAlias()
 *
 * Version 1.05:
 * - GIL.prettyJSON()
 *
 * Version 1.04:
 * - GIL.callCommonEvent()
 * - GIL.reverseLUT()
 * - GIL.fileExists()
 * - GIL.makeCommandList()
 *
 * Version 1.03:
 * - GIL.parse()
 * - GIL.paramify()
 * - GIL.alias()
 * - GIL.aliasCall()
 * - String.prototype.pad()
 * - String.prototype.padSpaces()
 *
 * Version 1.02:
 * - Array.prototype.unique()
 * - Array.prototype.contains()
 * - Number.prototype.clamp()
 * - Number.isInteger()
 *
 * Version 1.00:
 * - Array.prototype.shuffle()
 * - Array.prototype.exclude()
 * - Number.prototype.between()
 * - Game_Map.prototype.eventsName()
 *
 */

var Imported = Imported || {};

//-----------------------------------------------------------------------------
// GIL
//
// The class for managing Gilgamar scripts.

function Gilgamar() {
    this.initialize.apply(this, arguments);
}

Gilgamar.prototype.initialize = function() {
    this.Param = {};
};

//=============================================================================
// Configure
//=============================================================================
Gilgamar.prototype.configure = function(name) {
    this[name] = this[name] || {};
    var script = 'GIL_' + name;
    var object = this[name];

    Imported[script] = true;
    this.paramify(name);
    this.makeAlias(object);
};

//=============================================================================
// Parameters
//=============================================================================
Gilgamar.prototype.parse = function(key, value) {
    var val = value.toLowerCase();
    if (val === 'true')                 return true;
    if (val === 'false')                return false;
    if (value !== '' && !isNaN(value))  return Number(value);
    return value;
};

Gilgamar.prototype.paramify = function(name) {
    var parameters = PluginManager.parameters('GIL_' + name);
    for (var key in parameters) {
        var param = parameters[key];
        var new_key = name + '_' + String(key).replace(/\s/g, '');
        this.Param[new_key] = this.parse(new_key, param);
    }
};

//=============================================================================
// Alias
//=============================================================================
Gilgamar.prototype.makeAlias = function(obj) {
    obj._callbacks = {};
    obj.alias      = this.alias.bind(obj);
    obj.aliasCall  = this.aliasCall.bind(obj);
};

Gilgamar.prototype.alias = function(strCallback) {
    var callback = eval(strCallback);   // jshint ignore:line
    // console.log(strCallback, '=', callback, '\n\n');
    this._callbacks[strCallback] = callback;
};

Gilgamar.prototype.aliasCall = function(strCallback, scope, args) {
    var callback = this._callbacks[strCallback];
    try {
        return callback.apply(scope, args);
    } catch (e) {
        console.error(e.stack);
        return false;
    }
};

//=============================================================================
// Prototypes
//=============================================================================
Gilgamar.prototype.makePrototype = function(prototypes) {
    var chains = [];
    while (prototypes.length) {
        var chain = this.protoChain(prototypes.shift());
        chains = chains.concat(chain);
    }
    return this.makeChain(chains);
};

Gilgamar.prototype.protoChain = function(next) {
    var chain = [];
    while (next !== Object.prototype) {
        chain.push(next);
        next = Object.getPrototypeOf(next);
    }
    return chain;
};

Gilgamar.prototype.makeChain = function(chains) {
    var c = Object.prototype;
    while (chains.length) {
        c = Object.create(c);
        this.extend(c, chains.pop());
    }
    return c;
};

Gilgamar.prototype.extend = function(target, source) {
    Object.getOwnPropertyNames(source).forEach(function(prop) {
        Object.defineProperty(
            target, prop,
            Object.getOwnPropertyDescriptor(source, prop)
        );
    });
    return target;
};

//=============================================================================
// Common
//=============================================================================
Gilgamar.prototype.prettyJSON = function(obj) {
    console.log(JSON.stringify(obj, null, "    "));
};

Gilgamar.prototype.callCommonEvent = function(id) {
    var interpreter = new Game_Interpreter();
    var list = this.makeCommandList(117, [id]);
    interpreter.setup(list, this._eventId);
    interpreter.update();
};

Gilgamar.prototype.reverseLUT = function(list, prop) {
    var lut = {};
    var length = list.length;
    for (var i = 0; i < length; i++) {
        var item = list[i];
        var key = item[prop];
        lut[key] = i;
    }
    return lut;
};

Gilgamar.prototype.fileExists = function(folder, filename, ext) {
    var tail = folder + encodeURIComponent(filename) + ext;
    var root = window.location.pathname.replace(/(\/www|)\/[^\/]*$/, '/');
    var path = root + tail;
    if (path.match(/^\/([A-Z]\:)/))     path = path.slice(1);
    path = decodeURIComponent(path);
    var fs = require('fs');
    return !!fs.existsSync(path);
};

Gilgamar.prototype.makeCommandList = function(command, params, list) {
    list = list || [];
    list.push({code: command, indent: null, parameters: params});
    return list;
};

var GIL = new Gilgamar();
//=============================================================================
// Configure script
//=============================================================================
GIL.configure('Core');

//=============================================================================
// JavaScript Extensions
//=============================================================================
Array.prototype.unique = function() {
    var seen = {};
    var out = [];
    var len = this.length;
    var j = 0;
    for(var i = 0; i < len; i++) {
         var item = this[i];
         if(seen[item] !== 1) {
               seen[item] = 1;
               out[j++] = item;
         }
    }
    return out;
};

Array.prototype.shuffle = function() {
    var k, t, len;
    len = this.length;
    if (len < 2) return this;
    while (len) {
        k = Math.floor(Math.random() * len--);
        t = this[k];
        while (k < len) { this[k] = this[++k]; }
        this[k] = t;
    }
    return this;
};

Array.prototype.exclude = function(item) {
    var k = 0;
    var len = this.length;
    if (len < 2) return this;
    while (len) {
        var value = this[k++];
        if (value === item) this.splice(--k, 1);
        len--;
    }
    return this;
};

Array.prototype.contains = function(element) {
    return this.indexOf(element) >= 0;
};

String.prototype.padSpaces = function(length, padLeft) {
    var pad = new Array(length + 1).join(' ');
    return this.pad(pad, padLeft);
};

String.prototype.pad = function(pad, padLeft) {
  if (typeof this === 'undefined') return pad;
  if (padLeft)                     return (pad + this).slice(-pad.length);
  else                             return (this + pad).substring(0, pad.length);
};

Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
};

Number.prototype.between = function(a, b) {
    var min = Math.min.apply(Math, [a, b]),
        max = Math.max.apply(Math, [a, b]);
    return this >= min && this < max;
};

Number.isInteger = Number.isInteger || function(value) {
    return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
};

//=============================================================================
// Game_Map
//=============================================================================
Game_Map.prototype.eventsName = function(name) {
    return this.events().filter(function(event) {
        if ($dataMap.events[event._eventId].name === name) return event;
    });
};

//=============================================================================
// SceneManager
//=============================================================================
// GIL.Core.alias('SceneManager.onError');
// SceneManager.onError = function(e) {
//     GIL.Core.aliasCall('SceneManager.onError', this, [e]);
//     console.log(window);
// };

//=============================================================================
// Game_Interpreter
//=============================================================================
// Script
Game_Interpreter.prototype.command355 = function() {
    var script = this.currentCommand().parameters[0] + '\n';
    while (this.nextEventCode() === 655) {
        this._index++;
        script += this.currentCommand().parameters[0] + '\n';
    }
    try {
        eval(script); // jshint ignore: line
    } catch (e) {
        SceneManager.catchException(e);
    }

    return true;
};
