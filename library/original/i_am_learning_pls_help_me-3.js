// only sounds good in 22.05kHz - 48kHz
// 48kHz: $1DECH41N
// 44.1kHz: $1DECH41N (slowed)
// 32kHz: $1DECHAIN (super slowed)
mod=1200,
m=min,
n=max,
p=32,
q=256,
r=255,
u=mod*4,
c=16,
d=64,
e=80,
h=128,
g=127,
i=q/3,
ka=[8,8,8,8,8,8,4,4,
    8,8,8,8,8,8,4,2,
    4,4,4,4,4,4,4,2,
    4,4,4,4,4,4,2,1][floor(t/(u*4))%32],
b=t%(u*ka),
f=t-(mod*8),
f2=t-(mod*c),
z=NaN,
dec=(x,y)=>{return m(1,n(y/x,0))},
dec2=(x,y)=>{return m(1,n(y/(x+y),0))},
kv=dec2(b,5E3)*r,
kv2=dec2(b,5E4)*r,
V=(x,y,v)=>{return ((x/(q/v))%v)+((y/(q/(q-v)))%(q-v))},
V2=(x,v)=>{return (x/(q/v))%v},
tri=(a,v)=>((((a>>7)%2)?(a/(q/v))%v:(-(a/(q/v))%v-(q-v+1)))-v/2)*2+1,
kicktri=(d,m,v,a)=>tri(a*dec2(a*m,d),v), 
typeof lp==='function'||(lp=(a,inp)=>{lp.prev=(lp.prev||0)+a*(inp-(lp.prev||0));return lp.prev}),
wav1=m=>V2(t*2**([-10,-8,-6,-11][floor(t/mod/(p*2))%4]/12)*m,i),
wav2=wav1(1)+wav1(0.5)+wav1(1/4),
wav3=V2(t*2**([8,9,16,8,9,18,11,9][floor(t/mod/(p/4))%c]/12)>>0,i),
wav4=V2(f*2**([8,9,16,8,9,18,11,9][floor(f/mod/(p/4))%c]/12)>>0,i),
wav5=V2(f2*2**([8,9,16,8,9,18,11,9][floor(f2/mod/(p/4))%c]/12)>>0,i),
wt=t*2**([z,z,z,z,z,21,20,16][floor(t/mod/(p/4))%8]/12)*(floor(t/(mod*d))%2),
wt2=f*2**([z,z,z,z,z,21,20,16][floor(f/mod/(p/4))%8]/12)*(floor(f/(mod*d))%2),
wt3=f2*2**([z,z,z,z,z,21,20,16][floor(f2/mod/(p/4))%8]/12)*(floor(f2/(mod*d))%2),
wav6=((wt>>5<<5)&g+(wt>>5<<5)&h),
wav7=((wt2>>5<<5)&g+(wt2>>5<<5)&h),
wav8=((wt3>>5<<5)&g+(wt3>>5<<5)&h),
k=kicktri(5E3,1,kv/2,b),
b=lp((r-kv2)/r,V2(V2(wav2,e-(t%(u)+1)/u*e),r-kv)%q),
m=V2(V2(wav3,e-(t%(u)+1)/u*e),r-kv)+
V2(V2(wav4,e-(f%(u)+1)/u*e),r-kv)/2+
V2(V2(wav5,e-(f2%(u)+1)/u*e),r-kv)/4+
V2(V2(wav6,e-(t%(u)+1)/u*e),r-kv)+
V2(V2(wav7,e-(f%(u)+1)/u*e),r-kv)/2+
V2(V2(wav8,e-(f2%(u)+1)/u*e),r-kv)/4,

// RESULT (m for melody, b for bass, k for kick)
b+k+m