import {Vector, _keyword_Q, _keyword, _hash_map_Q} from "./types.js"

let gensymCounter = 0;

function gensym(prefix) {
  if (prefix) {
    return Symbol.for(`${prefix}${gensymCounter++}`);
  }
  return Symbol.for(`G_core_${gensymCounter++}`);
}

function destructureVec(bvec, b, v) {
  const gvec = gensym("vec__");
  const gseq = gensym("seq__");
  const gfirst = gensym("first__");
  const hasRest = b instanceof Vector && b.includes(Symbol.for("&"));
  let ret = new Vector(...bvec)
  ret.push(gvec, v);
  if (hasRest) {
    ret.push(gseq, gvec);
  }
  let n = 0;
  let bs = Array.isArray(b) ? [...b] : b;
  let seenRest = false;
  while (bs.length > 0) {
    const firstb = bs[0];
    if (firstb === Symbol.for("&")) {
      ret = _destructure(ret, bs[1], gseq);
      bs = bs.slice(2);
      seenRest = true;
    } else if (firstb === "ʞas") {
      return _destructure(ret, bs[1], gvec);
    } else {
      if (seenRest) {
        throw new Error(
          "Unsupported binding form, only :as can follow & parameter",
        );
      } else {
        if (hasRest) {
          ret.push(gfirst, [Symbol.for("first"), gseq], gseq, [
            Symbol.for("next"),
            gseq,
          ])
        }
        ret = _destructure(
          ret,
          firstb,
          hasRest ? gfirst : [Symbol.for("nth"), gvec, n, null],
        );
        n++;
        bs = bs.slice(1)
      }
    }
  }
  return ret;
}

function destructureMap(bvec, b, v) {
  const gmap = gensym("map__");
  const defaults = b?.[_keyword("or")] || {}
  let ret = new Vector(...bvec)
  ret.push(gmap, v);
  if (b[_keyword("as")]) {
    ret.push(b[types._keyword("as")], gmap)
  }
  const transforms = {};
  let bes = Object.keys(b)
  for (const sym of Object.getOwnPropertySymbols(b)) {
    bes.push([sym, b[sym]])
  }
  for (const mk of bes) {
    if (_keyword_Q(mk)) {
      if (mk === "ʞkeys") {
        bes = bes.filter(x => x !== "ʞkeys")
        for (const sym of b[mk])
        bes.push([sym, _keyword(Symbol.keyFor(sym))])
      }
      if (mk === "ʞstrs") {
        bes = bes.filter(x => x !== "ʞstrs")
        for (const sym of b[mk])
        bes.push([sym, Symbol.keyFor(sym)])
      }
    }
  }
  while (bes.length > 0) {
    const bb = bes[0][0]
    const bk = bes[0][1]
    const local = bb
    let bv
    if (Object.getOwnPropertySymbols(defaults).includes(local)) {
      bv = [Symbol.for("get"), gmap, bk, defaults[local]]
    } else {
      bv = [Symbol.for("get"), gmap, bk]
    }
    if (_keyword_Q(bb) || typeof bb === "symbol") {
      ret.push(local, bv)
    } else {
      ret = _destructure(ret, bb, bv)
    }
    bes.shift()
  }
  return ret
}

function _destructure(bvec, b, v) {
  if (typeof b === "symbol") {
    bvec.push(b, v)
    return bvec
  } else if (_keyword_Q(b)) {
    bvec.push(Symbol.for(b.slice(1)), v)
    return bvec
  } else if (b instanceof Vector) {
    return destructureVec(bvec, b, v)
  } else if (_hash_map_Q(b)) {
    return destructureMap(bvec, b, v)
  } else {
    return b
  }
}

export function destructure(bindings) {
  const bents = partition(2, 2, bindings)
  const processEntry = (bvec, b) => {
    return _destructure(bvec, b[0], b[1])
  }
  if (bents.map(x => x[0]).every(x => typeof x === "symbol")) {
    return bindings
  } else {
    return bents.reduce((bvec, b) => processEntry(bvec, b), new Vector())
  }
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