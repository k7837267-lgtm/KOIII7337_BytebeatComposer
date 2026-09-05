// He's an arpy boy by AArt1256 for Winter Chip XVII

b="4354",
a=`1${b[floor(t/15000)%b.length]}7`,
tt=t,
t*=1.+a[floor(t/300)%a.length],
f=(t&0xff)/exp((tt/500)%4), // fast arp

t=tt,
t*=1.+a[floor(t/1000)%a.length],
f+=(((t&0xff)/2)+(((t*1.01)&0xff)/2))*(tt>240000), // slow arp
f/=2,

t=tt,
t*=1+a[floor(t/1000)%a.length],
t*=1.5,
f+=(((t&0xff)/8)+(((t*1.01)&0xff)/8))*(tt>360000), // slow arp 2
f/=2,

t=tt,
t*=2.75,
f+=(((t&0xff)/8)+(((t*1.01)&0xff)/8))*(tt>120000), // bass
f/=2,

tt -= 15000,
f = tt>480000&&tt<490000?(f&0xff)/exp((tt-480000)/1200): // percusion
tt>490000&&tt<530000?(f&0xff)/exp((40000-(tt-490000))/1200):
f,
f+=(tt>490000)*( ( ((sin(tt*sin(tt)))+1)*128)/8) /(tt<510000?exp((tt/250)%2):exp((tt/500)%4))