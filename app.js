(()=>{"use strict";
const Q=new URLSearchParams(location.search);
const sid=(Q.get("id")||"").trim();
const group=(Q.get("group")||"").trim().toUpperCase();
const token=(Q.get("token")||"").trim();
const valid=sid&&["A","B","C"].includes(group)&&token;
const $=id=>document.getElementById(id);

const SAMPLE_N=61;

let task=0,stage=0,responses=[],stageStarted=0,finalized=false;
let marksA=[],marksL=[],marksG=[],marksT=[];
let stateA=null,stateL=null,stateG=null,stateT=null;

$("studyMeta").textContent=STUDY_CONFIG.studyName;
if(STUDY_CONFIG.requireAssignedLink&&!valid){
  $("invalid").hidden=false;
}else{
  $("consent").hidden=false;
  $("showId").textContent=sid;
  $("showGroup").textContent=group;
}

function sample(poly,n=SAMPLE_N){
  let lens=[],cum=[0],tot=0;
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);
    lens.push(l);tot+=l;cum.push(tot);
  }
  let pts=[],ss=[];
  for(let k=0;k<n;k++){
    const s=tot*k/n;let j=0;
    while(j<poly.length-1&&s>=cum[j+1])j++;
    const t=(s-cum[j])/lens[j],a=poly[j],b=poly[(j+1)%poly.length];
    pts.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);
    ss.push(k/n);
  }
  return [pts,ss];
}

function taskData(i){
  const p=STUDY_TASKS.polygons[i],r=STUDY_TASKS.refs[i],[pts,s0]=sample(p,SAMPLE_N),L=r[0],G=r[1];
  const dl=pts.map(q=>Math.hypot(q[0]-L[0],q[1]-L[1]));
  const dg=pts.map(q=>Math.hypot(q[0]-G[0],q[1]-G[1]));
  const d1=a=>a.slice(1).map((v,k)=>v-a[k]);
  const ad=a=>d1(a).map(Math.abs);

  // Correct journey coordinates:
  // raw samples: k/N
  // first changes: interval midpoints (k+1/2)/N
  // change-in-change: shared boundary between adjacent intervals (k+1)/N
  const x0=Array.from({length:SAMPLE_N},(_,k)=>k/SAMPLE_N);
  const x1=Array.from({length:SAMPLE_N-1},(_,k)=>(k+0.5)/SAMPLE_N);
  const x2=Array.from({length:SAMPLE_N-2},(_,k)=>(k+1)/SAMPLE_N);

  return {
    dl,dg,d1l:d1(dl),d1g:d1(dg),cl:ad(d1(dl)),cg:ad(d1(dg)),
    x0,x1,x2
  };
}

function cctx(id){
  const c=$(id),x=c.getContext("2d");
  x.clearRect(0,0,c.width,c.height);
  x.font="17px system-ui";x.strokeStyle="#111";x.fillStyle="#111";
  return [c,x];
}

function polyMetrics(poly){
  let lens=[],cum=[0],total=0;
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);
    lens.push(l);total+=l;cum.push(total);
  }
  return {lens,cum,total};
}

function drawPolygon(){
  const p=STUDY_TASKS.polygons[task],[c,x]=cctx("plotA");
  const xs=p.map(q=>q[0]),ys=p.map(q=>q[1]),mnx=Math.min(...xs),mxx=Math.max(...xs),mny=Math.min(...ys),mxy=Math.max(...ys);
  const X=v=>100+(v-mnx)/(mxx-mnx)*780,Y=v=>380-(v-mny)/(mxy-mny)*300;
  const cp=p.map(q=>[X(q[0]),Y(q[1])]);
  x.lineWidth=4;x.beginPath();cp.forEach((q,i)=>i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]));x.closePath();x.stroke();
  for(const q of cp){x.beginPath();x.arc(q[0],q[1],5,0,2*Math.PI);x.fill();}
  stateA={canvasPts:cp,metrics:polyMetrics(p)};
  drawMarkersA();
}

function drawGraph(id,values,xs,title,ch){
  const[c,x]=cctx(id),lo0=Math.min(...values),hi0=Math.max(...values),pad=Math.max((hi0-lo0)*.08,.02),lo=lo0-pad,hi=hi0+pad;
  const left=90,right=910,top=45,bottom=295;
  const X=s=>left+s*(right-left);
  const Y=v=>bottom-(v-lo)/(hi-lo)*(bottom-top);

  x.lineWidth=2;x.beginPath();x.moveTo(left-15,top-10);x.lineTo(left-15,bottom);x.lineTo(right+20,bottom);x.stroke();

  for(const f of [0,.25,.5,.75,1]){
    const xx=X(f);
    x.beginPath();x.moveTo(xx,bottom-5);x.lineTo(xx,bottom+5);x.stroke();
    x.fillText(f.toFixed(2),xx-18,330);
  }

  x.beginPath();
  values.forEach((q,i)=>{
    const xx=X(xs[i]),yy=Y(q);
    if(i)x.lineTo(xx,yy);else x.moveTo(xx,yy);
  });
  x.stroke();

  x.fillText(title,760,30);
  x.fillText("normalized journey position s",365,350);

  const st={left,right,top,bottom};
  if(ch==="L")stateL=st;else stateG=st;
  drawChannelMarkers(ch);
}

function drawTransitionStrip(){
  const[c,x]=cctx("transitionStrip");
  const left=90,right=910,y=70;
  x.lineWidth=2;x.beginPath();x.moveTo(left,y);x.lineTo(right,y);x.stroke();
  for(const f of [0,.25,.5,.75,1]){
    const xx=left+f*(right-left);
    x.beginPath();x.moveTo(xx,y-8);x.lineTo(xx,y+8);x.stroke();
    x.fillText(f.toFixed(2),xx-18,110);
  }
  x.fillText("normalized journey position s",365,138);
  stateT={left,right,top:40,bottom:100};
  drawTransitionMarkers();
}

function nearestSeg(px,py,ax,ay,bx,by){
  const vx=bx-ax,vy=by-ay,wx=px-ax,wy=py-ay,den=vx*vx+vy*vy;
  let t=den?((wx*vx+wy*vy)/den):0;t=Math.max(0,Math.min(1,t));
  const qx=ax+t*vx,qy=ay+t*vy;
  return {t,qx,qy,d2:(px-qx)**2+(py-qy)**2};
}

function polyClick(px,py){
  const cp=stateA.canvasPts,pm=stateA.metrics;let best=null;
  for(let i=0;i<cp.length;i++){
    const a=cp[i],b=cp[(i+1)%cp.length],q=nearestSeg(px,py,a[0],a[1],b[0],b[1]);
    if(!best||q.d2<best.d2)best={...q,edge:i};
  }
  const s=(pm.cum[best.edge]+best.t*pm.lens[best.edge])/pm.total;
  return {s:s>=1?0:s,px:best.qx,py:best.qy,rawX:px,rawY:py};
}

function graphClick(px,py,st){
  if(px<st.left||px>st.right||py<st.top-20||py>st.bottom+20)return null;
  return {s:Math.max(0,Math.min(1,(px-st.left)/(st.right-st.left))),rawX:px,rawY:py};
}

function coords(evt,id){
  const c=$(id),r=c.getBoundingClientRect();
  return [(evt.clientX-r.left)*(c.width/r.width),(evt.clientY-r.top)*(c.height/r.height)];
}

function drawMarkersA(){
  const x=$("plotA").getContext("2d");x.save();x.font="bold 17px system-ui";
  marksA.forEach((m,i)=>{
    x.fillStyle="#1f5fbf";x.beginPath();x.arc(m.px,m.py,9,0,2*Math.PI);x.fill();
    x.fillStyle="#fff";x.textAlign="center";x.textBaseline="middle";x.fillText(String(i+1),m.px,m.py+1);
  });
  x.restore();summaries();
}

function drawChannelMarkers(ch){
  const st=ch==="L"?stateL:stateG,arr=ch==="L"?marksL:marksG,id=ch==="L"?"plotL":"plotG";
  if(!st)return;const x=$(id).getContext("2d");x.save();x.font="bold 17px system-ui";
  arr.forEach((m,i)=>{
    const px=st.left+m.s*(st.right-st.left);
    x.strokeStyle="#1f5fbf";x.setLineDash([7,6]);
    x.beginPath();x.moveTo(px,st.top);x.lineTo(px,st.bottom);x.stroke();
    x.setLineDash([]);x.fillStyle="#1f5fbf";x.fillText(String(i+1),px+5,st.top+20);
  });
  x.restore();summaries();
}

function drawTransitionMarkers(){
  if(!stateT)return;const x=$("transitionStrip").getContext("2d");x.save();x.font="bold 17px system-ui";
  marksT.forEach((m,i)=>{
    const px=stateT.left+m.s*(stateT.right-stateT.left);
    x.strokeStyle="#1f5fbf";x.lineWidth=3;
    x.beginPath();x.moveTo(px,48);x.lineTo(px,92);x.stroke();
    x.fillStyle="#1f5fbf";x.fillText("T"+(i+1),px+5,45);
  });
  x.restore();summaries();
}

function summaries(){
  $("countA").textContent=marksA.length;$("selectedA").textContent=marksA.length?marksA.map(m=>m.s.toFixed(3)).join(", "):"None";
  $("countL").textContent=marksL.length;$("selectedL").textContent=marksL.length?marksL.map(m=>m.s.toFixed(3)).join(", "):"None";
  $("countG").textContent=marksG.length;$("selectedG").textContent=marksG.length?marksG.map(m=>m.s.toFixed(3)).join(", "):"None";
  $("countT").textContent=marksT.length;$("selectedT").textContent=marksT.length?marksT.map(m=>m.s.toFixed(3)).join(", "):"None";
}

function addClick(id,kind){
  $(id).addEventListener("click",evt=>{
    if($("insufficient").checked)return;
    const [px,py]=coords(evt,id);
    if(kind==="A"){
      const m=polyClick(px,py),near=marksA.findIndex(q=>Math.abs(q.s-m.s)<.018);
      if(near>=0)marksA.splice(near,1);else if(marksA.length<STUDY_CONFIG.maxDistinctTransitions)marksA.push(m);
      marksA.sort((a,b)=>a.s-b.s);renderStimuliOnly();
    }else if(kind==="L"||kind==="G"){
      const arr=kind==="L"?marksL:marksG,st=kind==="L"?stateL:stateG,m=graphClick(px,py,st);if(!m)return;
      const near=arr.findIndex(q=>Math.abs(q.s-m.s)<.018);
      if(near>=0)arr.splice(near,1);else if(arr.length<STUDY_CONFIG.maxMarksPerChannel)arr.push(m);
      arr.sort((a,b)=>a.s-b.s);renderStimuliOnly();
    }else{
      const m=graphClick(px,py,stateT);if(!m)return;
      const near=marksT.findIndex(q=>Math.abs(q.s-m.s)<.018);
      if(near>=0)marksT.splice(near,1);else if(marksT.length<STUDY_CONFIG.maxDistinctTransitions)marksT.push(m);
      marksT.sort((a,b)=>a.s-b.s);renderStimuliOnly();
    }
  });
}
addClick("plotA","A");addClick("plotL","L");addClick("plotG","G");addClick("transitionStrip","T");

$("undoA").onclick=()=>{marksA.pop();renderStimuliOnly();};$("clearA").onclick=()=>{marksA=[];renderStimuliOnly();};
$("undoL").onclick=()=>{marksL.pop();renderStimuliOnly();};$("clearL").onclick=()=>{marksL=[];renderStimuliOnly();};
$("undoG").onclick=()=>{marksG.pop();renderStimuliOnly();};$("clearG").onclick=()=>{marksG=[];renderStimuliOnly();};
$("undoT").onclick=()=>{marksT.pop();renderStimuliOnly();};$("clearT").onclick=()=>{marksT=[];renderStimuliOnly();};

$("insufficient").addEventListener("change",()=>{
  if($("insufficient").checked){marksA=[];marksL=[];marksG=[];marksT=[];renderStimuliOnly();}
});

function evidenceChoices(){
  if(group==="A")return[
    ["VISIBLE_CHANGE","Visible change where two straight segments meet"],
    ["OVERALL_SHAPE","Overall shape structure"],
    ["VISIBLE_JUNCTIONS","Number of visible junctions"],
    ["COMBINATION","Combination of these"],
    ["INSUFFICIENT","Insufficient evidence"]
  ];
  if(group==="B"||(group==="C"&&stage===0))return[
    ["L_ONLY","Mainly L-channel pattern"],
    ["G_ONLY","Mainly G-channel pattern"],
    ["BOTH_CHANNELS","Both L and G channels"],
    ["OVERALL_PAIR","Overall relationship between both channels"],
    ["INSUFFICIENT","Insufficient evidence"]
  ];
  if(group==="C"&&stage===1)return[
    ["L_FIRST","Mainly L first-change pattern"],
    ["G_FIRST","Mainly G first-change pattern"],
    ["BOTH_FIRST","Both first-change patterns"],
    ["OVERALL_FIRST","Overall comparison of both first-change graphs"],
    ["INSUFFICIENT","Insufficient evidence"]
  ];
  return[
    ["L_CHANGE","Mainly L change-in-change pattern"],
    ["G_CHANGE","Mainly G change-in-change pattern"],
    ["BOTH_CHANGE","Both change-in-change patterns"],
    ["ALL_REP","Combination of representations"],
    ["INSUFFICIENT","Insufficient evidence"]
  ];
}

function renderEvidence(){
  const box=$("evidenceOptions");box.innerHTML="";
  evidenceChoices().forEach(([v,l])=>{
    const el=document.createElement("label");
    el.innerHTML=`<input type="radio" name="evidence" value="${v}"> ${l}`;
    box.appendChild(el);
  });
}

function renderStageExtra(){
  $("stageExtra").innerHTML="";
  if(group==="C"&&stage===2){
    $("stageExtra").innerHTML=`<fieldset><legend>Which representation was most useful for deciding the distinct boundary transitions?</legend>
      <div class="radioList">
        <label><input type="radio" name="mostUseful" value="Raw distances">Raw distance histories</label>
        <label><input type="radio" name="mostUseful" value="First changes">First-change histories</label>
        <label><input type="radio" name="mostUseful" value="Change-in-change">Change-in-change histories</label>
        <label><input type="radio" name="mostUseful" value="Combination">Combination of representations</label>
        <label><input type="radio" name="mostUseful" value="None sufficient">None provided sufficient evidence</label>
      </div></fieldset>`;
  }
}

function series(){
  const d=taskData(task);
  if(group==="B"||(group==="C"&&stage===0))
    return{L:d.dl,G:d.dg,xL:d.x0,xG:d.x0,tL:"D_L(s)",tG:"D_G(s)",dL:"Distance history from reference L",dG:"Distance history from reference G"};
  if(group==="C"&&stage===1)
    return{L:d.d1l,G:d.d1g,xL:d.x1,xG:d.x1,tL:"dD_L",tG:"dD_G",dL:"First changes in L-distance",dG:"First changes in G-distance"};
  return{L:d.cl,G:d.cg,xL:d.x2,xG:d.x2,tL:"C_L",tG:"C_G",dL:"Change-in-change for L",dG:"Change-in-change for G"};
}

function render(){
  marksA=[];marksL=[];marksG=[];marksT=[];
  $("insufficient").checked=false;
  renderEvidence();renderStageExtra();renderStimuliOnly();stageStarted=performance.now();
}

function renderStimuliOnly(){
  const total=group==="C"?18:6,current=group==="C"?task*3+stage+1:task+1;
  $("progress").textContent=`Screen ${current} of ${total}`;

  if(group==="A"){
    $("singleStimulus").hidden=false;$("dualStimulus").hidden=true;
    $("heading").textContent=`Task A${task+1}`;
    $("instruction").textContent="Inspect the visible closed boundary and mark the distinct boundary transitions.";
    drawPolygon();
  }else{
    $("singleStimulus").hidden=true;$("dualStimulus").hidden=false;
    const nm=group==="B"?"Raw distance histories":["Raw distance histories","First changes","Change in the changes"][stage];
    $("heading").textContent=group==="B"?`Task B${task+1}`:`Task C${task+1} — Stage ${stage+1}: ${nm}`;
    $("instruction").textContent="First mark channel-specific evidence, then infer the distinct boundary transitions from the combined evidence.";
    const s=series();
    $("titleL").textContent=s.tL;$("titleG").textContent=s.tG;
    $("descL").textContent=s.dL;$("descG").textContent=s.dG;
    drawGraph("plotL",s.L,s.xL,s.tL,"L");
    drawGraph("plotG",s.G,s.xG,s.tG,"G");
    drawTransitionStrip();
  }
  summaries();
}

function checked(n){return document.querySelector(`input[name="${n}"]:checked`)?.value||"";}

function reset(){
  $("nseg").value="";
  document.querySelectorAll('input[name="confidence"],input[name="evidence"],input[name="mostUseful"]').forEach(x=>x.checked=false);
  $("status").textContent="";
  marksA=[];marksL=[];marksG=[];marksT=[];
}

function validate(){
  const ins=$("insufficient").checked;
  const segRaw=$("nseg").value.trim();
  const segNum=Number(segRaw);

  if(!segRaw||!checked("confidence")||!checked("evidence")){
    $("status").className="status warn";
    $("status").textContent="Please complete segment count, confidence, and evidence choice.";
    return false;
  }

  if(!ins&&(!Number.isInteger(segNum)||segNum<1)){
    $("status").className="status warn";
    $("status").textContent="Please enter a positive whole number of straight boundary segments (1 or more). If the displayed information is not sufficient to make this judgment, select Insufficient evidence.";
    return false;
  }

  if(group==="A"&&!ins&&marksA.length===0){
    $("status").className="status warn";$("status").textContent="Please mark at least one distinct transition, or select insufficient evidence.";return false;
  }
  if(group!=="A"&&!ins&&(marksL.length===0&&marksG.length===0)){
    $("status").className="status warn";$("status").textContent="Please mark evidence on at least one channel, or select insufficient evidence.";return false;
  }
  if(group!=="A"&&!ins&&marksT.length===0){
    $("status").className="status warn";$("status").textContent="Please mark the distinct inferred transitions on the transition strip.";return false;
  }
  if(group==="C"&&stage===2&&!checked("mostUseful")){
    $("status").className="status warn";$("status").textContent="Please select the most useful representation.";return false;
  }
  return true;
}

async function send(r){
  if(!STUDY_CONFIG.submitEndpoint)return;
  try{
    await fetch(STUDY_CONFIG.submitEndpoint,{
      method:"POST",mode:"no-cors",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify(r)
    });
  }catch(e){}
}

$("startBtn").onclick=()=>{
  if(!$("ready").checked)return alert("Please confirm that you are ready.");
  $("consent").hidden=true;$("study").hidden=false;render();
};

$("nextBtn").onclick=async()=>{
  if(finalized||!validate())return;
  $("nextBtn").disabled=true;

  const r={
    study_id:sid,group,token,task:task+1,stage:group==="C"?stage+1:1,
    marked_count_A:marksA.length,
    marked_s_A:marksA.map(m=>m.s.toFixed(5)).join(","),
    raw_clicks_A:marksA.map(m=>`${Math.round(m.rawX)}:${Math.round(m.rawY)}`).join("|"),
    marked_count_L:marksL.length,
    marked_s_L:marksL.map(m=>m.s.toFixed(5)).join(","),
    raw_clicks_L:marksL.map(m=>`${Math.round(m.rawX)}:${Math.round(m.rawY)}`).join("|"),
    marked_count_G:marksG.length,
    marked_s_G:marksG.map(m=>m.s.toFixed(5)).join(","),
    raw_clicks_G:marksG.map(m=>`${Math.round(m.rawX)}:${Math.round(m.rawY)}`).join("|"),
    inferred_transition_count:group==="A"?marksA.length:marksT.length,
    inferred_transition_s:group==="A"?marksA.map(m=>m.s.toFixed(5)).join(","):marksT.map(m=>m.s.toFixed(5)).join(","),
    inferred_transition_raw_clicks:group==="A"?"":marksT.map(m=>`${Math.round(m.rawX)}:${Math.round(m.rawY)}`).join("|"),
    predicted_segments:Number($("nseg").value),
    confidence:Number(checked("confidence")),
    evidence_code:checked("evidence"),
    insufficient_evidence:$("insufficient").checked,
    most_useful:checked("mostUseful"),
    stage_duration_ms:Math.round(performance.now()-stageStarted),
    submitted_at:new Date().toISOString(),
    user_agent:navigator.userAgent
  };

  responses.push(r);
  localStorage.setItem("study_"+token,JSON.stringify(responses));
  await send(r);
  reset();

  if(group==="C"&&stage<2){
    stage++;render();$("nextBtn").disabled=false;return;
  }
  stage=0;task++;
  if(task<6){
    render();$("nextBtn").disabled=false;return;
  }

  finalized=true;
  $("study").hidden=true;$("done").hidden=false;
  $("serverStatus").textContent="Responses were submitted during the study. Keep the CSV backup until receipt is confirmed.";
  $("nextBtn").disabled=false;
};

$("csvBtn").onclick=()=>{
  const rows=responses,keys=Object.keys(rows[0]||{}),esc=v=>`"${String(v??"").replaceAll('"','""')}"`;
  const csv=[keys.join(","),...rows.map(r=>keys.map(k=>esc(r[k])).join(","))].join("\n"),a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download=`${sid}_${group}_responses.csv`;
  a.click();
};

window.addEventListener("beforeunload",e=>{
  if(!finalized&&responses.length){e.preventDefault();e.returnValue="";}
});
})();
