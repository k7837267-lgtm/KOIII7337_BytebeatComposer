import { new_env } from "./env.js";
import { pr_str } from "./printer.js";

// Presumably allows JITs to do small-int optimizations
const MAX_INTEGER = (2**31-1)|0;

export class Node {
  constructor(body) {
    this.body = body;
  }
  eval(ctx, bindings = {}) {
    return this.body(ctx, bindings);
  }
}

export class ConstantNode {
  constructor(body) {
    this.body = body;
  }
  eval(ctx, bindings = {}) {
    return this.body;
  }
}

export function _clone(obj, new_meta) {
  let new_obj = null;
  if (_list_Q(obj)) {
    new_obj = obj.slice(0);
  } else if (obj instanceof Vector) {
    new_obj = Vector.from(obj);
  } else if (obj instanceof Map) {
    new_obj = new Map(obj.entries());
  } else if (typeof obj === "symbol") {
    new_obj = obj;
  } else if (obj.ast) {
    // function
    new_obj = obj;
  } else {
    new_obj = obj;
  }
  if (typeof new_meta !== "undefined") {
    new_obj.meta = new_meta;
  }
  return new_obj;
}

// Scalars
export function _nil_Q(a) {
  return a === null ? true : false;
}
export function _true_Q(a) {
  return a === true ? true : false;
}
export function _false_Q(a) {
  return a === false ? true : false;
}
export function _number_Q(obj) {
  return typeof obj === "number";
}
export function _string_Q(obj) {
  return typeof obj === "string" && obj[0] !== "\u029e";
}

// Functions
export function _malfunc(f, ast, env, params, meta = null, ismacro = false) {
  return Object.assign(f, { ast, env, params, meta, ismacro });
}
export const _malfunc_Q = (f) =>
  typeof f !== "undefined" && f !== null && f.ast ? true : false;

export function _function(Eval, ast, env, params) {
  var fn = function () {
    return Eval(ast, new_env(env, params, Array.from(arguments)));
  };
  fn.meta = null;
  fn.ast = ast;
  fn.gen_env = function (args) {
    return new_env(env, params, args);
  };
  fn.ismacro = false;
  return fn;
}

function findVariadic(bodies) {
  for (let i = 0; i < bodies.length; i++) {
    let hasRestParam = false;
    for (const sym of bodies[i][0]) {
      if (Symbol.keyFor(sym) === "&") {
        hasRestParam = true;
      }
    }
    if (hasRestParam) {
      return bodies[i];
    }
  }
}

function findFixedArity(arity, bodies) {
  //console.log("[findFixedArity]", pr_str(bodies, true))
  for (let i = 0; i < bodies.length; i++) {
    let hasRestParam = false;
    for (const sym of bodies[i][0]) {
      //console.log("sym", sym)
      if (Symbol.keyFor(sym) === "&") {
        hasRestParam = true;
      }
    }
    if (bodies[i][0].length === arity && !hasRestParam) {
      return bodies[i];
    }
  }
}

export function multifn(Eval, bodies, env) {
  var fn = function () {
    var arity = arguments.length;
    var body = findFixedArity(arity, bodies) || findVariadic(bodies);
    return Eval(body[1], new_env(env, body[0], Array.from(arguments)));
  };
  fn.meta = null;
  fn.multifn = true;
  fn.ast = function (args) {
    var arity = args.length;
    var ast = findFixedArity(arity, bodies) || findVariadic(bodies);
    return ast[1];
  };
  fn.gen_env = function (args) {
    var arity = args.length;
    var body = findFixedArity(arity, bodies) || findVariadic(bodies);
    return new_env(env, body[0], args);
  };
  fn.ismacro = false;
  return fn;
}

// Keywords
export const _keyword = (obj) => (_keyword_Q(obj) ? obj : "\u029e" + obj);
export const _keyword_Q = (obj) =>
  typeof obj === "string" && obj[0] === "\u029e";

// Lists
export const _list_Q = (obj) => Array.isArray(obj) && !(obj instanceof Vector);

// Vectors
export class Vector extends Array {}

// Maps
export function _assoc_BANG(obj, ...args) {
  if (args.length % 2 === 1) {
    throw new Error("Odd number of assoc arguments");
  }
  let new_obj = Object.assign({}, obj);
  for (let i = 0; i < args.length; i += 2) {
    new_obj[args[i]] = args[i + 1];
  }
  return new_obj;
}

export function _hash_map_Q(hm) {
  return (
    typeof hm === "object" &&
    !Array.isArray(hm) &&
    !(hm === null) &&
    !(hm instanceof Symbol) &&
    !(hm instanceof Set) &&
    !(hm instanceof Atom) &&
    !(hm instanceof Node) &&
    !(hm instanceof ConstantNode)
  );
}
// Sets
export function _set() {
  return new Set(arguments);
}

export function _set_Q(set) {
  return typeof set === "object" && set instanceof Set;
}

// Atoms
export class Atom {
  constructor(val) {
    this.val = val;
  }
}

// Ratios
export class Ratio {
  constructor(val) {
    this.n = val[0];
    this.d = val[1];
  }
  valueOf() {
    return Number(this["n"]) / Number(this["d"]);
  }
}

export class HexLiteral {
  constructor(n) {
    this.n = n;
  }
}