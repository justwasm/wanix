var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x2) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x2, {
  get: (a, b2) => (typeof require !== "undefined" ? require : a)[b2]
}) : x2)(function(x2) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x2 + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target3, all) => {
  for (var name in all)
    __defProp(target3, name, { get: all[name], enumerable: true });
};
var __copyProps = (to2, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to2, key) && key !== except)
        __defProp(to2, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to2;
};
var __toESM = (mod, isNodeMode, target3) => (target3 = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target3, "default", { value: mod, enumerable: true }) : target3,
  mod
));

// node_modules/ws/browser.js
var require_browser = __commonJS({
  "node_modules/ws/browser.js"(exports, module) {
    "use strict";
    module.exports = function() {
      throw new Error(
        "ws does not work in the browser. Browser clients must use the native WebSocket object"
      );
    };
  }
});

// node_modules/cbor-x/decode.js
var decoder;
try {
  decoder = new TextDecoder();
} catch (error) {
}
var src;
var srcEnd;
var position = 0;
var EMPTY_ARRAY = [];
var LEGACY_RECORD_INLINE_ID = 105;
var RECORD_DEFINITIONS_ID = 57342;
var RECORD_INLINE_ID = 57343;
var BUNDLED_STRINGS_ID = 57337;
var PACKED_REFERENCE_TAG_ID = 6;
var STOP_CODE = {};
var maxArraySize = 11281e4;
var maxMapSize = 1681e4;
var strings = EMPTY_ARRAY;
var stringPosition = 0;
var currentDecoder = {};
var currentStructures;
var srcString;
var srcStringStart = 0;
var srcStringEnd = 0;
var bundledStrings;
var referenceMap;
var currentExtensions = [];
var currentExtensionRanges = [];
var packedValues;
var dataView;
var restoreMapsAsObject;
var defaultOptions = {
  useRecords: false,
  mapsAsObjects: true
};
var sequentialMode = false;
var inlineObjectReadThreshold = 2;
try {
  new Function("");
} catch (error) {
  inlineObjectReadThreshold = Infinity;
}
var Decoder = class _Decoder {
  constructor(options) {
    if (options) {
      if ((options.keyMap || options._keyMap) && !options.useRecords) {
        options.useRecords = false;
        options.mapsAsObjects = true;
      }
      if (options.useRecords === false && options.mapsAsObjects === void 0)
        options.mapsAsObjects = true;
      if (options.getStructures)
        options.getShared = options.getStructures;
      if (options.getShared && !options.structures)
        (options.structures = []).uninitialized = true;
      if (options.keyMap) {
        this.mapKey = /* @__PURE__ */ new Map();
        for (let [k3, v] of Object.entries(options.keyMap)) this.mapKey.set(v, k3);
      }
    }
    Object.assign(this, options);
  }
  /*
  decodeKey(key) {
  	return this.keyMap
  		? Object.keys(this.keyMap)[Object.values(this.keyMap).indexOf(key)] || key
  		: key
  }
  */
  decodeKey(key) {
    return this.keyMap ? this.mapKey.get(key) || key : key;
  }
  encodeKey(key) {
    return this.keyMap && this.keyMap.hasOwnProperty(key) ? this.keyMap[key] : key;
  }
  encodeKeys(rec) {
    if (!this._keyMap) return rec;
    let map = /* @__PURE__ */ new Map();
    for (let [k3, v] of Object.entries(rec)) map.set(this._keyMap.hasOwnProperty(k3) ? this._keyMap[k3] : k3, v);
    return map;
  }
  decodeKeys(map) {
    if (!this._keyMap || map.constructor.name != "Map") return map;
    if (!this._mapKey) {
      this._mapKey = /* @__PURE__ */ new Map();
      for (let [k3, v] of Object.entries(this._keyMap)) this._mapKey.set(v, k3);
    }
    let res = {};
    map.forEach((v, k3) => res[safeKey(this._mapKey.has(k3) ? this._mapKey.get(k3) : k3)] = v);
    return res;
  }
  mapDecode(source, end) {
    let res = this.decode(source);
    if (this._keyMap) {
      switch (res.constructor.name) {
        case "Array":
          return res.map((r) => this.decodeKeys(r));
      }
    }
    return res;
  }
  decode(source, end) {
    if (src) {
      return saveState(() => {
        clearSource();
        return this ? this.decode(source, end) : _Decoder.prototype.decode.call(defaultOptions, source, end);
      });
    }
    srcEnd = end > -1 ? end : source.length;
    position = 0;
    stringPosition = 0;
    srcStringEnd = 0;
    srcString = null;
    strings = EMPTY_ARRAY;
    bundledStrings = null;
    src = source;
    try {
      dataView = source.dataView || (source.dataView = new DataView(source.buffer, source.byteOffset, source.byteLength));
    } catch (error) {
      src = null;
      if (source instanceof Uint8Array)
        throw error;
      throw new Error("Source must be a Uint8Array or Buffer but was a " + (source && typeof source == "object" ? source.constructor.name : typeof source));
    }
    if (this instanceof _Decoder) {
      currentDecoder = this;
      packedValues = this.sharedValues && (this.pack ? new Array(this.maxPrivatePackedValues || 16).concat(this.sharedValues) : this.sharedValues);
      if (this.structures) {
        currentStructures = this.structures;
        return checkedRead();
      } else if (!currentStructures || currentStructures.length > 0) {
        currentStructures = [];
      }
    } else {
      currentDecoder = defaultOptions;
      if (!currentStructures || currentStructures.length > 0)
        currentStructures = [];
      packedValues = null;
    }
    return checkedRead();
  }
  decodeMultiple(source, forEach) {
    let values, lastPosition = 0;
    try {
      let size = source.length;
      sequentialMode = true;
      let value = this ? this.decode(source, size) : defaultDecoder.decode(source, size);
      if (forEach) {
        if (forEach(value) === false) {
          return;
        }
        while (position < size) {
          lastPosition = position;
          if (forEach(checkedRead()) === false) {
            return;
          }
        }
      } else {
        values = [value];
        while (position < size) {
          lastPosition = position;
          values.push(checkedRead());
        }
        return values;
      }
    } catch (error) {
      error.lastPosition = lastPosition;
      error.values = values;
      throw error;
    } finally {
      sequentialMode = false;
      clearSource();
    }
  }
};
function checkedRead() {
  try {
    let result = read();
    if (bundledStrings) {
      if (position >= bundledStrings.postBundlePosition) {
        let error = new Error("Unexpected bundle position");
        error.incomplete = true;
        throw error;
      }
      position = bundledStrings.postBundlePosition;
      bundledStrings = null;
    }
    if (position == srcEnd) {
      currentStructures = null;
      src = null;
      if (referenceMap)
        referenceMap = null;
    } else if (position > srcEnd) {
      let error = new Error("Unexpected end of CBOR data");
      error.incomplete = true;
      throw error;
    } else if (!sequentialMode) {
      throw new Error("Data read, but end of buffer not reached");
    }
    return result;
  } catch (error) {
    clearSource();
    if (error instanceof RangeError || error.message.startsWith("Unexpected end of buffer")) {
      error.incomplete = true;
    }
    throw error;
  }
}
function read() {
  let token = src[position++];
  let majorType = token >> 5;
  token = token & 31;
  if (token > 23) {
    switch (token) {
      case 24:
        token = src[position++];
        break;
      case 25:
        if (majorType == 7) {
          return getFloat16();
        }
        token = dataView.getUint16(position);
        position += 2;
        break;
      case 26:
        if (majorType == 7) {
          let value = dataView.getFloat32(position);
          if (currentDecoder.useFloat32 > 2) {
            let multiplier = mult10[(src[position] & 127) << 1 | src[position + 1] >> 7];
            position += 4;
            return (multiplier * value + (value > 0 ? 0.5 : -0.5) >> 0) / multiplier;
          }
          position += 4;
          return value;
        }
        token = dataView.getUint32(position);
        position += 4;
        break;
      case 27:
        if (majorType == 7) {
          let value = dataView.getFloat64(position);
          position += 8;
          return value;
        }
        if (majorType > 1) {
          if (dataView.getUint32(position) > 0)
            throw new Error("JavaScript does not support arrays, maps, or strings with length over 4294967295");
          token = dataView.getUint32(position + 4);
        } else if (currentDecoder.int64AsNumber) {
          token = dataView.getUint32(position) * 4294967296;
          token += dataView.getUint32(position + 4);
        } else
          token = dataView.getBigUint64(position);
        position += 8;
        break;
      case 31:
        switch (majorType) {
          case 2:
          // byte string
          case 3:
            throw new Error("Indefinite length not supported for byte or text strings");
          case 4:
            let array = [];
            let value, i = 0;
            while ((value = read()) != STOP_CODE) {
              if (i >= maxArraySize) throw new Error(`Array length exceeds ${maxArraySize}`);
              array[i++] = value;
            }
            return majorType == 4 ? array : majorType == 3 ? array.join("") : Buffer.concat(array);
          case 5:
            let key;
            if (currentDecoder.mapsAsObjects) {
              let object = {};
              let i2 = 0;
              if (currentDecoder.keyMap) {
                while ((key = read()) != STOP_CODE) {
                  if (i2++ >= maxMapSize) throw new Error(`Property count exceeds ${maxMapSize}`);
                  object[safeKey(currentDecoder.decodeKey(key))] = read();
                }
              } else {
                while ((key = read()) != STOP_CODE) {
                  if (i2++ >= maxMapSize) throw new Error(`Property count exceeds ${maxMapSize}`);
                  object[safeKey(key)] = read();
                }
              }
              return object;
            } else {
              if (restoreMapsAsObject) {
                currentDecoder.mapsAsObjects = true;
                restoreMapsAsObject = false;
              }
              let map = /* @__PURE__ */ new Map();
              if (currentDecoder.keyMap) {
                let i2 = 0;
                while ((key = read()) != STOP_CODE) {
                  if (i2++ >= maxMapSize) {
                    throw new Error(`Map size exceeds ${maxMapSize}`);
                  }
                  map.set(currentDecoder.decodeKey(key), read());
                }
              } else {
                let i2 = 0;
                while ((key = read()) != STOP_CODE) {
                  if (i2++ >= maxMapSize) {
                    throw new Error(`Map size exceeds ${maxMapSize}`);
                  }
                  map.set(key, read());
                }
              }
              return map;
            }
          case 7:
            return STOP_CODE;
          default:
            throw new Error("Invalid major type for indefinite length " + majorType);
        }
      default:
        throw new Error("Unknown token " + token);
    }
  }
  switch (majorType) {
    case 0:
      return token;
    case 1:
      return ~token;
    case 2:
      return readBin(token);
    case 3:
      if (srcStringEnd >= position) {
        return srcString.slice(position - srcStringStart, (position += token) - srcStringStart);
      }
      if (srcStringEnd == 0 && srcEnd < 140 && token < 32) {
        let string = token < 16 ? shortStringInJS(token) : longStringInJS(token);
        if (string != null)
          return string;
      }
      return readFixedString(token);
    case 4:
      if (token >= maxArraySize) throw new Error(`Array length exceeds ${maxArraySize}`);
      let array = new Array(token);
      for (let i = 0; i < token; i++) array[i] = read();
      return array;
    case 5:
      if (token >= maxMapSize) throw new Error(`Map size exceeds ${maxArraySize}`);
      if (currentDecoder.mapsAsObjects) {
        let object = {};
        if (currentDecoder.keyMap) for (let i = 0; i < token; i++) object[safeKey(currentDecoder.decodeKey(read()))] = read();
        else for (let i = 0; i < token; i++) object[safeKey(read())] = read();
        return object;
      } else {
        if (restoreMapsAsObject) {
          currentDecoder.mapsAsObjects = true;
          restoreMapsAsObject = false;
        }
        let map = /* @__PURE__ */ new Map();
        if (currentDecoder.keyMap) for (let i = 0; i < token; i++) map.set(currentDecoder.decodeKey(read()), read());
        else for (let i = 0; i < token; i++) map.set(read(), read());
        return map;
      }
    case 6:
      if (token >= BUNDLED_STRINGS_ID) {
        let structure = currentStructures[token & 8191];
        if (structure) {
          if (!structure.read) structure.read = createStructureReader(structure);
          return structure.read();
        }
        if (token < 65536) {
          if (token == RECORD_INLINE_ID) {
            let length = readJustLength();
            let id = read();
            let structure2 = read();
            recordDefinition(id, structure2);
            let object = {};
            if (currentDecoder.keyMap) for (let i = 2; i < length; i++) {
              let key = currentDecoder.decodeKey(structure2[i - 2]);
              object[safeKey(key)] = read();
            }
            else for (let i = 2; i < length; i++) {
              let key = structure2[i - 2];
              object[safeKey(key)] = read();
            }
            return object;
          } else if (token == RECORD_DEFINITIONS_ID) {
            let length = readJustLength();
            let id = read();
            for (let i = 2; i < length; i++) {
              recordDefinition(id++, read());
            }
            return read();
          } else if (token == BUNDLED_STRINGS_ID) {
            return readBundleExt();
          }
          if (currentDecoder.getShared) {
            loadShared();
            structure = currentStructures[token & 8191];
            if (structure) {
              if (!structure.read)
                structure.read = createStructureReader(structure);
              return structure.read();
            }
          }
        }
      }
      let extension = currentExtensions[token];
      if (extension) {
        if (extension.handlesRead)
          return extension(read);
        else
          return extension(read());
      } else {
        let input = read();
        for (let i = 0; i < currentExtensionRanges.length; i++) {
          let value = currentExtensionRanges[i](token, input);
          if (value !== void 0)
            return value;
        }
        return new Tag(input, token);
      }
    case 7:
      switch (token) {
        case 20:
          return false;
        case 21:
          return true;
        case 22:
          return null;
        case 23:
          return;
        // undefined
        case 31:
        default:
          let packedValue = (packedValues || getPackedValues())[token];
          if (packedValue !== void 0)
            return packedValue;
          throw new Error("Unknown token " + token);
      }
    default:
      if (isNaN(token)) {
        let error = new Error("Unexpected end of CBOR data");
        error.incomplete = true;
        throw error;
      }
      throw new Error("Unknown CBOR token " + token);
  }
}
var validName = /^[a-zA-Z_$][a-zA-Z\d_$]*$/;
function createStructureReader(structure) {
  if (!structure) throw new Error("Structure is required in record definition");
  function readObject() {
    let length = src[position++];
    length = length & 31;
    if (length > 23) {
      switch (length) {
        case 24:
          length = src[position++];
          break;
        case 25:
          length = dataView.getUint16(position);
          position += 2;
          break;
        case 26:
          length = dataView.getUint32(position);
          position += 4;
          break;
        default:
          throw new Error("Expected array header, but got " + src[position - 1]);
      }
    }
    let compiledReader = this.compiledReader;
    while (compiledReader) {
      if (compiledReader.propertyCount === length)
        return compiledReader(read);
      compiledReader = compiledReader.next;
    }
    if (this.slowReads++ >= inlineObjectReadThreshold) {
      let array = this.length == length ? this : this.slice(0, length);
      compiledReader = currentDecoder.keyMap ? new Function("r", "return {" + array.map((k3) => currentDecoder.decodeKey(k3)).map((k3) => validName.test(k3) ? safeKey(k3) + ":r()" : "[" + JSON.stringify(k3) + "]:r()").join(",") + "}") : new Function("r", "return {" + array.map((key) => validName.test(key) ? safeKey(key) + ":r()" : "[" + JSON.stringify(key) + "]:r()").join(",") + "}");
      if (this.compiledReader)
        compiledReader.next = this.compiledReader;
      compiledReader.propertyCount = length;
      this.compiledReader = compiledReader;
      return compiledReader(read);
    }
    let object = {};
    if (currentDecoder.keyMap) for (let i = 0; i < length; i++) object[safeKey(currentDecoder.decodeKey(this[i]))] = read();
    else for (let i = 0; i < length; i++) {
      object[safeKey(this[i])] = read();
    }
    return object;
  }
  structure.slowReads = 0;
  return readObject;
}
function safeKey(key) {
  if (typeof key === "string") return key === "__proto__" ? "__proto_" : key;
  if (typeof key === "number" || typeof key === "boolean" || typeof key === "bigint") return key.toString();
  if (key == null) return key + "";
  throw new Error("Invalid property name type " + typeof key);
}
var readFixedString = readStringJS;
function readStringJS(length) {
  let result;
  if (length < 16) {
    if (result = shortStringInJS(length))
      return result;
  }
  if (length > 64 && decoder)
    return decoder.decode(src.subarray(position, position += length));
  const end = position + length;
  const units = [];
  result = "";
  while (position < end) {
    const byte1 = src[position++];
    if ((byte1 & 128) === 0) {
      units.push(byte1);
    } else if ((byte1 & 224) === 192) {
      const byte2 = src[position++] & 63;
      units.push((byte1 & 31) << 6 | byte2);
    } else if ((byte1 & 240) === 224) {
      const byte2 = src[position++] & 63;
      const byte3 = src[position++] & 63;
      units.push((byte1 & 31) << 12 | byte2 << 6 | byte3);
    } else if ((byte1 & 248) === 240) {
      const byte2 = src[position++] & 63;
      const byte3 = src[position++] & 63;
      const byte4 = src[position++] & 63;
      let unit = (byte1 & 7) << 18 | byte2 << 12 | byte3 << 6 | byte4;
      if (unit > 65535) {
        unit -= 65536;
        units.push(unit >>> 10 & 1023 | 55296);
        unit = 56320 | unit & 1023;
      }
      units.push(unit);
    } else {
      units.push(byte1);
    }
    if (units.length >= 4096) {
      result += fromCharCode.apply(String, units);
      units.length = 0;
    }
  }
  if (units.length > 0) {
    result += fromCharCode.apply(String, units);
  }
  return result;
}
var fromCharCode = String.fromCharCode;
function longStringInJS(length) {
  let start = position;
  let bytes = new Array(length);
  for (let i = 0; i < length; i++) {
    const byte = src[position++];
    if ((byte & 128) > 0) {
      position = start;
      return;
    }
    bytes[i] = byte;
  }
  return fromCharCode.apply(String, bytes);
}
function shortStringInJS(length) {
  if (length < 4) {
    if (length < 2) {
      if (length === 0)
        return "";
      else {
        let a = src[position++];
        if ((a & 128) > 1) {
          position -= 1;
          return;
        }
        return fromCharCode(a);
      }
    } else {
      let a = src[position++];
      let b2 = src[position++];
      if ((a & 128) > 0 || (b2 & 128) > 0) {
        position -= 2;
        return;
      }
      if (length < 3)
        return fromCharCode(a, b2);
      let c = src[position++];
      if ((c & 128) > 0) {
        position -= 3;
        return;
      }
      return fromCharCode(a, b2, c);
    }
  } else {
    let a = src[position++];
    let b2 = src[position++];
    let c = src[position++];
    let d = src[position++];
    if ((a & 128) > 0 || (b2 & 128) > 0 || (c & 128) > 0 || (d & 128) > 0) {
      position -= 4;
      return;
    }
    if (length < 6) {
      if (length === 4)
        return fromCharCode(a, b2, c, d);
      else {
        let e = src[position++];
        if ((e & 128) > 0) {
          position -= 5;
          return;
        }
        return fromCharCode(a, b2, c, d, e);
      }
    } else if (length < 8) {
      let e = src[position++];
      let f2 = src[position++];
      if ((e & 128) > 0 || (f2 & 128) > 0) {
        position -= 6;
        return;
      }
      if (length < 7)
        return fromCharCode(a, b2, c, d, e, f2);
      let g2 = src[position++];
      if ((g2 & 128) > 0) {
        position -= 7;
        return;
      }
      return fromCharCode(a, b2, c, d, e, f2, g2);
    } else {
      let e = src[position++];
      let f2 = src[position++];
      let g2 = src[position++];
      let h = src[position++];
      if ((e & 128) > 0 || (f2 & 128) > 0 || (g2 & 128) > 0 || (h & 128) > 0) {
        position -= 8;
        return;
      }
      if (length < 10) {
        if (length === 8)
          return fromCharCode(a, b2, c, d, e, f2, g2, h);
        else {
          let i = src[position++];
          if ((i & 128) > 0) {
            position -= 9;
            return;
          }
          return fromCharCode(a, b2, c, d, e, f2, g2, h, i);
        }
      } else if (length < 12) {
        let i = src[position++];
        let j3 = src[position++];
        if ((i & 128) > 0 || (j3 & 128) > 0) {
          position -= 10;
          return;
        }
        if (length < 11)
          return fromCharCode(a, b2, c, d, e, f2, g2, h, i, j3);
        let k3 = src[position++];
        if ((k3 & 128) > 0) {
          position -= 11;
          return;
        }
        return fromCharCode(a, b2, c, d, e, f2, g2, h, i, j3, k3);
      } else {
        let i = src[position++];
        let j3 = src[position++];
        let k3 = src[position++];
        let l3 = src[position++];
        if ((i & 128) > 0 || (j3 & 128) > 0 || (k3 & 128) > 0 || (l3 & 128) > 0) {
          position -= 12;
          return;
        }
        if (length < 14) {
          if (length === 12)
            return fromCharCode(a, b2, c, d, e, f2, g2, h, i, j3, k3, l3);
          else {
            let m2 = src[position++];
            if ((m2 & 128) > 0) {
              position -= 13;
              return;
            }
            return fromCharCode(a, b2, c, d, e, f2, g2, h, i, j3, k3, l3, m2);
          }
        } else {
          let m2 = src[position++];
          let n10 = src[position++];
          if ((m2 & 128) > 0 || (n10 & 128) > 0) {
            position -= 14;
            return;
          }
          if (length < 15)
            return fromCharCode(a, b2, c, d, e, f2, g2, h, i, j3, k3, l3, m2, n10);
          let o3 = src[position++];
          if ((o3 & 128) > 0) {
            position -= 15;
            return;
          }
          return fromCharCode(a, b2, c, d, e, f2, g2, h, i, j3, k3, l3, m2, n10, o3);
        }
      }
    }
  }
}
function readBin(length) {
  return currentDecoder.copyBuffers ? (
    // specifically use the copying slice (not the node one)
    Uint8Array.prototype.slice.call(src, position, position += length)
  ) : src.subarray(position, position += length);
}
var f32Array = new Float32Array(1);
var u8Array = new Uint8Array(f32Array.buffer, 0, 4);
function getFloat16() {
  let byte0 = src[position++];
  let byte1 = src[position++];
  let exponent = (byte0 & 127) >> 2;
  if (exponent === 31) {
    if (byte1 || byte0 & 3)
      return NaN;
    return byte0 & 128 ? -Infinity : Infinity;
  }
  if (exponent === 0) {
    let abs = ((byte0 & 3) << 8 | byte1) / (1 << 24);
    return byte0 & 128 ? -abs : abs;
  }
  u8Array[3] = byte0 & 128 | // sign bit
  (exponent >> 1) + 56;
  u8Array[2] = (byte0 & 7) << 5 | // last exponent bit and first two mantissa bits
  byte1 >> 3;
  u8Array[1] = byte1 << 5;
  u8Array[0] = 0;
  return f32Array[0];
}
var keyCache = new Array(4096);
var Tag = class {
  constructor(value, tag) {
    this.value = value;
    this.tag = tag;
  }
};
currentExtensions[0] = (dateString) => {
  return new Date(dateString);
};
currentExtensions[1] = (epochSec) => {
  return new Date(Math.round(epochSec * 1e3));
};
currentExtensions[2] = (buffer) => {
  let value = BigInt(0);
  for (let i = 0, l3 = buffer.byteLength; i < l3; i++) {
    value = BigInt(buffer[i]) + (value << BigInt(8));
  }
  return value;
};
currentExtensions[3] = (buffer) => {
  return BigInt(-1) - currentExtensions[2](buffer);
};
currentExtensions[4] = (fraction) => {
  return +(fraction[1] + "e" + fraction[0]);
};
currentExtensions[5] = (fraction) => {
  return fraction[1] * Math.exp(fraction[0] * Math.log(2));
};
var recordDefinition = (id, structure) => {
  id = id - 57344;
  let existingStructure = currentStructures[id];
  if (existingStructure && existingStructure.isShared) {
    (currentStructures.restoreStructures || (currentStructures.restoreStructures = []))[id] = existingStructure;
  }
  currentStructures[id] = structure;
  structure.read = createStructureReader(structure);
};
currentExtensions[LEGACY_RECORD_INLINE_ID] = (data) => {
  let length = data.length;
  let structure = data[1];
  recordDefinition(data[0], structure);
  let object = {};
  for (let i = 2; i < length; i++) {
    let key = structure[i - 2];
    object[safeKey(key)] = data[i];
  }
  return object;
};
currentExtensions[14] = (value) => {
  if (bundledStrings)
    return bundledStrings[0].slice(bundledStrings.position0, bundledStrings.position0 += value);
  return new Tag(value, 14);
};
currentExtensions[15] = (value) => {
  if (bundledStrings)
    return bundledStrings[1].slice(bundledStrings.position1, bundledStrings.position1 += value);
  return new Tag(value, 15);
};
var glbl = { Error, RegExp };
currentExtensions[27] = (data) => {
  return (glbl[data[0]] || Error)(data[1], data[2]);
};
var packedTable = (read3) => {
  if (src[position++] != 132) {
    let error = new Error("Packed values structure must be followed by a 4 element array");
    if (src.length < position)
      error.incomplete = true;
    throw error;
  }
  let newPackedValues = read3();
  if (!newPackedValues || !newPackedValues.length) {
    let error = new Error("Packed values structure must be followed by a 4 element array");
    error.incomplete = true;
    throw error;
  }
  packedValues = packedValues ? newPackedValues.concat(packedValues.slice(newPackedValues.length)) : newPackedValues;
  packedValues.prefixes = read3();
  packedValues.suffixes = read3();
  return read3();
};
packedTable.handlesRead = true;
currentExtensions[51] = packedTable;
currentExtensions[PACKED_REFERENCE_TAG_ID] = (data) => {
  if (!packedValues) {
    if (currentDecoder.getShared)
      loadShared();
    else
      return new Tag(data, PACKED_REFERENCE_TAG_ID);
  }
  if (typeof data == "number")
    return packedValues[16 + (data >= 0 ? 2 * data : -2 * data - 1)];
  let error = new Error("No support for non-integer packed references yet");
  if (data === void 0)
    error.incomplete = true;
  throw error;
};
currentExtensions[28] = (read3) => {
  if (!referenceMap) {
    referenceMap = /* @__PURE__ */ new Map();
    referenceMap.id = 0;
  }
  let id = referenceMap.id++;
  let startingPosition = position;
  let token = src[position];
  let target3;
  if (token >> 5 == 4)
    target3 = [];
  else
    target3 = {};
  let refEntry = { target: target3 };
  referenceMap.set(id, refEntry);
  let targetProperties = read3();
  if (refEntry.used) {
    if (Object.getPrototypeOf(target3) !== Object.getPrototypeOf(targetProperties)) {
      position = startingPosition;
      target3 = targetProperties;
      referenceMap.set(id, { target: target3 });
      targetProperties = read3();
    }
    return Object.assign(target3, targetProperties);
  }
  refEntry.target = targetProperties;
  return targetProperties;
};
currentExtensions[28].handlesRead = true;
currentExtensions[29] = (id) => {
  let refEntry = referenceMap.get(id);
  refEntry.used = true;
  return refEntry.target;
};
currentExtensions[258] = (array) => new Set(array);
(currentExtensions[259] = (read3) => {
  if (currentDecoder.mapsAsObjects) {
    currentDecoder.mapsAsObjects = false;
    restoreMapsAsObject = true;
  }
  return read3();
}).handlesRead = true;
function combine(a, b2) {
  if (typeof a === "string")
    return a + b2;
  if (a instanceof Array)
    return a.concat(b2);
  return Object.assign({}, a, b2);
}
function getPackedValues() {
  if (!packedValues) {
    if (currentDecoder.getShared)
      loadShared();
    else
      throw new Error("No packed values available");
  }
  return packedValues;
}
var SHARED_DATA_TAG_ID = 1399353956;
currentExtensionRanges.push((tag, input) => {
  if (tag >= 225 && tag <= 255)
    return combine(getPackedValues().prefixes[tag - 224], input);
  if (tag >= 28704 && tag <= 32767)
    return combine(getPackedValues().prefixes[tag - 28672], input);
  if (tag >= 1879052288 && tag <= 2147483647)
    return combine(getPackedValues().prefixes[tag - 1879048192], input);
  if (tag >= 216 && tag <= 223)
    return combine(input, getPackedValues().suffixes[tag - 216]);
  if (tag >= 27647 && tag <= 28671)
    return combine(input, getPackedValues().suffixes[tag - 27639]);
  if (tag >= 1811940352 && tag <= 1879048191)
    return combine(input, getPackedValues().suffixes[tag - 1811939328]);
  if (tag == SHARED_DATA_TAG_ID) {
    return {
      packedValues,
      structures: currentStructures.slice(0),
      version: input
    };
  }
  if (tag == 55799)
    return input;
});
var isLittleEndianMachine = new Uint8Array(new Uint16Array([1]).buffer)[0] == 1;
var typedArrays = [
  Uint8Array,
  Uint8ClampedArray,
  Uint16Array,
  Uint32Array,
  typeof BigUint64Array == "undefined" ? { name: "BigUint64Array" } : BigUint64Array,
  Int8Array,
  Int16Array,
  Int32Array,
  typeof BigInt64Array == "undefined" ? { name: "BigInt64Array" } : BigInt64Array,
  Float32Array,
  Float64Array
];
var typedArrayTags = [64, 68, 69, 70, 71, 72, 77, 78, 79, 85, 86];
for (let i = 0; i < typedArrays.length; i++) {
  registerTypedArray(typedArrays[i], typedArrayTags[i]);
}
function registerTypedArray(TypedArray, tag) {
  let dvMethod = "get" + TypedArray.name.slice(0, -5);
  let bytesPerElement;
  if (typeof TypedArray === "function")
    bytesPerElement = TypedArray.BYTES_PER_ELEMENT;
  else
    TypedArray = null;
  for (let littleEndian = 0; littleEndian < 2; littleEndian++) {
    if (!littleEndian && bytesPerElement == 1)
      continue;
    let sizeShift = bytesPerElement == 2 ? 1 : bytesPerElement == 4 ? 2 : bytesPerElement == 8 ? 3 : 0;
    currentExtensions[littleEndian ? tag : tag - 4] = bytesPerElement == 1 || littleEndian == isLittleEndianMachine ? (buffer) => {
      if (!TypedArray)
        throw new Error("Could not find typed array for code " + tag);
      if (!currentDecoder.copyBuffers) {
        if (bytesPerElement === 1 || bytesPerElement === 2 && !(buffer.byteOffset & 1) || bytesPerElement === 4 && !(buffer.byteOffset & 3) || bytesPerElement === 8 && !(buffer.byteOffset & 7))
          return new TypedArray(buffer.buffer, buffer.byteOffset, buffer.byteLength >> sizeShift);
      }
      return new TypedArray(Uint8Array.prototype.slice.call(buffer, 0).buffer);
    } : (buffer) => {
      if (!TypedArray)
        throw new Error("Could not find typed array for code " + tag);
      let dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      let elements = buffer.length >> sizeShift;
      let ta = new TypedArray(elements);
      let method = dv[dvMethod];
      for (let i = 0; i < elements; i++) {
        ta[i] = method.call(dv, i << sizeShift, littleEndian);
      }
      return ta;
    };
  }
}
function readBundleExt() {
  let length = readJustLength();
  let bundlePosition = position + read();
  for (let i = 2; i < length; i++) {
    let bundleLength = readJustLength();
    position += bundleLength;
  }
  let dataPosition = position;
  position = bundlePosition;
  bundledStrings = [readStringJS(readJustLength()), readStringJS(readJustLength())];
  bundledStrings.position0 = 0;
  bundledStrings.position1 = 0;
  bundledStrings.postBundlePosition = position;
  position = dataPosition;
  return read();
}
function readJustLength() {
  let token = src[position++] & 31;
  if (token > 23) {
    switch (token) {
      case 24:
        token = src[position++];
        break;
      case 25:
        token = dataView.getUint16(position);
        position += 2;
        break;
      case 26:
        token = dataView.getUint32(position);
        position += 4;
        break;
    }
  }
  return token;
}
function loadShared() {
  if (currentDecoder.getShared) {
    let sharedData = saveState(() => {
      src = null;
      return currentDecoder.getShared();
    }) || {};
    let updatedStructures = sharedData.structures || [];
    currentDecoder.sharedVersion = sharedData.version;
    packedValues = currentDecoder.sharedValues = sharedData.packedValues;
    if (currentStructures === true)
      currentDecoder.structures = currentStructures = updatedStructures;
    else
      currentStructures.splice.apply(currentStructures, [0, updatedStructures.length].concat(updatedStructures));
  }
}
function saveState(callback) {
  let savedSrcEnd = srcEnd;
  let savedPosition = position;
  let savedStringPosition = stringPosition;
  let savedSrcStringStart = srcStringStart;
  let savedSrcStringEnd = srcStringEnd;
  let savedSrcString = srcString;
  let savedStrings = strings;
  let savedReferenceMap = referenceMap;
  let savedBundledStrings = bundledStrings;
  let savedSrc = new Uint8Array(src.slice(0, srcEnd));
  let savedStructures = currentStructures;
  let savedDecoder = currentDecoder;
  let savedSequentialMode = sequentialMode;
  let value = callback();
  srcEnd = savedSrcEnd;
  position = savedPosition;
  stringPosition = savedStringPosition;
  srcStringStart = savedSrcStringStart;
  srcStringEnd = savedSrcStringEnd;
  srcString = savedSrcString;
  strings = savedStrings;
  referenceMap = savedReferenceMap;
  bundledStrings = savedBundledStrings;
  src = savedSrc;
  sequentialMode = savedSequentialMode;
  currentStructures = savedStructures;
  currentDecoder = savedDecoder;
  dataView = new DataView(src.buffer, src.byteOffset, src.byteLength);
  return value;
}
function clearSource() {
  src = null;
  referenceMap = null;
  currentStructures = null;
}
var mult10 = new Array(147);
for (let i = 0; i < 256; i++) {
  mult10[i] = +("1e" + Math.floor(45.15 - i * 0.30103));
}
var defaultDecoder = new Decoder({ useRecords: false });
var decode = defaultDecoder.decode;
var decodeMultiple = defaultDecoder.decodeMultiple;
var FLOAT32_OPTIONS = {
  NEVER: 0,
  ALWAYS: 1,
  DECIMAL_ROUND: 3,
  DECIMAL_FIT: 4
};

// node_modules/cbor-x/encode.js
var textEncoder;
try {
  textEncoder = new TextEncoder();
} catch (error) {
}
var extensions;
var extensionClasses;
var Buffer2 = typeof globalThis === "object" && globalThis.Buffer;
var hasNodeBuffer = typeof Buffer2 !== "undefined";
var ByteArrayAllocate = hasNodeBuffer ? Buffer2.allocUnsafeSlow : Uint8Array;
var ByteArray = hasNodeBuffer ? Buffer2 : Uint8Array;
var MAX_STRUCTURES = 256;
var MAX_BUFFER_SIZE = hasNodeBuffer ? 4294967296 : 2144337920;
var throwOnIterable;
var target;
var targetView;
var position2 = 0;
var safeEnd;
var bundledStrings2 = null;
var MAX_BUNDLE_SIZE = 61440;
var hasNonLatin = /[\u0080-\uFFFF]/;
var RECORD_SYMBOL = /* @__PURE__ */ Symbol("record-id");
var Encoder = class extends Decoder {
  constructor(options) {
    super(options);
    this.offset = 0;
    let typeBuffer;
    let start;
    let sharedStructures;
    let hasSharedUpdate;
    let structures;
    let referenceMap3;
    options = options || {};
    let encodeUtf8 = ByteArray.prototype.utf8Write ? function(string, position5, maxBytes) {
      return target.utf8Write(string, position5, maxBytes);
    } : textEncoder && textEncoder.encodeInto ? function(string, position5) {
      return textEncoder.encodeInto(string, target.subarray(position5)).written;
    } : false;
    let encoder = this;
    let hasSharedStructures = options.structures || options.saveStructures;
    let maxSharedStructures = options.maxSharedStructures;
    if (maxSharedStructures == null)
      maxSharedStructures = hasSharedStructures ? 128 : 0;
    if (maxSharedStructures > 8190)
      throw new Error("Maximum maxSharedStructure is 8190");
    let isSequential = options.sequential;
    if (isSequential) {
      maxSharedStructures = 0;
    }
    if (!this.structures)
      this.structures = [];
    if (this.saveStructures)
      this.saveShared = this.saveStructures;
    let samplingPackedValues, packedObjectMap2, sharedValues = options.sharedValues;
    let sharedPackedObjectMap2;
    if (sharedValues) {
      sharedPackedObjectMap2 = /* @__PURE__ */ Object.create(null);
      for (let i = 0, l3 = sharedValues.length; i < l3; i++) {
        sharedPackedObjectMap2[sharedValues[i]] = i;
      }
    }
    let recordIdsToRemove = [];
    let transitionsCount = 0;
    let serializationsSinceTransitionRebuild = 0;
    this.mapEncode = function(value, encodeOptions) {
      if (this._keyMap && !this._mapped) {
        switch (value.constructor.name) {
          case "Array":
            value = value.map((r) => this.encodeKeys(r));
            break;
        }
      }
      return this.encode(value, encodeOptions);
    };
    this.encode = function(value, encodeOptions) {
      if (!target) {
        target = new ByteArrayAllocate(8192);
        targetView = new DataView(target.buffer, 0, 8192);
        position2 = 0;
      }
      safeEnd = target.length - 10;
      if (safeEnd - position2 < 2048) {
        target = new ByteArrayAllocate(target.length);
        targetView = new DataView(target.buffer, 0, target.length);
        safeEnd = target.length - 10;
        position2 = 0;
      } else if (encodeOptions === REUSE_BUFFER_MODE)
        position2 = position2 + 7 & 2147483640;
      start = position2;
      if (encoder.useSelfDescribedHeader) {
        targetView.setUint32(position2, 3654940416);
        position2 += 3;
      }
      referenceMap3 = encoder.structuredClone ? /* @__PURE__ */ new Map() : null;
      if (encoder.bundleStrings && typeof value !== "string") {
        bundledStrings2 = [];
        bundledStrings2.size = Infinity;
      } else
        bundledStrings2 = null;
      sharedStructures = encoder.structures;
      if (sharedStructures) {
        if (sharedStructures.uninitialized) {
          let sharedData = encoder.getShared() || {};
          encoder.structures = sharedStructures = sharedData.structures || [];
          encoder.sharedVersion = sharedData.version;
          let sharedValues2 = encoder.sharedValues = sharedData.packedValues;
          if (sharedValues2) {
            sharedPackedObjectMap2 = {};
            for (let i = 0, l3 = sharedValues2.length; i < l3; i++)
              sharedPackedObjectMap2[sharedValues2[i]] = i;
          }
        }
        let sharedStructuresLength = sharedStructures.length;
        if (sharedStructuresLength > maxSharedStructures && !isSequential)
          sharedStructuresLength = maxSharedStructures;
        if (!sharedStructures.transitions) {
          sharedStructures.transitions = /* @__PURE__ */ Object.create(null);
          for (let i = 0; i < sharedStructuresLength; i++) {
            let keys = sharedStructures[i];
            if (!keys)
              continue;
            let nextTransition, transition = sharedStructures.transitions;
            for (let j3 = 0, l3 = keys.length; j3 < l3; j3++) {
              if (transition[RECORD_SYMBOL] === void 0)
                transition[RECORD_SYMBOL] = i;
              let key = keys[j3];
              nextTransition = transition[key];
              if (!nextTransition) {
                nextTransition = transition[key] = /* @__PURE__ */ Object.create(null);
              }
              transition = nextTransition;
            }
            transition[RECORD_SYMBOL] = i | 1048576;
          }
        }
        if (!isSequential)
          sharedStructures.nextId = sharedStructuresLength;
      }
      if (hasSharedUpdate)
        hasSharedUpdate = false;
      structures = sharedStructures || [];
      packedObjectMap2 = sharedPackedObjectMap2;
      if (options.pack) {
        let packedValues3 = /* @__PURE__ */ new Map();
        packedValues3.values = [];
        packedValues3.encoder = encoder;
        packedValues3.maxValues = options.maxPrivatePackedValues || (sharedPackedObjectMap2 ? 16 : Infinity);
        packedValues3.objectMap = sharedPackedObjectMap2 || false;
        packedValues3.samplingPackedValues = samplingPackedValues;
        findRepetitiveStrings(value, packedValues3);
        if (packedValues3.values.length > 0) {
          target[position2++] = 216;
          target[position2++] = 51;
          writeArrayHeader(4);
          let valuesArray = packedValues3.values;
          encode3(valuesArray);
          writeArrayHeader(0);
          writeArrayHeader(0);
          packedObjectMap2 = Object.create(sharedPackedObjectMap2 || null);
          for (let i = 0, l3 = valuesArray.length; i < l3; i++) {
            packedObjectMap2[valuesArray[i]] = i;
          }
        }
      }
      throwOnIterable = encodeOptions & THROW_ON_ITERABLE;
      try {
        if (throwOnIterable)
          return;
        encode3(value);
        if (bundledStrings2) {
          writeBundles(start, encode3);
        }
        encoder.offset = position2;
        if (referenceMap3 && referenceMap3.idsToInsert) {
          position2 += referenceMap3.idsToInsert.length * 2;
          if (position2 > safeEnd)
            makeRoom(position2);
          encoder.offset = position2;
          let serialized = insertIds(target.subarray(start, position2), referenceMap3.idsToInsert);
          referenceMap3 = null;
          return serialized;
        }
        if (encodeOptions & REUSE_BUFFER_MODE) {
          target.start = start;
          target.end = position2;
          return target;
        }
        return target.subarray(start, position2);
      } finally {
        if (sharedStructures) {
          if (serializationsSinceTransitionRebuild < 10)
            serializationsSinceTransitionRebuild++;
          if (sharedStructures.length > maxSharedStructures)
            sharedStructures.length = maxSharedStructures;
          if (transitionsCount > 1e4) {
            sharedStructures.transitions = null;
            serializationsSinceTransitionRebuild = 0;
            transitionsCount = 0;
            if (recordIdsToRemove.length > 0)
              recordIdsToRemove = [];
          } else if (recordIdsToRemove.length > 0 && !isSequential) {
            for (let i = 0, l3 = recordIdsToRemove.length; i < l3; i++) {
              recordIdsToRemove[i][RECORD_SYMBOL] = void 0;
            }
            recordIdsToRemove = [];
          }
        }
        if (hasSharedUpdate && encoder.saveShared) {
          if (encoder.structures.length > maxSharedStructures) {
            encoder.structures = encoder.structures.slice(0, maxSharedStructures);
          }
          let returnBuffer = target.subarray(start, position2);
          if (encoder.updateSharedData() === false)
            return encoder.encode(value);
          return returnBuffer;
        }
        if (encodeOptions & RESET_BUFFER_MODE)
          position2 = start;
      }
    };
    this.findCommonStringsToPack = () => {
      samplingPackedValues = /* @__PURE__ */ new Map();
      if (!sharedPackedObjectMap2)
        sharedPackedObjectMap2 = /* @__PURE__ */ Object.create(null);
      return (options2) => {
        let threshold = options2 && options2.threshold || 4;
        let position5 = this.pack ? options2.maxPrivatePackedValues || 16 : 0;
        if (!sharedValues)
          sharedValues = this.sharedValues = [];
        for (let [key, status] of samplingPackedValues) {
          if (status.count > threshold) {
            sharedPackedObjectMap2[key] = position5++;
            sharedValues.push(key);
            hasSharedUpdate = true;
          }
        }
        while (this.saveShared && this.updateSharedData() === false) {
        }
        samplingPackedValues = null;
      };
    };
    const encode3 = (value) => {
      if (position2 > safeEnd)
        target = makeRoom(position2);
      var type = typeof value;
      var length;
      if (type === "string") {
        if (packedObjectMap2) {
          let packedPosition = packedObjectMap2[value];
          if (packedPosition >= 0) {
            if (packedPosition < 16)
              target[position2++] = packedPosition + 224;
            else {
              target[position2++] = 198;
              if (packedPosition & 1)
                encode3(15 - packedPosition >> 1);
              else
                encode3(packedPosition - 16 >> 1);
            }
            return;
          } else if (samplingPackedValues && !options.pack) {
            let status = samplingPackedValues.get(value);
            if (status)
              status.count++;
            else
              samplingPackedValues.set(value, {
                count: 1
              });
          }
        }
        let strLength = value.length;
        if (bundledStrings2 && strLength >= 4 && strLength < 1024) {
          if ((bundledStrings2.size += strLength) > MAX_BUNDLE_SIZE) {
            let extStart;
            let maxBytes2 = (bundledStrings2[0] ? bundledStrings2[0].length * 3 + bundledStrings2[1].length : 0) + 10;
            if (position2 + maxBytes2 > safeEnd)
              target = makeRoom(position2 + maxBytes2);
            target[position2++] = 217;
            target[position2++] = 223;
            target[position2++] = 249;
            target[position2++] = bundledStrings2.position ? 132 : 130;
            target[position2++] = 26;
            extStart = position2 - start;
            position2 += 4;
            if (bundledStrings2.position) {
              writeBundles(start, encode3);
            }
            bundledStrings2 = ["", ""];
            bundledStrings2.size = 0;
            bundledStrings2.position = extStart;
          }
          let twoByte = hasNonLatin.test(value);
          bundledStrings2[twoByte ? 0 : 1] += value;
          target[position2++] = twoByte ? 206 : 207;
          encode3(strLength);
          return;
        }
        let headerSize;
        if (strLength < 32) {
          headerSize = 1;
        } else if (strLength < 256) {
          headerSize = 2;
        } else if (strLength < 65536) {
          headerSize = 3;
        } else {
          headerSize = 5;
        }
        let maxBytes = strLength * 3;
        if (position2 + maxBytes > safeEnd)
          target = makeRoom(position2 + maxBytes);
        if (strLength < 64 || !encodeUtf8) {
          let i, c1, c2, strPosition = position2 + headerSize;
          for (i = 0; i < strLength; i++) {
            c1 = value.charCodeAt(i);
            if (c1 < 128) {
              target[strPosition++] = c1;
            } else if (c1 < 2048) {
              target[strPosition++] = c1 >> 6 | 192;
              target[strPosition++] = c1 & 63 | 128;
            } else if ((c1 & 64512) === 55296 && ((c2 = value.charCodeAt(i + 1)) & 64512) === 56320) {
              c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
              i++;
              target[strPosition++] = c1 >> 18 | 240;
              target[strPosition++] = c1 >> 12 & 63 | 128;
              target[strPosition++] = c1 >> 6 & 63 | 128;
              target[strPosition++] = c1 & 63 | 128;
            } else {
              target[strPosition++] = c1 >> 12 | 224;
              target[strPosition++] = c1 >> 6 & 63 | 128;
              target[strPosition++] = c1 & 63 | 128;
            }
          }
          length = strPosition - position2 - headerSize;
        } else {
          length = encodeUtf8(value, position2 + headerSize, maxBytes);
        }
        if (length < 24) {
          target[position2++] = 96 | length;
        } else if (length < 256) {
          if (headerSize < 2) {
            target.copyWithin(position2 + 2, position2 + 1, position2 + 1 + length);
          }
          target[position2++] = 120;
          target[position2++] = length;
        } else if (length < 65536) {
          if (headerSize < 3) {
            target.copyWithin(position2 + 3, position2 + 2, position2 + 2 + length);
          }
          target[position2++] = 121;
          target[position2++] = length >> 8;
          target[position2++] = length & 255;
        } else {
          if (headerSize < 5) {
            target.copyWithin(position2 + 5, position2 + 3, position2 + 3 + length);
          }
          target[position2++] = 122;
          targetView.setUint32(position2, length);
          position2 += 4;
        }
        position2 += length;
      } else if (type === "number") {
        if (!this.alwaysUseFloat && value >>> 0 === value) {
          if (value < 24) {
            target[position2++] = value;
          } else if (value < 256) {
            target[position2++] = 24;
            target[position2++] = value;
          } else if (value < 65536) {
            target[position2++] = 25;
            target[position2++] = value >> 8;
            target[position2++] = value & 255;
          } else {
            target[position2++] = 26;
            targetView.setUint32(position2, value);
            position2 += 4;
          }
        } else if (!this.alwaysUseFloat && value >> 0 === value) {
          if (value >= -24) {
            target[position2++] = 31 - value;
          } else if (value >= -256) {
            target[position2++] = 56;
            target[position2++] = ~value;
          } else if (value >= -65536) {
            target[position2++] = 57;
            targetView.setUint16(position2, ~value);
            position2 += 2;
          } else {
            target[position2++] = 58;
            targetView.setUint32(position2, ~value);
            position2 += 4;
          }
        } else {
          let useFloat32;
          if ((useFloat32 = this.useFloat32) > 0 && value < 4294967296 && value >= -2147483648) {
            target[position2++] = 250;
            targetView.setFloat32(position2, value);
            let xShifted;
            if (useFloat32 < 4 || // this checks for rounding of numbers that were encoded in 32-bit float to nearest significant decimal digit that could be preserved
            (xShifted = value * mult10[(target[position2] & 127) << 1 | target[position2 + 1] >> 7]) >> 0 === xShifted) {
              position2 += 4;
              return;
            } else
              position2--;
          }
          target[position2++] = 251;
          targetView.setFloat64(position2, value);
          position2 += 8;
        }
      } else if (type === "object") {
        if (!value)
          target[position2++] = 246;
        else {
          if (referenceMap3) {
            let referee = referenceMap3.get(value);
            if (referee) {
              target[position2++] = 216;
              target[position2++] = 29;
              target[position2++] = 25;
              if (!referee.references) {
                let idsToInsert = referenceMap3.idsToInsert || (referenceMap3.idsToInsert = []);
                referee.references = [];
                idsToInsert.push(referee);
              }
              referee.references.push(position2 - start);
              position2 += 2;
              return;
            } else
              referenceMap3.set(value, { offset: position2 - start });
          }
          let constructor = value.constructor;
          if (constructor === Object) {
            writeObject(value);
          } else if (constructor === Array) {
            length = value.length;
            if (length < 24) {
              target[position2++] = 128 | length;
            } else {
              writeArrayHeader(length);
            }
            for (let i = 0; i < length; i++) {
              encode3(value[i]);
            }
          } else if (constructor === Map) {
            if (this.mapsAsObjects ? this.useTag259ForMaps !== false : this.useTag259ForMaps) {
              target[position2++] = 217;
              target[position2++] = 1;
              target[position2++] = 3;
            }
            length = value.size;
            if (length < 24) {
              target[position2++] = 160 | length;
            } else if (length < 256) {
              target[position2++] = 184;
              target[position2++] = length;
            } else if (length < 65536) {
              target[position2++] = 185;
              target[position2++] = length >> 8;
              target[position2++] = length & 255;
            } else {
              target[position2++] = 186;
              targetView.setUint32(position2, length);
              position2 += 4;
            }
            if (encoder.keyMap) {
              for (let [key, entryValue] of value) {
                encode3(encoder.encodeKey(key));
                encode3(entryValue);
              }
            } else {
              for (let [key, entryValue] of value) {
                encode3(key);
                encode3(entryValue);
              }
            }
          } else {
            for (let i = 0, l3 = extensions.length; i < l3; i++) {
              let extensionClass = extensionClasses[i];
              if (value instanceof extensionClass) {
                let extension = extensions[i];
                let tag = extension.tag;
                if (tag == void 0)
                  tag = extension.getTag && extension.getTag.call(this, value);
                if (tag < 24) {
                  target[position2++] = 192 | tag;
                } else if (tag < 256) {
                  target[position2++] = 216;
                  target[position2++] = tag;
                } else if (tag < 65536) {
                  target[position2++] = 217;
                  target[position2++] = tag >> 8;
                  target[position2++] = tag & 255;
                } else if (tag > -1) {
                  target[position2++] = 218;
                  targetView.setUint32(position2, tag);
                  position2 += 4;
                }
                extension.encode.call(this, value, encode3, makeRoom);
                return;
              }
            }
            if (value[Symbol.iterator]) {
              if (throwOnIterable) {
                let error = new Error("Iterable should be serialized as iterator");
                error.iteratorNotHandled = true;
                throw error;
              }
              target[position2++] = 159;
              for (let entry of value) {
                encode3(entry);
              }
              target[position2++] = 255;
              return;
            }
            if (value[Symbol.asyncIterator] || isBlob(value)) {
              let error = new Error("Iterable/blob should be serialized as iterator");
              error.iteratorNotHandled = true;
              throw error;
            }
            if (this.useToJSON && value.toJSON) {
              const json = value.toJSON();
              if (json !== value)
                return encode3(json);
            }
            writeObject(value);
          }
        }
      } else if (type === "boolean") {
        target[position2++] = value ? 245 : 244;
      } else if (type === "bigint") {
        if (value < BigInt(1) << BigInt(64) && value >= 0) {
          target[position2++] = 27;
          targetView.setBigUint64(position2, value);
        } else if (value > -(BigInt(1) << BigInt(64)) && value < 0) {
          target[position2++] = 59;
          targetView.setBigUint64(position2, -value - BigInt(1));
        } else {
          if (this.largeBigIntToFloat) {
            target[position2++] = 251;
            targetView.setFloat64(position2, Number(value));
          } else {
            if (value >= BigInt(0))
              target[position2++] = 194;
            else {
              target[position2++] = 195;
              value = BigInt(-1) - value;
            }
            let bytes = [];
            while (value) {
              bytes.push(Number(value & BigInt(255)));
              value >>= BigInt(8);
            }
            writeBuffer(new Uint8Array(bytes.reverse()), makeRoom);
            return;
          }
        }
        position2 += 8;
      } else if (type === "undefined") {
        target[position2++] = 247;
      } else {
        throw new Error("Unknown type: " + type);
      }
    };
    const writeObject = this.useRecords === false ? this.variableMapSize ? (object) => {
      let keys = Object.keys(object);
      let vals = Object.values(object);
      let length = keys.length;
      if (length < 24) {
        target[position2++] = 160 | length;
      } else if (length < 256) {
        target[position2++] = 184;
        target[position2++] = length;
      } else if (length < 65536) {
        target[position2++] = 185;
        target[position2++] = length >> 8;
        target[position2++] = length & 255;
      } else {
        target[position2++] = 186;
        targetView.setUint32(position2, length);
        position2 += 4;
      }
      let key;
      if (encoder.keyMap) {
        for (let i = 0; i < length; i++) {
          encode3(encoder.encodeKey(keys[i]));
          encode3(vals[i]);
        }
      } else {
        for (let i = 0; i < length; i++) {
          encode3(keys[i]);
          encode3(vals[i]);
        }
      }
    } : (object) => {
      target[position2++] = 185;
      let objectOffset = position2 - start;
      position2 += 2;
      let size = 0;
      if (encoder.keyMap) {
        for (let key in object) if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) {
          encode3(encoder.encodeKey(key));
          encode3(object[key]);
          size++;
        }
      } else {
        for (let key in object) if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) {
          encode3(key);
          encode3(object[key]);
          size++;
        }
      }
      target[objectOffset++ + start] = size >> 8;
      target[objectOffset + start] = size & 255;
    } : (object, skipValues) => {
      let nextTransition, transition = structures.transitions || (structures.transitions = /* @__PURE__ */ Object.create(null));
      let newTransitions = 0;
      let length = 0;
      let parentRecordId;
      let keys;
      if (this.keyMap) {
        keys = Object.keys(object).map((k3) => this.encodeKey(k3));
        length = keys.length;
        for (let i = 0; i < length; i++) {
          let key = keys[i];
          nextTransition = transition[key];
          if (!nextTransition) {
            nextTransition = transition[key] = /* @__PURE__ */ Object.create(null);
            newTransitions++;
          }
          transition = nextTransition;
        }
      } else {
        for (let key in object) if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) {
          nextTransition = transition[key];
          if (!nextTransition) {
            if (transition[RECORD_SYMBOL] & 1048576) {
              parentRecordId = transition[RECORD_SYMBOL] & 65535;
            }
            nextTransition = transition[key] = /* @__PURE__ */ Object.create(null);
            newTransitions++;
          }
          transition = nextTransition;
          length++;
        }
      }
      let recordId = transition[RECORD_SYMBOL];
      if (recordId !== void 0) {
        recordId &= 65535;
        target[position2++] = 217;
        target[position2++] = recordId >> 8 | 224;
        target[position2++] = recordId & 255;
      } else {
        if (!keys)
          keys = transition.__keys__ || (transition.__keys__ = Object.keys(object));
        if (parentRecordId === void 0) {
          recordId = structures.nextId++;
          if (!recordId) {
            recordId = 0;
            structures.nextId = 1;
          }
          if (recordId >= MAX_STRUCTURES) {
            structures.nextId = (recordId = maxSharedStructures) + 1;
          }
        } else {
          recordId = parentRecordId;
        }
        structures[recordId] = keys;
        if (recordId < maxSharedStructures) {
          target[position2++] = 217;
          target[position2++] = recordId >> 8 | 224;
          target[position2++] = recordId & 255;
          transition = structures.transitions;
          for (let i = 0; i < length; i++) {
            if (transition[RECORD_SYMBOL] === void 0 || transition[RECORD_SYMBOL] & 1048576)
              transition[RECORD_SYMBOL] = recordId;
            transition = transition[keys[i]];
          }
          transition[RECORD_SYMBOL] = recordId | 1048576;
          hasSharedUpdate = true;
        } else {
          transition[RECORD_SYMBOL] = recordId;
          targetView.setUint32(position2, 3655335680);
          position2 += 3;
          if (newTransitions)
            transitionsCount += serializationsSinceTransitionRebuild * newTransitions;
          if (recordIdsToRemove.length >= MAX_STRUCTURES - maxSharedStructures)
            recordIdsToRemove.shift()[RECORD_SYMBOL] = void 0;
          recordIdsToRemove.push(transition);
          writeArrayHeader(length + 2);
          encode3(57344 + recordId);
          encode3(keys);
          if (skipValues) return;
          for (let key in object)
            if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key))
              encode3(object[key]);
          return;
        }
      }
      if (length < 24) {
        target[position2++] = 128 | length;
      } else {
        writeArrayHeader(length);
      }
      if (skipValues) return;
      for (let key in object)
        if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key))
          encode3(object[key]);
    };
    const makeRoom = (end) => {
      let newSize;
      if (end > 16777216) {
        if (end - start > MAX_BUFFER_SIZE)
          throw new Error("Encoded buffer would be larger than maximum buffer size");
        newSize = Math.min(
          MAX_BUFFER_SIZE,
          Math.round(Math.max((end - start) * (end > 67108864 ? 1.25 : 2), 4194304) / 4096) * 4096
        );
      } else
        newSize = (Math.max(end - start << 2, target.length - 1) >> 12) + 1 << 12;
      let newBuffer = new ByteArrayAllocate(newSize);
      targetView = new DataView(newBuffer.buffer, 0, newSize);
      if (target.copy)
        target.copy(newBuffer, 0, start, end);
      else
        newBuffer.set(target.slice(start, end));
      position2 -= start;
      start = 0;
      safeEnd = newBuffer.length - 10;
      return target = newBuffer;
    };
    let chunkThreshold = 100;
    let continuedChunkThreshold = 1e3;
    this.encodeAsIterable = function(value, options2) {
      return startEncoding(value, options2, encodeObjectAsIterable);
    };
    this.encodeAsAsyncIterable = function(value, options2) {
      return startEncoding(value, options2, encodeObjectAsAsyncIterable);
    };
    function* encodeObjectAsIterable(object, iterateProperties, finalIterable) {
      let constructor = object.constructor;
      if (constructor === Object) {
        let useRecords = encoder.useRecords !== false;
        if (useRecords)
          writeObject(object, true);
        else
          writeEntityLength(Object.keys(object).length, 160);
        for (let key in object) {
          let value = object[key];
          if (!useRecords) encode3(key);
          if (value && typeof value === "object") {
            if (iterateProperties[key])
              yield* encodeObjectAsIterable(value, iterateProperties[key]);
            else
              yield* tryEncode(value, iterateProperties, key);
          } else encode3(value);
        }
      } else if (constructor === Array) {
        let length = object.length;
        writeArrayHeader(length);
        for (let i = 0; i < length; i++) {
          let value = object[i];
          if (value && (typeof value === "object" || position2 - start > chunkThreshold)) {
            if (iterateProperties.element)
              yield* encodeObjectAsIterable(value, iterateProperties.element);
            else
              yield* tryEncode(value, iterateProperties, "element");
          } else encode3(value);
        }
      } else if (object[Symbol.iterator] && !object.buffer) {
        target[position2++] = 159;
        for (let value of object) {
          if (value && (typeof value === "object" || position2 - start > chunkThreshold)) {
            if (iterateProperties.element)
              yield* encodeObjectAsIterable(value, iterateProperties.element);
            else
              yield* tryEncode(value, iterateProperties, "element");
          } else encode3(value);
        }
        target[position2++] = 255;
      } else if (isBlob(object)) {
        writeEntityLength(object.size, 64);
        yield target.subarray(start, position2);
        yield object;
        restartEncoding();
      } else if (object[Symbol.asyncIterator]) {
        target[position2++] = 159;
        yield target.subarray(start, position2);
        yield object;
        restartEncoding();
        target[position2++] = 255;
      } else {
        encode3(object);
      }
      if (finalIterable && position2 > start) yield target.subarray(start, position2);
      else if (position2 - start > chunkThreshold) {
        yield target.subarray(start, position2);
        restartEncoding();
      }
    }
    function* tryEncode(value, iterateProperties, key) {
      let restart = position2 - start;
      try {
        encode3(value);
        if (position2 - start > chunkThreshold) {
          yield target.subarray(start, position2);
          restartEncoding();
        }
      } catch (error) {
        if (error.iteratorNotHandled) {
          iterateProperties[key] = {};
          position2 = start + restart;
          yield* encodeObjectAsIterable.call(this, value, iterateProperties[key]);
        } else throw error;
      }
    }
    function restartEncoding() {
      chunkThreshold = continuedChunkThreshold;
      encoder.encode(null, THROW_ON_ITERABLE);
    }
    function startEncoding(value, options2, encodeIterable) {
      if (options2 && options2.chunkThreshold)
        chunkThreshold = continuedChunkThreshold = options2.chunkThreshold;
      else
        chunkThreshold = 100;
      if (value && typeof value === "object") {
        encoder.encode(null, THROW_ON_ITERABLE);
        return encodeIterable(value, encoder.iterateProperties || (encoder.iterateProperties = {}), true);
      }
      return [encoder.encode(value)];
    }
    async function* encodeObjectAsAsyncIterable(value, iterateProperties) {
      for (let encodedValue of encodeObjectAsIterable(value, iterateProperties, true)) {
        let constructor = encodedValue.constructor;
        if (constructor === ByteArray || constructor === Uint8Array)
          yield encodedValue;
        else if (isBlob(encodedValue)) {
          let reader = encodedValue.stream().getReader();
          let next;
          while (!(next = await reader.read()).done) {
            yield next.value;
          }
        } else if (encodedValue[Symbol.asyncIterator]) {
          for await (let asyncValue of encodedValue) {
            restartEncoding();
            if (asyncValue)
              yield* encodeObjectAsAsyncIterable(asyncValue, iterateProperties.async || (iterateProperties.async = {}));
            else yield encoder.encode(asyncValue);
          }
        } else {
          yield encodedValue;
        }
      }
    }
  }
  useBuffer(buffer) {
    target = buffer;
    targetView = new DataView(target.buffer, target.byteOffset, target.byteLength);
    position2 = 0;
  }
  clearSharedData() {
    if (this.structures)
      this.structures = [];
    if (this.sharedValues)
      this.sharedValues = void 0;
  }
  updateSharedData() {
    let lastVersion = this.sharedVersion || 0;
    this.sharedVersion = lastVersion + 1;
    let structuresCopy = this.structures.slice(0);
    let sharedData = new SharedData(structuresCopy, this.sharedValues, this.sharedVersion);
    let saveResults = this.saveShared(
      sharedData,
      (existingShared) => (existingShared && existingShared.version || 0) == lastVersion
    );
    if (saveResults === false) {
      sharedData = this.getShared() || {};
      this.structures = sharedData.structures || [];
      this.sharedValues = sharedData.packedValues;
      this.sharedVersion = sharedData.version;
      this.structures.nextId = this.structures.length;
    } else {
      structuresCopy.forEach((structure, i) => this.structures[i] = structure);
    }
    return saveResults;
  }
};
function writeEntityLength(length, majorValue) {
  if (length < 24)
    target[position2++] = majorValue | length;
  else if (length < 256) {
    target[position2++] = majorValue | 24;
    target[position2++] = length;
  } else if (length < 65536) {
    target[position2++] = majorValue | 25;
    target[position2++] = length >> 8;
    target[position2++] = length & 255;
  } else {
    target[position2++] = majorValue | 26;
    targetView.setUint32(position2, length);
    position2 += 4;
  }
}
var SharedData = class {
  constructor(structures, values, version) {
    this.structures = structures;
    this.packedValues = values;
    this.version = version;
  }
};
function writeArrayHeader(length) {
  if (length < 24)
    target[position2++] = 128 | length;
  else if (length < 256) {
    target[position2++] = 152;
    target[position2++] = length;
  } else if (length < 65536) {
    target[position2++] = 153;
    target[position2++] = length >> 8;
    target[position2++] = length & 255;
  } else {
    target[position2++] = 154;
    targetView.setUint32(position2, length);
    position2 += 4;
  }
}
var BlobConstructor = typeof Blob === "undefined" ? function() {
} : Blob;
function isBlob(object) {
  if (object instanceof BlobConstructor)
    return true;
  let tag = object[Symbol.toStringTag];
  return tag === "Blob" || tag === "File";
}
function findRepetitiveStrings(value, packedValues3) {
  switch (typeof value) {
    case "string":
      if (value.length > 3) {
        if (packedValues3.objectMap[value] > -1 || packedValues3.values.length >= packedValues3.maxValues)
          return;
        let packedStatus = packedValues3.get(value);
        if (packedStatus) {
          if (++packedStatus.count == 2) {
            packedValues3.values.push(value);
          }
        } else {
          packedValues3.set(value, {
            count: 1
          });
          if (packedValues3.samplingPackedValues) {
            let status = packedValues3.samplingPackedValues.get(value);
            if (status)
              status.count++;
            else
              packedValues3.samplingPackedValues.set(value, {
                count: 1
              });
          }
        }
      }
      break;
    case "object":
      if (value) {
        if (value instanceof Array) {
          for (let i = 0, l3 = value.length; i < l3; i++) {
            findRepetitiveStrings(value[i], packedValues3);
          }
        } else {
          let includeKeys = !packedValues3.encoder.useRecords;
          for (var key in value) {
            if (value.hasOwnProperty(key)) {
              if (includeKeys)
                findRepetitiveStrings(key, packedValues3);
              findRepetitiveStrings(value[key], packedValues3);
            }
          }
        }
      }
      break;
    case "function":
      console.log(value);
  }
}
var isLittleEndianMachine2 = new Uint8Array(new Uint16Array([1]).buffer)[0] == 1;
extensionClasses = [
  Date,
  Set,
  Error,
  RegExp,
  Tag,
  ArrayBuffer,
  Uint8Array,
  Uint8ClampedArray,
  Uint16Array,
  Uint32Array,
  typeof BigUint64Array == "undefined" ? function() {
  } : BigUint64Array,
  Int8Array,
  Int16Array,
  Int32Array,
  typeof BigInt64Array == "undefined" ? function() {
  } : BigInt64Array,
  Float32Array,
  Float64Array,
  SharedData
];
extensions = [
  {
    // Date
    tag: 1,
    encode(date, encode3) {
      let seconds = date.getTime() / 1e3;
      if ((this.useTimestamp32 || date.getMilliseconds() === 0) && seconds >= 0 && seconds < 4294967296) {
        target[position2++] = 26;
        targetView.setUint32(position2, seconds);
        position2 += 4;
      } else {
        target[position2++] = 251;
        targetView.setFloat64(position2, seconds);
        position2 += 8;
      }
    }
  },
  {
    // Set
    tag: 258,
    // https://github.com/input-output-hk/cbor-sets-spec/blob/master/CBOR_SETS.md
    encode(set, encode3) {
      let array = Array.from(set);
      encode3(array);
    }
  },
  {
    // Error
    tag: 27,
    // http://cbor.schmorp.de/generic-object
    encode(error, encode3) {
      encode3([error.name, error.message]);
    }
  },
  {
    // RegExp
    tag: 27,
    // http://cbor.schmorp.de/generic-object
    encode(regex, encode3) {
      encode3(["RegExp", regex.source, regex.flags]);
    }
  },
  {
    // Tag
    getTag(tag) {
      return tag.tag;
    },
    encode(tag, encode3) {
      encode3(tag.value);
    }
  },
  {
    // ArrayBuffer
    encode(arrayBuffer, encode3, makeRoom) {
      writeBuffer(arrayBuffer, makeRoom);
    }
  },
  {
    // Uint8Array
    getTag(typedArray) {
      if (typedArray.constructor === Uint8Array) {
        if (this.tagUint8Array || hasNodeBuffer && this.tagUint8Array !== false)
          return 64;
      }
    },
    encode(typedArray, encode3, makeRoom) {
      writeBuffer(typedArray, makeRoom);
    }
  },
  typedArrayEncoder(68, 1),
  typedArrayEncoder(69, 2),
  typedArrayEncoder(70, 4),
  typedArrayEncoder(71, 8),
  typedArrayEncoder(72, 1),
  typedArrayEncoder(77, 2),
  typedArrayEncoder(78, 4),
  typedArrayEncoder(79, 8),
  typedArrayEncoder(85, 4),
  typedArrayEncoder(86, 8),
  {
    encode(sharedData, encode3) {
      let packedValues3 = sharedData.packedValues || [];
      let sharedStructures = sharedData.structures || [];
      if (packedValues3.values.length > 0) {
        target[position2++] = 216;
        target[position2++] = 51;
        writeArrayHeader(4);
        let valuesArray = packedValues3.values;
        encode3(valuesArray);
        writeArrayHeader(0);
        writeArrayHeader(0);
        packedObjectMap = Object.create(sharedPackedObjectMap || null);
        for (let i = 0, l3 = valuesArray.length; i < l3; i++) {
          packedObjectMap[valuesArray[i]] = i;
        }
      }
      if (sharedStructures) {
        targetView.setUint32(position2, 3655335424);
        position2 += 3;
        let definitions = sharedStructures.slice(0);
        definitions.unshift(57344);
        definitions.push(new Tag(sharedData.version, 1399353956));
        encode3(definitions);
      } else
        encode3(new Tag(sharedData.version, 1399353956));
    }
  }
];
function typedArrayEncoder(tag, size) {
  if (!isLittleEndianMachine2 && size > 1)
    tag -= 4;
  return {
    tag,
    encode: function writeExtBuffer(typedArray, encode3) {
      let length = typedArray.byteLength;
      let offset = typedArray.byteOffset || 0;
      let buffer = typedArray.buffer || typedArray;
      encode3(hasNodeBuffer ? Buffer2.from(buffer, offset, length) : new Uint8Array(buffer, offset, length));
    }
  };
}
function writeBuffer(buffer, makeRoom) {
  let length = buffer.byteLength;
  if (length < 24) {
    target[position2++] = 64 + length;
  } else if (length < 256) {
    target[position2++] = 88;
    target[position2++] = length;
  } else if (length < 65536) {
    target[position2++] = 89;
    target[position2++] = length >> 8;
    target[position2++] = length & 255;
  } else {
    target[position2++] = 90;
    targetView.setUint32(position2, length);
    position2 += 4;
  }
  if (position2 + length >= target.length) {
    makeRoom(position2 + length);
  }
  target.set(buffer.buffer ? buffer : new Uint8Array(buffer), position2);
  position2 += length;
}
function insertIds(serialized, idsToInsert) {
  let nextId;
  let distanceToMove = idsToInsert.length * 2;
  let lastEnd = serialized.length - distanceToMove;
  idsToInsert.sort((a, b2) => a.offset > b2.offset ? 1 : -1);
  for (let id = 0; id < idsToInsert.length; id++) {
    let referee = idsToInsert[id];
    referee.id = id;
    for (let position5 of referee.references) {
      serialized[position5++] = id >> 8;
      serialized[position5] = id & 255;
    }
  }
  while (nextId = idsToInsert.pop()) {
    let offset = nextId.offset;
    serialized.copyWithin(offset + distanceToMove, offset, lastEnd);
    distanceToMove -= 2;
    let position5 = offset + distanceToMove;
    serialized[position5++] = 216;
    serialized[position5++] = 28;
    lastEnd = offset;
  }
  return serialized;
}
function writeBundles(start, encode3) {
  targetView.setUint32(bundledStrings2.position + start, position2 - bundledStrings2.position - start + 1);
  let writeStrings = bundledStrings2;
  bundledStrings2 = null;
  encode3(writeStrings[0]);
  encode3(writeStrings[1]);
}
var defaultEncoder = new Encoder({ useRecords: false });
var encode = defaultEncoder.encode;
var encodeAsIterable = defaultEncoder.encodeAsIterable;
var encodeAsAsyncIterable = defaultEncoder.encodeAsAsyncIterable;
var { NEVER, ALWAYS, DECIMAL_ROUND, DECIMAL_FIT } = FLOAT32_OPTIONS;
var REUSE_BUFFER_MODE = 512;
var RESET_BUFFER_MODE = 1024;
var THROW_ON_ITERABLE = 2048;

// wasi/callbuffer.ts
var CallBuffer = class {
  buffer;
  ctrl;
  len;
  data;
  maxData;
  constructor(buf) {
    this.buffer = buf;
    this.ctrl = new Int32Array(this.buffer, 0, 2);
    this.len = new Int32Array(this.buffer, 4, 1);
    this.data = new Uint8Array(this.buffer, 8);
    this.maxData = this.buffer.byteLength - 8 - 16;
  }
  respond(value) {
    let buf;
    if (value instanceof Uint8Array) {
      const limit = Math.min(value.length, this.maxData);
      buf = encode(value.slice(0, limit));
    } else {
      buf = encode(value);
    }
    this.len[0] = buf.length;
    this.data.set(buf, 0);
    Atomics.store(this.ctrl, 0, 1);
    Atomics.notify(this.ctrl, 0);
  }
  call(method, params) {
    this.ctrl[0] = 0;
    params["method"] = method;
    postMessage(params);
    Atomics.wait(this.ctrl, 0, 0);
    return decode(this.data.slice(0, this.len[0]));
  }
};

// node_modules/@bjorn3/browser_wasi_shim/dist/wasi_defs.js
var wasi_defs_exports = {};
__export(wasi_defs_exports, {
  ADVICE_DONTNEED: () => ADVICE_DONTNEED,
  ADVICE_NOREUSE: () => ADVICE_NOREUSE,
  ADVICE_NORMAL: () => ADVICE_NORMAL,
  ADVICE_RANDOM: () => ADVICE_RANDOM,
  ADVICE_SEQUENTIAL: () => ADVICE_SEQUENTIAL,
  ADVICE_WILLNEED: () => ADVICE_WILLNEED,
  CLOCKID_MONOTONIC: () => CLOCKID_MONOTONIC,
  CLOCKID_PROCESS_CPUTIME_ID: () => CLOCKID_PROCESS_CPUTIME_ID,
  CLOCKID_REALTIME: () => CLOCKID_REALTIME,
  CLOCKID_THREAD_CPUTIME_ID: () => CLOCKID_THREAD_CPUTIME_ID,
  Ciovec: () => Ciovec,
  Dirent: () => Dirent,
  ERRNO_2BIG: () => ERRNO_2BIG,
  ERRNO_ACCES: () => ERRNO_ACCES,
  ERRNO_ADDRINUSE: () => ERRNO_ADDRINUSE,
  ERRNO_ADDRNOTAVAIL: () => ERRNO_ADDRNOTAVAIL,
  ERRNO_AFNOSUPPORT: () => ERRNO_AFNOSUPPORT,
  ERRNO_AGAIN: () => ERRNO_AGAIN,
  ERRNO_ALREADY: () => ERRNO_ALREADY,
  ERRNO_BADF: () => ERRNO_BADF,
  ERRNO_BADMSG: () => ERRNO_BADMSG,
  ERRNO_BUSY: () => ERRNO_BUSY,
  ERRNO_CANCELED: () => ERRNO_CANCELED,
  ERRNO_CHILD: () => ERRNO_CHILD,
  ERRNO_CONNABORTED: () => ERRNO_CONNABORTED,
  ERRNO_CONNREFUSED: () => ERRNO_CONNREFUSED,
  ERRNO_CONNRESET: () => ERRNO_CONNRESET,
  ERRNO_DEADLK: () => ERRNO_DEADLK,
  ERRNO_DESTADDRREQ: () => ERRNO_DESTADDRREQ,
  ERRNO_DOM: () => ERRNO_DOM,
  ERRNO_DQUOT: () => ERRNO_DQUOT,
  ERRNO_EXIST: () => ERRNO_EXIST,
  ERRNO_FAULT: () => ERRNO_FAULT,
  ERRNO_FBIG: () => ERRNO_FBIG,
  ERRNO_HOSTUNREACH: () => ERRNO_HOSTUNREACH,
  ERRNO_IDRM: () => ERRNO_IDRM,
  ERRNO_ILSEQ: () => ERRNO_ILSEQ,
  ERRNO_INPROGRESS: () => ERRNO_INPROGRESS,
  ERRNO_INTR: () => ERRNO_INTR,
  ERRNO_INVAL: () => ERRNO_INVAL,
  ERRNO_IO: () => ERRNO_IO,
  ERRNO_ISCONN: () => ERRNO_ISCONN,
  ERRNO_ISDIR: () => ERRNO_ISDIR,
  ERRNO_LOOP: () => ERRNO_LOOP,
  ERRNO_MFILE: () => ERRNO_MFILE,
  ERRNO_MLINK: () => ERRNO_MLINK,
  ERRNO_MSGSIZE: () => ERRNO_MSGSIZE,
  ERRNO_MULTIHOP: () => ERRNO_MULTIHOP,
  ERRNO_NAMETOOLONG: () => ERRNO_NAMETOOLONG,
  ERRNO_NETDOWN: () => ERRNO_NETDOWN,
  ERRNO_NETRESET: () => ERRNO_NETRESET,
  ERRNO_NETUNREACH: () => ERRNO_NETUNREACH,
  ERRNO_NFILE: () => ERRNO_NFILE,
  ERRNO_NOBUFS: () => ERRNO_NOBUFS,
  ERRNO_NODEV: () => ERRNO_NODEV,
  ERRNO_NOENT: () => ERRNO_NOENT,
  ERRNO_NOEXEC: () => ERRNO_NOEXEC,
  ERRNO_NOLCK: () => ERRNO_NOLCK,
  ERRNO_NOLINK: () => ERRNO_NOLINK,
  ERRNO_NOMEM: () => ERRNO_NOMEM,
  ERRNO_NOMSG: () => ERRNO_NOMSG,
  ERRNO_NOPROTOOPT: () => ERRNO_NOPROTOOPT,
  ERRNO_NOSPC: () => ERRNO_NOSPC,
  ERRNO_NOSYS: () => ERRNO_NOSYS,
  ERRNO_NOTCAPABLE: () => ERRNO_NOTCAPABLE,
  ERRNO_NOTCONN: () => ERRNO_NOTCONN,
  ERRNO_NOTDIR: () => ERRNO_NOTDIR,
  ERRNO_NOTEMPTY: () => ERRNO_NOTEMPTY,
  ERRNO_NOTRECOVERABLE: () => ERRNO_NOTRECOVERABLE,
  ERRNO_NOTSOCK: () => ERRNO_NOTSOCK,
  ERRNO_NOTSUP: () => ERRNO_NOTSUP,
  ERRNO_NOTTY: () => ERRNO_NOTTY,
  ERRNO_NXIO: () => ERRNO_NXIO,
  ERRNO_OVERFLOW: () => ERRNO_OVERFLOW,
  ERRNO_OWNERDEAD: () => ERRNO_OWNERDEAD,
  ERRNO_PERM: () => ERRNO_PERM,
  ERRNO_PIPE: () => ERRNO_PIPE,
  ERRNO_PROTO: () => ERRNO_PROTO,
  ERRNO_PROTONOSUPPORT: () => ERRNO_PROTONOSUPPORT,
  ERRNO_PROTOTYPE: () => ERRNO_PROTOTYPE,
  ERRNO_RANGE: () => ERRNO_RANGE,
  ERRNO_ROFS: () => ERRNO_ROFS,
  ERRNO_SPIPE: () => ERRNO_SPIPE,
  ERRNO_SRCH: () => ERRNO_SRCH,
  ERRNO_STALE: () => ERRNO_STALE,
  ERRNO_SUCCESS: () => ERRNO_SUCCESS,
  ERRNO_TIMEDOUT: () => ERRNO_TIMEDOUT,
  ERRNO_TXTBSY: () => ERRNO_TXTBSY,
  ERRNO_XDEV: () => ERRNO_XDEV,
  EVENTRWFLAGS_FD_READWRITE_HANGUP: () => EVENTRWFLAGS_FD_READWRITE_HANGUP,
  EVENTTYPE_CLOCK: () => EVENTTYPE_CLOCK,
  EVENTTYPE_FD_READ: () => EVENTTYPE_FD_READ,
  EVENTTYPE_FD_WRITE: () => EVENTTYPE_FD_WRITE,
  Event: () => Event,
  FDFLAGS_APPEND: () => FDFLAGS_APPEND,
  FDFLAGS_DSYNC: () => FDFLAGS_DSYNC,
  FDFLAGS_NONBLOCK: () => FDFLAGS_NONBLOCK,
  FDFLAGS_RSYNC: () => FDFLAGS_RSYNC,
  FDFLAGS_SYNC: () => FDFLAGS_SYNC,
  FD_STDERR: () => FD_STDERR,
  FD_STDIN: () => FD_STDIN,
  FD_STDOUT: () => FD_STDOUT,
  FILETYPE_BLOCK_DEVICE: () => FILETYPE_BLOCK_DEVICE,
  FILETYPE_CHARACTER_DEVICE: () => FILETYPE_CHARACTER_DEVICE,
  FILETYPE_DIRECTORY: () => FILETYPE_DIRECTORY,
  FILETYPE_REGULAR_FILE: () => FILETYPE_REGULAR_FILE,
  FILETYPE_SOCKET_DGRAM: () => FILETYPE_SOCKET_DGRAM,
  FILETYPE_SOCKET_STREAM: () => FILETYPE_SOCKET_STREAM,
  FILETYPE_SYMBOLIC_LINK: () => FILETYPE_SYMBOLIC_LINK,
  FILETYPE_UNKNOWN: () => FILETYPE_UNKNOWN,
  FSTFLAGS_ATIM: () => FSTFLAGS_ATIM,
  FSTFLAGS_ATIM_NOW: () => FSTFLAGS_ATIM_NOW,
  FSTFLAGS_MTIM: () => FSTFLAGS_MTIM,
  FSTFLAGS_MTIM_NOW: () => FSTFLAGS_MTIM_NOW,
  Fdstat: () => Fdstat,
  Filestat: () => Filestat,
  Iovec: () => Iovec,
  OFLAGS_CREAT: () => OFLAGS_CREAT,
  OFLAGS_DIRECTORY: () => OFLAGS_DIRECTORY,
  OFLAGS_EXCL: () => OFLAGS_EXCL,
  OFLAGS_TRUNC: () => OFLAGS_TRUNC,
  PREOPENTYPE_DIR: () => PREOPENTYPE_DIR,
  Prestat: () => Prestat,
  PrestatDir: () => PrestatDir,
  RIFLAGS_RECV_PEEK: () => RIFLAGS_RECV_PEEK,
  RIFLAGS_RECV_WAITALL: () => RIFLAGS_RECV_WAITALL,
  RIGHTS_FD_ADVISE: () => RIGHTS_FD_ADVISE,
  RIGHTS_FD_ALLOCATE: () => RIGHTS_FD_ALLOCATE,
  RIGHTS_FD_DATASYNC: () => RIGHTS_FD_DATASYNC,
  RIGHTS_FD_FDSTAT_SET_FLAGS: () => RIGHTS_FD_FDSTAT_SET_FLAGS,
  RIGHTS_FD_FILESTAT_GET: () => RIGHTS_FD_FILESTAT_GET,
  RIGHTS_FD_FILESTAT_SET_SIZE: () => RIGHTS_FD_FILESTAT_SET_SIZE,
  RIGHTS_FD_FILESTAT_SET_TIMES: () => RIGHTS_FD_FILESTAT_SET_TIMES,
  RIGHTS_FD_READ: () => RIGHTS_FD_READ,
  RIGHTS_FD_READDIR: () => RIGHTS_FD_READDIR,
  RIGHTS_FD_SEEK: () => RIGHTS_FD_SEEK,
  RIGHTS_FD_SYNC: () => RIGHTS_FD_SYNC,
  RIGHTS_FD_TELL: () => RIGHTS_FD_TELL,
  RIGHTS_FD_WRITE: () => RIGHTS_FD_WRITE,
  RIGHTS_PATH_CREATE_DIRECTORY: () => RIGHTS_PATH_CREATE_DIRECTORY,
  RIGHTS_PATH_CREATE_FILE: () => RIGHTS_PATH_CREATE_FILE,
  RIGHTS_PATH_FILESTAT_GET: () => RIGHTS_PATH_FILESTAT_GET,
  RIGHTS_PATH_FILESTAT_SET_SIZE: () => RIGHTS_PATH_FILESTAT_SET_SIZE,
  RIGHTS_PATH_FILESTAT_SET_TIMES: () => RIGHTS_PATH_FILESTAT_SET_TIMES,
  RIGHTS_PATH_LINK_SOURCE: () => RIGHTS_PATH_LINK_SOURCE,
  RIGHTS_PATH_LINK_TARGET: () => RIGHTS_PATH_LINK_TARGET,
  RIGHTS_PATH_OPEN: () => RIGHTS_PATH_OPEN,
  RIGHTS_PATH_READLINK: () => RIGHTS_PATH_READLINK,
  RIGHTS_PATH_REMOVE_DIRECTORY: () => RIGHTS_PATH_REMOVE_DIRECTORY,
  RIGHTS_PATH_RENAME_SOURCE: () => RIGHTS_PATH_RENAME_SOURCE,
  RIGHTS_PATH_RENAME_TARGET: () => RIGHTS_PATH_RENAME_TARGET,
  RIGHTS_PATH_SYMLINK: () => RIGHTS_PATH_SYMLINK,
  RIGHTS_PATH_UNLINK_FILE: () => RIGHTS_PATH_UNLINK_FILE,
  RIGHTS_POLL_FD_READWRITE: () => RIGHTS_POLL_FD_READWRITE,
  RIGHTS_SOCK_SHUTDOWN: () => RIGHTS_SOCK_SHUTDOWN,
  ROFLAGS_RECV_DATA_TRUNCATED: () => ROFLAGS_RECV_DATA_TRUNCATED,
  SDFLAGS_RD: () => SDFLAGS_RD,
  SDFLAGS_WR: () => SDFLAGS_WR,
  SIGNAL_ABRT: () => SIGNAL_ABRT,
  SIGNAL_ALRM: () => SIGNAL_ALRM,
  SIGNAL_BUS: () => SIGNAL_BUS,
  SIGNAL_CHLD: () => SIGNAL_CHLD,
  SIGNAL_CONT: () => SIGNAL_CONT,
  SIGNAL_FPE: () => SIGNAL_FPE,
  SIGNAL_HUP: () => SIGNAL_HUP,
  SIGNAL_ILL: () => SIGNAL_ILL,
  SIGNAL_INT: () => SIGNAL_INT,
  SIGNAL_KILL: () => SIGNAL_KILL,
  SIGNAL_NONE: () => SIGNAL_NONE,
  SIGNAL_PIPE: () => SIGNAL_PIPE,
  SIGNAL_POLL: () => SIGNAL_POLL,
  SIGNAL_PROF: () => SIGNAL_PROF,
  SIGNAL_PWR: () => SIGNAL_PWR,
  SIGNAL_QUIT: () => SIGNAL_QUIT,
  SIGNAL_SEGV: () => SIGNAL_SEGV,
  SIGNAL_STOP: () => SIGNAL_STOP,
  SIGNAL_SYS: () => SIGNAL_SYS,
  SIGNAL_TERM: () => SIGNAL_TERM,
  SIGNAL_TRAP: () => SIGNAL_TRAP,
  SIGNAL_TSTP: () => SIGNAL_TSTP,
  SIGNAL_TTIN: () => SIGNAL_TTIN,
  SIGNAL_TTOU: () => SIGNAL_TTOU,
  SIGNAL_URG: () => SIGNAL_URG,
  SIGNAL_USR1: () => SIGNAL_USR1,
  SIGNAL_USR2: () => SIGNAL_USR2,
  SIGNAL_VTALRM: () => SIGNAL_VTALRM,
  SIGNAL_WINCH: () => SIGNAL_WINCH,
  SIGNAL_XCPU: () => SIGNAL_XCPU,
  SIGNAL_XFSZ: () => SIGNAL_XFSZ,
  SUBCLOCKFLAGS_SUBSCRIPTION_CLOCK_ABSTIME: () => SUBCLOCKFLAGS_SUBSCRIPTION_CLOCK_ABSTIME,
  Subscription: () => Subscription,
  WHENCE_CUR: () => WHENCE_CUR,
  WHENCE_END: () => WHENCE_END,
  WHENCE_SET: () => WHENCE_SET
});
var FD_STDIN = 0;
var FD_STDOUT = 1;
var FD_STDERR = 2;
var CLOCKID_REALTIME = 0;
var CLOCKID_MONOTONIC = 1;
var CLOCKID_PROCESS_CPUTIME_ID = 2;
var CLOCKID_THREAD_CPUTIME_ID = 3;
var ERRNO_SUCCESS = 0;
var ERRNO_2BIG = 1;
var ERRNO_ACCES = 2;
var ERRNO_ADDRINUSE = 3;
var ERRNO_ADDRNOTAVAIL = 4;
var ERRNO_AFNOSUPPORT = 5;
var ERRNO_AGAIN = 6;
var ERRNO_ALREADY = 7;
var ERRNO_BADF = 8;
var ERRNO_BADMSG = 9;
var ERRNO_BUSY = 10;
var ERRNO_CANCELED = 11;
var ERRNO_CHILD = 12;
var ERRNO_CONNABORTED = 13;
var ERRNO_CONNREFUSED = 14;
var ERRNO_CONNRESET = 15;
var ERRNO_DEADLK = 16;
var ERRNO_DESTADDRREQ = 17;
var ERRNO_DOM = 18;
var ERRNO_DQUOT = 19;
var ERRNO_EXIST = 20;
var ERRNO_FAULT = 21;
var ERRNO_FBIG = 22;
var ERRNO_HOSTUNREACH = 23;
var ERRNO_IDRM = 24;
var ERRNO_ILSEQ = 25;
var ERRNO_INPROGRESS = 26;
var ERRNO_INTR = 27;
var ERRNO_INVAL = 28;
var ERRNO_IO = 29;
var ERRNO_ISCONN = 30;
var ERRNO_ISDIR = 31;
var ERRNO_LOOP = 32;
var ERRNO_MFILE = 33;
var ERRNO_MLINK = 34;
var ERRNO_MSGSIZE = 35;
var ERRNO_MULTIHOP = 36;
var ERRNO_NAMETOOLONG = 37;
var ERRNO_NETDOWN = 38;
var ERRNO_NETRESET = 39;
var ERRNO_NETUNREACH = 40;
var ERRNO_NFILE = 41;
var ERRNO_NOBUFS = 42;
var ERRNO_NODEV = 43;
var ERRNO_NOENT = 44;
var ERRNO_NOEXEC = 45;
var ERRNO_NOLCK = 46;
var ERRNO_NOLINK = 47;
var ERRNO_NOMEM = 48;
var ERRNO_NOMSG = 49;
var ERRNO_NOPROTOOPT = 50;
var ERRNO_NOSPC = 51;
var ERRNO_NOSYS = 52;
var ERRNO_NOTCONN = 53;
var ERRNO_NOTDIR = 54;
var ERRNO_NOTEMPTY = 55;
var ERRNO_NOTRECOVERABLE = 56;
var ERRNO_NOTSOCK = 57;
var ERRNO_NOTSUP = 58;
var ERRNO_NOTTY = 59;
var ERRNO_NXIO = 60;
var ERRNO_OVERFLOW = 61;
var ERRNO_OWNERDEAD = 62;
var ERRNO_PERM = 63;
var ERRNO_PIPE = 64;
var ERRNO_PROTO = 65;
var ERRNO_PROTONOSUPPORT = 66;
var ERRNO_PROTOTYPE = 67;
var ERRNO_RANGE = 68;
var ERRNO_ROFS = 69;
var ERRNO_SPIPE = 70;
var ERRNO_SRCH = 71;
var ERRNO_STALE = 72;
var ERRNO_TIMEDOUT = 73;
var ERRNO_TXTBSY = 74;
var ERRNO_XDEV = 75;
var ERRNO_NOTCAPABLE = 76;
var RIGHTS_FD_DATASYNC = 1 << 0;
var RIGHTS_FD_READ = 1 << 1;
var RIGHTS_FD_SEEK = 1 << 2;
var RIGHTS_FD_FDSTAT_SET_FLAGS = 1 << 3;
var RIGHTS_FD_SYNC = 1 << 4;
var RIGHTS_FD_TELL = 1 << 5;
var RIGHTS_FD_WRITE = 1 << 6;
var RIGHTS_FD_ADVISE = 1 << 7;
var RIGHTS_FD_ALLOCATE = 1 << 8;
var RIGHTS_PATH_CREATE_DIRECTORY = 1 << 9;
var RIGHTS_PATH_CREATE_FILE = 1 << 10;
var RIGHTS_PATH_LINK_SOURCE = 1 << 11;
var RIGHTS_PATH_LINK_TARGET = 1 << 12;
var RIGHTS_PATH_OPEN = 1 << 13;
var RIGHTS_FD_READDIR = 1 << 14;
var RIGHTS_PATH_READLINK = 1 << 15;
var RIGHTS_PATH_RENAME_SOURCE = 1 << 16;
var RIGHTS_PATH_RENAME_TARGET = 1 << 17;
var RIGHTS_PATH_FILESTAT_GET = 1 << 18;
var RIGHTS_PATH_FILESTAT_SET_SIZE = 1 << 19;
var RIGHTS_PATH_FILESTAT_SET_TIMES = 1 << 20;
var RIGHTS_FD_FILESTAT_GET = 1 << 21;
var RIGHTS_FD_FILESTAT_SET_SIZE = 1 << 22;
var RIGHTS_FD_FILESTAT_SET_TIMES = 1 << 23;
var RIGHTS_PATH_SYMLINK = 1 << 24;
var RIGHTS_PATH_REMOVE_DIRECTORY = 1 << 25;
var RIGHTS_PATH_UNLINK_FILE = 1 << 26;
var RIGHTS_POLL_FD_READWRITE = 1 << 27;
var RIGHTS_SOCK_SHUTDOWN = 1 << 28;
var Iovec = class _Iovec {
  static read_bytes(view, ptr) {
    const iovec = new _Iovec();
    iovec.buf = view.getUint32(ptr, true);
    iovec.buf_len = view.getUint32(ptr + 4, true);
    return iovec;
  }
  static read_bytes_array(view, ptr, len) {
    const iovecs = [];
    for (let i = 0; i < len; i++) {
      iovecs.push(_Iovec.read_bytes(view, ptr + 8 * i));
    }
    return iovecs;
  }
};
var Ciovec = class _Ciovec {
  static read_bytes(view, ptr) {
    const iovec = new _Ciovec();
    iovec.buf = view.getUint32(ptr, true);
    iovec.buf_len = view.getUint32(ptr + 4, true);
    return iovec;
  }
  static read_bytes_array(view, ptr, len) {
    const iovecs = [];
    for (let i = 0; i < len; i++) {
      iovecs.push(_Ciovec.read_bytes(view, ptr + 8 * i));
    }
    return iovecs;
  }
};
var WHENCE_SET = 0;
var WHENCE_CUR = 1;
var WHENCE_END = 2;
var FILETYPE_UNKNOWN = 0;
var FILETYPE_BLOCK_DEVICE = 1;
var FILETYPE_CHARACTER_DEVICE = 2;
var FILETYPE_DIRECTORY = 3;
var FILETYPE_REGULAR_FILE = 4;
var FILETYPE_SOCKET_DGRAM = 5;
var FILETYPE_SOCKET_STREAM = 6;
var FILETYPE_SYMBOLIC_LINK = 7;
var Dirent = class {
  head_length() {
    return 24;
  }
  name_length() {
    return this.dir_name.byteLength;
  }
  write_head_bytes(view, ptr) {
    view.setBigUint64(ptr, this.d_next, true);
    view.setBigUint64(ptr + 8, this.d_ino, true);
    view.setUint32(ptr + 16, this.dir_name.length, true);
    view.setUint8(ptr + 20, this.d_type);
  }
  write_name_bytes(view8, ptr, buf_len) {
    view8.set(this.dir_name.slice(0, Math.min(this.dir_name.byteLength, buf_len)), ptr);
  }
  constructor(next_cookie, d_ino, name, type) {
    const encoded_name = new TextEncoder().encode(name);
    this.d_next = next_cookie;
    this.d_ino = d_ino;
    this.d_namlen = encoded_name.byteLength;
    this.d_type = type;
    this.dir_name = encoded_name;
  }
};
var ADVICE_NORMAL = 0;
var ADVICE_SEQUENTIAL = 1;
var ADVICE_RANDOM = 2;
var ADVICE_WILLNEED = 3;
var ADVICE_DONTNEED = 4;
var ADVICE_NOREUSE = 5;
var FDFLAGS_APPEND = 1 << 0;
var FDFLAGS_DSYNC = 1 << 1;
var FDFLAGS_NONBLOCK = 1 << 2;
var FDFLAGS_RSYNC = 1 << 3;
var FDFLAGS_SYNC = 1 << 4;
var Fdstat = class {
  write_bytes(view, ptr) {
    view.setUint8(ptr, this.fs_filetype);
    view.setUint16(ptr + 2, this.fs_flags, true);
    view.setBigUint64(ptr + 8, this.fs_rights_base, true);
    view.setBigUint64(ptr + 16, this.fs_rights_inherited, true);
  }
  constructor(filetype, flags) {
    this.fs_rights_base = 0n;
    this.fs_rights_inherited = 0n;
    this.fs_filetype = filetype;
    this.fs_flags = flags;
  }
};
var FSTFLAGS_ATIM = 1 << 0;
var FSTFLAGS_ATIM_NOW = 1 << 1;
var FSTFLAGS_MTIM = 1 << 2;
var FSTFLAGS_MTIM_NOW = 1 << 3;
var OFLAGS_CREAT = 1 << 0;
var OFLAGS_DIRECTORY = 1 << 1;
var OFLAGS_EXCL = 1 << 2;
var OFLAGS_TRUNC = 1 << 3;
var Filestat = class {
  write_bytes(view, ptr) {
    view.setBigUint64(ptr, this.dev, true);
    view.setBigUint64(ptr + 8, this.ino, true);
    view.setUint8(ptr + 16, this.filetype);
    view.setBigUint64(ptr + 24, this.nlink, true);
    view.setBigUint64(ptr + 32, this.size, true);
    view.setBigUint64(ptr + 38, this.atim, true);
    view.setBigUint64(ptr + 46, this.mtim, true);
    view.setBigUint64(ptr + 52, this.ctim, true);
  }
  constructor(ino, filetype, size) {
    this.dev = 0n;
    this.nlink = 0n;
    this.atim = 0n;
    this.mtim = 0n;
    this.ctim = 0n;
    this.ino = ino;
    this.filetype = filetype;
    this.size = size;
  }
};
var EVENTTYPE_CLOCK = 0;
var EVENTTYPE_FD_READ = 1;
var EVENTTYPE_FD_WRITE = 2;
var EVENTRWFLAGS_FD_READWRITE_HANGUP = 1 << 0;
var SUBCLOCKFLAGS_SUBSCRIPTION_CLOCK_ABSTIME = 1 << 0;
var Subscription = class _Subscription {
  static read_bytes(view, ptr) {
    return new _Subscription(view.getBigUint64(ptr, true), view.getUint8(ptr + 8), view.getUint32(ptr + 16, true), view.getBigUint64(ptr + 24, true), view.getUint16(ptr + 36, true));
  }
  constructor(userdata, eventtype, clockid, timeout, flags) {
    this.userdata = userdata;
    this.eventtype = eventtype;
    this.clockid = clockid;
    this.timeout = timeout;
    this.flags = flags;
  }
};
var Event = class {
  write_bytes(view, ptr) {
    view.setBigUint64(ptr, this.userdata, true);
    view.setUint16(ptr + 8, this.error, true);
    view.setUint8(ptr + 10, this.eventtype);
  }
  constructor(userdata, error, eventtype) {
    this.userdata = userdata;
    this.error = error;
    this.eventtype = eventtype;
  }
};
var SIGNAL_NONE = 0;
var SIGNAL_HUP = 1;
var SIGNAL_INT = 2;
var SIGNAL_QUIT = 3;
var SIGNAL_ILL = 4;
var SIGNAL_TRAP = 5;
var SIGNAL_ABRT = 6;
var SIGNAL_BUS = 7;
var SIGNAL_FPE = 8;
var SIGNAL_KILL = 9;
var SIGNAL_USR1 = 10;
var SIGNAL_SEGV = 11;
var SIGNAL_USR2 = 12;
var SIGNAL_PIPE = 13;
var SIGNAL_ALRM = 14;
var SIGNAL_TERM = 15;
var SIGNAL_CHLD = 16;
var SIGNAL_CONT = 17;
var SIGNAL_STOP = 18;
var SIGNAL_TSTP = 19;
var SIGNAL_TTIN = 20;
var SIGNAL_TTOU = 21;
var SIGNAL_URG = 22;
var SIGNAL_XCPU = 23;
var SIGNAL_XFSZ = 24;
var SIGNAL_VTALRM = 25;
var SIGNAL_PROF = 26;
var SIGNAL_WINCH = 27;
var SIGNAL_POLL = 28;
var SIGNAL_PWR = 29;
var SIGNAL_SYS = 30;
var RIFLAGS_RECV_PEEK = 1 << 0;
var RIFLAGS_RECV_WAITALL = 1 << 1;
var ROFLAGS_RECV_DATA_TRUNCATED = 1 << 0;
var SDFLAGS_RD = 1 << 0;
var SDFLAGS_WR = 1 << 1;
var PREOPENTYPE_DIR = 0;
var PrestatDir = class {
  write_bytes(view, ptr) {
    view.setUint32(ptr, this.pr_name.byteLength, true);
  }
  constructor(name) {
    this.pr_name = new TextEncoder().encode(name);
  }
};
var Prestat = class _Prestat {
  static dir(name) {
    const prestat = new _Prestat();
    prestat.tag = PREOPENTYPE_DIR;
    prestat.inner = new PrestatDir(name);
    return prestat;
  }
  write_bytes(view, ptr) {
    view.setUint32(ptr, this.tag, true);
    this.inner.write_bytes(view, ptr + 4);
  }
};

// node_modules/@bjorn3/browser_wasi_shim/dist/debug.js
var Debug = class Debug2 {
  enable(enabled) {
    this.log = createLogger(enabled === void 0 ? true : enabled, this.prefix);
  }
  get enabled() {
    return this.isEnabled;
  }
  constructor(isEnabled) {
    this.isEnabled = isEnabled;
    this.prefix = "wasi:";
    this.enable(isEnabled);
  }
};
function createLogger(enabled, prefix) {
  if (enabled) {
    const a = console.log.bind(console, "%c%s", "color: #265BA0", prefix);
    return a;
  } else {
    return () => {
    };
  }
}
var debug = new Debug(false);

// node_modules/@bjorn3/browser_wasi_shim/dist/wasi.js
var WASIProcExit = class extends Error {
  constructor(code) {
    super("exit with exit code " + code);
    this.code = code;
  }
};
var WASI = class WASI2 {
  start(instance) {
    this.inst = instance;
    try {
      instance.exports._start();
      return 0;
    } catch (e) {
      if (e instanceof WASIProcExit) {
        return e.code;
      } else {
        throw e;
      }
    }
  }
  initialize(instance) {
    this.inst = instance;
    if (instance.exports._initialize) {
      instance.exports._initialize();
    }
  }
  constructor(args, env, fds, options = {}) {
    this.args = [];
    this.env = [];
    this.fds = [];
    debug.enable(options.debug);
    this.args = args;
    this.env = env;
    this.fds = fds;
    const self = this;
    this.wasiImport = { args_sizes_get(argc, argv_buf_size) {
      const buffer = new DataView(self.inst.exports.memory.buffer);
      buffer.setUint32(argc, self.args.length, true);
      let buf_size = 0;
      for (const arg of self.args) {
        buf_size += arg.length + 1;
      }
      buffer.setUint32(argv_buf_size, buf_size, true);
      debug.log(buffer.getUint32(argc, true), buffer.getUint32(argv_buf_size, true));
      return 0;
    }, args_get(argv, argv_buf) {
      const buffer = new DataView(self.inst.exports.memory.buffer);
      const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
      const orig_argv_buf = argv_buf;
      for (let i = 0; i < self.args.length; i++) {
        buffer.setUint32(argv, argv_buf, true);
        argv += 4;
        const arg = new TextEncoder().encode(self.args[i]);
        buffer8.set(arg, argv_buf);
        buffer.setUint8(argv_buf + arg.length, 0);
        argv_buf += arg.length + 1;
      }
      if (debug.enabled) {
        debug.log(new TextDecoder("utf-8").decode(buffer8.slice(orig_argv_buf, argv_buf)));
      }
      return 0;
    }, environ_sizes_get(environ_count, environ_size) {
      const buffer = new DataView(self.inst.exports.memory.buffer);
      buffer.setUint32(environ_count, self.env.length, true);
      let buf_size = 0;
      for (const environ of self.env) {
        buf_size += new TextEncoder().encode(environ).length + 1;
      }
      buffer.setUint32(environ_size, buf_size, true);
      debug.log(buffer.getUint32(environ_count, true), buffer.getUint32(environ_size, true));
      return 0;
    }, environ_get(environ, environ_buf) {
      const buffer = new DataView(self.inst.exports.memory.buffer);
      const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
      const orig_environ_buf = environ_buf;
      for (let i = 0; i < self.env.length; i++) {
        buffer.setUint32(environ, environ_buf, true);
        environ += 4;
        const e = new TextEncoder().encode(self.env[i]);
        buffer8.set(e, environ_buf);
        buffer.setUint8(environ_buf + e.length, 0);
        environ_buf += e.length + 1;
      }
      if (debug.enabled) {
        debug.log(new TextDecoder("utf-8").decode(buffer8.slice(orig_environ_buf, environ_buf)));
      }
      return 0;
    }, clock_res_get(id, res_ptr) {
      let resolutionValue;
      switch (id) {
        case CLOCKID_MONOTONIC: {
          resolutionValue = 5000n;
          break;
        }
        case CLOCKID_REALTIME: {
          resolutionValue = 1000000n;
          break;
        }
        default:
          return ERRNO_NOSYS;
      }
      const view = new DataView(self.inst.exports.memory.buffer);
      view.setBigUint64(res_ptr, resolutionValue, true);
      return ERRNO_SUCCESS;
    }, clock_time_get(id, precision, time) {
      const buffer = new DataView(self.inst.exports.memory.buffer);
      if (id === CLOCKID_REALTIME) {
        buffer.setBigUint64(time, BigInt((/* @__PURE__ */ new Date()).getTime()) * 1000000n, true);
      } else if (id == CLOCKID_MONOTONIC) {
        let monotonic_time;
        try {
          monotonic_time = BigInt(Math.round(performance.now() * 1e6));
        } catch (e) {
          monotonic_time = 0n;
        }
        buffer.setBigUint64(time, monotonic_time, true);
      } else {
        buffer.setBigUint64(time, 0n, true);
      }
      return 0;
    }, fd_advise(fd, offset, len, advice) {
      if (self.fds[fd] != void 0) {
        return ERRNO_SUCCESS;
      } else {
        return ERRNO_BADF;
      }
    }, fd_allocate(fd, offset, len) {
      if (self.fds[fd] != void 0) {
        return self.fds[fd].fd_allocate(offset, len);
      } else {
        return ERRNO_BADF;
      }
    }, fd_close(fd) {
      if (self.fds[fd] != void 0) {
        const ret = self.fds[fd].fd_close();
        self.fds[fd] = void 0;
        return ret;
      } else {
        return ERRNO_BADF;
      }
    }, fd_datasync(fd) {
      if (self.fds[fd] != void 0) {
        return self.fds[fd].fd_sync();
      } else {
        return ERRNO_BADF;
      }
    }, fd_fdstat_get(fd, fdstat_ptr) {
      if (self.fds[fd] != void 0) {
        const { ret, fdstat } = self.fds[fd].fd_fdstat_get();
        if (fdstat != null) {
          fdstat.write_bytes(new DataView(self.inst.exports.memory.buffer), fdstat_ptr);
        }
        return ret;
      } else {
        return ERRNO_BADF;
      }
    }, fd_fdstat_set_flags(fd, flags) {
      if (self.fds[fd] != void 0) {
        return self.fds[fd].fd_fdstat_set_flags(flags);
      } else {
        return ERRNO_BADF;
      }
    }, fd_fdstat_set_rights(fd, fs_rights_base, fs_rights_inheriting) {
      if (self.fds[fd] != void 0) {
        return self.fds[fd].fd_fdstat_set_rights(fs_rights_base, fs_rights_inheriting);
      } else {
        return ERRNO_BADF;
      }
    }, fd_filestat_get(fd, filestat_ptr) {
      if (self.fds[fd] != void 0) {
        const { ret, filestat } = self.fds[fd].fd_filestat_get();
        if (filestat != null) {
          filestat.write_bytes(new DataView(self.inst.exports.memory.buffer), filestat_ptr);
        }
        return ret;
      } else {
        return ERRNO_BADF;
      }
    }, fd_filestat_set_size(fd, size) {
      if (self.fds[fd] != void 0) {
        return self.fds[fd].fd_filestat_set_size(size);
      } else {
        return ERRNO_BADF;
      }
    }, fd_filestat_set_times(fd, atim, mtim, fst_flags) {
      if (self.fds[fd] != void 0) {
        return self.fds[fd].fd_filestat_set_times(atim, mtim, fst_flags);
      } else {
        return ERRNO_BADF;
      }
    }, fd_pread(fd, iovs_ptr, iovs_len, offset, nread_ptr) {
      const buffer = new DataView(self.inst.exports.memory.buffer);
      const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
      if (self.fds[fd] != void 0) {
        const iovecs = Iovec.read_bytes_array(buffer, iovs_ptr, iovs_len);
        let nread = 0;
        for (const iovec of iovecs) {
          const { ret, data } = self.fds[fd].fd_pread(iovec.buf_len, offset);
          if (ret != ERRNO_SUCCESS) {
            buffer.setUint32(nread_ptr, nread, true);
            return ret;
          }
          buffer8.set(data, iovec.buf);
          nread += data.length;
          offset += BigInt(data.length);
          if (data.length != iovec.buf_len) {
            break;
          }
        }
        buffer.setUint32(nread_ptr, nread, true);
        return ERRNO_SUCCESS;
      } else {
        return ERRNO_BADF;
      }
    }, fd_prestat_get(fd, buf_ptr) {
      const buffer = new DataView(self.inst.exports.memory.buffer);
      if (self.fds[fd] != void 0) {
        const { ret, prestat } = self.fds[fd].fd_prestat_get();
        if (prestat != null) {
          prestat.write_bytes(buffer, buf_ptr);
        }
        return ret;
      } else {
        return ERRNO_BADF;
      }
    }, fd_prestat_dir_name(fd, path_ptr, path_len) {
      if (self.fds[fd] != void 0) {
        const { ret, prestat } = self.fds[fd].fd_prestat_get();
        if (prestat == null) {
          return ret;
        }
        const prestat_dir_name = prestat.inner.pr_name;
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        buffer8.set(prestat_dir_name.slice(0, path_len), path_ptr);
        return prestat_dir_name.byteLength > path_len ? ERRNO_NAMETOOLONG : ERRNO_SUCCESS;
      } else {
        return ERRNO_BADF;
      }
    }, fd_pwrite(fd, iovs_ptr, iovs_len, offset, nwritten_ptr) {
      const buffer = new DataView(self.inst.exports.memory.buffer);
      const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
      if (self.fds[fd] != void 0) {
        const iovecs = Ciovec.read_bytes_array(buffer, iovs_ptr, iovs_len);
        let nwritten = 0;
        for (const iovec of iovecs) {
          const data = buffer8.slice(iovec.buf, iovec.buf + iovec.buf_len);
          const { ret, nwritten: nwritten_part } = self.fds[fd].fd_pwrite(data, offset);
          if (ret != ERRNO_SUCCESS) {
            buffer.setUint32(nwritten_ptr, nwritten, true);
            return ret;
          }
          nwritten += nwritten_part;
          offset += BigInt(nwritten_part);
          if (nwritten_part != data.byteLength) {
            break;
          }
        }
        buffer.setUint32(nwritten_ptr, nwritten, true);
        return ERRNO_SUCCESS;
      } else {
        return ERRNO_BADF;
      }
    }, fd_read(fd, iovs_ptr, iovs_len, nread_ptr) {
      const buffer = new DataView(self.inst.exports.memory.buffer);
      const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
      if (self.fds[fd] != void 0) {
        const iovecs = Iovec.read_bytes_array(buffer, iovs_ptr, iovs_len);
        let nread = 0;
        for (const iovec of iovecs) {
          const { ret, data } = self.fds[fd].fd_read(iovec.buf_len);
          if (ret != ERRNO_SUCCESS) {
            buffer.setUint32(nread_ptr, nread, true);
            return ret;
          }
          buffer8.set(data, iovec.buf);
          nread += data.length;
          if (data.length != iovec.buf_len) {
            break;
          }
        }
        buffer.setUint32(nread_ptr, nread, true);
        return ERRNO_SUCCESS;
      } else {
        return ERRNO_BADF;
      }
    }, fd_readdir(fd, buf, buf_len, cookie, bufused_ptr) {
      const buffer = new DataView(self.inst.exports.memory.buffer);
      const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
      if (self.fds[fd] != void 0) {
        let bufused = 0;
        while (true) {
          const { ret, dirent } = self.fds[fd].fd_readdir_single(cookie);
          if (ret != 0) {
            buffer.setUint32(bufused_ptr, bufused, true);
            return ret;
          }
          if (dirent == null) {
            break;
          }
          if (buf_len - bufused < dirent.head_length()) {
            bufused = buf_len;
            break;
          }
          const head_bytes = new ArrayBuffer(dirent.head_length());
          dirent.write_head_bytes(new DataView(head_bytes), 0);
          buffer8.set(new Uint8Array(head_bytes).slice(0, Math.min(head_bytes.byteLength, buf_len - bufused)), buf);
          buf += dirent.head_length();
          bufused += dirent.head_length();
          if (buf_len - bufused < dirent.name_length()) {
            bufused = buf_len;
            break;
          }
          dirent.write_name_bytes(buffer8, buf, buf_len - bufused);
          buf += dirent.name_length();
          bufused += dirent.name_length();
          cookie = dirent.d_next;
        }
        buffer.setUint32(bufused_ptr, bufused, true);
        return 0;
      } else {
        return ERRNO_BADF;
      }
    }, fd_renumber(fd, to2) {
      if (self.fds[fd] != void 0 && self.fds[to2] != void 0) {
        const ret = self.fds[to2].fd_close();
        if (ret != 0) {
          return ret;
        }
        self.fds[to2] = self.fds[fd];
        self.fds[fd] = void 0;
        return 0;
      } else {
        return ERRNO_BADF;
      }
    }, fd_seek(fd, offset, whence, offset_out_ptr) {
      const buffer = new DataView(self.inst.exports.memory.buffer);
      if (self.fds[fd] != void 0) {
        const { ret, offset: offset_out } = self.fds[fd].fd_seek(offset, whence);
        buffer.setBigInt64(offset_out_ptr, offset_out, true);
        return ret;
      } else {
        return ERRNO_BADF;
      }
    }, fd_sync(fd) {
      if (self.fds[fd] != void 0) {
        return self.fds[fd].fd_sync();
      } else {
        return ERRNO_BADF;
      }
    }, fd_tell(fd, offset_ptr) {
      const buffer = new DataView(self.inst.exports.memory.buffer);
      if (self.fds[fd] != void 0) {
        const { ret, offset } = self.fds[fd].fd_tell();
        buffer.setBigUint64(offset_ptr, offset, true);
        return ret;
      } else {
        return ERRNO_BADF;
      }
    }, fd_write(fd, iovs_ptr, iovs_len, nwritten_ptr) {
      const buffer = new DataView(self.inst.exports.memory.buffer);
      const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
      if (self.fds[fd] != void 0) {
        const iovecs = Ciovec.read_bytes_array(buffer, iovs_ptr, iovs_len);
        let nwritten = 0;
        for (const iovec of iovecs) {
          const data = buffer8.slice(iovec.buf, iovec.buf + iovec.buf_len);
          const { ret, nwritten: nwritten_part } = self.fds[fd].fd_write(data);
          if (ret != ERRNO_SUCCESS) {
            buffer.setUint32(nwritten_ptr, nwritten, true);
            return ret;
          }
          nwritten += nwritten_part;
          if (nwritten_part != data.byteLength) {
            break;
          }
        }
        buffer.setUint32(nwritten_ptr, nwritten, true);
        return ERRNO_SUCCESS;
      } else {
        return ERRNO_BADF;
      }
    }, path_create_directory(fd, path_ptr, path_len) {
      const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
      if (self.fds[fd] != void 0) {
        const path = new TextDecoder("utf-8").decode(buffer8.slice(path_ptr, path_ptr + path_len));
        return self.fds[fd].path_create_directory(path);
      } else {
        return ERRNO_BADF;
      }
    }, path_filestat_get(fd, flags, path_ptr, path_len, filestat_ptr) {
      const buffer = new DataView(self.inst.exports.memory.buffer);
      const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
      if (self.fds[fd] != void 0) {
        const path = new TextDecoder("utf-8").decode(buffer8.slice(path_ptr, path_ptr + path_len));
        const { ret, filestat } = self.fds[fd].path_filestat_get(flags, path);
        if (filestat != null) {
          filestat.write_bytes(buffer, filestat_ptr);
        }
        return ret;
      } else {
        return ERRNO_BADF;
      }
    }, path_filestat_set_times(fd, flags, path_ptr, path_len, atim, mtim, fst_flags) {
      const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
      if (self.fds[fd] != void 0) {
        const path = new TextDecoder("utf-8").decode(buffer8.slice(path_ptr, path_ptr + path_len));
        return self.fds[fd].path_filestat_set_times(flags, path, atim, mtim, fst_flags);
      } else {
        return ERRNO_BADF;
      }
    }, path_link(old_fd, old_flags, old_path_ptr, old_path_len, new_fd, new_path_ptr, new_path_len) {
      const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
      if (self.fds[old_fd] != void 0 && self.fds[new_fd] != void 0) {
        const old_path = new TextDecoder("utf-8").decode(buffer8.slice(old_path_ptr, old_path_ptr + old_path_len));
        const new_path = new TextDecoder("utf-8").decode(buffer8.slice(new_path_ptr, new_path_ptr + new_path_len));
        const { ret, inode_obj } = self.fds[old_fd].path_lookup(old_path, old_flags);
        if (inode_obj == null) {
          return ret;
        }
        return self.fds[new_fd].path_link(new_path, inode_obj, false);
      } else {
        return ERRNO_BADF;
      }
    }, path_open(fd, dirflags, path_ptr, path_len, oflags, fs_rights_base, fs_rights_inheriting, fd_flags, opened_fd_ptr) {
      const buffer = new DataView(self.inst.exports.memory.buffer);
      const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
      if (self.fds[fd] != void 0) {
        const path = new TextDecoder("utf-8").decode(buffer8.slice(path_ptr, path_ptr + path_len));
        debug.log(path);
        const { ret, fd_obj } = self.fds[fd].path_open(dirflags, path, oflags, fs_rights_base, fs_rights_inheriting, fd_flags);
        if (ret != 0) {
          return ret;
        }
        self.fds.push(fd_obj);
        const opened_fd = self.fds.length - 1;
        buffer.setUint32(opened_fd_ptr, opened_fd, true);
        return 0;
      } else {
        return ERRNO_BADF;
      }
    }, path_readlink(fd, path_ptr, path_len, buf_ptr, buf_len, nread_ptr) {
      const buffer = new DataView(self.inst.exports.memory.buffer);
      const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
      if (self.fds[fd] != void 0) {
        const path = new TextDecoder("utf-8").decode(buffer8.slice(path_ptr, path_ptr + path_len));
        debug.log(path);
        const { ret, data } = self.fds[fd].path_readlink(path);
        if (data != null) {
          const data_buf = new TextEncoder().encode(data);
          if (data_buf.length > buf_len) {
            buffer.setUint32(nread_ptr, 0, true);
            return ERRNO_BADF;
          }
          buffer8.set(data_buf, buf_ptr);
          buffer.setUint32(nread_ptr, data_buf.length, true);
        }
        return ret;
      } else {
        return ERRNO_BADF;
      }
    }, path_remove_directory(fd, path_ptr, path_len) {
      const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
      if (self.fds[fd] != void 0) {
        const path = new TextDecoder("utf-8").decode(buffer8.slice(path_ptr, path_ptr + path_len));
        return self.fds[fd].path_remove_directory(path);
      } else {
        return ERRNO_BADF;
      }
    }, path_rename(fd, old_path_ptr, old_path_len, new_fd, new_path_ptr, new_path_len) {
      const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
      if (self.fds[fd] != void 0 && self.fds[new_fd] != void 0) {
        const old_path = new TextDecoder("utf-8").decode(buffer8.slice(old_path_ptr, old_path_ptr + old_path_len));
        const new_path = new TextDecoder("utf-8").decode(buffer8.slice(new_path_ptr, new_path_ptr + new_path_len));
        let { ret, inode_obj } = self.fds[fd].path_unlink(old_path);
        if (inode_obj == null) {
          return ret;
        }
        ret = self.fds[new_fd].path_link(new_path, inode_obj, true);
        if (ret != ERRNO_SUCCESS) {
          if (self.fds[fd].path_link(old_path, inode_obj, true) != ERRNO_SUCCESS) {
            throw "path_link should always return success when relinking an inode back to the original place";
          }
        }
        return ret;
      } else {
        return ERRNO_BADF;
      }
    }, path_symlink(old_path_ptr, old_path_len, fd, new_path_ptr, new_path_len) {
      const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
      if (self.fds[fd] != void 0) {
        const old_path = new TextDecoder("utf-8").decode(buffer8.slice(old_path_ptr, old_path_ptr + old_path_len));
        const new_path = new TextDecoder("utf-8").decode(buffer8.slice(new_path_ptr, new_path_ptr + new_path_len));
        return ERRNO_NOTSUP;
      } else {
        return ERRNO_BADF;
      }
    }, path_unlink_file(fd, path_ptr, path_len) {
      const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
      if (self.fds[fd] != void 0) {
        const path = new TextDecoder("utf-8").decode(buffer8.slice(path_ptr, path_ptr + path_len));
        return self.fds[fd].path_unlink_file(path);
      } else {
        return ERRNO_BADF;
      }
    }, poll_oneoff(in_ptr, out_ptr, nsubscriptions) {
      if (nsubscriptions === 0) {
        return ERRNO_INVAL;
      }
      if (nsubscriptions > 1) {
        debug.log("poll_oneoff: only a single subscription is supported");
        return ERRNO_NOTSUP;
      }
      const buffer = new DataView(self.inst.exports.memory.buffer);
      const s4 = Subscription.read_bytes(buffer, in_ptr);
      const eventtype = s4.eventtype;
      const clockid = s4.clockid;
      const timeout = s4.timeout;
      if (eventtype !== EVENTTYPE_CLOCK) {
        debug.log("poll_oneoff: only clock subscriptions are supported");
        return ERRNO_NOTSUP;
      }
      let getNow = void 0;
      if (clockid === CLOCKID_MONOTONIC) {
        getNow = () => BigInt(Math.round(performance.now() * 1e6));
      } else if (clockid === CLOCKID_REALTIME) {
        getNow = () => BigInt((/* @__PURE__ */ new Date()).getTime()) * 1000000n;
      } else {
        return ERRNO_INVAL;
      }
      const endTime = (s4.flags & SUBCLOCKFLAGS_SUBSCRIPTION_CLOCK_ABSTIME) !== 0 ? timeout : getNow() + timeout;
      while (endTime > getNow()) {
      }
      const event = new Event(s4.userdata, ERRNO_SUCCESS, eventtype);
      event.write_bytes(buffer, out_ptr);
      return ERRNO_SUCCESS;
    }, proc_exit(exit_code) {
      throw new WASIProcExit(exit_code);
    }, proc_raise(sig) {
      throw "raised signal " + sig;
    }, sched_yield() {
    }, random_get(buf, buf_len) {
      const buffer8 = new Uint8Array(self.inst.exports.memory.buffer).subarray(buf, buf + buf_len);
      if ("crypto" in globalThis && (typeof SharedArrayBuffer === "undefined" || !(self.inst.exports.memory.buffer instanceof SharedArrayBuffer))) {
        for (let i = 0; i < buf_len; i += 65536) {
          crypto.getRandomValues(buffer8.subarray(i, i + 65536));
        }
      } else {
        for (let i = 0; i < buf_len; i++) {
          buffer8[i] = Math.random() * 256 | 0;
        }
      }
    }, sock_recv(fd, ri_data, ri_flags) {
      throw "sockets not supported";
    }, sock_send(fd, si_data, si_flags) {
      throw "sockets not supported";
    }, sock_shutdown(fd, how) {
      throw "sockets not supported";
    }, sock_accept(fd, flags) {
      throw "sockets not supported";
    } };
  }
};

// node_modules/@bjorn3/browser_wasi_shim/dist/fd.js
var Fd = class {
  fd_allocate(offset, len) {
    return ERRNO_NOTSUP;
  }
  fd_close() {
    return 0;
  }
  fd_fdstat_get() {
    return { ret: ERRNO_NOTSUP, fdstat: null };
  }
  fd_fdstat_set_flags(flags) {
    return ERRNO_NOTSUP;
  }
  fd_fdstat_set_rights(fs_rights_base, fs_rights_inheriting) {
    return ERRNO_NOTSUP;
  }
  fd_filestat_get() {
    return { ret: ERRNO_NOTSUP, filestat: null };
  }
  fd_filestat_set_size(size) {
    return ERRNO_NOTSUP;
  }
  fd_filestat_set_times(atim, mtim, fst_flags) {
    return ERRNO_NOTSUP;
  }
  fd_pread(size, offset) {
    return { ret: ERRNO_NOTSUP, data: new Uint8Array() };
  }
  fd_prestat_get() {
    return { ret: ERRNO_NOTSUP, prestat: null };
  }
  fd_pwrite(data, offset) {
    return { ret: ERRNO_NOTSUP, nwritten: 0 };
  }
  fd_read(size) {
    return { ret: ERRNO_NOTSUP, data: new Uint8Array() };
  }
  fd_readdir_single(cookie) {
    return { ret: ERRNO_NOTSUP, dirent: null };
  }
  fd_seek(offset, whence) {
    return { ret: ERRNO_NOTSUP, offset: 0n };
  }
  fd_sync() {
    return 0;
  }
  fd_tell() {
    return { ret: ERRNO_NOTSUP, offset: 0n };
  }
  fd_write(data) {
    return { ret: ERRNO_NOTSUP, nwritten: 0 };
  }
  path_create_directory(path) {
    return ERRNO_NOTSUP;
  }
  path_filestat_get(flags, path) {
    return { ret: ERRNO_NOTSUP, filestat: null };
  }
  path_filestat_set_times(flags, path, atim, mtim, fst_flags) {
    return ERRNO_NOTSUP;
  }
  path_link(path, inode, allow_dir) {
    return ERRNO_NOTSUP;
  }
  path_unlink(path) {
    return { ret: ERRNO_NOTSUP, inode_obj: null };
  }
  path_lookup(path, dirflags) {
    return { ret: ERRNO_NOTSUP, inode_obj: null };
  }
  path_open(dirflags, path, oflags, fs_rights_base, fs_rights_inheriting, fd_flags) {
    return { ret: ERRNO_NOTDIR, fd_obj: null };
  }
  path_readlink(path) {
    return { ret: ERRNO_NOTSUP, data: null };
  }
  path_remove_directory(path) {
    return ERRNO_NOTSUP;
  }
  path_rename(old_path, new_fd, new_path) {
    return ERRNO_NOTSUP;
  }
  path_unlink_file(path) {
    return ERRNO_NOTSUP;
  }
};
var Inode = class _Inode {
  static issue_ino() {
    return _Inode.next_ino++;
  }
  static root_ino() {
    return 0n;
  }
  constructor() {
    this.ino = _Inode.issue_ino();
  }
};
Inode.next_ino = 1n;

// node_modules/@bjorn3/browser_wasi_shim/dist/fs_mem.js
var OpenFile = class extends Fd {
  fd_allocate(offset, len) {
    if (this.file.size > offset + len) {
    } else {
      const new_data = new Uint8Array(Number(offset + len));
      new_data.set(this.file.data, 0);
      this.file.data = new_data;
    }
    return ERRNO_SUCCESS;
  }
  fd_fdstat_get() {
    return { ret: 0, fdstat: new Fdstat(FILETYPE_REGULAR_FILE, 0) };
  }
  fd_filestat_set_size(size) {
    if (this.file.size > size) {
      this.file.data = new Uint8Array(this.file.data.buffer.slice(0, Number(size)));
    } else {
      const new_data = new Uint8Array(Number(size));
      new_data.set(this.file.data, 0);
      this.file.data = new_data;
    }
    return ERRNO_SUCCESS;
  }
  fd_read(size) {
    const slice = this.file.data.slice(Number(this.file_pos), Number(this.file_pos + BigInt(size)));
    this.file_pos += BigInt(slice.length);
    return { ret: 0, data: slice };
  }
  fd_pread(size, offset) {
    const slice = this.file.data.slice(Number(offset), Number(offset + BigInt(size)));
    return { ret: 0, data: slice };
  }
  fd_seek(offset, whence) {
    let calculated_offset;
    switch (whence) {
      case WHENCE_SET:
        calculated_offset = offset;
        break;
      case WHENCE_CUR:
        calculated_offset = this.file_pos + offset;
        break;
      case WHENCE_END:
        calculated_offset = BigInt(this.file.data.byteLength) + offset;
        break;
      default:
        return { ret: ERRNO_INVAL, offset: 0n };
    }
    if (calculated_offset < 0) {
      return { ret: ERRNO_INVAL, offset: 0n };
    }
    this.file_pos = calculated_offset;
    return { ret: 0, offset: this.file_pos };
  }
  fd_tell() {
    return { ret: 0, offset: this.file_pos };
  }
  fd_write(data) {
    if (this.file.readonly) return { ret: ERRNO_BADF, nwritten: 0 };
    if (this.file_pos + BigInt(data.byteLength) > this.file.size) {
      const old = this.file.data;
      this.file.data = new Uint8Array(Number(this.file_pos + BigInt(data.byteLength)));
      this.file.data.set(old);
    }
    this.file.data.set(data, Number(this.file_pos));
    this.file_pos += BigInt(data.byteLength);
    return { ret: 0, nwritten: data.byteLength };
  }
  fd_pwrite(data, offset) {
    if (this.file.readonly) return { ret: ERRNO_BADF, nwritten: 0 };
    if (offset + BigInt(data.byteLength) > this.file.size) {
      const old = this.file.data;
      this.file.data = new Uint8Array(Number(offset + BigInt(data.byteLength)));
      this.file.data.set(old);
    }
    this.file.data.set(data, Number(offset));
    return { ret: 0, nwritten: data.byteLength };
  }
  fd_filestat_get() {
    return { ret: 0, filestat: this.file.stat() };
  }
  constructor(file) {
    super();
    this.file_pos = 0n;
    this.file = file;
  }
};
var File = class extends Inode {
  path_open(oflags, fs_rights_base, fd_flags) {
    if (this.readonly && (fs_rights_base & BigInt(RIGHTS_FD_WRITE)) == BigInt(RIGHTS_FD_WRITE)) {
      return { ret: ERRNO_PERM, fd_obj: null };
    }
    if ((oflags & OFLAGS_TRUNC) == OFLAGS_TRUNC) {
      if (this.readonly) return { ret: ERRNO_PERM, fd_obj: null };
      this.data = new Uint8Array([]);
    }
    const file = new OpenFile(this);
    if (fd_flags & FDFLAGS_APPEND) file.fd_seek(0n, WHENCE_END);
    return { ret: ERRNO_SUCCESS, fd_obj: file };
  }
  get size() {
    return BigInt(this.data.byteLength);
  }
  stat() {
    return new Filestat(this.ino, FILETYPE_REGULAR_FILE, this.size);
  }
  constructor(data, options) {
    super();
    this.data = new Uint8Array(data);
    this.readonly = !!options?.readonly;
  }
};
var ConsoleStdout = class _ConsoleStdout extends Fd {
  fd_filestat_get() {
    const filestat = new Filestat(this.ino, FILETYPE_CHARACTER_DEVICE, BigInt(0));
    return { ret: 0, filestat };
  }
  fd_fdstat_get() {
    const fdstat = new Fdstat(FILETYPE_CHARACTER_DEVICE, 0);
    fdstat.fs_rights_base = BigInt(RIGHTS_FD_WRITE);
    return { ret: 0, fdstat };
  }
  fd_write(data) {
    this.write(data);
    return { ret: 0, nwritten: data.byteLength };
  }
  static lineBuffered(write) {
    const dec = new TextDecoder("utf-8", { fatal: false });
    let line_buf = "";
    return new _ConsoleStdout((buffer) => {
      line_buf += dec.decode(buffer, { stream: true });
      const lines = line_buf.split("\n");
      for (const [i, line] of lines.entries()) {
        if (i < lines.length - 1) {
          write(line);
        } else {
          line_buf = line;
        }
      }
    });
  }
  constructor(write) {
    super();
    this.ino = Inode.issue_ino();
    this.write = write;
  }
};

// wasi/fs.ts
var File2 = class extends Inode {
  handle;
  readonly;
  // FIXME needs a close() method to be called after start() to release the underlying handle
  constructor(handle, options) {
    super();
    this.handle = handle;
    this.readonly = !!options?.readonly;
  }
  path_open(oflags, fs_rights_base, fd_flags) {
    if (this.readonly && (fs_rights_base & BigInt(wasi_defs_exports.RIGHTS_FD_WRITE)) == BigInt(wasi_defs_exports.RIGHTS_FD_WRITE)) {
      return { ret: wasi_defs_exports.ERRNO_PERM, fd_obj: null };
    }
    if ((oflags & wasi_defs_exports.OFLAGS_TRUNC) == wasi_defs_exports.OFLAGS_TRUNC) {
      if (this.readonly) return { ret: wasi_defs_exports.ERRNO_PERM, fd_obj: null };
      this.handle.truncate(0);
    }
    const file = new OpenFile2(this);
    if (fd_flags & wasi_defs_exports.FDFLAGS_APPEND) file.fd_seek(0n, wasi_defs_exports.WHENCE_END);
    return { ret: wasi_defs_exports.ERRNO_SUCCESS, fd_obj: file };
  }
  get size() {
    return BigInt(this.handle.getSize());
  }
  stat() {
    return new wasi_defs_exports.Filestat(this.ino, wasi_defs_exports.FILETYPE_REGULAR_FILE, this.size);
  }
};
var OpenFile2 = class extends Fd {
  file;
  position = 0n;
  ino;
  constructor(file) {
    super();
    this.file = file;
    this.ino = Inode.issue_ino();
    this.file.handle.open();
  }
  fd_allocate(offset, len) {
    if (BigInt(this.file.handle.getSize()) > offset + len) {
    } else {
      this.file.handle.truncate(Number(offset + len));
    }
    return wasi_defs_exports.ERRNO_SUCCESS;
  }
  fd_fdstat_get() {
    const size = this.file.handle.getSize();
    const fdstat = new wasi_defs_exports.Fdstat(size > 0 ? wasi_defs_exports.FILETYPE_REGULAR_FILE : wasi_defs_exports.FILETYPE_CHARACTER_DEVICE, 0);
    if (!this.file.readonly) {
      fdstat.fs_rights_base = BigInt(wasi_defs_exports.RIGHTS_FD_WRITE);
    }
    return { ret: 0, fdstat };
  }
  fd_filestat_get() {
    const size = this.file.handle.getSize();
    return {
      ret: 0,
      filestat: new wasi_defs_exports.Filestat(
        this.ino,
        size > 0 ? wasi_defs_exports.FILETYPE_REGULAR_FILE : wasi_defs_exports.FILETYPE_CHARACTER_DEVICE,
        BigInt(size)
      )
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fd_filestat_set_size(size) {
    this.file.handle.truncate(Number(size));
    return wasi_defs_exports.ERRNO_SUCCESS;
  }
  fd_read(size) {
    const buf = new Uint8Array(size);
    const n10 = this.file.handle.read(buf, { at: Number(this.position) });
    this.position += BigInt(n10);
    return { ret: 0, data: buf.slice(0, n10) };
  }
  fd_seek(offset, whence) {
    let calculated_offset;
    switch (whence) {
      case wasi_defs_exports.WHENCE_SET:
        calculated_offset = BigInt(offset);
        break;
      case wasi_defs_exports.WHENCE_CUR:
        calculated_offset = this.position + BigInt(offset);
        break;
      case wasi_defs_exports.WHENCE_END:
        calculated_offset = BigInt(this.file.handle.getSize()) + BigInt(offset);
        break;
      default:
        return { ret: wasi_defs_exports.ERRNO_INVAL, offset: 0n };
    }
    if (calculated_offset < 0) {
      return { ret: wasi_defs_exports.ERRNO_INVAL, offset: 0n };
    }
    this.position = calculated_offset;
    return { ret: wasi_defs_exports.ERRNO_SUCCESS, offset: this.position };
  }
  fd_write(data) {
    if (this.file.readonly) return { ret: wasi_defs_exports.ERRNO_BADF, nwritten: 0 };
    const n10 = this.file.handle.write(data, { at: Number(this.position) });
    this.position += BigInt(n10);
    return { ret: wasi_defs_exports.ERRNO_SUCCESS, nwritten: n10 };
  }
  fd_sync() {
    this.file.handle.flush();
    return wasi_defs_exports.ERRNO_SUCCESS;
  }
};
var OpenDirectory2 = class extends Fd {
  dir;
  constructor(dir) {
    super();
    this.dir = dir;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fd_seek(offset, whence) {
    return { ret: wasi_defs_exports.ERRNO_BADF, offset: 0n };
  }
  fd_tell() {
    return { ret: wasi_defs_exports.ERRNO_BADF, offset: 0n };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fd_allocate(offset, len) {
    return wasi_defs_exports.ERRNO_BADF;
  }
  fd_fdstat_get() {
    return { ret: 0, fdstat: new wasi_defs_exports.Fdstat(wasi_defs_exports.FILETYPE_DIRECTORY, 0) };
  }
  fd_readdir_single(cookie) {
    if (cookie == 0n) {
      return {
        ret: wasi_defs_exports.ERRNO_SUCCESS,
        dirent: new wasi_defs_exports.Dirent(1n, this.dir.ino, ".", wasi_defs_exports.FILETYPE_DIRECTORY)
      };
    } else if (cookie == 1n) {
      return {
        ret: wasi_defs_exports.ERRNO_SUCCESS,
        dirent: new wasi_defs_exports.Dirent(
          2n,
          this.dir.parent_ino(),
          "..",
          wasi_defs_exports.FILETYPE_DIRECTORY
        )
      };
    }
    if (cookie >= BigInt(this.dir.contents.size) + 2n) {
      return { ret: 0, dirent: null };
    }
    const [name, entry] = Array.from(this.dir.contents.entries())[Number(cookie - 2n)];
    return {
      ret: 0,
      dirent: new wasi_defs_exports.Dirent(
        cookie + 1n,
        entry.ino,
        name,
        entry.stat().filetype
      )
    };
  }
  path_filestat_get(flags, path_str) {
    const { ret: path_err, path } = Path.from(path_str);
    if (path == null) {
      return { ret: path_err, filestat: null };
    }
    const { ret, entry } = this.dir.get_entry_for_path(path);
    if (entry == null) {
      return { ret, filestat: null };
    }
    return { ret: 0, filestat: entry.stat() };
  }
  path_lookup(path_str, dirflags) {
    const { ret: path_ret, path } = Path.from(path_str);
    if (path == null) {
      return { ret: path_ret, inode_obj: null };
    }
    const { ret, entry } = this.dir.get_entry_for_path(path);
    if (entry == null) {
      return { ret, inode_obj: null };
    }
    return { ret: wasi_defs_exports.ERRNO_SUCCESS, inode_obj: entry };
  }
  path_open(dirflags, path_str, oflags, fs_rights_base, fs_rights_inheriting, fd_flags) {
    const { ret: path_ret, path } = Path.from(path_str);
    if (path == null) {
      return { ret: path_ret, fd_obj: null };
    }
    let { ret, entry } = this.dir.get_entry_for_path(path);
    if (entry == null) {
      if (ret != wasi_defs_exports.ERRNO_NOENT) {
        return { ret, fd_obj: null };
      }
      if ((oflags & wasi_defs_exports.OFLAGS_CREAT) == wasi_defs_exports.OFLAGS_CREAT) {
        const { ret: ret2, entry: new_entry } = this.dir.create_entry_for_path(
          path_str,
          (oflags & wasi_defs_exports.OFLAGS_DIRECTORY) == wasi_defs_exports.OFLAGS_DIRECTORY
        );
        if (new_entry == null) {
          return { ret: ret2, fd_obj: null };
        }
        entry = new_entry;
      } else {
        return { ret: wasi_defs_exports.ERRNO_NOENT, fd_obj: null };
      }
    } else if ((oflags & wasi_defs_exports.OFLAGS_EXCL) == wasi_defs_exports.OFLAGS_EXCL) {
      return { ret: wasi_defs_exports.ERRNO_EXIST, fd_obj: null };
    }
    if ((oflags & wasi_defs_exports.OFLAGS_DIRECTORY) == wasi_defs_exports.OFLAGS_DIRECTORY && entry.stat().filetype !== wasi_defs_exports.FILETYPE_DIRECTORY) {
      return { ret: wasi_defs_exports.ERRNO_NOTDIR, fd_obj: null };
    }
    return entry.path_open(oflags, fs_rights_base, fd_flags);
  }
  path_create_directory(path) {
    return this.path_open(
      0,
      path,
      wasi_defs_exports.OFLAGS_CREAT | wasi_defs_exports.OFLAGS_DIRECTORY,
      0n,
      0n,
      0
    ).ret;
  }
  path_link(path_str, inode, allow_dir) {
    const { ret: path_ret, path } = Path.from(path_str);
    if (path == null) {
      return path_ret;
    }
    if (path.is_dir) {
      return wasi_defs_exports.ERRNO_NOENT;
    }
    const {
      ret: parent_ret,
      parent_entry,
      filename,
      entry
    } = this.dir.get_parent_dir_and_entry_for_path(path, true);
    if (parent_entry == null || filename == null) {
      return parent_ret;
    }
    if (entry != null) {
      const source_is_dir = inode.stat().filetype == wasi_defs_exports.FILETYPE_DIRECTORY;
      const target_is_dir = entry.stat().filetype == wasi_defs_exports.FILETYPE_DIRECTORY;
      if (source_is_dir && target_is_dir) {
        if (allow_dir && entry instanceof Directory2) {
          if (entry.contents.size == 0) {
          } else {
            return wasi_defs_exports.ERRNO_NOTEMPTY;
          }
        } else {
          return wasi_defs_exports.ERRNO_EXIST;
        }
      } else if (source_is_dir && !target_is_dir) {
        return wasi_defs_exports.ERRNO_NOTDIR;
      } else if (!source_is_dir && target_is_dir) {
        return wasi_defs_exports.ERRNO_ISDIR;
      } else if (inode.stat().filetype == wasi_defs_exports.FILETYPE_REGULAR_FILE && entry.stat().filetype == wasi_defs_exports.FILETYPE_REGULAR_FILE) {
      } else {
        return wasi_defs_exports.ERRNO_EXIST;
      }
    }
    if (!allow_dir && inode.stat().filetype == wasi_defs_exports.FILETYPE_DIRECTORY) {
      return wasi_defs_exports.ERRNO_PERM;
    }
    parent_entry.createLink(filename, inode);
    return wasi_defs_exports.ERRNO_SUCCESS;
  }
  path_unlink(path_str) {
    const { ret: path_ret, path } = Path.from(path_str);
    if (path == null) {
      return { ret: path_ret, inode_obj: null };
    }
    const {
      ret: parent_ret,
      parent_entry,
      filename,
      entry
    } = this.dir.get_parent_dir_and_entry_for_path(path, true);
    if (parent_entry == null || filename == null) {
      return { ret: parent_ret, inode_obj: null };
    }
    if (entry == null) {
      return { ret: wasi_defs_exports.ERRNO_NOENT, inode_obj: null };
    }
    parent_entry.removeEntry(filename);
    return { ret: wasi_defs_exports.ERRNO_SUCCESS, inode_obj: entry };
  }
  path_unlink_file(path_str) {
    const { ret: path_ret, path } = Path.from(path_str);
    if (path == null) {
      return path_ret;
    }
    const {
      ret: parent_ret,
      parent_entry,
      filename,
      entry
    } = this.dir.get_parent_dir_and_entry_for_path(path, false);
    if (parent_entry == null || filename == null || entry == null) {
      return parent_ret;
    }
    if (entry.stat().filetype === wasi_defs_exports.FILETYPE_DIRECTORY) {
      return wasi_defs_exports.ERRNO_ISDIR;
    }
    parent_entry.removeEntry(filename);
    return wasi_defs_exports.ERRNO_SUCCESS;
  }
  path_remove_directory(path_str) {
    const { ret: path_ret, path } = Path.from(path_str);
    if (path == null) {
      return path_ret;
    }
    const {
      ret: parent_ret,
      parent_entry,
      filename,
      entry
    } = this.dir.get_parent_dir_and_entry_for_path(path, false);
    if (parent_entry == null || filename == null || entry == null) {
      return parent_ret;
    }
    if (!(entry instanceof Directory2) || entry.stat().filetype !== wasi_defs_exports.FILETYPE_DIRECTORY) {
      return wasi_defs_exports.ERRNO_NOTDIR;
    }
    entry.syncEntries();
    if (entry.contents.size !== 0) {
      return wasi_defs_exports.ERRNO_NOTEMPTY;
    }
    if (!parent_entry.removeEntry(filename)) {
      return wasi_defs_exports.ERRNO_NOENT;
    }
    return wasi_defs_exports.ERRNO_SUCCESS;
  }
  fd_filestat_get() {
    return { ret: 0, filestat: this.dir.stat() };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fd_filestat_set_size(size) {
    return wasi_defs_exports.ERRNO_BADF;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fd_read(size) {
    return { ret: wasi_defs_exports.ERRNO_BADF, data: new Uint8Array() };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fd_pread(size, offset) {
    return { ret: wasi_defs_exports.ERRNO_BADF, data: new Uint8Array() };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fd_write(data) {
    return { ret: wasi_defs_exports.ERRNO_BADF, nwritten: 0 };
  }
  fd_pwrite(data, offset) {
    return { ret: wasi_defs_exports.ERRNO_BADF, nwritten: 0 };
  }
};
var PreopenDirectory2 = class extends OpenDirectory2 {
  prestat_name;
  constructor(name, dir) {
    super(dir);
    this.prestat_name = name;
  }
  fd_prestat_get() {
    return {
      ret: 0,
      prestat: wasi_defs_exports.Prestat.dir(this.prestat_name)
    };
  }
};
var Path = class _Path {
  parts = [];
  is_dir = false;
  static from(path) {
    const self = new _Path();
    self.is_dir = path.endsWith("/");
    if (path.startsWith("/")) {
      return { ret: wasi_defs_exports.ERRNO_NOTCAPABLE, path: null };
    }
    if (path.includes("\0")) {
      return { ret: wasi_defs_exports.ERRNO_INVAL, path: null };
    }
    for (const component of path.split("/")) {
      if (component === "" || component === ".") {
        continue;
      }
      if (component === "..") {
        if (self.parts.pop() == void 0) {
          return { ret: wasi_defs_exports.ERRNO_NOTCAPABLE, path: null };
        }
        continue;
      }
      self.parts.push(component);
    }
    return { ret: wasi_defs_exports.ERRNO_SUCCESS, path: self };
  }
  to_path_string() {
    let s4 = this.parts.join("/");
    if (this.is_dir) {
      s4 += "/";
    }
    return s4;
  }
};
var Directory2 = class _Directory extends Inode {
  contents;
  parent = null;
  handle;
  constructor(handle) {
    super();
    this.handle = handle;
  }
  syncEntries() {
    this.contents = this.handle.readDir();
    for (const entry of this.contents.values()) {
      if (entry instanceof _Directory) {
        entry.parent = this;
      }
    }
  }
  removeEntry(name) {
    if (this.handle.removeEntry(name)) {
      return this.contents.delete(name);
    }
    return false;
  }
  createLink(name, entry) {
    if (this.handle.createLink(name, entry)) {
      this.contents.set(name, entry);
    }
  }
  createFile(name, entry) {
    if (this.handle.createFile(name, entry)) {
      this.contents.set(name, entry);
    }
  }
  createDirectory(name, entry) {
    if (this.handle.createDirectory(name, entry)) {
      this.contents.set(name, entry);
    }
  }
  parent_ino() {
    if (this.parent == null) {
      return Inode.root_ino();
    }
    return this.parent.ino;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  path_open(oflags, fs_rights_base, fd_flags) {
    this.syncEntries();
    return { ret: wasi_defs_exports.ERRNO_SUCCESS, fd_obj: new OpenDirectory2(this) };
  }
  stat() {
    return new wasi_defs_exports.Filestat(this.ino, wasi_defs_exports.FILETYPE_DIRECTORY, 0n);
  }
  get_entry_for_path(path) {
    let entry = this;
    for (const component of path.parts) {
      if (!(entry instanceof _Directory)) {
        return { ret: wasi_defs_exports.ERRNO_NOTDIR, entry: null };
      }
      entry.syncEntries();
      const child = entry.contents.get(component);
      if (child !== void 0) {
        entry = child;
      } else {
        return { ret: wasi_defs_exports.ERRNO_NOENT, entry: null };
      }
    }
    if (path.is_dir) {
      if (entry.stat().filetype != wasi_defs_exports.FILETYPE_DIRECTORY) {
        return { ret: wasi_defs_exports.ERRNO_NOTDIR, entry: null };
      }
    }
    return { ret: wasi_defs_exports.ERRNO_SUCCESS, entry };
  }
  get_parent_dir_and_entry_for_path(path, allow_undefined) {
    const filename = path.parts.pop();
    if (filename === void 0) {
      return {
        ret: wasi_defs_exports.ERRNO_INVAL,
        parent_entry: null,
        filename: null,
        entry: null
      };
    }
    const { ret: entry_ret, entry: parent_entry } = this.get_entry_for_path(path);
    if (parent_entry == null) {
      return {
        ret: entry_ret,
        parent_entry: null,
        filename: null,
        entry: null
      };
    }
    if (!(parent_entry instanceof _Directory)) {
      return {
        ret: wasi_defs_exports.ERRNO_NOTDIR,
        parent_entry: null,
        filename: null,
        entry: null
      };
    }
    parent_entry.syncEntries();
    const entry = parent_entry.contents.get(filename);
    if (entry === void 0) {
      if (!allow_undefined) {
        return {
          ret: wasi_defs_exports.ERRNO_NOENT,
          parent_entry: null,
          filename: null,
          entry: null
        };
      } else {
        return { ret: wasi_defs_exports.ERRNO_SUCCESS, parent_entry, filename, entry: null };
      }
    }
    if (path.is_dir) {
      if (entry.stat().filetype != wasi_defs_exports.FILETYPE_DIRECTORY) {
        return {
          ret: wasi_defs_exports.ERRNO_NOTDIR,
          parent_entry: null,
          filename: null,
          entry: null
        };
      }
    }
    return { ret: wasi_defs_exports.ERRNO_SUCCESS, parent_entry, filename, entry };
  }
  create_entry_for_path(path_str, is_dir) {
    const { ret: path_ret, path } = Path.from(path_str);
    if (path == null) {
      return { ret: path_ret, entry: null };
    }
    let {
      // eslint-disable-next-line prefer-const
      ret: parent_ret,
      // eslint-disable-next-line prefer-const
      parent_entry,
      // eslint-disable-next-line prefer-const
      filename,
      entry
    } = this.get_parent_dir_and_entry_for_path(path, true);
    if (parent_entry == null || filename == null) {
      return { ret: parent_ret, entry: null };
    }
    if (entry != null) {
      return { ret: wasi_defs_exports.ERRNO_EXIST, entry: null };
    }
    let new_child;
    if (!is_dir) {
      new_child = parent_entry.handle.newEntry(filename, false);
      parent_entry.createFile(filename, new_child);
    } else {
      new_child = parent_entry.handle.newEntry(filename, true);
      parent_entry.createDirectory(filename, new_child);
    }
    entry = new_child;
    return { ret: wasi_defs_exports.ERRNO_SUCCESS, entry };
  }
};

// wasi/wanix.ts
var WanixHandle = class {
  caller;
  path;
  constructor(caller, path) {
    this.caller = caller;
    this.path = path;
  }
  subpath(path) {
    if (this.path === ".") {
      return path;
    }
    return [this.path, path].join("/");
  }
};
var FileHandle = class extends WanixHandle {
  fd;
  open() {
    this.fd = this.caller.call("path_open", { path: this.path });
  }
  close() {
    this.caller.call("fd_close", { fd: this.fd });
  }
  flush() {
    this.caller.call("fd_flush", { fd: this.fd });
  }
  read(buffer, options) {
    let at3 = 0;
    if (options?.at) {
      at3 = options.at;
    }
    const count = buffer.byteLength;
    const data = this.caller.call("fd_read", { fd: this.fd, count, at: at3 });
    if (data === null) {
      return 0;
    }
    let writeBuffer3;
    if (buffer instanceof ArrayBuffer) {
      writeBuffer3 = new Uint8Array(buffer);
    } else if (buffer instanceof Uint8Array) {
      writeBuffer3 = buffer;
    } else {
      throw new Error("Buffer must be ArrayBuffer or Uint8Array");
    }
    writeBuffer3.set(data, 0);
    return data.length;
  }
  write(buffer, options) {
    let at3 = 0;
    if (options?.at) {
      at3 = options.at;
    }
    const data = new Uint8Array(buffer);
    return this.caller.call("fd_write", { fd: this.fd, data, at: at3 });
  }
  truncate(to2) {
    this.caller.call("path_truncate", { path: this.path, to: to2 });
  }
  getSize() {
    return this.caller.call("path_size", { path: this.path });
  }
};
var DirectoryHandle = class _DirectoryHandle extends WanixHandle {
  dirCache;
  lastReadDir;
  newEntry(name, isDir) {
    if (isDir) {
      const handle = new _DirectoryHandle(this.caller, this.subpath(name));
      return new Directory2(handle);
    } else {
      const handle = new FileHandle(this.caller, this.subpath(name));
      return new File2(handle);
    }
  }
  readDir() {
    if (performance.now() - this.lastReadDir < 1e3) {
      return this.dirCache;
    }
    this.lastReadDir = performance.now();
    const m2 = /* @__PURE__ */ new Map();
    const entries = this.caller.call("path_readdir", { path: this.path }) || [];
    for (const entry of entries) {
      let isDir = false;
      let name = entry;
      if (name.slice(-1) === "/") {
        isDir = true;
        name = name.slice(0, -1);
      }
      m2.set(name, this.newEntry(name, isDir));
    }
    this.dirCache = m2;
    return m2;
  }
  removeEntry(name) {
    return this.caller.call("path_remove", { path: this.subpath(name) });
  }
  createLink(name, entry) {
    return false;
  }
  createFile(name, entry) {
    return this.caller.call("path_touch", { path: this.subpath(name) });
  }
  createDirectory(name, entry) {
    return this.caller.call("path_mkdir", { path: this.subpath(name) });
  }
};

// wasi/empty.ts
var EmptyFile = class extends File {
  constructor() {
    super([]);
  }
};
var OpenEmptyFile = class extends OpenFile {
  constructor() {
    super(new EmptyFile());
  }
};

// wasi/poll-oneoff.ts
function applyPatchPollOneoff(self) {
  self.wasiImport.poll_oneoff = ((inPtr, outPtr, nsubscriptions, sizeOutPtr) => {
    if (nsubscriptions < 0) {
      return wasi_defs_exports.ERRNO_INVAL;
    }
    const size_subscription = 48;
    const subscriptions = new DataView(
      self.inst.exports.memory.buffer,
      inPtr,
      nsubscriptions * size_subscription
    );
    const size_event = 32;
    const events = new DataView(
      self.inst.exports.memory.buffer,
      outPtr,
      nsubscriptions * size_event
    );
    for (let i = 0; i < nsubscriptions; ++i) {
      let assertOpenFileAvailable = function() {
        const fd = subscriptions.getUint32(
          i * size_subscription + subscription_u_offset + subscription_u_tag_size,
          true
        );
        const openFile = self.fds[fd];
        if (!(openFile instanceof OpenFile2)) {
          throw new Error(`FD#${fd} cannot be polled!`);
        }
        return openFile;
      }, setEventFdReadWrite = function(size) {
        events.setUint16(
          i * size_event + event_type_offset,
          wasi_defs_exports.EVENTTYPE_FD_READ,
          true
        );
        events.setBigUint64(
          i * size_event + event_fd_readwrite_nbytes_offset,
          size,
          true
        );
        events.setUint16(
          i * size_event + event_fd_readwrite_flags_offset,
          0,
          true
        );
      };
      const subscription_userdata_offset = 0;
      const userdata = subscriptions.getBigUint64(
        i * size_subscription + subscription_userdata_offset,
        true
      );
      const subscription_u_offset = 8;
      const subscription_u_tag = subscriptions.getUint8(
        i * size_subscription + subscription_u_offset
      );
      const subscription_u_tag_size = 1;
      const event_userdata_offset = 0;
      const event_error_offset = 8;
      const event_type_offset = 10;
      const event_fd_readwrite_nbytes_offset = 16;
      const event_fd_readwrite_flags_offset = 16 + 8;
      events.setBigUint64(
        i * size_event + event_userdata_offset,
        userdata,
        true
      );
      events.setUint32(
        i * size_event + event_error_offset,
        wasi_defs_exports.ERRNO_SUCCESS,
        true
      );
      switch (subscription_u_tag) {
        case wasi_defs_exports.EVENTTYPE_CLOCK:
          events.setUint16(
            i * size_event + event_type_offset,
            wasi_defs_exports.EVENTTYPE_CLOCK,
            true
          );
          break;
        case wasi_defs_exports.EVENTTYPE_FD_READ:
          const fileR = assertOpenFileAvailable();
          setEventFdReadWrite(fileR.file.size);
          break;
        case wasi_defs_exports.EVENTTYPE_FD_WRITE:
          setEventFdReadWrite(1n << 31n);
          break;
        default:
          throw new Error(`Unknown event type: ${subscription_u_tag}`);
      }
    }
    const size_size = 4;
    const outNSize = new DataView(
      self.inst.exports.memory.buffer,
      sizeOutPtr,
      size_size
    );
    outNSize.setUint32(0, nsubscriptions, true);
    return wasi_defs_exports.ERRNO_SUCCESS;
  });
}

// node_modules/@progrium/duplex/esm/codec/json.js
(function() {
  if (typeof global !== "undefined" && !global.TextEncoder) {
    const { TextEncoder: TextEncoder2, TextDecoder: TextDecoder2 } = __require("util");
    global.TextEncoder = TextEncoder2;
    global.TextDecoder = TextDecoder2;
  }
})();

// node_modules/@progrium/duplex/esm/vnd/cbor-x-1.4.1/decode.js
var decoder2;
try {
  decoder2 = new TextDecoder();
} catch (error) {
}
var src2;
var srcEnd2;
var position3 = 0;
var EMPTY_ARRAY2 = [];
var LEGACY_RECORD_INLINE_ID2 = 105;
var RECORD_DEFINITIONS_ID2 = 57342;
var RECORD_INLINE_ID2 = 57343;
var BUNDLED_STRINGS_ID2 = 57337;
var PACKED_REFERENCE_TAG_ID2 = 6;
var STOP_CODE2 = {};
var strings2 = EMPTY_ARRAY2;
var stringPosition2 = 0;
var currentDecoder2 = {};
var currentStructures2;
var srcString2;
var srcStringStart2 = 0;
var srcStringEnd2 = 0;
var bundledStrings3;
var referenceMap2;
var currentExtensions2 = [];
var currentExtensionRanges2 = [];
var packedValues2;
var dataView2;
var restoreMapsAsObject2;
var defaultOptions2 = {
  useRecords: false,
  mapsAsObjects: true
};
var sequentialMode2 = false;
var Decoder2 = class _Decoder {
  constructor(options) {
    if (options) {
      if ((options.keyMap || options._keyMap) && !options.useRecords) {
        options.useRecords = false;
        options.mapsAsObjects = true;
      }
      if (options.useRecords === false && options.mapsAsObjects === void 0)
        options.mapsAsObjects = true;
      if (options.getStructures)
        options.getShared = options.getStructures;
      if (options.getShared && !options.structures)
        (options.structures = []).uninitialized = true;
      if (options.keyMap) {
        this.mapKey = /* @__PURE__ */ new Map();
        for (let [k3, v] of Object.entries(options.keyMap))
          this.mapKey.set(v, k3);
      }
    }
    Object.assign(this, options);
  }
  /*
  decodeKey(key) {
      return this.keyMap
          ? Object.keys(this.keyMap)[Object.values(this.keyMap).indexOf(key)] || key
          : key
  }
  */
  decodeKey(key) {
    return this.keyMap ? this.mapKey.get(key) || key : key;
  }
  encodeKey(key) {
    return this.keyMap && this.keyMap.hasOwnProperty(key) ? this.keyMap[key] : key;
  }
  encodeKeys(rec) {
    if (!this._keyMap)
      return rec;
    let map = /* @__PURE__ */ new Map();
    for (let [k3, v] of Object.entries(rec))
      map.set(this._keyMap.hasOwnProperty(k3) ? this._keyMap[k3] : k3, v);
    return map;
  }
  decodeKeys(map) {
    if (!this._keyMap || map.constructor.name != "Map")
      return map;
    if (!this._mapKey) {
      this._mapKey = /* @__PURE__ */ new Map();
      for (let [k3, v] of Object.entries(this._keyMap))
        this._mapKey.set(v, k3);
    }
    let res = {};
    map.forEach((v, k3) => res[safeKey2(this._mapKey.has(k3) ? this._mapKey.get(k3) : k3)] = v);
    return res;
  }
  mapDecode(source, end) {
    let res = this.decode(source);
    if (this._keyMap) {
      switch (res.constructor.name) {
        case "Array":
          return res.map((r) => this.decodeKeys(r));
      }
    }
    return res;
  }
  decode(source, end) {
    if (src2) {
      return saveState2(() => {
        clearSource2();
        return this ? this.decode(source, end) : _Decoder.prototype.decode.call(defaultOptions2, source, end);
      });
    }
    srcEnd2 = end > -1 ? end : source.length;
    position3 = 0;
    stringPosition2 = 0;
    srcStringEnd2 = 0;
    srcString2 = null;
    strings2 = EMPTY_ARRAY2;
    bundledStrings3 = null;
    src2 = source;
    try {
      dataView2 = source.dataView || (source.dataView = new DataView(source.buffer, source.byteOffset, source.byteLength));
    } catch (error) {
      src2 = null;
      if (source instanceof Uint8Array)
        throw error;
      throw new Error("Source must be a Uint8Array or Buffer but was a " + (source && typeof source == "object" ? source.constructor.name : typeof source));
    }
    if (this instanceof _Decoder) {
      currentDecoder2 = this;
      packedValues2 = this.sharedValues && (this.pack ? new Array(this.maxPrivatePackedValues || 16).concat(this.sharedValues) : this.sharedValues);
      if (this.structures) {
        currentStructures2 = this.structures;
        return checkedRead2();
      } else if (!currentStructures2 || currentStructures2.length > 0) {
        currentStructures2 = [];
      }
    } else {
      currentDecoder2 = defaultOptions2;
      if (!currentStructures2 || currentStructures2.length > 0)
        currentStructures2 = [];
      packedValues2 = null;
    }
    return checkedRead2();
  }
  decodeMultiple(source, forEach) {
    let values, lastPosition = 0;
    try {
      let size = source.length;
      sequentialMode2 = true;
      let value = this ? this.decode(source, size) : defaultDecoder2.decode(source, size);
      if (forEach) {
        if (forEach(value) === false) {
          return;
        }
        while (position3 < size) {
          lastPosition = position3;
          if (forEach(checkedRead2()) === false) {
            return;
          }
        }
      } else {
        values = [value];
        while (position3 < size) {
          lastPosition = position3;
          values.push(checkedRead2());
        }
        return values;
      }
    } catch (error) {
      error.lastPosition = lastPosition;
      error.values = values;
      throw error;
    } finally {
      sequentialMode2 = false;
      clearSource2();
    }
  }
};
function checkedRead2() {
  try {
    let result = read2();
    if (bundledStrings3) {
      if (position3 >= bundledStrings3.postBundlePosition) {
        let error = new Error("Unexpected bundle position");
        error.incomplete = true;
        throw error;
      }
      position3 = bundledStrings3.postBundlePosition;
      bundledStrings3 = null;
    }
    if (position3 == srcEnd2) {
      currentStructures2 = null;
      src2 = null;
      if (referenceMap2)
        referenceMap2 = null;
    } else if (position3 > srcEnd2) {
      let error = new Error("Unexpected end of CBOR data");
      error.incomplete = true;
      throw error;
    } else if (!sequentialMode2) {
      throw new Error("Data read, but end of buffer not reached");
    }
    return result;
  } catch (error) {
    clearSource2();
    if (error instanceof RangeError || error.message.startsWith("Unexpected end of buffer")) {
      error.incomplete = true;
    }
    throw error;
  }
}
function read2() {
  let token = src2[position3++];
  let majorType = token >> 5;
  token = token & 31;
  if (token > 23) {
    switch (token) {
      case 24:
        token = src2[position3++];
        break;
      case 25:
        if (majorType == 7) {
          return getFloat162();
        }
        token = dataView2.getUint16(position3);
        position3 += 2;
        break;
      case 26:
        if (majorType == 7) {
          let value = dataView2.getFloat32(position3);
          if (currentDecoder2.useFloat32 > 2) {
            let multiplier = mult102[(src2[position3] & 127) << 1 | src2[position3 + 1] >> 7];
            position3 += 4;
            return (multiplier * value + (value > 0 ? 0.5 : -0.5) >> 0) / multiplier;
          }
          position3 += 4;
          return value;
        }
        token = dataView2.getUint32(position3);
        position3 += 4;
        break;
      case 27:
        if (majorType == 7) {
          let value = dataView2.getFloat64(position3);
          position3 += 8;
          return value;
        }
        if (majorType > 1) {
          if (dataView2.getUint32(position3) > 0)
            throw new Error("JavaScript does not support arrays, maps, or strings with length over 4294967295");
          token = dataView2.getUint32(position3 + 4);
        } else if (currentDecoder2.int64AsNumber) {
          token = dataView2.getUint32(position3) * 4294967296;
          token += dataView2.getUint32(position3 + 4);
        } else
          token = dataView2.getBigUint64(position3);
        position3 += 8;
        break;
      case 31:
        switch (majorType) {
          case 2:
          // byte string
          case 3:
            throw new Error("Indefinite length not supported for byte or text strings");
          case 4:
            let array = [];
            let value, i = 0;
            while ((value = read2()) != STOP_CODE2) {
              array[i++] = value;
            }
            return majorType == 4 ? array : majorType == 3 ? array.join("") : Buffer.concat(array);
          case 5:
            let key;
            if (currentDecoder2.mapsAsObjects) {
              let object = {};
              if (currentDecoder2.keyMap)
                while ((key = read2()) != STOP_CODE2)
                  object[safeKey2(currentDecoder2.decodeKey(key))] = read2();
              else
                while ((key = read2()) != STOP_CODE2)
                  object[safeKey2(key)] = read2();
              return object;
            } else {
              if (restoreMapsAsObject2) {
                currentDecoder2.mapsAsObjects = true;
                restoreMapsAsObject2 = false;
              }
              let map = /* @__PURE__ */ new Map();
              if (currentDecoder2.keyMap)
                while ((key = read2()) != STOP_CODE2)
                  map.set(currentDecoder2.decodeKey(key), read2());
              else
                while ((key = read2()) != STOP_CODE2)
                  map.set(key, read2());
              return map;
            }
          case 7:
            return STOP_CODE2;
          default:
            throw new Error("Invalid major type for indefinite length " + majorType);
        }
      default:
        throw new Error("Unknown token " + token);
    }
  }
  switch (majorType) {
    case 0:
      return token;
    case 1:
      return ~token;
    case 2:
      return readBin2(token);
    case 3:
      if (srcStringEnd2 >= position3) {
        return srcString2.slice(position3 - srcStringStart2, (position3 += token) - srcStringStart2);
      }
      if (srcStringEnd2 == 0 && srcEnd2 < 140 && token < 32) {
        let string = token < 16 ? shortStringInJS2(token) : longStringInJS2(token);
        if (string != null)
          return string;
      }
      return readFixedString2(token);
    case 4:
      let array = new Array(token);
      for (let i = 0; i < token; i++)
        array[i] = read2();
      return array;
    case 5:
      if (currentDecoder2.mapsAsObjects) {
        let object = {};
        if (currentDecoder2.keyMap)
          for (let i = 0; i < token; i++)
            object[safeKey2(currentDecoder2.decodeKey(read2()))] = read2();
        else
          for (let i = 0; i < token; i++)
            object[safeKey2(read2())] = read2();
        return object;
      } else {
        if (restoreMapsAsObject2) {
          currentDecoder2.mapsAsObjects = true;
          restoreMapsAsObject2 = false;
        }
        let map = /* @__PURE__ */ new Map();
        if (currentDecoder2.keyMap)
          for (let i = 0; i < token; i++)
            map.set(currentDecoder2.decodeKey(read2()), read2());
        else
          for (let i = 0; i < token; i++)
            map.set(read2(), read2());
        return map;
      }
    case 6:
      if (token >= BUNDLED_STRINGS_ID2) {
        let structure = currentStructures2[token & 8191];
        if (structure) {
          if (!structure.read)
            structure.read = createStructureReader2(structure);
          return structure.read();
        }
        if (token < 65536) {
          if (token == RECORD_INLINE_ID2) {
            let length = readJustLength2();
            let id = read2();
            let structure2 = read2();
            recordDefinition2(id, structure2);
            let object = {};
            if (currentDecoder2.keyMap)
              for (let i = 2; i < length; i++) {
                let key = currentDecoder2.decodeKey(structure2[i - 2]);
                object[safeKey2(key)] = read2();
              }
            else
              for (let i = 2; i < length; i++) {
                let key = structure2[i - 2];
                object[safeKey2(key)] = read2();
              }
            return object;
          } else if (token == RECORD_DEFINITIONS_ID2) {
            let length = readJustLength2();
            let id = read2();
            for (let i = 2; i < length; i++) {
              recordDefinition2(id++, read2());
            }
            return read2();
          } else if (token == BUNDLED_STRINGS_ID2) {
            return readBundleExt2();
          }
          if (currentDecoder2.getShared) {
            loadShared2();
            structure = currentStructures2[token & 8191];
            if (structure) {
              if (!structure.read)
                structure.read = createStructureReader2(structure);
              return structure.read();
            }
          }
        }
      }
      let extension = currentExtensions2[token];
      if (extension) {
        if (extension.handlesRead)
          return extension(read2);
        else
          return extension(read2());
      } else {
        let input = read2();
        for (let i = 0; i < currentExtensionRanges2.length; i++) {
          let value = currentExtensionRanges2[i](token, input);
          if (value !== void 0)
            return value;
        }
        return new Tag2(input, token);
      }
    case 7:
      switch (token) {
        case 20:
          return false;
        case 21:
          return true;
        case 22:
          return null;
        case 23:
          return;
        // undefined
        case 31:
        default:
          let packedValue = (packedValues2 || getPackedValues2())[token];
          if (packedValue !== void 0)
            return packedValue;
          throw new Error("Unknown token " + token);
      }
    default:
      if (isNaN(token)) {
        let error = new Error("Unexpected end of CBOR data");
        error.incomplete = true;
        throw error;
      }
      throw new Error("Unknown CBOR token " + token);
  }
}
var validName2 = /^[a-zA-Z_$][a-zA-Z\d_$]*$/;
function createStructureReader2(structure) {
  function readObject() {
    let length = src2[position3++];
    length = length & 31;
    if (length > 23) {
      switch (length) {
        case 24:
          length = src2[position3++];
          break;
        case 25:
          length = dataView2.getUint16(position3);
          position3 += 2;
          break;
        case 26:
          length = dataView2.getUint32(position3);
          position3 += 4;
          break;
        default:
          throw new Error("Expected array header, but got " + src2[position3 - 1]);
      }
    }
    let compiledReader = this.compiledReader;
    while (compiledReader) {
      if (compiledReader.propertyCount === length)
        return compiledReader(read2);
      compiledReader = compiledReader.next;
    }
    if (this.slowReads++ >= 3) {
      let array = this.length == length ? this : this.slice(0, length);
      compiledReader = currentDecoder2.keyMap ? new Function("r", "return {" + array.map((k3) => currentDecoder2.decodeKey(k3)).map((k3) => validName2.test(k3) ? safeKey2(k3) + ":r()" : "[" + JSON.stringify(k3) + "]:r()").join(",") + "}") : new Function("r", "return {" + array.map((key) => validName2.test(key) ? safeKey2(key) + ":r()" : "[" + JSON.stringify(key) + "]:r()").join(",") + "}");
      if (this.compiledReader)
        compiledReader.next = this.compiledReader;
      compiledReader.propertyCount = length;
      this.compiledReader = compiledReader;
      return compiledReader(read2);
    }
    let object = {};
    if (currentDecoder2.keyMap)
      for (let i = 0; i < length; i++)
        object[safeKey2(currentDecoder2.decodeKey(this[i]))] = read2();
    else
      for (let i = 0; i < length; i++) {
        object[safeKey2(this[i])] = read2();
      }
    return object;
  }
  structure.slowReads = 0;
  return readObject;
}
function safeKey2(key) {
  return key === "__proto__" ? "__proto_" : key;
}
var readFixedString2 = readStringJS2;
function readStringJS2(length) {
  let result;
  if (length < 16) {
    if (result = shortStringInJS2(length))
      return result;
  }
  if (length > 64 && decoder2)
    return decoder2.decode(src2.subarray(position3, position3 += length));
  const end = position3 + length;
  const units = [];
  result = "";
  while (position3 < end) {
    const byte1 = src2[position3++];
    if ((byte1 & 128) === 0) {
      units.push(byte1);
    } else if ((byte1 & 224) === 192) {
      const byte2 = src2[position3++] & 63;
      units.push((byte1 & 31) << 6 | byte2);
    } else if ((byte1 & 240) === 224) {
      const byte2 = src2[position3++] & 63;
      const byte3 = src2[position3++] & 63;
      units.push((byte1 & 31) << 12 | byte2 << 6 | byte3);
    } else if ((byte1 & 248) === 240) {
      const byte2 = src2[position3++] & 63;
      const byte3 = src2[position3++] & 63;
      const byte4 = src2[position3++] & 63;
      let unit = (byte1 & 7) << 18 | byte2 << 12 | byte3 << 6 | byte4;
      if (unit > 65535) {
        unit -= 65536;
        units.push(unit >>> 10 & 1023 | 55296);
        unit = 56320 | unit & 1023;
      }
      units.push(unit);
    } else {
      units.push(byte1);
    }
    if (units.length >= 4096) {
      result += fromCharCode2.apply(String, units);
      units.length = 0;
    }
  }
  if (units.length > 0) {
    result += fromCharCode2.apply(String, units);
  }
  return result;
}
var fromCharCode2 = String.fromCharCode;
function longStringInJS2(length) {
  let start = position3;
  let bytes = new Array(length);
  for (let i = 0; i < length; i++) {
    const byte = src2[position3++];
    if ((byte & 128) > 0) {
      position3 = start;
      return;
    }
    bytes[i] = byte;
  }
  return fromCharCode2.apply(String, bytes);
}
function shortStringInJS2(length) {
  if (length < 4) {
    if (length < 2) {
      if (length === 0)
        return "";
      else {
        let a = src2[position3++];
        if ((a & 128) > 1) {
          position3 -= 1;
          return;
        }
        return fromCharCode2(a);
      }
    } else {
      let a = src2[position3++];
      let b2 = src2[position3++];
      if ((a & 128) > 0 || (b2 & 128) > 0) {
        position3 -= 2;
        return;
      }
      if (length < 3)
        return fromCharCode2(a, b2);
      let c = src2[position3++];
      if ((c & 128) > 0) {
        position3 -= 3;
        return;
      }
      return fromCharCode2(a, b2, c);
    }
  } else {
    let a = src2[position3++];
    let b2 = src2[position3++];
    let c = src2[position3++];
    let d = src2[position3++];
    if ((a & 128) > 0 || (b2 & 128) > 0 || (c & 128) > 0 || (d & 128) > 0) {
      position3 -= 4;
      return;
    }
    if (length < 6) {
      if (length === 4)
        return fromCharCode2(a, b2, c, d);
      else {
        let e = src2[position3++];
        if ((e & 128) > 0) {
          position3 -= 5;
          return;
        }
        return fromCharCode2(a, b2, c, d, e);
      }
    } else if (length < 8) {
      let e = src2[position3++];
      let f2 = src2[position3++];
      if ((e & 128) > 0 || (f2 & 128) > 0) {
        position3 -= 6;
        return;
      }
      if (length < 7)
        return fromCharCode2(a, b2, c, d, e, f2);
      let g2 = src2[position3++];
      if ((g2 & 128) > 0) {
        position3 -= 7;
        return;
      }
      return fromCharCode2(a, b2, c, d, e, f2, g2);
    } else {
      let e = src2[position3++];
      let f2 = src2[position3++];
      let g2 = src2[position3++];
      let h = src2[position3++];
      if ((e & 128) > 0 || (f2 & 128) > 0 || (g2 & 128) > 0 || (h & 128) > 0) {
        position3 -= 8;
        return;
      }
      if (length < 10) {
        if (length === 8)
          return fromCharCode2(a, b2, c, d, e, f2, g2, h);
        else {
          let i = src2[position3++];
          if ((i & 128) > 0) {
            position3 -= 9;
            return;
          }
          return fromCharCode2(a, b2, c, d, e, f2, g2, h, i);
        }
      } else if (length < 12) {
        let i = src2[position3++];
        let j3 = src2[position3++];
        if ((i & 128) > 0 || (j3 & 128) > 0) {
          position3 -= 10;
          return;
        }
        if (length < 11)
          return fromCharCode2(a, b2, c, d, e, f2, g2, h, i, j3);
        let k3 = src2[position3++];
        if ((k3 & 128) > 0) {
          position3 -= 11;
          return;
        }
        return fromCharCode2(a, b2, c, d, e, f2, g2, h, i, j3, k3);
      } else {
        let i = src2[position3++];
        let j3 = src2[position3++];
        let k3 = src2[position3++];
        let l3 = src2[position3++];
        if ((i & 128) > 0 || (j3 & 128) > 0 || (k3 & 128) > 0 || (l3 & 128) > 0) {
          position3 -= 12;
          return;
        }
        if (length < 14) {
          if (length === 12)
            return fromCharCode2(a, b2, c, d, e, f2, g2, h, i, j3, k3, l3);
          else {
            let m2 = src2[position3++];
            if ((m2 & 128) > 0) {
              position3 -= 13;
              return;
            }
            return fromCharCode2(a, b2, c, d, e, f2, g2, h, i, j3, k3, l3, m2);
          }
        } else {
          let m2 = src2[position3++];
          let n10 = src2[position3++];
          if ((m2 & 128) > 0 || (n10 & 128) > 0) {
            position3 -= 14;
            return;
          }
          if (length < 15)
            return fromCharCode2(a, b2, c, d, e, f2, g2, h, i, j3, k3, l3, m2, n10);
          let o3 = src2[position3++];
          if ((o3 & 128) > 0) {
            position3 -= 15;
            return;
          }
          return fromCharCode2(a, b2, c, d, e, f2, g2, h, i, j3, k3, l3, m2, n10, o3);
        }
      }
    }
  }
}
function readBin2(length) {
  return currentDecoder2.copyBuffers ? (
    // specifically use the copying slice (not the node one)
    Uint8Array.prototype.slice.call(src2, position3, position3 += length)
  ) : src2.subarray(position3, position3 += length);
}
var f32Array2 = new Float32Array(1);
var u8Array2 = new Uint8Array(f32Array2.buffer, 0, 4);
function getFloat162() {
  let byte0 = src2[position3++];
  let byte1 = src2[position3++];
  let exponent = (byte0 & 127) >> 2;
  if (exponent === 31) {
    if (byte1 || byte0 & 3)
      return NaN;
    return byte0 & 128 ? -Infinity : Infinity;
  }
  if (exponent === 0) {
    let abs = ((byte0 & 3) << 8 | byte1) / (1 << 24);
    return byte0 & 128 ? -abs : abs;
  }
  u8Array2[3] = byte0 & 128 | // sign bit
  (exponent >> 1) + 56;
  u8Array2[2] = (byte0 & 7) << 5 | // last exponent bit and first two mantissa bits
  byte1 >> 3;
  u8Array2[1] = byte1 << 5;
  u8Array2[0] = 0;
  return f32Array2[0];
}
var keyCache2 = new Array(4096);
var Tag2 = class {
  constructor(value, tag) {
    this.value = value;
    this.tag = tag;
  }
};
currentExtensions2[0] = (dateString) => {
  return new Date(dateString);
};
currentExtensions2[1] = (epochSec) => {
  return new Date(Math.round(epochSec * 1e3));
};
currentExtensions2[2] = (buffer) => {
  let value = BigInt(0);
  for (let i = 0, l3 = buffer.byteLength; i < l3; i++) {
    value = BigInt(buffer[i]) + value << BigInt(8);
  }
  return value;
};
currentExtensions2[3] = (buffer) => {
  return BigInt(-1) - currentExtensions2[2](buffer);
};
currentExtensions2[4] = (fraction) => {
  return +(fraction[1] + "e" + fraction[0]);
};
currentExtensions2[5] = (fraction) => {
  return fraction[1] * Math.exp(fraction[0] * Math.log(2));
};
var recordDefinition2 = (id, structure) => {
  id = id - 57344;
  let existingStructure = currentStructures2[id];
  if (existingStructure && existingStructure.isShared) {
    (currentStructures2.restoreStructures || (currentStructures2.restoreStructures = []))[id] = existingStructure;
  }
  currentStructures2[id] = structure;
  structure.read = createStructureReader2(structure);
};
currentExtensions2[LEGACY_RECORD_INLINE_ID2] = (data) => {
  let length = data.length;
  let structure = data[1];
  recordDefinition2(data[0], structure);
  let object = {};
  for (let i = 2; i < length; i++) {
    let key = structure[i - 2];
    object[safeKey2(key)] = data[i];
  }
  return object;
};
currentExtensions2[14] = (value) => {
  if (bundledStrings3)
    return bundledStrings3[0].slice(bundledStrings3.position0, bundledStrings3.position0 += value);
  return new Tag2(value, 14);
};
currentExtensions2[15] = (value) => {
  if (bundledStrings3)
    return bundledStrings3[1].slice(bundledStrings3.position1, bundledStrings3.position1 += value);
  return new Tag2(value, 15);
};
var glbl2 = { Error, RegExp };
currentExtensions2[27] = (data) => {
  return (glbl2[data[0]] || Error)(data[1], data[2]);
};
var packedTable2 = (read3) => {
  if (src2[position3++] != 132)
    throw new Error("Packed values structure must be followed by a 4 element array");
  let newPackedValues = read3();
  packedValues2 = packedValues2 ? newPackedValues.concat(packedValues2.slice(newPackedValues.length)) : newPackedValues;
  packedValues2.prefixes = read3();
  packedValues2.suffixes = read3();
  return read3();
};
packedTable2.handlesRead = true;
currentExtensions2[51] = packedTable2;
currentExtensions2[PACKED_REFERENCE_TAG_ID2] = (data) => {
  if (!packedValues2) {
    if (currentDecoder2.getShared)
      loadShared2();
    else
      return new Tag2(data, PACKED_REFERENCE_TAG_ID2);
  }
  if (typeof data == "number")
    return packedValues2[16 + (data >= 0 ? 2 * data : -2 * data - 1)];
  throw new Error("No support for non-integer packed references yet");
};
currentExtensions2[28] = (read3) => {
  if (!referenceMap2) {
    referenceMap2 = /* @__PURE__ */ new Map();
    referenceMap2.id = 0;
  }
  let id = referenceMap2.id++;
  let token = src2[position3];
  let target3;
  if (token >> 5 == 4)
    target3 = [];
  else
    target3 = {};
  let refEntry = { target: target3 };
  referenceMap2.set(id, refEntry);
  let targetProperties = read3();
  if (refEntry.used)
    return Object.assign(target3, targetProperties);
  refEntry.target = targetProperties;
  return targetProperties;
};
currentExtensions2[28].handlesRead = true;
currentExtensions2[29] = (id) => {
  let refEntry = referenceMap2.get(id);
  refEntry.used = true;
  return refEntry.target;
};
currentExtensions2[258] = (array) => new Set(array);
(currentExtensions2[259] = (read3) => {
  if (currentDecoder2.mapsAsObjects) {
    currentDecoder2.mapsAsObjects = false;
    restoreMapsAsObject2 = true;
  }
  return read3();
}).handlesRead = true;
function combine2(a, b2) {
  if (typeof a === "string")
    return a + b2;
  if (a instanceof Array)
    return a.concat(b2);
  return Object.assign({}, a, b2);
}
function getPackedValues2() {
  if (!packedValues2) {
    if (currentDecoder2.getShared)
      loadShared2();
    else
      throw new Error("No packed values available");
  }
  return packedValues2;
}
var SHARED_DATA_TAG_ID2 = 1399353956;
currentExtensionRanges2.push((tag, input) => {
  if (tag >= 225 && tag <= 255)
    return combine2(getPackedValues2().prefixes[tag - 224], input);
  if (tag >= 28704 && tag <= 32767)
    return combine2(getPackedValues2().prefixes[tag - 28672], input);
  if (tag >= 1879052288 && tag <= 2147483647)
    return combine2(getPackedValues2().prefixes[tag - 1879048192], input);
  if (tag >= 216 && tag <= 223)
    return combine2(input, getPackedValues2().suffixes[tag - 216]);
  if (tag >= 27647 && tag <= 28671)
    return combine2(input, getPackedValues2().suffixes[tag - 27639]);
  if (tag >= 1811940352 && tag <= 1879048191)
    return combine2(input, getPackedValues2().suffixes[tag - 1811939328]);
  if (tag == SHARED_DATA_TAG_ID2) {
    return {
      packedValues: packedValues2,
      structures: currentStructures2.slice(0),
      version: input
    };
  }
  if (tag == 55799)
    return input;
});
var isLittleEndianMachine3 = new Uint8Array(new Uint16Array([1]).buffer)[0] == 1;
var typedArrays2 = [
  Uint8Array,
  Uint8ClampedArray,
  Uint16Array,
  Uint32Array,
  typeof BigUint64Array == "undefined" ? { name: "BigUint64Array" } : BigUint64Array,
  Int8Array,
  Int16Array,
  Int32Array,
  typeof BigInt64Array == "undefined" ? { name: "BigInt64Array" } : BigInt64Array,
  Float32Array,
  Float64Array
];
var typedArrayTags2 = [64, 68, 69, 70, 71, 72, 77, 78, 79, 85, 86];
for (let i = 0; i < typedArrays2.length; i++) {
  registerTypedArray2(typedArrays2[i], typedArrayTags2[i]);
}
function registerTypedArray2(TypedArray, tag) {
  let dvMethod = "get" + TypedArray.name.slice(0, -5);
  if (typeof TypedArray !== "function")
    TypedArray = null;
  let bytesPerElement = TypedArray.BYTES_PER_ELEMENT;
  for (let littleEndian = 0; littleEndian < 2; littleEndian++) {
    if (!littleEndian && bytesPerElement == 1)
      continue;
    let sizeShift = bytesPerElement == 2 ? 1 : bytesPerElement == 4 ? 2 : 3;
    currentExtensions2[littleEndian ? tag : tag - 4] = bytesPerElement == 1 || littleEndian == isLittleEndianMachine3 ? (buffer) => {
      if (!TypedArray)
        throw new Error("Could not find typed array for code " + tag);
      return new TypedArray(Uint8Array.prototype.slice.call(buffer, 0).buffer);
    } : (buffer) => {
      if (!TypedArray)
        throw new Error("Could not find typed array for code " + tag);
      let dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      let elements = buffer.length >> sizeShift;
      let ta = new TypedArray(elements);
      let method = dv[dvMethod];
      for (let i = 0; i < elements; i++) {
        ta[i] = method.call(dv, i << sizeShift, littleEndian);
      }
      return ta;
    };
  }
}
function readBundleExt2() {
  let length = readJustLength2();
  let bundlePosition = position3 + read2();
  for (let i = 2; i < length; i++) {
    let bundleLength = readJustLength2();
    position3 += bundleLength;
  }
  let dataPosition = position3;
  position3 = bundlePosition;
  bundledStrings3 = [readStringJS2(readJustLength2()), readStringJS2(readJustLength2())];
  bundledStrings3.position0 = 0;
  bundledStrings3.position1 = 0;
  bundledStrings3.postBundlePosition = position3;
  position3 = dataPosition;
  return read2();
}
function readJustLength2() {
  let token = src2[position3++] & 31;
  if (token > 23) {
    switch (token) {
      case 24:
        token = src2[position3++];
        break;
      case 25:
        token = dataView2.getUint16(position3);
        position3 += 2;
        break;
      case 26:
        token = dataView2.getUint32(position3);
        position3 += 4;
        break;
    }
  }
  return token;
}
function loadShared2() {
  if (currentDecoder2.getShared) {
    let sharedData = saveState2(() => {
      src2 = null;
      return currentDecoder2.getShared();
    }) || {};
    let updatedStructures = sharedData.structures || [];
    currentDecoder2.sharedVersion = sharedData.version;
    packedValues2 = currentDecoder2.sharedValues = sharedData.packedValues;
    if (currentStructures2 === true)
      currentDecoder2.structures = currentStructures2 = updatedStructures;
    else
      currentStructures2.splice.apply(currentStructures2, [0, updatedStructures.length].concat(updatedStructures));
  }
}
function saveState2(callback) {
  let savedSrcEnd = srcEnd2;
  let savedPosition = position3;
  let savedStringPosition = stringPosition2;
  let savedSrcStringStart = srcStringStart2;
  let savedSrcStringEnd = srcStringEnd2;
  let savedSrcString = srcString2;
  let savedStrings = strings2;
  let savedReferenceMap = referenceMap2;
  let savedBundledStrings = bundledStrings3;
  let savedSrc = new Uint8Array(src2.slice(0, srcEnd2));
  let savedStructures = currentStructures2;
  let savedDecoder = currentDecoder2;
  let savedSequentialMode = sequentialMode2;
  let value = callback();
  srcEnd2 = savedSrcEnd;
  position3 = savedPosition;
  stringPosition2 = savedStringPosition;
  srcStringStart2 = savedSrcStringStart;
  srcStringEnd2 = savedSrcStringEnd;
  srcString2 = savedSrcString;
  strings2 = savedStrings;
  referenceMap2 = savedReferenceMap;
  bundledStrings3 = savedBundledStrings;
  src2 = savedSrc;
  sequentialMode2 = savedSequentialMode;
  currentStructures2 = savedStructures;
  currentDecoder2 = savedDecoder;
  dataView2 = new DataView(src2.buffer, src2.byteOffset, src2.byteLength);
  return value;
}
function clearSource2() {
  src2 = null;
  referenceMap2 = null;
  currentStructures2 = null;
}
function addExtension3(extension) {
  currentExtensions2[extension.tag] = extension.decode;
}
var mult102 = new Array(147);
for (let i = 0; i < 256; i++) {
  mult102[i] = +("1e" + Math.floor(45.15 - i * 0.30103));
}
var defaultDecoder2 = new Decoder2({ useRecords: false });
var decode2 = defaultDecoder2.decode;
var decodeMultiple2 = defaultDecoder2.decodeMultiple;
var FLOAT32_OPTIONS2 = {
  NEVER: 0,
  ALWAYS: 1,
  DECIMAL_ROUND: 3,
  DECIMAL_FIT: 4
};

// node_modules/@progrium/duplex/esm/vnd/cbor-x-1.4.1/encode.js
var textEncoder2;
try {
  textEncoder2 = new TextEncoder();
} catch (error) {
}
var extensions2;
var extensionClasses2;
var Buffer3 = globalThis.Buffer;
var hasNodeBuffer2 = typeof Buffer3 !== "undefined";
var ByteArrayAllocate2 = hasNodeBuffer2 ? Buffer3.allocUnsafeSlow : Uint8Array;
var ByteArray2 = hasNodeBuffer2 ? Buffer3 : Uint8Array;
var MAX_STRUCTURES2 = 256;
var MAX_BUFFER_SIZE2 = hasNodeBuffer2 ? 4294967296 : 2144337920;
var throwOnIterable2;
var target2;
var targetView2;
var position4 = 0;
var safeEnd2;
var bundledStrings4 = null;
var MAX_BUNDLE_SIZE2 = 61440;
var hasNonLatin2 = /[\u0080-\uFFFF]/;
var RECORD_SYMBOL2 = /* @__PURE__ */ Symbol("record-id");
var Encoder2 = class extends Decoder2 {
  constructor(options) {
    super(options);
    this.offset = 0;
    let typeBuffer;
    let start;
    let sharedStructures;
    let hasSharedUpdate;
    let structures;
    let referenceMap3;
    options = options || {};
    let encodeUtf8 = ByteArray2.prototype.utf8Write ? function(string, position5, maxBytes) {
      return target2.utf8Write(string, position5, maxBytes);
    } : textEncoder2 && textEncoder2.encodeInto ? function(string, position5) {
      return textEncoder2.encodeInto(string, target2.subarray(position5)).written;
    } : false;
    let encoder = this;
    let hasSharedStructures = options.structures || options.saveStructures;
    let maxSharedStructures = options.maxSharedStructures;
    if (maxSharedStructures == null)
      maxSharedStructures = hasSharedStructures ? 128 : 0;
    if (maxSharedStructures > 8190)
      throw new Error("Maximum maxSharedStructure is 8190");
    let isSequential = options.sequential;
    if (isSequential) {
      maxSharedStructures = 0;
    }
    if (!this.structures)
      this.structures = [];
    if (this.saveStructures)
      this.saveShared = this.saveStructures;
    let samplingPackedValues, packedObjectMap2, sharedValues = options.sharedValues;
    let sharedPackedObjectMap2;
    if (sharedValues) {
      sharedPackedObjectMap2 = /* @__PURE__ */ Object.create(null);
      for (let i = 0, l3 = sharedValues.length; i < l3; i++) {
        sharedPackedObjectMap2[sharedValues[i]] = i;
      }
    }
    let recordIdsToRemove = [];
    let transitionsCount = 0;
    let serializationsSinceTransitionRebuild = 0;
    this.mapEncode = function(value, encodeOptions) {
      if (this._keyMap && !this._mapped) {
        switch (value.constructor.name) {
          case "Array":
            value = value.map((r) => this.encodeKeys(r));
            break;
        }
      }
      return this.encode(value, encodeOptions);
    };
    this.encode = function(value, encodeOptions) {
      if (!target2) {
        target2 = new ByteArrayAllocate2(8192);
        targetView2 = new DataView(target2.buffer, 0, 8192);
        position4 = 0;
      }
      safeEnd2 = target2.length - 10;
      if (safeEnd2 - position4 < 2048) {
        target2 = new ByteArrayAllocate2(target2.length);
        targetView2 = new DataView(target2.buffer, 0, target2.length);
        safeEnd2 = target2.length - 10;
        position4 = 0;
      } else if (encodeOptions === REUSE_BUFFER_MODE2)
        position4 = position4 + 7 & 2147483640;
      start = position4;
      if (encoder.useSelfDescribedHeader) {
        targetView2.setUint32(position4, 3654940416);
        position4 += 3;
      }
      referenceMap3 = encoder.structuredClone ? /* @__PURE__ */ new Map() : null;
      if (encoder.bundleStrings && typeof value !== "string") {
        bundledStrings4 = [];
        bundledStrings4.size = Infinity;
      } else
        bundledStrings4 = null;
      sharedStructures = encoder.structures;
      if (sharedStructures) {
        if (sharedStructures.uninitialized) {
          let sharedData = encoder.getShared() || {};
          encoder.structures = sharedStructures = sharedData.structures || [];
          encoder.sharedVersion = sharedData.version;
          let sharedValues2 = encoder.sharedValues = sharedData.packedValues;
          if (sharedValues2) {
            sharedPackedObjectMap2 = {};
            for (let i = 0, l3 = sharedValues2.length; i < l3; i++)
              sharedPackedObjectMap2[sharedValues2[i]] = i;
          }
        }
        let sharedStructuresLength = sharedStructures.length;
        if (sharedStructuresLength > maxSharedStructures && !isSequential)
          sharedStructuresLength = maxSharedStructures;
        if (!sharedStructures.transitions) {
          sharedStructures.transitions = /* @__PURE__ */ Object.create(null);
          for (let i = 0; i < sharedStructuresLength; i++) {
            let keys = sharedStructures[i];
            if (!keys)
              continue;
            let nextTransition, transition = sharedStructures.transitions;
            for (let j3 = 0, l3 = keys.length; j3 < l3; j3++) {
              if (transition[RECORD_SYMBOL2] === void 0)
                transition[RECORD_SYMBOL2] = i;
              let key = keys[j3];
              nextTransition = transition[key];
              if (!nextTransition) {
                nextTransition = transition[key] = /* @__PURE__ */ Object.create(null);
              }
              transition = nextTransition;
            }
            transition[RECORD_SYMBOL2] = i | 1048576;
          }
        }
        if (!isSequential)
          sharedStructures.nextId = sharedStructuresLength;
      }
      if (hasSharedUpdate)
        hasSharedUpdate = false;
      structures = sharedStructures || [];
      packedObjectMap2 = sharedPackedObjectMap2;
      if (options.pack) {
        let packedValues3 = /* @__PURE__ */ new Map();
        packedValues3.values = [];
        packedValues3.encoder = encoder;
        packedValues3.maxValues = options.maxPrivatePackedValues || (sharedPackedObjectMap2 ? 16 : Infinity);
        packedValues3.objectMap = sharedPackedObjectMap2 || false;
        packedValues3.samplingPackedValues = samplingPackedValues;
        findRepetitiveStrings2(value, packedValues3);
        if (packedValues3.values.length > 0) {
          target2[position4++] = 216;
          target2[position4++] = 51;
          writeArrayHeader2(4);
          let valuesArray = packedValues3.values;
          encode3(valuesArray);
          writeArrayHeader2(0);
          writeArrayHeader2(0);
          packedObjectMap2 = Object.create(sharedPackedObjectMap2 || null);
          for (let i = 0, l3 = valuesArray.length; i < l3; i++) {
            packedObjectMap2[valuesArray[i]] = i;
          }
        }
      }
      throwOnIterable2 = encodeOptions & THROW_ON_ITERABLE2;
      try {
        if (throwOnIterable2)
          return;
        encode3(value);
        if (bundledStrings4) {
          writeBundles2(start, encode3);
        }
        encoder.offset = position4;
        if (referenceMap3 && referenceMap3.idsToInsert) {
          position4 += referenceMap3.idsToInsert.length * 2;
          if (position4 > safeEnd2)
            makeRoom(position4);
          encoder.offset = position4;
          let serialized = insertIds2(target2.subarray(start, position4), referenceMap3.idsToInsert);
          referenceMap3 = null;
          return serialized;
        }
        if (encodeOptions & REUSE_BUFFER_MODE2) {
          target2.start = start;
          target2.end = position4;
          return target2;
        }
        return target2.subarray(start, position4);
      } finally {
        if (sharedStructures) {
          if (serializationsSinceTransitionRebuild < 10)
            serializationsSinceTransitionRebuild++;
          if (sharedStructures.length > maxSharedStructures)
            sharedStructures.length = maxSharedStructures;
          if (transitionsCount > 1e4) {
            sharedStructures.transitions = null;
            serializationsSinceTransitionRebuild = 0;
            transitionsCount = 0;
            if (recordIdsToRemove.length > 0)
              recordIdsToRemove = [];
          } else if (recordIdsToRemove.length > 0 && !isSequential) {
            for (let i = 0, l3 = recordIdsToRemove.length; i < l3; i++) {
              recordIdsToRemove[i][RECORD_SYMBOL2] = void 0;
            }
            recordIdsToRemove = [];
          }
        }
        if (hasSharedUpdate && encoder.saveShared) {
          if (encoder.structures.length > maxSharedStructures) {
            encoder.structures = encoder.structures.slice(0, maxSharedStructures);
          }
          let returnBuffer = target2.subarray(start, position4);
          if (encoder.updateSharedData() === false)
            return encoder.encode(value);
          return returnBuffer;
        }
        if (encodeOptions & RESET_BUFFER_MODE2)
          position4 = start;
      }
    };
    this.findCommonStringsToPack = () => {
      samplingPackedValues = /* @__PURE__ */ new Map();
      if (!sharedPackedObjectMap2)
        sharedPackedObjectMap2 = /* @__PURE__ */ Object.create(null);
      return (options2) => {
        let threshold = options2 && options2.threshold || 4;
        let position5 = this.pack ? options2.maxPrivatePackedValues || 16 : 0;
        if (!sharedValues)
          sharedValues = this.sharedValues = [];
        for (let [key, status] of samplingPackedValues) {
          if (status.count > threshold) {
            sharedPackedObjectMap2[key] = position5++;
            sharedValues.push(key);
            hasSharedUpdate = true;
          }
        }
        while (this.saveShared && this.updateSharedData() === false) {
        }
        samplingPackedValues = null;
      };
    };
    const encode3 = (value) => {
      if (position4 > safeEnd2)
        target2 = makeRoom(position4);
      var type = typeof value;
      var length;
      if (type === "string") {
        if (packedObjectMap2) {
          let packedPosition = packedObjectMap2[value];
          if (packedPosition >= 0) {
            if (packedPosition < 16)
              target2[position4++] = packedPosition + 224;
            else {
              target2[position4++] = 198;
              if (packedPosition & 1)
                encode3(15 - packedPosition >> 1);
              else
                encode3(packedPosition - 16 >> 1);
            }
            return;
          } else if (samplingPackedValues && !options.pack) {
            let status = samplingPackedValues.get(value);
            if (status)
              status.count++;
            else
              samplingPackedValues.set(value, {
                count: 1
              });
          }
        }
        let strLength = value.length;
        if (bundledStrings4 && strLength >= 4 && strLength < 1024) {
          if ((bundledStrings4.size += strLength) > MAX_BUNDLE_SIZE2) {
            let extStart;
            let maxBytes2 = (bundledStrings4[0] ? bundledStrings4[0].length * 3 + bundledStrings4[1].length : 0) + 10;
            if (position4 + maxBytes2 > safeEnd2)
              target2 = makeRoom(position4 + maxBytes2);
            target2[position4++] = 217;
            target2[position4++] = 223;
            target2[position4++] = 249;
            target2[position4++] = bundledStrings4.position ? 132 : 130;
            target2[position4++] = 26;
            extStart = position4 - start;
            position4 += 4;
            if (bundledStrings4.position) {
              writeBundles2(start, encode3);
            }
            bundledStrings4 = ["", ""];
            bundledStrings4.size = 0;
            bundledStrings4.position = extStart;
          }
          let twoByte = hasNonLatin2.test(value);
          bundledStrings4[twoByte ? 0 : 1] += value;
          target2[position4++] = twoByte ? 206 : 207;
          encode3(strLength);
          return;
        }
        let headerSize;
        if (strLength < 32) {
          headerSize = 1;
        } else if (strLength < 256) {
          headerSize = 2;
        } else if (strLength < 65536) {
          headerSize = 3;
        } else {
          headerSize = 5;
        }
        let maxBytes = strLength * 3;
        if (position4 + maxBytes > safeEnd2)
          target2 = makeRoom(position4 + maxBytes);
        if (strLength < 64 || !encodeUtf8) {
          let i, c1, c2, strPosition = position4 + headerSize;
          for (i = 0; i < strLength; i++) {
            c1 = value.charCodeAt(i);
            if (c1 < 128) {
              target2[strPosition++] = c1;
            } else if (c1 < 2048) {
              target2[strPosition++] = c1 >> 6 | 192;
              target2[strPosition++] = c1 & 63 | 128;
            } else if ((c1 & 64512) === 55296 && ((c2 = value.charCodeAt(i + 1)) & 64512) === 56320) {
              c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
              i++;
              target2[strPosition++] = c1 >> 18 | 240;
              target2[strPosition++] = c1 >> 12 & 63 | 128;
              target2[strPosition++] = c1 >> 6 & 63 | 128;
              target2[strPosition++] = c1 & 63 | 128;
            } else {
              target2[strPosition++] = c1 >> 12 | 224;
              target2[strPosition++] = c1 >> 6 & 63 | 128;
              target2[strPosition++] = c1 & 63 | 128;
            }
          }
          length = strPosition - position4 - headerSize;
        } else {
          length = encodeUtf8(value, position4 + headerSize, maxBytes);
        }
        if (length < 24) {
          target2[position4++] = 96 | length;
        } else if (length < 256) {
          if (headerSize < 2) {
            target2.copyWithin(position4 + 2, position4 + 1, position4 + 1 + length);
          }
          target2[position4++] = 120;
          target2[position4++] = length;
        } else if (length < 65536) {
          if (headerSize < 3) {
            target2.copyWithin(position4 + 3, position4 + 2, position4 + 2 + length);
          }
          target2[position4++] = 121;
          target2[position4++] = length >> 8;
          target2[position4++] = length & 255;
        } else {
          if (headerSize < 5) {
            target2.copyWithin(position4 + 5, position4 + 3, position4 + 3 + length);
          }
          target2[position4++] = 122;
          targetView2.setUint32(position4, length);
          position4 += 4;
        }
        position4 += length;
      } else if (type === "number") {
        if (!this.alwaysUseFloat && value >>> 0 === value) {
          if (value < 24) {
            target2[position4++] = value;
          } else if (value < 256) {
            target2[position4++] = 24;
            target2[position4++] = value;
          } else if (value < 65536) {
            target2[position4++] = 25;
            target2[position4++] = value >> 8;
            target2[position4++] = value & 255;
          } else {
            target2[position4++] = 26;
            targetView2.setUint32(position4, value);
            position4 += 4;
          }
        } else if (!this.alwaysUseFloat && value >> 0 === value) {
          if (value >= -24) {
            target2[position4++] = 31 - value;
          } else if (value >= -256) {
            target2[position4++] = 56;
            target2[position4++] = ~value;
          } else if (value >= -65536) {
            target2[position4++] = 57;
            targetView2.setUint16(position4, ~value);
            position4 += 2;
          } else {
            target2[position4++] = 58;
            targetView2.setUint32(position4, ~value);
            position4 += 4;
          }
        } else {
          let useFloat32;
          if ((useFloat32 = this.useFloat32) > 0 && value < 4294967296 && value >= -2147483648) {
            target2[position4++] = 250;
            targetView2.setFloat32(position4, value);
            let xShifted;
            if (useFloat32 < 4 || // this checks for rounding of numbers that were encoded in 32-bit float to nearest significant decimal digit that could be preserved
            (xShifted = value * mult102[(target2[position4] & 127) << 1 | target2[position4 + 1] >> 7]) >> 0 === xShifted) {
              position4 += 4;
              return;
            } else
              position4--;
          }
          target2[position4++] = 251;
          targetView2.setFloat64(position4, value);
          position4 += 8;
        }
      } else if (type === "object") {
        if (!value)
          target2[position4++] = 246;
        else {
          if (referenceMap3) {
            let referee = referenceMap3.get(value);
            if (referee) {
              target2[position4++] = 216;
              target2[position4++] = 29;
              target2[position4++] = 25;
              if (!referee.references) {
                let idsToInsert = referenceMap3.idsToInsert || (referenceMap3.idsToInsert = []);
                referee.references = [];
                idsToInsert.push(referee);
              }
              referee.references.push(position4 - start);
              position4 += 2;
              return;
            } else
              referenceMap3.set(value, { offset: position4 - start });
          }
          let constructor = value.constructor;
          if (constructor === Object) {
            writeObject(value, true);
          } else if (constructor === Array) {
            length = value.length;
            if (length < 24) {
              target2[position4++] = 128 | length;
            } else {
              writeArrayHeader2(length);
            }
            for (let i = 0; i < length; i++) {
              encode3(value[i]);
            }
          } else if (constructor === Map) {
            if (this.mapsAsObjects ? this.useTag259ForMaps !== false : this.useTag259ForMaps) {
              target2[position4++] = 217;
              target2[position4++] = 1;
              target2[position4++] = 3;
            }
            length = value.size;
            if (length < 24) {
              target2[position4++] = 160 | length;
            } else if (length < 256) {
              target2[position4++] = 184;
              target2[position4++] = length;
            } else if (length < 65536) {
              target2[position4++] = 185;
              target2[position4++] = length >> 8;
              target2[position4++] = length & 255;
            } else {
              target2[position4++] = 186;
              targetView2.setUint32(position4, length);
              position4 += 4;
            }
            if (encoder.keyMap) {
              for (let [key, entryValue] of value) {
                encode3(encoder.encodeKey(key));
                encode3(entryValue);
              }
            } else {
              for (let [key, entryValue] of value) {
                encode3(key);
                encode3(entryValue);
              }
            }
          } else {
            for (let i = 0, l3 = extensions2.length; i < l3; i++) {
              let extensionClass = extensionClasses2[i];
              if (value instanceof extensionClass) {
                let extension = extensions2[i];
                let tag = extension.tag;
                if (tag == void 0)
                  tag = extension.getTag && extension.getTag.call(this, value);
                if (tag < 24) {
                  target2[position4++] = 192 | tag;
                } else if (tag < 256) {
                  target2[position4++] = 216;
                  target2[position4++] = tag;
                } else if (tag < 65536) {
                  target2[position4++] = 217;
                  target2[position4++] = tag >> 8;
                  target2[position4++] = tag & 255;
                } else if (tag > -1) {
                  target2[position4++] = 218;
                  targetView2.setUint32(position4, tag);
                  position4 += 4;
                }
                extension.encode.call(this, value, encode3, makeRoom);
                return;
              }
            }
            if (value[Symbol.iterator]) {
              if (throwOnIterable2) {
                let error = new Error("Iterable should be serialized as iterator");
                error.iteratorNotHandled = true;
                throw error;
              }
              target2[position4++] = 159;
              for (let entry of value) {
                encode3(entry);
              }
              target2[position4++] = 255;
              return;
            }
            if (value[Symbol.asyncIterator] || isBlob2(value)) {
              let error = new Error("Iterable/blob should be serialized as iterator");
              error.iteratorNotHandled = true;
              throw error;
            }
            writeObject(value, !value.hasOwnProperty);
          }
        }
      } else if (type === "boolean") {
        target2[position4++] = value ? 245 : 244;
      } else if (type === "bigint") {
        if (value < BigInt(1) << BigInt(64) && value >= 0) {
          target2[position4++] = 27;
          targetView2.setBigUint64(position4, value);
        } else if (value > -(BigInt(1) << BigInt(64)) && value < 0) {
          target2[position4++] = 59;
          targetView2.setBigUint64(position4, -value - BigInt(1));
        } else {
          if (this.largeBigIntToFloat) {
            target2[position4++] = 251;
            targetView2.setFloat64(position4, Number(value));
          } else {
            throw new RangeError(value + " was too large to fit in CBOR 64-bit integer format, set largeBigIntToFloat to convert to float-64");
          }
        }
        position4 += 8;
      } else if (type === "undefined") {
        target2[position4++] = 247;
      } else {
        throw new Error("Unknown type: " + type);
      }
    };
    const writeObject = this.useRecords === false ? this.variableMapSize ? (object) => {
      let keys = Object.keys(object);
      let vals = Object.values(object);
      let length = keys.length;
      if (length < 24) {
        target2[position4++] = 160 | length;
      } else if (length < 256) {
        target2[position4++] = 184;
        target2[position4++] = length;
      } else if (length < 65536) {
        target2[position4++] = 185;
        target2[position4++] = length >> 8;
        target2[position4++] = length & 255;
      } else {
        target2[position4++] = 186;
        targetView2.setUint32(position4, length);
        position4 += 4;
      }
      let key;
      if (encoder.keyMap) {
        for (let i = 0; i < length; i++) {
          encode3(encodeKey(keys[i]));
          encode3(vals[i]);
        }
      } else {
        for (let i = 0; i < length; i++) {
          encode3(keys[i]);
          encode3(vals[i]);
        }
      }
    } : (object, safePrototype) => {
      target2[position4++] = 185;
      let objectOffset = position4 - start;
      position4 += 2;
      let size = 0;
      if (encoder.keyMap) {
        for (let key in object)
          if (safePrototype || object.hasOwnProperty(key)) {
            encode3(encoder.encodeKey(key));
            encode3(object[key]);
            size++;
          }
      } else {
        for (let key in object)
          if (safePrototype || object.hasOwnProperty(key)) {
            encode3(key);
            encode3(object[key]);
            size++;
          }
      }
      target2[objectOffset++ + start] = size >> 8;
      target2[objectOffset + start] = size & 255;
    } : (object, safePrototype) => {
      let nextTransition, transition = structures.transitions || (structures.transitions = /* @__PURE__ */ Object.create(null));
      let newTransitions = 0;
      let length = 0;
      let parentRecordId;
      let keys;
      if (this.keyMap) {
        keys = Object.keys(object).map((k3) => this.encodeKey(k3));
        length = keys.length;
        for (let i = 0; i < length; i++) {
          let key = keys[i];
          nextTransition = transition[key];
          if (!nextTransition) {
            nextTransition = transition[key] = /* @__PURE__ */ Object.create(null);
            newTransitions++;
          }
          transition = nextTransition;
        }
      } else {
        for (let key in object)
          if (safePrototype || object.hasOwnProperty(key)) {
            nextTransition = transition[key];
            if (!nextTransition) {
              if (transition[RECORD_SYMBOL2] & 1048576) {
                parentRecordId = transition[RECORD_SYMBOL2] & 65535;
              }
              nextTransition = transition[key] = /* @__PURE__ */ Object.create(null);
              newTransitions++;
            }
            transition = nextTransition;
            length++;
          }
      }
      let recordId = transition[RECORD_SYMBOL2];
      if (recordId !== void 0) {
        recordId &= 65535;
        target2[position4++] = 217;
        target2[position4++] = recordId >> 8 | 224;
        target2[position4++] = recordId & 255;
      } else {
        if (!keys)
          keys = transition.__keys__ || (transition.__keys__ = Object.keys(object));
        if (parentRecordId === void 0) {
          recordId = structures.nextId++;
          if (!recordId) {
            recordId = 0;
            structures.nextId = 1;
          }
          if (recordId >= MAX_STRUCTURES2) {
            structures.nextId = (recordId = maxSharedStructures) + 1;
          }
        } else {
          recordId = parentRecordId;
        }
        structures[recordId] = keys;
        if (recordId < maxSharedStructures) {
          target2[position4++] = 217;
          target2[position4++] = recordId >> 8 | 224;
          target2[position4++] = recordId & 255;
          transition = structures.transitions;
          for (let i = 0; i < length; i++) {
            if (transition[RECORD_SYMBOL2] === void 0 || transition[RECORD_SYMBOL2] & 1048576)
              transition[RECORD_SYMBOL2] = recordId;
            transition = transition[keys[i]];
          }
          transition[RECORD_SYMBOL2] = recordId | 1048576;
          hasSharedUpdate = true;
        } else {
          transition[RECORD_SYMBOL2] = recordId;
          targetView2.setUint32(position4, 3655335680);
          position4 += 3;
          if (newTransitions)
            transitionsCount += serializationsSinceTransitionRebuild * newTransitions;
          if (recordIdsToRemove.length >= MAX_STRUCTURES2 - maxSharedStructures)
            recordIdsToRemove.shift()[RECORD_SYMBOL2] = void 0;
          recordIdsToRemove.push(transition);
          writeArrayHeader2(length + 2);
          encode3(57344 + recordId);
          encode3(keys);
          if (safePrototype === null)
            return;
          for (let key in object)
            if (safePrototype || object.hasOwnProperty(key))
              encode3(object[key]);
          return;
        }
      }
      if (length < 24) {
        target2[position4++] = 128 | length;
      } else {
        writeArrayHeader2(length);
      }
      if (safePrototype === null)
        return;
      for (let key in object)
        if (safePrototype || object.hasOwnProperty(key))
          encode3(object[key]);
    };
    const makeRoom = (end) => {
      let newSize;
      if (end > 16777216) {
        if (end - start > MAX_BUFFER_SIZE2)
          throw new Error("Encoded buffer would be larger than maximum buffer size");
        newSize = Math.min(MAX_BUFFER_SIZE2, Math.round(Math.max((end - start) * (end > 67108864 ? 1.25 : 2), 4194304) / 4096) * 4096);
      } else
        newSize = (Math.max(end - start << 2, target2.length - 1) >> 12) + 1 << 12;
      let newBuffer = new ByteArrayAllocate2(newSize);
      targetView2 = new DataView(newBuffer.buffer, 0, newSize);
      if (target2.copy)
        target2.copy(newBuffer, 0, start, end);
      else
        newBuffer.set(target2.slice(start, end));
      position4 -= start;
      start = 0;
      safeEnd2 = newBuffer.length - 10;
      return target2 = newBuffer;
    };
    let chunkThreshold = 100;
    let continuedChunkThreshold = 1e3;
    this.encodeAsIterable = function(value, options2) {
      return startEncoding(value, options2, encodeObjectAsIterable);
    };
    this.encodeAsAsyncIterable = function(value, options2) {
      return startEncoding(value, options2, encodeObjectAsAsyncIterable);
    };
    function* encodeObjectAsIterable(object, iterateProperties, finalIterable) {
      let constructor = object.constructor;
      if (constructor === Object) {
        let useRecords = encoder.useRecords !== false;
        if (useRecords)
          writeObject(object, null);
        else
          writeEntityLength2(Object.keys(object).length, 160);
        for (let key in object) {
          let value = object[key];
          if (!useRecords)
            encode3(key);
          if (value && typeof value === "object") {
            if (iterateProperties[key])
              yield* encodeObjectAsIterable(value, iterateProperties[key]);
            else
              yield* tryEncode(value, iterateProperties, key);
          } else
            encode3(value);
        }
      } else if (constructor === Array) {
        let length = object.length;
        writeArrayHeader2(length);
        for (let i = 0; i < length; i++) {
          let value = object[i];
          if (value && (typeof value === "object" || position4 - start > chunkThreshold)) {
            if (iterateProperties.element)
              yield* encodeObjectAsIterable(value, iterateProperties.element);
            else
              yield* tryEncode(value, iterateProperties, "element");
          } else
            encode3(value);
        }
      } else if (object[Symbol.iterator]) {
        target2[position4++] = 159;
        for (let value of object) {
          if (value && (typeof value === "object" || position4 - start > chunkThreshold)) {
            if (iterateProperties.element)
              yield* encodeObjectAsIterable(value, iterateProperties.element);
            else
              yield* tryEncode(value, iterateProperties, "element");
          } else
            encode3(value);
        }
        target2[position4++] = 255;
      } else if (isBlob2(object)) {
        writeEntityLength2(object.size, 64);
        yield target2.subarray(start, position4);
        yield object;
        restartEncoding();
      } else if (object[Symbol.asyncIterator]) {
        target2[position4++] = 159;
        yield target2.subarray(start, position4);
        yield object;
        restartEncoding();
        target2[position4++] = 255;
      } else {
        encode3(object);
      }
      if (finalIterable && position4 > start)
        yield target2.subarray(start, position4);
      else if (position4 - start > chunkThreshold) {
        yield target2.subarray(start, position4);
        restartEncoding();
      }
    }
    function* tryEncode(value, iterateProperties, key) {
      let restart = position4 - start;
      try {
        encode3(value);
        if (position4 - start > chunkThreshold) {
          yield target2.subarray(start, position4);
          restartEncoding();
        }
      } catch (error) {
        if (error.iteratorNotHandled) {
          iterateProperties[key] = {};
          position4 = start + restart;
          yield* encodeObjectAsIterable.call(this, value, iterateProperties[key]);
        } else
          throw error;
      }
    }
    function restartEncoding() {
      chunkThreshold = continuedChunkThreshold;
      encoder.encode(null, THROW_ON_ITERABLE2);
    }
    function startEncoding(value, options2, encodeIterable) {
      if (options2 && options2.chunkThreshold)
        chunkThreshold = continuedChunkThreshold = options2.chunkThreshold;
      else
        chunkThreshold = 100;
      if (value && typeof value === "object") {
        encoder.encode(null, THROW_ON_ITERABLE2);
        return encodeIterable(value, encoder.iterateProperties || (encoder.iterateProperties = {}), true);
      }
      return [encoder.encode(value)];
    }
    async function* encodeObjectAsAsyncIterable(value, iterateProperties) {
      for (let encodedValue of encodeObjectAsIterable(value, iterateProperties, true)) {
        let constructor = encodedValue.constructor;
        if (constructor === ByteArray2 || constructor === Uint8Array)
          yield encodedValue;
        else if (isBlob2(encodedValue)) {
          let reader = encodedValue.stream().getReader();
          let next;
          while (!(next = await reader.read()).done) {
            yield next.value;
          }
        } else if (encodedValue[Symbol.asyncIterator]) {
          for await (let asyncValue of encodedValue) {
            restartEncoding();
            if (asyncValue)
              yield* encodeObjectAsAsyncIterable(asyncValue, iterateProperties.async || (iterateProperties.async = {}));
            else
              yield encoder.encode(asyncValue);
          }
        } else {
          yield encodedValue;
        }
      }
    }
  }
  useBuffer(buffer) {
    target2 = buffer;
    targetView2 = new DataView(target2.buffer, target2.byteOffset, target2.byteLength);
    position4 = 0;
  }
  clearSharedData() {
    if (this.structures)
      this.structures = [];
    if (this.sharedValues)
      this.sharedValues = void 0;
  }
  updateSharedData() {
    let lastVersion = this.sharedVersion || 0;
    this.sharedVersion = lastVersion + 1;
    let structuresCopy = this.structures.slice(0);
    let sharedData = new SharedData2(structuresCopy, this.sharedValues, this.sharedVersion);
    let saveResults = this.saveShared(sharedData, (existingShared) => (existingShared && existingShared.version || 0) == lastVersion);
    if (saveResults === false) {
      sharedData = this.getShared() || {};
      this.structures = sharedData.structures || [];
      this.sharedValues = sharedData.packedValues;
      this.sharedVersion = sharedData.version;
      this.structures.nextId = this.structures.length;
    } else {
      structuresCopy.forEach((structure, i) => this.structures[i] = structure);
    }
    return saveResults;
  }
};
function writeEntityLength2(length, majorValue) {
  if (length < 24)
    target2[position4++] = majorValue | length;
  else if (length < 256) {
    target2[position4++] = majorValue | 24;
    target2[position4++] = length;
  } else if (length < 65536) {
    target2[position4++] = majorValue | 25;
    target2[position4++] = length >> 8;
    target2[position4++] = length & 255;
  } else {
    target2[position4++] = majorValue | 26;
    targetView2.setUint32(position4, length);
    position4 += 4;
  }
}
var SharedData2 = class {
  constructor(structures, values, version) {
    this.structures = structures;
    this.packedValues = values;
    this.version = version;
  }
};
function writeArrayHeader2(length) {
  if (length < 24)
    target2[position4++] = 128 | length;
  else if (length < 256) {
    target2[position4++] = 152;
    target2[position4++] = length;
  } else if (length < 65536) {
    target2[position4++] = 153;
    target2[position4++] = length >> 8;
    target2[position4++] = length & 255;
  } else {
    target2[position4++] = 154;
    targetView2.setUint32(position4, length);
    position4 += 4;
  }
}
var BlobConstructor2 = typeof Blob === "undefined" ? function() {
} : Blob;
function isBlob2(object) {
  if (object instanceof BlobConstructor2)
    return true;
  let tag = object[Symbol.toStringTag];
  return tag === "Blob" || tag === "File";
}
function findRepetitiveStrings2(value, packedValues3) {
  switch (typeof value) {
    case "string":
      if (value.length > 3) {
        if (packedValues3.objectMap[value] > -1 || packedValues3.values.length >= packedValues3.maxValues)
          return;
        let packedStatus = packedValues3.get(value);
        if (packedStatus) {
          if (++packedStatus.count == 2) {
            packedValues3.values.push(value);
          }
        } else {
          packedValues3.set(value, {
            count: 1
          });
          if (packedValues3.samplingPackedValues) {
            let status = packedValues3.samplingPackedValues.get(value);
            if (status)
              status.count++;
            else
              packedValues3.samplingPackedValues.set(value, {
                count: 1
              });
          }
        }
      }
      break;
    case "object":
      if (value) {
        if (value instanceof Array) {
          for (let i = 0, l3 = value.length; i < l3; i++) {
            findRepetitiveStrings2(value[i], packedValues3);
          }
        } else {
          let includeKeys = !packedValues3.encoder.useRecords;
          for (var key in value) {
            if (value.hasOwnProperty(key)) {
              if (includeKeys)
                findRepetitiveStrings2(key, packedValues3);
              findRepetitiveStrings2(value[key], packedValues3);
            }
          }
        }
      }
      break;
    case "function":
      console.log(value);
  }
}
var isLittleEndianMachine4 = new Uint8Array(new Uint16Array([1]).buffer)[0] == 1;
extensionClasses2 = [
  Date,
  Set,
  Error,
  RegExp,
  Tag2,
  ArrayBuffer,
  Uint8Array,
  Uint8ClampedArray,
  Uint16Array,
  Uint32Array,
  typeof BigUint64Array == "undefined" ? function() {
  } : BigUint64Array,
  Int8Array,
  Int16Array,
  Int32Array,
  typeof BigInt64Array == "undefined" ? function() {
  } : BigInt64Array,
  Float32Array,
  Float64Array,
  SharedData2
];
extensions2 = [
  {
    tag: 1,
    encode(date, encode3) {
      let seconds = date.getTime() / 1e3;
      if ((this.useTimestamp32 || date.getMilliseconds() === 0) && seconds >= 0 && seconds < 4294967296) {
        target2[position4++] = 26;
        targetView2.setUint32(position4, seconds);
        position4 += 4;
      } else {
        target2[position4++] = 251;
        targetView2.setFloat64(position4, seconds);
        position4 += 8;
      }
    }
  },
  {
    tag: 258,
    encode(set, encode3) {
      let array = Array.from(set);
      encode3(array);
    }
  },
  {
    tag: 27,
    encode(error, encode3) {
      encode3([error.name, error.message]);
    }
  },
  {
    tag: 27,
    encode(regex, encode3) {
      encode3(["RegExp", regex.source, regex.flags]);
    }
  },
  {
    getTag(tag) {
      return tag.tag;
    },
    encode(tag, encode3) {
      encode3(tag.value);
    }
  },
  {
    encode(arrayBuffer, encode3, makeRoom) {
      writeBuffer2(arrayBuffer, makeRoom);
    }
  },
  {
    getTag(typedArray) {
      if (typedArray.constructor === Uint8Array) {
        if (this.tagUint8Array || hasNodeBuffer2 && this.tagUint8Array !== false)
          return 64;
      }
    },
    encode(typedArray, encode3, makeRoom) {
      writeBuffer2(typedArray, makeRoom);
    }
  },
  typedArrayEncoder2(68, 1),
  typedArrayEncoder2(69, 2),
  typedArrayEncoder2(70, 4),
  typedArrayEncoder2(71, 8),
  typedArrayEncoder2(72, 1),
  typedArrayEncoder2(77, 2),
  typedArrayEncoder2(78, 4),
  typedArrayEncoder2(79, 8),
  typedArrayEncoder2(85, 4),
  typedArrayEncoder2(86, 8),
  {
    encode(sharedData, encode3) {
      let packedValues3 = sharedData.packedValues || [];
      let sharedStructures = sharedData.structures || [];
      if (packedValues3.values.length > 0) {
        target2[position4++] = 216;
        target2[position4++] = 51;
        writeArrayHeader2(4);
        let valuesArray = packedValues3.values;
        encode3(valuesArray);
        writeArrayHeader2(0);
        writeArrayHeader2(0);
        packedObjectMap = Object.create(sharedPackedObjectMap || null);
        for (let i = 0, l3 = valuesArray.length; i < l3; i++) {
          packedObjectMap[valuesArray[i]] = i;
        }
      }
      if (sharedStructures) {
        targetView2.setUint32(position4, 3655335424);
        position4 += 3;
        let definitions = sharedStructures.slice(0);
        definitions.unshift(57344);
        definitions.push(new Tag2(sharedData.version, 1399353956));
        encode3(definitions);
      } else
        encode3(new Tag2(sharedData.version, 1399353956));
    }
  }
];
function typedArrayEncoder2(tag, size) {
  if (!isLittleEndianMachine4 && size > 1)
    tag -= 4;
  return {
    tag,
    encode: function writeExtBuffer(typedArray, encode3) {
      let length = typedArray.byteLength;
      let offset = typedArray.byteOffset || 0;
      let buffer = typedArray.buffer || typedArray;
      encode3(hasNodeBuffer2 ? Buffer3.from(buffer, offset, length) : new Uint8Array(buffer, offset, length));
    }
  };
}
function writeBuffer2(buffer, makeRoom) {
  let length = buffer.byteLength;
  if (length < 24) {
    target2[position4++] = 64 + length;
  } else if (length < 256) {
    target2[position4++] = 88;
    target2[position4++] = length;
  } else if (length < 65536) {
    target2[position4++] = 89;
    target2[position4++] = length >> 8;
    target2[position4++] = length & 255;
  } else {
    target2[position4++] = 90;
    targetView2.setUint32(position4, length);
    position4 += 4;
  }
  if (position4 + length >= target2.length) {
    makeRoom(position4 + length);
  }
  target2.set(buffer.buffer ? buffer : new Uint8Array(buffer), position4);
  position4 += length;
}
function insertIds2(serialized, idsToInsert) {
  let nextId;
  let distanceToMove = idsToInsert.length * 2;
  let lastEnd = serialized.length - distanceToMove;
  idsToInsert.sort((a, b2) => a.offset > b2.offset ? 1 : -1);
  for (let id = 0; id < idsToInsert.length; id++) {
    let referee = idsToInsert[id];
    referee.id = id;
    for (let position5 of referee.references) {
      serialized[position5++] = id >> 8;
      serialized[position5] = id & 255;
    }
  }
  while (nextId = idsToInsert.pop()) {
    let offset = nextId.offset;
    serialized.copyWithin(offset + distanceToMove, offset, lastEnd);
    distanceToMove -= 2;
    let position5 = offset + distanceToMove;
    serialized[position5++] = 216;
    serialized[position5++] = 28;
    lastEnd = offset;
  }
  return serialized;
}
function writeBundles2(start, encode3) {
  targetView2.setUint32(bundledStrings4.position + start, position4 - bundledStrings4.position - start + 1);
  let writeStrings = bundledStrings4;
  bundledStrings4 = null;
  encode3(writeStrings[0]);
  encode3(writeStrings[1]);
}
function addExtension4(extension) {
  if (extension.Class) {
    if (!extension.encode)
      throw new Error("Extension has no encode function");
    extensionClasses2.unshift(extension.Class);
    extensions2.unshift(extension);
  }
  addExtension3(extension);
}
var defaultEncoder2 = new Encoder2({ useRecords: false });
var encode2 = defaultEncoder2.encode;
var encodeAsIterable2 = defaultEncoder2.encodeAsIterable;
var encodeAsAsyncIterable2 = defaultEncoder2.encodeAsAsyncIterable;
var { NEVER: NEVER2, ALWAYS: ALWAYS2, DECIMAL_ROUND: DECIMAL_ROUND2, DECIMAL_FIT: DECIMAL_FIT2 } = FLOAT32_OPTIONS2;
var REUSE_BUFFER_MODE2 = 512;
var RESET_BUFFER_MODE2 = 1024;
var THROW_ON_ITERABLE2 = 2048;

// node_modules/@progrium/duplex/esm/codec/cbor.js
var CBORCodec = class {
  constructor(debug3 = false, extensions3) {
    Object.defineProperty(this, "debug", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.debug = debug3;
    if (extensions3) {
      extensions3.forEach(addExtension4);
    }
  }
  encoder(w2) {
    return new CBOREncoder(w2, this.debug);
  }
  decoder(r) {
    return new CBORDecoder(r, this.debug);
  }
};
var CBOREncoder = class {
  constructor(w2, debug3 = false) {
    Object.defineProperty(this, "w", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "debug", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.w = w2;
    this.debug = debug3;
  }
  async encode(v) {
    if (this.debug) {
      console.log("<<", v);
    }
    let buf = encode2(v);
    let nwritten = 0;
    while (nwritten < buf.length) {
      nwritten += await this.w.write(buf.subarray(nwritten));
    }
  }
};
var CBORDecoder = class {
  constructor(r, debug3 = false) {
    Object.defineProperty(this, "r", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "debug", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.r = r;
    this.debug = debug3;
  }
  async decode(len) {
    const buf = new Uint8Array(len);
    let bufread = 0;
    while (bufread < len) {
      const n10 = await this.r.read(buf.subarray(bufread));
      if (n10 === null) {
        return Promise.resolve(null);
      }
      bufread += n10;
    }
    let v = decode2(buf);
    if (this.debug) {
      console.log(">>", v);
    }
    return Promise.resolve(v);
  }
};

// node_modules/@progrium/duplex/esm/buffer.js
function copy(src3, dst, off = 0) {
  off = Math.max(0, Math.min(off, dst.byteLength));
  const dstBytesAvailable = dst.byteLength - off;
  if (src3.byteLength > dstBytesAvailable) {
    src3 = src3.subarray(0, dstBytesAvailable);
  }
  dst.set(src3, off);
  return src3.byteLength;
}
var MIN_READ = 32 * 1024;
var MAX_SIZE = 2 ** 32 - 2;
var Buffer4 = class {
  constructor(ab) {
    Object.defineProperty(this, "_buf", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_off", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this._buf = ab === void 0 ? new Uint8Array(0) : new Uint8Array(ab);
    this._off = 0;
  }
  /** Returns a slice holding the unread portion of the buffer.
   *
   * The slice is valid for use only until the next buffer modification (that
   * is, only until the next call to a method like `read()`, `write()`,
   * `reset()`, or `truncate()`). If `options.copy` is false the slice aliases the buffer content at
   * least until the next buffer modification, so immediate changes to the
   * slice will affect the result of future reads.
   * @param options Defaults to `{ copy: true }`
   */
  bytes(options = { copy: true }) {
    if (options.copy === false)
      return this._buf.subarray(this._off);
    return this._buf.slice(this._off);
  }
  /** Returns whether the unread portion of the buffer is empty. */
  empty() {
    return this._buf.byteLength <= this._off;
  }
  /** A read only number of bytes of the unread portion of the buffer. */
  get length() {
    return this._buf.byteLength - this._off;
  }
  /** The read only capacity of the buffer's underlying byte slice, that is,
   * the total space allocated for the buffer's data. */
  get capacity() {
    return this._buf.buffer.byteLength;
  }
  /** Discards all but the first `n` unread bytes from the buffer but
   * continues to use the same allocated storage. It throws if `n` is
   * negative or greater than the length of the buffer. */
  truncate(n10) {
    if (n10 === 0) {
      this.reset();
      return;
    }
    if (n10 < 0 || n10 > this.length) {
      throw Error("bytes.Buffer: truncation out of range");
    }
    this._reslice(this._off + n10);
  }
  reset() {
    this._reslice(0);
    this._off = 0;
  }
  _tryGrowByReslice(n10) {
    const l3 = this._buf.byteLength;
    if (n10 <= this.capacity - l3) {
      this._reslice(l3 + n10);
      return l3;
    }
    return -1;
  }
  _reslice(len) {
    this._buf = new Uint8Array(this._buf.buffer, 0, len);
  }
  /** Reads the next `p.length` bytes from the buffer or until the buffer is
   * drained. Returns the number of bytes read. If the buffer has no data to
   * return, the return is EOF (`null`). */
  readSync(p) {
    if (this.empty()) {
      this.reset();
      if (p.byteLength === 0) {
        return 0;
      }
      return null;
    }
    const nread = copy(this._buf.subarray(this._off), p);
    this._off += nread;
    return nread;
  }
  /** Reads the next `p.length` bytes from the buffer or until the buffer is
   * drained. Resolves to the number of bytes read. If the buffer has no
   * data to return, resolves to EOF (`null`).
   *
   * NOTE: This methods reads bytes synchronously; it's provided for
   * compatibility with `Reader` interfaces.
   */
  read(p) {
    const rr3 = this.readSync(p);
    return Promise.resolve(rr3);
  }
  writeSync(p) {
    const m2 = this._grow(p.byteLength);
    return copy(p, this._buf, m2);
  }
  /** NOTE: This methods writes bytes synchronously; it's provided for
   * compatibility with `Writer` interface. */
  write(p) {
    const n10 = this.writeSync(p);
    return Promise.resolve(n10);
  }
  _grow(n10) {
    const m2 = this.length;
    if (m2 === 0 && this._off !== 0) {
      this.reset();
    }
    const i = this._tryGrowByReslice(n10);
    if (i >= 0) {
      return i;
    }
    const c = this.capacity;
    if (n10 <= Math.floor(c / 2) - m2) {
      copy(this._buf.subarray(this._off), this._buf);
    } else if (c + n10 > MAX_SIZE) {
      throw new Error("The buffer cannot be grown beyond the maximum size.");
    } else {
      const buf = new Uint8Array(Math.min(2 * c + n10, MAX_SIZE));
      copy(this._buf.subarray(this._off), buf);
      this._buf = buf;
    }
    this._off = 0;
    this._reslice(Math.min(m2 + n10, MAX_SIZE));
    return m2;
  }
  /** Grows the buffer's capacity, if necessary, to guarantee space for
   * another `n` bytes. After `.grow(n)`, at least `n` bytes can be written to
   * the buffer without another allocation. If `n` is negative, `.grow()` will
   * throw. If the buffer can't grow it will throw an error.
   *
   * Based on Go Lang's
   * [Buffer.Grow](https://golang.org/pkg/bytes/_buffer.Grow). */
  grow(n10) {
    if (n10 < 0) {
      throw Error("Buffer.grow: negative count");
    }
    const m2 = this._grow(n10);
    this._reslice(m2);
  }
  /** Reads data from `r` until EOF (`null`) and appends it to the buffer,
   * growing the buffer as needed. It resolves to the number of bytes read.
   * If the buffer becomes too large, `.readFrom()` will reject with an error.
   *
   * Based on Go Lang's
   * [Buffer.ReadFrom](https://golang.org/pkg/bytes/_buffer.ReadFrom). */
  async readFrom(r) {
    let n10 = 0;
    const tmp = new Uint8Array(MIN_READ);
    while (true) {
      const shouldGrow = this.capacity - this.length < MIN_READ;
      const buf = shouldGrow ? tmp : new Uint8Array(this._buf.buffer, this.length);
      const nread = await r.read(buf);
      if (nread === null) {
        return n10;
      }
      if (shouldGrow)
        this.writeSync(buf.subarray(0, nread));
      else
        this._reslice(this.length + nread);
      n10 += nread;
    }
  }
  /** Reads data from `r` until EOF (`null`) and appends it to the buffer,
   * growing the buffer as needed. It returns the number of bytes read. If the
   * buffer becomes too large, `.readFromSync()` will throw an error.
   *
   * Based on Go Lang's
   * [Buffer.ReadFrom](https://golang.org/pkg/bytes/#Buffer.ReadFrom). */
  readFromSync(r) {
    let n10 = 0;
    const tmp = new Uint8Array(MIN_READ);
    while (true) {
      const shouldGrow = this.capacity - this.length < MIN_READ;
      const buf = shouldGrow ? tmp : new Uint8Array(this._buf.buffer, this.length);
      const nread = r.readSync(buf);
      if (nread === null) {
        return n10;
      }
      if (shouldGrow)
        this.writeSync(buf.subarray(0, nread));
      else
        this._reslice(this.length + nread);
      n10 += nread;
    }
  }
};

// node_modules/@progrium/duplex/esm/codec/frame.js
var FrameCodec = class {
  constructor(codec) {
    Object.defineProperty(this, "codec", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.codec = codec;
  }
  encoder(w2) {
    return new FrameEncoder(w2, this.codec);
  }
  decoder(r) {
    return new FrameDecoder(r, this.codec.decoder(r));
  }
};
var FrameEncoder = class {
  constructor(w2, codec) {
    Object.defineProperty(this, "w", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "codec", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.w = w2;
    this.codec = codec;
  }
  async encode(v) {
    const data = new Buffer4();
    const enc = this.codec.encoder(data);
    await enc.encode(v);
    const lenPrefix = new DataView(new ArrayBuffer(4));
    lenPrefix.setUint32(0, data.length);
    const buf = new Uint8Array(data.length + 4);
    buf.set(new Uint8Array(lenPrefix.buffer), 0);
    buf.set(data.bytes(), 4);
    let nwritten = 0;
    while (nwritten < buf.length) {
      nwritten += await this.w.write(buf.subarray(nwritten));
    }
  }
};
var FrameDecoder = class {
  constructor(r, dec) {
    Object.defineProperty(this, "r", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "dec", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.r = r;
    this.dec = dec;
  }
  async decode(len) {
    const prefix = new Uint8Array(4);
    const prefixn = await this.r.read(prefix);
    if (prefixn === null) {
      return null;
    }
    const prefixv = new DataView(prefix.buffer);
    const size = prefixv.getUint32(0);
    return await this.dec.decode(size);
  }
};

// node_modules/@progrium/duplex/esm/rpc/client.js
var Client = class {
  constructor(session, codec) {
    Object.defineProperty(this, "session", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "codec", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.session = session;
    this.codec = codec;
  }
  async call(selector, args) {
    const ch = await this.session.open();
    try {
      const framer = new FrameCodec(this.codec);
      const enc = framer.encoder(ch);
      const dec = framer.decoder(ch);
      await enc.encode({ S: selector });
      await enc.encode(args);
      const header = await dec.decode();
      const resp = new Response2(ch, framer);
      resp.error = header.E;
      if (resp.error !== void 0 && resp.error !== null) {
        throw resp.error;
      }
      resp.value = await dec.decode();
      resp.continue = header.C;
      if (!resp.continue) {
        await ch.close();
      }
      return resp;
    } catch (e) {
      await ch.close();
      return Promise.reject(e);
    }
  }
};
function VirtualCaller(caller) {
  function pathBuilder(path, callable) {
    return new Proxy(Object.assign(() => {
    }, { path, callable }), {
      get(t, prop, rcvr) {
        if (prop.startsWith("__"))
          return Reflect.get(t, prop, rcvr);
        return pathBuilder(t.path ? `${t.path}.${prop}` : prop, t.callable);
      },
      apply(pc, thisArg, args = []) {
        return pc.callable(pc.path, args);
      }
    });
  }
  return pathBuilder("", caller.call.bind(caller));
}

// node_modules/@progrium/duplex/esm/rpc/handler.js
function HandlerFunc(fn2) {
  return { respondRPC: fn2 };
}
function NotFoundHandler() {
  return HandlerFunc((r, c) => {
    r.return(new Error(`not found: ${c.selector}`));
  });
}
function cleanSelector(s4) {
  if (s4 === "") {
    return "/";
  }
  if (s4[0] != "/") {
    s4 = "/" + s4;
  }
  s4 = s4.replace(".", "/");
  return s4.toLowerCase();
}
var RespondMux = class {
  constructor() {
    Object.defineProperty(this, "handlers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.handlers = {};
  }
  async respondRPC(r, c) {
    const h = this.handler(c);
    await h.respondRPC(r, c);
  }
  handler(c) {
    const h = this.match(c.selector);
    if (!h) {
      return NotFoundHandler();
    }
    return h;
  }
  remove(selector) {
    selector = cleanSelector(selector);
    const h = this.match(selector);
    delete this.handlers[selector];
    return h || null;
  }
  match(selector) {
    selector = cleanSelector(selector);
    if (this.handlers.hasOwnProperty(selector)) {
      return this.handlers[selector];
    }
    const patterns = Object.keys(this.handlers).filter((pattern) => pattern.endsWith("/"));
    patterns.sort((a, b2) => b2.length - a.length);
    for (const pattern of patterns) {
      if (selector.startsWith(pattern)) {
        const handler = this.handlers[pattern];
        const matcher = handler;
        if (matcher.match && matcher.match instanceof Function) {
          return matcher.match(selector.slice(pattern.length));
        }
        return handler;
      }
    }
    return null;
  }
  handle(selector, handler) {
    if (selector === "") {
      throw "handle: invalid selector";
    }
    let pattern = cleanSelector(selector);
    const matcher = handler;
    if (matcher["match"] && matcher["match"] instanceof Function && !pattern.endsWith("/")) {
      pattern = pattern + "/";
    }
    if (!handler) {
      throw "handle: invalid handler";
    }
    if (this.match(pattern)) {
      throw "handle: selector already registered";
    }
    this.handlers[pattern] = handler;
  }
};

// node_modules/@progrium/duplex/esm/rpc/responder.js
async function Respond(ch, codec, handler) {
  const framer = new FrameCodec(codec);
  const dec = framer.decoder(ch);
  const callHeader = await dec.decode();
  const call = new Call(callHeader.S, ch, dec);
  call.caller = new Client(ch.session, codec);
  const respHeader = new ResponseHeader();
  const resp = new responder(ch, framer, respHeader);
  if (!handler) {
    handler = new RespondMux();
  }
  await handler.respondRPC(resp, call);
  if (!resp.responded) {
    await resp.return(null);
  }
  return Promise.resolve();
}
var responder = class {
  constructor(ch, codec, header) {
    Object.defineProperty(this, "header", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "ch", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "codec", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "responded", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.ch = ch;
    this.codec = codec;
    this.header = header;
    this.responded = false;
  }
  send(v) {
    return this.codec.encoder(this.ch).encode(v);
  }
  return(v) {
    return this.respond(v, false);
  }
  async continue(v) {
    await this.respond(v, true);
    return this.ch;
  }
  async respond(v, continue_) {
    this.responded = true;
    this.header.C = continue_;
    if (v instanceof Error) {
      this.header.E = v.message;
      v = null;
    }
    await this.send(this.header);
    await this.send(v);
    if (!continue_) {
      await this.ch.close();
    }
    return Promise.resolve();
  }
};

// node_modules/@progrium/duplex/esm/rpc/mod.js
var Call = class {
  constructor(selector, channel, decoder3) {
    Object.defineProperty(this, "selector", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "channel", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "caller", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "decoder", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.selector = selector;
    this.channel = channel;
    this.decoder = decoder3;
  }
  receive() {
    return this.decoder.decode();
  }
};
var ResponseHeader = class {
  constructor() {
    Object.defineProperty(this, "E", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "C", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.E = void 0;
    this.C = false;
  }
};
var Response2 = class {
  constructor(channel, codec) {
    Object.defineProperty(this, "error", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "continue", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "value", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "channel", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "codec", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.channel = channel;
    this.codec = codec;
    this.error = void 0;
    this.continue = false;
  }
  send(v) {
    return this.codec.encoder(this.channel).encode(v);
  }
  receive() {
    return this.codec.decoder(this.channel).decode();
  }
};

// node_modules/@progrium/duplex/esm/fn/proxy.js
function methodProxy(caller) {
  function pathBuilder(path, callable) {
    return new Proxy(Object.assign(() => {
    }, { path, callable }), {
      get(t, prop, rcvr) {
        if (prop.startsWith("__"))
          return Reflect.get(t, prop, rcvr);
        return pathBuilder(t.path ? `${t.path}.${prop}` : prop, t.callable);
      },
      apply(pc, thisArg, args = []) {
        return pc.callable(pc.path, args);
      }
    });
  }
  return pathBuilder("", caller.call.bind(caller));
}

// node_modules/@progrium/duplex/esm/peer/peer.js
var Peer = class {
  constructor(session, codec) {
    Object.defineProperty(this, "session", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "caller", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "codec", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "responder", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.session = session;
    this.codec = codec;
    this.caller = new Client(session, codec);
    this.responder = new RespondMux();
  }
  close() {
    return this.session.close();
  }
  async respond() {
    while (true) {
      const ch = await this.session.accept();
      if (ch === null) {
        break;
      }
      Respond(ch, this.codec, this.responder);
    }
  }
  async call(selector, params) {
    return this.caller.call(selector, params);
  }
  handle(selector, handler) {
    this.responder.handle(selector, handler);
  }
  respondRPC(r, c) {
    this.responder.respondRPC(r, c);
  }
  proxy() {
    return methodProxy(this.caller);
  }
  // deprecated
  virtualize() {
    return VirtualCaller(this.caller);
  }
};

// node_modules/@progrium/duplex/esm/mux/codec/message.js
var OpenID = 100;
var OpenConfirmID = 101;
var OpenFailureID = 102;
var WindowAdjustID = 103;
var DataID = 104;
var EofID = 105;
var CloseID = 106;
var payloadSizes = /* @__PURE__ */ new Map([
  [OpenID, 12],
  [OpenConfirmID, 16],
  [OpenFailureID, 4],
  [WindowAdjustID, 8],
  [DataID, 8],
  [EofID, 4],
  [CloseID, 4]
]);

// node_modules/@progrium/duplex/esm/mux/codec/encoder.js
var Encoder3 = class {
  constructor(w2) {
    Object.defineProperty(this, "w", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.w = w2;
  }
  async encode(m2) {
    if (debug2.messages) {
      console.log("<<ENC", m2);
    }
    const buf = Marshal(m2);
    if (debug2.bytes) {
      console.log("<<ENC", buf);
    }
    let nwritten = 0;
    while (nwritten < buf.length) {
      nwritten += await this.w.write(buf.subarray(nwritten));
    }
    return nwritten;
  }
};
function Marshal(obj) {
  if (obj.ID === CloseID) {
    const m2 = obj;
    const data = new DataView(new ArrayBuffer(5));
    data.setUint8(0, m2.ID);
    data.setUint32(1, m2.channelID);
    return new Uint8Array(data.buffer);
  }
  if (obj.ID === DataID) {
    const m2 = obj;
    const data = new DataView(new ArrayBuffer(9));
    data.setUint8(0, m2.ID);
    data.setUint32(1, m2.channelID);
    data.setUint32(5, m2.length);
    const buf = new Uint8Array(9 + m2.length);
    buf.set(new Uint8Array(data.buffer), 0);
    buf.set(m2.data, 9);
    return buf;
  }
  if (obj.ID === EofID) {
    const m2 = obj;
    const data = new DataView(new ArrayBuffer(5));
    data.setUint8(0, m2.ID);
    data.setUint32(1, m2.channelID);
    return new Uint8Array(data.buffer);
  }
  if (obj.ID === OpenID) {
    const m2 = obj;
    const data = new DataView(new ArrayBuffer(13));
    data.setUint8(0, m2.ID);
    data.setUint32(1, m2.senderID);
    data.setUint32(5, m2.windowSize);
    data.setUint32(9, m2.maxPacketSize);
    return new Uint8Array(data.buffer);
  }
  if (obj.ID === OpenConfirmID) {
    const m2 = obj;
    const data = new DataView(new ArrayBuffer(17));
    data.setUint8(0, m2.ID);
    data.setUint32(1, m2.channelID);
    data.setUint32(5, m2.senderID);
    data.setUint32(9, m2.windowSize);
    data.setUint32(13, m2.maxPacketSize);
    return new Uint8Array(data.buffer);
  }
  if (obj.ID === OpenFailureID) {
    const m2 = obj;
    const data = new DataView(new ArrayBuffer(5));
    data.setUint8(0, m2.ID);
    data.setUint32(1, m2.channelID);
    return new Uint8Array(data.buffer);
  }
  if (obj.ID === WindowAdjustID) {
    const m2 = obj;
    const data = new DataView(new ArrayBuffer(9));
    data.setUint8(0, m2.ID);
    data.setUint32(1, m2.channelID);
    data.setUint32(5, m2.additionalBytes);
    return new Uint8Array(data.buffer);
  }
  throw `marshal of unknown type: ${obj}`;
}

// node_modules/@progrium/duplex/esm/mux/util.js
function concat(list, totalLength) {
  const buf = new Uint8Array(totalLength);
  let offset = 0;
  list.forEach((el) => {
    buf.set(el, offset);
    offset += el.length;
  });
  return buf;
}
var queue = class {
  constructor() {
    Object.defineProperty(this, "q", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "waiters", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "closed", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.q = [];
    this.waiters = [];
    this.closed = false;
  }
  push(obj) {
    if (this.closed)
      throw "closed queue";
    if (this.waiters.length > 0) {
      const waiter = this.waiters.shift();
      if (waiter)
        waiter(obj);
      return;
    }
    this.q.push(obj);
  }
  shift() {
    if (this.closed)
      return Promise.resolve(null);
    return new Promise((resolve) => {
      if (this.q.length > 0) {
        resolve(this.q.shift() || null);
        return;
      }
      this.waiters.push(resolve);
    });
  }
  close() {
    if (this.closed)
      return;
    this.closed = true;
    this.waiters.forEach((waiter) => {
      waiter(null);
    });
  }
};
var ReadBuffer = class {
  constructor() {
    Object.defineProperty(this, "gotEOF", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "readBuf", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "readers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.readBuf = new Uint8Array(0);
    this.gotEOF = false;
    this.readers = [];
  }
  read(p) {
    return new Promise((resolve) => {
      let tryRead = () => {
        if (this.readBuf === void 0) {
          resolve(null);
          return;
        }
        if (this.readBuf.length == 0) {
          if (this.gotEOF) {
            this.readBuf = void 0;
            resolve(null);
            return;
          }
          this.readers.push(tryRead);
          return;
        }
        const data = this.readBuf.slice(0, p.length);
        this.readBuf = this.readBuf.slice(data.length);
        if (this.readBuf.length == 0 && this.gotEOF) {
          this.readBuf = void 0;
        }
        p.set(data);
        resolve(data.length);
      };
      tryRead();
    });
  }
  write(p) {
    if (this.readBuf) {
      this.readBuf = concat([this.readBuf, p], this.readBuf.length + p.length);
    }
    while (!this.readBuf || this.readBuf.length > 0) {
      let reader = this.readers.shift();
      if (!reader)
        break;
      reader();
    }
    return Promise.resolve(p.length);
  }
  eof() {
    this.gotEOF = true;
    this.flushReaders();
  }
  close() {
    this.readBuf = void 0;
    this.flushReaders();
  }
  flushReaders() {
    while (true) {
      const reader = this.readers.shift();
      if (!reader)
        return;
      reader();
    }
  }
};

// node_modules/@progrium/duplex/esm/mux/codec/decoder.js
var Decoder3 = class {
  constructor(r) {
    Object.defineProperty(this, "r", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.r = r;
  }
  async decode() {
    const packet = await readPacket(this.r);
    if (packet === null) {
      return Promise.resolve(null);
    }
    if (debug2.bytes) {
      console.log(">>DEC", packet);
    }
    const msg = Unmarshal(packet);
    if (debug2.messages) {
      console.log(">>DEC", msg);
    }
    return msg;
  }
};
async function readPacket(r) {
  const head = new Uint8Array(1);
  const headn = await r.read(head);
  if (headn === null) {
    return Promise.resolve(null);
  }
  const msgID = head[0];
  const size = payloadSizes.get(msgID);
  if (size === void 0 || msgID < OpenID || msgID > CloseID) {
    return Promise.reject(`bad packet: ${msgID}`);
  }
  const rest = new Uint8Array(size);
  const restn = await r.read(rest);
  if (restn === null) {
    return Promise.reject("unexpected EOF reading packet");
  }
  if (msgID === DataID) {
    const view = new DataView(rest.buffer);
    const datasize = view.getUint32(4);
    let dataread = 0;
    const chunks = [];
    while (dataread < datasize) {
      const chunk = new Uint8Array(datasize - dataread);
      const chunkread = await r.read(chunk);
      if (chunkread === null) {
        return Promise.reject(`unexpected EOF reading data chunk`);
      }
      dataread += chunkread;
      chunks.push(chunk.slice(0, chunkread));
    }
    return concat([head, rest, ...chunks], 1 + rest.length + datasize);
  }
  return concat([head, rest], rest.length + 1);
}
function Unmarshal(packet) {
  const data = new DataView(packet.buffer);
  switch (packet[0]) {
    case CloseID:
      return {
        ID: packet[0],
        channelID: data.getUint32(1)
      };
    case DataID:
      let dataLength = data.getUint32(5);
      let rest = new Uint8Array(packet.buffer.slice(9));
      return {
        ID: packet[0],
        channelID: data.getUint32(1),
        length: dataLength,
        data: rest
      };
    case EofID:
      return {
        ID: packet[0],
        channelID: data.getUint32(1)
      };
    case OpenID:
      return {
        ID: packet[0],
        senderID: data.getUint32(1),
        windowSize: data.getUint32(5),
        maxPacketSize: data.getUint32(9)
      };
    case OpenConfirmID:
      return {
        ID: packet[0],
        channelID: data.getUint32(1),
        senderID: data.getUint32(5),
        windowSize: data.getUint32(9),
        maxPacketSize: data.getUint32(13)
      };
    case OpenFailureID:
      return {
        ID: packet[0],
        channelID: data.getUint32(1)
      };
    case WindowAdjustID:
      return {
        ID: packet[0],
        channelID: data.getUint32(1),
        additionalBytes: data.getUint32(5)
      };
    default:
      throw `unmarshal of unknown type: ${packet[0]}`;
  }
}

// node_modules/@progrium/duplex/esm/mux/codec/mod.js
var debug2 = {
  messages: false,
  bytes: false
};

// node_modules/@progrium/duplex/esm/mux/session/session.js
var minPacketLength = 9;
var maxPacketLength = Number.MAX_VALUE;
var Session = class {
  constructor(conn) {
    Object.defineProperty(this, "conn", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "channels", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "incoming", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "enc", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "dec", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "done", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "closed", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.conn = conn;
    this.enc = new Encoder3(conn);
    this.dec = new Decoder3(conn);
    this.channels = [];
    this.incoming = new queue();
    this.done = this.loop();
    this.closed = false;
  }
  async open() {
    const ch = this.newChannel();
    ch.maxIncomingPayload = channelMaxPacket;
    await this.enc.encode({
      ID: OpenID,
      windowSize: ch.myWindow,
      maxPacketSize: ch.maxIncomingPayload,
      senderID: ch.localId
    });
    if (await ch.ready.shift()) {
      return ch;
    }
    throw "failed to open";
  }
  accept() {
    return this.incoming.shift();
  }
  async close() {
    for (const ids of Object.keys(this.channels)) {
      const id = parseInt(ids);
      if (this.channels[id] !== void 0) {
        this.channels[id].shutdown();
      }
    }
    this.conn.close();
    this.closed = true;
    await this.done;
  }
  async loop() {
    try {
      while (true) {
        const msg = await this.dec.decode();
        if (msg === null) {
          this.close();
          return;
        }
        if (msg.ID === OpenID) {
          await this.handleOpen(msg);
          continue;
        }
        const cmsg = msg;
        const ch = this.getCh(cmsg.channelID);
        if (ch === void 0) {
          if (this.closed) {
            return;
          }
          console.warn(`invalid channel (${cmsg.channelID}) on op ${cmsg.ID}`);
          continue;
        }
        await ch.handle(cmsg);
      }
    } catch (e) {
      if (e.message && e.message.contains && e.message.contains("Connection reset by peer")) {
        return;
      }
      throw e;
    }
  }
  async handleOpen(msg) {
    if (msg.maxPacketSize < minPacketLength || msg.maxPacketSize > maxPacketLength) {
      await this.enc.encode({
        ID: OpenFailureID,
        channelID: msg.senderID
      });
      return;
    }
    const c = this.newChannel();
    c.remoteId = msg.senderID;
    c.maxRemotePayload = msg.maxPacketSize;
    c.remoteWin = msg.windowSize;
    c.maxIncomingPayload = channelMaxPacket;
    this.incoming.push(c);
    await this.enc.encode({
      ID: OpenConfirmID,
      channelID: c.remoteId,
      senderID: c.localId,
      windowSize: c.myWindow,
      maxPacketSize: c.maxIncomingPayload
    });
  }
  newChannel() {
    const ch = new Channel(this);
    ch.remoteWin = 0;
    ch.myWindow = channelWindowSize;
    ch.localId = this.addCh(ch);
    return ch;
  }
  getCh(id) {
    const ch = this.channels[id];
    if (ch && ch.localId !== id) {
      console.log("bad ids:", id, ch.localId, ch.remoteId);
    }
    return ch;
  }
  addCh(ch) {
    this.channels.forEach((v, i) => {
      if (v === void 0) {
        this.channels[i] = ch;
        return i;
      }
    });
    this.channels.push(ch);
    return this.channels.length - 1;
  }
  rmCh(id) {
    delete this.channels[id];
  }
};

// node_modules/@progrium/duplex/esm/mux/session/channel.js
var channelMaxPacket = 1 << 24;
var channelWindowSize = 64 * channelMaxPacket;
var Channel = class {
  constructor(sess) {
    Object.defineProperty(this, "localId", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "remoteId", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "maxIncomingPayload", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "maxRemotePayload", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "session", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "ready", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "sentEOF", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "sentClose", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "remoteWin", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "myWindow", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "readBuf", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "writers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.localId = 0;
    this.remoteId = 0;
    this.maxIncomingPayload = 0;
    this.maxRemotePayload = 0;
    this.sentEOF = false;
    this.sentClose = false;
    this.remoteWin = 0;
    this.myWindow = 0;
    this.ready = new queue();
    this.session = sess;
    this.writers = [];
    this.readBuf = new ReadBuffer();
  }
  get id() {
    return this.localId;
  }
  async read(p) {
    let n10 = await this.readBuf.read(p);
    if (n10 !== null) {
      try {
        await this.adjustWindow(n10);
      } catch (e) {
        if (e !== "EOF" && e.name !== "BadResource") {
          throw e;
        }
      }
    }
    return n10;
  }
  write(p) {
    if (this.sentEOF) {
      return Promise.reject("EOF");
    }
    return new Promise((resolve, reject) => {
      let n10 = 0;
      const tryWrite = () => {
        if (this.sentEOF || this.sentClose) {
          reject("EOF");
          return;
        }
        if (p.byteLength == 0) {
          resolve(n10);
          return;
        }
        const space = Math.min(this.maxRemotePayload, p.length);
        const reserved = this.reserveWindow(space);
        if (reserved == 0) {
          this.writers.push(tryWrite);
          return;
        }
        const toSend = p.slice(0, reserved);
        this.send({
          ID: DataID,
          channelID: this.remoteId,
          length: toSend.length,
          data: toSend
        }).then(() => {
          n10 += toSend.length;
          p = p.slice(toSend.length);
          if (p.length == 0) {
            resolve(n10);
            return;
          }
          this.writers.push(tryWrite);
        });
      };
      tryWrite();
    });
  }
  reserveWindow(win) {
    if (this.remoteWin < win) {
      win = this.remoteWin;
    }
    this.remoteWin -= win;
    return win;
  }
  addWindow(win) {
    this.remoteWin += win;
    while (this.remoteWin > 0) {
      const writer = this.writers.shift();
      if (!writer)
        break;
      writer();
    }
  }
  async closeWrite() {
    this.sentEOF = true;
    await this.send({
      ID: EofID,
      channelID: this.remoteId
    });
    this.writers.forEach((writer) => writer());
    this.writers = [];
  }
  async close() {
    this.readBuf.eof();
    if (!this.sentClose) {
      await this.send({
        ID: CloseID,
        channelID: this.remoteId
      });
      this.sentClose = true;
      while (await this.ready.shift() !== null) {
      }
      return;
    }
    this.shutdown();
  }
  shutdown() {
    this.readBuf.close();
    this.writers.forEach((writer) => writer());
    this.ready.close();
    this.session.rmCh(this.localId);
  }
  async adjustWindow(n10) {
    this.myWindow += n10;
    await this.send({
      ID: WindowAdjustID,
      channelID: this.remoteId,
      additionalBytes: n10
    });
  }
  send(msg) {
    if (this.sentClose) {
      throw "EOF";
    }
    this.sentClose = msg.ID === CloseID;
    return this.session.enc.encode(msg);
  }
  handle(msg) {
    if (msg.ID === DataID) {
      this.handleData(msg);
      return;
    }
    if (msg.ID === CloseID) {
      this.close();
      return;
    }
    if (msg.ID === EofID) {
      this.readBuf.eof();
    }
    if (msg.ID === OpenFailureID) {
      this.session.rmCh(msg.channelID);
      this.ready.push(false);
      return;
    }
    if (msg.ID === OpenConfirmID) {
      if (msg.maxPacketSize < minPacketLength || msg.maxPacketSize > maxPacketLength) {
        throw "invalid max packet size";
      }
      this.remoteId = msg.senderID;
      this.maxRemotePayload = msg.maxPacketSize;
      this.addWindow(msg.windowSize);
      this.ready.push(true);
      return;
    }
    if (msg.ID === WindowAdjustID) {
      this.addWindow(msg.additionalBytes);
    }
  }
  handleData(msg) {
    if (msg.length > this.maxIncomingPayload) {
      throw "incoming packet exceeds maximum payload size";
    }
    if (this.myWindow < msg.length) {
      throw "remote side wrote too much";
    }
    this.myWindow -= msg.length;
    this.readBuf.write(msg.data);
  }
};

// node_modules/@progrium/duplex/esm/_dnt.shims.js
var import_ws = __toESM(require_browser(), 1);
var import_ws2 = __toESM(require_browser(), 1);
var dntGlobals = {
  WebSocket: import_ws.default
};
var dntGlobalThis = createMergeProxy(globalThis, dntGlobals);
function createMergeProxy(baseObj, extObj) {
  return new Proxy(baseObj, {
    get(_target, prop, _receiver) {
      if (prop in extObj) {
        return extObj[prop];
      } else {
        return baseObj[prop];
      }
    },
    set(_target, prop, value) {
      if (prop in extObj) {
        delete extObj[prop];
      }
      baseObj[prop] = value;
      return true;
    },
    deleteProperty(_target, prop) {
      let success = false;
      if (prop in extObj) {
        delete extObj[prop];
        success = true;
      }
      if (prop in baseObj) {
        delete baseObj[prop];
        success = true;
      }
      return success;
    },
    ownKeys(_target) {
      const baseKeys = Reflect.ownKeys(baseObj);
      const extKeys = Reflect.ownKeys(extObj);
      const extKeysSet = new Set(extKeys);
      return [...baseKeys.filter((k3) => !extKeysSet.has(k3)), ...extKeys];
    },
    defineProperty(_target, prop, desc) {
      if (prop in extObj) {
        delete extObj[prop];
      }
      Reflect.defineProperty(baseObj, prop, desc);
      return true;
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (prop in extObj) {
        return Reflect.getOwnPropertyDescriptor(extObj, prop);
      } else {
        return Reflect.getOwnPropertyDescriptor(baseObj, prop);
      }
    },
    has(_target, prop) {
      return prop in extObj || prop in baseObj;
    }
  });
}

// node_modules/@progrium/duplex/esm/transport/messageport.js
var Conn = class {
  constructor(port) {
    Object.defineProperty(this, "port", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "waiters", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "chunks", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "isClosed", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.isClosed = false;
    this.waiters = [];
    this.chunks = [];
    this.port = port;
    this.port.onmessage = (event) => {
      const chunk = new Uint8Array(event.data);
      this.chunks.push(chunk);
      if (this.waiters.length > 0) {
        const waiter = this.waiters.shift();
        if (waiter)
          waiter();
      }
    };
  }
  read(p) {
    return new Promise((resolve) => {
      var tryRead = () => {
        if (this.isClosed) {
          resolve(null);
          return;
        }
        if (this.chunks.length === 0) {
          this.waiters.push(tryRead);
          return;
        }
        let written = 0;
        while (written < p.length) {
          const chunk = this.chunks.shift();
          if (chunk === null || chunk === void 0) {
            resolve(written);
            return;
          }
          const buf = chunk.slice(0, p.length - written);
          p.set(buf, written);
          written += buf.length;
          if (chunk.length > buf.length) {
            const restchunk = chunk.slice(buf.length);
            this.chunks.unshift(restchunk);
          }
        }
        resolve(written);
        return;
      };
      tryRead();
    });
  }
  write(p) {
    this.port.postMessage(p, [p.buffer]);
    return Promise.resolve(p.byteLength);
  }
  close() {
    if (this.isClosed)
      return;
    this.isClosed = true;
    this.waiters.forEach((waiter) => waiter());
    this.port.close();
  }
};

// api/handle.js
function cleanpath(path) {
  if (path.startsWith("./")) path = path.slice(2);
  if (path === "/") return ".";
  path = path.replace(/\/+/g, "/");
  const parts = path.split("/");
  const stack = [];
  for (const p of parts) {
    if (p === "" || p === ".") continue;
    if (p === "..") {
      if (stack.length > 0) stack.pop();
      continue;
    }
    stack.push(p);
  }
  path = stack.join("/");
  return path || ".";
}
var WanixHandle2 = class {
  constructor(portOrConn) {
    let conn;
    if (portOrConn && typeof portOrConn === "object" && portOrConn.read && portOrConn.write && portOrConn.close) {
      conn = portOrConn;
    } else {
      conn = new Conn(portOrConn);
    }
    const sess = new Session(conn);
    this.peer = new Peer(sess, new CBORCodec());
    this.logger = () => null;
  }
  async readDir(name) {
    name = cleanpath(name);
    this.logger(`readDir ${name}`);
    return (await this.peer.call("ReadDir", [name])).value;
  }
  async makeDir(name) {
    name = cleanpath(name);
    this.logger(`makeDir ${name}`);
    await this.peer.call("Mkdir", [name]);
  }
  async makeDirAll(name) {
    name = cleanpath(name);
    this.logger(`makeDirAll ${name}`);
    await this.peer.call("MkdirAll", [name]);
  }
  async bind(name, newname) {
    name = cleanpath(name);
    newname = cleanpath(newname);
    this.logger(`bind ${name} ${newname}`);
    await this.peer.call("Bind", [name, newname]);
  }
  async unbind(name, newname) {
    name = cleanpath(name);
    newname = cleanpath(newname);
    this.logger(`unbind ${name} ${newname}`);
    await this.peer.call("Unbind", [name, newname]);
  }
  async readFile(name) {
    name = cleanpath(name);
    this.logger(`readFile ${name}`);
    return (await this.peer.call("ReadFile", [name])).value;
  }
  // not sure if readFile approach is good, but this is an option for now
  async readFile2(name) {
    name = cleanpath(name);
    this.logger(`readFile2 ${name}`);
    const rd = await this.openReadable(name);
    const response = new Response(rd);
    return new Uint8Array(await response.arrayBuffer());
  }
  async readText(name) {
    return new TextDecoder().decode(await this.readFile(name));
  }
  async waitFor(name, timeoutMs = 1e3) {
    name = cleanpath(name);
    this.logger(`waitFor ${name} ${timeoutMs}ms`);
    await this.peer.call("WaitFor", [name, timeoutMs]);
  }
  async stat(name) {
    name = cleanpath(name);
    this.logger(`stat ${name}`);
    return (await this.peer.call("Stat", [name])).value;
  }
  async writeFile(name, contents) {
    name = cleanpath(name);
    this.logger(`writeFile ${name} len(${contents.length})`);
    if (typeof contents === "string") {
      contents = new TextEncoder().encode(contents);
    }
    return (await this.peer.call("WriteFile", [name, contents])).value;
  }
  async appendFile(name, contents) {
    name = cleanpath(name);
    this.logger(`appendFile ${name} len(${contents.length})`);
    if (typeof contents === "string") {
      contents = new TextEncoder().encode(contents);
    }
    return (await this.peer.call("AppendFile", [name, contents])).value;
  }
  async rename(oldname, newname) {
    oldname = cleanpath(oldname);
    newname = cleanpath(newname);
    this.logger(`rename ${oldname} ${newname}`);
    await this.peer.call("Rename", [oldname, newname]);
  }
  async copy(oldname, newname) {
    oldname = cleanpath(oldname);
    newname = cleanpath(newname);
    this.logger(`copy ${oldname} ${newname}`);
    await this.peer.call("Copy", [oldname, newname]);
  }
  async remove(name) {
    name = cleanpath(name);
    this.logger(`remove ${name}`);
    await this.peer.call("Remove", [name]);
  }
  async removeAll(name) {
    name = cleanpath(name);
    this.logger(`removeAll ${name}`);
    await this.peer.call("RemoveAll", [name]);
  }
  async truncate(name, size) {
    name = cleanpath(name);
    this.logger(`truncate ${name} ${size}`);
    await this.peer.call("Truncate", [name, size]);
  }
  async create(name) {
    name = cleanpath(name);
    this.logger(`create ${name}`);
    return (await this.peer.call("Create", [name])).value;
  }
  async open(name) {
    name = cleanpath(name);
    this.logger(`open ${name}`);
    return (await this.peer.call("Open", [name])).value;
  }
  async openFile(name, flags, mode) {
    name = cleanpath(name);
    this.logger(`openFile ${name} ${flags} ${mode}`);
    return (await this.peer.call("OpenFile", [name, flags, mode])).value;
  }
  async read(fd, count) {
    this.logger(`read ${fd} ${count}`);
    return (await this.peer.call("Read", [fd, count])).value;
  }
  async readAt(fd, count, position5) {
    this.logger(`readAt ${fd} ${count} ${position5}`);
    return (await this.peer.call("ReadAt", [fd, count, position5])).value;
  }
  async write(fd, data) {
    this.logger(`write ${fd} len(${data.length})`);
    return (await this.peer.call("Write", [fd, data])).value;
  }
  async writeAt(fd, data, offset) {
    this.logger(`writeAt ${fd} ${offset}`);
    return (await this.peer.call("WriteAt", [fd, data, offset])).value;
  }
  async close(fd) {
    this.logger(`close ${fd}`);
    return (await this.peer.call("Close", [fd])).value;
  }
  async sync(fd) {
    this.logger(`sync ${fd}`);
    return (await this.peer.call("Sync", [fd])).value;
  }
  async fstat(fd) {
    this.logger(`fstat ${fd}`);
    return (await this.peer.call("Fstat", [fd])).value;
  }
  async lstat(name) {
    name = cleanpath(name);
    this.logger(`lstat ${name}`);
    return (await this.peer.call("Lstat", [name])).value;
  }
  async chmod(name, mode) {
    name = cleanpath(name);
    this.logger(`chmod ${name} ${mode}`);
    await this.peer.call("Chmod", [name, mode]);
  }
  async chown(name, uid, gid) {
    name = cleanpath(name);
    this.logger(`chown ${name} ${uid} ${gid}`);
    await this.peer.call("Chown", [name, uid, gid]);
  }
  async fchmod(fd, mode) {
    this.logger(`fchmod ${fd} ${mode}`);
    await this.peer.call("Fchmod", [fd, mode]);
  }
  async fchown(fd, uid, gid) {
    this.logger(`fchown ${fd} ${uid} ${gid}`);
    await this.peer.call("Fchown", [fd, uid, gid]);
  }
  async ftruncate(fd, length) {
    this.logger(`ftruncate ${fd} ${length}`);
    await this.peer.call("Ftruncate", [fd, length]);
  }
  async flock(fd, how) {
    this.logger(`flock ${fd} ${how}`);
    await this.peer.call("Flock", [fd, how]);
  }
  async readlink(name) {
    name = cleanpath(name);
    this.logger(`readlink ${name}`);
    return (await this.peer.call("Readlink", [name])).value;
  }
  async symlink(oldname, newname) {
    oldname = cleanpath(oldname);
    newname = cleanpath(newname);
    this.logger(`symlink ${oldname} ${newname}`);
    await this.peer.call("Symlink", [oldname, newname]);
  }
  async chtimes(name, atime, mtime) {
    name = cleanpath(name);
    this.logger(`chtimes ${name} ${atime} ${mtime}`);
    await this.peer.call("Chtimes", [name, atime, mtime]);
  }
  async spawn(name, args, opts) {
    name = cleanpath(name);
    this.logger(`spawn ${name}`);
    return (await this.peer.call("Spawn", [name, args, opts])).value;
  }
  async wait(pid) {
    this.logger(`wait ${pid}`);
    return (await this.peer.call("Wait", [pid])).value;
  }
  async pipe() {
    this.logger("pipe");
    return (await this.peer.call("Pipe", [])).value;
  }
  async openpty() {
    this.logger("openpty");
    return (await this.peer.call("Openpty", [])).value;
  }
  async openNull() {
    this.logger("openNull");
    return (await this.peer.call("OpenNull", [])).value;
  }
  async getWinSize(fd) {
    this.logger(`getWinSize ${fd}`);
    return (await this.peer.call("GetWinSize", [fd])).value;
  }
  async setWinSize(fd, rows, cols, xpx, ypx) {
    this.logger(`setWinSize ${fd} ${rows}x${cols}`);
    return (await this.peer.call("SetWinSize", [fd, { rows, cols, xpx, ypx }])).value;
  }
  async openReadable(name) {
    this.logger(`openReadable ${name}`);
    const fd = await this.open(name);
    return this.readable(fd);
  }
  async openWritable(name) {
    this.logger(`openWritable ${name}`);
    const fd = await this.openFile(name, 1, 0);
    return this.writable(fd);
  }
  writable(fd) {
    const self = this;
    return new WritableStream({
      write(chunk) {
        return self.write(fd, chunk);
      }
    });
  }
  readable(fd) {
    const self = this;
    return new ReadableStream({
      async pull(controller) {
        const data = await self.read(fd, 1024);
        if (data === null) {
          controller.close();
        }
        controller.enqueue(data);
      }
    });
  }
};
if (!ReadableStream.prototype[Symbol.asyncIterator]) {
  ReadableStream.prototype[Symbol.asyncIterator] = async function* () {
    const reader = this.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  };
}

// node_modules/@xterm/xterm/lib/xterm.mjs
var Ms = Object.defineProperty;
var kn = Object.getOwnPropertyDescriptor;
var Mn = (n10, i) => {
  for (var e in i) Ms(n10, e, { get: i[e], enumerable: true });
};
var y = (n10, i, e, t) => {
  for (var r = t > 1 ? void 0 : t ? kn(i, e) : i, s4 = n10.length - 1, o3; s4 >= 0; s4--) (o3 = n10[s4]) && (r = (t ? o3(i, e, r) : o3(r)) || r);
  return t && r && Ms(i, e, r), r;
};
var m = (n10, i) => (e, t) => i(e, t, n10);
var Bs = "Terminal input";
var Ut = { get: () => Bs, set: (n10) => Bs = n10 };
var Ps = "Too much output to announce, navigate to rows manually to read";
var Ze = { get: () => Ps, set: (n10) => Ps = n10 };
function Bn(n10) {
  return n10.replace(/\r?\n/g, "\r");
}
function Pn(n10, i) {
  return i ? `\x1B[200~${n10.replace(/\x1b/g, "\u241B")}\x1B[201~` : n10;
}
function Os(n10, i) {
  n10.clipboardData && n10.clipboardData.setData("text/plain", i.selectionText), n10.preventDefault();
}
function Ns(n10, i, e, t) {
  if (n10.stopPropagation(), n10.clipboardData) {
    let r = n10.clipboardData.getData("text/plain");
    Nr(r, i, e, t);
  }
}
function Nr(n10, i, e, t) {
  n10 = Bn(n10), n10 = Pn(n10, e.decPrivateModes.bracketedPasteMode && t.rawOptions.ignoreBracketedPasteMode !== true), e.triggerDataEvent(n10, true), i.value = "";
}
function Fr(n10, i, e) {
  let t = e.getBoundingClientRect(), r = n10.clientX - t.left - 10, s4 = n10.clientY - t.top - 10;
  i.style.width = "20px", i.style.height = "20px", i.style.left = `${r}px`, i.style.top = `${s4}px`, i.style.zIndex = "1000", i.focus();
}
function Hr(n10, i, e, t, r) {
  Fr(n10, i, e), r && t.rightClickSelect(n10), i.value = t.selectionText, i.select();
}
function be(n10) {
  return n10 > 65535 ? (n10 -= 65536, String.fromCharCode((n10 >> 10) + 55296) + String.fromCharCode(n10 % 1024 + 56320)) : String.fromCharCode(n10);
}
function ye(n10, i = 0, e = n10.length) {
  let t = "";
  for (let r = i; r < e; ++r) {
    let s4 = n10[r];
    s4 > 65535 ? (s4 -= 65536, t += String.fromCharCode((s4 >> 10) + 55296) + String.fromCharCode(s4 % 1024 + 56320)) : t += String.fromCharCode(s4);
  }
  return t;
}
var mi = class {
  constructor() {
    this._interim = 0;
  }
  clear() {
    this._interim = 0;
  }
  decode(i, e) {
    let t = i.length;
    if (!t) return 0;
    let r = 0, s4 = 0;
    if (this._interim) {
      let o3 = i.charCodeAt(s4++);
      56320 <= o3 && o3 <= 57343 ? e[r++] = (this._interim - 55296) * 1024 + o3 - 56320 + 65536 : (e[r++] = this._interim, e[r++] = o3), this._interim = 0;
    }
    for (let o3 = s4; o3 < t; ++o3) {
      let a = i.charCodeAt(o3);
      if (55296 <= a && a <= 56319) {
        if (++o3 >= t) return this._interim = a, r;
        let l3 = i.charCodeAt(o3);
        56320 <= l3 && l3 <= 57343 ? e[r++] = (a - 55296) * 1024 + l3 - 56320 + 65536 : (e[r++] = a, e[r++] = l3);
        continue;
      }
      a !== 65279 && (e[r++] = a);
    }
    return r;
  }
};
var bi = class {
  constructor() {
    this.interim = new Uint8Array(3);
  }
  clear() {
    this.interim.fill(0);
  }
  decode(i, e) {
    let t = i.length;
    if (!t) return 0;
    let r = 0, s4, o3, a, l3, h, d = 0;
    if (this.interim[0]) {
      let _ = false, p = this.interim[0];
      p &= (p & 224) === 192 ? 31 : (p & 240) === 224 ? 15 : 7;
      let v = 0, f2;
      for (; (f2 = this.interim[++v]) && v < 4; ) p <<= 6, p |= f2 & 63;
      let S = (this.interim[0] & 224) === 192 ? 2 : (this.interim[0] & 240) === 224 ? 3 : 4, I = S - v;
      for (; d < I; ) {
        if (d >= t) return 0;
        if (f2 = i[d++], (f2 & 192) !== 128) {
          d--, _ = true;
          break;
        } else this.interim[v++] = f2, p <<= 6, p |= f2 & 63;
      }
      _ || (S === 2 ? p < 128 ? d-- : e[r++] = p : S === 3 ? p < 2048 || p >= 55296 && p <= 57343 || p === 65279 || (e[r++] = p) : p < 65536 || p > 1114111 || (e[r++] = p)), this.interim.fill(0);
    }
    let c = t - 4, u = d;
    for (; u < t; ) {
      for (; u < c && !((s4 = i[u]) & 128) && !((o3 = i[u + 1]) & 128) && !((a = i[u + 2]) & 128) && !((l3 = i[u + 3]) & 128); ) e[r++] = s4, e[r++] = o3, e[r++] = a, e[r++] = l3, u += 4;
      if (s4 = i[u++], s4 < 128) e[r++] = s4;
      else if ((s4 & 224) === 192) {
        if (u >= t) return this.interim[0] = s4, r;
        if (o3 = i[u++], (o3 & 192) !== 128) {
          u--;
          continue;
        }
        if (h = (s4 & 31) << 6 | o3 & 63, h < 128) {
          u--;
          continue;
        }
        e[r++] = h;
      } else if ((s4 & 240) === 224) {
        if (u >= t) return this.interim[0] = s4, r;
        if (o3 = i[u++], (o3 & 192) !== 128) {
          u--;
          continue;
        }
        if (u >= t) return this.interim[0] = s4, this.interim[1] = o3, r;
        if (a = i[u++], (a & 192) !== 128) {
          u--;
          continue;
        }
        if (h = (s4 & 15) << 12 | (o3 & 63) << 6 | a & 63, h < 2048 || h >= 55296 && h <= 57343 || h === 65279) continue;
        e[r++] = h;
      } else if ((s4 & 248) === 240) {
        if (u >= t) return this.interim[0] = s4, r;
        if (o3 = i[u++], (o3 & 192) !== 128) {
          u--;
          continue;
        }
        if (u >= t) return this.interim[0] = s4, this.interim[1] = o3, r;
        if (a = i[u++], (a & 192) !== 128) {
          u--;
          continue;
        }
        if (u >= t) return this.interim[0] = s4, this.interim[1] = o3, this.interim[2] = a, r;
        if (l3 = i[u++], (l3 & 192) !== 128) {
          u--;
          continue;
        }
        if (h = (s4 & 7) << 18 | (o3 & 63) << 12 | (a & 63) << 6 | l3 & 63, h < 65536 || h > 1114111) continue;
        e[r++] = h;
      }
    }
    return r;
  }
};
var ue = class n {
  constructor() {
    this.fg = 0;
    this.bg = 0;
    this.extended = new ke();
  }
  static toColorRGB(i) {
    return [i >>> 16 & 255, i >>> 8 & 255, i & 255];
  }
  static fromColorRGB(i) {
    return (i[0] & 255) << 16 | (i[1] & 255) << 8 | i[2] & 255;
  }
  clone() {
    let i = new n();
    return i.fg = this.fg, i.bg = this.bg, i.extended = this.extended.clone(), i;
  }
  isInverse() {
    return this.fg & 67108864;
  }
  isBold() {
    return this.fg & 134217728;
  }
  isUnderline() {
    return this.hasExtendedAttrs() && this.extended.underlineStyle !== 0 ? 1 : this.fg & 268435456;
  }
  isBlink() {
    return this.fg & 536870912;
  }
  isInvisible() {
    return this.fg & 1073741824;
  }
  isItalic() {
    return this.bg & 67108864;
  }
  isDim() {
    return this.bg & 134217728;
  }
  isStrikethrough() {
    return this.fg & 2147483648;
  }
  isProtected() {
    return this.bg & 536870912;
  }
  isOverline() {
    return this.bg & 1073741824;
  }
  getFgColorMode() {
    return this.fg & 50331648;
  }
  getBgColorMode() {
    return this.bg & 50331648;
  }
  isFgRGB() {
    return (this.fg & 50331648) === 50331648;
  }
  isBgRGB() {
    return (this.bg & 50331648) === 50331648;
  }
  isFgPalette() {
    return (this.fg & 50331648) === 16777216 || (this.fg & 50331648) === 33554432;
  }
  isBgPalette() {
    return (this.bg & 50331648) === 16777216 || (this.bg & 50331648) === 33554432;
  }
  isFgDefault() {
    return (this.fg & 50331648) === 0;
  }
  isBgDefault() {
    return (this.bg & 50331648) === 0;
  }
  isAttributeDefault() {
    return this.fg === 0 && this.bg === 0;
  }
  getFgColor() {
    switch (this.fg & 50331648) {
      case 16777216:
      case 33554432:
        return this.fg & 255;
      case 50331648:
        return this.fg & 16777215;
      default:
        return -1;
    }
  }
  getBgColor() {
    switch (this.bg & 50331648) {
      case 16777216:
      case 33554432:
        return this.bg & 255;
      case 50331648:
        return this.bg & 16777215;
      default:
        return -1;
    }
  }
  hasExtendedAttrs() {
    return this.bg & 268435456;
  }
  updateExtended() {
    this.extended.isEmpty() ? this.bg &= -268435457 : this.bg |= 268435456;
  }
  getUnderlineColor() {
    if (this.bg & 268435456 && ~this.extended.underlineColor) switch (this.extended.underlineColor & 50331648) {
      case 16777216:
      case 33554432:
        return this.extended.underlineColor & 255;
      case 50331648:
        return this.extended.underlineColor & 16777215;
      default:
        return this.getFgColor();
    }
    return this.getFgColor();
  }
  getUnderlineColorMode() {
    return this.bg & 268435456 && ~this.extended.underlineColor ? this.extended.underlineColor & 50331648 : this.getFgColorMode();
  }
  isUnderlineColorRGB() {
    return this.bg & 268435456 && ~this.extended.underlineColor ? (this.extended.underlineColor & 50331648) === 50331648 : this.isFgRGB();
  }
  isUnderlineColorPalette() {
    return this.bg & 268435456 && ~this.extended.underlineColor ? (this.extended.underlineColor & 50331648) === 16777216 || (this.extended.underlineColor & 50331648) === 33554432 : this.isFgPalette();
  }
  isUnderlineColorDefault() {
    return this.bg & 268435456 && ~this.extended.underlineColor ? (this.extended.underlineColor & 50331648) === 0 : this.isFgDefault();
  }
  getUnderlineStyle() {
    return this.fg & 268435456 ? this.bg & 268435456 ? this.extended.underlineStyle : 1 : 0;
  }
  getUnderlineVariantOffset() {
    return this.extended.underlineVariantOffset;
  }
};
var ke = class n2 {
  constructor(i = 0, e = 0) {
    this._ext = 0;
    this._urlId = 0;
    this._ext = i, this._urlId = e;
  }
  get ext() {
    return this._urlId ? this._ext & -469762049 | this.underlineStyle << 26 : this._ext;
  }
  set ext(i) {
    this._ext = i;
  }
  get underlineStyle() {
    return this._urlId ? 5 : (this._ext & 469762048) >> 26;
  }
  set underlineStyle(i) {
    this._ext &= -469762049, this._ext |= i << 26 & 469762048;
  }
  get underlineColor() {
    return this._ext & 67108863;
  }
  set underlineColor(i) {
    this._ext &= -67108864, this._ext |= i & 67108863;
  }
  get urlId() {
    return this._urlId;
  }
  set urlId(i) {
    this._urlId = i;
  }
  get underlineVariantOffset() {
    let i = (this._ext & 3758096384) >> 29;
    return i < 0 ? i ^ 4294967288 : i;
  }
  set underlineVariantOffset(i) {
    this._ext &= 536870911, this._ext |= i << 29 & 3758096384;
  }
  clone() {
    return new n2(this._ext, this._urlId);
  }
  isEmpty() {
    return this.underlineStyle === 0 && this._urlId === 0;
  }
};
var F = class n3 extends ue {
  constructor() {
    super(...arguments);
    this.content = 0;
    this.fg = 0;
    this.bg = 0;
    this.extended = new ke();
    this.combinedData = "";
  }
  static fromCharData(e) {
    let t = new n3();
    return t.setFromCharData(e), t;
  }
  isCombined() {
    return this.content & 2097152;
  }
  getWidth() {
    return this.content >> 22;
  }
  getChars() {
    return this.content & 2097152 ? this.combinedData : this.content & 2097151 ? be(this.content & 2097151) : "";
  }
  getCode() {
    return this.isCombined() ? this.combinedData.charCodeAt(this.combinedData.length - 1) : this.content & 2097151;
  }
  setFromCharData(e) {
    this.fg = e[0], this.bg = 0;
    let t = false;
    if (e[1].length > 2) t = true;
    else if (e[1].length === 2) {
      let r = e[1].charCodeAt(0);
      if (55296 <= r && r <= 56319) {
        let s4 = e[1].charCodeAt(1);
        56320 <= s4 && s4 <= 57343 ? this.content = (r - 55296) * 1024 + s4 - 56320 + 65536 | e[2] << 22 : t = true;
      } else t = true;
    } else this.content = e[1].charCodeAt(0) | e[2] << 22;
    t && (this.combinedData = e[1], this.content = 2097152 | e[2] << 22);
  }
  getAsCharData() {
    return [this.fg, this.getChars(), this.getWidth(), this.getCode()];
  }
  attributesEquals(e) {
    if (this.getFgColorMode() !== e.getFgColorMode() || this.getFgColor() !== e.getFgColor() || this.getBgColorMode() !== e.getBgColorMode() || this.getBgColor() !== e.getBgColor() || this.isInverse() !== e.isInverse() || this.isBold() !== e.isBold() || this.isUnderline() !== e.isUnderline()) return false;
    if (this.isUnderline()) {
      if (this.getUnderlineStyle() !== e.getUnderlineStyle()) return false;
      let t = this.isUnderlineColorDefault(), r = e.isUnderlineColorDefault();
      if (!(t && r) && (t !== r || this.getUnderlineColor() !== e.getUnderlineColor() || this.getUnderlineColorMode() !== e.getUnderlineColorMode())) return false;
    }
    return !(this.isOverline() !== e.isOverline() || this.isBlink() !== e.isBlink() || this.isInvisible() !== e.isInvisible() || this.isItalic() !== e.isItalic() || this.isDim() !== e.isDim() || this.isStrikethrough() !== e.isStrikethrough());
  }
};
var zr = /* @__PURE__ */ new Map();
function Hs(n10) {
  return n10.di$dependencies || [];
}
function H(n10) {
  if (zr.has(n10)) return zr.get(n10);
  let i = function(e, t, r) {
    if (arguments.length !== 3) throw new Error("@IServiceName-decorator can only be used to decorate a parameter");
    Fn(i, e, r);
  };
  return i._id = n10, zr.set(n10, i), i;
}
function Fn(n10, i, e) {
  i.di$target === i ? i.di$dependencies.push({ id: n10, index: e }) : (i.di$dependencies = [{ id: n10, index: e }], i.di$target = i);
}
var D = H("BufferService");
var Me = H("MouseStateService");
var Y = H("CoreService");
var Ws = H("CharsetService");
var Qe = H("InstantiationService");
var fe = H("LogService");
var R = H("OptionsService");
var vi = H("OscLinkService");
var Us = H("UnicodeService");
var ge = H("DecorationService");
var et = class {
  constructor(i, e, t) {
    this._bufferService = i;
    this._optionsService = e;
    this._oscLinkService = t;
    this._workCell = new F();
  }
  provideLinks(i, e) {
    let t = this._bufferService.buffer.lines.get(i - 1);
    if (!t) {
      e(void 0);
      return;
    }
    let r = [], s4 = this._optionsService.rawOptions.linkHandler, o3 = this._workCell, a = t.getTrimmedLength(), l3 = -1, h = -1, d = false;
    for (let c = 0; c < a; c++) if (!(h === -1 && !t.hasContent(c))) {
      if (t.loadCell(c, o3), o3.hasExtendedAttrs() && o3.extended.urlId) if (h === -1) {
        h = c, l3 = o3.extended.urlId;
        continue;
      } else d = o3.extended.urlId !== l3;
      else h !== -1 && (d = true);
      if (d || h !== -1 && c === a - 1) {
        let u = this._oscLinkService.getLinkData(l3)?.uri;
        if (u) {
          let _ = c + (!d && c === a - 1 ? 1 : 0), p = this._getRangeWithLineWrap(i, h, _, l3), v = false;
          if (!s4?.allowNonHttpProtocols) try {
            let f2 = new URL(u);
            ["http:", "https:"].includes(f2.protocol) || (v = true);
          } catch {
            v = true;
          }
          v || r.push({ text: u, range: p, activate: (f2, S) => s4 ? s4.activate(f2, S, p) : Hn(f2, S), hover: (f2, S) => s4?.hover?.(f2, S, p), leave: (f2, S) => s4?.leave?.(f2, S, p) });
        }
        d = false, o3.hasExtendedAttrs() && o3.extended.urlId ? (h = c, l3 = o3.extended.urlId) : (h = -1, l3 = -1);
      }
    }
    e(r);
  }
  _getRangeWithLineWrap(i, e, t, r) {
    let s4 = i, o3 = e, a = i, l3 = t;
    for (; o3 === 0 && this._bufferService.buffer.lines.get(s4 - 1)?.isWrapped; ) {
      let d = this._bufferService.buffer.lines.get(s4 - 2);
      if (!d) break;
      let c = d.getTrimmedLength();
      if (c === 0 || !this._hasUrlId(d, c - 1, r)) break;
      let u = c - 1;
      for (; u > 0 && this._hasUrlId(d, u - 1, r); ) u--;
      s4--, o3 = u;
    }
    for (; ; ) {
      let h = this._bufferService.buffer.lines.get(a - 1);
      if (!h) break;
      let d = h.getTrimmedLength();
      if (l3 !== d) break;
      let c = this._bufferService.buffer.lines.get(a);
      if (!c?.isWrapped) break;
      let u = c.getTrimmedLength();
      if (u === 0 || !this._hasUrlId(c, 0, r)) break;
      let _ = 1;
      for (; _ < u && this._hasUrlId(c, _, r); ) _++;
      a++, l3 = _;
    }
    return { start: { x: o3 + 1, y: s4 }, end: { x: l3, y: a } };
  }
  _hasUrlId(i, e, t) {
    let r = this._workCell;
    return i.loadCell(e, r), !!r.hasExtendedAttrs() && r.extended.urlId === t;
  }
};
et = y([m(0, D), m(1, R), m(2, vi)], et);
function Hn(n10, i) {
  if (confirm(`Do you want to navigate to ${i}?

WARNING: This link could potentially be dangerous`)) {
    let t = window.open();
    if (t) {
      try {
        t.opener = null;
      } catch {
      }
      t.location.href = i;
    } else console.warn("Opening link blocked as opener could not be cleared");
  }
}
var Be = H("CharSizeService");
var G = H("CoreBrowserService");
var Pe = H("MouseCoordsService");
var Ks = H("MouseService");
var V = H("RenderService");
var Si = H("SelectionService");
var gi = H("CharacterJoinerService");
var _e = H("ThemeService");
var Ii = H("LinkProviderService");
var zs = H("KeyboardService");
function E(n10) {
  return { dispose: n10 };
}
function Oe(n10) {
  if (!n10) return n10;
  if (Array.isArray(n10)) {
    for (let i of n10) i.dispose();
    return [];
  }
  return n10.dispose(), n10;
}
var pe = class {
  constructor() {
    this._disposables = /* @__PURE__ */ new Set();
    this._isDisposed = false;
  }
  get isDisposed() {
    return this._isDisposed;
  }
  add(i) {
    return this._isDisposed ? i.dispose() : this._disposables.add(i), i;
  }
  dispose() {
    if (!this._isDisposed) {
      this._isDisposed = true;
      for (let i of this._disposables) i.dispose();
      this._disposables.clear();
    }
  }
  clear() {
    for (let i of this._disposables) i.dispose();
    this._disposables.clear();
  }
};
var g = class {
  constructor() {
    this._store = new pe();
  }
  dispose() {
    this._store.dispose();
  }
  _register(i) {
    return this._store.add(i);
  }
};
g.None = Object.freeze({ dispose() {
} });
var P = class {
  constructor() {
    this._isDisposed = false;
  }
  get value() {
    return this._isDisposed ? void 0 : this._value;
  }
  set value(i) {
    this._isDisposed || i === this._value || (this._value?.dispose(), this._value = i);
  }
  clear() {
    this.value = void 0;
  }
  dispose() {
    this._isDisposed = true, this._value?.dispose(), this._value = void 0;
  }
};
function Gs(n10, i = 0, e) {
  let t = setTimeout(() => {
    n10(), e && r.dispose();
  }, i), r = E(() => {
    clearTimeout(t);
  });
  return e?.add(r), r;
}
var Ie = class {
  constructor() {
    this._token = -1;
    this._isDisposed = false;
  }
  dispose() {
    this.cancel(), this._isDisposed = true;
  }
  cancel() {
    this._token !== -1 && (clearTimeout(this._token), this._token = -1);
  }
  cancelAndSet(i, e) {
    if (this._isDisposed) throw new Error("Calling cancelAndSet on a disposed TimeoutTimer");
    this.cancel(), this._token = setTimeout(() => {
      this._token = -1, i();
    }, e);
  }
  setIfNotSet(i, e) {
    if (this._isDisposed) throw new Error("Calling setIfNotSet on a disposed TimeoutTimer");
    this._token === -1 && (this._token = setTimeout(() => {
      this._token = -1, i();
    }, e));
  }
};
var Ci = class {
  constructor() {
    this._isScheduled = false;
    this._isDisposed = false;
  }
  dispose() {
    this.cancel(), this._isDisposed = true;
  }
  cancel() {
    this._isScheduled = false;
  }
  set(i) {
    if (this._isDisposed) throw new Error("Calling set on a disposed MicrotaskTimer");
    this._isScheduled || (this._isScheduled = true, queueMicrotask(() => {
      this._isScheduled && (this._isScheduled = false, i());
    }));
  }
};
var Ei = class {
  constructor() {
    this._isDisposed = false;
  }
  cancel() {
    this._disposable?.dispose(), this._disposable = void 0;
  }
  cancelAndSet(i, e, t = globalThis) {
    if (this._isDisposed) throw new Error("Calling cancelAndSet on a disposed IntervalTimer");
    this.cancel();
    let r = t.setInterval(() => {
      i();
    }, e);
    this._disposable = { dispose: () => {
      t.clearInterval(r), this._disposable = void 0;
    } };
  }
  dispose() {
    this.cancel(), this._isDisposed = true;
  }
};
function se(n10) {
  let i = n10;
  if (i?.ownerDocument?.defaultView) return i.ownerDocument.defaultView;
  let e = n10;
  return e?.view ? e.view : window;
}
var Gr = class {
  constructor(i, e, t, r) {
    this._node = i, this._type = e, this._handler = t, this._options = r, i.addEventListener(e, t, r);
  }
  dispose() {
    !this._node || !this._handler || (this._node.removeEventListener(this._type, this._handler, this._options), this._node = null, this._handler = null);
  }
};
function C(n10, i, e, t) {
  return new Gr(n10, i, e, t);
}
function Vr(n10, i, e, t) {
  return C(n10, i, e, t);
}
var le = { CLICK: "click", MOUSE_DOWN: "mousedown", MOUSE_OVER: "mouseover", MOUSE_LEAVE: "mouseleave", KEY_DOWN: "keydown", KEY_UP: "keyup", INPUT: "input", BLUR: "blur", FOCUS: "focus", CHANGE: "change", POINTER_DOWN: "pointerdown", POINTER_MOVE: "pointermove", POINTER_UP: "pointerup", MOUSE_WHEEL: "wheel", WHEEL: "wheel" };
function $s(n10) {
  let i = n10.getBoundingClientRect(), e = se(n10);
  return { left: i.left + e.scrollX, top: i.top + e.scrollY, width: i.width, height: i.height };
}
var yi = class {
  constructor(i, e) {
    this._runner = i;
    this.priority = e;
    this._canceled = false;
  }
  dispose() {
    this._canceled = true;
  }
  execute() {
    if (!this._canceled) try {
      this._runner();
    } catch (i) {
      console.error(i);
    }
  }
  static sort(i, e) {
    return e.priority - i.priority;
  }
};
var Vs = /* @__PURE__ */ new Map();
function qs(n10) {
  let i = Vs.get(n10);
  return i || (i = { next: [], current: [], animFrameRequested: false, inAnimationFrameRunner: false }, Vs.set(n10, i)), i;
}
function Wn(n10) {
  let i = qs(n10);
  for (i.animFrameRequested = false, i.current = i.next, i.next = [], i.inAnimationFrameRunner = true; i.current.length > 0; ) i.current.sort(yi.sort), i.current.shift().execute();
  i.inAnimationFrameRunner = false;
}
function tt(n10, i, e = 0) {
  let t = qs(n10), r = new yi(i, e);
  return t.next.push(r), t.animFrameRequested || (t.animFrameRequested = true, n10.requestAnimationFrame(() => Wn(n10))), r;
}
var xi = class extends Ei {
  constructor(i) {
    super(), this._defaultTarget = i ? se(i) : void 0;
  }
  cancelAndSet(i, e, t) {
    super.cancelAndSet(i, e, t ?? this._defaultTarget ?? window);
  }
};
var we = class {
  constructor(i) {
    this.domNode = i;
    this._width = "";
    this._height = "";
    this._top = "";
    this._left = "";
    this._bottom = "";
    this._right = "";
    this._className = "";
    this._position = "";
    this._layerHint = false;
    this._contain = "none";
  }
  setWidth(i) {
    let e = rt(i);
    this._width !== e && (this._width = e, this.domNode.style.width = this._width);
  }
  setHeight(i) {
    let e = rt(i);
    this._height !== e && (this._height = e, this.domNode.style.height = this._height);
  }
  setTop(i) {
    let e = rt(i);
    this._top !== e && (this._top = e, this.domNode.style.top = this._top);
  }
  setLeft(i) {
    let e = rt(i);
    this._left !== e && (this._left = e, this.domNode.style.left = this._left);
  }
  setBottom(i) {
    let e = rt(i);
    this._bottom !== e && (this._bottom = e, this.domNode.style.bottom = this._bottom);
  }
  setRight(i) {
    let e = rt(i);
    this._right !== e && (this._right = e, this.domNode.style.right = this._right);
  }
  setClassName(i) {
    this._className !== i && (this._className = i, this.domNode.className = this._className);
  }
  toggleClassName(i, e) {
    this.domNode.classList.toggle(i, e), this._className = this.domNode.className;
  }
  setPosition(i) {
    this._position !== i && (this._position = i, this.domNode.style.position = this._position);
  }
  setLayerHinting(i) {
    this._layerHint !== i && (this._layerHint = i, i ? this.domNode.style.transform = "translate3d(0px, 0px, 0px)" : this.domNode.style.transform = "");
  }
  setContain(i) {
    this._contain !== i && (this._contain = i, this.domNode.style.contain = this._contain);
  }
  setAttribute(i, e) {
    this.domNode.setAttribute(i, e);
  }
};
function rt(n10) {
  return typeof n10 == "number" ? `${n10}px` : n10;
}
var Ke = {};
Mn(Ke, { getSafariVersion: () => Kn, getZoomFactor: () => Xr, isChrome: () => Kt, isChromeOS: () => Yr, isFirefox: () => nt, isLegacyEdge: () => Un, isLinux: () => zt, isMac: () => ie, isNode: () => $r, isSafari: () => wi, isWindows: () => Ue });
var $r = !!(typeof process < "u" && "title" in process && (typeof navigator > "u" || navigator.userAgent.startsWith("Node.js/")));
var st = $r ? "node" : navigator.userAgent;
var qr = $r ? "node" : navigator.platform;
var nt = st.includes("Firefox");
var Kt = st.includes("Chrome");
var Un = st.includes("Edge");
var wi = /^((?!chrome|android).)*safari/i.test(st);
function Xr(n10) {
  return 1;
}
function Kn() {
  if (!wi) return 0;
  let n10 = st.match(/Version\/(\d+)/);
  return n10 === null || n10.length < 2 ? 0 : parseInt(n10[1], 10);
}
var ie = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"].includes(qr);
var Ue = ["Windows", "Win16", "Win32", "WinCE"].includes(qr);
var zt = qr.indexOf("Linux") >= 0;
var Yr = /\bCrOS\b/.test(st);
var Xs = /* @__PURE__ */ new WeakMap();
function zn(n10) {
  if (!n10.parent || n10.parent === n10) return null;
  try {
    let i = n10.location, e = n10.parent.location;
    if (i.origin !== "null" && e.origin !== "null" && i.origin !== e.origin) return null;
  } catch {
    return null;
  }
  return n10.parent;
}
var jr = class {
  static _getSameOriginWindowChain(i) {
    let e = Xs.get(i);
    if (!e) {
      e = [], Xs.set(i, e);
      let t = i, r;
      do
        r = zn(t), r ? e.push({ window: new WeakRef(t), iframeElement: t.frameElement ?? null }) : e.push({ window: new WeakRef(t), iframeElement: null }), t = r;
      while (t);
    }
    return e.slice(0);
  }
  static getPositionOfChildWindowRelativeToAncestorWindow(i, e) {
    if (!e || i === e) return { top: 0, left: 0 };
    let t = 0, r = 0, s4 = this._getSameOriginWindowChain(i);
    for (let o3 of s4) {
      let a = o3.window.deref();
      if (t += a?.scrollY ?? 0, r += a?.scrollX ?? 0, a === e || !o3.iframeElement) break;
      let l3 = o3.iframeElement.getBoundingClientRect();
      t += l3.top, r += l3.left;
    }
    return { top: t, left: r };
  }
};
var ot = class {
  constructor(i, e) {
    this.timestamp = Date.now(), this.browserEvent = e, this.leftButton = e.button === 0, this.middleButton = e.button === 1, this.rightButton = e.button === 2, this.buttons = e.buttons, this.target = e.target, this.detail = e.detail ?? 1, e.type === "dblclick" && (this.detail = 2), this.ctrlKey = e.ctrlKey, this.shiftKey = e.shiftKey, this.altKey = e.altKey, this.metaKey = e.metaKey, typeof e.pageX == "number" ? (this.posx = e.pageX, this.posy = e.pageY) : (this.posx = e.clientX + this.target.ownerDocument.body.scrollLeft + this.target.ownerDocument.documentElement.scrollLeft, this.posy = e.clientY + this.target.ownerDocument.body.scrollTop + this.target.ownerDocument.documentElement.scrollTop);
    let t = jr.getPositionOfChildWindowRelativeToAncestorWindow(i, e.view);
    this.posx -= t.left, this.posy -= t.top;
  }
  preventDefault() {
    this.browserEvent.preventDefault();
  }
  stopPropagation() {
    this.browserEvent.stopPropagation();
  }
};
var Gt = class {
  constructor(i, e = 0, t = 0) {
    this.browserEvent = i ?? null, this.target = i ? i.target ?? i.targetNode ?? i.srcElement ?? null : null, this.deltaY = t, this.deltaX = e;
    let r = false;
    if (Kt) {
      let s4 = navigator.userAgent.match(/Chrome\/(\d+)/);
      r = (s4 ? parseInt(s4[1], 10) : 123) <= 122;
    }
    if (i) {
      let s4 = i, o3 = i, a = i.view?.devicePixelRatio ?? 1;
      if (typeof s4.wheelDeltaY < "u") r ? this.deltaY = s4.wheelDeltaY / (120 * a) : this.deltaY = s4.wheelDeltaY / 120;
      else if (typeof o3.VERTICAL_AXIS < "u" && o3.axis === o3.VERTICAL_AXIS) this.deltaY = -o3.detail / 3;
      else if (i.type === "wheel") {
        let l3 = i;
        l3.deltaMode === l3.DOM_DELTA_LINE ? nt && !ie ? this.deltaY = -i.deltaY / 3 : this.deltaY = -i.deltaY : this.deltaY = -i.deltaY / 40;
      }
      if (typeof s4.wheelDeltaX < "u") wi && Ue ? this.deltaX = -(s4.wheelDeltaX / 120) : r ? this.deltaX = s4.wheelDeltaX / (120 * a) : this.deltaX = s4.wheelDeltaX / 120;
      else if (typeof o3.HORIZONTAL_AXIS < "u" && o3.axis === o3.HORIZONTAL_AXIS) this.deltaX = -i.detail / 3;
      else if (i.type === "wheel") {
        let l3 = i;
        l3.deltaMode === l3.DOM_DELTA_LINE ? nt && !ie ? this.deltaX = -i.deltaX / 3 : this.deltaX = -i.deltaX : this.deltaX = -i.deltaX / 40;
      }
      this.deltaY === 0 && this.deltaX === 0 && i.wheelDelta && (r ? this.deltaY = i.wheelDelta / (120 * a) : this.deltaY = i.wheelDelta / 120);
    }
  }
  preventDefault() {
    this.browserEvent?.preventDefault();
  }
  stopPropagation() {
    this.browserEvent?.stopPropagation();
  }
};
var at = class {
  constructor() {
    this._hooks = new pe();
    this._pointerMoveCallback = null;
    this._onStopCallback = null;
  }
  dispose() {
    this.stopMonitoring(false), this._hooks.dispose();
  }
  stopMonitoring(i) {
    if (!this.isMonitoring()) return;
    this._hooks.clear(), this._pointerMoveCallback = null;
    let e = this._onStopCallback;
    this._onStopCallback = null, i && e && e();
  }
  isMonitoring() {
    return !!this._pointerMoveCallback;
  }
  startMonitoring(i, e, t, r, s4) {
    this.isMonitoring() && this.stopMonitoring(false), this._pointerMoveCallback = r, this._onStopCallback = s4;
    let o3 = i;
    try {
      i.setPointerCapture(e), this._hooks.add(E(() => {
        try {
          i.releasePointerCapture(e);
        } catch {
        }
      }));
    } catch {
      o3 = se(i);
    }
    this._hooks.add(C(o3, le.POINTER_MOVE, (a) => {
      if (a.buttons !== t) {
        this.stopMonitoring(true);
        return;
      }
      a.preventDefault(), this._pointerMoveCallback(a);
    })), this._hooks.add(C(o3, le.POINTER_UP, (a) => this.stopMonitoring(true)));
  }
};
var Ne = class extends g {
  _onclick(i, e) {
    this._register(C(i, le.CLICK, (t) => e(new ot(se(i), t))));
  }
  _onmouseover(i, e) {
    this._register(C(i, le.MOUSE_OVER, (t) => e(new ot(se(i), t))));
  }
  _onmouseleave(i, e) {
    this._register(C(i, le.MOUSE_LEAVE, (t) => e(new ot(se(i), t))));
  }
};
var Ti = class extends Ne {
  constructor(i) {
    super(), this._handleActivate = i.handleActivate, this.bgDomNode = document.createElement("div"), this.bgDomNode.className = "xterm-arrow-background", this.bgDomNode.style.position = "absolute", this.bgDomNode.style.width = i.bgWidth + "px", this.bgDomNode.style.height = i.bgHeight + "px", typeof i.top < "u" && (this.bgDomNode.style.top = "0px"), typeof i.left < "u" && (this.bgDomNode.style.left = "0px"), typeof i.bottom < "u" && (this.bgDomNode.style.bottom = "0px"), typeof i.right < "u" && (this.bgDomNode.style.right = "0px"), this.domNode = document.createElement("div"), this.domNode.className = i.className, this.domNode.style.position = "absolute";
    let e = Math.min(i.bgWidth, i.bgHeight);
    this.domNode.style.width = e + "px", this.domNode.style.height = e + "px", typeof i.top < "u" && (this.domNode.style.top = i.top + "px"), typeof i.left < "u" && (this.domNode.style.left = i.left + "px"), typeof i.bottom < "u" && (this.domNode.style.bottom = i.bottom + "px"), typeof i.right < "u" && (this.domNode.style.right = i.right + "px"), this._pointerMoveMonitor = this._register(new at()), this._register(Vr(this.bgDomNode, le.POINTER_DOWN, (t) => this._arrowPointerDown(t))), this._register(Vr(this.domNode, le.POINTER_DOWN, (t) => this._arrowPointerDown(t))), this._pointerdownRepeatTimer = this._register(new xi()), this._pointerdownScheduleRepeatTimer = this._register(new Ie());
  }
  _arrowPointerDown(i) {
    if (!i.target || !(i.target instanceof Element)) return;
    let e = () => {
      this._pointerdownRepeatTimer.cancelAndSet(() => this._handleActivate(), 1e3 / 24, se(i));
    };
    this._handleActivate(), this._pointerdownRepeatTimer.cancel(), this._pointerdownScheduleRepeatTimer.cancelAndSet(e, 200), this._pointerMoveMonitor.startMonitoring(i.target, i.pointerId, i.buttons, (t) => {
    }, () => {
      this._pointerdownRepeatTimer.cancel(), this._pointerdownScheduleRepeatTimer.cancel();
    }), i.preventDefault();
  }
};
var b = class {
  constructor() {
    this._listeners = [];
    this._disposed = false;
  }
  get event() {
    return this._event ? this._event : (this._event = (i, e, t) => {
      if (this._disposed) return E(() => {
      });
      let r = { fn: i, thisArgs: e };
      this._listeners.push(r);
      let s4 = E(() => {
        let o3 = this._listeners.indexOf(r);
        o3 !== -1 && this._listeners.splice(o3, 1);
      });
      return t && (Array.isArray(t) ? t.push(s4) : t.add(s4)), s4;
    }, this._event);
  }
  fire(i) {
    if (!this._disposed) switch (this._listeners.length) {
      case 0:
        return;
      case 1: {
        let { fn: e, thisArgs: t } = this._listeners[0];
        e.call(t, i);
        return;
      }
      default: {
        let e = this._listeners.slice();
        for (let { fn: t, thisArgs: r } of e) t.call(r, i);
      }
    }
  }
  dispose() {
    this._disposed || (this._disposed = true, this._listeners.length = 0);
  }
};
var j;
((r) => {
  function n10(s4, o3) {
    return s4((a) => o3.fire(a));
  }
  r.forward = n10;
  function i(s4, o3) {
    return (a, l3, h) => s4((d) => a.call(l3, o3(d)), void 0, h);
  }
  r.map = i;
  function e(...s4) {
    return (o3, a, l3) => {
      let h = new pe();
      for (let d of s4) h.add(d((c) => o3.call(a, c)));
      return l3 && (Array.isArray(l3) ? l3.push(h) : l3.add(h)), h;
    };
  }
  r.any = e;
  function t(s4, o3, a) {
    return o3(a), s4((l3) => o3(l3));
  }
  r.runAndSubscribe = t;
})(j ||= {});
var Jr = class n4 {
  constructor(i, e, t, r, s4, o3, a) {
    this._forceIntegerValues = i;
    this._scrollStateBrand = void 0;
    this._forceIntegerValues && (e = e | 0, t = t | 0, r = r | 0, s4 = s4 | 0, o3 = o3 | 0, a = a | 0), this.rawScrollLeft = r, this.rawScrollTop = a, e < 0 && (e = 0), r + e > t && (r = t - e), r < 0 && (r = 0), s4 < 0 && (s4 = 0), a + s4 > o3 && (a = o3 - s4), a < 0 && (a = 0), this.width = e, this.scrollWidth = t, this.scrollLeft = r, this.height = s4, this.scrollHeight = o3, this.scrollTop = a;
  }
  equals(i) {
    return this.rawScrollLeft === i.rawScrollLeft && this.rawScrollTop === i.rawScrollTop && this.width === i.width && this.scrollWidth === i.scrollWidth && this.scrollLeft === i.scrollLeft && this.height === i.height && this.scrollHeight === i.scrollHeight && this.scrollTop === i.scrollTop;
  }
  withScrollDimensions(i, e) {
    return new n4(this._forceIntegerValues, typeof i.width < "u" ? i.width : this.width, typeof i.scrollWidth < "u" ? i.scrollWidth : this.scrollWidth, e ? this.rawScrollLeft : this.scrollLeft, typeof i.height < "u" ? i.height : this.height, typeof i.scrollHeight < "u" ? i.scrollHeight : this.scrollHeight, e ? this.rawScrollTop : this.scrollTop);
  }
  withScrollPosition(i) {
    return new n4(this._forceIntegerValues, this.width, this.scrollWidth, typeof i.scrollLeft < "u" ? i.scrollLeft : this.rawScrollLeft, this.height, this.scrollHeight, typeof i.scrollTop < "u" ? i.scrollTop : this.rawScrollTop);
  }
  createScrollEvent(i, e) {
    let t = this.width !== i.width, r = this.scrollWidth !== i.scrollWidth, s4 = this.scrollLeft !== i.scrollLeft, o3 = this.height !== i.height, a = this.scrollHeight !== i.scrollHeight, l3 = this.scrollTop !== i.scrollTop;
    return { inSmoothScrolling: e, oldWidth: i.width, oldScrollWidth: i.scrollWidth, oldScrollLeft: i.scrollLeft, width: this.width, scrollWidth: this.scrollWidth, scrollLeft: this.scrollLeft, oldHeight: i.height, oldScrollHeight: i.scrollHeight, oldScrollTop: i.scrollTop, height: this.height, scrollHeight: this.scrollHeight, scrollTop: this.scrollTop, widthChanged: t, scrollWidthChanged: r, scrollLeftChanged: s4, heightChanged: o3, scrollHeightChanged: a, scrollTopChanged: l3 };
  }
};
var lt = class extends g {
  constructor(e) {
    super();
    this._scrollableBrand = void 0;
    this._onScroll = this._register(new b());
    this.onScroll = this._onScroll.event;
    this._smoothScrollDuration = e.smoothScrollDuration, this._scheduleAtNextAnimationFrame = e.scheduleAtNextAnimationFrame, this._state = new Jr(e.forceIntegerValues, 0, 0, 0, 0, 0, 0), this._smoothScrolling = null;
  }
  dispose() {
    this._smoothScrolling && (this._smoothScrolling.dispose(), this._smoothScrolling = null), super.dispose();
  }
  setSmoothScrollDuration(e) {
    this._smoothScrollDuration = e;
  }
  validateScrollPosition(e) {
    return this._state.withScrollPosition(e);
  }
  getScrollDimensions() {
    return this._state;
  }
  setScrollDimensions(e, t) {
    let r = this._state.withScrollDimensions(e, t);
    this._setState(r, !!this._smoothScrolling), this._smoothScrolling?.acceptScrollDimensions(this._state);
  }
  getFutureScrollPosition() {
    return this._smoothScrolling ? this._smoothScrolling.to : this._state;
  }
  getCurrentScrollPosition() {
    return this._state;
  }
  setScrollPositionNow(e) {
    let t = this._state.withScrollPosition(e);
    this._smoothScrolling && (this._smoothScrolling.dispose(), this._smoothScrolling = null), this._setState(t, false);
  }
  setScrollPositionSmooth(e, t) {
    if (this._smoothScrollDuration === 0) {
      this.setScrollPositionNow(e);
      return;
    }
    if (this._smoothScrolling) {
      e = { scrollLeft: typeof e.scrollLeft > "u" ? this._smoothScrolling.to.scrollLeft : e.scrollLeft, scrollTop: typeof e.scrollTop > "u" ? this._smoothScrolling.to.scrollTop : e.scrollTop };
      let r = this._state.withScrollPosition(e);
      if (this._smoothScrolling.to.scrollLeft === r.scrollLeft && this._smoothScrolling.to.scrollTop === r.scrollTop) return;
      let s4;
      t ? s4 = new Vt(this._smoothScrolling.from, r, this._smoothScrolling.startTime, this._smoothScrolling.duration) : s4 = Vt.start(this._state, r, this._smoothScrollDuration), this._smoothScrolling.dispose(), this._smoothScrolling = s4;
    } else {
      let r = this._state.withScrollPosition(e);
      this._smoothScrolling = Vt.start(this._state, r, this._smoothScrollDuration);
    }
    this._smoothScrolling.animationFrameDisposable = this._scheduleAtNextAnimationFrame(() => {
      this._smoothScrolling && (this._smoothScrolling.animationFrameDisposable = null, this._performSmoothScrolling());
    });
  }
  hasPendingScrollAnimation() {
    return !!this._smoothScrolling;
  }
  _performSmoothScrolling() {
    if (!this._smoothScrolling) return;
    let e = this._smoothScrolling.tick(), t = this._state.withScrollPosition(e);
    if (this._setState(t, true), !!this._smoothScrolling) {
      if (e.isDone) {
        this._smoothScrolling.dispose(), this._smoothScrolling = null;
        return;
      }
      this._smoothScrolling.animationFrameDisposable = this._scheduleAtNextAnimationFrame(() => {
        this._smoothScrolling && (this._smoothScrolling.animationFrameDisposable = null, this._performSmoothScrolling());
      });
    }
  }
  _setState(e, t) {
    let r = this._state;
    r.equals(e) || (this._state = e, this._onScroll.fire(this._state.createScrollEvent(r, t)));
  }
};
var Di = class {
  constructor(i, e, t) {
    this.scrollLeft = i, this.scrollTop = e, this.isDone = t;
  }
};
function Zr(n10, i) {
  let e = i - n10;
  return function(t) {
    return n10 + e * $n(t);
  };
}
function Gn(n10, i, e) {
  return function(t) {
    return t < e ? n10(t / e) : i((t - e) / (1 - e));
  };
}
var Vt = class n5 {
  constructor(i, e, t, r) {
    this.from = i, this.to = e, this.duration = r, this.startTime = t, this.animationFrameDisposable = null, this._initAnimations();
  }
  _initAnimations() {
    this._scrollLeft = this._initAnimation(this.from.scrollLeft, this.to.scrollLeft, this.to.width), this._scrollTop = this._initAnimation(this.from.scrollTop, this.to.scrollTop, this.to.height);
  }
  _initAnimation(i, e, t) {
    if (Math.abs(i - e) > 2.5 * t) {
      let s4, o3;
      return i < e ? (s4 = i + 0.75 * t, o3 = e - 0.75 * t) : (s4 = i - 0.75 * t, o3 = e + 0.75 * t), Gn(Zr(i, s4), Zr(o3, e), 0.33);
    }
    return Zr(i, e);
  }
  dispose() {
    this.animationFrameDisposable !== null && (this.animationFrameDisposable.dispose(), this.animationFrameDisposable = null);
  }
  acceptScrollDimensions(i) {
    this.to = i.withScrollPosition(this.to), this._initAnimations();
  }
  tick() {
    return this._tick(Date.now());
  }
  _tick(i) {
    let e = (i - this.startTime) / this.duration;
    if (e < 1) {
      let t = this._scrollLeft(e), r = this._scrollTop(e);
      return new Di(t, r, false);
    }
    return new Di(this.to.scrollLeft, this.to.scrollTop, true);
  }
  static start(i, e, t) {
    t = t + 10;
    let r = Date.now() - 10;
    return new n5(i, e, r, t);
  }
};
function Vn(n10) {
  return Math.pow(n10, 3);
}
function $n(n10) {
  return 1 - Vn(1 - n10);
}
var Ri = class extends g {
  constructor(i, e, t) {
    super(), this._visibility = i, this._visibleClassName = e, this._invisibleClassName = t, this._domNode = null, this._isVisible = false, this._isNeeded = false, this._rawShouldBeVisible = false, this._shouldBeVisible = false, this._revealTimer = this._register(new Ie());
  }
  setVisibility(i) {
    this._visibility !== i && (this._visibility = i, this._updateShouldBeVisible());
  }
  setShouldBeVisible(i) {
    this._rawShouldBeVisible = i, this._updateShouldBeVisible();
  }
  _applyVisibilitySetting() {
    return this._visibility === 2 ? false : this._visibility === 3 ? true : this._rawShouldBeVisible;
  }
  _updateShouldBeVisible() {
    let i = this._applyVisibilitySetting();
    this._shouldBeVisible !== i && (this._shouldBeVisible = i, this.ensureVisibility());
  }
  setIsNeeded(i) {
    this._isNeeded !== i && (this._isNeeded = i, this.ensureVisibility());
  }
  setDomNode(i) {
    this._domNode = i, this._domNode.setClassName(this._invisibleClassName), this.setShouldBeVisible(false);
  }
  ensureVisibility() {
    if (!this._isNeeded) {
      this._hide(false);
      return;
    }
    this._shouldBeVisible ? this._reveal() : this._hide(true);
  }
  _reveal() {
    this._isVisible || (this._isVisible = true, this._revealTimer.setIfNotSet(() => {
      this._domNode?.setClassName(this._visibleClassName);
    }, 0));
  }
  _hide(i) {
    this._revealTimer.cancel(), this._isVisible && (this._isVisible = false, this._domNode?.setClassName(this._invisibleClassName + (i ? " xterm-fade" : "")));
  }
};
var qn = 140;
var ct = class extends Ne {
  constructor(i) {
    super(), this._lazyRender = i.lazyRender, this._host = i.host, this._scrollable = i.scrollable, this._scrollByPage = i.scrollByPage, this._scrollbarState = i.scrollbarState, this._visibilityController = this._register(new Ri(i.visibility, "xterm-visible xterm-scrollbar " + i.extraScrollbarClassName, "xterm-invisible xterm-scrollbar " + i.extraScrollbarClassName)), this._visibilityController.setIsNeeded(this._scrollbarState.isNeeded()), this._pointerMoveMonitor = this._register(new at()), this._shouldRender = true, this.domNode = new we(document.createElement("div")), this.domNode.setAttribute("role", "presentation"), this.domNode.setAttribute("aria-hidden", "true"), this._visibilityController.setDomNode(this.domNode), this.domNode.setPosition("absolute"), this._register(C(this.domNode.domNode, le.POINTER_DOWN, (e) => this._domNodePointerDown(e)));
  }
  _createArrow(i) {
    let e = this._register(new Ti(i));
    return this.domNode.domNode.appendChild(e.bgDomNode), this.domNode.domNode.appendChild(e.domNode), e;
  }
  _createSlider(i, e, t, r) {
    this.slider = new we(document.createElement("div")), this.slider.setClassName("xterm-slider"), this.slider.setPosition("absolute"), this.slider.setTop(i), this.slider.setLeft(e), typeof t == "number" && this.slider.setWidth(t), typeof r == "number" && this.slider.setHeight(r), this.slider.setLayerHinting(true), this.slider.setContain("strict"), this.domNode.domNode.appendChild(this.slider.domNode), this._register(C(this.slider.domNode, le.POINTER_DOWN, (s4) => {
      s4.button === 0 && (s4.preventDefault(), this._sliderPointerDown(s4));
    })), this._onclick(this.slider.domNode, (s4) => {
      s4.leftButton && s4.stopPropagation();
    });
  }
  _handleElementSize(i) {
    return this._scrollbarState.setVisibleSize(i) && (this._visibilityController.setIsNeeded(this._scrollbarState.isNeeded()), this._shouldRender = true, this._lazyRender || this.render()), this._shouldRender;
  }
  _handleElementScrollSize(i) {
    return this._scrollbarState.setScrollSize(i) && (this._visibilityController.setIsNeeded(this._scrollbarState.isNeeded()), this._shouldRender = true, this._lazyRender || this.render()), this._shouldRender;
  }
  _handleElementScrollPosition(i) {
    return this._scrollbarState.setScrollPosition(i) && (this._visibilityController.setIsNeeded(this._scrollbarState.isNeeded()), this._shouldRender = true, this._lazyRender || this.render()), this._shouldRender;
  }
  beginReveal() {
    this._visibilityController.setShouldBeVisible(true);
  }
  beginHide() {
    this._visibilityController.setShouldBeVisible(false);
  }
  render() {
    this._shouldRender && (this._shouldRender = false, this._renderDomNode(this._scrollbarState.getRectangleLargeSize(), this._scrollbarState.getRectangleSmallSize()), this._updateSlider(this._scrollbarState.getSliderSize(), this._scrollbarState.getArrowSize() + this._scrollbarState.getSliderPosition()));
  }
  _domNodePointerDown(i) {
    i.target === this.domNode.domNode && this._handlePointerDown(i);
  }
  delegatePointerDown(i) {
    let e = this.domNode.domNode.getClientRects()[0].top, t = e + this._scrollbarState.getSliderPosition(), r = e + this._scrollbarState.getSliderPosition() + this._scrollbarState.getSliderSize(), s4 = this._sliderPointerPosition(i);
    t <= s4 && s4 <= r ? i.button === 0 && (i.preventDefault(), this._sliderPointerDown(i)) : this._handlePointerDown(i);
  }
  _handlePointerDown(i) {
    let e, t;
    if (i.target === this.domNode.domNode && typeof i.offsetX == "number" && typeof i.offsetY == "number") e = i.offsetX, t = i.offsetY;
    else {
      let s4 = $s(this.domNode.domNode);
      e = i.pageX - s4.left, t = i.pageY - s4.top;
    }
    let r = this._pointerDownRelativePosition(e, t);
    this._setDesiredScrollPositionNow(this._scrollByPage ? this._scrollbarState.getDesiredScrollPositionFromOffsetPaged(r) : this._scrollbarState.getDesiredScrollPositionFromOffset(r)), i.button === 0 && (i.preventDefault(), this._sliderPointerDown(i));
  }
  _sliderPointerDown(i) {
    if (!i.target || !(i.target instanceof Element)) return;
    let e = this._sliderPointerPosition(i), t = this._sliderOrthogonalPointerPosition(i), r = this._scrollbarState.clone();
    this.slider.toggleClassName("xterm-active", true), this._pointerMoveMonitor.startMonitoring(i.target, i.pointerId, i.buttons, (s4) => {
      let o3 = this._sliderOrthogonalPointerPosition(s4), a = Math.abs(o3 - t);
      if (Ue && a > qn) {
        this._setDesiredScrollPositionNow(r.getScrollPosition());
        return;
      }
      let h = this._sliderPointerPosition(s4) - e;
      this._setDesiredScrollPositionNow(r.getDesiredScrollPositionFromDelta(h));
    }, () => {
      this.slider.toggleClassName("xterm-active", false), this._host.handleDragEnd();
    }), this._host.handleDragStart();
  }
  _setDesiredScrollPositionNow(i) {
    let e = {};
    this.writeScrollPosition(e, i), this._scrollable.setScrollPositionNow(e);
  }
  updateScrollbarSize(i) {
    this._updateScrollbarSize(i), this._scrollbarState.setScrollbarSize(i), this._shouldRender = true, this._lazyRender || this.render();
  }
  isNeeded() {
    return this._scrollbarState.isNeeded();
  }
};
var ht = class n6 {
  constructor(i, e, t, r, s4, o3) {
    this._scrollbarSize = Math.round(e), this._oppositeScrollbarSize = Math.round(t), this._arrowSize = Math.round(i), this._visibleSize = r, this._scrollSize = s4, this._scrollPosition = o3, this._computedAvailableSize = 0, this._computedIsNeeded = false, this._computedSliderSize = 0, this._computedSliderRatio = 0, this._computedSliderPosition = 0, this._refreshComputedValues();
  }
  clone() {
    return new n6(this._arrowSize, this._scrollbarSize, this._oppositeScrollbarSize, this._visibleSize, this._scrollSize, this._scrollPosition);
  }
  setVisibleSize(i) {
    let e = Math.round(i);
    return this._visibleSize !== e ? (this._visibleSize = e, this._refreshComputedValues(), true) : false;
  }
  setScrollSize(i) {
    let e = Math.round(i);
    return this._scrollSize !== e ? (this._scrollSize = e, this._refreshComputedValues(), true) : false;
  }
  setScrollPosition(i) {
    let e = Math.round(i);
    return this._scrollPosition !== e ? (this._scrollPosition = e, this._refreshComputedValues(), true) : false;
  }
  setScrollbarSize(i) {
    this._scrollbarSize = Math.round(i);
  }
  setArrowSize(i) {
    let e = Math.round(i);
    this._arrowSize !== e && (this._arrowSize = e, this._refreshComputedValues());
  }
  setOppositeScrollbarSize(i) {
    this._oppositeScrollbarSize = Math.round(i);
  }
  static _computeValues(i, e, t, r, s4) {
    let o3 = Math.max(0, t - i), a = Math.max(0, o3 - 2 * e), l3 = r > 0 && r > t;
    if (!l3) return { computedAvailableSize: Math.round(o3), computedIsNeeded: l3, computedSliderSize: Math.round(a), computedSliderRatio: 0, computedSliderPosition: 0 };
    let h = Math.round(Math.max(20, Math.floor(t * a / r))), d = (a - h) / (r - t), c = s4 * d;
    return { computedAvailableSize: Math.round(o3), computedIsNeeded: l3, computedSliderSize: Math.round(h), computedSliderRatio: d, computedSliderPosition: Math.round(c) };
  }
  _refreshComputedValues() {
    let i = n6._computeValues(this._oppositeScrollbarSize, this._arrowSize, this._visibleSize, this._scrollSize, this._scrollPosition);
    this._computedAvailableSize = i.computedAvailableSize, this._computedIsNeeded = i.computedIsNeeded, this._computedSliderSize = i.computedSliderSize, this._computedSliderRatio = i.computedSliderRatio, this._computedSliderPosition = i.computedSliderPosition;
  }
  getArrowSize() {
    return this._arrowSize;
  }
  getScrollPosition() {
    return this._scrollPosition;
  }
  getRectangleLargeSize() {
    return this._computedAvailableSize;
  }
  getRectangleSmallSize() {
    return this._scrollbarSize;
  }
  isNeeded() {
    return this._computedIsNeeded;
  }
  getSliderSize() {
    return this._computedSliderSize;
  }
  getSliderPosition() {
    return this._computedSliderPosition;
  }
  getDesiredScrollPositionFromOffset(i) {
    if (!this._computedIsNeeded) return 0;
    let e = i - this._arrowSize - this._computedSliderSize / 2;
    return Math.round(e / this._computedSliderRatio);
  }
  getDesiredScrollPositionFromOffsetPaged(i) {
    if (!this._computedIsNeeded) return 0;
    let e = i - this._arrowSize, t = this._scrollPosition;
    return e < this._computedSliderPosition ? t -= this._visibleSize : t += this._visibleSize, t;
  }
  getDesiredScrollPositionFromDelta(i) {
    if (!this._computedIsNeeded) return 0;
    let e = this._computedSliderPosition + i;
    return Math.round(e / this._computedSliderRatio);
  }
};
var Ai = class extends ct {
  constructor(i, e, t) {
    let r = i.getScrollDimensions(), s4 = i.getCurrentScrollPosition();
    if (super({ lazyRender: e.lazyRender, host: t, scrollbarState: new ht(e.horizontalHasArrows ? e.horizontalScrollbarSize : 0, e.horizontal === 2 ? 0 : e.horizontalScrollbarSize, e.vertical === 2 ? 0 : e.verticalScrollbarSize, r.width, r.scrollWidth, s4.scrollLeft), visibility: e.horizontal, extraScrollbarClassName: "xterm-horizontal", scrollable: i, scrollByPage: e.scrollByPage }), e.horizontalHasArrows) throw new Error("horizontalHasArrows is not supported in xterm.js");
    this._createSlider(Math.floor((e.horizontalScrollbarSize - e.horizontalSliderSize) / 2), 0, void 0, e.horizontalSliderSize);
  }
  _updateSlider(i, e) {
    this.slider.setWidth(i), this.slider.setLeft(e);
  }
  _renderDomNode(i, e) {
    this.domNode.setWidth(i), this.domNode.setHeight(e), this.domNode.setLeft(0), this.domNode.setBottom(0);
  }
  handleScroll(i) {
    return this._shouldRender = this._handleElementScrollSize(i.scrollWidth) || this._shouldRender, this._shouldRender = this._handleElementScrollPosition(i.scrollLeft) || this._shouldRender, this._shouldRender = this._handleElementSize(i.width) || this._shouldRender, this._shouldRender;
  }
  _pointerDownRelativePosition(i, e) {
    return i;
  }
  _sliderPointerPosition(i) {
    return i.pageX;
  }
  _sliderOrthogonalPointerPosition(i) {
    return i.pageY;
  }
  _updateScrollbarSize(i) {
    this.slider.setHeight(i);
  }
  writeScrollPosition(i, e) {
    i.scrollLeft = e;
  }
  updateOptions(i) {
    this.updateScrollbarSize(i.horizontal === 2 ? 0 : i.horizontalScrollbarSize), this._scrollbarState.setOppositeScrollbarSize(i.vertical === 2 ? 0 : i.verticalScrollbarSize), this._visibilityController.setVisibility(i.horizontal), this._scrollByPage = i.scrollByPage;
  }
};
var ki = class extends ct {
  constructor(e, t, r) {
    let s4 = e.getScrollDimensions(), o3 = e.getCurrentScrollPosition(), a = t.verticalHasArrows;
    super({ lazyRender: t.lazyRender, host: r, scrollbarState: new ht(a ? t.verticalScrollbarSize : 0, t.vertical === 2 ? 0 : t.verticalScrollbarSize, 0, s4.height, s4.scrollHeight, o3.scrollTop), visibility: t.vertical, extraScrollbarClassName: "xterm-vertical", scrollable: e, scrollByPage: t.scrollByPage });
    this._arrowScrollDelta = 0;
    this._setArrows(a, t.verticalScrollbarSize), this._createSlider(0, Math.floor((t.verticalScrollbarSize - t.verticalSliderSize) / 2), t.verticalSliderSize, void 0);
  }
  _updateSlider(e, t) {
    this.slider.setHeight(e), this.slider.setTop(t);
  }
  _renderDomNode(e, t) {
    this.domNode.setWidth(t), this.domNode.setHeight(e), this.domNode.setRight(0), this.domNode.setTop(0);
  }
  handleScroll(e) {
    return this._shouldRender = this._handleElementScrollSize(e.scrollHeight) || this._shouldRender, this._shouldRender = this._handleElementScrollPosition(e.scrollTop) || this._shouldRender, this._shouldRender = this._handleElementSize(e.height) || this._shouldRender, this._shouldRender;
  }
  _pointerDownRelativePosition(e, t) {
    return t;
  }
  _sliderPointerPosition(e) {
    return e.pageY;
  }
  _sliderOrthogonalPointerPosition(e) {
    return e.pageX;
  }
  _updateScrollbarSize(e) {
    this.slider.setWidth(e);
  }
  writeScrollPosition(e, t) {
    e.scrollTop = t;
  }
  _arrowScroll(e) {
    let t = this._scrollable.getCurrentScrollPosition();
    this._scrollable.setScrollPositionNow({ scrollTop: t.scrollTop + e });
  }
  _setArrows(e, t) {
    if (this._arrowScrollDelta = t, (!this._arrowUp || !this._arrowDown) && (this._arrowUp = this._createArrow({ className: "xterm-scra xterm-arrow-up", top: 0, left: 0, bgWidth: t, bgHeight: t, handleActivate: () => this._arrowScroll(-this._arrowScrollDelta) }), this._arrowDown = this._createArrow({ className: "xterm-scra xterm-arrow-down", bottom: 0, left: 0, bgWidth: t, bgHeight: t, handleActivate: () => this._arrowScroll(this._arrowScrollDelta) })), this._updateArrowSize(this._arrowUp, t), this._updateArrowSize(this._arrowDown, t), !this._arrowUp || !this._arrowDown) return;
    let r = e ? "" : "none";
    this._arrowUp.bgDomNode.style.display = r, this._arrowUp.domNode.style.display = r, this._arrowDown.bgDomNode.style.display = r, this._arrowDown.domNode.style.display = r;
  }
  _updateArrowSize(e, t) {
    e && (e.bgDomNode.style.width = `${t}px`, e.bgDomNode.style.height = `${t}px`, e.domNode.style.width = `${t}px`, e.domNode.style.height = `${t}px`);
  }
  updateOptions(e) {
    let t = e.verticalHasArrows ? e.verticalScrollbarSize : 0;
    this._scrollbarState.setArrowSize(t), this._setArrows(e.verticalHasArrows, e.verticalScrollbarSize), this.updateScrollbarSize(e.vertical === 2 ? 0 : e.verticalScrollbarSize), this._scrollbarState.setOppositeScrollbarSize(0), this._visibilityController.setVisibility(e.vertical), this._scrollByPage = e.scrollByPage;
  }
};
var Qr = class {
  constructor(i, e, t) {
    this.timestamp = i, this.deltaX = e, this.deltaY = t, this.score = 0;
  }
};
var Bi = class Bi2 {
  constructor() {
    this._capacity = 5, this._memory = [], this._front = -1, this._rear = -1;
  }
  isPhysicalMouseWheel() {
    if (this._front === -1 && this._rear === -1) return false;
    let i = 1, e = 0, t = 1, r = this._rear;
    for (; r !== -1; ) {
      let s4 = r === this._front ? i : Math.pow(2, -t);
      if (i -= s4, e += this._memory[r].score * s4, r === this._front) break;
      r = (this._capacity + r - 1) % this._capacity, t++;
    }
    return e <= 0.5;
  }
  acceptStandardWheelEvent(i) {
    if (Kt) {
      let e = se(i.browserEvent), t = Xr(e);
      this.accept(Date.now(), i.deltaX * t, i.deltaY * t);
    } else this.accept(Date.now(), i.deltaX, i.deltaY);
  }
  accept(i, e, t) {
    let r = null, s4 = new Qr(i, e, t);
    this._front === -1 && this._rear === -1 ? (this._memory[0] = s4, this._front = 0, this._rear = 0) : (r = this._memory[this._rear], this._rear = (this._rear + 1) % this._capacity, this._rear === this._front && (this._front = (this._front + 1) % this._capacity), this._memory[this._rear] = s4), s4.score = this._computeScore(s4, r);
  }
  _computeScore(i, e) {
    if (Math.abs(i.deltaX) > 0 && Math.abs(i.deltaY) > 0) return 1;
    let t = 0.5;
    if ((!this._isAlmostInt(i.deltaX) || !this._isAlmostInt(i.deltaY)) && (t += 0.25), e) {
      let r = Math.abs(i.deltaX), s4 = Math.abs(i.deltaY), o3 = Math.abs(e.deltaX), a = Math.abs(e.deltaY), l3 = Math.max(Math.min(r, o3), 1), h = Math.max(Math.min(s4, a), 1), d = Math.max(r, o3), c = Math.max(s4, a);
      d % l3 === 0 && c % h === 0 && (t -= 0.5);
    }
    return Math.min(Math.max(t, 0), 1);
  }
  _isAlmostInt(i) {
    return Math.abs(Math.round(i) - i) < 0.01;
  }
};
Bi.INSTANCE = new Bi();
var es = Bi;
var Mi = class extends Ne {
  constructor(e, t, r) {
    super();
    this._onScroll = this._register(new b());
    this.onScroll = this._onScroll.event;
    t = t ?? {};
    let s4, o3 = !r;
    r ? s4 = r : (t.mouseWheelSmoothScroll = false, s4 = new lt({ forceIntegerValues: true, smoothScrollDuration: 0, scheduleAtNextAnimationFrame: (l3) => tt(se(e), l3) })), this._options = Xn(t), this._scrollable = s4, this._register(this._scrollable.onScroll((l3) => {
      this._handleScroll(l3), this._onScroll.fire(l3);
    })), o3 && this._register(this._scrollable);
    let a = { handleMouseWheel: (l3) => this._handleMouseWheel(l3), handleDragStart: () => this._handleDragStart(), handleDragEnd: () => this._handleDragEnd() };
    this._verticalScrollbar = this._register(new ki(this._scrollable, this._options, a)), this._horizontalScrollbar = this._register(new Ai(this._scrollable, this._options, a)), this._domNode = document.createElement("div"), this._domNode.className = "xterm-scrollable-element " + this._options.className, this._domNode.setAttribute("role", "presentation"), this._domNode.style.position = "relative", this._domNode.appendChild(e), this._domNode.appendChild(this._horizontalScrollbar.domNode.domNode), this._domNode.appendChild(this._verticalScrollbar.domNode.domNode), this._options.useShadows ? (this._leftShadowDomNode = new we(document.createElement("div")), this._leftShadowDomNode.setClassName("xterm-shadow"), this._domNode.appendChild(this._leftShadowDomNode.domNode), this._topShadowDomNode = new we(document.createElement("div")), this._topShadowDomNode.setClassName("xterm-shadow"), this._domNode.appendChild(this._topShadowDomNode.domNode), this._topLeftShadowDomNode = new we(document.createElement("div")), this._topLeftShadowDomNode.setClassName("xterm-shadow"), this._domNode.appendChild(this._topLeftShadowDomNode.domNode)) : (this._leftShadowDomNode = null, this._topShadowDomNode = null, this._topLeftShadowDomNode = null), this._listenOnDomNode = this._options.listenOnDomNode ?? this._domNode, this._mouseWheelToDispose = [], this._setListeningToMouseWheel(this._options.handleMouseWheel), this._onmouseover(this._listenOnDomNode, (l3) => this._handleMouseOver(l3)), this._onmouseleave(this._listenOnDomNode, (l3) => this._handleMouseLeave(l3)), this._hideTimeout = this._register(new Ie()), this._isDragging = false, this._mouseIsOver = false, this._shouldRender = true, this._revealOnScroll = true;
  }
  get options() {
    return this._options;
  }
  dispose() {
    this._mouseWheelToDispose = Oe(this._mouseWheelToDispose), super.dispose();
  }
  getDomNode() {
    return this._domNode;
  }
  getScrollDimensions() {
    return this._scrollable.getScrollDimensions();
  }
  setScrollDimensions(e) {
    this._scrollable.setScrollDimensions(e, false);
  }
  setScrollPosition(e) {
    e.reuseAnimation ? this._scrollable.setScrollPositionSmooth(e, e.reuseAnimation) : this._scrollable.setScrollPositionNow(e);
  }
  getScrollPosition() {
    return this._scrollable.getCurrentScrollPosition();
  }
  updateClassName(e) {
    this._options.className = e, ie && (this._options.className += " xterm-mac"), this._domNode.className = "xterm-scrollable-element " + this._options.className;
  }
  updateOptions(e) {
    typeof e.handleMouseWheel < "u" && (this._options.handleMouseWheel = e.handleMouseWheel, this._setListeningToMouseWheel(this._options.handleMouseWheel)), typeof e.mouseWheelScrollSensitivity < "u" && (this._options.mouseWheelScrollSensitivity = e.mouseWheelScrollSensitivity), typeof e.fastScrollSensitivity < "u" && (this._options.fastScrollSensitivity = e.fastScrollSensitivity), typeof e.scrollPredominantAxis < "u" && (this._options.scrollPredominantAxis = e.scrollPredominantAxis), typeof e.horizontal < "u" && (this._options.horizontal = e.horizontal), typeof e.vertical < "u" && (this._options.vertical = e.vertical), typeof e.horizontalHasArrows < "u" && (this._options.horizontalHasArrows = e.horizontalHasArrows), typeof e.verticalHasArrows < "u" && (this._options.verticalHasArrows = e.verticalHasArrows), typeof e.horizontalScrollbarSize < "u" && (this._options.horizontalScrollbarSize = e.horizontalScrollbarSize), typeof e.verticalScrollbarSize < "u" && (this._options.verticalScrollbarSize = e.verticalScrollbarSize), typeof e.scrollByPage < "u" && (this._options.scrollByPage = e.scrollByPage), this._horizontalScrollbar.updateOptions(this._options), this._verticalScrollbar.updateOptions(this._options), this._options.lazyRender || this._render();
  }
  delegateScrollFromMouseWheelEvent(e) {
    this._handleMouseWheel(new Gt(e));
  }
  _setListeningToMouseWheel(e) {
    if (this._mouseWheelToDispose.length > 0 !== e && (this._mouseWheelToDispose = Oe(this._mouseWheelToDispose), e)) {
      let r = (s4) => {
        this._handleMouseWheel(new Gt(s4));
      };
      this._mouseWheelToDispose.push(C(this._listenOnDomNode, le.MOUSE_WHEEL, r, { passive: false }));
    }
  }
  _handleMouseWheel(e) {
    if (e.browserEvent?.defaultPrevented) return;
    let t = es.INSTANCE;
    t.acceptStandardWheelEvent(e);
    let r = false;
    if (e.deltaY || e.deltaX) {
      let o3 = e.deltaY * this._options.mouseWheelScrollSensitivity, a = e.deltaX * this._options.mouseWheelScrollSensitivity;
      this._options.scrollPredominantAxis && (this._options.scrollYToX && a + o3 === 0 ? a = o3 = 0 : Math.abs(o3) >= Math.abs(a) ? a = 0 : o3 = 0), this._options.flipAxes && ([o3, a] = [a, o3]);
      let l3 = !ie && e.browserEvent && e.browserEvent.shiftKey;
      (this._options.scrollYToX || l3) && !a && (a = o3, o3 = 0), e.browserEvent && e.browserEvent.altKey && (a = a * this._options.fastScrollSensitivity, o3 = o3 * this._options.fastScrollSensitivity);
      let h = this._scrollable.getFutureScrollPosition(), d = {};
      if (o3) {
        let c = 50 * o3, u = h.scrollTop - (c < 0 ? Math.floor(c) : Math.ceil(c));
        this._verticalScrollbar.writeScrollPosition(d, u);
      }
      if (a) {
        let c = 50 * a, u = h.scrollLeft - (c < 0 ? Math.floor(c) : Math.ceil(c));
        this._horizontalScrollbar.writeScrollPosition(d, u);
      }
      d = this._scrollable.validateScrollPosition(d), (h.scrollLeft !== d.scrollLeft || h.scrollTop !== d.scrollTop) && (this._options.mouseWheelSmoothScroll && t.isPhysicalMouseWheel() ? this._scrollable.setScrollPositionSmooth(d) : this._scrollable.setScrollPositionNow(d), r = true);
    }
    let s4 = r;
    !s4 && this._options.alwaysConsumeMouseWheel && (s4 = true), !s4 && this._options.consumeMouseWheelIfScrollbarIsNeeded && (this._verticalScrollbar.isNeeded() || this._horizontalScrollbar.isNeeded()) && (s4 = true), s4 && (e.preventDefault(), e.stopPropagation());
  }
  _handleScroll(e) {
    this._shouldRender = this._horizontalScrollbar.handleScroll(e) || this._shouldRender, this._shouldRender = this._verticalScrollbar.handleScroll(e) || this._shouldRender, this._options.useShadows && (this._shouldRender = true), this._revealOnScroll && this._reveal(), this._options.lazyRender || this._render();
  }
  renderNow() {
    if (!this._options.lazyRender) throw new Error("Please use `lazyRender` together with `renderNow`!");
    this._render();
  }
  _render() {
    if (this._shouldRender && (this._shouldRender = false, this._horizontalScrollbar.render(), this._verticalScrollbar.render(), this._options.useShadows)) {
      let e = this._scrollable.getCurrentScrollPosition(), t = e.scrollTop > 0, r = e.scrollLeft > 0, s4 = r ? " xterm-shadow-left" : "", o3 = t ? " xterm-shadow-top" : "", a = r || t ? " xterm-shadow-top-left-corner" : "";
      this._leftShadowDomNode.setClassName(`xterm-shadow${s4}`), this._topShadowDomNode.setClassName(`xterm-shadow${o3}`), this._topLeftShadowDomNode.setClassName(`xterm-shadow${a}${o3}${s4}`);
    }
  }
  _handleDragStart() {
    this._isDragging = true, this._reveal();
  }
  _handleDragEnd() {
    this._isDragging = false, this._hide();
  }
  _handleMouseLeave(e) {
    this._mouseIsOver = false, this._hide();
  }
  _handleMouseOver(e) {
    this._mouseIsOver = true, this._reveal();
  }
  _reveal() {
    this._verticalScrollbar.beginReveal(), this._horizontalScrollbar.beginReveal(), this._scheduleHide();
  }
  _hide() {
    !this._mouseIsOver && !this._isDragging && (this._verticalScrollbar.beginHide(), this._horizontalScrollbar.beginHide());
  }
  _scheduleHide() {
    !this._mouseIsOver && !this._isDragging && this._hideTimeout.cancelAndSet(() => this._hide(), 500);
  }
};
function Xn(n10) {
  let i = { lazyRender: typeof n10.lazyRender < "u" ? n10.lazyRender : false, className: typeof n10.className < "u" ? n10.className : "", useShadows: typeof n10.useShadows < "u" ? n10.useShadows : true, handleMouseWheel: typeof n10.handleMouseWheel < "u" ? n10.handleMouseWheel : true, flipAxes: typeof n10.flipAxes < "u" ? n10.flipAxes : false, consumeMouseWheelIfScrollbarIsNeeded: typeof n10.consumeMouseWheelIfScrollbarIsNeeded < "u" ? n10.consumeMouseWheelIfScrollbarIsNeeded : false, alwaysConsumeMouseWheel: typeof n10.alwaysConsumeMouseWheel < "u" ? n10.alwaysConsumeMouseWheel : false, scrollYToX: typeof n10.scrollYToX < "u" ? n10.scrollYToX : false, mouseWheelScrollSensitivity: typeof n10.mouseWheelScrollSensitivity < "u" ? n10.mouseWheelScrollSensitivity : 1, fastScrollSensitivity: typeof n10.fastScrollSensitivity < "u" ? n10.fastScrollSensitivity : 5, scrollPredominantAxis: typeof n10.scrollPredominantAxis < "u" ? n10.scrollPredominantAxis : true, mouseWheelSmoothScroll: typeof n10.mouseWheelSmoothScroll < "u" ? n10.mouseWheelSmoothScroll : true, listenOnDomNode: typeof n10.listenOnDomNode < "u" ? n10.listenOnDomNode : null, horizontal: typeof n10.horizontal < "u" ? n10.horizontal : 1, horizontalScrollbarSize: typeof n10.horizontalScrollbarSize < "u" ? n10.horizontalScrollbarSize : 10, horizontalSliderSize: typeof n10.horizontalSliderSize < "u" ? n10.horizontalSliderSize : 0, horizontalHasArrows: typeof n10.horizontalHasArrows < "u" ? n10.horizontalHasArrows : false, vertical: typeof n10.vertical < "u" ? n10.vertical : 1, verticalScrollbarSize: typeof n10.verticalScrollbarSize < "u" ? n10.verticalScrollbarSize : 10, verticalHasArrows: typeof n10.verticalHasArrows < "u" ? n10.verticalHasArrows : false, verticalSliderSize: typeof n10.verticalSliderSize < "u" ? n10.verticalSliderSize : 0, scrollByPage: typeof n10.scrollByPage < "u" ? n10.scrollByPage : false };
  return i.horizontalSliderSize = typeof n10.horizontalSliderSize < "u" ? n10.horizontalSliderSize : i.horizontalScrollbarSize, i.verticalSliderSize = typeof n10.verticalSliderSize < "u" ? n10.verticalSliderSize : i.verticalScrollbarSize, ie && (i.className += " xterm-mac"), i;
}
var dt = class extends g {
  constructor(e, t, r, s4, o3, a, l3, h, d) {
    super();
    this._bufferService = r;
    this._coreService = o3;
    this._optionsService = h;
    this._renderService = d;
    this._onRequestScrollLines = this._register(new b());
    this.onRequestScrollLines = this._onRequestScrollLines.event;
    this._isSyncing = false;
    this._isHandlingScroll = false;
    this._suppressOnScrollHandler = false;
    this._needsSyncOnRender = false;
    let c = this._register(new lt({ forceIntegerValues: false, smoothScrollDuration: this._optionsService.rawOptions.smoothScrollDuration, scheduleAtNextAnimationFrame: (u) => tt(s4.window, u) }));
    this._register(this._optionsService.onSpecificOptionChange("smoothScrollDuration", () => {
      c.setSmoothScrollDuration(this._optionsService.rawOptions.smoothScrollDuration);
    })), this._scrollableElement = this._register(new Mi(t, { vertical: 1, horizontal: 2, useShadows: false, mouseWheelSmoothScroll: true, verticalHasArrows: this._optionsService.rawOptions.scrollbar?.showArrows ?? false, ...this._getChangeOptions() }, c)), this._register(this._optionsService.onMultipleOptionChange(["scrollSensitivity", "fastScrollSensitivity", "scrollbar"], () => this._scrollableElement.updateOptions(this._getChangeOptions()))), this._register(a.onProtocolChange((u) => {
      this._scrollableElement.updateOptions({ handleMouseWheel: !(u & 16) });
    })), this._scrollableElement.setScrollDimensions({ height: 0, scrollHeight: 0 }), this._register(j.runAndSubscribe(l3.onChangeColors, () => {
      e.style.backgroundColor = l3.colors.background.css, this._scrollableElement.getDomNode().style.backgroundColor = l3.colors.background.css;
    })), e.appendChild(this._scrollableElement.getDomNode()), this._register(E(() => this._scrollableElement.getDomNode().remove())), this._styleElement = s4.mainDocument.createElement("style"), t.appendChild(this._styleElement), this._register(E(() => this._styleElement.remove())), this._register(j.runAndSubscribe(l3.onChangeColors, () => {
      this._styleElement.textContent = [".xterm .xterm-scrollable-element > .xterm-scrollbar > .xterm-slider {", `  background: ${l3.colors.scrollbarSliderBackground.css};`, "}", ".xterm .xterm-scrollable-element > .xterm-scrollbar > .xterm-slider:hover {", `  background: ${l3.colors.scrollbarSliderHoverBackground.css};`, "}", ".xterm .xterm-scrollable-element > .xterm-scrollbar > .xterm-slider.xterm-active {", `  background: ${l3.colors.scrollbarSliderActiveBackground.css};`, "}"].join(`
`);
    })), this._register(this._bufferService.onResize(() => this.queueSync())), this._register(this._bufferService.buffers.onBufferActivate(() => {
      this._latestYDisp = void 0, this.queueSync();
    })), this._register(this._bufferService.onScroll(() => this._sync())), this._register(this._renderService.onRender(() => {
      this._needsSyncOnRender && (this._needsSyncOnRender = false, this._sync());
    })), this._register(this._scrollableElement.onScroll((u) => this._handleScroll(u)));
  }
  scrollLines(e) {
    let t = this._scrollableElement.getScrollPosition();
    this._scrollableElement.setScrollPosition({ reuseAnimation: true, scrollTop: t.scrollTop + e * this._renderService.dimensions.css.cell.height });
  }
  scrollToLine(e, t) {
    t && (this._latestYDisp = e), this._scrollableElement.setScrollPosition({ reuseAnimation: !t, scrollTop: e * this._renderService.dimensions.css.cell.height });
  }
  _getChangeOptions() {
    let e = this._optionsService.rawOptions.scrollbar?.showScrollbar ?? true, t = this._optionsService.rawOptions.scrollbar?.showArrows ?? false, r = e ? this._optionsService.rawOptions.scrollbar?.width ?? 14 : 0;
    return { mouseWheelScrollSensitivity: this._optionsService.rawOptions.scrollSensitivity, fastScrollSensitivity: this._optionsService.rawOptions.fastScrollSensitivity, vertical: e ? 1 : 2, verticalScrollbarSize: r, verticalHasArrows: t };
  }
  queueSync(e) {
    e !== void 0 && (this._latestYDisp = e), this._queuedAnimationFrame === void 0 && (this._queuedAnimationFrame = this._renderService.addRefreshCallback(() => {
      this._queuedAnimationFrame = void 0, this._sync(this._latestYDisp);
    }));
  }
  _sync(e = this._bufferService.buffer.ydisp) {
    if (!(!this._renderService || this._isSyncing)) {
      if (this._coreService.decPrivateModes.synchronizedOutput) {
        this._needsSyncOnRender = true;
        return;
      }
      this._isSyncing = true, this._suppressOnScrollHandler = true, this._scrollableElement.setScrollDimensions({ height: this._renderService.dimensions.css.canvas.height, scrollHeight: this._renderService.dimensions.css.cell.height * this._bufferService.buffer.lines.length }), this._suppressOnScrollHandler = false, e !== this._latestYDisp && this._scrollableElement.setScrollPosition({ scrollTop: e * this._renderService.dimensions.css.cell.height }), this._isSyncing = false;
    }
  }
  _handleScroll(e) {
    if (!this._renderService || this._isHandlingScroll || this._suppressOnScrollHandler) return;
    this._isHandlingScroll = true;
    let t = Math.round(e.scrollTop / this._renderService.dimensions.css.cell.height), r = t - this._bufferService.buffer.ydisp;
    r !== 0 && (this._latestYDisp = t, this._onRequestScrollLines.fire(r)), this._isHandlingScroll = false;
  }
  handleTouchScroll(e) {
    let t = this._scrollableElement.getScrollPosition();
    this._scrollableElement.setScrollPosition({ scrollTop: t.scrollTop - e });
  }
};
dt = y([m(2, D), m(3, G), m(4, Y), m(5, Me), m(6, _e), m(7, R), m(8, V)], dt);
var ut = class extends g {
  constructor(e, t, r, s4, o3) {
    super();
    this._screenElement = e;
    this._bufferService = t;
    this._coreBrowserService = r;
    this._decorationService = s4;
    this._renderService = o3;
    this._decorationElements = /* @__PURE__ */ new Map();
    this._altBufferIsActive = false;
    this._dimensionsChanged = false;
    this._container = document.createElement("div"), this._container.classList.add("xterm-decoration-container"), this._screenElement.appendChild(this._container), this._register(this._renderService.onRenderedViewportChange(() => this._doRefreshDecorations())), this._register(this._renderService.onDimensionsChange(() => {
      this._dimensionsChanged = true, this._queueRefresh();
    })), this._register(this._coreBrowserService.onDprChange(() => this._queueRefresh())), this._register(this._bufferService.buffers.onBufferActivate(() => {
      this._altBufferIsActive = this._bufferService.buffer === this._bufferService.buffers.alt;
    })), this._register(this._decorationService.onDecorationRegistered(() => this._queueRefresh())), this._register(this._decorationService.onDecorationRemoved((a) => this._removeDecoration(a))), this._register(E(() => {
      this._container.remove(), this._decorationElements.clear();
    }));
  }
  _queueRefresh() {
    this._animationFrame === void 0 && (this._animationFrame = this._renderService.addRefreshCallback(() => {
      this._doRefreshDecorations(), this._animationFrame = void 0;
    }));
  }
  _doRefreshDecorations() {
    for (let e of this._decorationService.decorations) this._renderDecoration(e);
    this._dimensionsChanged = false;
  }
  _renderDecoration(e) {
    this._refreshStyle(e), this._dimensionsChanged && this._refreshXPosition(e);
  }
  _createElement(e) {
    let t = this._coreBrowserService.mainDocument.createElement("div");
    t.classList.add("xterm-decoration"), t.classList.toggle("xterm-decoration-top-layer", e?.options?.layer === "top"), t.style.width = `${Math.round((e.options.width || 1) * this._renderService.dimensions.css.cell.width)}px`, t.style.height = `${(e.options.height || 1) * this._renderService.dimensions.css.cell.height}px`, t.style.top = `${(e.marker.line - this._bufferService.buffers.active.ydisp) * this._renderService.dimensions.css.cell.height}px`, t.style.lineHeight = `${this._renderService.dimensions.css.cell.height}px`;
    let r = e.options.x ?? 0;
    return r && r > this._bufferService.cols && (t.style.display = "none"), this._refreshXPosition(e, t), t;
  }
  _refreshStyle(e) {
    let t = e.marker.line - this._bufferService.buffers.active.ydisp;
    if (t < 0 || t >= this._bufferService.rows) e.element && (e.element.style.display = "none", e.onRenderEmitter.fire(e.element));
    else {
      let r = this._decorationElements.get(e);
      r || (r = this._createElement(e), e.element = r, this._decorationElements.set(e, r), this._container.appendChild(r), e.onDispose(() => {
        this._decorationElements.delete(e), r.remove();
      })), r.style.display = this._altBufferIsActive ? "none" : "block", this._altBufferIsActive || (r.style.width = `${Math.round((e.options.width || 1) * this._renderService.dimensions.css.cell.width)}px`, r.style.height = `${(e.options.height || 1) * this._renderService.dimensions.css.cell.height}px`, r.style.top = `${t * this._renderService.dimensions.css.cell.height}px`, r.style.lineHeight = `${this._renderService.dimensions.css.cell.height}px`), e.onRenderEmitter.fire(r);
    }
  }
  _refreshXPosition(e, t = e.element) {
    if (!t) return;
    let r = e.options.x ?? 0;
    (e.options.anchor || "left") === "right" ? t.style.right = r ? `${r * this._renderService.dimensions.css.cell.width}px` : "" : t.style.left = r ? `${r * this._renderService.dimensions.css.cell.width}px` : "";
  }
  _removeDecoration(e) {
    this._decorationElements.get(e)?.remove(), this._decorationElements.delete(e), e.dispose();
  }
};
ut = y([m(1, D), m(2, G), m(3, ge), m(4, V)], ut);
var Pi = class {
  constructor() {
    this._zones = [];
    this._zonePool = [];
    this._zonePoolIndex = 0;
    this._linePadding = { full: 0, left: 0, center: 0, right: 0 };
  }
  get zones() {
    return this._zonePool.length = Math.min(this._zonePool.length, this._zones.length), this._zones;
  }
  clear() {
    this._zones.length = 0, this._zonePoolIndex = 0;
  }
  addDecoration(i) {
    if (i.options.overviewRulerOptions) {
      for (let e of this._zones) if (e.color === i.options.overviewRulerOptions.color && e.position === i.options.overviewRulerOptions.position) {
        if (this._lineIntersectsZone(e, i.marker.line)) return;
        if (this._lineAdjacentToZone(e, i.marker.line, i.options.overviewRulerOptions.position)) {
          this._addLineToZone(e, i.marker.line);
          return;
        }
      }
      if (this._zonePoolIndex < this._zonePool.length) {
        this._zonePool[this._zonePoolIndex].color = i.options.overviewRulerOptions.color, this._zonePool[this._zonePoolIndex].position = i.options.overviewRulerOptions.position, this._zonePool[this._zonePoolIndex].startBufferLine = i.marker.line, this._zonePool[this._zonePoolIndex].endBufferLine = i.marker.line, this._zones.push(this._zonePool[this._zonePoolIndex++]);
        return;
      }
      this._zones.push({ color: i.options.overviewRulerOptions.color, position: i.options.overviewRulerOptions.position, startBufferLine: i.marker.line, endBufferLine: i.marker.line }), this._zonePool.push(this._zones[this._zones.length - 1]), this._zonePoolIndex++;
    }
  }
  setPadding(i) {
    this._linePadding = i;
  }
  _lineIntersectsZone(i, e) {
    return e >= i.startBufferLine && e <= i.endBufferLine;
  }
  _lineAdjacentToZone(i, e, t) {
    return e >= i.startBufferLine - this._linePadding[t || "full"] && e <= i.endBufferLine + this._linePadding[t || "full"];
  }
  _addLineToZone(i, e) {
    i.startBufferLine = Math.min(i.startBufferLine, e), i.endBufferLine = Math.max(i.endBufferLine, e);
  }
};
var Ce = { full: 0, left: 0, center: 0, right: 0 };
var Fe = { full: 0, left: 0, center: 0, right: 0 };
var $t = { full: 0, left: 0, center: 0, right: 0 };
var ze = class extends g {
  constructor(e, t, r, s4, o3, a, l3, h) {
    super();
    this._viewportElement = e;
    this._screenElement = t;
    this._bufferService = r;
    this._decorationService = s4;
    this._renderService = o3;
    this._optionsService = a;
    this._themeService = l3;
    this._coreBrowserService = h;
    this._colorZoneStore = new Pi();
    this._shouldUpdateDimensions = true;
    this._shouldUpdateAnchor = true;
    this._lastKnownBufferLength = 0;
    this._canvas = this._coreBrowserService.mainDocument.createElement("canvas"), this._canvas.classList.add("xterm-decoration-overview-ruler"), this._refreshCanvasDimensions(), this._viewportElement.parentElement?.insertBefore(this._canvas, this._viewportElement), this._register(E(() => this._canvas?.remove()));
    let d = this._canvas.getContext("2d");
    if (d) this._ctx = d;
    else throw new Error("Ctx cannot be null");
    this._register(this._decorationService.onDecorationRegistered(() => this._queueRefresh(void 0, true))), this._register(this._decorationService.onDecorationRemoved(() => this._queueRefresh(void 0, true))), this._register(this._renderService.onRenderedViewportChange(() => this._queueRefresh())), this._register(this._bufferService.buffers.onBufferActivate(() => {
      this._canvas.style.display = this._bufferService.buffer === this._bufferService.buffers.alt ? "none" : "block";
    })), this._register(this._bufferService.onScroll(() => {
      this._lastKnownBufferLength !== this._bufferService.buffers.normal.lines.length && (this._refreshDrawHeightConstants(), this._refreshColorZonePadding());
    })), this._register(this._renderService.onDimensionsChange(() => this._queueRefresh(true))), this._register(this._coreBrowserService.onDprChange(() => this._queueRefresh(true))), this._register(this._optionsService.onSpecificOptionChange("scrollbar", () => this._queueRefresh(true))), this._register(this._themeService.onChangeColors(() => this._queueRefresh())), this._register(E(() => {
      this._animationFrame !== void 0 && (this._coreBrowserService.window.cancelAnimationFrame(this._animationFrame), this._animationFrame = void 0);
    })), this._queueRefresh(true);
  }
  get _width() {
    let e = this._optionsService.rawOptions.scrollbar;
    return e?.showScrollbar ?? true ? e?.width ?? 0 : 0;
  }
  _refreshDrawConstants() {
    let e = Math.floor((this._canvas.width - 1) / 3), t = Math.ceil((this._canvas.width - 1) / 3);
    Fe.full = this._canvas.width, Fe.left = e, Fe.center = t, Fe.right = e, this._refreshDrawHeightConstants(), $t.full = 1, $t.left = 1, $t.center = 1 + Fe.left, $t.right = 1 + Fe.left + Fe.center;
  }
  _refreshDrawHeightConstants() {
    Ce.full = Math.round(2 * this._coreBrowserService.dpr);
    let e = this._canvas.height / this._bufferService.buffer.lines.length, t = Math.round(Math.max(Math.min(e, 12), 6) * this._coreBrowserService.dpr);
    Ce.left = t, Ce.center = t, Ce.right = t;
  }
  _refreshColorZonePadding() {
    this._colorZoneStore.setPadding({ full: Math.floor(this._bufferService.buffers.active.lines.length / (this._canvas.height - 1) * Ce.full), left: Math.floor(this._bufferService.buffers.active.lines.length / (this._canvas.height - 1) * Ce.left), center: Math.floor(this._bufferService.buffers.active.lines.length / (this._canvas.height - 1) * Ce.center), right: Math.floor(this._bufferService.buffers.active.lines.length / (this._canvas.height - 1) * Ce.right) }), this._lastKnownBufferLength = this._bufferService.buffers.normal.lines.length;
  }
  _refreshCanvasDimensions() {
    if (this._store.isDisposed || !this._renderService.hasRenderer()) return;
    let e = this._renderService.dimensions.css.canvas.height, t = this._renderService.dimensions.device.canvas.height;
    this._canvas.style.width = `${this._width}px`, this._canvas.width = Math.round(this._width * this._coreBrowserService.dpr), this._canvas.style.height = `${e}px`, this._canvas.height = t, this._refreshDrawConstants(), this._refreshColorZonePadding();
  }
  _refreshDecorations() {
    if (this._store.isDisposed || !this._renderService.hasRenderer()) return;
    this._shouldUpdateDimensions && this._refreshCanvasDimensions(), this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height), this._colorZoneStore.clear();
    for (let t of this._decorationService.decorations) this._colorZoneStore.addDecoration(t);
    this._ctx.lineWidth = 1, this._renderRulerOutline();
    let e = this._colorZoneStore.zones;
    for (let t of e) t.position !== "full" && this._renderColorZone(t);
    for (let t of e) t.position === "full" && this._renderColorZone(t);
    this._shouldUpdateDimensions = false, this._shouldUpdateAnchor = false;
  }
  _renderRulerOutline() {
    this._ctx.fillStyle = this._themeService.colors.overviewRulerBorder.css, this._ctx.fillRect(0, 0, 1, this._canvas.height), this._optionsService.rawOptions.scrollbar?.overviewRuler?.showTopBorder && this._ctx.fillRect(1, 0, this._canvas.width - 1, 1), this._optionsService.rawOptions.scrollbar?.overviewRuler?.showBottomBorder && this._ctx.fillRect(1, this._canvas.height - 1, this._canvas.width - 1, this._canvas.height);
  }
  _renderColorZone(e) {
    this._ctx.fillStyle = e.color, this._ctx.fillRect($t[e.position || "full"], Math.round((this._canvas.height - 1) * (e.startBufferLine / this._bufferService.buffers.active.lines.length) - Ce[e.position || "full"] / 2), Fe[e.position || "full"], Math.round((this._canvas.height - 1) * ((e.endBufferLine - e.startBufferLine) / this._bufferService.buffers.active.lines.length) + Ce[e.position || "full"]));
  }
  _queueRefresh(e, t) {
    this._store.isDisposed || (this._shouldUpdateDimensions = e || this._shouldUpdateDimensions, this._shouldUpdateAnchor = t || this._shouldUpdateAnchor, this._animationFrame === void 0 && (this._animationFrame = this._coreBrowserService.window.requestAnimationFrame(() => {
      this._store.isDisposed || this._refreshDecorations(), this._animationFrame = void 0;
    })));
  }
};
ze = y([m(2, D), m(3, ge), m(4, V), m(5, R), m(6, _e), m(7, G)], ze);
var ft = class {
  constructor(i, e, t, r, s4, o3) {
    this._textarea = i;
    this._compositionView = e;
    this._bufferService = t;
    this._optionsService = r;
    this._coreService = s4;
    this._renderService = o3;
    this._isComposing = false, this._isSendingComposition = false, this._compositionPosition = { start: 0, end: 0 }, this._compositionSuffix = "", this._dataAlreadySent = "";
  }
  get isComposing() {
    return this._isComposing;
  }
  compositionstart() {
    this._isComposing = true;
    let i = this._textarea.selectionStart ?? this._textarea.value.length, e = this._textarea.selectionEnd ?? i;
    this._compositionPosition.start = Math.min(i, e), this._compositionPosition.end = Math.max(i, e), this._compositionSuffix = this._textarea.value.substring(this._compositionPosition.end), this._compositionView.textContent = "", this._dataAlreadySent = "", this._compositionView.classList.add("active");
  }
  compositionupdate(i) {
    this._compositionView.textContent = `\u200E${i.data}\u200E`, this.updateCompositionElements(), setTimeout(() => {
      let e = this._textarea.selectionEnd ?? this._textarea.value.length;
      this._compositionPosition.end = Math.max(this._compositionPosition.start, e);
    }, 0);
  }
  compositionend() {
    this._finalizeComposition(true);
  }
  keydown(i) {
    if (this._isComposing || this._isSendingComposition) {
      if (i.keyCode === 20 || i.keyCode === 229 || i.keyCode === 16 || i.keyCode === 17 || i.keyCode === 18) return false;
      this._finalizeComposition(false);
    }
    return i.keyCode === 229 ? (this._handleAnyTextareaChanges(), false) : true;
  }
  _finalizeComposition(i) {
    if (this._compositionView.classList.remove("active"), this._isComposing = false, i) {
      let e = { start: this._compositionPosition.start, end: this._compositionPosition.end }, t = this._compositionSuffix;
      this._isSendingComposition = true, setTimeout(() => {
        if (this._isSendingComposition) {
          this._isSendingComposition = false;
          let r;
          if (e.start += this._dataAlreadySent.length, this._isComposing) r = this._textarea.value.substring(e.start, this._compositionPosition.start);
          else {
            let s4 = this._textarea.value, o3 = t.length > 0 && s4.endsWith(t) ? s4.length - t.length : s4.length;
            r = s4.substring(e.start, Math.max(e.start, o3));
          }
          r.length > 0 && this._coreService.triggerDataEvent(r, true);
        }
      }, 0);
    } else {
      this._isSendingComposition = false;
      let e = this._textarea.value.substring(this._compositionPosition.start, this._compositionPosition.end);
      this._coreService.triggerDataEvent(e, true);
    }
  }
  _handleAnyTextareaChanges() {
    if (this._textareaChangeTimer) return;
    let i = this._textarea.value;
    this._textareaChangeTimer = window.setTimeout(() => {
      if (this._textareaChangeTimer = void 0, !this._isComposing) {
        let e = this._textarea.value, t = e.replace(i, "");
        this._dataAlreadySent = t, e.length > i.length ? this._coreService.triggerDataEvent(t, true) : e.length < i.length ? this._coreService.triggerDataEvent("\x7F", true) : e.length === i.length && e !== i && this._coreService.triggerDataEvent(e, true);
      }
    }, 0);
  }
  updateCompositionElements(i) {
    if (this._isComposing) {
      if (this._bufferService.buffer.isCursorInViewport) {
        let e = Math.min(this._bufferService.buffer.x, this._bufferService.cols - 1), t = this._renderService.dimensions.css.cell.height, r = this._bufferService.buffer.y * this._renderService.dimensions.css.cell.height, s4 = e * this._renderService.dimensions.css.cell.width;
        this._compositionView.style.left = s4 + "px", this._compositionView.style.top = r + "px", this._compositionView.style.height = t + "px", this._compositionView.style.lineHeight = t + "px", this._compositionView.style.fontFamily = this._optionsService.rawOptions.fontFamily, this._compositionView.style.fontSize = this._optionsService.rawOptions.fontSize + "px";
        let o3 = this._bufferService.cols * this._renderService.dimensions.css.cell.width - s4;
        this._compositionView.style.maxWidth = o3 + "px", this._compositionView.style.overflow = "hidden", this._compositionView.style.direction = "rtl";
        let a = this._compositionView.getBoundingClientRect();
        this._textarea.style.left = s4 + "px", this._textarea.style.top = r + "px", this._textarea.style.width = Math.max(a.width, 1) + "px", this._textarea.style.height = Math.max(a.height, 1) + "px", this._textarea.style.lineHeight = a.height + "px";
      }
      i || setTimeout(() => this.updateCompositionElements(true), 0);
    }
  }
};
ft = y([m(2, D), m(3, R), m(4, Y), m(5, V)], ft);
var J = 0;
var Q = 0;
var ee = 0;
var W = 0;
var ts = { css: "#00000000", rgba: 0 };
var O;
((t) => {
  function n10(r, s4, o3, a) {
    return a !== void 0 ? `#${Ve(r)}${Ve(s4)}${Ve(o3)}${Ve(a)}` : `#${Ve(r)}${Ve(s4)}${Ve(o3)}`;
  }
  t.toCss = n10;
  function i(r, s4, o3, a = 255) {
    return (r << 24 | s4 << 16 | o3 << 8 | a) >>> 0;
  }
  t.toRgba = i;
  function e(r, s4, o3, a) {
    return { css: t.toCss(r, s4, o3, a), rgba: t.toRgba(r, s4, o3, a) };
  }
  t.toColor = e;
})(O ||= {});
var k;
((a) => {
  function n10(l3, h) {
    if (W = (h.rgba & 255) / 255, W === 1) return { css: h.css, rgba: h.rgba };
    let d = h.rgba >> 24 & 255, c = h.rgba >> 16 & 255, u = h.rgba >> 8 & 255, _ = l3.rgba >> 24 & 255, p = l3.rgba >> 16 & 255, v = l3.rgba >> 8 & 255;
    J = _ + Math.round((d - _) * W), Q = p + Math.round((c - p) * W), ee = v + Math.round((u - v) * W);
    let f2 = O.toCss(J, Q, ee), S = O.toRgba(J, Q, ee);
    return { css: f2, rgba: S };
  }
  a.blend = n10;
  function i(l3) {
    return (l3.rgba & 255) === 255;
  }
  a.isOpaque = i;
  function e(l3, h, d) {
    let c = Oi.ensureContrastRatio(l3.rgba, h.rgba, d);
    if (c) return O.toColor(c >> 24 & 255, c >> 16 & 255, c >> 8 & 255);
  }
  a.ensureContrastRatio = e;
  function t(l3) {
    let h = (l3.rgba | 255) >>> 0;
    return [J, Q, ee] = Oi.toChannels(h), { css: O.toCss(J, Q, ee), rgba: h };
  }
  a.opaque = t;
  function r(l3, h) {
    return W = Math.round(h * 255), [J, Q, ee] = Oi.toChannels(l3.rgba), { css: O.toCss(J, Q, ee, W), rgba: O.toRgba(J, Q, ee, W) };
  }
  a.opacity = r;
  function s4(l3, h) {
    return W = l3.rgba & 255, r(l3, W * h / 255);
  }
  a.multiplyOpacity = s4;
  function o3(l3) {
    return [l3.rgba >> 24 & 255, l3.rgba >> 16 & 255, l3.rgba >> 8 & 255];
  }
  a.toColorRGB = o3;
})(k ||= {});
var B;
((t) => {
  let n10, i;
  try {
    let r = document.createElement("canvas");
    r.width = 1, r.height = 1;
    let s4 = r.getContext("2d", { willReadFrequently: true });
    s4 && (n10 = s4, n10.globalCompositeOperation = "copy", i = n10.createLinearGradient(0, 0, 1, 1));
  } catch {
  }
  function e(r) {
    if (r.match(/#[\da-f]{3,8}/i)) switch (r.length) {
      case 4:
        return J = parseInt(r.slice(1, 2).repeat(2), 16), Q = parseInt(r.slice(2, 3).repeat(2), 16), ee = parseInt(r.slice(3, 4).repeat(2), 16), O.toColor(J, Q, ee);
      case 5:
        return J = parseInt(r.slice(1, 2).repeat(2), 16), Q = parseInt(r.slice(2, 3).repeat(2), 16), ee = parseInt(r.slice(3, 4).repeat(2), 16), W = parseInt(r.slice(4, 5).repeat(2), 16), O.toColor(J, Q, ee, W);
      case 7:
        return { css: r, rgba: (parseInt(r.slice(1), 16) << 8 | 255) >>> 0 };
      case 9:
        return { css: r, rgba: parseInt(r.slice(1), 16) >>> 0 };
    }
    let s4 = r.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,\s*(0|1|\d?\.(\d+))\s*)?\)/);
    if (s4) return J = parseInt(s4[1], 10), Q = parseInt(s4[2], 10), ee = parseInt(s4[3], 10), W = Math.round((s4[5] === void 0 ? 1 : parseFloat(s4[5])) * 255), O.toColor(J, Q, ee, W);
    if (r === "transparent") return { css: "transparent", rgba: 0 };
    if (!n10 || !i) throw new Error("css.toColor: Unsupported css format");
    if (n10.fillStyle = i, n10.fillStyle = r, typeof n10.fillStyle != "string") throw new Error("css.toColor: Unsupported css format");
    if (n10.fillRect(0, 0, 1, 1), [J, Q, ee, W] = n10.getImageData(0, 0, 1, 1).data, W !== 255) throw new Error("css.toColor: Unsupported css format");
    return { rgba: O.toRgba(J, Q, ee, W), css: r };
  }
  t.toColor = e;
})(B ||= {});
var Z;
((e) => {
  function n10(t) {
    return i(t >> 16 & 255, t >> 8 & 255, t & 255);
  }
  e.relativeLuminance = n10;
  function i(t, r, s4) {
    let o3 = t / 255, a = r / 255, l3 = s4 / 255, h = o3 <= 0.03928 ? o3 / 12.92 : Math.pow((o3 + 0.055) / 1.055, 2.4), d = a <= 0.03928 ? a / 12.92 : Math.pow((a + 0.055) / 1.055, 2.4), c = l3 <= 0.03928 ? l3 / 12.92 : Math.pow((l3 + 0.055) / 1.055, 2.4);
    return h * 0.2126 + d * 0.7152 + c * 0.0722;
  }
  e.relativeLuminance2 = i;
})(Z ||= {});
var Oi;
((s4) => {
  function n10(o3, a) {
    if (W = (a & 255) / 255, W === 1) return a;
    let l3 = a >> 24 & 255, h = a >> 16 & 255, d = a >> 8 & 255, c = o3 >> 24 & 255, u = o3 >> 16 & 255, _ = o3 >> 8 & 255;
    return J = c + Math.round((l3 - c) * W), Q = u + Math.round((h - u) * W), ee = _ + Math.round((d - _) * W), O.toRgba(J, Q, ee);
  }
  s4.blend = n10;
  function i(o3, a, l3) {
    let h = Z.relativeLuminance(o3 >> 8), d = Z.relativeLuminance(a >> 8);
    if (Te(h, d) < l3) {
      if (d < h) {
        let p = e(o3, a, l3), v = Te(h, Z.relativeLuminance(p >> 8));
        if (v < l3) {
          let f2 = t(o3, a, l3), S = Te(h, Z.relativeLuminance(f2 >> 8));
          return v > S ? p : f2;
        }
        return p;
      }
      let u = t(o3, a, l3), _ = Te(h, Z.relativeLuminance(u >> 8));
      if (_ < l3) {
        let p = e(o3, a, l3), v = Te(h, Z.relativeLuminance(p >> 8));
        return _ > v ? u : p;
      }
      return u;
    }
  }
  s4.ensureContrastRatio = i;
  function e(o3, a, l3) {
    let h = o3 >> 24 & 255, d = o3 >> 16 & 255, c = o3 >> 8 & 255, u = a >> 24 & 255, _ = a >> 16 & 255, p = a >> 8 & 255, v = Te(Z.relativeLuminance2(u, _, p), Z.relativeLuminance2(h, d, c));
    for (; v < l3 && (u > 0 || _ > 0 || p > 0); ) u -= Math.max(0, Math.ceil(u * 0.1)), _ -= Math.max(0, Math.ceil(_ * 0.1)), p -= Math.max(0, Math.ceil(p * 0.1)), v = Te(Z.relativeLuminance2(u, _, p), Z.relativeLuminance2(h, d, c));
    return (u << 24 | _ << 16 | p << 8 | 255) >>> 0;
  }
  s4.reduceLuminance = e;
  function t(o3, a, l3) {
    let h = o3 >> 24 & 255, d = o3 >> 16 & 255, c = o3 >> 8 & 255, u = a >> 24 & 255, _ = a >> 16 & 255, p = a >> 8 & 255, v = Te(Z.relativeLuminance2(u, _, p), Z.relativeLuminance2(h, d, c));
    for (; v < l3 && (u < 255 || _ < 255 || p < 255); ) u = Math.min(255, u + Math.ceil((255 - u) * 0.1)), _ = Math.min(255, _ + Math.ceil((255 - _) * 0.1)), p = Math.min(255, p + Math.ceil((255 - p) * 0.1)), v = Te(Z.relativeLuminance2(u, _, p), Z.relativeLuminance2(h, d, c));
    return (u << 24 | _ << 16 | p << 8 | 255) >>> 0;
  }
  s4.increaseLuminance = t;
  function r(o3) {
    return [o3 >> 24 & 255, o3 >> 16 & 255, o3 >> 8 & 255, o3 & 255];
  }
  s4.toChannels = r;
})(Oi ||= {});
function Ve(n10) {
  let i = n10.toString(16);
  return i.length < 2 ? "0" + i : i;
}
function Te(n10, i) {
  return n10 < i ? (i + 0.05) / (n10 + 0.05) : (n10 + 0.05) / (i + 0.05);
}
var Ni = class extends ue {
  constructor(e, t, r) {
    super();
    this.content = 0;
    this.combinedData = "";
    this.fg = e.fg, this.bg = e.bg, this.combinedData = t, this._width = r;
  }
  isCombined() {
    return 2097152;
  }
  getWidth() {
    return this._width;
  }
  getChars() {
    return this.combinedData;
  }
  getCode() {
    return 2097151;
  }
  setFromCharData(e) {
    throw new Error("not implemented");
  }
  getAsCharData() {
    return [this.fg, this.getChars(), this.getWidth(), this.getCode()];
  }
};
var He = class {
  constructor(i) {
    this._bufferService = i;
    this._characterJoiners = [];
    this._nextCharacterJoinerId = 0;
    this._workCell = new F();
  }
  register(i) {
    let e = { id: this._nextCharacterJoinerId++, handler: i };
    return this._characterJoiners.push(e), e.id;
  }
  deregister(i) {
    for (let e = 0; e < this._characterJoiners.length; e++) if (this._characterJoiners[e].id === i) return this._characterJoiners.splice(e, 1), true;
    return false;
  }
  getJoinedCharacters(i) {
    if (this._characterJoiners.length === 0) return [];
    let e = this._bufferService.buffer.lines.get(i);
    if (!e || e.length === 0) return [];
    let t = [], r = e.translateToString(true), s4 = e.getTrimmedLength(), o3 = 0, a = 0, l3 = 0, h = e.getFg(0), d = e.getBg(0);
    for (let c = 0; c < s4; c++) if (e.loadCell(c, this._workCell), this._workCell.getWidth() !== 0) {
      if (this._workCell.fg !== h || this._workCell.bg !== d) {
        if (c - o3 > 1) {
          let u = this._getJoinedRanges(r, l3, a, e, o3);
          for (let _ = 0; _ < u.length; _++) t.push(u[_]);
        }
        o3 = c, l3 = a, h = this._workCell.fg, d = this._workCell.bg;
      }
      a += this._workCell.getChars().length || " ".length;
    }
    if (s4 - o3 > 1) {
      let c = this._getJoinedRanges(r, l3, a, e, o3);
      for (let u = 0; u < c.length; u++) t.push(c[u]);
    }
    return t;
  }
  _getJoinedRanges(i, e, t, r, s4) {
    let o3 = i.substring(e, t), a = [];
    try {
      a = this._characterJoiners[0].handler(o3);
    } catch (l3) {
      console.error(l3);
    }
    for (let l3 = 1; l3 < this._characterJoiners.length; l3++) try {
      let h = this._characterJoiners[l3].handler(o3);
      for (let d = 0; d < h.length; d++) He._mergeRanges(a, h[d]);
    } catch (h) {
      console.error(h);
    }
    return this._stringRangesToCellRanges(a, r, s4), a;
  }
  _stringRangesToCellRanges(i, e, t) {
    let r = 0, s4 = false, o3 = 0, a = i[r];
    if (!a) return;
    let l3 = e.getTrimmedLength();
    for (let h = t; h < l3; h++) {
      let d = e.getWidth(h), c = e.getString(h).length || " ".length;
      if (d !== 0) {
        if (!s4 && a[0] <= o3 && (a[0] = h, s4 = true), a[1] <= o3) {
          if (a[1] = h, a = i[++r], !a) break;
          a[0] <= o3 ? (a[0] = h, s4 = true) : s4 = false;
        }
        o3 += c;
      }
    }
    a && (a[1] = l3);
  }
  static _mergeRanges(i, e) {
    let t = false;
    for (let r = 0; r < i.length; r++) {
      let s4 = i[r];
      if (t) {
        if (e[1] <= s4[0]) return i[r - 1][1] = e[1], i;
        if (e[1] <= s4[1]) return i[r - 1][1] = Math.max(e[1], s4[1]), i.splice(r, 1), i;
        i.splice(r, 1), r--;
      } else {
        if (e[1] <= s4[0]) return i.splice(r, 0, e), i;
        if (e[1] <= s4[1]) return s4[0] = Math.min(e[0], s4[0]), i;
        e[0] < s4[1] && (s4[0] = Math.min(e[0], s4[0]), t = true);
        continue;
      }
    }
    return t ? i[i.length - 1][1] = e[1] : i.push(e), i;
  }
};
He = y([m(0, D)], He);
function is(n10) {
  if (!n10) throw new Error("value must not be falsy");
  return n10;
}
function Yn(n10) {
  return 57508 <= n10 && n10 <= 57558;
}
function jn(n10) {
  return 9472 <= n10 && n10 <= 9631;
}
function js(n10) {
  return Yn(n10) || jn(n10);
}
function Zs() {
  return { css: { canvas: Fi(), cell: Fi() }, device: { canvas: Fi(), cell: Fi(), char: { width: 0, height: 0, left: 0, top: 0 } } };
}
function Fi() {
  return { width: 0, height: 0 };
}
var _t = class {
  constructor(i, e, t, r, s4, o3, a) {
    this._document = i;
    this._characterJoinerService = e;
    this._optionsService = t;
    this._coreBrowserService = r;
    this._coreService = s4;
    this._decorationService = o3;
    this._themeService = a;
    this._workCell = new F();
    this._columnSelectMode = false;
    this.defaultSpacing = 0;
  }
  handleSelectionChanged(i, e, t) {
    this._selectionStart = i, this._selectionEnd = e, this._columnSelectMode = t;
  }
  createRow(i, e, t, r, s4, o3, a, l3, h, d, c, u, _) {
    let p = [];
    _ && (_.hasBlinkingCells = false);
    let v = this._characterJoinerService.getJoinedCharacters(e), f2 = this._themeService.colors, S = i.getNoBgTrimmedLength();
    t && S < o3 + 1 && (S = o3 + 1);
    let I, w2 = 0, L = "", T2, te2 = 0, Ds = 0, Rs = 0, Ls = false, As = 0, ui = false, Ot, ks = 0, N2 = [], An = c !== -1 && u !== -1;
    for (let ae2 = 0; ae2 < S; ae2++) {
      i.loadCell(ae2, this._workCell);
      let Rr = this._workCell.getWidth();
      if (Rr === 0) continue;
      let fi = false, je2 = ae2 >= ks, Lr = ae2, x2 = this._workCell;
      if (v.length > 0 && ae2 === v[0][0] && je2) {
        let A = v.shift(), Pr = this._isCellInSelection(A[0], e);
        for (T2 = A[0] + 1; T2 < A[1]; T2++) je2 &&= Pr === this._isCellInSelection(T2, e);
        je2 &&= !t || o3 < A[0] || o3 >= A[1], je2 ? (fi = true, x2 = new Ni(this._workCell, i.translateToString(true, A[0], A[1]), A[1] - A[0]), Lr = A[1] - 1, Rr = x2.getWidth()) : ks = A[1];
      }
      let Nt = this._isCellInSelection(ae2, e), Ar = t && ae2 === o3, kr = An && ae2 >= c && ae2 <= u;
      _ && x2.isBlink() && (_.hasBlinkingCells = true), !l3 && x2.isBlink() && N2.push("xterm-blink-hidden");
      let Mr = false;
      this._decorationService.forEachDecorationAtCell(ae2, e, void 0, (A) => {
        Mr = true;
      });
      let _i = x2.getChars() || " ";
      if (_i === " " && (x2.isUnderline() || x2.isOverline()) && (_i = "\xA0"), Ot = Rr * h - d.get(_i, x2.isBold(), x2.isItalic()), !I) I = this._document.createElement("span");
      else if (w2 && (Nt && ui || !Nt && !ui && x2.bg === te2) && (Nt && ui && f2.selectionForeground || x2.fg === Ds) && x2.extended.ext === Rs && kr === Ls && Ot === As && !Ar && !fi && !Mr && je2) {
        x2.isInvisible() ? L += " " : L += _i, w2++;
        continue;
      } else w2 && (I.textContent = L), I = this._document.createElement("span"), w2 = 0, L = "";
      if (te2 = x2.bg, Ds = x2.fg, Rs = x2.extended.ext, Ls = kr, As = Ot, ui = Nt, fi && o3 >= ae2 && o3 <= Lr && (o3 = ae2), !this._coreService.isCursorHidden && Ar && this._coreService.isCursorInitialized) {
        if (N2.push("xterm-cursor"), this._coreBrowserService.isFocused) a && N2.push("xterm-cursor-blink"), N2.push(r === "bar" ? "xterm-cursor-bar" : r === "underline" ? "xterm-cursor-underline" : "xterm-cursor-block");
        else if (s4) switch (s4) {
          case "outline":
            N2.push("xterm-cursor-outline");
            break;
          case "block":
            N2.push("xterm-cursor-block");
            break;
          case "bar":
            N2.push("xterm-cursor-bar");
            break;
          case "underline":
            N2.push("xterm-cursor-underline");
            break;
          default:
            break;
        }
      }
      if (x2.isBold() && N2.push("xterm-bold"), x2.isItalic() && N2.push("xterm-italic"), x2.isDim() && N2.push("xterm-dim"), x2.isInvisible() ? L = " " : L = x2.getChars() || " ", x2.isUnderline() && (N2.push(`xterm-underline-${x2.extended.underlineStyle}`), L === " " && (L = "\xA0"), !x2.isUnderlineColorDefault())) if (x2.isUnderlineColorRGB()) I.style.textDecorationColor = `rgb(${ue.toColorRGB(x2.getUnderlineColor()).join(",")})`;
      else {
        let A = x2.getUnderlineColor();
        this._optionsService.rawOptions.drawBoldTextInBrightColors && x2.isBold() && A < 8 && (A += 8), I.style.textDecorationColor = f2.ansi[A].css;
      }
      x2.isOverline() && (N2.push("xterm-overline"), L === " " && (L = "\xA0")), x2.isStrikethrough() && N2.push("xterm-strikethrough"), kr && (I.style.textDecoration = "underline");
      let de = x2.getFgColor(), Ft = x2.getFgColorMode(), Se2 = x2.getBgColor(), Ht = x2.getBgColorMode(), Br = !!x2.isInverse();
      if (Br) {
        let A = de;
        de = Se2, Se2 = A;
        let Pr = Ft;
        Ft = Ht, Ht = Pr;
      }
      let Le, pi, Wt = false;
      this._decorationService.forEachDecorationAtCell(ae2, e, void 0, (A) => {
        A.options.layer !== "top" && Wt || (A.backgroundColorRGB && (Ht = 50331648, Se2 = A.backgroundColorRGB.rgba >> 8 & 16777215, Le = A.backgroundColorRGB), A.foregroundColorRGB && (Ft = 50331648, de = A.foregroundColorRGB.rgba >> 8 & 16777215, pi = A.foregroundColorRGB), Wt = A.options.layer === "top");
      }), !Wt && Nt && (Le = this._coreBrowserService.isFocused ? f2.selectionBackgroundOpaque : f2.selectionInactiveBackgroundOpaque, Se2 = Le.rgba >> 8 & 16777215, Ht = 50331648, Wt = true, f2.selectionForeground && (Ft = 50331648, de = f2.selectionForeground.rgba >> 8 & 16777215, pi = f2.selectionForeground)), Wt && N2.push("xterm-decoration-top");
      let Ae;
      switch (Ht) {
        case 16777216:
        case 33554432:
          Ae = f2.ansi[Se2], N2.push(`xterm-bg-${Se2}`);
          break;
        case 50331648:
          Ae = O.toColor(Se2 >> 16, Se2 >> 8 & 255, Se2 & 255), this._addStyle(I, `background-color:#${(Se2 >>> 0).toString(16).padStart(6, "0")}`);
          break;
        case 0:
        default:
          Br ? (Ae = f2.foreground, N2.push(`xterm-bg-${257}`)) : Ae = f2.background;
      }
      switch (Le || x2.isDim() && (Le = k.multiplyOpacity(Ae, 0.5)), Ft) {
        case 16777216:
        case 33554432:
          x2.isBold() && de < 8 && this._optionsService.rawOptions.drawBoldTextInBrightColors && (de += 8), this._applyMinimumContrast(I, Ae, f2.ansi[de], x2, Le, void 0) || N2.push(`xterm-fg-${de}`);
          break;
        case 50331648:
          let A = O.toColor(de >> 16 & 255, de >> 8 & 255, de & 255);
          this._applyMinimumContrast(I, Ae, A, x2, Le, pi) || this._addStyle(I, `color:#${de.toString(16).padStart(6, "0")}`);
          break;
        case 0:
        default:
          this._applyMinimumContrast(I, Ae, f2.foreground, x2, Le, pi) || Br && N2.push(`xterm-fg-${257}`);
      }
      N2.length && (I.className = N2.join(" "), N2.length = 0), !Ar && !fi && !Mr && je2 ? w2++ : I.textContent = L, Ot !== this.defaultSpacing && (I.style.letterSpacing = `${Ot}px`), p.push(I), ae2 = Lr;
    }
    return I && w2 && (I.textContent = L), p;
  }
  _applyMinimumContrast(i, e, t, r, s4, o3) {
    if (this._optionsService.rawOptions.minimumContrastRatio === 1 || js(r.getCode())) return false;
    let a = this._getContrastCache(r), l3;
    if (!s4 && !o3 && (l3 = a.getColor(e.rgba, t.rgba)), l3 === void 0) {
      let h = this._optionsService.rawOptions.minimumContrastRatio / (r.isDim() ? 2 : 1);
      l3 = k.ensureContrastRatio(s4 ?? e, o3 ?? t, h), a.setColor((s4 ?? e).rgba, (o3 ?? t).rgba, l3 ?? null);
    }
    return l3 ? (this._addStyle(i, `color:${l3.css}`), true) : false;
  }
  _getContrastCache(i) {
    return i.isDim() ? this._themeService.colors.halfContrastCache : this._themeService.colors.contrastCache;
  }
  _addStyle(i, e) {
    i.setAttribute("style", `${i.getAttribute("style") || ""}${e};`);
  }
  _isCellInSelection(i, e) {
    let t = this._selectionStart, r = this._selectionEnd;
    return !t || !r ? false : this._columnSelectMode ? t[0] <= r[0] ? i >= t[0] && e >= t[1] && i < r[0] && e <= r[1] : i < t[0] && e >= t[1] && i >= r[0] && e <= r[1] : e > t[1] && e < r[1] || t[1] === r[1] && e === t[1] && i >= t[0] && i < r[0] || t[1] < r[1] && e === r[1] && i < r[0] || t[1] < r[1] && e === t[1] && i >= t[0];
  }
};
_t = y([m(1, gi), m(2, R), m(3, G), m(4, Y), m(5, ge), m(6, _e)], _t);
var Hi = class {
  constructor(i = () => new rs()) {
    this._flat = new Float32Array(256);
    this._font = "";
    this._fontSize = 0;
    this._weight = "normal";
    this._weightBold = "bold";
    this._canvasElements = [];
    this._canvasElements = [i(), i(), i(), i()], this.clear();
  }
  dispose() {
    this._canvasElements.length = 0, this._holey = void 0;
  }
  clear() {
    this._flat.fill(-9999), this._holey = /* @__PURE__ */ new Map();
  }
  setFont(i, e, t, r) {
    i === this._font && e === this._fontSize && t === this._weight && r === this._weightBold || (this._font = i, this._fontSize = e, this._weight = t, this._weightBold = r, this._canvasElements[0].setFont(i, e, t, false), this._canvasElements[1].setFont(i, e, r, false), this._canvasElements[2].setFont(i, e, t, true), this._canvasElements[3].setFont(i, e, r, true), this.clear());
  }
  get(i, e, t) {
    let r;
    if (!e && !t && i.length === 1 && (r = i.charCodeAt(0)) < 256) {
      if (this._flat[r] !== -9999) return this._flat[r];
      let a = this._measure(i, 0);
      return a > 0 && (this._flat[r] = a), a;
    }
    let s4 = i;
    e && (s4 += "B"), t && (s4 += "I");
    let o3 = this._holey.get(s4);
    if (o3 === void 0) {
      let a = 0;
      e && (a |= 1), t && (a |= 2), o3 = this._measure(i, a), o3 > 0 && this._holey.set(s4, o3);
    }
    return o3;
  }
  _measure(i, e) {
    return this._canvasElements[e].measure(i);
  }
};
var rs = class {
  constructor() {
    typeof OffscreenCanvas < "u" ? (this._canvas = new OffscreenCanvas(1, 1), this._ctx = is(this._canvas.getContext("2d"))) : (this._canvas = document.createElement("canvas"), this._canvas.width = 1, this._canvas.height = 1, this._ctx = is(this._canvas.getContext("2d")));
  }
  setFont(i, e, t, r) {
    let s4 = r ? "italic" : "";
    this._ctx.font = `${s4} ${t} ${e}px ${i}`.trim();
  }
  measure(i) {
    return this._ctx.measureText(i).width;
  }
};
var ss = class {
  constructor() {
    this.clear();
  }
  clear() {
    this.hasSelection = false, this.columnSelectMode = false, this.viewportStartRow = 0, this.viewportEndRow = 0, this.viewportCappedStartRow = 0, this.viewportCappedEndRow = 0, this.startCol = 0, this.endCol = 0, this.selectionStart = void 0, this.selectionEnd = void 0;
  }
  update(i, e, t, r = false) {
    if (this.selectionStart = e, this.selectionEnd = t, !e || !t || e[0] === t[0] && e[1] === t[1]) {
      this.clear();
      return;
    }
    let s4 = i.buffers.active.ydisp, o3 = e[1] - s4, a = t[1] - s4, l3 = Math.max(o3, 0), h = Math.min(a, i.rows - 1);
    if (l3 >= i.rows || h < 0) {
      this.clear();
      return;
    }
    this.hasSelection = true, this.columnSelectMode = r, this.viewportStartRow = o3, this.viewportEndRow = a, this.viewportCappedStartRow = l3, this.viewportCappedEndRow = h, this.startCol = e[0], this.endCol = t[0];
  }
  isCellSelected(i, e, t) {
    return this.hasSelection ? (t -= i.buffer.active.viewportY, this.columnSelectMode ? this.startCol <= this.endCol ? e >= this.startCol && t >= this.viewportCappedStartRow && e < this.endCol && t <= this.viewportCappedEndRow : e < this.startCol && t >= this.viewportCappedStartRow && e >= this.endCol && t <= this.viewportCappedEndRow : t > this.viewportStartRow && t < this.viewportEndRow || this.viewportStartRow === this.viewportEndRow && t === this.viewportStartRow && e >= this.startCol && e < this.endCol || this.viewportStartRow < this.viewportEndRow && t === this.viewportEndRow && e < this.endCol || this.viewportStartRow < this.viewportEndRow && t === this.viewportStartRow && e >= this.startCol) : false;
  }
};
function Js() {
  return new ss();
}
var Wi = class extends g {
  constructor(e, t, r) {
    super();
    this._renderCallback = e;
    this._coreBrowserService = t;
    this._optionsService = r;
    this._intervalDuration = 0;
    this._blinkOn = true;
    this._needsBlinkInViewport = false;
    this._isViewportVisible = true;
    this._register(this._optionsService.onSpecificOptionChange("blinkIntervalDuration", (s4) => {
      this.setIntervalDuration(s4);
    })), this.setIntervalDuration(this._optionsService.rawOptions.blinkIntervalDuration), this._register(E(() => this._clearInterval()));
  }
  get isBlinkOn() {
    return this._blinkOn;
  }
  get isEnabled() {
    return this._intervalDuration > 0;
  }
  setNeedsBlinkInViewport(e) {
    this._needsBlinkInViewport !== e && (this._needsBlinkInViewport = e, this._updateIntervalState());
  }
  setViewportVisible(e) {
    this._isViewportVisible !== e && (this._isViewportVisible = e, this._updateIntervalState());
  }
  setIntervalDuration(e) {
    e !== this._intervalDuration && (this._intervalDuration = e, this._clearInterval(), this._updateIntervalState());
  }
  _updateIntervalState() {
    if (this._intervalDuration > 0 && this._needsBlinkInViewport && this._isViewportVisible) {
      if (this._interval !== void 0) return;
      let t = this._blinkOn;
      this._blinkOn = true, this._interval = this._coreBrowserService.window.setInterval(() => {
        this._blinkOn = !this._blinkOn, this._renderCallback();
      }, this._intervalDuration), t || this._renderCallback();
      return;
    }
    this._clearInterval(), this._blinkOn || (this._blinkOn = true, this._renderCallback());
  }
  _clearInterval() {
    this._interval !== void 0 && (this._coreBrowserService.window.clearInterval(this._interval), this._interval = void 0);
  }
};
var Zn = 1;
var mt = class extends g {
  constructor(e, t, r, s4, o3, a, l3, h, d, c, u, _, p, v) {
    super();
    this._terminal = e;
    this._document = t;
    this._element = r;
    this._screenElement = s4;
    this._viewportElement = o3;
    this._helperContainer = a;
    this._linkifier2 = l3;
    this._charSizeService = d;
    this._optionsService = c;
    this._bufferService = u;
    this._coreService = _;
    this._coreBrowserService = p;
    this._themeService = v;
    this._terminalClass = Zn++;
    this._rowElements = [];
    this._selectionRenderModel = Js();
    this._lastSelectionColumnMode = false;
    this._rowHasBlinkingCells = [];
    this._rowHasBlinkingCellsCount = 0;
    this._onRequestRedraw = this._register(new b());
    this.onRequestRedraw = this._onRequestRedraw.event;
    this._rowContainer = this._document.createElement("div"), this._rowContainer.classList.add("xterm-rows"), this._rowContainer.style.lineHeight = "normal", this._rowContainer.setAttribute("aria-hidden", "true"), this._refreshRowElements(this._bufferService.cols, this._bufferService.rows), this._selectionContainer = this._document.createElement("div"), this._selectionContainer.classList.add("xterm-selection"), this._selectionContainer.setAttribute("aria-hidden", "true"), this.dimensions = Zs(), this._updateDimensions(), this._register(this._optionsService.onOptionChange(() => this._handleOptionsChanged())), this._register(this._themeService.onChangeColors((f2) => this._injectCss(f2))), this._injectCss(this._themeService.colors), this._rowFactory = h.createInstance(_t, document), this._element.classList.add("xterm-dom-renderer-owner-" + this._terminalClass), this._screenElement.appendChild(this._rowContainer), this._screenElement.appendChild(this._selectionContainer), this._register(this._linkifier2.onShowLinkUnderline((f2) => this._handleLinkHover(f2))), this._register(this._linkifier2.onHideLinkUnderline((f2) => this._handleLinkLeave(f2))), this._cursorBlinkStateManager = new ns(this._rowContainer, this._coreBrowserService), this._register(C(this._document, "mousedown", () => this._cursorBlinkStateManager.restartBlinkAnimation())), this._register(E(() => this._cursorBlinkStateManager.dispose())), this._textBlinkStateManager = this._register(new Wi(() => this._onRequestRedraw.fire({ start: 0, end: this._bufferService.rows - 1 }), this._coreBrowserService, this._optionsService)), this._register(E(() => {
      this._element.classList.remove("xterm-dom-renderer-owner-" + this._terminalClass), this._rowContainer.remove(), this._selectionContainer.remove(), this._widthCache.dispose(), this._themeStyleElement.remove(), this._dimensionsStyleElement.remove();
    })), this._widthCache = new Hi(), this._widthCache.setFont(this._optionsService.rawOptions.fontFamily, this._optionsService.rawOptions.fontSize, this._optionsService.rawOptions.fontWeight, this._optionsService.rawOptions.fontWeightBold), this._setDefaultSpacing();
  }
  _updateDimensions() {
    let e = this._coreBrowserService.dpr;
    this.dimensions.device.char.width = this._charSizeService.width * e, this.dimensions.device.char.height = Math.ceil(this._charSizeService.height * e), this.dimensions.device.cell.width = this.dimensions.device.char.width + Math.round(this._optionsService.rawOptions.letterSpacing), this.dimensions.device.cell.height = Math.floor(this.dimensions.device.char.height * this._optionsService.rawOptions.lineHeight), this.dimensions.device.char.left = 0, this.dimensions.device.char.top = 0, this.dimensions.device.canvas.width = this.dimensions.device.cell.width * this._bufferService.cols, this.dimensions.device.canvas.height = this.dimensions.device.cell.height * this._bufferService.rows, this.dimensions.css.canvas.width = Math.round(this.dimensions.device.canvas.width / e), this.dimensions.css.canvas.height = Math.round(this.dimensions.device.canvas.height / e), this.dimensions.css.cell.width = this.dimensions.css.canvas.width / this._bufferService.cols, this.dimensions.css.cell.height = this.dimensions.css.canvas.height / this._bufferService.rows;
    for (let r of this._rowElements) r.style.width = `${this.dimensions.css.canvas.width}px`, r.style.height = `${this.dimensions.css.cell.height}px`, r.style.lineHeight = `${this.dimensions.css.cell.height}px`, r.style.overflow = "hidden";
    this._dimensionsStyleElement || (this._dimensionsStyleElement = this._document.createElement("style"), this._screenElement.appendChild(this._dimensionsStyleElement));
    let t = `${this._terminalSelector} .xterm-rows span { display: inline-block; height: 100%; vertical-align: top;}`;
    this._dimensionsStyleElement.textContent = t, this._selectionContainer.style.height = this._viewportElement.style.height, this._screenElement.style.width = `${this.dimensions.css.canvas.width}px`, this._screenElement.style.height = `${this.dimensions.css.canvas.height}px`;
  }
  _injectCss(e) {
    this._themeStyleElement || (this._themeStyleElement = this._document.createElement("style"), this._screenElement.appendChild(this._themeStyleElement));
    let t = `${this._terminalSelector} .xterm-rows { pointer-events: none; color: ${e.foreground.css};}`;
    t += `${this._terminalSelector} .xterm-rows, ${this._terminalSelector} .xterm-rows span { font-family: ${this._optionsService.rawOptions.fontFamily}; font-size: ${this._optionsService.rawOptions.fontSize}px; font-kerning: none; white-space: pre}`, t += `${this._terminalSelector} .xterm-rows .xterm-dim { color: ${k.multiplyOpacity(e.foreground, 0.5).css};}`, t += `${this._terminalSelector} span:not(.xterm-bold) { font-weight: ${this._optionsService.rawOptions.fontWeight};}${this._terminalSelector} span.xterm-bold { font-weight: ${this._optionsService.rawOptions.fontWeightBold};}${this._terminalSelector} span.xterm-italic { font-style: italic;}${this._terminalSelector} span.xterm-blink-hidden { visibility: hidden;}`;
    let r = `blink_underline_${this._terminalClass}`, s4 = `blink_bar_${this._terminalClass}`, o3 = `blink_block_${this._terminalClass}`;
    t += `@keyframes ${r} { 50% {  border-bottom-style: hidden; }}`, t += `@keyframes ${s4} { 50% {  box-shadow: none; }}`, t += `@keyframes ${o3} { 0% {  background-color: ${e.cursor.css};  color: ${e.cursorAccent.css}; } 50% {  background-color: inherit;  color: ${e.cursor.css}; }}`, t += `${this._terminalSelector} .xterm-rows.xterm-focus .xterm-cursor.xterm-cursor-blink.xterm-cursor-underline { animation: ${r} 1s step-end infinite;}${this._terminalSelector} .xterm-rows.xterm-focus .xterm-cursor.xterm-cursor-blink.xterm-cursor-bar { animation: ${s4} 1s step-end infinite;}${this._terminalSelector} .xterm-rows.xterm-focus .xterm-cursor.xterm-cursor-blink.xterm-cursor-block { animation: ${o3} 1s step-end infinite;}${this._terminalSelector} .xterm-rows.xterm-cursor-blink-idle .xterm-cursor.xterm-cursor-blink { animation: none !important;}${this._terminalSelector} .xterm-rows .xterm-cursor.xterm-cursor-block { background-color: ${e.cursor.css}; color: ${e.cursorAccent.css};}${this._terminalSelector} .xterm-rows .xterm-cursor.xterm-cursor-block:not(.xterm-cursor-blink) { background-color: ${e.cursor.css} !important; color: ${e.cursorAccent.css} !important;}${this._terminalSelector} .xterm-rows .xterm-cursor.xterm-cursor-outline { outline: 1px solid ${e.cursor.css}; outline-offset: -1px;}${this._terminalSelector} .xterm-rows .xterm-cursor.xterm-cursor-bar { box-shadow: ${this._optionsService.rawOptions.cursorWidth}px 0 0 ${e.cursor.css} inset;}${this._terminalSelector} .xterm-rows .xterm-cursor.xterm-cursor-underline { border-bottom: 1px ${e.cursor.css}; border-bottom-style: solid; height: calc(100% - 1px);}`, t += `${this._terminalSelector} .xterm-selection { position: absolute; top: 0; left: 0; z-index: 1; pointer-events: none;}${this._terminalSelector}.focus .xterm-selection div { position: absolute; background-color: ${e.selectionBackgroundOpaque.css};}${this._terminalSelector} .xterm-selection div { position: absolute; background-color: ${e.selectionInactiveBackgroundOpaque.css};}`;
    for (let [a, l3] of e.ansi.entries()) t += `${this._terminalSelector} .xterm-fg-${a} { color: ${l3.css}; }${this._terminalSelector} .xterm-fg-${a}.xterm-dim { color: ${k.multiplyOpacity(l3, 0.5).css}; }${this._terminalSelector} .xterm-bg-${a} { background-color: ${l3.css}; }`;
    t += `${this._terminalSelector} .xterm-fg-${257} { color: ${k.opaque(e.background).css}; }${this._terminalSelector} .xterm-fg-${257}.xterm-dim { color: ${k.multiplyOpacity(k.opaque(e.background), 0.5).css}; }${this._terminalSelector} .xterm-bg-${257} { background-color: ${e.foreground.css}; }`, this._themeStyleElement.textContent = t;
  }
  _setDefaultSpacing() {
    let e = this.dimensions.css.cell.width - this._widthCache.get("W", false, false);
    this._rowContainer.style.letterSpacing = `${e}px`, this._rowFactory.defaultSpacing = e;
  }
  handleDevicePixelRatioChange() {
    this._updateDimensions(), this._widthCache.clear(), this._setDefaultSpacing();
  }
  _refreshRowElements(e, t) {
    for (let r = this._rowElements.length; r <= t; r++) {
      let s4 = this._document.createElement("div");
      this._rowContainer.appendChild(s4), this._rowElements.push(s4), this._rowHasBlinkingCells.push(false);
    }
    for (; this._rowElements.length > t; ) this._rowContainer.removeChild(this._rowElements.pop()), this._rowHasBlinkingCells.pop() && this._rowHasBlinkingCellsCount--;
  }
  handleResize(e, t) {
    this._refreshRowElements(e, t), this._updateDimensions(), this.handleSelectionChanged(this._selectionRenderModel.selectionStart, this._selectionRenderModel.selectionEnd, this._selectionRenderModel.columnSelectMode);
  }
  handleCharSizeChanged() {
    this._updateDimensions(), this._widthCache.clear(), this._setDefaultSpacing();
  }
  handleBlur() {
    this._rowContainer.classList.remove("xterm-focus"), this._cursorBlinkStateManager.pause(), this.renderRows(0, this._bufferService.rows - 1);
  }
  handleFocus() {
    this._rowContainer.classList.add("xterm-focus"), this._cursorBlinkStateManager.resume(), this.renderRows(this._bufferService.buffer.y, this._bufferService.buffer.y);
  }
  handleViewportVisibilityChange(e) {
    this._textBlinkStateManager.setViewportVisible(e);
  }
  handleSelectionChanged(e, t, r) {
    let s4 = this._bufferService.rows;
    this._selectionContainer.replaceChildren(), this._rowFactory.handleSelectionChanged(e, t, r);
    let o3 = 0, a = -1;
    this._lastSelectionStart && this._lastSelectionEnd && (this._selectionRenderModel.update(this._terminal, this._lastSelectionStart, this._lastSelectionEnd, this._lastSelectionColumnMode), this._selectionRenderModel.hasSelection && (o3 = this._selectionRenderModel.viewportCappedStartRow, a = this._selectionRenderModel.viewportCappedEndRow));
    let l3 = 0, h = -1;
    if (!e || !t) return;
    if (this._selectionRenderModel.update(this._terminal, e, t, r), this._selectionRenderModel.hasSelection) {
      let u = this._selectionRenderModel.viewportStartRow, _ = this._selectionRenderModel.viewportEndRow, p = this._selectionRenderModel.viewportCappedStartRow, v = this._selectionRenderModel.viewportCappedEndRow;
      l3 = p, h = v;
      let f2 = this._document.createDocumentFragment();
      if (r) {
        let S = e[0] > t[0];
        f2.appendChild(this._createSelectionElement(p, S ? t[0] : e[0], S ? e[0] : t[0], v - p + 1));
      } else {
        let S = u === p ? e[0] : 0, I = p === _ ? t[0] : this._bufferService.cols;
        f2.appendChild(this._createSelectionElement(p, S, I));
        let w2 = v - p - 1;
        if (f2.appendChild(this._createSelectionElement(p + 1, 0, this._bufferService.cols, w2)), p !== v) {
          let L = _ === v ? t[0] : this._bufferService.cols;
          f2.appendChild(this._createSelectionElement(v, 0, L));
        }
      }
      this._selectionContainer.appendChild(f2);
    }
    let d = Math.min(o3, l3), c = Math.max(a, h);
    if (c >= 0) {
      d = Math.max(d, 0), c = Math.min(c, s4 - 1);
      let _ = this._bufferService.buffer.y;
      this._selectionRenderModel.hasSelection && _ >= 0 && _ < s4 && (d = Math.min(d, _), c = Math.max(c, _)), this.renderRows(d, c);
    }
    this._lastSelectionStart = e, this._lastSelectionEnd = t, this._lastSelectionColumnMode = r;
  }
  _createSelectionElement(e, t, r, s4 = 1) {
    let o3 = this._document.createElement("div"), a = t * this.dimensions.css.cell.width, l3 = this.dimensions.css.cell.width * (r - t);
    return a + l3 > this.dimensions.css.canvas.width && (l3 = this.dimensions.css.canvas.width - a), o3.style.height = `${s4 * this.dimensions.css.cell.height}px`, o3.style.top = `${e * this.dimensions.css.cell.height}px`, o3.style.left = `${a}px`, o3.style.width = `${l3}px`, o3;
  }
  handleCursorMove() {
    this._cursorBlinkStateManager.restartBlinkAnimation();
  }
  _handleOptionsChanged() {
    this._updateDimensions(), this._injectCss(this._themeService.colors), this._widthCache.setFont(this._optionsService.rawOptions.fontFamily, this._optionsService.rawOptions.fontSize, this._optionsService.rawOptions.fontWeight, this._optionsService.rawOptions.fontWeightBold), this._setDefaultSpacing();
  }
  clear() {
    for (let e of this._rowElements) e.replaceChildren();
    this._rowHasBlinkingCellsCount > 0 && (this._rowHasBlinkingCells.fill(false), this._rowHasBlinkingCellsCount = 0, this._textBlinkStateManager.setNeedsBlinkInViewport(false));
  }
  renderRows(e, t) {
    let r = this._bufferService.buffer, s4 = r.ybase + r.y, o3 = Math.min(r.x, this._bufferService.cols - 1), a = this._coreService.decPrivateModes.cursorBlink ?? this._optionsService.rawOptions.cursorBlink, l3 = this._coreService.decPrivateModes.cursorStyle ?? this._optionsService.rawOptions.cursorStyle, h = this._optionsService.rawOptions.cursorInactiveStyle, d = { hasBlinkingCells: false };
    for (let c = e; c <= t; c++) {
      let u = c + r.ydisp, _ = this._rowElements[c];
      if (!_) continue;
      let p = r.lines.get(u);
      if (!p) {
        _.replaceChildren(), this._setRowBlinkState(c, false);
        continue;
      }
      _.replaceChildren(...this._rowFactory.createRow(p, u, u === s4, l3, h, o3, a, this._textBlinkStateManager.isBlinkOn, this.dimensions.css.cell.width, this._widthCache, -1, -1, d)), this._setRowBlinkState(c, d.hasBlinkingCells);
    }
    this._updateTextBlinkState();
  }
  get _terminalSelector() {
    return `.xterm-dom-renderer-owner-${this._terminalClass}`;
  }
  _handleLinkHover(e) {
    this._setCellUnderline(e.x1, e.x2, e.y1, e.y2, e.cols, true);
  }
  _handleLinkLeave(e) {
    this._setCellUnderline(e.x1, e.x2, e.y1, e.y2, e.cols, false);
  }
  _setCellUnderline(e, t, r, s4, o3, a) {
    r < 0 && (e = 0), s4 < 0 && (t = 0);
    let l3 = this._bufferService.rows - 1;
    r = Math.max(Math.min(r, l3), 0), s4 = Math.max(Math.min(s4, l3), 0), o3 = Math.min(o3, this._bufferService.cols);
    let h = this._bufferService.buffer, d = h.ybase + h.y, c = Math.min(h.x, o3 - 1), u = this._optionsService.rawOptions.cursorBlink, _ = this._optionsService.rawOptions.cursorStyle, p = this._optionsService.rawOptions.cursorInactiveStyle, v = { hasBlinkingCells: false };
    for (let f2 = r; f2 <= s4; ++f2) {
      let S = f2 + h.ydisp, I = this._rowElements[f2];
      if (!I) continue;
      let w2 = h.lines.get(S);
      if (!w2) {
        I.replaceChildren(), this._setRowBlinkState(f2, false);
        continue;
      }
      I.replaceChildren(...this._rowFactory.createRow(w2, S, S === d, _, p, c, u, this._textBlinkStateManager.isBlinkOn, this.dimensions.css.cell.width, this._widthCache, a ? f2 === r ? e : 0 : -1, a ? (f2 === s4 ? t : o3) - 1 : -1, v)), this._setRowBlinkState(f2, v.hasBlinkingCells);
    }
    this._updateTextBlinkState();
  }
  _setRowBlinkState(e, t) {
    this._rowHasBlinkingCells[e] !== t && (this._rowHasBlinkingCells[e] = t, this._rowHasBlinkingCellsCount += t ? 1 : -1);
  }
  _updateTextBlinkState() {
    this._textBlinkStateManager.setNeedsBlinkInViewport(this._rowHasBlinkingCellsCount > 0);
  }
};
mt = y([m(7, Qe), m(8, Be), m(9, R), m(10, D), m(11, Y), m(12, G), m(13, _e)], mt);
var ns = class {
  constructor(i, e) {
    this._rowContainer = i;
    this._coreBrowserService = e;
    this._isIdlePaused = false;
    this._coreBrowserService.isFocused && this._resetIdleTimer();
  }
  dispose() {
    this._clearIdleTimer();
  }
  restartBlinkAnimation() {
    this._isIdlePaused && this._rowContainer.classList.remove("xterm-cursor-blink-idle"), this._resetIdleTimer();
  }
  pause() {
    this._isIdlePaused = false, this._clearIdleTimer();
  }
  resume() {
    this._isIdlePaused = false, this._rowContainer.classList.remove("xterm-cursor-blink-idle"), this._resetIdleTimer();
  }
  _resetIdleTimer() {
    this._isIdlePaused = false, this._clearIdleTimer(), this._idleTimeout = this._coreBrowserService.window.setTimeout(() => {
      this._stopBlinkingDueToIdle();
    }, 3e5);
  }
  _clearIdleTimer() {
    this._idleTimeout !== void 0 && (this._coreBrowserService.window.clearTimeout(this._idleTimeout), this._idleTimeout = void 0);
  }
  _stopBlinkingDueToIdle() {
    this._rowContainer.classList.add("xterm-cursor-blink-idle"), this._isIdlePaused = true, this._idleTimeout = void 0;
  }
};
var bt = class extends g {
  constructor(e, t, r) {
    super();
    this._optionsService = r;
    this.width = 0;
    this.height = 0;
    this._onCharSizeChange = this._register(new b());
    this.onCharSizeChange = this._onCharSizeChange.event;
    try {
      this._measureStrategy = this._register(new as(this._optionsService));
    } catch {
      this._measureStrategy = this._register(new os(e, t, this._optionsService));
    }
    this._register(this._optionsService.onMultipleOptionChange(["fontFamily", "fontSize"], () => this.measure()));
  }
  get hasValidSize() {
    return this.width > 0 && this.height > 0;
  }
  measure() {
    let e = this._measureStrategy.measure();
    (e.width !== this.width || e.height !== this.height) && (this.width = e.width, this.height = e.height, this._onCharSizeChange.fire());
  }
};
bt = y([m(2, R)], bt);
var Ui = class extends g {
  constructor() {
    super(...arguments);
    this._result = { width: 0, height: 0 };
  }
  _validateAndSet(e, t) {
    e !== void 0 && e > 0 && t !== void 0 && t > 0 && (this._result.width = e, this._result.height = t);
  }
};
var os = class extends Ui {
  constructor(e, t, r) {
    super();
    this._document = e;
    this._parentElement = t;
    this._optionsService = r;
    this._measureElement = this._document.createElement("span"), this._measureElement.classList.add("xterm-char-measure-element"), this._measureElement.textContent = "W".repeat(32), this._measureElement.setAttribute("aria-hidden", "true"), this._measureElement.style.whiteSpace = "pre", this._measureElement.style.fontKerning = "none", this._parentElement.appendChild(this._measureElement);
  }
  measure() {
    return this._measureElement.style.fontFamily = this._optionsService.rawOptions.fontFamily, this._measureElement.style.fontSize = `${this._optionsService.rawOptions.fontSize}px`, this._validateAndSet(Number(this._measureElement.offsetWidth) / 32, Number(this._measureElement.offsetHeight)), this._result;
  }
};
var as = class extends Ui {
  constructor(e) {
    super();
    this._optionsService = e;
    this._canvas = new OffscreenCanvas(100, 100), this._ctx = this._canvas.getContext("2d");
    let t = this._ctx.measureText("W");
    if (!("width" in t && "fontBoundingBoxAscent" in t && "fontBoundingBoxDescent" in t)) throw new Error("Required font metrics not supported");
  }
  measure() {
    this._ctx.font = `${this._optionsService.rawOptions.fontSize}px ${this._optionsService.rawOptions.fontFamily}`;
    let e = this._ctx.measureText("W");
    return this._validateAndSet(e.width, e.fontBoundingBoxAscent + e.fontBoundingBoxDescent), this._result;
  }
};
var Ki = class extends g {
  constructor(e, t, r) {
    super();
    this._textarea = e;
    this._window = t;
    this.mainDocument = r;
    this._isFocused = false;
    this._cachedIsFocused = void 0;
    this._onDprChange = this._register(new b());
    this.onDprChange = this._onDprChange.event;
    this._onWindowChange = this._register(new b());
    this.onWindowChange = this._onWindowChange.event;
    this._screenDprMonitor = this._register(new ls(this._window)), this._register(this.onWindowChange((s4) => this._screenDprMonitor.setWindow(s4))), this._register(j.forward(this._screenDprMonitor.onDprChange, this._onDprChange)), this._register(C(this._textarea, "focus", () => this._isFocused = true)), this._register(C(this._textarea, "blur", () => this._isFocused = false));
  }
  get window() {
    return this._window;
  }
  set window(e) {
    this._window !== e && (this._window = e, this._onWindowChange.fire(this._window));
  }
  get dpr() {
    return this.window.devicePixelRatio;
  }
  get isFocused() {
    return this._cachedIsFocused === void 0 && (this._cachedIsFocused = this._isFocused && this._textarea.ownerDocument.hasFocus(), queueMicrotask(() => this._cachedIsFocused = void 0)), this._cachedIsFocused;
  }
};
var ls = class extends g {
  constructor(e) {
    super();
    this._parentWindow = e;
    this._windowResizeListener = this._register(new P());
    this._onDprChange = this._register(new b());
    this.onDprChange = this._onDprChange.event;
    this._outerListener = () => this._setDprAndFireIfDiffers(), this._currentDevicePixelRatio = this._parentWindow.devicePixelRatio, this._updateDpr(), this._setWindowResizeListener(), this._register(E(() => this.clearListener()));
  }
  setWindow(e) {
    this._parentWindow = e, this._setWindowResizeListener(), this._setDprAndFireIfDiffers();
  }
  _setWindowResizeListener() {
    this._windowResizeListener.value = C(this._parentWindow, "resize", () => this._setDprAndFireIfDiffers());
  }
  _setDprAndFireIfDiffers() {
    this._parentWindow.devicePixelRatio !== this._currentDevicePixelRatio && this._onDprChange.fire(this._parentWindow.devicePixelRatio), this._updateDpr();
  }
  _updateDpr() {
    this._outerListener && (this._resolutionMediaMatchList?.removeListener(this._outerListener), this._currentDevicePixelRatio = this._parentWindow.devicePixelRatio, this._resolutionMediaMatchList = this._parentWindow.matchMedia(`screen and (resolution: ${this._parentWindow.devicePixelRatio}dppx)`), this._resolutionMediaMatchList.addListener(this._outerListener));
  }
  clearListener() {
    !this._resolutionMediaMatchList || !this._outerListener || (this._resolutionMediaMatchList.removeListener(this._outerListener), this._resolutionMediaMatchList = void 0, this._outerListener = void 0);
  }
};
var zi = class extends g {
  constructor() {
    super();
    this.linkProviders = [];
    this._register(E(() => this.linkProviders.length = 0));
  }
  registerLinkProvider(e) {
    return this.linkProviders.push(e), { dispose: () => {
      let t = this.linkProviders.indexOf(e);
      t !== -1 && this.linkProviders.splice(t, 1);
    } };
  }
};
function qt(n10, i, e) {
  let t = e.getBoundingClientRect(), r = n10.getComputedStyle(e), s4 = parseInt(r.getPropertyValue("padding-left"), 10), o3 = parseInt(r.getPropertyValue("padding-top"), 10);
  return [i.clientX - t.left - s4, i.clientY - t.top - o3];
}
function Qs(n10, i, e, t, r, s4, o3, a, l3) {
  if (!s4) return;
  let h = qt(n10, i, e);
  return h[0] = Math.ceil((h[0] + (l3 ? o3 / 2 : 0)) / o3), h[1] = Math.ceil(h[1] / a), h[0] = Math.min(Math.max(h[0], 1), t + (l3 ? 1 : 0)), h[1] = Math.min(Math.max(h[1], 1), r), h;
}
var vt = class {
  constructor(i, e) {
    this._charSizeService = i;
    this._renderService = e;
  }
  getCoords(i, e, t, r, s4) {
    return Qs(se(e), i, e, t, r, this._charSizeService.hasValidSize, this._renderService.dimensions.css.cell.width, this._renderService.dimensions.css.cell.height, s4);
  }
  getMouseReportCoords(i, e) {
    let t = qt(se(e), i, e);
    if (this._charSizeService.hasValidSize) return t[0] = Math.min(Math.max(t[0], 0), this._renderService.dimensions.css.canvas.width - 1), t[1] = Math.min(Math.max(t[1], 0), this._renderService.dimensions.css.canvas.height - 1), { col: Math.floor(t[0] / this._renderService.dimensions.css.cell.width), row: Math.floor(t[1] / this._renderService.dimensions.css.cell.height), x: Math.floor(t[0]), y: Math.floor(t[1]) };
  }
};
vt = y([m(0, Be), m(1, V)], vt);
var en = typeof window == "object" ? window : globalThis;
function ce(n10, i = 0) {
  return n10[n10.length - (1 + i)];
}
function Jn(n10, i, e) {
  let t = null, r = null;
  if (typeof e.value == "function" ? (t = "value", r = e.value, r.length !== 0 && console.warn("Memoize should only be used in functions with zero parameters")) : typeof e.get == "function" && (t = "get", r = e.get), !r || !t) throw new Error("not supported");
  let s4 = `$memoize$${i}`, o3 = e;
  o3[t] = function(...a) {
    return this.hasOwnProperty(s4) || Object.defineProperty(this, s4, { configurable: false, enumerable: false, writable: false, value: r.apply(this, a) }), this[s4];
  };
}
var St = class St2 {
  constructor(i) {
    this.element = i, this.next = St2.Undefined, this.prev = St2.Undefined;
  }
};
St.Undefined = new St(void 0);
var re = St;
var Gi = class {
  constructor() {
    this._first = re.Undefined;
    this._last = re.Undefined;
  }
  push(i) {
    return this._insert(i, true);
  }
  _insert(i, e) {
    let t = new re(i);
    if (this._first === re.Undefined) this._first = t, this._last = t;
    else if (e) {
      let s4 = this._last;
      this._last = t, t.prev = s4, s4.next = t;
    } else {
      let s4 = this._first;
      this._first = t, t.next = s4, s4.prev = t;
    }
    let r = false;
    return () => {
      r || (r = true, this._remove(t));
    };
  }
  _remove(i) {
    if (i.prev !== re.Undefined && i.next !== re.Undefined) {
      let e = i.prev;
      e.next = i.next, i.next.prev = e;
    } else i.prev === re.Undefined && i.next === re.Undefined ? (this._first = re.Undefined, this._last = re.Undefined) : i.next === re.Undefined ? (this._last = this._last.prev, this._last.next = re.Undefined) : i.prev === re.Undefined && (this._first = this._first.next, this._first.prev = re.Undefined);
  }
  *[Symbol.iterator]() {
    let i = this._first;
    for (; i !== re.Undefined; ) yield i.element, i = i.next;
  }
};
var he;
((s4) => (s4.TAP = "-xterm-gesturetap", s4.CHANGE = "-xterm-gesturechange", s4.START = "-xterm-gesturestart", s4.END = "-xterm-gesturesend", s4.CONTEXT_MENU = "-xterm-gesturecontextmenu"))(he ||= {});
var K = class K2 extends g {
  constructor() {
    super();
    this._dispatched = false;
    this._targets = new Gi();
    this._ignoreTargets = new Gi();
    this._activeTouches = {}, this._handle = null, this._lastSetTapCountTime = 0;
    let e = en;
    this._register(C(e.document, "touchstart", (t) => this._handleTouchStart(t), { passive: false })), this._register(C(e.document, "touchend", (t) => this._handleTouchEnd(e, t))), this._register(C(e.document, "touchmove", (t) => this._handleTouchMove(t), { passive: false }));
  }
  static addTarget(e) {
    if (!K2.isTouchDevice()) return g.None;
    K2._instance || (K2._instance = new K2());
    let t = K2._instance._targets.push(e);
    return E(t);
  }
  static ignoreTarget(e) {
    if (!K2.isTouchDevice()) return g.None;
    K2._instance || (K2._instance = new K2());
    let t = K2._instance._ignoreTargets.push(e);
    return E(t);
  }
  static isTouchDevice() {
    return "ontouchstart" in en || navigator.maxTouchPoints > 0;
  }
  dispose() {
    this._handle && (this._handle.dispose(), this._handle = null), super.dispose();
  }
  _handleTouchStart(e) {
    let t = Date.now();
    this._handle && (this._handle.dispose(), this._handle = null);
    for (let r = 0, s4 = e.targetTouches.length; r < s4; r++) {
      let o3 = e.targetTouches.item(r);
      this._activeTouches[o3.identifier] = { id: o3.identifier, initialTarget: o3.target, initialTimeStamp: t, initialPageX: o3.pageX, initialPageY: o3.pageY, rollingTimestamps: [t], rollingPageX: [o3.pageX], rollingPageY: [o3.pageY] };
      let a = this._newGestureEvent(he.START, o3.target);
      a.pageX = o3.pageX, a.pageY = o3.pageY, this._dispatchEvent(a);
    }
    this._dispatched && (e.preventDefault(), e.stopPropagation(), this._dispatched = false);
  }
  _handleTouchEnd(e, t) {
    let r = Date.now(), s4 = Object.keys(this._activeTouches).length;
    for (let o3 = 0, a = t.changedTouches.length; o3 < a; o3++) {
      let l3 = t.changedTouches.item(o3);
      if (!this._activeTouches.hasOwnProperty(String(l3.identifier))) {
        console.warn("move of an UNKNOWN touch", l3);
        continue;
      }
      let h = this._activeTouches[l3.identifier], d = Date.now() - h.initialTimeStamp;
      if (d < K2._holdDelay && Math.abs(h.initialPageX - ce(h.rollingPageX)) < 30 && Math.abs(h.initialPageY - ce(h.rollingPageY)) < 30) {
        let c = this._newGestureEvent(he.TAP, h.initialTarget);
        c.pageX = ce(h.rollingPageX), c.pageY = ce(h.rollingPageY), this._dispatchEvent(c);
      } else if (d >= K2._holdDelay && Math.abs(h.initialPageX - ce(h.rollingPageX)) < 30 && Math.abs(h.initialPageY - ce(h.rollingPageY)) < 30) {
        let c = this._newGestureEvent(he.CONTEXT_MENU, h.initialTarget);
        c.pageX = ce(h.rollingPageX), c.pageY = ce(h.rollingPageY), this._dispatchEvent(c);
      } else if (s4 === 1) {
        let c = ce(h.rollingPageX), u = ce(h.rollingPageY), _ = ce(h.rollingTimestamps) - h.rollingTimestamps[0], p = c - h.rollingPageX[0], v = u - h.rollingPageY[0], f2 = [...this._targets].filter((S) => h.initialTarget instanceof Node && S.contains(h.initialTarget));
        this._inertia(e, f2, r, Math.abs(p) / _, p > 0 ? 1 : -1, c, Math.abs(v) / _, v > 0 ? 1 : -1, u);
      }
      this._dispatchEvent(this._newGestureEvent(he.END, h.initialTarget)), delete this._activeTouches[l3.identifier];
    }
    this._dispatched && (t.preventDefault(), t.stopPropagation(), this._dispatched = false);
  }
  _newGestureEvent(e, t) {
    let r = document.createEvent("CustomEvent");
    return r.initEvent(e, false, true), r.initialTarget = t, r.tapCount = 0, r;
  }
  _dispatchEvent(e) {
    if (e.type === he.TAP) {
      let t = (/* @__PURE__ */ new Date()).getTime(), r;
      t - this._lastSetTapCountTime > K2._clearTapCountTime ? r = 1 : r = 2, this._lastSetTapCountTime = t, e.tapCount = r;
    } else (e.type === he.CHANGE || e.type === he.CONTEXT_MENU) && (this._lastSetTapCountTime = 0);
    if (e.initialTarget instanceof Node) {
      for (let r of this._ignoreTargets) if (r.contains(e.initialTarget)) return;
      let t = [];
      for (let r of this._targets) if (r.contains(e.initialTarget)) {
        let s4 = 0, o3 = e.initialTarget;
        for (; o3 && o3 !== r; ) s4++, o3 = o3.parentElement;
        t.push([s4, r]);
      }
      t.sort((r, s4) => r[0] - s4[0]);
      for (let [, r] of t) r.dispatchEvent(e), this._dispatched = true;
    }
  }
  _inertia(e, t, r, s4, o3, a, l3, h, d) {
    this._handle = tt(e, () => {
      let c = Date.now(), u = c - r, _ = 0, p = 0, v = true;
      s4 += K2._scrollFriction * u, l3 += K2._scrollFriction * u, s4 > 0 && (v = false, _ = o3 * s4 * u), l3 > 0 && (v = false, p = h * l3 * u);
      let f2 = this._newGestureEvent(he.CHANGE);
      f2.translationX = _, f2.translationY = p, t.forEach((S) => S.dispatchEvent(f2)), v || this._inertia(e, t, c, s4, o3, a + _, l3, h, d + p);
    });
  }
  _handleTouchMove(e) {
    let t = Date.now();
    for (let r = 0, s4 = e.changedTouches.length; r < s4; r++) {
      let o3 = e.changedTouches.item(r);
      if (!this._activeTouches.hasOwnProperty(String(o3.identifier))) {
        console.warn("end of an UNKNOWN touch", o3);
        continue;
      }
      let a = this._activeTouches[o3.identifier], l3 = this._newGestureEvent(he.CHANGE, a.initialTarget);
      l3.translationX = o3.pageX - ce(a.rollingPageX), l3.translationY = o3.pageY - ce(a.rollingPageY), l3.pageX = o3.pageX, l3.pageY = o3.pageY, l3.clientX = o3.clientX, l3.clientY = o3.clientY, this._dispatchEvent(l3), a.rollingPageX.length > 3 && (a.rollingPageX.shift(), a.rollingPageY.shift(), a.rollingTimestamps.shift()), a.rollingPageX.push(o3.pageX), a.rollingPageY.push(o3.pageY), a.rollingTimestamps.push(t);
    }
    this._dispatched && (e.preventDefault(), e.stopPropagation(), this._dispatched = false);
  }
};
K._scrollFriction = -5e-3, K._holdDelay = 700, K._clearTapCountTime = 400, y([Jn], K, "isTouchDevice", 1);
var Vi = K;
var gt = class {
  constructor(i, e, t, r, s4, o3, a, l3, h) {
    this._renderService = i;
    this._mouseCoordsService = e;
    this._mouseStateService = t;
    this._coreService = r;
    this._bufferService = s4;
    this._optionsService = o3;
    this._selectionService = a;
    this._logService = l3;
    this._coreBrowserService = h;
    this._lastEvent = null;
    this._wheelPartialScroll = 0;
    this._touchScrollAccumulator = 0;
  }
  bindMouse(i, e, t) {
    let { element: r, document: s4 } = i, o3 = { mouseup: null, wheel: null, mousedrag: null, mousemove: null }, a = { target: i, focus: t, requestedEvents: o3 }, l3 = { mouseup: (h) => this._handleMouseUp(a, h), wheel: (h) => this._handleWheel(a, h), mousedrag: (h) => this._handleMouseDrag(a, h), mousemove: (h) => this._handleMouseMove(a, h) };
    this._altMouseCursor = new cs(r, s4, () => this._mouseStateService.areMouseEventsActive && !!this._optionsService.rawOptions.mouseEventsRequireAlt), e(this._altMouseCursor), e(this._mouseStateService.onProtocolChange((h) => {
      this._handleProtocolChange(a, l3, h);
    })), e(this._optionsService.onSpecificOptionChange("mouseEventsRequireAlt", () => {
      this._syncMouseModeState(r), this._altMouseCursor?.sync();
    })), this._mouseStateService.activeProtocol = this._mouseStateService.activeProtocol, e(E(() => {
      o3.mouseup && s4.removeEventListener("mouseup", o3.mouseup), o3.mousedrag && s4.removeEventListener("mousemove", o3.mousedrag);
    })), e(C(r, "mousedown", (h) => this._handleMouseDown(a, h))), e(C(r, "wheel", (h) => this._handlePassiveWheel(a, h), { passive: false })), e(Vi.addTarget(i.screenElement)), e(C(i.screenElement, he.START, () => this._handleTouchStart())), e(C(i.screenElement, he.CHANGE, (h) => this._handleTouchChange(a, h)));
  }
  _sendEvent(i, e) {
    let t = this._mouseCoordsService.getMouseReportCoords(e, i.target.screenElement);
    if (!t) return false;
    let r, s4;
    switch (e.overrideType || e.type) {
      case "mousemove":
        s4 = 32, e.buttons === void 0 ? (r = 3, e.button !== void 0 && (r = e.button < 3 ? e.button : 3)) : r = e.buttons & 1 ? 0 : e.buttons & 4 ? 1 : e.buttons & 2 ? 2 : 3;
        break;
      case "mouseup":
        s4 = 0, r = e.button < 3 ? e.button : 3;
        break;
      case "mousedown":
        s4 = 1, r = e.button < 3 ? e.button : 3;
        break;
      case "wheel":
        if (!this._mouseStateService.allowCustomWheelEvent(e)) return false;
        let a = e.deltaY;
        if (a === 0 || this._consumeWheelEvent(e, this._renderService?.dimensions?.device?.cell?.height, this._coreBrowserService?.dpr) === 0) return false;
        s4 = a < 0 ? 0 : 1, r = 4;
        break;
      default:
        return false;
    }
    if (s4 === void 0 || r === void 0 || r > 4 || r !== 4 && this._optionsService.rawOptions.mouseEventsRequireAlt && this._mouseStateService.areMouseEventsActive && !e.altKey) return false;
    let o3 = r !== 4 && this._optionsService.rawOptions.mouseEventsRequireAlt && this._mouseStateService.areMouseEventsActive;
    return this._triggerMouseEvent({ col: t.col, row: t.row, x: t.x, y: t.y, button: r, action: s4, ctrl: e.ctrlKey, alt: o3 ? false : e.altKey, shift: e.shiftKey });
  }
  _handleMouseUp(i, e) {
    this._sendEvent(i, e), e.buttons || (i.requestedEvents.mouseup && i.target.document.removeEventListener("mouseup", i.requestedEvents.mouseup), i.requestedEvents.mousedrag && i.target.document.removeEventListener("mousemove", i.requestedEvents.mousedrag));
  }
  _handleWheel(i, e) {
    return this._sendEvent(i, e), e.preventDefault(), e.stopPropagation(), false;
  }
  _handleMouseDrag(i, e) {
    e.buttons && this._sendEvent(i, e);
  }
  _handleMouseMove(i, e) {
    e.buttons || this._sendEvent(i, e);
  }
  _handleMouseDown(i, e) {
    e.preventDefault(), i.focus(), !(!this._mouseStateService.areMouseEventsActive || this._selectionService.shouldForceSelection(e)) && (this._sendEvent(i, e), i.requestedEvents.mouseup && i.target.document.addEventListener("mouseup", i.requestedEvents.mouseup), i.requestedEvents.mousedrag && i.target.document.addEventListener("mousemove", i.requestedEvents.mousedrag));
  }
  _handlePassiveWheel(i, e) {
    if (!i.requestedEvents.wheel) {
      if (!this._mouseStateService.allowCustomWheelEvent(e)) return false;
      if (!this._bufferService.buffer.hasScrollback) {
        if (e.deltaY === 0) return false;
        if (this._consumeWheelEvent(e, this._renderService?.dimensions?.device?.cell?.height, this._coreBrowserService?.dpr) === 0) return e.preventDefault(), e.stopPropagation(), false;
        let s4 = "\x1B" + (this._coreService.decPrivateModes.applicationCursorKeys ? "O" : "[") + (e.deltaY < 0 ? "A" : "B");
        return this._coreService.triggerDataEvent(s4, true), e.preventDefault(), e.stopPropagation(), false;
      }
    }
  }
  _handleTouchStart() {
    this._touchScrollAccumulator = 0;
  }
  _handleTouchChange(i, e) {
    if (e.preventDefault(), e.stopPropagation(), i.requestedEvents.wheel) {
      this._handleTouchScrollAsWheel(i, e);
      return;
    }
    if (!this._bufferService.buffer.hasScrollback) {
      this._handleTouchScrollAsKeys(e);
      return;
    }
    i.target.handleTouchScroll?.(e.translationY);
  }
  _handleTouchScrollAsKeys(i) {
    let e = this._renderService?.dimensions.css.cell.height;
    if (!e) return;
    this._touchScrollAccumulator -= i.translationY;
    let t = Math.trunc(this._touchScrollAccumulator / e);
    if (t === 0) return;
    this._touchScrollAccumulator -= t * e;
    let r = "\x1B" + (this._coreService.decPrivateModes.applicationCursorKeys ? "O" : "[") + (t < 0 ? "A" : "B");
    for (let s4 = 0; s4 < Math.abs(t); s4++) this._coreService.triggerDataEvent(r, true);
  }
  _handleTouchScrollAsWheel(i, e) {
    let t = this._renderService?.dimensions.css.cell.height;
    if (!t) return;
    this._touchScrollAccumulator -= e.translationY;
    let r = Math.trunc(this._touchScrollAccumulator / t);
    if (r === 0) return;
    this._touchScrollAccumulator -= r * t;
    let s4 = this._mouseCoordsService.getMouseReportCoords(e, i.target.screenElement);
    if (s4) for (let o3 = 0; o3 < Math.abs(r); o3++) this._triggerMouseEvent({ col: s4.col, row: s4.row, x: s4.x, y: s4.y, button: 4, action: r < 0 ? 0 : 1, ctrl: false, alt: false, shift: false });
  }
  reset() {
    this._lastEvent = null, this._wheelPartialScroll = 0, this._touchScrollAccumulator = 0;
  }
  _syncMouseModeState(i) {
    this._mouseStateService.areMouseEventsActive ? this._optionsService.rawOptions.mouseEventsRequireAlt ? (this._altMouseCursor?.resetClass(), this._selectionService.enable()) : (i.classList.add("enable-mouse-events"), this._selectionService.disable()) : (i.classList.remove("enable-mouse-events"), this._selectionService.enable());
  }
  _handleProtocolChange(i, e, t) {
    let { element: r, document: s4 } = i.target, { requestedEvents: o3 } = i;
    t ? this._optionsService.rawOptions.logLevel === "debug" && this._logService.debug("Binding to mouse events:", this._explainEvents(t)) : this._logService.debug("Unbinding from mouse events."), this._syncMouseModeState(r), this._altMouseCursor?.sync(), t & 8 ? o3.mousemove || (r.addEventListener("mousemove", e.mousemove), o3.mousemove = e.mousemove) : (o3.mousemove && r.removeEventListener("mousemove", o3.mousemove), o3.mousemove = null), t & 16 ? o3.wheel || (r.addEventListener("wheel", e.wheel, { passive: false }), o3.wheel = e.wheel) : (o3.wheel && r.removeEventListener("wheel", o3.wheel), o3.wheel = null), t & 2 ? o3.mouseup ??= e.mouseup : (o3.mouseup && s4.removeEventListener("mouseup", o3.mouseup), o3.mouseup = null), t & 4 ? o3.mousedrag ??= e.mousedrag : (o3.mousedrag && s4.removeEventListener("mousemove", o3.mousedrag), o3.mousedrag = null);
  }
  _applyScrollModifier(i, e) {
    return e.altKey || e.ctrlKey || e.shiftKey ? i * this._optionsService.rawOptions.fastScrollSensitivity * this._optionsService.rawOptions.scrollSensitivity : i * this._optionsService.rawOptions.scrollSensitivity;
  }
  _consumeWheelEvent(i, e, t) {
    if (i.deltaY === 0 || i.shiftKey || e === void 0 || t === void 0) return 0;
    let r = e / t, s4 = this._applyScrollModifier(i.deltaY, i);
    return i.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? (s4 /= r + 0, Math.abs(i.deltaY) < 50 && (s4 *= 0.3), this._wheelPartialScroll += s4, s4 = Math.floor(Math.abs(this._wheelPartialScroll)) * (this._wheelPartialScroll > 0 ? 1 : -1), this._wheelPartialScroll %= 1) : i.deltaMode === WheelEvent.DOM_DELTA_PAGE && (s4 *= this._bufferService.rows), s4;
  }
  _triggerMouseEvent(i) {
    if (i.col < 0 || i.col >= this._bufferService.cols || i.row < 0 || i.row >= this._bufferService.rows || i.button === 4 && i.action === 32 || i.button === 3 && i.action !== 32 || i.button !== 4 && (i.action === 2 || i.action === 3) || (i.col++, i.row++, i.action === 32 && this._lastEvent && this._equalEvents(this._lastEvent, i, this._mouseStateService.isPixelEncoding)) || !this._mouseStateService.restrictMouseEvent(i)) return false;
    let e = this._mouseStateService.encodeMouseEvent(i);
    return e && (this._mouseStateService.isDefaultEncoding ? this._coreService.triggerBinaryEvent(e) : this._coreService.triggerDataEvent(e, true)), this._lastEvent = i, true;
  }
  _explainEvents(i) {
    return { down: !!(i & 1), up: !!(i & 2), drag: !!(i & 4), move: !!(i & 8), wheel: !!(i & 16) };
  }
  _equalEvents(i, e, t) {
    if (t) {
      if (i.x !== e.x || i.y !== e.y) return false;
    } else if (i.col !== e.col || i.row !== e.row) return false;
    return !(i.button !== e.button || i.action !== e.action || i.ctrl !== e.ctrl || i.alt !== e.alt || i.shift !== e.shift);
  }
};
gt = y([m(0, V), m(1, Pe), m(2, Me), m(3, Y), m(4, D), m(5, R), m(6, Si), m(7, fe), m(8, G)], gt);
var cs = class {
  constructor(i, e, t) {
    this._element = i;
    this._document = e;
    this._isActive = t;
    this._listeners = new P();
  }
  dispose() {
    this._listeners.dispose();
  }
  sync() {
    if (this._listeners.clear(), !this._isActive()) return;
    let i = new pe(), e = (r) => this.syncFromModifier(r);
    i.add(C(this._document, "keydown", e)), i.add(C(this._document, "keyup", e)), i.add(C(this._element, "mousemove", e));
    let t = this._element.ownerDocument?.defaultView;
    t && i.add(C(t, "blur", () => {
      this._isActive() && this.resetClass();
    })), this._listeners.value = i;
  }
  resetClass() {
    this._updateClass(false);
  }
  syncFromModifier(i) {
    this._isActive() && this._updateClass(i.getModifierState("Alt"));
  }
  _updateClass(i) {
    i ? this._element.classList.add("enable-mouse-events") : this._element.classList.remove("enable-mouse-events");
  }
};
var $i = class {
  constructor(i, e) {
    this._renderCallback = i;
    this._coreBrowserService = e;
    this._refreshCallbacks = [];
  }
  dispose() {
    this._animationFrame !== void 0 && (this._coreBrowserService.window.cancelAnimationFrame(this._animationFrame), this._animationFrame = void 0);
  }
  addRefreshCallback(i) {
    return this._refreshCallbacks.push(i), this._animationFrame ??= this._coreBrowserService.window.requestAnimationFrame(() => this._innerRefresh()), this._animationFrame;
  }
  refresh(i, e, t) {
    this._rowCount = t, i = i ?? 0, e = e ?? this._rowCount - 1, this._rowStart = this._rowStart !== void 0 ? Math.min(this._rowStart, i) : i, this._rowEnd = this._rowEnd !== void 0 ? Math.max(this._rowEnd, e) : e, this._animationFrame === void 0 && (this._animationFrame = this._coreBrowserService.window.requestAnimationFrame(() => this._innerRefresh()));
  }
  _innerRefresh() {
    if (this._animationFrame = void 0, this._rowStart === void 0 || this._rowEnd === void 0 || this._rowCount === void 0) {
      this._runRefreshCallbacks();
      return;
    }
    let i = Math.max(this._rowStart, 0), e = Math.min(this._rowEnd, this._rowCount - 1);
    this._rowStart = void 0, this._rowEnd = void 0, this._renderCallback(i, e), this._runRefreshCallbacks();
  }
  _runRefreshCallbacks() {
    for (let i of this._refreshCallbacks) i(0);
    this._refreshCallbacks = [];
  }
};
var qi = class {
  constructor(i) {
    this._tasks = [];
    this._i = 0;
    this._logService = i;
  }
  enqueue(i) {
    this._tasks.push(i), this._start();
  }
  flush() {
    for (; this._i < this._tasks.length; ) this._tasks[this._i]() || this._i++;
    this.clear();
  }
  clear() {
    this._idleCallback && (this._cancelCallback(this._idleCallback), this._idleCallback = void 0), this._i = 0, this._tasks.length = 0;
  }
  _start() {
    this._idleCallback || (this._idleCallback = this._requestCallback(this._process.bind(this)));
  }
  _process(i) {
    this._idleCallback = void 0;
    let e, t = 0, r = i.timeRemaining(), s4;
    for (; this._i < this._tasks.length; ) {
      if (e = performance.now(), this._tasks[this._i]() || this._i++, e = Math.max(1, performance.now() - e), t = Math.max(e, t), s4 = i.timeRemaining(), t * 1.5 > s4) {
        r - e < -20 && this._logService.warn(`task queue exceeded allotted deadline by ${Math.abs(Math.round(r - e))}ms`), this._start();
        return;
      }
      r = s4;
    }
    this.clear();
  }
};
var hs = class extends qi {
  _requestCallback(i) {
    return setTimeout(() => i(this._createDeadline(16)));
  }
  _cancelCallback(i) {
    clearTimeout(i);
  }
  _createDeadline(i) {
    let e = performance.now() + i;
    return { timeRemaining: () => Math.max(0, e - performance.now()) };
  }
};
var ds = class extends qi {
  _requestCallback(i) {
    return requestIdleCallback(i);
  }
  _cancelCallback(i) {
    cancelIdleCallback(i);
  }
};
var It = "requestIdleCallback" in globalThis ? ds : hs;
var Xi = class {
  constructor(i) {
    this._queue = new It(i);
  }
  set(i) {
    this._queue.clear(), this._queue.enqueue(i);
  }
  flush() {
    this._queue.flush();
  }
  dispose() {
    this._queue.clear();
  }
};
var Ct = class extends g {
  constructor(e, t, r, s4, o3, a, l3, h, d, c) {
    super();
    this._rowCount = e;
    this._optionsService = r;
    this._logService = s4;
    this._charSizeService = o3;
    this._coreService = a;
    this._coreBrowserService = d;
    this._renderer = this._register(new P());
    this._observerDisposable = this._register(new P());
    this._isPaused = false;
    this._needsFullRefresh = false;
    this._isNextRenderRedrawOnly = true;
    this._needsSelectionRefresh = false;
    this._canvasWidth = 0;
    this._canvasHeight = 0;
    this._selectionState = { start: void 0, end: void 0, columnSelectMode: false };
    this._onDimensionsChange = this._register(new b());
    this.onDimensionsChange = this._onDimensionsChange.event;
    this._onRenderedViewportChange = this._register(new b());
    this.onRenderedViewportChange = this._onRenderedViewportChange.event;
    this._onRender = this._register(new b());
    this.onRender = this._onRender.event;
    this._onRefreshRequest = this._register(new b());
    this.onRefreshRequest = this._onRefreshRequest.event;
    this._pausedResizeTask = this._register(new Xi(this._logService)), this._renderDebouncer = new $i((u, _) => this._renderRows(u, _), this._coreBrowserService), this._register(this._renderDebouncer), this._syncOutputHandler = new us(this._coreBrowserService, this._coreService, () => this._fullRefresh()), this._register(E(() => this._syncOutputHandler.dispose())), this._register(this._coreBrowserService.onDprChange(() => this.handleDevicePixelRatioChange())), this._register(h.onResize(() => this._fullRefresh())), this._register(h.buffers.onBufferActivate(() => this._renderer.value?.clear())), this._register(this._optionsService.onOptionChange(() => this._handleOptionsChanged())), this._register(this._charSizeService.onCharSizeChange(() => this.handleCharSizeChanged())), this._register(l3.onDecorationRegistered(() => this._fullRefresh())), this._register(l3.onDecorationRemoved(() => this._fullRefresh())), this._register(this._optionsService.onMultipleOptionChange(["drawBoldTextInBrightColors", "letterSpacing", "lineHeight", "fontFamily", "fontSize", "fontWeight", "fontWeightBold", "minimumContrastRatio", "rescaleOverlappingGlyphs"], () => {
      this.clear(), this.handleResize(h.cols, h.rows), this._fullRefresh();
    })), this._register(this._optionsService.onMultipleOptionChange(["cursorBlink", "cursorStyle"], () => this.refreshRows(h.buffer.y, h.buffer.y, void 0, true))), this._register(c.onChangeColors(() => this._fullRefresh())), this._registerIntersectionObserver(this._coreBrowserService.window, t), this._register(this._coreBrowserService.onWindowChange((u) => this._registerIntersectionObserver(u, t)));
  }
  get dimensions() {
    return this._renderer.value.dimensions;
  }
  _registerIntersectionObserver(e, t) {
    if ("IntersectionObserver" in e) {
      let r = new e.IntersectionObserver((s4) => this._handleIntersectionChange(s4[s4.length - 1]), { threshold: 0 });
      this._observerDisposable.value = E(() => {
        this._intersectionObserver?.disconnect(), this._intersectionObserver = void 0;
      }), this._intersectionObserver = r, r.observe(t);
    }
  }
  _handleIntersectionChange(e) {
    this._isPaused = e.isIntersecting === void 0 ? e.intersectionRatio === 0 : !e.isIntersecting, this._renderer.value?.handleViewportVisibilityChange?.(!this._isPaused), !this._isPaused && !this._charSizeService.hasValidSize && this._charSizeService.measure(), !this._isPaused && this._needsFullRefresh && (this._pausedResizeTask.flush(), this.refreshRows(0, this._rowCount - 1), this._needsFullRefresh = false);
  }
  refreshRows(e, t, r = false, s4 = false) {
    if (this._isPaused) {
      this._needsFullRefresh = true;
      return;
    }
    if (this._coreService.decPrivateModes.synchronizedOutput) {
      this._syncOutputHandler.bufferRows(e, t);
      return;
    }
    let o3 = this._syncOutputHandler.flush();
    o3 && (e = Math.min(e, o3.start), t = Math.max(t, o3.end)), s4 || (this._isNextRenderRedrawOnly = false), r ? this._renderRows(e, t) : this._renderDebouncer.refresh(e, t, this._rowCount);
  }
  _renderRows(e, t) {
    if (this._renderer.value) {
      if (this._coreService.decPrivateModes.synchronizedOutput) {
        this._syncOutputHandler.bufferRows(e, t);
        return;
      }
      e = Math.min(e, this._rowCount - 1), t = Math.min(t, this._rowCount - 1), this._renderer.value.renderRows(e, t), this._needsSelectionRefresh && (this._renderer.value.handleSelectionChanged(this._selectionState.start, this._selectionState.end, this._selectionState.columnSelectMode), this._needsSelectionRefresh = false), this._isNextRenderRedrawOnly || this._onRenderedViewportChange.fire({ start: e, end: t }), this._onRender.fire({ start: e, end: t }), this._isNextRenderRedrawOnly = true;
    }
  }
  resize(e, t) {
    this._rowCount = t, this._fireOnCanvasResize();
  }
  _handleOptionsChanged() {
    this._renderer.value && (this.refreshRows(0, this._rowCount - 1), this._fireOnCanvasResize());
  }
  _fireOnCanvasResize() {
    this._renderer.value && (this._renderer.value.dimensions.css.canvas.width === this._canvasWidth && this._renderer.value.dimensions.css.canvas.height === this._canvasHeight || this._onDimensionsChange.fire(this._renderer.value.dimensions));
  }
  hasRenderer() {
    return !!this._renderer.value;
  }
  setRenderer(e) {
    this._renderer.value = e, this._renderer.value && (this._renderer.value.onRequestRedraw((t) => this.refreshRows(t.start, t.end, t.sync, true)), this._needsSelectionRefresh = true, this._fullRefresh());
  }
  addRefreshCallback(e) {
    return this._renderDebouncer.addRefreshCallback(e);
  }
  _fullRefresh() {
    this._isPaused ? this._needsFullRefresh = true : this.refreshRows(0, this._rowCount - 1);
  }
  clearTextureAtlas() {
    this._renderer.value && (this._renderer.value.clearTextureAtlas?.(), this._fullRefresh());
  }
  handleDevicePixelRatioChange() {
    this._charSizeService.measure(), this._renderer.value && (this._renderer.value.handleDevicePixelRatioChange(), this.refreshRows(0, this._rowCount - 1));
  }
  handleResize(e, t) {
    this._renderer.value && (this._isPaused ? this._pausedResizeTask.set(() => this._renderer.value?.handleResize(e, t)) : this._renderer.value.handleResize(e, t), this._fullRefresh());
  }
  handleCharSizeChanged() {
    this._renderer.value?.handleCharSizeChanged();
  }
  handleBlur() {
    this._renderer.value?.handleBlur();
  }
  handleFocus() {
    this._renderer.value?.handleFocus();
  }
  handleSelectionChanged(e, t, r) {
    this._selectionState.start = e, this._selectionState.end = t, this._selectionState.columnSelectMode = r, this._renderer.value?.handleSelectionChanged(e, t, r);
  }
  handleCursorMove() {
    this._renderer.value?.handleCursorMove();
  }
  clear() {
    this._renderer.value?.clear();
  }
};
Ct = y([m(2, R), m(3, fe), m(4, Be), m(5, Y), m(6, ge), m(7, D), m(8, G), m(9, _e)], Ct);
var us = class {
  constructor(i, e, t) {
    this._coreBrowserService = i;
    this._coreService = e;
    this._onTimeout = t;
    this._start = 0;
    this._end = 0;
    this._isBuffering = false;
  }
  bufferRows(i, e) {
    this._isBuffering ? (this._start = Math.min(this._start, i), this._end = Math.max(this._end, e)) : (this._start = i, this._end = e, this._isBuffering = true), this._timeout ??= this._coreBrowserService.window.setTimeout(() => {
      this._timeout = void 0, this._coreService.decPrivateModes.synchronizedOutput = false, this._onTimeout();
    }, 1e3);
  }
  flush() {
    if (this._timeout !== void 0 && (this._coreBrowserService.window.clearTimeout(this._timeout), this._timeout = void 0), !this._isBuffering) return;
    let i = { start: this._start, end: this._end };
    return this._isBuffering = false, i;
  }
  dispose() {
    this._timeout !== void 0 && (this._coreBrowserService.window.clearTimeout(this._timeout), this._timeout = void 0);
  }
};
function tn(n10, i, e, t) {
  let r = e.buffer.x, s4 = e.buffer.y;
  if (!e.buffer.hasScrollback) return ro(r, s4, n10, i, e, t) + Yi(s4, i, e, t) + so(r, s4, n10, i, e, t);
  let o3;
  if (s4 === i) return o3 = r > n10 ? "D" : "C", Yt(Math.abs(r - n10), Xt(o3, t));
  o3 = s4 > i ? "D" : "C";
  let a = Math.abs(s4 - i), l3 = io(s4 > i ? n10 : r, e) + (a - 1) * e.cols + 1 + to(s4 > i ? r : n10, e);
  return Yt(l3, Xt(o3, t));
}
function to(n10, i) {
  return n10 - 1;
}
function io(n10, i) {
  return i.cols - n10;
}
function ro(n10, i, e, t, r, s4) {
  return Yi(i, t, r, s4).length === 0 ? "" : Yt(sn(n10, i, n10, i - $e(i, r), false, r).length, Xt("D", s4));
}
function Yi(n10, i, e, t) {
  let r = n10 - $e(n10, e), s4 = i - $e(i, e), o3 = Math.abs(r - s4) - no(n10, i, e);
  return Yt(o3, Xt(rn(n10, i), t));
}
function so(n10, i, e, t, r, s4) {
  let o3;
  Yi(i, t, r, s4).length > 0 ? o3 = t - $e(t, r) : o3 = i;
  let a = t, l3 = oo(n10, i, e, t, r, s4);
  return Yt(sn(n10, o3, e, a, l3 === "C", r).length, Xt(l3, s4));
}
function no(n10, i, e) {
  let t = 0, r = n10 - $e(n10, e), s4 = i - $e(i, e);
  for (let o3 = 0; o3 < Math.abs(r - s4); o3++) {
    let a = rn(n10, i) === "A" ? -1 : 1;
    e.buffer.lines.get(r + a * o3)?.isWrapped && t++;
  }
  return t;
}
function $e(n10, i) {
  let e = 0, t = i.buffer.lines.get(n10), r = t?.isWrapped;
  for (; r && n10 >= 0 && n10 < i.rows; ) e++, t = i.buffer.lines.get(--n10), r = t?.isWrapped;
  return e;
}
function oo(n10, i, e, t, r, s4) {
  let o3;
  return Yi(i, t, r, s4).length > 0 ? o3 = t - $e(t, r) : o3 = i, n10 < e && o3 <= t || n10 >= e && o3 < t ? "C" : "D";
}
function rn(n10, i) {
  return n10 > i ? "A" : "B";
}
function sn(n10, i, e, t, r, s4) {
  let o3 = n10, a = i, l3 = "";
  for (; (o3 !== e || a !== t) && a >= 0 && a < s4.buffer.lines.length; ) o3 += r ? 1 : -1, r && o3 > s4.cols - 1 ? (l3 += s4.buffer.translateBufferLineToString(a, false, n10, o3), o3 = 0, n10 = 0, a++) : !r && o3 < 0 && (l3 += s4.buffer.translateBufferLineToString(a, false, 0, n10 + 1), o3 = s4.cols - 1, n10 = o3, a--);
  return l3 + s4.buffer.translateBufferLineToString(a, false, n10, o3);
}
function Xt(n10, i) {
  let e = i ? "O" : "[";
  return "\x1B" + e + n10;
}
function Yt(n10, i) {
  n10 = Math.floor(n10);
  let e = "";
  for (let t = 0; t < n10; t++) e += i;
  return e;
}
var ji = class {
  constructor(i) {
    this._bufferService = i;
    this.isSelectAllActive = false;
    this.selectionStartLength = 0;
  }
  clearSelection() {
    this.selectionStart = void 0, this.selectionEnd = void 0, this.isSelectAllActive = false, this.selectionStartLength = 0;
  }
  get finalSelectionStart() {
    return this.isSelectAllActive ? [0, 0] : !this.selectionEnd || !this.selectionStart ? this.selectionStart : this.areSelectionValuesReversed() ? this.selectionEnd : this.selectionStart;
  }
  get finalSelectionEnd() {
    if (this.isSelectAllActive) return [this._bufferService.cols, this._bufferService.buffer.ybase + this._bufferService.rows - 1];
    if (this.selectionStart) {
      if (!this.selectionEnd || this.areSelectionValuesReversed()) {
        let i = this.selectionStart[0] + this.selectionStartLength;
        return i > this._bufferService.cols ? i % this._bufferService.cols === 0 ? [this._bufferService.cols, this.selectionStart[1] + Math.floor(i / this._bufferService.cols) - 1] : [i % this._bufferService.cols, this.selectionStart[1] + Math.floor(i / this._bufferService.cols)] : [i, this.selectionStart[1]];
      }
      if (this.selectionStartLength && this.selectionEnd[1] === this.selectionStart[1]) {
        let i = this.selectionStart[0] + this.selectionStartLength;
        return i > this._bufferService.cols ? [i % this._bufferService.cols, this.selectionStart[1] + Math.floor(i / this._bufferService.cols)] : [Math.max(i, this.selectionEnd[0]), this.selectionEnd[1]];
      }
      return this.selectionEnd;
    }
  }
  areSelectionValuesReversed() {
    let i = this.selectionStart, e = this.selectionEnd;
    return !i || !e ? false : i[1] > e[1] || i[1] === e[1] && i[0] > e[0];
  }
  handleTrim(i) {
    return this.selectionStart && (this.selectionStart[1] -= i), this.selectionEnd && (this.selectionEnd[1] -= i), this.selectionEnd && this.selectionEnd[1] < 0 ? (this.clearSelection(), true) : this.selectionStart && this.selectionStart[1] < 0 ? (this.selectionStart = [0, 0], true) : false;
  }
};
function fs(n10, i) {
  if (n10.start.y > n10.end.y) throw new Error(`Buffer range end (${n10.end.x}, ${n10.end.y}) cannot be before start (${n10.start.x}, ${n10.start.y})`);
  return i * (n10.end.y - n10.start.y) + (n10.end.x - n10.start.x + 1);
}
var ao = "\xA0";
var lo = new RegExp(ao, "g");
var Et = class extends g {
  constructor(e, t, r, s4, o3, a, l3, h, d, c) {
    super();
    this._element = e;
    this._screenElement = t;
    this._linkifier = r;
    this._bufferService = s4;
    this._coreService = o3;
    this._mouseCoordsService = a;
    this._optionsService = l3;
    this._mouseStateService = h;
    this._renderService = d;
    this._coreBrowserService = c;
    this._dragScrollAmount = 0;
    this._enabled = true;
    this._trimListener = this._register(new P());
    this._workCell = new F();
    this._mouseDownTimeStamp = 0;
    this._oldHasSelection = false;
    this._oldSelectionStart = void 0;
    this._oldSelectionEnd = void 0;
    this._onLinuxMouseSelection = this._register(new b());
    this.onLinuxMouseSelection = this._onLinuxMouseSelection.event;
    this._onRedrawRequest = this._register(new b());
    this.onRequestRedraw = this._onRedrawRequest.event;
    this._onSelectionChange = this._register(new b());
    this.onSelectionChange = this._onSelectionChange.event;
    this._onRequestScrollLines = this._register(new b());
    this.onRequestScrollLines = this._onRequestScrollLines.event;
    this._mouseMoveListener = (u) => this._handleMouseMove(u), this._mouseUpListener = (u) => this._handleMouseUp(u), this._coreService.onUserInput(() => {
      this.hasSelection && this.clearSelection();
    }), this._trimListener.value = this._bufferService.buffer.lines.onTrim((u) => this._handleTrim(u)), this._register(this._bufferService.buffers.onBufferActivate((u) => this._handleBufferActivate(u))), this.enable(), this._model = new ji(this._bufferService), this._activeSelectionMode = 0, this._register(E(() => {
      this._removeMouseDownListeners();
    })), this._register(this._bufferService.onResize((u) => {
      u.rowsChanged && this.clearSelection();
    }));
  }
  reset() {
    this.clearSelection();
  }
  disable() {
    this.clearSelection(), this._enabled = false;
  }
  enable() {
    this._enabled = true;
  }
  get selectionStart() {
    return this._model.finalSelectionStart;
  }
  get selectionEnd() {
    return this._model.finalSelectionEnd;
  }
  get hasSelection() {
    let e = this._model.finalSelectionStart, t = this._model.finalSelectionEnd;
    return !e || !t ? false : e[0] !== t[0] || e[1] !== t[1];
  }
  get selectionText() {
    let e = this._model.finalSelectionStart, t = this._model.finalSelectionEnd;
    if (!e || !t) return "";
    let r = this._bufferService.buffer, s4 = [];
    if (this._activeSelectionMode === 3) {
      if (e[0] === t[0]) return "";
      let a = e[0] < t[0] ? e[0] : t[0], l3 = e[0] < t[0] ? t[0] : e[0];
      for (let h = e[1]; h <= t[1]; h++) {
        let d = r.translateBufferLineToString(h, true, a, l3);
        s4.push(d);
      }
    } else {
      let a = e[1] === t[1] ? t[0] : void 0;
      s4.push(r.translateBufferLineToString(e[1], true, e[0], a));
      for (let l3 = e[1] + 1; l3 <= t[1] - 1; l3++) {
        let h = r.lines.get(l3), d = r.translateBufferLineToString(l3, true);
        h?.isWrapped ? s4[s4.length - 1] += d : s4.push(d);
      }
      if (e[1] !== t[1]) {
        let l3 = r.lines.get(t[1]), h = r.translateBufferLineToString(t[1], true, 0, t[0]);
        l3 && l3.isWrapped ? s4[s4.length - 1] += h : s4.push(h);
      }
    }
    return s4.map((a) => a.replace(lo, " ")).join(Ue ? `\r
` : `
`);
  }
  clearSelection() {
    this._model.clearSelection(), this._removeMouseDownListeners(), this.refresh(), this._onSelectionChange.fire();
  }
  refresh(e) {
    this._refreshAnimationFrame || (this._refreshAnimationFrame = this._coreBrowserService.window.requestAnimationFrame(() => this._refresh())), zt && e && this.selectionText.length && this._onLinuxMouseSelection.fire(this.selectionText);
  }
  _refresh() {
    this._refreshAnimationFrame = void 0, this._onRedrawRequest.fire({ start: this._model.finalSelectionStart, end: this._model.finalSelectionEnd, columnSelectMode: this._activeSelectionMode === 3 });
  }
  _isClickInSelection(e) {
    let t = this._getMouseBufferCoords(e), r = this._model.finalSelectionStart, s4 = this._model.finalSelectionEnd;
    return !r || !s4 || !t ? false : this._areCoordsInSelection(t, r, s4);
  }
  isCellInSelection(e, t) {
    let r = this._model.finalSelectionStart, s4 = this._model.finalSelectionEnd;
    return !r || !s4 ? false : this._areCoordsInSelection([e, t], r, s4);
  }
  _areCoordsInSelection(e, t, r) {
    return e[1] > t[1] && e[1] < r[1] || t[1] === r[1] && e[1] === t[1] && e[0] >= t[0] && e[0] < r[0] || t[1] < r[1] && e[1] === r[1] && e[0] < r[0] || t[1] < r[1] && e[1] === t[1] && e[0] >= t[0];
  }
  _selectWordAtCursor(e, t) {
    let r = this._linkifier.currentLink?.link?.range;
    if (r) return this._model.selectionStart = [r.start.x - 1, r.start.y - 1], this._model.selectionStartLength = fs(r, this._bufferService.cols), this._model.selectionEnd = void 0, true;
    let s4 = this._getMouseBufferCoords(e);
    return s4 ? (this._selectWordAt(s4, t), this._model.selectionEnd = void 0, true) : false;
  }
  selectAll() {
    this._model.isSelectAllActive = true, this.refresh(), this._onSelectionChange.fire();
  }
  selectLines(e, t) {
    this._model.clearSelection(), e = Math.max(e, 0), t = Math.min(t, this._bufferService.buffer.lines.length - 1), this._model.selectionStart = [0, e], this._model.selectionEnd = [this._bufferService.cols, t], this.refresh(), this._onSelectionChange.fire();
  }
  _handleTrim(e) {
    this._model.handleTrim(e) && this.refresh();
  }
  _getMouseBufferCoords(e) {
    let t = this._mouseCoordsService.getCoords(e, this._screenElement, this._bufferService.cols, this._bufferService.rows, true);
    if (t) return t[0]--, t[1]--, t[1] += this._bufferService.buffer.ydisp, t;
  }
  _getMouseEventScrollAmount(e) {
    let t = qt(this._coreBrowserService.window, e, this._screenElement)[1], r = this._renderService.dimensions.css.canvas.height;
    return t >= 0 && t <= r ? 0 : (t > r && (t -= r), t = Math.min(Math.max(t, -50), 50), t /= 50, t / Math.abs(t) + Math.round(t * 14));
  }
  shouldForceSelection(e) {
    return this._optionsService.rawOptions.mouseEventsRequireAlt && this._mouseStateService.areMouseEventsActive ? !e.altKey : ie ? e.altKey && this._optionsService.rawOptions.macOptionClickForcesSelection : e.shiftKey;
  }
  handleMouseDown(e) {
    if (this._mouseDownTimeStamp = e.timeStamp, !(e.button === 2 && this.hasSelection) && e.button === 0 && !(this._optionsService.rawOptions.mouseEventsRequireAlt && this._mouseStateService.areMouseEventsActive && e.altKey)) {
      if (!this._enabled) {
        if (!this.shouldForceSelection(e)) return;
        e.stopPropagation();
      }
      e.preventDefault(), this._dragScrollAmount = 0, this._enabled && e.shiftKey ? this._handleIncrementalClick(e) : e.detail === 1 ? this._handleSingleClick(e) : e.detail === 2 ? this._handleDoubleClick(e) : e.detail === 3 && this._handleTripleClick(e), this._addMouseDownListeners(), this.refresh(true);
    }
  }
  _addMouseDownListeners() {
    this._screenElement.ownerDocument && (this._screenElement.ownerDocument.addEventListener("mousemove", this._mouseMoveListener), this._screenElement.ownerDocument.addEventListener("mouseup", this._mouseUpListener)), this._dragScrollIntervalTimer = this._coreBrowserService.window.setInterval(() => this._dragScroll(), 50);
  }
  _removeMouseDownListeners() {
    this._screenElement.ownerDocument && (this._screenElement.ownerDocument.removeEventListener("mousemove", this._mouseMoveListener), this._screenElement.ownerDocument.removeEventListener("mouseup", this._mouseUpListener)), this._coreBrowserService.window.clearInterval(this._dragScrollIntervalTimer), this._dragScrollIntervalTimer = void 0;
  }
  _handleIncrementalClick(e) {
    this._model.selectionStart && (this._model.selectionEnd = this._getMouseBufferCoords(e));
  }
  _handleSingleClick(e) {
    let t = this.hasSelection;
    if (this._model.selectionStartLength = 0, this._model.isSelectAllActive = false, this._activeSelectionMode = this.shouldColumnSelect(e) ? 3 : 0, this._model.selectionStart = this._getMouseBufferCoords(e), !this._model.selectionStart) return;
    this._model.selectionEnd = void 0, t && this._fireOnSelectionChange(this._model.finalSelectionStart, this._model.finalSelectionEnd, false);
    let r = this._bufferService.buffer.lines.get(this._model.selectionStart[1]);
    r && r.length !== this._model.selectionStart[0] && r.hasWidth(this._model.selectionStart[0]) === 0 && this._model.selectionStart[0]++;
  }
  _handleDoubleClick(e) {
    this._selectWordAtCursor(e, true) && (this._activeSelectionMode = 1);
  }
  _handleTripleClick(e) {
    let t = this._getMouseBufferCoords(e);
    t && (this._activeSelectionMode = 2, this._selectLineAt(t[1]));
  }
  shouldColumnSelect(e) {
    return this._optionsService.rawOptions.mouseEventsRequireAlt && this._mouseStateService.areMouseEventsActive ? false : e.altKey && !(ie && this._optionsService.rawOptions.macOptionClickForcesSelection);
  }
  _handleMouseMove(e) {
    if (e.stopImmediatePropagation(), !this._model.selectionStart) return;
    let t = this._model.selectionEnd ? [this._model.selectionEnd[0], this._model.selectionEnd[1]] : null;
    if (this._model.selectionEnd = this._getMouseBufferCoords(e), !this._model.selectionEnd) {
      this.refresh(true);
      return;
    }
    this._activeSelectionMode === 2 ? this._model.selectionEnd[1] < this._model.selectionStart[1] ? this._model.selectionEnd[0] = 0 : this._model.selectionEnd[0] = this._bufferService.cols : this._activeSelectionMode === 1 && this._selectToWordAt(this._model.selectionEnd), this._dragScrollAmount = this._getMouseEventScrollAmount(e), this._activeSelectionMode !== 3 && (this._dragScrollAmount > 0 ? this._model.selectionEnd[0] = this._bufferService.cols : this._dragScrollAmount < 0 && (this._model.selectionEnd[0] = 0));
    let r = this._bufferService.buffer;
    if (this._model.selectionEnd[1] < r.lines.length) {
      let s4 = r.lines.get(this._model.selectionEnd[1]);
      s4 && s4.hasWidth(this._model.selectionEnd[0]) === 0 && this._model.selectionEnd[0] < this._bufferService.cols && this._model.selectionEnd[0]++;
    }
    (!t || t[0] !== this._model.selectionEnd[0] || t[1] !== this._model.selectionEnd[1]) && this.refresh(true);
  }
  _dragScroll() {
    if (!(!this._model.selectionEnd || !this._model.selectionStart) && this._dragScrollAmount) {
      this._onRequestScrollLines.fire({ amount: this._dragScrollAmount, suppressScrollEvent: false });
      let e = this._bufferService.buffer;
      this._dragScrollAmount > 0 ? (this._activeSelectionMode !== 3 && (this._model.selectionEnd[0] = this._bufferService.cols), this._model.selectionEnd[1] = Math.min(e.ydisp + this._bufferService.rows - 1, e.lines.length - 1)) : (this._activeSelectionMode !== 3 && (this._model.selectionEnd[0] = 0), this._model.selectionEnd[1] = e.ydisp), this.refresh();
    }
  }
  _handleMouseUp(e) {
    let t = e.timeStamp - this._mouseDownTimeStamp;
    if (this._removeMouseDownListeners(), this.selectionText.length <= 1 && t < 500 && e.altKey && this._optionsService.rawOptions.altClickMovesCursor) {
      if (this._bufferService.buffer.ybase === this._bufferService.buffer.ydisp) {
        let r = this._mouseCoordsService.getCoords(e, this._element, this._bufferService.cols, this._bufferService.rows, false);
        if (r && r[0] !== void 0 && r[1] !== void 0) {
          let s4 = tn(r[0] - 1, r[1] - 1, this._bufferService, this._coreService.decPrivateModes.applicationCursorKeys);
          this._coreService.triggerDataEvent(s4, true);
        }
      }
    } else this._fireEventIfSelectionChanged();
  }
  _fireEventIfSelectionChanged() {
    let e = this._model.finalSelectionStart, t = this._model.finalSelectionEnd, r = !!e && !!t && (e[0] !== t[0] || e[1] !== t[1]);
    if (!r) {
      this._oldHasSelection && this._fireOnSelectionChange(e, t, r);
      return;
    }
    !e || !t || (!this._oldSelectionStart || !this._oldSelectionEnd || e[0] !== this._oldSelectionStart[0] || e[1] !== this._oldSelectionStart[1] || t[0] !== this._oldSelectionEnd[0] || t[1] !== this._oldSelectionEnd[1]) && this._fireOnSelectionChange(e, t, r);
  }
  _fireOnSelectionChange(e, t, r) {
    this._oldSelectionStart = e, this._oldSelectionEnd = t, this._oldHasSelection = r, this._onSelectionChange.fire();
  }
  _handleBufferActivate(e) {
    this.clearSelection(), this._trimListener.value = e.activeBuffer.lines.onTrim((t) => this._handleTrim(t));
  }
  _convertViewportColToCharacterIndex(e, t) {
    let r = t;
    for (let s4 = 0; t >= s4; s4++) {
      let o3 = e.loadCell(s4, this._workCell).getChars().length;
      this._workCell.getWidth() === 0 ? r-- : o3 > 1 && t !== s4 && (r += o3 - 1);
    }
    return r;
  }
  setSelection(e, t, r) {
    this._model.clearSelection(), this._removeMouseDownListeners(), this._model.selectionStart = [e, t], this._model.selectionStartLength = r, this.refresh(), this._fireEventIfSelectionChanged();
  }
  rightClickSelect(e) {
    this._isClickInSelection(e) || (this._selectWordAtCursor(e, false) && this.refresh(true), this._fireEventIfSelectionChanged());
  }
  _getWordAt(e, t, r = true, s4 = true) {
    if (e[0] >= this._bufferService.cols) return;
    let o3 = this._bufferService.buffer, a = o3.lines.get(e[1]);
    if (!a) return;
    let l3 = o3.translateBufferLineToString(e[1], false), h = this._convertViewportColToCharacterIndex(a, e[0]), d = h, c = e[0] - h, u = 0, _ = 0, p = 0, v = 0;
    if (l3.charAt(h) === " ") {
      for (; h > 0 && l3.charAt(h - 1) === " "; ) h--;
      for (; d < l3.length && l3.charAt(d + 1) === " "; ) d++;
    } else {
      let I = e[0], w2 = e[0];
      a.getWidth(I) === 0 && (u++, I--), a.getWidth(w2) === 2 && (_++, w2++);
      let L = a.getString(w2).length;
      for (L > 1 && (v += L - 1, d += L - 1); I > 0 && h > 0 && !this._isCharWordSeparator(a.loadCell(I - 1, this._workCell)); ) {
        a.loadCell(I - 1, this._workCell);
        let T2 = this._workCell.getChars().length;
        this._workCell.getWidth() === 0 ? (u++, I--) : T2 > 1 && (p += T2 - 1, h -= T2 - 1), h--, I--;
      }
      for (; w2 < a.length && d + 1 < l3.length && !this._isCharWordSeparator(a.loadCell(w2 + 1, this._workCell)); ) {
        a.loadCell(w2 + 1, this._workCell);
        let T2 = this._workCell.getChars().length;
        this._workCell.getWidth() === 2 ? (_++, w2++) : T2 > 1 && (v += T2 - 1, d += T2 - 1), d++, w2++;
      }
    }
    d++;
    let f2 = h + c - u + p, S = Math.min(this._bufferService.cols, d - h + u + _ - p - v);
    if (!(!t && l3.slice(h, d).trim() === "")) {
      if (r && f2 === 0 && a.getCodePoint(0) !== 32) {
        let I = o3.lines.get(e[1] - 1);
        if (I && a.isWrapped && I.getCodePoint(this._bufferService.cols - 1) !== 32) {
          let w2 = this._getWordAt([this._bufferService.cols - 1, e[1] - 1], false, true, false);
          if (w2) {
            let L = this._bufferService.cols - w2.start;
            f2 -= L, S += L;
          }
        }
      }
      if (s4 && f2 + S === this._bufferService.cols && a.getCodePoint(this._bufferService.cols - 1) !== 32) {
        let I = o3.lines.get(e[1] + 1);
        if (I?.isWrapped && I.getCodePoint(0) !== 32) {
          let w2 = this._getWordAt([0, e[1] + 1], false, false, true);
          w2 && (S += w2.length);
        }
      }
      return { start: f2, length: S };
    }
  }
  _selectWordAt(e, t) {
    let r = this._getWordAt(e, t);
    if (r) {
      for (; r.start < 0; ) r.start += this._bufferService.cols, e[1]--;
      this._model.selectionStart = [r.start, e[1]], this._model.selectionStartLength = r.length;
    }
  }
  _selectToWordAt(e) {
    let t = this._getWordAt(e, true);
    if (t) {
      let r = e[1];
      for (; t.start < 0; ) t.start += this._bufferService.cols, r--;
      if (!this._model.areSelectionValuesReversed()) for (; t.start + t.length > this._bufferService.cols; ) t.length -= this._bufferService.cols, r++;
      this._model.selectionEnd = [this._model.areSelectionValuesReversed() ? t.start : t.start + t.length, r];
    }
  }
  _isCharWordSeparator(e) {
    return e.getWidth() === 0 ? false : this._optionsService.rawOptions.wordSeparator.indexOf(e.getChars()) >= 0;
  }
  _selectLineAt(e) {
    let t = this._bufferService.buffer.getWrappedRangeForLine(e), r = { start: { x: 0, y: t.first }, end: { x: this._bufferService.cols - 1, y: t.last } };
    this._model.selectionStart = [0, t.first], this._model.selectionEnd = void 0, this._model.selectionStartLength = fs(r, this._bufferService.cols);
  }
};
Et = y([m(3, D), m(4, Y), m(5, Pe), m(6, R), m(7, Me), m(8, V), m(9, G)], Et);
var jt = class {
  constructor() {
    this._data = {};
  }
  set(i, e, t) {
    this._data[i] || (this._data[i] = {}), this._data[i][e] = t;
  }
  get(i, e) {
    return this._data[i] ? this._data[i][e] : void 0;
  }
  clear() {
    this._data = {};
  }
};
var Zt = class {
  constructor() {
    this._color = new jt();
    this._css = new jt();
  }
  setCss(i, e, t) {
    this._css.set(i, e, t);
  }
  getCss(i, e) {
    return this._css.get(i, e);
  }
  setColor(i, e, t) {
    this._color.set(i, e, t);
  }
  getColor(i, e) {
    return this._color.get(i, e);
  }
  clear() {
    this._color.clear(), this._css.clear();
  }
};
var $ = Object.freeze((() => {
  let n10 = [B.toColor("#2e3436"), B.toColor("#cc0000"), B.toColor("#4e9a06"), B.toColor("#c4a000"), B.toColor("#3465a4"), B.toColor("#75507b"), B.toColor("#06989a"), B.toColor("#d3d7cf"), B.toColor("#555753"), B.toColor("#ef2929"), B.toColor("#8ae234"), B.toColor("#fce94f"), B.toColor("#729fcf"), B.toColor("#ad7fa8"), B.toColor("#34e2e2"), B.toColor("#eeeeec")], i = [0, 95, 135, 175, 215, 255];
  for (let e = 0; e < 216; e++) {
    let t = i[e / 36 % 6 | 0], r = i[e / 6 % 6 | 0], s4 = i[e % 6];
    n10.push({ css: O.toCss(t, r, s4), rgba: O.toRgba(t, r, s4) });
  }
  for (let e = 0; e < 24; e++) {
    let t = 8 + e * 10;
    n10.push({ css: O.toCss(t, t, t), rgba: O.toRgba(t, t, t) });
  }
  return n10;
})());
var qe = B.toColor("#ffffff");
var Qt = B.toColor("#000000");
var nn = B.toColor("#ffffff");
var on = Qt;
var Jt = { css: "rgba(255, 255, 255, 0.3)", rgba: 4294967117 };
var co = qe;
var yt = class extends g {
  constructor(e) {
    super();
    this._optionsService = e;
    this._contrastCache = new Zt();
    this._halfContrastCache = new Zt();
    this._onChangeColors = this._register(new b());
    this.onChangeColors = this._onChangeColors.event;
    this._colors = { foreground: qe, background: Qt, cursor: nn, cursorAccent: on, selectionForeground: void 0, selectionBackgroundTransparent: Jt, selectionBackgroundOpaque: k.blend(Qt, Jt), selectionInactiveBackgroundTransparent: Jt, selectionInactiveBackgroundOpaque: k.blend(Qt, Jt), scrollbarSliderBackground: k.opacity(qe, 0.2), scrollbarSliderHoverBackground: k.opacity(qe, 0.4), scrollbarSliderActiveBackground: k.opacity(qe, 0.5), overviewRulerBorder: qe, ansi: $.slice(), contrastCache: this._contrastCache, halfContrastCache: this._halfContrastCache }, this._updateRestoreColors(), this._setTheme(this._optionsService.rawOptions.theme), this._register(this._optionsService.onSpecificOptionChange("minimumContrastRatio", () => this._contrastCache.clear())), this._register(this._optionsService.onSpecificOptionChange("theme", () => this._setTheme(this._optionsService.rawOptions.theme)));
  }
  get colors() {
    return this._colors;
  }
  _setTheme(e = {}) {
    let t = this._colors;
    if (t.foreground = M(e.foreground, qe), t.background = M(e.background, Qt), t.cursor = k.blend(t.background, M(e.cursor, nn)), t.cursorAccent = k.blend(t.background, M(e.cursorAccent, on)), t.selectionBackgroundTransparent = M(e.selectionBackground, Jt), t.selectionBackgroundOpaque = k.blend(t.background, t.selectionBackgroundTransparent), t.selectionInactiveBackgroundTransparent = M(e.selectionInactiveBackground, t.selectionBackgroundTransparent), t.selectionInactiveBackgroundOpaque = k.blend(t.background, t.selectionInactiveBackgroundTransparent), t.selectionForeground = e.selectionForeground ? M(e.selectionForeground, ts) : void 0, t.selectionForeground === ts && (t.selectionForeground = void 0), k.isOpaque(t.selectionBackgroundTransparent) && (t.selectionBackgroundTransparent = k.opacity(t.selectionBackgroundTransparent, 0.3)), k.isOpaque(t.selectionInactiveBackgroundTransparent) && (t.selectionInactiveBackgroundTransparent = k.opacity(t.selectionInactiveBackgroundTransparent, 0.3)), t.scrollbarSliderBackground = M(e.scrollbarSliderBackground, k.opacity(t.foreground, 0.2)), t.scrollbarSliderHoverBackground = M(e.scrollbarSliderHoverBackground, k.opacity(t.foreground, 0.4)), t.scrollbarSliderActiveBackground = M(e.scrollbarSliderActiveBackground, k.opacity(t.foreground, 0.5)), t.overviewRulerBorder = M(e.overviewRulerBorder, co), t.ansi = $.slice(), t.ansi[0] = M(e.black, $[0]), t.ansi[1] = M(e.red, $[1]), t.ansi[2] = M(e.green, $[2]), t.ansi[3] = M(e.yellow, $[3]), t.ansi[4] = M(e.blue, $[4]), t.ansi[5] = M(e.magenta, $[5]), t.ansi[6] = M(e.cyan, $[6]), t.ansi[7] = M(e.white, $[7]), t.ansi[8] = M(e.brightBlack, $[8]), t.ansi[9] = M(e.brightRed, $[9]), t.ansi[10] = M(e.brightGreen, $[10]), t.ansi[11] = M(e.brightYellow, $[11]), t.ansi[12] = M(e.brightBlue, $[12]), t.ansi[13] = M(e.brightMagenta, $[13]), t.ansi[14] = M(e.brightCyan, $[14]), t.ansi[15] = M(e.brightWhite, $[15]), e.extendedAnsi) {
      let r = Math.min(t.ansi.length - 16, e.extendedAnsi.length);
      for (let s4 = 0; s4 < r; s4++) t.ansi[s4 + 16] = M(e.extendedAnsi[s4], $[s4 + 16]);
    }
    this._contrastCache.clear(), this._halfContrastCache.clear(), this._updateRestoreColors(), this._onChangeColors.fire(this.colors);
  }
  restoreColor(e) {
    this._restoreColor(e), this._onChangeColors.fire(this.colors);
  }
  _restoreColor(e) {
    if (e === void 0) {
      for (let t = 0; t < this._restoreColors.ansi.length; ++t) this._colors.ansi[t] = this._restoreColors.ansi[t];
      return;
    }
    switch (e) {
      case 256:
        this._colors.foreground = this._restoreColors.foreground;
        break;
      case 257:
        this._colors.background = this._restoreColors.background;
        break;
      case 258:
        this._colors.cursor = this._restoreColors.cursor;
        break;
      default:
        this._colors.ansi[e] = this._restoreColors.ansi[e];
    }
  }
  modifyColors(e) {
    e(this._colors), this._onChangeColors.fire(this.colors);
  }
  _updateRestoreColors() {
    this._restoreColors = { foreground: this._colors.foreground, background: this._colors.background, cursor: this._colors.cursor, ansi: this._colors.ansi.slice() };
  }
};
yt = y([m(0, R)], yt);
function M(n10, i) {
  if (n10 !== void 0) try {
    return B.toColor(n10);
  } catch {
  }
  return i;
}
var ho = { 48: ["0", ")"], 49: ["1", "!"], 50: ["2", "@"], 51: ["3", "#"], 52: ["4", "$"], 53: ["5", "%"], 54: ["6", "^"], 55: ["7", "&"], 56: ["8", "*"], 57: ["9", "("], 186: [";", ":"], 187: ["=", "+"], 188: [",", "<"], 189: ["-", "_"], 190: [".", ">"], 191: ["/", "?"], 192: ["`", "~"], 219: ["[", "{"], 220: ["\\", "|"], 221: ["]", "}"], 222: ["'", '"'] };
function ln(n10, i, e, t) {
  let r = { type: 0, cancel: false, key: void 0 }, s4 = (n10.shiftKey ? 1 : 0) | (n10.altKey ? 2 : 0) | (n10.ctrlKey ? 4 : 0) | (n10.metaKey ? 8 : 0);
  switch (n10.keyCode) {
    case 0:
      n10.key === "UIKeyInputUpArrow" ? i ? r.key = "\x1BOA" : r.key = "\x1B[A" : n10.key === "UIKeyInputLeftArrow" ? i ? r.key = "\x1BOD" : r.key = "\x1B[D" : n10.key === "UIKeyInputRightArrow" ? i ? r.key = "\x1BOC" : r.key = "\x1B[C" : n10.key === "UIKeyInputDownArrow" && (i ? r.key = "\x1BOB" : r.key = "\x1B[B");
      break;
    case 8:
      r.key = n10.ctrlKey ? "\b" : "\x7F", n10.altKey && (r.key = "\x1B" + r.key);
      break;
    case 9:
      if (n10.shiftKey) {
        r.key = "\x1B[Z";
        break;
      }
      r.key = "	", r.cancel = true;
      break;
    case 13:
      n10.key === "c" && n10.ctrlKey ? r.key = "" : r.key = n10.altKey ? "\x1B\r" : "\r", r.cancel = true;
      break;
    case 27:
      r.key = "\x1B", n10.altKey && (r.key = "\x1B\x1B"), r.cancel = true;
      break;
    case 37:
      if (n10.metaKey) break;
      s4 ? r.key = "\x1B[1;" + (s4 + 1) + "D" : i ? r.key = "\x1BOD" : r.key = "\x1B[D";
      break;
    case 39:
      if (n10.metaKey) break;
      s4 ? r.key = "\x1B[1;" + (s4 + 1) + "C" : i ? r.key = "\x1BOC" : r.key = "\x1B[C";
      break;
    case 38:
      if (n10.metaKey) break;
      s4 ? r.key = "\x1B[1;" + (s4 + 1) + "A" : i ? r.key = "\x1BOA" : r.key = "\x1B[A";
      break;
    case 40:
      if (n10.metaKey) break;
      s4 ? r.key = "\x1B[1;" + (s4 + 1) + "B" : i ? r.key = "\x1BOB" : r.key = "\x1B[B";
      break;
    case 45:
      !n10.shiftKey && !n10.ctrlKey && (r.key = "\x1B[2~");
      break;
    case 46:
      s4 ? r.key = "\x1B[3;" + (s4 + 1) + "~" : r.key = "\x1B[3~";
      break;
    case 36:
      s4 ? r.key = "\x1B[1;" + (s4 + 1) + "H" : i ? r.key = "\x1BOH" : r.key = "\x1B[H";
      break;
    case 35:
      s4 ? r.key = "\x1B[1;" + (s4 + 1) + "F" : i ? r.key = "\x1BOF" : r.key = "\x1B[F";
      break;
    case 33:
      n10.shiftKey ? r.type = 2 : n10.ctrlKey ? r.key = "\x1B[5;" + (s4 + 1) + "~" : r.key = "\x1B[5~";
      break;
    case 34:
      n10.shiftKey ? r.type = 3 : n10.ctrlKey ? r.key = "\x1B[6;" + (s4 + 1) + "~" : r.key = "\x1B[6~";
      break;
    case 112:
      s4 ? r.key = "\x1B[1;" + (s4 + 1) + "P" : r.key = "\x1BOP";
      break;
    case 113:
      s4 ? r.key = "\x1B[1;" + (s4 + 1) + "Q" : r.key = "\x1BOQ";
      break;
    case 114:
      s4 ? r.key = "\x1B[1;" + (s4 + 1) + "R" : r.key = "\x1BOR";
      break;
    case 115:
      s4 ? r.key = "\x1B[1;" + (s4 + 1) + "S" : r.key = "\x1BOS";
      break;
    case 116:
      s4 ? r.key = "\x1B[15;" + (s4 + 1) + "~" : r.key = "\x1B[15~";
      break;
    case 117:
      s4 ? r.key = "\x1B[17;" + (s4 + 1) + "~" : r.key = "\x1B[17~";
      break;
    case 118:
      s4 ? r.key = "\x1B[18;" + (s4 + 1) + "~" : r.key = "\x1B[18~";
      break;
    case 119:
      s4 ? r.key = "\x1B[19;" + (s4 + 1) + "~" : r.key = "\x1B[19~";
      break;
    case 120:
      s4 ? r.key = "\x1B[20;" + (s4 + 1) + "~" : r.key = "\x1B[20~";
      break;
    case 121:
      s4 ? r.key = "\x1B[21;" + (s4 + 1) + "~" : r.key = "\x1B[21~";
      break;
    case 122:
      s4 ? r.key = "\x1B[23;" + (s4 + 1) + "~" : r.key = "\x1B[23~";
      break;
    case 123:
      s4 ? r.key = "\x1B[24;" + (s4 + 1) + "~" : r.key = "\x1B[24~";
      break;
    default:
      if (n10.ctrlKey && !n10.shiftKey && !n10.altKey && !n10.metaKey) n10.keyCode >= 65 && n10.keyCode <= 90 ? r.key = String.fromCharCode(n10.keyCode - 64) : n10.keyCode === 32 ? r.key = "\0" : n10.keyCode >= 51 && n10.keyCode <= 55 ? r.key = String.fromCharCode(n10.keyCode - 51 + 27) : n10.keyCode === 56 ? r.key = "\x7F" : n10.key === "/" ? r.key = "" : n10.keyCode === 219 ? r.key = "\x1B" : n10.keyCode === 220 ? r.key = "" : n10.keyCode === 221 && (r.key = "");
      else if ((!e || t) && n10.altKey && !n10.metaKey) {
        let a = ho[n10.keyCode]?.[n10.shiftKey ? 1 : 0];
        if (a) r.key = "\x1B" + a;
        else if (n10.keyCode >= 65 && n10.keyCode <= 90) {
          let l3 = n10.ctrlKey ? n10.keyCode - 64 : n10.keyCode + 32, h = String.fromCharCode(l3);
          n10.shiftKey && (h = h.toUpperCase()), r.key = "\x1B" + h;
        } else if (n10.keyCode === 32) r.key = "\x1B" + (n10.ctrlKey ? "\0" : " ");
        else if (n10.key === "Dead" && n10.code.startsWith("Key")) {
          let l3 = n10.code.slice(3, 4);
          n10.shiftKey || (l3 = l3.toLowerCase()), r.key = "\x1B" + l3, r.cancel = true;
        }
      } else if (e && !n10.altKey && !n10.ctrlKey && !n10.shiftKey && n10.metaKey) n10.keyCode === 65 && (r.type = 1);
      else if (n10.key && !n10.ctrlKey && !n10.altKey && !n10.metaKey && n10.keyCode >= 48 && n10.key.length === 1) r.key = n10.key;
      else if (n10.key && n10.ctrlKey && n10.shiftKey) switch (n10.code) {
        case "Minus":
          r.key = "";
          break;
        case "Digit2":
          r.key = "\0";
          break;
        case "Digit6":
          r.key = "";
          break;
      }
      break;
  }
  return r;
}
var ei = class {
  constructor() {
    this._functionalKeyCodes = { Escape: 27, Enter: 13, Tab: 9, Backspace: 127, CapsLock: 57358, ScrollLock: 57359, NumLock: 57360, PrintScreen: 57361, Pause: 57362, ContextMenu: 57363, F13: 57376, F14: 57377, F15: 57378, F16: 57379, F17: 57380, F18: 57381, F19: 57382, F20: 57383, F21: 57384, F22: 57385, F23: 57386, F24: 57387, F25: 57388, KP_0: 57399, KP_1: 57400, KP_2: 57401, KP_3: 57402, KP_4: 57403, KP_5: 57404, KP_6: 57405, KP_7: 57406, KP_8: 57407, KP_9: 57408, KP_Decimal: 57409, KP_Divide: 57410, KP_Multiply: 57411, KP_Subtract: 57412, KP_Add: 57413, KP_Enter: 57414, KP_Equal: 57415, ShiftLeft: 57441, ShiftRight: 57447, ControlLeft: 57442, ControlRight: 57448, AltLeft: 57443, AltRight: 57449, MetaLeft: 57444, MetaRight: 57450, MediaPlayPause: 57430, MediaStop: 57432, MediaTrackNext: 57435, MediaTrackPrevious: 57436, AudioVolumeDown: 57438, AudioVolumeUp: 57439, AudioVolumeMute: 57440 };
    this._csiTildeKeys = { Insert: 2, Delete: 3, PageUp: 5, PageDown: 6, F5: 15, F6: 17, F7: 18, F8: 19, F9: 20, F10: 21, F11: 23, F12: 24 };
    this._csiLetterKeys = { ArrowUp: "A", ArrowDown: "B", ArrowRight: "C", ArrowLeft: "D", Home: "H", End: "F" };
    this._ss3FunctionKeys = { F1: "P", F2: "Q", F3: "R", F4: "S" };
  }
  _getNumpadKeyCode(i) {
    if (i.code.startsWith("Numpad")) {
      let e = i.code.slice(6);
      if (e >= "0" && e <= "9") return 57399 + parseInt(e, 10);
      switch (e) {
        case "Decimal":
          return 57409;
        case "Divide":
          return 57410;
        case "Multiply":
          return 57411;
        case "Subtract":
          return 57412;
        case "Add":
          return 57413;
        case "Enter":
          return 57414;
        case "Equal":
          return 57415;
      }
    }
  }
  _getModifierKeyCode(i) {
    switch (i.code) {
      case "ShiftLeft":
        return 57441;
      case "ShiftRight":
        return 57447;
      case "ControlLeft":
        return 57442;
      case "ControlRight":
        return 57448;
      case "AltLeft":
        return 57443;
      case "AltRight":
        return 57449;
      case "MetaLeft":
        return 57444;
      case "MetaRight":
        return 57450;
    }
  }
  _encodeModifiers(i) {
    let e = 0;
    return i.shiftKey && (e |= 1), i.altKey && (e |= 2), i.ctrlKey && (e |= 4), i.metaKey && (e |= 8), e > 0 ? e + 1 : 0;
  }
  _getKeyCode(i, e) {
    let t = this._getNumpadKeyCode(i);
    if (t !== void 0) return t;
    let r = this._getModifierKeyCode(i);
    if (r !== void 0) return r;
    let s4 = this._functionalKeyCodes[i.key];
    if (s4 !== void 0) return s4;
    if ((i.shiftKey || e && i.altKey) && i.code) {
      if (i.code.startsWith("Digit") && i.code.length === 6) {
        let o3 = i.code.charAt(5);
        if (o3 >= "0" && o3 <= "9") return o3.charCodeAt(0);
      }
      if (i.code.startsWith("Key") && i.code.length === 4) return i.code.charAt(3).toLowerCase().charCodeAt(0);
    }
    if (i.key.length === 1) {
      let o3 = i.key.codePointAt(0);
      return o3 >= 65 && o3 <= 90 ? o3 + 32 : o3;
    }
  }
  _isModifierKey(i) {
    return i.key === "Shift" || i.key === "Control" || i.key === "Alt" || i.key === "Meta";
  }
  _isLockKey(i) {
    return i.key === "CapsLock" || i.key === "NumLock" || i.key === "ScrollLock";
  }
  _buildCsiLetterSequence(i, e, t, r) {
    let s4 = r && t !== 1;
    if (e > 0 || s4) {
      let o3 = "\x1B[1;" + (e > 0 ? e : "1");
      return s4 && (o3 += ":" + t), o3 += i, o3;
    }
    return "\x1B[" + i;
  }
  _buildSs3Sequence(i, e, t, r) {
    let s4 = r && t !== 1;
    if (e > 0 || s4) {
      let o3 = "\x1B[1;" + (e > 0 ? e : "1");
      return s4 && (o3 += ":" + t), o3 += i, o3;
    }
    return "\x1BO" + i;
  }
  _buildCsiTildeSequence(i, e, t, r) {
    let s4 = r && t !== 1, o3 = "\x1B[" + i;
    return (e > 0 || s4) && (o3 += ";" + (e > 0 ? e : "1"), s4 && (o3 += ":" + t)), o3 += "~", o3;
  }
  _buildCsiUSequence(i, e, t, r, s4, o3, a) {
    let l3 = !!(s4 & 2), h = !!(s4 & 4), d = "\x1B[" + e, c;
    h && i.shiftKey && i.key.length === 1 && !o3 && !a && (c = i.key.codePointAt(0), d += ":" + c);
    let _ = !!(s4 & 16) && r !== 3 && i.key.length === 1 && !o3 && !a && !i.ctrlKey ? i.key.codePointAt(0) : void 0, p = l3 && r !== 1 && (r === 3 || _ === void 0);
    return (t > 0 || p || _ !== void 0) && (d += ";", t > 0 ? d += t : p && (d += "1"), p && (d += ":" + r)), _ !== void 0 && (d += ";" + _), d += "u", d;
  }
  evaluate(i, e, t = 1, r = false) {
    let s4 = { type: 0, cancel: false, key: void 0 }, o3 = this._encodeModifiers(i), a = this._isModifierKey(i), l3 = !!(e & 2);
    if (!l3 && t === 3 || a && !(e & 8) || this._isLockKey(i) && !(e & 8)) return s4;
    let h = this._csiLetterKeys[i.key];
    if (h) return s4.key = this._buildCsiLetterSequence(h, o3, t, l3), s4.cancel = true, s4;
    let d = this._ss3FunctionKeys[i.key];
    if (d) return s4.key = this._buildSs3Sequence(d, o3, t, l3), s4.cancel = true, s4;
    let c = this._csiTildeKeys[i.key];
    if (c !== void 0) return s4.key = this._buildCsiTildeSequence(c, o3, t, l3), s4.cancel = true, s4;
    let u = this._getKeyCode(i, r);
    if (u === void 0) return s4;
    let _ = u === 13 || u === 9 || u === 127;
    if (_ && t === 3 && !(e & 8)) return s4;
    let p = this._functionalKeyCodes[i.key] !== void 0 || this._getNumpadKeyCode(i) !== void 0;
    if (!!(e & 8 || l3 && t === 3 || (e & 1 || l3) && (p && !_ || o3 > 0 && i.key.length !== 1 || o3 - 1 > 1))) s4.key = this._buildCsiUSequence(i, u, o3, t, e, p, a), s4.cancel = true;
    else {
      let f2 = u === 13 ? "\r" : u === 9 ? "	" : u === 127 ? "\x7F" : void 0;
      f2 ? s4.key = f2 : i.key.length === 1 && !i.ctrlKey && !i.altKey && !i.metaKey && (s4.key = i.key);
    }
    return s4;
  }
  static shouldUseProtocol(i) {
    return i > 0;
  }
};
var Zi = class {
  constructor() {
    this._codeToVk = { KeyA: 65, KeyB: 66, KeyC: 67, KeyD: 68, KeyE: 69, KeyF: 70, KeyG: 71, KeyH: 72, KeyI: 73, KeyJ: 74, KeyK: 75, KeyL: 76, KeyM: 77, KeyN: 78, KeyO: 79, KeyP: 80, KeyQ: 81, KeyR: 82, KeyS: 83, KeyT: 84, KeyU: 85, KeyV: 86, KeyW: 87, KeyX: 88, KeyY: 89, KeyZ: 90, Digit0: 48, Digit1: 49, Digit2: 50, Digit3: 51, Digit4: 52, Digit5: 53, Digit6: 54, Digit7: 55, Digit8: 56, Digit9: 57, F1: 112, F2: 113, F3: 114, F4: 115, F5: 116, F6: 117, F7: 118, F8: 119, F9: 120, F10: 121, F11: 122, F12: 123, F13: 124, F14: 125, F15: 126, F16: 127, F17: 128, F18: 129, F19: 130, F20: 131, F21: 132, F22: 133, F23: 134, F24: 135, Numpad0: 96, Numpad1: 97, Numpad2: 98, Numpad3: 99, Numpad4: 100, Numpad5: 101, Numpad6: 102, Numpad7: 103, Numpad8: 104, Numpad9: 105, NumpadMultiply: 106, NumpadAdd: 107, NumpadSeparator: 108, NumpadSubtract: 109, NumpadDecimal: 110, NumpadDivide: 111, NumpadEnter: 13, NumLock: 144, ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, Home: 36, End: 35, PageUp: 33, PageDown: 34, Insert: 45, Delete: 46, ShiftLeft: 16, ShiftRight: 16, ControlLeft: 17, ControlRight: 17, AltLeft: 18, AltRight: 18, MetaLeft: 91, MetaRight: 92, CapsLock: 20, ScrollLock: 145, Escape: 27, Enter: 13, Tab: 9, Space: 32, Backspace: 8, Pause: 19, ContextMenu: 93, PrintScreen: 44, Semicolon: 186, Equal: 187, Comma: 188, Minus: 189, Period: 190, Slash: 191, Backquote: 192, BracketLeft: 219, Backslash: 220, BracketRight: 221, Quote: 222, IntlBackslash: 226 };
    this._codeToScancode = { KeyQ: 16, KeyW: 17, KeyE: 18, KeyR: 19, KeyT: 20, KeyY: 21, KeyU: 22, KeyI: 23, KeyO: 24, KeyP: 25, KeyA: 30, KeyS: 31, KeyD: 32, KeyF: 33, KeyG: 34, KeyH: 35, KeyJ: 36, KeyK: 37, KeyL: 38, KeyZ: 44, KeyX: 45, KeyC: 46, KeyV: 47, KeyB: 48, KeyN: 49, KeyM: 50, Digit1: 2, Digit2: 3, Digit3: 4, Digit4: 5, Digit5: 6, Digit6: 7, Digit7: 8, Digit8: 9, Digit9: 10, Digit0: 11, F1: 59, F2: 60, F3: 61, F4: 62, F5: 63, F6: 64, F7: 65, F8: 66, F9: 67, F10: 68, F11: 87, F12: 88, Numpad0: 82, Numpad1: 79, Numpad2: 80, Numpad3: 81, Numpad4: 75, Numpad5: 76, Numpad6: 77, Numpad7: 71, Numpad8: 72, Numpad9: 73, NumpadMultiply: 55, NumpadAdd: 78, NumpadSubtract: 74, NumpadDecimal: 83, NumpadDivide: 53, NumpadEnter: 28, NumLock: 69, ArrowUp: 72, ArrowDown: 80, ArrowLeft: 75, ArrowRight: 77, Home: 71, End: 79, PageUp: 73, PageDown: 81, Insert: 82, Delete: 83, ShiftLeft: 42, ShiftRight: 54, ControlLeft: 29, ControlRight: 29, AltLeft: 56, AltRight: 56, CapsLock: 58, ScrollLock: 70, Escape: 1, Enter: 28, Tab: 15, Space: 57, Backspace: 14, Pause: 69, Semicolon: 39, Equal: 13, Comma: 51, Minus: 12, Period: 52, Slash: 53, Backquote: 41, BracketLeft: 26, Backslash: 43, BracketRight: 27, Quote: 40 };
    this._enhancedKeyCodes = /* @__PURE__ */ new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown", "Insert", "Delete", "NumpadEnter", "NumpadDivide", "ControlRight", "AltRight", "PrintScreen", "Pause", "ContextMenu", "MetaLeft", "MetaRight"]);
    this._keyToControlChar = { Enter: 13, Backspace: 8, Tab: 9, Escape: 27 };
  }
  _getVirtualKeyCode(i) {
    let e = this._codeToVk[i.code];
    return e !== void 0 ? e : i.keyCode || 0;
  }
  _getScanCode(i) {
    return this._codeToScancode[i.code] || 0;
  }
  _getUnicodeChar(i) {
    if (i.ctrlKey && !i.altKey && !i.metaKey) {
      if (i.key === "Enter") return 10;
      if (i.key === "Backspace") return 127;
    }
    let e = this._keyToControlChar[i.key];
    if (e !== void 0) return e;
    if (i.key.length === 1) {
      let t = i.key.codePointAt(0) || 0;
      if (i.ctrlKey && !i.altKey && !i.metaKey) {
        if (t >= 65 && t <= 90) return t - 64;
        if (t >= 97 && t <= 122) return t - 96;
      }
      return t;
    }
    return 0;
  }
  _getControlKeyState(i) {
    let e = 0;
    return i.shiftKey && (e |= 16), i.ctrlKey && (i.code === "ControlRight" ? e |= 4 : e |= 8), i.altKey && (i.code === "AltRight" ? e |= 1 : e |= 2), this._enhancedKeyCodes.has(i.code) && (e |= 256), e;
  }
  evaluateKeyboardEvent(i, e) {
    let t = this._getVirtualKeyCode(i), r = this._getScanCode(i), s4 = this._getUnicodeChar(i), o3 = e ? 1 : 0, a = this._getControlKeyState(i);
    return { type: 0, cancel: true, key: `\x1B[${t};${r};${s4};${o3};${a};1_` };
  }
};
var xt = class {
  constructor(i, e) {
    this._coreService = i;
    this._optionsService = e;
  }
  _getWin32InputMode() {
    return this._win32InputMode ??= new Zi(), this._win32InputMode;
  }
  _getKittyKeyboard() {
    return this._kittyKeyboard ??= new ei(), this._kittyKeyboard;
  }
  evaluateKeyDown(i) {
    if (this.useWin32InputMode) return this._getWin32InputMode().evaluateKeyboardEvent(i, true);
    let e = this._coreService.kittyKeyboard.flags;
    return this.useKitty ? this._getKittyKeyboard().evaluate(i, e, i.repeat ? 2 : 1, ie && this._optionsService.rawOptions.macOptionIsMeta) : ln(i, this._coreService.decPrivateModes.applicationCursorKeys, ie, this._optionsService.rawOptions.macOptionIsMeta);
  }
  evaluateKeyUp(i) {
    if (this.useWin32InputMode) return this._getWin32InputMode().evaluateKeyboardEvent(i, false);
    let e = this._coreService.kittyKeyboard.flags;
    if (this.useKitty && e & 2) return this._getKittyKeyboard().evaluate(i, e, 3, ie && this._optionsService.rawOptions.macOptionIsMeta);
  }
  get useKitty() {
    let i = this._coreService.kittyKeyboard.flags;
    return !!(this._optionsService.rawOptions.vtExtensions?.kittyKeyboard && ei.shouldUseProtocol(i));
  }
  get useWin32InputMode() {
    return !!(this._optionsService.rawOptions.vtExtensions?.win32InputMode && this._coreService.decPrivateModes.win32InputMode);
  }
};
xt = y([m(0, Y), m(1, R)], xt);
var ps = class {
  constructor(...i) {
    this._entries = /* @__PURE__ */ new Map();
    for (let [e, t] of i) this.set(e, t);
  }
  set(i, e) {
    let t = this._entries.get(i);
    return this._entries.set(i, e), t;
  }
  forEach(i) {
    for (let [e, t] of this._entries.entries()) i(e, t);
  }
  has(i) {
    return this._entries.has(i);
  }
  get(i) {
    return this._entries.get(i);
  }
};
var Ji = class {
  constructor() {
    this._services = new ps();
    this._services.set(Qe, this);
  }
  setService(i, e) {
    this._services.set(i, e);
  }
  getService(i) {
    return this._services.get(i);
  }
  createInstance(i, ...e) {
    let t = Hs(i).sort((o3, a) => o3.index - a.index), r = [];
    for (let o3 of t) {
      let a = this._services.get(o3.id);
      if (!a) throw new Error(`[createInstance] ${i.name} depends on UNKNOWN service ${o3.id._id}.`);
      r.push(a);
    }
    let s4 = t.length > 0 ? t[0].index : e.length;
    if (e.length !== s4) throw new Error(`[createInstance] First service dependency of ${i.name} at position ${s4 + 1} conflicts with ${e.length} static arguments`);
    return new i(...e, ...r);
  }
};
var uo = { trace: 0, debug: 1, info: 2, warn: 3, error: 4, off: 5 };
var fo = "xterm.js: ";
var wt = class extends g {
  constructor(e) {
    super();
    this._optionsService = e;
    this._logLevel = 5;
    this._updateLogLevel(), this._register(this._optionsService.onSpecificOptionChange("logLevel", () => this._updateLogLevel()));
  }
  get logLevel() {
    return this._logLevel;
  }
  _updateLogLevel() {
    this._logLevel = uo[this._optionsService.rawOptions.logLevel];
  }
  _evalLazyOptionalParams(e) {
    for (let t = 0; t < e.length; t++) typeof e[t] == "function" && (e[t] = e[t]());
  }
  _log(e, t, r) {
    this._evalLazyOptionalParams(r), e.call(console, (this._optionsService.options.logger ? "" : fo) + t, ...r);
  }
  trace(e, ...t) {
    this._logLevel <= 0 && this._log(this._optionsService.options.logger?.trace.bind(this._optionsService.options.logger) ?? console.log, e, t);
  }
  debug(e, ...t) {
    this._logLevel <= 1 && this._log(this._optionsService.options.logger?.debug.bind(this._optionsService.options.logger) ?? console.log, e, t);
  }
  info(e, ...t) {
    this._logLevel <= 2 && this._log(this._optionsService.options.logger?.info.bind(this._optionsService.options.logger) ?? console.info, e, t);
  }
  warn(e, ...t) {
    this._logLevel <= 3 && this._log(this._optionsService.options.logger?.warn.bind(this._optionsService.options.logger) ?? console.warn, e, t);
  }
  error(e, ...t) {
    this._logLevel <= 4 && this._log(this._optionsService.options.logger?.error.bind(this._optionsService.options.logger) ?? console.error, e, t);
  }
};
wt = y([m(0, R)], wt);
var ti = class extends g {
  constructor(e) {
    super();
    this._maxLength = e;
    this.onDeleteEmitter = this._register(new b());
    this.onDelete = this.onDeleteEmitter.event;
    this.onInsertEmitter = this._register(new b());
    this.onInsert = this.onInsertEmitter.event;
    this.onTrimEmitter = this._register(new b());
    this.onTrim = this.onTrimEmitter.event;
    this._array = new Array(this._maxLength), this._startIndex = 0, this._length = 0;
  }
  get maxLength() {
    return this._maxLength;
  }
  set maxLength(e) {
    if (this._maxLength === e) return;
    let t = new Array(e);
    for (let r = 0; r < Math.min(e, this.length); r++) t[r] = this._array[this._getCyclicIndex(r)];
    this._array = t, this._maxLength = e, this._startIndex = 0;
  }
  get length() {
    return this._length;
  }
  set length(e) {
    if (e > this._length) for (let t = this._length; t < e; t++) this._array[t] = void 0;
    this._length = e;
  }
  get(e) {
    return this._array[this._getCyclicIndex(e)];
  }
  set(e, t) {
    this._array[this._getCyclicIndex(e)] = t;
  }
  push(e) {
    this._array[this._getCyclicIndex(this._length)] = e, this._length === this._maxLength ? (this._startIndex = ++this._startIndex % this._maxLength, this.onTrimEmitter.fire(1)) : this._length++;
  }
  recycle() {
    if (this._length !== this._maxLength) throw new Error("Can only recycle when the buffer is full");
    return this._startIndex = ++this._startIndex % this._maxLength, this.onTrimEmitter.fire(1), this._array[this._getCyclicIndex(this._length - 1)];
  }
  get isFull() {
    return this._length === this._maxLength;
  }
  pop() {
    return this._array[this._getCyclicIndex(this._length-- - 1)];
  }
  splice(e, t, ...r) {
    if (t) {
      for (let s4 = e; s4 < this._length - t; s4++) this._array[this._getCyclicIndex(s4)] = this._array[this._getCyclicIndex(s4 + t)];
      this._length -= t, this.onDeleteEmitter.fire({ index: e, amount: t });
    }
    for (let s4 = this._length - 1; s4 >= e; s4--) this._array[this._getCyclicIndex(s4 + r.length)] = this._array[this._getCyclicIndex(s4)];
    for (let s4 = 0; s4 < r.length; s4++) this._array[this._getCyclicIndex(e + s4)] = r[s4];
    if (r.length && this.onInsertEmitter.fire({ index: e, amount: r.length }), this._length + r.length > this._maxLength) {
      let s4 = this._length + r.length - this._maxLength;
      this._startIndex += s4, this._length = this._maxLength, this.onTrimEmitter.fire(s4);
    } else this._length += r.length;
  }
  trimStart(e) {
    e > this._length && (e = this._length), this._startIndex += e, this._length -= e, this.onTrimEmitter.fire(e);
  }
  shiftElements(e, t, r) {
    if (!(t <= 0)) {
      if (e < 0 || e >= this._length) throw new Error("start argument out of range");
      if (e + r < 0) throw new Error("Cannot shift elements in list beyond index 0");
      if (r > 0) {
        for (let o3 = t - 1; o3 >= 0; o3--) this.set(e + o3 + r, this.get(e + o3));
        let s4 = e + t + r - this._length;
        if (s4 > 0) for (this._length += s4; this._length > this._maxLength; ) this._length--, this._startIndex++, this.onTrimEmitter.fire(1);
      } else for (let s4 = 0; s4 < t; s4++) this.set(e + s4 + r, this.get(e + s4));
    }
  }
  _getCyclicIndex(e) {
    return (this._startIndex + e) % this._maxLength;
  }
};
var ii = class {
  constructor() {
    this._chunks = [];
    this._length = 0;
  }
  get length() {
    return this._length;
  }
  reset() {
    this._chunks.length = 0, this._length = 0;
  }
  append(i) {
    this._chunks.push(i), this._length += i.length;
  }
  toString() {
    return this._chunks.join("");
  }
};
var We = class {
  constructor(i) {
    this._limit = i;
    this._builder = new ii();
  }
  get length() {
    return this._builder.length;
  }
  get limit() {
    return this._limit;
  }
  reset() {
    this._builder.reset();
  }
  append(i) {
    return this._builder.append(i), this._builder.length > this._limit ? (this._builder.reset(), true) : false;
  }
  toString() {
    return this._builder.toString();
  }
};
var U = Object.freeze(new ue());
var Qi = 0;
var hn = new F();
var er = new ii();
var De = class n7 {
  constructor(i, e, t, r = false) {
    this._stringCache = i;
    this.isWrapped = r;
    this._combined = {};
    this._extendedAttrs = {};
    this._data = new Uint32Array(e * 3);
    let s4 = t ?? F.fromCharData([0, "", 1, 0]);
    for (let o3 = 0; o3 < e; ++o3) this.setCell(o3, s4);
    this.length = e;
  }
  get(i) {
    let e = this._data[i * 3 + 0], t = e & 2097151;
    return [this._data[i * 3 + 1], e & 2097152 ? this._combined[i] : t ? be(t) : "", e >> 22, e & 2097152 ? this._combined[i].charCodeAt(this._combined[i].length - 1) : t];
  }
  set(i, e) {
    this._invalidateStringCache(), this._data[i * 3 + 1] = e[0], e[1].length > 1 ? (this._combined[i] = e[1], this._data[i * 3 + 0] = i | 2097152 | e[2] << 22) : this._data[i * 3 + 0] = e[1].charCodeAt(0) | e[2] << 22;
  }
  getWidth(i) {
    return this._data[i * 3 + 0] >> 22;
  }
  hasWidth(i) {
    return this._data[i * 3 + 0] & 12582912;
  }
  getFg(i) {
    return this._data[i * 3 + 1];
  }
  getBg(i) {
    return this._data[i * 3 + 2];
  }
  hasContent(i) {
    return this._data[i * 3 + 0] & 4194303;
  }
  getCodePoint(i) {
    let e = this._data[i * 3 + 0];
    return e & 2097152 ? this._combined[i].charCodeAt(this._combined[i].length - 1) : e & 2097151;
  }
  isCombined(i) {
    return this._data[i * 3 + 0] & 2097152;
  }
  getString(i) {
    let e = this._data[i * 3 + 0];
    return e & 2097152 ? this._combined[i] : e & 2097151 ? be(e & 2097151) : "";
  }
  isProtected(i) {
    return this._data[i * 3 + 2] & 536870912;
  }
  loadCell(i, e) {
    return Qi = i * 3, e.content = this._data[Qi + 0], e.fg = this._data[Qi + 1], e.bg = this._data[Qi + 2], e.content & 2097152 ? e.combinedData = this._combined[i] : e.combinedData = "", e.bg & 268435456 ? e.extended = this._extendedAttrs[i] : e.extended = U.extended.clone(), e;
  }
  setCell(i, e) {
    this._invalidateStringCache(), e.content & 2097152 && (this._combined[i] = e.combinedData), e.bg & 268435456 && (this._extendedAttrs[i] = e.extended), this._data[i * 3 + 0] = e.content, this._data[i * 3 + 1] = e.fg, this._data[i * 3 + 2] = e.bg;
  }
  setCellFromCodepoint(i, e, t, r) {
    this._invalidateStringCache(), r.bg & 268435456 && (this._extendedAttrs[i] = r.extended), this._data[i * 3 + 0] = e | t << 22, this._data[i * 3 + 1] = r.fg, this._data[i * 3 + 2] = r.bg;
  }
  addCodepointToCell(i, e, t) {
    this._invalidateStringCache();
    let r = this._data[i * 3 + 0];
    r & 2097152 ? this._combined[i] += be(e) : r & 2097151 ? (this._combined[i] = be(r & 2097151) + be(e), r &= -2097152, r |= 2097152) : r = e | 1 << 22, t && (r &= -12582913, r |= t << 22), this._data[i * 3 + 0] = r;
  }
  insertCells(i, e, t) {
    if (this._invalidateStringCache(), i %= this.length, i && this.getWidth(i - 1) === 2 && this.setCellFromCodepoint(i - 1, 0, 1, t), e < this.length - i) {
      for (let r = this.length - i - e - 1; r >= 0; --r) this.setCell(i + e + r, this.loadCell(i + r, hn));
      for (let r = 0; r < e; ++r) this.setCell(i + r, t);
    } else for (let r = i; r < this.length; ++r) this.setCell(r, t);
    this.getWidth(this.length - 1) === 2 && this.setCellFromCodepoint(this.length - 1, 0, 1, t);
  }
  deleteCells(i, e, t) {
    if (this._invalidateStringCache(), i %= this.length, e < this.length - i) {
      for (let r = 0; r < this.length - i - e; ++r) this.setCell(i + r, this.loadCell(i + e + r, hn));
      for (let r = this.length - e; r < this.length; ++r) this.setCell(r, t);
    } else for (let r = i; r < this.length; ++r) this.setCell(r, t);
    i && this.getWidth(i - 1) === 2 && this.setCellFromCodepoint(i - 1, 0, 1, t), this.getWidth(i) === 0 && !this.hasContent(i) && this.setCellFromCodepoint(i, 0, 1, t);
  }
  replaceCells(i, e, t, r = false) {
    if (this._invalidateStringCache(), r) {
      for (i && this.getWidth(i - 1) === 2 && !this.isProtected(i - 1) && this.setCellFromCodepoint(i - 1, 0, 1, t), e < this.length && this.getWidth(e - 1) === 2 && !this.isProtected(e) && this.setCellFromCodepoint(e, 0, 1, t); i < e && i < this.length; ) this.isProtected(i) || this.setCell(i, t), i++;
      return;
    }
    for (i && this.getWidth(i - 1) === 2 && this.setCellFromCodepoint(i - 1, 0, 1, t), e < this.length && this.getWidth(e - 1) === 2 && this.setCellFromCodepoint(e, 0, 1, t); i < e && i < this.length; ) this.setCell(i++, t);
  }
  resize(i, e) {
    if (this._invalidateStringCache(), i === this.length) return this._data.length * 4 * 2 < this._data.buffer.byteLength;
    let t = i * 3;
    if (i > this.length) {
      if (this._data.buffer.byteLength >= t * 4) this._data = new Uint32Array(this._data.buffer, 0, t);
      else {
        let r = new Uint32Array(t);
        r.set(this._data), this._data = r;
      }
      for (let r = this.length; r < i; ++r) this.setCell(r, e);
    } else {
      this._data = this._data.subarray(0, t);
      let r = Object.keys(this._combined);
      for (let o3 = 0; o3 < r.length; o3++) {
        let a = parseInt(r[o3], 10);
        a >= i && delete this._combined[a];
      }
      let s4 = Object.keys(this._extendedAttrs);
      for (let o3 = 0; o3 < s4.length; o3++) {
        let a = parseInt(s4[o3], 10);
        a >= i && delete this._extendedAttrs[a];
      }
    }
    return this.length = i, t * 4 * 2 < this._data.buffer.byteLength;
  }
  cleanupMemory() {
    if (this._data.length * 4 * 2 < this._data.buffer.byteLength) {
      let i = new Uint32Array(this._data.length);
      return i.set(this._data), this._data = i, 1;
    }
    return 0;
  }
  fill(i, e = false) {
    if (this._invalidateStringCache(), e) {
      for (let t = 0; t < this.length; ++t) this.isProtected(t) || this.setCell(t, i);
      return;
    }
    this._combined = {}, this._extendedAttrs = {};
    for (let t = 0; t < this.length; ++t) this.setCell(t, i);
  }
  copyFrom(i) {
    this._invalidateStringCache(), this.length !== i.length ? this._data = new Uint32Array(i._data) : this._data.set(i._data), this.length = i.length, this._copySparseMapsFrom(i), this.isWrapped = i.isWrapped;
  }
  clone() {
    let i = new n7(this._stringCache, 0, void 0, false);
    return i._data = new Uint32Array(this._data), i.length = this.length, i._copySparseMapsFrom(this), i.isWrapped = this.isWrapped, i;
  }
  getTrimmedLength() {
    for (let i = this.length - 1; i >= 0; --i) if (this._data[i * 3 + 0] & 4194303) return i + (this._data[i * 3 + 0] >> 22);
    return 0;
  }
  getNoBgTrimmedLength() {
    for (let i = this.length - 1; i >= 0; --i) if (this._data[i * 3 + 0] & 4194303 || this._data[i * 3 + 2] & 50331648) return i + (this._data[i * 3 + 0] >> 22);
    return 0;
  }
  copyCellsFrom(i, e, t, r, s4) {
    this._invalidateStringCache();
    let o3 = i._data;
    if (s4) for (let a = r - 1; a >= 0; a--) {
      for (let l3 = 0; l3 < 3; l3++) this._data[(t + a) * 3 + l3] = o3[(e + a) * 3 + l3];
      this._copyCellMapsFrom(i, e + a, t + a);
    }
    else for (let a = 0; a < r; a++) {
      for (let l3 = 0; l3 < 3; l3++) this._data[(t + a) * 3 + l3] = o3[(e + a) * 3 + l3];
      this._copyCellMapsFrom(i, e + a, t + a);
    }
  }
  translateToString(i, e, t, r) {
    let s4 = (e === void 0 || e === 0) && t === void 0 && r === void 0;
    s4 && this._stringCache.touch?.();
    let o3 = s4 ? this._getStringCacheEntry(false) : void 0;
    if (s4 && o3?.value !== void 0) {
      if (i) return o3.isTrimmed ? o3.value : o3.value.trimEnd();
      if (!o3.isTrimmed) return o3.value;
    }
    for (e = e ?? 0, t = t ?? this.length, i && (t = Math.min(t, this.getTrimmedLength())), r && (r.length = 0), er.reset(); e < t; ) {
      let l3 = this._data[e * 3 + 0], h = l3 & 2097151, d = l3 & 2097152 ? this._combined[e] : h ? be(h) : " ";
      if (er.append(d), r) for (let c = 0; c < d.length; ++c) r.push(e);
      e += l3 >> 22 || 1;
    }
    r && r.push(e);
    let a = er.toString();
    if (er.reset(), s4) {
      let l3 = this._getStringCacheEntry(true);
      l3.value = a, l3.isTrimmed = !!i;
    }
    return a;
  }
  _getStringCacheEntry(i) {
    let e = this._stringCacheEntryRef?.deref();
    if (e && e.generation === this._stringCache.generation) return e;
    if (!i) return;
    let t = this._stringCache.allocateEntry();
    return this._stringCacheEntryRef = new WeakRef(t), t;
  }
  _invalidateStringCache() {
    let i = this._getStringCacheEntry(false);
    i && (i.value = void 0, i.isTrimmed = false);
  }
  _copyCellMapsFrom(i, e, t) {
    let r = e * 3;
    i._data[r + 0] & 2097152 && (this._combined[t] = i._combined[e]), i._data[r + 2] & 268435456 && (this._extendedAttrs[t] = i._extendedAttrs[e]);
  }
  _copySparseMapsFrom(i) {
    this._combined = {}, this._extendedAttrs = {};
    for (let e = 0; e < i.length; e++) this._copyCellMapsFrom(i, e, e);
  }
};
var tr = class extends g {
  constructor() {
    super();
    this.generation = 0;
    this.entries = /* @__PURE__ */ new Set();
    this._clearTimeout = this._register(new P());
    this._lastAccessTimestamp = 0;
    this._register(E(() => this.entries.clear()));
  }
  touch() {
    this._scheduleClear();
  }
  allocateEntry() {
    let e = { value: void 0, isTrimmed: false, generation: this.generation };
    return this.entries.add(e), this._scheduleClear(), e;
  }
  clear() {
    this._clearTimeout.clear(), this._lastAccessTimestamp = 0, this.generation++;
    for (let e of this.entries) e.value = void 0, e.isTrimmed = false;
    this.entries.clear();
  }
  _scheduleClear() {
    this._lastAccessTimestamp = Date.now(), !this._clearTimeout.value && this._scheduleClearTimeout(15e3);
  }
  _scheduleClearTimeout(e) {
    this._clearTimeout.value = Gs(() => {
      let t = Date.now() - this._lastAccessTimestamp;
      if (t >= 15e3) {
        this.clear();
        return;
      }
      this._scheduleClearTimeout(15e3 - t);
    }, e);
  }
};
function dn(n10, i, e, t, r, s4) {
  let o3 = [];
  for (let a = 0; a < n10.length - 1; a++) {
    let l3 = a, h = n10.get(++l3);
    if (!h.isWrapped) continue;
    let d = [n10.get(a)];
    for (; l3 < n10.length && h.isWrapped; ) d.push(h), h = n10.get(++l3);
    if (!s4 && t >= a && t < l3) {
      a += d.length - 1;
      continue;
    }
    let c = 0, u = Tt(d, c, i), _ = 1, p = 0;
    for (; _ < d.length; ) {
      let f2 = Tt(d, _, i), S = f2 - p, I = e - u, w2 = Math.min(S, I);
      d[c].copyCellsFrom(d[_], p, u, w2, false), u += w2, u === e && (c++, u = 0), p += w2, p === f2 && (_++, p = 0), u === 0 && c !== 0 && d[c - 1].getWidth(e - 1) === 2 && (d[c].copyCellsFrom(d[c - 1], e - 1, u++, 1, false), d[c - 1].setCell(e - 1, r));
    }
    d[c].replaceCells(u, e, r);
    let v = 0;
    for (let f2 = d.length - 1; f2 > 0 && (f2 > c || d[f2].getTrimmedLength() === 0); f2--) v++;
    v > 0 && (o3.push(a + d.length - v), o3.push(v)), a += d.length - 1;
  }
  return o3;
}
function un(n10, i) {
  let e = [], t = 0, r = i[t], s4 = 0;
  for (let o3 = 0; o3 < n10.length; o3++) if (r === o3) {
    let a = i[++t];
    n10.onDeleteEmitter.fire({ index: o3 - s4, amount: a }), o3 += a - 1, s4 += a, r = i[++t];
  } else e.push(o3);
  return { layout: e, countRemoved: s4 };
}
function fn(n10, i) {
  let e = [];
  for (let t = 0; t < i.length; t++) e.push(n10.get(i[t]));
  for (let t = 0; t < e.length; t++) n10.set(t, e[t]);
  n10.length = i.length;
}
function _n(n10, i, e) {
  let t = [], r = 0;
  for (let l3 = 0; l3 < n10.length; l3++) r += Tt(n10, l3, i);
  let s4 = 0, o3 = 0, a = 0;
  for (; a < r; ) {
    if (r - a < e) {
      t.push(r - a);
      break;
    }
    s4 += e;
    let l3 = Tt(n10, o3, i);
    s4 > l3 && (s4 -= l3, o3++);
    let h = n10[o3].getWidth(s4 - 1) === 2;
    h && s4--;
    let d = h ? e - 1 : e;
    t.push(d), a += d;
  }
  return t;
}
function Tt(n10, i, e) {
  if (i === n10.length - 1) return n10[i].getTrimmedLength();
  let t = !n10[i].hasContent(e - 1) && n10[i].getWidth(e - 1) === 1, r = n10[i + 1].getWidth(0) === 2;
  return t && r ? e - 1 : e;
}
var rr = class rr2 {
  constructor(i) {
    this.line = i;
    this.isDisposed = false;
    this._disposables = [];
    this._id = rr2._nextId++;
    this._onDispose = this.register(new b());
    this.onDispose = this._onDispose.event;
  }
  get id() {
    return this._id;
  }
  dispose() {
    this.isDisposed || (this.isDisposed = true, this.line = -1, this._onDispose.fire(), Oe(this._disposables), this._disposables.length = 0);
  }
  register(i) {
    return this._disposables.push(i), i;
  }
};
rr._nextId = 1;
var ir = rr;
var q = {};
var Re = q.B;
q[0] = { "`": "\u25C6", a: "\u2592", b: "\u2409", c: "\u240C", d: "\u240D", e: "\u240A", f: "\xB0", g: "\xB1", h: "\u2424", i: "\u240B", j: "\u2518", k: "\u2510", l: "\u250C", m: "\u2514", n: "\u253C", o: "\u23BA", p: "\u23BB", q: "\u2500", r: "\u23BC", s: "\u23BD", t: "\u251C", u: "\u2524", v: "\u2534", w: "\u252C", x: "\u2502", y: "\u2264", z: "\u2265", "{": "\u03C0", "|": "\u2260", "}": "\xA3", "~": "\xB7" };
q.A = { "#": "\xA3" };
q.B = void 0;
q[4] = { "#": "\xA3", "@": "\xBE", "[": "ij", "\\": "\xBD", "]": "|", "{": "\xA8", "|": "f", "}": "\xBC", "~": "\xB4" };
q.C = q[5] = { "[": "\xC4", "\\": "\xD6", "]": "\xC5", "^": "\xDC", "`": "\xE9", "{": "\xE4", "|": "\xF6", "}": "\xE5", "~": "\xFC" };
q.R = { "#": "\xA3", "@": "\xE0", "[": "\xB0", "\\": "\xE7", "]": "\xA7", "{": "\xE9", "|": "\xF9", "}": "\xE8", "~": "\xA8" };
q.Q = { "@": "\xE0", "[": "\xE2", "\\": "\xE7", "]": "\xEA", "^": "\xEE", "`": "\xF4", "{": "\xE9", "|": "\xF9", "}": "\xE8", "~": "\xFB" };
q.K = { "@": "\xA7", "[": "\xC4", "\\": "\xD6", "]": "\xDC", "{": "\xE4", "|": "\xF6", "}": "\xFC", "~": "\xDF" };
q.Y = { "#": "\xA3", "@": "\xA7", "[": "\xB0", "\\": "\xE7", "]": "\xE9", "`": "\xF9", "{": "\xE0", "|": "\xF2", "}": "\xE8", "~": "\xEC" };
q.E = q[6] = { "@": "\xC4", "[": "\xC6", "\\": "\xD8", "]": "\xC5", "^": "\xDC", "`": "\xE4", "{": "\xE6", "|": "\xF8", "}": "\xE5", "~": "\xFC" };
q.Z = { "#": "\xA3", "@": "\xA7", "[": "\xA1", "\\": "\xD1", "]": "\xBF", "{": "\xB0", "|": "\xF1", "}": "\xE7" };
q.H = q[7] = { "@": "\xC9", "[": "\xC4", "\\": "\xD6", "]": "\xC5", "^": "\xDC", "`": "\xE9", "{": "\xE4", "|": "\xF6", "}": "\xE5", "~": "\xFC" };
q["="] = { "#": "\xF9", "@": "\xE0", "[": "\xE9", "\\": "\xE7", "]": "\xEA", "^": "\xEE", _: "\xE8", "`": "\xF4", "{": "\xE4", "|": "\xF6", "}": "\xFC", "~": "\xFB" };
var pn = 4294967295;
var si = class extends g {
  constructor(e, t, r, s4) {
    super();
    this._hasScrollback = e;
    this._optionsService = t;
    this._bufferService = r;
    this._logService = s4;
    this.ydisp = 0;
    this.ybase = 0;
    this.y = 0;
    this.x = 0;
    this.tabs = {};
    this.savedY = 0;
    this.savedX = 0;
    this.savedCurAttrData = U.clone();
    this.savedCharset = Re;
    this.savedCharsets = [];
    this.savedGlevel = 0;
    this.savedOriginMode = false;
    this.savedWraparoundMode = true;
    this.markers = [];
    this._nullCell = F.fromCharData([0, "", 1, 0]);
    this._whitespaceCell = F.fromCharData([0, " ", 1, 32]);
    this._isClearing = false;
    this._memoryCleanupPosition = 0;
    this._cols = this._bufferService.cols, this._rows = this._bufferService.rows, this.lines = new ti(this._getCorrectBufferLength(this._rows)), this.scrollTop = 0, this.scrollBottom = this._rows - 1, this.setupTabStops(), this._memoryCleanupQueue = new It(this._logService), this._register(E(() => this._memoryCleanupQueue.clear())), this._register(E(() => this.clearAllMarkers())), this._stringCache = this._register(new tr());
  }
  getNullCell(e) {
    return e ? (this._nullCell.fg = e.fg, this._nullCell.bg = e.bg, this._nullCell.extended = e.extended) : (this._nullCell.fg = 0, this._nullCell.bg = 0, this._nullCell.extended = new ke()), this._nullCell;
  }
  getWhitespaceCell(e) {
    return e ? (this._whitespaceCell.fg = e.fg, this._whitespaceCell.bg = e.bg, this._whitespaceCell.extended = e.extended) : (this._whitespaceCell.fg = 0, this._whitespaceCell.bg = 0, this._whitespaceCell.extended = new ke()), this._whitespaceCell;
  }
  getBlankLine(e, t) {
    return new De(this._stringCache, this._bufferService.cols, this.getNullCell(e), t);
  }
  get hasScrollback() {
    return this._hasScrollback && this.lines.maxLength > this._rows;
  }
  get isCursorInViewport() {
    let t = this.ybase + this.y - this.ydisp;
    return t >= 0 && t < this._rows;
  }
  _getCorrectBufferLength(e) {
    if (!this._hasScrollback) return e;
    let t = e + this._optionsService.rawOptions.scrollback;
    return t > pn ? pn : t;
  }
  fillViewportRows(e) {
    if (this.lines.length === 0) {
      e ??= U;
      let t = this._rows;
      for (; t--; ) this.lines.push(this.getBlankLine(e));
    }
  }
  clear() {
    this._stringCache.clear(), this.ydisp = 0, this.ybase = 0, this.y = 0, this.x = 0, this.lines = new ti(this._getCorrectBufferLength(this._rows)), this.scrollTop = 0, this.scrollBottom = this._rows - 1, this.setupTabStops();
  }
  resize(e, t) {
    let r = this.getNullCell(U);
    this._stringCache.clear();
    let s4 = 0, o3 = this._getCorrectBufferLength(t);
    if (o3 > this.lines.maxLength && (this.lines.maxLength = o3), this.lines.length > 0) {
      if (this._cols < e) for (let l3 = 0; l3 < this.lines.length; l3++) s4 += +this.lines.get(l3).resize(e, r);
      let a = 0;
      if (this._rows < t) for (let l3 = this._rows; l3 < t; l3++) this.lines.length < t + this.ybase && (this._optionsService.rawOptions.windowsPty.backend !== void 0 || this._optionsService.rawOptions.windowsPty.buildNumber !== void 0 ? this.lines.push(new De(this._stringCache, e, r, false)) : this.ybase > 0 && this.lines.length <= this.ybase + this.y + a + 1 ? (this.ybase--, a++, this.ydisp > 0 && this.ydisp--) : this.lines.push(new De(this._stringCache, e, r, false)));
      else for (let l3 = this._rows; l3 > t; l3--) this.lines.length > t + this.ybase && (this.lines.length > this.ybase + this.y + 1 ? this.lines.pop() : (this.ybase++, this.ydisp++));
      if (o3 < this.lines.maxLength) {
        let l3 = this.lines.length - o3;
        l3 > 0 && (this.lines.trimStart(l3), this.ybase = Math.max(this.ybase - l3, 0), this.ydisp = Math.max(this.ydisp - l3, 0), this.savedY = Math.max(this.savedY - l3, 0)), this.lines.maxLength = o3;
      }
      this.x = Math.min(this.x, e - 1), this.y = Math.min(this.y, t - 1), a && (this.y += a), this.savedX = Math.min(this.savedX, e - 1), this.scrollTop = 0;
    }
    if (this.scrollBottom = t - 1, this._isReflowEnabled && (this._reflow(e, t), this._cols > e)) for (let a = 0; a < this.lines.length; a++) s4 += +this.lines.get(a).resize(e, r);
    if (this._cols = e, this._rows = t, this.lines.length > 0) {
      let a = Math.max(0, this.lines.length - this.ybase - 1);
      this.y = Math.min(this.y, a);
    }
    this._memoryCleanupQueue.clear(), s4 > 0.1 * this.lines.length && (this._memoryCleanupPosition = 0, this._memoryCleanupQueue.enqueue(() => this._batchedMemoryCleanup()));
  }
  _batchedMemoryCleanup() {
    let e = true;
    this._memoryCleanupPosition >= this.lines.length && (this._memoryCleanupPosition = 0, e = false);
    let t = 0;
    for (; this._memoryCleanupPosition < this.lines.length; ) if (t += this.lines.get(this._memoryCleanupPosition++).cleanupMemory(), t > 100) return true;
    return e;
  }
  get _isReflowEnabled() {
    let e = this._optionsService.rawOptions.windowsPty;
    return e && e.buildNumber ? this._hasScrollback && e.backend === "conpty" && e.buildNumber >= 21376 : this._hasScrollback;
  }
  _reflow(e, t) {
    this._cols !== e && (e > this._cols ? this._reflowLarger(e, t) : this._reflowSmaller(e, t));
  }
  _reflowLarger(e, t) {
    let r = this._optionsService.rawOptions.reflowCursorLine, s4 = dn(this.lines, this._cols, e, this.ybase + this.y, this.getNullCell(U), r);
    if (s4.length > 0) {
      let o3 = un(this.lines, s4);
      fn(this.lines, o3.layout), this._reflowLargerAdjustViewport(e, t, o3.countRemoved);
    }
  }
  _reflowLargerAdjustViewport(e, t, r) {
    let s4 = this.getNullCell(U), o3 = r;
    for (; o3-- > 0; ) this.ybase === 0 ? (this.y > 0 && this.y--, this.lines.length < t && this.lines.push(new De(this._stringCache, e, s4, false))) : (this.ydisp === this.ybase && this.ydisp--, this.ybase--);
    this.savedY = Math.max(this.savedY - r, 0);
  }
  _reflowSmaller(e, t) {
    let r = this._optionsService.rawOptions.reflowCursorLine, s4 = this.getNullCell(U), o3 = [], a = 0;
    for (let l3 = this.lines.length - 1; l3 >= 0; l3--) {
      let h = this.lines.get(l3);
      if (!h || !h.isWrapped && h.getTrimmedLength() <= e) continue;
      let d = [h];
      for (; h.isWrapped && l3 > 0; ) h = this.lines.get(--l3), d.unshift(h);
      if (!r) {
        let T2 = this.ybase + this.y;
        if (T2 >= l3 && T2 < l3 + d.length) continue;
      }
      let c = d[d.length - 1].getTrimmedLength(), u = _n(d, this._cols, e), _ = u.length - d.length, p;
      this.ybase === 0 && this.y !== this.lines.length - 1 ? p = Math.max(0, this.y - this.lines.maxLength + _) : p = Math.max(0, this.lines.length - this.lines.maxLength + _);
      let v = [];
      for (let T2 = 0; T2 < _; T2++) {
        let te2 = this.getBlankLine(U, true);
        v.push(te2);
      }
      v.length > 0 && (o3.push({ start: l3 + d.length + a, newLines: v }), a += v.length), d.push(...v);
      let f2 = u.length - 1, S = u[f2];
      S === 0 && (f2--, S = u[f2]);
      let I = d.length - _ - 1, w2 = c;
      for (; I >= 0; ) {
        let T2 = Math.min(w2, S);
        if (d[f2] === void 0) break;
        if (d[f2].copyCellsFrom(d[I], w2 - T2, S - T2, T2, true), S -= T2, S === 0 && (f2--, S = u[f2]), w2 -= T2, w2 === 0) {
          I--;
          let te2 = Math.max(I, 0);
          w2 = Tt(d, te2, this._cols);
        }
      }
      for (let T2 = 0; T2 < d.length; T2++) u[T2] < e && d[T2].setCell(u[T2], s4);
      let L = _ - p;
      for (; L-- > 0; ) this.ybase === 0 ? this.y < t - 1 ? (this.y++, this.lines.pop()) : (this.ybase++, this.ydisp++) : this.ybase < Math.min(this.lines.maxLength, this.lines.length + a) - t && (this.ybase === this.ydisp && this.ydisp++, this.ybase++);
      this.savedY = Math.min(this.savedY + _, this.ybase + t - 1);
    }
    if (o3.length > 0) {
      let l3 = [], h = [];
      for (let S = 0; S < this.lines.length; S++) h.push(this.lines.get(S));
      let d = this.lines.length, c = d - 1, u = 0, _ = o3[u];
      this.lines.length = Math.min(this.lines.maxLength, this.lines.length + a);
      let p = 0;
      for (let S = Math.min(this.lines.maxLength - 1, d + a - 1); S >= 0; S--) if (_ && _.start > c + p) {
        for (let I = _.newLines.length - 1; I >= 0; I--) this.lines.set(S--, _.newLines[I]);
        S++, l3.push({ index: c + 1, amount: _.newLines.length }), p += _.newLines.length, _ = o3[++u];
      } else this.lines.set(S, h[c--]);
      let v = 0;
      for (let S = l3.length - 1; S >= 0; S--) l3[S].index += v, this.lines.onInsertEmitter.fire(l3[S]), v += l3[S].amount;
      let f2 = Math.max(0, d + a - this.lines.maxLength);
      f2 > 0 && this.lines.onTrimEmitter.fire(f2);
    }
  }
  translateBufferLineToString(e, t, r = 0, s4) {
    let o3 = this.lines.get(e);
    return o3 ? o3.translateToString(t, r, s4) : "";
  }
  getWrappedRangeForLine(e) {
    let t = e, r = e;
    for (; t > 0 && this.lines.get(t).isWrapped; ) t--;
    for (; r + 1 < this.lines.length && this.lines.get(r + 1).isWrapped; ) r++;
    return { first: t, last: r };
  }
  setupTabStops(e) {
    for (e != null ? this.tabs[e] || (e = this.prevStop(e)) : (this.tabs = {}, e = 0); e < this._cols; e += this._optionsService.rawOptions.tabStopWidth) this.tabs[e] = true;
  }
  prevStop(e) {
    for (e ??= this.x; !this.tabs[--e] && e > 0; ) ;
    return e >= this._cols ? this._cols - 1 : e < 0 ? 0 : e;
  }
  nextStop(e) {
    for (e ??= this.x; !this.tabs[++e] && e < this._cols; ) ;
    return e >= this._cols ? this._cols - 1 : e < 0 ? 0 : e;
  }
  clearMarkers(e) {
    this._isClearing = true;
    for (let t = 0; t < this.markers.length; t++) this.markers[t].line === e && (this.markers[t].dispose(), this.markers.splice(t--, 1));
    this._isClearing = false;
  }
  clearAllMarkers() {
    this._isClearing = true;
    for (let e = 0; e < this.markers.length; e++) this.markers[e].dispose();
    this.markers.length = 0, this._isClearing = false;
  }
  addMarker(e) {
    let t = new ir(e);
    return this.markers.push(t), t.register(this.lines.onTrim((r) => {
      t.line -= r, t.line < 0 && t.dispose();
    })), t.register(this.lines.onInsert((r) => {
      t.line >= r.index && (t.line += r.amount);
    })), t.register(this.lines.onDelete((r) => {
      t.line >= r.index && t.line < r.index + r.amount && t.dispose(), t.line > r.index && (t.line -= r.amount);
    })), t.register(t.onDispose(() => this._removeMarker(t))), t;
  }
  _removeMarker(e) {
    this._isClearing || this.markers.splice(this.markers.indexOf(e), 1);
  }
};
var sr = class extends g {
  constructor(e, t, r) {
    super();
    this._optionsService = e;
    this._bufferService = t;
    this._logService = r;
    this._normalBuffer = this._register(new P());
    this._altBuffer = this._register(new P());
    this._onBufferActivate = this._register(new b());
    this.onBufferActivate = this._onBufferActivate.event;
    this.reset(), this._register(this._optionsService.onSpecificOptionChange("scrollback", () => this.resize(this._bufferService.cols, this._bufferService.rows))), this._register(this._optionsService.onSpecificOptionChange("tabStopWidth", () => this.setupTabStops()));
  }
  reset() {
    this._normal = new si(true, this._optionsService, this._bufferService, this._logService), this._normalBuffer.value = this._normal, this._normal.fillViewportRows(), this._alt = new si(false, this._optionsService, this._bufferService, this._logService), this._altBuffer.value = this._alt, this._activeBuffer = this._normal, this._onBufferActivate.fire({ activeBuffer: this._normal, inactiveBuffer: this._alt }), this.setupTabStops();
  }
  get alt() {
    return this._alt;
  }
  get active() {
    return this._activeBuffer;
  }
  get normal() {
    return this._normal;
  }
  activateNormalBuffer() {
    this._activeBuffer !== this._normal && (this._normal.x = this._alt.x, this._normal.y = this._alt.y, this._alt.clearAllMarkers(), this._alt.clear(), this._activeBuffer = this._normal, this._onBufferActivate.fire({ activeBuffer: this._normal, inactiveBuffer: this._alt }));
  }
  activateAltBuffer(e) {
    this._activeBuffer !== this._alt && (this._alt.fillViewportRows(e), this._alt.x = this._normal.x, this._alt.y = this._normal.y, this._activeBuffer = this._alt, this._onBufferActivate.fire({ activeBuffer: this._alt, inactiveBuffer: this._normal }));
  }
  resize(e, t) {
    this._normal.resize(e, t), this._alt.resize(e, t), this.setupTabStops(e);
  }
  setupTabStops(e) {
    this._normal.setupTabStops(e), this._alt.setupTabStops(e);
  }
};
var Dt = class extends g {
  constructor(e, t) {
    super();
    this.isUserScrolling = false;
    this._onResize = this._register(new b());
    this.onResize = this._onResize.event;
    this._onScroll = this._register(new b());
    this.onScroll = this._onScroll.event;
    this.cols = Math.max(e.rawOptions.cols || 0, 2), this.rows = Math.max(e.rawOptions.rows || 0, 1), this.buffers = this._register(new sr(e, this, t)), this._register(this.buffers.onBufferActivate((r) => {
      this._onScroll.fire(r.activeBuffer.ydisp);
    }));
  }
  get buffer() {
    return this.buffers.active;
  }
  resize(e, t) {
    let r = this.cols !== e, s4 = this.rows !== t;
    this.cols = e, this.rows = t, this.buffers.resize(e, t), this._onResize.fire({ cols: e, rows: t, colsChanged: r, rowsChanged: s4 });
  }
  reset() {
    this.buffers.reset(), this.isUserScrolling = false;
  }
  scroll(e, t = false) {
    let r = this.buffer, s4;
    s4 = this._cachedBlankLine, (!s4 || s4.length !== this.cols || s4.getFg(0) !== e.fg || s4.getBg(0) !== e.bg) && (s4 = r.getBlankLine(e, t), this._cachedBlankLine = s4), s4.isWrapped = t;
    let o3 = r.ybase + r.scrollTop, a = r.ybase + r.scrollBottom;
    if (r.scrollTop === 0) {
      let l3 = r.lines.isFull;
      a === r.lines.length - 1 ? l3 ? r.lines.recycle().copyFrom(s4) : r.lines.push(s4.clone()) : r.lines.splice(a + 1, 0, s4.clone()), l3 ? this.isUserScrolling && (r.ydisp = Math.max(r.ydisp - 1, 0)) : (r.ybase++, this.isUserScrolling || r.ydisp++);
    } else {
      let l3 = a - o3 + 1;
      r.lines.shiftElements(o3 + 1, l3 - 1, -1), r.lines.set(a, s4.clone());
    }
    this.isUserScrolling || (r.ydisp = r.ybase), this._onScroll.fire(r.ydisp);
  }
  scrollLines(e, t) {
    let r = this.buffer;
    if (e < 0) {
      if (r.ydisp === 0) return;
      this.isUserScrolling = true;
    } else e + r.ydisp >= r.ybase && (this.isUserScrolling = false);
    let s4 = r.ydisp;
    r.ydisp = Math.max(Math.min(r.ydisp + e, r.ybase), 0), s4 !== r.ydisp && (t || this._onScroll.fire(r.ydisp));
  }
};
Dt = y([m(0, R), m(1, fe)], Dt);
var Rt = { cols: 80, rows: 24, showCursorImmediately: false, cursorBlink: false, blinkIntervalDuration: 0, cursorStyle: "block", cursorWidth: 1, cursorInactiveStyle: "outline", drawBoldTextInBrightColors: true, documentOverride: null, fastScrollSensitivity: 5, fontFamily: "monospace", fontSize: 15, fontWeight: "normal", fontWeightBold: "bold", ignoreBracketedPasteMode: false, lineHeight: 1, letterSpacing: 0, linkHandler: null, logLevel: "info", logger: null, scrollback: 1e3, scrollbar: { showScrollbar: true }, scrollOnEraseInDisplay: false, scrollOnUserInput: true, scrollSensitivity: 1, screenReaderMode: false, smoothScrollDuration: 0, macOptionIsMeta: false, macOptionClickForcesSelection: false, minimumContrastRatio: 1, mouseEventsRequireAlt: false, disableStdin: false, allowProposedApi: false, allowTransparency: false, tabStopWidth: 8, theme: {}, reflowCursorLine: false, rescaleOverlappingGlyphs: false, rightClickSelectsWord: ie, windowOptions: {}, windowsPty: {}, wordSeparator: " ()[]{}',\"`", altClickMovesCursor: true, convertEol: false, termName: "xterm", quirks: {}, vtExtensions: {} };
var po = ["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900"];
var nr = class extends g {
  constructor(e) {
    super();
    this._onOptionChange = this._register(new b());
    this.onOptionChange = this._onOptionChange.event;
    let t = { ...Rt };
    for (let r in e) if (r in t) try {
      let s4 = e[r];
      t[r] = this._sanitizeAndValidateOption(r, s4);
    } catch (s4) {
      console.error(s4);
    }
    this.rawOptions = t, this.options = { ...t }, this._setupOptions(), this._register(E(() => {
      this.rawOptions.linkHandler = null, this.rawOptions.documentOverride = null;
    }));
  }
  onSpecificOptionChange(e, t) {
    return this.onOptionChange((r) => {
      r === e && t(this.rawOptions[e]);
    });
  }
  onMultipleOptionChange(e, t) {
    return this.onOptionChange((r) => {
      e.indexOf(r) !== -1 && t();
    });
  }
  _setupOptions() {
    let e = (r) => {
      if (!(r in Rt)) throw new Error(`No option with key "${r}"`);
      return this.rawOptions[r];
    }, t = (r, s4) => {
      if (!(r in Rt)) throw new Error(`No option with key "${r}"`);
      s4 = this._sanitizeAndValidateOption(r, s4), this.rawOptions[r] !== s4 && (this.rawOptions[r] = s4, this._onOptionChange.fire(r));
    };
    for (let r in this.rawOptions) {
      let s4 = { get: e.bind(this, r), set: t.bind(this, r) };
      Object.defineProperty(this.options, r, s4);
    }
  }
  _sanitizeAndValidateOption(e, t) {
    switch (e) {
      case "cursorStyle":
        if (t || (t = Rt[e]), !mo(t)) throw new Error(`"${t}" is not a valid value for ${e}`);
        break;
      case "wordSeparator":
        t || (t = Rt[e]);
        break;
      case "fontWeight":
      case "fontWeightBold":
        if (typeof t == "number" && 1 <= t && t <= 1e3) break;
        t = po.includes(t) ? t : Rt[e];
        break;
      case "blinkIntervalDuration":
        if (t = Math.floor(t), t < 0) throw new Error(`${e} cannot be less than 0, value: ${t}`);
        break;
      case "cursorWidth":
        t = Math.floor(t);
      case "lineHeight":
      case "tabStopWidth":
        if (t < 1) throw new Error(`${e} cannot be less than 1, value: ${t}`);
        break;
      case "minimumContrastRatio":
        t = Math.max(1, Math.min(21, Math.round(t * 10) / 10));
        break;
      case "scrollback":
        if (t = Math.min(t, 4294967295), t < 0) throw new Error(`${e} cannot be less than 0, value: ${t}`);
        break;
      case "fastScrollSensitivity":
      case "scrollSensitivity":
        if (t <= 0) throw new Error(`${e} cannot be less than or equal to 0, value: ${t}`);
        break;
      case "rows":
      case "cols":
        if (!t && t !== 0) throw new Error(`${e} must be numeric, value: ${t}`);
        break;
      case "windowsPty":
        t = t ?? {};
        break;
    }
    return t;
  }
};
function mo(n10) {
  return n10 === "block" || n10 === "underline" || n10 === "bar";
}
var mn = Object.freeze({ insertMode: false });
var bn = Object.freeze({ applicationCursorKeys: false, applicationKeypad: false, bracketedPasteMode: false, colorSchemeUpdates: false, cursorBlink: void 0, cursorStyle: void 0, origin: false, reverseWraparound: false, sendFocus: false, synchronizedOutput: false, win32InputMode: false, wraparound: true });
var vn = () => ({ flags: 0, mainFlags: 0, altFlags: 0, mainStack: [], altStack: [] });
var Lt = class extends g {
  constructor(e, t, r) {
    super();
    this._bufferService = e;
    this._logService = t;
    this._optionsService = r;
    this.isCursorHidden = false;
    this._onData = this._register(new b());
    this.onData = this._onData.event;
    this._onUserInput = this._register(new b());
    this.onUserInput = this._onUserInput.event;
    this._onBinary = this._register(new b());
    this.onBinary = this._onBinary.event;
    this._onRequestScrollToBottom = this._register(new b());
    this.onRequestScrollToBottom = this._onRequestScrollToBottom.event;
    this.isCursorInitialized = r.rawOptions.showCursorImmediately ?? false, this.modes = structuredClone(mn), this.decPrivateModes = structuredClone(bn), this.kittyKeyboard = vn();
  }
  reset() {
    this.modes = structuredClone(mn), this.decPrivateModes = structuredClone(bn), this.kittyKeyboard = vn();
  }
  triggerDataEvent(e, t = false) {
    if (this._optionsService.rawOptions.disableStdin) return;
    let r = this._bufferService.buffer;
    t && this._optionsService.rawOptions.scrollOnUserInput && r.ybase !== r.ydisp && this._onRequestScrollToBottom.fire(), t && this._onUserInput.fire(), this._logService.debug(`sending data "${e}"`), this._logService.trace("sending data (codes)", () => e.split("").map((s4) => s4.charCodeAt(0))), this._onData.fire(e);
  }
  triggerBinaryEvent(e) {
    this._optionsService.rawOptions.disableStdin || (this._logService.debug(`sending binary "${e}"`), this._logService.trace("sending binary (codes)", () => e.split("").map((t) => t.charCodeAt(0))), this._onBinary.fire(e));
  }
};
Lt = y([m(0, D), m(1, fe), m(2, R)], Lt);
var Sn = { NONE: { events: 0, restrict: () => false }, X10: { events: 1, restrict: (n10) => n10.button === 4 || n10.action !== 1 ? false : (n10.ctrl = false, n10.alt = false, n10.shift = false, true) }, VT200: { events: 19, restrict: (n10) => n10.action !== 32 }, DRAG: { events: 23, restrict: (n10) => !(n10.action === 32 && n10.button === 3) }, ANY: { events: 31, restrict: (n10) => true } };
function vs(n10, i) {
  let e = (n10.ctrl ? 16 : 0) | (n10.shift ? 4 : 0) | (n10.alt ? 8 : 0);
  return n10.button === 4 ? (e |= 64, e |= n10.action) : (e |= n10.button & 3, n10.button & 4 && (e |= 64), n10.button & 8 && (e |= 128), n10.action === 32 ? e |= 32 : n10.action === 0 && !i && (e |= 3)), e;
}
var Ss = String.fromCharCode;
var gn = { DEFAULT: (n10) => {
  let i = [vs(n10, false) + 32, n10.col + 32, n10.row + 32];
  return i[0] > 255 || i[1] > 255 || i[2] > 255 ? "" : `\x1B[M${Ss(i[0])}${Ss(i[1])}${Ss(i[2])}`;
}, SGR: (n10) => {
  let i = n10.action === 0 && n10.button !== 4 ? "m" : "M";
  return `\x1B[<${vs(n10, true)};${n10.col};${n10.row}${i}`;
}, SGR_PIXELS: (n10) => {
  let i = n10.action === 0 && n10.button !== 4 ? "m" : "M";
  return `\x1B[<${vs(n10, true)};${n10.x};${n10.y}${i}`;
} };
var or = class extends g {
  constructor() {
    super();
    this._protocols = {};
    this._encodings = {};
    this._activeProtocol = "";
    this._activeEncoding = "";
    this._onProtocolChange = this._register(new b());
    this.onProtocolChange = this._onProtocolChange.event;
    for (let e of Object.keys(Sn)) this.addProtocol(e, Sn[e]);
    for (let e of Object.keys(gn)) this.addEncoding(e, gn[e]);
    this.reset();
  }
  addProtocol(e, t) {
    this._protocols[e] = t;
  }
  addEncoding(e, t) {
    this._encodings[e] = t;
  }
  get activeProtocol() {
    return this._activeProtocol;
  }
  get areMouseEventsActive() {
    return this._protocols[this._activeProtocol].events !== 0;
  }
  set activeProtocol(e) {
    if (!this._protocols[e]) throw new Error(`unknown protocol "${e}"`);
    this._activeProtocol = e, this._onProtocolChange.fire(this._protocols[e].events);
  }
  get activeEncoding() {
    return this._activeEncoding;
  }
  set activeEncoding(e) {
    if (!this._encodings[e]) throw new Error(`unknown encoding "${e}"`);
    this._activeEncoding = e;
  }
  reset() {
    this.activeProtocol = "NONE", this.activeEncoding = "DEFAULT";
  }
  setCustomWheelEventHandler(e) {
    this._customWheelEventHandler = e;
  }
  allowCustomWheelEvent(e) {
    return this._customWheelEventHandler ? this._customWheelEventHandler(e) !== false : true;
  }
  restrictMouseEvent(e) {
    return this._protocols[this._activeProtocol].restrict(e);
  }
  encodeMouseEvent(e) {
    return this._encodings[this._activeEncoding](e);
  }
  get isDefaultEncoding() {
    return this._activeEncoding === "DEFAULT";
  }
  get isPixelEncoding() {
    return this._activeEncoding === "SGR_PIXELS";
  }
};
var me = class n8 {
  constructor() {
    this._providers = /* @__PURE__ */ Object.create(null);
    this._active = "";
    this._onChange = new b();
    this.onChange = this._onChange.event;
  }
  static extractShouldJoin(i) {
    return (i & 1) !== 0;
  }
  static extractWidth(i) {
    return i >> 1 & 3;
  }
  static extractCharKind(i) {
    return i >> 3;
  }
  static createPropertyValue(i, e, t = false) {
    return (i & 16777215) << 3 | (e & 3) << 1 | (t ? 1 : 0);
  }
  dispose() {
    this._onChange.dispose();
  }
  get versions() {
    return Object.keys(this._providers);
  }
  get activeVersion() {
    return this._active;
  }
  set activeVersion(i) {
    if (!this._providers[i]) throw new Error(`unknown Unicode version "${i}"`);
    this._active = i, this._activeProvider = this._providers[i], this._onChange.fire(i);
  }
  register(i) {
    this._providers[i.version] = i, this._active || (this.activeVersion = i.version);
  }
  wcwidth(i) {
    return this._activeProvider.wcwidth(i);
  }
  getStringCellWidth(i) {
    let e = 0, t = 0, r = i.length;
    for (let s4 = 0; s4 < r; ++s4) {
      let o3 = i.charCodeAt(s4);
      if (55296 <= o3 && o3 <= 56319) {
        if (++s4 >= r) return e + this.wcwidth(o3);
        let h = i.charCodeAt(s4);
        56320 <= h && h <= 57343 ? o3 = (o3 - 55296) * 1024 + h - 56320 + 65536 : e += this.wcwidth(h);
      }
      let a = this.charProperties(o3, t), l3 = n8.extractWidth(a);
      n8.extractShouldJoin(a) && (l3 -= n8.extractWidth(t)), e += l3, t = a;
    }
    return e;
  }
  charProperties(i, e) {
    return this._activeProvider.charProperties(i, e);
  }
};
var gs = [[768, 879], [1155, 1158], [1160, 1161], [1425, 1469], [1471, 1471], [1473, 1474], [1476, 1477], [1479, 1479], [1536, 1539], [1552, 1557], [1611, 1630], [1648, 1648], [1750, 1764], [1767, 1768], [1770, 1773], [1807, 1807], [1809, 1809], [1840, 1866], [1958, 1968], [2027, 2035], [2305, 2306], [2364, 2364], [2369, 2376], [2381, 2381], [2385, 2388], [2402, 2403], [2433, 2433], [2492, 2492], [2497, 2500], [2509, 2509], [2530, 2531], [2561, 2562], [2620, 2620], [2625, 2626], [2631, 2632], [2635, 2637], [2672, 2673], [2689, 2690], [2748, 2748], [2753, 2757], [2759, 2760], [2765, 2765], [2786, 2787], [2817, 2817], [2876, 2876], [2879, 2879], [2881, 2883], [2893, 2893], [2902, 2902], [2946, 2946], [3008, 3008], [3021, 3021], [3134, 3136], [3142, 3144], [3146, 3149], [3157, 3158], [3260, 3260], [3263, 3263], [3270, 3270], [3276, 3277], [3298, 3299], [3393, 3395], [3405, 3405], [3530, 3530], [3538, 3540], [3542, 3542], [3633, 3633], [3636, 3642], [3655, 3662], [3761, 3761], [3764, 3769], [3771, 3772], [3784, 3789], [3864, 3865], [3893, 3893], [3895, 3895], [3897, 3897], [3953, 3966], [3968, 3972], [3974, 3975], [3984, 3991], [3993, 4028], [4038, 4038], [4141, 4144], [4146, 4146], [4150, 4151], [4153, 4153], [4184, 4185], [4448, 4607], [4959, 4959], [5906, 5908], [5938, 5940], [5970, 5971], [6002, 6003], [6068, 6069], [6071, 6077], [6086, 6086], [6089, 6099], [6109, 6109], [6155, 6157], [6313, 6313], [6432, 6434], [6439, 6440], [6450, 6450], [6457, 6459], [6679, 6680], [6912, 6915], [6964, 6964], [6966, 6970], [6972, 6972], [6978, 6978], [7019, 7027], [7616, 7626], [7678, 7679], [8203, 8207], [8234, 8238], [8288, 8291], [8298, 8303], [8400, 8431], [12330, 12335], [12441, 12442], [43014, 43014], [43019, 43019], [43045, 43046], [64286, 64286], [65024, 65039], [65056, 65059], [65279, 65279], [65529, 65531]];
var bo = [[68097, 68099], [68101, 68102], [68108, 68111], [68152, 68154], [68159, 68159], [119143, 119145], [119155, 119170], [119173, 119179], [119210, 119213], [119362, 119364], [917505, 917505], [917536, 917631], [917760, 917999]];
var X;
function vo(n10, i) {
  let e = 0, t = i.length - 1, r;
  if (n10 < i[0][0] || n10 > i[t][1]) return false;
  for (; t >= e; ) if (r = e + t >> 1, n10 > i[r][1]) e = r + 1;
  else if (n10 < i[r][0]) t = r - 1;
  else return true;
  return false;
}
var ar = class {
  constructor() {
    this.version = "6";
    if (!X) {
      X = new Uint8Array(65536), X.fill(1), X[0] = 0, X.fill(0, 1, 32), X.fill(0, 127, 160), X.fill(2, 4352, 4448), X[9001] = 2, X[9002] = 2, X.fill(2, 11904, 42192), X[12351] = 1, X.fill(2, 44032, 55204), X.fill(2, 63744, 64256), X.fill(2, 65040, 65050), X.fill(2, 65072, 65136), X.fill(2, 65280, 65377), X.fill(2, 65504, 65511);
      for (let i = 0; i < gs.length; ++i) X.fill(0, gs[i][0], gs[i][1] + 1);
    }
  }
  wcwidth(i) {
    return i < 32 ? 0 : i < 127 ? 1 : i < 65536 ? X[i] : vo(i, bo) ? 0 : i >= 131072 && i <= 196605 || i >= 196608 && i <= 262141 ? 2 : 1;
  }
  charProperties(i, e) {
    let t = this.wcwidth(i), r = t === 0 && e !== 0;
    if (r) {
      let s4 = me.extractWidth(e);
      s4 === 0 ? r = false : s4 > t && (t = s4);
    }
    return me.createPropertyValue(0, t, r);
  }
};
var lr = class {
  constructor() {
    this.glevel = 0;
    this._charsets = [];
  }
  get charsets() {
    return this._charsets;
  }
  reset() {
    this.charset = void 0, this._charsets = [], this.glevel = 0;
  }
  setgLevel(i) {
    this.glevel = i, this.charset = this._charsets[i];
  }
  setgCharset(i, e) {
    this._charsets[i] = e, this.glevel === i && (this.charset = e);
  }
};
function Is(n10) {
  let e = n10.buffer.lines.get(n10.buffer.ybase + n10.buffer.y - 1)?.get(n10.cols - 1), t = n10.buffer.lines.get(n10.buffer.ybase + n10.buffer.y);
  t && e && (t.isWrapped = e[3] !== 0 && e[3] !== 32);
}
var At = class n9 {
  constructor(i = 32, e = 32) {
    this.maxLength = i;
    this.maxSubParamsLength = e;
    if (e > 256) throw new Error("maxSubParamsLength must not be greater than 256");
    this.params = new Int32Array(i), this.length = 0, this._subParams = new Int32Array(e), this._subParamsLength = 0, this._subParamsIdx = new Uint16Array(i), this._rejectDigits = false, this._rejectSubDigits = false, this._digitIsSub = false;
  }
  static fromArray(i) {
    let e = new n9();
    if (!i.length) return e;
    for (let t = Array.isArray(i[0]) ? 1 : 0; t < i.length; ++t) {
      let r = i[t];
      if (Array.isArray(r)) for (let s4 = 0; s4 < r.length; ++s4) e.addSubParam(r[s4]);
      else e.addParam(r);
    }
    return e;
  }
  clone() {
    let i = new n9(this.maxLength, this.maxSubParamsLength);
    return i.params.set(this.params), i.length = this.length, i._subParams.set(this._subParams), i._subParamsLength = this._subParamsLength, i._subParamsIdx.set(this._subParamsIdx), i._rejectDigits = this._rejectDigits, i._rejectSubDigits = this._rejectSubDigits, i._digitIsSub = this._digitIsSub, i;
  }
  toArray() {
    let i = [];
    for (let e = 0; e < this.length; ++e) {
      i.push(this.params[e]);
      let t = this._subParamsIdx[e] >> 8, r = this._subParamsIdx[e] & 255;
      r - t > 0 && i.push(Array.prototype.slice.call(this._subParams, t, r));
    }
    return i;
  }
  reset() {
    this.length = 0, this._subParamsLength = 0, this._rejectDigits = false, this._rejectSubDigits = false, this._digitIsSub = false;
  }
  resetZdm() {
    this.length = 1, this._subParamsLength = 0, this._rejectDigits = false, this._rejectSubDigits = false, this._digitIsSub = false, this._subParamsIdx[0] = 0, this.params[0] = 0;
  }
  addParam(i) {
    if (this._digitIsSub = false, this.length >= this.maxLength) {
      this._rejectDigits = true;
      return;
    }
    if (i < -1) throw new Error("values less than -1 are not allowed");
    this._subParamsIdx[this.length] = this._subParamsLength << 8 | this._subParamsLength, this.params[this.length++] = i > 2147483647 ? 2147483647 : i;
  }
  addSubParam(i) {
    if (this._digitIsSub = true, !!this.length) {
      if (this._rejectDigits || this._subParamsLength >= this.maxSubParamsLength) {
        this._rejectSubDigits = true;
        return;
      }
      if (i < -1) throw new Error("values less than -1 are not allowed");
      this._subParams[this._subParamsLength++] = i > 2147483647 ? 2147483647 : i, this._subParamsIdx[this.length - 1]++;
    }
  }
  hasSubParams(i) {
    return (this._subParamsIdx[i] & 255) - (this._subParamsIdx[i] >> 8) > 0;
  }
  getSubParams(i) {
    let e = this._subParamsIdx[i] >> 8, t = this._subParamsIdx[i] & 255;
    return t - e > 0 ? this._subParams.subarray(e, t) : null;
  }
  getSubParamsAll() {
    let i = {};
    for (let e = 0; e < this.length; ++e) {
      let t = this._subParamsIdx[e] >> 8, r = this._subParamsIdx[e] & 255;
      r - t > 0 && (i[e] = this._subParams.slice(t, r));
    }
    return i;
  }
  addDigit(i) {
    let e;
    if (this._rejectDigits || !(e = this._digitIsSub ? this._subParamsLength : this.length) || this._digitIsSub && this._rejectSubDigits) return;
    let t = this._digitIsSub ? this._subParams : this.params, r = t[e - 1];
    t[e - 1] = ~r ? Math.min(r * 10 + i, 2147483647) : i;
  }
};
var ni = [];
var cr = class {
  constructor() {
    this._state = 0;
    this._active = ni;
    this._id = -1;
    this._handlers = /* @__PURE__ */ Object.create(null);
    this._handlerFb = () => {
    };
    this._stack = { paused: false, loopPosition: 0, fallThrough: false };
  }
  registerHandler(i, e) {
    this._handlers[i] ??= [];
    let t = this._handlers[i];
    return t.push(e), { dispose: () => {
      let r = t.indexOf(e);
      r !== -1 && t.splice(r, 1);
    } };
  }
  clearHandler(i) {
    this._handlers[i] && delete this._handlers[i];
  }
  setHandlerFallback(i) {
    this._handlerFb = i;
  }
  dispose() {
    this._handlers = /* @__PURE__ */ Object.create(null), this._handlerFb = () => {
    }, this._active = ni;
  }
  reset() {
    if (this._state === 2) for (let i = this._stack.paused ? this._stack.loopPosition - 1 : this._active.length - 1; i >= 0; --i) this._active[i].end(false);
    this._stack.paused = false, this._active = ni, this._id = -1, this._state = 0;
  }
  _start() {
    if (this._active = this._handlers[this._id] || ni, !this._active.length) this._handlerFb(this._id, "START");
    else for (let i = this._active.length - 1; i >= 0; i--) this._active[i].start();
  }
  _put(i, e, t) {
    if (!this._active.length) this._handlerFb(this._id, "PUT", ye(i, e, t));
    else for (let r = this._active.length - 1; r >= 0; r--) this._active[r].put(i, e, t);
  }
  start() {
    this.reset(), this._state = 1;
  }
  put(i, e, t) {
    if (this._state !== 3) {
      if (this._state === 1) for (; e < t; ) {
        let r = i[e++];
        if (r === 59) {
          this._state = 2, this._start();
          break;
        }
        if (r < 48 || 57 < r) {
          this._state = 3;
          return;
        }
        this._id === -1 && (this._id = 0), this._id = this._id * 10 + r - 48;
      }
      this._state === 2 && t - e > 0 && this._put(i, e, t);
    }
  }
  end(i, e = true) {
    if (this._state !== 0) {
      if (this._state !== 3) if (this._state === 1 && this._start(), !this._active.length) this._handlerFb(this._id, "END", i);
      else {
        let t = false, r = this._active.length - 1, s4 = false;
        if (this._stack.paused && (r = this._stack.loopPosition - 1, t = e, s4 = this._stack.fallThrough, this._stack.paused = false), !s4 && t === false) {
          for (; r >= 0 && (t = this._active[r].end(i), t !== true); r--) if (t instanceof Promise) return this._stack.paused = true, this._stack.loopPosition = r, this._stack.fallThrough = false, t;
          r--;
        }
        for (; r >= 0; r--) if (t = this._active[r].end(false), t instanceof Promise) return this._stack.paused = true, this._stack.loopPosition = r, this._stack.fallThrough = true, t;
      }
      this._active = ni, this._id = -1, this._state = 0;
    }
  }
};
var hr = class hr2 {
  constructor(i) {
    this._handler = i;
    this._data = new We(hr2._payloadLimit);
    this._hitLimit = false;
  }
  start() {
    this._data.reset(), this._hitLimit = false;
  }
  put(i, e, t) {
    this._hitLimit || this._data.append(ye(i, e, t)) && (this._hitLimit = true);
  }
  end(i) {
    let e = false;
    if (this._hitLimit) e = false;
    else if (i && (e = this._handler(this._data.toString()), e instanceof Promise)) return e.then((t) => (this._data.reset(), this._hitLimit = false, t));
    return this._data.reset(), this._hitLimit = false, e;
  }
};
hr._payloadLimit = 1e7;
var ne = hr;
var oi = [];
var dr = class {
  constructor() {
    this._handlers = /* @__PURE__ */ Object.create(null);
    this._active = oi;
    this._ident = 0;
    this._handlerFb = () => {
    };
    this._stack = { paused: false, loopPosition: 0, fallThrough: false };
  }
  dispose() {
    this._handlers = /* @__PURE__ */ Object.create(null), this._handlerFb = () => {
    }, this._active = oi;
  }
  registerHandler(i, e) {
    this._handlers[i] ??= [];
    let t = this._handlers[i];
    return t.push(e), { dispose: () => {
      let r = t.indexOf(e);
      r !== -1 && t.splice(r, 1);
    } };
  }
  clearHandler(i) {
    this._handlers[i] && delete this._handlers[i];
  }
  setHandlerFallback(i) {
    this._handlerFb = i;
  }
  reset() {
    if (this._active.length) for (let i = this._stack.paused ? this._stack.loopPosition - 1 : this._active.length - 1; i >= 0; --i) this._active[i].unhook(false);
    this._stack.paused = false, this._active = oi, this._ident = 0;
  }
  hook(i, e) {
    if (this.reset(), this._ident = i, this._active = this._handlers[i] || oi, !this._active.length) this._handlerFb(this._ident, "HOOK", e);
    else for (let t = this._active.length - 1; t >= 0; t--) this._active[t].hook(e);
  }
  put(i, e, t) {
    if (!this._active.length) this._handlerFb(this._ident, "PUT", ye(i, e, t));
    else for (let r = this._active.length - 1; r >= 0; r--) this._active[r].put(i, e, t);
  }
  unhook(i, e = true) {
    if (!this._active.length) this._handlerFb(this._ident, "UNHOOK", i);
    else {
      let t = false, r = this._active.length - 1, s4 = false;
      if (this._stack.paused && (r = this._stack.loopPosition - 1, t = e, s4 = this._stack.fallThrough, this._stack.paused = false), !s4 && t === false) {
        for (; r >= 0 && (t = this._active[r].unhook(i), t !== true); r--) if (t instanceof Promise) return this._stack.paused = true, this._stack.loopPosition = r, this._stack.fallThrough = false, t;
        r--;
      }
      for (; r >= 0; r--) if (t = this._active[r].unhook(false), t instanceof Promise) return this._stack.paused = true, this._stack.loopPosition = r, this._stack.fallThrough = true, t;
    }
    this._active = oi, this._ident = 0;
  }
};
var ai = new At();
ai.addParam(0);
var ur = class ur2 {
  constructor(i) {
    this._handler = i;
    this._data = new We(ur2._payloadLimit);
    this._params = ai;
    this._hitLimit = false;
  }
  hook(i) {
    this._params = i.length > 1 || i.params[0] ? i.clone() : ai, this._data.reset(), this._hitLimit = false;
  }
  put(i, e, t) {
    this._hitLimit || this._data.append(ye(i, e, t)) && (this._hitLimit = true);
  }
  unhook(i) {
    let e = false;
    if (this._hitLimit) e = false;
    else if (i && (e = this._handler(this._data.toString(), this._params), e instanceof Promise)) return e.then((t) => (this._params = ai, this._data.reset(), this._hitLimit = false, t));
    return this._params = ai, this._data.reset(), this._hitLimit = false, e;
  }
};
ur._payloadLimit = 1e7;
var li = ur;
var ci = [];
var fr = class {
  constructor() {
    this._handlers = /* @__PURE__ */ Object.create(null);
    this._active = ci;
    this._ident = 0;
    this._handlerFb = () => {
    };
    this._stack = { paused: false, loopPosition: 0, fallThrough: false };
  }
  registerHandler(i, e) {
    this._handlers[i] ??= [];
    let t = this._handlers[i];
    return t.push(e), { dispose: () => {
      let r = t.indexOf(e);
      r !== -1 && t.splice(r, 1);
    } };
  }
  clearHandler(i) {
    this._handlers[i] && delete this._handlers[i];
  }
  setHandlerFallback(i) {
    this._handlerFb = i;
  }
  dispose() {
    this._handlers = /* @__PURE__ */ Object.create(null), this._handlerFb = () => {
    }, this._active = ci;
  }
  reset() {
    if (this._active.length) for (let i = this._stack.paused ? this._stack.loopPosition - 1 : this._active.length - 1; i >= 0; --i) this._active[i].end(false);
    this._stack.paused = false, this._active = ci, this._ident = 0;
  }
  start(i) {
    if (this.reset(), this._ident = i, this._active = this._handlers[i] || ci, !this._active.length) this._handlerFb(this._ident, "START");
    else for (let e = this._active.length - 1; e >= 0; e--) this._active[e].start();
  }
  put(i, e, t) {
    if (!this._active.length) this._handlerFb(this._ident, "PUT", ye(i, e, t));
    else for (let r = this._active.length - 1; r >= 0; r--) this._active[r].put(i, e, t);
  }
  end(i, e = true) {
    if (!this._active.length) this._handlerFb(this._ident, "END", i);
    else {
      let t = false, r = this._active.length - 1, s4 = false;
      if (this._stack.paused && (r = this._stack.loopPosition - 1, t = e, s4 = this._stack.fallThrough, this._stack.paused = false), !s4 && t === false) {
        for (; r >= 0 && (t = this._active[r].end(i), t !== true); r--) if (t instanceof Promise) return this._stack.paused = true, this._stack.loopPosition = r, this._stack.fallThrough = false, t;
        r--;
      }
      for (; r >= 0; r--) if (t = this._active[r].end(false), t instanceof Promise) return this._stack.paused = true, this._stack.loopPosition = r, this._stack.fallThrough = true, t;
    }
    this._active = ci, this._ident = 0;
  }
};
var pr = class pr2 {
  constructor(i) {
    this._handler = i;
    this._data = new We(pr2._payloadLimit);
    this._hitLimit = false;
  }
  start() {
    this._data.reset(), this._hitLimit = false;
  }
  put(i, e, t) {
    this._hitLimit || this._data.append(ye(i, e, t)) && (this._hitLimit = true);
  }
  end(i) {
    let e = false;
    if (this._hitLimit) e = false;
    else if (i && (e = this._handler(this._data.toString()), e instanceof Promise)) return e.then((t) => (this._data.reset(), this._hitLimit = false, t));
    return this._data.reset(), this._hitLimit = false, e;
  }
};
pr._payloadLimit = 1e7;
var _r = pr;
var Cs = class {
  constructor(i) {
    this.table = new Uint16Array(i);
  }
  setDefault(i, e) {
    this.table.fill(i << 8 | e);
  }
  add(i, e, t, r) {
    this.table[e << 8 | i] = t << 8 | r;
  }
  addMany(i, e, t, r) {
    for (let s4 = 0; s4 < i.length; s4++) this.table[e << 8 | i[s4]] = t << 8 | r;
  }
};
var oe = 160;
var So = (function() {
  let n10 = new Cs(4257), e = Array.apply(null, Array(256)).map((a, l3) => l3), t = (a, l3) => e.slice(a, l3), r = t(32, 127), s4 = t(0, 24);
  s4.push(25), s4.push.apply(s4, t(28, 32));
  let o3 = t(0, 17);
  n10.setDefault(1, 0), n10.addMany(r, 0, 2, 0);
  for (let a of o3) n10.addMany([24, 26, 153, 154], a, 3, 0), n10.addMany(t(128, 144), a, 3, 0), n10.addMany(t(144, 152), a, 3, 0), n10.add(156, a, 0, 0), n10.add(27, a, 11, 1), n10.add(157, a, 4, 8), n10.addMany([152, 158], a, 0, 7), n10.add(159, a, 11, 14), n10.add(155, a, 11, 3), n10.add(144, a, 11, 9);
  return n10.addMany(s4, 0, 3, 0), n10.addMany(s4, 1, 3, 1), n10.add(127, 1, 0, 1), n10.addMany(s4, 8, 0, 8), n10.addMany(s4, 3, 3, 3), n10.add(127, 3, 0, 3), n10.addMany(s4, 4, 3, 4), n10.add(127, 4, 0, 4), n10.addMany(s4, 6, 3, 6), n10.addMany(s4, 5, 3, 5), n10.add(127, 5, 0, 5), n10.addMany(s4, 2, 3, 2), n10.add(127, 2, 0, 2), n10.add(93, 1, 4, 8), n10.addMany(r, 8, 5, 8), n10.add(127, 8, 5, 8), n10.addMany([156, 27, 24, 26, 7], 8, 6, 0), n10.addMany(t(28, 32), 8, 0, 8), n10.addMany([88, 94], 1, 0, 7), n10.addMany(r, 7, 0, 7), n10.addMany(s4, 7, 0, 7), n10.add(156, 7, 0, 0), n10.add(127, 7, 0, 7), n10.add(95, 1, 11, 14), n10.addMany(s4, 14, 0, 14), n10.add(127, 14, 0, 14), n10.addMany(t(32, 48), 14, 9, 15), n10.addMany(t(48, 127), 14, 15, 16), n10.addMany(t(48, 127), 15, 15, 16), n10.addMany(s4, 15, 0, 15), n10.addMany(t(32, 48), 15, 9, 15), n10.add(127, 15, 0, 15), n10.addMany(r, 16, 16, 16), n10.addMany(s4, 16, 0, 16), n10.addMany(t(8, 14), 16, 16, 16), n10.add(127, 16, 0, 16), n10.addMany([27, 156, 24, 26], 16, 17, 0), n10.add(91, 1, 11, 3), n10.addMany(t(64, 127), 3, 7, 0), n10.addMany(t(48, 60), 3, 8, 4), n10.addMany([60, 61, 62, 63], 3, 9, 4), n10.addMany(t(48, 60), 4, 8, 4), n10.addMany(t(64, 127), 4, 7, 0), n10.addMany([60, 61, 62, 63], 4, 0, 6), n10.addMany(t(32, 64), 6, 0, 6), n10.add(127, 6, 0, 6), n10.addMany(t(64, 127), 6, 0, 0), n10.addMany(t(32, 48), 3, 9, 5), n10.addMany(t(32, 48), 5, 9, 5), n10.addMany(t(48, 64), 5, 0, 6), n10.addMany(t(64, 127), 5, 7, 0), n10.addMany(t(32, 48), 4, 9, 5), n10.addMany(t(32, 48), 1, 9, 2), n10.addMany(t(32, 48), 2, 9, 2), n10.addMany(t(48, 127), 2, 10, 0), n10.addMany(t(48, 80), 1, 10, 0), n10.addMany(t(81, 88), 1, 10, 0), n10.addMany([89, 90, 92], 1, 10, 0), n10.addMany(t(96, 127), 1, 10, 0), n10.add(80, 1, 11, 9), n10.addMany(s4, 9, 0, 9), n10.add(127, 9, 0, 9), n10.addMany(t(32, 48), 9, 9, 12), n10.addMany(t(48, 60), 9, 8, 10), n10.addMany([60, 61, 62, 63], 9, 9, 10), n10.addMany(s4, 11, 0, 11), n10.addMany(t(32, 128), 11, 0, 11), n10.addMany(s4, 10, 0, 10), n10.add(127, 10, 0, 10), n10.addMany(t(48, 60), 10, 8, 10), n10.addMany([60, 61, 62, 63], 10, 0, 11), n10.addMany(t(32, 48), 10, 9, 12), n10.addMany(s4, 12, 0, 12), n10.add(127, 12, 0, 12), n10.addMany(t(32, 48), 12, 9, 12), n10.addMany(t(48, 64), 12, 0, 11), n10.addMany(t(64, 127), 12, 12, 13), n10.addMany(t(64, 127), 10, 12, 13), n10.addMany(t(64, 127), 9, 12, 13), n10.addMany(s4, 13, 13, 13), n10.addMany(r, 13, 13, 13), n10.add(127, 13, 0, 13), n10.addMany([27, 156, 24, 26], 13, 14, 0), n10.add(oe, 0, 2, 0), n10.add(oe, 8, 5, 8), n10.add(oe, 6, 0, 6), n10.add(oe, 11, 0, 11), n10.add(oe, 13, 13, 13), n10.add(oe, 16, 16, 16), n10;
})();
var mr = class extends g {
  constructor(e = So) {
    super();
    this._transitions = e;
    this._parseStack = { state: 0, handlers: [], handlerPos: 0, transition: 0, chunkPos: 0 };
    this.initialState = 0, this.currentState = this.initialState, this._params = new At(), this._params.addParam(0), this._collect = 0, this.precedingJoinState = 0, this._printHandlerFb = (t, r, s4) => {
    }, this._executeHandlerFb = (t) => {
    }, this._csiHandlerFb = (t, r) => {
    }, this._escHandlerFb = (t) => {
    }, this._errorHandlerFb = (t) => t, this._printHandler = this._printHandlerFb, this._executeHandlers = /* @__PURE__ */ Object.create(null), this._executeHandlersArr = new Array(24).fill(void 0), this._csiHandlers = /* @__PURE__ */ Object.create(null), this._escHandlers = /* @__PURE__ */ Object.create(null), this._register(E(() => {
      this._csiHandlers = /* @__PURE__ */ Object.create(null), this._executeHandlers = /* @__PURE__ */ Object.create(null), this._executeHandlersArr = new Array(24).fill(void 0), this._escHandlers = /* @__PURE__ */ Object.create(null);
    })), this._oscParser = this._register(new cr()), this._dcsParser = this._register(new dr()), this._apcParser = this._register(new fr()), this._errorHandler = this._errorHandlerFb, this.registerEscHandler({ final: "\\" }, () => true);
  }
  _identifier(e, t = [64, 126]) {
    let r = 0;
    if (e.prefix) {
      if (e.prefix.length > 1) throw new Error("only one byte as prefix supported");
      if (r = e.prefix.charCodeAt(0), r < 60 || r > 63) throw new Error("prefix must be in range 0x3c .. 0x3f");
    }
    if (e.intermediates) {
      if (e.intermediates.length > 2) throw new Error("only two bytes as intermediates are supported");
      for (let o3 = 0; o3 < e.intermediates.length; ++o3) {
        let a = e.intermediates.charCodeAt(o3);
        if (32 > a || a > 47) throw new Error("intermediate must be in range 0x20 .. 0x2f");
        r <<= 8, r |= a;
      }
    }
    if (e.final.length !== 1) throw new Error("final must be a single byte");
    let s4 = e.final.charCodeAt(0);
    if (t[0] > s4 || s4 > t[1]) throw new Error(`final must be in range ${t[0]} .. ${t[1]}`);
    return r <<= 8, r |= s4, r;
  }
  identToString(e) {
    let t = [];
    for (; e; ) t.push(String.fromCharCode(e & 255)), e >>= 8;
    return t.reverse().join("");
  }
  setPrintHandler(e) {
    this._printHandler = e;
  }
  clearPrintHandler() {
    this._printHandler = this._printHandlerFb;
  }
  registerEscHandler(e, t) {
    let r = this._identifier(e, [48, 126]);
    this._escHandlers[r] ??= [];
    let s4 = this._escHandlers[r];
    return s4.push(t), { dispose: () => {
      let o3 = s4.indexOf(t);
      o3 !== -1 && s4.splice(o3, 1);
    } };
  }
  clearEscHandler(e) {
    this._escHandlers[this._identifier(e, [48, 126])] && delete this._escHandlers[this._identifier(e, [48, 126])];
  }
  setEscHandlerFallback(e) {
    this._escHandlerFb = e;
  }
  setExecuteHandler(e, t) {
    let r = e.charCodeAt(0);
    this._executeHandlers[r] = t, r < 24 && (this._executeHandlersArr[r] = t);
  }
  clearExecuteHandler(e) {
    let t = e.charCodeAt(0);
    this._executeHandlers[t] && delete this._executeHandlers[t], t < 24 && (this._executeHandlersArr[t] = void 0);
  }
  setExecuteHandlerFallback(e) {
    this._executeHandlerFb = e;
  }
  registerCsiHandler(e, t) {
    let r = this._identifier(e);
    this._csiHandlers[r] ??= [];
    let s4 = this._csiHandlers[r];
    return s4.push(t), { dispose: () => {
      let o3 = s4.indexOf(t);
      o3 !== -1 && s4.splice(o3, 1);
    } };
  }
  clearCsiHandler(e) {
    this._csiHandlers[this._identifier(e)] && delete this._csiHandlers[this._identifier(e)];
  }
  setCsiHandlerFallback(e) {
    this._csiHandlerFb = e;
  }
  registerDcsHandler(e, t) {
    return this._dcsParser.registerHandler(this._identifier(e), t);
  }
  clearDcsHandler(e) {
    this._dcsParser.clearHandler(this._identifier(e));
  }
  setDcsHandlerFallback(e) {
    this._dcsParser.setHandlerFallback(e);
  }
  registerOscHandler(e, t) {
    return this._oscParser.registerHandler(e, t);
  }
  clearOscHandler(e) {
    this._oscParser.clearHandler(e);
  }
  setOscHandlerFallback(e) {
    this._oscParser.setHandlerFallback(e);
  }
  registerApcHandler(e, t) {
    return e.prefix = void 0, this._apcParser.registerHandler(this._identifier(e, [48, 126]), t);
  }
  clearApcHandler(e) {
    e.prefix = void 0, this._apcParser.clearHandler(this._identifier(e, [48, 126]));
  }
  setApcHandlerFallback(e) {
    this._apcParser.setHandlerFallback(e);
  }
  setErrorHandler(e) {
    this._errorHandler = e;
  }
  clearErrorHandler() {
    this._errorHandler = this._errorHandlerFb;
  }
  reset() {
    this.currentState = this.initialState, this._oscParser.reset(), this._dcsParser.reset(), this._apcParser.reset(), this._params.resetZdm(), this._collect = 0, this.precedingJoinState = 0, this._parseStack.state !== 0 && (this._parseStack.state = 2, this._parseStack.handlers = []);
  }
  _preserveStack(e, t, r, s4, o3) {
    this._parseStack.state = e, this._parseStack.handlers = t, this._parseStack.handlerPos = r, this._parseStack.transition = s4, this._parseStack.chunkPos = o3;
  }
  parse(e, t, r) {
    let s4, o3, a = 0, l3;
    if (this._parseStack.state) if (this._parseStack.state === 2) this._parseStack.state = 0, a = this._parseStack.chunkPos + 1;
    else {
      if (r === void 0 || this._parseStack.state === 1) throw this._parseStack.state = 1, new Error("improper continuation due to previous async handler, giving up parsing");
      let h = this._parseStack.handlers, d = this._parseStack.handlerPos - 1;
      switch (this._parseStack.state) {
        case 3:
          if (r === false && d > -1) {
            for (; d >= 0 && (l3 = h[d](this._params), l3 !== true); d--) if (l3 instanceof Promise) return this._parseStack.handlerPos = d, l3;
          }
          this._parseStack.handlers = [];
          break;
        case 4:
          if (r === false && d > -1) {
            for (; d >= 0 && (l3 = h[d](), l3 !== true); d--) if (l3 instanceof Promise) return this._parseStack.handlerPos = d, l3;
          }
          this._parseStack.handlers = [];
          break;
        case 6:
          if (s4 = e[this._parseStack.chunkPos], l3 = this._dcsParser.unhook(s4 !== 24 && s4 !== 26, r), l3) return l3;
          s4 === 27 && (this._parseStack.transition |= 1), this._params.resetZdm(), this._collect = 0;
          break;
        case 5:
          if (s4 = e[this._parseStack.chunkPos], l3 = this._oscParser.end(s4 !== 24 && s4 !== 26, r), l3) return l3;
          s4 === 27 && (this._parseStack.transition |= 1), this._params.resetZdm(), this._collect = 0;
          break;
        case 7:
          if (s4 = e[this._parseStack.chunkPos], l3 = this._apcParser.end(s4 !== 24 && s4 !== 26, r), l3) return l3;
          s4 === 27 && (this._parseStack.transition |= 1), this._params.resetZdm(), this._collect = 0;
          break;
      }
      this._parseStack.state = 0, a = this._parseStack.chunkPos + 1, this.precedingJoinState = 0, this.currentState = this._parseStack.transition & 255;
    }
    for (let h = a; h < t; ++h) {
      if (s4 = e[h], s4 < 24 && this.currentState <= 6) {
        (this._executeHandlersArr[s4] ?? this._executeHandlerFb)(s4), this.precedingJoinState = 0;
        continue;
      }
      if (s4 === 27 && this.currentState < 8 && h + 2 < t && e[h + 1] === 91) {
        this._params.resetZdm(), this._collect = 0;
        let d = h + 2, c = e[d];
        c >= 60 && c <= 63 && (this._collect = c, d++);
        let u = false;
        for (; d < t; d++) if (c = e[d], c >= 48 && c <= 57) this._params.addDigit(c - 48);
        else if (c === 59) this._params.addParam(0);
        else if (c === 58) this._params.addSubParam(-1);
        else if (c >= 64 && c <= 126) {
          let _ = this._csiHandlers[this._collect << 8 | c], p = _ ? _.length - 1 : -1;
          for (; p >= 0 && (l3 = _[p](this._params), l3 !== true); p--) if (l3 instanceof Promise) return o3 = 1792, this._preserveStack(3, _, p, o3, d), l3;
          p < 0 && this._csiHandlerFb(this._collect << 8 | c, this._params), this.precedingJoinState = 0, h = d, this.currentState = 0, u = true;
          break;
        } else break;
        u || (h = d - 1, this.currentState = 4);
        continue;
      }
      switch (o3 = this._transitions.table[this.currentState << 8 | (s4 < oe ? s4 : oe)], o3 >> 8) {
        case 2:
          let d = h, c = t - 4;
          for (; d < c && e[++d] >= 32 && (e[d] <= 126 || e[d] >= oe) && e[++d] >= 32 && (e[d] <= 126 || e[d] >= oe) && e[++d] >= 32 && (e[d] <= 126 || e[d] >= oe) && e[++d] >= 32 && (e[d] <= 126 || e[d] >= oe); ) ;
          if (d >= c) for (; d < t && e[d] >= 32 && (e[d] <= 126 || e[d] >= oe); ) d++;
          this._printHandler(e, h, d), h = d - 1;
          break;
        case 3:
          this._executeHandlers[s4] ? this._executeHandlers[s4]() : this._executeHandlerFb(s4), this.precedingJoinState = 0;
          break;
        case 0:
          break;
        case 1:
          if (this._errorHandler({ position: h, code: s4, currentState: this.currentState, collect: this._collect, params: this._params, abort: false }).abort) return;
          break;
        case 7:
          let _ = this._csiHandlers[this._collect << 8 | s4], p = _ ? _.length - 1 : -1;
          for (; p >= 0 && (l3 = _[p](this._params), l3 !== true); p--) if (l3 instanceof Promise) return this._preserveStack(3, _, p, o3, h), l3;
          p < 0 && this._csiHandlerFb(this._collect << 8 | s4, this._params), this.precedingJoinState = 0;
          break;
        case 8:
          do
            switch (s4) {
              case 59:
                this._params.addParam(0);
                break;
              case 58:
                this._params.addSubParam(-1);
                break;
              default:
                this._params.addDigit(s4 - 48);
            }
          while (++h < t && (s4 = e[h]) > 47 && s4 < 60);
          h--;
          break;
        case 9:
          this._collect <<= 8, this._collect |= s4;
          break;
        case 10:
          let v = this._escHandlers[this._collect << 8 | s4], f2 = v ? v.length - 1 : -1;
          for (; f2 >= 0 && (l3 = v[f2](), l3 !== true); f2--) if (l3 instanceof Promise) return this._preserveStack(4, v, f2, o3, h), l3;
          f2 < 0 && this._escHandlerFb(this._collect << 8 | s4), this.precedingJoinState = 0;
          break;
        case 11:
          this._params.resetZdm(), this._collect = 0;
          break;
        case 12:
          this._dcsParser.hook(this._collect << 8 | s4, this._params);
          break;
        case 13:
          for (let S = h + 1; ; ++S) if (S >= t || (s4 = e[S]) === 24 || s4 === 26 || s4 === 27 || s4 > 127 && s4 < oe) {
            this._dcsParser.put(e, h, S), h = S - 1;
            break;
          }
          break;
        case 14:
          if (l3 = this._dcsParser.unhook(s4 !== 24 && s4 !== 26), l3) return this._preserveStack(6, [], 0, o3, h), l3;
          s4 === 27 && (o3 |= 1), this._params.resetZdm(), this._collect = 0, this.precedingJoinState = 0;
          break;
        case 4:
          this._oscParser.start();
          break;
        case 5:
          for (let S = h + 1; ; S++) if (S >= t || (s4 = e[S]) < 32 || s4 > 127 && s4 < oe) {
            this._oscParser.put(e, h, S), h = S - 1;
            break;
          }
          break;
        case 6:
          if (l3 = this._oscParser.end(s4 !== 24 && s4 !== 26), l3) return this._preserveStack(5, [], 0, o3, h), l3;
          s4 === 27 && (o3 |= 1), this._params.resetZdm(), this._collect = 0, this.precedingJoinState = 0;
          break;
        case 15:
          this._apcParser.start(this._collect << 8 | s4);
          break;
        case 16:
          for (let S = h + 1; ; ++S) if (!(S < t && (e[S] >= 32 && e[S] < 127 || e[S] >= 8 && e[S] < 14 || e[S] >= oe))) {
            this._apcParser.put(e, h, S), h = S - 1;
            break;
          }
          break;
        case 17:
          if (l3 = this._apcParser.end(s4 !== 24 && s4 !== 26), l3) return this._preserveStack(7, [], 0, o3, h), l3;
          s4 === 27 && (o3 |= 1), this._params.resetZdm(), this._collect = 0, this.precedingJoinState = 0;
          break;
      }
      this.currentState = o3 & 255;
    }
  }
};
var go = /^([\da-f])\/([\da-f])\/([\da-f])$|^([\da-f]{2})\/([\da-f]{2})\/([\da-f]{2})$|^([\da-f]{3})\/([\da-f]{3})\/([\da-f]{3})$|^([\da-f]{4})\/([\da-f]{4})\/([\da-f]{4})$/;
var Io = /^[\da-f]+$/;
function ys(n10) {
  if (!n10) return;
  let i = n10.toLowerCase();
  if (i.startsWith("rgb:")) {
    i = i.slice(4);
    let e = go.exec(i);
    if (e) {
      let t = e[1] ? 15 : e[4] ? 255 : e[7] ? 4095 : 65535;
      return [Math.round(parseInt(e[1] || e[4] || e[7] || e[10], 16) / t * 255), Math.round(parseInt(e[2] || e[5] || e[8] || e[11], 16) / t * 255), Math.round(parseInt(e[3] || e[6] || e[9] || e[12], 16) / t * 255)];
    }
  } else if (i.startsWith("#") && (i = i.slice(1), Io.exec(i) && [3, 6, 9, 12].includes(i.length))) {
    let e = i.length / 3, t = [0, 0, 0];
    for (let r = 0; r < 3; ++r) {
      let s4 = parseInt(i.slice(e * r, e * r + e), 16);
      t[r] = e === 1 ? s4 << 4 : e === 2 ? s4 : e === 3 ? s4 >> 4 : s4 >> 8;
    }
    return t;
  }
}
function Es(n10, i) {
  let e = n10.toString(16), t = e.length < 2 ? "0" + e : e;
  switch (i) {
    case 4:
      return e[0];
    case 8:
      return t;
    case 12:
      return (t + t).slice(0, 3);
    default:
      return t + t;
  }
}
function En(n10, i = 16) {
  let [e, t, r] = n10;
  return `rgb:${Es(e, i)}/${Es(t, i)}/${Es(r, i)}`;
}
var yn = "6.1.0-beta.287";
var Eo = { "(": 0, ")": 1, "*": 2, "+": 3, "-": 1, ".": 2 };
function xn(n10, i) {
  if (n10 > 24) return i.setWinLines || false;
  switch (n10) {
    case 1:
      return !!i.restoreWin;
    case 2:
      return !!i.minimizeWin;
    case 3:
      return !!i.setWinPosition;
    case 4:
      return !!i.setWinSizePixels;
    case 5:
      return !!i.raiseWin;
    case 6:
      return !!i.lowerWin;
    case 7:
      return !!i.refreshWin;
    case 8:
      return !!i.setWinSizeChars;
    case 9:
      return !!i.maximizeWin;
    case 10:
      return !!i.fullscreenWin;
    case 11:
      return !!i.getWinState;
    case 13:
      return !!i.getWinPosition;
    case 14:
      return !!i.getWinSizePixels;
    case 15:
      return !!i.getScreenSizePixels;
    case 16:
      return !!i.getCellSizePixels;
    case 18:
      return !!i.getWinSizeChars;
    case 19:
      return !!i.getScreenSizeChars;
    case 20:
      return !!i.getIconTitle;
    case 21:
      return !!i.getWinTitle;
    case 22:
      return !!i.pushTitle;
    case 23:
      return !!i.popTitle;
    case 24:
      return !!i.setWinLines;
  }
  return false;
}
var wn = 0;
var br = class extends g {
  constructor(e, t, r, s4, o3, a, l3, h, d = new mr()) {
    super();
    this._bufferService = e;
    this._charsetService = t;
    this._coreService = r;
    this._logService = s4;
    this._optionsService = o3;
    this._oscLinkService = a;
    this._mouseStateService = l3;
    this._unicodeService = h;
    this._parser = d;
    this._parseBuffer = new Uint32Array(4096);
    this._stringDecoder = new mi();
    this._utf8Decoder = new bi();
    this._windowTitle = "";
    this._iconName = "";
    this._windowTitleStack = [];
    this._iconNameStack = [];
    this._curAttrData = U.clone();
    this._eraseAttrDataInternal = U.clone();
    this._onRequestBell = this._register(new b());
    this.onRequestBell = this._onRequestBell.event;
    this._onRequestRefreshRows = this._register(new b());
    this.onRequestRefreshRows = this._onRequestRefreshRows.event;
    this._onRequestReset = this._register(new b());
    this.onRequestReset = this._onRequestReset.event;
    this._onRequestSendFocus = this._register(new b());
    this.onRequestSendFocus = this._onRequestSendFocus.event;
    this._onRequestSyncScrollBar = this._register(new b());
    this.onRequestSyncScrollBar = this._onRequestSyncScrollBar.event;
    this._onRequestWindowsOptionsReport = this._register(new b());
    this.onRequestWindowsOptionsReport = this._onRequestWindowsOptionsReport.event;
    this._onA11yChar = this._register(new b());
    this.onA11yChar = this._onA11yChar.event;
    this._onA11yTab = this._register(new b());
    this.onA11yTab = this._onA11yTab.event;
    this._onCursorMove = this._register(new b());
    this.onCursorMove = this._onCursorMove.event;
    this._onLineFeed = this._register(new b());
    this.onLineFeed = this._onLineFeed.event;
    this._onScroll = this._register(new b());
    this.onScroll = this._onScroll.event;
    this._onTitleChange = this._register(new b());
    this.onTitleChange = this._onTitleChange.event;
    this._onColor = this._register(new b());
    this.onColor = this._onColor.event;
    this._onRequestColorSchemeQuery = this._register(new b());
    this.onRequestColorSchemeQuery = this._onRequestColorSchemeQuery.event;
    this._parseStack = { paused: false, cursorStartX: 0, cursorStartY: 0, decodedLength: 0, position: 0 };
    this._specialColors = [256, 257, 258];
    this._register(this._parser), this._dirtyRowTracker = new hi(this._bufferService), this._activeBuffer = this._bufferService.buffer, this._register(this._bufferService.buffers.onBufferActivate((c) => this._activeBuffer = c.activeBuffer)), this._parser.setCsiHandlerFallback((c, u) => {
      this._logService.debug("Unknown CSI code: ", { identifier: this._parser.identToString(c), params: u.toArray() });
    }), this._parser.setEscHandlerFallback((c) => {
      this._logService.debug("Unknown ESC code: ", { identifier: this._parser.identToString(c) });
    }), this._parser.setExecuteHandlerFallback((c) => {
      this._logService.debug("Unknown EXECUTE code: ", { code: c });
    }), this._parser.setOscHandlerFallback((c, u, _) => {
      this._logService.debug("Unknown OSC code: ", { identifier: c, action: u, data: _ });
    }), this._parser.setDcsHandlerFallback((c, u, _) => {
      u === "HOOK" && (_ = _.toArray()), this._logService.debug("Unknown DCS code: ", { identifier: this._parser.identToString(c), action: u, payload: _ });
    }), this._parser.setApcHandlerFallback((c, u, _) => {
      this._logService.debug("Unknown APC code: ", { identifier: this._parser.identToString(c), action: u, payload: _ });
    }), this._parser.setPrintHandler((c, u, _) => this.print(c, u, _)), this._parser.registerCsiHandler({ final: "@" }, (c) => this.insertChars(c)), this._parser.registerCsiHandler({ intermediates: " ", final: "@" }, (c) => this.scrollLeft(c)), this._parser.registerCsiHandler({ final: "A" }, (c) => this.cursorUp(c)), this._parser.registerCsiHandler({ intermediates: " ", final: "A" }, (c) => this.scrollRight(c)), this._parser.registerCsiHandler({ final: "B" }, (c) => this.cursorDown(c)), this._parser.registerCsiHandler({ final: "C" }, (c) => this.cursorForward(c)), this._parser.registerCsiHandler({ final: "D" }, (c) => this.cursorBackward(c)), this._parser.registerCsiHandler({ final: "E" }, (c) => this.cursorNextLine(c)), this._parser.registerCsiHandler({ final: "F" }, (c) => this.cursorPrecedingLine(c)), this._parser.registerCsiHandler({ final: "G" }, (c) => this.cursorCharAbsolute(c)), this._parser.registerCsiHandler({ final: "H" }, (c) => this.cursorPosition(c)), this._parser.registerCsiHandler({ final: "I" }, (c) => this.cursorForwardTab(c)), this._parser.registerCsiHandler({ final: "J" }, (c) => this.eraseInDisplay(c, false)), this._parser.registerCsiHandler({ prefix: "?", final: "J" }, (c) => this.eraseInDisplay(c, true)), this._parser.registerCsiHandler({ final: "K" }, (c) => this.eraseInLine(c, false)), this._parser.registerCsiHandler({ prefix: "?", final: "K" }, (c) => this.eraseInLine(c, true)), this._parser.registerCsiHandler({ final: "L" }, (c) => this.insertLines(c)), this._parser.registerCsiHandler({ final: "M" }, (c) => this.deleteLines(c)), this._parser.registerCsiHandler({ final: "P" }, (c) => this.deleteChars(c)), this._parser.registerCsiHandler({ final: "S" }, (c) => this.scrollUp(c)), this._parser.registerCsiHandler({ final: "T" }, (c) => this.scrollDown(c)), this._parser.registerCsiHandler({ final: "X" }, (c) => this.eraseChars(c)), this._parser.registerCsiHandler({ final: "Z" }, (c) => this.cursorBackwardTab(c)), this._parser.registerCsiHandler({ final: "^" }, (c) => this.scrollDown(c)), this._parser.registerCsiHandler({ final: "`" }, (c) => this.charPosAbsolute(c)), this._parser.registerCsiHandler({ final: "a" }, (c) => this.hPositionRelative(c)), this._parser.registerCsiHandler({ final: "b" }, (c) => this.repeatPrecedingCharacter(c)), this._parser.registerCsiHandler({ final: "c" }, (c) => this.sendDeviceAttributesPrimary(c)), this._parser.registerCsiHandler({ prefix: ">", final: "c" }, (c) => this.sendDeviceAttributesSecondary(c)), this._parser.registerCsiHandler({ final: "d" }, (c) => this.linePosAbsolute(c)), this._parser.registerCsiHandler({ final: "e" }, (c) => this.vPositionRelative(c)), this._parser.registerCsiHandler({ final: "f" }, (c) => this.hVPosition(c)), this._parser.registerCsiHandler({ final: "g" }, (c) => this.tabClear(c)), this._parser.registerCsiHandler({ final: "h" }, (c) => this.setMode(c)), this._parser.registerCsiHandler({ prefix: "?", final: "h" }, (c) => this.setModePrivate(c)), this._parser.registerCsiHandler({ final: "l" }, (c) => this.resetMode(c)), this._parser.registerCsiHandler({ prefix: "?", final: "l" }, (c) => this.resetModePrivate(c)), this._parser.registerCsiHandler({ final: "m" }, (c) => this.charAttributes(c)), this._parser.registerCsiHandler({ final: "n" }, (c) => this.deviceStatus(c)), this._parser.registerCsiHandler({ prefix: "?", final: "n" }, (c) => this.deviceStatusPrivate(c)), this._parser.registerCsiHandler({ intermediates: "!", final: "p" }, (c) => this.softReset(c)), this._parser.registerCsiHandler({ prefix: ">", final: "q" }, (c) => this.sendXtVersion(c)), this._parser.registerCsiHandler({ intermediates: " ", final: "q" }, (c) => this.setCursorStyle(c)), this._parser.registerCsiHandler({ final: "r" }, (c) => this.setScrollRegion(c)), this._parser.registerCsiHandler({ final: "s" }, (c) => this.saveCursor(c)), this._parser.registerCsiHandler({ final: "t" }, (c) => this.windowOptions(c)), this._parser.registerCsiHandler({ final: "u" }, (c) => this.restoreCursor(c)), this._parser.registerCsiHandler({ intermediates: "'", final: "}" }, (c) => this.insertColumns(c)), this._parser.registerCsiHandler({ intermediates: "'", final: "~" }, (c) => this.deleteColumns(c)), this._parser.registerCsiHandler({ intermediates: '"', final: "q" }, (c) => this.selectProtected(c)), this._parser.registerCsiHandler({ intermediates: "$", final: "p" }, (c) => this.requestMode(c, true)), this._parser.registerCsiHandler({ prefix: "?", intermediates: "$", final: "p" }, (c) => this.requestMode(c, false)), this._parser.registerCsiHandler({ prefix: "=", final: "u" }, (c) => this.kittyKeyboardSet(c)), this._parser.registerCsiHandler({ prefix: "?", final: "u" }, (c) => this.kittyKeyboardQuery(c)), this._parser.registerCsiHandler({ prefix: ">", final: "u" }, (c) => this.kittyKeyboardPush(c)), this._parser.registerCsiHandler({ prefix: "<", final: "u" }, (c) => this.kittyKeyboardPop(c)), this._parser.setExecuteHandler("\x07", () => this.bell()), this._parser.setExecuteHandler(`
`, () => this.lineFeed()), this._parser.setExecuteHandler("\v", () => this.lineFeed()), this._parser.setExecuteHandler("\f", () => this.lineFeed()), this._parser.setExecuteHandler("\r", () => this.carriageReturn()), this._parser.setExecuteHandler("\b", () => this.backspace()), this._parser.setExecuteHandler("	", () => this.tab()), this._parser.setExecuteHandler("", () => this.shiftOut()), this._parser.setExecuteHandler("", () => this.shiftIn()), this._parser.setExecuteHandler("\x84", () => this.index()), this._parser.setExecuteHandler("\x85", () => this.nextLine()), this._parser.setExecuteHandler("\x88", () => this.tabSet()), this._parser.registerOscHandler(0, new ne((c) => (this.setTitle(c), this.setIconName(c), true))), this._parser.registerOscHandler(1, new ne((c) => this.setIconName(c))), this._parser.registerOscHandler(2, new ne((c) => this.setTitle(c))), this._parser.registerOscHandler(4, new ne((c) => this.setOrReportIndexedColor(c))), this._parser.registerOscHandler(8, new ne((c) => this.setHyperlink(c))), this._parser.registerOscHandler(10, new ne((c) => this.setOrReportFgColor(c))), this._parser.registerOscHandler(11, new ne((c) => this.setOrReportBgColor(c))), this._parser.registerOscHandler(12, new ne((c) => this.setOrReportCursorColor(c))), this._parser.registerOscHandler(104, new ne((c) => this.restoreIndexedColor(c))), this._parser.registerOscHandler(110, new ne((c) => this.restoreFgColor(c))), this._parser.registerOscHandler(111, new ne((c) => this.restoreBgColor(c))), this._parser.registerOscHandler(112, new ne((c) => this.restoreCursorColor(c))), this._parser.registerEscHandler({ final: "7" }, () => this.saveCursor()), this._parser.registerEscHandler({ final: "8" }, () => this.restoreCursor()), this._parser.registerEscHandler({ final: "D" }, () => this.index()), this._parser.registerEscHandler({ final: "E" }, () => this.nextLine()), this._parser.registerEscHandler({ final: "H" }, () => this.tabSet()), this._parser.registerEscHandler({ final: "M" }, () => this.reverseIndex()), this._parser.registerEscHandler({ final: "=" }, () => this.keypadApplicationMode()), this._parser.registerEscHandler({ final: ">" }, () => this.keypadNumericMode()), this._parser.registerEscHandler({ final: "c" }, () => this.fullReset()), this._parser.registerEscHandler({ final: "n" }, () => this.setgLevel(2)), this._parser.registerEscHandler({ final: "o" }, () => this.setgLevel(3)), this._parser.registerEscHandler({ final: "|" }, () => this.setgLevel(3)), this._parser.registerEscHandler({ final: "}" }, () => this.setgLevel(2)), this._parser.registerEscHandler({ final: "~" }, () => this.setgLevel(1)), this._parser.registerEscHandler({ intermediates: "%", final: "@" }, () => this.selectDefaultCharset()), this._parser.registerEscHandler({ intermediates: "%", final: "G" }, () => this.selectDefaultCharset());
    for (let c in q) this._parser.registerEscHandler({ intermediates: "(", final: c }, () => this.selectCharset("(" + c)), this._parser.registerEscHandler({ intermediates: ")", final: c }, () => this.selectCharset(")" + c)), this._parser.registerEscHandler({ intermediates: "*", final: c }, () => this.selectCharset("*" + c)), this._parser.registerEscHandler({ intermediates: "+", final: c }, () => this.selectCharset("+" + c)), this._parser.registerEscHandler({ intermediates: "-", final: c }, () => this.selectCharset("-" + c)), this._parser.registerEscHandler({ intermediates: ".", final: c }, () => this.selectCharset("." + c)), this._parser.registerEscHandler({ intermediates: "/", final: c }, () => this.selectCharset("/" + c));
    this._parser.registerEscHandler({ intermediates: "#", final: "8" }, () => this.screenAlignmentPattern()), this._parser.setErrorHandler((c) => (this._logService.error("Parsing error: ", c), c)), this._parser.registerDcsHandler({ intermediates: "$", final: "q" }, new li((c, u) => this.requestStatusString(c, u)));
  }
  getAttrData() {
    return this._curAttrData;
  }
  _preserveStack(e, t, r, s4) {
    this._parseStack.paused = true, this._parseStack.cursorStartX = e, this._parseStack.cursorStartY = t, this._parseStack.decodedLength = r, this._parseStack.position = s4;
  }
  _logSlowResolvingAsync(e) {
    if (this._logService.logLevel <= 3) {
      let t, r = new Promise((s4, o3) => {
        t = setTimeout(() => o3("#SLOW_TIMEOUT"), 5e3);
      });
      Promise.race([e, r]).then(() => {
        t !== void 0 && clearTimeout(t);
      }, (s4) => {
        if (t !== void 0 && clearTimeout(t), s4 !== "#SLOW_TIMEOUT") throw s4;
        console.warn("async parser handler taking longer than 5000 ms");
      });
    }
  }
  _getCurrentLinkId() {
    return this._curAttrData.extended.urlId;
  }
  parse(e, t) {
    let r, s4 = this._activeBuffer.x, o3 = this._activeBuffer.y, a = 0, l3 = this._parseStack.paused;
    if (l3) {
      if (r = this._parser.parse(this._parseBuffer, this._parseStack.decodedLength, t)) return this._logSlowResolvingAsync(r), r;
      s4 = this._parseStack.cursorStartX, o3 = this._parseStack.cursorStartY, this._parseStack.paused = false, e.length > 131072 && (a = this._parseStack.position + 131072);
    }
    if (this._logService.logLevel <= 1 && this._logService.debug(`parsing data ${typeof e == "string" ? ` "${e}"` : ` "${Array.prototype.map.call(e, (c) => String.fromCharCode(c)).join("")}"`}`), this._logService.logLevel === 0 && this._logService.trace("parsing data (codes)", typeof e == "string" ? e.split("").map((c) => c.charCodeAt(0)) : e), this._parseBuffer.length < e.length && this._parseBuffer.length < 131072 && (this._parseBuffer = new Uint32Array(Math.min(e.length, 131072))), l3 || this._dirtyRowTracker.clearRange(), e.length > 131072) for (let c = a; c < e.length; c += 131072) {
      let u = c + 131072 < e.length ? c + 131072 : e.length, _ = typeof e == "string" ? this._stringDecoder.decode(e.substring(c, u), this._parseBuffer) : this._utf8Decoder.decode(e.subarray(c, u), this._parseBuffer);
      if (r = this._parser.parse(this._parseBuffer, _)) return this._preserveStack(s4, o3, _, c), this._logSlowResolvingAsync(r), r;
    }
    else if (!l3) {
      let c = typeof e == "string" ? this._stringDecoder.decode(e, this._parseBuffer) : this._utf8Decoder.decode(e, this._parseBuffer);
      if (r = this._parser.parse(this._parseBuffer, c)) return this._preserveStack(s4, o3, c, 0), this._logSlowResolvingAsync(r), r;
    }
    (this._activeBuffer.x !== s4 || this._activeBuffer.y !== o3) && this._onCursorMove.fire();
    let h = this._dirtyRowTracker.end + (this._bufferService.buffer.ybase - this._bufferService.buffer.ydisp), d = this._dirtyRowTracker.start + (this._bufferService.buffer.ybase - this._bufferService.buffer.ydisp);
    d < this._bufferService.rows && this._onRequestRefreshRows.fire({ start: Math.min(d, this._bufferService.rows - 1), end: Math.min(h, this._bufferService.rows - 1) });
  }
  print(e, t, r) {
    let s4, o3, a = this._charsetService.charset, l3 = this._optionsService.rawOptions.screenReaderMode, h = this._bufferService.cols, d = this._coreService.decPrivateModes.wraparound, c = this._coreService.modes.insertMode, u = this._curAttrData, _ = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
    if (!_) return;
    this._dirtyRowTracker.markDirty(this._activeBuffer.y), this._activeBuffer.x && r - t > 0 && _.getWidth(this._activeBuffer.x - 1) === 2 && _.setCellFromCodepoint(this._activeBuffer.x - 1, 0, 1, u);
    let p = this._parser.precedingJoinState;
    for (let v = t; v < r; ++v) {
      if (s4 = e[v], s4 === 173) continue;
      if (s4 < 127 && a) {
        let L = a[String.fromCharCode(s4)];
        L && (s4 = L.charCodeAt(0));
      }
      let f2 = this._unicodeService.charProperties(s4, p);
      o3 = me.extractWidth(f2);
      let S = me.extractShouldJoin(f2), I = S ? me.extractWidth(p) : 0;
      p = f2, l3 && this._onA11yChar.fire(be(s4));
      let w2 = this._getCurrentLinkId();
      if (w2 && this._oscLinkService.addLineToLink(w2, this._activeBuffer.ybase + this._activeBuffer.y), this._activeBuffer.x + o3 - I > h) {
        if (d) {
          let L = _, T2 = this._activeBuffer.x - I;
          if (this._activeBuffer.x = I, this._activeBuffer.y++, this._activeBuffer.y === this._activeBuffer.scrollBottom + 1 ? (this._activeBuffer.y--, this._bufferService.scroll(this._eraseAttrData(), true)) : (this._activeBuffer.y >= this._bufferService.rows && (this._activeBuffer.y = this._bufferService.rows - 1), this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y).isWrapped = true), _ = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y), !_) return;
          for (I > 0 && _ instanceof De && _.copyCellsFrom(L, T2, 0, I, false); T2 < h; ) L.setCellFromCodepoint(T2++, 0, 1, u);
        } else if (this._activeBuffer.x = h - 1, o3 === 2) continue;
      }
      if (S && this._activeBuffer.x) {
        let L = _.getWidth(this._activeBuffer.x - 1) ? 1 : 2;
        _.addCodepointToCell(this._activeBuffer.x - L, s4, o3);
        for (let T2 = o3 - I; --T2 >= 0; ) _.setCellFromCodepoint(this._activeBuffer.x++, 0, 0, u);
        continue;
      }
      if (c && (_.insertCells(this._activeBuffer.x, o3 - I, this._activeBuffer.getNullCell(u)), _.getWidth(h - 1) === 2 && _.setCellFromCodepoint(h - 1, 0, 1, u)), _.setCellFromCodepoint(this._activeBuffer.x++, s4, o3, u), o3 > 0) for (; --o3; ) _.setCellFromCodepoint(this._activeBuffer.x++, 0, 0, u);
    }
    this._parser.precedingJoinState = p, this._activeBuffer.x < h && r - t > 0 && _.getWidth(this._activeBuffer.x) === 0 && !_.hasContent(this._activeBuffer.x) && _.setCellFromCodepoint(this._activeBuffer.x, 0, 1, u), this._dirtyRowTracker.markDirty(this._activeBuffer.y);
  }
  registerCsiHandler(e, t) {
    return e.final === "t" && !e.prefix && !e.intermediates ? this._parser.registerCsiHandler(e, (r) => xn(r.params[0], this._optionsService.rawOptions.windowOptions) ? t(r) : true) : this._parser.registerCsiHandler(e, t);
  }
  registerDcsHandler(e, t) {
    return this._parser.registerDcsHandler(e, new li(t));
  }
  registerEscHandler(e, t) {
    return this._parser.registerEscHandler(e, t);
  }
  registerOscHandler(e, t) {
    return this._parser.registerOscHandler(e, new ne(t));
  }
  registerApcHandler(e, t) {
    return this._parser.registerApcHandler(e, new _r(t));
  }
  bell() {
    return this._onRequestBell.fire(), true;
  }
  lineFeed() {
    return this._dirtyRowTracker.markDirty(this._activeBuffer.y), this._optionsService.rawOptions.convertEol && (this._activeBuffer.x = 0), this._activeBuffer.y++, this._activeBuffer.y === this._activeBuffer.scrollBottom + 1 ? (this._activeBuffer.y--, this._bufferService.scroll(this._eraseAttrData())) : this._activeBuffer.y >= this._bufferService.rows ? this._activeBuffer.y = this._bufferService.rows - 1 : this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y).isWrapped = false, this._activeBuffer.x >= this._bufferService.cols && this._activeBuffer.x--, this._dirtyRowTracker.markDirty(this._activeBuffer.y), this._onLineFeed.fire(), true;
  }
  carriageReturn() {
    return this._activeBuffer.x = 0, true;
  }
  backspace() {
    if (!this._coreService.decPrivateModes.reverseWraparound) return this._restrictCursor(), this._activeBuffer.x > 0 && this._activeBuffer.x--, true;
    if (this._restrictCursor(this._bufferService.cols), this._activeBuffer.x > 0) this._activeBuffer.x--;
    else if (this._activeBuffer.x === 0 && this._activeBuffer.y > this._activeBuffer.scrollTop && this._activeBuffer.y <= this._activeBuffer.scrollBottom && this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y)?.isWrapped) {
      this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y).isWrapped = false, this._activeBuffer.y--, this._activeBuffer.x = this._bufferService.cols - 1;
      let e = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
      e.hasWidth(this._activeBuffer.x) && !e.hasContent(this._activeBuffer.x) && this._activeBuffer.x--;
    }
    return this._restrictCursor(), true;
  }
  tab() {
    if (this._activeBuffer.x >= this._bufferService.cols) return true;
    let e = this._activeBuffer.x;
    return this._activeBuffer.x = this._activeBuffer.nextStop(), this._optionsService.rawOptions.screenReaderMode && this._onA11yTab.fire(this._activeBuffer.x - e), true;
  }
  shiftOut() {
    return this._charsetService.setgLevel(1), true;
  }
  shiftIn() {
    return this._charsetService.setgLevel(0), true;
  }
  _restrictCursor(e = this._bufferService.cols - 1) {
    this._activeBuffer.x = Math.min(e, Math.max(0, this._activeBuffer.x)), this._activeBuffer.y = this._coreService.decPrivateModes.origin ? Math.min(this._activeBuffer.scrollBottom, Math.max(this._activeBuffer.scrollTop, this._activeBuffer.y)) : Math.min(this._bufferService.rows - 1, Math.max(0, this._activeBuffer.y)), this._dirtyRowTracker.markDirty(this._activeBuffer.y);
  }
  _setCursor(e, t) {
    this._dirtyRowTracker.markDirty(this._activeBuffer.y), this._coreService.decPrivateModes.origin ? (this._activeBuffer.x = e, this._activeBuffer.y = this._activeBuffer.scrollTop + t) : (this._activeBuffer.x = e, this._activeBuffer.y = t), this._restrictCursor(), this._dirtyRowTracker.markDirty(this._activeBuffer.y);
  }
  _moveCursor(e, t) {
    this._restrictCursor(), this._setCursor(this._activeBuffer.x + e, this._activeBuffer.y + t);
  }
  cursorUp(e) {
    let t = this._activeBuffer.y - this._activeBuffer.scrollTop;
    return t >= 0 ? this._moveCursor(0, -Math.min(t, e.params[0] || 1)) : this._moveCursor(0, -(e.params[0] || 1)), true;
  }
  cursorDown(e) {
    let t = this._activeBuffer.scrollBottom - this._activeBuffer.y;
    return t >= 0 ? this._moveCursor(0, Math.min(t, e.params[0] || 1)) : this._moveCursor(0, e.params[0] || 1), true;
  }
  cursorForward(e) {
    return this._moveCursor(e.params[0] || 1, 0), true;
  }
  cursorBackward(e) {
    return this._moveCursor(-(e.params[0] || 1), 0), true;
  }
  cursorNextLine(e) {
    return this.cursorDown(e), this._activeBuffer.x = 0, true;
  }
  cursorPrecedingLine(e) {
    return this.cursorUp(e), this._activeBuffer.x = 0, true;
  }
  cursorCharAbsolute(e) {
    return this._setCursor((e.params[0] || 1) - 1, this._activeBuffer.y), true;
  }
  cursorPosition(e) {
    return this._setCursor(e.length >= 2 ? (e.params[1] || 1) - 1 : 0, (e.params[0] || 1) - 1), true;
  }
  charPosAbsolute(e) {
    return this._setCursor((e.params[0] || 1) - 1, this._activeBuffer.y), true;
  }
  hPositionRelative(e) {
    return this._moveCursor(e.params[0] || 1, 0), true;
  }
  linePosAbsolute(e) {
    return this._setCursor(this._activeBuffer.x, (e.params[0] || 1) - 1), true;
  }
  vPositionRelative(e) {
    return this._moveCursor(0, e.params[0] || 1), true;
  }
  hVPosition(e) {
    return this.cursorPosition(e), true;
  }
  tabClear(e) {
    let t = e.params[0];
    return t === 0 ? delete this._activeBuffer.tabs[this._activeBuffer.x] : t === 3 && (this._activeBuffer.tabs = {}), true;
  }
  cursorForwardTab(e) {
    if (this._activeBuffer.x >= this._bufferService.cols) return true;
    let t = e.params[0] || 1;
    for (; t--; ) this._activeBuffer.x = this._activeBuffer.nextStop();
    return true;
  }
  cursorBackwardTab(e) {
    if (this._activeBuffer.x >= this._bufferService.cols) return true;
    let t = e.params[0] || 1;
    for (; t--; ) this._activeBuffer.x = this._activeBuffer.prevStop();
    return true;
  }
  selectProtected(e) {
    let t = e.params[0];
    return t === 1 && (this._curAttrData.bg |= 536870912), (t === 2 || t === 0) && (this._curAttrData.bg &= -536870913), true;
  }
  _eraseInBufferLine(e, t, r, s4 = false, o3 = false) {
    let a = this._activeBuffer.lines.get(this._activeBuffer.ybase + e);
    a && (a.replaceCells(t, r, this._activeBuffer.getNullCell(this._eraseAttrData()), o3), s4 && (a.isWrapped = false));
  }
  _resetBufferLine(e, t = false) {
    let r = this._activeBuffer.lines.get(this._activeBuffer.ybase + e);
    r && (r.fill(this._activeBuffer.getNullCell(this._eraseAttrData()), t), this._bufferService.buffer.clearMarkers(this._activeBuffer.ybase + e), r.isWrapped = false);
  }
  eraseInDisplay(e, t = false) {
    this._restrictCursor(this._bufferService.cols);
    let r;
    switch (e.params[0]) {
      case 0:
        for (r = this._activeBuffer.y, this._dirtyRowTracker.markDirty(r), this._eraseInBufferLine(r++, this._activeBuffer.x, this._bufferService.cols, this._activeBuffer.x === 0, t); r < this._bufferService.rows; r++) this._resetBufferLine(r, t);
        this._dirtyRowTracker.markDirty(r);
        break;
      case 1:
        if (r = this._activeBuffer.y, this._dirtyRowTracker.markDirty(r), this._eraseInBufferLine(r, 0, this._activeBuffer.x + 1, true, t), this._activeBuffer.x + 1 >= this._bufferService.cols) {
          let o3 = this._activeBuffer.lines.get(r + 1);
          o3 && (o3.isWrapped = false);
        }
        for (; r--; ) this._resetBufferLine(r, t);
        this._dirtyRowTracker.markDirty(0);
        break;
      case 2:
        if (this._optionsService.rawOptions.scrollOnEraseInDisplay) {
          for (r = this._bufferService.rows, this._dirtyRowTracker.markRangeDirty(0, r - 1); r-- && !this._activeBuffer.lines.get(this._activeBuffer.ybase + r)?.getTrimmedLength(); ) ;
          for (; r >= 0; r--) this._bufferService.scroll(this._eraseAttrData());
        } else {
          for (r = this._bufferService.rows, this._dirtyRowTracker.markDirty(r - 1); r--; ) this._resetBufferLine(r, t);
          this._dirtyRowTracker.markDirty(0);
        }
        break;
      case 3:
        let s4 = this._activeBuffer.lines.length - this._bufferService.rows;
        s4 > 0 && (this._activeBuffer.lines.trimStart(s4), this._activeBuffer.ybase = Math.max(this._activeBuffer.ybase - s4, 0), this._activeBuffer.ydisp = Math.max(this._activeBuffer.ydisp - s4, 0), this._onScroll.fire(0));
        break;
    }
    return true;
  }
  eraseInLine(e, t = false) {
    switch (this._restrictCursor(this._bufferService.cols), e.params[0]) {
      case 0:
        this._eraseInBufferLine(this._activeBuffer.y, this._activeBuffer.x, this._bufferService.cols, this._activeBuffer.x === 0, t);
        break;
      case 1:
        this._eraseInBufferLine(this._activeBuffer.y, 0, this._activeBuffer.x + 1, false, t);
        break;
      case 2:
        this._eraseInBufferLine(this._activeBuffer.y, 0, this._bufferService.cols, true, t);
        break;
    }
    return this._dirtyRowTracker.markDirty(this._activeBuffer.y), true;
  }
  insertLines(e) {
    this._restrictCursor();
    let t = e.params[0] || 1;
    if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop) return true;
    let r = this._activeBuffer.ybase + this._activeBuffer.y, s4 = this._bufferService.rows - 1 - this._activeBuffer.scrollBottom, o3 = this._bufferService.rows - 1 + this._activeBuffer.ybase - s4 + 1;
    for (; t--; ) this._activeBuffer.lines.splice(o3 - 1, 1), this._activeBuffer.lines.splice(r, 0, this._activeBuffer.getBlankLine(this._eraseAttrData()));
    return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.y, this._activeBuffer.scrollBottom), this._activeBuffer.x = 0, true;
  }
  deleteLines(e) {
    this._restrictCursor();
    let t = e.params[0] || 1;
    if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop) return true;
    let r = this._activeBuffer.ybase + this._activeBuffer.y, s4;
    for (s4 = this._bufferService.rows - 1 - this._activeBuffer.scrollBottom, s4 = this._bufferService.rows - 1 + this._activeBuffer.ybase - s4; t--; ) this._activeBuffer.lines.splice(r, 1), this._activeBuffer.lines.splice(s4, 0, this._activeBuffer.getBlankLine(this._eraseAttrData()));
    return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.y, this._activeBuffer.scrollBottom), this._activeBuffer.x = 0, true;
  }
  insertChars(e) {
    this._restrictCursor();
    let t = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
    return t && (t.insertCells(this._activeBuffer.x, e.params[0] || 1, this._activeBuffer.getNullCell(this._eraseAttrData())), this._dirtyRowTracker.markDirty(this._activeBuffer.y)), true;
  }
  deleteChars(e) {
    this._restrictCursor();
    let t = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
    return t && (t.deleteCells(this._activeBuffer.x, e.params[0] || 1, this._activeBuffer.getNullCell(this._eraseAttrData())), this._dirtyRowTracker.markDirty(this._activeBuffer.y)), true;
  }
  scrollUp(e) {
    let t = e.params[0] || 1;
    for (; t--; ) this._activeBuffer.lines.splice(this._activeBuffer.ybase + this._activeBuffer.scrollTop, 1), this._activeBuffer.lines.splice(this._activeBuffer.ybase + this._activeBuffer.scrollBottom, 0, this._activeBuffer.getBlankLine(this._eraseAttrData()));
    return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), true;
  }
  scrollDown(e) {
    let t = e.params[0] || 1;
    for (; t--; ) this._activeBuffer.lines.splice(this._activeBuffer.ybase + this._activeBuffer.scrollBottom, 1), this._activeBuffer.lines.splice(this._activeBuffer.ybase + this._activeBuffer.scrollTop, 0, this._activeBuffer.getBlankLine(U));
    return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), true;
  }
  scrollLeft(e) {
    if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop) return true;
    let t = e.params[0] || 1;
    for (let r = this._activeBuffer.scrollTop; r <= this._activeBuffer.scrollBottom; ++r) {
      let s4 = this._activeBuffer.lines.get(this._activeBuffer.ybase + r);
      s4.deleteCells(0, t, this._activeBuffer.getNullCell(this._eraseAttrData())), s4.isWrapped = false;
    }
    return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), true;
  }
  scrollRight(e) {
    if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop) return true;
    let t = e.params[0] || 1;
    for (let r = this._activeBuffer.scrollTop; r <= this._activeBuffer.scrollBottom; ++r) {
      let s4 = this._activeBuffer.lines.get(this._activeBuffer.ybase + r);
      s4.insertCells(0, t, this._activeBuffer.getNullCell(this._eraseAttrData())), s4.isWrapped = false;
    }
    return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), true;
  }
  insertColumns(e) {
    if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop) return true;
    let t = e.params[0] || 1;
    for (let r = this._activeBuffer.scrollTop; r <= this._activeBuffer.scrollBottom; ++r) {
      let s4 = this._activeBuffer.lines.get(this._activeBuffer.ybase + r);
      s4.insertCells(this._activeBuffer.x, t, this._activeBuffer.getNullCell(this._eraseAttrData())), s4.isWrapped = false;
    }
    return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), true;
  }
  deleteColumns(e) {
    if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop) return true;
    let t = e.params[0] || 1;
    for (let r = this._activeBuffer.scrollTop; r <= this._activeBuffer.scrollBottom; ++r) {
      let s4 = this._activeBuffer.lines.get(this._activeBuffer.ybase + r);
      s4.deleteCells(this._activeBuffer.x, t, this._activeBuffer.getNullCell(this._eraseAttrData())), s4.isWrapped = false;
    }
    return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), true;
  }
  eraseChars(e) {
    this._restrictCursor();
    let t = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
    return t && (t.replaceCells(this._activeBuffer.x, this._activeBuffer.x + (e.params[0] || 1), this._activeBuffer.getNullCell(this._eraseAttrData())), this._dirtyRowTracker.markDirty(this._activeBuffer.y)), true;
  }
  repeatPrecedingCharacter(e) {
    let t = this._parser.precedingJoinState;
    if (!t) return true;
    let r = e.params[0] || 1, s4 = me.extractWidth(t), o3 = this._activeBuffer.x - s4, l3 = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y).getString(o3), h = new Uint32Array(l3.length * r), d = 0;
    for (let u = 0; u < l3.length; ) {
      let _ = l3.codePointAt(u) || 0;
      h[d++] = _, u += _ > 65535 ? 2 : 1;
    }
    let c = d;
    for (let u = 1; u < r; ++u) h.copyWithin(c, 0, d), c += d;
    return this.print(h, 0, c), true;
  }
  sendDeviceAttributesPrimary(e) {
    return e.params[0] > 0 || (this._is("xterm") || this._is("rxvt-unicode") || this._is("screen") ? this._coreService.triggerDataEvent("\x1B[?1;2c") : this._is("linux") && this._coreService.triggerDataEvent("\x1B[?6c")), true;
  }
  sendDeviceAttributesSecondary(e) {
    return e.params[0] > 0 || (this._is("xterm") ? this._coreService.triggerDataEvent("\x1B[>0;276;0c") : this._is("rxvt-unicode") ? this._coreService.triggerDataEvent("\x1B[>85;95;0c") : this._is("linux") ? this._coreService.triggerDataEvent(e.params[0] + "c") : this._is("screen") && this._coreService.triggerDataEvent("\x1B[>83;40003;0c")), true;
  }
  sendXtVersion(e) {
    return e.params[0] > 0 || this._coreService.triggerDataEvent(`\x1BP>|xterm.js(${yn})\x1B\\`), true;
  }
  _is(e) {
    return (this._optionsService.rawOptions.termName + "").startsWith(e);
  }
  setMode(e) {
    for (let t = 0; t < e.length; t++) switch (e.params[t]) {
      case 4:
        this._coreService.modes.insertMode = true;
        break;
      case 20:
        this._optionsService.options.convertEol = true;
        break;
    }
    return true;
  }
  setModePrivate(e) {
    for (let t = 0; t < e.length; t++) switch (e.params[t]) {
      case 1:
        this._coreService.decPrivateModes.applicationCursorKeys = true;
        break;
      case 2:
        this._charsetService.setgCharset(0, Re), this._charsetService.setgCharset(1, Re), this._charsetService.setgCharset(2, Re), this._charsetService.setgCharset(3, Re);
        break;
      case 3:
        this._optionsService.rawOptions.windowOptions.setWinLines && (this._bufferService.resize(132, this._bufferService.rows), this._onRequestReset.fire());
        break;
      case 6:
        this._coreService.decPrivateModes.origin = true, this._setCursor(0, 0);
        break;
      case 7:
        this._coreService.decPrivateModes.wraparound = true;
        break;
      case 12:
        this._optionsService.rawOptions.quirks?.allowSetCursorBlink && (this._optionsService.options.cursorBlink = true);
        break;
      case 45:
        this._coreService.decPrivateModes.reverseWraparound = true;
        break;
      case 66:
        this._logService.debug("Serial port requested application keypad."), this._coreService.decPrivateModes.applicationKeypad = true, this._onRequestSyncScrollBar.fire();
        break;
      case 9:
        this._mouseStateService.activeProtocol = "X10";
        break;
      case 1e3:
        this._mouseStateService.activeProtocol = "VT200";
        break;
      case 1002:
        this._mouseStateService.activeProtocol = "DRAG";
        break;
      case 1003:
        this._mouseStateService.activeProtocol = "ANY";
        break;
      case 1004:
        this._coreService.decPrivateModes.sendFocus = true, this._onRequestSendFocus.fire();
        break;
      case 1005:
        this._logService.debug("DECSET 1005 not supported (see #2507)");
        break;
      case 1006:
        this._mouseStateService.activeEncoding = "SGR";
        break;
      case 1015:
        this._logService.debug("DECSET 1015 not supported (see #2507)");
        break;
      case 1016:
        this._mouseStateService.activeEncoding = "SGR_PIXELS";
        break;
      case 25:
        this._coreService.isCursorHidden = false;
        break;
      case 1048:
        this.saveCursor();
        break;
      case 1049:
        this.saveCursor();
      case 47:
      case 1047:
        if (this._optionsService.rawOptions.vtExtensions?.kittyKeyboard) {
          let r = this._coreService.kittyKeyboard;
          r.mainFlags = r.flags, r.flags = r.altFlags;
        }
        this._bufferService.buffers.activateAltBuffer(this._eraseAttrData()), this._coreService.isCursorInitialized = true, this._onRequestRefreshRows.fire(void 0), this._onRequestSyncScrollBar.fire();
        break;
      case 2004:
        this._coreService.decPrivateModes.bracketedPasteMode = true;
        break;
      case 2026:
        this._coreService.decPrivateModes.synchronizedOutput = true;
        break;
      case 2031:
        (this._optionsService.rawOptions.vtExtensions?.colorSchemeQuery ?? true) && (this._coreService.decPrivateModes.colorSchemeUpdates = true);
        break;
      case 9001:
        this._optionsService.rawOptions.vtExtensions?.win32InputMode && (this._coreService.decPrivateModes.win32InputMode = true);
        break;
    }
    return true;
  }
  resetMode(e) {
    for (let t = 0; t < e.length; t++) switch (e.params[t]) {
      case 4:
        this._coreService.modes.insertMode = false;
        break;
      case 20:
        this._optionsService.options.convertEol = false;
        break;
    }
    return true;
  }
  resetModePrivate(e) {
    for (let t = 0; t < e.length; t++) switch (e.params[t]) {
      case 1:
        this._coreService.decPrivateModes.applicationCursorKeys = false;
        break;
      case 3:
        this._optionsService.rawOptions.windowOptions.setWinLines && (this._bufferService.resize(80, this._bufferService.rows), this._onRequestReset.fire());
        break;
      case 6:
        this._coreService.decPrivateModes.origin = false, this._setCursor(0, 0);
        break;
      case 7:
        this._coreService.decPrivateModes.wraparound = false;
        break;
      case 12:
        this._optionsService.rawOptions.quirks?.allowSetCursorBlink && (this._optionsService.options.cursorBlink = false);
        break;
      case 45:
        this._coreService.decPrivateModes.reverseWraparound = false;
        break;
      case 66:
        this._logService.debug("Switching back to normal keypad."), this._coreService.decPrivateModes.applicationKeypad = false, this._onRequestSyncScrollBar.fire();
        break;
      case 9:
      case 1e3:
      case 1002:
      case 1003:
        this._mouseStateService.activeProtocol = "NONE";
        break;
      case 1004:
        this._coreService.decPrivateModes.sendFocus = false;
        break;
      case 1005:
        this._logService.debug("DECRST 1005 not supported (see #2507)");
        break;
      case 1006:
        this._mouseStateService.activeEncoding = "DEFAULT";
        break;
      case 1015:
        this._logService.debug("DECRST 1015 not supported (see #2507)");
        break;
      case 1016:
        this._mouseStateService.activeEncoding = "DEFAULT";
        break;
      case 25:
        this._coreService.isCursorHidden = true;
        break;
      case 1048:
        this.restoreCursor();
        break;
      case 1049:
      case 47:
      case 1047:
        if (this._optionsService.rawOptions.vtExtensions?.kittyKeyboard) {
          let r = this._coreService.kittyKeyboard;
          r.altFlags = r.flags, r.flags = r.mainFlags;
        }
        this._bufferService.buffers.activateNormalBuffer(), e.params[t] === 1049 && this.restoreCursor(), this._coreService.isCursorInitialized = true, this._onRequestRefreshRows.fire(void 0), this._onRequestSyncScrollBar.fire();
        break;
      case 2004:
        this._coreService.decPrivateModes.bracketedPasteMode = false;
        break;
      case 2026:
        this._coreService.decPrivateModes.synchronizedOutput = false, this._onRequestRefreshRows.fire(void 0);
        break;
      case 2031:
        (this._optionsService.rawOptions.vtExtensions?.colorSchemeQuery ?? true) && (this._coreService.decPrivateModes.colorSchemeUpdates = false);
        break;
      case 9001:
        this._optionsService.rawOptions.vtExtensions?.win32InputMode && (this._coreService.decPrivateModes.win32InputMode = false);
        break;
    }
    return true;
  }
  requestMode(e, t) {
    let r;
    ((te2) => (te2[te2.NOT_RECOGNIZED = 0] = "NOT_RECOGNIZED", te2[te2.SET = 1] = "SET", te2[te2.RESET = 2] = "RESET", te2[te2.PERMANENTLY_SET = 3] = "PERMANENTLY_SET", te2[te2.PERMANENTLY_RESET = 4] = "PERMANENTLY_RESET"))(r ||= {});
    let s4 = this._coreService.decPrivateModes, { activeProtocol: o3, activeEncoding: a } = this._mouseStateService, l3 = this._coreService, { buffers: h, cols: d } = this._bufferService, { active: c, alt: u } = h, _ = this._optionsService.rawOptions, p = (S, I) => (l3.triggerDataEvent(`\x1B[${t ? "" : "?"}${S};${I}$y`), true), v = (S) => S ? 1 : 2, f2 = e.params[0];
    return t ? f2 === 2 ? p(f2, 4) : f2 === 4 ? p(f2, v(l3.modes.insertMode)) : f2 === 12 ? p(f2, 3) : f2 === 20 ? p(f2, v(_.convertEol)) : p(f2, 0) : f2 === 1 ? p(f2, v(s4.applicationCursorKeys)) : f2 === 3 ? p(f2, _.windowOptions.setWinLines ? d === 80 ? 2 : d === 132 ? 1 : 0 : 0) : f2 === 6 ? p(f2, v(s4.origin)) : f2 === 7 ? p(f2, v(s4.wraparound)) : f2 === 8 ? p(f2, 3) : f2 === 9 ? p(f2, v(o3 === "X10")) : f2 === 12 ? p(f2, v(_.cursorBlink)) : f2 === 25 ? p(f2, v(!l3.isCursorHidden)) : f2 === 45 ? p(f2, v(s4.reverseWraparound)) : f2 === 66 ? p(f2, v(s4.applicationKeypad)) : f2 === 67 ? p(f2, 4) : f2 === 1e3 ? p(f2, v(o3 === "VT200")) : f2 === 1002 ? p(f2, v(o3 === "DRAG")) : f2 === 1003 ? p(f2, v(o3 === "ANY")) : f2 === 1004 ? p(f2, v(s4.sendFocus)) : f2 === 1005 ? p(f2, 4) : f2 === 1006 ? p(f2, v(a === "SGR")) : f2 === 1015 ? p(f2, 4) : f2 === 1016 ? p(f2, v(a === "SGR_PIXELS")) : f2 === 1048 ? p(f2, 1) : f2 === 47 || f2 === 1047 || f2 === 1049 ? p(f2, v(c === u)) : f2 === 2004 ? p(f2, v(s4.bracketedPasteMode)) : f2 === 2026 ? p(f2, v(s4.synchronizedOutput)) : f2 === 9001 && this._optionsService.rawOptions.vtExtensions?.win32InputMode ? p(f2, v(s4.win32InputMode)) : p(f2, 0);
  }
  _updateAttrColor(e, t, r, s4, o3) {
    return t === 2 ? (e |= 50331648, e &= -16777216, e |= ue.fromColorRGB([r, s4, o3])) : t === 5 && (e &= -67108864, e |= 33554432 | r & 255), e;
  }
  _extractColor(e, t, r) {
    let s4 = [0, 0, -1, 0, 0, 0], o3 = 0, a = 0;
    do {
      if (s4[a + o3] = e.params[t + a], e.hasSubParams(t + a)) {
        let l3 = e.getSubParams(t + a), h = 0;
        do
          s4[1] === 5 && (o3 = 1), s4[a + h + 1 + o3] = l3[h];
        while (++h < l3.length && h + a + 1 + o3 < s4.length);
        break;
      }
      if (s4[1] === 5 && a + o3 >= 2 || s4[1] === 2 && a + o3 >= 5) break;
      s4[1] && (o3 = 1);
    } while (++a + t < e.length && a + o3 < s4.length);
    for (let l3 = 2; l3 < s4.length; ++l3) s4[l3] === -1 && (s4[l3] = 0);
    switch (s4[0]) {
      case 38:
        r.fg = this._updateAttrColor(r.fg, s4[1], s4[3], s4[4], s4[5]);
        break;
      case 48:
        r.bg = this._updateAttrColor(r.bg, s4[1], s4[3], s4[4], s4[5]);
        break;
      case 58:
        r.extended = r.extended.clone(), r.extended.underlineColor = this._updateAttrColor(r.extended.underlineColor, s4[1], s4[3], s4[4], s4[5]);
    }
    return a;
  }
  _processUnderline(e, t) {
    t.extended = t.extended.clone(), (!~e || e > 5) && (e = 1), t.extended.underlineStyle = e, t.fg |= 268435456, e === 0 && (t.fg &= -268435457), t.updateExtended();
  }
  _processSGR0(e) {
    e.fg = U.fg, e.bg = U.bg, e.extended = e.extended.clone(), e.extended.underlineStyle = 0, e.extended.underlineColor &= -67108864, e.updateExtended();
  }
  charAttributes(e) {
    if (e.length === 1 && e.params[0] === 0) return this._processSGR0(this._curAttrData), true;
    let t = e.length, r, s4 = this._curAttrData;
    for (let o3 = 0; o3 < t; o3++) r = e.params[o3], r >= 30 && r <= 37 ? (s4.fg &= -67108864, s4.fg |= 16777216 | r - 30) : r >= 40 && r <= 47 ? (s4.bg &= -67108864, s4.bg |= 16777216 | r - 40) : r >= 90 && r <= 97 ? (s4.fg &= -67108864, s4.fg |= 16777216 | r - 90 | 8) : r >= 100 && r <= 107 ? (s4.bg &= -67108864, s4.bg |= 16777216 | r - 100 | 8) : r === 0 ? this._processSGR0(s4) : r === 1 ? s4.fg |= 134217728 : r === 3 ? s4.bg |= 67108864 : r === 4 ? (s4.fg |= 268435456, this._processUnderline(e.hasSubParams(o3) ? e.getSubParams(o3)[0] : 1, s4)) : r === 5 ? s4.fg |= 536870912 : r === 7 ? s4.fg |= 67108864 : r === 8 ? s4.fg |= 1073741824 : r === 9 ? s4.fg |= 2147483648 : r === 2 ? s4.bg |= 134217728 : r === 21 ? this._processUnderline(2, s4) : r === 22 ? (s4.fg &= -134217729, s4.bg &= -134217729) : r === 23 ? s4.bg &= -67108865 : r === 24 ? (s4.fg &= -268435457, this._processUnderline(0, s4)) : r === 25 ? s4.fg &= -536870913 : r === 27 ? s4.fg &= -67108865 : r === 28 ? s4.fg &= -1073741825 : r === 29 ? s4.fg &= 2147483647 : r === 39 ? (s4.fg &= -67108864, s4.fg |= U.fg & 16777215) : r === 49 ? (s4.bg &= -67108864, s4.bg |= U.bg & 16777215) : r === 38 || r === 48 || r === 58 ? o3 += this._extractColor(e, o3, s4) : r === 53 ? s4.bg |= 1073741824 : r === 55 ? s4.bg &= -1073741825 : r === 221 && (this._optionsService.rawOptions.vtExtensions?.kittySgrBoldFaintControl ?? true) ? s4.fg &= -134217729 : r === 222 && (this._optionsService.rawOptions.vtExtensions?.kittySgrBoldFaintControl ?? true) ? s4.bg &= -134217729 : r === 59 ? (s4.extended = s4.extended.clone(), s4.extended.underlineColor = -1, s4.updateExtended()) : this._logService.debug("Unknown SGR attribute: %d.", r);
    return true;
  }
  deviceStatus(e) {
    switch (e.params[0]) {
      case 5:
        this._coreService.triggerDataEvent("\x1B[0n");
        break;
      case 6:
        let t = this._activeBuffer.y + 1, r = this._activeBuffer.x + 1;
        this._coreService.triggerDataEvent(`\x1B[${t};${r}R`);
        break;
    }
    return true;
  }
  deviceStatusPrivate(e) {
    switch (e.params[0]) {
      case 6:
        let t = this._activeBuffer.y + 1, r = this._activeBuffer.x + 1;
        this._coreService.triggerDataEvent(`\x1B[?${t};${r}R`);
        break;
      case 15:
        break;
      case 25:
        break;
      case 26:
        break;
      case 53:
        break;
      case 996:
        (this._optionsService.rawOptions.vtExtensions?.colorSchemeQuery ?? true) && this._onRequestColorSchemeQuery.fire();
        break;
    }
    return true;
  }
  softReset(e) {
    return this._coreService.isCursorHidden = false, this._onRequestSyncScrollBar.fire(), this._activeBuffer.scrollTop = 0, this._activeBuffer.scrollBottom = this._bufferService.rows - 1, this._curAttrData = U.clone(), this._coreService.reset(), this._charsetService.reset(), this._activeBuffer.savedX = 0, this._activeBuffer.savedY = this._activeBuffer.ybase, this._activeBuffer.savedCurAttrData.fg = this._curAttrData.fg, this._activeBuffer.savedCurAttrData.bg = this._curAttrData.bg, this._activeBuffer.savedCharset = this._charsetService.charset, this._coreService.decPrivateModes.origin = false, true;
  }
  setCursorStyle(e) {
    let t = e.length === 0 ? 1 : e.params[0];
    if (t === 0) this._coreService.decPrivateModes.cursorStyle = void 0, this._coreService.decPrivateModes.cursorBlink = void 0;
    else {
      switch (t) {
        case 1:
        case 2:
          this._coreService.decPrivateModes.cursorStyle = "block";
          break;
        case 3:
        case 4:
          this._coreService.decPrivateModes.cursorStyle = "underline";
          break;
        case 5:
        case 6:
          this._coreService.decPrivateModes.cursorStyle = "bar";
          break;
      }
      let r = t % 2 === 1;
      this._coreService.decPrivateModes.cursorBlink = r;
    }
    return true;
  }
  setScrollRegion(e) {
    let t = e.params[0] || 1, r;
    return (e.length < 2 || (r = e.params[1]) > this._bufferService.rows || r === 0) && (r = this._bufferService.rows), r > t && (this._activeBuffer.scrollTop = t - 1, this._activeBuffer.scrollBottom = r - 1, this._setCursor(0, 0)), true;
  }
  windowOptions(e) {
    if (!xn(e.params[0], this._optionsService.rawOptions.windowOptions)) return true;
    let t = e.length > 1 ? e.params[1] : 0;
    switch (e.params[0]) {
      case 14:
        t !== 2 && this._onRequestWindowsOptionsReport.fire(0);
        break;
      case 16:
        this._onRequestWindowsOptionsReport.fire(1);
        break;
      case 18:
        this._bufferService && this._coreService.triggerDataEvent(`\x1B[8;${this._bufferService.rows};${this._bufferService.cols}t`);
        break;
      case 22:
        (t === 0 || t === 2) && (this._windowTitleStack.push(this._windowTitle), this._windowTitleStack.length > 10 && this._windowTitleStack.shift()), (t === 0 || t === 1) && (this._iconNameStack.push(this._iconName), this._iconNameStack.length > 10 && this._iconNameStack.shift());
        break;
      case 23:
        (t === 0 || t === 2) && this._windowTitleStack.length && this.setTitle(this._windowTitleStack.pop()), (t === 0 || t === 1) && this._iconNameStack.length && this.setIconName(this._iconNameStack.pop());
        break;
    }
    return true;
  }
  saveCursor(e) {
    return this._activeBuffer.savedX = this._activeBuffer.x, this._activeBuffer.savedY = this._activeBuffer.ybase + this._activeBuffer.y, this._activeBuffer.savedCurAttrData.fg = this._curAttrData.fg, this._activeBuffer.savedCurAttrData.bg = this._curAttrData.bg, this._activeBuffer.savedCharset = this._charsetService.charset, this._activeBuffer.savedCharsets = this._charsetService.charsets.slice(), this._activeBuffer.savedGlevel = this._charsetService.glevel, this._activeBuffer.savedOriginMode = this._coreService.decPrivateModes.origin, this._activeBuffer.savedWraparoundMode = this._coreService.decPrivateModes.wraparound, true;
  }
  restoreCursor(e) {
    this._activeBuffer.x = this._activeBuffer.savedX || 0, this._activeBuffer.y = Math.max(this._activeBuffer.savedY - this._activeBuffer.ybase, 0), this._curAttrData.fg = this._activeBuffer.savedCurAttrData.fg, this._curAttrData.bg = this._activeBuffer.savedCurAttrData.bg;
    for (let t = 0; t < this._activeBuffer.savedCharsets.length; t++) this._charsetService.setgCharset(t, this._activeBuffer.savedCharsets[t]);
    return this._charsetService.setgLevel(this._activeBuffer.savedGlevel), this._coreService.decPrivateModes.origin = this._activeBuffer.savedOriginMode, this._coreService.decPrivateModes.wraparound = this._activeBuffer.savedWraparoundMode, this._restrictCursor(), true;
  }
  setTitle(e) {
    return this._windowTitle = e, this._onTitleChange.fire(e), true;
  }
  setIconName(e) {
    return this._iconName = e, true;
  }
  setOrReportIndexedColor(e) {
    let t = [], r = e.split(";");
    for (; r.length > 1; ) {
      let s4 = r.shift(), o3 = r.shift();
      if (/^\d+$/.exec(s4)) {
        let a = parseInt(s4, 10);
        if (Tn(a)) if (o3 === "?") t.push({ type: 0, index: a });
        else {
          let l3 = ys(o3);
          l3 && t.push({ type: 1, index: a, color: l3 });
        }
      }
    }
    return t.length && this._onColor.fire(t), true;
  }
  setHyperlink(e) {
    let t = e.indexOf(";");
    if (t === -1) return true;
    let r = e.slice(0, t).trim(), s4 = e.slice(t + 1);
    return s4 ? this._createHyperlink(r, s4) : r.trim() ? false : this._finishHyperlink();
  }
  _createHyperlink(e, t) {
    this._getCurrentLinkId() && this._finishHyperlink();
    let r = e.split(":"), s4, o3 = r.findIndex((a) => a.startsWith("id="));
    return o3 !== -1 && (s4 = r[o3].slice(3) || void 0), this._curAttrData.extended = this._curAttrData.extended.clone(), this._curAttrData.extended.urlId = this._oscLinkService.registerLink({ id: s4, uri: t }), this._curAttrData.updateExtended(), true;
  }
  _finishHyperlink() {
    return this._curAttrData.extended = this._curAttrData.extended.clone(), this._curAttrData.extended.urlId = 0, this._curAttrData.updateExtended(), true;
  }
  _setOrReportSpecialColor(e, t) {
    let r = e.split(";");
    for (let s4 = 0; s4 < r.length && !(t >= this._specialColors.length); ++s4, ++t) if (r[s4] === "?") this._onColor.fire([{ type: 0, index: this._specialColors[t] }]);
    else {
      let o3 = ys(r[s4]);
      o3 && this._onColor.fire([{ type: 1, index: this._specialColors[t], color: o3 }]);
    }
    return true;
  }
  setOrReportFgColor(e) {
    return this._setOrReportSpecialColor(e, 0);
  }
  setOrReportBgColor(e) {
    return this._setOrReportSpecialColor(e, 1);
  }
  setOrReportCursorColor(e) {
    return this._setOrReportSpecialColor(e, 2);
  }
  restoreIndexedColor(e) {
    if (!e) return this._onColor.fire([{ type: 2 }]), true;
    let t = [], r = e.split(";");
    for (let s4 = 0; s4 < r.length; ++s4) if (/^\d+$/.exec(r[s4])) {
      let o3 = parseInt(r[s4], 10);
      Tn(o3) && t.push({ type: 2, index: o3 });
    }
    return t.length && this._onColor.fire(t), true;
  }
  restoreFgColor(e) {
    return this._onColor.fire([{ type: 2, index: 256 }]), true;
  }
  restoreBgColor(e) {
    return this._onColor.fire([{ type: 2, index: 257 }]), true;
  }
  restoreCursorColor(e) {
    return this._onColor.fire([{ type: 2, index: 258 }]), true;
  }
  nextLine() {
    return this._activeBuffer.x = 0, this.index(), true;
  }
  keypadApplicationMode() {
    return this._logService.debug("Serial port requested application keypad."), this._coreService.decPrivateModes.applicationKeypad = true, this._onRequestSyncScrollBar.fire(), true;
  }
  keypadNumericMode() {
    return this._logService.debug("Switching back to normal keypad."), this._coreService.decPrivateModes.applicationKeypad = false, this._onRequestSyncScrollBar.fire(), true;
  }
  selectDefaultCharset() {
    return this._charsetService.setgLevel(0), this._charsetService.setgCharset(0, Re), true;
  }
  selectCharset(e) {
    return e.length !== 2 ? (this.selectDefaultCharset(), true) : (e[0] === "/" || this._charsetService.setgCharset(Eo[e[0]], q[e[1]] ?? Re), true);
  }
  index() {
    return this._restrictCursor(), this._activeBuffer.y++, this._activeBuffer.y === this._activeBuffer.scrollBottom + 1 ? (this._activeBuffer.y--, this._bufferService.scroll(this._eraseAttrData())) : this._activeBuffer.y >= this._bufferService.rows && (this._activeBuffer.y = this._bufferService.rows - 1), this._restrictCursor(), true;
  }
  tabSet() {
    return this._activeBuffer.tabs[this._activeBuffer.x] = true, true;
  }
  reverseIndex() {
    if (this._restrictCursor(), this._activeBuffer.y === this._activeBuffer.scrollTop) {
      let e = this._activeBuffer.scrollBottom - this._activeBuffer.scrollTop;
      this._activeBuffer.lines.shiftElements(this._activeBuffer.ybase + this._activeBuffer.y, e, 1), this._activeBuffer.lines.set(this._activeBuffer.ybase + this._activeBuffer.y, this._activeBuffer.getBlankLine(this._eraseAttrData())), this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom);
    } else this._activeBuffer.y--, this._restrictCursor();
    return true;
  }
  fullReset() {
    return this._parser.reset(), this._onRequestReset.fire(), true;
  }
  reset() {
    this._curAttrData = U.clone(), this._eraseAttrDataInternal = U.clone();
  }
  _eraseAttrData() {
    return this._eraseAttrDataInternal.bg &= -67108864, this._eraseAttrDataInternal.bg |= this._curAttrData.bg & 67108863, this._eraseAttrDataInternal;
  }
  setgLevel(e) {
    return this._charsetService.setgLevel(e), true;
  }
  screenAlignmentPattern() {
    let e = new F();
    e.content = 1 << 22 | 69, e.fg = this._curAttrData.fg, e.bg = this._curAttrData.bg, this._setCursor(0, 0);
    for (let t = 0; t < this._bufferService.rows; ++t) {
      let r = this._activeBuffer.ybase + this._activeBuffer.y + t, s4 = this._activeBuffer.lines.get(r);
      s4 && (s4.fill(e), s4.isWrapped = false);
    }
    return this._dirtyRowTracker.markAllDirty(), this._setCursor(0, 0), true;
  }
  requestStatusString(e, t) {
    let r = (l3) => (this._coreService.triggerDataEvent(`\x1B${l3}\x1B\\`), true), s4 = this._bufferService.buffer, o3 = this._optionsService.rawOptions, a = { block: 2, underline: 4, bar: 6 };
    return r(e === '"q' ? `P1$r${this._curAttrData.isProtected() ? 1 : 0}"q` : e === '"p' ? 'P1$r61;1"p' : e === "r" ? `P1$r${s4.scrollTop + 1};${s4.scrollBottom + 1}r` : e === "m" ? "P1$r0m" : e === " q" ? `P1$r${a[o3.cursorStyle] - (o3.cursorBlink ? 1 : 0)} q` : "P0$r");
  }
  markRangeDirty(e, t) {
    this._dirtyRowTracker.markRangeDirty(e, t);
  }
  kittyKeyboardSet(e) {
    if (!this._optionsService.rawOptions.vtExtensions?.kittyKeyboard) return true;
    let t = e.params[0] || 0, r = e.length > 1 && e.params[1] || 1, s4 = this._coreService.kittyKeyboard;
    switch (r) {
      case 1:
        s4.flags = t;
        break;
      case 2:
        s4.flags |= t;
        break;
      case 3:
        s4.flags &= ~t;
        break;
    }
    return true;
  }
  kittyKeyboardQuery(e) {
    if (!this._optionsService.rawOptions.vtExtensions?.kittyKeyboard) return true;
    let t = this._coreService.kittyKeyboard.flags;
    return this._coreService.triggerDataEvent(`\x1B[?${t}u`), true;
  }
  kittyKeyboardPush(e) {
    if (!this._optionsService.rawOptions.vtExtensions?.kittyKeyboard) return true;
    let t = e.params[0] || 0, r = this._coreService.kittyKeyboard, o3 = this._bufferService.buffer === this._bufferService.buffers.alt ? r.altStack : r.mainStack;
    return o3.length >= 16 && o3.shift(), o3.push(r.flags), r.flags = t, true;
  }
  kittyKeyboardPop(e) {
    if (!this._optionsService.rawOptions.vtExtensions?.kittyKeyboard) return true;
    let t = Math.max(1, e.params[0] || 1), r = this._coreService.kittyKeyboard, o3 = this._bufferService.buffer === this._bufferService.buffers.alt ? r.altStack : r.mainStack;
    for (let a = 0; a < t && o3.length > 0; a++) r.flags = o3.pop();
    return o3.length === 0 && t > 0 && (r.flags = 0), true;
  }
};
var hi = class {
  constructor(i) {
    this._bufferService = i;
    this.clearRange();
  }
  clearRange() {
    this.start = this._bufferService.buffer.y, this.end = this._bufferService.buffer.y;
  }
  markDirty(i) {
    i < this.start ? this.start = i : i > this.end && (this.end = i);
  }
  markRangeDirty(i, e) {
    i > e && (wn = i, i = e, e = wn), i < this.start && (this.start = i), e > this.end && (this.end = e);
  }
  markAllDirty() {
    this.markRangeDirty(0, this._bufferService.rows - 1);
  }
};
hi = y([m(0, D)], hi);
function Tn(n10) {
  return 0 <= n10 && n10 < 256;
}
var vr = class extends g {
  constructor(e) {
    super();
    this._action = e;
    this._writeBuffer = [];
    this._callbacks = [];
    this._pendingData = 0;
    this._bufferOffset = 0;
    this._isSyncWriting = false;
    this._syncCalls = 0;
    this._didUserInput = false;
    this._innerWriteTimer = this._register(new Ie());
    this._onWriteParsed = this._register(new b());
    this.onWriteParsed = this._onWriteParsed.event;
    this._register(E(() => {
      this._writeBuffer.length = 0, this._callbacks.length = 0, this._pendingData = 0, this._bufferOffset = 0;
    }));
  }
  handleUserInput() {
    this._didUserInput = true;
  }
  flushSync() {
    if (this._store.isDisposed || this._isSyncWriting) return;
    this._isSyncWriting = true;
    let e, t = false;
    for (; e = this._writeBuffer.shift(); ) {
      t = true, this._action(e);
      let r = this._callbacks.shift();
      r && r();
    }
    this._pendingData = 0, this._bufferOffset = 2147483647, this._writeBuffer.length = 0, this._callbacks.length = 0, this._isSyncWriting = false, t && this._onWriteParsed.fire();
  }
  writeSync(e, t) {
    if (this._store.isDisposed) return;
    if (t !== void 0 && this._syncCalls > t) {
      this._syncCalls = 0;
      return;
    }
    if (this._pendingData += e.length, this._writeBuffer.push(e), this._callbacks.push(void 0), this._syncCalls++, this._isSyncWriting) return;
    this._isSyncWriting = true;
    let r;
    for (; r = this._writeBuffer.shift(); ) {
      this._action(r);
      let s4 = this._callbacks.shift();
      s4 && s4();
    }
    this._pendingData = 0, this._bufferOffset = 2147483647, this._isSyncWriting = false, this._syncCalls = 0;
  }
  write(e, t) {
    if (!this._store.isDisposed) {
      if (this._pendingData > 5e7) throw new Error("write data discarded, use flow control to avoid losing data");
      if (!this._writeBuffer.length) {
        if (this._bufferOffset = 0, this._didUserInput) {
          this._didUserInput = false, this._pendingData += e.length, this._writeBuffer.push(e), this._callbacks.push(t), this._innerWrite();
          return;
        }
        this._scheduleInnerWrite();
      }
      this._pendingData += e.length, this._writeBuffer.push(e), this._callbacks.push(t);
    }
  }
  _scheduleInnerWrite(e = 0, t = true) {
    this._store.isDisposed || this._innerWriteTimer.cancelAndSet(() => this._innerWrite(e, t), 0);
  }
  _innerWrite(e = 0, t = true) {
    if (this._store.isDisposed) return;
    let r = e || performance.now();
    for (; this._writeBuffer.length > this._bufferOffset; ) {
      let s4 = this._writeBuffer[this._bufferOffset], o3 = this._action(s4, t);
      if (o3) {
        let l3 = (h) => {
          this._store.isDisposed || (performance.now() - r >= 12 ? this._scheduleInnerWrite(0, h) : this._innerWrite(r, h));
        };
        o3.catch((h) => (queueMicrotask(() => {
          throw h;
        }), Promise.resolve(false))).then(l3);
        return;
      }
      let a = this._callbacks[this._bufferOffset];
      if (a && a(), this._bufferOffset++, this._pendingData -= s4.length, performance.now() - r >= 12) break;
    }
    this._writeBuffer.length > this._bufferOffset ? (this._bufferOffset > 50 && (this._writeBuffer = this._writeBuffer.slice(this._bufferOffset), this._callbacks = this._callbacks.slice(this._bufferOffset), this._bufferOffset = 0), this._scheduleInnerWrite()) : (this._writeBuffer.length = 0, this._callbacks.length = 0, this._pendingData = 0, this._bufferOffset = 0), this._onWriteParsed.fire();
  }
};
var kt = class {
  constructor(i) {
    this._bufferService = i;
    this._nextId = 1;
    this._entriesWithId = /* @__PURE__ */ new Map();
    this._dataByLinkId = /* @__PURE__ */ new Map();
  }
  registerLink(i) {
    let e = this._bufferService.buffer;
    if (i.id === void 0) {
      let l3 = e.addMarker(e.ybase + e.y), h = { data: i, id: this._nextId++, lines: [l3] };
      return l3.onDispose(() => this._removeMarkerFromLink(h, l3)), this._dataByLinkId.set(h.id, h), h.id;
    }
    let t = i, r = this._getEntryIdKey(t), s4 = this._entriesWithId.get(r);
    if (s4) return this.addLineToLink(s4.id, e.ybase + e.y), s4.id;
    let o3 = e.addMarker(e.ybase + e.y), a = { id: this._nextId++, key: this._getEntryIdKey(t), data: t, lines: [o3] };
    return o3.onDispose(() => this._removeMarkerFromLink(a, o3)), this._entriesWithId.set(a.key, a), this._dataByLinkId.set(a.id, a), a.id;
  }
  addLineToLink(i, e) {
    let t = this._dataByLinkId.get(i);
    if (t && t.lines.every((r) => r.line !== e)) {
      let r = this._bufferService.buffer.addMarker(e);
      t.lines.push(r), r.onDispose(() => this._removeMarkerFromLink(t, r));
    }
  }
  getLinkData(i) {
    return this._dataByLinkId.get(i)?.data;
  }
  _getEntryIdKey(i) {
    return `${i.id};;${i.uri}`;
  }
  _removeMarkerFromLink(i, e) {
    let t = i.lines.indexOf(e);
    t !== -1 && (i.lines.splice(t, 1), i.lines.length === 0 && (i.data.id !== void 0 && this._entriesWithId.delete(i.key), this._dataByLinkId.delete(i.id)));
  }
};
kt = y([m(0, D)], kt);
var Dn = false;
var Sr = class extends g {
  constructor(e) {
    super();
    this._windowsWrappingHeuristics = this._register(new P());
    this._onBinary = this._register(new b());
    this.onBinary = this._onBinary.event;
    this._onData = this._register(new b());
    this.onData = this._onData.event;
    this._onLineFeed = this._register(new b());
    this.onLineFeed = this._onLineFeed.event;
    this._onRender = this._register(new b());
    this.onRender = this._onRender.event;
    this._onResize = this._register(new b());
    this.onResize = this._onResize.event;
    this._onWriteParsed = this._register(new b());
    this.onWriteParsed = this._onWriteParsed.event;
    this._onScroll = this._register(new b());
    this._instantiationService = new Ji(), this.optionsService = this._register(new nr(e)), this._instantiationService.setService(R, this.optionsService), this._logService = this._register(this._instantiationService.createInstance(wt)), this._instantiationService.setService(fe, this._logService), this._bufferService = this._register(this._instantiationService.createInstance(Dt)), this._instantiationService.setService(D, this._bufferService), this.coreService = this._register(this._instantiationService.createInstance(Lt)), this._instantiationService.setService(Y, this.coreService), this.mouseStateService = this._register(this._instantiationService.createInstance(or)), this._instantiationService.setService(Me, this.mouseStateService), this.unicodeService = this._register(this._instantiationService.createInstance(me)), this.unicodeService.register(new ar()), this._instantiationService.setService(Us, this.unicodeService), this._charsetService = this._instantiationService.createInstance(lr), this._instantiationService.setService(Ws, this._charsetService), this._oscLinkService = this._instantiationService.createInstance(kt), this._instantiationService.setService(vi, this._oscLinkService), this._inputHandler = this._register(new br(this._bufferService, this._charsetService, this.coreService, this._logService, this.optionsService, this._oscLinkService, this.mouseStateService, this.unicodeService)), this._register(j.forward(this._inputHandler.onLineFeed, this._onLineFeed)), this._register(j.forward(this._bufferService.onResize, this._onResize)), this._register(j.forward(this.coreService.onData, this._onData)), this._register(j.forward(this.coreService.onBinary, this._onBinary)), this._register(this.coreService.onRequestScrollToBottom(() => this.scrollToBottom(true))), this._register(this.coreService.onUserInput(() => this._writeBuffer.handleUserInput())), this._register(this.optionsService.onMultipleOptionChange(["windowsPty"], () => this._handleWindowsPtyOptionChange())), this._register(this._bufferService.onScroll(() => {
      this._onScroll.fire({ position: this._bufferService.buffer.ydisp }), this._inputHandler.markRangeDirty(this._bufferService.buffer.scrollTop, this._bufferService.buffer.scrollBottom);
    })), this._writeBuffer = this._register(new vr((t, r) => this._inputHandler.parse(t, r))), this._register(j.forward(this._writeBuffer.onWriteParsed, this._onWriteParsed));
  }
  get onScroll() {
    return this._onScrollApi || (this._onScrollApi = this._register(new b()), this._onScroll.event((e) => {
      this._onScrollApi?.fire(e.position);
    })), this._onScrollApi.event;
  }
  get cols() {
    return this._bufferService.cols;
  }
  get rows() {
    return this._bufferService.rows;
  }
  get buffers() {
    return this._bufferService.buffers;
  }
  get options() {
    return this.optionsService.options;
  }
  set options(e) {
    for (let t in e) this.optionsService.options[t] = e[t];
  }
  write(e, t) {
    this._writeBuffer.write(e, t);
  }
  writeSync(e, t) {
    this._logService.logLevel <= 3 && !Dn && (this._logService.warn("writeSync is unreliable and will be removed soon."), Dn = true), this._writeBuffer.writeSync(e, t);
  }
  input(e, t = true) {
    this.coreService.triggerDataEvent(e, t);
  }
  resize(e, t) {
    isNaN(e) || isNaN(t) || (e = Math.max(e, 2), t = Math.max(t, 1), this._writeBuffer.flushSync(), this._bufferService.resize(e, t));
  }
  scroll(e, t = false) {
    this._bufferService.scroll(e, t);
  }
  scrollLines(e, t) {
    this._bufferService.scrollLines(e, t);
  }
  scrollPages(e) {
    this.scrollLines(e * (this.rows - 1));
  }
  scrollToTop() {
    this.scrollLines(-this._bufferService.buffer.ydisp);
  }
  scrollToBottom(e) {
    this.scrollLines(this._bufferService.buffer.ybase - this._bufferService.buffer.ydisp);
  }
  scrollToLine(e) {
    let t = e - this._bufferService.buffer.ydisp;
    t !== 0 && this.scrollLines(t);
  }
  registerEscHandler(e, t) {
    return this._inputHandler.registerEscHandler(e, t);
  }
  registerDcsHandler(e, t) {
    return this._inputHandler.registerDcsHandler(e, t);
  }
  registerCsiHandler(e, t) {
    return this._inputHandler.registerCsiHandler(e, t);
  }
  registerOscHandler(e, t) {
    return this._inputHandler.registerOscHandler(e, t);
  }
  registerApcHandler(e, t) {
    return this._inputHandler.registerApcHandler(e, t);
  }
  _setup() {
    this._handleWindowsPtyOptionChange();
  }
  reset() {
    this._inputHandler.reset(), this._bufferService.reset(), this._charsetService.reset(), this.coreService.reset(), this.mouseStateService.reset();
  }
  _handleWindowsPtyOptionChange() {
    let e = false, t = this.optionsService.rawOptions.windowsPty;
    t && t.backend !== void 0 && t.buildNumber !== void 0 && (e = t.backend === "conpty" && t.buildNumber < 21376), e ? this._enableWindowsWrappingHeuristics() : this._windowsWrappingHeuristics.clear();
  }
  _enableWindowsWrappingHeuristics() {
    if (!this._windowsWrappingHeuristics.value) {
      let e = [];
      e.push(this.onLineFeed(Is.bind(null, this._bufferService))), e.push(this.registerCsiHandler({ final: "H" }, () => (Is(this._bufferService), false))), this._windowsWrappingHeuristics.value = E(() => {
        for (let t of e) t.dispose();
      });
    }
  }
};
var z = 0;
var gr = class {
  constructor(i, e) {
    this._getKey = i;
    this._array = [];
    this._insertedValues = [];
    this._isFlushingInserted = false;
    this._deletedIndices = [];
    this._isFlushingDeleted = false;
    this._flushInsertedTask = new It(e), this._flushDeletedTask = new It(e);
  }
  clear() {
    this._array.length = 0, this._insertedValues.length = 0, this._flushInsertedTask.clear(), this._isFlushingInserted = false, this._deletedIndices.length = 0, this._flushDeletedTask.clear(), this._isFlushingDeleted = false;
  }
  insert(i) {
    this._flushCleanupDeleted(), this._insertedValues.length === 0 && this._flushInsertedTask.enqueue(() => this._flushInserted()), this._insertedValues.push(i);
  }
  _flushInserted() {
    let i = this._insertedValues.sort((s4, o3) => this._getKey(s4) - this._getKey(o3)), e = 0, t = 0, r = new Array(this._array.length + this._insertedValues.length);
    for (let s4 = 0; s4 < r.length; s4++) t >= this._array.length || this._getKey(i[e]) <= this._getKey(this._array[t]) ? (r[s4] = i[e], e++) : r[s4] = this._array[t++];
    this._array = r, this._insertedValues.length = 0;
  }
  _flushCleanupInserted() {
    !this._isFlushingInserted && this._insertedValues.length > 0 && this._flushInsertedTask.flush();
  }
  delete(i) {
    if (this._flushCleanupInserted(), this._array.length === 0) return false;
    let e = this._getKey(i);
    if (e === void 0 || (z = this._search(e), z === -1) || this._getKey(this._array[z]) !== e) return false;
    do
      if (this._array[z] === i) return this._deletedIndices.length === 0 && this._flushDeletedTask.enqueue(() => this._flushDeleted()), this._deletedIndices.push(z), true;
    while (++z < this._array.length && this._getKey(this._array[z]) === e);
    return false;
  }
  _flushDeleted() {
    this._isFlushingDeleted = true;
    let i = this._deletedIndices.sort((s4, o3) => s4 - o3), e = 0, t = new Array(this._array.length - i.length), r = 0;
    for (let s4 = 0; s4 < this._array.length; s4++) i[e] === s4 ? e++ : t[r++] = this._array[s4];
    this._array = t, this._deletedIndices.length = 0, this._isFlushingDeleted = false;
  }
  _flushCleanupDeleted() {
    !this._isFlushingDeleted && this._deletedIndices.length > 0 && this._flushDeletedTask.flush();
  }
  *getKeyIterator(i) {
    if (this._flushCleanupInserted(), this._flushCleanupDeleted(), this._array.length !== 0 && (z = this._search(i), !(z < 0 || z >= this._array.length) && this._getKey(this._array[z]) === i)) do
      yield this._array[z];
    while (++z < this._array.length && this._getKey(this._array[z]) === i);
  }
  forEachByKey(i, e) {
    if (this._flushCleanupInserted(), this._flushCleanupDeleted(), this._array.length !== 0 && (z = this._search(i), !(z < 0 || z >= this._array.length) && this._getKey(this._array[z]) === i)) do
      e(this._array[z]);
    while (++z < this._array.length && this._getKey(this._array[z]) === i);
  }
  values() {
    return this._flushCleanupInserted(), this._flushCleanupDeleted(), [...this._array].values();
  }
  _search(i) {
    let e = 0, t = this._array.length - 1;
    for (; t >= e; ) {
      let r = e + t >> 1, s4 = this._getKey(this._array[r]);
      if (s4 > i) t = r - 1;
      else if (s4 < i) e = r + 1;
      else {
        for (; r > 0 && this._getKey(this._array[r - 1]) === i; ) r--;
        return r;
      }
    }
    return e;
  }
};
var Mt = 0;
var Ir = 0;
var Bt = class extends g {
  constructor(e, t) {
    super();
    this._logService = e;
    this._bufferService = t;
    this._lineCache = this._register(new xs());
    this._onDecorationRegistered = this._register(new b());
    this.onDecorationRegistered = this._onDecorationRegistered.event;
    this._onDecorationRemoved = this._register(new b());
    this.onDecorationRemoved = this._onDecorationRemoved.event;
    this._decorations = new gr((r) => r?.marker.line, this._logService), this._register(E(() => this.reset())), this._register(this._bufferService.buffers.onBufferActivate(() => {
      this._lineCache.attachToBufferLines(this._bufferService.buffer.lines);
    })), this._lineCache.attachToBufferLines(this._bufferService.buffer.lines);
  }
  get decorations() {
    return this._decorations.values();
  }
  registerDecoration(e) {
    if (e.marker.isDisposed) return;
    let t = new ws(e);
    if (t) {
      let r = t.marker.onDispose(() => t.dispose()), s4 = t.onDispose(() => {
        s4.dispose(), t && (this._decorations.delete(t) && (this._lineCache.remove(t), this._onDecorationRemoved.fire(t)), r.dispose());
      });
      this._decorations.insert(t), this._lineCache.add(t), this._onDecorationRegistered.fire(t);
    }
    return t;
  }
  reset() {
    for (let e of this._decorations.values()) e.dispose();
    this._decorations.clear(), this._lineCache.clear();
  }
  *getDecorationsAtCell(e, t, r) {
    let s4 = this._lineCache.getDecorationsOnLine(t);
    if (s4) for (let o3 of s4) Mt = o3.options.x ?? 0, Ir = Mt + (o3.options.width ?? 1), e >= Mt && e < Ir && (!r || (o3.options.layer ?? "bottom") === r) && (yield o3);
  }
  forEachDecorationAtCell(e, t, r, s4) {
    let o3 = this._lineCache.getDecorationsOnLine(t);
    if (o3) for (let a of o3) Mt = a.options.x ?? 0, Ir = Mt + (a.options.width ?? 1), e >= Mt && e < Ir && (!r || (a.options.layer ?? "bottom") === r) && s4(a);
  }
};
Bt = y([m(0, fe), m(1, D)], Bt);
var xs = class extends g {
  constructor() {
    super(...arguments);
    this._decorationsByLine = /* @__PURE__ */ new Map();
    this._decorations = /* @__PURE__ */ new Set();
    this._bufferLineListeners = this._register(new P());
    this._lineIndexSyncTimer = this._register(new Ci());
    this._lineIndexSyncCallbacks = [];
  }
  clear() {
    this._lineIndexSyncCallbacks.length = 0, this._lineIndexSyncTimer.cancel(), this._decorationsByLine.clear(), this._decorations.clear();
  }
  add(e) {
    this._decorations.add(e), this._addToLineBuckets(e);
  }
  remove(e) {
    this._decorations.delete(e), this._removeFromLineBuckets(e);
  }
  getDecorationsOnLine(e) {
    return this._decorationsByLine.get(e);
  }
  attachToBufferLines(e) {
    let t = new pe();
    this._bufferLineListeners.value = t, t.add(e.onTrim((r) => this._handleBufferLinesTrim(r))), t.add(e.onInsert((r) => this._handleBufferLinesInsert(r))), t.add(e.onDelete((r) => this._handleBufferLinesDelete(r)));
  }
  _getDecorationHeight(e) {
    return e.options.height ?? 1;
  }
  _addToLineBuckets(e) {
    let t = e.marker.line;
    if (t < 0) return;
    e._indexedStartLine = t;
    let r = this._getDecorationHeight(e);
    for (let s4 = t; s4 < t + r; s4++) {
      let o3 = this._decorationsByLine.get(s4);
      o3 || (o3 = [], this._decorationsByLine.set(s4, o3)), o3.push(e);
    }
  }
  _removeFromLineBuckets(e) {
    let t = e._indexedStartLine, r = this._getDecorationHeight(e);
    for (let s4 = t; s4 < t + r; s4++) {
      let o3 = this._decorationsByLine.get(s4);
      if (!o3) continue;
      let a = o3.indexOf(e);
      a !== -1 && o3.splice(a, 1), o3.length === 0 && this._decorationsByLine.delete(s4);
    }
  }
  _reindexDecoration(e) {
    this._removeFromLineBuckets(e), !e.marker.isDisposed && e.marker.line >= 0 && this._addToLineBuckets(e);
  }
  _scheduleLineIndexSync(e) {
    this._lineIndexSyncCallbacks.push(e), this._lineIndexSyncTimer.set(() => {
      let t = this._lineIndexSyncCallbacks;
      this._lineIndexSyncCallbacks = [];
      for (let r of t) r();
    });
  }
  _handleBufferLinesTrim(e) {
    if (e <= 0) return;
    let t = /* @__PURE__ */ new Map();
    for (let [r, s4] of this._decorationsByLine) {
      let o3 = r - e;
      o3 < 0 || this._mergeLineBucket(t, o3, s4);
    }
    this._decorationsByLine.clear();
    for (let [r, s4] of t) this._decorationsByLine.set(r, s4);
    for (let r of this._decorations) r.marker.isDisposed || (r._indexedStartLine -= e);
  }
  _handleBufferLinesInsert(e) {
    this._scheduleLineIndexSync(() => this._applyBufferLinesInsert(e));
  }
  _handleBufferLinesDelete(e) {
    this._scheduleLineIndexSync(() => this._applyBufferLinesDelete(e));
  }
  _mergeLineBucket(e, t, r) {
    let s4 = e.get(t);
    if (s4) for (let o3 = 0, a = r.length; o3 < a; o3++) s4.push(r[o3]);
    else e.set(t, r.slice());
  }
  _applyBufferLinesInsert(e) {
    let { index: t, amount: r } = e, s4 = [];
    for (let a of this._decorations) {
      if (a.marker.isDisposed) continue;
      let l3 = a._indexedStartLine;
      l3 < t && l3 + this._getDecorationHeight(a) > t && (s4.push(a), this._removeFromLineBuckets(a));
    }
    let o3 = /* @__PURE__ */ new Map();
    for (let [a, l3] of this._decorationsByLine) {
      let h = a >= t ? a + r : a;
      this._mergeLineBucket(o3, h, l3);
    }
    this._decorationsByLine.clear();
    for (let [a, l3] of o3) this._decorationsByLine.set(a, l3);
    for (let a of this._decorations) a.marker.isDisposed || a._indexedStartLine >= t && (a._indexedStartLine = a.marker.line);
    for (let a of s4) this._addToLineBuckets(a);
  }
  _applyBufferLinesDelete(e) {
    let t = e.index + e.amount, r = /* @__PURE__ */ new Map();
    for (let [o3, a] of this._decorationsByLine) {
      if (o3 >= e.index && o3 < t) continue;
      let l3 = o3 >= t ? o3 - e.amount : o3;
      this._mergeLineBucket(r, l3, a);
    }
    this._decorationsByLine.clear();
    for (let [o3, a] of r) this._decorationsByLine.set(o3, a);
    let s4 = [];
    for (let o3 of this._decorations) {
      if (o3.marker.isDisposed) continue;
      let a = o3._indexedStartLine, l3 = this._getDecorationHeight(o3);
      a >= t ? o3._indexedStartLine = o3.marker.line : a < e.index && a + l3 > t && s4.push(o3);
    }
    for (let o3 of s4) this._reindexDecoration(o3);
  }
};
var ws = class extends pe {
  constructor(e) {
    super();
    this.options = e;
    this.onRenderEmitter = this.add(new b());
    this.onRender = this.onRenderEmitter.event;
    this._onDispose = this.add(new b());
    this.onDispose = this._onDispose.event;
    this._cachedBg = null;
    this._cachedFg = null;
    this.marker = e.marker, this._indexedStartLine = e.marker.line, this.options.overviewRulerOptions && !this.options.overviewRulerOptions.position && (this.options.overviewRulerOptions.position = "full");
  }
  get backgroundColorRGB() {
    return this._cachedBg === null && (this.options.backgroundColor ? this._cachedBg = B.toColor(this.options.backgroundColor) : this._cachedBg = void 0), this._cachedBg;
  }
  get foregroundColorRGB() {
    return this._cachedFg === null && (this.options.foregroundColor ? this._cachedFg = B.toColor(this.options.foregroundColor) : this._cachedFg = void 0), this._cachedFg;
  }
  dispose() {
    this._onDispose.fire(), super.dispose();
  }
};
var yo = 1e3;
var Cr = class {
  constructor(i, e = yo) {
    this._renderCallback = i;
    this._debounceThresholdMS = e;
    this._lastRefreshMs = 0;
    this._additionalRefreshRequested = false;
  }
  dispose() {
    this._refreshTimeoutID && (clearTimeout(this._refreshTimeoutID), this._refreshTimeoutID = void 0), this._additionalRefreshRequested = false;
  }
  refresh(i, e, t) {
    this._rowCount = t, i = i ?? 0, e = e ?? this._rowCount - 1, this._rowStart = this._rowStart !== void 0 ? Math.min(this._rowStart, i) : i, this._rowEnd = this._rowEnd !== void 0 ? Math.max(this._rowEnd, e) : e;
    let r = performance.now();
    if (r - this._lastRefreshMs >= this._debounceThresholdMS) this._refreshTimeoutID !== void 0 && (clearTimeout(this._refreshTimeoutID), this._refreshTimeoutID = void 0, this._additionalRefreshRequested = false), this._lastRefreshMs = r, this._innerRefresh();
    else if (!this._additionalRefreshRequested) {
      let s4 = r - this._lastRefreshMs, o3 = this._debounceThresholdMS - s4;
      this._additionalRefreshRequested = true, this._refreshTimeoutID = window.setTimeout(() => {
        this._lastRefreshMs = performance.now(), this._innerRefresh(), this._additionalRefreshRequested = false, this._refreshTimeoutID = void 0;
      }, o3);
    }
  }
  _innerRefresh() {
    if (this._rowStart === void 0 || this._rowEnd === void 0 || this._rowCount === void 0) return;
    let i = Math.max(this._rowStart, 0), e = Math.min(this._rowEnd, this._rowCount - 1);
    this._rowStart = void 0, this._rowEnd = void 0, this._renderCallback(i, e);
  }
};
var Rn = false;
var Ye = class extends g {
  constructor(e, t, r, s4) {
    super();
    this._terminal = e;
    this._coreBrowserService = r;
    this._renderService = s4;
    this._rowColumns = /* @__PURE__ */ new WeakMap();
    this._liveRegionLineCount = 0;
    this._charsToConsume = [];
    this._charsToAnnounce = "";
    let o3 = this._coreBrowserService.mainDocument;
    this._accessibilityContainer = o3.createElement("div"), this._accessibilityContainer.classList.add("xterm-accessibility"), this._rowContainer = o3.createElement("div"), this._rowContainer.setAttribute("role", "list"), this._rowContainer.classList.add("xterm-accessibility-tree"), this._rowElements = [];
    for (let a = 0; a < this._terminal.rows; a++) this._rowElements[a] = this._createAccessibilityTreeNode(), this._rowContainer.appendChild(this._rowElements[a]);
    if (this._topBoundaryFocusListener = (a) => this._handleBoundaryFocus(a, 0), this._bottomBoundaryFocusListener = (a) => this._handleBoundaryFocus(a, 1), this._rowElements[0].addEventListener("focus", this._topBoundaryFocusListener), this._rowElements[this._rowElements.length - 1].addEventListener("focus", this._bottomBoundaryFocusListener), this._accessibilityContainer.appendChild(this._rowContainer), this._liveRegion = o3.createElement("div"), this._liveRegion.classList.add("live-region"), this._liveRegion.setAttribute("aria-live", "assertive"), this._accessibilityContainer.appendChild(this._liveRegion), this._liveRegionDebouncer = this._register(new Cr(this._renderRows.bind(this))), !this._terminal.element) throw new Error("Cannot enable accessibility before Terminal.open");
    Rn ? (this._accessibilityContainer.classList.add("debug"), this._rowContainer.classList.add("debug"), this._debugRootContainer = o3.createElement("div"), this._debugRootContainer.classList.add("xterm"), this._debugRootContainer.appendChild(o3.createTextNode("------start a11y------")), this._debugRootContainer.appendChild(this._accessibilityContainer), this._debugRootContainer.appendChild(o3.createTextNode("------end a11y------")), this._terminal.element.insertAdjacentElement("afterend", this._debugRootContainer)) : this._terminal.element.insertAdjacentElement("afterbegin", this._accessibilityContainer), this._register(this._terminal.onResize((a) => this._handleResize(a.rows))), this._register(this._terminal.onRender((a) => this._refreshRows(a.start, a.end))), this._register(this._terminal.onScroll(() => this._refreshRows())), this._register(this._terminal.onA11yChar((a) => this._handleChar(a))), this._register(this._terminal.onLineFeed(() => this._handleChar(`
`))), this._register(this._terminal.onA11yTab((a) => this._handleTab(a))), this._register(this._terminal.onKey((a) => this._handleKey(a.key))), this._register(this._terminal.onBlur(() => this._clearLiveRegion())), this._register(this._renderService.onDimensionsChange(() => this._refreshRowsDimensions())), this._register(C(o3, "selectionchange", () => this._handleSelectionChange())), this._register(this._coreBrowserService.onDprChange(() => this._refreshRowsDimensions())), this._refreshRowsDimensions(), this._refreshRows(), this._register(E(() => {
      Rn ? this._debugRootContainer.remove() : this._accessibilityContainer.remove(), this._rowElements.length = 0;
    }));
  }
  _handleTab(e) {
    for (let t = 0; t < e; t++) this._handleChar(" ");
  }
  _handleChar(e) {
    this._liveRegionLineCount < 21 && (this._charsToConsume.length > 0 ? this._charsToConsume.shift() !== e && (this._charsToAnnounce += e) : this._charsToAnnounce += e, e === `
` && (this._liveRegionLineCount++, this._liveRegionLineCount === 21 && (this._liveRegion.textContent = Ze.get())));
  }
  _clearLiveRegion() {
    this._liveRegion.textContent = "", this._liveRegionLineCount = 0;
  }
  _handleKey(e) {
    this._clearLiveRegion(), /\p{Control}/u.test(e) || this._charsToConsume.push(e);
  }
  _refreshRows(e, t) {
    this._liveRegionDebouncer.refresh(e, t, this._terminal.rows);
  }
  _renderRows(e, t) {
    let r = this._terminal.buffer, s4 = r.lines.length.toString();
    for (let o3 = e; o3 <= t; o3++) {
      let a = r.lines.get(r.ydisp + o3), l3 = [], h = a?.translateToString(true, void 0, void 0, l3) || "", d = (r.ydisp + o3 + 1).toString(), c = this._rowElements[o3];
      c && (h.length === 0 ? (c.textContent = "\xA0", this._rowColumns.set(c, [0, 1])) : (c.textContent = h, this._rowColumns.set(c, l3)), c.setAttribute("aria-posinset", d), c.setAttribute("aria-setsize", s4), this._alignRowWidth(c));
    }
    this._announceCharacters();
  }
  _announceCharacters() {
    this._charsToAnnounce.length !== 0 && (this._liveRegion.textContent === Ze.get() && this._clearLiveRegion(), this._liveRegion.textContent += this._charsToAnnounce, this._charsToAnnounce = "");
  }
  _handleBoundaryFocus(e, t) {
    let r = e.target, s4 = this._rowElements[t === 0 ? 1 : this._rowElements.length - 2], o3 = r.getAttribute("aria-posinset"), a = t === 0 ? "1" : `${this._terminal.buffer.lines.length}`;
    if (o3 === a || e.relatedTarget !== s4) return;
    let l3, h;
    if (t === 0 ? (l3 = r, h = this._rowElements.pop(), this._rowContainer.removeChild(h)) : (l3 = this._rowElements.shift(), h = r, this._rowContainer.removeChild(l3)), l3.removeEventListener("focus", this._topBoundaryFocusListener), h.removeEventListener("focus", this._bottomBoundaryFocusListener), t === 0) {
      let d = this._createAccessibilityTreeNode();
      this._rowElements.unshift(d), this._rowContainer.insertAdjacentElement("afterbegin", d);
    } else {
      let d = this._createAccessibilityTreeNode();
      this._rowElements.push(d), this._rowContainer.appendChild(d);
    }
    this._rowElements[0].addEventListener("focus", this._topBoundaryFocusListener), this._rowElements[this._rowElements.length - 1].addEventListener("focus", this._bottomBoundaryFocusListener), this._terminal.scrollLines(t === 0 ? -1 : 1), this._rowElements[t === 0 ? 1 : this._rowElements.length - 2].focus(), e.preventDefault(), e.stopImmediatePropagation();
  }
  _handleSelectionChange() {
    if (this._rowElements.length === 0) return;
    let e = this._coreBrowserService.mainDocument.getSelection();
    if (!e) return;
    if (e.isCollapsed) {
      this._rowContainer.contains(e.anchorNode) && this._terminal.clearSelection();
      return;
    }
    if (!e.anchorNode || !e.focusNode) {
      console.error("anchorNode and/or focusNode are null");
      return;
    }
    let t = { node: e.anchorNode, offset: e.anchorOffset }, r = { node: e.focusNode, offset: e.focusOffset };
    if ((t.node.compareDocumentPosition(r.node) & Node.DOCUMENT_POSITION_PRECEDING || t.node === r.node && t.offset > r.offset) && ([t, r] = [r, t]), t.node.compareDocumentPosition(this._rowElements[0]) & (Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_FOLLOWING) && (t = { node: this._rowElements[0].childNodes[0], offset: 0 }), !this._rowContainer.contains(t.node)) return;
    let s4 = this._rowElements.slice(-1)[0];
    if (r.node.compareDocumentPosition(s4) & (Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_PRECEDING) && (r = { node: s4, offset: s4.textContent?.length ?? 0 }), !this._rowContainer.contains(r.node)) return;
    let o3 = ({ node: h, offset: d }) => {
      let c = h instanceof Text ? h.parentNode : h, u = parseInt(c?.getAttribute("aria-posinset"), 10) - 1;
      if (isNaN(u)) return console.warn("row is invalid. Race condition?"), null;
      let _ = this._rowColumns.get(c);
      if (!_) return console.warn("columns is null. Race condition?"), null;
      let p = d < _.length ? _[d] : _.slice(-1)[0] + 1;
      return p >= this._terminal.cols && (++u, p = 0), { row: u, column: p };
    }, a = o3(t), l3 = o3(r);
    if (!(!a || !l3)) {
      if (a.row > l3.row || a.row === l3.row && a.column >= l3.column) throw new Error("invalid range");
      this._terminal.select(a.column, a.row, (l3.row - a.row) * this._terminal.cols - a.column + l3.column);
    }
  }
  _handleResize(e) {
    this._rowElements[this._rowElements.length - 1].removeEventListener("focus", this._bottomBoundaryFocusListener);
    for (let t = this._rowContainer.children.length; t < this._terminal.rows; t++) this._rowElements[t] = this._createAccessibilityTreeNode(), this._rowContainer.appendChild(this._rowElements[t]);
    for (; this._rowElements.length > e; ) this._rowContainer.removeChild(this._rowElements.pop());
    this._rowElements[this._rowElements.length - 1].addEventListener("focus", this._bottomBoundaryFocusListener), this._refreshRowsDimensions();
  }
  _createAccessibilityTreeNode() {
    let e = this._coreBrowserService.mainDocument.createElement("div");
    return e.setAttribute("role", "listitem"), e.tabIndex = -1, this._refreshRowDimensions(e), e;
  }
  _refreshRowsDimensions() {
    if (this._renderService.dimensions.css.cell.height) {
      Object.assign(this._accessibilityContainer.style, { width: `${this._renderService.dimensions.css.canvas.width}px`, fontSize: `${this._terminal.options.fontSize}px` }), this._rowElements.length !== this._terminal.rows && this._handleResize(this._terminal.rows);
      for (let e = 0; e < this._terminal.rows; e++) this._refreshRowDimensions(this._rowElements[e]), this._alignRowWidth(this._rowElements[e]);
    }
  }
  _refreshRowDimensions(e) {
    e.style.height = `${this._renderService.dimensions.css.cell.height}px`;
  }
  _alignRowWidth(e) {
    e.style.transform = "";
    let t = e.getBoundingClientRect().width, r = this._rowColumns.get(e)?.slice(-1)?.[0];
    if (!r) return;
    let s4 = r * this._renderService.dimensions.css.cell.width;
    e.style.transform = `scaleX(${s4 / t})`;
  }
};
Ye = y([m(1, Qe), m(2, G), m(3, V)], Ye);
var Pt = class extends g {
  constructor(e, t, r, s4, o3) {
    super();
    this._element = e;
    this._mouseCoordsService = t;
    this._renderService = r;
    this._bufferService = s4;
    this._linkProviderService = o3;
    this._linkCacheDisposables = [];
    this._isMouseOut = true;
    this._wasResized = false;
    this._activeLine = -1;
    this._onShowLinkUnderline = this._register(new b());
    this.onShowLinkUnderline = this._onShowLinkUnderline.event;
    this._onHideLinkUnderline = this._register(new b());
    this.onHideLinkUnderline = this._onHideLinkUnderline.event;
    this._register(E(() => {
      Oe(this._linkCacheDisposables), this._linkCacheDisposables.length = 0, this._lastMouseEvent = void 0, this._activeProviderReplies?.clear();
    })), this._register(this._bufferService.onResize(() => {
      this._clearCurrentLink(), this._wasResized = true;
    })), this._register(C(this._element, "mouseleave", () => {
      this._isMouseOut = true, this._clearCurrentLink();
    })), this._register(C(this._element, "mousemove", this._handleMouseMove.bind(this))), this._register(C(this._element, "mousedown", this._handleMouseDown.bind(this))), this._register(C(this._element, "mouseup", this._handleMouseUp.bind(this)));
  }
  get currentLink() {
    return this._currentLink;
  }
  _handleMouseMove(e) {
    this._lastMouseEvent = e;
    let t = this._positionFromMouseEvent(e, this._element);
    if (!t) return;
    this._isMouseOut = false;
    let r = e.composedPath();
    for (let s4 = 0; s4 < r.length; s4++) {
      let o3 = r[s4];
      if (o3.classList.contains("xterm")) break;
      if (o3.classList.contains("xterm-hover")) return;
    }
    (!this._lastBufferCell || t.x !== this._lastBufferCell.x || t.y !== this._lastBufferCell.y) && (this._handleHover(t), this._lastBufferCell = t);
  }
  _handleHover(e) {
    if (this._activeLine !== e.y || this._wasResized) {
      this._clearCurrentLink(), this._askForLink(e, false), this._wasResized = false;
      return;
    }
    this._currentLink && this._linkAtPosition(this._currentLink.link, e) || (this._clearCurrentLink(), this._askForLink(e, true));
  }
  _askForLink(e, t) {
    (!this._activeProviderReplies || !t) && (this._activeProviderReplies?.forEach((s4) => {
      s4?.forEach((o3) => {
        o3.link.dispose && o3.link.dispose();
      });
    }), this._activeProviderReplies = /* @__PURE__ */ new Map(), this._activeLine = e.y);
    let r = false;
    for (let [s4, o3] of this._linkProviderService.linkProviders.entries()) t ? this._activeProviderReplies?.get(s4) && (r = this._checkLinkProviderResult(s4, e, r)) : o3.provideLinks(e.y, (a) => {
      if (this._isMouseOut) return;
      let l3 = a?.map((h) => ({ link: h }));
      this._activeProviderReplies?.set(s4, l3), r = this._checkLinkProviderResult(s4, e, r), this._activeProviderReplies?.size === this._linkProviderService.linkProviders.length && this._removeIntersectingLinks(e.y, this._activeProviderReplies);
    });
  }
  _removeIntersectingLinks(e, t) {
    let r = /* @__PURE__ */ new Set();
    for (let s4 = 0; s4 < t.size; s4++) {
      let o3 = t.get(s4);
      if (o3) for (let a = 0; a < o3.length; a++) {
        let l3 = o3[a], h = l3.link.range.start.y < e ? 0 : l3.link.range.start.x, d = l3.link.range.end.y > e ? this._bufferService.cols : l3.link.range.end.x;
        for (let c = h; c <= d; c++) {
          if (r.has(c)) {
            o3.splice(a--, 1);
            break;
          }
          r.add(c);
        }
      }
    }
  }
  _checkLinkProviderResult(e, t, r) {
    if (!this._activeProviderReplies) return r;
    let s4 = this._activeProviderReplies.get(e), o3 = false;
    for (let a = 0; a < e; a++) (!this._activeProviderReplies.has(a) || this._activeProviderReplies.get(a)) && (o3 = true);
    if (!o3 && s4) {
      let a = s4.find((l3) => this._linkAtPosition(l3.link, t));
      a && (r = true, this._handleNewLink(a));
    }
    if (this._activeProviderReplies.size === this._linkProviderService.linkProviders.length && !r) for (let a = 0; a < this._activeProviderReplies.size; a++) {
      let l3 = this._activeProviderReplies.get(a)?.find((h) => this._linkAtPosition(h.link, t));
      if (l3) {
        r = true, this._handleNewLink(l3);
        break;
      }
    }
    return r;
  }
  _handleMouseDown() {
    this._mouseDownLink = this._currentLink;
  }
  _handleMouseUp(e) {
    if (!this._currentLink) return;
    let t = this._positionFromMouseEvent(e, this._element);
    t && this._mouseDownLink && xo(this._mouseDownLink.link, this._currentLink.link) && this._linkAtPosition(this._currentLink.link, t) && this._currentLink.link.activate(e, this._currentLink.link.text);
  }
  _clearCurrentLink(e, t) {
    !this._currentLink || !this._lastMouseEvent || (!e || !t || this._currentLink.link.range.start.y >= e && this._currentLink.link.range.end.y <= t) && (this._linkLeave(this._element, this._currentLink.link, this._lastMouseEvent), this._currentLink = void 0, Oe(this._linkCacheDisposables), this._linkCacheDisposables.length = 0);
  }
  _handleNewLink(e) {
    if (!this._lastMouseEvent) return;
    let t = this._positionFromMouseEvent(this._lastMouseEvent, this._element);
    t && this._linkAtPosition(e.link, t) && (this._currentLink = e, this._currentLink.state = { decorations: { underline: e.link.decorations === void 0 ? true : e.link.decorations.underline, pointerCursor: e.link.decorations === void 0 ? true : e.link.decorations.pointerCursor }, isHovered: true }, this._linkHover(this._element, e.link, this._lastMouseEvent), e.link.decorations = {}, Object.defineProperties(e.link.decorations, { pointerCursor: { get: () => this._currentLink?.state?.decorations.pointerCursor, set: (r) => {
      this._currentLink?.state && this._currentLink.state.decorations.pointerCursor !== r && (this._currentLink.state.decorations.pointerCursor = r, this._currentLink.state.isHovered && this._element.classList.toggle("xterm-cursor-pointer", r));
    } }, underline: { get: () => this._currentLink?.state?.decorations.underline, set: (r) => {
      this._currentLink?.state && this._currentLink?.state?.decorations.underline !== r && (this._currentLink.state.decorations.underline = r, this._currentLink.state.isHovered && this._fireUnderlineEvent(e.link, r));
    } } }), this._linkCacheDisposables.push(this._renderService.onRenderedViewportChange((r) => {
      if (!this._currentLink) return;
      let s4 = r.start === 0 ? 0 : r.start + 1 + this._bufferService.buffer.ydisp, o3 = this._bufferService.buffer.ydisp + 1 + r.end;
      if (this._currentLink.link.range.start.y >= s4 && this._currentLink.link.range.end.y <= o3 && (this._clearCurrentLink(s4, o3), this._lastMouseEvent)) {
        let a = this._positionFromMouseEvent(this._lastMouseEvent, this._element);
        a && this._askForLink(a, false);
      }
    })));
  }
  _linkHover(e, t, r) {
    this._currentLink?.state && (this._currentLink.state.isHovered = true, this._currentLink.state.decorations.underline && this._fireUnderlineEvent(t, true), this._currentLink.state.decorations.pointerCursor && e.classList.add("xterm-cursor-pointer")), t.hover && t.hover(r, t.text);
  }
  _fireUnderlineEvent(e, t) {
    let r = e.range, s4 = this._bufferService.buffer.ydisp, o3 = this._createLinkUnderlineEvent(r.start.x - 1, r.start.y - s4 - 1, r.end.x, r.end.y - s4 - 1, void 0);
    (t ? this._onShowLinkUnderline : this._onHideLinkUnderline).fire(o3);
  }
  _linkLeave(e, t, r) {
    this._currentLink?.state && (this._currentLink.state.isHovered = false, this._currentLink.state.decorations.underline && this._fireUnderlineEvent(t, false), this._currentLink.state.decorations.pointerCursor && e.classList.remove("xterm-cursor-pointer")), t.leave && t.leave(r, t.text);
  }
  _linkAtPosition(e, t) {
    let r = e.range.start.y * this._bufferService.cols + e.range.start.x, s4 = e.range.end.y * this._bufferService.cols + e.range.end.x, o3 = t.y * this._bufferService.cols + t.x;
    return r <= o3 && o3 <= s4;
  }
  _positionFromMouseEvent(e, t) {
    let r = this._mouseCoordsService.getCoords(e, t, this._bufferService.cols, this._bufferService.rows);
    if (r) return { x: r[0], y: r[1] + this._bufferService.buffer.ydisp };
  }
  _createLinkUnderlineEvent(e, t, r, s4, o3) {
    return { x1: e, y1: t, x2: r, y2: s4, cols: this._bufferService.cols, fg: o3 };
  }
};
Pt = y([m(1, Pe), m(2, V), m(3, D), m(4, Ii)], Pt);
function xo(n10, i) {
  return n10.text === i.text && n10.range.start.x === i.range.start.x && n10.range.start.y === i.range.start.y && n10.range.end.x === i.range.end.x && n10.range.end.y === i.range.end.y;
}
var Er = class extends Sr {
  constructor(e = {}) {
    super(e);
    this._linkifier = this._register(new P());
    this.browser = Ke;
    this._keyDownHandled = false;
    this._keyDownSeen = false;
    this._keyPressHandled = false;
    this._unprocessedDeadKey = false;
    this._accessibilityManager = this._register(new P());
    this._onCursorMove = this._register(new b());
    this.onCursorMove = this._onCursorMove.event;
    this._onKey = this._register(new b());
    this.onKey = this._onKey.event;
    this._onSelectionChange = this._register(new b());
    this.onSelectionChange = this._onSelectionChange.event;
    this._onTitleChange = this._register(new b());
    this.onTitleChange = this._onTitleChange.event;
    this._onBell = this._register(new b());
    this.onBell = this._onBell.event;
    this._onFocus = this._register(new b());
    this._onBlur = this._register(new b());
    this._onA11yCharEmitter = this._register(new b());
    this._onA11yTabEmitter = this._register(new b());
    this._onWillOpen = this._register(new b());
    this._onDimensionsChange = this._register(new b());
    this.onDimensionsChange = this._onDimensionsChange.event;
    this._setup(), this._decorationService = this._instantiationService.createInstance(Bt), this._instantiationService.setService(ge, this._decorationService), this._keyboardService = this._instantiationService.createInstance(xt), this._instantiationService.setService(zs, this._keyboardService), this._linkProviderService = this._instantiationService.createInstance(zi), this._instantiationService.setService(Ii, this._linkProviderService), this._linkProviderService.registerLinkProvider(this._instantiationService.createInstance(et)), this._register(this._inputHandler.onRequestBell(() => this._onBell.fire())), this._register(this._inputHandler.onRequestRefreshRows((t) => this.refresh(t?.start ?? 0, t?.end ?? this.rows - 1))), this._register(this._inputHandler.onRequestSendFocus(() => this._reportFocus())), this._register(this._inputHandler.onRequestReset(() => this.reset())), this._register(this._inputHandler.onRequestWindowsOptionsReport((t) => this._reportWindowsOptions(t))), this._register(this._inputHandler.onColor((t) => this._handleColorEvent(t))), this._register(j.forward(this._inputHandler.onCursorMove, this._onCursorMove)), this._register(j.forward(this._inputHandler.onTitleChange, this._onTitleChange)), this._register(j.forward(this._inputHandler.onA11yChar, this._onA11yCharEmitter)), this._register(j.forward(this._inputHandler.onA11yTab, this._onA11yTabEmitter)), this._register(this._bufferService.onResize((t) => this._afterResize(t.cols, t.rows))), this._register(E(() => {
      this._customKeyEventHandler = void 0, this.element?.parentNode?.removeChild(this.element);
    }));
  }
  get linkifier() {
    return this._linkifier.value;
  }
  get onFocus() {
    return this._onFocus.event;
  }
  get onBlur() {
    return this._onBlur.event;
  }
  get onA11yChar() {
    return this._onA11yCharEmitter.event;
  }
  get onA11yTab() {
    return this._onA11yTabEmitter.event;
  }
  get onWillOpen() {
    return this._onWillOpen.event;
  }
  get dimensions() {
    if (!this._renderService) return;
    let e = this._renderService.dimensions;
    return { css: { canvas: { ...e.css.canvas }, cell: { ...e.css.cell } }, device: { canvas: { ...e.device.canvas }, cell: { ...e.device.cell }, char: { ...e.device.char } } };
  }
  _handleColorEvent(e) {
    if (this._themeService) for (let t of e) {
      let r, s4;
      switch (t.index) {
        case 256:
          r = "foreground", s4 = "10";
          break;
        case 257:
          r = "background", s4 = "11";
          break;
        case 258:
          r = "cursor", s4 = "12";
          break;
        default:
          r = "ansi", s4 = "4;" + t.index;
      }
      switch (t.type) {
        case 0:
          let o3 = k.toColorRGB(r === "ansi" ? this._themeService.colors.ansi[t.index] : this._themeService.colors[r]);
          this.coreService.triggerDataEvent(`\x1B]${s4};${En(o3)}\x1B\\`);
          break;
        case 1:
          if (r === "ansi") this._themeService.modifyColors((a) => a.ansi[t.index] = O.toColor(...t.color));
          else {
            let a = r;
            this._themeService.modifyColors((l3) => l3[a] = O.toColor(...t.color));
          }
          break;
        case 2:
          this._themeService.restoreColor(t.index);
          break;
      }
    }
  }
  _reportColorScheme() {
    if (!this._themeService) return;
    let e = Z.relativeLuminance(this._themeService.colors.background.rgba >> 8), t = Z.relativeLuminance(this._themeService.colors.foreground.rgba >> 8), r = e < t ? 1 : 2;
    this.coreService.triggerDataEvent(`\x1B[?997;${r}n`);
  }
  _setup() {
    super._setup(), this._customKeyEventHandler = void 0;
  }
  get buffer() {
    return this.buffers.active;
  }
  focus() {
    this.textarea && this.textarea.focus({ preventScroll: true });
  }
  _handleScreenReaderModeOptionChange(e) {
    e ? !this._accessibilityManager.value && this._renderService && (this._accessibilityManager.value = this._instantiationService.createInstance(Ye, this)) : this._accessibilityManager.clear();
  }
  _handleTextAreaFocus(e) {
    this.coreService.decPrivateModes.sendFocus && this.coreService.triggerDataEvent("\x1B[I"), this.element.classList.add("focus"), this._showCursor(), this._onFocus.fire();
  }
  blur() {
    return this.textarea?.blur();
  }
  _handleTextAreaBlur() {
    this.textarea.value = "", this.refresh(this.buffer.y, this.buffer.y), this.coreService.decPrivateModes.sendFocus && this.coreService.triggerDataEvent("\x1B[O"), this.element.classList.remove("focus"), this._onBlur.fire();
  }
  _syncTextArea() {
    if (!this.textarea || !this.buffer.isCursorInViewport || this._compositionHelper.isComposing || !this._renderService) return;
    let e = this.buffer.ybase + this.buffer.y, t = this.buffer.lines.get(e);
    if (!t) return;
    let r = Math.min(this.buffer.x, this.cols - 1), s4 = this._renderService.dimensions.css.cell.height, o3 = t.getWidth(r), a = this._renderService.dimensions.css.cell.width * o3, l3 = this.buffer.y * this._renderService.dimensions.css.cell.height, h = r * this._renderService.dimensions.css.cell.width;
    this.textarea.style.left = h + "px", this.textarea.style.top = l3 + "px", this.textarea.style.width = a + "px", this.textarea.style.height = s4 + "px", this.textarea.style.lineHeight = s4 + "px", this.textarea.style.zIndex = "-5";
  }
  _initGlobal() {
    this._bindKeys(), this._register(C(this.element, "copy", (t) => {
      this.hasSelection() && Os(t, this._selectionService);
    }));
    let e = (t) => Ns(t, this.textarea, this.coreService, this.optionsService);
    this._register(C(this.textarea, "paste", e)), this._register(C(this.element, "paste", e)), nt ? this._register(C(this.element, "mousedown", (t) => {
      t.button === 2 && Hr(t, this.textarea, this.screenElement, this._selectionService, this.options.rightClickSelectsWord);
    })) : this._register(C(this.element, "contextmenu", (t) => {
      Hr(t, this.textarea, this.screenElement, this._selectionService, this.options.rightClickSelectsWord);
    })), zt && this._register(C(this.element, "auxclick", (t) => {
      t.button === 1 && Fr(t, this.textarea, this.screenElement);
    }));
  }
  _bindKeys() {
    this._register(C(this.textarea, "keyup", (e) => this._keyUp(e), true)), this._register(C(this.textarea, "keydown", (e) => this._keyDown(e), true)), this._register(C(this.textarea, "keypress", (e) => this._keyPress(e), true)), this._register(C(this.textarea, "compositionstart", () => {
      this._syncTextArea(), this._compositionHelper.compositionstart(), this._compositionHelper.updateCompositionElements();
    })), this._register(C(this.textarea, "compositionupdate", (e) => this._compositionHelper.compositionupdate(e))), this._register(C(this.textarea, "compositionend", () => this._compositionHelper.compositionend())), this._register(C(this.textarea, "input", (e) => this._inputEvent(e), true)), this._register(this.onRender(() => this._compositionHelper.updateCompositionElements()));
  }
  open(e) {
    if (!e) throw new Error("Terminal requires a parent element.");
    if (e.isConnected || this._logService.debug("Terminal.open was called on an element that was not attached to the DOM"), this.element?.ownerDocument.defaultView && this._coreBrowserService) {
      this.element.ownerDocument.defaultView !== this._coreBrowserService.window && (this._coreBrowserService.window = this.element.ownerDocument.defaultView);
      return;
    }
    this._document = e.ownerDocument, this.options.documentOverride && this.options.documentOverride instanceof Document && (this._document = this.optionsService.rawOptions.documentOverride), this.element = this._document.createElement("div"), this.element.dir = "ltr", this.element.classList.add("terminal"), this.element.classList.add("xterm"), this.element.classList.toggle("allow-transparency", this.options.allowTransparency), this._register(this.optionsService.onSpecificOptionChange("allowTransparency", (l3) => this.element.classList.toggle("allow-transparency", l3))), e.appendChild(this.element);
    let t = this._document.createDocumentFragment();
    this._viewportElement = this._document.createElement("div"), this._viewportElement.classList.add("xterm-viewport"), t.appendChild(this._viewportElement), this.screenElement = this._document.createElement("div"), this.screenElement.classList.add("xterm-screen"), this._register(C(this.screenElement, "mousemove", (l3) => this.updateCursorStyle(l3))), this._helperContainer = this._document.createElement("div"), this._helperContainer.classList.add("xterm-helpers"), this.screenElement.appendChild(this._helperContainer), t.appendChild(this.screenElement);
    let r = this.textarea = this._document.createElement("textarea");
    this.textarea.classList.add("xterm-helper-textarea"), this.textarea.setAttribute("aria-label", Ut.get()), Yr || this.textarea.setAttribute("aria-multiline", "false"), this.textarea.setAttribute("autocorrect", "off"), this.textarea.setAttribute("autocapitalize", "off"), this.textarea.setAttribute("spellcheck", "false"), this.textarea.tabIndex = 0, this._register(this.optionsService.onSpecificOptionChange("disableStdin", () => r.readOnly = this.optionsService.rawOptions.disableStdin)), this.textarea.readOnly = this.optionsService.rawOptions.disableStdin, this._coreBrowserService = this._register(this._instantiationService.createInstance(Ki, this.textarea, e.ownerDocument.defaultView ?? window, this._document ?? (typeof window < "u" ? window.document : null))), this._instantiationService.setService(G, this._coreBrowserService), this._register(C(this.textarea, "focus", (l3) => this._handleTextAreaFocus(l3))), this._register(C(this.textarea, "blur", () => this._handleTextAreaBlur())), this._helperContainer.appendChild(this.textarea), this._charSizeService = this._instantiationService.createInstance(bt, this._document, this._helperContainer), this._instantiationService.setService(Be, this._charSizeService), this._themeService = this._instantiationService.createInstance(yt), this._instantiationService.setService(_e, this._themeService), this._register(this._inputHandler.onRequestColorSchemeQuery(() => this._reportColorScheme())), this._register(this._themeService.onChangeColors(() => {
      this.coreService.decPrivateModes.colorSchemeUpdates && this._reportColorScheme();
    })), this._characterJoinerService = this._instantiationService.createInstance(He), this._instantiationService.setService(gi, this._characterJoinerService), this._renderService = this._register(this._instantiationService.createInstance(Ct, this.rows, this.screenElement)), this._instantiationService.setService(V, this._renderService), this._register(this._renderService.onRenderedViewportChange((l3) => this._onRender.fire(l3))), this._register(this._renderService.onDimensionsChange((l3) => this._onDimensionsChange.fire({ css: { canvas: { ...l3.css.canvas }, cell: { ...l3.css.cell } }, device: { canvas: { ...l3.device.canvas }, cell: { ...l3.device.cell }, char: { ...l3.device.char } } }))), this.onResize((l3) => this._renderService.resize(l3.cols, l3.rows)), this._compositionView = this._document.createElement("div"), this._compositionView.classList.add("composition-view"), this._compositionHelper = this._instantiationService.createInstance(ft, this.textarea, this._compositionView), this._helperContainer.appendChild(this._compositionView), this._mouseCoordsService = this._instantiationService.createInstance(vt), this._instantiationService.setService(Pe, this._mouseCoordsService);
    let s4 = this._linkifier.value = this._register(this._instantiationService.createInstance(Pt, this.screenElement));
    this.element.appendChild(t);
    try {
      this._onWillOpen.fire(this.element);
    } catch (l3) {
      this._logService.error("onWillOpen handler threw an exception", l3);
    }
    this._renderService.hasRenderer() || this._renderService.setRenderer(this._createRenderer()), this._register(this.onCursorMove(() => {
      this._renderService.handleCursorMove(), this._syncTextArea();
    })), this._register(this.onResize(() => {
      this._renderService.handleResize(this.cols, this.rows), this._syncTextArea();
    })), this._register(this.onBlur(() => this._renderService.handleBlur())), this._register(this.onFocus(() => this._renderService.handleFocus())), this._viewport = this._register(this._instantiationService.createInstance(dt, this.element, this.screenElement)), this._register(this._viewport.onRequestScrollLines((l3) => {
      super.scrollLines(l3, false), this.refresh(0, this.rows - 1);
    })), this._selectionService = this._register(this._instantiationService.createInstance(Et, this.element, this.screenElement, s4)), this._instantiationService.setService(Si, this._selectionService), this._mouseService = this._instantiationService.createInstance(gt), this._instantiationService.setService(Ks, this._mouseService), this._register(this._selectionService.onRequestScrollLines((l3) => this.scrollLines(l3.amount, l3.suppressScrollEvent))), this._register(this._selectionService.onSelectionChange(() => this._onSelectionChange.fire())), this._register(this._selectionService.onRequestRedraw((l3) => this._renderService.handleSelectionChanged(l3.start, l3.end, l3.columnSelectMode))), this._register(this._selectionService.onLinuxMouseSelection((l3) => {
      this.textarea.value = l3, this.textarea.focus(), this.textarea.select();
    })), this._register(j.any(this._onScroll.event, this._inputHandler.onScroll)(() => {
      this._selectionService.refresh(), this._viewport?.queueSync();
    })), this._register(this._instantiationService.createInstance(ut, this.screenElement)), this._register(C(this.element, "mousedown", (l3) => this._selectionService.handleMouseDown(l3))), this.mouseStateService.areMouseEventsActive && !this.options.mouseEventsRequireAlt ? (this._selectionService.disable(), this.element.classList.add("enable-mouse-events")) : (this._selectionService.enable(), this.element.classList.remove("enable-mouse-events")), this.options.screenReaderMode && (this._accessibilityManager.value = this._instantiationService.createInstance(Ye, this)), this._register(this.optionsService.onSpecificOptionChange("screenReaderMode", (l3) => this._handleScreenReaderModeOptionChange(l3)));
    let o3 = this.options.scrollbar?.showScrollbar ?? true, a = this.options.scrollbar?.width;
    o3 && a && (this._overviewRulerRenderer = this._register(this._instantiationService.createInstance(ze, this._viewportElement, this.screenElement))), this.optionsService.onSpecificOptionChange("scrollbar", (l3) => {
      let h = (l3?.showScrollbar ?? true) && !!l3?.width;
      !this._overviewRulerRenderer && h && this._viewportElement && this.screenElement && (this._overviewRulerRenderer = this._register(this._instantiationService.createInstance(ze, this._viewportElement, this.screenElement)));
    }), this._charSizeService.measure(), this.refresh(0, this.rows - 1), this._initGlobal(), this._mouseService.bindMouse({ element: this.element, screenElement: this.screenElement, document: this._document, handleTouchScroll: (l3) => this._viewport?.handleTouchScroll(l3) }, (l3) => this._register(l3), () => this.focus());
  }
  _createRenderer() {
    return this._instantiationService.createInstance(mt, this, this._document, this.element, this.screenElement, this._viewportElement, this._helperContainer, this.linkifier);
  }
  refresh(e, t, r = false) {
    this._renderService?.refreshRows(e, t, r);
  }
  updateCursorStyle(e) {
    this._selectionService?.shouldColumnSelect(e) ? this.element.classList.add("column-select") : this.element.classList.remove("column-select");
  }
  _showCursor() {
    this.coreService.isCursorInitialized || (this.coreService.isCursorInitialized = true, this.refresh(this.buffer.y, this.buffer.y));
  }
  scrollLines(e, t) {
    this._viewport ? this._viewport.scrollLines(e) : super.scrollLines(e, t), this.refresh(0, this.rows - 1);
  }
  scrollPages(e) {
    this.scrollLines(e * (this.rows - 1));
  }
  scrollToTop() {
    this.scrollLines(-this._bufferService.buffer.ydisp);
  }
  scrollToBottom(e) {
    e && this._viewport ? this._viewport.scrollToLine(this.buffer.ybase, true) : this.scrollLines(this._bufferService.buffer.ybase - this._bufferService.buffer.ydisp);
  }
  scrollToLine(e) {
    let t = e - this._bufferService.buffer.ydisp;
    t !== 0 && this.scrollLines(t);
  }
  paste(e) {
    Nr(e, this.textarea, this.coreService, this.optionsService);
  }
  attachCustomKeyEventHandler(e) {
    this._customKeyEventHandler = e;
  }
  attachCustomWheelEventHandler(e) {
    this.mouseStateService.setCustomWheelEventHandler(e);
  }
  registerLinkProvider(e) {
    return this._linkProviderService.registerLinkProvider(e);
  }
  registerCharacterJoiner(e) {
    if (!this._characterJoinerService) throw new Error("Terminal must be opened first");
    let t = this._characterJoinerService.register(e);
    return this.refresh(0, this.rows - 1), t;
  }
  deregisterCharacterJoiner(e) {
    if (!this._characterJoinerService) throw new Error("Terminal must be opened first");
    this._characterJoinerService.deregister(e) && this.refresh(0, this.rows - 1);
  }
  get markers() {
    return this.buffer.markers;
  }
  registerMarker(e) {
    return this.buffer.addMarker(this.buffer.ybase + this.buffer.y + e);
  }
  registerDecoration(e) {
    return this._decorationService.registerDecoration(e);
  }
  hasSelection() {
    return this._selectionService ? this._selectionService.hasSelection : false;
  }
  select(e, t, r) {
    this._selectionService.setSelection(e, t, r);
  }
  getSelection() {
    return this._selectionService ? this._selectionService.selectionText : "";
  }
  getSelectionPosition() {
    if (!(!this._selectionService || !this._selectionService.hasSelection)) return { start: { x: this._selectionService.selectionStart[0], y: this._selectionService.selectionStart[1] }, end: { x: this._selectionService.selectionEnd[0], y: this._selectionService.selectionEnd[1] } };
  }
  clearSelection() {
    this._selectionService?.clearSelection();
  }
  selectAll() {
    this._selectionService?.selectAll();
  }
  selectLines(e, t) {
    this._selectionService?.selectLines(e, t);
  }
  _keyDown(e) {
    if (this._keyDownHandled = false, this._keyDownSeen = true, this._customKeyEventHandler && this._customKeyEventHandler(e) === false) return false;
    let t = this.browser.isMac && this.options.macOptionIsMeta && e.altKey;
    if (!t && !this._compositionHelper.keydown(e)) return this.options.scrollOnUserInput && this.buffer.ybase !== this.buffer.ydisp && this.scrollToBottom(true), false;
    !t && (e.key === "Dead" || e.key === "AltGraph") && (this._unprocessedDeadKey = true);
    let r = this._keyboardService.evaluateKeyDown(e);
    if (this.updateCursorStyle(e), r.type === 3 || r.type === 2) {
      let o3 = this.rows - 1;
      return this.scrollLines(r.type === 2 ? -o3 : o3), e.preventDefault(), e.stopPropagation(), false;
    }
    if (r.type === 1 && this.selectAll(), this._isThirdLevelShift(this.browser, e) || (r.cancel && (e.preventDefault(), e.stopPropagation()), !r.key) || !this._keyboardService.useKitty && !this._keyboardService.useWin32InputMode && e.key && !e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1 && e.key.charCodeAt(0) >= 65 && e.key.charCodeAt(0) <= 90) return true;
    if (this._unprocessedDeadKey) return this._unprocessedDeadKey = false, true;
    (r.key === "" || r.key === "\r") && (this.textarea.value = "");
    let s4 = this._keyboardService.useWin32InputMode && Ts(e);
    if (this._onKey.fire({ key: r.key, domEvent: e }), this._showCursor(), this.coreService.triggerDataEvent(r.key, !s4), !this.optionsService.rawOptions.screenReaderMode || e.altKey || e.ctrlKey) return e.preventDefault(), e.stopPropagation(), false;
    this._keyDownHandled = true;
  }
  _isThirdLevelShift(e, t) {
    let r = e.isMac && !this.options.macOptionIsMeta && t.altKey && !t.ctrlKey && !t.metaKey || e.isWindows && t.altKey && t.ctrlKey && !t.metaKey || e.isWindows && t.getModifierState("AltGraph");
    return t.type === "keypress" ? r : r && (!t.keyCode || t.keyCode > 47);
  }
  _keyUp(e) {
    if (this._keyDownSeen = false, this._customKeyEventHandler && this._customKeyEventHandler(e) === false) return;
    Ts(e) || this.focus();
    let t = this._keyboardService.evaluateKeyUp(e);
    if (t?.key) {
      let r = this._keyboardService.useWin32InputMode && Ts(e);
      this.coreService.triggerDataEvent(t.key, !r);
    }
    this.updateCursorStyle(e), this._keyPressHandled = false;
  }
  _keyPress(e) {
    let t;
    if (this._keyPressHandled = false, this._keyDownHandled || this._customKeyEventHandler && this._customKeyEventHandler(e) === false) return false;
    if (e.charCode) t = e.charCode;
    else if (e.which === null || e.which === void 0) t = e.keyCode;
    else if (e.which !== 0 && e.charCode !== 0) t = e.which;
    else return false;
    return !t || (e.altKey || e.ctrlKey || e.metaKey) && !this._isThirdLevelShift(this.browser, e) ? false : (t = String.fromCharCode(t), this._onKey.fire({ key: t, domEvent: e }), this._showCursor(), this.coreService.triggerDataEvent(t, true), this._keyPressHandled = true, this._unprocessedDeadKey = false, true);
  }
  _inputEvent(e) {
    if (e.data && e.inputType === "insertText" && (!e.composed || !this._keyDownSeen) && !this.optionsService.rawOptions.screenReaderMode) {
      if (this._keyPressHandled) return false;
      this._unprocessedDeadKey = false;
      let t = e.data;
      return this.coreService.triggerDataEvent(t, true), true;
    }
    return false;
  }
  resize(e, t) {
    if (e === this.cols && t === this.rows) {
      this._charSizeService && !this._charSizeService.hasValidSize && this._charSizeService.measure();
      return;
    }
    super.resize(e, t);
  }
  _afterResize(e, t) {
    this._charSizeService?.measure();
  }
  clear() {
    this.buffer.clearAllMarkers(), this.buffer.lines.set(0, this.buffer.lines.get(this.buffer.ybase + this.buffer.y)), this.buffer.lines.length = 1, this.buffer.ydisp = 0, this.buffer.ybase = 0, this.buffer.y = 0;
    for (let e = 1; e < this.rows; e++) this.buffer.lines.push(this.buffer.getBlankLine(U));
    this._onScroll.fire({ position: this.buffer.ydisp }), this.refresh(0, this.rows - 1);
  }
  reset() {
    this.options.rows = this.rows, this.options.cols = this.cols;
    let e = this._customKeyEventHandler;
    this._setup(), super.reset(), this._mouseService?.reset(), this._selectionService?.reset(), this._decorationService.reset(), this._customKeyEventHandler = e, this.refresh(0, this.rows - 1, true);
  }
  clearTextureAtlas() {
    this._renderService?.clearTextureAtlas();
  }
  _reportFocus() {
    this.element?.classList.contains("focus") ? this.coreService.triggerDataEvent("\x1B[I") : this.coreService.triggerDataEvent("\x1B[O");
  }
  _reportWindowsOptions(e) {
    if (this._renderService) switch (e) {
      case 0:
        let t = this._renderService.dimensions.css.canvas.width.toFixed(0), r = this._renderService.dimensions.css.canvas.height.toFixed(0);
        this.coreService.triggerDataEvent(`\x1B[4;${r};${t}t`);
        break;
      case 1:
        let s4 = this._renderService.dimensions.css.cell.width.toFixed(0), o3 = this._renderService.dimensions.css.cell.height.toFixed(0);
        this.coreService.triggerDataEvent(`\x1B[6;${o3};${s4}t`);
        break;
    }
  }
};
function Ts(n10) {
  return n10.keyCode === 16 || n10.keyCode === 17 || n10.keyCode === 18 || n10.keyCode === 91 || n10.keyCode === 92 || n10.keyCode === 93 || n10.keyCode === 224 || n10.key === "Meta";
}
var yr = class {
  constructor() {
    this._addons = [];
  }
  dispose() {
    for (let i = this._addons.length - 1; i >= 0; i--) this._addons[i].instance.dispose();
  }
  loadAddon(i, e) {
    let t = { instance: e, dispose: e.dispose, isDisposed: false };
    this._addons.push(t), e.dispose = () => this._wrappedAddonDispose(t), e.activate(i);
  }
  _wrappedAddonDispose(i) {
    if (i.isDisposed) return;
    let e = -1;
    for (let t = 0; t < this._addons.length; t++) if (this._addons[t] === i) {
      e = t;
      break;
    }
    if (e === -1) throw new Error("Could not dispose an addon that has not been loaded");
    i.isDisposed = true, i.dispose.apply(i.instance), this._addons.splice(e, 1);
  }
};
var xr = class {
  constructor(i) {
    this._line = i;
  }
  get isWrapped() {
    return this._line.isWrapped;
  }
  get length() {
    return this._line.length;
  }
  getCell(i, e) {
    if (!(i < 0 || i >= this._line.length)) return e ? (this._line.loadCell(i, e), e) : this._line.loadCell(i, new F());
  }
  translateToString(i, e, t) {
    return this._line.translateToString(i, e, t);
  }
};
var di = class {
  constructor(i, e) {
    this._buffer = i;
    this.type = e;
  }
  init(i) {
    return this._buffer = i, this;
  }
  get cursorY() {
    return this._buffer.y;
  }
  get cursorX() {
    return this._buffer.x;
  }
  get viewportY() {
    return this._buffer.ydisp;
  }
  get baseY() {
    return this._buffer.ybase;
  }
  get length() {
    return this._buffer.lines.length;
  }
  getLine(i) {
    let e = this._buffer.lines.get(i);
    if (e) return new xr(e);
  }
  getNullCell() {
    return new F();
  }
};
var wr = class extends g {
  constructor(e) {
    super();
    this._core = e;
    this._onBufferChange = this._register(new b());
    this.onBufferChange = this._onBufferChange.event;
    this._normal = new di(this._core.buffers.normal, "normal"), this._alternate = new di(this._core.buffers.alt, "alternate"), this._register(this._core.buffers.onBufferActivate(() => this._onBufferChange.fire(this.active)));
  }
  get active() {
    if (this._core.buffers.active === this._core.buffers.normal) return this.normal;
    if (this._core.buffers.active === this._core.buffers.alt) return this.alternate;
    throw new Error("Active buffer is neither normal nor alternate");
  }
  get normal() {
    return this._normal.init(this._core.buffers.normal);
  }
  get alternate() {
    return this._alternate.init(this._core.buffers.alt);
  }
};
var Tr = class {
  constructor(i) {
    this._core = i;
  }
  registerCsiHandler(i, e) {
    return this._core.registerCsiHandler(i, (t) => e(t.toArray()));
  }
  addCsiHandler(i, e) {
    return this.registerCsiHandler(i, e);
  }
  registerDcsHandler(i, e) {
    return this._core.registerDcsHandler(i, (t, r) => e(t, r.toArray()));
  }
  addDcsHandler(i, e) {
    return this.registerDcsHandler(i, e);
  }
  registerEscHandler(i, e) {
    return this._core.registerEscHandler(i, e);
  }
  addEscHandler(i, e) {
    return this.registerEscHandler(i, e);
  }
  registerOscHandler(i, e) {
    return this._core.registerOscHandler(i, e);
  }
  addOscHandler(i, e) {
    return this.registerOscHandler(i, e);
  }
  registerApcHandler(i, e) {
    return this._core.registerApcHandler(i, e);
  }
};
var Dr = class {
  constructor(i) {
    this._core = i;
  }
  register(i) {
    this._core.unicodeService.register(i);
  }
  get versions() {
    return this._core.unicodeService.versions;
  }
  get activeVersion() {
    return this._core.unicodeService.activeVersion;
  }
  set activeVersion(i) {
    this._core.unicodeService.activeVersion = i;
  }
};
var wo = ["cols", "rows"];
var Ee = 0;
var Ln = class extends g {
  constructor(i) {
    super(), this._core = this._register(new Er(i)), this._addonManager = this._register(new yr()), this._publicOptions = { ...this._core.options };
    let e = (r) => this._core.options[r], t = (r, s4) => {
      this._checkReadonlyOptions(r), this._core.options[r] = s4;
    };
    for (let r in this._core.options) {
      let s4 = { get: e.bind(this, r), set: t.bind(this, r) };
      Object.defineProperty(this._publicOptions, r, s4);
    }
  }
  _checkReadonlyOptions(i) {
    if (wo.includes(i)) throw new Error(`Option "${i}" can only be set in the constructor`);
  }
  _checkProposedApi() {
    if (!this._core.optionsService.rawOptions.allowProposedApi) throw new Error("You must set the allowProposedApi option to true to use proposed API");
  }
  get onBell() {
    return this._core.onBell;
  }
  get onBinary() {
    return this._core.onBinary;
  }
  get onCursorMove() {
    return this._core.onCursorMove;
  }
  get onData() {
    return this._core.onData;
  }
  get onKey() {
    return this._core.onKey;
  }
  get onLineFeed() {
    return this._core.onLineFeed;
  }
  get onRender() {
    return this._core.onRender;
  }
  get onResize() {
    return this._core.onResize;
  }
  get onScroll() {
    return this._core.onScroll;
  }
  get onSelectionChange() {
    return this._core.onSelectionChange;
  }
  get onTitleChange() {
    return this._core.onTitleChange;
  }
  get onWriteParsed() {
    return this._core.onWriteParsed;
  }
  get onDimensionsChange() {
    return this._core.onDimensionsChange;
  }
  get element() {
    return this._core.element;
  }
  get screenElement() {
    return this._core.screenElement;
  }
  get parser() {
    return this._parser ??= new Tr(this._core);
  }
  get unicode() {
    return this._checkProposedApi(), new Dr(this._core);
  }
  get textarea() {
    return this._core.textarea;
  }
  get rows() {
    return this._core.rows;
  }
  get cols() {
    return this._core.cols;
  }
  get buffer() {
    return this._buffer ??= this._register(new wr(this._core));
  }
  get markers() {
    return this._core.markers;
  }
  get modes() {
    let i = this._core.coreService.decPrivateModes, e = "none";
    switch (this._core.mouseStateService.activeProtocol) {
      case "X10":
        e = "x10";
        break;
      case "VT200":
        e = "vt200";
        break;
      case "DRAG":
        e = "drag";
        break;
      case "ANY":
        e = "any";
        break;
    }
    return { applicationCursorKeysMode: i.applicationCursorKeys, applicationKeypadMode: i.applicationKeypad, bracketedPasteMode: i.bracketedPasteMode, insertMode: this._core.coreService.modes.insertMode, mouseTrackingMode: e, originMode: i.origin, reverseWraparoundMode: i.reverseWraparound, sendFocusMode: i.sendFocus, showCursor: !this._core.coreService.isCursorHidden, synchronizedOutputMode: i.synchronizedOutput, win32InputMode: i.win32InputMode, wraparoundMode: i.wraparound };
  }
  get dimensions() {
    return this._core.dimensions;
  }
  get options() {
    return this._publicOptions;
  }
  set options(i) {
    for (let e in i) this._publicOptions[e] = i[e];
  }
  blur() {
    this._core.blur();
  }
  focus() {
    this._core.focus();
  }
  input(i, e = true) {
    this._core.input(i, e);
  }
  resize(i, e) {
    this._verifyIntegers(i, e), this._core.resize(i, e);
  }
  open(i) {
    this._core.open(i);
  }
  attachCustomKeyEventHandler(i) {
    this._core.attachCustomKeyEventHandler(i);
  }
  attachCustomWheelEventHandler(i) {
    this._core.attachCustomWheelEventHandler(i);
  }
  registerLinkProvider(i) {
    return this._core.registerLinkProvider(i);
  }
  registerCharacterJoiner(i) {
    return this._core.registerCharacterJoiner(i);
  }
  deregisterCharacterJoiner(i) {
    this._core.deregisterCharacterJoiner(i);
  }
  registerMarker(i = 0) {
    return this._verifyIntegers(i), this._core.registerMarker(i);
  }
  registerDecoration(i) {
    return this._verifyPositiveIntegers(i.x ?? 0, i.width ?? 0, i.height ?? 0), this._core.registerDecoration(i);
  }
  hasSelection() {
    return this._core.hasSelection();
  }
  select(i, e, t) {
    this._verifyIntegers(i, e, t), this._core.select(i, e, t);
  }
  getSelection() {
    return this._core.getSelection();
  }
  getSelectionPosition() {
    return this._core.getSelectionPosition();
  }
  clearSelection() {
    this._core.clearSelection();
  }
  selectAll() {
    this._core.selectAll();
  }
  selectLines(i, e) {
    this._verifyIntegers(i, e), this._core.selectLines(i, e);
  }
  dispose() {
    super.dispose();
  }
  scrollLines(i) {
    this._verifyIntegers(i), this._core.scrollLines(i);
  }
  scrollPages(i) {
    this._verifyIntegers(i), this._core.scrollPages(i);
  }
  scrollToTop() {
    this._core.scrollToTop();
  }
  scrollToBottom() {
    this._core.scrollToBottom();
  }
  scrollToLine(i) {
    this._verifyIntegers(i), this._core.scrollToLine(i);
  }
  clear() {
    this._core.clear();
  }
  write(i, e) {
    this._core.write(i, e);
  }
  writeln(i, e) {
    this._core.write(i), this._core.write(`\r
`, e);
  }
  paste(i) {
    this._core.paste(i);
  }
  refresh(i, e) {
    this._verifyIntegers(i, e), this._core.refresh(i, e);
  }
  reset() {
    this._core.reset();
  }
  clearTextureAtlas() {
    this._core.clearTextureAtlas();
  }
  loadAddon(i) {
    this._addonManager.loadAddon(this, i);
  }
  static get strings() {
    return { get promptLabel() {
      return Ut.get();
    }, set promptLabel(i) {
      Ut.set(i);
    }, get tooMuchOutput() {
      return Ze.get();
    }, set tooMuchOutput(i) {
      Ze.set(i);
    } };
  }
  _verifyIntegers(...i) {
    for (Ee of i) if (Ee === 1 / 0 || isNaN(Ee) || Ee % 1 !== 0) throw new Error("This API only accepts integers");
  }
  _verifyPositiveIntegers(...i) {
    for (Ee of i) if (Ee && (Ee === 1 / 0 || isNaN(Ee) || Ee % 1 !== 0 || Ee < 0)) throw new Error("This API only accepts positive integers");
  }
};

// node_modules/@xterm/addon-fit/lib/addon-fit.mjs
function f(t) {
  return t?.ownerDocument?.defaultView ? t.ownerDocument.defaultView : window;
}
function o(t) {
  return f(t).getComputedStyle(t, null);
}
var l = class {
  activate(e) {
    this._terminal = e;
  }
  dispose() {
  }
  fit() {
    let e = this.proposeDimensions();
    !e || !this._terminal || isNaN(e.cols) || isNaN(e.rows) || this._terminal.resize(e.cols, e.rows);
  }
  proposeDimensions() {
    if (!this._terminal || !this._terminal.element || !this._terminal.element.parentElement) return;
    let e = this._terminal.dimensions;
    if (!e || e.css.cell.width === 0 || e.css.cell.height === 0) return;
    let s4 = this._terminal.options.scrollbar?.showScrollbar ?? true, a = this._terminal.options.scrollback === 0 || !s4 ? 0 : this._terminal.options.scrollbar?.width ?? 14, r = o(this._terminal.element.parentElement), m2 = Math.max(0, parseInt(r.getPropertyValue("height"), 10) || 0), d = Math.max(0, parseInt(r.getPropertyValue("width"), 10) || 0), n10 = o(this._terminal.element), i = { top: parseInt(n10.getPropertyValue("padding-top"), 10) || 0, bottom: parseInt(n10.getPropertyValue("padding-bottom"), 10) || 0, right: parseInt(n10.getPropertyValue("padding-right"), 10) || 0, left: parseInt(n10.getPropertyValue("padding-left"), 10) || 0 }, p = i.top + i.bottom, c = i.right + i.left, h = m2 - p, u = d - c - a;
    return { cols: Math.max(2, Math.floor(u / e.css.cell.width)), rows: Math.max(1, Math.floor(h / e.css.cell.height)) };
  }
};

// node_modules/@xterm/addon-clipboard/lib/addon-clipboard.mjs
var l2 = class {
  constructor(t = new o2(), e = new s()) {
    this._base64 = t;
    this._provider = e;
  }
  activate(t) {
    this._terminal = t, this._disposable = t.parser.registerOscHandler(52, (e) => this._setOrReportClipboard(e));
  }
  dispose() {
    return this._disposable?.dispose();
  }
  _readText(t, e) {
    let r = this._base64.encodeText(e);
    this._terminal?.input(`\x1B]52;${t};${r}\x07`, false);
  }
  _setOrReportClipboard(t) {
    let e = t.split(";");
    if (e.length < 2) return true;
    let r = e[0], i = e[1];
    if (i === "?") {
      let n10 = this._provider.readText(r);
      return n10 instanceof Promise ? n10.then((p) => (this._readText(r, p), true)) : (this._readText(r, n10), true);
    }
    let d = "";
    try {
      d = this._base64.decodeText(i);
    } catch {
    }
    let c = this._provider.writeText(r, d);
    return c instanceof Promise ? c.then(() => true) : true;
  }
};
var s = class {
  readText(t) {
    return navigator.clipboard.readText();
  }
  writeText(t, e) {
    return navigator.clipboard.writeText(e);
  }
};
var o2 = class {
  encodeText(t) {
    let e = new TextEncoder().encode(t);
    if (e.toBase64 !== void 0) return e.toBase64();
    let r = "";
    for (let i = 0; i < e.length; i++) r += String.fromCharCode(e[i]);
    return btoa(r);
  }
  decodeText(t) {
    if (Uint8Array.fromBase64 !== void 0) {
      try {
        return new TextDecoder().decode(Uint8Array.fromBase64(t));
      } catch {
      }
      return "";
    }
    try {
      let e = atob(t), r = new Uint8Array(e.length);
      for (let i = 0; i < e.length; ++i) r[i] = e.charCodeAt(i);
      return new TextDecoder().decode(r);
    } catch {
    }
    return "";
  }
};

// node_modules/@xterm/addon-image/lib/addon-image.mjs
var it = Object.create;
var Te2 = Object.defineProperty;
var At2 = Object.getOwnPropertyDescriptor;
var rt2 = Object.getOwnPropertyNames;
var st2 = Object.getPrototypeOf;
var nt2 = Object.prototype.hasOwnProperty;
var T = (s4, e) => () => {
  try {
    return e || s4((e = { exports: {} }).exports, e), e.exports;
  } catch (t) {
    throw e = 0, t;
  }
};
var at2 = (s4, e, t, i) => {
  if (e && typeof e == "object" || typeof e == "function") for (let A of rt2(e)) !nt2.call(s4, A) && A !== t && Te2(s4, A, { get: () => e[A], enumerable: !(i = At2(e, A)) || i.enumerable });
  return s4;
};
var x = (s4, e, t) => (t = s4 != null ? it(st2(s4)) : {}, at2(e || !s4 || !s4.__esModule ? Te2(t, "default", { value: s4, enumerable: true }) : t, s4));
var z2 = T((m2) => {
  "use strict";
  Object.defineProperty(m2, "__esModule", { value: true });
  m2.DEFAULT_FOREGROUND = m2.DEFAULT_BACKGROUND = m2.PALETTE_ANSI_256 = m2.PALETTE_VT340_GREY = m2.PALETTE_VT340_COLOR = m2.normalizeHLS = m2.normalizeRGB = m2.nearestColorIndex = m2.fromRGBA8888 = m2.toRGBA8888 = m2.alpha = m2.blue = m2.green = m2.red = m2.BIG_ENDIAN = void 0;
  m2.BIG_ENDIAN = new Uint8Array(new Uint32Array([4278190080]).buffer)[0] === 255;
  m2.BIG_ENDIAN && console.warn("BE platform detected. This version of node-sixel works only on LE properly.");
  function xe(s4) {
    return s4 & 255;
  }
  m2.red = xe;
  function Me2(s4) {
    return s4 >>> 8 & 255;
  }
  m2.green = Me2;
  function ve(s4) {
    return s4 >>> 16 & 255;
  }
  m2.blue = ve;
  function ht2(s4) {
    return s4 >>> 24 & 255;
  }
  m2.alpha = ht2;
  function B2(s4, e, t, i = 255) {
    return ((i & 255) << 24 | (t & 255) << 16 | (e & 255) << 8 | s4 & 255) >>> 0;
  }
  m2.toRGBA8888 = B2;
  function dt2(s4) {
    return [s4 & 255, s4 >> 8 & 255, s4 >> 16 & 255, s4 >>> 24];
  }
  m2.fromRGBA8888 = dt2;
  function It2(s4, e) {
    let t = xe(s4), i = Me2(s4), A = ve(s4), r = Number.MAX_SAFE_INTEGER, a = -1;
    for (let n10 = 0; n10 < e.length; ++n10) {
      let o3 = t - e[n10][0], d = i - e[n10][1], h = A - e[n10][2], g2 = o3 * o3 + d * d + h * h;
      if (!g2) return n10;
      g2 < r && (r = g2, a = n10);
    }
    return a;
  }
  m2.nearestColorIndex = It2;
  function de(s4, e, t) {
    return Math.max(s4, Math.min(t, e));
  }
  function Ie2(s4, e, t) {
    return t < 0 && (t += 1), t > 1 && (t -= 1), t * 6 < 1 ? e + (s4 - e) * 6 * t : t * 2 < 1 ? s4 : t * 3 < 2 ? e + (s4 - e) * (4 - t * 6) : e;
  }
  function gt2(s4, e, t) {
    if (!t) {
      let r = Math.round(e * 255);
      return B2(r, r, r);
    }
    let i = e < 0.5 ? e * (1 + t) : e + t - e * t, A = 2 * e - i;
    return B2(de(0, 255, Math.round(Ie2(i, A, s4 + 1 / 3) * 255)), de(0, 255, Math.round(Ie2(i, A, s4) * 255)), de(0, 255, Math.round(Ie2(i, A, s4 - 1 / 3) * 255)));
  }
  function c(s4, e, t) {
    return (4278190080 | Math.round(t / 100 * 255) << 16 | Math.round(e / 100 * 255) << 8 | Math.round(s4 / 100 * 255)) >>> 0;
  }
  m2.normalizeRGB = c;
  function lt2(s4, e, t) {
    return gt2((s4 + 240 % 360) / 360, e / 100, t / 100);
  }
  m2.normalizeHLS = lt2;
  m2.PALETTE_VT340_COLOR = new Uint32Array([c(0, 0, 0), c(20, 20, 80), c(80, 13, 13), c(20, 80, 20), c(80, 20, 80), c(20, 80, 80), c(80, 80, 20), c(53, 53, 53), c(26, 26, 26), c(33, 33, 60), c(60, 26, 26), c(33, 60, 33), c(60, 33, 60), c(33, 60, 60), c(60, 60, 33), c(80, 80, 80)]);
  m2.PALETTE_VT340_GREY = new Uint32Array([c(0, 0, 0), c(13, 13, 13), c(26, 26, 26), c(40, 40, 40), c(6, 6, 6), c(20, 20, 20), c(33, 33, 33), c(46, 46, 46), c(0, 0, 0), c(13, 13, 13), c(26, 26, 26), c(40, 40, 40), c(6, 6, 6), c(20, 20, 20), c(33, 33, 33), c(46, 46, 46)]);
  m2.PALETTE_ANSI_256 = (() => {
    let s4 = [B2(0, 0, 0), B2(205, 0, 0), B2(0, 205, 0), B2(205, 205, 0), B2(0, 0, 238), B2(205, 0, 205), B2(0, 250, 205), B2(229, 229, 229), B2(127, 127, 127), B2(255, 0, 0), B2(0, 255, 0), B2(255, 255, 0), B2(92, 92, 255), B2(255, 0, 255), B2(0, 255, 255), B2(255, 255, 255)], e = [0, 95, 135, 175, 215, 255];
    for (let t = 0; t < 6; ++t) for (let i = 0; i < 6; ++i) for (let A = 0; A < 6; ++A) s4.push(B2(e[t], e[i], e[A]));
    for (let t = 8; t <= 238; t += 10) s4.push(B2(t, t, t));
    return new Uint32Array(s4);
  })();
  m2.DEFAULT_BACKGROUND = B2(0, 0, 0, 255);
  m2.DEFAULT_FOREGROUND = B2(255, 255, 255, 255);
});
var ce2 = T((le2) => {
  "use strict";
  Object.defineProperty(le2, "__esModule", { value: true });
  le2.InWasm = Ct2;
  var M2 = (s4) => {
    if (Uint8Array.fromBase64) return Uint8Array.fromBase64(s4);
    if (typeof Buffer < "u") return Buffer.from(s4, "base64");
    let e = atob(s4), t = new Uint8Array(e.length);
    for (let i = 0; i < t.length; ++i) t[i] = e.charCodeAt(i);
    return t;
  };
  function Ct2(s4) {
    if (s4.d) {
      let { t: e, s: t, d: i } = s4, A, r, a = WebAssembly;
      return e === 0 ? t ? (n10) => new a.Instance(r || (r = new a.Module(A || (A = M2(i)))), n10) : (n10) => r ? a.instantiate(r, n10) : a.instantiate(A || (A = M2(i)), n10).then((o3) => (r = o3.module) && o3.instance) : e === 1 ? t ? () => r || (r = new a.Module(A || (A = M2(i)))) : () => r ? Promise.resolve(r) : a.compile(A || (A = M2(i))).then((n10) => r = n10) : t ? () => A || (A = M2(i)) : () => Promise.resolve(A || (A = M2(i)));
    }
    if (typeof _wasmCtx > "u") throw new Error('must run "inwasm"');
    _wasmCtx.add(s4);
  }
});
var Ee2 = T((_e2) => {
  "use strict";
  Object.defineProperty(_e2, "__esModule", { value: true });
  var pt = ce2(), Bt2 = (0, pt.InWasm)({ s: 1, t: 0, d: "AGFzbQEAAAABBQFgAAF/Ag8BA2VudgZtZW1vcnkCAAEDAwIAAAcNAgNkZWMAAANlbmQAAQqLBgKZBAEKf0GIKCgCAEGgKGohAUGEKCgCACIDQaAoaiEAQYAoKAIAQQFrQXxxIgRBoChqIQUgBEEQayADSgRAIARBkChqIQMDQCABIABBA2otAABBAnQoAoAgIABBAmotAABBAnQoAoAYIABBAWotAABBAnQoAoAQIAAtAABBAnQoAoAIcnJyIgY2AgAgAUEDaiAAQQdqLQAAQQJ0KAKAICAAQQZqLQAAQQJ0KAKAGCAAQQVqLQAAQQJ0KAKAECAAQQRqLQAAQQJ0KAKACHJyciIHNgIAIAFBBmogAEELai0AAEECdCgCgCAgAEEKai0AAEECdCgCgBggAEEJai0AAEECdCgCgBAgAEEIai0AAEECdCgCgAhycnIiCDYCACABQQlqIABBD2otAABBAnQoAoAgIABBDmotAABBAnQoAoAYIABBDWotAABBAnQoAoAQIABBDGotAABBAnQoAoAIcnJyIgk2AgAgAiAGciAHciAIciAJciECIAFBDGohASAAQRBqIgAgA0kNAAsLIAAgBUkEQANAIAEgAEEDai0AAEECdCgCgCAgAEECai0AAEECdCgCgBggAEEBai0AAEECdCgCgBAgAC0AAEECdCgCgAhycnIiAzYCACACIANyIQIgAUEDaiEBIABBBGoiACAFSQ0ACwtBfyEAIAJB////B00Ef0GEKCAENgIAQYgoIAFBoChrNgIAQQAFQX8LC+0BAQR/AkBBgCgoAgAiAUGEKCgCACIAa0EFTgRAQX8hAxAADQFBgCgoAgAhAUGEKCgCACEAC0F/IQMgASAAayIBQQJIDQAgAC0AoShBAnQoAoAQIAAtAKAoQQJ0KAKACHIhAgJ/IAFBBEYEQEEDQQQgAC0AoyhBPUYbIAAtAKIoQT1GayEBC0EBIAFBA0kNABogAC0AoihBAnQoAoAYIAJyIQJBAiABQQRHDQAaIAAtAKMoQQJ0KAKAICACciECQQMLIQEgAkH///8HSw0AQQAhA0GIKCgCACIAIAI2AKAoQYgoIAAgAWo2AgALIAML" }), S = new Uint8Array("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("").map((s4) => s4.charCodeAt(0))), v = new Uint32Array(1024);
  v.fill(4278190080);
  for (let s4 = 0; s4 < S.length; ++s4) v[S[s4]] = s4 << 2;
  for (let s4 = 0; s4 < S.length; ++s4) v[256 + S[s4]] = s4 >> 4 | (s4 << 4 & 255) << 8;
  for (let s4 = 0; s4 < S.length; ++s4) v[512 + S[s4]] = s4 >> 2 << 8 | (s4 << 6 & 255) << 16;
  for (let s4 = 0; s4 < S.length; ++s4) v[768 + S[s4]] = s4 << 16;
  var ft2 = new Uint8Array(0), me2 = class {
    constructor(e, t, i) {
      if (this._inst = null, this._ended = true, this._bytes = 0, this.keepSize = e ?? 1048576, this.maxBytes = t ?? 4294901760, this._bytes = i ?? 32768, this._bytes > this.maxBytes || this.maxBytes > 4294901760) throw new Error("invalid byte settings");
    }
    get data8() {
      return this._inst ? this._d.subarray(0, this._m32[1282]) : ft2;
    }
    release() {
      this._inst && (this._bytes > this.keepSize ? this._inst = this._m32 = this._d = this._mem = null : (this._m32[1280] = 0, this._m32[1281] = 0, this._m32[1282] = 0));
    }
    init(e, t) {
      if (this.maxBytes = e ?? this.maxBytes, this._bytes = t ?? Math.min(this._bytes, this.maxBytes), this._bytes > this.maxBytes || this.maxBytes > 4294901760) throw Error("invalid byte settings");
      let i = this._m32, A = this._bytes + 5152;
      this._inst ? this._mem.buffer.byteLength < A && (this._mem.grow(Math.ceil((A - this._mem.buffer.byteLength) / 65536)), i = new Uint32Array(this._mem.buffer, 0), this._d = new Uint8Array(this._mem.buffer, 5152)) : (this._mem = new WebAssembly.Memory({ initial: Math.ceil(A / 65536) }), this._inst = Bt2({ env: { memory: this._mem } }), i = new Uint32Array(this._mem.buffer, 0), i.set(v, 256), this._d = new Uint8Array(this._mem.buffer, 5152)), i[1280] = 0, i[1281] = 0, i[1282] = 0, this._m32 = i, this._ended = false;
    }
    _realloc(e) {
      let t = this._m32[1280] + e;
      if (this._bytes < t) {
        if (t > this.maxBytes) return -3;
        let i = this._bytes;
        for (; (i *= 2) < t; ) ;
        if (i = Math.min(i, this.maxBytes), i < t) return -3;
        if (i + 5152 > this._mem.buffer.byteLength) {
          let A = Math.ceil((i + 5152 - this._mem.buffer.byteLength) / 65536);
          this._mem.grow(A), this._m32 = new Uint32Array(this._mem.buffer, 0), this._d = new Uint8Array(this._mem.buffer, 5152);
        }
        this._bytes = i;
      }
      return 0;
    }
    put(e) {
      if (!this._inst || this._ended) return -2;
      if (this._realloc(e.length)) return -3;
      let t = this._m32;
      return this._d.set(e, t[1280]), t[1280] += e.length, t[1280] - t[1281] >= 131072 ? this._inst.exports.dec() : 0;
    }
    end() {
      return this._ended = true, this._inst ? this._inst.exports.end() : -2;
    }
    get loadedBytes() {
      return this._inst ? this._m32[1280] : 0;
    }
    get freeBytes() {
      return this._inst ? this.maxBytes - this._m32[1280] : 0;
    }
  };
  _e2.default = me2;
});
var Re2 = T((Ce2) => {
  "use strict";
  Object.defineProperty(Ce2, "__esModule", { value: true });
  var Qt2 = ce2(), Dt2 = (0, Qt2.InWasm)({ s: 1, t: 0, d: "AGFzbQEAAAABCgJgAABgA39/fwACDwEDZW52Bm1lbW9yeQIAAQMDAgABBwcBA2RlYwABCAEACu4EAgwAQQBBAEGAAvwLAAveBAEJf0EAQQBBgAL8CwAgAUEXTgRAIAAgAWpBCGshCkGACCEBIAJBAnRBgAhqIQsgAEEOaiEDQf8BIQZBACECA0AgA0EBaiEHIAMtAAAiCEE/cSEAAkACQCAIQcABcSIJRQRAIABBAnQiAC0AAyEGIAAtAAIhBCAALQABIQUgAC0AACECIAchAwwBCwJAIAhB/QFLDQAgCUHAAUcNACAFQQVsIAJBA2xqIARBB2xqIAZBC2xqQT9xQQJ0IgMgBDoAAiADIAU6AAEgAyACOgAAIANBA2ogBjoAAANAIAEgAjoAACABQQNqIAY6AAAgAUECaiAEOgAAIAFBAWogBToAACABQQRqIQEgAEUEQCAHIQMMBAsgAEEBayEAIAEgC0kNAAsgByEDDAILAn8CQAJAAkAgCEH+AWsOAgABAgsgAy0AAyEEIAMtAAIhBSADLQABIQIgA0EEagwCCyADKAIBIgJBGHYhBiACQRB2IQQgAkEIdiEFIANBBWoMAQsgCUGAAUcEQCAHIAlBwABHDQEaIAQgCEEDcWpBAmshBCACIABBBHZqQQJrIQIgBSAIQQJ2QQNxakECayEFIAcMAQsgBCAAQShrIgkgAy0AASIHQQ9xamohBCACIAdBBHYgCWpqIQIgACAFakEgayEFIANBAmoLIQMgBUEFbCACQQNsaiAEQQdsaiAGQQtsakE/cUECdCIAIAQ6AAIgACAFOgABIAAgAjoAACAAQQNqIAY6AAALIAEgBjoAAyABIAQ6AAIgASAFOgABIAEgAjoAACABQQRqIQELIAMgCkkNAAsLCw==" }), ue2 = class {
    constructor(e) {
      this.keepSize = e, this.width = 0, this.height = 0;
    }
    decode(e) {
      this.width = e[4] << 24 | e[5] << 16 | e[6] << 8 | e[7], this.height = e[8] << 24 | e[9] << 16 | e[10] << 8 | e[11];
      let t = this.width * this.height, i = t * 4, A = e.length, r = Math.max(i, A) + (Math.min(i, A) >> 1) + 4096;
      this._inst ? this._mem.buffer.byteLength < r && (this._mem.grow(Math.ceil((r - this._mem.buffer.byteLength) / 65536)), this._d = null) : (this._mem = new WebAssembly.Memory({ initial: Math.ceil(r / 65536) }), this._inst = Dt2({ env: { memory: this._mem } })), this._d || (this._d = new Uint8Array(this._mem.buffer));
      let a = this._mem.buffer.byteLength - A & -256;
      return this._d.set(e, a), this._inst.exports.dec(a, A, t), this._d.subarray(1024, 1024 + i);
    }
    release() {
      this._inst && this._mem.buffer.byteLength > this.keepSize && (this._inst = this._d = this._mem = null);
    }
  };
  Ce2.default = ue2;
});
var Ke2 = T((ie2) => {
  "use strict";
  Object.defineProperty(ie2, "__esModule", { value: true });
  ie2.LIMITS = void 0;
  ie2.LIMITS = { CHUNK_SIZE: 16384, PALETTE_SIZE: 4096, MAX_WIDTH: 16384, BYTES: "AGFzbQEAAAABJAdgAAF/YAJ/fwBgA39/fwF/YAF/AX9gAABgBH9/f38AYAF/AAIlAgNlbnYLaGFuZGxlX2JhbmQAAwNlbnYLbW9kZV9wYXJzZWQAAwMTEgQAAAAAAQQBAQUBAAACAgAGAwQFAXABBwcFBAEBBwcGCAF/AUGAihoLB9wBDgZtZW1vcnkCABFnZXRfc3RhdGVfYWRkcmVzcwADEWdldF9jaHVua19hZGRyZXNzAAQOZ2V0X3AwX2FkZHJlc3MABRNnZXRfcGFsZXR0ZV9hZGRyZXNzAAYEaW5pdAALBmRlY29kZQAMDWN1cnJlbnRfd2lkdGgADQ5jdXJyZW50X2hlaWdodAAOGV9faW5kaXJlY3RfZnVuY3Rpb25fdGFibGUBAAtfaW5pdGlhbGl6ZQACCXN0YWNrU2F2ZQARDHN0YWNrUmVzdG9yZQASCnN0YWNrQWxsb2MAEwkMAQBBAQsGCgcJDxACDAEBCq5UEgMAAQsFAEGgCAsGAEGQiQELBgBBsIkCCwUAQZAJC+okAQh/QeQIKAIAIQVB4AgoAgAhA0HoCCgCACEIIAFBkIkBaiIJQf8BOgAAIAAgAUgEQCAAQZCJAWohBgNAIAMhBCAGQQFqIQECQCAGLQAAQf8AcSIDQTBrQQlLBEAgASEGDAELQewIKAIAQQJ0QewIaiICKAIAIQADQCACIAMgAEEKbGpBMGsiADYCACABLQAAIQMgAUEBaiIGIQEgA0H/AHEiA0Ewa0EKSQ0ACwsCQAJAAkACQAJAAkACQAJ/AkACQCADQT9rIgBBP00EQCAERQ0BIARBIUYEQAJAQfAIKAIAIgFBASABGyIHIAhqIgFB1AgoAgAiA0gNACADQf//AEoNAANAIANBAnQiAkGgiQJqIgRBoAgpAwA3AwAgAkGoiQJqQaAIKQMANwMAIAJBsIkCakGgCCkDADcDACACQbiJAmpBoAgpAwA3AwAgAkHAiQJqQaAIKQMANwMAIAJByIkCakGgCCkDADcDACACQdCJAmpBoAgpAwA3AwAgAkHYiQJqQaAIKQMANwMAIAJB4IkCakGgCCkDADcDACACQeiJAmpBoAgpAwA3AwAgAkHwiQJqQaAIKQMANwMAIAJB+IkCakGgCCkDADcDACACQYCKAmpBoAgpAwA3AwAgAkGIigJqQaAIKQMANwMAIAJBkIoCakGgCCkDADcDACACQZiKAmpBoAgpAwA3AwAgAkGgigJqQaAIKQMANwMAIAJBqIoCakGgCCkDADcDACACQbCKAmpBoAgpAwA3AwAgAkG4igJqQaAIKQMANwMAIAJBwIoCakGgCCkDADcDACACQciKAmpBoAgpAwA3AwAgAkHQigJqQaAIKQMANwMAIAJB2IoCakGgCCkDADcDACACQeCKAmpBoAgpAwA3AwAgAkHoigJqQaAIKQMANwMAIAJB8IoCakGgCCkDADcDACACQfiKAmpBoAgpAwA3AwAgAkGAiwJqQaAIKQMANwMAIAJBiIsCakGgCCkDADcDACACQZCLAmpBoAgpAwA3AwAgAkGYiwJqQaAIKQMANwMAIAJBoIsCakGgCCkDADcDACACQaiLAmpBoAgpAwA3AwAgAkGwiwJqQaAIKQMANwMAIAJBuIsCakGgCCkDADcDACACQcCLAmpBoAgpAwA3AwAgAkHIiwJqQaAIKQMANwMAIAJB0IsCakGgCCkDADcDACACQdiLAmpBoAgpAwA3AwAgAkHgiwJqQaAIKQMANwMAIAJB6IsCakGgCCkDADcDACACQfCLAmpBoAgpAwA3AwAgAkH4iwJqQaAIKQMANwMAIAJBgIwCakGgCCkDADcDACACQYiMAmpBoAgpAwA3AwAgAkGQjAJqQaAIKQMANwMAIAJBmIwCakGgCCkDADcDACACQaCMAmpBoAgpAwA3AwAgAkGojAJqQaAIKQMANwMAIAJBsIwCakGgCCkDADcDACACQbiMAmpBoAgpAwA3AwAgAkHAjAJqQaAIKQMANwMAIAJByIwCakGgCCkDADcDACACQdCMAmpBoAgpAwA3AwAgAkHYjAJqQaAIKQMANwMAIAJB4IwCakGgCCkDADcDACACQeiMAmpBoAgpAwA3AwAgAkHwjAJqQaAIKQMANwMAIAJB+IwCakGgCCkDADcDACACQYCNAmpBoAgpAwA3AwAgAkGIjQJqQaAIKQMANwMAIAJBkI0CakGgCCkDADcDACACQZiNAmpBoAgpAwA3AwAgAkGwiQZqIARBgAT8CgAAQdQIKAIAQQJ0QcCJCmogBEGABPwKAABB1AgoAgBBAnRB0IkOaiAEQYAE/AoAAEHUCCgCAEECdEHgiRJqIARBgAT8CgAAQdQIKAIAQQJ0QfCJFmogBEGABPwKAABB1AhB1AgoAgAiAkGAAWoiAzYCACABIANIDQEgAkGA/wBIDQALCwJAIABFDQAgCEH//wBLDQBBgIABIAhrIAcgAUH//wBLGyECAkAgAEEBcUUNACACRQ0AIAhBAnRBoIkCaiEDIAIhBCACQQdxIgcEQANAIAMgBTYCACADQQRqIQMgBEEBayEEIAdBAWsiBw0ACwsgAkEBa0EHSQ0AA0AgAyAFNgIcIAMgBTYCGCADIAU2AhQgAyAFNgIQIAMgBTYCDCADIAU2AgggAyAFNgIEIAMgBTYCACADQSBqIQMgBEEIayIEDQALCwJAIABBAnFFDQAgAkUNACAIQQJ0QbCJBmohAyACIQQgAkEHcSIHBEADQCADIAU2AgAgA0EEaiEDIARBAWshBCAHQQFrIgcNAAsLIAJBAWtBB0kNAANAIAMgBTYCHCADIAU2AhggAyAFNgIUIAMgBTYCECADIAU2AgwgAyAFNgIIIAMgBTYCBCADIAU2AgAgA0EgaiEDIARBCGsiBA0ACwsCQCAAQQRxRQ0AIAJFDQAgCEECdEHAiQpqIQMgAiEEIAJBB3EiBwRAA0AgAyAFNgIAIANBBGohAyAEQQFrIQQgB0EBayIHDQALCyACQQFrQQdJDQADQCADIAU2AhwgAyAFNgIYIAMgBTYCFCADIAU2AhAgAyAFNgIMIAMgBTYCCCADIAU2AgQgAyAFNgIAIANBIGohAyAEQQhrIgQNAAsLAkAgAEEIcUUNACACRQ0AIAhBAnRB0IkOaiEDIAIhBCACQQdxIgcEQANAIAMgBTYCACADQQRqIQMgBEEBayEEIAdBAWsiBw0ACwsgAkEBa0EHSQ0AA0AgAyAFNgIcIAMgBTYCGCADIAU2AhQgAyAFNgIQIAMgBTYCDCADIAU2AgggAyAFNgIEIAMgBTYCACADQSBqIQMgBEEIayIEDQALCwJAIABBEHFFDQAgAkUNACAIQQJ0QeCJEmohAyACIQQgAkEHcSIHBEADQCADIAU2AgAgA0EEaiEDIARBAWshBCAHQQFrIgcNAAsLIAJBAWtBB0kNAANAIAMgBTYCHCADIAU2AhggAyAFNgIUIAMgBTYCECADIAU2AgwgAyAFNgIIIAMgBTYCBCADIAU2AgAgA0EgaiEDIARBCGsiBA0ACwsgAEEgcUUNACACRQ0AIAJBAWshByAIQQJ0QfCJFmohAyACQQdxIgQEQANAIAMgBTYCACADQQRqIQMgAkEBayECIARBAWsiBA0ACwsgB0EHSQ0AA0AgAyAFNgIcIAMgBTYCGCADIAU2AhQgAyAFNgIQIAMgBTYCDCADIAU2AgggAyAFNgIEIAMgBTYCACADQSBqIQMgAkEIayICDQALC0HcCEHcCCgCACAAcjYCACAGQQFqIgIgBi0AAEH/AHEiA0E/ayIAQT9LDQQaDAMLAkBB7AgoAgAiBEEBRgRAQfAIKAIAIgNBzAgoAgAiAUkNASADIAFwIQMMAQtB+AgoAgAhAkH0CCgCACEBAkACQCAEQQVHDQAgAUEBRw0AIAJB6QJODQQMAQsgAkHkAEoNA0H8CCgCAEHkAEoNA0GACSgCAEHkAEoNAwsCQCABRQ0AIAFBAkoNACACQfwIKAIAQYAJKAIAIAFBAnRBiAhqKAIAEQIAIQFB8AgoAgAiA0HMCCgCACICTwR/IAMgAnAFIAMLQQJ0QZAJaiABNgIAC0HwCCgCACIDQcwIKAIAIgFJDQAgAyABcCEDCyADQQJ0QZAJaigCACEFDAELIANB/QBxQSFHBEAgCCEBIAYhAgwECyAEQSNHDQQCQEHsCCgCACICQQFGBEBB8AgoAgAiAUHMCCgCACIASQ0BIAEgAHAhAQwBC0H4CCgCACEBQfQIKAIAIQACQAJAIAJBBUcNACAAQQFHDQAgAUHpAkgNAQwHCyABQeQASg0GQfwIKAIAQeQASg0GQYAJKAIAQeQASg0GCwJAIABFDQAgAEECSg0AIAFB/AgoAgBBgAkoAgAgAEECdEGICGooAgARAgAhAEHwCCgCACIBQcwIKAIAIgJPBH8gASACcAUgAQtBAnRBkAlqIAA2AgALQfAIKAIAIgFBzAgoAgAiAEkNACABIABwIQELIAFBAnRBkAlqKAIAIQUMBAsgCCEBIAYhAgtB1AgoAgAhBgNAAkAgASAGSA0AIAZB//8ASg0AIAZBAnQiBEGgiQJqIgZBoAgpAwA3AwAgBEGoiQJqQaAIKQMANwMAIARBsIkCakGgCCkDADcDACAEQbiJAmpBoAgpAwA3AwAgBEHAiQJqQaAIKQMANwMAIARByIkCakGgCCkDADcDACAEQdCJAmpBoAgpAwA3AwAgBEHYiQJqQaAIKQMANwMAIARB4IkCakGgCCkDADcDACAEQeiJAmpBoAgpAwA3AwAgBEHwiQJqQaAIKQMANwMAIARB+IkCakGgCCkDADcDACAEQYCKAmpBoAgpAwA3AwAgBEGIigJqQaAIKQMANwMAIARBkIoCakGgCCkDADcDACAEQZiKAmpBoAgpAwA3AwAgBEGgigJqQaAIKQMANwMAIARBqIoCakGgCCkDADcDACAEQbCKAmpBoAgpAwA3AwAgBEG4igJqQaAIKQMANwMAIARBwIoCakGgCCkDADcDACAEQciKAmpBoAgpAwA3AwAgBEHQigJqQaAIKQMANwMAIARB2IoCakGgCCkDADcDACAEQeCKAmpBoAgpAwA3AwAgBEHoigJqQaAIKQMANwMAIARB8IoCakGgCCkDADcDACAEQfiKAmpBoAgpAwA3AwAgBEGAiwJqQaAIKQMANwMAIARBiIsCakGgCCkDADcDACAEQZCLAmpBoAgpAwA3AwAgBEGYiwJqQaAIKQMANwMAIARBoIsCakGgCCkDADcDACAEQaiLAmpBoAgpAwA3AwAgBEGwiwJqQaAIKQMANwMAIARBuIsCakGgCCkDADcDACAEQcCLAmpBoAgpAwA3AwAgBEHIiwJqQaAIKQMANwMAIARB0IsCakGgCCkDADcDACAEQdiLAmpBoAgpAwA3AwAgBEHgiwJqQaAIKQMANwMAIARB6IsCakGgCCkDADcDACAEQfCLAmpBoAgpAwA3AwAgBEH4iwJqQaAIKQMANwMAIARBgIwCakGgCCkDADcDACAEQYiMAmpBoAgpAwA3AwAgBEGQjAJqQaAIKQMANwMAIARBmIwCakGgCCkDADcDACAEQaCMAmpBoAgpAwA3AwAgBEGojAJqQaAIKQMANwMAIARBsIwCakGgCCkDADcDACAEQbiMAmpBoAgpAwA3AwAgBEHAjAJqQaAIKQMANwMAIARByIwCakGgCCkDADcDACAEQdCMAmpBoAgpAwA3AwAgBEHYjAJqQaAIKQMANwMAIARB4IwCakGgCCkDADcDACAEQeiMAmpBoAgpAwA3AwAgBEHwjAJqQaAIKQMANwMAIARB+IwCakGgCCkDADcDACAEQYCNAmpBoAgpAwA3AwAgBEGIjQJqQaAIKQMANwMAIARBkI0CakGgCCkDADcDACAEQZiNAmpBoAgpAwA3AwAgBEGwiQZqIAZBgAT8CgAAQdQIKAIAQQJ0QcCJCmogBkGABPwKAABB1AgoAgBBAnRB0IkOaiAGQYAE/AoAAEHUCCgCAEECdEHgiRJqIAZBgAT8CgAAQdQIKAIAQQJ0QfCJFmogBkGABPwKAABB1AhB1AgoAgBBgAFqIgY2AgALIAFB//8ATQRAIABBAXEgAWxBAnRBoIkCaiAFNgIAIABBAXZBAXEgAWxBAnRBsIkGaiAFNgIAIABBAnZBAXEgAWxBAnRBwIkKaiAFNgIAIABBA3ZBAXEgAWxBAnRB0IkOaiAFNgIAIABBBHZBAXEgAWxBAnRB4IkSaiAFNgIAIABBBXYgAWxBAnRB8IkWaiAFNgIAQdQIKAIAIQYLIAFBAWohAUHcCEHcCCgCACAAcjYCACACLQAAIQAgAkEBaiIEIQIgAEH/AHEiA0E/ayIAQcAASQ0ACyAECyECQQAhBCACIQYgASEIIANB/QBxQSFGDQELIANBJGsOCgEDAwMDAwMDAwIDC0HsCEIBNwIADAQLQdgIIAFB2AgoAgAiACAAIAFIGyIAQYCAASAAQYCAAUgbNgIADAILQegIIAFB2AgoAgAiACAAIAFIGyIAQYCAASAAQYCAAUgbIgA2AgBB2AggADYCACAAQQRrEAAEQEHoCEEENgIAQdgIQQQ2AgBB0AhBATYCAA8LEAgMAQsCQCADQTtHDQBB7AgoAgAiAEEHSg0AQewIIABBAWo2AgAgAEECdEHwCGpBADYCAAsgAiEGIAQhAyABIQgMAQtBBCEIIAIhBiAEIQMLIAYgCUkNAAsLQeQIIAU2AgBB4AggAzYCAEHoCCAINgIAC9ELAgF+CH9B2AhCBDcDAEGojQJBoAgpAwAiADcDAEGgjQIgADcDAEGYjQIgADcDAEGQjQIgADcDAEGIjQIgADcDAEGAjQIgADcDAEH4jAIgADcDAEHwjAIgADcDAEHojAIgADcDAEHgjAIgADcDAEHYjAIgADcDAEHQjAIgADcDAEHIjAIgADcDAEHAjAIgADcDAEG4jAIgADcDAEGwjAIgADcDAEGojAIgADcDAEGgjAIgADcDAEGYjAIgADcDAEGQjAIgADcDAEGIjAIgADcDAEGAjAIgADcDAEH4iwIgADcDAEHwiwIgADcDAEHoiwIgADcDAEHgiwIgADcDAEHYiwIgADcDAEHQiwIgADcDAEHIiwIgADcDAEHAiwIgADcDAEG4iwIgADcDAEGwiwIgADcDAEGoiwIgADcDAEGgiwIgADcDAEGYiwIgADcDAEGQiwIgADcDAEGIiwIgADcDAEGAiwIgADcDAEH4igIgADcDAEHwigIgADcDAEHoigIgADcDAEHgigIgADcDAEHYigIgADcDAEHQigIgADcDAEHIigIgADcDAEHAigIgADcDAEG4igIgADcDAEGwigIgADcDAEGoigIgADcDAEGgigIgADcDAEGYigIgADcDAEGQigIgADcDAEGIigIgADcDAEGAigIgADcDAEH4iQIgADcDAEHwiQIgADcDAEHoiQIgADcDAEHgiQIgADcDAEHYiQIgADcDAEHQiQIgADcDAEHIiQIgADcDAEHAiQIgADcDAEG4iQIgADcDAEGwiQIgADcDAEGoCCgCACIEQf8AakGAAW0hCAJAIARBgQFIDQBBASEBIAhBAiAIQQJKG0EBayICQQFxIQMgBEGBAk4EQCACQX5xIQIDQCABQQl0IgdBEHJBoIkCakGwiQJBgAT8CgAAIAdBsI0CakGwiQJBgAT8CgAAIAFBAmohASACQQJrIgINAAsLIANFDQAgAUEJdEEQckGgiQJqQbCJAkGABPwKAAALAkAgBEEBSA0AIAhBASAIQQFKGyIDQQFxIQUCQCADQQFrIgdFBEBBACEBDAELIANB/v///wdxIQJBACEBA0AgAUEJdCIGQRByQbCJBmpBsIkCQYAE/AoAACAGQZAEckGwiQZqQbCJAkGABPwKAAAgAUECaiEBIAJBAmsiAg0ACwsgBQRAIAFBCXRBEHJBsIkGakGwiQJBgAT8CgAACyAEQQFIDQAgA0EBcSEFIAcEfyADQf7///8HcSECQQAhAQNAIAFBCXQiBkEQckHAiQpqQbCJAkGABPwKAAAgBkGQBHJBwIkKakGwiQJBgAT8CgAAIAFBAmohASACQQJrIgINAAsgAUEHdEEEcgVBBAshASAFBEAgAUECdEHAiQpqQbCJAkGABPwKAAALIARBAUgNACADQQFxIQUgBwR/IANB/v///wdxIQJBACEBA0AgAUEJdCIGQRByQdCJDmpBsIkCQYAE/AoAACAGQZAEckHQiQ5qQbCJAkGABPwKAAAgAUECaiEBIAJBAmsiAg0ACyABQQd0QQRyBUEECyEBIAUEQCABQQJ0QdCJDmpBsIkCQYAE/AoAAAsgBEEBSA0AIANBAXEhBSAHBH8gA0H+////B3EhAkEAIQEDQCABQQl0IgZBEHJB4IkSakGwiQJBgAT8CgAAIAZBkARyQeCJEmpBsIkCQYAE/AoAACABQQJqIQEgAkECayICDQALIAFBB3RBBHIFQQQLIQEgBQRAIAFBAnRB4IkSakGwiQJBgAT8CgAACyAEQQFIDQAgA0EBcSEEIAcEfyADQf7///8HcSECQQAhAQNAIAFBCXQiA0EQckHwiRZqQbCJAkGABPwKAAAgA0GQBHJB8IkWakGwiQJBgAT8CgAAIAFBAmohASACQQJrIgINAAsgAUEHdEEEcgVBBAshASAERQ0AIAFBAnRB8IkWakGwiQJBgAT8CgAAC0HUCCAIQQd0QQRyNgIAC58TAgh/AX5B5AgoAgAhA0HgCCgCACECQegIKAIAIQcgAUGQiQFqIglB/wE6AAAgACABSARAIABBkIkBaiEIA0AgAiEEIAhBAWohAQJAIAgtAABB/wBxIgJBMGtBCUsEQCABIQgMAQtB7AgoAgBBAnRB7AhqIgUoAgAhAANAIAUgAiAAQQpsakEwayIANgIAIAEtAAAhAiABQQFqIgghASACQf8AcSICQTBrQQpJDQALCwJAAkACQAJAAkACQAJ/AkAgAkE/ayIAQT9NBEAgBEUNASAEQSFGBEBB8AgoAgAiAUEBIAEbIgQgB2ohAQJAIABFDQAgB0H//wBLDQBBgIABIAdrIAQgAUH//wBLGyEFAkAgAEEBcUUNACAHQQJ0QaCJAmohAiAFIgRBB3EiBgRAA0AgAiADNgIAIAJBBGohAiAEQQFrIQQgBkEBayIGDQALCyAFQQFrQQdJDQADQCACIAM2AhwgAiADNgIYIAIgAzYCFCACIAM2AhAgAiADNgIMIAIgAzYCCCACIAM2AgQgAiADNgIAIAJBIGohAiAEQQhrIgQNAAsLAkAgAEECcUUNACAHQQJ0QbCJBmohAiAFIgRBB3EiBgRAA0AgAiADNgIAIAJBBGohAiAEQQFrIQQgBkEBayIGDQALCyAFQQFrQQdJDQADQCACIAM2AhwgAiADNgIYIAIgAzYCFCACIAM2AhAgAiADNgIMIAIgAzYCCCACIAM2AgQgAiADNgIAIAJBIGohAiAEQQhrIgQNAAsLAkAgAEEEcUUNACAHQQJ0QcCJCmohAiAFIgRBB3EiBgRAA0AgAiADNgIAIAJBBGohAiAEQQFrIQQgBkEBayIGDQALCyAFQQFrQQdJDQADQCACIAM2AhwgAiADNgIYIAIgAzYCFCACIAM2AhAgAiADNgIMIAIgAzYCCCACIAM2AgQgAiADNgIAIAJBIGohAiAEQQhrIgQNAAsLAkAgAEEIcUUNACAHQQJ0QdCJDmohAiAFIgRBB3EiBgRAA0AgAiADNgIAIAJBBGohAiAEQQFrIQQgBkEBayIGDQALCyAFQQFrQQdJDQADQCACIAM2AhwgAiADNgIYIAIgAzYCFCACIAM2AhAgAiADNgIMIAIgAzYCCCACIAM2AgQgAiADNgIAIAJBIGohAiAEQQhrIgQNAAsLAkAgAEEQcUUNACAHQQJ0QeCJEmohAiAFIgRBB3EiBgRAA0AgAiADNgIAIAJBBGohAiAEQQFrIQQgBkEBayIGDQALCyAFQQFrQQdJDQADQCACIAM2AhwgAiADNgIYIAIgAzYCFCACIAM2AhAgAiADNgIMIAIgAzYCCCACIAM2AgQgAiADNgIAIAJBIGohAiAEQQhrIgQNAAsLIABBIHFFDQAgBUEBayEEIAdBAnRB8IkWaiEAIAVBB3EiAgRAA0AgACADNgIAIABBBGohACAFQQFrIQUgAkEBayICDQALCyAEQQdJDQADQCAAIAM2AhwgACADNgIYIAAgAzYCFCAAIAM2AhAgACADNgIMIAAgAzYCCCAAIAM2AgQgACADNgIAIABBIGohACAFQQhrIgUNAAsLIAhBAWoiBSAILQAAQf8AcSICQT9rIgBBP00NAxoMBAsCQEHsCCgCACIFQQFGBEBB8AgoAgAiAUHMCCgCACIESQ0BIAEgBHAhAQwBC0H4CCgCACEEQfQIKAIAIQECQAJAIAVBBUcNACABQQFHDQAgBEHpAk4NBAwBCyAEQeQASg0DQfwIKAIAQeQASg0DQYAJKAIAQeQASg0DCwJAIAFFDQAgAUECSg0AIARB/AgoAgBBgAkoAgAgAUECdEGICGooAgARAgAhBEHwCCgCACIBQcwIKAIAIgVPBH8gASAFcAUgAQtBAnRBkAlqIAQ2AgALQfAIKAIAIgFBzAgoAgAiBEkNACABIARwIQELIAFBAnRBkAlqKAIAIQMMAQsgAkH9AHFBIUcEQCAHIQEgAiEADAQLIARBI0cNBAJAQewIKAIAIgRBAUYEQEHwCCgCACIBQcwIKAIAIgBJDQEgASAAcCEBDAELQfgIKAIAIQFB9AgoAgAhAAJAAkAgBEEFRw0AIABBAUcNACABQekCSA0BDAcLIAFB5ABKDQZB/AgoAgBB5ABKDQZBgAkoAgBB5ABKDQYLAkAgAEUNACAAQQJKDQAgAUH8CCgCAEGACSgCACAAQQJ0QYgIaigCABECACEAQfAIKAIAIgFBzAgoAgAiBE8EfyABIARwBSABC0ECdEGQCWogADYCAAtB8AgoAgAiAUHMCCgCACIASQ0AIAEgAHAhAQsgAUECdEGQCWooAgAhAwwECyAHIQEgCAshBQNAIAFB//8ATQRAIABBAXEgAWxBAnRBoIkCaiADNgIAIABBAXZBAXEgAWxBAnRBsIkGaiADNgIAIABBAnZBAXEgAWxBAnRBwIkKaiADNgIAIABBA3ZBAXEgAWxBAnRB0IkOaiADNgIAIABBBHZBAXEgAWxBAnRB4IkSaiADNgIAIABBBXYgAWxBAnRB8IkWaiADNgIACyABQQFqIQEgBS0AACEAIAVBAWoiBCEFIABB/wBxIgJBP2siAEHAAEkNAAsgBCEFC0EAIQQgBSEIIAEhByACIQAgAkH9AHFBIUYNAQtBBCEHIAQhAiAAQSRrDgoDAgICAgICAgIBAgtB7AhCATcCAAwCC0GoCCgCAEEEaxAABEBB0AhBATYCAA8LAkBBqAgoAgAiBkEFSA0AQaAIKQMAIQogBkEDa0EBdiIBQQdxIQJBACEAIAFBAWtBB08EQCABQfj///8HcSEFA0AgAEEDdCIBQbCJAmogCjcDACABQQhyQbCJAmogCjcDACABQRByQbCJAmogCjcDACABQRhyQbCJAmogCjcDACABQSByQbCJAmogCjcDACABQShyQbCJAmogCjcDACABQTByQbCJAmogCjcDACABQThyQbCJAmogCjcDACAAQQhqIQAgBUEIayIFDQALCyACRQ0AA0AgAEEDdEGwiQJqIAo3AwAgAEEBaiEAIAJBAWsiAg0ACwtBwIkGQbCJAiAGQQJ0IgD8CgAAQdCJCkGwiQIgAPwKAABB4IkOQbCJAiAA/AoAAEHwiRJBsIkCIAD8CgAAQYCKFkGwiQIgAPwKAAAgBCECDAELAkAgAEE7Rw0AQewIKAIAIgBBB0oNAEHsCCAAQQFqNgIAIABBAnRB8AhqQQA2AgALIAEhBwsgCCAJSQ0ACwtB5AggAzYCAEHgCCACNgIAQegIIAc2AgAL4gcCBX8BfgJAQdAIAn8CQAJAIAAgAU4NACABQZCJAWohBiAAQZCJAWohBQNAIAUtAAAiA0H/AHEhAgJAAkACQAJAAkACQAJAQeAIKAIAIgRBIkcEQCAEDQcgAkEiRgRAQewIQgE3AgBB4AhBIjYCAAwICyACQT9rQcAASQ0GIANBIWsiAkEMTQ0BDAULAkAgAkEwayIEQQlNBEBB7AgoAgBBAnRB7AhqIgIgBCACKAIAQQpsajYCAAwBC0HsCCgCACEEIAJBO0YEQCAEQQdKDQFB7AggBEEBajYCACAEQQJ0QfAIakEANgIADAELIARBBEYEQEHECEECNgIAQbAIQfAIKQMANwMAQbgIQfgIKAIAIgI2AgBBvAhB/AgoAgAiBDYCAEHICEECQQFBwAgoAgAiAxs2AgBBrAggBEEAIAMbNgIAQagIIAJBgIABIAJBgIABSBtBBGpBACADGzYCAEHgCEEANgIADAoLIAJBP2tBwABJDQQLIANBIWsiAkEMTQ0BDAILQQEgAnRBjSBxRQ0DDAQLQQEgAnRBjSBxDQELIANBoQFrIgJBDEsNA0EBIAJ0QY0gcUUNAwtBxAhCgYCAgBA3AgBBsAhB8AgoAgBBAEHsCCgCACICQQBKGzYCAEG0CEH0CCgCAEEAIAJBAUobNgIAQbgIQfgIKAIAQQAgAkECShs2AgBB4AhBADYCAEG8CEEANgIADAQLIANBoQFrIgJBDEsNAUEBIAJ0QY0gcUUNAQtBxAhCgYCAgBA3AgBBsAhCADcDAEG4CEIANwMADAMLIAVBAWoiBSAGSQ0ACwsCQEHICCgCAA4DAwEAAQsCQEGoCCgCACIFQQVIDQBBoAgpAwAhByAFQQNrQQF2IgNBB3EhBEEAIQIgA0EBa0EHTwRAIANB+P///wdxIQYDQCACQQN0IgNBsIkCaiAHNwMAIANBCHJBsIkCaiAHNwMAIANBEHJBsIkCaiAHNwMAIANBGHJBsIkCaiAHNwMAIANBIHJBsIkCaiAHNwMAIANBKHJBsIkCaiAHNwMAIANBMHJBsIkCaiAHNwMAIANBOHJBsIkCaiAHNwMAIAJBCGohAiAGQQhrIgYNAAsLIARFDQADQCACQQN0QbCJAmogBzcDACACQQFqIQIgBEEBayIEDQALC0HAiQZBsIkCIAVBAnQiA/wKAABB0IkKQbCJAiAD/AoAAEHgiQ5BsIkCIAP8CgAAQfCJEkGwiQIgA/wKAABBgIoWQbCJAiAD/AoAAEECDAELEAhByAgoAgALEAEiAjYCACACDQAgACABQcgIKAIAQQJ0QYAIaigCABEBAAsLdABB6AhBBDYCAEHkCCAANgIAQewIQgE3AgBBxAhCADcCAEHACCADNgIAQdwIQgA3AgBBqAhCADcDAEGwCEIANwMAQbgIQgA3AwBBzAggAkGAICACQYAgSRs2AgBBoAggAa1CgYCAgBB+NwMAQdAIQQA2AgALIwBB0AgoAgBFBEAgACABQcgIKAIAQQJ0QYAIaigCABEBAAsLWgECfwJAAkACQEHICCgCAEEBaw4CAAECC0HYCEHoCCgCACIAQdgIKAIAIgEgACABShsiAEGAgAEgAEGAgAFIGyIANgIAIABBBGsPC0GoCCgCAEEEayEACyAAC0IBAX8Cf0EGQdwIKAIAIgBBIHENABpBBSAAQRBxDQAaQQQgAEEIcQ0AGkEDIABBBHENABpBAiAAQQFxIABBAnEbCwu9BQEFfQJ/IAJFBEAgAUH/AWxBMmpB5ABtIgBBCHQgAHIgAEEQdHIMAQsgArJDAADIQpUhBiAAQfABarJDAAC0Q5UhBQJ9IAGyQwAAyEKVIgNDAAAAP10EQCADIAZDAACAP5KUDAELIAYgA0MAAIA/IAaTlJILIQcgAyADkiEGAkAgBUOrqqo+kiIEQwAAAABdBEAgBEMAAIA/kiEEDAELIARDAACAP15FDQAgBEMAAIC/kiEECyAGIAeTIQMgBUMAAAAAXSEAAn8CfSADIAcgA5NDAADAQJQgBJSSIARDq6oqPl0NABogByAEQwAAAD9dDQAaIAMgBEOrqio/XUUNABogAyAHIAOTIARDAADAwJRDAACAQJKUkgtDAAB/Q5RDAAAAP5IiBkMAAIBPXSAGQwAAAABgcQRAIAapDAELQQALIQECQCAABEAgBUMAAIA/kiEEDAELIAUiBEMAAIA/XkUNACAFQwAAgL+SIQQLIAVDq6qqvpIiBUMAAAAAXSECAn8CfSADIAcgA5NDAADAQJQgBJSSIARDq6oqPl0NABogByAEQwAAAD9dDQAaIAMgBEOrqio/XUUNABogAyAHIAOTIARDAADAwJRDAACAQJKUkgtDAAB/Q5RDAAAAP5IiBkMAAIBPXSAGQwAAAABgcQRAIAapDAELQQALIQACQCACBEAgBUMAAIA/kiEFDAELIAVDAACAP15FDQAgBUMAAIC/kiEFCwJAIAVDq6oqPl0EQCADIAcgA5NDAADAQJQgBZSSIQcMAQsgBUMAAAA/XQ0AIAVDq6oqP11FBEAgAyEHDAELIAMgByADkyAFQwAAwMCUQwAAgECSlJIhBwsgAEEIdAJ/IAdDAAB/Q5RDAAAAP5IiBkMAAIBPXSAGQwAAAABgcQRAIAapDAELQQALQRB0ciABcgtBgICAeHILNwAgAEH/AWxBMmpB5ABtIAFB/wFsQTJqQeQAbUEIdHIgAkH/AWxBMmpB5ABtQRB0ckGAgIB4cgsEACMACwYAIAAkAAsQACMAIABrQXBxIgAkACAACwsYAQBBgAgLEQEAAAACAAAAAwAAAAQAAAAF" };
});
var We2 = T((b2) => {
  "use strict";
  Object.defineProperty(b2, "__esModule", { value: true });
  b2.decodeAsync = b2.decode = b2.Decoder = b2.DecoderAsync = void 0;
  var U2 = z2(), Q2 = Ke2();
  function yt2(s4) {
    if (typeof Buffer < "u") return Buffer.from(s4, "base64");
    let e = atob(s4), t = new Uint8Array(e.length);
    for (let i = 0; i < t.length; ++i) t[i] = e.charCodeAt(i);
    return t;
  }
  var Ye2 = yt2(Q2.LIMITS.BYTES), O2, Ae = new Uint32Array(), ye2 = class {
    constructor() {
      this.bandHandler = (e) => 1, this.modeHandler = (e) => 1;
    }
    handle_band(e) {
      return this.bandHandler(e);
    }
    mode_parsed(e) {
      return this.modeHandler(e);
    }
  }, St3 = { memoryLimit: 2048 * 65536, sixelColor: U2.DEFAULT_FOREGROUND, fillColor: U2.DEFAULT_BACKGROUND, palette: U2.PALETTE_VT340_COLOR, paletteLimit: Q2.LIMITS.PALETTE_SIZE, truncate: true };
  function qe2(s4) {
    let e = new ye2(), t = { env: { handle_band: e.handle_band.bind(e), mode_parsed: e.mode_parsed.bind(e) } };
    return WebAssembly.instantiate(O2 || Ye2, t).then((i) => (O2 = O2 || i.module, new J2(s4, i.instance || i, e)));
  }
  b2.DecoderAsync = qe2;
  var J2 = class {
    constructor(e, t, i) {
      if (this._PIXEL_OFFSET = Q2.LIMITS.MAX_WIDTH + 4, this._canvas = Ae, this._bandWidths = [], this._maxWidth = 0, this._minWidth = Q2.LIMITS.MAX_WIDTH, this._lastOffset = 0, this._currentHeight = 0, this._opts = Object.assign({}, St3, e), this._opts.paletteLimit > Q2.LIMITS.PALETTE_SIZE) throw new Error(`DecoderOptions.paletteLimit must not exceed ${Q2.LIMITS.PALETTE_SIZE}`);
      if (t) i.bandHandler = this._handle_band.bind(this), i.modeHandler = this._initCanvas.bind(this);
      else {
        let A = O2 || (O2 = new WebAssembly.Module(Ye2));
        t = new WebAssembly.Instance(A, { env: { handle_band: this._handle_band.bind(this), mode_parsed: this._initCanvas.bind(this) } });
      }
      this._instance = t, this._wasm = this._instance.exports, this._chunk = new Uint8Array(this._wasm.memory.buffer, this._wasm.get_chunk_address(), Q2.LIMITS.CHUNK_SIZE), this._states = new Uint32Array(this._wasm.memory.buffer, this._wasm.get_state_address(), 12), this._palette = new Uint32Array(this._wasm.memory.buffer, this._wasm.get_palette_address(), Q2.LIMITS.PALETTE_SIZE), this._palette.set(this._opts.palette), this._pSrc = new Uint32Array(this._wasm.memory.buffer, this._wasm.get_p0_address()), this._wasm.init(U2.DEFAULT_FOREGROUND, 0, this._opts.paletteLimit, 0);
    }
    get _fillColor() {
      return this._states[0];
    }
    get _truncate() {
      return this._states[8];
    }
    get _rasterWidth() {
      return this._states[6];
    }
    get _rasterHeight() {
      return this._states[7];
    }
    get _width() {
      return this._states[2] ? this._states[2] - 4 : 0;
    }
    get _height() {
      return this._states[3];
    }
    get _level() {
      return this._states[9];
    }
    get _mode() {
      return this._states[10];
    }
    get _paletteLimit() {
      return this._states[11];
    }
    _initCanvas(e) {
      if (e === 2) {
        let t = this.width * this.height;
        if (t > this._canvas.length) {
          if (this._opts.memoryLimit && t * 4 > this._opts.memoryLimit) throw this.release(), new Error("image exceeds memory limit");
          this._canvas = new Uint32Array(t);
        }
        this._maxWidth = this._width;
      } else if (e === 1) if (this._level === 2) {
        let t = Math.min(this._rasterWidth, Q2.LIMITS.MAX_WIDTH) * this._rasterHeight;
        if (t > this._canvas.length) {
          if (this._opts.memoryLimit && t * 4 > this._opts.memoryLimit) throw this.release(), new Error("image exceeds memory limit");
          this._canvas = new Uint32Array(t);
        }
      } else this._canvas.length < 65536 && (this._canvas = new Uint32Array(65536));
      return 0;
    }
    _realloc(e, t) {
      let i = e + t;
      if (i > this._canvas.length) {
        if (this._opts.memoryLimit && i * 4 > this._opts.memoryLimit) throw this.release(), new Error("image exceeds memory limit");
        let A = new Uint32Array(Math.ceil(i / 65536) * 65536);
        A.set(this._canvas), this._canvas = A;
      }
    }
    _handle_band(e) {
      let t = this._PIXEL_OFFSET, i = this._lastOffset;
      if (this._mode === 2) {
        let A = this.height - this._currentHeight, r = 0;
        for (; r < 6 && A > 0; ) this._canvas.set(this._pSrc.subarray(t * r, t * r + e), i + e * r), r++, A--;
        this._lastOffset += e * r, this._currentHeight += r;
      } else if (this._mode === 1) {
        this._realloc(i, e * 6), this._maxWidth = Math.max(this._maxWidth, e), this._minWidth = Math.min(this._minWidth, e);
        for (let A = 0; A < 6; ++A) this._canvas.set(this._pSrc.subarray(t * A, t * A + e), i + e * A);
        this._bandWidths.push(e), this._lastOffset += e * 6, this._currentHeight += 6;
      }
      return 0;
    }
    get width() {
      return this._mode !== 1 ? this._width : Math.max(this._maxWidth, this._wasm.current_width());
    }
    get height() {
      return this._mode !== 1 ? this._height : this._wasm.current_width() ? this._bandWidths.length * 6 + this._wasm.current_height() : this._bandWidths.length * 6;
    }
    get palette() {
      return this._palette.subarray(0, this._paletteLimit);
    }
    get memoryUsage() {
      return this._canvas.byteLength + this._wasm.memory.buffer.byteLength + 8 * this._bandWidths.length;
    }
    get properties() {
      return { width: this.width, height: this.height, mode: this._mode, level: this._level, truncate: !!this._truncate, paletteLimit: this._paletteLimit, fillColor: this._fillColor, memUsage: this.memoryUsage, rasterAttributes: { numerator: this._states[4], denominator: this._states[5], width: this._rasterWidth, height: this._rasterHeight } };
    }
    init(e = this._opts.fillColor, t = this._opts.palette, i = this._opts.paletteLimit, A = this._opts.truncate) {
      this._wasm.init(this._opts.sixelColor, e, i, A ? 1 : 0), t && this._palette.set(t.subarray(0, Q2.LIMITS.PALETTE_SIZE)), this._bandWidths.length = 0, this._maxWidth = 0, this._minWidth = Q2.LIMITS.MAX_WIDTH, this._lastOffset = 0, this._currentHeight = 0;
    }
    decode(e, t = 0, i = e.length) {
      let A = t;
      for (; A < i; ) {
        let r = Math.min(i - A, Q2.LIMITS.CHUNK_SIZE);
        this._chunk.set(e.subarray(A, A += r)), this._wasm.decode(0, r);
      }
    }
    decodeString(e, t = 0, i = e.length) {
      let A = t;
      for (; A < i; ) {
        let r = Math.min(i - A, Q2.LIMITS.CHUNK_SIZE);
        for (let a = 0, n10 = A; a < r; ++a, ++n10) this._chunk[a] = e.charCodeAt(n10);
        A += r, this._wasm.decode(0, r);
      }
    }
    get data32() {
      if (this._mode === 0 || !this.width || !this.height) return Ae;
      let e = this._wasm.current_width();
      if (this._mode === 2) {
        let t = this.height - this._currentHeight;
        if (t > 0) {
          let i = this._PIXEL_OFFSET, A = this._lastOffset, r = 0;
          for (; r < 6 && t > 0; ) this._canvas.set(this._pSrc.subarray(i * r, i * r + e), A + e * r), r++, t--;
          t && this._canvas.fill(this._fillColor, A + e * r);
        }
        return this._canvas.subarray(0, this.width * this.height);
      }
      if (this._mode === 1) {
        if (this._minWidth === this._maxWidth) {
          let r = false;
          if (e) if (e !== this._minWidth) r = true;
          else {
            let a = this._PIXEL_OFFSET, n10 = this._lastOffset;
            this._realloc(n10, e * 6);
            for (let o3 = 0; o3 < 6; ++o3) this._canvas.set(this._pSrc.subarray(a * o3, a * o3 + e), n10 + e * o3);
          }
          if (!r) return this._canvas.subarray(0, this.width * this.height);
        }
        let t = new Uint32Array(this.width * this.height);
        t.fill(this._fillColor);
        let i = 0, A = 0;
        for (let r = 0; r < this._bandWidths.length; ++r) {
          let a = this._bandWidths[r];
          for (let n10 = 0; n10 < 6; ++n10) t.set(this._canvas.subarray(A, A += a), i), i += this.width;
        }
        if (e) {
          let r = this._PIXEL_OFFSET, a = this._wasm.current_height();
          for (let n10 = 0; n10 < a; ++n10) t.set(this._pSrc.subarray(r * n10, r * n10 + e), i + this.width * n10);
        }
        return t;
      }
      return Ae;
    }
    get data8() {
      return new Uint8ClampedArray(this.data32.buffer, 0, this.width * this.height * 4);
    }
    release() {
      this._canvas = Ae, this._bandWidths.length = 0, this._maxWidth = 0, this._minWidth = Q2.LIMITS.MAX_WIDTH, this._wasm.init(U2.DEFAULT_FOREGROUND, 0, this._opts.paletteLimit, 0);
    }
  };
  b2.Decoder = J2;
  function Lt2(s4, e) {
    let t = new J2(e);
    return t.init(), typeof s4 == "string" ? t.decodeString(s4) : t.decode(s4), { width: t.width, height: t.height, data32: t.data32, data8: t.data8 };
  }
  b2.decode = Lt2;
  async function Tt2(s4, e) {
    let t = await qe2(e);
    return t.init(), typeof s4 == "string" ? t.decodeString(s4) : t.decode(s4), { width: t.width, height: t.height, data32: t.data32, data8: t.data8 };
  }
  b2.decodeAsync = Tt2;
});
function N(s4) {
  return { dispose: s4 };
}
var k2 = class {
  constructor() {
    this._disposables = /* @__PURE__ */ new Set();
    this._isDisposed = false;
  }
  get isDisposed() {
    return this._isDisposed;
  }
  add(e) {
    return this._isDisposed ? e.dispose() : this._disposables.add(e), e;
  }
  dispose() {
    if (!this._isDisposed) {
      this._isDisposed = true;
      for (let e of this._disposables) e.dispose();
      this._disposables.clear();
    }
  }
  clear() {
    for (let e of this._disposables) e.dispose();
    this._disposables.clear();
  }
};
var R2 = class {
  constructor() {
    this._store = new k2();
  }
  dispose() {
    this._store.dispose();
  }
  _register(e) {
    return this._store.add(e);
  }
};
R2.None = Object.freeze({ dispose() {
} });
var q2 = class {
  constructor() {
    this._isDisposed = false;
  }
  get value() {
    return this._isDisposed ? void 0 : this._value;
  }
  set value(e) {
    this._isDisposed || e === this._value || (this._value?.dispose(), this._value = e);
  }
  clear() {
    this.value = void 0;
  }
  dispose() {
    this._isDisposed = true, this._value?.dispose(), this._value = void 0;
  }
};
var W2 = class {
  constructor() {
    this._listeners = [];
    this._disposed = false;
  }
  get event() {
    return this._event ? this._event : (this._event = (e, t, i) => {
      if (this._disposed) return N(() => {
      });
      let A = { fn: e, thisArgs: t };
      this._listeners.push(A);
      let r = N(() => {
        let a = this._listeners.indexOf(A);
        a !== -1 && this._listeners.splice(a, 1);
      });
      return i && (Array.isArray(i) ? i.push(r) : i.add(r)), r;
    }, this._event);
  }
  fire(e) {
    if (!this._disposed) switch (this._listeners.length) {
      case 0:
        return;
      case 1: {
        let { fn: t, thisArgs: i } = this._listeners[0];
        t.call(i, e);
        return;
      }
      default: {
        let t = this._listeners.slice();
        for (let { fn: i, thisArgs: A } of t) i.call(A, e);
      }
    }
  }
  dispose() {
    this._disposed || (this._disposed = true, this._listeners.length = 0);
  }
};
var ot2;
((A) => {
  function s4(r, a) {
    return r((n10) => a.fire(n10));
  }
  A.forward = s4;
  function e(r, a) {
    return (n10, o3, d) => r((h) => n10.call(o3, a(h)), void 0, d);
  }
  A.map = e;
  function t(...r) {
    return (a, n10, o3) => {
      let d = new k2();
      for (let h of r) d.add(h((g2) => a.call(n10, g2)));
      return o3 && (Array.isArray(o3) ? o3.push(d) : o3.add(d)), d;
    };
  }
  A.any = t;
  function i(r, a, n10) {
    return a(n10), r((o3) => a(o3));
  }
  A.runAndSubscribe = i;
})(ot2 ||= {});
var ge2 = x(z2());
var D2 = class s2 extends R2 {
  constructor(t) {
    super();
    this._terminal = t;
    this._layers = /* @__PURE__ */ new Map();
    this._optionsRefresh = this._register(new q2());
    this._oldOpen = this._terminal._core.open, this._terminal._core.open = (i) => {
      this._oldOpen?.call(this._terminal._core, i), this._open();
    }, this._terminal._core.screenElement && this._open(), this._optionsRefresh.value = this._terminal._core.optionsService.onOptionChange((i) => {
      i === "fontSize" && (this.rescaleCanvas(), this._renderService?.refreshRows(0, this._terminal.rows));
    }), this._register(N(() => {
      this.removeLayerFromDom(), this.removeLayerFromDom("bottom"), this._terminal._core && this._oldOpen && (this._terminal._core.open = this._oldOpen, this._oldOpen = void 0), this._renderService && this._oldSetRenderer && (this._renderService.setRenderer = this._oldSetRenderer, this._oldSetRenderer = void 0), this._renderService = void 0, this._layers.clear(), this._placeholderBitmap?.close(), this._placeholderBitmap = void 0, this._placeholder = void 0;
    }));
  }
  get canvas() {
    return this._layers.get("top")?.canvas;
  }
  static createCanvas(t, i, A) {
    let r = (t ?? document).createElement("canvas");
    return r.width = i | 0, r.height = A | 0, r;
  }
  static createImageData(t, i, A, r) {
    if (typeof ImageData != "function") {
      let a = t.createImageData(i, A);
      return r && a.data.set(new Uint8ClampedArray(r, 0, i * A * 4)), a;
    }
    return r ? new ImageData(new Uint8ClampedArray(r, 0, i * A * 4), i, A) : new ImageData(i, A);
  }
  static createImageBitmap(t) {
    return typeof createImageBitmap != "function" ? Promise.resolve(void 0) : createImageBitmap(t);
  }
  showPlaceholder(t) {
    t ? !this._placeholder && this.cellSize.height !== -1 && this._createPlaceHolder(Math.max(this.cellSize.height + 1, 24)) : (this._placeholderBitmap?.close(), this._placeholderBitmap = void 0, this._placeholder = void 0), this._renderService?.refreshRows(0, this._terminal.rows);
  }
  get dimensions() {
    return this._terminal.dimensions;
  }
  get cellSize() {
    return { width: this.dimensions?.css.cell.width || -1, height: this.dimensions?.css.cell.height || -1 };
  }
  clearLines(t, i, A) {
    let r = t * (this.dimensions?.css.cell.height || 0), a = this.dimensions?.css.canvas.width || 0, n10 = (i + 1 - t) * (this.dimensions?.css.cell.height || 0);
    (!A || A === "top") && this._layers.get("top")?.clearRect(0, r, a, n10), (!A || A === "bottom") && this._layers.get("bottom")?.clearRect(0, r, a, n10);
  }
  clearAll(t) {
    if (!t || t === "top") {
      let i = this._layers.get("top");
      i?.clearRect(0, 0, i.canvas.width, i.canvas.height);
    }
    if (!t || t === "bottom") {
      let i = this._layers.get("bottom");
      i?.clearRect(0, 0, i.canvas.width, i.canvas.height);
    }
  }
  draw(t, i, A, r, a = 1) {
    let n10 = this._layers.get(t.layer);
    if (!n10) return;
    let { width: o3, height: d } = this.cellSize;
    if (o3 === -1 || d === -1) return;
    this._rescaleImage(t, o3, d);
    let h = t.actual, g2 = Math.ceil(h.width / o3), I = i % g2 * o3, _ = Math.floor(i / g2) * d, l3 = A * o3, C2 = r * d, u = a * o3 + I > h.width ? h.width - I : a * o3, E2 = _ + d > h.height ? h.height - _ : d;
    n10.drawImage(h, Math.floor(I), Math.floor(_), Math.ceil(u), Math.ceil(E2), Math.floor(l3), Math.floor(C2), Math.ceil(u), Math.ceil(E2));
  }
  extractTile(t, i) {
    let { width: A, height: r } = this.cellSize;
    if (A === -1 || r === -1) return;
    this._rescaleImage(t, A, r);
    let a = t.actual, n10 = Math.ceil(a.width / A), o3 = i % n10 * A, d = Math.floor(i / n10) * r, h = A + o3 > a.width ? a.width - o3 : A, g2 = d + r > a.height ? a.height - d : r, I = s2.createCanvas(this.document, h, g2), _ = I.getContext("2d");
    if (_) return _.drawImage(a, Math.floor(o3), Math.floor(d), Math.floor(h), Math.floor(g2), 0, 0, Math.floor(h), Math.floor(g2)), I;
  }
  drawPlaceholder(t, i, A = 1) {
    let r = this._layers.get("top");
    if (r) {
      let { width: a, height: n10 } = this.cellSize;
      if (a === -1 || n10 === -1 || (this._placeholder ? n10 >= this._placeholder.height && this._createPlaceHolder(n10 + 1) : this._createPlaceHolder(Math.max(n10 + 1, 24)), !this._placeholder)) return;
      r.drawImage(this._placeholderBitmap ?? this._placeholder, t * a, i * n10 % 2 ? 0 : 1, a * A, n10, t * a, i * n10, a * A, n10);
    }
  }
  rescaleCanvas() {
    let t = this.dimensions?.css.canvas.width || 0, i = this.dimensions?.css.canvas.height || 0;
    for (let A of this._layers.values()) (A.canvas.width !== t || A.canvas.height !== i) && (A.canvas.width = t, A.canvas.height = i);
  }
  _rescaleImage(t, i, A) {
    if (i === t.actualCellSize.width && A === t.actualCellSize.height) return;
    let { width: r, height: a } = t.origCellSize;
    if (i === r && A === a) {
      t.actual = t.orig, t.actualCellSize.width = r, t.actualCellSize.height = a;
      return;
    }
    let n10 = s2.createCanvas(this.document, Math.ceil(t.orig.width * i / r), Math.ceil(t.orig.height * A / a)), o3 = n10.getContext("2d");
    o3 && (o3.drawImage(t.orig, 0, 0, n10.width, n10.height), t.actual = n10, t.actualCellSize.width = i, t.actualCellSize.height = A);
  }
  _open() {
    this._renderService = this._terminal._core._renderService, this._oldSetRenderer = this._renderService.setRenderer.bind(this._renderService), this._renderService.setRenderer = (t) => {
      for (let i of [...this._layers.keys()]) this.removeLayerFromDom(i);
      this._oldSetRenderer?.call(this._renderService, t);
    };
  }
  insertLayerToDom(t = "top") {
    if (!this.document || !this._terminal._core.screenElement) {
      console.warn("image addon: cannot insert output canvas to DOM, missing document or screenElement");
      return;
    }
    if (this._layers.has(t)) return;
    let i = s2.createCanvas(this.document, this.dimensions?.css.canvas.width || 0, this.dimensions?.css.canvas.height || 0);
    i.classList.add(`xterm-image-layer-${t}`);
    let A = this._terminal._core.screenElement;
    A.style.isolation = "isolate", t === "bottom" ? (i.style.zIndex = "-1", A.insertBefore(i, A.firstChild)) : (i.style.zIndex = "0", A.appendChild(i));
    let r = i.getContext("2d", { alpha: true });
    if (!r) {
      i.remove();
      return;
    }
    this._layers.set(t, r), this.clearAll(t);
  }
  removeLayerFromDom(t = "top") {
    let i = this._layers.get(t);
    i && (i.canvas.remove(), this._layers.delete(t));
  }
  hasLayer(t) {
    return this._layers.has(t);
  }
  _createPlaceHolder(t = 24) {
    this._placeholderBitmap?.close(), this._placeholderBitmap = void 0;
    let i = 32, A = s2.createCanvas(this.document, i, t), r = A.getContext("2d", { alpha: false });
    if (!r) return;
    let a = s2.createImageData(r, i, t), n10 = new Uint32Array(a.data.buffer), o3 = (0, ge2.toRGBA8888)(0, 0, 0), d = (0, ge2.toRGBA8888)(255, 255, 255);
    n10.fill(o3);
    for (let I = 0; I < t; ++I) {
      let _ = I % 2, l3 = I * i;
      for (let C2 = 0; C2 < i; C2 += 2) n10[l3 + C2 + _] = d;
    }
    r.putImageData(a, 0, 0);
    let h = screen.width + i - 1 & ~(i - 1) || 4096;
    this._placeholder = s2.createCanvas(this.document, h, t);
    let g2 = this._placeholder.getContext("2d", { alpha: false });
    if (!g2) {
      this._placeholder = void 0;
      return;
    }
    for (let I = 0; I < h; I += i) g2.drawImage(A, I, 0);
    s2.createImageBitmap(this._placeholder).then((I) => this._placeholderBitmap = I);
  }
  get document() {
    return this._terminal._core._coreBrowserService?.window.document;
  }
};
var w = { width: 7, height: 14 };
var H2 = class s3 {
  constructor(e = 0, t = 0, i = -1, A = -1) {
    this.imageId = i;
    this.tileId = A;
    this._ext = 0;
    this._urlId = 0;
    this._ext = e, this._urlId = t;
  }
  get ext() {
    return this._urlId ? this._ext & -469762049 | this.underlineStyle << 26 : this._ext;
  }
  set ext(e) {
    this._ext = e;
  }
  get underlineStyle() {
    return this._urlId ? 5 : (this._ext & 469762048) >> 26;
  }
  set underlineStyle(e) {
    this._ext &= -469762049, this._ext |= e << 26 & 469762048;
  }
  get underlineColor() {
    return this._ext & 67108863;
  }
  set underlineColor(e) {
    this._ext &= -67108864, this._ext |= e & 67108863;
  }
  get underlineVariantOffset() {
    let e = (this._ext & 3758096384) >> 29;
    return e < 0 ? e ^ 4294967288 : e;
  }
  set underlineVariantOffset(e) {
    this._ext &= 536870911, this._ext |= e << 29 & 3758096384;
  }
  get urlId() {
    return this._urlId;
  }
  set urlId(e) {
    this._urlId = e;
  }
  clone() {
    return new s3(this._ext, this._urlId, this.imageId, this.tileId);
  }
  isEmpty() {
    return this.underlineStyle === 0 && this._urlId === 0 && this.imageId === -1;
  }
};
var X2 = new H2();
var Z2 = class {
  constructor(e, t, i) {
    this._terminal = e;
    this._renderer = t;
    this._opts = i;
    this._images = /* @__PURE__ */ new Map();
    this._lastId = 0;
    this._lowestId = 0;
    this._fullyCleared = false;
    this._needsFullClear = false;
    this._pixelLimit = 25e5;
    try {
      this.setLimit(this._opts.storageLimit);
    } catch (A) {
      A instanceof Error && console.error(A.message), console.warn(`storageLimit is set to ${this.getLimit()} MB`);
    }
    this._viewportMetrics = { cols: this._terminal.cols, rows: this._terminal.rows };
  }
  dispose() {
    this.reset();
  }
  reset() {
    for (let e of this._images.values()) e.marker?.dispose();
    this._images.clear(), this._renderer.clearAll();
  }
  getLimit() {
    return this._pixelLimit * 4 / 1e6;
  }
  setLimit(e) {
    if (e < 0.5 || e > 1e3) throw RangeError("invalid storageLimit, should be at least 0.5 MB and not exceed 1G");
    this._pixelLimit = e / 4 * 1e6 >>> 0, this._evictOldest(0);
  }
  getUsage() {
    return this._getStoredPixels() * 4 / 1e6;
  }
  _getStoredPixels() {
    let e = 0;
    for (let t of this._images.values()) t.orig && (e += t.orig.width * t.orig.height, t.actual && t.actual !== t.orig && (e += t.actual.width * t.actual.height));
    return e;
  }
  _delImg(e) {
    let t = this._images.get(e);
    t && (this._images.delete(e), window.ImageBitmap && t.orig instanceof ImageBitmap && t.orig.close(), this.onImageDeleted?.(e));
  }
  wipeAlternate() {
    let e = [];
    for (let [t, i] of this._images.entries()) i.bufferType === "alternate" && (i.marker?.dispose(), e.push(t));
    for (let t of e) this._delImg(t);
    this._needsFullClear = true, this._fullyCleared = false;
  }
  deleteImage(e) {
    let t = this._images.get(e);
    t && (t.marker?.dispose(), this._delImg(e));
  }
  addImage(e, t) {
    this._evictOldest(e.width * e.height);
    let i = this._renderer.cellSize;
    (i.width === -1 || i.height === -1) && (i = w);
    let A = Math.ceil(e.width / i.width), r = Math.ceil(e.height / i.height), a = ++this._lastId, n10 = this._terminal._core.buffer, o3 = this._terminal.cols, d = this._terminal.rows, h = n10.x, g2 = n10.y, I = h, _ = 0;
    t.scrolling || (n10.x = 0, n10.y = 0, I = 0), this._terminal._core._inputHandler._dirtyRowTracker.markDirty(n10.y);
    for (let E2 = 0; E2 < r; ++E2) {
      let p = n10.lines.get(n10.y + n10.ybase);
      for (let f2 = 0; f2 < A && !(I + f2 >= o3); ++f2) this._writeToCell(p, I + f2, a, E2 * A + f2), _++;
      if (t.scrolling) E2 < r - 1 && this._terminal._core._inputHandler.lineFeed();
      else if (++n10.y >= d) break;
      n10.x = I;
    }
    this._terminal._core._inputHandler._dirtyRowTracker.markDirty(n10.y), t.scrolling ? t.cursorPos === "iip" ? n10.x = Math.min(I + A, o3) : n10.x = I : (n10.x = h, n10.y = g2);
    let l3 = [];
    for (let [E2, p] of this._images.entries()) p.tileCount < 1 && (p.marker?.dispose(), l3.push(E2));
    for (let E2 of l3) this._delImg(E2);
    let C2 = this._terminal.registerMarker(0);
    C2?.onDispose(() => {
      this._images.get(a) && this._delImg(a);
    }), this._terminal.buffer.active.type === "alternate" && this._evictOnAlternate();
    let u = { orig: e, origCellSize: i, actual: e, actualCellSize: { ...i }, marker: C2 || void 0, tileCount: _, bufferType: this._terminal.buffer.active.type, layer: t.layer, zIndex: t.zIndex };
    return this._images.set(a, u), this.onImageAdded?.(), a;
  }
  render(e) {
    let t = false, i = false;
    for (let h of this._images.values()) if (h.layer === "bottom" ? i = true : t = true, t && i) break;
    if (t && !this._renderer.hasLayer("top") && (this._renderer.insertLayerToDom("top"), !this._renderer.hasLayer("top"))) return;
    if (i && !this._renderer.hasLayer("bottom") && this._renderer.insertLayerToDom("bottom"), this._renderer.rescaleCanvas(), !this._images.size) {
      this._fullyCleared || (this._renderer.clearAll(), this._fullyCleared = true, this._needsFullClear = false), this._renderer.hasLayer("top") && this._renderer.removeLayerFromDom("top"), this._renderer.hasLayer("bottom") && this._renderer.removeLayerFromDom("bottom");
      return;
    }
    !t && this._renderer.hasLayer("top") && (this._renderer.clearAll("top"), this._renderer.removeLayerFromDom("top")), !i && this._renderer.hasLayer("bottom") && (this._renderer.clearAll("bottom"), this._renderer.removeLayerFromDom("bottom")), this._needsFullClear && (this._renderer.clearAll(), this._fullyCleared = true, this._needsFullClear = false);
    let { start: A, end: r } = e, a = this._terminal._core.buffer, n10 = this._terminal._core.cols;
    this._renderer.clearLines(A, r);
    let o3 = [], d = [];
    for (let h = A; h <= r; ++h) {
      let g2 = a.lines.get(h + a.ydisp);
      if (!g2) return;
      for (let I = 0; I < n10; ++I) {
        let _;
        if (g2.getBg(I) & 268435456) _ = g2._extendedAttrs[I] ?? X2;
        else {
          let u = g2._extendedAttrs[I];
          if (!u || u.imageId === void 0 || u.imageId === -1) continue;
          _ = u;
        }
        let l3 = _.imageId;
        if (l3 === void 0 || l3 === -1) continue;
        let C2 = this._images.get(l3);
        if (_.tileId !== -1) {
          let u = _.tileId, E2 = I, p = 1;
          for (; ++I < n10; ) {
            let f2 = g2._extendedAttrs[I];
            if (!f2 || f2.imageId !== l3 || f2.tileId !== u + p) break;
            p++;
          }
          I--, C2 ? C2.actual && o3.push({ imgSpec: C2, tileId: u, col: E2, row: h, count: p }) : this._opts.showPlaceholder && d.push({ col: E2, row: h, count: p }), this._fullyCleared = false;
        }
      }
    }
    o3.sort((h, g2) => h.imgSpec.zIndex - g2.imgSpec.zIndex);
    for (let h of d) this._renderer.drawPlaceholder(h.col, h.row, h.count);
    for (let h of o3) this._renderer.draw(h.imgSpec, h.tileId, h.col, h.row, h.count);
  }
  viewportResize(e) {
    if (!this._images.size) {
      this._viewportMetrics = e;
      return;
    }
    if (this._viewportMetrics.cols >= e.cols) {
      this._viewportMetrics = e;
      return;
    }
    let t = this._terminal._core.buffer, i = t.lines.length, A = this._viewportMetrics.cols - 1;
    for (let r = 0; r < i; ++r) {
      let a = t.lines.get(r);
      if (a.getBg(A) & 268435456) {
        let n10 = a._extendedAttrs[A] ?? X2, o3 = n10.imageId;
        if (o3 === void 0 || o3 === -1) continue;
        let d = this._images.get(o3);
        if (!d) continue;
        let h = Math.ceil((d.actual?.width || 0) / d.actualCellSize.width);
        if (n10.tileId % h + 1 >= h) continue;
        let g2 = false;
        for (let l3 = A + 1; l3 > e.cols; ++l3) if (a._data[l3 * 3 + 0] & 4194303) {
          g2 = true;
          break;
        }
        if (g2) continue;
        let I = Math.min(e.cols, h - n10.tileId % h + A), _ = n10.tileId;
        for (let l3 = A + 1; l3 < I; ++l3) this._writeToCell(a, l3, o3, ++_), d.tileCount++;
      }
    }
    this._viewportMetrics = e;
  }
  getImageAtBufferCell(e, t) {
    let A = this._terminal._core.buffer.lines.get(t);
    if (A && A.getBg(e) & 268435456) {
      let r = A._extendedAttrs[e] ?? X2;
      if (r.imageId && r.imageId !== -1) {
        let a = this._images.get(r.imageId)?.orig;
        if (window.ImageBitmap && a instanceof ImageBitmap) {
          let n10 = D2.createCanvas(window.document, a.width, a.height);
          return n10.getContext("2d")?.drawImage(a, 0, 0, a.width, a.height), n10;
        }
        return a;
      }
    }
  }
  extractTileAtBufferCell(e, t) {
    let A = this._terminal._core.buffer.lines.get(t);
    if (A && A.getBg(e) & 268435456) {
      let r = A._extendedAttrs[e] ?? X2;
      if (r.imageId && r.imageId !== -1 && r.tileId !== -1) {
        let a = this._images.get(r.imageId);
        if (a) return this._renderer.extractTile(a, r.tileId);
      }
    }
  }
  _evictOldest(e) {
    let t = this._getStoredPixels(), i = t;
    for (; this._pixelLimit < i + e && this._images.size; ) {
      let A = this._images.get(++this._lowestId);
      A && A.orig && (i -= A.orig.width * A.orig.height, A.actual && A.orig !== A.actual && (i -= A.actual.width * A.actual.height), A.marker?.dispose(), this._delImg(this._lowestId));
    }
    return t - i;
  }
  _writeToCell(e, t, i, A) {
    if (e._data[t * 3 + 2] & 268435456) {
      let r = e._extendedAttrs[t];
      if (r) {
        if (r.imageId !== void 0) {
          let a = this._images.get(r.imageId);
          a && a.tileCount--, r.imageId = i, r.tileId = A;
          return;
        }
        e._extendedAttrs[t] = new H2(r.ext, r.urlId, i, A);
        return;
      }
    }
    e._data[t * 3 + 2] |= 268435456, e._extendedAttrs[t] = new H2(0, 0, i, A);
  }
  _evictOnAlternate() {
    for (let i of this._images.values()) i.bufferType === "alternate" && (i.tileCount = 0);
    let e = this._terminal._core.buffer;
    for (let i = 0; i < this._terminal.rows; ++i) {
      let A = e.lines.get(i);
      if (A) {
        for (let r = 0; r < this._terminal.cols; ++r) if (A._data[r * 3 + 2] & 268435456) {
          let a = A._extendedAttrs[r]?.imageId;
          if (a) {
            let n10 = this._images.get(a);
            n10 && n10.tileCount++;
          }
        }
      }
    }
    let t = [];
    for (let [i, A] of this._images.entries()) A.bufferType === "alternate" && !A.tileCount && (A.marker?.dispose(), t.push(i));
    for (let i of t) this._delImg(i);
  }
};
var Ue2 = x(Ee2());
var Oe2 = x(Re2());
function j2(s4) {
  let e = "";
  for (let t = 0; t < s4.length; ++t) e += String.fromCharCode(s4[t]);
  return e;
}
function pe2(s4) {
  let e = 0;
  for (let t = 0; t < s4.length; ++t) {
    if (s4[t] < 48 || s4[t] > 57) throw new Error("illegal char");
    e = e * 10 + s4[t] - 48;
  }
  return e;
}
function ke2(s4) {
  let e = j2(s4);
  if (!e.match(/^((auto)|(\d+?((px)|(%)){0,1}))$/)) throw new Error("illegal size");
  return e;
}
function wt2(s4) {
  if (typeof Buffer < "u") return Buffer.from(j2(s4), "base64").toString();
  let e = atob(j2(s4)), t = new Uint8Array(e.length);
  for (let i = 0; i < t.length; ++i) t[i] = e.charCodeAt(i);
  return new TextDecoder().decode(t);
}
var Ne2 = { inline: pe2, size: pe2, name: wt2, width: ke2, height: ke2, preserveAspectRatio: pe2 };
var He2 = [70, 105, 108, 101];
var Fe2 = [77, 117, 108, 116, 105, 112, 97, 114, 116, 70, 105, 108, 101];
var Be2 = [70, 105, 108, 101, 80, 97, 114, 116];
var fe2 = [70, 105, 108, 101, 69, 110, 100];
var Qe2 = [82, 101, 112, 111, 114, 116, 67, 101, 108, 108, 83, 105, 122, 101];
var De2 = 1024;
var V2 = class {
  constructor() {
    this.state = 0;
    this._buffer = new Uint32Array(De2);
    this._position = 0;
    this._key = "";
    this.fields = {};
  }
  reset() {
    this._buffer.fill(0), this.state = 0, this._position = 0, this.fields = {}, this._key = "";
  }
  end() {
    if (this.state === 0) {
      if (this._position === fe2.length) {
        for (let e = 0; e < fe2.length; ++e) if (this._buffer[e] !== fe2[e]) return this._a();
        return this.fields.type = 4, this.state = 4, 0;
      }
      if (this._position === Qe2.length) {
        for (let e = 0; e < Qe2.length; ++e) if (this._buffer[e] !== Qe2[e]) return this._a();
        return this.fields.type = 5, this.state = 4, 0;
      }
      return this._a();
    }
    return this.state === 4 ? 0 : this.state === 3 && this.fields.type === 2 ? this._storeValue(this._position) ? (this.state = 4, 0) : this._a() : this._a();
  }
  parse(e, t, i) {
    let A = this.state, r = this._position, a = this._buffer;
    if (A === 1 || A === 4 || A === 0 && r > 14) return -1;
    for (let n10 = t; n10 < i; ++n10) {
      let o3 = e[n10];
      switch (o3) {
        case 59:
          if (!this._storeValue(r)) return this._a();
          A = 2, r = 0;
          break;
        case 61:
          if (A === 0) {
            if (a[0] === 70) {
              let d = 0;
              for (; d < He2.length; ++d) if (a[d] !== He2[d]) return this._a();
              if (this.fields.type = 1, r === Be2.length) {
                for (; d < Be2.length; ++d) if (a[d] !== Be2[d]) return this._a();
                return this.fields.type = 3, this.state = 4, n10 + 1;
              }
            } else if (a[0] === 77) {
              for (let d = 0; d < Fe2.length; ++d) if (a[d] !== Fe2[d]) return this._a();
              this.fields.type = 2;
            } else return this._a();
            A = 2, r = 0;
          } else if (A === 2) {
            if (!this._storeKey(r)) return this._a();
            A = 3, r = 0;
          } else if (A === 3) {
            if (r >= De2) return this._a();
            a[r++] = o3;
          }
          break;
        case 58:
          return A === 3 && !this._storeValue(r) ? this._a() : (this.state = 4, n10 + 1);
        default:
          if (r >= De2) return this._a();
          a[r++] = o3;
      }
    }
    return this.state = A, this._position = r, -2;
  }
  _a() {
    return this.fields.type = 0, this.state = 1, -1;
  }
  _storeKey(e) {
    let t = j2(this._buffer.subarray(0, e));
    return t ? (this._key = t, this.fields[t] = null, true) : false;
  }
  _storeValue(e) {
    if (this._key) {
      try {
        let t = this._buffer.slice(0, e);
        this.fields[this._key] = Ne2[this._key] ? Ne2[this._key](t) : t;
      } catch {
        return false;
      }
      return true;
    }
    return false;
  }
};
var F2 = { mime: "unsupported", width: 0, height: 0 };
function Ge(s4) {
  if (s4.length < 24) return F2;
  let e = new Uint32Array(s4.buffer, s4.byteOffset, 6);
  if (e[0] === 1196314761 && e[1] === 169478669 && e[3] === 1380206665) return { mime: "image/png", width: s4[16] << 24 | s4[17] << 16 | s4[18] << 8 | s4[19], height: s4[20] << 24 | s4[21] << 16 | s4[22] << 8 | s4[23] };
  if (s4[0] === 255 && s4[1] === 216 && s4[2] === 255) {
    let [t, i] = bt2(s4);
    return { mime: "image/jpeg", width: t, height: i };
  }
  return e[0] === 944130375 && (s4[4] === 55 || s4[4] === 57) && s4[5] === 97 ? { mime: "image/gif", width: s4[7] << 8 | s4[6], height: s4[9] << 8 | s4[8] } : e[0] === 1718185841 ? { mime: "image/qoi", width: s4[4] << 24 | s4[5] << 16 | s4[6] << 8 | s4[7], height: s4[8] << 24 | s4[9] << 16 | s4[10] << 8 | s4[11] } : F2;
}
function bt2(s4) {
  let e = s4.length, t = 4, i = s4[t] << 8 | s4[t + 1];
  for (; ; ) {
    if (t += i, t >= e) return [0, 0];
    if (s4[t] !== 255) return [0, 0];
    if (s4[t + 1] === 192 || s4[t + 1] === 194) return t + 8 < e ? [s4[t + 7] << 8 | s4[t + 8], s4[t + 5] << 8 | s4[t + 6]] : [0, 0];
    t += 2, i = s4[t] << 8 | s4[t + 1];
  }
}
var we2 = { type: 0, name: "Unnamed file", size: 0, width: "auto", height: "auto", preserveAspectRatio: 1, inline: 0 };
var $2 = class {
  constructor(e, t, i, A) {
    this._opts = e;
    this._renderer = t;
    this._storage = i;
    this._coreTerminal = A;
    this._aborted = false;
    this._hp = new V2();
    this._header = we2;
    this._metrics = F2;
    this._isMultipart = false;
    this._abortMulti = false;
    let r = Math.ceil(this._opts.iipSizeLimit * 4 / 3), a = Math.min(1048576, r);
    this._dec = new Ue2.default(4194304, r, a), this._qoiDec = new Oe2.default(4194304);
  }
  reset() {
    this._hp.reset(), this._dec.release(), this._qoiDec.release();
  }
  start() {
    this._aborted = false, this._metrics = F2, this._hp.reset();
  }
  put(e, t, i) {
    if (!this._aborted) if (this._hp.state === 4) this._dec.put(e.subarray(t, i)) !== 0 && (this._dec.release(), this._aborted = true);
    else {
      let A = this._hp.parse(e, t, i);
      if (A === -1) {
        this._aborted = true;
        return;
      }
      if (A > 0) {
        if (this._hp.fields.type === 1) {
          if (this._isMultipart && (this._isMultipart = false, this._abortMulti = false, this._dec.release()), this._header = Object.assign({}, we2, this._hp.fields), !this._header.inline) {
            this._aborted = true;
            return;
          }
          this._dec.init();
        } else if (this._abortMulti) {
          this._aborted = true;
          return;
        }
        this._dec.put(e.subarray(A, i)) !== 0 && (this._dec.release(), this._aborted = true, this._isMultipart && (this._abortMulti = true));
      }
    }
  }
  end(e) {
    if (this._aborted || this._hp.state !== 4 && this._hp.end()) return true;
    let t = this._hp.fields.type;
    if (t === 3) return true;
    if (t === 5) {
      let n10 = w.width, o3 = w.height;
      this._renderer.dimensions && (n10 = this._renderer.dimensions.css.canvas.width / this._coreTerminal.cols, o3 = this._renderer.dimensions.css.canvas.height / this._coreTerminal.rows);
      let d = this._coreTerminal._core._coreBrowserService?.dpr ?? 1, h = `\x1B]1337;ReportCellSize=${o3.toFixed(3)};${n10.toFixed(3)};${d.toFixed(3)}\x1B\\`;
      return this._coreTerminal.input(h, false), true;
    }
    if (t === 2) return this._header = Object.assign({}, we2, this._hp.fields), this._isMultipart = true, this._abortMulti = false, this._dec.release(), this._dec.init(), true;
    if (t === 4 && (!this._isMultipart || (this._isMultipart = false, this._abortMulti || this._header.type !== 2))) return true;
    let i = 0, A = 0, r;
    if ((r = e) && (r = !this._dec.end()) && (this._metrics = Ge(this._dec.data8), (r = this._metrics.mime !== "unsupported") && (i = this._metrics.width, A = this._metrics.height, (r = i && A && i * A < this._opts.pixelLimit) && ([i, A] = this._resize(i, A).map(Math.floor), r = i && A && i * A < this._opts.pixelLimit))), !r) return this._dec.release(), true;
    let a;
    if (this._metrics.mime === "image/qoi") {
      let n10 = this._qoiDec.decode(this._dec.data8);
      if (a = new ImageData(new Uint8ClampedArray(n10.buffer, n10.byteOffset, n10.byteLength), this._qoiDec.width, this._qoiDec.height), this._qoiDec.release(), i === this._qoiDec.width && A === this._qoiDec.height) {
        this._dec.release();
        let o3 = D2.createCanvas(void 0, this._qoiDec.width, this._qoiDec.height);
        return o3.getContext("2d")?.putImageData(a, 0, 0), this._storage.addImage(o3), true;
      }
    } else a = new Blob([this._dec.data8], { type: this._metrics.mime });
    return this._dec.release(), createImageBitmap(a, { resizeWidth: i, resizeHeight: A }).then((n10) => (this._storage.addImage(n10), true));
  }
  _resize(e, t) {
    let i = this._renderer.dimensions?.css.cell.width || w.width, A = this._renderer.dimensions?.css.cell.height || w.height, r = this._renderer.dimensions?.css.canvas.width || i * this._coreTerminal.cols, a = this._renderer.dimensions?.css.canvas.height || A * this._coreTerminal.rows, n10 = this._dim(this._header.width, r, i), o3 = this._dim(this._header.height, a, A);
    if (!n10 && !o3) {
      let d = r / e, h = (a - A) / t, g2 = Math.min(d, h);
      return g2 < 1 ? [e * g2, t * g2] : [e, t];
    }
    return n10 ? this._header.preserveAspectRatio || !n10 || !o3 ? [n10, t * n10 / e] : [n10, o3] : [e * o3 / t, o3];
  }
  _dim(e, t, i) {
    return e === "auto" ? 0 : e.endsWith("%") ? parseInt(e.slice(0, -1), 10) * t / 100 : e.endsWith("px") ? parseInt(e.slice(0, -2), 10) : parseInt(e, 10) * i;
  }
};
var Pe2 = x(Ee2());
function be2(s4) {
  let e = {}, t = s4.split(",");
  for (let i of t) {
    let A = i.indexOf("=");
    if (A === -1) continue;
    let r = i.substring(0, A), a = i.substring(A + 1);
    if (r === "a") {
      e.action = a;
      continue;
    }
    if (r === "o") {
      e.compression = a;
      continue;
    }
    if (r === "t") {
      e.transmission = a;
      continue;
    }
    if (r === "d") {
      e.deleteSelector = a;
      continue;
    }
    let n10 = parseInt(a, 10);
    switch (r) {
      case "f":
        e.format = n10;
        break;
      case "i":
        e.id = n10;
        break;
      case "I":
        e.imageNumber = n10;
        break;
      case "s":
        e.width = n10;
        break;
      case "v":
        e.height = n10;
        break;
      case "x":
        e.x = n10;
        break;
      case "y":
        e.y = n10;
        break;
      case "w":
        e.sourceWidth = n10;
        break;
      case "h":
        e.sourceHeight = n10;
        break;
      case "X":
        e.xOffset = n10;
        break;
      case "Y":
        e.yOffset = n10;
        break;
      case "c":
        e.columns = n10;
        break;
      case "r":
        e.rows = n10;
        break;
      case "m":
        e.more = n10;
        break;
      case "q":
        e.quiet = n10;
        break;
      case "C":
        e.cursorMovement = n10;
        break;
      case "z":
        e.zIndex = n10;
        break;
      case "p":
        e.placementId = n10;
        break;
    }
  }
  return e;
}
var Je = 0;
var ee2 = class {
  constructor(e, t, i, A) {
    this._opts = e;
    this._renderer = t;
    this._kittyStorage = i;
    this._coreTerminal = A;
    this._aborted = false;
    this._decodeError = false;
    this._activeDecoder = null;
    this._inControlData = true;
    this._controlData = new Uint32Array(512);
    this._controlLength = 0;
    this._encodedSizeLimit = 0;
    this._totalEncodedSize = 0;
    this._parsedCommand = null;
    this._pendingTransmissions = /* @__PURE__ */ new Map();
    this._maxEncodedBytes = Math.ceil(this._opts.kittySizeLimit * 4 / 3), this._initialEncodedBytes = Math.min(4194304, this._maxEncodedBytes);
  }
  reset() {
    this._cleanupAllPending(), this._activeDecoder && (this._activeDecoder.release(), this._activeDecoder = null), this._kittyStorage.reset();
  }
  dispose() {
    this.reset();
  }
  _removePendingEntry(e) {
    this._pendingTransmissions.delete(e), this._lastPendingKey === e && (this._lastPendingKey = void 0);
  }
  _cleanupAllPending() {
    for (let e of this._pendingTransmissions.values()) e.decoder.release();
    this._pendingTransmissions.clear(), this._lastPendingKey = void 0;
  }
  start() {
    this._aborted = false, this._decodeError = false, this._inControlData = true, this._controlLength = 0, this._parsedCommand = null, this._encodedSizeLimit = this._maxEncodedBytes, this._totalEncodedSize = 0, this._activeDecoder = null;
  }
  put(e, t, i) {
    if (!this._aborted) if (!this._inControlData) this._streamPayload(e, t, i);
    else {
      let A = i;
      for (let a = t; a < i; a++) if (e[a] === 59) {
        this._inControlData = false, A = a;
        break;
      }
      let r = A - t;
      if (this._controlLength + r > 512) {
        this._aborted = true;
        return;
      }
      if (this._controlData.set(e.subarray(t, A), this._controlLength), this._controlLength += r, !this._inControlData) {
        if (this._parsedCommand = be2(this._parseControlDataString()), this._parsedCommand.id !== void 0 && this._parsedCommand.imageNumber !== void 0) {
          this._sendResponse(this._parsedCommand.id, "EINVAL:cannot specify both i and I keys", this._parsedCommand.quiet ?? 0), this._aborted = true;
          return;
        }
        if (this._parsedCommand.action === "d") return;
        let a = A + 1;
        a < i && this._streamPayload(e, a, i);
      }
    }
  }
  _streamPayload(e, t, i) {
    if (this._aborted) return;
    let A = this._parsedCommand?.id ?? this._lastPendingKey ?? 0, r = this._pendingTransmissions.get(A), a = r?.totalEncodedSize ?? 0;
    if (this._totalEncodedSize += i - t, a + this._totalEncodedSize > this._encodedSizeLimit) {
      let o3 = this._activeDecoder ?? r?.decoder;
      o3 && o3.release(), this._activeDecoder = null, r && this._removePendingEntry(A), this._aborted = true;
      return;
    }
    this._decodeError || (r?.decoder && !this._activeDecoder && (this._activeDecoder = r.decoder), this._activeDecoder || (this._activeDecoder = new Pe2.default(4194304, this._maxEncodedBytes, this._initialEncodedBytes), this._activeDecoder.init()), this._activeDecoder.put(e.subarray(t, i)) !== Je && (this._activeDecoder.release(), this._activeDecoder = null, this._decodeError = true, r && this._removePendingEntry(A)));
  }
  end(e) {
    if (this._aborted || !e) return this._activeDecoder && (this._activeDecoder.release(), this._activeDecoder = null), true;
    if (this._inControlData) return this._handleNoPayloadCommand();
    let t = this._parsedCommand;
    if (t.action === "d") return this._handleDelete(t);
    let i = t.id ?? this._lastPendingKey ?? 0, A = t.more === 1, r = this._pendingTransmissions.get(i);
    if (A) return this._activeDecoder && (r ? (r.totalEncodedSize += this._totalEncodedSize, r.decodeError = r.decodeError || this._decodeError) : this._pendingTransmissions.set(i, { cmd: { ...t }, decoder: this._activeDecoder, totalEncodedSize: this._totalEncodedSize, decodeError: this._decodeError }), this._lastPendingKey = i, this._activeDecoder = null), true;
    r && (this._lastPendingKey = void 0);
    let a = this._decodeError, n10 = t, o3 = this._activeDecoder;
    r && (n10 = r.cmd, o3 = r.decoder, a = a || r.decodeError, this._pendingTransmissions.delete(i));
    let d = new Uint8Array(0);
    o3 && (o3.end() !== Je && (a = true), d = o3.data8), this._activeDecoder = null;
    let h = this._handleCommandWithBytesAndCmd(n10, d, a);
    return o3 && o3.release(), h;
  }
  _parseControlDataString() {
    let e = "";
    for (let t = 0; t < this._controlLength; t++) e += String.fromCodePoint(this._controlData[t]);
    return e;
  }
  _handleNoPayloadCommand() {
    let e = be2(this._parseControlDataString());
    if (e.id !== void 0 && e.imageNumber !== void 0) return this._sendResponse(e.id, "EINVAL:cannot specify both i and I keys", e.quiet ?? 0), true;
    switch (e.action ?? "t") {
      case "d":
        return this._handleDelete(e);
      case "q":
        return this._sendResponse(e.id ?? 0, "OK", e.quiet ?? 0), true;
      case "p":
        return this._handlePlacement(e);
      default:
        return e.id !== void 0 && this._sendResponse(e.id, "EINVAL:unsupported action", e.quiet ?? 0), true;
    }
  }
  _handleCommandWithBytesAndCmd(e, t, i) {
    switch (e.action ?? "t") {
      case "t": {
        let r = this._handleTransmit(e, t, i);
        return (e.transmission ?? "d") === "d" && e.id !== void 0 && (i ? this._sendResponse(e.id, "EINVAL:invalid base64 data", e.quiet ?? 0) : t.length > 0 && this._sendResponse(e.id, "OK", e.quiet ?? 0)), r;
      }
      case "T":
        return this._handleTransmitDisplay(e, t, i);
      case "q":
        return this._handleQuery(e, t, i);
      case "p":
        return this._handlePlacement(e);
      default:
        return e.id !== void 0 && this._sendResponse(e.id, "EINVAL:unsupported action", e.quiet ?? 0), true;
    }
  }
  _handlePlacement(e) {
    if (e.id === void 0) return true;
    let t = e.id, i = this._kittyStorage.getImage(t);
    return i ? this._displayImage(i, e).then((r) => (this._sendResponse(t, r ? "OK" : "EINVAL:image rendering failed", e.quiet ?? 0, e.placementId), true)) : (this._sendResponse(t, "ENOENT:image not found", e.quiet ?? 0, e.placementId), true);
  }
  _handleTransmit(e, t, i) {
    return (e.transmission ?? "d") !== "d" ? (e.id !== void 0 && this._sendResponse(e.id, "EINVAL:unsupported transmission medium", e.quiet ?? 0), true) : (i || t.length === 0 || this._kittyStorage.storeImage(e.id, { data: new Blob([t]), width: e.width ?? 0, height: e.height ?? 0, format: e.format ?? 32, compression: e.compression ?? "" }), true);
  }
  _handleTransmitDisplay(e, t, i) {
    if (i) return e.id !== void 0 && this._sendResponse(e.id, "EINVAL:invalid base64 data", e.quiet ?? 0), true;
    this._handleTransmit(e, t, i);
    let A = e.id ?? this._kittyStorage.lastImageId, r = this._kittyStorage.getImage(A);
    if (r) {
      let a = this._displayImage(r, e);
      return e.id !== void 0 ? a.then((n10) => (this._sendResponse(A, n10 ? "OK" : "EINVAL:image rendering failed", e.quiet ?? 0), true)) : a.then(() => true);
    }
    return true;
  }
  _handleQuery(e, t, i) {
    let A = e.id ?? 0, r = e.quiet ?? 0;
    if ((e.transmission ?? "d") !== "d") return this._sendResponse(A, "EINVAL:unsupported transmission medium", r), true;
    if (i) return this._sendResponse(A, "EINVAL:invalid base64 data", r), true;
    if (t.length === 0) return this._sendResponse(A, "OK", r), true;
    let n10 = e.format ?? 32;
    if (n10 === 100) this._sendResponse(A, "OK", r);
    else {
      let o3 = e.width ?? 0, d = e.height ?? 0;
      if (!o3 || !d) return this._sendResponse(A, "EINVAL:width and height required for raw pixel data", r), true;
      let h = n10 === 32 ? 4 : 3, g2 = o3 * d * h;
      if (t.length < g2) return this._sendResponse(A, "EINVAL:insufficient pixel data", r), true;
      this._sendResponse(A, "OK", r);
    }
    return true;
  }
  _handleDelete(e) {
    switch (e.deleteSelector ?? "a") {
      case "a":
      case "A":
        this._cleanupAllPending(), this._kittyStorage.deleteAll();
        break;
      case "i":
      case "I":
        if (e.id !== void 0) {
          let i = this._pendingTransmissions.get(e.id);
          i && i.decoder.release(), this._removePendingEntry(e.id), this._kittyStorage.deleteById(e.id);
        }
        break;
      default:
        break;
    }
    return true;
  }
  _sendResponse(e, t, i, A) {
    let r = t === "OK";
    if (r && i >= 1 || !r && i >= 2) return;
    let a = A ? `,p=${A}` : "", n10 = `\x1B_Gi=${e}${a};${t}\x1B\\`;
    this._coreTerminal._core.coreService.triggerDataEvent(n10);
  }
  _displayImage(e, t) {
    return this._decodeAndDisplay(e, t).then(() => true).catch(() => false);
  }
  async _decodeAndDisplay(e, t) {
    let i = await this._createBitmap(e);
    try {
      let A = Math.max(0, t.x ?? 0), r = Math.max(0, t.y ?? 0), a = t.sourceWidth || i.width - A, n10 = t.sourceHeight || i.height - r, o3 = Math.max(0, i.width - A), d = Math.max(0, i.height - r), h = Math.max(0, Math.min(a, o3)), g2 = Math.max(0, Math.min(n10, d));
      if (h === 0 || g2 === 0) throw new Error("invalid source rectangle");
      if (A !== 0 || r !== 0 || h !== i.width || g2 !== i.height) {
        let L = await createImageBitmap(i, A, r, h, g2);
        i.close(), i = L;
      }
      let I = this._renderer.dimensions?.css.cell.width || w.width, _ = this._renderer.dimensions?.css.cell.height || w.height, l3, C2;
      t.columns !== void 0 && t.rows !== void 0 ? (l3 = t.columns, C2 = t.rows) : t.columns !== void 0 ? (l3 = t.columns, C2 = Math.max(1, Math.ceil(i.height / i.width * (l3 * I) / _))) : t.rows !== void 0 ? (C2 = t.rows, l3 = Math.max(1, Math.ceil(i.width / i.height * (C2 * _) / I))) : (l3 = Math.ceil(i.width / I), C2 = Math.ceil(i.height / _));
      let u = i.width, E2 = i.height;
      if ((t.columns !== void 0 || t.rows !== void 0) && (u = Math.round(l3 * I), E2 = Math.round(C2 * _)), u * E2 > this._opts.pixelLimit) throw new Error("image exceeds pixel limit");
      let p = this._coreTerminal._core.buffer, f2 = p.x, P2 = p.y, K3 = p.ybase, Ve2 = t.zIndex !== void 0 && t.zIndex < 0 ? "bottom" : "top";
      if (u !== i.width || E2 !== i.height) {
        let L = await createImageBitmap(i, { resizeWidth: u, resizeHeight: E2 });
        i.close(), i = L;
      }
      let oe2 = Math.min(Math.max(0, t.xOffset ?? 0), I - 1), he2 = Math.min(Math.max(0, t.yOffset ?? 0), _ - 1);
      if (oe2 !== 0 || he2 !== 0) {
        let L = t.columns !== void 0 ? Math.round(l3 * I) : i.width + oe2, et2 = t.rows !== void 0 ? Math.round(C2 * _) : i.height + he2, Y2 = D2.createCanvas(window.document, L, et2), Le = Y2.getContext("2d");
        if (!Le) throw new Error("Failed to create offset canvas context");
        Le.drawImage(i, oe2, he2);
        let tt2 = await createImageBitmap(Y2);
        if (Y2.width = Y2.height = 0, i.close(), i = tt2, u = i.width, E2 = i.height, u * E2 > this._opts.pixelLimit) throw new Error("image exceeds pixel limit");
        t.columns === void 0 && (l3 = Math.ceil(i.width / I)), t.rows === void 0 && (C2 = Math.ceil(i.height / _));
      }
      let $e2 = t.zIndex ?? 0;
      if (this._kittyStorage.addImage(e.id, i, true, Ve2, $e2), i = void 0, t.cursorMovement === 1) {
        let L = p.ybase - K3;
        p.x = f2, p.y = Math.max(P2 - L, 0);
      } else p.x = Math.min(f2 + l3, this._coreTerminal.cols);
    } catch (A) {
      throw i?.close(), A;
    }
  }
  async _createBitmap(e) {
    let t = new Uint8Array(await e.data.arrayBuffer());
    if (e.compression === "z" && (t = await this._decompressZlib(t)), e.format === 100) {
      let u = new Blob([t], { type: "image/png" });
      if (!window.createImageBitmap) {
        let E2 = URL.createObjectURL(u), p = new Image();
        return new Promise((f2, P2) => {
          p.addEventListener("load", () => {
            URL.revokeObjectURL(E2);
            let K3 = D2.createCanvas(window.document, p.width, p.height);
            K3.getContext("2d")?.drawImage(p, 0, 0), createImageBitmap(K3).then(f2).catch(P2);
          }), p.addEventListener("error", () => {
            URL.revokeObjectURL(E2), P2(new Error("Failed to load image"));
          }), p.src = E2;
        });
      }
      return createImageBitmap(u);
    }
    let i = e.width, A = e.height;
    if (!i || !A) throw new Error("Width and height required for raw pixel data");
    let r = e.format === 32 ? 4 : 3, a = i * A * r;
    if (t.length < a) throw new Error("Insufficient pixel data");
    let n10 = i * A;
    if (e.format === 32) return createImageBitmap(new ImageData(new Uint8ClampedArray(t.buffer, t.byteOffset, n10 * 4), i, A));
    let o3 = new Uint8ClampedArray(n10 * 4), d = new Uint32Array(t.buffer, t.byteOffset, Math.floor(t.byteLength / 4)), h = new Uint32Array(o3.buffer), g2 = n10 & -4, I = 0, _ = 0;
    for (let u = 0; u < g2; u += 4) {
      let E2 = d[I++], p = d[I++], f2 = d[I++];
      h[_++] = 4278190080 | E2, h[_++] = 4278190080 | E2 >>> 24 | p << 8, h[_++] = 4278190080 | p >>> 16 | f2 << 16, h[_++] = 4278190080 | f2 >>> 8;
    }
    let l3 = g2 * 3, C2 = g2 * 4;
    for (let u = g2; u < n10; u++) o3[C2] = t[l3], o3[C2 + 1] = t[l3 + 1], o3[C2 + 2] = t[l3 + 2], o3[C2 + 3] = 255, l3 += 3, C2 += 4;
    return createImageBitmap(new ImageData(o3, i, A));
  }
  async _decompressZlib(e) {
    try {
      return await this._decompress(e, "deflate");
    } catch {
      return await this._decompress(e, "deflate-raw");
    }
  }
  async _decompress(e, t) {
    let i = new DecompressionStream(t), A = i.writable.getWriter();
    A.write(e), A.close();
    let r = [], a = i.readable.getReader();
    for (; ; ) {
      let { done: h, value: g2 } = await a.read();
      if (h) break;
      r.push(g2);
    }
    let n10 = r.reduce((h, g2) => h + g2.length, 0), o3 = new Uint8Array(n10), d = 0;
    for (let h of r) o3.set(h, d), d += h.length;
    return o3;
  }
  get images() {
    return this._kittyStorage.images;
  }
  get _kittyIdToStorageId() {
    return this._kittyStorage.kittyIdToStorageId;
  }
  get pendingTransmissions() {
    return this._pendingTransmissions;
  }
};
var G2 = class G3 {
  constructor(e) {
    this._storage = e;
    this._nextImageId = 1;
    this._images = /* @__PURE__ */ new Map();
    this._kittyIdToStorageId = /* @__PURE__ */ new Map();
    this._storageIdToKittyId = /* @__PURE__ */ new Map();
    this._handleStorageImageDeleted = (e2) => {
      let t = this._storageIdToKittyId.get(e2);
      t !== void 0 && (this._kittyIdToStorageId.delete(t), this._storageIdToKittyId.delete(e2), this._images.delete(t));
    };
    this._addImageOpts = { scrolling: true, layer: "top", zIndex: 0, cursorPos: "iip" };
    this._previousOnImageDeleted = this._storage.onImageDeleted, this._wrappedOnImageDeleted = (t) => {
      this._previousOnImageDeleted?.(t), this._handleStorageImageDeleted(t);
    }, this._storage.onImageDeleted = this._wrappedOnImageDeleted;
  }
  reset() {
    this._nextImageId = 1, this._images.clear(), this._kittyIdToStorageId.clear(), this._storageIdToKittyId.clear();
  }
  dispose() {
    this.reset(), this._storage.onImageDeleted === this._wrappedOnImageDeleted && (this._storage.onImageDeleted = this._previousOnImageDeleted);
  }
  storeImage(e, t) {
    let i = e ?? this._nextImageId++, A = this._kittyIdToStorageId.get(i);
    return A !== void 0 && (this._storage.deleteImage(A), this._kittyIdToStorageId.delete(i), this._storageIdToKittyId.delete(A)), !this._images.has(i) && this._images.size >= G3._maxStoredImages && this._evictUndisplayedImages(), this._images.set(i, { ...t, id: i }), i;
  }
  addImage(e, t, i, A, r) {
    let a = this._kittyIdToStorageId.get(e);
    a !== void 0 && this._storageIdToKittyId.delete(a), this._addImageOpts.scrolling = i, this._addImageOpts.layer = A, this._addImageOpts.zIndex = r;
    let n10 = this._storage.addImage(t, this._addImageOpts);
    this._kittyIdToStorageId.set(e, n10), this._storageIdToKittyId.set(n10, e);
  }
  getImage(e) {
    return this._images.get(e);
  }
  deleteById(e) {
    this._images.delete(e);
    let t = this._kittyIdToStorageId.get(e);
    t !== void 0 && (this._storage.deleteImage(t), this._kittyIdToStorageId.delete(e), this._storageIdToKittyId.delete(t));
  }
  deleteAll() {
    this._images.clear();
    for (let e of this._kittyIdToStorageId.values()) this._storage.deleteImage(e);
    this._kittyIdToStorageId.clear(), this._storageIdToKittyId.clear();
  }
  get images() {
    return this._images;
  }
  get kittyIdToStorageId() {
    return this._kittyIdToStorageId;
  }
  get lastImageId() {
    return this._nextImageId - 1;
  }
  _evictUndisplayedImages() {
    for (let [e] of this._images) {
      if (this._images.size <= G3._maxStoredImages / 2) break;
      this._kittyIdToStorageId.has(e) || this._images.delete(e);
    }
  }
};
G2._maxStoredImages = 256;
var te = G2;
var y2 = x(z2());
var ze2 = x(We2());
var xt2 = 4194304;
var Se = y2.PALETTE_ANSI_256;
Se.set(y2.PALETTE_VT340_COLOR);
var se2 = class {
  constructor(e, t, i) {
    this._opts = e;
    this._storage = t;
    this._coreTerminal = i;
    this._size = 0;
    this._aborted = false;
    (0, ze2.DecoderAsync)({ memoryLimit: this._opts.pixelLimit * 4, palette: Se, paletteLimit: this._opts.sixelPaletteLimit }).then((A) => this._dec = A);
  }
  reset() {
    this._dec && (this._dec.release(), this._dec._palette.fill(0), this._dec.init(0, Se, this._opts.sixelPaletteLimit));
  }
  hook(e) {
    if (this._size = 0, this._aborted = false, this._dec) {
      let t = e.params[1] === 1 ? 0 : Mt2(this._coreTerminal._core._inputHandler._curAttrData, this._coreTerminal._core._themeService?.colors);
      this._dec.init(t, null, this._opts.sixelPaletteLimit);
    }
  }
  put(e, t, i) {
    if (!(this._aborted || !this._dec)) {
      if (this._size += i - t, this._size > this._opts.sixelSizeLimit) {
        console.warn("SIXEL: too much data, aborting"), this._aborted = true, this._dec.release();
        return;
      }
      try {
        this._dec.decode(e, t, i);
      } catch (A) {
        console.warn(`SIXEL: error while decoding image - ${A}`), this._aborted = true, this._dec.release();
      }
    }
  }
  unhook(e) {
    if (this._aborted || !e || !this._dec) return true;
    let t = this._dec.width, i = this._dec.height;
    if (!t || !i) return i && this._storage.advanceCursor(i), true;
    let A = D2.createCanvas(void 0, t, i);
    return A.getContext("2d")?.putImageData(new ImageData(this._dec.data8, t, i), 0, 0), this._dec.memoryUsage > xt2 && this._dec.release(), this._storage.addImage(A), true;
  }
};
function Mt2(s4, e) {
  let t = 0;
  if (!e) return t;
  if (s4.isInverse()) if (s4.isFgDefault()) t = re2(e.foreground.rgba);
  else if (s4.isFgRGB()) {
    let i = s4.constructor.toColorRGB(s4.getFgColor());
    t = (0, y2.toRGBA8888)(...i);
  } else t = re2(e.ansi[s4.getFgColor()].rgba);
  else if (s4.isBgDefault()) t = re2(e.background.rgba);
  else if (s4.isBgRGB()) {
    let i = s4.constructor.toColorRGB(s4.getBgColor());
    t = (0, y2.toRGBA8888)(...i);
  } else t = re2(e.ansi[s4.getBgColor()].rgba);
  return t;
}
function re2(s4) {
  return y2.BIG_ENDIAN ? s4 : (s4 & 255) << 24 | (s4 >>> 8 & 255) << 16 | (s4 >>> 16 & 255) << 8 | s4 >>> 24 & 255;
}
var ne2 = class {
  constructor(e, t, i, A) {
    this._storage = e;
    this._opts = t;
    this._renderer = i;
    this._terminal = A;
    this._addImageOpts = { scrolling: true, layer: "top", zIndex: 0, cursorPos: "vt340" };
  }
  addImage(e) {
    this._addImageOpts.scrolling = this._opts.sixelScrolling, this._storage.addImage(e, this._addImageOpts);
  }
  advanceCursor(e) {
    if (this._opts.sixelScrolling) {
      let t = this._renderer.cellSize;
      (t.width === -1 || t.height === -1) && (t = w);
      let i = Math.ceil(e / t.height);
      for (let A = 1; A < i; ++A) this._terminal._core._inputHandler.lineFeed();
    }
  }
};
var ae = class {
  constructor(e) {
    this._storage = e;
    this._addImageOpts = { scrolling: true, layer: "top", zIndex: 0, cursorPos: "iip" };
  }
  addImage(e) {
    this._storage.addImage(e, this._addImageOpts);
  }
};
var Xe = { enableSizeReports: true, pixelLimit: 16777216, sixelSupport: true, sixelScrolling: true, sixelPaletteLimit: 4096, sixelSizeLimit: 33554432, storageLimit: 128, showPlaceholder: true, iipSupport: true, iipSizeLimit: 33554432, kittySupport: true, kittySizeLimit: 33554432 };
var Ze2 = 4096;
var je = class {
  constructor(e) {
    this._disposables = [];
    this._handlers = /* @__PURE__ */ new Map();
    this._onImageAdded = new W2();
    this.onImageAdded = this._onImageAdded.event;
    this._opts = Object.assign({}, Xe, e), this._defaultOpts = Object.assign({}, Xe, e);
  }
  dispose() {
    for (let e of this._disposables) e.dispose();
    this._disposables.length = 0, this._handlers.clear(), this._onImageAdded.dispose();
  }
  _disposeLater(...e) {
    for (let t of e) this._disposables.push(t);
  }
  activate(e) {
    if (this._terminal = e, this._renderer = new D2(e), this._storage = new Z2(e, this._renderer, this._opts), this._storage.onImageAdded = () => this._onImageAdded.fire(), this._opts.enableSizeReports) {
      let t = e.options.windowOptions ?? {};
      t.getWinSizePixels = true, t.getCellSizePixels = true, t.getWinSizeChars = true, e.options.windowOptions = t;
    }
    if (this._disposeLater(this._renderer, this._storage, e.parser.registerCsiHandler({ prefix: "?", final: "h" }, (t) => this._decset(t)), e.parser.registerCsiHandler({ prefix: "?", final: "l" }, (t) => this._decrst(t)), e.parser.registerCsiHandler({ final: "c" }, (t) => this._da1(t)), e.parser.registerCsiHandler({ prefix: "?", final: "S" }, (t) => this._xtermGraphicsAttributes(t)), e.onRender((t) => this._storage?.render(t)), e.parser.registerCsiHandler({ intermediates: "!", final: "p" }, () => this.reset()), e.parser.registerEscHandler({ final: "c" }, () => this.reset()), e._core._inputHandler.onRequestReset(() => this.reset()), e.buffer.onBufferChange(() => this._storage?.wipeAlternate()), e.onResize((t) => this._storage?.viewportResize(t))), this._opts.sixelSupport) {
      let t = new ne2(this._storage, this._opts, this._renderer, e), i = new se2(this._opts, t, e);
      this._handlers.set("sixel", i), this._disposeLater(e._core._inputHandler._parser.registerDcsHandler({ final: "q" }, i));
    }
    if (this._opts.iipSupport) {
      let t = new ae(this._storage), i = new $2(this._opts, this._renderer, t, e);
      this._handlers.set("iip", i), this._disposeLater(e._core._inputHandler._parser.registerOscHandler(1337, i));
    }
    if (this._opts.kittySupport) {
      let t = new te(this._storage), i = new ee2(this._opts, this._renderer, t, e);
      this._handlers.set("kitty", i), this._disposeLater(t, i, e._core._inputHandler._parser.registerApcHandler({ final: "G" }, i));
    }
  }
  reset() {
    this._opts.sixelScrolling = this._defaultOpts.sixelScrolling, this._opts.sixelPaletteLimit = this._defaultOpts.sixelPaletteLimit, this._storage?.reset();
    for (let e of this._handlers.values()) e.reset();
    return false;
  }
  get storageLimit() {
    return this._storage?.getLimit() || -1;
  }
  set storageLimit(e) {
    this._storage?.setLimit(e), this._opts.storageLimit = e;
  }
  get storageUsage() {
    return this._storage ? this._storage.getUsage() : -1;
  }
  get showPlaceholder() {
    return this._opts.showPlaceholder;
  }
  set showPlaceholder(e) {
    this._opts.showPlaceholder = e, this._renderer?.showPlaceholder(e);
  }
  getImageAtBufferCell(e, t) {
    return this._storage?.getImageAtBufferCell(e, t);
  }
  extractTileAtBufferCell(e, t) {
    return this._storage?.extractTileAtBufferCell(e, t);
  }
  _report(e) {
    this._terminal?._core.input(e, false);
  }
  _decset(e) {
    for (let t = 0; t < e.length; ++t) e[t] === 80 && (this._opts.sixelScrolling = false);
    return false;
  }
  _decrst(e) {
    for (let t = 0; t < e.length; ++t) e[t] === 80 && (this._opts.sixelScrolling = true);
    return false;
  }
  _da1(e) {
    return e[0] ? true : this._opts.sixelSupport ? (this._report("\x1B[?62;4;9;22c"), true) : false;
  }
  _xtermGraphicsAttributes(e) {
    if (e.length < 2) return true;
    if (e[0] === 1) switch (e[1]) {
      case 1:
        return this._report(`\x1B[?${e[0]};0;${this._opts.sixelPaletteLimit}S`), true;
      case 2:
        this._opts.sixelPaletteLimit = this._defaultOpts.sixelPaletteLimit, this._report(`\x1B[?${e[0]};0;${this._opts.sixelPaletteLimit}S`);
        for (let t of this._handlers.values()) t.reset();
        return true;
      case 3:
        return e.length > 2 && !(e[2] instanceof Array) && e[2] <= Ze2 ? (this._opts.sixelPaletteLimit = e[2], this._report(`\x1B[?${e[0]};0;${this._opts.sixelPaletteLimit}S`)) : this._report(`\x1B[?${e[0]};2S`), true;
      case 4:
        return this._report(`\x1B[?${e[0]};0;${Ze2}S`), true;
      default:
        return this._report(`\x1B[?${e[0]};2S`), true;
    }
    if (e[0] === 2) switch (e[1]) {
      case 1:
        let t = this._renderer?.dimensions?.css.canvas.width, i = this._renderer?.dimensions?.css.canvas.height;
        if (!t || !i) {
          let r = w;
          t = (this._terminal?.cols || 80) * r.width, i = (this._terminal?.rows || 24) * r.height;
        }
        if (t * i < this._opts.pixelLimit) this._report(`\x1B[?${e[0]};0;${t.toFixed(0)};${i.toFixed(0)}S`);
        else {
          let r = Math.floor(Math.sqrt(this._opts.pixelLimit));
          this._report(`\x1B[?${e[0]};0;${r};${r}S`);
        }
        return true;
      case 4:
        let A = Math.floor(Math.sqrt(this._opts.pixelLimit));
        return this._report(`\x1B[?${e[0]};0;${A};${A}S`), true;
      default:
        return this._report(`\x1B[?${e[0]};2S`), true;
    }
    return this._report(`\x1B[?${e[0]};1S`), true;
  }
};

// elements/base.js
var WanixElement = class extends HTMLElement {
  constructor() {
    super();
    this._taskpath = "#task";
    this._termpath = "#term";
    this._vmpath = "#vm";
  }
  connectedCallback() {
    if (this.hasAttribute("task-ns")) {
      this._taskpath = this.getAttribute("task-ns");
    }
    if (this.hasAttribute("term-ns")) {
      this._termpath = this.getAttribute("term-ns");
    }
    if (this.hasAttribute("vm-ns")) {
      this._vmpath = this.getAttribute("vm-ns");
    }
    if (this.tagName === "WANIX-SYSTEM") {
      return;
    }
    this._system = this.closest("wanix-system");
    if (this.hasAttribute("for")) {
      this._system = document.getElementById(this.getAttribute("for"));
      if (this._system && this._system.tagName !== "WANIX-SYSTEM") {
        throw new Error("Component element must be a child of a wanix-system element");
      }
    }
    if (this._system) {
      this._system.addEventListener("ready", () => this._awake());
    }
  }
  _awake() {
    throw new Error("Not implemented");
  }
};

// elements/term.js
var TerminalElement = class extends WanixElement {
  #resizeObserver;
  #reader;
  #writer;
  #dataDisposable;
  constructor() {
    super();
    this.rid = null;
    this._term = null;
    this._fitAddon = null;
    this.#resizeObserver = null;
    this.#reader = null;
    this.#writer = null;
    this.#dataDisposable = null;
  }
  connectedCallback() {
    super.connectedCallback();
    this.path = this.getAttribute("path");
    this.raw = this.hasAttribute("raw");
    this._term = new Ln({
      fontFamily: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
      // theme: {
      //     background: "rgba(0, 0, 0, 0)",
      //     foreground: "white",
      // },
      ...this._getOptionsFromAttributes()
    });
    this._term.loadAddon(new l2());
    this._term.loadAddon(new je());
    this._fitAddon = new l();
    this._term.loadAddon(this._fitAddon);
    this._term.open(this);
    this.#resizeObserver = new ResizeObserver(() => {
      this._fitAddon.fit();
      this.dataset.cols = this._term.cols;
      this.dataset.rows = this._term.rows;
      this.dataset.xpixel = this.offsetWidth;
      this.dataset.ypixel = this.offsetHeight;
    });
    this.#resizeObserver.observe(this);
    this.style.flex = "1";
    this.style.display = "flex";
    this.style.flexDirection = "column";
    this.style.height = "100%";
    this._fitAddon.fit();
    this.dataset.cols = this._term.cols;
    this.dataset.rows = this._term.rows;
    this.dataset.xpixel = this.offsetWidth;
    this.dataset.ypixel = this.offsetHeight;
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.disconnect();
    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = null;
    }
    if (this._term) {
      this._term.dispose();
      this._term = null;
    }
    this._fitAddon = null;
  }
  _awake() {
    this.connect();
    this._system.root.openWritable(this.path + "/winch").then((w2) => {
      const writer = w2.getWriter();
      writer.write(new TextEncoder().encode(`${this._term.cols} ${this._term.rows} ${this.offsetWidth} ${this.offsetHeight}
`));
      writer.close();
    }).catch(() => {
    });
    this._term.onResize(async ({ cols, rows }) => {
      if (this._system && this.path) {
        try {
          const w2 = await this._system.root.openWritable(this.path + "/winch");
          const writer = w2.getWriter();
          await writer.write(new TextEncoder().encode(`${cols} ${rows} ${this.offsetWidth} ${this.offsetHeight}
`));
          writer.close();
        } catch (err) {
          console.error("wanix-term: winch write failed:", err);
        }
      }
    });
    this.focus();
  }
  async connect() {
    if (!this._term) return;
    const dataPath = this.path + "/data";
    if (!dataPath || !this._system) return;
    this.disconnect();
    try {
      await this._system.root.waitFor(dataPath, 3e4);
      this._system._updateTerminals(this);
      const readable = await this._system.root.openReadable(dataPath);
      this.#reader = readable.getReader();
      this._readLoop();
      const writable = await this._system.root.openWritable(dataPath);
      this.#writer = writable.getWriter();
      const encoder = new TextEncoder();
      let buffer = "";
      this.#dataDisposable = this._term.onData((data) => {
        if (this.raw) {
          this.#writer.write(encoder.encode(data));
          return;
        }
        if (data === "\r") {
          this._term.write("\r\n");
          if (this.#writer) {
            this.#writer.write(encoder.encode(buffer + "\n"));
          }
          buffer = "";
        } else if (data === "\x7F") {
          if (buffer.length > 0) {
            buffer = buffer.slice(0, -1);
            this._term.write("\b \b");
          }
        } else {
          buffer += data;
          this._term.write(data);
        }
      });
    } catch (err) {
      console.error("wanix-term: failed to connect terminal:", err);
    }
  }
  async _readLoop() {
    if (!this.#reader || !this._term) return;
    try {
      while (true) {
        const { done, value } = await this.#reader.read();
        if (done) break;
        if (value && this._term) {
          this._term.write(value);
        }
      }
    } catch (err) {
      console.error("wanix-terminal: read error:", err);
    }
  }
  disconnect() {
    if (this.#dataDisposable) {
      this.#dataDisposable.dispose();
      this.#dataDisposable = null;
    }
    if (this.#reader) {
      this.#reader.cancel().catch(() => {
      });
      this.#reader = null;
    }
    if (this.#writer) {
      this.#writer.close().catch(() => {
      });
      this.#writer = null;
    }
  }
  _getOptionsFromAttributes() {
    const options = {};
    if (this.hasAttribute("font-size")) {
      options.fontSize = parseInt(this.getAttribute("font-size"), 10);
    }
    if (this.hasAttribute("font-family")) {
      options.fontFamily = this.getAttribute("font-family");
    }
    if (this.hasAttribute("cursor-blink")) {
      options.cursorBlink = this.getAttribute("cursor-blink") !== "false";
    }
    if (this.hasAttribute("cursor-style")) {
      options.cursorStyle = this.getAttribute("cursor-style");
    }
    if (this.hasAttribute("scrollback")) {
      options.scrollback = parseInt(this.getAttribute("scrollback"), 10);
    }
    if (this.hasAttribute("no-scrollbar")) {
      options.scrollbar = { showScrollbar: false };
    }
    return options;
  }
  fit() {
    if (this._fitAddon) {
      this._fitAddon.fit();
    }
  }
  write(data) {
    if (this._term) {
      this._term.write(data);
    }
  }
  reset() {
    if (this._term) {
      this._term.reset();
    }
  }
  focus() {
    if (this._term) {
      this._term.focus();
    }
  }
  clear() {
    if (this._term) {
      this._term.clear();
    }
  }
};
if (typeof window !== "undefined") {
  customElements.define("wanix-term", TerminalElement);
}

// api/devtools.js
function setupDevtools(el) {
  const handle = el.root;
  globalThis.list = (name) => {
    handle.readDir(name).then(console.log);
  };
  globalThis.read = (name) => {
    handle.readFile(name).then((d) => new TextDecoder().decode(d)).then(console.log);
  };
  globalThis.readBytes = (name) => {
    handle.readFile(name).then(console.log);
  };
  globalThis.write = (name, content) => {
    handle.writeFile(name, content);
  };
  globalThis.readlink = (name) => {
    handle.readlink(name).then(console.log);
  };
  globalThis.mkdir = (name) => {
    handle.makeDir(name);
  };
  globalThis.bind = (name, newname) => {
    handle.bind(name, newname);
  };
  globalThis.unbind = (name, newname) => {
    handle.unbind(name, newname);
  };
  globalThis.rm = (name) => {
    handle.remove(name);
  };
  globalThis.stat = (name) => {
    handle.stat(name).then(console.log);
  };
  globalThis.lstat = (name) => {
    handle.lstat(name).then(console.log);
  };
  globalThis.tail = async (name) => {
    const fd = await handle.open(name);
    while (true) {
      const data = await handle.read(fd, 1024);
      if (!data) {
        break;
      }
      console.log(new TextDecoder().decode(data));
    }
    handle.close(fd);
  };
  globalThis.makeScreen = () => {
    const screen2 = document.createElement("div");
    const div = document.createElement("div");
    const canvas = document.createElement("canvas");
    screen2.appendChild(div);
    screen2.appendChild(canvas);
    screen2.id = "screen";
    screen2.style.display = "none";
    screen2.style.border = "1px solid red";
    document.body.appendChild(screen2);
  };
  globalThis.showScreen = () => {
    const screen2 = document.getElementById("screen");
    screen2.style.display = "block";
  };
  globalThis.hideScreen = () => {
    const screen2 = document.getElementById("screen");
    screen2.style.display = "none";
  };
}

// wasm/wasm_exec.go.js
var wasm_exec_go_default = '// Copyright 2018 The Go Authors. All rights reserved.\n// Use of this source code is governed by a BSD-style\n// license that can be found in the LICENSE file.\n\n"use strict";\n\n(() => {\n	const enosys = () => {\n		const err = new Error("not implemented");\n		err.code = "ENOSYS";\n		return err;\n	};\n\n	if (!globalThis.fs) {\n		let outputBuf = "";\n		globalThis.fs = {\n			constants: { O_WRONLY: -1, O_RDWR: -1, O_CREAT: -1, O_TRUNC: -1, O_APPEND: -1, O_EXCL: -1 }, // unused\n			writeSync(fd, buf) {\n				outputBuf += decoder.decode(buf);\n				const nl = outputBuf.lastIndexOf("\\n");\n				if (nl != -1) {\n					console.log(outputBuf.substring(0, nl));\n					outputBuf = outputBuf.substring(nl + 1);\n				}\n				return buf.length;\n			},\n			write(fd, buf, offset, length, position, callback) {\n				if (offset !== 0 || length !== buf.length || position !== null) {\n					callback(enosys());\n					return;\n				}\n				const n = this.writeSync(fd, buf);\n				callback(null, n);\n			},\n			chmod(path, mode, callback) { callback(enosys()); },\n			chown(path, uid, gid, callback) { callback(enosys()); },\n			close(fd, callback) { callback(enosys()); },\n			fchmod(fd, mode, callback) { callback(enosys()); },\n			fchown(fd, uid, gid, callback) { callback(enosys()); },\n			fstat(fd, callback) { callback(enosys()); },\n			fsync(fd, callback) { callback(null); },\n			ftruncate(fd, length, callback) { callback(enosys()); },\n			lchown(path, uid, gid, callback) { callback(enosys()); },\n			link(path, link, callback) { callback(enosys()); },\n			lstat(path, callback) { callback(enosys()); },\n			mkdir(path, perm, callback) { callback(enosys()); },\n			open(path, flags, mode, callback) { callback(enosys()); },\n			read(fd, buffer, offset, length, position, callback) { callback(enosys()); },\n			readdir(path, callback) { callback(enosys()); },\n			readlink(path, callback) { callback(enosys()); },\n			rename(from, to, callback) { callback(enosys()); },\n			rmdir(path, callback) { callback(enosys()); },\n			stat(path, callback) { callback(enosys()); },\n			symlink(path, link, callback) { callback(enosys()); },\n			truncate(path, length, callback) { callback(enosys()); },\n			unlink(path, callback) { callback(enosys()); },\n			utimes(path, atime, mtime, callback) { callback(enosys()); },\n		};\n	}\n\n	if (!globalThis.process) {\n		globalThis.process = {\n			env: {}, // added for vscode compat\n			getuid() { return -1; },\n			getgid() { return -1; },\n			geteuid() { return -1; },\n			getegid() { return -1; },\n			getgroups() { throw enosys(); },\n			pid: -1,\n			ppid: -1,\n			umask() { throw enosys(); },\n			cwd() { throw enosys(); },\n			chdir() { throw enosys(); },\n			exit() {},\n		}\n	}\n\n	if (!globalThis.crypto) {\n		throw new Error("globalThis.crypto is not available, polyfill required (crypto.getRandomValues only)");\n	}\n\n	if (!globalThis.performance) {\n		throw new Error("globalThis.performance is not available, polyfill required (performance.now only)");\n	}\n\n	if (!globalThis.TextEncoder) {\n		throw new Error("globalThis.TextEncoder is not available, polyfill required");\n	}\n\n	if (!globalThis.TextDecoder) {\n		throw new Error("globalThis.TextDecoder is not available, polyfill required");\n	}\n\n	const encoder = new TextEncoder("utf-8");\n	const decoder = new TextDecoder("utf-8");\n\n	globalThis.Go = class {\n		constructor() {\n			this.argv = ["js"];\n			this.env = {};\n			this.exit = (code) => {\n				if (code !== 0) {\n					console.warn("exit code:", code);\n				}\n			};\n			this._exitPromise = new Promise((resolve) => {\n				this._resolveExitPromise = resolve;\n			});\n			this._pendingEvent = null;\n			this._scheduledTimeouts = new Map();\n			this._nextCallbackTimeoutID = 1;\n\n			const setInt64 = (addr, v) => {\n				this.mem.setUint32(addr + 0, v, true);\n				this.mem.setUint32(addr + 4, Math.floor(v / 4294967296), true);\n			}\n\n			const setInt32 = (addr, v) => {\n				this.mem.setUint32(addr + 0, v, true);\n			}\n\n			const getInt64 = (addr) => {\n				const low = this.mem.getUint32(addr + 0, true);\n				const high = this.mem.getInt32(addr + 4, true);\n				return low + high * 4294967296;\n			}\n\n			const loadValue = (addr) => {\n				const f = this.mem.getFloat64(addr, true);\n				if (f === 0) {\n					return undefined;\n				}\n				if (!isNaN(f)) {\n					return f;\n				}\n\n				const id = this.mem.getUint32(addr, true);\n				return this._values[id];\n			}\n\n			const storeValue = (addr, v) => {\n				const nanHead = 0x7FF80000;\n\n				if (typeof v === "number" && v !== 0) {\n					if (isNaN(v)) {\n						this.mem.setUint32(addr + 4, nanHead, true);\n						this.mem.setUint32(addr, 0, true);\n						return;\n					}\n					this.mem.setFloat64(addr, v, true);\n					return;\n				}\n\n				if (v === undefined) {\n					this.mem.setFloat64(addr, 0, true);\n					return;\n				}\n\n				let id = this._ids.get(v);\n				if (id === undefined) {\n					id = this._idPool.pop();\n					if (id === undefined) {\n						id = this._values.length;\n					}\n					this._values[id] = v;\n					this._goRefCounts[id] = 0;\n					this._ids.set(v, id);\n				}\n				this._goRefCounts[id]++;\n				let typeFlag = 0;\n				switch (typeof v) {\n					case "object":\n						if (v !== null) {\n							typeFlag = 1;\n						}\n						break;\n					case "string":\n						typeFlag = 2;\n						break;\n					case "symbol":\n						typeFlag = 3;\n						break;\n					case "function":\n						typeFlag = 4;\n						break;\n				}\n				this.mem.setUint32(addr + 4, nanHead | typeFlag, true);\n				this.mem.setUint32(addr, id, true);\n			}\n\n			const loadSlice = (addr) => {\n				const array = getInt64(addr + 0);\n				const len = getInt64(addr + 8);\n				return new Uint8Array(this._inst.exports.mem.buffer, array, len);\n			}\n\n			const loadSliceOfValues = (addr) => {\n				const array = getInt64(addr + 0);\n				const len = getInt64(addr + 8);\n				const a = new Array(len);\n				for (let i = 0; i < len; i++) {\n					a[i] = loadValue(array + i * 8);\n				}\n				return a;\n			}\n\n			const loadString = (addr) => {\n				const saddr = getInt64(addr + 0);\n				const len = getInt64(addr + 8);\n				return decoder.decode(new DataView(this._inst.exports.mem.buffer, saddr, len));\n			}\n\n			const timeOrigin = Date.now() - performance.now();\n			this.importObject = {\n				_gotest: {\n					add: (a, b) => a + b,\n				},\n				gojs: {\n					// Go\'s SP does not change as long as no Go code is running. Some operations (e.g. calls, getters and setters)\n					// may synchronously trigger a Go event handler. This makes Go code get executed in the middle of the imported\n					// function. A goroutine can switch to a new stack if the current stack is too small (see morestack function).\n					// This changes the SP, thus we have to update the SP used by the imported function.\n\n					// func wasmExit(code int32)\n					"runtime.wasmExit": (sp) => {\n						sp >>>= 0;\n						const code = this.mem.getInt32(sp + 8, true);\n						this.exited = true;\n						delete this._inst;\n						delete this._values;\n						delete this._goRefCounts;\n						delete this._ids;\n						delete this._idPool;\n						this.exit(code);\n					},\n\n					// func wasmWrite(fd uintptr, p unsafe.Pointer, n int32)\n					"runtime.wasmWrite": (sp) => {\n						sp >>>= 0;\n						const fd = getInt64(sp + 8);\n						const p = getInt64(sp + 16);\n						const n = this.mem.getInt32(sp + 24, true);\n						fs.writeSync(fd, new Uint8Array(this._inst.exports.mem.buffer, p, n));\n					},\n\n					// func resetMemoryDataView()\n					"runtime.resetMemoryDataView": (sp) => {\n						sp >>>= 0;\n						this.mem = new DataView(this._inst.exports.mem.buffer);\n					},\n\n					// func nanotime1() int64\n					"runtime.nanotime1": (sp) => {\n						sp >>>= 0;\n						setInt64(sp + 8, (timeOrigin + performance.now()) * 1000000);\n					},\n\n					// func walltime() (sec int64, nsec int32)\n					"runtime.walltime": (sp) => {\n						sp >>>= 0;\n						const msec = (new Date).getTime();\n						setInt64(sp + 8, msec / 1000);\n						this.mem.setInt32(sp + 16, (msec % 1000) * 1000000, true);\n					},\n\n					// func scheduleTimeoutEvent(delay int64) int32\n					"runtime.scheduleTimeoutEvent": (sp) => {\n						sp >>>= 0;\n						const id = this._nextCallbackTimeoutID;\n						this._nextCallbackTimeoutID++;\n						this._scheduledTimeouts.set(id, setTimeout(\n							() => {\n								this._resume();\n								while (this._scheduledTimeouts.has(id)) {\n									// for some reason Go failed to register the timeout event, log and try again\n									// (temporary workaround for https://github.com/golang/go/issues/28975)\n									console.warn("scheduleTimeoutEvent: missed timeout event");\n									this._resume();\n								}\n							},\n							getInt64(sp + 8),\n						));\n						this.mem.setInt32(sp + 16, id, true);\n					},\n\n					// func clearTimeoutEvent(id int32)\n					"runtime.clearTimeoutEvent": (sp) => {\n						sp >>>= 0;\n						const id = this.mem.getInt32(sp + 8, true);\n						clearTimeout(this._scheduledTimeouts.get(id));\n						this._scheduledTimeouts.delete(id);\n					},\n\n					// func getRandomData(r []byte)\n					"runtime.getRandomData": (sp) => {\n						sp >>>= 0;\n						crypto.getRandomValues(loadSlice(sp + 8));\n					},\n\n					// func finalizeRef(v ref)\n					"syscall/js.finalizeRef": (sp) => {\n						sp >>>= 0;\n						const id = this.mem.getUint32(sp + 8, true);\n						this._goRefCounts[id]--;\n						if (this._goRefCounts[id] === 0) {\n							const v = this._values[id];\n							this._values[id] = null;\n							this._ids.delete(v);\n							this._idPool.push(id);\n						}\n					},\n\n					// func stringVal(value string) ref\n					"syscall/js.stringVal": (sp) => {\n						sp >>>= 0;\n						storeValue(sp + 24, loadString(sp + 8));\n					},\n\n					// func valueGet(v ref, p string) ref\n					"syscall/js.valueGet": (sp) => {\n						sp >>>= 0;\n						const result = Reflect.get(loadValue(sp + 8), loadString(sp + 16));\n						sp = this._inst.exports.getsp() >>> 0; // see comment above\n						storeValue(sp + 32, result);\n					},\n\n					// func valueSet(v ref, p string, x ref)\n					"syscall/js.valueSet": (sp) => {\n						sp >>>= 0;\n						Reflect.set(loadValue(sp + 8), loadString(sp + 16), loadValue(sp + 32));\n					},\n\n					// func valueDelete(v ref, p string)\n					"syscall/js.valueDelete": (sp) => {\n						sp >>>= 0;\n						Reflect.deleteProperty(loadValue(sp + 8), loadString(sp + 16));\n					},\n\n					// func valueIndex(v ref, i int) ref\n					"syscall/js.valueIndex": (sp) => {\n						sp >>>= 0;\n						storeValue(sp + 24, Reflect.get(loadValue(sp + 8), getInt64(sp + 16)));\n					},\n\n					// valueSetIndex(v ref, i int, x ref)\n					"syscall/js.valueSetIndex": (sp) => {\n						sp >>>= 0;\n						Reflect.set(loadValue(sp + 8), getInt64(sp + 16), loadValue(sp + 24));\n					},\n\n					// func valueCall(v ref, m string, args []ref) (ref, bool)\n					"syscall/js.valueCall": (sp) => {\n						sp >>>= 0;\n						try {\n							const v = loadValue(sp + 8);\n							const m = Reflect.get(v, loadString(sp + 16));\n							const args = loadSliceOfValues(sp + 32);\n							const result = Reflect.apply(m, v, args);\n							sp = this._inst.exports.getsp() >>> 0; // see comment above\n							storeValue(sp + 56, result);\n							this.mem.setUint8(sp + 64, 1);\n						} catch (err) {\n							sp = this._inst.exports.getsp() >>> 0; // see comment above\n							storeValue(sp + 56, err);\n							this.mem.setUint8(sp + 64, 0);\n						}\n					},\n\n					// func valueInvoke(v ref, args []ref) (ref, bool)\n					"syscall/js.valueInvoke": (sp) => {\n						sp >>>= 0;\n						try {\n							const v = loadValue(sp + 8);\n							const args = loadSliceOfValues(sp + 16);\n							const result = Reflect.apply(v, undefined, args);\n							sp = this._inst.exports.getsp() >>> 0; // see comment above\n							storeValue(sp + 40, result);\n							this.mem.setUint8(sp + 48, 1);\n						} catch (err) {\n							sp = this._inst.exports.getsp() >>> 0; // see comment above\n							storeValue(sp + 40, err);\n							this.mem.setUint8(sp + 48, 0);\n						}\n					},\n\n					// func valueNew(v ref, args []ref) (ref, bool)\n					"syscall/js.valueNew": (sp) => {\n						sp >>>= 0;\n						try {\n							const v = loadValue(sp + 8);\n							const args = loadSliceOfValues(sp + 16);\n							const result = Reflect.construct(v, args);\n							sp = this._inst.exports.getsp() >>> 0; // see comment above\n							storeValue(sp + 40, result);\n							this.mem.setUint8(sp + 48, 1);\n						} catch (err) {\n							sp = this._inst.exports.getsp() >>> 0; // see comment above\n							storeValue(sp + 40, err);\n							this.mem.setUint8(sp + 48, 0);\n						}\n					},\n\n					// func valueLength(v ref) int\n					"syscall/js.valueLength": (sp) => {\n						sp >>>= 0;\n						setInt64(sp + 16, parseInt(loadValue(sp + 8).length));\n					},\n\n					// valuePrepareString(v ref) (ref, int)\n					"syscall/js.valuePrepareString": (sp) => {\n						sp >>>= 0;\n						const str = encoder.encode(String(loadValue(sp + 8)));\n						storeValue(sp + 16, str);\n						setInt64(sp + 24, str.length);\n					},\n\n					// valueLoadString(v ref, b []byte)\n					"syscall/js.valueLoadString": (sp) => {\n						sp >>>= 0;\n						const str = loadValue(sp + 8);\n						loadSlice(sp + 16).set(str);\n					},\n\n					// func valueInstanceOf(v ref, t ref) bool\n					"syscall/js.valueInstanceOf": (sp) => {\n						sp >>>= 0;\n						this.mem.setUint8(sp + 24, (loadValue(sp + 8) instanceof loadValue(sp + 16)) ? 1 : 0);\n					},\n\n					// func copyBytesToGo(dst []byte, src ref) (int, bool)\n					"syscall/js.copyBytesToGo": (sp) => {\n						sp >>>= 0;\n						const dst = loadSlice(sp + 8);\n						const src = loadValue(sp + 32);\n						if (!(src instanceof Uint8Array || src instanceof Uint8ClampedArray)) {\n							this.mem.setUint8(sp + 48, 0);\n							return;\n						}\n						const toCopy = src.subarray(0, dst.length);\n						dst.set(toCopy);\n						setInt64(sp + 40, toCopy.length);\n						this.mem.setUint8(sp + 48, 1);\n					},\n\n					// func copyBytesToJS(dst ref, src []byte) (int, bool)\n					"syscall/js.copyBytesToJS": (sp) => {\n						sp >>>= 0;\n						const dst = loadValue(sp + 8);\n						const src = loadSlice(sp + 16);\n						if (!(dst instanceof Uint8Array || dst instanceof Uint8ClampedArray)) {\n							this.mem.setUint8(sp + 48, 0);\n							return;\n						}\n						const toCopy = src.subarray(0, dst.length);\n						dst.set(toCopy);\n						setInt64(sp + 40, toCopy.length);\n						this.mem.setUint8(sp + 48, 1);\n					},\n\n					"debug": (value) => {\n						console.log(value);\n					},\n				}\n			};\n		}\n\n		async run(instance) {\n			if (!(instance instanceof WebAssembly.Instance)) {\n				throw new Error("Go.run: WebAssembly.Instance expected");\n			}\n			this._inst = instance;\n			this.mem = new DataView(this._inst.exports.mem.buffer);\n			this._values = [ // JS values that Go currently has references to, indexed by reference id\n				NaN,\n				0,\n				null,\n				true,\n				false,\n				globalThis,\n				this,\n			];\n			this._goRefCounts = new Array(this._values.length).fill(Infinity); // number of references that Go has to a JS value, indexed by reference id\n			this._ids = new Map([ // mapping from JS values to reference ids\n				[0, 1],\n				[null, 2],\n				[true, 3],\n				[false, 4],\n				[globalThis, 5],\n				[this, 6],\n			]);\n			this._idPool = [];   // unused ids that have been garbage collected\n			this.exited = false; // whether the Go program has exited\n\n			// Pass command line arguments and environment variables to WebAssembly by writing them to the linear memory.\n			let offset = 4096;\n\n			const strPtr = (str) => {\n				const ptr = offset;\n				const bytes = encoder.encode(str + "\\0");\n				new Uint8Array(this.mem.buffer, offset, bytes.length).set(bytes);\n				offset += bytes.length;\n				if (offset % 8 !== 0) {\n					offset += 8 - (offset % 8);\n				}\n				return ptr;\n			};\n\n			const argc = this.argv.length;\n\n			const argvPtrs = [];\n			this.argv.forEach((arg) => {\n				argvPtrs.push(strPtr(arg));\n			});\n			argvPtrs.push(0);\n\n			const keys = Object.keys(this.env).sort();\n			keys.forEach((key) => {\n				argvPtrs.push(strPtr(`${key}=${this.env[key]}`));\n			});\n			argvPtrs.push(0);\n\n			const argv = offset;\n			argvPtrs.forEach((ptr) => {\n				this.mem.setUint32(offset, ptr, true);\n				this.mem.setUint32(offset + 4, 0, true);\n				offset += 8;\n			});\n\n			// The linker guarantees global data starts from at least wasmMinDataAddr.\n			// Keep in sync with cmd/link/internal/ld/data.go:wasmMinDataAddr.\n			const wasmMinDataAddr = 131072; // 4096 + 8192;\n			if (offset >= wasmMinDataAddr) {\n				throw new Error("total length of command line and environment variables exceeds limit");\n			}\n\n			this._inst.exports.run(argc, argv);\n			if (this.exited) {\n				this._resolveExitPromise();\n			}\n			await this._exitPromise;\n		}\n\n		_resume() {\n			if (this.exited) {\n				throw new Error("Go program has already exited");\n			}\n			this._inst.exports.resume();\n			if (this.exited) {\n				this._resolveExitPromise();\n			}\n		}\n\n		_makeFuncWrapper(id) {\n			const go = this;\n			return function () {\n				const event = { id: id, this: this, args: arguments };\n				go._pendingEvent = event;\n				go._resume();\n				return event.result;\n			};\n		}\n	}\n})();\n';

// wasm/wasm_exec.tinygo.js
var wasm_exec_tinygo_default = `// Copyright 2018 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.
//
// This file has been modified for use by the TinyGo compiler.

(() => {
	// Map multiple JavaScript environments to a single common API,
	// preferring web standards over Node.js API.
	//
	// Environments considered:
	// - Browsers
	// - Node.js
	// - Electron
	// - Parcel

	if (typeof global !== "undefined") {
		// global already exists
	} else if (typeof window !== "undefined") {
		window.global = window;
	} else if (typeof self !== "undefined") {
		self.global = self;
	} else {
		throw new Error("cannot export Go (neither global, window nor self is defined)");
	}

	if (!global.require && typeof require !== "undefined") {
		global.require = require;
	}

	if (!global.fs && global.require) {
		global.fs = require("node:fs");
	}

	const enosys = () => {
		const err = new Error("not implemented");
		err.code = "ENOSYS";
		return err;
	};

	if (!global.fs) {
		let outputBuf = "";
		global.fs = {
			constants: { O_WRONLY: -1, O_RDWR: -1, O_CREAT: -1, O_TRUNC: -1, O_APPEND: -1, O_EXCL: -1 }, // unused
			writeSync(fd, buf) {
				outputBuf += decoder.decode(buf);
				const nl = outputBuf.lastIndexOf("\\n");
				if (nl != -1) {
					console.log(outputBuf.substr(0, nl));
					outputBuf = outputBuf.substr(nl + 1);
				}
				return buf.length;
			},
			write(fd, buf, offset, length, position, callback) {
				if (offset !== 0 || length !== buf.length || position !== null) {
					callback(enosys());
					return;
				}
				const n = this.writeSync(fd, buf);
				callback(null, n);
			},
			chmod(path, mode, callback) { callback(enosys()); },
			chown(path, uid, gid, callback) { callback(enosys()); },
			close(fd, callback) { callback(enosys()); },
			fchmod(fd, mode, callback) { callback(enosys()); },
			fchown(fd, uid, gid, callback) { callback(enosys()); },
			fstat(fd, callback) { callback(enosys()); },
			fsync(fd, callback) { callback(null); },
			ftruncate(fd, length, callback) { callback(enosys()); },
			lchown(path, uid, gid, callback) { callback(enosys()); },
			link(path, link, callback) { callback(enosys()); },
			lstat(path, callback) { callback(enosys()); },
			mkdir(path, perm, callback) { callback(enosys()); },
			open(path, flags, mode, callback) { callback(enosys()); },
			read(fd, buffer, offset, length, position, callback) { callback(enosys()); },
			readdir(path, callback) { callback(enosys()); },
			readlink(path, callback) { callback(enosys()); },
			rename(from, to, callback) { callback(enosys()); },
			rmdir(path, callback) { callback(enosys()); },
			stat(path, callback) { callback(enosys()); },
			symlink(path, link, callback) { callback(enosys()); },
			truncate(path, length, callback) { callback(enosys()); },
			unlink(path, callback) { callback(enosys()); },
			utimes(path, atime, mtime, callback) { callback(enosys()); },
		};
	}

	if (!global.process) {
		global.process = {
			env: {}, // added for vscode compat
			getuid() { return -1; },
			getgid() { return -1; },
			geteuid() { return -1; },
			getegid() { return -1; },
			getgroups() { throw enosys(); },
			pid: -1,
			ppid: -1,
			umask() { throw enosys(); },
			cwd() { throw enosys(); },
			chdir() { throw enosys(); },
		}
	}

	if (!global.crypto) {
		const nodeCrypto = require("node:crypto");
		global.crypto = {
			getRandomValues(b) {
				nodeCrypto.randomFillSync(b);
			},
		};
	}

	if (!global.performance) {
		global.performance = {
			now() {
				const [sec, nsec] = process.hrtime();
				return sec * 1000 + nsec / 1000000;
			},
		};
	}

	if (!global.TextEncoder) {
		global.TextEncoder = require("node:util").TextEncoder;
	}

	if (!global.TextDecoder) {
		global.TextDecoder = require("node:util").TextDecoder;
	}

	// End of polyfills for common API.

	const encoder = new TextEncoder("utf-8");
	const decoder = new TextDecoder("utf-8");
	let reinterpretBuf = new DataView(new ArrayBuffer(8));
	var logLine = [];
	const wasmExit = {}; // thrown to exit via proc_exit (not an error)

	global.Go = class {
		constructor() {
			this._callbackTimeouts = new Map();
			this._nextCallbackTimeoutID = 1;

			const mem = () => {
				// The buffer may change when requesting more memory.
				return new DataView(this._inst.exports.memory.buffer);
			}

			const unboxValue = (v_ref) => {
				reinterpretBuf.setBigInt64(0, v_ref, true);
				const f = reinterpretBuf.getFloat64(0, true);
				if (f === 0) {
					return undefined;
				}
				if (!isNaN(f)) {
					return f;
				}

				const id = v_ref & 0xffffffffn;
				return this._values[id];
			}


			const loadValue = (addr) => {
				let v_ref = mem().getBigUint64(addr, true);
				return unboxValue(v_ref);
			}

			const boxValue = (v) => {
				const nanHead = 0x7FF80000n;

				if (typeof v === "number") {
					if (isNaN(v)) {
						return nanHead << 32n;
					}
					if (v === 0) {
						return (nanHead << 32n) | 1n;
					}
					reinterpretBuf.setFloat64(0, v, true);
					return reinterpretBuf.getBigInt64(0, true);
				}

				switch (v) {
					case undefined:
						return 0n;
					case null:
						return (nanHead << 32n) | 2n;
					case true:
						return (nanHead << 32n) | 3n;
					case false:
						return (nanHead << 32n) | 4n;
				}

				let id = this._ids.get(v);
				if (id === undefined) {
					id = this._idPool.pop();
					if (id === undefined) {
						id = BigInt(this._values.length);
					}
					this._values[id] = v;
					this._goRefCounts[id] = 0;
					this._ids.set(v, id);
				}
				this._goRefCounts[id]++;
				let typeFlag = 1n;
				switch (typeof v) {
					case "string":
						typeFlag = 2n;
						break;
					case "symbol":
						typeFlag = 3n;
						break;
					case "function":
						typeFlag = 4n;
						break;
				}
				return id | ((nanHead | typeFlag) << 32n);
			}

			const storeValue = (addr, v) => {
				let v_ref = boxValue(v);
				mem().setBigUint64(addr, v_ref, true);
			}

			const loadSlice = (array, len, cap) => {
				return new Uint8Array(this._inst.exports.memory.buffer, array, len);
			}

			const loadSliceOfValues = (array, len, cap) => {
				const a = new Array(len);
				for (let i = 0; i < len; i++) {
					a[i] = loadValue(array + i * 8);
				}
				return a;
			}

			const loadString = (ptr, len) => {
				return decoder.decode(new DataView(this._inst.exports.memory.buffer, ptr, len));
			}

			const timeOrigin = Date.now() - performance.now();
			const wasi_EBADF = 8;
			const wasi_ENOSYS = 52;
			this.importObject = {
				wasi_snapshot_preview1: {
					// https://github.com/WebAssembly/WASI/blob/snapshot-01/phases/snapshot/docs.md
					fd_write: function(fd, iovs_ptr, iovs_len, nwritten_ptr) {
						let nwritten = 0;
						if (fd == 1) {
							for (let iovs_i=0; iovs_i<iovs_len;iovs_i++) {
								let iov_ptr = iovs_ptr+iovs_i*8; // assuming wasm32
								let ptr = mem().getUint32(iov_ptr + 0, true);
								let len = mem().getUint32(iov_ptr + 4, true);
								nwritten += len;
								for (let i=0; i<len; i++) {
									let c = mem().getUint8(ptr+i);
									if (c == 13) { // CR
										// ignore
									} else if (c == 10) { // LF
										// write line
										let line = decoder.decode(new Uint8Array(logLine));
										logLine = [];
										console.log(line);
									} else {
										logLine.push(c);
									}
								}
							}
						} else {
							console.error('invalid file descriptor:', fd);
						}
						mem().setUint32(nwritten_ptr, nwritten, true);
						return 0;
					},
					fd_read: () => wasi_ENOSYS,
					fd_close: () => wasi_ENOSYS,
					fd_fdstat_get: () => wasi_ENOSYS,
					fd_prestat_get: () => wasi_EBADF, // wasi-libc relies on this errno value
					fd_prestat_dir_name: () => wasi_ENOSYS,
					fd_seek: () => wasi_ENOSYS,
					path_open: () => wasi_ENOSYS,
					proc_exit: (code) => {
						this.exited = true;
						this.exitCode = code;
						this._resolveExitPromise();
						throw wasmExit;
					},
					random_get: (bufPtr, bufLen) => {
						crypto.getRandomValues(loadSlice(bufPtr, bufLen));
						return 0;
					},
				},
				gojs: {
					// func ticks() int64
					"runtime.ticks": () => {
						return BigInt((timeOrigin + performance.now()) * 1e6);
					},

					// func sleepTicks(timeout int64)
					"runtime.sleepTicks": (timeout) => {
						// Do not sleep, only reactivate scheduler after the given timeout.
						setTimeout(() => {
							if (this.exited) return;
							try {
								this._inst.exports.go_scheduler();
							} catch (e) {
								if (e !== wasmExit) throw e;
							}
						}, Number(timeout)/1e6);
					},

					// func finalizeRef(v ref)
					"syscall/js.finalizeRef": (v_ref) => {
						// Note: TinyGo does not support finalizers so this is only called
						// for one specific case, by js.go:jsString. and can/might leak memory.
						const id = v_ref & 0xffffffffn;
						if (this._goRefCounts?.[id] !== undefined) {
							this._goRefCounts[id]--;
							if (this._goRefCounts[id] === 0) {
								const v = this._values[id];
								this._values[id] = null;
								this._ids.delete(v);
								this._idPool.push(id);
							}
						} else {
							console.error("syscall/js.finalizeRef: unknown id", id);
						}
					},

					// func stringVal(value string) ref
					"syscall/js.stringVal": (value_ptr, value_len) => {
						value_ptr >>>= 0;
						const s = loadString(value_ptr, value_len);
						return boxValue(s);
					},

					// func valueGet(v ref, p string) ref
					"syscall/js.valueGet": (v_ref, p_ptr, p_len) => {
						let prop = loadString(p_ptr, p_len);
						let v = unboxValue(v_ref);
						let result = Reflect.get(v, prop);
						return boxValue(result);
					},

					// func valueSet(v ref, p string, x ref)
					"syscall/js.valueSet": (v_ref, p_ptr, p_len, x_ref) => {
						const v = unboxValue(v_ref);
						const p = loadString(p_ptr, p_len);
						const x = unboxValue(x_ref);
						Reflect.set(v, p, x);
					},

					// func valueDelete(v ref, p string)
					"syscall/js.valueDelete": (v_ref, p_ptr, p_len) => {
						const v = unboxValue(v_ref);
						const p = loadString(p_ptr, p_len);
						Reflect.deleteProperty(v, p);
					},

					// func valueIndex(v ref, i int) ref
					"syscall/js.valueIndex": (v_ref, i) => {
						return boxValue(Reflect.get(unboxValue(v_ref), i));
					},

					// valueSetIndex(v ref, i int, x ref)
					"syscall/js.valueSetIndex": (v_ref, i, x_ref) => {
						Reflect.set(unboxValue(v_ref), i, unboxValue(x_ref));
					},

					// func valueCall(v ref, m string, args []ref) (ref, bool)
					"syscall/js.valueCall": (ret_addr, v_ref, m_ptr, m_len, args_ptr, args_len, args_cap) => {
						const v = unboxValue(v_ref);
						const name = loadString(m_ptr, m_len);
						const args = loadSliceOfValues(args_ptr, args_len, args_cap);
						try {
							const m = Reflect.get(v, name);
							storeValue(ret_addr, Reflect.apply(m, v, args));
							mem().setUint8(ret_addr + 8, 1);
						} catch (err) {
							storeValue(ret_addr, err);
							mem().setUint8(ret_addr + 8, 0);
						}
					},

					// func valueInvoke(v ref, args []ref) (ref, bool)
					"syscall/js.valueInvoke": (ret_addr, v_ref, args_ptr, args_len, args_cap) => {
						try {
							const v = unboxValue(v_ref);
							const args = loadSliceOfValues(args_ptr, args_len, args_cap);
							storeValue(ret_addr, Reflect.apply(v, undefined, args));
							mem().setUint8(ret_addr + 8, 1);
						} catch (err) {
							storeValue(ret_addr, err);
							mem().setUint8(ret_addr + 8, 0);
						}
					},

					// func valueNew(v ref, args []ref) (ref, bool)
					"syscall/js.valueNew": (ret_addr, v_ref, args_ptr, args_len, args_cap) => {
						const v = unboxValue(v_ref);
						const args = loadSliceOfValues(args_ptr, args_len, args_cap);
						try {
							storeValue(ret_addr, Reflect.construct(v, args));
							mem().setUint8(ret_addr + 8, 1);
						} catch (err) {
							storeValue(ret_addr, err);
							mem().setUint8(ret_addr+ 8, 0);
						}
					},

					// func valueLength(v ref) int
					"syscall/js.valueLength": (v_ref) => {
						return unboxValue(v_ref).length;
					},

					// valuePrepareString(v ref) (ref, int)
					"syscall/js.valuePrepareString": (ret_addr, v_ref) => {
						const s = String(unboxValue(v_ref));
						const str = encoder.encode(s);
						storeValue(ret_addr, str);
						mem().setInt32(ret_addr + 8, str.length, true);
					},

					// valueLoadString(v ref, b []byte)
					"syscall/js.valueLoadString": (v_ref, slice_ptr, slice_len, slice_cap) => {
						const str = unboxValue(v_ref);
						loadSlice(slice_ptr, slice_len, slice_cap).set(str);
					},

					// func valueInstanceOf(v ref, t ref) bool
					"syscall/js.valueInstanceOf": (v_ref, t_ref) => {
 						return unboxValue(v_ref) instanceof unboxValue(t_ref);
					},

					// func copyBytesToGo(dst []byte, src ref) (int, bool)
					"syscall/js.copyBytesToGo": (ret_addr, dest_addr, dest_len, dest_cap, src_ref) => {
						let num_bytes_copied_addr = ret_addr;
						let returned_status_addr = ret_addr + 4; // Address of returned boolean status variable

						const dst = loadSlice(dest_addr, dest_len);
						const src = unboxValue(src_ref);
						if (!(src instanceof Uint8Array || src instanceof Uint8ClampedArray)) {
							mem().setUint8(returned_status_addr, 0); // Return "not ok" status
							return;
						}
						const toCopy = src.subarray(0, dst.length);
						dst.set(toCopy);
						mem().setUint32(num_bytes_copied_addr, toCopy.length, true);
						mem().setUint8(returned_status_addr, 1); // Return "ok" status
					},

					// copyBytesToJS(dst ref, src []byte) (int, bool)
					// Originally copied from upstream Go project, then modified:
					//   https://github.com/golang/go/blob/3f995c3f3b43033013013e6c7ccc93a9b1411ca9/misc/wasm/wasm_exec.js#L404-L416
					"syscall/js.copyBytesToJS": (ret_addr, dst_ref, src_addr, src_len, src_cap) => {
						let num_bytes_copied_addr = ret_addr;
						let returned_status_addr = ret_addr + 4; // Address of returned boolean status variable

						const dst = unboxValue(dst_ref);
						const src = loadSlice(src_addr, src_len);
						if (!(dst instanceof Uint8Array || dst instanceof Uint8ClampedArray)) {
							mem().setUint8(returned_status_addr, 0); // Return "not ok" status
							return;
						}
						const toCopy = src.subarray(0, dst.length);
						dst.set(toCopy);
						mem().setUint32(num_bytes_copied_addr, toCopy.length, true);
						mem().setUint8(returned_status_addr, 1); // Return "ok" status
					},
				}
			};

			// Go 1.20 uses 'env'. Go 1.21 uses 'gojs'.
			// For compatibility, we use both as long as Go 1.20 is supported.
			this.importObject.env = this.importObject.gojs;
		}

		async run(instance) {
			this._inst = instance;
			this._values = [ // JS values that Go currently has references to, indexed by reference id
				NaN,
				0,
				null,
				true,
				false,
				global,
				this,
			];
			this._goRefCounts = []; // number of references that Go has to a JS value, indexed by reference id
			this._ids = new Map();  // mapping from JS values to reference ids
			this._idPool = [];      // unused ids that have been garbage collected
			this.exited = false;    // whether the Go program has exited
			this.exitCode = 0;

			if (this._inst.exports._start) {
				let exitPromise = new Promise((resolve, reject) => {
					this._resolveExitPromise = resolve;
				});

				// Run program, but catch the wasmExit exception that's thrown
				// to return back here.
				try {
					this._inst.exports._start();
				} catch (e) {
					if (e !== wasmExit) throw e;
				}

				await exitPromise;
				return this.exitCode;
			} else {
				this._inst.exports._initialize();
			}
		}

		_resume() {
			if (this.exited) {
				throw new Error("Go program has already exited");
			}
			try {
				this._inst.exports.resume();
			} catch (e) {
				if (e !== wasmExit) throw e;
			}
			if (this.exited) {
				this._resolveExitPromise();
			}
		}

		_makeFuncWrapper(id) {
			const go = this;
			return function () {
				const event = { id: id, this: this, args: arguments };
				go._pendingEvent = event;
				go._resume();
				return event.result;
			};
		}
	}

	if (
		global.require &&
		global.require.main === module &&
		global.process &&
		global.process.versions &&
		!global.process.versions.electron
	) {
		if (process.argv.length != 3) {
			console.error("usage: go_js_wasm_exec [wasm binary] [arguments]");
			process.exit(1);
		}

		const go = new Go();
		WebAssembly.instantiate(fs.readFileSync(process.argv[2]), go.importObject).then(async (result) => {
			let exitCode = await go.run(result.instance);
			process.exit(exitCode);
		}).catch((err) => {
			console.error(err);
			process.exit(1);
		});
	}
})();
`;

// elements/system.js
var instanceID = 0;
var DEFAULT_WASM = new URL("./wanix.wasm", import.meta.url).href;
var SystemElement = class extends WanixElement {
  constructor() {
    super();
    instanceID++;
    this.instanceID = instanceID;
    this.isReady = false;
    this.debug = false;
    this._ready = new Promise((resolve) => this._wasmReady = resolve);
    this._ready.then(async () => {
      await this._setupNamespace("1", "", this.querySelectorAll(":scope > wanix-bind"));
      this.isReady = true;
      if (this.debug) {
        setupDevtools(this);
      }
      this.dispatchEvent(new CustomEvent("ready", {
        bubbles: true
      }));
    });
    this._portWrap = (port) => new Conn(port);
    this._root = null;
  }
  _setupNamespace(tid = "", baseFS = "", bindings = []) {
    throw new Error("wasm not ready");
  }
  _openPort(tid = "") {
    throw new Error("wasm not ready");
  }
  _open9P(tid = "") {
    throw new Error("wasm not ready");
  }
  // no tid means the root task
  openHandle(tid) {
    return new WanixHandle2(this._openPort(tid));
  }
  get stdin() {
    this.root.openWritable("#wanix/stdin/data");
  }
  get root() {
    if (!this._root) {
      this._root = this.openHandle();
    }
    return this._root;
  }
  get wasm() {
    if (this.hasAttribute("wasm")) {
      return new URL(this.getAttribute("wasm"), document.baseURI).href;
    } else {
      return DEFAULT_WASM;
    }
  }
  async load(buffer) {
    const wasmBytes = new Uint8Array(buffer);
    const wasmString = new TextDecoder("utf-8", { ignoreBOM: true, fatal: false }).decode(wasmBytes);
    const execScript = document.createElement("script");
    if (wasmString.includes("asyncify_start_unwind")) {
      if (this.debug) console.log("TinyGo WASM detected");
      execScript.textContent = wasm_exec_tinygo_default;
    } else {
      if (this.debug) console.log("Go WASM detected");
      execScript.textContent = wasm_exec_go_default;
    }
    document.head.appendChild(execScript);
    const go2 = new window.Go();
    go2.importObject["wanix"] = {
      getInstanceID: () => {
        return this.instanceID;
      }
    };
    WebAssembly.instantiate(wasmBytes, go2.importObject).then((obj) => {
      go2.run(obj.instance);
    });
  }
  disconnectedCallback() {
    delete window.__wanix[this.instanceID];
  }
  connectedCallback() {
    super.connectedCallback();
    if (!window.__wanix) {
      window.__wanix = {};
    }
    window.__wanix[this.instanceID] = this;
    this.debug = this.hasAttribute("debug");
    this.allowOrigins = (this.getAttribute("allow-origins") || "").split(" ");
    if (this.allowOrigins.length > 0 && this.id) {
      if (this.debug) {
        console.debug("exporting", this.id, "for", this.allowOrigins);
      }
      window.addEventListener("message", async (event) => {
        if (event.data.request != "wanix-import") return;
        if (location.hash.slice(1) != this.id) return;
        if (!this.allowOrigins.includes(event.origin) && !this.allowOrigins.includes("*")) return;
        if (this.debug) {
          console.debug("import requested for", this.id, "from", event.origin);
        }
        await this._ready;
        const p9port = await this._open9P("1");
        event.data.responder.postMessage(p9port, [p9port]);
      });
    }
    fetch(this.wasm).then((r) => r.arrayBuffer()).then(this.load.bind(this)).catch((err) => {
      console.error("Failed to load Wanix WASM", err);
      this.dispatchEvent(new CustomEvent("error", {
        detail: { error: err },
        bubbles: true
      }));
    });
  }
};
if (typeof window !== "undefined") {
  customElements.define("wanix-system", SystemElement);
}

// elements/workbench.js
var DEFAULT_ASSETS = new URL("workbench/", import.meta.url).href;
var WorkbenchElement = class extends WanixElement {
  constructor() {
    super();
    this._loaded = false;
    this._parsed = false;
    this.port = void 0;
    this.tasks = {};
  }
  get assets() {
    const raw = this.getAttribute("assets");
    if (!raw) return DEFAULT_ASSETS;
    return new URL((raw + "/").replace(/\/+$/, "/"), this.baseURI).href;
  }
  connectedCallback() {
    super.connectedCallback();
    this.style.flex = "1";
    this.style.height = "100%";
    this.style.display = "flex";
    this.style.flexDirection = "column";
    this.extension = this.getAttribute("extension") || "wanix.workbench";
    this.fsys = this.hasAttribute("fsys");
    this.debug = this.hasAttribute("debug");
    this._term = this.hasAttribute("term");
    this._sidebar = parseSidebarMode(this.getAttribute("sidebar"));
    this._welcome = this.hasAttribute("welcome");
    this._openPaths = parseOpenPaths(this.getAttribute("open"));
    this.raw = this.hasAttribute("raw");
    this.wd = this.getAttribute("wd");
    if (this.wd === "." || this.wd === "/" || !this.wd) {
      this.wd = "";
    }
  }
  async _awake() {
    this.tasks["shell"] = this.querySelector(':scope > wanix-task[role="shell"]');
    const port = await this._system._openPort();
    if (this.wd) {
      await this._system.root.waitFor(this.wd, 3e3);
    }
    this.load(() => ({ wanix: port }));
  }
  /** Load and mount the workbench. Idempotent. */
  load(portCb) {
    if (this._loaded) return;
    this._loaded = true;
    const codeDir = new URL("code/", this.assets);
    const outDir = new URL("out/", codeDir);
    const outRoot = outDir.href.replace(/\/?$/, "");
    const nls = document.createElement("script");
    nls.src = new URL("nls.messages.js", outDir).href;
    const loader = document.createElement("script");
    loader.src = new URL("vs/loader.js", outDir).href;
    const cssAlreadyLoaded = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]')).some((link) => link.href.endsWith("workbench.web.main.css"));
    if (!cssAlreadyLoaded) {
      const cssLink = document.createElement("link");
      cssLink.rel = "stylesheet";
      cssLink.href = new URL("vs/workbench/workbench.web.main.css", outDir).href;
      document.head.appendChild(cssLink);
      const style = document.createElement("style");
      style.textContent = `.xterm .xterm-viewport { background-color: rgba(0, 0, 0, 0) !important; }`;
      document.head.appendChild(style);
    }
    const runBootstrap = () => {
      const go2 = () => {
        if (typeof __require === "undefined") {
          setTimeout(go2, 0);
          return;
        }
        __require.config({ baseUrl: outRoot });
        this._createWorkbench(portCb);
      };
      go2();
    };
    loader.onload = runBootstrap;
    loader.onerror = () => this.dispatchEvent(new CustomEvent("error", { detail: new Error("Failed to load VS Code loader") }));
    document.head.appendChild(loader);
    document.head.appendChild(nls);
  }
  _createWorkbench(portCb) {
    const ch = new MessageChannel();
    this.port = ch.port2;
    this.port.onmessage = async (event) => {
      const obj = await portCb();
      const transfer = [...Object.values(obj)];
      obj["config"] = {
        term: this._term,
        raw: this.raw,
        sidebar: this._sidebar,
        ns: {
          task: this._taskpath,
          term: this._termpath
        },
        shell: {
          cmd: this.tasks["shell"]?.cmd,
          type: this.tasks["shell"]?.type,
          wd: this.tasks["shell"]?.wd || this.wd
        }
      };
      event.data.port.postMessage(obj, transfer);
    };
    const pageUrl = new URL(window.location.href);
    const scheme = pageUrl.protocol.replace(":", "");
    const hostParts = pageUrl.host.split(".");
    if (hostParts.length > 2) hostParts.shift();
    const hostJoin = hostParts.join(".");
    const codeDir = new URL("code/", this.assets);
    const outDir = new URL("out/", codeDir);
    const webviewPre = new URL(
      "vs/workbench/contrib/webview/browser/pre/",
      outDir
    );
    let webviewContentExternalBaseUrlTemplate;
    if (this.assets.origin === pageUrl.origin) {
      const pathPrefix = this.assets.pathname.replace(/\/?$/, "");
      webviewContentExternalBaseUrlTemplate = `${scheme}://{{uuid}}.${hostJoin}${pathPrefix}/out/vs/workbench/contrib/webview/browser/pre/`;
    } else {
      webviewContentExternalBaseUrlTemplate = webviewPre.href;
    }
    const configurationDefaults = {
      "window.commandCenter": false,
      "workbench.statusBar.visible": false,
      "workbench.layoutControl.enabled": false,
      "workbench.activityBar.location": "hidden",
      "workbench.tips.enabled": false,
      "workbench.welcomePage.walkthroughs.openOnInstall": false,
      "workbench.startupEditor": this._welcome ? "welcomePage" : "none",
      "editor.minimap.enabled": false
    };
    const defaultConfig = {
      configurationDefaults,
      //   "workbench.tree.indent": 12,
      //   "workbench.secondarySideBar.defaultVisibility": "visible", //"hidden",
      //   "problems.visibility": false,
      //   "workbench.startupEditor": "none",
      //   "terminal.integrated.tabs.showActions": false,
      //   "workbench.panel.opensMaximized": "always",
      developmentOptions: { logLevel: this.debug ? 2 : 0 },
      profile: buildWorkbenchProfile(this._sidebar)
    };
    __require(["vs/workbench/workbench.web.main"], async (wb) => {
      const folderUri = wb.URI.parse(`wanix:/${this.wd}`);
      await applySidebarLayout(folderUri.toString(), this._sidebar);
      const defaultLayout = buildDefaultLayout(this._sidebar, this._openPaths, wb, this.wd);
      if (defaultLayout) {
        defaultConfig.defaultLayout = defaultLayout;
      }
      const config = mergeDeep(defaultConfig, {
        additionalBuiltinExtensions: [wb.URI.parse(this.assets)],
        productConfiguration: {
          extensionEnabledApiProposals: { [this.extension]: ["ipc"] },
          webviewContentExternalBaseUrlTemplate
        },
        workspaceProvider: {
          trusted: true,
          workspace: { folderUri },
          open(workspace, options) {
            console.log("todo: handle openFolder", workspace, options);
            return Promise.resolve(true);
          }
        }
      });
      if (!config.messagePorts) {
        config.messagePorts = /* @__PURE__ */ new Map();
      }
      config.messagePorts.set(this.extension, ch.port1);
      wb.create(this, config);
    });
  }
};
customElements.define("wanix-workbench", WorkbenchElement);
var WORKBENCH_LAYOUT_SIDEBAR_HIDDEN_KEY = "workbench.sideBar.hidden";
function parseOpenPaths(value) {
  if (!value) return [];
  return value.trim().split(/\s+/).filter(Boolean);
}
function buildDefaultLayout(sidebarMode, openPaths, wb, wd) {
  const layout = {};
  if (sidebarMode === "never") {
    layout.views = [];
  }
  if (openPaths.length) {
    layout.editors = openPaths.map((path) => ({
      uri: toWanixFileUri(wb, wd, path)
    }));
  }
  if (layout.views || layout.editors) {
    layout.force = true;
    return layout;
  }
  return void 0;
}
function toWanixFileUri(wb, wd, path) {
  const normalized = path.replace(/^\/+/, "");
  const workspacePath = wd ? `${wd}/${normalized}` : normalized;
  return wb.URI.parse(`wanix:/${workspacePath}`);
}
function parseSidebarMode(value) {
  const mode = (value ?? "default").trim().toLowerCase();
  if (mode === "" || mode === "default") return "default";
  if (mode === "hidden" || mode === "never") return mode;
  return "default";
}
function hashString(s4) {
  let h = 149417;
  for (let i = 0; i < s4.length; i++) {
    h = (h << 5) - h + s4.charCodeAt(i) | 0;
  }
  return h;
}
function workspaceStorageId(folderUriString) {
  return hashString(folderUriString).toString(16);
}
function openWorkspaceStorageDb(workspaceId) {
  const dbName = `vscode-web-state-db-${workspaceId}`;
  const storeName = "ItemTable";
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
    request.onsuccess = () => resolve({ db: request.result, storeName });
  });
}
async function readWorkspaceStorageEntry(workspaceId, key) {
  const { db, storeName } = await openWorkspaceStorageDb(workspaceId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => {
      db.close();
      resolve(req.result);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}
async function writeWorkspaceStorageEntry(workspaceId, key, value) {
  const { db, storeName } = await openWorkspaceStorageDb(workspaceId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value, key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
async function applySidebarLayout(folderUriString, mode) {
  if (mode === "default") return;
  const workspaceId = workspaceStorageId(folderUriString);
  if (mode === "never") {
    await writeWorkspaceStorageEntry(workspaceId, WORKBENCH_LAYOUT_SIDEBAR_HIDDEN_KEY, "true");
    return;
  }
  const existing = await readWorkspaceStorageEntry(workspaceId, WORKBENCH_LAYOUT_SIDEBAR_HIDDEN_KEY);
  if (existing === void 0) {
    await writeWorkspaceStorageEntry(workspaceId, WORKBENCH_LAYOUT_SIDEBAR_HIDDEN_KEY, "true");
  }
}
function buildWorkbenchProfile(sidebarMode) {
  const showViewlets = sidebarMode === "default";
  return serializeWorkbenchProfile({
    name: "Default",
    contents: {
      globalState: {
        storage: {
          "workbench.explorer.views.state.hidden": [
            { id: "outline", isHidden: true },
            { id: "timeline", isHidden: true },
            { id: "workbench.explorer.openEditorsView", isHidden: true },
            { id: "workbench.explorer.emptyView", isHidden: false },
            { id: "npm", isHidden: true }
          ],
          "workbench.panel.pinnedPanels": [
            { id: "workbench.panel.markers", pinned: false, visible: false, order: 0 },
            { id: "workbench.panel.output", pinned: false, visible: false, order: 1 },
            { id: "workbench.panel.repl", pinned: true, visible: false, order: 2 },
            { id: "terminal", pinned: true, visible: false, order: 3 },
            { id: "workbench.panel.testResults", pinned: true, visible: false, order: 3 },
            { id: "refactorPreview", pinned: true, visible: false }
          ],
          "workbench.activity.pinnedViewlets2": [
            { id: "workbench.view.explorer", pinned: true, visible: showViewlets, order: 0 },
            { id: "workbench.view.search", pinned: true, visible: showViewlets, order: 1 },
            { id: "workbench.view.scm", pinned: false, visible: false, order: 2 },
            { id: "workbench.view.debug", pinned: false, visible: false, order: 3 },
            { id: "workbench.view.extensions", pinned: false, visible: false, order: 4 }
          ]
        }
      }
    }
  });
}
function serializeWorkbenchProfile(profile) {
  const { name, contents } = profile;
  const gs2 = contents.globalState;
  const storageIn = gs2.storage ?? {};
  const storageOut = {};
  for (const [key, value] of Object.entries(storageIn)) {
    storageOut[key] = typeof value === "string" ? value : JSON.stringify(value);
  }
  const globalStatePayload = { ...gs2, storage: storageOut };
  const globalStateString = JSON.stringify(globalStatePayload);
  const contentsString = JSON.stringify({ globalState: globalStateString });
  return { name, contents: contentsString };
}
function mergeDeep(a, b2) {
  if (Array.isArray(a) && Array.isArray(b2)) return [...a, ...b2];
  if (isPlainObject(a) && isPlainObject(b2)) {
    const out = { ...a };
    for (const key of Object.keys(b2)) {
      out[key] = key in a ? mergeDeep(a[key], b2[key]) : b2[key];
    }
    return out;
  }
  return b2;
}
function isPlainObject(v) {
  return v !== null && typeof v === "object" && v.constructor === Object;
}

// elements/bind.js
var BindElement = class extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.style.display = "none";
    this.dst = this.getAttribute("dst");
    this.src = this.getAttribute("src") || null;
    this.mode = this.getAttribute("mode") || "0644";
    this.union = this.getAttribute("union") || "after";
    this.type = this.getAttribute("type") || "ns";
    switch (this.type) {
      case "archive":
        this.data = new Promise((resolve, reject) => {
          fetchArchive(this.src).then((data) => {
            resolve(data);
          }).catch((err) => {
            console.error("Failed to fetch archive", this.src, err);
            reject(err);
          });
        });
        break;
      case "fetch":
      // deprecated, use "file" instead
      case "file":
        if (this.src) {
          this.data = new Promise((resolve, reject) => {
            fetch(this.src).then((resp) => {
              if (!resp.ok) {
                reject(new Error(`HTTP ${resp.status}: ${resp.statusText}`));
              }
              resolve(resp.body);
            }).catch((err) => {
              console.error("Failed to fetch", this.src, err);
              reject(err);
            });
          });
        } else {
          this.data = new Promise((resolve, reject) => {
            resolve(new Response(this.innerText.trim() + "\n").body);
          });
        }
        break;
      case "import":
        if (this.src.startsWith("ws://") || this.src.startsWith("wss://")) {
          this.import = new Promise((resolve, reject) => {
            const ws2 = new WebSocket(this.src);
            ws2.onopen = () => {
              resolve(websocketToMessagePort(ws2));
            };
          });
          break;
        }
        this.import = new Promise((resolve, reject) => {
          const iframe = document.createElement("iframe");
          iframe.style.display = "none";
          iframe.src = this.src;
          iframe.onload = () => {
            try {
              const ch = new MessageChannel();
              iframe.contentWindow.postMessage({
                request: "wanix-import",
                responder: ch.port2
              }, "*", [ch.port2]);
              ch.port1.onmessage = (event) => {
                resolve(event.data);
              };
            } catch (err) {
              reject(err);
            }
          };
          iframe.onerror = (err) => {
            reject(err);
          };
          document.body.appendChild(iframe);
        });
        break;
    }
  }
};
if (typeof window !== "undefined") {
  customElements.define("wanix-bind", BindElement);
}
async function fetchArchive(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const reader = res.body.getReader();
  const prefixChunks = [];
  let prefixLen = 0;
  const NEEDED = 512;
  while (prefixLen < NEEDED) {
    const { value, done } = await reader.read();
    if (done) break;
    prefixChunks.push(value);
    prefixLen += value.byteLength;
  }
  const prefix = new Uint8Array(prefixLen);
  let off = 0;
  for (const c of prefixChunks) {
    prefix.set(c, off);
    off += c.byteLength;
  }
  const isGzip = prefix[0] === 31 && prefix[1] === 139;
  const baseBody = new ReadableStream({
    start(controller) {
      controller.enqueue(prefix);
    },
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) controller.close();
      else controller.enqueue(value);
    },
    cancel(reason) {
      reader.cancel(reason);
    }
  });
  if (!isGzip) {
    return baseBody;
  } else {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("Gzip archives require DecompressionStream support in this browser");
    }
    return baseBody.pipeThrough(new DecompressionStream("gzip"));
  }
}
function websocketToMessagePort(ws2) {
  const { port1, port2 } = new MessageChannel();
  ws2.onmessage = (event) => {
    if (event.data instanceof Blob) {
      event.data.arrayBuffer().then((arr) => {
        const buf = new Uint8Array(arr);
        port1.postMessage(buf, [buf.buffer]);
      });
      return;
    } else {
      console.warn("Unsupported data type", event.data);
    }
  };
  ws2.onclose = () => port1.close();
  port1.onmessage = (event) => {
    ws2.send(event.data);
  };
  port1.onclose = () => {
    try {
      ws2.close();
    } catch (e) {
    }
  };
  return port2;
}

// elements/task.js
var TaskElement = class extends WanixElement {
  constructor() {
    super();
    this.rid = null;
  }
  get path() {
    if (!this.rid) {
      throw new Error("Task not allocated");
    }
    return [this._taskpath, this.rid].join("/");
  }
  connectedCallback() {
    super.connectedCallback();
    this.alias = this.getAttribute("alias") || this.getAttribute("id") || null;
    this.type = this.getAttribute("type") || "auto";
    this.role = this.getAttribute("role");
    this.cmd = this.getAttribute("cmd");
    this.env = spaceToNewline(this.getAttribute("env"));
    this.stdout = this.getAttribute("stdout");
    this.stderr = this.getAttribute("stderr");
    this.stdin = this.getAttribute("stdin");
    this.fsys = this.getAttribute("fsys");
    this._term = this.hasAttribute("term");
    this._autostart = this.hasAttribute("start");
    if (this.hasAttribute("wd")) {
      this.wd = this.getAttribute("wd");
    }
  }
  async _awake() {
    await this.allocate();
    if (this._autostart) {
      this.start();
    }
  }
  async allocate(bindElements = null) {
    if (this.rid) {
      throw new Error("Task already allocated");
    }
    this.rid = (await this._system.root.readText([this._taskpath, "new", this.type].join("/"))).trim();
    this.root = this._system.openHandle(this.rid);
    await this._system.root.writeFile([this.path, "cmd"].join("/"), this.cmd);
    if (this.env) {
      await this._system.root.writeFile([this.path, "env"].join("/"), this.env);
    }
    if (this.wd) {
      await this._system.root.writeFile([this.path, "dir"].join("/"), this.wd);
    }
    if (this.alias) {
      await this._system.root.writeFile([this.path, "alias"].join("/"), this.alias);
    }
    await this.root.bind(this.path, `${this._taskpath}/self`);
    if (this._term) {
      let dims = "";
      if (this.id) {
        const termPath = `#task/${this.id}/term`;
        const termEl = Array.from(document.querySelectorAll("wanix-term")).find((el) => el.getAttribute("path") === termPath);
        if (termEl && termEl.dataset.cols) {
          dims = `/${termEl.dataset.cols}/${termEl.dataset.rows}/${termEl.dataset.xpixel || 0}/${termEl.dataset.ypixel || 0}`;
        }
      }
      const termID = (await this._system.root.readText([this._termpath, "new" + dims].join("/"))).trim();
      this.term = [this._termpath, termID].join("/");
      await this._system.root.bind(this.term, [this.path, "term"].join("/"));
      if (this.id) {
        await this._system.root.bind(this.term, [this._taskpath, this.id, "term"].join("/"));
      }
      await this.root.bind(this.term, `${this._taskpath}/self/term`);
      const program = [this.term, "program"].join("/");
      await this.root.bind(program, [this.path, "fd/0"].join("/"));
      await this.root.bind(program, [this.path, "fd/1"].join("/"));
      await this.root.bind(program, [this.path, "fd/2"].join("/"));
    } else {
    }
    if (!bindElements) {
      bindElements = this.querySelectorAll(":scope > wanix-bind");
    }
    await this._system._setupNamespace(this.rid, this.fsys, bindElements);
  }
  async start() {
    await this._system.root.writeFile([this._taskpath, this.rid, "ctl"].join("/"), "start");
  }
};
if (typeof window !== "undefined") {
  customElements.define("wanix-task", TaskElement);
}
function spaceToNewline(input) {
  if (!input) return "";
  const tokens = [];
  let current = "";
  let inQuotes = false;
  for (const char of input) {
    if (char === "'") {
      inQuotes = !inQuotes;
    } else if (char === " " && !inQuotes) {
      if (current) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }
  if (current) tokens.push(current);
  return tokens.join("\n");
}

// elements/vm.js
var VMElement = class extends WanixElement {
  constructor() {
    super();
    this.rid = null;
    this.task = new TaskElement();
  }
  get path() {
    if (!this.rid) {
      throw new Error("VM not allocated");
    }
    return [this._vmpath, this.rid].join("/");
  }
  connectedCallback() {
    super.connectedCallback();
    this.alias = this.getAttribute("alias") || this.getAttribute("id") || null;
    this.type = this.getAttribute("type") || "v86";
    this.fsys = this.getAttribute("fsys");
    this._term = this.hasAttribute("term");
    this._autostart = this.hasAttribute("start");
    const args = [];
    ["export", "mem", "vga-mem", "hda", "hdb", "fda", "fdb", "cdrom", "boot", "bios", "acpi", "fastboot", "kernel", "initrd", "netdev", "virtfs"].forEach((attr) => {
      if (this.hasAttribute(attr)) {
        args.push(`-${attr} ${this.getAttribute(attr)}`);
      }
    });
    this.task._system = this._system;
    this.task.type = "gojs";
    if (this.hasAttribute("append")) {
      this.task.env = `VM_APPEND=${this.getAttribute("append")}
`;
    } else {
      this.task.env = "";
    }
    this.task.cmd = `#vm/${this.type}/${this.type}-vm.wasm ${args.join(" ")}`;
  }
  async _awake() {
    await this.allocate();
    if (this._autostart) {
      this.start();
    }
  }
  async allocate() {
    if (this.rid) {
      throw new Error("VM already allocated");
    }
    this.rid = (await this._system.root.readText([this._vmpath, "new", this.type].join("/"))).trim();
    if (this.id) {
      await this._system.root.writeFile([this.path, "alias"].join("/"), this.id);
    }
    this.task.env += `vm=${this.rid}
`;
    await this.task.allocate(this.querySelectorAll(":scope > wanix-bind"));
    if (this._term) {
      const termID = (await this._system.root.readText([this._termpath, "new"].join("/"))).trim();
      this.term = [this._termpath, termID].join("/");
      await this._system.root.bind(this.term, [this.path, "term"].join("/"));
      if (this.alias) {
        await this._system.root.bind(this.term, [this._vmpath, this.alias, "term"].join("/"));
      }
      await this.task.root.bind(this.term, `${this._taskpath}/self/term`);
      const program = [this.term, "program"].join("/");
      await this.task.root.bind(program, [this.task.path, "fd/0"].join("/"));
      await this.task.root.bind(program, [this.task.path, "fd/1"].join("/"));
      await this.task.root.bind(program, [this.task.path, "fd/2"].join("/"));
    }
  }
  async start() {
    await this.task.start();
    console.log("vm started", this.rid, this.id);
  }
};
if (typeof window !== "undefined") {
  customElements.define("wanix-vm", VMElement);
}

// index.ts
var WanixSocket = class {
  ws;
  waiters;
  chunks;
  isClosed;
  constructor(url) {
    this.isClosed = false;
    this.waiters = [];
    this.chunks = [];
    this.ws = new WebSocket(url);
    this.ws.binaryType = "arraybuffer";
    this.ws.onmessage = (event) => {
      const chunk = new Uint8Array(event.data);
      this.chunks.push(chunk);
      if (this.waiters.length > 0) {
        const waiter = this.waiters.shift();
        if (waiter) waiter();
      }
    };
    const onclose = this.ws.onclose;
    this.ws.onclose = (e) => {
      if (onclose) onclose.bind(this.ws)(e);
      this.close();
    };
  }
  read(p) {
    return new Promise((resolve) => {
      var tryRead = () => {
        if (this.isClosed) {
          resolve(null);
          return;
        }
        if (this.chunks.length === 0) {
          this.waiters.push(tryRead);
          return;
        }
        let written = 0;
        while (written < p.length) {
          const chunk = this.chunks.shift();
          if (chunk === null || chunk === void 0) {
            resolve(written);
            return;
          }
          const buf = chunk.slice(0, p.length - written);
          p.set(buf, written);
          written += buf.length;
          if (chunk.length > buf.length) {
            const restchunk = chunk.slice(buf.length);
            this.chunks.unshift(restchunk);
          }
        }
        resolve(written);
        return;
      };
      tryRead();
    });
  }
  write(p) {
    this.ws.send(p);
    return Promise.resolve(p.byteLength);
  }
  close() {
    if (this.isClosed) return;
    this.isClosed = true;
    this.waiters.forEach((waiter) => waiter());
    this.ws.close();
  }
};
if (typeof window !== "undefined") {
  window["WanixSocket"] = WanixSocket;
}
export {
  BindElement,
  CallBuffer,
  ConsoleStdout,
  Directory2 as Directory,
  DirectoryHandle,
  EmptyFile,
  File2 as File,
  FileHandle,
  OpenEmptyFile,
  OpenFile2 as OpenFile,
  PreopenDirectory2 as PreopenDirectory,
  SystemElement,
  TaskElement,
  TerminalElement,
  VMElement,
  WASI,
  WASIProcExit,
  WanixHandle2 as WanixHandle,
  WanixSocket,
  WorkbenchElement,
  applyPatchPollOneoff
};
/*! Bundled license information:

@xterm/xterm/lib/xterm.mjs:
@xterm/addon-fit/lib/addon-fit.mjs:
@xterm/addon-clipboard/lib/addon-clipboard.mjs:
@xterm/addon-image/lib/addon-image.mjs:
  (**
   * Copyright (c) 2014-2024 The xterm.js authors. All rights reserved.
   * @license MIT
   *
   * Copyright (c) 2012-2013, Christopher Jeffrey (MIT License)
   * @license MIT
   *
   * Originally forked from (with the author's permission):
   *   Fabrice Bellard's javascript vt100 for jslinux:
   *   http://bellard.org/jslinux/
   *   Copyright (c) 2011 Fabrice Bellard
   *)
*/
