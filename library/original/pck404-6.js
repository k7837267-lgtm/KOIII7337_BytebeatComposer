(t==0||((floor(new Date().getTime()/250)%20)==0))&&(
r=(a,b)=>floor(a+random()*(b-a)),
ml=r(5,9)*2,
gl=r(2,6)*4,
m=new Array(ml).fill(0).map(_=>r(2,18)),
g=new Array(gl).fill(0).map(_=>r(0,3)),
b=1.2+random()*0.8,
k=1+random()*3,
w=r(62,145),
s1=r(10,14),
s2=r(11,13)
),
t*=b,
((t*m[(t>>s1)%ml]*g[(t>>s2)%gl%2])&w)
|floor(sin(sqrt(t%4096)*k))
