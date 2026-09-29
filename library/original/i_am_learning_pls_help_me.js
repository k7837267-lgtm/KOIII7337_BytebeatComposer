// pls im just an beginner
// my first attempt creating synthwave
// NOTE: This is an much cleaner version of the project.
// NOTE 2: recommended in 44.1kHz/48kHz.
// TOTAL SIZE OF: 1724B.

// CUSTOMIZABLES:

// spd/mod
m = 4000,
// transpose
tr = 0,
delgap=5000,

// CODE:
p = ((t % (m * 32)) % (m * 6)),

N5 = 51.2,
N7= 256/7,
lpa = (cos((t / (Math.PI * 13)) / (m / 2)) + 1) * 500,

dec = (x, y) => {
  return min(1, max(y / x, 0))
},

V = (x, y, v)=> {
  return ((x / (256 / v)) % v)+((y / (256 / (256 - v))) % (256 - v))
},

V2 = (x, v) => {
  return (x / (256 / v)) % v
},

typeof lp === 'function' || (lp = (a, inp) => {
  lp.prev = (lp.prev || 0) + a * (inp - (lp.prev || 0));
  return lp.prev
}),

lpvfx = (x, d, dt, am) => {
  return lp(dec(dt + (am * 100), d), V2(x, dec(dt, d) * 256))
}, 

Am7 = V2(t * 2 ** ((-21 + tr) / 12), N5)+
      V2(t * 2 ** ((-9 + tr) / 12), N5)+
      V2(t * 2 ** ((1 + tr) / 12), N5)+
      V2(t * 2 ** ((6 + tr) /12), N5)+
      V2(t * 2 ** ((10 + tr) / 12), N5),

G = V2(t * 2 ** ((-23 + tr) / 12), N5)+
    V2(t * 2 ** ((-11 + tr) / 12), N5)+
    V2(t * 2 ** ((1 + tr) / 12), N5)+
    V2(t * 2 ** ((5 + tr) / 12), N5)+
    V2(t * 2 ** ((10 + tr) / 12), N5),

FM7 = V2(t * 2 ** ((-13 + tr) / 12), N5)+
      V2(t * 2 ** ((-1 + tr) / 12), N5)+
      V2(t * 2 ** ((3 + tr) / 12), N5)+
      V2(t * 2 ** ((6 + tr) / 12), N5)+
      V2(t * 2 ** ((10 + tr) / 12), N5),

FM7_2 = V2(t * 2 ** ((-25 + tr) / 12), N7)+
        V2(t * 2 ** ((-13 + tr) / 12), N7)+
        V2(t * 2 ** ((-1 + tr) / 12), N7)+
        V2(t * 2 ** ((3 + tr) / 12), N7)+
        V2(t * 2 ** ((6 + tr) /12), N7)+
        V2(t * 2 ** ((10 + tr) / 12), N7)+
        V2(t * 2 ** ((15 + tr) / 12), N7),


lpvfx([Am7, G, FM7, FM7_2][floor(t/(m*16))%4], (500 - lpa) * 4 + 5E3, p + m, lpa)