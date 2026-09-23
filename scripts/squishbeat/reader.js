import { _keyword, _assoc_BANG, Vector, _set, Ratio } from "./types.js";

export class BlankException extends Error {}

class Reader {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
  }
  next() {
    return this.tokens[this.position++];
  }
  peek() {
    return this.tokens[this.position];
  }
}

function tokenize(str) {
  const re =
    /[\s,]*(~@|#{|[\[\]{}()'`~^@]|"(?:\\.|[^\\"])*"?|;.*|[^\s\[\]{}('"`,;)]*)/g;
  let match = null;
  let results = [];
  while ((match = re.exec(str)[1]) != "") {
    if (match[0] === ";") {
      continue;
    }
    results.push(match);
  }
  return results;
}

const int_pattern =
  /^([-+]?)(?:(0)|([1-9][0-9]*)|0[xX]([0-9A-Fa-f]+)|0([0-7]+)|([1-9][0-9]?)[rR]([0-9A-Za-z]+)|0[0-9]+)(N)?$/;
const float_pattern = /^([-+]?[0-9]+(\.[0-9]*)?([eE][-+]?[0-9]+)?)(M)?$/;

function matchInt(s) {
  const m = s.match(int_pattern);
  if (m[2]) {
    return 0;
  }
  let a;
  if (m[3]) {
    a = [m[3], 10];
  } else if (m[4]) {
    a = [m[4], 16];
  } else if (m[5]) {
    a = [m[5], 8];
  } else if (m[7]) {
    a = [m[7], parseInt(m[6])];
  } else {
    a = [null, null];
  }
  const n = a[0];
  let bn = parseInt(n, a[1]);
  if (m[1] === "-") {
    bn = bn * -1;
  }
  return bn;
}

function matchFloat(s) {
  const m = s.match(float_pattern);
  if (m[4]) {
    return parseFloat(m[1]);
  } else {
    return parseFloat(s);
  }
}

function char_code(ch, base) {
  const code = parseInt(ch, base);
  if (isNaN(code)) {
    return -1;
  } else {
    return code;
  }
}

function read_unicode_char(token, offset, length, base) {
  const l = offset + length;
  let uc = 0;
  for (let i = offset; i < l + 1; i++) {
    if (i === l) {
      return String.fromCharCode(uc);
    }
    let d = char_code(token[i], base);
    if (d === -1) {
      throw new Error("Invalid Unicode digit '" + token[i] + "' in " + token);
    }
    uc = uc * base + d;
  }
}

function read_char(s) {
  if (s.length === 2) {
    return s[1];
  } else if (s[1] === "u") {
    return read_unicode_char(s.slice(1), 1, 4, 16);
  } else if (s[1] === "o") {
    return read_unicode_char(s.slice(1), 1, s.length - 2, 8);
  } else if (s === "\\newline") {
    return "\\n";
  } else if (s === "\\space") {
    return " ";
  } else if (s === "\\tab") {
    return "\\t";
  } else if (s === "\\backspace") {
    return "\\b";
  } else if (s === "\\formfeed") {
    return "\\f";
  } else if (s === "\\return") {
    return "\\r";
  } else {
    throw new Error("Unsupported character: '" + s + "'");
  }
}

function read_atom(reader) {
  const token = reader.next();
  //console.log("read_atom:", token)
  if (token.match(int_pattern)) {
    return matchInt(token); // integer
  } else if (token.match(/^([-+]?[0-9]+)\/([0-9]+)$/)) {
        return new Ratio(token.split('/'))
  } else if (token[0] === "\\") {
    return read_char(token);
  } else if (token.match(float_pattern)) {
    return matchFloat(token); // float
  } else if (token.match(/^"(?:\\.|[^\\"])*"$/)) {
    return token
      .slice(1, token.length - 1)
      .replace(/\\(.)/g, (_, c) => (c === "n" ? "\n" : c));
  } else if (token[0] === '"') {
    throw new Error("expected '\"', got EOF");
  } else if (token[0] === ":") {
    return _keyword(token.slice(1));
  } else if (token === "nil") {
    return null;
  } else if (token === "true") {
    return true;
  } else if (token === "false") {
    return false;
  } else {
    return Symbol.for(token); // symbol
  }
}

// read list of tokens
function read_list(reader, start, end) {
  start = start || "(";
  end = end || ")";
  var ast = [];
  var token = reader.next();
  if (token !== start) {
    throw new Error("expected '" + start + "'");
  }
  while ((token = reader.peek()) !== end) {
    if (!token) {
      throw new Error("expected '" + end + "', got EOF");
    }
    ast.push(read_form(reader));
  }
  reader.next();
  return ast;
}

// read vector of tokens
function read_vector(reader) {
  return Vector.from(read_list(reader, "[", "]"));
}

// read hash-map key/value pairs
function read_hash_map(reader) {
  const hm = _assoc_BANG({}, ...read_list(reader, "{", "}"));
  return hm;
}

// read set
function read_set(reader) {
  var lst = read_list(reader, "#{", "}");
  return _set.apply(null, lst);
}

function read_form(reader) {
  var token = reader.peek();
  switch (token) {
    // reader macros/transforms
    case ";":
      return null; // Ignore comments
    case "'":
      reader.next();
      return [Symbol.for("quote"), read_form(reader)];
    case "`":
      reader.next();
      return [Symbol.for("quasiquote"), read_form(reader)];
    case "~":
      reader.next();
      return [Symbol.for("unquote"), read_form(reader)];
    case "~@":
      reader.next();
      return [Symbol.for("splice-unquote"), read_form(reader)];
    case "^":
      reader.next();
      var meta = read_form(reader);
      return [Symbol.for("with-meta"), read_form(reader), meta];
    case "@":
      reader.next();
      return [Symbol.for("deref"), read_form(reader)];
    case "#":
      reader.next();
      return [Symbol.for("dispatch"), read_form(reader)];

    // list
    case ")":
      throw new Error("unexpected ')'");
    case "(":
      return read_list(reader);

    // vector
    case "]":
      throw new Error("unexpected ']'");
    case "[":
      return read_vector(reader);

    // set
    case "#{":
      return read_set(reader);

    // hash-map
    case "}":
      throw new Error("unexpected '}'");
    case "{":
      return read_hash_map(reader);

    // atom
    default:
      return read_atom(reader);
  }
}

export function read_str(str) {
  var tokens = tokenize(str);
  if (tokens.length === 0) {
    throw new BlankException();
  }
  const form = read_form(new Reader(tokens));
  return form;
}

const input = '{:key "value"}';

//console.log(read_str(input))
