/* 1-pole filter jumpscare */
t?0:z1=[],
callCount=0,
lpf=lowPassFilter=(a,c)=>(
	call=callCount++,
	z1[call]??=0,
	z1[call]+=(a-z1[call])*c
),
hpf=highPassFilter=(a,c)=>a-lpf(a,c),
bpf=bandPassFilter=(a,hc, lc)=>hpf(lpf(a,lc), hc),
nf=notchFilter=(a,lc, hc)=>(hpf(a, hc)+lpf(a,lc))/1.75,
lbf=lowBoostFilter=(a,c,v)=>a+lpf(a,c)*v,
hbf=highBoostFilter=(a,c,v)=>a+hpf(a,c)*v,
beat=(t>>14|0),
t||(a=t=>t>0?(t*2**([[0,2,4,7,12,12,7,5,2,2,0,0,-3,-3,-5,-5],[0,2,7,9,12,12,7,5,2,2,7,7,-3,-3,5,5]][t>>17&1][t>>13&15]/12)&128)+(beat>31?abs(t*2**([0,4,12,7,2,0,-3,-5][t>>14&7]/12)%256-128)*2:floor(abs(t*2**([0,4,12,7,2,0,-3,-5][t>>14&7]/12)%256-128)/32)*32)*(beat>31?(1-t/16384%1)*2:2)*(beat>15):0),
ec=function() {
let out = 0;

for (i = 0; i<(beat>31?16:2); i++) {
out += a(t-(i*16384))/(2**i)
}

return out
},
btf=x=>x/128-1,
amb=lpf(sin(sin(t*sin(t>>12))*10)*20,.01)*2,
ae=[0,4,7,12,14,,12,7,2,2,2,4,4,4,7,4,0,0,7,2,0,-3,-3,7,7,12,12,14,14,24,24,24,24][t>>14&31],
ae=t*2**(ae/12)/4,
g=_=>btf(hpf((((ec()/2)*((beat<30)+(beat>31))+((t/4&63)+(t/4*2**([4,7,9,12][t>>17&3]/12)&63)+(t/4*2**([7,9,0,15][t>>17&3]/12)&63))*(beat>31))*(beat>31?(-t>>14&1?t/16384%1:1):1)+((sin(15*cbrt((t%32768)+1)*.4**(t/32768%1))*64+lpf(random()*256,.3)*(1-t/8192%1))*(beat>31)+lpf(random()*512,.1)*(t>>15&1)*(1-t/32768%1))*(beat>29))/3+sin(sin(t*PI/512*2**([0,4,7,[2,-3][t>>16&1]][t>>17&3]/12))*((1-t/32768%1)*2+1)+t/16384)*32*(beat>31)+(amb*2)*(beat>31),.01))+1,
[g(),g()]
///*btf(hpf(a(t),.01)/4)+1*/btf(amb*8)/3-.5