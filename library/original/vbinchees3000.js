(()=>{typeof B=="undefined"&&(B={prng:31718,gs:[],buf:new
Float32Array(32768),bi:0})
rnd=function(){B.prng=(B.prng*1664525+1013904223)>>0;return(B.prng&65535)/(1<<16)}
sr=11025
tm=t/11025
out=0
out+=sin(2*PI*(3+1.5*sin(tm*.03))*tm)*.9
out+=sin(2*PI*(12+6*sin(tm*.07))*tm)*.45
out+=sin(2*PI*(24+9*sin(tm*.13))*tm)*.22,
((t&1023)==0&&rnd()>.6)&&(out+=(rnd()*2-1)*.6)
for(i=B.gs.length-1;i>=0;i--){ev=B.gs[i];age=t-ev.t0;age<0?0:age>ev.du?(B.gs.splice(i,1),0):(u=age/ev.du,env=sin(u*PI)*sin(u*PI),pitch=ev.h*(1+.6*sin(tm/2+age*.0007)),out+=sin(2*PI*pitch*(age/sr)+sin(age*.0009)/2)*env*ev.a*(1+rnd()/5))}rnd()>.9993&&B.gs.push({t0:t,du:300+(rnd()*2200),a:.6+rnd()*1.6,h:80+rnd()*800})
len=B.buf.length
d1=(.15*sr|0)%len
d2=(.62*sr|0)%len
read1=(B.bi-d1+len)%len
read2=(B.bi-d2+len)%len
fed=(B.buf[read1]*.45+B.buf[read2]*.27)
write=out*.8+fed*.35
B.buf[B.bi]=write*.92
B.bi=(B.bi+1)%len
out+=fed*.6
out=tanh(out)
out*=.8+sin(tm/50)/5
s=out/2
s=s>1?1:s<-1?-1:s
return s
})()
