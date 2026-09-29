// copy all these formulas, i just want credit.

// a SPECIAL variable where it multiplies/speeds/pitches the WHOLE project.
// 1                           for the original,
// 1/6 or .1666666666...      for 8kHz -> 48kHz,
// 6                           for 48kHz -> 8kHz,
// 80/441 or .181405895692... for 8kHz -> 44.1kHz
// 5.5125                      for 44.1kHz -> 8kHz
// .9                          for slowed version lol
// general formula: a -> b = a/b

t*=1,



// NOTE: This is not bytebeat compatible but it is floatbeat compatible.
// NOTE 2: this is only an 32kHz/44.1kHz/48kHz project.

// EXTRA VARIABLES AND FUNCTIONS
// variables taken: HT, KT, ST, HV2, FRESB, KV, KP, KB, KD, SV, SD, O1B, OB, dec, V, V2, HV, HW, H, FKV, FK, SKT, SK, K, O1, ST2, STW1, STW2, STN1, S, RES
// if you use these variables in this project, the drum machine will may not work properly.

inp=-4+(floor(t/(2**17))%2),maj=0,arr=[-7,4,9,12],head3=(t>>>16)%2,head=((t>>13)-1)%4,head2=(t>>13)%4,tone=2**(([inp+arr[0],inp+arr[1],inp+arr[2],inp+arr[3]][head])/12),tone2=2**(([inp+arr[0],inp+arr[1],inp+arr[2],inp+arr[3]][head2])/12),tone3=2**(([inp+arr[0],inp+arr[1],inp+arr[2],inp+arr[3]][head3])/12),st=t*tone,st2=t*tone2*2,st3=t*tone3/2,inp=((st/(256/150))%150)+((st2/(256/(256-150)))%(256-150)),typeof lp==='function'||(lp=(a,inp)=>{lp.prev=(lp.prev||0)+a*(inp-(lp.prev||0));return lp.prev}),



v=100,

audiobarrierfx=(x)=>{return floor(x%2)}

// DO NOT DELETE THIS (the ,FORM= part)

,FORM=
// PASTE ANY FORMULA HERE! (only one liners ok)

((inp/(256/v))%v)+((st3/(256/(256-v)))%(256-v))


// CUSTOMIZABLES
,

MODULO=2**12,
HMODMULT=[0,0,1,0,1,1,0,0,1,1,0,0,1,0,1,0][floor(t/(MODULO*2))%16],

HT=t,
KT=(t%(MODULO*16))%(MODULO*10),
ST=(t+(MODULO*4))%(MODULO*8),

HV2=120,

FRESB=190,

// KV=158,
KV=250,
KP=12,
// KB=255,
KB=((t/(MODULO*4))>>11)%32+1,
KD=8000,

SV=150,
SD=2000,
SB=180,

O1B=128,
OB=100,





// VOL FUNCTIONS
dec=(x,y)=>{return min(1,max(y/x,0))},
V=(x,y,v)=>{return ((x/(256/v))%v)+((y/(256/(256-v)))%(256-v))},
V2=(x,v)=>{return (x/(256/v))%v},

// HI-HAT (H var is the main hat)
HV=HT%(MODULO*2**HMODMULT)+1,
HW=round(random()-abs(cos(HT/5E4)/2.5))*255,
H=V2(HW*(255/HV),HV2),

// KICK (K var is the main kick)
FKV=dec(KT,KD)*64,
FK=atan(25*cos((KT/(cbrt(KT+1)*1/KP)/(Math.PI*13))))*FKV+128,
SKT=KT/(cbrt(KT+1)*1/KP),
SK=(SKT^(SKT&128?255:0)),
K=V2(V(FK,V2(SK,floor(dec(KT,KD)*256)),KB),KV),

// K and H result
O1=V(K,H,O1B),

// SNARE (S var is the main snare)
ST2=ST/(cbrt(ST+1)*1/20),
STW1=(ST2^(ST2&128?255:0))*1,
STW2=V2(STW1,160),
STN1=random()*dec(ST2,SD)*158,
S=V2(V(V2(STW2,dec(ST2,3E3)*256),STN1*0.5,SB),SV),

// RESULT VARIABLE
RES=((V(V2(V(O1,S*2,OB),450)+32,FORM,FRESB)/128)-1),

// RESULT CONSOLE

lp((t/(2**19))%1,V2(RES,350))