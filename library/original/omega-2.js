window.IntRandom??=(x,y)=>(
	x=min(x,y),
	y=max(x,y),
	round(random()*abs(x-y))+x
),
window.Glitch??=class{
	constructor(){
		this.min=1;
		this.max=2**15;
		this.min2=1
		this.max2=128
		this.mode=0;
		this.Func=[[
			(z,t)=>t>>t/z,
			(z,t)=>z^t,
			(z,t)=>z+t,
			(z,t)=>z|t,
			(z,t)=>t>>z,
			(z,t)=>t<<z,
			(z,t)=>z-t,
			(z,t)=>t/z,
			(z,t)=>(z-t)|z,
			(z,t)=>(z-t)|z>>(t>>12),
			(z,t)=>(z-t)|z>>(z>>12),
		],[
			(z,t,r)=>z^z>>r*z
		]];
		this.z=IntRandom(this.min,this.max)
		this.Ran=IntRandom(this.min,this.max)
		this.Ran2=IntRandom(this.min2,this.max2)
		this.Key=[IntRandom(0,this.Func[0].length-1),0]
		this.n=0;
		this.t=0;
	};
	print(){
		throw "\nz = "+this.z+";\nRan = "+this.Ran+";\nRan2 = "+this.Ran2+"\nKey = ["+this.Key+"];\n"+this.n+"th Change"
	};
	process(){
		if(this.t>=this.Ran){
			this.t=0;
			this.z=IntRandom(this.min,this.max);
			this.Ran=IntRandom(this.min,this.max);
			this.Ran2=IntRandom(this.min2,this.max2);
			this.n+=1;
			for(let j=0;j<this.Func.length;j++)this.Key[j]=IntRandom(0,this.Func[j].length-1);
			this.print();
		}
		this.t+=1;
		for(let j=0;j<this.Func.length;j++)
		if(this.mode==1)
		for(let i=0;i<this.Ran2;i++){this.z=this.Func[j].length?this.Func[j][this.Key[j]](this.z,this.t,this.Ran):this.z;}else
			this.z=this.Func[j].length?this.Func[j][this.Key[j]](this.z,this.t,this.Ran):this.z;
		return this.z
	}
},
window.ERROR??=new Glitch,
t||(ERROR.n=0,ERROR.mode=1,ERROR.max2=5,ERROR.print()),
ERROR.process()
