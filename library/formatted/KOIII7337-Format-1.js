/* In A BIT-ful Opportunity */
/* By KOIII7337 */
/* For #week33 Challenge */

BPM=t/26800*200/60, // BPM

R=(random()-.5)*50, // Random Using Variable.

a=t%32?A:A=R,
b=t%12?B:B=R,
c=t%2?C:C=R,
// Bitcrushes The Noise To Create 8-Bit Drums.

T=BPM*3%3%2-2, // Uses Variable T To All 3 lowercased Variable.

DRUMS=a*(T)/2*(((BPM*1.5|0)%3)>=1)+
b*(T)/2*(((BPM*1.5|0)%6)==0)*1.25+
c*(T)/2*(((BPM*1.5|0)%6)==3)*1.25, // Full Product On The Drums.

P=t=>((~t&64&~t>>1)-32)/1.5, // Functions A C Compatible Pulse Square.

BIT1=P(t/2*2**([7,11,9,12,4,7,3,6,7,11,9,12,15,11,9,6][BPM/2&15]/12))*(BPM%1-1)*1.5, // Channel 1

BIT2=P(t*2*2**([2,4,7,4,3,7,11,[9,14][BPM>>4&1]][BPM/2&7]/12))*(BPM%1-1)*(~BPM&1), // Channel 2

S=t=>(~t&64)-32, // Square With Function.

BIT3=S(t*2**((([,,14,14,12,12,9,9,12,12,12,14,14,,10,9,9,9,7,7,7,7,7,10,10,10,10,9,9,9,9,9,9,11,,12,12,,,14,14,12,12,9,9,12,12,12,14,14,,16,16,19,19,17,17,17,17,17,17,17,17,17,17,,,,,,17,17,17,17,,,,17,14,14,14,10,10,12,12,,9,9,7,7,5,5,2,2,2,2,2,2,5,5,5,5,4,4,4,,7,,,9,9,,,,12,12,10,10,12,12,14,14,,9,9,7,7,7,9,5,5,7,9,12,12,14,16,16,16,21,21,21,24,7][floor((BPM/1.5*2)%85.3333333333 /* HOW MUCH 3s??? */)+(BPM&63)]+2)/12))), // Channel 3

/* Final Product: */
BIT1+(BIT2*(BPM>>5&1))+BIT3/2.25*(BPM>>6&1)+DRUMS