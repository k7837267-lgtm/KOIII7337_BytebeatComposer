bpm=125,sr=48e3,ts=t/sr*bpm/60*16384,tt=t/sr*256*440/4*2**(2/12),
s=t=>tanh(sin(t/2+sin(t))),
sq=t=>s(s(t*PI/128)*7)*1.3125,
ssw=(t,lr)=>((t/128%2-1)+(t/127*(lr?.995:1.004)%2-1)+(t/128*(lr?1.005:.995)%2-1))/9,
o=t=>sin(sin(t*6*PI/128)**3+sin(t*3*PI/128)**5+sin(t*2*PI/128)**7+sin(t*PI/128)**11),
x=(a,lr=1)=>(a?((a&a/(lr?1.005:.995)*(lr?1.99:2.01)*2^a/(lr?1.005:.995)*2)%256-128)/2+((a^a*2)%256-128)/2:0)/128,

T=t,thr=a=>{throw a},dsp=1,sec=0,

T||(r=round(random()*0xFFFFFFFF)),
//r=0x2c6399ce,
hex=r.toString(16).padStart(8,"0"),
i=("0x"+hex)>>(((ts>>11)^(3&ts>>13))-2&30)&15,

lr=lr=>(x(tt*[1,81/64,3/2,243/128,9/4,729/256,27/8][i%7],lr)+(ssw(tt*2,lr)+ssw(tt*81/32,lr)+ssw(tt*3,lr)))*min(1,ts/16384%1*2)**sqrt(2)+tanh("0001001100110011"[ts>>12&15]|0?sin(tt/256*PI+sin(tt/256*PI)/2)*8*(1-ts/4096%(1+!!(ts>>14&3))/2)**2:sin(23*log(ts%16384))*2*(1-ts/4096%1)*!(ts>>12&3)+sin((t*1.25>>2)**7*(lr?1.05:.95))*.9996**(ts%8192)*1.5*(ts>>14&1))*1.25,

dsp?(sec?t/sr*1e3%1:t)?[lr(0),lr(1)]:thr(`${sec?`\ns=${(floor(t/sr))}.${String(floor(t/sr*100)%100).padStart(2,"0")} thrown:`:""}\n0x${hex.toUpperCase()}`):[lr(0),lr(1)]