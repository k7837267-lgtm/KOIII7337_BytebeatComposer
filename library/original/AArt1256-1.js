// fuck i have to sleep now
// by AArt1256
// funcbeat 48khz

phase_saw = [0,0,0,0,0];
phase_sq = [0,0,0,0,0];
nfreq = x => 440*2**(x/12)/48000;
lerp = (a,b,t) => a+(b-a)*t
filt_chord = [0,0,0];
distort = x => 1-((-x*2)**2);
filter_hat = [0,0,0,0]
drum_seq   = "KKHHHHHHSSHHHHHHKHHKHHKHSSHHHHKK"+"KKHHHHHHSSHHHHHHKHHKHHKHSSHHHHKK"+"KKHHHHHHSSHHHHHHKHHKHHKHSSHHHHKK"+"KKHHHHHHSSHHHHHHKHHKHHKHSSHHSHSS"
drum_chunk = "01010101010101000100100001010100"+"01010101010101000100100001010101"+"01010101010101000100100001010100"+"01010101010101000100100001010100"

duty_sweep = t => (asin(sin(t*8))+PI/2)/(1.5*PI)+0.1;

notes_sq = [
	-1e6,-6,-3,4,-1e6,-6,-3,1,-1e6,-6,-3,1,-1e6,-6,-3,4,
	-1e6,-6,-3,4,-1e6,-6,-3,1,-1e6,-6,-3,4,-1e6,6,-1,1,
	-1e6,-8,-1,4,-1e6,-8,-1,1,-1e6,-8,-1,4,-1e6,8,-1,4,
	-1e6,-6,1,4,-1e6,-6,-3,1,-1e6,-6,-3,4,-1e6,6,-1,1,
]

kick=t=>t<0.2?(t<0.008?(random()*2-1)/2:min(max(sin(cbrt(9e6*t)),-1),1)/2):0;
snare=t=>{
	s = t>0.02&&t<0.02+1/8?max(lerp(0,1,(t-0.02)*8),0)*random():0;
	s += t>=0.02+1/8&&t<0.02+1/8+1/8?max(lerp(0,1,1-((t-0.02-1/8)*8)),0)*random():0;
	s = (s**2)/2;
	s += t<0.01?(random()*2-1)/2:min(max(sin(cbrt(5e7*t)),-1),1)/2
	return t<0.3?s*1.5:0
}

hat=t=>{
	orig = filter_hat[0] = random();
	filter_hat[0] += (filter_hat[0]-filter_hat[3])*3;
	for (i=1;i<4;i++) {
		filter_hat[i] += (filter_hat[0]-filter_hat[i])/8;
	}	
	return (filter_hat[3]-orig)*exp(1-t*60);
}

bass_phase = 0;
vol_perc = 0;

t_buf = 0;
echo_len = 48000/12*4
echo_buffer = new Array(echo_len).fill(0);

return t=>{
	H = 12
	pat = floor(t/(32/H))&15;
	cur_chord = [0,2,5,9,12];
	if ((pat&3) == 1) cur_chord = [2,4,7,11,14]	
	if ((pat&3) == 2) cur_chord = [2,3,7,10,14]	
	if ((pat&3) == 3) cur_chord = [4,7,10,13,16]	

	chord = 0;
	for (i=0;i<5;i++) {
		phase_saw[i] += nfreq(4-12+cur_chord[i])
		for (d=-8;d<=8;d++) {
			detune = (1+d/800)
			f = sin(phase_saw[i]*2*detune*PI+(i+1)*d*(i+1)+sin(phase_saw[i]*4*detune*PI+(i+1)*d*(i+1)*d))
			chord += sin(phase_saw[i]*2*detune*PI+(i+1)*d*(i+1)*d+f)/80
		}
	}

	cutoff = 0.3+sin(t)/8
	res = 1
	filt_chord[0] = chord
	filt_chord[0] += res*(filt_chord[2]-filt_chord[1]),
	filt_chord[1] = lerp(filt_chord[0],filt_chord[1],cutoff),
	filt_chord[2] = lerp(filt_chord[1],filt_chord[2],cutoff),
	out = filt_chord[1]

	bass_note = ((floor(t/(2/H))&7)==6)||((floor(t/(1/H))&63)==63)?12:0
	bass_phase += nfreq([-18, -18, -20, -11][pat&3]-12+bass_note)
	bass_env = (0.9+((t%(2/H))/(1/H)))
	if (bass_note > -100) out += distort(sin((bass_phase*2*PI+sin(bass_phase*3*PI))*(abs(cos(bass_phase/2*PI))/2000+1)))/8

	sq = 0;
	for (i=0;i<1;i++) {
		phase_sq[i] += nfreq(notes_sq[floor(t/(2/H))&63])
		for (d=-15;d<=15;d++) {
			detune = (1+d/1000)
			sq += ((phase_sq[i]*detune+(i+1)*d*(i+1)*d)%1>duty_sweep(t+(i+1)*d*detune)?1/10:-1/10)/bass_env
		}
	}

	if (pat >= 8) out += sq/1.5

	cur_drum_seq = drum_seq[((t*H)|0)%drum_seq.length]
	cur_drum_chunk = drum_chunk[((t*H)|0)%drum_seq.length]
	perc = cur_drum_seq=="S"?snare((t%(1/H))+cur_drum_chunk*(1/H)):0	
	perc += cur_drum_seq=="K"?kick((t%(1/H))+cur_drum_chunk*(1/H)):0	
	perc += cur_drum_seq=="H"?hat((t%(1/H))+cur_drum_chunk*(1/H)):0	
	vol_perc = (cur_drum_chunk*(1/H)+(t%(1/H)))/(1/H)
	if (cur_drum_seq=="H") vol_perc = 1;

	final_out = lerp(perc/2,out,min(vol_perc/2,1))+out/8;
	echo_buffer[(t_buf)%echo_len] += (final_out-echo_buffer[(t_buf)%echo_len])/3;
	return echo_buffer[(t_buf++)%echo_len]*2+final_out
}