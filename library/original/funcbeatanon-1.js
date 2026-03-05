SR=22050;TAU=Math.PI*2;
/*
+--+---++---+--+--+---++---++---+--+--+---++---+--+--+---++---++---+--+
|  |-8 ||-6 |  |  |-3 ||-1 || 1 |  |  | 4 || 6 |  |  | 9 || 11|| 13|  |
|  +---++---+  |  +---++---++---+  |  +---++---+  |  +---++---++---+  |
|C:-9|D:-7|E:-5|F:-4|G:-2|A:0 |B:2 |C:3 |D:5 |E:7 |F:8 |G:10|A:12|B:14|
+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
*/
chords=[
	//Fm9 Bb Gm7 C7
	[-16,-4,-1,3,6,10,13],
	[-11,1,5,8,15],
	[-14,-2,1,5,8,12],
	[-9,-2,1,3,7,10],
	//Am7 D7 Gm9 C9sus4
	[-12,-2,0,3,7,10],
	[-7,0,3,5,9,12],
	[-14,0,1,5,8,13],
	[-9,-2,1,5,8,15],
	//Fmaj9 Dm11 Gm9 C7#5
	[-16,-2,0,3,7,12],
	[-7,-2,3,7,8,15],
	[-14,0,1,5,8,12],
	[-9,-1,1,3,7,11]
];
nHz=n=>432*2**(n/12);
mod=(n,m)=>(n%m+m)%m;fract=x=>(x%1+1)%1;
//bumps (x:(from -1 to 1),y:(0 to 1 to 0))
bump=x=>Math.abs(x)<1?Math.exp(1-1/(1-x**2)):0;
bumpCos=x=>Math.abs(x)<=1?(1+Math.cos(Math.PI*x))*.5:0;
randRange=(a,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
chooseRand=arr=>arr[Math.floor(Math.random()*arr.length)];
modWrap=(x,a,b)=>a+mod(x-a,b-a);
makeSynth=(()=>{
	let bumps=[],phase=0;
	for(let i=0;i<8;i++){
		bumps.push({
			at:randRange(1), //at x (0 to 1)
			m:randRange(-1,1), //multiply
			lp:randRange(1),ls:randRange(.1,1), //for volume and speed: LFO phase, LFO speed
			vx:randRange(-1,1)*2.5, //x velocity
			w:randRange(.2,.4), //width
			f:chooseRand([bump,bumpCos])
		});
	}
	return freq=>{
		phase=fract(phase+(freq/SR));
		let sum=0;
		for(let i=0;i<bumps.length;i++){
			let b=bumps[i],
			    cur=b.f((phase-b.at)/b.w),
			    bef=b.f(((phase-b.at)+1)/b.w),aft=b.f(((phase-b.at)-1)/b.w);
			b.at=fract(b.at+((b.vx*Math.cos(b.lp*TAU))/SR));
			b.lp=fract(b.lp+(b.ls/SR));
			sum+=(bef+cur+aft)*b.m*Math.sin(b.lp*TAU);
		}
		return tanh(sum/2);
	};
});
chords=chords.map(a=>a.flatMap(v=>[v,v+randRange(-1,1)*.2,v+randRange(-1,1)*.2-12]));
makeSong=()=>{
	let mS=[];
	for(let len=Math.max(...chords.map(a=>a.length)),i=0;i<len;i++)
	mS.push([makeSynth(),makeSynth()]);
	return t=>{
		let m=[0,0],c=chords[mod(floor(t/2),chords.length)];
		for(let i=0;i<c.length;i++){
			m[0]+=mS[i][0](nHz(c[i]-12)+cos(t*25)*2);
			m[1]+=mS[i][1](nHz(c[i]-12)+sin(t*25)*2);
		}
		return[
			m[0]*.12*(abs(sin((t/2)*PI))**.8),
			m[1]*.12*(abs(sin((t/2)*PI))**.8)
		];
	};
};
mS=[makeSong(),makeSong()];
return t=>{
	let r=[mS[0](t),mS[1](t-.75)];
	return[r[0][0]+r[1][0],r[0][1]-r[1][1]];
};
