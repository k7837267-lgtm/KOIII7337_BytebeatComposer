import {
  _list_Q,
  _keyword_Q,
  _keyword,
  Vector,
  Atom,
  _malfunc_Q,
  _hash_map_Q,
  Ratio,
  HexLiteral
} from "./types.js";

export function pr_str(obj, print_readably) {
  if (typeof print_readably === "undefined") {
    print_readably = true;
  }
  var _r = print_readably;
  if (obj.constructor.name === "HexLiteral") {
    return "0x" + obj.n.toString(16);
  }
  if (_list_Q(obj)) {
    return "[" + obj.map((e) => pr_str(e, _r)).join(" ") + "]";
  } else if (obj instanceof Vector) {
    return "[" + obj.map((e) => pr_str(e, _r)).join(" ") + "]";
  } else if (obj instanceof Ratio) {
    return obj.n + "/" + obj.d
  } else if (_hash_map_Q(obj)) {
    var ret = [];
    const entries = Object.entries(obj)
    const syms = Object.getOwnPropertySymbols(obj)
    for (const sym of syms) {
      entries.push([sym, obj[sym]])
    }
    for (let [k, v] of entries) {
      ret.push(pr_str(k, _r), pr_str(v, _r));
    }
    return "{" + ret.join(" ") + "}";
  } else if (typeof obj === "string") {
    // stupid hack to print text with newlines
    if (obj.startsWith("formattedString:")) {
      return obj.slice(16);
    }
    if (_keyword_Q(obj)) {
      return ":" + obj.slice(1);
    } else if (_r) {
      return (
        '"' +
        obj.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n") +
        '"'
      );
    } else {
      return obj;
    }
  } else if (typeof obj === "symbol") {
    return Symbol.keyFor(obj);
  } else if (_malfunc_Q(obj)) {
    if (obj.meta && Object.hasOwn(obj.meta, "ʞname")) {
      let name = obj.meta["ʞname"];
      if (typeof name === "symbol") {
        name = name.description;
      }
      return obj.ismacro ? "#macro[" + name + "]" : "#function[" + name + "]";
    } else {
      return obj.ismacro ? "#macro[]" : "#function[]";
    }
  } else if (obj === null) {
    return "nil";
  } else if (obj instanceof Atom) {
    return "(atom " + pr_str(obj.val, _r) + ")";
  } else if (_hash_map_Q(obj)) {
    var ret = [];
    for (const [key, value] of Array.from(Object.entries(obj))) {
      ret.push(pr_str(key, _r), pr_str(value, _r));
    }
    return "{" + ret.join(" ") + "}";
  } else if (typeof obj === "undefined") {
    return "undefined";
  } else {
    return obj.toString();
  }
}
