t?0:z1=[],callCount=0,

// Low-Pass Filter w/ Resonance || Cattoadishere
lpr=lowPassResonance=(a,c,r)=>((
	call=callCount++,
	t||(z1[call+'lp6']=0,z1[call+'lp12']=0),
	ct=Math.min(c,.999),
	R=r+r/(1-ct),
	z1[call+'lp6']+=ct*(a-z1[call+'lp6']+R*(z1[call+'lp6']-z1[call+'lp12']))),
	z1[call+'lp12']+=ct*(z1[call+'lp6']-z1[call+'lp12'])
),
(lpr(t&128,[.2,.3,.3,.1,.8,.8,.8,.8,.2,.3,.3,.1,.9,.7,.5,.3][t>>13&15],.9)*('1011111011111111'[t>>12&15])/2-32+(sin(sqrt(t%8192))*128*((t>>13&3)==0)*(.9997**(t%8192))))/2+(random()-.5)*49*(t>>13&1)*(.9995**(t%8192))+lpr(random()*67,.5,.5)*(.9998**(t%16384))*(t>>14&1)