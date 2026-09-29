samprate=48000,
t*=48000/samprate,
head=floor((t/5000)%64),
shead=floor((t/1250)%16),
 
sample="019020021>>>",

bass1=["-19===-07===-19===-07===-19===-07===-19===-07===",
       "-23===-11===-23===-11===-24===-12===-24===-12===",
       "-23===-11===-23===-11===-24===-12===-18>>>-06>>>"],

bass2=["===>>>000===>>>>>>000===>>>>>>000===>>>>>>000===",
       "===>>>-04===>>>>>>-04===>>>>>>-05===>>>>>>-05===",
       "===>>>-04===>>>>>>-04===>>>>>>-05===-11>>>001>>>"],

bass3=["===>>>005===>>>>>>005===>>>>>>005===>>>>>>005===",
       "===>>>001===>>>>>>001===>>>>>>000===>>>>>>000===",
       "===>>>001===>>>>>>001===>>>>>>000===-06>>>006>>>"],

mel1= ["005===>>>>>>012>>>>>>>>>011>>>===>>>012>>>>>>>>>",
       "005===>>>>>>FSP===>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",
       "013======012011===013===012===>>>>>>018>>>>>>>>>"],

pattern="1213",

getNote=(str,idx)=>{return str[idx*3]+str[idx*3+1]+str[idx*3+2]},getRNote=(str,idx)=>{
if ((getNote(str,idx)===">>>")) {
  return getNote(str,idx-1)
} else if((getNote(str,idx)==="<<<")&&(idx+1<=floor(str.length/3))) {
  return getNote(str,idx+1) 
} else if (getNote(str,idx)==="FSP") {
  return getNote(sample,shead)
} else {
  return getNote(str,idx)}
},
// BASSSSS
b=(t*2**((getRNote(bass1[pattern[0]-1]+
                 bass1[pattern[1]-1]+
                 bass1[pattern[2]-1]+
                 bass1[pattern[3]-1],head))/12)>>1)%128+
((t*2**(getRNote(bass2[pattern[0]-1]+
                 bass2[pattern[1]-1]+
                 bass2[pattern[2]-1]+
                 bass2[pattern[3]-1],head)/12))>>2)%64+
((t*2**(getRNote(bass3[pattern[0]-1]+
                 bass3[pattern[1]-1]+
                 bass3[pattern[2]-1]+
                 bass3[pattern[3]-1],head)/12))>>2)%64,

// MELODYYYYY
m=t*2**(getRNote(mel1[pattern[0]-1]+
                 mel1[pattern[1]-1]+
                 mel1[pattern[2]-1]+
                 mel1[pattern[3]-1],head)/12)/3>>0


,b/1.5+m%(256/3)