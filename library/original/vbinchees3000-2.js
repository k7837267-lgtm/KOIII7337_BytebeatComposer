s="taumatawhakatangihangakoauauotamateaturipukakapikimaungahoronukupokaiwhenuakitanatahu",s=s.toUpperCase(),n={'A':7.04,'H':7.04,'O':7.04,'V':7.04,'3':7.04,'0':7.04,
'B':7.9,'I':7.9,'P':7.9,'W':7.9,'4':7.9,
'C':8.37,'J':8.37,'Q':8.37,'X':8.37,'5':8.37,
'D':9.4,'K':9.4,'R':9.4,'Y':9.4,'6':9.4,
'E':10.55,'L':10.55,'S':10.55,'Z':10.55,'7':10.55,
'F':11.18,'M':11.18,'T':11.18,'1':11.18,'8':11.18,
'G':12.54,'N':12.54,'U':12.54,'2':12.54,'9':12.54,' ':0},nl=2000,ci=floor(t/nl)%s.length,c=s[ci],bf=n[c]||0,
o=.5,bf=bf*o,ac=0,(c=='F'&&s[ci+1]=='B')?(ac=1.059):(c=='B'&&s[ci+1]=='F')&&(ac=.944),bf=bf*(ac||1),pos=t%nl,pc=s[ci-1]||'',E=1,(pc=='_'||pc=='-')?(E=min(pos,500)/500):(at=min(pos,100)/100,re=min(nl-pos,200)/200,E=min(at,re)),out=(t*bf)&255,out=out/128-1,out*=E,(o==1)&&(l=(t*(bf/2))&255,l=l/128-1,out=(out+l*.3)/1.3),out