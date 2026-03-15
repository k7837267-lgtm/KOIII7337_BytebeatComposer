t||(d_buf=[]),d_fxi=0,dlayMax=1e6,dt=t,
dlay=multiTapDelay=(inp,heads,mix,fbfn=x=>x)=>{id=d_fxi++;d_buf[id]??=new Float32Array(dlayMax);feed=inp;out=0;for(let head of heads){d=d_buf[id][(dlayMax+dt-(head.t|0))%dlayMax];feed+=d*head.fb;out+=d*head.m;};d_buf[id][dt%dlayMax]=fbfn(feed);return inp*(1-mix)+out*mix;},

bpm=beatsPerMinute=140,
sr=sampleRate=24e3,
sec=second=t/sr,
ts=tSpeed=sec*(bpm/60)*16384,spb=(60/bpm)*sr,
tt=tTone=sec*256*440*2**(6/12),

saw=t=>t?((t+127.5&255)-127.5)/127.5:0,
t||(ss=supersaw=t=>{for(s=i=0;i<8;i++){let p=[2,3,5,7,11,13,17,23][i];let o=1+!(i&3);s+=t?saw(t*o*(1+p*((i&1?-.0008:.0008)/o))+p**2*71+(i&1?cos:sin)(t/2e5*p/o)*41/o):0};return s/i-(random()-.5)/(i**2);}),

a=x=>tanh((dlay(ss(tt*(x?.995:1.005)*2**(parseInt("8 FM HQJ FH E A C FM HQJCFM H O "[ts>>12&31],36)/12)/4)||0,[{t:spb*3/(x?3.9375:4.0625),m:.55,fb:.55}],.6)*1.75+(ss(tt*(x?1.005:.995)*2**(parseInt("8ACC"[ts>>15&3],36)/12)/16)*1.1+sin(tt*2**(parseInt("8ACC"[ts>>15&3],36)/12)/16*PI/128)/5)/1.2)*2),[a(0),a(1)]
