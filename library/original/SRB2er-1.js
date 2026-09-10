s=sin,f=floor,T=t/6e4,
n=(e)=>{a=parseInt(e,36);return pow(2,a/12)},
p=(e,d,y=256)=> {
 d=d/100,
 z=s(t/y*n(e));
 z>=d?z=1:z=-1;
 return z;
},
m=(e,r,q)=>{return sin(t/64*n(e)+sin(t/(64/r)*n(e))*q)},
i=4,h=0,T>=8?k=(T*4)%1:k=0,o=4-(T)%2*3,

T<8?T>7.75&T<8?h=sqrt(2+t*4%1.5e4):0:h=sqrt(2+t*4%6e4),
T>=7.75&T<8?i=10-((T-7.75)*24+1):i=5,
b=("CCOOCCOO".repeat(2)+"FFRFRFRQ".repeat(2)),
c=("CCFJ".repeat(32)+"FFHO".repeat(32)).repeat(4)+("AAFM".repeat(64)+"88CK".repeat(64)).repeat(2),
v=(0.2-(T*16%2)/9),v<=0?v=0:0,
x=(0.1-((T*8+2)%4)/16)/2,x<=0?x=0:0,
(m("E",1,o)+m("H",1,o)+m("J",1,o))*(k/10)+
p(b[f(T*4)%b.length],50)*v+p(c[f(T*128)%c.length],90,16)*x+random(t)*x*2+(sin(h+sin(h*2)*(h-(h/1.01)))/i)