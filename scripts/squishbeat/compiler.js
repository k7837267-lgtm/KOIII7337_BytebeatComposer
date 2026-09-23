import { read_str } from "./reader.js";
import { _list_Q, Vector, _hash_map_Q, _keyword_Q } from "./types.js";
import {pr_str} from "./printer.js"
import {destructure} from "./destructure.js"
import {macros} from "./macros.js"

let gensymCounter = 0;
function gensym(prefix) {
  if (prefix) {
    return Symbol.for(`${prefix}${gensymCounter++}`);
  }
  return Symbol.for(`G__${gensymCounter++}`);
}

let recurTargets = [];

export function compileString(s) {
  let exprs = read_str(`(do ${s})`).slice(1);
  return exprs.map((expr) =>
      emit({ context: "statement", topLevel: true, indent: "" }, expr),
    ).join("\n\n");
}

function emit(env, expr) {
  if (_list_Q(expr)) {
    return emitList(env, expr);
  }
  if (_keyword_Q(expr)) {
    return emitReturn(env, `"${expr.slice(1)}"`);
  }
  if (typeof expr === "number" || typeof expr === "string" || expr === true || expr === false) {
    return emitReturn(env, pr_str(expr, true));
  }
  if (typeof expr === 'symbol') {
    return Symbol.keyFor(expr);
  }
  if (expr === null || expr === undefined) {
    return emitReturn(env, 'null');
  }
  if (_hash_map_Q(expr)) {
    let ks = []
    for (let [k, v] of Object.entries(expr)) {
      ks.push(`"${k.slice(1)}": ${emit(exprEnv(env), v)}`)
    }
    return emitReturn(env, `{${ks.join(', ')}}`)
  }
  if (expr instanceof Vector) {
    let orig_ctx = env.context;
    env.context = "expr";
    let args = emitArgs(env, expr).join(", ")
    env.context = orig_ctx;
    return emitReturn(env, `[${args}]`);
  }
  return `[emit] Unimplemened type: ${typeof expr}`;
}

function emitArgs(env, args) {
  return args.map((arg) => emit(env, arg));
}

function emitList(env, expr) {
  let fexpr = expr[0];
  // list in a list = fn call
  if (_list_Q(fexpr)) {
    env.topLevel = false;
    return emitFnCall(env, expr);
  }
  if (typeof fexpr === "symbol") {
    let headStr = Symbol.keyFor(fexpr);
    if (specialForms.has(fexpr)) {
      return emitSpecial(env, fexpr, expr);
    } else if (constructors.has(fexpr)) {
      return emitNew(env, fexpr, expr);
    } else if (infixOps.has(headStr)) {
      return emitInfix(env, expr);
    } else if (macros.has(headStr)) {
      let m = macros.get(headStr);
      let expansion = m(...expr.slice(1))
      return emit(env, expansion);
    } else if (env.class) {
      return emitMethod(env, expr);
    } else {
      return emitFnCall(env, expr);
    }
  }
  return expr;
}

const specialForms = new Set([
  Symbol.for("def"),
  Symbol.for("defn"),
  Symbol.for("set!"),
  Symbol.for("aget"),
  Symbol.for("aset"),
  Symbol.for("let"),
  Symbol.for("if"),
  Symbol.for("dec"),
  Symbol.for("inc"),
  Symbol.for("pos?"),
  Symbol.for("do"),
  Symbol.for("when"),
  Symbol.for("zero?"),
  Symbol.for("not"),
  Symbol.for("if-not"),
  Symbol.for("when-not"),
  Symbol.for("cond"),
  Symbol.for("str"),
  Symbol.for("prn"),
  Symbol.for("println"),
  Symbol.for("true?"),
  Symbol.for("false?"),
  Symbol.for("case"),
  Symbol.for("first"),
  Symbol.for("last"),
  Symbol.for("next"),
  Symbol.for("vec"),
  Symbol.for("get"),
  Symbol.for("require"),
  Symbol.for("fn*"),
  Symbol.for("fn"),
  Symbol.for("loop*"),
  Symbol.for("recur"),
  Symbol.for("nth"),
  Symbol.for("cons"),
  Symbol.for("rest"),
  //Symbol.for("seq"),
  Symbol.for("defmacro"),
  Symbol.for("quote"),
  Symbol.for("quasiquote"),
  Symbol.for("charCodeAt"),
  Symbol.for("return"),
  Symbol.for("class"),
  Symbol.for("defclass"),
  Symbol.for("constructor"),
  Symbol.for("new"),
  Symbol.for("for"),
  Symbol.for("while"),
  Symbol.for("bit-not")
]);

function emitSpecial(env, head, expr) {
  switch (head) {
    case Symbol.for("def"):
      return emitDef(env, ...expr.slice(1));
    case Symbol.for("defn"):
      if (typeof expr[2] ==='string') {   // omit docstring
        return emitDefn(env, expr[1], expr[3], ...expr.slice(4));
      } else {
        return emitDefn(env, ...expr.slice(1));
      }
    case Symbol.for("defmacro"):
      env.macro = true;
      if (typeof expr[2] ==='string') {   // omit docstring
        return emitDefn(env, expr[1], expr[3], ...expr.slice(4));
      } else {
        return emitDefn(env, ...expr.slice(1));
      }
    case Symbol.for("set!"):
      return emitSetBang(env, expr[1], expr[2]);
    case Symbol.for("aget"):
      return emitAget(env, expr[1], expr[2]);
    case Symbol.for("aset"):
      return emitAset(env, expr[1], expr[2], expr[3]);
    case Symbol.for("let"):
      return emitLet(env, expr.slice(1));
    case Symbol.for("if"):
      return emitIf(env, expr.slice(1));
    case Symbol.for("dec"):
      return emitDec(env, expr[1]);
    case Symbol.for("inc"):
      return emitInc(env, expr[1]);
    case Symbol.for("pos?"):
      return emitReturn({context: "expr"}, `0 < ${emit({context: "expr"}, expr[1])}`);
    case Symbol.for("do"):
      return emitDo(env, expr.slice(1));
    case Symbol.for("when"):
      return emitIf(env, [expr[1], [Symbol.for("do")].concat(expr.slice(2))]);
    case Symbol.for("zero?"):
      return emit(env, [Symbol.for("="), 0, ...expr.slice(1)]);
    case Symbol.for("not"):
      return emitReturn(env, `!${emit(env, ...expr.slice(1))}`);
    case Symbol.for("if-not"):
      return emitIf(env, [[Symbol.for("not"), expr[1]], ...expr.slice(2)]);
    case Symbol.for("when-not"):
      return emitIf(env, [[Symbol.for("not"), expr[1]], [Symbol.for("do")].concat(expr.slice(2))]);
    case Symbol.for("cond"):
      return emitCond(env, expr.slice(1));
    case Symbol.for("case"):
      return emitSwitch(env, expr.slice(1));
    case Symbol.for("prn"):
    case Symbol.for("println"):
      return emitPrintln({context: "expr"}, expr.slice(1))
    case Symbol.for("str"):
      return emitStr(env, expr.slice(1))
    case Symbol.for("true?"):
      return emitIsTrue(env, expr[1])
    case Symbol.for("false?"):
      return emitIsFalse(env, expr[1])
    case Symbol.for("first"):
      return emitReturn(env, `${emit(env, expr[1])}[0]`)
    case Symbol.for("last"): {
      let arr = emit(env, expr[1]);
      return emitReturn(env, `${arr}[${arr}.length-1]`)
    }
    case Symbol.for("next"):
      return emitReturn(env, `${emit(env, expr[1])}.slice(1)`)
    case Symbol.for("vec"):    // basically just a passthrough
      return emitReturn(env, `${emit(env, expr[1])}`)
    case Symbol.for("nth"):
    case Symbol.for("get"):
      return emitReturn(env, `${emit(exprEnv(env), expr[1])}[${emit(exprEnv(env), expr[2])}]`)
    case Symbol.for("require"):
      return emitRequire(env, expr.slice(1))
    case Symbol.for("fn"):
    case Symbol.for("fn*"):
      return emitFn(env, expr.slice(1));
    case Symbol.for("recur"):
      return emitRecur(env, expr.slice(1));
    case Symbol.for("loop*"):
      return emitLet(env, expr.slice(1), true);
    case Symbol.for("cons"):
      return emitCons(env, expr[1], expr[2]);
    case Symbol.for("rest"): {
      let s = emit({context: "expr"}, expr[1])
      return emitReturn(env, `${s}.slice(1) || []`);
    }
    case Symbol.for("seq"): {
      let s = emit({context: "expr"}, expr[1])
      return emitReturn(env, `(${s}.length > 0) ? ${s} : null`);
    }
    case Symbol.for("quote"):
      return `Symbol.for('${Symbol.keyFor(expr[1])}')`;
    case Symbol.for("quasiquote"):
      return emit(env, quasiquote(...expr.slice(1)))
    case Symbol.for("charCodeAt"): {
      let arg1 = emit(env, expr[1]);
      let arg2 = emit(env, expr[2]);
      return emitReturn(env, `${arg1}.charCodeAt(${arg2})`);
    }
    case Symbol.for("return"): {
      let arg = emit(env, expr[1])
      return `return ${arg}`;
    }
    case Symbol.for("class"):
    case Symbol.for("defclass"): {
      env.class = true;
      env.context = 'statement';
      if (expr[2] === Symbol.for('extends')) {
        let body = emitDo(env, expr.slice(4))
        return emitReturn(env, `class ${Symbol.keyFor(expr[1])} extends ${Symbol.keyFor(expr[3])} {\n${body}\n}`);
      } else {
        let body = emitDo(env, expr.slice(2))
        return emitReturn(env, `class ${Symbol.keyFor(expr[1])} {\n${body}\n}`);
      }
    }
    case Symbol.for("constructor"): {
      let args = commaList(emitArgs(env, expr[1]))
      let ctorEnv = {...env}
      ctorEnv.class = false;
      ctorEnv.indent += '  '
      let body = emitDo(ctorEnv, expr.slice(2))
      return emitReturn(env, `constructor${args} {\n${body}\n  }`);
    }
    case Symbol.for('new'):
      return emitNew(env, expr[1], expr.slice(1))
    case Symbol.for("for"): {
      let argv = expr[1];
      let init = emit(exprEnv(env), argv[0]);
      let initVal = emit(exprEnv(env), argv[1]);
      let cond = emit(exprEnv(env), argv[2]);
      let after = emit(exprEnv(env), argv[3]);
      env.topLevel = false;
      let body = emitDo(env, expr.slice(2));
      return `for (let ${init} = ${initVal}; ${cond}; ${after}) {\n${body}\n}`;
    }
    case Symbol.for("while"): {
      let cond = emit(exprEnv(env), expr[1]);
      let body = emitDo(env, expr.slice(2));
      return `while ${cond} {\n${body}\n}`;
    }
    case Symbol.for('bit-not'):
      return `~${emit(exprEnv(env), expr[1])}`
  }
}

function qq_loop (acc, elt) {
  if (
    _list_Q(elt) &&
    elt.length == 2 &&
    elt[0] === Symbol.for("splice-unquote")
  ) {
    return [Symbol.for("concat"), elt[1], acc];
  } else {
    return [Symbol.for("cons"), quasiquote(elt), acc];
  }
};

function quasiquote(ast) {
  if (_list_Q(ast)) {
    if (ast.length == 2 && ast[0] === Symbol.for("unquote")) {
      return ast[1];
    } else {
      return ast.reduceRight(qq_loop, []);
    }
  } else if (ast instanceof Vector) {
    return [Symbol.for("vec"), ast.reduceRight(qq_loop, [])];
  } else if (typeof ast === "symbol" || _hash_map_Q(ast)) {
    return [Symbol.for("quote"), ast];
  } else {
    return ast;
  }
};

function emitMethod(env, [fn, arglist, ...body]) {
  let orig_ctx = env.context;
  let compiledFn = emit(env, fn)
  let _args = commaList(emitArgs(env, arglist))
  env.indent += '  '
  env.class = false;
  let _body = emitDo(env, body)
  env.context = orig_ctx;
  env.indent = env.indent.slice(0, -2)
  env.class = true;
  return emitReturn(env, `${compiledFn}${_args} {\n  ${_body}\n  }`)
}

function emitCons(env, x, list) {
  let orig_ctx = env.context;
  env.context = "expr"
  let _x = emit(env, x)
  let l = emit(env, list)
  env.context = orig_ctx;
  return emitReturn(env, `[${_x}].concat(${l})`)
}

function emitFn(env, expr) {
  let topLevel = env.topLevel;
  let name = typeof expr[0] === 'symbol' ? expr[0] : null;
  if (name) expr = expr.slice(1);
  if (_list_Q(expr[0])) expr = expr[0];
  let arglist = expr[0];
  let omit = !name && env.context === "statement";
  if (!Object.hasOwn(env, "var_to_iden")) env.var_to_iden = {};
  // TODO: this will eventually map to munged version which we don't have yet
  // for now, it's needed to avoid redefining args in fn body (i.e. in let)
  arglist = arglist.map(arg => emit(exprEnv(env), arg))
  arglist.map(arg => env.var_to_iden[arg] = arg);
  let orig_ctx = env.context;
  env.context = "return"
  let body = emitDo(env, expr.slice(1));
  env.context = orig_ctx;
  env.topLevel = topLevel;
  if (env.topLevel) {
    return `return function ${name ? Symbol.keyFor(name) : ""}${commaList(arglist)}{\n${body}\n}`
  }
  return `(function ${name ? Symbol.keyFor(name) : ""}${commaList(arglist)}{\n${body}\n})`
}

function emitRequire(env, clauses) {
  let imports = [];
  for (let clause of clauses) {
    let libname = clause[1][0]
    for (let i = 1; i < clause[1].length; i+=2) {
      if (clause[1][i] === "ʞas") {
        imports.push(`import * as ${Symbol.keyFor(clause[1][i+1])} from "${libname}"`)
      }
      if (clause[1][i] === "ʞrefer") {
        let vars = clause[1][i+1].map(v => emit(env, v))
        imports.push(`import {${vars}} from "${libname}"`)
      }
    }
  }
  return imports.join('\n')
}

function emitIsTrue(env, expr) {
  let orig_ctx = env.context;
  env.context = "expr"
  let arg = emit(env, expr)
  env.context = orig_ctx;
  return emitReturn(env, `true === ${arg}`)
}

function emitIsFalse(env, expr) {
  let orig_ctx = env.context;
  env.context = "expr"
  let arg = emit(env, expr)
  env.context = orig_ctx;
  return emitReturn(env, `false === ${arg}`)
}

function emitStr(env, expr) {
  let orig_ctx = env.context;
  env.context = "expr"
  let args = [];
  for (let i = 0; i < expr.length; i++) {
    if (typeof expr[i] === 'string') {
      args.push(`"${expr[i]}"`)
    } else {
      args.push(emit(env, expr[i]))
    }
  }
  env.context = orig_ctx;
  return emitReturn(env, args.join(' + '))
}

function emitPrintln(env, expr) {
  let args = [];
  for (let i = 0; i < expr.length; i++) {
    if (typeof expr[i] === 'string') {
      args.push(`"${expr[i]}"`)
    } else {
      args.push(emit(env, expr[i]))
    }
  }
  return `console.log(${args.join(' + ')})`
}

function emitFnCall(env, [fn, ...args]) {
  let compiledFn = emit(exprEnv(env), fn)
  // dot method call - excluding spread operators
  if (compiledFn[0] === '.' && compiledFn[1] !== '.') {
    let _args = emitArgs(exprEnv(env), args);
    let target = _args.length === 1 ? _args : _args[0]
    let methodArgs = _args.length === 1 ? '()' : commaList(_args.slice(1))
    return `${env.indent}${target}${compiledFn}${methodArgs}`
  }
  let _args = commaList(emitArgs(exprEnv(env), args))
  return emitReturn(env, `${env.indent}${compiledFn}${_args}`)
}

function emitLet(enc_env, [bindings, ...body], loop) {
  enc_env.topLevel = false;
  bindings = destructure(bindings)
  let bs = bindings.filter((el, i) => i % 2 === 0);
  let freqs = bs.reduce(
    (acc, x) => (acc[x] ? acc[x]++ : (acc[x] = 1), acc),
    {},
  );
  let redefined = new Set();
  for (let sym of bs) {
    if (freqs[sym] > 1) redefined.add(sym);
  }
  let defined = new Set();
  let env = { ...enc_env };
  let var_to_iden = {...enc_env.var_to_iden};
  env.var_to_iden = var_to_iden
  env.context = "expr";
  // prevent params from being redeclared
  Object.values(var_to_iden).map(param => defined.add(Symbol.for(param)))
  let partitioned = partition(2, 2, bindings);
  let b = "";
  for (let i = 0; i < partitioned.length; i++) {
    let [l, r] = partitioned[i];
    let rhs = emit(env, r);
    //let keyword = redefined.has(l) || loop ? `let ` : `const `;
    let keyword = `let `;
    let expr = `${!defined.has(l) ? keyword : ""}${Symbol.keyFor(l)} = ${rhs};`;
    defined.add(l);
    b += expr;
    if (i < partitioned.length - 1) b += `\n  `;
  }
  b += '\n'
  let orig_recurTargets = [...recurTargets];
  if (loop) {
    b += "  while(true){\n";
    recurTargets = bs
  } 
  b += `${emitDo(enc_env, body)}`;
  recurTargets = orig_recurTargets;
  if (loop) b += "\n  break;\n}\n"
  return b;
}

function emitRecur(env, exprs) {
  let bindings = recurTargets.map(x => Symbol.keyFor(x));
  let temps = exprs.map(x => Symbol.keyFor(gensym()))
  let orig_ctx = env.context;
  if (env.recurCallback) {
    env.recurCallback(bindings)
  }
  env.context = "expr"
  let ret = ''
  for (let i = 0; i < exprs.length; i++) {
    ret += `  let ${temps[i]} = ${emit(env, exprs[i])};\n`
  }
  for (let i = 0; i < exprs.length; i++) {
    ret += `  ${bindings[i]} = ${temps[i]};\n`;
  }
  ret += "  continue;\n"
  env.context = orig_ctx;
  return ret
}

function emitIf(env, [test, then, _else]) {
  let condition = emit(exprEnv(env), test);
  let ret;
  if (env.context === "expr") {
    return `((${condition}) ? (${emit(env, then)}) : (${emit(env, _else)}))`
  } else {
    ret = `if (${condition}) {\n  ${emit(env, then)}`
    if (_else || _else === 0) ret += `\n} else  {\n  ${emit(env, _else)}`
    ret += '\n}'
    return ret
  }
}

function emitCond(env, pairs) {
  let hasFinalElse = pairs.length % 2 !== 0
  let orig_ctx = env.context;
  env.context = "expr";
  let firstCond = emit(env, pairs[0]);
  env.context = orig_ctx;
  let firstThen = emit(env, pairs[1]);
  if (env.context === "expr") {
    let compiled = `(${firstCond}) ? (${firstThen}) : `
    for (let i = 2; i < Math.floor(pairs.length/2)*2; i+=2) {
      let cond = emit(env, pairs[i])
      let then = emit(env, pairs[i+1])
      compiled += `(${cond}) ? (${then}) : `
    }
    let finalElse
    if (hasFinalElse) {
      finalElse = emit(env, pairs[pairs.length-1])
    }
    compiled += `${finalElse || null}`
    return emitReturn(env, compiled);
  }
  let compiled = `if (${firstCond}) {\n  ${firstThen}`
  for (let i = 2; i < Math.floor(pairs.length/2)*2; i+=2) {
    env.context = "expr";
    let cond = emit(env, pairs[i])
    env.context = orig_ctx;
    let then = emit(env, pairs[i+1])
    compiled += `\n} else if (${cond}) {\n  ${then}`
  }
  if (hasFinalElse) {
    let finalElse = emit(env, pairs[pairs.length-1])
    compiled += `\n} else {\n  ${finalElse}`
  }
  compiled += '\n}'
  env.context = orig_ctx;
  return compiled;
}

function emitSwitch(env, [exp, ...pairs]) {
  let orig_ctx = env.context;
  env.context = "expr";
  let testExpr = emit(env, exp);
  env.context = orig_ctx;
  let compiled = `switch (${testExpr}) {\n`
  for (let i = 0; i < pairs.length; i+=2) {
    env.context = "expr";
    let _case = emit(env, pairs[i])
    env.context = orig_ctx;
    let block = emit(env, pairs[i+1])
    compiled += `  case ${_case}: {\n    ${block}\n  break;\n}\n`
  }
  compiled += '}'
  env.context = orig_ctx;
  return compiled;
}

const constructors = new Set([
  Symbol.for("Uint8Array"),
  Symbol.for("Uint16Array"),
  Symbol.for("Float32Array")
]);

function emitNew(env, head, expr) {
  return emitReturn(env, `new ${Symbol.keyFor(head)}${commaList(emitArgs(env, expr.slice(1)))}`);
}

const infixOps = new Set([
  "+", "+=", "-", "-=", "/", "/=", "*", "*=", "&=", "|=", "**", "%", "%=", "=", "==", "===", "<", ">",
  "<=", ">=", "!=", "<<", ">>", "<<<", ">>>", "!==", "&", "|", "&&",
  "||", "xor", "not=", "instanceof", "bit-or", "bit-and", "??", "and", "or"
]);

const chainableInfixOps = new Set([
  "+", "-", "*", "/", "&", "|", "&&", "||", "bit-or", "bit-and", "??"
]);

const infixSubs = {
  [Symbol.for("=")]: "===",
  [Symbol.for("not=")]: "!==",
  [Symbol.for("xor")]: "^",
  [Symbol.for("and")]: "&&",
  [Symbol.for("or")]: "||",
}

function emitInfix(enc_env, [op, ...args]) {
  let env = {...enc_env}
  env.context = "expr";
  let l = emit(env, args[0]);
  if (chainableInfixOps.has(infixSubs[op] || Symbol.keyFor(op))) {
    let compiledArgs = args.slice(1).map(arg => emit(env, arg))
    let res = [l]
    for (let i=0; i < compiledArgs.length-1; i++) {
      res.push(infixSubs[op] || Symbol.keyFor(op), compiledArgs[i])
    }
    res.push(infixSubs[op] || Symbol.keyFor(op), compiledArgs[compiledArgs.length-1])
    return emitReturn(enc_env, `(${res.join(' ')})`);
  }
  let r;
  if (typeof args[1] === 'number') {
    r = args[1];
  } else {
    r = commaList(emitArgs(env, args.slice(1)))
  }
  return `(${l} ${infixSubs[op] || Symbol.keyFor(op)} ${r})`;
}

function commaList(coll) {
  coll = coll.map((arg) => {
    if (typeof arg === 'symbol') {
      return Symbol.keyFor(arg)
    } else {
      return arg
    }
  })
  return `(${coll.join(", ")})`;
}

function emitDef(env, ...expr) {
  let name = expr[0];
  return emitVar(env, expr);
}

function emitDefn(env, name, arglist, ...body) {
  // handle export metadata
  let meta;
  if (name[0] === Symbol.for("with-meta")) {
    meta = name[2];
    name = name[1];
  }
  if (_list_Q(arglist)) return emitMultiFn(env, meta, name, arglist, ...body);
  if (!Object.hasOwn(env, "var_to_iden")) env.var_to_iden = {};
  // TODO: this will eventually map to munged version which we don't have yet
  // for now, it's needed to avoid redefining args in fn body (i.e. in let)
  let args = arglist.map(
    (arg) => (env.var_to_iden[Symbol.keyFor(arg)] = Symbol.keyFor(arg)),
  );
  env.context = "return";
  let fnBody = emitDo(env, body);
  env.var_to_iden = {}; // clean up after
  if (env.macro) {
    let macro = new Function(...args, fnBody);
    macros.set(Symbol.keyFor(name), macro);
  } else {
    let keyword =
      meta === Symbol.for("export") ? "export function " : "function ";
    return removeBlankLines(
      `${keyword}${Symbol.keyFor(name)}${commaList(arglist)} {\n${fnBody}\n}`,
    );
  }
}

function emitMultiFn(env, meta, name, arglist, ...body) {
  env.indent = '  '
  let bodies = [arglist].concat(body);
  let varargs = false;
  let arities = bodies.map((body) => {
    if (body[0].includes(Symbol.for("&"))) {
      varargs = true;
      return "varargs";
    } else {
      return body[0].length;
    }
  });
  if (!Object.hasOwn(env, "var_to_iden")) env.var_to_iden = {};
  env.context = "return";
  env.indent = '    '
  let fnBodies = {};
  for (let body of bodies) {
    body[0].map(
      (arg) => (env.var_to_iden[Symbol.keyFor(arg)] = Symbol.keyFor(arg)),
    );
    if (body[0].includes(Symbol.for("&"))) {
      fnBodies["varargs"] = {};
      fnBodies["varargs"].arglist = body[0];
      fnBodies["varargs"].return = emitDo(env, body.slice(1));
    } else {
      fnBodies[body[0].length] = {};
      fnBodies[body[0].length].arglist = body[0];
      fnBodies[body[0].length].return = emitDo(env, body.slice(1));
    }
  }
  env.var_to_iden = {};
  let keyword =
    meta === Symbol.for("export") ? "export function " : "function ";
  let args = [];
  for (let body of bodies) {
    if (body[0].length > args.length) args = body[0];
  }
  let vararg = "";
  if (fnBodies.varargs) {
    vararg = `...${Symbol.keyFor(fnBodies.varargs.arglist[1])}`;
  }
  let f = ``;
  if (env.macro) {
    f += "switch (arguments.length) {\n";
    for (let arity of arities) {
      let argDefs = "";
      if (arity === "varargs") {
        let argDef = `let ${vararg.slice(3)} = [...arguments];\n`;
        f += `    default:\n      ${argDef}${fnBodies[arity].return}\n}`;
      } else {
        for (let i = 0; i < fnBodies[arity].arglist.length; i++) {
          let def = Symbol.keyFor(fnBodies[arity].arglist[i])
          argDefs += `\n      let ${def} = arguments[${i}]`;
        }
        f += `    case ${arity}: {      ${argDefs}\n   ${fnBodies[arity].return}\n}\n`;
      }
    }
    if (!varargs) {
      f += `    default:
      throw new Error("Invalid arity: " + arguments.length);\n}`;
    } else {
      f += "";
    }
    args = args.map((arg) => Symbol.keyFor(arg));
    let macro = new Function(...args, f);
    macros.set(Symbol.keyFor(name), macro);
  } else {
    f += `${keyword}${Symbol.keyFor(name)}(${vararg}) {\n`;
    f += "  switch (arguments.length) {\n";
    for (let arity of arities) {
      let argDefs = "";
      if (arity === "varargs") {
        f += `    default:\n${fnBodies[arity].return}\n`;
      } else {
        for (let i = 0; i < fnBodies[arity].arglist.length; i++) {
          let def = Symbol.keyFor(fnBodies[arity].arglist[i])
          argDefs += `\n      let ${def} = arguments[${i}]`;
        }
        f += `    case ${arity}: {    ${argDefs}\n${fnBodies[arity].return}\n    }\n`;
      }
    }
    if (!varargs) {
      f += `    default:
      throw new Error("Invalid arity: " + arguments.length);\n  }\n}`;
    } else {
      f += "  }\n}";
    }
    return f;
  }
}

function emitDo(env, exprs) {
  //console.log('[emitDo] indent:', env.indent.length)
  let orig_ctx = env.context;
  env.context = "statement";
  env.indent += '  '
  let bl = exprs.slice(0, -1).map(expr => emit(env, expr));
  env.context = orig_ctx;
  env.indent = env.indent.slice(0, -2)
  let l = emit(env, exprs[exprs.length-1]);
  let ret = (env.context === "return") ? `${env.indent}${l};` : `${l};`
  if (bl.length > 0) {
    return `${bl.join(';\n')};\n  ${ret};`
  } else {
    return `  ${ret};`
  }
}

function emitSetBang(env, x, val) {
  let orig_ctx = env.context
  env.context = "expr"
  let target = emit(env, x);
  let v = emit(env, val);
  env.context = orig_ctx;
  return emitReturn(env, `${env.indent || ''}${target} = ${v}`)
}

function emitAget(env, x, ...idxs) {
  let ret = emit(env, x);
  for (let arg of emitArgs(exprEnv(env), idxs)) {
    ret += `[${arg}]`
  }
  return emitReturn(env, ret)
}

function exprEnv(env) {
  let new_env = {...env};
  new_env.context = "expr";
  new_env.topLevel = false;
  new_env.indent = ''
  return new_env;
}

function emitAset(env, arr, i, val) {
  let orig_ctx = env.context
  env.context = "expr"
  let target = emit(env, arr);
  let v = emit(env, val);
  let idx = emit(env, i)
  env.context = orig_ctx;
  return `${target}[${idx}] = ${v}`
}

function emitVar(env, expr) {
  // handle export metadata
  let meta
  if (expr[0][0] === Symbol.for("with-meta")) {
    meta = expr[0][2];
    expr[0] = expr[0][1];
  }
  let keyword = meta === Symbol.for("export") ? 'export var ' : 'var '
  return `${keyword}${Symbol.keyFor(expr[0])} = ${emit(env, ...expr.slice(1))}`;
}

function emitReturn(env, s) {
  if (env.context === 'return') {
    return `return ${s}`
  } else {
    return s
  }
}

function emitDec(env, v) {
  let orig_ctx = env.context
  env.context = "expr"
  let val = emit(env, v)
  env.context = orig_ctx;
  return emitReturn(env, `(${val} - 1)`)
}

function emitInc(env, v) {
  let orig_ctx = env.context
  env.context = "expr"
  let val = emit(env, v)
  env.context = orig_ctx;
  return emitReturn(env, `(${val} + 1)`)
}

function partition(n, step, coll) {
  let s1 = coll;
  let p2 = [];
  while (s1.length > 0) {
    p2.push(s1.slice(0, n));
    s1 = s1.slice(step);
  }
  return p2;
}

function removeBlankLines(s) {
  let slines = []
  for (let line of s.split('\n')) {
    if (line !== '') slines.push(line)
  }
  return slines.join('\n')
}

