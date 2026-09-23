import { _list_Q, Vector, _hash_map_Q, _keyword_Q, _keyword } from "./types.js";

let gensymCounter = 0;
function gensym(prefix) {
  if (prefix) {
    return Symbol.for(`${prefix}${gensymCounter++}`);
  }
  return Symbol.for(`mac_${gensymCounter++}`);
}

const _for = (seqExprs, bodyExpr) => {
  const to_groups = (seqExprs) => {
    const exprs = new Vector(...partition(2, 2, seqExprs));
    const ret = exprs.reduce((groups, [k, v]) => {
      if (_keyword_Q(k)) {
        const popGroups = groups.slice(0, -1);
        const peekGroups = groups[groups.length - 1];
        peekGroups.push(new Vector(k, v));
        popGroups.push(peekGroups);
        return popGroups;
      } else {
        groups.push(new Vector(k, v));
        return groups;
      }
    }, new Vector());
    return ret;
  };
  const emit_bind = ([[bind, expr, ...modPairs], ...nextGroups]) => {
    const [[, nextExpr = []] = []] = nextGroups;
    const giter = gensym("iter__");
    const gxs = gensym("s__");
    const do_mod = ([[k, v] = []], ...etc) => {
      if (k === _keyword("let")) {
        return [Symbol.for("let"), v, do_mod(etc)];
      }
      if (k === _keyword("while")) {
        return [Symbol.for("when"), v, do_mod(etc)];
      }
      if (k === _keyword("when")) {
        return [
          Symbol.for("if"),
          v,
          do_mod(etc),
          [Symbol.for("recur"), [Symbol.for("rest"), gxs]],
        ];
      }
      if (nextGroups.length > 0) {
        const iterys = gensym("iterys__");
        const fs = gensym("fs__");
        return [
          Symbol.for("let"),
          new Vector(iterys, emit_bind(nextGroups), fs, [
            Symbol.for("seq"),
            [iterys, nextExpr],
          ]),
          [
            Symbol.for("if"),
            fs,
            [Symbol.for("concat"), fs, [Symbol.for('or'), [giter, [Symbol.for("rest"), gxs]], []]],
            [Symbol.for("recur"), [Symbol.for("rest"), gxs]],
          ],
        ];
      } else {
        return [
          Symbol.for("cons"),
          bodyExpr,
          [Symbol.for('or'), [giter, [Symbol.for("rest"), gxs]], new Vector()],
        ];
      }
    };
    return [
      Symbol.for("fn*"),
      giter,
      new Vector(gxs),
      [
        // TODO: replace this with `loop` to enable destructuring
        Symbol.for("loop*"),
        new Vector(gxs, gxs),
        [Symbol.for("when-first"), new Vector(bind, gxs), do_mod(modPairs)],
      ],
    ];
  };
  const iter = gensym("iter_");
  return [
    Symbol.for("let"),
    new Vector(iter, emit_bind(to_groups(seqExprs))),
    [iter, seqExprs[1]],
  ];
};

function when_let(bindings, ...body) {
  let form = bindings[0];
  let tst = bindings[1];
  let temp = gensym("when_let")
  return [Symbol.for('let'), new Vector(temp, tst),
    [Symbol.for('when'), temp,
      [Symbol.for('let'), new Vector(form, temp),
        ...body]]]
}

function when_first(bindings, ...body) {
  let x = bindings[0];
  let xs = bindings[bindings.length-1];
  let temp = gensym('when_first');
  return [Symbol.for('when-let'), new Vector(temp, [Symbol.for('seq'), xs]),
    [Symbol.for('let'), new Vector(x, [Symbol.for('first'), temp]), ...body]]
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

export const macros = new Map([
  ["for", _for],
  ["when-let", when_let],
  ["when-first", when_first]
])