i=0,t||(l=[],s1=s2=s3=s4=0,
lpf=(x,n=.9)=>( //low pass that can be used multiple times
  l[++i]??=0,
  l[i]=l[i]*n+x*(1-n),l[i]
),
hpf=(x,n=.9)=>x-lpf(x,n)), // high pass

speed=t/7000, // controls bpm in a very weird way
b=.6+(speed%1/5), // controls resonance?? i think??? i honestly forgot
pitch=512, // base pitch in a very weird way

t%(7000*12)?0:P=Math.random()*12,
p=2**(
  parseInt('027CEJQ'[0|speed%6],22)/12
)/2**(Math.round(P)/12),

t||(a=lpf(((t/pitch)%1-.5))), // btw t|| means it is declared only once you start the song. idk why i added a second one here

a=lpf(((t*p/pitch)%1-.5))
 +lpf(hpf(a,b),b)*2.2,
k=-0.78,
cut=(k/10+0.14)+(1-(speed%1))**3*(0.1),
res=3.2,

x=a-(s3*(k/2-.5)+s4*(.5-k/2))*res, // this is the feedback

s1+=(x-s1)*cut, // 4-pole whatever that means
s2+=(s1-s2)*cut,
s3+=(s2-s3)*cut,
s4+=(s3-s4)*cut,

j=32+t%10050,
d=l[j]||0,
x=tanh(s4*1.5),
l[j]=x+d*.6,
(x+d*.4)/1.5