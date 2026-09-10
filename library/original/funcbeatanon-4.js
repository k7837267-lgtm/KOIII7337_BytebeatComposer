//(2026-08-25 12:49:35)
SR=44100;
TAU=PI*2;fract=x=>(x%1+1)%1;mod=(n,m)=>(n%m+m)%m;
clamp=(x,mn,mx)=>min(max(x,mn),mx);mix=(a,b,t)=>a+(b-a)*t;
makeArray=(n,v,norm=false)=>Array.from({length:n},(_,i)=>typeof v==="function"?v(norm?i/n:i):v);
simpleBeatLoop=t=>{
	let kick=sin(1/(fract(t)+.02))*(1-fract(t))**8*min(fract(t)/.005,1),
	    hihat=(random()+sin(t*8e3*TAU)*.2)*fract(-t*4)**5*fract(t*2),
	    snare=(random()*(sin(t*150*TAU)+1)+sin(1/((fract(t-.5)*2)+.01))*3)*(1-fract(t-.5))**12*min(fract(t-.5)/.001,1);
	return tanh(kick+hihat*.5+snare*.3);
};
class MultibandSplitter{
	constructor(count,lowFreq,highFreq,effectFactory){
		this.count=count;
		this.numFilters=count-1;
		//create state matrices to track filter integrators independently for each band path
		this.ic1eq=new Float32Array(this.numFilters*this.count);
		this.ic2eq=new Float32Array(this.numFilters*this.count);
		this.g=new Float32Array(this.numFilters);
		this.a1=new Float32Array(this.numFilters);
		this.a2=new Float32Array(this.numFilters);
		this.bands=new Float32Array(count);
		//instantiate unique user-defined effect processing blocks for each band
		this.effects=[];
		if(effectFactory)
			for(let b=0;b<this.count;b++)
				this.effects.push(effectFactory(b));
		let k=1.41421356; //Q = 0.707 for flat Butterworth splits
		//precalculate logarithmically spaced audio filters
		for(let i=0;i<this.numFilters;i++){
			let freq=lowFreq*pow(highFreq/lowFreq,i/(this.numFilters-1||1));
			this.g[i]=tan(PI*freq/SR);
			this.a1[i]=1/(1+this.g[i]*(this.g[i]+k));
			this.a2[i]=this.g[i]*this.a1[i];
		}
	}
	process(sample,time,channel=0){
		for(let b=0;b<this.count;b++){
			if(this.effects[b]){
				this.bands[b]=this.effects[b].process(sample,time,channel);
			}else{
				this.bands[b]=sample; //bypass safety fallback
			}
		}
		let output=0;
		//filter the output of each effect path through its respective band mask to confine any distortion spill or frequency overflow inside the crossover limits
		for(let b=0;b<this.count;b++){
			let currentInput=this.bands[b],
			    stateOffset=b*this.numFilters;
			for(let i=0;i<this.numFilters;i++){
				let idx=stateOffset+i,
				    v0=currentInput,
				    v1=this.a1[i]*this.ic1eq[idx]+this.a2[i]*(v0-this.ic2eq[idx]),
				    v2=this.ic2eq[idx]+this.g[i]*v1;
				this.ic1eq[idx]=2*v1-this.ic1eq[idx];
				this.ic2eq[idx]=2*v2-this.ic2eq[idx];
				if(i===b){
					output+=v2; //this specific frequency band isolated cleanly from this effect path
				}
				currentInput-=v2;
			}
			if(b===this.count-1){
				output+=currentInput; //capture the final remaining upper high frequency mask
			}
		}
		return output;
	}
}
class Delay{
	constructor(maxLen=SR,feedback=.9){
		maxLen=max(0,floor(maxLen))+1;
		Object.assign(this,{
			maxLen,curLen:maxLen-1,
			buf:new Float32Array(maxLen),
			writeAt:0,feedback
		});
	}
	changeLength(newLen){this.curLen=clamp(newLen,0,this.maxLen-1);}
	process(x){
		let readPos=mod(this.writeAt-this.curLen,this.maxLen),
		    i0=floor(readPos),i1=(i0+1)%this.maxLen,frac=readPos-i0,
		    outSamp=this.buf[i0]*(1-frac)+this.buf[i1]*frac;
		this.buf[this.writeAt]=x+outSamp*this.feedback;
		this.writeAt=(this.writeAt+1)%this.maxLen;
		return outSamp;
	}
}
class CustomEffect{
	constructor(bandIndex){
		this.bandIndex=bandIndex;
		this.delLen=SR*.1;
		this.delay=new Delay(this.delLen,.3);
	}
	process(sample,time,channel=0){
		this.delay.changeLength(mix(this.delLen*.01,this.delLen*.99,1+cos(time*4.5+this.bandIndex*3+channel*.01)*.5));
		return this.delay.process(sample);
	}
}
IS_STEREO=true;
if(IS_STEREO){
	bandProcessor=[
		new MultibandSplitter(24,100,SR/2,(index)=>new CustomEffect(index)),
		new MultibandSplitter(24,100,SR/2,(index)=>new CustomEffect(index))
	];
	return t=>{
		let input=simpleBeatLoop(t),
		    left=bandProcessor[0].process(input,t,0),
		    right=bandProcessor[1].process(input,t,1);
		return[tanh(left),tanh(right)];
	};
}else{
	bandProcessor=new MultibandSplitter(24,100,SR/2,(index)=>new CustomEffect(index));
	return t=>{
		return tanh(bandProcessor.process(simpleBeatLoop(t),t));
	};
}