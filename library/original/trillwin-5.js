Song = function(t, m) {
var S = sin;
var T = tan;
var A = atan;
var U = sqrt;
var P = pow;
var R = random();

var j = m ? 1.005 : .995;

function decay(a, r) {
return P(a, (t % r))
};
function melody(a, s) {
return t * j * 2 ** (a[(t >> s) % a["length"]] / 12)
};
function reverberate(a, b, c, v) {
return (t ? 0 : f = new Float32Array(x = b), L = a % 256 + f[t % x], f[t % x] = L / c, L / v)
};
function lpf(a, c) {
this.r ??= 0;
return r += (a - r) * c
};
return reverberate(A(4 * S(melody((Q = [0, 3, 5, 7, 8, 7, 10, 7]), 14) * (t & 131072 ? 1 + (t >> 13 & 1) : 1) / 128 * PI)) * decay(.9999, (t & 131072 ? 8192 : 16384)), 12288, 1.7, 3) / 2 + (T(S(3 * U(t % 16384))) * decay(.999, [8192, 12288, 16384, 12288][t >> 15 & 3])) + ((R - .5) * decay(.999, [16384, 20480, 12288, 12288][t >> 15 & 3])) + reverberate(lpf(A(T(melody(Q, 14) / 128 * PI)), .1) / 4 * decay (.9999, 16384), 12288, 1.6, 1) + (((reverberate((t & 2 ? .2 : -.5) * decay(.9999, 16384), 12288, 1.7, 2))) * (t / 262144 & 1))
},
[Song(t, 0), Song(t, 1)];