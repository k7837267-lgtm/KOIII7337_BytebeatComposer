time = t/48000,

TotPitch = 23,


Synth1 = function(speed){
const pitch = TotPitch

var index = (x)=>(x*time*48000);

	melo=function(){



return NOTES1 = [1,3,2,3,5,4,3,6,1,2.5,1,2.25,3,2,4,0.75][(t>>15/speed*1)%16],
melocode = index(NOTES1*pitch/60)&index(NOTES1*pitch/60)%255
};


/* how this works is that you have to put in x*time*48000 for it to work
*/


return melo()/1e3},


Synth2 = function(speed){
const pitch = TotPitch

var index = (x)=>(x*time*48000);

	melo=function(){



return NOTES1 = [1,3,2,3,5,4,3,6,1,2.5,1,2.25,3,2,4,0.75][(t>>15/speed*1)%16],
melocode = index(NOTES1*pitch/60)&index(NOTES1*pitch/60)%127*4
};


/* how this works is that you have to put in x*time*48000 for it to work
*/


return melo()/1e3},

Synth3 = function(speed){
const pitch = TotPitch

var index = (x)=>(x*time*48000);


	melo=function(){



return NOTES1 = [1,3,2,3,5,4,3,6,1,2.5,1,2.25,3,2,4,0.75][(t>>15/speed*1)%16],
melocode = index(NOTES1*pitch/60)%255
};


/* how this works is that you have to put in x*time*48000 for it to work
*/


return melo()/1e3},






Synth1(1),
Synth3(1.1), 



seq = [Synth1(1),Synth1(1)+Synth2(1.05)/2,Synth1(1)+Synth2(1.05)/2+Synth3(1.1)*1.5][(t>>20)%3]*1-0.5