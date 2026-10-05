// Liver Chase

t/=5,

c=523.25, // C note

cs=554.36, // C# note

e=659.26, // E note

g=784, // G note

L=(((((((((t*[cs,e,cs,g,cs,e,cs,c][(t>>14)%8]/(t&2<<16?440:220)*(3-(1&t>>9))>>(3&t>>8)|t>>([5,4,4,4,4,4,4,3,4,4,4,3,4,4,4,4,5,4,4,4,4,4,4,3,5,4,4,4,5,4,4,4][(t>>12)%32]))&127)+ // main melody

(3E5/(t&4095)&128-64)+ // kick (almost not hearable)

(random()*(((-t>>([6,5,4,5,5,5,4,5][(t>>12)%8]))%64)+64)))/2+ // snare (also almost not hearable)

((t/4*[cs,e,cs,g,cs,e,cs,c][(t>>14)%8]/(t&2<<16?440:220))&64)+ // square wave

(((t/440*[cs,e,cs,g,cs,e,cs,c][(t>>14)%8]%63)+(t/440*[cs,e,cs,g,cs,e,cs,c][(t>>14)%8]%64))/2))/2)+ // phaser(?)

((((sin(19*cbrt((t)%4096))+4*128))|t>>5)&63))+ // kick 2 (also almost not hearable)

(random()*[32,0][(t>>9)%2]))/2+ // snare

(tan(sin(4e3/(t&4095)))*31+60))/2)+ // kick 3

(((t/4*[cs,e,cs,g,cs,e,cs,c][(t>>14)%8]/(t&2<<16?440:220)*(3-(1&t>>9))>>(3&t>>8))|t>>[6,7][(t>>12)%2])&31) // you can hear this

+(abs(sin(t*[cs,e,cs,g,cs,e,cs,c][(t>>14)%8]/(t&2<<16?440:220)*(3-(1&t>>9))/120))*32+32) // bass(?)
,

R=(((((((((t*[cs,e,cs,g,cs,e,cs,c][(t>>14)%8]/(t&2<<16?440:220)*(3-(1&t>>9))>>(3&t>>8)|t>>([5,4,4,4,4,4,4,3,4,4,4,3,4,4,4,4,5,4,4,4,4,4,4,3,5,4,4,4,5,4,4,4][(t>>12)%32]))&127)+ // main melody

(3E5/(t&4095)&128-64)+ // kick (almost not hearable)

(random()*(((-t>>([6,5,4,5,5,5,4,5][(t>>12)%8]))%64)+64)))/2+ // snare (also almost not hearable)

((t/4*[cs,e,cs,g,cs,e,cs,c][(t>>14)%8]/(t&2<<16?440:220))&64)+ // square wave

(((t/440*[cs,e,cs,g,cs,e,cs,c][(t>>14)%8]%63)+(t/440*[cs,e,cs,g,cs,e,cs,c][(t>>14)%8]%64))/2))/2)+ // phaser(?)

((((sin(19*cbrt((t)%4096))+4*128))|t>>5)&63))+ // kick 2 (also almost not hearable)

(random()*[32,0][(t>>9)%2]))/2+ // snare

(tan(sin(4e3/(t&4095)))*31+60))/2)+ // kick 3

(((t/4*[cs,e,cs,g,cs,e,cs,c][(t>>14)%8]/(t&2<<16?440:220)*(3-(1&t>>9))>>(3&t>>8))|t>>[6,7][(t>>12)%2])&31) // you can hear this

+(abs(sin(t*[cs,e,cs,g,cs,e,cs,c][(t>>14)%8]/(t&2<<16?440:220)*(3-(1&t>>9))/120))*32+32) // bass(?)
,

[L,R] // stereo